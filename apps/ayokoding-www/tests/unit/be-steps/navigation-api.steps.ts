import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { testCaller } from "./helpers/test-caller";
import type { TreeNode } from "@/features/content/core/types";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ayokoding/www/behaviours/backend/navigation/navigation-api.feature"),
);

function visitNodes(nodes: TreeNode[], check: (node: TreeNode) => void): void {
  for (const node of nodes) {
    check(node);
    visitNodes(node.children, check);
  }
}

// One check per Outline aspect; each mirrors the assertions of the scenario it absorbed.
const ASPECT_CHECKS: Readonly<Record<string, (tree: TreeNode[]) => void>> = {
  "lists top-level sections with their pages nested beneath": (tree) => {
    expect(tree.map(({ slug }) => slug)).toEqual(expect.arrayContaining(["about-ayokoding", "learn", "rants"]));
    expect(tree[0]!).toHaveProperty("slug");
  },
  "gives every section a non-empty children array": (tree) => {
    const learn = tree.find(({ slug }) => slug === "learn");
    const courses = learn?.children.find(({ slug }) => slug === "learn/courses");
    const go = courses?.children.find(({ slug }) => slug === "learn/courses/just-enough-go");
    const sectionNode = go?.children.find(({ slug }) => slug === "learn/courses/just-enough-go/learning");
    expect(sectionNode).toBeDefined();
    expect(Array.isArray(sectionNode?.children)).toBe(true);
    expect(sectionNode!.children.length).toBeGreaterThan(0);
    const firstChild = sectionNode!.children[0]!;
    expect(firstChild).toHaveProperty("slug");
    expect(firstChild).toHaveProperty("title");
  },
  "gives every node a slug and title": (tree) => {
    visitNodes(tree, (node) => expect(node).toMatchObject({ slug: expect.any(String), title: expect.any(String) }));
  },
};

describeFeature(feature, ({ Scenario, ScenarioOutline, Background }) => {
  Background(({ Given }) => {
    Given("the API is running", async () => {
      await expect(testCaller.meta.health()).resolves.toEqual({ status: "ok" });
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/backend/navigation/navigation-api.feature: The navigation tree <aspect>
  ScenarioOutline("The navigation tree <aspect>", ({ Given, When, Then }, examples) => {
    const aspect = String(examples["aspect"]);
    let result: TreeNode[];

    Given('content exists in locale "en" with sections "about-ayokoding", "learn", and "rants"', async () => {
      const tree = (await testCaller.content.getTree({ locale: "en" })) as TreeNode[];
      expect(tree.map(({ slug }) => slug)).toEqual(expect.arrayContaining(["about-ayokoding", "learn", "rants"]));
    });

    When('the client calls content.getTree with locale "en"', async () => {
      result = (await testCaller.content.getTree({ locale: "en" })) as TreeNode[];
    });

    Then("the tree <aspect>", () => {
      const check = ASPECT_CHECKS[aspect];
      expect(check, `unknown aspect: ${aspect}`).toBeDefined();
      check!(result);
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/backend/navigation/navigation-api.feature: Course nodes carry their category
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
