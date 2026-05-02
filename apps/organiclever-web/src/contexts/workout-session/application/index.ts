// workout-session context — application layer published API.
//
// Houses the xstate v5 orchestrating machine (`workoutSessionMachine`)
// that coordinates an in-progress workout: loads routine template input,
// consumes settings for rest computation, ticks elapsed time, transitions
// active/resting/confirming/finishing states, and on `CONFIRM_FINISH`
// invokes the `saveWorkout` Promise actor that writes a workout entry to
// the journal via `@/contexts/journal/application` (`appendEntries`).
//
// Per `tech-docs.md` § "xstate machine placement": this is an
// orchestrating machine — IO via `fromPromise`, cross-context journal
// writes — so it lands in `application/`, not `presentation/`.
//
// Pure helpers `resolvedRest` and `buildWorkoutEntry` are exported
// alongside the machine for unit-test access; the underlying types
// (`WorkoutMachineContext`) are exported as type-only.

export { workoutSessionMachine, resolvedRest, buildWorkoutEntry } from "./workout-machine";
export type { WorkoutMachineContext } from "./workout-machine";
