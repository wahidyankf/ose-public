import fs from "node:fs";
import path from "node:path";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import matter from "gray-matter";
import { expect } from "vitest";

// plan (ayokoding-learn-revamp-01-navigation-and-display), Phase 3 RED (unit, S9) — step
// bindings for course-content-hygiene.feature's "No course title carries a catalogue number"
// scenario, reading the real published content the way
// tests/unit/features/course-paths/manifests/careers/careers-se-manifests.unit.test.ts does
// (paths from process.cwd(), node:fs, gray-matter). RED until the Phase 3 title-strip codemod
// runs: 76 course titles still start with a catalogue or pass number.

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
const CITING_COURSE_RELATIVE_PATH = "search-and-information-retrieval/overview.md";

interface CourseTitleReading {
  slug: string;
  title: string;
}

function isNumberedTitle(title: string): boolean {
  return CATALOGUE_NUMBERED_TITLE.test(title) || PASS_NUMBERED_TITLE.test(title);
}

function publishedCourseSlugs(): string[] {
  return fs
    .readdirSync(path.join(process.cwd(), COURSES_ROOT), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function readCourseTitle(slug: string): CourseTitleReading {
  const raw = fs.readFileSync(path.join(process.cwd(), COURSES_ROOT, slug, "_index.md"), "utf8");
  const { data } = matter(raw);
  return { slug, title: typeof data.title === "string" ? data.title : "" };
}

describeFeature(feature, ({ Scenario }) => {
  Scenario("No course title carries a catalogue number", ({ Given, When, Then, And }) => {
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
      const courseListSource = fs.readFileSync(path.join(process.cwd(), COURSES_ROOT, "_index.md"), "utf8");
      // The courses section _index.md lists each course row as `- [Title](/en/learn/courses/<slug>)`;
      // two-space-indented rows are the courses' own sub-pages, not course titles.
      const courseListTitles = [...courseListSource.matchAll(/^- \[(.+?)\]\(\/en\/learn\/courses\/[^/)]+\)$/gmu)].map(
        (match) => match[1] ?? "",
      );
      const offenders = courseListTitles.filter(isNumberedTitle);
      expect(
        offenders.length,
        `${offenders.length} of ${courseListTitles.length} course list page titles still show a leading number:\n` +
          offenders.map((title) => `  - "${title}"`).join("\n"),
      ).toBe(0);
    });
  });

  // plan (ayokoding-learn-revamp-01-navigation-and-display), Phase 6 RED (unit, S10) —
  // "Courses cite sources in a References section without internal verification tags", walking
  // every file under content/en/learn/courses/** the way tech-docs §4.5 prescribes. RED until the
  // Phase 6 References conversion: 156 files still carry an internal marker.
  Scenario(
    "Courses cite sources in a References section without internal verification tags",
    ({ Given, When, Then, And }) => {
      let courseFiles: Array<{ relativePath: string; content: string }> = [];

      Given("the published English course library", () => {
        courseFiles = [];
        const root = path.join(process.cwd(), COURSES_ROOT);
        const walk = (relative: string) => {
          for (const entry of fs.readdirSync(path.join(root, relative), { withFileTypes: true })) {
            if (entry.isDirectory()) {
              walk(path.posix.join(relative, entry.name));
              continue;
            }
            courseFiles.push({
              relativePath: path.posix.join(COURSES_ROOT, relative, entry.name),
              content: fs.readFileSync(path.join(root, relative, entry.name), "utf8"),
            });
          }
        };
        walk("");
      });

      When("its course pages and example files are read", () => {
        expect(courseFiles.length, "no course files walked").toBeGreaterThan(0);
      });

      Then(
        'no file contains an "Accuracy notes" section, an "Accuracy note" label, or an internal confidence tag',
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

      And('a course that cites sources shows them under a "References" heading', () => {
        const citingCourse = courseFiles.find(
          (file) => file.relativePath === path.posix.join(COURSES_ROOT, CITING_COURSE_RELATIVE_PATH),
        );
        expect(citingCourse, "the citing course page was not walked").toBeDefined();
        expect(citingCourse?.content).toContain("## References");
      });
    },
  );
});
