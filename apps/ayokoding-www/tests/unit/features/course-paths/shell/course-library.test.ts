import { describe, expect, it } from "vitest";
import {
  buildCourseLibrary,
  deriveAllCourseIds,
  deriveOutlineCourseIds,
} from "../../../../../src/features/course-paths/shell/course-library";
import type { ContentMeta } from "@/features/content/core/types";

function meta(overrides: Partial<ContentMeta> & { slug: string }): ContentMeta {
  return {
    title: overrides.title ?? "Untitled",
    slug: overrides.slug,
    locale: overrides.locale ?? "en",
    weight: overrides.weight ?? 0,
    tags: overrides.tags ?? [],
    draft: overrides.draft ?? false,
    isSection: overrides.isSection ?? false,
    filePath: overrides.filePath ?? "/tmp/x.md",
    prerequisites: overrides.prerequisites,
    status: overrides.status,
  };
}

describe("buildCourseLibrary", () => {
  it("collects course IDs and prerequisites for the given locale's course pages only", () => {
    const contentMap = new Map<string, ContentMeta>([
      [
        "en:learn/courses/data-structures-and-algorithms-essentials",
        meta({
          slug: "learn/courses/data-structures-and-algorithms-essentials",
          prerequisites: ["version-control-and-git"],
        }),
      ],
      ["en:learn/courses/version-control-and-git", meta({ slug: "learn/courses/version-control-and-git" })],
      // Non-course page — must be excluded from the library.
      ["en:learn/paths", meta({ slug: "learn/paths", isSection: true })],
      // Different locale — must be excluded when building the "en" library.
      [
        "id:learn/courses/version-control-and-git",
        meta({ slug: "learn/courses/version-control-and-git", locale: "id" }),
      ],
    ]);

    const { libraryCourseIds, prerequisitesByCourse } = buildCourseLibrary(contentMap, "en");

    expect([...libraryCourseIds].sort()).toEqual([
      "data-structures-and-algorithms-essentials",
      "version-control-and-git",
    ]);
    expect(prerequisitesByCourse["data-structures-and-algorithms-essentials"]).toEqual(["version-control-and-git"]);
  });

  it("defaults a course's prerequisites to an empty array when the field is absent", () => {
    const contentMap = new Map<string, ContentMeta>([
      ["en:learn/courses/just-enough-python", meta({ slug: "learn/courses/just-enough-python" })],
    ]);

    const { prerequisitesByCourse } = buildCourseLibrary(contentMap, "en");

    expect(prerequisitesByCourse["just-enough-python"]).toEqual([]);
  });
});

/**
 * Regression: the course-paths plan's Phase 3 e2e run surfaced a real, previously-undetected bug.
 * `loadRoutePathData` used the locale-scoped `libraryCourseIds` to validate every loaded manifest's
 * `courseOrder` (via `checkManifestIntegrity`) — but a manifest is locale-independent navigational
 * metadata, while a course's translation into any one locale routinely lags behind its English
 * original. The moment any manifest referenced a course not yet translated into the locale currently
 * being rendered, `loadManifests` threw for every single page render in that locale — not just pages
 * related to that course or that path — because `<ROUTE>`'s content layout calls `loadRoutePathData`
 * unconditionally for every content page. `deriveAllCourseIds` gives manifest-integrity checking a
 * locale-independent view of "does this course exist anywhere in the catalog", decoupled from
 * `libraryCourseIds`, which stays locale-scoped for prerequisite-link rendering (unaffected).
 */
describe("deriveAllCourseIds", () => {
  it("collects course IDs across every locale, not just one", () => {
    const contentMap = new Map<string, ContentMeta>([
      ["en:learn/courses/only-in-english", meta({ slug: "learn/courses/only-in-english", locale: "en" })],
      ["id:learn/courses/only-in-indonesian", meta({ slug: "learn/courses/only-in-indonesian", locale: "id" })],
      // Non-course page — must still be excluded.
      ["en:learn/paths", meta({ slug: "learn/paths", isSection: true })],
    ]);

    const allCourseIds = deriveAllCourseIds(contentMap);

    expect([...allCourseIds].sort()).toEqual(["only-in-english", "only-in-indonesian"]);
  });

  it("deduplicates a course ID that exists in more than one locale", () => {
    const contentMap = new Map<string, ContentMeta>([
      ["en:learn/courses/translated-course", meta({ slug: "learn/courses/translated-course", locale: "en" })],
      ["id:learn/courses/translated-course", meta({ slug: "learn/courses/translated-course", locale: "id" })],
    ]);

    const allCourseIds = deriveAllCourseIds(contentMap);

    expect(allCourseIds).toEqual(["translated-course"]);
  });
});

/**
 * AC-4.1 RED: `deriveOutlineCourseIds` does not exist yet — the outline set must be
 * locale-independent (like `deriveAllCourseIds`): an outline course declared in `en` still
 * counts as an outline course when rendering `id`, so the Outline badge never depends on
 * which locale's content map entry was read.
 */
describe("deriveOutlineCourseIds", () => {
  it("collects the IDs of outline courses while excluding complete courses and non-course pages", () => {
    const contentMap = new Map<string, ContentMeta>([
      [
        "en:learn/courses/capstone-secure-service",
        meta({ slug: "learn/courses/capstone-secure-service", status: "outline" }),
      ],
      ["en:learn/courses/just-enough-python", meta({ slug: "learn/courses/just-enough-python" })],
      // Non-course page carrying a status — must still be excluded.
      ["en:learn/paths", meta({ slug: "learn/paths", isSection: true, status: "outline" })],
    ]);

    expect(deriveOutlineCourseIds(contentMap)).toEqual(["capstone-secure-service"]);
  });

  it("deduplicates an outline course that exists in more than one locale", () => {
    const contentMap = new Map<string, ContentMeta>([
      [
        "en:learn/courses/translated-course",
        meta({ slug: "learn/courses/translated-course", locale: "en", status: "outline" }),
      ],
      [
        "id:learn/courses/translated-course",
        meta({ slug: "learn/courses/translated-course", locale: "id", status: "outline" }),
      ],
    ]);

    expect(deriveOutlineCourseIds(contentMap)).toEqual(["translated-course"]);
  });
});
