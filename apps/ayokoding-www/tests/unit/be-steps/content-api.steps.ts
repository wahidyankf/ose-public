import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { testCaller } from "./helpers/test-caller";
import { draftFixture } from "./helpers/test-service";
import { TRPCError } from "@trpc/server";
import type { TreeNode } from "@/features/content/core/types";

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
    return testCaller.content.listChildren({ locale: "en", parentSlug: SECTION_SLUG });
  }
  if (surface === "content.getTree") {
    const tree = (await testCaller.content.getTree({ locale: "en" })) as TreeNode[];
    return findNode(tree, SECTION_SLUG)?.children ?? [];
  }
  throw new Error(`unknown child-page surface: ${surface}`);
}

describeFeature(feature, ({ Scenario, ScenarioOutline, Background }) => {
  Background(({ Given }) => {
    Given("the API is running", async () => {
      await expect(testCaller.meta.health()).resolves.toEqual({ status: "ok" });
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/backend/content/content-api.feature: Get existing page by slug returns HTML, page metadata, and headings
  Scenario("Get existing page by slug returns HTML, page metadata, and headings", ({ Given, When, Then, And }) => {
    let result: Awaited<ReturnType<typeof testCaller.content.getBySlug>>;

    Given('a published page exists at slug "en/learn/courses/just-enough-go/learning/beginner"', async () => {
      await expect(
        testCaller.content.getBySlug({ locale: "en", slug: "learn/courses/just-enough-go/learning/beginner" }),
      ).resolves.toMatchObject({ title: "Beginner Examples", draft: false });
    });

    When(
      'the client calls content.getBySlug with slug "en/learn/courses/just-enough-go/learning/beginner"',
      async () => {
        result = await testCaller.content.getBySlug({
          locale: "en",
          slug: "learn/courses/just-enough-go/learning/beginner",
        });
      },
    );

    Then('the response should contain a non-null "html" field', () => {
      expect(result.html).toContain("<h2");
    });

    And("the response should contain the page metadata for the requested slug", () => {
      expect(result).toMatchObject({
        title: "Beginner Examples",
        slug: "learn/courses/just-enough-go/learning/beginner",
        locale: "en",
        weight: 10,
        draft: false,
        isSection: false,
      });
    });

    And('the response should contain a non-null "headings" field', () => {
      expect(result.headings.length).toBeGreaterThan(0);
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/backend/content/content-api.feature: Get existing page by slug returns previous and next links
  Scenario("Get existing page by slug returns previous and next links", ({ Given, When, Then, And }) => {
    let result: Awaited<ReturnType<typeof testCaller.content.getBySlug>>;

    Given('a published page exists at slug "en/learn/courses/just-enough-go/learning/beginner"', async () => {
      await expect(
        testCaller.content.getBySlug({ locale: "en", slug: "learn/courses/just-enough-go/learning/beginner" }),
      ).resolves.toMatchObject({ title: "Beginner Examples", draft: false });
    });

    When(
      'the client calls content.getBySlug with slug "en/learn/courses/just-enough-go/learning/beginner"',
      async () => {
        result = await testCaller.content.getBySlug({
          locale: "en",
          slug: "learn/courses/just-enough-go/learning/beginner",
        });
      },
    );

    Then('the response should contain a "prev" navigation link', () => {
      expect(result.prev).toEqual({ title: "Overview", slug: "learn/courses/just-enough-go/learning/overview" });
    });

    And('the response should contain a "next" navigation link', () => {
      expect(result.next).toEqual({
        title: "Intermediate Examples",
        slug: "learn/courses/just-enough-go/learning/intermediate",
      });
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/backend/content/content-api.feature: Get non-existent page by slug returns 404
  Scenario("Get non-existent page by slug returns 404", ({ When, Then }) => {
    let error: TRPCError | null = null;

    When('the client calls content.getBySlug with slug "en/does/not/exist"', async () => {
      try {
        await testCaller.content.getBySlug({ locale: "en", slug: "does-not-exist" });
      } catch (e) {
        error = e as TRPCError;
      }
    });

    Then("the response should indicate the page was not found", () => {
      expect(error).toBeInstanceOf(TRPCError);
      expect(error?.code).toBe("NOT_FOUND");
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/backend/content/content-api.feature: Draft pages are excluded from content retrieval
  Scenario("Draft pages are excluded from content retrieval", ({ Given, When, Then }) => {
    let error: TRPCError | null = null;

    Given('a draft page exists at slug "en/learn/paths/skills/e2e-fixture-alpha"', () => {
      expect(draftFixture).toMatchObject({ slug: "learn/paths/skills/e2e-fixture-alpha", locale: "en", draft: true });
    });

    When('the client calls content.getBySlug with slug "en/learn/paths/skills/e2e-fixture-alpha"', async () => {
      try {
        await testCaller.content.getBySlug({ locale: "en", slug: "learn/paths/skills/e2e-fixture-alpha" });
      } catch (e) {
        error = e as TRPCError;
      }
    });

    Then("the response should indicate the page was not found", () => {
      expect(error).toBeInstanceOf(TRPCError);
      expect(error?.code).toBe("NOT_FOUND");
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
          const children = await testCaller.content.listChildren({ locale: "en", parentSlug: SECTION_SLUG });
          expect(children.map(({ weight }) => weight)).toEqual([1, 10, 20, 30, 100]);
        },
      );

      When(
        'the client reads the child pages of "en/learn/courses/just-enough-go/learning" through <surface>',
        async () => {
          result = await childrenThrough(surface);
        },
      );

      Then("the response should contain 5 child pages", () => {
        expect(result).toHaveLength(5);
      });

      And("the child pages should be ordered by weight ascending", () => {
        for (let i = 1; i < result.length; i++) {
          expect(result[i]!.weight).toBeGreaterThanOrEqual(result[i - 1]!.weight);
        }
      });
    },
  );

  // @scenario specs/apps/ayokoding/www/behaviours/backend/content/content-api.feature: Page content includes rendered HTML with code blocks preserved
  Scenario("Page content includes rendered HTML with code blocks preserved", ({ Given, When, Then }) => {
    let result: Awaited<ReturnType<typeof testCaller.content.getBySlug>>;

    Given(
      'a published page exists at slug "en/learn/courses/just-enough-go/learning/beginner" with a fenced code block',
      async () => {
        const page = await testCaller.content.getBySlug({
          locale: "en",
          slug: "learn/courses/just-enough-go/learning/beginner",
        });
        expect(page?.html).toContain("<code");
      },
    );

    When(
      'the client calls content.getBySlug with slug "en/learn/courses/just-enough-go/learning/beginner"',
      async () => {
        result = await testCaller.content.getBySlug({
          locale: "en",
          slug: "learn/courses/just-enough-go/learning/beginner",
        });
      },
    );

    Then('the response "html" field should contain a rendered code element', () => {
      expect(result.html).toContain("<code");
    });
  });
});
