import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { testCaller } from "./helpers/test-caller";
import type { SearchResult } from "@/features/content/core/types";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ayokoding/www/behaviours/backend/search/search-api.feature"),
);

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

function fieldOf(result: SearchResult, field: string): unknown {
  return (result as unknown as Record<string, unknown>)[field];
}

describeFeature(feature, ({ Scenario, ScenarioOutline, Background }) => {
  Background(({ Given }) => {
    Given("the API is running", async () => {
      await expect(testCaller.meta.health()).resolves.toEqual({ status: "ok" });
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/backend/search/search-api.feature: Search results carry the <field> field
  ScenarioOutline("Search results carry the <field> field", ({ Given, When, Then, And }, examples) => {
    const indexed = String(examples["indexed"]);
    const query = String(examples["query"]);
    const field = String(examples["field"]);
    const expected = String(examples["expected"]);
    let results: SearchResult[];

    Given('published pages indexed under locale "en" include <indexed>', async () => {
      const entry = INDEXED_PAGES[indexed];
      expect(entry, `unknown indexed cell: ${indexed}`).toBeDefined();
      entry!.holds(await testCaller.search.query({ query: entry!.query, locale: "en" }));
    });

    When('the client calls search.query with locale "en" and query "<query>"', async () => {
      results = await testCaller.search.query({ query, locale: "en" });
    });

    Then("the response should contain at least one result", () => {
      expect(results.length).toBeGreaterThan(0);
    });

    And('each result should carry its "<field>" field as "<expected>"', () => {
      for (const result of results) {
        expect(result).toHaveProperty(field);
        if (expected === "non-empty") expect(String(fieldOf(result, field))).not.toBe("");
        else expect(fieldOf(result, field)).toBe(expected);
      }
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/backend/search/search-api.feature: Search is scoped to the requested locale
  Scenario("Search is scoped to the requested locale", ({ Given, When, Then, And }) => {
    let results: SearchResult[];

    Given('a page exists in locale "en" with title "Spring Security Basics"', async () => {
      await expect(testCaller.search.query({ query: "Security Basics", locale: "en" })).resolves.toEqual(
        expect.arrayContaining([expect.objectContaining({ title: "Spring Security Basics", locale: "en" })]),
      );
    });

    And('no equivalent page exists in locale "id"', async () => {
      await expect(testCaller.search.query({ query: "Spring Security Basics", locale: "id" })).resolves.toEqual([]);
    });

    When('the client calls search.query with locale "id" and query "Spring Security Basics"', async () => {
      results = await testCaller.search.query({ query: "Spring Security Basics", locale: "id" });
    });

    Then("the response should contain no results", () => {
      expect(results.length).toBe(0);
    });
  });

  // @scenario specs/apps/ayokoding/www/behaviours/backend/search/search-api.feature: Empty query returns an error
  Scenario("Empty query returns an error", ({ When, Then }) => {
    let error: unknown = null;

    When('the client calls search.query with locale "en" and an empty query', async () => {
      try {
        await testCaller.search.query({ query: "", locale: "en" });
      } catch (e) {
        error = e;
      }
    });

    Then("the response should indicate an invalid input error", () => {
      expect(error).toBeTruthy();
    });
  });
});
