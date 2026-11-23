import path from "node:path";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import type { TreeNode } from "@/features/content/core/types";
import { integrationCaller } from "./helpers/integration-caller";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ayokoding/www/behaviours/backend/navigation/navigation-api.feature"),
);

function findNode(nodes: TreeNode[], slug: string): TreeNode | undefined {
  for (const node of nodes) {
    if (node.slug === slug) return node;
    const nested = findNode(node.children, slug);
    if (nested) return nested;
  }
  return undefined;
}

function visitNodes(nodes: TreeNode[], check: (node: TreeNode) => void): void {
  for (const node of nodes) {
    check(node);
    visitNodes(node.children, check);
  }
}

function localeRootChildSlugs(tree: TreeNode[]): string[] {
  return (tree.find(({ slug }) => slug === "")?.children ?? []).map(({ slug }) => slug);
}

// One check per Outline aspect; each mirrors the assertions of the scenario it absorbed.
const ASPECT_CHECKS: Readonly<Record<string, (tree: TreeNode[]) => void>> = {
  "lists top-level sections with their pages nested beneath": (tree) => {
    expect(localeRootChildSlugs(tree)).toEqual(expect.arrayContaining(["about-ayokoding", "learn", "rants"]));
    expect(findNode(tree, "learn/courses/just-enough-go/learning/beginner")?.slug).toBe(
      "learn/courses/just-enough-go/learning/beginner",
    );
  },
  "gives every section a non-empty children array": (tree) => {
    const section = findNode(tree, "learn/courses/just-enough-go/learning");
    expect(section?.children.length).toBeGreaterThan(0);
    for (const child of section!.children) {
      expect(child).toMatchObject({ slug: expect.any(String), title: expect.any(String) });
    }
  },
  "gives every node a slug and title": (tree) => {
    visitNodes(tree, (node) => expect(node).toMatchObject({ slug: expect.any(String), title: expect.any(String) }));
  },
};

describeFeature(feature, ({ Scenario, ScenarioOutline, Background }) => {
  Background(({ Given }) => {
    Given("the API is running", async () => {
      await expect(integrationCaller.meta.health()).resolves.toEqual({ status: "ok" });
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/backend/navigation/navigation-api.feature: The navigation tree <aspect>
  ScenarioOutline("The navigation tree <aspect>", ({ Given, When, Then }, examples) => {
    const aspect = String(examples["aspect"]);
    let result: TreeNode[];

    Given('content exists in locale "en" with sections "about-ayokoding", "learn", and "rants"', async () => {
      const tree = (await integrationCaller.content.getTree({ locale: "en" })) as TreeNode[];
      expect(localeRootChildSlugs(tree)).toEqual(expect.arrayContaining(["about-ayokoding", "learn", "rants"]));
    });
    When('the client calls content.getTree with locale "en"', async () => {
      result = (await integrationCaller.content.getTree({ locale: "en" })) as TreeNode[];
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
        const tree = (await integrationCaller.content.getTree({ locale: "en" })) as TreeNode[];
        expect(findNode(tree, "learn/courses/sql-essentials")?.category).toBe("data-and-databases");
      },
    );
    When('the client calls content.getTree with locale "en"', async () => {
      result = (await integrationCaller.content.getTree({ locale: "en" })) as TreeNode[];
    });
    Then('the "learn/courses/sql-essentials" node should include category "data-and-databases"', () => {
      expect(findNode(result, "learn/courses/sql-essentials")?.category).toBe("data-and-databases");
    });
    And('nodes without a category should have no "category" field', () => {
      const learn = findNode(result, "learn");
      expect(learn && "category" in learn).toBe(false);
    });
  });
});
