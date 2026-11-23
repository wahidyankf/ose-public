import path from "path";
import { renderToStaticMarkup } from "react-dom/server";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect, vi } from "vitest";
import type { ContentMeta } from "@/features/content/core/types";
import { ContentService } from "@/features/content/shell/service";
import { createCallerFactory } from "@/lib/trpc/init";
import type { TRPCContext } from "@/lib/trpc/init";
import { appRouter } from "@/features/app-shell/shell/root-router";
import AboutPage from "@/app/about/page";
import UpdatesPage from "@/app/updates/page";
import UpdateDetailPage from "@/app/updates/[slug]/page";
import { InMemoryContentRepository } from "@/features/content/core/repository-memory";
import { testContentService, testRepositoryWithDraft } from "./helpers/test-service";
import { memoryContentFs } from "../helpers/memory-content-fs";

// The pages read content through the server caller. The harness points that caller at whichever
// content service the current scenario set up, so the page renders the same data the scenario checks.
const pageHarness = vi.hoisted(() => ({ service: undefined as ContentService | undefined }));

vi.mock("@/lib/trpc/server", async () => {
  const { createCallerFactory: makeFactory } = await import("@/lib/trpc/init");
  const { appRouter: router } = await import("@/features/app-shell/shell/root-router");
  const callerFor = () => makeFactory(router)({ contentService: pageHarness.service } as TRPCContext);
  return {
    serverCaller: {
      content: {
        getBySlug: (input: { slug: string }) => callerFor().content.getBySlug(input),
        listUpdates: () => callerFor().content.listUpdates(),
      },
    },
  };
});

// next/navigation's notFound() throws a sentinel outside Next; Next turns that sentinel into a 404.
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

// The page chrome is covered by the navigation and header scenarios; these scenarios check the content.
vi.mock("@/features/app-shell/shell/header", () => ({ Header: () => null }));
vi.mock("@/features/app-shell/shell/footer", () => ({ Footer: () => null }));

const feature = await loadFeature(
  path.resolve(__dirname, "../../../../../specs/apps/ose/www/behaviours/backend/content/content-retrieval.feature"),
);

const createCaller = createCallerFactory(appRouter);

// The file-system scenarios read through an in-memory double; the integration run reads the real disk.
function contentFixture(directory: string): Record<string, string> {
  return {
    [`${directory}/about.md`]: `---\ntitle: "About"\n---\n\n# About\n`,
    [`${directory}/updates/2026-02-04-phase-4.md`]: `---\ntitle: "Phase 4"\ndate: 2026-02-04T00:00:00Z\n---\n\nPhase four.\n`,
  };
}

const SEARCH_INDEX = [
  {
    id: "about",
    title: "Enterprise Compliance Fixture",
    content: "Synthetic enterprise and compliance evidence for isolated search tests.",
    slug: "about",
  },
];

describeFeature(feature, ({ Scenario, Background, AfterEachScenario }) => {
  AfterEachScenario(() => {
    vi.unstubAllEnvs();
  });

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

  // @scenario specs/apps/ose/www/behaviours/backend/content/content-retrieval.feature: The About page renders at /about with its title and content
  Scenario("The About page renders at /about with its title and content", ({ Given, When, Then, And }) => {
    let page: Awaited<ReturnType<typeof testContentService.getBySlug>>;
    let html = "";

    Given('the content repository contains a page with slug "about"', async () => {
      pageHarness.service = testContentService;
      page = await testContentService.getBySlug("about");
      expect(page).not.toBeNull();
    });

    When("a visitor opens the About page", async () => {
      html = renderToStaticMarkup(await AboutPage());
    });

    Then("the page heading is the title of the About page", () => {
      expect(html).toContain(`<h1 class="mb-4 text-3xl font-bold">${page?.title}</h1>`);
    });

    And("the page shows the headings of the About page", () => {
      for (const heading of page?.headings ?? []) {
        expect(html).toContain(heading.text);
      }
    });
  });

  // @scenario specs/apps/ose/www/behaviours/backend/content/content-retrieval.feature: The Updates page lists the published updates newest first
  Scenario("The Updates page lists the published updates newest first", ({ Given, When, Then }) => {
    let html = "";

    Given("the content repository contains multiple update posts", async () => {
      pageHarness.service = testContentService;
      expect((await testContentService.listUpdates()).length).toBeGreaterThan(1);
    });

    When("a visitor opens the Updates page", async () => {
      html = renderToStaticMarkup(await UpdatesPage());
    });

    Then("the update titles are listed newest first", async () => {
      const updates = await testContentService.listUpdates();
      for (let i = 0; i < updates.length - 1; i++) {
        expect(updates[i]!.date!.getTime()).toBeGreaterThanOrEqual(updates[i + 1]!.date!.getTime());
      }
      const positions = updates.map((update) => html.indexOf(update.title));
      expect(positions.every((position) => position >= 0)).toBe(true);
      for (let i = 0; i < positions.length - 1; i++) {
        expect(positions[i]!).toBeLessThan(positions[i + 1]!);
      }
    });
  });

  // @scenario specs/apps/ose/www/behaviours/backend/content/content-retrieval.feature: Opening an unknown update URL returns 404
  Scenario("Opening an unknown update URL returns 404", ({ When, Then }) => {
    let failure: unknown;

    When('a visitor opens the update page for the slug "no-such-update"', async () => {
      pageHarness.service = testContentService;
      try {
        await UpdateDetailPage({ params: Promise.resolve({ slug: "no-such-update" }) });
      } catch (error) {
        failure = error;
      }
    });

    Then("the response status is 404", () => {
      expect(failure).toEqual(new Error("NEXT_NOT_FOUND"));
    });
  });

  // @scenario specs/apps/ose/www/behaviours/backend/content/content-retrieval.feature: Setting OSE_WEB_SHOW_DRAFTS to true includes draft pages in listings
  Scenario("Setting OSE_WEB_SHOW_DRAFTS to true includes draft pages in listings", ({ Given, And, When, Then }) => {
    let results: ContentMeta[] = [];
    let service: ContentService;

    Given("the content repository contains a draft page", async () => {
      expect((await testRepositoryWithDraft.readAllContent()).some((entry) => entry.draft === true)).toBe(true);
    });

    And('the OSE_WEB_SHOW_DRAFTS environment variable is "true"', async () => {
      vi.stubEnv("OSE_WEB_SHOW_DRAFTS", "true");
      vi.resetModules();
      const { ContentService: FreshService } = await import("@/features/content/shell/service");
      service = new FreshService(testRepositoryWithDraft);
    });

    When("the content service lists all updates", async () => {
      results = await service.listUpdates();
    });

    Then("the draft page is included in the results", () => {
      expect(results.some((entry) => entry.draft === true)).toBe(true);
    });
  });

  // @scenario specs/apps/ose/www/behaviours/backend/content/content-retrieval.feature: Content is read from the directory named by OSE_WEB_CONTENT_DIR
  Scenario("Content is read from the directory named by OSE_WEB_CONTENT_DIR", ({ Given, When, Then }) => {
    const contentDirectory = "/fixture/content";
    const fileSystem = memoryContentFs({ files: contentFixture(contentDirectory) });
    let results: ContentMeta[] = [];
    let service: ContentService;

    Given("the OSE_WEB_CONTENT_DIR environment variable names the content directory", () => {
      vi.stubEnv("OSE_WEB_CONTENT_DIR", contentDirectory);
    });

    When("the content service lists all updates", async () => {
      vi.resetModules();
      const { FileSystemContentRepository: FreshRepository } = await import("@/features/content/shell/repository-fs");
      const { ContentService: FreshService } = await import("@/features/content/shell/service");
      service = new FreshService(new FreshRepository(undefined, false, fileSystem));
      results = await service.listUpdates();
    });

    Then("every listed update is read from that directory", () => {
      expect(results.length).toBeGreaterThan(0);
      for (const entry of results) {
        expect(entry.filePath.startsWith(contentDirectory)).toBe(true);
      }
      expect(fileSystem.reads.every((filePath) => filePath.startsWith(contentDirectory))).toBe(true);
    });
  });

  // @scenario specs/apps/ose/www/behaviours/backend/content/content-retrieval.feature: Search reads the index at the path named by OSE_WEB_SEARCH_DATA_PATH
  Scenario("Search reads the index at the path named by OSE_WEB_SEARCH_DATA_PATH", ({ Given, When, Then }) => {
    const indexPath = "/fixture/search-data.json";
    const readPaths: string[] = [];
    let results: { title: string; slug: string }[] = [];

    Given("the OSE_WEB_SEARCH_DATA_PATH environment variable names a search index file", () => {
      vi.stubEnv("OSE_WEB_SEARCH_DATA_PATH", indexPath);
    });

    When('a search query "synthetic" is executed', async () => {
      vi.resetModules();
      const { env: freshEnv } = await import("@/env");
      const { ContentService: FreshService } = await import("@/features/content/shell/service");
      const service = new FreshService(new InMemoryContentRepository([]), freshEnv.OSE_WEB_SEARCH_DATA_PATH, {
        readSearchData: async (searchDataPath) => {
          readPaths.push(searchDataPath);
          return JSON.stringify(SEARCH_INDEX);
        },
      });
      results = await service.search("synthetic");
    });

    Then("the results contain the page indexed in that file", () => {
      expect(readPaths).toEqual([indexPath]);
      expect(results).toContainEqual(
        expect.objectContaining({ slug: "about", title: "Enterprise Compliance Fixture" }),
      );
    });
  });
});
