import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Real-IO bindings for the course-content-hygiene scenarios that read the authored course tree on
// disk. The unit binding in tests/unit/be-steps/course-content-hygiene.steps.ts proves the same
// checks against an in-memory library.

const COURSES_RELATIVE = "content/en/learn/courses";
const COURSES_ROOT = path.join(process.cwd(), COURSES_RELATIVE);
/** The course that cites sources and must present them under a heading headlined "References". */
const CITING_COURSE_RELATIVE_PATH = `${COURSES_RELATIVE}/search-and-information-retrieval/overview.md`;

// Internal verification markers that must never reach published course pages: the five zero-hit
// patterns of tech-docs §4.4's References conversion rule (verification list).
const ACCURACY_MARKER_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: "accuracy-note-text", pattern: /accuracy\s+note/iu },
  { name: "accuracy-notes-anchor", pattern: /#accuracy-notes/u },
  { name: "unverified-tag", pattern: /\[Unverified\]/u },
  { name: "needs-verification-tag", pattern: /\[Needs\s+Verification\]/u },
  { name: "verified-tag", pattern: /\[Verified\b[^\]]*\]/u },
];

interface CourseFile {
  relativePath: string;
  content: string;
}

/** Every file under the published course tree, read in full, with its path from the repository root. */
function readCourseFiles(): CourseFile[] {
  const files: CourseFile[] = [];
  const walk = (relative: string) => {
    for (const entry of fs.readdirSync(path.join(COURSES_ROOT, relative), { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walk(path.posix.join(relative, entry.name));
        continue;
      }
      files.push({
        relativePath: path.posix.join(COURSES_RELATIVE, relative, entry.name),
        content: fs.readFileSync(path.join(COURSES_ROOT, relative, entry.name), "utf8"),
      });
    }
  };
  walk("");
  return files;
}

describe("course content hygiene (real course library)", () => {
  // @scenario specs/apps/ayokoding/www/behaviours/frontend/content/course-content-hygiene.feature: No course page shows an accuracy note or internal confidence tag
  it("no course page shows an accuracy note or internal confidence tag", () => {
    const courseFiles = readCourseFiles();
    expect(courseFiles.length, "no course files walked").toBeGreaterThan(0);

    const offenders = courseFiles.flatMap(({ relativePath, content }) =>
      ACCURACY_MARKER_PATTERNS.filter(({ pattern }) => pattern.test(content)).map(
        ({ name }) => `  - ${relativePath}: ${name}`,
      ),
    );
    expect(
      offenders.length,
      `${offenders.length} internal-marker hits across ${courseFiles.length} course files:\n` + offenders.join("\n"),
    ).toBe(0);
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/content/course-content-hygiene.feature: Cited sources sit under a References heading
  it("a course that cites sources shows them under a References heading", () => {
    const courseFiles = readCourseFiles();
    expect(courseFiles.length, "no course files walked").toBeGreaterThan(0);

    const citingCourse = courseFiles.find((file) => file.relativePath === CITING_COURSE_RELATIVE_PATH);
    expect(citingCourse, "the citing course page was not walked").toBeDefined();
    expect(citingCourse?.content).toContain("## References");
  });
});
