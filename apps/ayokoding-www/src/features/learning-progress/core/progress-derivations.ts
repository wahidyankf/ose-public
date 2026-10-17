import { normalizeCourseRef } from "@/features/course-paths/core/manifest";
import { corePhases } from "@/features/course-paths/core/path-phases";
import type { PathManifest, PathPhase } from "@/features/course-paths/core/schemas";
import { isPendingSkillsRestructure } from "@/features/course-paths/core/skills-restructure-allowlist";
import type { ProgressState } from "./progress-schema";

/** A course's progress state, in words a reader can see (tech-docs/004). */
export type CourseStatus = "done" | "in-progress" | "not-started";

/** Course id -> its lesson page paths, as `loadLessonPagePaths` returns it. */
export type SequenceIndex = Readonly<Record<string, readonly string[]>>;

/**
 * A course's page counts. `done` counts only completed pages that are still in `sequence`, so a
 * renamed or removed page never counts (tech-docs/003). Pure — no IO, never throws.
 */
export function courseProgress(
  state: ProgressState,
  courseId: string,
  sequence: readonly string[],
): { done: number; total: number; status: CourseStatus } {
  const completed = new Set(state.completed[courseId] ?? []);
  const done = sequence.filter((pagePath) => completed.has(pagePath)).length;
  const total = sequence.length;

  return { done, total, status: done === total && total > 0 ? "done" : done > 0 ? "in-progress" : "not-started" };
}

/**
 * True when every page of `sequence` is complete — and `sequence` is not empty. The one check the
 * phase, path, and next-step rules share, so "done" means the same thing everywhere. Pure.
 */
export function isCourseDone(state: ProgressState, courseId: string, sequence: readonly string[]): boolean {
  return courseProgress(state, courseId, sequence).status === "done";
}

/**
 * A phase's course counts. Counts are courses, not pages: a phase's `total` is its course list and
 * its `done` is how many of those courses are finished. Pure — no IO, never throws.
 */
export function phaseProgress(
  phase: PathPhase,
  state: ProgressState,
  sequences: SequenceIndex,
): { done: number; total: number } {
  const courseIds = phase.courses.map((reference) => normalizeCourseRef(reference).id);

  return { done: countDone(state, courseIds, sequences), total: courseIds.length };
}

/**
 * A path's headline counts. Core courses only — extensions are optional, so their progress never
 * moves the headline (decision 38b), and a pending-restructure skills path (one flat `all-courses`
 * phase) counts every course it lists. `complete` is true only when there is at least one core
 * course and all of them are done. Pure — no IO, never throws.
 */
export function pathProgress(
  manifest: PathManifest,
  state: ProgressState,
  sequences: SequenceIndex,
): { coreDone: number; coreTotal: number; complete: boolean } {
  const courseIds = isPendingSkillsRestructure(manifest)
    ? manifest.courseOrder.map((reference) => normalizeCourseRef(reference).id)
    : corePhases(manifest).flatMap((phase) => phase.courses.map((reference) => normalizeCourseRef(reference).id));

  const coreTotal = courseIds.length;
  const coreDone = countDone(state, courseIds, sequences);

  return { coreDone, coreTotal, complete: coreTotal > 0 && coreDone === coreTotal };
}

function countDone(state: ProgressState, courseIds: readonly string[], sequences: SequenceIndex): number {
  return courseIds.filter((courseId) => isCourseDone(state, courseId, sequences[courseId] ?? [])).length;
}
