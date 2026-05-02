// stats context — application layer published API.
//
// Read-only Effect-typed use-cases that aggregate journal events into
// statistics value types. All journal access is routed through
// `@/contexts/journal/application` (read-only); this context never
// imports from `journal/infrastructure` or `journal/domain` directly.

export { getLast7Days, getWeeklyStats, getVolume, getExerciseProgress } from "./stats";
export type { WeeklyStats, DayEntry, ExerciseProgressPoint, ExerciseProgress } from "../domain";
