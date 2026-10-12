import { normalizeCourseRef } from "./manifest";
import type { PathManifest, PathPhase } from "./schemas";

/**
 * The core phases of `manifest`, in manifest order.
 *
 * Pure — no IO, never throws. Consumed by plan 04's phase roadmap (which renders core
 * phases as the required route) and by the integrity checks (closure, outline, and goals
 * apply to core courses only).
 */
export function corePhases(manifest: PathManifest): readonly PathPhase[] {
  return manifest.phases.filter((phase) => phase.kind === "core");
}

/**
 * The extension phases of `manifest`, in manifest order.
 *
 * Pure — no IO, never throws. Consumed by plan 04's phase roadmap (which renders these
 * under the "Optional extensions" heading, after the core).
 */
export function extensionPhases(manifest: PathManifest): readonly PathPhase[] {
  return manifest.phases.filter((phase) => phase.kind === "extension");
}

/** Where a course sits within its path: its phase, the phase's index, and its 1-based path position. */
export interface CoursePhaseLocation {
  phase: PathPhase;
  phaseIndex: number;
  /** 1-based position within the whole path (courses of earlier phases count first). */
  position: number;
}

/**
 * Locate `courseId` within `manifest`'s phases.
 *
 * Returns the first phase listing the course, its index in `manifest.phases`, and the
 * course's 1-based position within the flattened path order — or `null` when no phase
 * lists the course. Pure — no IO, never throws. Consumed by plan 04's context bar and
 * progress views, which need "phase n of m" and "course k of N" from one lookup.
 */
export function phaseOfCourse(manifest: PathManifest, courseId: string): CoursePhaseLocation | null {
  let position = 0;
  for (const [phaseIndex, phase] of manifest.phases.entries()) {
    const courseIds = phase.courses.map((ref) => normalizeCourseRef(ref).id);
    const indexInPhase = courseIds.indexOf(courseId);
    if (indexInPhase !== -1) {
      return { phase, phaseIndex, position: position + indexInPhase + 1 };
    }
    position += courseIds.length;
  }
  return null;
}
