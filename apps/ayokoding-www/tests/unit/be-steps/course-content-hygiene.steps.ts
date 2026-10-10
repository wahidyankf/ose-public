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

const COURSES_ROOT = "content/en/learn/courses";

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
});
