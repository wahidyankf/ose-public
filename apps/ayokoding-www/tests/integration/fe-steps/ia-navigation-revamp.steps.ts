import path from "node:path";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { GET as getFeed } from "@/app/feed.xml/route";
import sitemap from "@/app/sitemap";
import { FileSystemContentRepository } from "@/features/content/shell/repository-fs";
import { ContentService } from "@/features/content/shell/service";
import { integrationCaller } from "../be-steps/helpers/integration-caller";

const feature = await loadFeature(
  path.resolve(
    process.cwd(),
    "../../specs/apps/ayokoding/www/behaviours/frontend/navigation/ia-navigation-revamp.feature",
  ),
);

/** The real content tree the sitemap and feed routes read, counted independently of them. */
async function indexedContent() {
  const service = new ContentService(new FileSystemContentRepository(path.resolve(process.cwd(), "content")));
  return [...(await service.getIndex()).contentMap.values()];
}

describeFeature(
  feature,
  ({ Background, Scenario }) => {
    Background(({ Given }) => {
      Given("the app is running", async () => {
        await expect(integrationCaller.meta.health()).resolves.toEqual({ status: "ok" });
      });
    });

    Scenario(
      "Sitemap lists every content URL bare, with no distinct content namespace",
      ({ Given, When, Then, And, But }) => {
        let indexedCount = 0;
        let sitemapUrls: string[] = [];

        Given("the sitemap is generated from the content index", async () => {
          indexedCount = (await indexedContent()).length;
          expect(indexedCount).toBeGreaterThan(0);
        });

        When("the sitemap entries are produced", async () => {
          sitemapUrls = (await sitemap()).map(({ url }) => url);
          expect(sitemapUrls).toHaveLength(indexedCount);
        });

        Then("every moved-content entry uses a bare URL", () => {
          expect(sitemapUrls).toContain("https://www.ayokoding.com/en/learn/legacy/software-engineering");
          expect(sitemapUrls.filter((url) => /^https:\/\/[^/]+\/(?:en|id)\/c\//u.test(url))).toEqual([]);
        });

        And('every sitemap entry is on the canonical host "www.ayokoding.com"', () => {
          expect(sitemapUrls.map((url) => new URL(url).host)).toEqual(sitemapUrls.map(() => "www.ayokoding.com"));
        });

        But("top-level pages (about, terms, tools) use that same bare form — no longer namespace-distinct", () => {
          expect(sitemapUrls).toContain("https://www.ayokoding.com/en/about-ayokoding");
          expect(sitemapUrls).toContain("https://www.ayokoding.com/en/terms-and-conditions");
        });
      },
    );

    Scenario("RSS feed item links use bare content URLs", ({ Given, When, Then, And }) => {
      let englishItemCount = 0;
      let feedXml = "";

      Given("the feed is generated from the content index", async () => {
        englishItemCount = (await indexedContent()).filter(
          ({ isSection, locale }) => !isSection && locale === "en",
        ).length;
        expect(englishItemCount).toBeGreaterThan(0);
      });

      When("the feed items are produced", async () => {
        feedXml = await (await getFeed()).text();
      });

      Then("every content item link uses a bare URL", () => {
        const itemLinks = feedXml
          .split("<item>")
          .slice(1)
          .map((item) => /<link>([^<]+)<\/link>/u.exec(item)?.[1] ?? "");
        expect(itemLinks).toHaveLength(englishItemCount);
        expect(itemLinks.filter((link) => !/^https:\/\/[^/]+\/en\/(?!c\/)[^/]/u.test(link))).toEqual([]);
        expect(itemLinks.some((link) => link.startsWith("https://www.ayokoding.com/en/rants/"))).toBe(true);
      });

      And('every feed link is on the canonical host "www.ayokoding.com"', () => {
        // The channel link, the self link, and each English item's link and guid.
        const feedUrls = [
          ...feedXml.matchAll(/<(?:link|guid)>([^<]+)<\/(?:link|guid)>|<atom:link href="([^"]+)"/gu),
        ].map((match) => match[1] ?? match[2]!);
        expect(feedUrls).toHaveLength(2 + 2 * englishItemCount);
        expect(feedUrls.map((url) => new URL(url).host)).toEqual(feedUrls.map(() => "www.ayokoding.com"));
      });
    });
  },
  { excludeTags: ["integration-exempt"] },
);
