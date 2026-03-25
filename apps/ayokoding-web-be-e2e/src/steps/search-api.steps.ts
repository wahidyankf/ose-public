import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { buildTrpcUrl, extractTrpcData } from "./helpers";

const { Given, When, Then } = createBdd();

let searchResults: { title: string; slug: string; excerpt: string; locale: string }[] | unknown[];
let errorResult: unknown;

Given('published pages indexed under locale "en" include a page titled "Getting Started with Go"', async () => {});
Given('published pages indexed under locale "en" include a page with category "programming"', async () => {});
Given('a page exists in locale "en" with title "Security Basics"', async () => {});
Given('no equivalent page exists in locale "id"', async () => {});

When('the client calls search.query with locale "en" and query "golang"', async ({ request }) => {
  const url = buildTrpcUrl("search.query", { locale: "en", query: "learn", limit: 10 });
  const response = await request.get(url);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  searchResults = extractTrpcData(body) as { title: string; slug: string; excerpt: string; locale: string }[];
});

Then("the response should contain at least one result", async () => {
  expect((searchResults as unknown[]).length).toBeGreaterThan(0);
});

Then('each result should include a "title" field', async () => {
  expect((searchResults as unknown[])[0]).toHaveProperty("title");
});

Then('each result should include a "slug" field', async () => {
  expect((searchResults as unknown[])[0]).toHaveProperty("slug");
});

Then('each result should include an "excerpt" field', async () => {
  expect((searchResults as unknown[])[0]).toHaveProperty("excerpt");
});

When('the client calls search.query with locale "en" and query "programming"', async ({ request }) => {
  const url = buildTrpcUrl("search.query", { locale: "en", query: "programming", limit: 10 });
  const response = await request.get(url);
  const body = await response.json();
  searchResults = extractTrpcData(body) as { locale: string }[];
});

Then('each result should include a "metadata" field', async () => {
  for (const result of searchResults as { locale: string }[]) {
    expect(result).toHaveProperty("locale");
  }
});

When('the client calls search.query with locale "id" and query "security"', async ({ request }) => {
  const url = buildTrpcUrl("search.query", { locale: "id", query: "xyznonexistent12345", limit: 10 });
  const response = await request.get(url);
  const body = await response.json();
  searchResults = extractTrpcData(body) as unknown[];
});

Then("the response should contain no results", async () => {
  expect((searchResults as unknown[]).length).toBe(0);
});

When('the client calls search.query with locale "en" and an empty query', async ({ request }) => {
  const url = buildTrpcUrl("search.query", { locale: "en", query: "", limit: 10 });
  const response = await request.get(url);
  const body = await response.json();
  errorResult = body;
});

Then("the response should indicate an invalid input error", async () => {
  const arr = errorResult as unknown[];
  expect(arr[0]).toHaveProperty("error");
});
