import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { checkCourseMetadata } from "../core/course-metadata";
import { estimateCourseHours } from "../core/course-effort";
import { resolveCourseStartSlug } from "../core/course-start";
import { buildTrees, findSubtree } from "../core/tree-builder";
import { FileSystemContentRepository } from "./repository-fs";
import { scanCourseEffort } from "./course-effort-scan";

/**
 * The real-corpus guard (tech-docs/006): reads every course in `content/<locale>/learn/courses`,
 * strictly validates its frontmatter, recomputes its estimated hours, and checks that a Start
 * page resolves. Problems are `"<courseId>: <field>: <message>"` lines, sorted.
 */
export interface CourseCorpusReport {
  problems: string[];
  /** Every course that is not an outline: courseId -> expected estimatedHours. */
  expectedHours: Record<string, number>;
}

export async function checkCourseCorpus(contentDir: string, locale: "en" = "en"): Promise<CourseCorpusReport> {
  const coursesDir = path.join(contentDir, locale, "learn", "courses");
  const repository = new FileSystemContentRepository(contentDir);
  const allContent = await repository.readAllContent();
  const trees = buildTrees(allContent);
  const tree = trees[locale] ?? [];
  const contentMap = new Map(allContent.map((meta) => [`${meta.locale}:${meta.slug}`, meta] as const));
  const isRealPage = (slug: string) => contentMap.has(`${locale}:${slug}`);

  const problems: string[] = [];
  const expectedHours: Record<string, number> = {};

  let courseIds: string[] = [];
  try {
    const entries = await fs.readdir(coursesDir, { withFileTypes: true });
    courseIds = entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
  } catch {
    courseIds = [];
  }

  for (const courseId of courseIds) {
    const indexPath = path.join(coursesDir, courseId, "_index.md");
    let frontmatter: Record<string, unknown> = {};
    try {
      const raw = await fs.readFile(indexPath, "utf-8");
      frontmatter = matter(raw).data as Record<string, unknown>;
    } catch {
      problems.push(`${courseId}: _index.md: missing or unreadable`);
      continue;
    }

    for (const issue of checkCourseMetadata(courseId, frontmatter)) {
      problems.push(`${issue.courseId}: ${issue.field}: ${issue.message}`);
    }

    const isOutline = frontmatter["status"] === "outline";
    if (!isOutline) {
      const counts = await scanCourseEffort(path.join(coursesDir, courseId));
      const expected = estimateCourseHours(counts);
      expectedHours[courseId] = expected;
      const stored = frontmatter["estimatedHours"];
      if (typeof stored === "number" && stored !== expected) {
        problems.push(`${courseId}: estimatedHours: stored ${stored}, expected ${expected}`);
      }
    } else if (typeof frontmatter["estimatedHours"] === "number") {
      const counts = await scanCourseEffort(path.join(coursesDir, courseId));
      const expected = estimateCourseHours(counts);
      if (frontmatter["estimatedHours"] !== expected) {
        problems.push(`${courseId}: estimatedHours: stored ${frontmatter["estimatedHours"]}, expected ${expected}`);
      }
    }

    const courseNode = findSubtree(tree, `learn/courses/${courseId}`);
    const start = courseNode ? resolveCourseStartSlug(courseNode, isRealPage) : null;
    if (start === null) {
      problems.push(`${courseId}: start: no Start page resolves`);
    }
  }

  problems.sort();
  return { problems, expectedHours };
}

/** The drift-test failure message (tech-docs/004): problems, then the expected-hours table. */
export function formatCorpusFailure(report: CourseCorpusReport): string {
  const lines: string[] = [];
  lines.push(`Course metadata check failed for ${new Set(report.problems.map((p) => p.split(":")[0])).size} courses:`);
  lines.push(...report.problems);
  lines.push("Expected estimatedHours for every non-outline course:");
  for (const courseId of Object.keys(report.expectedHours).sort()) {
    lines.push(`${courseId} ${report.expectedHours[courseId]}`);
  }
  return lines.join("\n");
}
