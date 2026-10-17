import { normalizeCourseRef } from "@/features/course-paths/core/manifest";
import { corePhases } from "@/features/course-paths/core/path-phases";
import type { PathManifest } from "@/features/course-paths/core/schemas";
import { courseProgress, isCourseDone, type SequenceIndex } from "./progress-derivations";
import type { ProgressState } from "./progress-schema";

/** Where a course action goes: a course landing page (`pagePath: null`) or one of its pages. */
export type CourseTarget = { courseId: string; pagePath: string | null };

/** What a path offers next: start it, continue it, or report its core as finished. */
export type PathNextStep =
  | { kind: "start"; target: CourseTarget }
  | { kind: "continue"; target: CourseTarget }
  | { kind: "core-complete" };

/**
 * The next page of a course: `null` when the course is done, the first sequence page that is not
 * completed when the reader has started it, and otherwise the course landing page, where "Start
 * course" lives (tech-docs/003). Pure — no IO, never throws.
 */
export function courseNextTarget(
  state: ProgressState,
  courseId: string,
  sequence: readonly string[],
): CourseTarget | null {
  return isCourseDone(state, courseId, sequence) ? null : unfinishedTargetOrLanding(state, courseId, sequence);
}

/**
 * The path's next step (tech-docs/003 next-step rule), in order: continue the remembered course
 * when the reader last worked in this path and that course is unfinished; otherwise the first
 * unfinished core course — `start` when no course of the path has a completed page, `continue`
 * otherwise; otherwise `core-complete` once every core course is done. Pure — no IO.
 */
export function resolvePathNextStep(
  manifest: PathManifest,
  state: ProgressState,
  sequences: SequenceIndex,
): PathNextStep {
  const remembered = rememberedUnfinishedCourseId(manifest, state, sequences);
  if (remembered !== null) {
    return { kind: "continue", target: unfinishedTargetOrLanding(state, remembered, sequences[remembered] ?? []) };
  }

  const coreCourseIds = corePhases(manifest).flatMap((phase) =>
    phase.courses.map((reference) => normalizeCourseRef(reference).id),
  );
  const firstUnfinishedCore = coreCourseIds.find(
    (courseId) => !isCourseDone(state, courseId, sequences[courseId] ?? []),
  );

  if (firstUnfinishedCore === undefined) {
    return { kind: "core-complete" };
  }

  const target = unfinishedTargetOrLanding(state, firstUnfinishedCore, sequences[firstUnfinishedCore] ?? []);
  return hasPathProgress(manifest, state, sequences) ? { kind: "continue", target } : { kind: "start", target };
}

/** The remembered course of `manifest` only while it is in the path and still unfinished. */
function rememberedUnfinishedCourseId(
  manifest: PathManifest,
  state: ProgressState,
  sequences: SequenceIndex,
): string | null {
  const lastPath = state.lastPath;
  if (lastPath === null || lastPath.pathId !== manifest.pathId) {
    return null;
  }

  const isInPath = manifest.courseOrder.some((reference) => normalizeCourseRef(reference).id === lastPath.courseId);
  if (!isInPath || isCourseDone(state, lastPath.courseId, sequences[lastPath.courseId] ?? [])) {
    return null;
  }

  return lastPath.courseId;
}

/** The next target of a course the caller already knows is unfinished. */
function unfinishedTargetOrLanding(state: ProgressState, courseId: string, sequence: readonly string[]): CourseTarget {
  if (courseProgress(state, courseId, sequence).done === 0) {
    return { courseId, pagePath: null };
  }

  const completed = new Set(state.completed[courseId] ?? []);
  return { courseId, pagePath: sequence.find((pagePath) => !completed.has(pagePath)) ?? null };
}

/** True when any course of the path — core or extension — has a completed page. */
function hasPathProgress(manifest: PathManifest, state: ProgressState, sequences: SequenceIndex): boolean {
  return manifest.courseOrder.some((reference) => {
    const courseId = normalizeCourseRef(reference).id;
    return courseProgress(state, courseId, sequences[courseId] ?? []).done > 0;
  });
}
