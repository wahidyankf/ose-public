import path from "path";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import type { ContentMeta } from "@/server/content/types";
import { InMemoryContentRepository } from "@/server/content/repository-memory";
import { ContentService } from "@/server/content/service";

const feature = await loadFeature(
  path.resolve(process.cwd(), "../../specs/apps/oseplatform/be/gherkin/rss-feed/rss-feed.feature"),
);

const SITE_URL = "https://oseplatform.com";

function buildRssFeed(updates: ContentMeta[]): string {
  const items = updates
    .map((update) => {
      const dateStr = update.date ? new Date(update.date).toUTCString() : "";
      return `    <item>
      <title><![CDATA[${update.title}]]></title>
      <link>${SITE_URL}/${update.slug}/</link>
      <guid>${SITE_URL}/${update.slug}/</guid>
      ${dateStr ? `<pubDate>${dateStr}</pubDate>` : ""}
      ${update.summary ? `<description><![CDATA[${update.summary}]]></description>` : ""}
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>OSE Platform Updates</title>
    <link>${SITE_URL}/updates/</link>
    <description>Updates on the Open Sharia Enterprise Platform development</description>
    <language>en</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;
}

describeFeature(feature, ({ Scenario, Background }) => {
  Background(({ Given }) => {
    Given("the API is running", () => {
      // service is ready
    });
  });

  Scenario("RSS feed contains valid structure", ({ Given, When, Then, And }) => {
    let updates: ContentMeta[];
    let feedXml: string;

    Given("the content repository contains update posts", async () => {
      const repo = new InMemoryContentRepository([
        {
          meta: {
            title: "Phase 0 Week 4",
            slug: "updates/2025-12-14-phase-0-week-4",
            date: new Date("2025-12-14T00:00:00Z"),
            draft: false,
            description: "Week 4",
            tags: [],
            summary: "Initial setup",
            weight: 0,
            isSection: false,
            filePath: "/mock/updates/week-4.md",
            readingTime: 5,
            category: "updates",
          },
          content: "## Week 4\n\nInitial setup.",
        },
      ]);
      const service = new ContentService(repo);
      updates = await service.listUpdates();
    });

    When("the RSS feed is generated", () => {
      feedXml = buildRssFeed(updates);
    });

    Then('the feed has a channel with title "OSE Platform Updates"', () => {
      expect(feedXml).toContain("<title>OSE Platform Updates</title>");
    });

    And("the feed has a channel link to the site URL", () => {
      expect(feedXml).toContain(`<link>${SITE_URL}/updates/</link>`);
    });

    And("the feed contains item elements for each update", () => {
      expect(feedXml).toContain("<item>");
      expect(feedXml).toContain("</item>");
    });
  });

  Scenario("RSS feed entries contain required fields", ({ Given, When, Then, And }) => {
    let updates: ContentMeta[];
    let feedXml: string;

    Given('the content repository contains an update post with title "Phase 0 End" and date "2026-02-08"', async () => {
      const repo = new InMemoryContentRepository([
        {
          meta: {
            title: "Phase 0 End",
            slug: "updates/2026-02-08-phase-0-end",
            date: new Date("2026-02-08T00:00:00Z"),
            draft: false,
            description: "End of phase 0",
            tags: [],
            summary: "Phase 0 complete",
            weight: 0,
            isSection: false,
            filePath: "/mock/updates/phase-0-end.md",
            readingTime: 5,
            category: "updates",
          },
          content: "## Phase 0 End\n\nPhase complete.",
        },
      ]);
      const service = new ContentService(repo);
      updates = await service.listUpdates();
    });

    When("the RSS feed is generated", () => {
      feedXml = buildRssFeed(updates);
    });

    Then('the feed entry has the title "Phase 0 End"', () => {
      expect(feedXml).toContain("<![CDATA[Phase 0 End]]>");
    });

    And("the feed entry has a publication date", () => {
      expect(feedXml).toContain("<pubDate>");
    });

    And("the feed entry has a link to the update page", () => {
      expect(feedXml).toContain(`<link>${SITE_URL}/updates/2026-02-08-phase-0-end/</link>`);
    });

    And("the feed entry has a description", () => {
      expect(feedXml).toContain("<description>");
    });
  });
});
