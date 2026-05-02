// workout-session context — presentation layer published API.
//
// Consumers (e.g. `src/app/app/workout/page.tsx`,
// `src/app/app/workout/finish/page.tsx`, app shell) import the
// `WorkoutScreen` and `FinishScreen` components from here. The
// orchestrating xstate machine is published from
// `@/contexts/workout-session/application`, not from this barrel.

export { WorkoutScreen } from "./components/workout-screen";
export type { WorkoutScreenProps } from "./components/workout-screen";
export { FinishScreen } from "./components/finish-screen";
export type { FinishScreenProps } from "./components/finish-screen";
