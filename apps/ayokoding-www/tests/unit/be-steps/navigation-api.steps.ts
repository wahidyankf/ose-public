import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { testCaller } from "./helpers/test-caller";
import type { TreeNode } from "@/features/content/core/types";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ayokoding/www/behaviours/backend/navigation/navigation-api.feature"),
);

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given }) => {
    Given("the API is running", async () => {
      await expect(testCaller.meta.health()).resolves.toEqual({ status: "ok" });
    });
  });

  Scenario("Navigation tree structure matches the filesystem hierarchy", ({ Given, When, Then, And }) => {
    let result: TreeNode[];

    Given('content exists in locale "en" with sections "about-ayokoding", "learn", and "rants"', async () => {
      const tree = (await testCaller.content.getTree({ locale: "en" })) as TreeNode[];
      expect(tree.map(({ slug }) => slug)).toEqual(expect.arrayContaining(["about-ayokoding", "learn", "rants"]));
    });

    When('the client calls content.getTree with locale "en"', async () => {
      result = (await testCaller.content.getTree({ locale: "en" })) as TreeNode[];
    });

    Then('the response tree should contain top-level nodes for "about-ayokoding", "learn", and "rants"', () => {
      expect(result.length).toBeGreaterThan(0);
      expect(result.map(({ slug }) => slug)).toEqual(expect.arrayContaining(["about-ayokoding", "learn", "rants"]));
    });

    And("each node should reflect its position in the directory hierarchy", () => {
      const firstNode = result[0]!;
      expect(firstNode).toHaveProperty("slug");
    });
  });

  Scenario("Navigation nodes are ordered by weight ascending", ({ Given, When, Then }) => {
    let result: TreeNode[];

    Given(
      'a section "learn/courses/just-enough-go/learning" in locale "en" has child nodes with weights 30, 1, 100, 20, and 10',
      async () => {
        const children = await testCaller.content.listChildren({
          locale: "en",
          parentSlug: "learn/courses/just-enough-go/learning",
        });
        expect(children.map(({ weight }) => weight)).toEqual([1, 10, 20, 30, 100]);
      },
    );

    When('the client calls content.getTree with locale "en"', async () => {
      result = (await testCaller.content.getTree({ locale: "en" })) as TreeNode[];
    });

    Then(
      'the children of "learn/courses/just-enough-go/learning" should appear in order: weight 1, weight 10, weight 20, weight 30, weight 100',
      () => {
        const learn = result.find(({ slug }) => slug === "learn");
        const courses = learn?.children.find(({ slug }) => slug === "learn/courses");
        const go = courses?.children.find(({ slug }) => slug === "learn/courses/just-enough-go");
        const learning = go?.children.find(({ slug }) => slug === "learn/courses/just-enough-go/learning");
        expect(learning?.children.map(({ weight }) => weight)).toEqual([1, 10, 20, 30, 100]);
      },
    );
  });

  Scenario("Section nodes include a children array", ({ Given, When, Then, And }) => {
    let result: TreeNode[];

    Given(
      'a section "learn/courses/just-enough-go/learning" in locale "en" contains at least one child page',
      async () => {
        const tree = (await testCaller.content.getTree({ locale: "en" })) as TreeNode[];
        const learn = tree.find(({ slug }) => slug === "learn");
        const courses = learn?.children.find(({ slug }) => slug === "learn/courses");
        const go = courses?.children.find(({ slug }) => slug === "learn/courses/just-enough-go");
        expect(go?.children.find(({ slug }) => slug.endsWith("/learning"))?.children.length).toBeGreaterThan(0);
      },
    );

    When('the client calls content.getTree with locale "en"', async () => {
      result = (await testCaller.content.getTree({ locale: "en" })) as TreeNode[];
    });

    Then('the "learn/courses/just-enough-go/learning" node should have a non-empty "children" array', () => {
      const learn = result.find(({ slug }) => slug === "learn");
      const courses = learn?.children.find(({ slug }) => slug === "learn/courses");
      const go = courses?.children.find(({ slug }) => slug === "learn/courses/just-enough-go");
      const sectionNode = go?.children.find(({ slug }) => slug === "learn/courses/just-enough-go/learning");
      expect(sectionNode).toBeDefined();
      expect(Array.isArray(sectionNode?.children)).toBe(true);
    });

    And('each child should include a "slug" and "title"', () => {
      const learn = result.find(({ slug }) => slug === "learn");
      const courses = learn?.children.find(({ slug }) => slug === "learn/courses");
      const go = courses?.children.find(({ slug }) => slug === "learn/courses/just-enough-go");
      const sectionNode = go?.children.find(
        ({ slug, children }) => slug === "learn/courses/just-enough-go/learning" && children.length > 0,
      );
      expect(sectionNode).toBeDefined();
      const firstChild = sectionNode!.children[0]!;
      expect(firstChild).toHaveProperty("slug");
      expect(firstChild).toHaveProperty("title");
    });
  });

  Scenario("Course nodes carry their category", ({ Given, When, Then, And }) => {
    let result: TreeNode[];
    Given(
      'content exists in locale "en" with a course "learn/courses/sql-essentials" in category "data-and-databases"',
      async () => {
        const tree = (await testCaller.content.getTree({ locale: "en" })) as TreeNode[];
        expect(tree.length).toBeGreaterThan(0);
      },
    );
    When('the client calls content.getTree with locale "en"', async () => {
      result = (await testCaller.content.getTree({ locale: "en" })) as TreeNode[];
    });
    Then('the "learn/courses/sql-essentials" node should include category "data-and-databases"', () => {
      const learn = result.find(({ slug }) => slug === "learn");
      const courses = learn?.children.find(({ slug }) => slug === "learn/courses");
      const sql = courses?.children.find(({ slug }) => slug === "learn/courses/sql-essentials");
      expect(sql?.category).toBe("data-and-databases");
    });
    And('nodes without a category should have no "category" field', () => {
      const learn = result.find(({ slug }) => slug === "learn");
      expect(learn && "category" in learn).toBe(false);
    });
  });
});
