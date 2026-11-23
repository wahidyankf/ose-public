import { afterEach, describe, expect, it, vi } from "vitest";
import { InMemoryContentRepository } from "@/features/content/core/repository-memory";
import type { ContentMeta } from "@/features/content/core/types";
import { ContentService } from "@/features/content/shell/service";
import { SearchService } from "@/features/search/shell/service";

// The service reads a prebuilt index through a dynamic import of node:fs/promises. The module is replaced by a
// double so the read is observed without touching the disk; the integration run reads the real index.
const disk = vi.hoisted(() => ({ readFile: vi.fn<(path: string, encoding: string) => Promise<string>>() }));

vi.mock("node:fs/promises", () => ({ default: disk, readFile: disk.readFile }));

const INDEX_PATH = "/fixture/search-data.json";

const PREBUILT = [
  {
    id: "about",
    title: "Enterprise Compliance Fixture",
    content: "Synthetic enterprise and compliance evidence for isolated search tests.",
    slug: "about",
  },
  {
    id: "updates/phase-4",
    title: "Phase 4 Fixture",
    content: "Phase closure records enterprise evidence.",
    slug: "updates/2026-02-04-phase-4",
  },
];

function page(slug: string, title: string, isSection = false): ContentMeta {
  return {
    title,
    slug,
    draft: false,
    tags: [],
    weight: 0,
    isSection,
    filePath: `/content/${slug}.md`,
    readingTime: 1,
  };
}

afterEach(() => {
  disk.readFile.mockReset();
});

describe("SearchService with a prebuilt index", () => {
  it("answers from the index file it is given", async () => {
    disk.readFile.mockResolvedValueOnce(JSON.stringify(PREBUILT));
    const service = new SearchService(new ContentService(new InMemoryContentRepository([])), INDEX_PATH);

    const results = await service.search("synthetic");

    expect(disk.readFile).toHaveBeenCalledWith(INDEX_PATH, "utf-8");
    expect(results).toEqual([expect.objectContaining({ title: "Enterprise Compliance Fixture", slug: "about" })]);
  });

  it("reads the index once and reuses it for later searches", async () => {
    disk.readFile.mockResolvedValueOnce(JSON.stringify(PREBUILT));
    const service = new SearchService(new ContentService(new InMemoryContentRepository([])), INDEX_PATH);

    await service.search("synthetic");
    await service.search("phase");

    expect(disk.readFile).toHaveBeenCalledTimes(1);
  });

  it("lists a page once even when both its title and its content match", async () => {
    disk.readFile.mockResolvedValueOnce(
      JSON.stringify([{ id: "p", title: "Phase Notes", content: "Phase content", slug: "p" }]),
    );
    const service = new SearchService(new ContentService(new InMemoryContentRepository([])), INDEX_PATH);

    const results = await service.search("phase");

    expect(results).toHaveLength(1);
  });

  it("honours the limit", async () => {
    disk.readFile.mockResolvedValueOnce(JSON.stringify(PREBUILT));
    const service = new SearchService(new ContentService(new InMemoryContentRepository([])), INDEX_PATH);

    const results = await service.search("enterprise", 1);

    expect(results).toHaveLength(1);
  });

  it("is ready only after the first search has built the index", async () => {
    disk.readFile.mockResolvedValueOnce(JSON.stringify(PREBUILT));
    const service = new SearchService(new ContentService(new InMemoryContentRepository([])), INDEX_PATH);

    expect(service.isSearchIndexReady()).toBe(false);
    await service.search("synthetic");
    expect(service.isSearchIndexReady()).toBe(true);
  });

  it("shows the opening of the page when the query is not in its text", async () => {
    disk.readFile.mockResolvedValueOnce(
      JSON.stringify([{ id: "long", title: "Compliance notes", content: "x".repeat(200), slug: "long" }]),
    );
    const service = new SearchService(new ContentService(new InMemoryContentRepository([])), INDEX_PATH);

    const [result] = await service.search("compliance");

    expect(result?.excerpt).toBe(`${"x".repeat(150)}...`);
  });

  it("centres the excerpt on the first match, marking the cut ends", async () => {
    // Words are separated by spaces so the index sees "synthetic" as a word of its own.
    const content = `${"a ".repeat(50)}synthetic ${"b ".repeat(50)}`;
    disk.readFile.mockResolvedValueOnce(JSON.stringify([{ id: "mid", title: "Mid", content, slug: "mid" }]));
    const service = new SearchService(new ContentService(new InMemoryContentRepository([])), INDEX_PATH);

    const [result] = await service.search("synthetic");

    expect(result?.excerpt.startsWith("...")).toBe(true);
    expect(result?.excerpt.endsWith("...")).toBe(true);
    expect(result?.excerpt).toContain("synthetic");
  });
});

describe("SearchService without a readable prebuilt index", () => {
  it("builds the index from the content when no index path is given", async () => {
    const repository = new InMemoryContentRepository([{ meta: page("updates/phase-1", "Phase One"), content: "body" }]);
    const service = new SearchService(new ContentService(repository));

    const results = await service.search("phase");

    expect(disk.readFile).not.toHaveBeenCalled();
    expect(results.map((result) => result.slug)).toEqual(["updates/phase-1"]);
  });

  it("builds the index from the content when the index file cannot be read", async () => {
    disk.readFile.mockRejectedValueOnce(new Error("ENOENT"));
    const repository = new InMemoryContentRepository([
      { meta: page("updates/phase-1", "Phase One"), content: "body" },
      { meta: page("updates/phase-2", "Phase Two"), content: "body" },
      { meta: page("updates", "Phase Section", true), content: "body" },
    ]);
    const service = new SearchService(new ContentService(repository), INDEX_PATH);

    const results = await service.search("phase");

    expect(results.map((result) => result.slug).toSorted()).toEqual(["updates/phase-1", "updates/phase-2"]);
  });
});
