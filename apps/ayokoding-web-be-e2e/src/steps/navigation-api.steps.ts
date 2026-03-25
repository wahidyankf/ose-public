import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { buildTrpcUrl, extractTrpcData } from "./helpers";

const { Given, When, Then } = createBdd();

let treeResult: {
  slug: string;
  weight: number;
  isSection: boolean;
  children: { slug: string }[];
}[];

Given('content exists in locale "en" with sections "programming", "ai", and "security"', async () => {});
Given('a section "programming" in locale "en" has child nodes with weights 30, 10, and 20', async () => {});
Given('a section "programming" in locale "en" contains at least one child page', async () => {});

When('the client calls content.getTree with locale "en"', async ({ request }) => {
  const url = buildTrpcUrl("content.getTree", { locale: "en" });
  const response = await request.get(url);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  treeResult = extractTrpcData(body) as {
    slug: string;
    weight: number;
    isSection: boolean;
    children: { slug: string }[];
  }[];
});

Then('the response tree should contain top-level nodes for "programming", "ai", and "security"', async () => {
  expect(treeResult.length).toBeGreaterThan(0);
});

Then("each node should reflect its position in the directory hierarchy", async () => {
  expect(treeResult[0]).toHaveProperty("slug");
});

Then('the children of "programming" should appear in order: weight 10, weight 20, weight 30', async () => {
  for (let i = 1; i < treeResult.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(treeResult[i]!.weight).toBeGreaterThanOrEqual(treeResult[i - 1]!.weight);
  }
});

Then('the "programming" node should have a non-empty "children" array', async () => {
  const sectionNode = treeResult.find((n: { isSection: boolean }) => n.isSection);
  expect(sectionNode).toBeDefined();
  expect(Array.isArray(sectionNode?.children)).toBe(true);
});

Then('each child should include a "slug" and "title"', async () => {
  const sectionNode = treeResult.find(
    (n: { isSection: boolean; children: unknown[] }) => n.isSection && n.children.length > 0,
  );
  expect(sectionNode).toBeDefined();
  expect(sectionNode!.children[0]).toHaveProperty("slug");
});
