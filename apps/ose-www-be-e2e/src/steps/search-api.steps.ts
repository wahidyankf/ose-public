import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { buildTrpcUrl, extractTrpcData, state } from "./helpers";

// @scenario specs/apps/ose/www/behaviours/backend/search/search.feature: Search returns matching results
// @scenario specs/apps/ose/www/behaviours/backend/search/search.feature: Search with no matches returns empty results
// @scenario specs/apps/ose/www/behaviours/backend/search/search.feature: Search results respect the limit parameter

const { When, Then } = createBdd();

When("a search query {string} is executed", async ({ request }, query: string) => {
  const url = buildTrpcUrl("search.query", { query, limit: 10 });
  const response = await request.get(url);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  state.searchResults = extractTrpcData(body);
});

When("a search query {string} is executed with limit {int}", async ({ request }, query: string, limit: number) => {
  const url = buildTrpcUrl("search.query", { query, limit });
  const response = await request.get(url);
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  state.searchResults = extractTrpcData(body);
});

Then("the results contain pages matching {string}", async ({}, term: string) => {
  const results = state.searchResults as Array<{ title: string; slug: string; excerpt: string }>;
  expect(results.length).toBeGreaterThan(0);
  for (const result of results) {
    expect(`${result.title} ${result.slug} ${result.excerpt}`.toLowerCase()).toContain(term.toLowerCase());
  }
});

Then("each result contains a title, slug, and excerpt", async () => {
  const results = state.searchResults as Record<string, unknown>[];
  const first = results[0]!;
  expect(first).toHaveProperty("title");
  expect(first).toHaveProperty("slug");
  expect(first).toHaveProperty("excerpt");
});

Then("the results are empty", async () => {
  const results = state.searchResults as unknown[];
  expect(results.length).toBe(0);
});

Then("at most {int} results are returned", async ({}, limit: number) => {
  const results = state.searchResults as unknown[];
  expect(results.length).toBeLessThanOrEqual(limit);
});
