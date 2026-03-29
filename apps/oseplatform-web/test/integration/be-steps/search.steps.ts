import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import type { SearchResult } from "@/server/content/types";
import { integrationCaller } from "./helpers/test-caller";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/oseplatform/be/gherkin/search/search.feature"),
);

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given }) => {
    Given("the API is running", () => {
      // integration caller is ready with real filesystem
    });
  });

  Scenario("Search returns matching results", ({ Given, When, Then, And }) => {
    let results: SearchResult[];

    Given('the search index contains pages about "enterprise" and "compliance"', () => {
      // real content/ directory contains pages about enterprise and compliance topics
    });

    When('a search query "enterprise" is executed', async () => {
      results = await integrationCaller.search.query({ query: "enterprise", limit: 20 });
    });

    Then('the results contain pages matching "enterprise"', () => {
      expect(results.length).toBeGreaterThan(0);
    });

    And("each result contains a title, slug, and excerpt", () => {
      for (const result of results) {
        expect(result.title).toBeTruthy();
        expect(result.slug).toBeTruthy();
        expect(result.excerpt).toBeTruthy();
      }
    });
  });

  Scenario("Search with no matches returns empty results", ({ Given, When, Then }) => {
    let results: SearchResult[];

    Given('the search index contains pages about "enterprise" and "compliance"', () => {
      // real content/ directory contains pages about enterprise and compliance
    });

    When('a search query "nonexistent-term-xyz" is executed', async () => {
      results = await integrationCaller.search.query({ query: "nonexistent-term-xyz", limit: 20 });
    });

    Then("the results are empty", () => {
      expect(results).toHaveLength(0);
    });
  });

  Scenario("Search results respect the limit parameter", ({ Given, When, Then }) => {
    let results: SearchResult[];

    Given('the search index contains 5 pages matching "phase"', () => {
      // real content/ directory contains pages with "phase" in them
    });

    When('a search query "phase" is executed with limit 2', async () => {
      results = await integrationCaller.search.query({ query: "phase", limit: 2 });
    });

    Then("at most 2 results are returned", () => {
      expect(results.length).toBeLessThanOrEqual(2);
    });
  });
});
