import { normalizeCourseRef } from "@/features/course-paths/core/manifest";
import type { PathManifest } from "@/features/course-paths/core/schemas";

/**
 * Resolve the active path context of a lesson page (tech-docs/003 active path rule).
 *
 * The URL stays the authority: a present `pathParam` resolves only against a manifest with that
 * id that contains `courseId`, and never falls back to memory (so an invalid `?path=` keeps its
 * meaning). Without one, the remembered path is used only while its course id is the current
 * course and its manifest also contains that course. Anything else is canonical mode (`null`).
 * Pure — no IO, never throws.
 */
export function resolveLessonPathContext(input: {
  pathParam: string | null;
  manifests: readonly PathManifest[];
  courseId: string;
  lastPath: { pathId: string; courseId: string } | null;
}): { manifest: PathManifest; source: "url" | "remembered" } | null {
  const { pathParam, manifests, courseId, lastPath } = input;

  if (pathParam !== null) {
    const manifest = findManifestContainingCourse(manifests, pathParam, courseId);
    return manifest === null ? null : { manifest, source: "url" };
  }

  if (lastPath === null || lastPath.courseId !== courseId) {
    return null;
  }

  const manifest = findManifestContainingCourse(manifests, lastPath.pathId, courseId);
  return manifest === null ? null : { manifest, source: "remembered" };
}

function findManifestContainingCourse(
  manifests: readonly PathManifest[],
  pathId: string,
  courseId: string,
): PathManifest | null {
  return (
    manifests.find(
      (manifest) =>
        manifest.pathId === pathId &&
        manifest.courseOrder.some((reference) => normalizeCourseRef(reference).id === courseId),
    ) ?? null
  );
}
