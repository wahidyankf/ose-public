/* oxlint-disable vitest/no-standalone-expect -- @effect/vitest it.effect blocks inside layer() are not recognised as test blocks */
import { layer } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { PGlite } from "@electric-sql/pglite";
import { expect } from "vitest";
import { PgliteService } from "@/contexts/journal/application";
import { runMigrations } from "@/contexts/journal/application";
import {
  listRoutines,
  saveRoutine,
  deleteRoutine,
  reorderRoutineExercises,
} from "../../../../../src/contexts/routine/infrastructure/routine-store";
import type { Routine, ExerciseGroup } from "../../../../../src/contexts/routine/infrastructure/routine-store";
import { NotFound, StorageUnavailable } from "@/contexts/journal/application";
import { FIXED_INSTANT, nextFixtureId } from "../../../support/doubles";

// ---------------------------------------------------------------------------
// Test layer — in-memory PGlite with both migrations applied
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
// Helpers
// ---------------------------------------------------------------------------

function makeRoutine(overrides: Partial<Routine> = {}): Routine {
  return {
    id: nextFixtureId(),
    name: "Push Day",
    hue: "teal",
    type: "workout",
    createdAt: FIXED_INSTANT,
    groups: [],
    ...overrides,
  };
}

function makeGroup(overrides: Partial<ExerciseGroup> = {}): ExerciseGroup {
  return {
    id: nextFixtureId(),
    name: "Main Lifts",
    exercises: [],
    ...overrides,
  };
}

function makeExercise(id: string, name: string) {
  return {
    id,
    name,
    type: "reps" as const,
    targetSets: 3,
    targetReps: 10,
    targetWeight: null,
    targetDuration: null,
    timerMode: "countdown" as const,
    bilateral: false,
    dayStreak: 0,
    restSeconds: null,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

layer(TestPgliteLayer)("routine-store - listRoutines", (it) => {
  it.effect("returns empty array on empty DB", () =>
    Effect.gen(function* () {
      const routines = yield* listRoutines();
      expect(routines).toHaveLength(0);
    }),
  );
});

layer(TestPgliteLayer)("routine-store - saveRoutine", (it) => {
  it.effect("inserts a new routine and returns it", () =>
    Effect.gen(function* () {
      const r = makeRoutine({ name: "Pull Day", hue: "sky" });
      const saved = yield* saveRoutine(r);

      expect(saved.id).toBe(r.id);
      expect(saved.name).toBe("Pull Day");
      expect(saved.hue).toBe("sky");
      expect(saved.type).toBe("workout");
      expect(saved.groups).toHaveLength(0);

      const all = yield* listRoutines();
      expect(all).toHaveLength(1);
      expect(all[0]?.id).toBe(r.id);
    }),
  );

  it.effect("updates existing routine on same id (upsert)", () =>
    Effect.gen(function* () {
      const r = makeRoutine({ name: "Leg Day", hue: "sage" });
      yield* saveRoutine(r);

      const updated = yield* saveRoutine({ ...r, name: "Heavy Leg Day", hue: "plum" });
      expect(updated.name).toBe("Heavy Leg Day");
      expect(updated.hue).toBe("plum");

      const all = yield* listRoutines();
      // Confirm the routine with this id has been updated (not duplicated)
      const matches = all.filter((row) => row.id === r.id);
      expect(matches).toHaveLength(1);
      expect(matches[0]?.name).toBe("Heavy Leg Day");
    }),
  );
});

layer(TestPgliteLayer)("routine-store - deleteRoutine", (it) => {
  it.effect("removes an existing routine and returns true", () =>
    Effect.gen(function* () {
      const r = makeRoutine();
      yield* saveRoutine(r);

      const deleted = yield* deleteRoutine(r.id);
      expect(deleted).toBe(true);

      const all = yield* listRoutines();
      expect(all).toHaveLength(0);
    }),
  );

  it.effect("returns false when routine does not exist", () =>
    Effect.gen(function* () {
      const deleted = yield* deleteRoutine("non-existent-id");
      expect(deleted).toBe(false);
    }),
  );
});

layer(TestPgliteLayer)("routine-store - reorderRoutineExercises", (it) => {
  it.effect("moves an exercise within a group from index 0 to index 2", () =>
    Effect.gen(function* () {
      const ex1 = makeExercise("ex-1", "Squat");
      const ex2 = makeExercise("ex-2", "Deadlift");
      const ex3 = makeExercise("ex-3", "Leg Press");

      const group = makeGroup({ exercises: [ex1, ex2, ex3] });
      const r = makeRoutine({ groups: [group] });
      yield* saveRoutine(r);

      const updated = yield* reorderRoutineExercises(r.id, group.id, 0, 2);
      const exercises = updated.groups[0]?.exercises ?? [];

      expect(exercises).toHaveLength(3);
      expect(exercises[0]?.id).toBe("ex-2");
      expect(exercises[1]?.id).toBe("ex-3");
      expect(exercises[2]?.id).toBe("ex-1");
    }),
  );

  it.effect("returns NotFound for unknown routineId", () =>
    Effect.gen(function* () {
      const result = yield* Effect.either(reorderRoutineExercises("ghost-routine", "ghost-group", 0, 1));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(NotFound);
      }
    }),
  );

  it.effect("returns NotFound for a known routine but unknown groupId", () =>
    Effect.gen(function* () {
      const group = makeGroup({ exercises: [makeExercise("ex-1", "Squat")] });
      const r = makeRoutine({ groups: [group] });
      yield* saveRoutine(r);

      const result = yield* Effect.either(reorderRoutineExercises(r.id, "ghost-group", 0, 1));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(NotFound);
      }
    }),
  );

  it.effect("surfaces StorageUnavailable when the from-index is out of bounds", () =>
    Effect.gen(function* () {
      const group = makeGroup({ exercises: [makeExercise("ex-1", "Squat")] });
      const r = makeRoutine({ groups: [group] });
      yield* saveRoutine(r);

      // splice(from, 1) on an out-of-bounds index removes nothing, so `moved`
      // is undefined — the one path a valid routine+group can still fail on.
      const result = yield* Effect.either(reorderRoutineExercises(r.id, group.id, 99, 0));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(StorageUnavailable);
      }
    }),
  );
});

// A PGlite handle whose `query` always rejects, simulating a real
// connection-level failure — the one path each store function's catch
// handler takes that the happy-path suites above never exercise.
const FailingDbLayer = Layer.scoped(
  PgliteService,
  Effect.acquireRelease(
    Effect.sync(() => ({
      db: {
        query: () => Promise.reject(new Error("connection lost")),
      } as unknown as PGlite,
    })),
    () => Effect.void,
  ),
);

layer(FailingDbLayer)("routine-store - StorageUnavailable on connection failure", (it) => {
  it.effect("listRoutines surfaces StorageUnavailable", () =>
    Effect.gen(function* () {
      const result = yield* Effect.either(listRoutines());
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(StorageUnavailable);
      }
    }),
  );

  it.effect("saveRoutine surfaces StorageUnavailable", () =>
    Effect.gen(function* () {
      const result = yield* Effect.either(saveRoutine(makeRoutine()));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(StorageUnavailable);
      }
    }),
  );

  it.effect("deleteRoutine surfaces StorageUnavailable", () =>
    Effect.gen(function* () {
      const result = yield* Effect.either(deleteRoutine("some-id"));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(StorageUnavailable);
      }
    }),
  );

  it.effect("reorderRoutineExercises surfaces StorageUnavailable on the initial fetch", () =>
    Effect.gen(function* () {
      const result = yield* Effect.either(reorderRoutineExercises("r1", "g1", 0, 1));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(StorageUnavailable);
      }
    }),
  );
});

// A PGlite handle whose `query` resolves successfully but with zero rows —
// the defensive fallback saveRoutine's UPSERT...RETURNING takes if the
// database somehow returns no row despite not erroring.
const EmptyRowsDbLayer = Layer.scoped(
  PgliteService,
  Effect.acquireRelease(
    Effect.sync(() => ({
      db: {
        query: () => Promise.resolve({ rows: [] }),
      } as unknown as PGlite,
    })),
    () => Effect.void,
  ),
);

layer(EmptyRowsDbLayer)("routine-store - saveRoutine defensive no-row fallback", (it) => {
  it.effect("fails with StorageUnavailable when UPSERT RETURNING yields no rows", () =>
    Effect.gen(function* () {
      const result = yield* Effect.either(saveRoutine(makeRoutine()));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(StorageUnavailable);
      }
    }),
  );
});
