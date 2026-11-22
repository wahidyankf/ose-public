import path from "node:path";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, vi } from "vitest";

// ContentService's pure/in-memory path shares one text helper with the filesystem adapter. Supply
// the server-only environment port so importing that helper in jsdom never consults process state.
vi.mock("../../../src/env", () => ({
  env: {
    AYOKODING_WEB_CONTENT_DIR: undefined,
    AYOKODING_WEB_SHOW_DRAFTS: undefined,
  },
}));

import type { ContentMeta } from "../../../src/features/content/core/types";
import { contentUrl } from "../../../src/features/content/core/content-url";
import { InMemoryContentRepository } from "../../../src/features/content/shell/repository-memory";
import { ContentService } from "../../../src/features/content/shell/service";

const feature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/frontend/navigation/architecture-cases-routes.feature",
  ),
);

const cases = [
  {
    slug: "learn/software-engineering/software-architecture/by-example/cases/in-fp",
    heading: "In FP — F# / Clojure / TypeScript / Haskell",
  },
  {
    slug: "learn/software-engineering/software-architecture/by-example/cases/in-oop",
    heading: "In OOP — Java / Spring Boot",
  },
  {
    slug: "learn/software-engineering/software-architecture/by-example/cases/in-procedural",
    heading: "In Procedural — Go / Rust",
  },
] as const;

describeFeature(feature, ({ ScenarioOutline, Background }) => {
  let service: ContentService;
  let response: Awaited<ReturnType<ContentService["getBySlug"]>>;
  let resolvedRoute = "";

  Background(({ Given }) => {
    Given("the app is running", () => {
      const items: ContentMeta[] = cases.map(({ slug, heading }, index) => ({
        title: heading,
        slug,
        locale: "en",
        weight: index + 1,
        tags: [],
        draft: false,
        isSection: false,
        filePath: `/injected/${slug}.md`,
      }));
      const files = new Map(
        items.map((item) => [
          item.filePath,
          { content: `# ${item.title}\n\nRoute body.`, frontmatter: { title: item.title } },
        ]),
      );
      service = new ContentService(new InMemoryContentRepository(items, files));
      response = null;
      expect(service).toBeInstanceOf(ContentService);
    });
  });

  async function navigate(slug: string): Promise<void> {
    response = await service.getBySlug("en", slug);
    resolvedRoute = contentUrl("en", slug);
  }

  function assertPage(slug: string, heading: string): void {
    expect(response).not.toBeNull();
    expect(resolvedRoute).toBe(`/en/${slug}`);
    expect(response?.title).toBe(heading);
  }

  // @scenario specs/apps/ayokoding/www/behaviours/frontend/navigation/architecture-cases-routes.feature: architecture case pages are reachable
  ScenarioOutline("architecture case pages are reachable", ({ When, Then, And }, variables) => {
    const slug = String(variables.slug);
    const heading = String(variables.heading);
    When('a visitor navigates to "/en/<slug>"', async () => {
      await navigate(slug);
    });
    Then("the page should respond with HTTP 200", () => {
      expect(response).not.toBeNull();
    });
    And('the page should contain a heading with text "<heading>"', () => {
      assertPage(slug, heading);
    });
  });
});
