import { describe, expect, it, vi } from "vitest";

// Content entries: one content page, one loose page
const contentMap = new Map([
  [
    "en:learn/software-engineering",
    { locale: "en", slug: "learn/software-engineering", isSection: false, date: null, title: "SE", description: null },
  ],
  [
    "en:about-ayokoding",
    { locale: "en", slug: "about-ayokoding", isSection: false, date: null, title: "About", description: null },
  ],
]);

vi.mock("@/features/app-shell/shell/trpc-init", () => ({
  createTRPCContext: () => ({
    contentService: {
      getIndex: async () => ({ contentMap }),
    },
  }),
}));

// eslint-disable-next-line import/first
import sitemap from "../../../src/app/sitemap";

describe("sitemap", () => {
  it("emits every entry on the canonical www host", async () => {
    const entries = await sitemap();
    expect(entries).toHaveLength(2);
    expect(entries.map(({ url }) => new URL(url).host)).toEqual(["www.ayokoding.com", "www.ayokoding.com"]);
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
});
