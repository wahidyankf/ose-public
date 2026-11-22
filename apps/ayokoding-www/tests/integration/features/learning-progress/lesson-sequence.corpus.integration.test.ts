import { describe, expect, it } from "vitest";
import { resolveCourseStartSlug } from "@/features/content/core/course-start";
import { buildLessonSequence } from "@/features/learning-progress/core/lesson-sequence";
import { countSyntheticPages, loadRealCourseTree } from "./corpus-tree";

const corpus = await loadRealCourseTree();

describe("lesson-sequence corpus", () => {
  it("gives every real course a sequence that starts at plan 03's start page, with no repeated page path", () => {
    const problems: string[] = [];
    let pageCount = 0;
    let syntheticPageCount = 0;

    for (const courseId of corpus.courseIds) {
      const courseNode = corpus.courseNode(courseId);
      if (courseNode === null) {
        problems.push(`${courseId}: no course subtree under learn/courses/${courseId} in the content tree`);
        continue;
      }

      const startSlug = resolveCourseStartSlug(courseNode, corpus.isRealPage);
      const sequence = buildLessonSequence(courseNode, corpus.isRealPage, startSlug);

      if (sequence.length === 0) {
        problems.push(`${courseId}: empty lesson sequence (start slug ${startSlug ?? "unresolved"})`);
        continue;
      }

      if (sequence[0]?.slug !== startSlug) {
        problems.push(`${courseId}: first page ${sequence[0]?.slug ?? "none"} is not the start slug ${startSlug}`);
      }

      const pagePaths = sequence.map((page) => page.pagePath);
      const repeated = [...new Set(pagePaths.filter((pagePath, index) => pagePaths.indexOf(pagePath) !== index))];
      if (repeated.length > 0) {
        problems.push(`${courseId}: repeated page path ${repeated.join(", ")}`);
      }

      pageCount += sequence.length;
      syntheticPageCount += countSyntheticPages(courseNode, corpus.isRealPage);
    }

    console.log(
      `lesson-sequence corpus: courses=${corpus.courseIds.length} pages=${pageCount} ` +
        `skippedSyntheticPages=${syntheticPageCount}`,
    );

    expect(problems, problems.join("\n")).toEqual([]);
    expect(corpus.courseIds.length).toBeGreaterThan(0);
    expect(pageCount).toBeGreaterThan(0);
  });
});
