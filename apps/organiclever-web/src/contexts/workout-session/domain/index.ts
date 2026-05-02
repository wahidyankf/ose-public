// workout-session context — domain layer published API.
//
// Empty placeholder. Workout-session is an orchestrating context: the
// xstate machine in `application/workout-machine.ts` coordinates IO
// (journal append, settings read, runtime invocation) across other
// contexts and does not own any pure aggregate type that would justify
// a dedicated `domain/` model in this Phase.
//
// `Routine` (template input) is owned by the routine context, and
// `ActiveExercise` / `CompletedSet` are journal-vocabulary value types
// owned by the journal context's typed-payloads schema. Both flow into
// workout-session through the published cross-context application
// barrels.
//
// A future plan may introduce a `WorkoutSession` aggregate (with
// invariants such as "every active set has a non-negative rep count")
// — at that point this file gains real `export type` declarations.
export {};
