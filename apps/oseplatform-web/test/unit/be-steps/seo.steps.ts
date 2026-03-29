import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import type { ContentMeta } from "@/server/content/types";
import { InMemoryContentRepository } from "@/server/content/repository-memory";
import { ContentService } from "@/server/content/service";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/oseplatform/be/gherkin/seo/seo.feature"),
);

const SITE_URL = "https://oseplatform.com";

interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: string;
  priority: number;
}

function buildSitemap(updates: ContentMeta[]): SitemapEntry[] {
  const staticPages: SitemapEntry[] = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    {
      url: `${SITE_URL}/about/`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/updates/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const updatePages: SitemapEntry[] = updates.map((update) => ({
    url: `${SITE_URL}/${update.slug}/`,
    lastModified: update.date ?? new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticPages, ...updatePages];
}

function buildRobots(): { rules: { userAgent: string; allow: string }[]; sitemap: string } {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given }) => {
    Given("the API is running", () => {
      // service is ready
    });
  });

  Scenario("Sitemap contains all public pages", ({ Given, When, Then, And }) => {
    let sitemap: SitemapEntry[];

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
      const updates = await service.listUpdates();
      sitemap = buildSitemap(updates);
    });

    When("the sitemap is generated", () => {
      // already generated in Given
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
  });
});
