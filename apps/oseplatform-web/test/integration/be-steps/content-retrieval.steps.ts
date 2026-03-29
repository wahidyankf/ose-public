import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import type { ContentMeta } from "@/server/content/types";
import { integrationCaller } from "./helpers/test-caller";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/oseplatform/be/gherkin/content-retrieval/content-retrieval.feature"),
);

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given }) => {
    Given("the API is running", () => {
      // integration caller is ready with real filesystem
    });
  });

  Scenario("Retrieve a page by slug", ({ Given, When, Then, And }) => {
    let result: Awaited<ReturnType<typeof integrationCaller.content.getBySlug>>;

    Given('the content repository contains a page with slug "about"', () => {
      // real content/ directory contains about.md
    });

    When('the content service retrieves the page by slug "about"', async () => {
      result = await integrationCaller.content.getBySlug({ slug: "about" });
    });

    Then("the response contains the page title", () => {
      expect(result).not.toBeNull();
      expect(result?.title).toBe("About OSE Platform");
    });

    And("the response contains rendered HTML content", () => {
      expect(result?.html).toBeTruthy();
    });

    And("the response contains extracted headings", () => {
      expect(result?.headings).toBeDefined();
      expect(Array.isArray(result?.headings)).toBe(true);
    });
  });

  Scenario("List all update posts sorted by date", ({ Given, When, Then, And }) => {
    let results: ContentMeta[];

    Given("the content repository contains multiple update posts", () => {
      // real content/updates/ directory contains multiple posts
    });

    When("the content service lists all updates", async () => {
      results = await integrationCaller.content.listUpdates();
    });

    Then("the updates are returned sorted by date descending", () => {
      expect(results.length).toBe(4);
      for (let i = 0; i < results.length - 1; i++) {
        const current = results[i]?.date?.getTime() ?? 0;
        const next = results[i + 1]?.date?.getTime() ?? 0;
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });

    And("each update contains title, date, summary, and tags", () => {
      for (const update of results) {
        expect(update.title).toBeTruthy();
        expect(update.date).toBeInstanceOf(Date);
        expect(update.summary).toBeTruthy();
        expect(Array.isArray(update.tags)).toBe(true);
      }
    });
  });

  Scenario("Draft pages are excluded from listings", ({ Given, When, Then, And }) => {
    let results: ContentMeta[];

    Given("the content repository contains a draft page", () => {
      // real content/ directory may or may not have drafts; draft filtering is tested via env var
    });

    And("the SHOW_DRAFTS environment variable is not set", () => {
      delete process.env["SHOW_DRAFTS"];
    });

    When("the content service lists all updates", async () => {
      results = await integrationCaller.content.listUpdates();
    });

    Then("the draft page is not included in the results", () => {
      const hasDraft = results.some((r) => r.draft === true);
      expect(hasDraft).toBe(false);
    });
  });

  Scenario("Non-existent slug returns null", ({ Given, When, Then }) => {
    let result: Awaited<ReturnType<typeof integrationCaller.content.getBySlug>>;

    Given('the content repository contains no page with slug "nonexistent"', () => {
      // real content/ directory has no page with slug "nonexistent"
    });

    When('the content service retrieves the page by slug "nonexistent"', async () => {
      result = await integrationCaller.content.getBySlug({ slug: "nonexistent" });
    });

    Then("the response is null", () => {
      expect(result).toBeNull();
    });
  });
});
