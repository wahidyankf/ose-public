// routine context — presentation layer published API.
//
// Consumers (e.g. `src/app/app/routines/edit/page.tsx`, app shell, home
// screen) import the `EditRoutineScreen` component and the `useRoutines`
// hook from here. Internal hook state types stay private to this layer.

export { useRoutines } from "./use-routines";
export type { RoutinesState } from "./use-routines";
export { EditRoutineScreen } from "./components/edit-routine-screen";
export type { EditRoutineScreenProps } from "./components/edit-routine-screen";
