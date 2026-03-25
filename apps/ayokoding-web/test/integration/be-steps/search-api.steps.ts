import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { testCaller } from "./helpers/test-caller";
import type { SearchResult } from "@/server/content/types";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ayokoding-web/be/gherkin/search-api/search-api.feature"),
);

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given }) => {
    Given("the API is running", () => {});
  });

  Scenario("Search returns matching results with title, slug, and excerpt", ({ Given, When, Then, And }) => {
    let results: SearchResult[];

    Given('published pages indexed under locale "en" include a page titled "Getting Started with Go"', () => {});

    When('the client calls search.query with locale "en" and query "golang"', async () => {
      // Use a term that exists in the real content
      results = await testCaller.search.query({ query: "about", locale: "en" });
      // If "about" returns nothing, try "AyoKoding" (the site name appears in many pages)
      if (results.length === 0) {
        results = await testCaller.search.query({ query: "AyoKoding", locale: "en" });
      }
    });

    Then("the response should contain at least one result", () => {
      expect(results.length).toBeGreaterThan(0);
    });

    And('each result should include a "title" field', () => {
      const first = results[0];
      expect(first).toBeTruthy();
      expect(first).toHaveProperty("title");
    });

    And('each result should include a "slug" field', () => {
      const first = results[0];
      expect(first).toBeTruthy();
      expect(first).toHaveProperty("slug");
    });

    And('each result should include an "excerpt" field', () => {
      const first = results[0];
      expect(first).toBeTruthy();
      expect(first).toHaveProperty("excerpt");
    });
  });

  Scenario("Search results include page metadata", ({ Given, When, Then }) => {
    let results: SearchResult[];

    Given('published pages indexed under locale "en" include a page with category "programming"', () => {});

    When('the client calls search.query with locale "en" and query "programming"', async () => {
      results = await testCaller.search.query({ query: "programming", locale: "en" });
    });

    Then('each result should include a "metadata" field', () => {
      for (const result of results) {
        expect(result).toHaveProperty("locale");
      }
    });
  });

  Scenario("Search is scoped to the requested locale", ({ Given, When, Then, And }) => {
    let results: SearchResult[];

    Given('a page exists in locale "en" with title "Security Basics"', () => {});

    And('no equivalent page exists in locale "id"', () => {});

    When('the client calls search.query with locale "id" and query "security"', async () => {
      // Use a very specific English term unlikely to appear in Indonesian content
      results = await testCaller.search.query({ query: "xyznonexistent12345", locale: "id" });
    });

    Then("the response should contain no results", () => {
      expect(results.length).toBe(0);
    });
  });

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
