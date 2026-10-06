import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import type { ContentMeta } from "@/features/content/core/types";
import { InMemoryContentRepository } from "@/features/content/core/repository-memory";
import { ContentService } from "@/features/content/shell/service";
import { buildRobots } from "@/features/seo/core/robots";
import { buildSitemapEntries } from "@/features/seo/core/sitemap";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ose/www/behaviours/backend/seo/seo.feature"),
);

const FIXED_NOW = new Date("2026-01-01T00:00:00Z");
const SITE_URL = "https://www.oseplatform.com";

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given }) => {
    Given("the API is running", () => {
      expect(buildRobots().sitemap).toContain("/sitemap.xml");
    });
  });

  Scenario("Sitemap contains all public pages", ({ Given, When, Then, And }) => {
    let sitemap: ReturnType<typeof buildSitemapEntries>;
    let updates: ContentMeta[];

    Given("the content repository contains public pages", async () => {
      const repo = new InMemoryContentRepository([
        {
          meta: {
            title: "About OSE Platform",
            slug: "about",
            date: new Date("2026-02-22T00:00:00Z"),
            draft: false,
            description: "About",
            tags: [],
            summary: "About page",
            weight: 0,
            isSection: false,
            filePath: "/mock/about.md",
            readingTime: 3,
            category: undefined,
          },
          content: "## About\n\nAbout the platform.",
        },
        {
          meta: {
            title: "Phase 0 End",
            slug: "updates/2026-02-08-phase-0-end",
            date: new Date("2026-02-08T00:00:00Z"),
            draft: false,
            description: "Phase 0",
            tags: [],
            summary: "Phase 0 complete",
            weight: 0,
            isSection: false,
            filePath: "/mock/updates/phase-0-end.md",
            readingTime: 5,
            category: "updates",
          },
          content: "## Phase 0 End\n\nComplete.",
        },
      ]);
      const service = new ContentService(repo);
      updates = await service.listUpdates();
      expect(updates).toHaveLength(1);
    });

    When("the sitemap is generated", () => {
      sitemap = buildSitemapEntries(updates, FIXED_NOW);
    });

    Then("the sitemap contains a URL for the landing page", () => {
      expect(sitemap.some((entry) => entry.url === SITE_URL)).toBe(true);
    });

    And("the sitemap contains a URL for the about page", () => {
      expect(sitemap.some((entry) => entry.url === `${SITE_URL}/about/`)).toBe(true);
    });

    And("the sitemap contains URLs for all update pages", () => {
      expect(sitemap.some((entry) => entry.url.includes("updates/2026-02-08-phase-0-end"))).toBe(true);
    });

    And('every sitemap URL is on the canonical host "www.oseplatform.com"', () => {
      expect(sitemap.length).toBeGreaterThan(0);
      expect(sitemap.map((entry) => new URL(entry.url).host)).toEqual(sitemap.map(() => "www.oseplatform.com"));
    });
  });

  Scenario("Robots.txt allows all crawlers", ({ When, Then, And }) => {
    let robots: ReturnType<typeof buildRobots>;

    When("the robots.txt is generated", () => {
      robots = buildRobots();
    });

    Then("it allows all user agents", () => {
      expect(robots.rules).toContainEqual(expect.objectContaining({ userAgent: "*", allow: "/" }));
    });

    And("it references the sitemap URL", () => {
      expect(robots.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
    });

    And('the sitemap URL is on the canonical host "www.oseplatform.com"', () => {
      expect(new URL(String(robots.sitemap)).host).toBe("www.oseplatform.com");
    });
  });
});
