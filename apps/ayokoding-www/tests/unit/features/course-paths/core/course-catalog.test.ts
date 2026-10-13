import { describe, expect, it } from "vitest";
import { buildCourseCatalog } from "../../../../../src/features/course-paths/core/course-catalog";
import { manifestFixture } from "../manifest-fixture";
import type { ContentMeta } from "@/features/content/core/types";

function meta(slug: string, extra: Partial<ContentMeta>): ContentMeta {
  return {
    title: slug,
    slug,
    locale: "en",
    weight: 1,
    draft: false,
    isSection: true,
    tags: [],
    filePath: `/x/${slug}`,
    ...extra,
  };
}

describe("buildCourseCatalog", () => {
  const manifests = [manifestFixture({ pathId: "skills/x", courses: ["sql-essentials", "zebra-course"] })];
  const map = new Map<string, ContentMeta>([
    [
      "en:learn/courses/sql-essentials",
      meta("learn/courses/sql-essentials", {
        title: "SQL Essentials",
        category: "data-and-databases",
        format: "by-example",
        estimatedHours: 8,
        description: "Model data in tables and query it well.",
      }),
    ],
    [
      "en:learn/courses/sql-essentials/learning/beginner",
      meta("learn/courses/sql-essentials/learning/beginner", { title: "Beginner", isSection: false }),
    ],
    [
      "en:learn/courses/zebra-course",
      meta("learn/courses/zebra-course", {
        title: "Zebra Course",
        category: "data-and-databases",
        format: "primer",
        estimatedHours: 2,
        description: "All about zebras in production systems today.",
      }),
    ],
    [
      "en:learn/courses/mystery",
      meta("learn/courses/mystery", {
        title: "Mystery",
        category: "nope",
        description: "A course with an unknown category value.",
      }),
    ],
    ["id:learn/courses/sql-essentials", meta("learn/courses/sql-essentials", { title: "SQL ID", locale: "id" })],
  ]);

  it("keeps only locale course roots, groups by category, sorts by title, counts paths", () => {
    const groups = buildCourseCatalog(map, manifests, "en");
    expect(groups.map((g) => g.category?.id ?? "other")).toEqual(["data-and-databases", "other"]);
    expect(groups[0]!.entries.map((e) => e.title)).toEqual(["SQL Essentials", "Zebra Course"]);
    expect(groups[0]!.entries[0]!.pathCount).toBe(1);
    expect(groups[1]!.entries[0]!.courseId).toBe("mystery");
  });
});
