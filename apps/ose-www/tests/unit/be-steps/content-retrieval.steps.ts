import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import type { ContentMeta } from "@/features/content/core/types";
import { ContentService } from "@/features/content/shell/service";
import { createCallerFactory } from "@/lib/trpc/init";
import type { TRPCContext } from "@/lib/trpc/init";
import { appRouter } from "@/features/app-shell/shell/root-router";
import { testContentService, testRepositoryWithDraft } from "./helpers/test-service";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ose/www/behaviours/backend/content/content-retrieval.feature"),
);

const createCaller = createCallerFactory(appRouter);

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given }) => {
    Given("the API is running", () => {
      expect(createCaller).toBeTypeOf("function");
    });
  });

  // @scenario specs/apps/ose/www/behaviours/backend/content/content-retrieval.feature: Retrieve a page by slug
  Scenario("Retrieve a page by slug", ({ Given, When, Then, And }) => {
    let result: Awaited<ReturnType<typeof testContentService.getBySlug>>;

    Given('the content repository contains a page with slug "about"', async () => {
      expect(await testContentService.getBySlug("about")).not.toBeNull();
    });

    When('the content service retrieves the page by slug "about"', async () => {
      const caller = createCaller({ contentService: testContentService } as TRPCContext);
      result = await caller.content.getBySlug({ slug: "about" });
    });

    Then("the response contains the page title", () => {
      expect(result).not.toBeNull();
      expect(result?.title).toBeTruthy();
    });

    And("the response contains rendered HTML content", () => {
      expect(result?.html).toBeTruthy();
    });

    And("the response contains extracted headings", () => {
      expect(result?.headings).toBeDefined();
      expect(Array.isArray(result?.headings)).toBe(true);
    });
  });

  // @scenario specs/apps/ose/www/behaviours/backend/content/content-retrieval.feature: Updates are listed newest first
  Scenario("Updates are listed newest first", ({ Given, When, Then }) => {
    let results: ContentMeta[];

    Given("the content repository contains multiple update posts", async () => {
      expect((await testContentService.listUpdates()).length).toBeGreaterThan(1);
    });

    When("the content service lists all updates", async () => {
      const caller = createCaller({ contentService: testContentService } as TRPCContext);
      results = await caller.content.listUpdates();
    });

    Then("the updates are returned sorted by date descending", () => {
      expect(results.length).toBeGreaterThan(1);
      for (let i = 0; i < results.length - 1; i++) {
        const current = results[i]?.date?.getTime() ?? 0;
        const next = results[i + 1]?.date?.getTime() ?? 0;
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });
  });

  // @scenario specs/apps/ose/www/behaviours/backend/content/content-retrieval.feature: Each update shows title, date, summary, and tags
  Scenario("Each update shows title, date, summary, and tags", ({ Given, When, Then }) => {
    let results: ContentMeta[];

    Given("the content repository contains multiple update posts", async () => {
      expect((await testContentService.listUpdates()).length).toBeGreaterThan(1);
    });

    When("the content service lists all updates", async () => {
      const caller = createCaller({ contentService: testContentService } as TRPCContext);
      results = await caller.content.listUpdates();
    });

    Then("each update contains title, date, summary, and tags", () => {
      for (const update of results) {
        expect(update.title).toBeTruthy();
        expect(update.date).toBeInstanceOf(Date);
        expect(update.summary).toBeTruthy();
        expect(Array.isArray(update.tags)).toBe(true);
      }
    });
  });

  // @scenario specs/apps/ose/www/behaviours/backend/content/content-retrieval.feature: Draft pages are excluded from listings
  Scenario("Draft pages are excluded from listings", ({ Given, When, Then, And }) => {
    let results: ContentMeta[];
    let service: ContentService;

    Given("the content repository contains a draft page", async () => {
      expect((await testRepositoryWithDraft.readAllContent()).some((entry) => entry.draft === true)).toBe(true);
    });

    And("the OSE_WEB_SHOW_DRAFTS environment variable is not set", () => {
      service = new ContentService(testRepositoryWithDraft, undefined, { showDrafts: false });
    });

    When("the content service lists all updates", async () => {
      const caller = createCaller({ contentService: service } as TRPCContext);
      results = await caller.content.listUpdates();
    });

    Then("the draft page is not included in the results", () => {
      const hasDraft = results.some((r) => r.draft === true);
      expect(hasDraft).toBe(false);
    });
  });

  // @scenario specs/apps/ose/www/behaviours/backend/content/content-retrieval.feature: Non-existent slug returns null
  Scenario("Non-existent slug returns null", ({ Given, When, Then }) => {
    let result: Awaited<ReturnType<typeof testContentService.getBySlug>>;

    Given('the content repository contains no page with slug "nonexistent"', async () => {
      expect(await testContentService.getBySlug("nonexistent")).toBeNull();
    });

    When('the content service retrieves the page by slug "nonexistent"', async () => {
      const caller = createCaller({ contentService: testContentService } as TRPCContext);
      result = await caller.content.getBySlug({ slug: "nonexistent" });
    });

    Then("the response is null", () => {
      expect(result).toBeNull();
    });
  });
});
