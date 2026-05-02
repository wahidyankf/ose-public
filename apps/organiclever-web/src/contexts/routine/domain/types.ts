// routine context — domain layer.
//
// Pure types only — no `effect`, no IO, no infrastructure imports.
//
// `Routine` is the aggregate root for the routine context: a named workout
// template containing one or more `ExerciseGroup`s. `ExerciseGroup` is a
// nominal sub-aggregate that bundles a list of `ExerciseTemplate`s under a
// human-readable label (e.g. "Warm-up", "Main").
//
// `ExerciseTemplate` and the `Hue` palette are owned by the journal context's
// typed-payloads schema (workout entries embed exercises) and re-imported
// here as type-only references via the journal domain barrel — that matches
// the strategic relationship "routine reads journal type vocabulary"
// captured in the bounded-context map ADR. Cross-context `domain → domain`
// type-only imports are the DDD "shared kernel" pattern, allowed by the
// ESLint boundaries config.

import type { ExerciseTemplate, Hue } from "@/contexts/journal/domain";

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
