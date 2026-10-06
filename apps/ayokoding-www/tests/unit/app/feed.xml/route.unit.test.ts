import { describe, expect, it, vi } from "vitest";

const contentMap = new Map([
  [
    "en:learn/software-engineering",
    {
      locale: "en",
      slug: "learn/software-engineering",
      isSection: false,
      date: "2024-01-01",
      title: "SE",
      description: "Software engineering article",
    },
  ],
  [
    "id:belajar/rekayasa",
    {
      locale: "id",
      slug: "belajar/rekayasa",
      isSection: false,
      date: "2024-01-01",
      title: "Rekayasa",
      description: null,
    },
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
import { GET } from "../../../../src/app/feed.xml/route";

describe("feed GET", () => {
  it("emits the channel, self, and item links on the canonical www host", async () => {
    const text = await (await GET()).text();
    expect(text).toContain("<link>https://www.ayokoding.com</link>");
    expect(text).toContain('<atom:link href="https://www.ayokoding.com/feed.xml" rel="self"');
    expect(text).toContain("<link>https://www.ayokoding.com/en/learn/software-engineering</link>");
    expect(text).toContain("<guid>https://www.ayokoding.com/en/learn/software-engineering</guid>");
  });

  it("emits a bare URL for English content items (DD-48 — no /c/ namespace)", async () => {
    const response = await GET();
    const text = await response.text();
    expect(text).toContain("/en/learn/software-engineering");
    expect(text).not.toContain("/c/learn/software-engineering");
  });

  it("does not include non-English entries", async () => {
    const response = await GET();
    const text = await response.text();
    expect(text).not.toContain("belajar/rekayasa");
  });
});
