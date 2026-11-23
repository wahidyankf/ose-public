import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveCourseStartSlug } from "@/features/content/core/course-start";
import { PathManifestSchema } from "@/features/course-paths/core/schemas";
import { buildLessonSequence } from "@/features/learning-progress/core/lesson-sequence";
import { courseIdSchema, pagePathSchema, pathIdSchema } from "@/features/learning-progress/core/progress-schema";
import { loadRealCourseTree } from "./corpus-tree";

const appRoot = process.cwd();
const manifestsRoot = path.join(appRoot, "src/features/course-paths/manifests");

function listManifestFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listManifestFiles(fullPath));
    } else if (entry.name.endsWith(".json")) {
      files.push(fullPath);
    }
  }
  return files.sort();
}

const manifestPathIds = listManifestFiles(manifestsRoot).map(
  (file) => PathManifestSchema.parse(JSON.parse(fs.readFileSync(file, "utf8"))).pathId,
);

const corpus = await loadRealCourseTree();

describe("progress-schema corpus", () => {
  it("every real course directory name matches the course-id pattern", () => {
    const nonMatching = corpus.courseIds.filter((courseId) => !courseIdSchema.safeParse(courseId).success);
    expect(nonMatching, `course directories outside the course-id pattern: ${nonMatching.join(", ")}`).toEqual([]);
    expect(corpus.courseIds.length).toBeGreaterThan(0);
  });

  it("every lesson-sequence page path matches the page-path pattern", () => {
    const nonMatching: string[] = [];

    for (const courseId of corpus.courseIds) {
      const courseNode = corpus.courseNode(courseId);
      if (courseNode === null) {
        nonMatching.push(`${courseId}: no course subtree in the content tree`);
        continue;
      }

      const sequence = buildLessonSequence(
        courseNode,
        corpus.isRealPage,
        resolveCourseStartSlug(courseNode, corpus.isRealPage),
      );
      for (const page of sequence) {
        if (!pagePathSchema.safeParse(page.pagePath).success) {
          nonMatching.push(`${courseId}: ${page.pagePath}`);
        }
      }
    }

    expect(nonMatching, `page paths outside the page-path pattern: ${nonMatching.join(", ")}`).toEqual([]);
  });

  it("every published path id matches the path-id pattern", () => {
    const nonMatching = manifestPathIds.filter((pathId) => !pathIdSchema.safeParse(pathId).success);
    expect(nonMatching, `published path ids outside the path-id pattern: ${nonMatching.join(", ")}`).toEqual([]);
    expect(manifestPathIds.length).toBeGreaterThan(0);
  });
});
