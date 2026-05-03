# Ubiquitous Language — routine

**Bounded context**: `routine`
**Maintainer**: organiclever-web team
**Last reviewed**: 2026-05-02

## One-line summary

Reusable workout templates the user authors and runs — each `Routine` carries an ordered list of `RoutineExercise` entries with default sets, reps, and weights.

## Terms

| Term                       | Definition                                                                                              | Code identifier(s)            | Used in features    |
| -------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------- | ------------------- |
| `Routine`                  | A named template the user runs to start a workout. Owns an ordered `routineExercises` list.             | `Routine` (TS type)           | `routine/*.feature` |
| `RoutineExercise`          | One exercise inside a routine: a name plus default sets, reps, weight. Order in the list is meaningful. | `ExerciseGroup` (TS type)     | `routine/*.feature` |
| `Default sets/reps/weight` | The starting numbers a `RoutineExercise` carries; the workout-session may override them at runtime.     | `ExerciseGroup`               | `routine/*.feature` |
| `Edit Routine`             | The screen at `/app/routines/edit` for creating or modifying a `Routine`.                               | (route segment) routines/edit | `routine/*.feature` |
| `Routine list`             | The collection of all routines persisted for the current user, ordered by user choice.                  | `listRoutines` (use-case fn)  | `routine/*.feature` |

## Forbidden synonyms

- "Workout" — used by `workout-session` to mean an active in-progress session. Inside `routine`, prefer "routine" (the template).
- "Exercise" alone — ambiguous. Always qualify as `RoutineExercise` (template-side) or `WorkoutExercise` (session-side, owned by `workout-session`).
- "Plan" — not a domain term in this product. Use `Routine`.
