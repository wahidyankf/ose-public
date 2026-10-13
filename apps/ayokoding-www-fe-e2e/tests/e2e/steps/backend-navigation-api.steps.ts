import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { backendState, buildTrpcUrl, extractTrpcData } from "./backend-helpers";

const { Given, Then } = createBdd();

interface NavigationNode {
  slug: string;
  title: string;
  weight: number;
  children: NavigationNode[];
}

function findNode(nodes: NavigationNode[], slug: string): NavigationNode | undefined {
  for (const node of nodes) {
    if (node.slug === slug) return node;
    const nested = findNode(node.children, slug);
    if (nested) return nested;
  }
  return undefined;
}

async function requestTree(request: { get(url: string): Promise<{ ok(): boolean; json(): Promise<unknown> }> }) {
  const response = await request.get(buildTrpcUrl("content.getTree", { locale: "en" }));
  expect(response.ok()).toBe(true);
  return extractTrpcData(await response.json()) as NavigationNode[];
}

Given('content exists in locale "en" with sections "about-ayokoding", "learn", and "rants"', async ({ request }) => {
  const tree = await requestTree(request);
  for (const slug of ["about-ayokoding", "learn", "rants"]) {
    expect(findNode(tree, slug), `${slug} should exist in the live English navigation tree`).toBeDefined();
  }
});
Given(
  "a section {string} in locale {string} has child nodes with weights {int}, {int}, {int}, {int}, and {int}",
  async ({ request }, slug: string, locale: string, ...declaredWeights: number[]) => {
    expect(locale).toBe("en");
    const section = findNode(await requestTree(request), slug);
    expect(section?.children.map(({ weight }) => weight).sort((left, right) => left - right)).toEqual(
      [...declaredWeights].sort((left, right) => left - right),
    );
  },
);
Given(
  "a section {string} in locale {string} contains at least one child page",
  async ({ request }, slug: string, locale: string) => {
    expect(locale).toBe("en");
    const section = findNode(await requestTree(request), slug);
    expect(section?.children.length).toBeGreaterThan(0);
  },
);

// Note: When 'the client calls content.getTree with locale {string}' is in backend-common.steps.ts

Then('the response tree should contain top-level nodes for "about-ayokoding", "learn", and "rants"', async () => {
  const tree = backendState.treeResult as NavigationNode[];
  for (const slug of ["about-ayokoding", "learn", "rants"]) {
    expect(findNode(tree, slug)).toBeDefined();
  }
});

Then("each node should reflect its position in the directory hierarchy", async () => {
  const tree = backendState.treeResult as NavigationNode[];
  const learning = findNode(tree, "learn/courses/just-enough-go/learning");
  expect(learning?.children.every(({ slug }) => slug.startsWith(`${learning.slug}/`))).toBe(true);
});

Then(
  "the children of {string} should appear in order: weight {int}, weight {int}, weight {int}, weight {int}, weight {int}",
  async ({}, slug: string, ...expectedWeights: number[]) => {
    const section = findNode(backendState.treeResult as NavigationNode[], slug);
    expect(section?.children.map(({ weight }) => weight)).toEqual(expectedWeights);
  },
);

Then("the {string} node should have a non-empty {string} array", async ({}, slug: string, field: string) => {
  expect(field).toBe("children");
  const section = findNode(backendState.treeResult as NavigationNode[], slug);
  expect(section?.children.length).toBeGreaterThan(0);
});

Then('each child should include a "slug" and "title"', async () => {
  const sectionNode = findNode(backendState.treeResult as NavigationNode[], "learn/courses/just-enough-go/learning");
  expect(sectionNode).toBeDefined();
  expect(sectionNode!.children[0]).toHaveProperty("slug");
  expect(sectionNode!.children[0]).toHaveProperty("title");
});

Given(
  "content exists in locale {string} with a course {string} in category {string}",
  async ({ request }, _locale: string, slug: string, category: string) => {
    const node = findNode(await requestTree(request), slug) as (NavigationNode & { category?: string }) | undefined;
    expect(node?.category).toBe(category);
  },
);

Then("the {string} node should include category {string}", async ({ request }, slug: string, category: string) => {
  const node = findNode(await requestTree(request), slug) as (NavigationNode & { category?: string }) | undefined;
  expect(node?.category).toBe(category);
});

Then('nodes without a category should have no "category" field', async ({ request }) => {
  const tree = (await requestTree(request)) as (NavigationNode & { category?: string })[];
  const learn = findNode(tree, "learn") as (NavigationNode & { category?: string }) | undefined;
  expect(learn && "category" in learn).toBe(false);
});
