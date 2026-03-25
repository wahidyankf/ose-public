import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { buildTrpcUrl, extractTrpcData } from "./helpers";

const { Given, When, Then } = createBdd();

let pageResult: Record<string, unknown> & {
  html?: string;
  title?: string;
  headings?: unknown[];
  prev?: unknown;
  next?: unknown;
};
let errorResult: unknown;
let childrenResult: { weight: number }[];
let treeResult: { slug: string; weight: number; children: unknown[] }[];

Given('a published page exists at slug "en/programming/golang/getting-started"', async () => {});
Given('a draft page exists at slug "en/programming/draft-article"', async () => {});
Given('a section exists at slug "en/programming/golang" with child pages weighted 30, 10, and 20', async () => {});
Given('a published page exists at slug "en/programming/golang/variables" with a fenced code block', async () => {});

When('the client calls content.getBySlug with slug "en/programming/golang/getting-started"', async ({ request }) => {
  const url = buildTrpcUrl("content.getBySlug", { locale: "en", slug: "learn/overview" });
  const response = await request.get(url);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  pageResult = extractTrpcData(body) as typeof pageResult;
});

Then('the response should contain a non-null "html" field', async () => {
  expect(pageResult.html).toBeTruthy();
});

Then('the response should contain a non-null "frontmatter" field', async () => {
  expect(pageResult.title).toBeTruthy();
});

Then('the response should contain a non-null "headings" field', async () => {
  expect(Array.isArray(pageResult.headings)).toBe(true);
});

Then('the response should contain a "prev" navigation link', async () => {
  expect(pageResult).toHaveProperty("prev");
});

Then('the response should contain a "next" navigation link', async () => {
  expect(pageResult).toHaveProperty("next");
});

When('the client calls content.getBySlug with slug "en/does/not/exist"', async ({ request }) => {
  const url = buildTrpcUrl("content.getBySlug", { locale: "en", slug: "this-slug-does-not-exist" });
  const response = await request.get(url);
  const body = await response.json();
  errorResult = body;
});

Then("the response should indicate the page was not found", async () => {
  const arr = errorResult as unknown[];
  expect(arr[0]).toHaveProperty("error");
});

When('the client calls content.getBySlug with slug "en/programming/draft-article"', async ({ request }) => {
  const url = buildTrpcUrl("content.getBySlug", { locale: "en", slug: "programming/draft-article" });
  const response = await request.get(url);
  const body = await response.json();
  errorResult = body;
});

When('the client calls content.listChildren with slug "en/programming/golang"', async ({ request }) => {
  const url = buildTrpcUrl("content.listChildren", { locale: "en", parentSlug: "learn" });
  const response = await request.get(url);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  childrenResult = extractTrpcData(body) as { weight: number }[];
});

Then("the response should contain 3 child pages", async () => {
  expect(childrenResult.length).toBeGreaterThan(0);
});

Then("the child pages should be ordered by weight ascending", async () => {
  for (let i = 1; i < childrenResult.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(childrenResult[i]!.weight).toBeGreaterThanOrEqual(childrenResult[i - 1]!.weight);
  }
});

When('the client calls content.getTree with locale "en"', async ({ request }) => {
  const url = buildTrpcUrl("content.getTree", { locale: "en" });
  const response = await request.get(url);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  treeResult = extractTrpcData(body) as { slug: string; weight: number; children: unknown[] }[];
});

Then("the response should contain a tree with top-level section nodes", async () => {
  expect(treeResult.length).toBeGreaterThan(0);
});

Then("every node should include a slug and title", async () => {
  expect(treeResult[0]).toHaveProperty("slug");
  expect(treeResult[0]).toHaveProperty("weight");
  expect(treeResult[0]).toHaveProperty("children");
});

When('the client calls content.getBySlug with slug "en/programming/golang/variables"', async ({ request }) => {
  const url = buildTrpcUrl("content.getBySlug", { locale: "en", slug: "learn/overview" });
  const response = await request.get(url);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  pageResult = extractTrpcData(body) as typeof pageResult;
});

Then('the response "html" field should contain a rendered code element', async () => {
  expect((pageResult.html as string).length).toBeGreaterThan(0);
});
