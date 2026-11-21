// @scenario specs/apps/ayokoding/www/behaviours/backend/search/search-api.feature: Search results carry the <field> field
// @scenario specs/apps/ayokoding/www/behaviours/backend/search/search-api.feature: Search is scoped to the requested locale
// @scenario specs/apps/ayokoding/www/behaviours/backend/search/search-api.feature: Empty query returns an error
import { expect, type APIRequestContext } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { buildTrpcUrl, extractTrpcData, state } from "./helpers";

type SearchResult = { title: string; slug: string; excerpt: string; locale: string };

const { Given, When, Then } = createBdd();

// Each indexed-page cell names the query that finds it and the fact that must hold for that query.
const INDEXED_PAGES: Readonly<Record<string, { query: string; holds: (results: SearchResult[]) => void }>> = {
  'a page titled "Beginner Examples"': {
    query: "goroutines",
    holds: (results) =>
      expect(results).toEqual(expect.arrayContaining([expect.objectContaining({ title: "Beginner Examples" })])),
  },
  'content about "programming"': {
    query: "programming",
    holds: (results) => expect(results.length).toBeGreaterThan(0),
  },
};

async function search(request: APIRequestContext, locale: string, query: string): Promise<SearchResult[]> {
  const response = await request.get(buildTrpcUrl("search.query", { locale, query, limit: 10 }));
  expect(response.ok()).toBeTruthy();
  return extractTrpcData(await response.json()) as SearchResult[];
}

Given(/^published pages indexed under locale "en" include (.+)$/, async ({ request }, indexed: string) => {
  const entry = INDEXED_PAGES[indexed];
  expect(entry, `unknown indexed cell: ${indexed}`).toBeDefined();
  entry!.holds(await search(request, "en", entry!.query));
});

Given('a page exists in locale "en" with title "Spring Security Basics"', async ({ request }) => {
  expect(await search(request, "en", "Spring Security Basics")).toEqual(
    expect.arrayContaining([expect.objectContaining({ title: "Spring Security Basics", locale: "en" })]),
  );
});

Given('no equivalent page exists in locale "id"', async ({ request }) => {
  expect(await search(request, "id", "Spring Security Basics")).toEqual([]);
});

When(
  "the client calls search.query with locale {string} and query {string}",
  async ({ request }, locale: string, query: string) => {
    state.searchResults = await search(request, locale, query);
  },
);

Then("the response should contain at least one result", async () => {
  expect((state.searchResults as SearchResult[]).length).toBeGreaterThan(0);
});

Then("each result should carry its {string} field as {string}", async ({}, field: string, expected: string) => {
  const results = state.searchResults as SearchResult[];
  expect(results.length).toBeGreaterThan(0);
  for (const result of results) {
    expect(result).toHaveProperty(field);
    const value = (result as unknown as Record<string, unknown>)[field];
    if (expected === "non-empty") expect(String(value)).not.toBe("");
    else expect(value).toBe(expected);
  }
});

Then("the response should contain no results", async () => {
  expect(state.searchResults).toEqual([]);
});

When('the client calls search.query with locale "en" and an empty query', async ({ request }) => {
  const response = await request.get(buildTrpcUrl("search.query", { locale: "en", query: "", limit: 10 }));
  state.errorResult = await response.json();
  expect(response.ok()).toBe(false);
});

Then("the response should indicate an invalid input error", async () => {
  const errors = state.errorResult as { error?: { json?: { data?: { code?: string } } } }[];
  expect(errors[0]?.error?.json?.data?.code).toBe("BAD_REQUEST");
});
