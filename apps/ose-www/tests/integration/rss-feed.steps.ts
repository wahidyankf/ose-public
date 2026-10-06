import path from "node:path";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import type { ContentMeta } from "@/features/content/core/types";
import { FileSystemContentRepository } from "@/features/content/shell/repository-fs";
import { ContentService } from "@/features/content/shell/service";
import { buildFeedResponse } from "@/features/rss-feed/core/feed";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/ose/www/behaviours/backend/rss-feed/rss-feed.feature"),
);
const contentDirectory = path.resolve(process.cwd(), "tests/e2e-fixtures/content");
const siteUrl = "https://www.oseplatform.com";

function realContentService(): ContentService {
  return new ContentService(new FileSystemContentRepository(contentDirectory, false), undefined, {
    showDrafts: false,
  });
}

describeFeature(feature, ({ Background, Scenario }) => {
  Background(({ Given }) => {
    Given("the API is running", async () => {
      const response = buildFeedResponse([]);
      expect(response.headers.get("content-type")).toBe("application/xml");
      expect(await response.text()).toContain("<rss");
    });
  });

  Scenario("RSS feed contains valid structure", ({ Given, When, Then, And }) => {
    let updates: ContentMeta[] = [];
    let feed = "";

    Given("the content repository contains update posts", async () => {
      updates = await realContentService().listUpdates();
      expect(updates).toHaveLength(5);
    });
    When("the RSS feed is generated", async () => {
      feed = await buildFeedResponse(updates).text();
    });
    Then('the feed has a channel with title "OSE Platform Updates"', () => {
      expect(feed).toContain("<title>OSE Platform Updates</title>");
    });
    And("the feed has a channel link to the site URL", () => {
      expect(feed).toContain(`<link>${siteUrl}/updates/</link>`);
    });
    And("the feed contains item elements for each update", () => {
      expect(feed.match(/<item>/gu)).toHaveLength(updates.length);
      expect(feed.match(/<\/item>/gu)).toHaveLength(updates.length);
    });
    And('every feed link is on the canonical host "www.oseplatform.com"', () => {
      // The channel link, the self link, and each item's link and guid.
      const feedUrls = [...feed.matchAll(/<(?:link|guid)>([^<]+)<\/(?:link|guid)>|<atom:link href="([^"]+)"/gu)].map(
        (match) => match[1] ?? match[2]!,
      );
      expect(feedUrls).toHaveLength(2 + 2 * updates.length);
      expect(feedUrls.map((url) => new URL(url).host)).toEqual(feedUrls.map(() => "www.oseplatform.com"));
    });
  });

  Scenario("RSS feed entries contain required fields", ({ Given, When, Then, And }) => {
    let updates: ContentMeta[] = [];
    let feed = "";

    Given('the content repository contains an update post with title "Phase 0 End" and date "2026-02-08"', async () => {
      updates = await realContentService().listUpdates();
      expect(
        updates.some(
          ({ title, date }) => title === "Phase 0 End" && date?.toISOString().startsWith("2026-02-08") === true,
        ),
      ).toBe(true);
    });
    When("the RSS feed is generated", async () => {
      feed = await buildFeedResponse(updates).text();
    });
    Then('the feed entry has the title "Phase 0 End"', () => {
      expect(feed).toContain("<![CDATA[Phase 0 End]]>");
    });
    And("the feed entry has a publication date", () => {
      expect(feed).toContain("<pubDate>Sun, 08 Feb 2026 00:00:00 GMT</pubDate>");
    });
    And("the feed entry has a link to the update page", () => {
      expect(feed).toContain(`<link>${siteUrl}/updates/2026-02-08-phase-0-end/</link>`);
    });
    And("the feed entry has a description", () => {
      expect(feed).toContain("<![CDATA[Synthetic Phase 0 completion update]]>");
    });
  });
});
