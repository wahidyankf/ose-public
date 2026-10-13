import { describe, expect, it } from "vitest";
import { buildCourseHeaderData } from "../../../../../src/features/course-paths/shell/course-header-data";
import type { ContentMeta, TreeNode } from "@/features/content/core/types";

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
function node(slug: string, children: TreeNode[] = []): TreeNode {
  return { title: slug, slug, weight: 1, isSection: true, children };
}

describe("buildCourseHeaderData", () => {
  const map = new Map<string, ContentMeta>([
    [
      "en:learn/courses/sql-essentials",
      meta("learn/courses/sql-essentials", {
        category: "data-and-databases",
        format: "by-example",
        estimatedHours: 8,
        description: "Model data in tables and query it well.",
      }),
    ],
    [
      "en:learn/courses/sql-essentials/learning/overview",
      meta("learn/courses/sql-essentials/learning/overview", { isSection: false }),
    ],
  ]);
  const tree: TreeNode[] = [
    node("learn/courses/sql-essentials", [
      node("learn/courses/sql-essentials/learning", [
        {
          title: "Overview",
          slug: "learn/courses/sql-essentials/learning/overview",
          weight: 1,
          isSection: false,
          children: [],
        },
      ]),
    ]),
  ];

  it("returns null when the course meta is missing", () => {
    expect(buildCourseHeaderData(map, tree, "nope", "en")).toBeNull();
  });

  it("looks up the category and resolves the Start slug through the tree", () => {
    const data = buildCourseHeaderData(map, tree, "sql-essentials", "en");
    expect(data?.category?.id).toBe("data-and-databases");
    expect(data?.startSlug).toBe("learn/courses/sql-essentials/learning/overview");
    expect(data?.isOutline).toBe(false);
  });
});
