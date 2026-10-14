import { describe, expect, it } from "vitest";
import type { TreeNode } from "@/features/content/core/types";
import { buildLessonSequence } from "@/features/learning-progress/core/lesson-sequence";

function node(slug: string, weight: number, isSection: boolean, children: TreeNode[] = []): TreeNode {
  return { title: slug, slug, weight, isSection, children };
}

const real = (...slugs: string[]) => {
  const set = new Set(slugs);
  return (slug: string) => set.has(slug);
};

describe("buildLessonSequence", () => {
  it("walks depth-first, ordering siblings by weight then slug, and cuts at the start slug", () => {
    const course = node("learn/courses/x", 1, true, [
      node("learn/courses/x/overview", 1, false),
      node("learn/courses/x/learning", 2, true, [
        node("learn/courses/x/learning/artifacts", 0, true, [
          node("learn/courses/x/learning/artifacts/worked-example", 0, false),
        ]),
        node("learn/courses/x/learning/overview", 1, false),
        node("learn/courses/x/learning/beginner", 2, false),
        node("learn/courses/x/learning/capstone", 3, true, [
          node("learn/courses/x/learning/capstone/part-1", 1, false),
        ]),
      ]),
    ]);
    const isReal = real(
      "learn/courses/x/overview",
      "learn/courses/x/learning",
      "learn/courses/x/learning/overview",
      "learn/courses/x/learning/beginner",
      "learn/courses/x/learning/capstone",
      "learn/courses/x/learning/capstone/part-1",
      "learn/courses/x/learning/artifacts/worked-example",
    );

    const sequence = buildLessonSequence(course, isReal, "learn/courses/x/learning/overview");

    expect(sequence.map((page) => page.slug)).toEqual([
      "learn/courses/x/learning/overview",
      "learn/courses/x/learning/beginner",
      "learn/courses/x/learning/capstone/part-1",
    ]);
    expect(sequence[0]).toEqual({
      pagePath: "learning/overview",
      slug: "learn/courses/x/learning/overview",
      title: "learn/courses/x/learning/overview",
    });
  });

  it("orders siblings by weight", () => {
    const course = node("learn/courses/x", 1, true, [
      node("learn/courses/x/learning", 1, true, [
        node("learn/courses/x/learning/advanced", 3, false),
        node("learn/courses/x/learning/beginner", 1, false),
        node("learn/courses/x/learning/drilling", 2, false),
      ]),
    ]);
    const isReal = real(
      "learn/courses/x/learning",
      "learn/courses/x/learning/advanced",
      "learn/courses/x/learning/beginner",
      "learn/courses/x/learning/drilling",
    );

    expect(
      buildLessonSequence(course, isReal, "learn/courses/x/learning/beginner").map((page) => page.pagePath),
    ).toEqual(["learning/beginner", "learning/drilling", "learning/advanced"]);
  });

  it("breaks a weight tie by slug, not by file order", () => {
    const course = node("learn/courses/x", 1, true, [
      node("learn/courses/x/learning", 1, true, [
        node("learn/courses/x/learning/beta", 1, false),
        node("learn/courses/x/learning/alpha", 1, false),
      ]),
    ]);
    const isReal = real("learn/courses/x/learning", "learn/courses/x/learning/alpha", "learn/courses/x/learning/beta");

    expect(buildLessonSequence(course, isReal, "learn/courses/x/learning/alpha").map((page) => page.pagePath)).toEqual([
      "learning/alpha",
      "learning/beta",
    ]);
  });

  it("skips a synthetic section together with everything under it", () => {
    const course = node("learn/courses/x", 1, true, [
      node("learn/courses/x/learning", 1, true, [
        node("learn/courses/x/learning/artifacts", 0, true, [
          node("learn/courses/x/learning/artifacts/one", 1, false),
          node("learn/courses/x/learning/artifacts/nested", 2, true, [
            node("learn/courses/x/learning/artifacts/nested/two", 1, false),
          ]),
        ]),
        node("learn/courses/x/learning/beginner", 1, false),
      ]),
    ]);
    const isReal = real(
      "learn/courses/x/learning",
      "learn/courses/x/learning/beginner",
      "learn/courses/x/learning/artifacts/one",
      "learn/courses/x/learning/artifacts/nested/two",
    );

    expect(
      buildLessonSequence(course, isReal, "learn/courses/x/learning/beginner").map((page) => page.pagePath),
    ).toEqual(["learning/beginner"]);
  });

  it("drops every page before the start slug and keeps a root overview that is the start page", () => {
    const course = node("learn/courses/x", 1, true, [
      node("learn/courses/x/overview", 1, false),
      node("learn/courses/x/learning", 2, true, [node("learn/courses/x/learning/beginner", 1, false)]),
    ]);
    const isReal = real("learn/courses/x/overview", "learn/courses/x/learning", "learn/courses/x/learning/beginner");

    expect(
      buildLessonSequence(course, isReal, "learn/courses/x/learning/beginner").map((page) => page.pagePath),
    ).toEqual(["learning/beginner"]);
    expect(buildLessonSequence(course, isReal, "learn/courses/x/overview").map((page) => page.pagePath)).toEqual([
      "overview",
      "learning/beginner",
    ]);
  });

  it("returns an empty sequence when the start slug is null or resolves to no page", () => {
    const course = node("learn/courses/x", 1, true, [
      node("learn/courses/x/learning", 1, true, [node("learn/courses/x/learning/beginner", 1, false)]),
    ]);
    const isReal = real("learn/courses/x/learning", "learn/courses/x/learning/beginner");

    expect(buildLessonSequence(course, isReal, null)).toEqual([]);
    expect(buildLessonSequence(course, isReal, "learn/courses/x/learning/ghost")).toEqual([]);
  });

  it("skips a leaf page that is not real", () => {
    const course = node("learn/courses/x", 1, true, [
      node("learn/courses/x/learning", 1, true, [
        node("learn/courses/x/learning/ghost", 1, false),
        node("learn/courses/x/learning/beginner", 2, false),
      ]),
    ]);
    const isReal = real("learn/courses/x/learning", "learn/courses/x/learning/beginner");

    expect(
      buildLessonSequence(course, isReal, "learn/courses/x/learning/beginner").map((page) => page.pagePath),
    ).toEqual(["learning/beginner"]);
  });

  it("does not mutate the tree", () => {
    const course = node("learn/courses/x", 1, true, [
      node("learn/courses/x/learning", 1, true, [
        node("learn/courses/x/learning/beta", 1, false),
        node("learn/courses/x/learning/alpha", 1, false),
      ]),
    ]);
    const snapshot = JSON.stringify(course);

    buildLessonSequence(course, real("learn/courses/x/learning"), "learn/courses/x/learning/alpha");

    expect(JSON.stringify(course)).toBe(snapshot);
  });
});
