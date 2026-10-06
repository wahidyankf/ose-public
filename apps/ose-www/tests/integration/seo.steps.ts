import path from "node:path";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import type { ContentMeta } from "@/features/content/core/types";
import { FileSystemContentRepository } from "@/features/content/shell/repository-fs";
import { ContentService } from "@/features/content/shell/service";
import { buildSitemapEntries } from "@/features/seo/core/sitemap";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ose/www/behaviours/backend/seo/seo.feature"),
);
const contentDirectory = path.resolve(process.cwd(), "tests/e2e-fixtures/content");
const siteUrl = "https://www.oseplatform.com";

describeFeature(
  feature,
  ({ Background, Scenario }) => {
    Background(({ Given }) => {
      Given("the API is running", () => {
        expect(buildSitemapEntries([], new Date("2026-01-01T00:00:00Z"))).toHaveLength(3);
      });
    });

    Scenario("Sitemap contains all public pages", ({ Given, When, Then, And }) => {
      let updates: ContentMeta[] = [];
      let sitemap: ReturnType<typeof buildSitemapEntries> = [];

      Given("the content repository contains public pages", async () => {
        const service = new ContentService(new FileSystemContentRepository(contentDirectory, false), undefined, {
          showDrafts: false,
        });
        const index = await service.getIndex();
        updates = index.updates;
        expect(index.contentMap.has("about")).toBe(true);
        expect(updates).toHaveLength(5);
      });
      When("the sitemap is generated", () => {
        sitemap = buildSitemapEntries(updates, new Date("2026-01-01T00:00:00Z"));
      });
      Then("the sitemap contains a URL for the landing page", () => {
        expect(sitemap.some(({ url }) => url === siteUrl)).toBe(true);
      });
      And("the sitemap contains a URL for the about page", () => {
        expect(sitemap.some(({ url }) => url === `${siteUrl}/about/`)).toBe(true);
      });
      And("the sitemap contains URLs for all update pages", () => {
        for (const { slug } of updates) {
          expect(sitemap.some(({ url }) => url === `${siteUrl}/${slug}/`)).toBe(true);
        }
      });
      And('every sitemap URL is on the canonical host "www.oseplatform.com"', () => {
        expect(sitemap.length).toBeGreaterThan(0);
        expect(sitemap.map(({ url }) => new URL(url).host)).toEqual(sitemap.map(() => "www.oseplatform.com"));
      });
    });
  },
  { excludeTags: ["integration-exempt"] },
);
