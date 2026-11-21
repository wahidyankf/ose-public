import { existsSync, readFileSync, readdirSync } from "node:fs";
import path, { resolve } from "node:path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { REHOMED_COURSE_SLUGS } from "@/redirects/course-rehome";
import { integrationCaller } from "../be-steps/helpers/integration-caller";
import { contentFileFor, redirectResponseFor, type RedirectResponse } from "../be-steps/helpers/next-config-delivery";

const feature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/frontend/navigation/course-rehome-redirects.feature",
  ),
);

const coursesDir = resolve(process.cwd(), "content/en/learn/courses");

function authoredCourseIds(): string[] {
  return readdirSync(coursesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

const LEGACY_COURSE_URL = "/en/learn/fundamentally-strong/software-engineer/just-enough-python";
const CANONICAL_COURSE_URL = "/en/learn/courses/just-enough-python";

describeFeature(feature, ({ Scenario, ScenarioOutline, Background }) => {
  Background(({ Given }) => {
    Given("the app is running", async () => {
      await expect(integrationCaller.meta.health()).resolves.toEqual({ status: "ok" });
      expect(existsSync(coursesDir)).toBe(true);
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/course-rehome-redirects.feature: A legacy fundamentally-strong URL redirects to the canonical course URL
  Scenario("A legacy fundamentally-strong URL redirects to the canonical course URL", ({ When, Then }) => {
    let response: RedirectResponse | null = null;
    When('a visitor navigates to "/en/learn/fundamentally-strong/software-engineer/just-enough-python"', async () => {
      response = await redirectResponseFor(LEGACY_COURSE_URL);
    });

    Then('the current URL should contain "/en/learn/courses/just-enough-python"', () => {
      expect(response?.location).toBe(CANONICAL_COURSE_URL);
      expect(contentFileFor(response?.location ?? "")).not.toBeNull();
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/course-rehome-redirects.feature: A legacy fundamentally-strong deep sub-page URL redirects to its canonical course sub-page
  Scenario(
    "A legacy fundamentally-strong deep sub-page URL redirects to its canonical course sub-page",
    ({ When, Then }) => {
      let response: RedirectResponse | null = null;
      When(
        'a visitor navigates to "/en/learn/fundamentally-strong/software-engineer/just-enough-python/learning/beginner"',
        async () => {
          response = await redirectResponseFor(`${LEGACY_COURSE_URL}/learning/beginner`);
        },
      );

      Then('the current URL should contain "/en/learn/courses/just-enough-python/learning/beginner"', () => {
        expect(response?.location).toBe(`${CANONICAL_COURSE_URL}/learning/beginner`);
        expect(contentFileFor(response?.location ?? "")).not.toBeNull();
      });
    },
  );

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/course-rehome-redirects.feature: The retired fundamentally-strong browse roots permanently redirect to the course library
  ScenarioOutline(
    "The retired fundamentally-strong browse roots permanently redirect to the course library",
    ({ When, Then, And }, variables) => {
      let response: RedirectResponse | null = null;
      When('a raw HTTP GET is made to "<legacy_url>" with redirects disabled', async () => {
        const legacyUrl = String(variables.legacy_url);
        expect(contentFileFor(legacyUrl)).toBeNull();
        response = await redirectResponseFor(legacyUrl);
      });

      Then("the response status should be 308", () => {
        expect(response?.status).toBe(308);
      });

      And('the response Location header should equal "/en/learn/courses"', () => {
        expect(response?.location).toBe("/en/learn/courses");
      });
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

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/course-rehome-redirects.feature: A course reached via its legacy course URL resolves to the single canonical course body
  Scenario(
    "A course reached via its legacy course URL resolves to the single canonical course body",
    ({ When, Then }) => {
      let response: RedirectResponse | null = null;
      When('a visitor navigates to "/en/learn/fundamentally-strong/software-engineer/just-enough-python"', async () => {
        response = await redirectResponseFor(LEGACY_COURSE_URL);
      });

      Then(
        'the resolved page title should equal the canonical course page title at "/en/learn/courses/just-enough-python"',
        () => {
          // The legacy URL holds no content of its own, so the visitor lands on the canonical page and its title.
          expect(contentFileFor(LEGACY_COURSE_URL)).toBeNull();
          expect(response?.location).toBe(CANONICAL_COURSE_URL);
          const canonicalFile = contentFileFor(CANONICAL_COURSE_URL);
          expect(canonicalFile).not.toBeNull();
          expect(readFileSync(canonicalFile ?? "", "utf8")).toMatch(/^title: "Just Enough Python"$/mu);
        },
      );
    },
  );
});
