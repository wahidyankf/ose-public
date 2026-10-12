import type { CourseRef } from "./schemas";

export type { CourseRef, PathManifest, PathPhase } from "./schemas";

/** A `courseOrder` entry normalized to its object shape (bare-string form resolved away). */
export type NormalizedCourseRef = Extract<CourseRef, { id: string }>;

/**
 * Normalize a `courseOrder` entry — a bare course-ID string or a
 * `{ id, framing? }` object — to the object shape, preserving `framing` when present.
 *
 * Total (never throws) over any well-typed `CourseRef`: a string becomes
 * `{ id: <string> }`; an object is returned unchanged. Pure — no IO.
 */
export function normalizeCourseRef(ref: CourseRef): NormalizedCourseRef {
  if (typeof ref === "string") {
    return { id: ref };
  }

  return ref;
}
