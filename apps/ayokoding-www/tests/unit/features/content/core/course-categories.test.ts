import { describe, expect, it } from "vitest";
import {
  COURSE_CATEGORIES,
  COURSE_CATEGORY_IDS,
  groupByCourseCategory,
} from "../../../../../src/features/content/core/course-categories";

describe("COURSE_CATEGORIES", () => {
  it("lists the 14 ids in tech-docs/003 order", () => {
    expect(COURSE_CATEGORY_IDS).toEqual([
      "tools-and-practices",
      "programming-languages",
      "computer-science",
      "application-development",
      "data-and-databases",
      "systems-and-networking",
      "architecture-and-distributed-systems",
      "infrastructure-and-operations",
      "security",
      "ai-engineering",
      "product-and-leadership",
      "interview-preparation",
      "accounting",
      "erp-systems",
    ]);
    expect(COURSE_CATEGORIES.map((c) => c.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
  });
});

describe("groupByCourseCategory", () => {
  const items = [
    { id: "b", category: "data-and-databases" },
    { id: "a", category: "tools-and-practices" },
    { id: "c", category: "data-and-databases" },
  ];

  it("returns groups in display order, skipping empty categories", () => {
    const groups = groupByCourseCategory(items, (i) => i.category);
    expect(groups.map((g) => g.category?.id)).toEqual(["tools-and-practices", "data-and-databases"]);
    expect(groups[1]!.items.map((i) => i.id)).toEqual(["b", "c"]);
  });

  it("puts unknown or missing categories in a final Other group", () => {
    const groups = groupByCourseCategory(
      [...items, { id: "z", category: "nope" }, { id: "y", category: undefined as unknown as string }],
      (i) => i.category,
    );
    expect(groups[groups.length - 1]!.category).toBeNull();
    expect(groups[groups.length - 1]!.items.map((i) => i.id)).toEqual(["z", "y"]);
  });

  it("returns no groups for no items", () => {
    expect(groupByCourseCategory([], (i: { category?: string }) => i.category)).toEqual([]);
  });
});
