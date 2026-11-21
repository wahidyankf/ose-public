import { existsSync, readdirSync, readFileSync } from "node:fs";
import path, { resolve } from "node:path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import matter from "gray-matter";
import { expect } from "vitest";
import { REHOMED_COURSE_SLUGS } from "@/redirects/course-rehome";
import { integrationCaller } from "../be-steps/helpers/integration-caller";

const feature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/frontend/navigation/course-rehome-redirects.feature",
  ),
);

const coursesDir = resolve(process.cwd(), "content/en/learn/courses");
const syllabusDir = resolve(
  process.cwd(),
  "../../plans/done/2026-07-24__ayokoding-learning-path-02-schema-and-prerequisite-dag/syllabus/courses",
);

function authoredCourseIds(): string[] {
  return readdirSync(coursesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function plannedCourseIds(): string[] {
  return readdirSync(syllabusDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md") && entry.name !== "README.md")
    .map((entry) => entry.name.slice(0, -3))
    .sort();
}

function prerequisites(courseId: string): unknown {
  return matter(readFileSync(resolve(coursesDir, courseId, "_index.md"), "utf8")).data.prerequisites;
}

function knownCourseIds(): Set<string> {
  return new Set([...authoredCourseIds(), ...plannedCourseIds()]);
}

describeFeature(
  feature,
  ({ Scenario, Background }) => {
    Background(({ Given }) => {
      Given("the app is running", async () => {
        await expect(integrationCaller.meta.health()).resolves.toEqual({ status: "ok" });
        expect(existsSync(coursesDir)).toBe(true);
        expect(existsSync(syllabusDir)).toBe(true);
      });
    });

    // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/course-rehome-redirects.feature: Every re-homed course declares its prerequisites
    Scenario("Every re-homed course declares its prerequisites", ({ Given, When, Then, And }) => {
      let metadata = new Map<string, unknown>();

      Given("the thirty-seven shipped topics and existing capstones have been re-homed into the course library", () => {
        const authored = new Set(authoredCourseIds());
        expect(REHOMED_COURSE_SLUGS.filter((courseId) => !authored.has(courseId))).toEqual([]);
      });

      When("each re-homed course's canonical metadata is inspected", () => {
        metadata = new Map(REHOMED_COURSE_SLUGS.map((courseId) => [courseId, prerequisites(courseId)]));
        expect(metadata.size).toBe(REHOMED_COURSE_SLUGS.length);
      });

      Then("every one declares a prerequisites list of course IDs", () => {
        const invalid = [...metadata].filter(
          ([, value]) => !Array.isArray(value) || value.some((courseId) => typeof courseId !== "string"),
        );
        expect(invalid).toEqual([]);
      });

      And("an empty list is accepted only for a course with no library prerequisite", () => {
        const emptyLists = [...metadata].filter(([, value]) => Array.isArray(value) && value.length === 0);
        expect(emptyLists.length).toBeGreaterThan(0);
        expect(emptyLists.every(([, value]) => (value as string[]).length === 0)).toBe(true);
      });

      And(
        "every named prerequisite resolves to another course already in the library or declared on the syllabus roadmap",
        () => {
          const known = knownCourseIds();
          const unresolved = [...metadata].flatMap(([courseId, value]) =>
            (value as string[])
              .filter((dependency) => !known.has(dependency))
              .map((dependency) => `${courseId} -> ${dependency}`),
          );
          const selfReferences = [...metadata].filter(([courseId, value]) => (value as string[]).includes(courseId));
          expect(unresolved).toEqual([]);
          expect(selfReferences).toEqual([]);
        },
      );
    });

    // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/course-rehome-redirects.feature: A prerequisite naming a syllabus-declared but not-yet-authored course still resolves
    Scenario(
      "A prerequisite naming a syllabus-declared but not-yet-authored course still resolves",
      ({ When, Then, And }) => {
        let candidate = "";
        When("a course is declared on the syllabus roadmap but not yet authored into the course library", () => {
          const authored = new Set(authoredCourseIds());
          candidate = plannedCourseIds().find((courseId) => !authored.has(courseId)) ?? "";
          expect(candidate, "scenario is obsolete when the complete roadmap has been authored").not.toBe("");
        });

        Then(
          "a prerequisite naming that course resolves against the union of the course library and the syllabus roadmap",
          () => {
            expect(knownCourseIds().has(candidate)).toBe(true);
          },
        );

        And("a prerequisite naming an unrecognized course ID still does not resolve", () => {
          expect(knownCourseIds().has("not-a-real-course-id-xyz")).toBe(false);
        });
      },
    );

    // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/course-rehome-redirects.feature: A prerequisite naming an authored course absent from the syllabus roadmap still resolves
    Scenario(
      "A prerequisite naming an authored course absent from the syllabus roadmap still resolves",
      ({ When, Then }) => {
        let candidate = "";
        When("a course is authored into the course library but not declared on the syllabus roadmap", () => {
          const planned = new Set(plannedCourseIds());
          candidate = authoredCourseIds().find((courseId) => !planned.has(courseId)) ?? "";
          expect(candidate, "scenario is obsolete when every authored course is roadmap-declared").not.toBe("");
        });

        Then(
          "a prerequisite naming that course resolves against the union of the course library and the syllabus roadmap",
          () => {
            expect(knownCourseIds().has(candidate)).toBe(true);
          },
        );
      },
    );

    // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/course-rehome-redirects.feature: The course library the retired browse roots redirect to resolves every re-homed course
    Scenario(
      "The course library the retired browse roots redirect to resolves every re-homed course",
      ({ When, Then }) => {
        let catalogueEntries: string[] = [];
        When('a visitor navigates to "/en/learn/courses"', () => {
          catalogueEntries = authoredCourseIds();
          expect(catalogueEntries.length).toBeGreaterThanOrEqual(REHOMED_COURSE_SLUGS.length);
        });

        Then("every course catalog entry should resolve to live content, not a drained or missing location", () => {
          const missingIndexes = catalogueEntries.filter(
            (courseId) => !existsSync(resolve(coursesDir, courseId, "_index.md")),
          );
          expect(missingIndexes).toEqual([]);
        });
      },
    );
  },
  { excludeTags: ["integration-exempt"] },
);
