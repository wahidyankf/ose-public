// @scenario specs/apps/ayokoding/www/behaviours/backend/navigation/navigation-api.feature: The navigation tree <aspect>
// @scenario specs/apps/ayokoding/www/behaviours/backend/navigation/navigation-api.feature: Course nodes carry their category
import { expect, type APIRequestContext } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { buildTrpcUrl, extractTrpcData, state } from "./helpers";

type TreeNode = { slug: string; title: string; weight: number; children: TreeNode[]; category?: string };

const { Given, Then } = createBdd();

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

async function getTree(request: APIRequestContext): Promise<TreeNode[]> {
  const response = await request.get(buildTrpcUrl("content.getTree", { locale: "en" }));
  expect(response.ok()).toBeTruthy();
  return extractTrpcData(await response.json()) as TreeNode[];
}

// One check per Outline aspect; each mirrors the assertions of the scenario it absorbed.
const ASPECT_CHECKS: Readonly<Record<string, (tree: TreeNode[]) => void>> = {
  "lists top-level sections with their pages nested beneath": (tree) => {
    const localeRoot = tree.find(({ slug }) => slug === "");
    expect(localeRoot?.children.map(({ slug }) => slug)).toEqual(
      expect.arrayContaining(["about-ayokoding", "learn", "rants"]),
    );
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

Given('content exists in locale "en" with sections "about-ayokoding", "learn", and "rants"', async ({ request }) => {
  const localeRoot = (await getTree(request)).find(({ slug }) => slug === "");
  expect(localeRoot?.children.map(({ slug }) => slug)).toEqual(
    expect.arrayContaining(["about-ayokoding", "learn", "rants"]),
  );
});

Given(
  "content exists in locale {string} with a course {string} in category {string}",
  async ({ request }, _locale: string, slug: string, category: string) => {
    const node = findNode(await getTree(request), slug);
    expect(node?.category).toBe(category);
  },
);

Then(/^the tree (.+)$/, async ({}, aspect: string) => {
  const check = ASPECT_CHECKS[aspect];
  expect(check, `unknown aspect: ${aspect}`).toBeDefined();
  check!(state.treeResult as TreeNode[]);
});

Then("the {string} node should include category {string}", async ({ request }, slug: string, category: string) => {
  const node = findNode(await getTree(request), slug);
  expect(node?.category).toBe(category);
});

Then('nodes without a category should have no "category" field', async ({ request }) => {
  const tree = await getTree(request);
  const learn = findNode(tree, "learn");
  expect(learn && "category" in learn).toBe(false);
});
