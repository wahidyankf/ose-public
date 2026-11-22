import { describe, expect, it, vi } from "vitest";
import type { ContentMeta } from "@/features/content/core/types";
import { buildFeed } from "@/features/rss-feed/shell/feed-builder";
import { buildSitemap } from "@/features/seo/shell/sitemap-builder";
import { buildRobots } from "@/features/seo/core/robots";
import { buildSitemapEntries } from "@/features/seo/core/sitemap";
import { defaultMetadata } from "@/features/seo/shell/metadata";
import { SITE_URL } from "@/lib/site-url";
import { mockUpdateMetas } from "./be-steps/helpers/mock-content";

const listUpdates = vi.hoisted(() => vi.fn<() => Promise<ContentMeta[]>>());

vi.mock("@/lib/trpc/server", () => ({
  serverCaller: { content: { listUpdates } },
}));

const NOW = new Date("2026-03-15T00:00:00Z");

function update(overrides: Partial<ContentMeta>): ContentMeta {
  return { ...mockUpdateMetas[0]!, ...overrides };
}

describe("robots rules", () => {
  it("allow every crawler and point at the sitemap on the canonical origin", () => {
    expect(buildRobots()).toEqual({
      rules: [{ userAgent: "*", allow: "/" }],
      sitemap: `${SITE_URL}/sitemap.xml`,
    });
  });
});

describe("sitemap entries", () => {
  it("lists the three static pages before the updates", () => {
    const entries = buildSitemapEntries([], NOW);
    expect(entries.map((entry) => entry.url)).toEqual([`${SITE_URL}`, `${SITE_URL}/about/`, `${SITE_URL}/updates/`]);
  });

  it("gives each update its date as lastModified", () => {
    const [first] = buildSitemapEntries([mockUpdateMetas[0]!], NOW).slice(3);
    expect(first).toEqual({
      url: `${SITE_URL}/${mockUpdateMetas[0]!.slug}/`,
      lastModified: mockUpdateMetas[0]!.date,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  });

  it("falls back to the build time when an update has no date", () => {
    const [entry] = buildSitemapEntries([update({ date: undefined })], NOW).slice(3);
    expect(entry?.lastModified).toBe(NOW);
  });
});

describe("default metadata", () => {
  it("sets the site title template, description, and metadata base", () => {
    expect(defaultMetadata.title).toEqual({ default: "OSE Platform", template: "%s | OSE Platform" });
    expect(defaultMetadata.description).toContain("Sharia-compliant enterprise solutions");
    expect(String(defaultMetadata.metadataBase)).toBe(`${SITE_URL}/`);
  });
});

describe("feed builder shell", () => {
  it("serves the updates as RSS 2.0 XML", async () => {
    listUpdates.mockResolvedValueOnce(mockUpdateMetas);

    const response = await buildFeed();
    const body = await response.text();

    expect(response.headers.get("Content-Type")).toBe("application/xml");
    expect(body).toContain('<rss version="2.0"');
    expect(body).toContain(`<atom:link href="${SITE_URL}/feed.xml"`);
    expect(body).toContain(`<link>${SITE_URL}/${mockUpdateMetas[0]!.slug}/</link>`);
    expect(body).toContain(`<title><![CDATA[${mockUpdateMetas[1]!.title}]]></title>`);
  });

  it("emits an item for every update, with a date and a summary when present", async () => {
    listUpdates.mockResolvedValueOnce([update({ title: "Dated", summary: "Has a summary" })]);

    const body = await (await buildFeed()).text();

    expect(body.match(/<item>/g)).toHaveLength(1);
    expect(body).toContain("<pubDate>");
    expect(body).toContain("<description><![CDATA[Has a summary]]></description>");
  });

  it("omits the date and the description when the update has neither", async () => {
    listUpdates.mockResolvedValueOnce([update({ date: undefined, summary: undefined, slug: "updates/bare" })]);

    const body = await (await buildFeed()).text();

    expect(body).not.toContain("<pubDate>");
    expect(body).not.toContain("<description><![CDATA[");
    expect(body).toContain(`<guid>${SITE_URL}/updates/bare/</guid>`);
  });
});

describe("sitemap builder shell", () => {
  it("builds the sitemap from the listed updates", async () => {
    listUpdates.mockResolvedValueOnce(mockUpdateMetas);

    const entries = await buildSitemap();

    expect(entries).toHaveLength(3 + mockUpdateMetas.length);
    expect(entries.at(-1)?.url).toBe(`${SITE_URL}/${mockUpdateMetas[1]!.slug}/`);
  });
});
