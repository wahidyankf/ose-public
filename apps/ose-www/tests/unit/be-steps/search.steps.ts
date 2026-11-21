import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import type { SearchResult } from "@/features/content/core/types";
import { createCallerFactory } from "@/lib/trpc/init";
import type { TRPCContext } from "@/lib/trpc/init";
import { appRouter } from "@/features/app-shell/shell/root-router";
import { testContentService, testContentServiceWithPhase } from "./helpers/test-service";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ose/www/behaviours/backend/search/search.feature"),
);

const createCaller = createCallerFactory(appRouter);

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given }) => {
    Given("the API is running", () => {
      expect(createCaller).toBeTypeOf("function");
    });
  });

  // @scenario specs/apps/ose/www/behaviours/backend/search/search.feature: Search returns matching results
  Scenario("Search returns matching results", ({ Given, When, Then, And }) => {
    let results: SearchResult[];

    Given('the search index contains pages about "enterprise" and "compliance"', async () => {
      expect((await testContentService.search("enterprise")).length).toBeGreaterThan(0);
      expect((await testContentService.search("compliance")).length).toBeGreaterThan(0);
    });

    When('a search query "enterprise" is executed', async () => {
      const caller = createCaller({ contentService: testContentService } as TRPCContext);
      results = await caller.search.query({ query: "enterprise", limit: 20 });
    });

    Then('the results contain pages matching "enterprise"', () => {
      expect(results.length).toBeGreaterThan(0);
      for (const result of results) {
        expect(`${result.title} ${result.slug} ${result.excerpt}`.toLowerCase()).toContain("enterprise");
      }
    });

    And("each result contains a title, slug, and excerpt", () => {
      for (const result of results) {
        expect(result.title).toBeTruthy();
        expect(result.slug).toBeTruthy();
        expect(result.excerpt).toBeTruthy();
      }
    });
  });

  // @scenario specs/apps/ose/www/behaviours/backend/search/search.feature: Search with no matches returns empty results
  Scenario("Search with no matches returns empty results", ({ Given, When, Then }) => {
    let results: SearchResult[];

    Given('the search index contains pages about "enterprise" and "compliance"', async () => {
      expect((await testContentService.search("enterprise")).length).toBeGreaterThan(0);
      expect((await testContentService.search("compliance")).length).toBeGreaterThan(0);
    });

    When('a search query "nonexistent-term-xyz" is executed', async () => {
      const caller = createCaller({ contentService: testContentService } as TRPCContext);
      results = await caller.search.query({ query: "nonexistent-term-xyz", limit: 20 });
    });

    Then("the results are empty", () => {
      expect(results).toHaveLength(0);
    });
  });

  // @scenario specs/apps/ose/www/behaviours/backend/search/search.feature: Search results respect the limit parameter
  Scenario("Search results respect the limit parameter", ({ Given, When, Then }) => {
    let results: SearchResult[];

    Given('the search index contains 5 pages matching "phase"', async () => {
      expect(await testContentServiceWithPhase.search("phase", 10)).toHaveLength(5);
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
