import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { describe, expect, it } from "vitest";
import { frontmatterSchema } from "../../../../src/features/content/core/schemas";

const appRoot = process.cwd();
const coursesRoot = path.join(appRoot, "content/en/learn/courses");
const courseSlugs = fs
  .readdirSync(coursesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .toSorted();

function readMarkdownFilesRecursive(dir: string): string[] {
  const found: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...readMarkdownFilesRecursive(full));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      found.push(full);
    }
  }
  return found;
}

// Test code, not a product feature: the shipped site never counts words. This helper totals
// whitespace-split tokens across every `.md` file in a course directory so the guard below can
// tell skeleton courses (< 1000 words) from complete ones.
function countCourseWords(slug: string): number {
  return readMarkdownFilesRecursive(path.join(coursesRoot, slug))
    .map((file) => fs.readFileSync(file, "utf8"))
    .join("\n")
    .split(/\s+/)
    .filter((token) => token.length > 0).length;
}

describe("course frontmatter (outline-course-status)", () => {
  it("parses every course _index.md with the frontmatter schema", () => {
    const failures: string[] = [];
    for (const slug of courseSlugs) {
      const raw = fs.readFileSync(path.join(coursesRoot, slug, "_index.md"), "utf8");
      const parsed = frontmatterSchema.safeParse(matter(raw).data);
      if (!parsed.success) failures.push(slug);
    }
    expect(failures, `courses failing frontmatter parse: ${failures.join(", ")}`).toEqual([]);
  });

  it("marks every course under 1000 words with status outline", () => {
    const unmarked: string[] = [];
    for (const slug of courseSlugs) {
      if (countCourseWords(slug) < 1000) {
        const raw = fs.readFileSync(path.join(coursesRoot, slug, "_index.md"), "utf8");
        const frontmatter = frontmatterSchema.parse(matter(raw).data);
        if (frontmatter.status !== "outline") unmarked.push(slug);
      }
    }
    expect(unmarked, `courses under 1000 words without status outline: ${unmarked.join(", ")}`).toEqual([]);
  });
});
