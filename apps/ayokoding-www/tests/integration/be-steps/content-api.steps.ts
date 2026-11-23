import path from "node:path";
import fs from "node:fs/promises";
import { TRPCError } from "@trpc/server";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import type { TreeNode } from "@/features/content/core/types";
import { integrationCaller } from "./helpers/integration-caller";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ayokoding/www/behaviours/backend/content/content-api.feature"),
);

const SECTION_SLUG = "learn/courses/just-enough-go/learning";

function findNode(nodes: TreeNode[], slug: string): TreeNode | undefined {
  for (const node of nodes) {
    if (node.slug === slug) return node;
    const nested = findNode(node.children, slug);
    if (nested) return nested;
  }
  return undefined;
}

/** Reads the section's children through the named surface: listChildren returns them, getTree nests them under the section node. */
async function childrenThrough(surface: string): Promise<{ weight: number }[]> {
  if (surface === "content.listChildren") {
    return integrationCaller.content.listChildren({ locale: "en", parentSlug: SECTION_SLUG });
  }
  if (surface === "content.getTree") {
    const tree = (await integrationCaller.content.getTree({ locale: "en" })) as TreeNode[];
    return findNode(tree, SECTION_SLUG)?.children ?? [];
  }
  throw new Error(`unknown child-page surface: ${surface}`);
}

describeFeature(feature, ({ Scenario, ScenarioOutline, Background }) => {
  Background(({ Given }) => {
    Given("the API is running", async () => {
      await expect(integrationCaller.meta.health()).resolves.toEqual({ status: "ok" });
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/backend/content/content-api.feature: Get existing page by slug returns HTML, page metadata, and headings
  Scenario("Get existing page by slug returns HTML, page metadata, and headings", ({ Given, When, Then, And }) => {
    let result: Awaited<ReturnType<typeof integrationCaller.content.getBySlug>>;

    Given('a published page exists at slug "en/learn/courses/just-enough-go/learning/beginner"', async () => {
      await expect(
        integrationCaller.content.getBySlug({
          locale: "en",
          slug: "learn/courses/just-enough-go/learning/beginner",
        }),
      ).resolves.toMatchObject({ title: "Beginner Examples", draft: false });
    });
    When(
      'the client calls content.getBySlug with slug "en/learn/courses/just-enough-go/learning/beginner"',
      async () => {
        result = await integrationCaller.content.getBySlug({
          locale: "en",
          slug: "learn/courses/just-enough-go/learning/beginner",
        });
      },
    );
    Then('the response should contain a non-null "html" field', () => expect(result.html).toContain("<p>"));
    And("the response should contain the page metadata for the requested slug", () =>
      expect(result).toMatchObject({
        title: "Beginner Examples",
        slug: "learn/courses/just-enough-go/learning/beginner",
        locale: "en",
        weight: 10,
        draft: false,
        isSection: false,
      }),
    );
    And('the response should contain a non-null "headings" field', () =>
      expect(result.headings.length).toBeGreaterThan(0),
    );
  });

  // @scenario specs/apps/ayokoding/www/behaviours/backend/content/content-api.feature: Get existing page by slug returns previous and next links
  Scenario("Get existing page by slug returns previous and next links", ({ Given, When, Then, And }) => {
    let result: Awaited<ReturnType<typeof integrationCaller.content.getBySlug>>;

    Given('a published page exists at slug "en/learn/courses/just-enough-go/learning/beginner"', async () => {
      await expect(
        integrationCaller.content.getBySlug({
          locale: "en",
          slug: "learn/courses/just-enough-go/learning/beginner",
        }),
      ).resolves.toMatchObject({ title: "Beginner Examples", draft: false });
    });
    When(
      'the client calls content.getBySlug with slug "en/learn/courses/just-enough-go/learning/beginner"',
      async () => {
        result = await integrationCaller.content.getBySlug({
          locale: "en",
          slug: "learn/courses/just-enough-go/learning/beginner",
        });
      },
    );
    Then('the response should contain a "prev" navigation link', () =>
      expect(result.prev).toEqual({ title: "Overview", slug: "learn/courses/just-enough-go/learning/overview" }),
    );
    And('the response should contain a "next" navigation link', () =>
      expect(result.next).toEqual({
        title: "Intermediate Examples",
        slug: "learn/courses/just-enough-go/learning/intermediate",
      }),
    );
  });

  // @scenario specs/apps/ayokoding/www/behaviours/backend/content/content-api.feature: Get non-existent page by slug returns 404
  Scenario("Get non-existent page by slug returns 404", ({ When, Then }) => {
    let error: unknown;
    When('the client calls content.getBySlug with slug "en/does/not/exist"', async () => {
      try {
        await integrationCaller.content.getBySlug({ locale: "en", slug: "does/not/exist" });
      } catch (caught) {
        error = caught;
      }
    });
    Then("the response should indicate the page was not found", () => {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("NOT_FOUND");
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/backend/content/content-api.feature: Draft pages are excluded from content retrieval
  Scenario("Draft pages are excluded from content retrieval", ({ Given, When, Then }) => {
    let error: unknown;
    Given('a draft page exists at slug "en/learn/paths/skills/e2e-fixture-alpha"', async () => {
      const source = await fs.readFile(
        path.resolve(process.cwd(), "content/en/learn/paths/skills/e2e-fixture-alpha/_index.md"),
        "utf8",
      );
      expect(source).toMatch(/^---[\s\S]*\ndraft: true\n/);
    });
    When('the client calls content.getBySlug with slug "en/learn/paths/skills/e2e-fixture-alpha"', async () => {
      try {
        await integrationCaller.content.getBySlug({ locale: "en", slug: "learn/paths/skills/e2e-fixture-alpha" });
      } catch (caught) {
        error = caught;
      }
    });
    Then("the response should indicate the page was not found", () => {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("NOT_FOUND");
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/backend/content/content-api.feature: Child pages are ordered by weight ascending through <surface>
  ScenarioOutline(
    "Child pages are ordered by weight ascending through <surface>",
    ({ Given, When, Then, And }, examples) => {
      const surface = String(examples["surface"]);
      let result: { weight: number }[];
      Given(
        'a section exists at slug "en/learn/courses/just-enough-go/learning" with child pages weighted 30, 1, 100, 20, and 10',
        async () => {
          const children = await integrationCaller.content.listChildren({ locale: "en", parentSlug: SECTION_SLUG });
          expect(children.map(({ weight }) => weight)).toEqual([1, 10, 20, 30, 100]);
        },
      );
      When(
        'the client reads the child pages of "en/learn/courses/just-enough-go/learning" through <surface>',
        async () => {
          result = await childrenThrough(surface);
        },
      );
      Then("the response should contain 5 child pages", () => expect(result).toHaveLength(5));
      And("the child pages should be ordered by weight ascending", () =>
        expect(result.map(({ weight }) => weight)).toEqual([1, 10, 20, 30, 100]),
      );
    },
  );

  // @scenario specs/apps/ayokoding/www/behaviours/backend/content/content-api.feature: Page content includes rendered HTML with code blocks preserved
  Scenario("Page content includes rendered HTML with code blocks preserved", ({ Given, When, Then }) => {
    let result: Awaited<ReturnType<typeof integrationCaller.content.getBySlug>>;
    Given(
      'a published page exists at slug "en/learn/courses/just-enough-go/learning/beginner" with a fenced code block',
      async () => {
        const page = await integrationCaller.content.getBySlug({
          locale: "en",
          slug: "learn/courses/just-enough-go/learning/beginner",
        });
        expect(page.html).toContain("<code");
      },
    );
    When(
      'the client calls content.getBySlug with slug "en/learn/courses/just-enough-go/learning/beginner"',
      async () => {
        result = await integrationCaller.content.getBySlug({
          locale: "en",
          slug: "learn/courses/just-enough-go/learning/beginner",
        });
      },
    );
    Then('the response "html" field should contain a rendered code element', () =>
      expect(result.html).toContain("<code"),
    );
  });

  // @scenario specs/apps/ayokoding/www/behaviours/backend/content/content-api.feature: The course-path route data is returned for a locale
  Scenario("The course-path route data is returned for a locale", ({ When, Then, And }) => {
    let routeData: Awaited<ReturnType<typeof integrationCaller.coursePaths.getRouteData>>;
    When('the client calls coursePaths.getRouteData with locale "en"', async () => {
      routeData = await integrationCaller.coursePaths.getRouteData("en");
    });

    Then("the response should list each library course with its English page link", () => {
      expect(routeData.libraryCourseIds.length).toBeGreaterThan(0);
      for (const courseId of routeData.libraryCourseIds) {
        expect(routeData.courseLinks[courseId], `${courseId} has no English page link`).toMatchObject({
          slug: `learn/courses/${courseId}`,
        });
      }
    });

    And("the response should include the course path manifests", () => {
      expect(routeData.manifests).toBeInstanceOf(Array);
    });
  });
});
