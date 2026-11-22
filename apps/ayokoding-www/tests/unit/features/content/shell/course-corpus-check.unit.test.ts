import { describe, it, expect } from "vitest";
import { checkCourseCorpus, formatCorpusFailure } from "../../../../../src/features/content/shell/course-corpus-check";
import { memoryFileSystem } from "./memory-file-system";

// The real-disk version of these cases is tests/integration/features/content/shell/course-corpus-check.integration.test.ts.
const ROOT = "/site";
const COURSES = `${ROOT}/en/learn/courses`;

/** One course's files in the in-memory tree: its `_index.md`, and a learning page that is its Start page. */
function courseFiles(slug: string, frontmatter: string, body = "Hello brave new world."): Record<string, string> {
  const dir = `${COURSES}/${slug}`;
  return {
    [`${dir}/_index.md`]: `---\ntitle: "${slug}"\n${frontmatter}\n---\n`,
    [`${dir}/learning/overview.md`]: `---\ntitle: "Overview"\n---\n\n${body}\n`,
  };
}

const COURSES_INDEX = { [`${COURSES}/_index.md`]: '---\ntitle: "Courses"\n---\n' };

describe("formatCorpusFailure", () => {
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

describe("checkCourseCorpus (in-memory file system)", () => {
  it("reports a clean course, a stale estimate, and a missing field, sorted", async () => {
    const io = memoryFileSystem({
      ...COURSES_INDEX,
      ...courseFiles(
        "clean-course",
        'category: data-and-databases\ndescription: "Model data in tables and query it well."\nformat: by-example\nestimatedHours: 1',
      ),
      ...courseFiles(
        "stale-course",
        'category: data-and-databases\ndescription: "Model data in tables and query it well."\nformat: by-example\nestimatedHours: 99',
      ),
      ...courseFiles(
        "missing-course",
        'description: "Model data in tables and query it well."\nformat: by-example\nestimatedHours: 1',
      ),
    });

    const report = await checkCourseCorpus(ROOT, "en", io);

    expect(report.expectedHours["clean-course"]).toBe(1);
    expect(report.problems.some((p) => p.startsWith("stale-course: estimatedHours: stored 99, expected 1"))).toBe(true);
    expect(report.problems.some((p) => p.startsWith("missing-course: category:"))).toBe(true);
    expect(report.problems.filter((p) => p.startsWith("clean-course:"))).toEqual([]);
    expect(report.problems).toEqual([...report.problems].sort());
  });

  it("flags a stale outline estimate and a course with no Start page", async () => {
    const io = memoryFileSystem({
      ...COURSES_INDEX,
      ...courseFiles(
        "outline-stale",
        'category: accounting\ndescription: "Learn the accounting equation and double entry basics."\nstatus: outline\nestimatedHours: 99',
      ),
      [`${COURSES}/lonely-course/_index.md`]:
        '---\ntitle: "lonely-course"\ncategory: data-and-databases\ndescription: "Model data in tables and query it well."\nformat: by-example\nestimatedHours: 1\n---\n',
    });

    const report = await checkCourseCorpus(ROOT, "en", io);

    expect(report.problems.some((p) => p.startsWith("outline-stale: estimatedHours: stored 99, expected "))).toBe(true);
    expect(report.problems).toContain("lonely-course: start: no Start page resolves");
  });

  it("reports a course whose index is unreadable, and an absent library as empty", async () => {
    // A course folder with no `_index.md` in it: reading the index fails, as a directory read does.
    const io = memoryFileSystem({ [`${COURSES}/broken-course/notes.txt`]: "no index here" });

    const report = await checkCourseCorpus(ROOT, "en", io);
    expect(report.problems.some((p) => p.startsWith("broken-course: _index.md: missing or unreadable"))).toBe(true);

    const empty = await checkCourseCorpus(`${ROOT}/no-library-here`, "en", io);
    expect(empty).toEqual({ problems: [], expectedHours: {} });
  });
});
