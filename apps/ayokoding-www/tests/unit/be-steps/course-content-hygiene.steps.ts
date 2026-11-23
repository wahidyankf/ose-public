import path from "node:path";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import matter from "gray-matter";
import { expect } from "vitest";

// plan (ayokoding-learn-revamp-01-navigation-and-display), Phase 3 RED (unit, S9) — step
// bindings for course-content-hygiene.feature's "The courses list page shows no course title with a leading catalogue number"
// scenario. The unit binding reads an in-memory stand-in for the published library, so the checks
// run hermetically; the real library is read by
// tests/integration/features/content/course-content-hygiene.integration.test.ts.

const feature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/frontend/content/course-content-hygiene.feature",
  ),
);

/** A stale catalogue number (a leading two-digit index and middle dot) — tech-docs §4.1's closed list. */
const CATALOGUE_NUMBERED_TITLE = /^\d+\s*·\s/u;
/** A stale pass number (a leading pass index) — tech-docs §4.1's closed list. */
const PASS_NUMBERED_TITLE = /^Pass \d+ /u;

// Internal verification markers that must never reach published course pages — the five
// zero-hit patterns of tech-docs §4.4's References conversion rule (verification list).
const ACCURACY_MARKER_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: "accuracy-note-text", pattern: /accuracy\s+note/iu },
  { name: "accuracy-notes-anchor", pattern: /#accuracy-notes/u },
  { name: "unverified-tag", pattern: /\[Unverified\]/u },
  { name: "needs-verification-tag", pattern: /\[Needs\s+Verification\]/u },
  { name: "verified-tag", pattern: /\[Verified\b[^\]]*\]/u },
];

const COURSES_ROOT = "content/en/learn/courses";
/** The course that cites sources and must present them under a heading headlined "References". */
const CITING_COURSE_RELATIVE_PATH = `${COURSES_ROOT}/search-and-information-retrieval/overview.md`;
const COURSE_INDEX = new RegExp(`^${COURSES_ROOT}/([^/]+)/_index\\.md$`, "u");

/**
 * The in-memory stand-in for the published English course library: relative path to file text.
 * Every course root carries its `_index.md`, and the citing course carries a References heading.
 */
const LIBRARY: Readonly<Record<string, string>> = {
  [`${COURSES_ROOT}/_index.md`]: [
    "---",
    'title: "Courses"',
    "---",
    "",
    "- [Just Enough Python](/en/learn/courses/just-enough-python)",
    "- [Search and Information Retrieval](/en/learn/courses/search-and-information-retrieval)",
    "",
  ].join("\n"),
  [`${COURSES_ROOT}/just-enough-python/_index.md`]: '---\ntitle: "Just Enough Python"\n---\n\nWrite small programs.\n',
  [`${COURSES_ROOT}/just-enough-python/learning/overview.md`]: '---\ntitle: "Overview"\n---\n\nSyntax first.\n',
  [`${COURSES_ROOT}/search-and-information-retrieval/_index.md`]:
    '---\ntitle: "Search and Information Retrieval"\n---\n\nFind the right documents.\n',
  [CITING_COURSE_RELATIVE_PATH]:
    '---\ntitle: "Overview"\n---\n\nIndexes and ranking.\n\n## References\n\n- Manning, Raghavan, and Schütze.\n',
};

interface CourseTitleReading {
  slug: string;
  title: string;
}

interface CourseFile {
  relativePath: string;
  content: string;
}

function isNumberedTitle(title: string): boolean {
  return CATALOGUE_NUMBERED_TITLE.test(title) || PASS_NUMBERED_TITLE.test(title);
}

function publishedCourseSlugs(): string[] {
  return Object.keys(LIBRARY).flatMap((relativePath) => COURSE_INDEX.exec(relativePath)?.[1] ?? []);
}

function readCourseTitle(slug: string): CourseTitleReading {
  const { data } = matter(LIBRARY[`${COURSES_ROOT}/${slug}/_index.md`] ?? "");
  return { slug, title: typeof data.title === "string" ? data.title : "" };
}

/** Every file under the library, with its path from the repository root. */
function readCourseFiles(): CourseFile[] {
  return Object.entries(LIBRARY).map(([relativePath, content]) => ({ relativePath, content }));
}

describeFeature(feature, ({ Scenario }) => {
  // @scenario specs/apps/ayokoding/www/behaviours/frontend/content/course-content-hygiene.feature: The courses list page shows no course title with a leading catalogue number
  Scenario(
    "The courses list page shows no course title with a leading catalogue number",
    ({ Given, When, Then, And }) => {
      let slugs: string[] = [];
      let titleReadings: CourseTitleReading[] = [];

      Given("the published English course library", () => {
        slugs = publishedCourseSlugs();
      });

      When("its course titles are read", () => {
        titleReadings = slugs.map(readCourseTitle);
      });

      Then("no course title starts with a catalogue number or a pass number", () => {
        const offenders = titleReadings.filter((reading) => isNumberedTitle(reading.title));
        expect(
          offenders.length,
          `${offenders.length} of ${titleReadings.length} course frontmatter titles still start with a catalogue number or a pass number:\n` +
            offenders.map((offender) => `  - ${offender.slug}: "${offender.title}"`).join("\n"),
        ).toBe(0);
      });

      And("the course list page shows every course title without a leading number", () => {
        const courseListSource = LIBRARY[`${COURSES_ROOT}/_index.md`] ?? "";
        // The courses section _index.md lists each course row as `- [Title](/en/learn/courses/<slug>)`;
        // two-space-indented rows are the courses' own sub-pages, not course titles.
        const courseListTitles = [...courseListSource.matchAll(/^- \[(.+?)\]\(\/en\/learn\/courses\/[^/)]+\)$/gmu)].map(
          (match) => match[1] ?? "",
        );
        expect(courseListTitles.length, "no course list rows read").toBeGreaterThan(0);
        const offenders = courseListTitles.filter(isNumberedTitle);
        expect(
          offenders.length,
          `${offenders.length} of ${courseListTitles.length} course list page titles still show a leading number:\n` +
            offenders.map((title) => `  - "${title}"`).join("\n"),
        ).toBe(0);
      });
    },
  );

  // plan (ayokoding-learn-revamp-01-navigation-and-display), Phase 6 RED (unit, S10) —
  // "No course page shows an accuracy note or internal confidence tag", walking every file under
  // content/en/learn/courses/** the way tech-docs §4.5 prescribes. RED until the Phase 6 References
  // conversion: 156 files still carried an internal marker.
  // @scenario specs/apps/ayokoding/www/behaviours/frontend/content/course-content-hygiene.feature: No course page shows an accuracy note or internal confidence tag
  Scenario("No course page shows an accuracy note or internal confidence tag", ({ Given, When, Then }) => {
    let courseFiles: CourseFile[] = [];

    Given("the published English course library", () => {
      courseFiles = readCourseFiles();
    });

    When("its course pages and example files are read", () => {
      expect(courseFiles.length, "no course files walked").toBeGreaterThan(0);
    });

    Then(
      'no course page shows an "Accuracy notes" section, an "Accuracy note" label, or an internal confidence tag',
      () => {
        const offenders = courseFiles.flatMap(({ relativePath, content }) =>
          ACCURACY_MARKER_PATTERNS.filter(({ pattern }) => pattern.test(content)).map(
            ({ name }) => `  - ${relativePath}: ${name}`,
          ),
        );
        expect(
          offenders.length,
          `${offenders.length} internal-marker hits across ${courseFiles.length} course files:\n` +
            offenders.join("\n"),
        ).toBe(0);
      },
    );
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/content/course-content-hygiene.feature: Cited sources sit under a References heading
  Scenario("Cited sources sit under a References heading", ({ Given, When, Then }) => {
    let courseFiles: CourseFile[] = [];

    Given("the published English course library", () => {
      courseFiles = readCourseFiles();
    });

    When("its course pages and example files are read", () => {
      expect(courseFiles.length, "no course files walked").toBeGreaterThan(0);
    });

    Then('a course that cites sources shows them under a "References" heading', () => {
      const citingCourse = courseFiles.find((file) => file.relativePath === CITING_COURSE_RELATIVE_PATH);
      expect(citingCourse, "the citing course page was not walked").toBeDefined();
      expect(citingCourse?.content).toContain("## References");
    });
  });
});
