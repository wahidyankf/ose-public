/**
 * Additional unit tests to reach 80% coverage on uncovered code paths.
 */
import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";
import { InMemoryContentRepository } from "@/features/content/core/repository-memory";
import { ContentService } from "@/features/content/shell/service";
import type { SearchDoc } from "@/features/content/shell/service";
import { createTRPCContext } from "@/lib/trpc/init";

const FIXED_DATE = new Date("2026-01-01T00:00:00Z");

// --- lib/utils.ts ---
describe("cn utility", () => {
  it("merges class names", () => {
    const result = cn("foo", "bar");
    expect(result).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    const hidden: boolean = false;
    const result = cn("base", hidden && "skipped", "included");
    expect(result).toBe("base included");
  });

  it("handles empty inputs", () => {
    expect(cn()).toBe("");
  });
});

// --- server/trpc/init.ts ---
describe("createTRPCContext", () => {
  it("returns a context with contentService", () => {
    const ctx = createTRPCContext();
    expect(ctx).toHaveProperty("contentService");
  });
});

// --- server/content/repository-memory.ts ---
describe("InMemoryContentRepository", () => {
  it("throws when reading a non-existent file", async () => {
    const repo = new InMemoryContentRepository([]);
    await expect(repo.readFileContent("/nonexistent.md")).rejects.toThrow("File not found: /nonexistent.md");
  });
});

// --- server/content/service.ts: buildSearchIndexFromDocs path ---
describe("ContentService with prebuilt search data path", () => {
  it("loads search index from prebuilt docs file path that does not exist", async () => {
    const repo = new InMemoryContentRepository([
      {
        meta: {
          title: "Test Page",
          slug: "test",
          date: FIXED_DATE,
          draft: false,
          description: "Test",
          tags: [],
          summary: "Summary",
          weight: 0,
          isSection: false,
          filePath: "/mock/test.md",
          readingTime: 1,
          category: undefined,
        },
        content: "## Test\n\nTest content with enterprise topics.",
      },
    ]);

    // Provide a non-existent searchDataPath — falls back to building from files
    const service = new ContentService(repo, "missing-search-data.json", {
      readSearchData: async () => {
        throw new Error("missing synthetic search data");
      },
    });
    const results = await service.search("enterprise", 5);
    expect(results).toHaveLength(1);
    expect(results[0]?.title).toBe("Test Page");
  });

  it("isSearchIndexReady returns false before search and true after", async () => {
    const repo = new InMemoryContentRepository([
      {
        meta: {
          title: "Ready Check",
          slug: "ready",
          date: FIXED_DATE,
          draft: false,
          tags: [],
          summary: "Summary",
          weight: 0,
          isSection: false,
          filePath: "/mock/ready.md",
          readingTime: 1,
          category: undefined,
        },
        content: "## Ready\n\nContent here.",
      },
    ]);
    const service = new ContentService(repo);
    expect(service.isSearchIndexReady()).toBe(false);
    await service.search("content", 5);
    expect(service.isSearchIndexReady()).toBe(true);
  });
});

// --- service.ts: createExcerpt path when query not found (idx === -1) ---
describe("ContentService search excerpt", () => {
  it("returns first 150 chars when query not found in content", async () => {
    const longContent = "A".repeat(200);
    const repo = new InMemoryContentRepository([
      {
        meta: {
          title: "Long Page",
          slug: "long",
          date: FIXED_DATE,
          draft: false,
          tags: [],
          summary: "Summary",
          weight: 0,
          isSection: false,
          filePath: "/mock/long.md",
          readingTime: 1,
          category: undefined,
        },
        content: longContent,
      },
    ]);
    const service = new ContentService(repo);
    // Search for something that exists in title but not in content
    const results = await service.search("long", 5);
    // The excerpt is taken from content where idx === -1 for "long"
    expect(results).toHaveLength(1);
    expect(results[0]?.excerpt).toBe(`${"A".repeat(150)}...`);
  });

  it("returns excerpt with ellipsis when query is in the middle of content", async () => {
    const content = "A".repeat(100) + " enterprise " + "B".repeat(100);
    const repo = new InMemoryContentRepository([
      {
        meta: {
          title: "Middle Page",
          slug: "middle",
          date: FIXED_DATE,
          draft: false,
          tags: [],
          summary: "Summary",
          weight: 0,
          isSection: false,
          filePath: "/mock/middle.md",
          readingTime: 1,
          category: undefined,
        },
        content,
      },
    ]);
    const service = new ContentService(repo);
    const results = await service.search("enterprise", 5);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.excerpt).toContain("enterprise");
  });
});

// --- service.ts: buildSearchIndexFromDocs via an injected data reader ---
describe("ContentService with valid prebuilt search data", () => {
  it("loads search index from injected prebuilt data", async () => {
    const docs: SearchDoc[] = [
      {
        id: "updates/test-page",
        title: "Test Page",
        content: "Enterprise content for testing",
        slug: "updates/test-page",
      },
    ];
    const repo = new InMemoryContentRepository([]);
    const service = new ContentService(repo, "synthetic-search-data.json", {
      readSearchData: async (requestedPath) => {
        expect(requestedPath).toBe("synthetic-search-data.json");
        return JSON.stringify(docs);
      },
    });
    const results = await service.search("enterprise", 5);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.title).toBe("Test Page");
  });
});

const makeUpdateMeta = (n: number) => ({
  meta: {
    title: `Update ${n}`,
    slug: `updates/update-${n}`,
    date: new Date(`2026-0${n}-01T00:00:00Z`),
    draft: false,
    description: `Update ${n}`,
    tags: [],
    summary: `Summary ${n}`,
    weight: 0,
    isSection: false,
    filePath: `/mock/updates/update-${n}.md`,
    readingTime: 1,
    category: "updates" as const,
  },
  content: `## Update ${n}\n\nContent ${n}.`,
});

// --- service.ts: getBySlug prev/next navigation for update pages ---
describe("ContentService getBySlug prev/next navigation", () => {
  it("returns prev and next for a middle update page", async () => {
    const repo = new InMemoryContentRepository([makeUpdateMeta(1), makeUpdateMeta(2), makeUpdateMeta(3)]);
    const service = new ContentService(repo);
    // Updates are sorted descending by date: update-3, update-2, update-1
    // Retrieving update-2 (middle): prev = update-1, next = update-3
    const result = await service.getBySlug("updates/update-2");
    expect(result).not.toBeNull();
    expect(result?.prev).toBeDefined();
    expect(result?.next).toBeDefined();
    expect(result?.prev?.title).toBe("Update 1");
    expect(result?.next?.title).toBe("Update 3");
  });

  it("returns no prev for the first update page", async () => {
    const repo = new InMemoryContentRepository([makeUpdateMeta(1), makeUpdateMeta(2)]);
    const service = new ContentService(repo);
    // Sorted descending: update-2, update-1
    // Retrieving update-2 (first/newest): no next, prev = update-1
    const result = await service.getBySlug("updates/update-2");
    expect(result?.next).toBeUndefined();
    expect(result?.prev).toBeDefined();
  });

  it("returns no next for the last update page", async () => {
    const repo = new InMemoryContentRepository([makeUpdateMeta(1), makeUpdateMeta(2)]);
    const service = new ContentService(repo);
    // Sorted descending: update-2, update-1
    // Retrieving update-1 (last/oldest): next = update-2, no prev
    const result = await service.getBySlug("updates/update-1");
    expect(result?.next).toBeDefined();
    expect(result?.prev).toBeUndefined();
  });

  it("returns null for non-update category page (no prev/next)", async () => {
    const repo = new InMemoryContentRepository([
      {
        meta: {
          title: "About",
          slug: "about",
          date: FIXED_DATE,
          draft: false,
          tags: [],
          summary: "About",
          weight: 0,
          isSection: false,
          filePath: "/mock/about.md",
          readingTime: 1,
          category: undefined,
        },
        content: "## About\n\nAbout content.",
      },
    ]);
    const service = new ContentService(repo);
    const result = await service.getBySlug("about");
    expect(result).not.toBeNull();
    expect(result?.prev).toBeUndefined();
    expect(result?.next).toBeUndefined();
  });
});

// --- service.ts: OSE_WEB_SHOW_DRAFTS=true path ---
describe("ContentService draft visibility", () => {
  it("includes draft posts when OSE_WEB_SHOW_DRAFTS is true", async () => {
    const repo = new InMemoryContentRepository([
      {
        meta: {
          title: "Draft Post",
          slug: "updates/draft",
          date: FIXED_DATE,
          draft: true,
          tags: [],
          summary: "Draft summary",
          weight: 0,
          isSection: false,
          filePath: "/mock/updates/draft.md",
          readingTime: 1,
          category: "updates",
        },
        content: "## Draft\n\nDraft content.",
      },
    ]);
    const service = new ContentService(repo, undefined, { showDrafts: true });
    const updates = await service.listUpdates();
    expect(updates.some((u) => u.draft)).toBe(true);
  });
});
