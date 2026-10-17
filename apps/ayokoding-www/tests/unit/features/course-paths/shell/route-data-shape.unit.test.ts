import { describe, expect, it } from "vitest";
import type { ContentMeta } from "@/features/content/core/types";
import { manifestFixture } from "../manifest-fixture";
// eslint-disable-next-line import/first
import {
  toCoursePathClientData,
  type CoursePathData,
} from "../../../../../src/features/course-paths/shell/course-path-nav";

function courseMeta(courseId: string, title: string): ContentMeta {
  return {
    title,
    slug: `learn/courses/${courseId}`,
    locale: "en",
    weight: 0,
    tags: [],
    draft: false,
    isSection: false,
    filePath: `/content/en/learn/courses/${courseId}/_index.md`,
  };
}

const MANIFEST = manifestFixture({
  pathId: "careers/immediately-effective/backend-track",
  arc: "immediately-effective",
  title: "Backend Track",
  courses: ["just-enough-bash", "backend-essentials"],
});

const DATA: CoursePathData = {
  contentMap: new Map<string, ContentMeta>([
    ["en:learn/courses/just-enough-bash", courseMeta("just-enough-bash", "Just Enough Bash")],
    ["en:learn/courses/backend-essentials", courseMeta("backend-essentials", "Backend Essentials")],
  ]),
  manifests: [MANIFEST],
  prerequisitesByCourse: { "backend-essentials": ["just-enough-bash"] },
  libraryCourseIds: ["just-enough-bash", "backend-essentials"],
  outlineCourseIds: ["backend-essentials"],
};

/**
 * tech-docs/005 Op 2 — RETAIN `coursePaths.getRouteData`. The procedure's output shape is the one
 * contract this plan touches, so it is locked here: the five keys the client reads, and nothing
 * else that a rename or a stray field would silently change.
 */
describe("coursePaths.getRouteData output shape (retained contract)", () => {
  it("returns exactly the retained keys, in order, and nothing else", () => {
    const output = toCoursePathClientData(DATA, "en");

    expect(Object.keys(output)).toEqual([
      "manifests",
      "prerequisitesByCourse",
      "libraryCourseIds",
      "outlineCourseIds",
      "courseLinks",
    ]);
    expect(new Set(Object.keys(output))).toEqual(
      new Set(["manifests", "prerequisitesByCourse", "libraryCourseIds", "outlineCourseIds", "courseLinks"]),
    );
  });

  it("carries the loaded manifests, prerequisite map, library IDs, and outline IDs through unchanged", () => {
    const output = toCoursePathClientData(DATA, "en");

    expect(output.manifests).toEqual([MANIFEST]);
    expect(output.prerequisitesByCourse).toEqual({ "backend-essentials": ["just-enough-bash"] });
    expect(output.libraryCourseIds).toEqual(["just-enough-bash", "backend-essentials"]);
    expect(output.outlineCourseIds).toEqual(["backend-essentials"]);
  });

  it("resolves a title and slug for each library course, and none for an unknown one", () => {
    const output = toCoursePathClientData(DATA, "en");

    expect(output.courseLinks["just-enough-bash"]).toEqual({
      title: "Just Enough Bash",
      slug: "learn/courses/just-enough-bash",
    });
    expect(Object.keys(output.courseLinks).sort()).toEqual(["backend-essentials", "just-enough-bash"]);
  });

  it("leaves courseLinks empty for a locale with no course pages", () => {
    expect(toCoursePathClientData(DATA, "id").courseLinks).toEqual({});
  });
});
