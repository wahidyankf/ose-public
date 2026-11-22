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

describeFeature(feature, ({ Scenario, ScenarioOutline, Background }) => {
  Background(({ Given }) => {
    Given("the app is running", async () => {
      await expect(integrationCaller.meta.health()).resolves.toEqual({ status: "ok" });
      expect(existsSync(coursesDir)).toBe(true);
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/course-rehome-redirects.feature: legacy course URLs reach the canonical course
  ScenarioOutline("legacy course URLs reach the canonical course", ({ When, Then, And }, variables) => {
    let response: RedirectResponse | null = null;
    When('a visitor navigates to "<legacy_url>"', async () => {
      response = await redirectResponseFor(String(variables.legacy_url));
    });

    Then('the current URL should contain "<canonical_url>"', () => {
      expect(response?.location).toBe(String(variables.canonical_url));
      expect(contentFileFor(response?.location ?? "")).not.toBeNull();
    });

    And('the resolved page title should equal the canonical course page title at "<canonical_url>"', () => {
      // The legacy URL holds no content of its own, so the visitor lands on the canonical page.
      expect(contentFileFor(String(variables.legacy_url))).toBeNull();
      expect(response?.location).toBe(String(variables.canonical_url));
      expect(contentFileFor(String(variables.canonical_url))).not.toBeNull();
    });

    And('the canonical course page is titled "<canonical_title>"', () => {
      const canonicalFile = contentFileFor(String(variables.canonical_url));
      expect(readFileSync(canonicalFile ?? "", "utf8")).toMatch(
        new RegExp(`^title: "${String(variables.canonical_title)}"$`, "mu"),
      );
    });

    And("the redirect preserves any path context query parameter", () => {
      // The redirect rule's destination adds no query, so Next.js keeps the visitor's own ?path= on the redirect.
      expect(response?.location).not.toContain("?");
    });
  });

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
});
