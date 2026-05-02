// stats context — application layer.
//
// Effect-typed read-only use-cases that aggregate journal events into
// the statistics value types defined in `domain/types.ts`. All journal
// access goes through the published `@/contexts/journal/application`
// barrel (read-only); this file does NOT import from
// `journal/infrastructure` or `journal/domain` directly.
//
// Pure projection helpers (`parseWeight`, `brzycki1RM`, `toNumber`,
// `toDateStr`, `computeStreak`) and value types (`WeeklyStats`,
// `DayEntry`, `ExerciseProgressPoint`, `ExerciseProgress`,
// `WeekWorkoutRow`) live in `../domain` — this file consumes them.

import { Effect } from "effect";
import { PgliteService, StorageUnavailable } from "@/contexts/journal/application";
import {
  brzycki1RM,
  computeStreak,
  parseWeight,
  toDateStr,
  toNumber,
  type DayEntry,
  type ExerciseProgress,
  type WeekWorkoutRow,
  type WeeklyStats,
} from "../domain";

// Re-export domain types so tests and callers importing from this module
// continue to resolve without an immediate sweep. The authoritative type
// owner is `domain/types.ts`.
export type { WeeklyStats, DayEntry, ExerciseProgress, ExerciseProgressPoint } from "../domain";

// ---------------------------------------------------------------------------
// Internal types for DB rows
// ---------------------------------------------------------------------------

type DayStatsRow = {
  date: string | Date;
  duration_mins: string | number;
  sessions: string | number;
};

type WorkoutCountRow = {
  workout_count: string | number;
  total_mins: string | number;
};

type WorkoutEntryRow = {
  id: string;
  started_at: string | Date;
  payload: unknown;
};

// ---------------------------------------------------------------------------
// Payload parsing helpers
// ---------------------------------------------------------------------------

interface RawSet {
  reps?: number | null;
  weight?: string | null;
  duration?: number | null;
}

interface RawExercise {
  name?: string;
  sets?: RawSet[];
}

interface RawWorkoutPayload {
  routineName?: string | null;
  durationSecs?: number;
  exercises?: RawExercise[];
}

// ---------------------------------------------------------------------------
// getLast7Days
// ---------------------------------------------------------------------------

export function getLast7Days(): Effect.Effect<ReadonlyArray<DayEntry>, StorageUnavailable, PgliteService> {
  return Effect.gen(function* () {
    const { db } = yield* PgliteService;

    // Attempt server-side generate_series; fall back to client-side if it throws
    const result = yield* Effect.tryPromise({
      try: async () => {
        const rows = await db.query<DayStatsRow>(
          `SELECT
             gs.day::date AS date,
             COALESCE(SUM(CASE WHEN je.name = 'workout'
               THEN COALESCE((je.payload->>'durationSecs')::float / 60, 0)
               ELSE 0 END), 0) AS duration_mins,
             COUNT(je.id) AS sessions
           FROM generate_series(
             (CURRENT_DATE - INTERVAL '6 days'),
             CURRENT_DATE,
             INTERVAL '1 day'
           ) AS gs(day)
           LEFT JOIN journal_entries je
             ON je.started_at::date = gs.day::date
           GROUP BY gs.day
           ORDER BY gs.day ASC`,
        );
        return rows.rows;
      },
      catch: (_cause): StorageUnavailable => new StorageUnavailable({ cause: _cause }),
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // If generate_series not supported, fall back to client-side 7-day array
    const rows: DayStatsRow[] = result.length === 7 ? result : yield* buildClientSide7Days(db);

    return rows.map((row): DayEntry => {
      const dateStr = toDateStr(row.date);
      const date = new Date(dateStr + "T00:00:00");
      const label = date.toLocaleDateString("en-US", { weekday: "short" });
      return {
        date,
        label,
        durationMins: toNumber(row.duration_mins),
        sessions: toNumber(row.sessions),
      };
    });
  });
}

function buildClientSide7Days(db: {
  query: <T>(sql: string, params?: unknown[]) => Promise<{ rows: T[] }>;
}): Effect.Effect<DayStatsRow[], StorageUnavailable, never> {
  return Effect.tryPromise({
    try: async () => {
      const days: DayStatsRow[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const iso = d.toISOString().slice(0, 10);

        const res = await db.query<{ duration_mins: string; sessions: string }>(
          `SELECT
             COALESCE(SUM(CASE WHEN name = 'workout'
               THEN COALESCE((payload->>'durationSecs')::float / 60, 0)
               ELSE 0 END), 0) AS duration_mins,
             COUNT(id) AS sessions
           FROM journal_entries
           WHERE started_at::date = $1::date`,
          [iso],
        );
        const r = res.rows[0];
        days.push({
          date: iso,
          duration_mins: r ? r.duration_mins : "0",
          sessions: r ? r.sessions : "0",
        });
      }
      return days;
    },
    catch: (cause): StorageUnavailable => new StorageUnavailable({ cause }),
  });
}

// ---------------------------------------------------------------------------
// getWeeklyStats
// ---------------------------------------------------------------------------

export function getWeeklyStats(): Effect.Effect<WeeklyStats, StorageUnavailable, PgliteService> {
  return Effect.gen(function* () {
    const { db } = yield* PgliteService;

    // Basic counts for last 7 days
    const basicResult = yield* Effect.tryPromise({
      try: () =>
        db.query<WorkoutCountRow>(
          `SELECT
             COUNT(*) AS workout_count,
             COALESCE(SUM((payload->>'durationSecs')::float / 60), 0) AS total_mins
           FROM journal_entries
           WHERE name = 'workout'
             AND started_at >= NOW() - INTERVAL '7 days'`,
        ),
      catch: (cause): StorageUnavailable => new StorageUnavailable({ cause }),
    });

    const basicRow = basicResult.rows[0];
    const workoutsThisWeek = toNumber(basicRow?.workout_count);
    const totalMins = toNumber(basicRow?.total_mins);

    // Fetch workout entries from last 7 days to count sets client-side
    const recentWorkouts = yield* Effect.tryPromise({
      try: () =>
        db.query<WorkoutEntryRow>(
          `SELECT id, started_at, payload
           FROM journal_entries
           WHERE name = 'workout'
             AND started_at >= NOW() - INTERVAL '7 days'`,
        ),
      catch: (cause): StorageUnavailable => new StorageUnavailable({ cause }),
    });

    let totalSets = 0;
    for (const row of recentWorkouts.rows) {
      const p = row.payload as RawWorkoutPayload | null;
      if (p?.exercises) {
        for (const ex of p.exercises) {
          totalSets += ex.sets?.length ?? 0;
        }
      }
    }

    // Streak: fetch last 52 weeks of workout counts
    const streakResult = yield* Effect.tryPromise({
      try: () =>
        db.query<WeekWorkoutRow>(
          `SELECT
             date_trunc('week', started_at) AS week_start,
             COUNT(*) AS workout_count
           FROM journal_entries
           WHERE name = 'workout'
             AND started_at >= NOW() - INTERVAL '52 weeks'
           GROUP BY date_trunc('week', started_at)
           ORDER BY week_start DESC`,
        ),
      catch: (cause): StorageUnavailable => new StorageUnavailable({ cause }),
    });

    const streak = computeStreak(streakResult.rows);

    return { workoutsThisWeek, streak, totalMins, totalSets };
  });
}

// ---------------------------------------------------------------------------
// getVolume
// ---------------------------------------------------------------------------

export function getVolume(days: number): Effect.Effect<number, StorageUnavailable, PgliteService> {
  return Effect.gen(function* () {
    const { db } = yield* PgliteService;

    const result = yield* Effect.tryPromise({
      try: () =>
        db.query<WorkoutEntryRow>(
          `SELECT id, started_at, payload
           FROM journal_entries
           WHERE name = 'workout'
             AND started_at >= NOW() - ($1 || ' days')::interval`,
          [String(days)],
        ),
      catch: (cause): StorageUnavailable => new StorageUnavailable({ cause }),
    });

    let volume = 0;
    for (const row of result.rows) {
      const p = row.payload as RawWorkoutPayload | null;
      if (p?.exercises) {
        for (const ex of p.exercises) {
          for (const set of ex.sets ?? []) {
            const w = parseWeight(set.weight);
            const r = set.reps ?? 0;
            volume += w * r;
          }
        }
      }
    }

    return volume;
  });
}

// ---------------------------------------------------------------------------
// getExerciseProgress
// ---------------------------------------------------------------------------

export function getExerciseProgress(
  days: number,
): Effect.Effect<Record<string, ExerciseProgress>, StorageUnavailable, PgliteService> {
  return Effect.gen(function* () {
    const { db } = yield* PgliteService;

    const result = yield* Effect.tryPromise({
      try: () =>
        db.query<WorkoutEntryRow>(
          `SELECT id, started_at, payload
           FROM journal_entries
           WHERE name = 'workout'
             AND started_at >= NOW() - ($1 || ' days')::interval
           ORDER BY started_at ASC`,
          [String(days)],
        ),
      catch: (cause): StorageUnavailable => new StorageUnavailable({ cause }),
    });

    const progressMap: Record<string, ExerciseProgress & { best1RM: number }> = {};

    for (const row of result.rows) {
      const p = row.payload as RawWorkoutPayload | null;
      const dateStr = toDateStr(row.started_at);

      if (!p?.exercises) continue;

      for (const ex of p.exercises) {
        const exName = ex.name ?? "unknown";

        if (!progressMap[exName]) {
          progressMap[exName] = {
            routineName: p.routineName ?? null,
            points: [],
            best1RM: 0,
          };
        }

        for (const set of ex.sets ?? []) {
          const w = parseWeight(set.weight);
          const r = set.reps ?? 0;
          if (w <= 0 && r <= 0) continue;

          const rm = brzycki1RM(w, r);
          const entry = progressMap[exName];
          if (!entry) continue;

          const isPR = rm != null && rm > entry.best1RM;
          if (isPR && rm != null) {
            entry.best1RM = rm;
          }

          entry.points.push({
            date: dateStr,
            weight: w,
            reps: r,
            estimated1RM: rm,
            isPR,
          });
        }
      }
    }

    // Strip internal best1RM from output
    const output: Record<string, ExerciseProgress> = {};
    for (const [name, data] of Object.entries(progressMap)) {
      output[name] = {
        routineName: data.routineName,
        points: data.points,
      };
    }

    return output;
  });
}
