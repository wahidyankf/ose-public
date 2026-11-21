import path from "node:path";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import type { ContentMeta } from "@/features/content/core/types";
import { FileSystemContentRepository } from "@/features/content/shell/repository-fs";
import { ContentService } from "@/features/content/shell/service";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ose/www/behaviours/backend/content/content-retrieval.feature"),
);
const contentDirectory = path.resolve(process.cwd(), "tests/e2e-fixtures/content");

function realContentService(showDrafts = false): ContentService {
  return new ContentService(new FileSystemContentRepository(contentDirectory, showDrafts), undefined, { showDrafts });
}

describeFeature(feature, ({ Background, Scenario }) => {
  Background(({ Given }) => {
    Given("the API is running", () => {
      expect(realContentService()).toBeInstanceOf(ContentService);
    });
  });

  Scenario("Retrieve a page by slug", ({ Given, When, Then, And }) => {
    const service = realContentService();
    let result: Awaited<ReturnType<ContentService["getBySlug"]>>;

    Given('the content repository contains a page with slug "about"', async () => {
      expect(await service.getBySlug("about")).not.toBeNull();
    });
    When('the content service retrieves the page by slug "about"', async () => {
      result = await service.getBySlug("about");
    });
    Then("the response contains the page title", () => {
      expect(result?.title).toBe("About OSE E2E Fixture");
    });
    And("the response contains rendered HTML content", () => {
      expect(result?.html).toContain("Synthetic enterprise");
    });
    And("the response contains extracted headings", () => {
      expect(result?.headings.map(({ text }) => text)).toContain("Fixture scope");
    });
  });

  Scenario("Updates are listed newest first", ({ Given, When, Then }) => {
    const service = realContentService();
    let results: ContentMeta[] = [];

    Given("the content repository contains multiple update posts", async () => {
      expect((await service.listUpdates()).length).toBe(5);
    });
    When("the content service lists all updates", async () => {
      results = await service.listUpdates();
    });
    Then("the updates are returned sorted by date descending", () => {
      expect(results.map(({ title }) => title)).toEqual([
        "Phase 0 End",
        "Phase 1 Fixture",
        "Phase 2 Fixture",
        "Phase 3 Fixture",
        "Phase 4 Fixture",
      ]);
    });
  });

  Scenario("Each update shows title, date, summary, and tags", ({ Given, When, Then }) => {
    const service = realContentService();
    let results: ContentMeta[] = [];

    Given("the content repository contains multiple update posts", async () => {
      expect((await service.listUpdates()).length).toBe(5);
    });
    When("the content service lists all updates", async () => {
      results = await service.listUpdates();
    });
    Then("each update contains title, date, summary, and tags", () => {
      for (const update of results) {
        expect(update.title).not.toBe("");
        expect(update.date).toBeInstanceOf(Date);
        expect(update.summary).not.toBe("");
        expect(update.tags).toBeInstanceOf(Array);
      }
    });
  });

  Scenario("Draft pages are excluded from listings", ({ Given, When, Then, And }) => {
    const repositoryWithDrafts = new FileSystemContentRepository(contentDirectory, true);
    let results: ContentMeta[] = [];
    let service = realContentService();

    Given("the content repository contains a draft page", async () => {
      expect((await repositoryWithDrafts.readAllContent()).some(({ draft }) => draft)).toBe(true);
    });
    And("the OSE_WEB_SHOW_DRAFTS environment variable is not set", () => {
      service = realContentService(false);
    });
    When("the content service lists all updates", async () => {
      results = await service.listUpdates();
    });
    Then("the draft page is not included in the results", () => {
      expect(results.some(({ draft }) => draft)).toBe(false);
      expect(results.some(({ title }) => title === "Hidden Draft Fixture")).toBe(false);
    });
  });

  Scenario("Non-existent slug returns null", ({ Given, When, Then }) => {
    const service = realContentService();
    let result: Awaited<ReturnType<ContentService["getBySlug"]>>;

    Given('the content repository contains no page with slug "nonexistent"', async () => {
      expect((await service.getIndex()).contentMap.has("nonexistent")).toBe(false);
    });
    When('the content service retrieves the page by slug "nonexistent"', async () => {
      result = await service.getBySlug("nonexistent");
    });
    Then("the response is null", () => {
      expect(result).toBeNull();
    });
  });
});
