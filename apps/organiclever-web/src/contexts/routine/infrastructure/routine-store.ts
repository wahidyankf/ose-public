// routine context — infrastructure layer.
//
// PGlite-backed implementation of the routine storage use-cases. The
// `listRoutines` / `saveRoutine` / `deleteRoutine` /
// `reorderRoutineExercises` Effect-shaped functions are the published API of
// this layer (re-exported via `infrastructure/index.ts` and bridged through
// `application/index.ts` until an explicit storage port is introduced in a
// future plan).
//
// Cross-context infrastructure coupling: this file imports `PgliteService`
// from `@/contexts/journal/infrastructure` and `StorageUnavailable` /
// `NotFound` from `@/contexts/journal/domain`. The journal context is the
// system of record for the underlying PGlite handle today; routine borrows
// the same Layer rather than spinning a parallel one (mirrors the settings
// context pattern from Phase 5). ESLint `boundaries/element-types` warns
// about the cross-context infrastructure import (severity = warn) — that
// warning is expected and resolves when an explicit storage port is
// introduced in a future plan, at which point the journal infrastructure
// import collapses to a domain-only one.

import { Effect } from "effect";
import { PgliteService } from "@/contexts/journal/infrastructure";
import { NotFound, StorageUnavailable } from "@/contexts/journal/domain";
import type { Hue } from "@/contexts/journal/application";
import type { ExerciseGroup, Routine } from "../domain";

// Re-export domain types so consumers importing from this module continue to
// compile without an immediate sweep. The authoritative type owner is
// `domain/types.ts`. New cross-context callers should consume the published
// `application/index.ts` barrel instead.
export type { Routine, ExerciseGroup };

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
