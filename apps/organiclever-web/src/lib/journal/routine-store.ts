import { Effect } from "effect";
import { PgliteService } from "./runtime";
import { NotFound, StorageUnavailable } from "@/contexts/journal/domain/errors";
import type { ExerciseTemplate, Hue } from "@/contexts/journal/domain/typed-payloads";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RoutineId = string;

export interface ExerciseGroup {
  id: string;
  name: string;
  exercises: ExerciseTemplate[];
}

export interface Routine {
  id: RoutineId;
  name: string;
  hue: Hue;
  type: "workout";
  createdAt: string; // ISO timestamp
  groups: ExerciseGroup[];
}

// ---------------------------------------------------------------------------
// Internal row shape returned from PGlite queries
// ---------------------------------------------------------------------------

type RoutineRow = {
  id: string;
  name: string;
  hue: string;
  type: string;
  created_at: Date | string;
  groups: ExerciseGroup[];
};

function rowToRoutine(row: RoutineRow): Routine {
  return {
    id: row.id,
    name: row.name,
    hue: row.hue as Hue,
    type: "workout",
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    groups: Array.isArray(row.groups) ? row.groups : [],
  };
}

// ---------------------------------------------------------------------------
// Store functions
// ---------------------------------------------------------------------------

export function listRoutines(): Effect.Effect<ReadonlyArray<Routine>, StorageUnavailable, PgliteService> {
  return Effect.gen(function* () {
    const { db } = yield* PgliteService;

    const result = yield* Effect.tryPromise({
      try: () =>
        db.query<RoutineRow>(
          `SELECT id, name, hue, type, created_at, groups
           FROM routines
           ORDER BY created_at ASC`,
        ),
      catch: (cause): StorageUnavailable => new StorageUnavailable({ cause }),
    });

    return result.rows.map(rowToRoutine);
  });
}

export function saveRoutine(r: Routine): Effect.Effect<Routine, StorageUnavailable, PgliteService> {
  return Effect.gen(function* () {
    const { db } = yield* PgliteService;

    const result = yield* Effect.tryPromise({
      try: () =>
        db.query<RoutineRow>(
          `INSERT INTO routines (id, name, hue, type, created_at, groups)
           VALUES ($1, $2, $3, $4, $5::timestamptz, $6::jsonb)
           ON CONFLICT (id) DO UPDATE
             SET name       = EXCLUDED.name,
                 hue        = EXCLUDED.hue,
                 type       = EXCLUDED.type,
                 created_at = EXCLUDED.created_at,
                 groups     = EXCLUDED.groups
           RETURNING id, name, hue, type, created_at, groups`,
          [r.id, r.name, r.hue, r.type, r.createdAt, JSON.stringify(r.groups)],
        ),
      catch: (cause): StorageUnavailable => new StorageUnavailable({ cause }),
    });

    const row = result.rows[0];
    if (!row) {
      return yield* Effect.fail(new StorageUnavailable({ cause: new Error("UPSERT returned no rows") }));
    }

    return rowToRoutine(row);
  });
}

export function deleteRoutine(id: string): Effect.Effect<boolean, StorageUnavailable, PgliteService> {
  return Effect.gen(function* () {
    const { db } = yield* PgliteService;

    const result = yield* Effect.tryPromise({
      try: () => db.query<{ id: string }>("DELETE FROM routines WHERE id = $1 RETURNING id", [id]),
      catch: (cause): StorageUnavailable => new StorageUnavailable({ cause }),
    });

    return result.rows.length > 0;
  });
}

export function reorderRoutineExercises(
  routineId: string,
  groupId: string,
  from: number,
  to: number,
): Effect.Effect<Routine, NotFound | StorageUnavailable, PgliteService> {
  return Effect.gen(function* () {
    const { db } = yield* PgliteService;

    const fetchResult = yield* Effect.tryPromise({
      try: () =>
        db.query<RoutineRow>(
          `SELECT id, name, hue, type, created_at, groups
           FROM routines
           WHERE id = $1`,
          [routineId],
        ),
      catch: (cause): StorageUnavailable => new StorageUnavailable({ cause }),
    });

    const row = fetchResult.rows[0];
    if (!row) {
      return yield* Effect.fail(new NotFound({ id: routineId }));
    }

    const routine = rowToRoutine(row);
    const groupIndex = routine.groups.findIndex((g) => g.id === groupId);
    if (groupIndex === -1) {
      return yield* Effect.fail(new NotFound({ id: groupId }));
    }

    const group = routine.groups[groupIndex];
    if (!group) {
      return yield* Effect.fail(new NotFound({ id: groupId }));
    }

    const exercises = [...group.exercises];
    const [moved] = exercises.splice(from, 1);
    if (moved === undefined) {
      return yield* Effect.fail(new StorageUnavailable({ cause: new Error(`Index ${from} out of bounds`) }));
    }
    exercises.splice(to, 0, moved);

    const updatedGroups = routine.groups.map((g, i) => (i === groupIndex ? { ...g, exercises } : g));

    const updatedRoutine: Routine = { ...routine, groups: updatedGroups };
    return yield* saveRoutine(updatedRoutine);
  });
}
