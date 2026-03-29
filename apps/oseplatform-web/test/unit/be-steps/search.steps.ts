import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import type { SearchResult } from "@/server/content/types";
import { createCallerFactory } from "@/server/trpc/init";
import type { TRPCContext } from "@/server/trpc/init";
import { appRouter } from "@/server/trpc/router";
import { testContentService, testContentServiceWithPhase } from "./helpers/test-service";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/oseplatform/be/gherkin/search/search.feature"),
);

const createCaller = createCallerFactory(appRouter);

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given }) => {
    Given("the API is running", () => {
      // test caller is ready
    });
  });

  Scenario("Search returns matching results", ({ Given, When, Then, And }) => {
    let results: SearchResult[];

    Given('the search index contains pages about "enterprise" and "compliance"', () => {
      // testContentService content contains "enterprise" and "compliance" in content
    });

    When('a search query "enterprise" is executed', async () => {
      const caller = createCaller({ contentService: testContentService } as TRPCContext);
      results = await caller.search.query({ query: "enterprise", limit: 20 });
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
      // testContentService content contains "enterprise" and "compliance"
    });

    When('a search query "nonexistent-term-xyz" is executed', async () => {
      const caller = createCaller({ contentService: testContentService } as TRPCContext);
      results = await caller.search.query({ query: "nonexistent-term-xyz", limit: 20 });
    });

    Then("the results are empty", () => {
      expect(results).toHaveLength(0);
    });
  });

  Scenario("Search results respect the limit parameter", ({ Given, When, Then }) => {
    let results: SearchResult[];

    Given('the search index contains 5 pages matching "phase"', () => {
      // testContentServiceWithPhase has 5 pages containing "phase"
    });

    When('a search query "phase" is executed with limit 2', async () => {
      const caller = createCaller({
        contentService: testContentServiceWithPhase,
      } as TRPCContext);
      results = await caller.search.query({ query: "phase", limit: 2 });
    });

    Then("at most 2 results are returned", () => {
      expect(results.length).toBeLessThanOrEqual(2);
    });
  });
});
