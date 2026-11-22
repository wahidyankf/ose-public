import path from "node:path";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, vi } from "vitest";
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

describeFeature(feature, ({ Background, Scenario, AfterEachScenario }) => {
  AfterEachScenario(() => {
    vi.unstubAllEnvs();
  });

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

  // The page rendering is bound at unit level (it needs the React tree). At this level the page's
  // data comes from the real filesystem repository, which is what the page renders from.
  // @scenario specs/apps/ose/www/behaviours/backend/content/content-retrieval.feature: The About page renders at /about with its title and content
  Scenario("The About page renders at /about with its title and content", ({ Given, When, Then, And }) => {
    const service = realContentService();
    let page: Awaited<ReturnType<ContentService["getBySlug"]>>;

    Given('the content repository contains a page with slug "about"', async () => {
      expect(await service.getBySlug("about")).not.toBeNull();
    });
    When("a visitor opens the About page", async () => {
      page = await service.getBySlug("about");
    });
    Then("the page heading is the title of the About page", () => {
      expect(page?.title).toBe("About OSE E2E Fixture");
    });
    And("the page shows the headings of the About page", () => {
      expect(page?.headings.map(({ text }) => text)).toContain("Fixture scope");
    });
  });

  // @scenario specs/apps/ose/www/behaviours/backend/content/content-retrieval.feature: The Updates page lists the published updates newest first
  Scenario("The Updates page lists the published updates newest first", ({ Given, When, Then }) => {
    const service = realContentService();
    let updates: ContentMeta[] = [];

    Given("the content repository contains multiple update posts", async () => {
      expect((await service.listUpdates()).length).toBe(5);
    });
    When("a visitor opens the Updates page", async () => {
      updates = await service.listUpdates();
    });
    Then("the update titles are listed newest first", () => {
      expect(updates.map(({ title }) => title)[0]).toBe("Phase 0 End");
      for (let i = 0; i < updates.length - 1; i++) {
        expect(updates[i]!.date!.getTime()).toBeGreaterThanOrEqual(updates[i + 1]!.date!.getTime());
      }
    });
  });

  // @scenario specs/apps/ose/www/behaviours/backend/content/content-retrieval.feature: Opening an unknown update URL returns 404
  Scenario("Opening an unknown update URL returns 404", ({ When, Then }) => {
    const service = realContentService();
    let page: Awaited<ReturnType<ContentService["getBySlug"]>>;

    When('a visitor opens the update page for the slug "no-such-update"', async () => {
      page = await service.getBySlug("updates/no-such-update");
    });
    Then("the response status is 404", () => {
      expect(page).toBeNull();
    });
  });

  // @scenario specs/apps/ose/www/behaviours/backend/content/content-retrieval.feature: Setting OSE_WEB_SHOW_DRAFTS to true includes draft pages in listings
  Scenario("Setting OSE_WEB_SHOW_DRAFTS to true includes draft pages in listings", ({ Given, And, When, Then }) => {
    const repositoryWithDrafts = new FileSystemContentRepository(contentDirectory, true);
    let results: ContentMeta[] = [];
    let service: ContentService;

    Given("the content repository contains a draft page", async () => {
      expect((await repositoryWithDrafts.readAllContent()).some(({ draft }) => draft)).toBe(true);
    });
    And('the OSE_WEB_SHOW_DRAFTS environment variable is "true"', async () => {
      vi.stubEnv("OSE_WEB_SHOW_DRAFTS", "true");
      vi.resetModules();
      const { FileSystemContentRepository: FreshRepository } = await import("@/features/content/shell/repository-fs");
      const { ContentService: FreshService } = await import("@/features/content/shell/service");
      service = new FreshService(new FreshRepository(contentDirectory));
    });
    When("the content service lists all updates", async () => {
      results = await service.listUpdates();
    });
    Then("the draft page is included in the results", () => {
      expect(results.some(({ draft }) => draft)).toBe(true);
    });
  });

  // @scenario specs/apps/ose/www/behaviours/backend/content/content-retrieval.feature: Content is read from the directory named by OSE_WEB_CONTENT_DIR
  Scenario("Content is read from the directory named by OSE_WEB_CONTENT_DIR", ({ Given, When, Then }) => {
    let results: ContentMeta[] = [];
    let service: ContentService;

    Given("the OSE_WEB_CONTENT_DIR environment variable names the content directory", async () => {
      vi.stubEnv("OSE_WEB_CONTENT_DIR", contentDirectory);
      vi.resetModules();
      const { FileSystemContentRepository: FreshRepository } = await import("@/features/content/shell/repository-fs");
      const { ContentService: FreshService } = await import("@/features/content/shell/service");
      service = new FreshService(new FreshRepository());
    });
    When("the content service lists all updates", async () => {
      results = await service.listUpdates();
    });
    Then("every listed update is read from that directory", () => {
      expect(results.length).toBeGreaterThan(0);
      for (const entry of results) {
        expect(entry.filePath.startsWith(contentDirectory)).toBe(true);
      }
    });
  });

  // @scenario specs/apps/ose/www/behaviours/backend/content/content-retrieval.feature: Search reads the index at the path named by OSE_WEB_SEARCH_DATA_PATH
  Scenario("Search reads the index at the path named by OSE_WEB_SEARCH_DATA_PATH", ({ Given, When, Then }) => {
    const indexPath = path.resolve(process.cwd(), "tests/e2e-fixtures/search-data.json");
    let results: { title: string; slug: string }[] = [];

    Given("the OSE_WEB_SEARCH_DATA_PATH environment variable names a search index file", () => {
      vi.stubEnv("OSE_WEB_SEARCH_DATA_PATH", indexPath);
    });
    When('a search query "synthetic" is executed', async () => {
      vi.resetModules();
      const { createTRPCContext } = await import("@/lib/trpc/init");
      results = await createTRPCContext().contentService.search("synthetic");
    });
    Then("the results contain the page indexed in that file", () => {
      expect(results).toContainEqual(
        expect.objectContaining({ slug: "about", title: "Enterprise Compliance Fixture" }),
      );
    });
  });
});
