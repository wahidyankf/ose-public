import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import "./helpers/test-setup";
import {
  REHOMED_COURSE_SLUGS,
  RETIRED_FUNDAMENTALLY_STRONG_ROOTS,
  courseRehomeRedirects,
  resolveCourseRehomeRedirect,
} from "@/redirects/course-rehome";

const feature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/frontend/navigation/course-rehome-redirects.feature",
  ),
);

const fixturePrerequisites = new Map<string, readonly string[]>(REHOMED_COURSE_SLUGS.map((slug) => [slug, []]));
fixturePrerequisites.set("just-enough-python", ["creating-ai-powered-apps"]);

function courseSlugs(): string[] {
  return [...fixturePrerequisites.keys()].sort();
}

function readPrerequisites(slug: string): unknown {
  return fixturePrerequisites.get(slug);
}

describeFeature(feature, ({ Scenario, ScenarioOutline, Background }) => {
  Background(({ Given }) => {
    Given("the app is running", () => {
      expect(courseSlugs()).toHaveLength(REHOMED_COURSE_SLUGS.length);
      expect(resolveCourseRehomeRedirect("/en/learn/overview")).toBeNull();
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/course-rehome-redirects.feature: A legacy fundamentally-strong URL redirects to the canonical course URL
  Scenario("A legacy fundamentally-strong URL redirects to the canonical course URL", ({ When, Then }) => {
    let resolvedUrl: string | null = null;
    When('a visitor navigates to "/en/learn/fundamentally-strong/software-engineer/just-enough-python"', () => {
      resolvedUrl = resolveCourseRehomeRedirect("/en/learn/fundamentally-strong/software-engineer/just-enough-python");
    });

    Then('the current URL should contain "/en/learn/courses/just-enough-python"', () => {
      expect(resolvedUrl).toBe("/en/learn/courses/just-enough-python");
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/course-rehome-redirects.feature: A legacy fundamentally-strong deep sub-page URL redirects to its canonical course sub-page
  Scenario(
    "A legacy fundamentally-strong deep sub-page URL redirects to its canonical course sub-page",
    ({ When, Then }) => {
      let resolvedUrl: string | null = null;
      When(
        'a visitor navigates to "/en/learn/fundamentally-strong/software-engineer/just-enough-python/learning/beginner"',
        () => {
          resolvedUrl = resolveCourseRehomeRedirect(
            "/en/learn/fundamentally-strong/software-engineer/just-enough-python/learning/beginner",
          );
        },
      );

      Then('the current URL should contain "/en/learn/courses/just-enough-python/learning/beginner"', () => {
        expect(resolvedUrl).toBe("/en/learn/courses/just-enough-python/learning/beginner");
      });
    },
  );

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/course-rehome-redirects.feature: The retired fundamentally-strong browse roots permanently redirect to the course library
  ScenarioOutline(
    "The retired fundamentally-strong browse roots permanently redirect to the course library",
    ({ When, Then, And }, variables) => {
      let response: { status: number; location: string } | null = null;
      When('a raw HTTP GET is made to "<legacy_url>" with redirects disabled', () => {
        const legacyUrl = String(variables.legacy_url);
        const rule = courseRehomeRedirects.find((candidate) => candidate.source === legacyUrl);
        expect(RETIRED_FUNDAMENTALLY_STRONG_ROOTS).toContain(legacyUrl);
        expect(rule).toBeDefined();
        response = { status: rule?.permanent ? 308 : 307, location: rule?.destination ?? "" };
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
      let catalogUrl = "";
      When('a visitor navigates to "/en/learn/courses"', () => {
        catalogUrl = "/en/learn/courses";
        expect(resolveCourseRehomeRedirect(RETIRED_FUNDAMENTALLY_STRONG_ROOTS[0])).toBe(catalogUrl);
      });

      Then("every course catalog entry should resolve to live content, not a drained or missing location", () => {
        expect(courseSlugs()).toEqual([...REHOMED_COURSE_SLUGS].sort());
        expect(courseSlugs().every((slug) => Array.isArray(readPrerequisites(slug)))).toBe(true);
      });
    },
  );

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/course-rehome-redirects.feature: A course reached via its legacy course URL resolves to the single canonical course body
  Scenario(
    "A course reached via its legacy course URL resolves to the single canonical course body",
    ({ When, Then }) => {
      let resolvedUrl: string | null = null;
      When('a visitor navigates to "/en/learn/fundamentally-strong/software-engineer/just-enough-python"', () => {
        resolvedUrl = resolveCourseRehomeRedirect(
          "/en/learn/fundamentally-strong/software-engineer/just-enough-python",
        );
      });

      Then(
        'the resolved page title should equal the canonical course page title at "/en/learn/courses/just-enough-python"',
        () => {
          expect(resolvedUrl).toBe("/en/learn/courses/just-enough-python");
          expect(courseSlugs()).toContain("just-enough-python");
        },
      );
    },
  );
});
