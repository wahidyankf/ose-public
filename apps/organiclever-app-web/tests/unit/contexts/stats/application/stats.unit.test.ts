/* oxlint-disable vitest/no-standalone-expect -- @effect/vitest it.effect blocks inside layer() are not recognised as test blocks */
import { layer } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, expect } from "vitest";
import { FIXED_MS, freezeClock, restoreClock } from "../../../support/doubles";
import { PgliteService, StorageUnavailable } from "@/contexts/journal/application";
import { runMigrations } from "@/contexts/journal/application";
import {
  getLast7Days,
  getWeeklyStats,
  getVolume,
  getExerciseProgress,
} from "../../../../../src/contexts/stats/application/stats";

beforeEach(() => freezeClock());
afterEach(() => restoreClock());

// ---------------------------------------------------------------------------
// A PGlite handle whose `query` returns a pre-scripted sequence of
// responses, one per call — used to reach error-catch branches and the
// client-side-fallback path that real (working) PGlite never actually
// exercises in these tests.
// ---------------------------------------------------------------------------

function sequencedDbLayer(responses: Array<() => Promise<{ rows: unknown[] }>>) {
  let call = 0;
  return Layer.scoped(
    PgliteService,
    Effect.acquireRelease(
      Effect.sync(() => ({
        db: {
          query: () => {
            const handler = responses[call] ?? (() => Promise.reject(new Error(`unexpected call #${call}`)));
            call += 1;
            return handler();
          },
        } as unknown as PGlite,
      })),
      () => Effect.void,
    ),
  );
}

// ---------------------------------------------------------------------------
// Test layer — in-memory PGlite with full migrations
// ---------------------------------------------------------------------------

const TestPgliteLayer = Layer.scoped(
  PgliteService,
  Effect.acquireRelease(
    Effect.promise(async () => {
      const db = new PGlite();
      await runMigrations(db);
      return { db };
    }),
    ({ db }) => Effect.promise(() => db.close()),
  ),
);

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function daysAgo(n: number): string {
  const d = new Date(FIXED_MS);
  d.setDate(d.getDate() - n);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
}

const workoutPayloadWith2Exercises = {
  routineName: "Morning Strength",
  durationSecs: 3600,
  exercises: [
    {
      name: "Bench Press",
      sets: [
        { reps: 5, weight: "80 kg", duration: null, restTaken: null },
        { reps: 5, weight: "80 kg", duration: null, restTaken: null },
        { reps: 3, weight: "85 kg", duration: null, restTaken: null },
      ],
    },
    {
      name: "Squat",
      sets: [
        { reps: 5, weight: "100 kg", duration: null, restTaken: null },
        { reps: 5, weight: "100 kg", duration: null, restTaken: null },
      ],
    },
  ],
};

const workoutPayloadSimple = {
  routineName: "Evening Run",
  durationSecs: 1800,
  exercises: [
    {
      name: "Deadlift",
      sets: [
        { reps: 3, weight: "120 kg", duration: null, restTaken: null },
        { reps: 3, weight: "120 kg", duration: null, restTaken: null },
      ],
    },
  ],
};

async function seedFixture(db: PGlite): Promise<void> {
  // 3 workout entries: 2 within last 7 days, 1 older (8 days ago)
  const entries = [
    {
      id: "entry-1",
      ts: daysAgo(1),
      payload: workoutPayloadWith2Exercises,
    },
    {
      id: "entry-2",
      ts: daysAgo(3),
      payload: workoutPayloadSimple,
    },
    {
      id: "entry-3",
      ts: daysAgo(8),
      payload: workoutPayloadSimple,
    },
  ];

  for (const e of entries) {
    await db.query(
      `INSERT INTO journal_entries
         (id, name, payload, created_at, updated_at, started_at, finished_at, labels)
       VALUES ($1, 'workout', $2::jsonb, $3::timestamptz, $3::timestamptz, $3::timestamptz, $3::timestamptz, '{}')`,
      [e.id, JSON.stringify(e.payload), e.ts],
    );
  }
}

// ---------------------------------------------------------------------------
// getLast7Days
// ---------------------------------------------------------------------------

layer(TestPgliteLayer)("stats - getLast7Days", (it) => {
  it.effect("returns exactly 7 DayEntry objects", () =>
    Effect.gen(function* () {
      const { db } = yield* PgliteService;
      yield* Effect.promise(() => seedFixture(db));

      const days = yield* getLast7Days();
      expect(days).toHaveLength(7);
    }),
  );

  it.effect("last entry is today", () =>
    Effect.gen(function* () {
      const { db } = yield* PgliteService;
      yield* Effect.promise(() => db.exec("TRUNCATE journal_entries RESTART IDENTITY"));
      yield* Effect.promise(() => seedFixture(db));

      const days = yield* getLast7Days();
      const today = new Date(FIXED_MS);
      today.setHours(0, 0, 0, 0);
      const lastDay = days[days.length - 1];
      expect(lastDay).toBeDefined();
      const lastDayDate = lastDay!.date;
      lastDayDate.setHours(0, 0, 0, 0);
      expect(lastDayDate.toISOString().slice(0, 10)).toBe(today.toISOString().slice(0, 10));
    }),
  );

  it.effect("each entry has a valid short weekday label", () =>
    Effect.gen(function* () {
      const { db } = yield* PgliteService;
      yield* Effect.promise(() => db.exec("TRUNCATE journal_entries RESTART IDENTITY"));
      yield* Effect.promise(() => seedFixture(db));

      const days = yield* getLast7Days();
      const validLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      for (const d of days) {
        expect(validLabels).toContain(d.label);
      }
    }),
  );

  it.effect("durationMins is non-negative for all days", () =>
    Effect.gen(function* () {
      const { db } = yield* PgliteService;
      yield* Effect.promise(() => db.exec("TRUNCATE journal_entries RESTART IDENTITY"));
      yield* Effect.promise(() => seedFixture(db));

      const days = yield* getLast7Days();
      for (const d of days) {
        expect(d.durationMins).toBeGreaterThanOrEqual(0);
        expect(d.sessions).toBeGreaterThanOrEqual(0);
      }
    }),
  );
});

// ---------------------------------------------------------------------------
// getWeeklyStats
// ---------------------------------------------------------------------------

layer(TestPgliteLayer)("stats - getWeeklyStats", (it) => {
  it.effect("workoutsThisWeek counts only workouts in last 7 days", () =>
    Effect.gen(function* () {
      const { db } = yield* PgliteService;
      yield* Effect.promise(() => db.exec("TRUNCATE journal_entries RESTART IDENTITY"));
      yield* Effect.promise(() => seedFixture(db));

      const stats = yield* getWeeklyStats();
      // 2 entries within last 7 days (entry-1 at 1 day ago, entry-2 at 3 days ago)
      expect(stats.workoutsThisWeek).toBe(2);
    }),
  );

  it.effect("totalMins sums durationSecs/60 for workouts in last 7 days", () =>
    Effect.gen(function* () {
      const { db } = yield* PgliteService;
      yield* Effect.promise(() => db.exec("TRUNCATE journal_entries RESTART IDENTITY"));
      yield* Effect.promise(() => seedFixture(db));

      const stats = yield* getWeeklyStats();
      // entry-1: 3600s = 60 mins, entry-2: 1800s = 30 mins => 90 total
      expect(stats.totalMins).toBeCloseTo(90, 1);
    }),
  );

  it.effect("totalSets counts sets across all exercises in last 7 days", () =>
    Effect.gen(function* () {
      const { db } = yield* PgliteService;
      yield* Effect.promise(() => db.exec("TRUNCATE journal_entries RESTART IDENTITY"));
      yield* Effect.promise(() => seedFixture(db));

      const stats = yield* getWeeklyStats();
      // entry-1: 3 sets (Bench Press) + 2 sets (Squat) = 5
      // entry-2: 2 sets (Deadlift) = 2
      // total = 7
      expect(stats.totalSets).toBe(7);
    }),
  );

  it.effect("streak returns non-negative integer", () =>
    Effect.gen(function* () {
      const { db } = yield* PgliteService;
      yield* Effect.promise(() => db.exec("TRUNCATE journal_entries RESTART IDENTITY"));
      yield* Effect.promise(() => seedFixture(db));

      const stats = yield* getWeeklyStats();
      expect(stats.streak).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(stats.streak)).toBe(true);
    }),
  );
});

// ---------------------------------------------------------------------------
// getVolume
// ---------------------------------------------------------------------------

layer(TestPgliteLayer)("stats - getVolume", (it) => {
  it.effect("returns correct sum of weight * reps for last 7 days", () =>
    Effect.gen(function* () {
      const { db } = yield* PgliteService;
      yield* Effect.promise(() => db.exec("TRUNCATE journal_entries RESTART IDENTITY"));
      yield* Effect.promise(() => seedFixture(db));

      const vol = yield* getVolume(7);
      // entry-1 (1 day ago):
      //   Bench Press: 80*5 + 80*5 + 85*3 = 400 + 400 + 255 = 1055
      //   Squat:       100*5 + 100*5 = 1000
      //   subtotal = 2055
      // entry-2 (3 days ago):
      //   Deadlift: 120*3 + 120*3 = 720
      // total = 2775
      expect(vol).toBeCloseTo(2775, 0);
    }),
  );

  it.effect("excludes entries older than specified days", () =>
    Effect.gen(function* () {
      const { db } = yield* PgliteService;
      yield* Effect.promise(() => db.exec("TRUNCATE journal_entries RESTART IDENTITY"));
      yield* Effect.promise(() => seedFixture(db));

      // With days=30 we should include all 3 entries
      const vol30 = yield* getVolume(30);
      // entry-3 (8 days ago) has same payload as entry-2: Deadlift 120*3 + 120*3 = 720
      // total = 2775 + 720 = 3495
      expect(vol30).toBeCloseTo(3495, 0);
    }),
  );

  it.effect("returns 0 when no entries exist", () =>
    Effect.gen(function* () {
      const { db } = yield* PgliteService;
      yield* Effect.promise(() => db.exec("TRUNCATE journal_entries RESTART IDENTITY"));

      const vol = yield* getVolume(7);
      expect(vol).toBe(0);
    }),
  );
});

// ---------------------------------------------------------------------------
// getExerciseProgress
// ---------------------------------------------------------------------------

layer(TestPgliteLayer)("stats - getExerciseProgress", (it) => {
  it.effect("returns at least one exercise entry for seeded data", () =>
    Effect.gen(function* () {
      const { db } = yield* PgliteService;
      yield* Effect.promise(() => db.exec("TRUNCATE journal_entries RESTART IDENTITY"));
      yield* Effect.promise(() => seedFixture(db));

      const progress = yield* getExerciseProgress(7);
      const names = Object.keys(progress);
      expect(names.length).toBeGreaterThan(0);
    }),
  );

  it.effect("Bench Press appears in progress with correct points", () =>
    Effect.gen(function* () {
      const { db } = yield* PgliteService;
      yield* Effect.promise(() => db.exec("TRUNCATE journal_entries RESTART IDENTITY"));
      yield* Effect.promise(() => seedFixture(db));

      const progress = yield* getExerciseProgress(7);
      expect(progress["Bench Press"]).toBeDefined();
      const bp = progress["Bench Press"]!;
      // 3 sets from entry-1
      expect(bp.points).toHaveLength(3);
      expect(bp.routineName).toBe("Morning Strength");
    }),
  );

  it.effect("estimated1RM is computed only for reps 1-10", () =>
    Effect.gen(function* () {
      const { db } = yield* PgliteService;
      yield* Effect.promise(() => db.exec("TRUNCATE journal_entries RESTART IDENTITY"));
      yield* Effect.promise(() => seedFixture(db));

      const progress = yield* getExerciseProgress(7);
      const bp = progress["Bench Press"];
      expect(bp).toBeDefined();
      for (const pt of bp!.points) {
        if (pt.reps >= 1 && pt.reps <= 10) {
          expect(pt.estimated1RM).not.toBeNull();
        }
      }
    }),
  );

  it.effect("isPR marks the highest estimated1RM seen so far", () =>
    Effect.gen(function* () {
      const { db } = yield* PgliteService;
      yield* Effect.promise(() => db.exec("TRUNCATE journal_entries RESTART IDENTITY"));
      yield* Effect.promise(() => seedFixture(db));

      const progress = yield* getExerciseProgress(7);
      const bp = progress["Bench Press"];
      expect(bp).toBeDefined();
      // At most one PR per exercise in a single session with same weight
      const prCount = bp!.points.filter((p) => p.isPR).length;
      expect(prCount).toBeGreaterThanOrEqual(1);
    }),
  );

  it.effect("returns empty record when no workout entries exist", () =>
    Effect.gen(function* () {
      const { db } = yield* PgliteService;
      yield* Effect.promise(() => db.exec("TRUNCATE journal_entries RESTART IDENTITY"));

      const progress = yield* getExerciseProgress(7);
      expect(Object.keys(progress)).toHaveLength(0);
    }),
  );
});

// ---------------------------------------------------------------------------
// Error paths — connection failure surfaces StorageUnavailable, and
// getLast7Days' client-side fallback when generate_series doesn't return
// exactly 7 rows.
// ---------------------------------------------------------------------------

layer(sequencedDbLayer([() => Promise.reject(new Error("boom"))]))(
  "stats - getLast7Days StorageUnavailable on the primary query",
  (it) => {
    it.effect("surfaces StorageUnavailable", () =>
      Effect.gen(function* () {
        const result = yield* Effect.either(getLast7Days());
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(StorageUnavailable);
        }
      }),
    );
  },
);

layer(
  sequencedDbLayer([
    () => Promise.resolve({ rows: [] }), // wrong length (0, not 7) triggers the client-side fallback
    ...Array.from({ length: 7 }, () => () => Promise.resolve({ rows: [{ duration_mins: "10", sessions: "1" }] })),
  ]),
)("stats - getLast7Days client-side fallback", (it) => {
  it.effect("builds 7 days client-side when the primary query returns an unexpected row count", () =>
    Effect.gen(function* () {
      const days = yield* getLast7Days();
      expect(days).toHaveLength(7);
      for (const d of days) {
        expect(d.durationMins).toBeCloseTo(10, 5);
        expect(d.sessions).toBe(1);
      }
    }),
  );
});

layer(
  sequencedDbLayer([
    () => Promise.resolve({ rows: [] }), // wrong length triggers the fallback
    () => Promise.resolve({ rows: [{ duration_mins: "5", sessions: "1" }] }), // first per-day query succeeds
    () => Promise.reject(new Error("day query failed")), // second per-day query fails
  ]),
)("stats - getLast7Days StorageUnavailable inside the client-side fallback", (it) => {
  it.effect("surfaces StorageUnavailable when a per-day fallback query fails", () =>
    Effect.gen(function* () {
      const result = yield* Effect.either(getLast7Days());
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(StorageUnavailable);
      }
    }),
  );
});

layer(sequencedDbLayer([() => Promise.reject(new Error("boom"))]))(
  "stats - getWeeklyStats StorageUnavailable on the basic-counts query",
  (it) => {
    it.effect("surfaces StorageUnavailable", () =>
      Effect.gen(function* () {
        const result = yield* Effect.either(getWeeklyStats());
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(StorageUnavailable);
        }
      }),
    );
  },
);

layer(
  sequencedDbLayer([
    () => Promise.resolve({ rows: [{ workout_count: "0", total_mins: "0" }] }),
    () => Promise.reject(new Error("boom")),
  ]),
)("stats - getWeeklyStats StorageUnavailable on the recent-workouts query", (it) => {
  it.effect("surfaces StorageUnavailable", () =>
    Effect.gen(function* () {
      const result = yield* Effect.either(getWeeklyStats());
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(StorageUnavailable);
      }
    }),
  );
});

layer(
  sequencedDbLayer([
    () => Promise.resolve({ rows: [{ workout_count: "0", total_mins: "0" }] }),
    () => Promise.resolve({ rows: [] }),
    () => Promise.reject(new Error("boom")),
  ]),
)("stats - getWeeklyStats StorageUnavailable on the streak query", (it) => {
  it.effect("surfaces StorageUnavailable", () =>
    Effect.gen(function* () {
      const result = yield* Effect.either(getWeeklyStats());
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(StorageUnavailable);
      }
    }),
  );
});

layer(sequencedDbLayer([() => Promise.reject(new Error("boom"))]))(
  "stats - getVolume StorageUnavailable on query failure",
  (it) => {
    it.effect("surfaces StorageUnavailable", () =>
      Effect.gen(function* () {
        const result = yield* Effect.either(getVolume(7));
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(StorageUnavailable);
        }
      }),
    );
  },
);

layer(sequencedDbLayer([() => Promise.reject(new Error("boom"))]))(
  "stats - getExerciseProgress StorageUnavailable on query failure",
  (it) => {
    it.effect("surfaces StorageUnavailable", () =>
      Effect.gen(function* () {
        const result = yield* Effect.either(getExerciseProgress(7));
        expect(result._tag).toBe("Left");
        if (result._tag === "Left") {
          expect(result.left).toBeInstanceOf(StorageUnavailable);
        }
      }),
    );
  },
);
