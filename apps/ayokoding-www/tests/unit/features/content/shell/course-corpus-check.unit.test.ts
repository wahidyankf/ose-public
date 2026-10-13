import { describe, it, expect } from "vitest";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkCourseCorpus, formatCorpusFailure } from "../../../../../src/features/content/shell/course-corpus-check";

async function writeCourse(root: string, slug: string, frontmatter: string, body = "Hello brave new world.") {
  const dir = join(root, "en", "learn", "courses", slug);
  await mkdir(join(dir, "learning"), { recursive: true });
  await writeFile(join(dir, "_index.md"), `---\ntitle: "${slug}"\n${frontmatter}\n---\n`);
  await writeFile(join(dir, "learning", "overview.md"), `---\ntitle: "Overview"\n---\n\n${body}\n`);
}

describe("checkCourseCorpus", () => {
  it("reports a clean course, a stale estimate, and a missing field, sorted", async () => {
    const root = await mkdtemp(join(tmpdir(), "corpus-check-"));
    try {
      await mkdir(join(root, "en", "learn", "courses"), { recursive: true });
      await writeFile(join(root, "en", "learn", "courses", "_index.md"), '---\ntitle: "Courses"\n---\n');
      await writeCourse(
        root,
        "clean-course",
        'category: data-and-databases\ndescription: "Model data in tables and query it well."\nformat: by-example\nestimatedHours: 1',
      );
      await writeCourse(
        root,
        "stale-course",
        'category: data-and-databases\ndescription: "Model data in tables and query it well."\nformat: by-example\nestimatedHours: 99',
      );
      await writeCourse(
        root,
        "missing-course",
        'description: "Model data in tables and query it well."\nformat: by-example\nestimatedHours: 1',
      );

      const report = await checkCourseCorpus(root);
      expect(report.expectedHours["clean-course"]).toBe(1);
      expect(report.problems.some((p) => p.startsWith("stale-course: estimatedHours: stored 99, expected 1"))).toBe(
        true,
      );
      expect(report.problems.some((p) => p.startsWith("missing-course: category:"))).toBe(true);
      expect(report.problems.filter((p) => p.startsWith("clean-course:"))).toEqual([]);
      expect(report.problems).toEqual([...report.problems].sort());
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("flags a stale outline estimate and a course with no Start page", async () => {
    const root = await mkdtemp(join(tmpdir(), "corpus-check-edge-"));
    try {
      await mkdir(join(root, "en", "learn", "courses"), { recursive: true });
      await writeFile(join(root, "en", "learn", "courses", "_index.md"), '---\ntitle: "Courses"\n---\n');
      await writeCourse(
        root,
        "outline-stale",
        'category: accounting\ndescription: "Learn the accounting equation and double entry basics."\nstatus: outline\nestimatedHours: 99',
      );
      const lonelyDir = join(root, "en", "learn", "courses", "lonely-course");
      await mkdir(lonelyDir, { recursive: true });
      await writeFile(
        join(lonelyDir, "_index.md"),
        '---\ntitle: "lonely-course"\ncategory: data-and-databases\ndescription: "Model data in tables and query it well."\nformat: by-example\nestimatedHours: 1\n---\n',
      );

      const report = await checkCourseCorpus(root);
      expect(report.problems.some((p) => p.startsWith("outline-stale: estimatedHours: stored 99, expected "))).toBe(
        true,
      );
      expect(report.problems).toContain("lonely-course: start: no Start page resolves");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("reports an unreadable course index and an empty missing library", async () => {
    const root = await mkdtemp(join(tmpdir(), "corpus-check-missing-"));
    try {
      const brokenDir = join(root, "en", "learn", "courses", "broken-course");
      await mkdir(join(brokenDir, "_index.md"), { recursive: true });

      const report = await checkCourseCorpus(root);
      expect(report.problems.some((p) => p.startsWith("broken-course: _index.md: missing or unreadable"))).toBe(true);

      const empty = await checkCourseCorpus(join(root, "no-library-here"));
      expect(empty).toEqual({ problems: [], expectedHours: {} });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("formats the drift failure with the course count, problems, and hours table", () => {
    expect(
      formatCorpusFailure({
        problems: ["b-course: category: bad", "a-course: format: bad"],
        expectedHours: { "b-course": 2 },
      }),
    ).toBe(
      "Course metadata check failed for 2 courses:\n" +
        "b-course: category: bad\n" +
        "a-course: format: bad\n" +
        "Expected estimatedHours for every non-outline course:\n" +
        "b-course 2",
    );
  });
});
