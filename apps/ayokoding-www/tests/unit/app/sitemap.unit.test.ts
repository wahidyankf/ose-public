import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { SITE_URL } from "@/lib/site-url";

// Content entries: one content page, one loose page (both dateless, exercising
// the build-time fallback), one dated section, one dateless loose page.
const INDEX = vi.hoisted(
  () =>
    new Map([
      [
        "en:learn/software-engineering",
        {
          locale: "en",
          slug: "learn/software-engineering",
          isSection: false,
          date: null,
          title: "SE",
          description: null,
        },
      ],
      [
        "en:about-ayokoding",
        {
          locale: "en",
          slug: "about-ayokoding",
          isSection: false,
          date: null,
          title: "About",
          description: null,
        },
      ],
      [
        "en:learn",
        {
          title: "Learn",
          slug: "learn",
          locale: "en",
          weight: 0,
          date: new Date("2026-01-15T00:00:00Z"),
          description: "Learn stuff",
          tags: [],
          draft: false,
          isSection: true,
          filePath: "/virtual/en/learn/_index.md",
        },
      ],
      [
        "en:about",
        {
          title: "About",
          slug: "about",
          locale: "en",
          weight: 1,
          description: "About us",
          tags: [],
          draft: false,
          isSection: false,
          filePath: "/virtual/en/about.md",
        },
      ],
    ]),
);

vi.mock("@/features/app-shell/shell/trpc-init", () => ({
  createTRPCContext: () => ({
    contentService: {
      getIndex: async () => ({ contentMap: INDEX }),
    },
  }),
}));

describe("sitemap", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-06-15T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });
  it("emits every entry on the canonical www host", async () => {
    const entries = await sitemap();
    expect(entries).toHaveLength(4);
    for (const { url } of entries) {
      expect(new URL(url).host).toBe("www.ayokoding.com");
    }
  });

  it("emits a bare URL for content pages (DD-48 — no /c/ namespace)", async () => {
    const entries = await sitemap();
    const contentEntry = entries.find((e) => e.url.includes("learn/software-engineering"));
    expect(contentEntry).toBeDefined();
    expect(contentEntry?.url).toContain("/en/learn/software-engineering");
    expect(contentEntry?.url).not.toContain("/c/");
  });

  it("emits bare URL for loose pages (about-ayokoding)", async () => {
    const entries = await sitemap();
    const looseEntry = entries.find((e) => e.url.includes("about-ayokoding"));
    expect(looseEntry).toBeDefined();
    expect(looseEntry?.url).not.toContain("/c/");
    expect(looseEntry?.url).toContain("/en/about-ayokoding");
  });

  it("uses the stored date when the entry has one", async () => {
    const entries = await sitemap();
    const section = entries.find((e) => e.url === `${SITE_URL}/en/learn`);
    expect(section?.lastModified).toEqual(new Date("2026-01-15T00:00:00Z"));
  });

  it("falls back to the fixed build clock for dateless entries", async () => {
    const entries = await sitemap();
    const dateless = entries.find((e) => e.url === `${SITE_URL}/en/about`);
    expect(dateless?.lastModified).toEqual(new Date("2026-06-15T00:00:00Z"));
  });
});

describe("robots", () => {
  it("allows every agent and points at the sitemap", () => {
    expect(robots()).toEqual({
      rules: [{ userAgent: "*", allow: "/" }],
      sitemap: `${SITE_URL}/sitemap.xml`,
    });
  });
});
