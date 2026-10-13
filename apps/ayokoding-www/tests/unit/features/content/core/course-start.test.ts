import { describe, expect, it } from "vitest";
import { resolveCourseStartSlug } from "../../../../../src/features/content/core/course-start";
import type { TreeNode } from "../../../../../src/features/content/core/types";

function node(slug: string, weight: number, isSection: boolean, children: TreeNode[] = []): TreeNode {
  return { title: slug, slug, weight, isSection, children };
}

const real = (...slugs: string[]) => {
  const set = new Set(slugs);
  return (slug: string) => set.has(slug);
};

describe("resolveCourseStartSlug", () => {
  it("rule 1: prefers learning/overview", () => {
    const course = node("learn/courses/x", 1, true, [
      node("learn/courses/x/learning", 1, true, [
        node("learn/courses/x/learning/overview", 1, false),
        node("learn/courses/x/learning/beginner", 2, false),
      ]),
    ]);
    expect(
      resolveCourseStartSlug(course, real("learn/courses/x/learning/overview", "learn/courses/x/learning/beginner")),
    ).toBe("learn/courses/x/learning/overview");
  });

  it("rule 2: falls back to first learning leaf, skipping synthetic sections, weight tie by slug", () => {
    const course = node("learn/courses/x", 1, true, [
      node("learn/courses/x/learning", 1, true, [
        node("learn/courses/x/learning/artifacts", 0, true, [node("learn/courses/x/learning/artifacts/a", 0, false)]),
        node("learn/courses/x/learning/capstone", 1, true, [node("learn/courses/x/learning/capstone/start", 1, false)]),
      ]),
    ]);
    const isReal = real(
      "learn/courses/x/learning",
      "learn/courses/x/learning/capstone",
      "learn/courses/x/learning/capstone/start",
      "learn/courses/x/learning/artifacts/a",
    );
    expect(resolveCourseStartSlug(course, isReal)).toBe("learn/courses/x/learning/capstone/start");
  });

  it("rule 3: falls back to top-level overview", () => {
    const course = node("learn/courses/x", 1, true, [node("learn/courses/x/overview", 1, false)]);
    expect(resolveCourseStartSlug(course, real("learn/courses/x/overview"))).toBe("learn/courses/x/overview");
  });

  it("rule 4: returns null when nothing qualifies, without mutating the tree", () => {
    const course = node("learn/courses/x", 1, true, [node("learn/courses/x/learning", 1, true, [])]);
    const before = JSON.stringify(course);
    expect(resolveCourseStartSlug(course, real())).toBeNull();
    expect(JSON.stringify(course)).toBe(before);
  });
});
