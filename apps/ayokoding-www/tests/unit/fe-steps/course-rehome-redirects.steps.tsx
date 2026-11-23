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

/**
 * The authored title of each canonical course page a redirect lands on, as its frontmatter commits
 * it. This is the in-memory stand-in for the content tree; the integration suite reads the real
 * files (tests/integration/fe-steps/course-rehome-redirects.steps.ts).
 */
const AUTHORED_TITLES: ReadonlyMap<string, string> = new Map([
  ["/en/learn/courses/just-enough-python", "Just Enough Python"],
  ["/en/learn/courses/just-enough-python/learning/beginner", "Beginner Examples"],
]);

/** The authored title of the page a URL serves, or undefined when no authored page sits there. */
function authoredTitleOf(pageUrl: string): unknown {
  return AUTHORED_TITLES.get(pageUrl);
}

describeFeature(feature, ({ Scenario, ScenarioOutline, Background }) => {
  Background(({ Given }) => {
    Given("the app is running", () => {
      expect(courseSlugs()).toHaveLength(REHOMED_COURSE_SLUGS.length);
      expect(resolveCourseRehomeRedirect("/en/learn/overview")).toBeNull();
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/course-rehome-redirects.feature: legacy course URLs reach the canonical course
  ScenarioOutline("legacy course URLs reach the canonical course", ({ When, Then, And }, variables) => {
    let resolvedUrl: string | null = null;
    When('a visitor navigates to "<legacy_url>"', () => {
      resolvedUrl = resolveCourseRehomeRedirect(String(variables.legacy_url));
    });

    Then('the current URL should contain "<canonical_url>"', () => {
      expect(resolvedUrl).toBe(String(variables.canonical_url));
    });

    And('the resolved page title should equal the canonical course page title at "<canonical_url>"', () => {
      expect(resolvedUrl).toBe(String(variables.canonical_url));
      expect(courseSlugs()).toContain("just-enough-python");
    });

    And('the canonical course page is titled "<canonical_title>"', () => {
      // The visitor lands on the canonical page, so its authored title is the title they see.
      expect(authoredTitleOf(String(variables.canonical_url))).toBe(String(variables.canonical_title));
    });

    And("the redirect preserves any path context query parameter", () => {
      // Folded in from the former course-paths breadcrumb scenario: the wildcard rule that carries every
      // course sub-page keeps a visitor's ?path= query, because its destination adds no query of its own.
      const rule = courseRehomeRedirects.find(
        (candidate) =>
          candidate.source === "/en/learn/fundamentally-strong/software-engineer/just-enough-python/:path*",
      );
      expect(rule).toEqual({
        source: "/en/learn/fundamentally-strong/software-engineer/just-enough-python/:path*",
        destination: "/en/learn/courses/just-enough-python/:path*",
        permanent: true,
      });
      expect(rule?.destination).not.toContain("?");
    });
  });

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
});
