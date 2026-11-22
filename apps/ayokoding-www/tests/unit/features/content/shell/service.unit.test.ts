import { describe, expect, it } from "vitest";
import {
  ContentService,
  type SearchDataFileSystem,
  type SearchDoc,
} from "../../../../../src/features/content/shell/service";
import type { ContentRepository } from "../../../../../src/features/content/core/repository";
import type { ContentMeta } from "../../../../../src/features/content/core/types";

/**
 * Regression: the course-paths plan's Phase 3 e2e run surfaced a real, previously-undetected race
 * in `ContentService.getIndex()`. Its lazy-build guard (`if (!this.contentIndex) { ... }`) is
 * synchronous-check / asynchronous-fill, so multiple callers that all arrive before the very first
 * build resolves (a routine event under Playwright's multi-worker, multi-project concurrent load,
 * where several requests hit the shared server before its content index is warm) each independently
 * trigger their own full `buildContentIndex()` — whichever finishes LAST silently overwrites the
 * cached index for the lifetime of the process. If that last-finishing build ever raced against
 * transient resource pressure (many concurrent full-tree scans opening file handles at once) and
 * came back incomplete, every subsequent request — including totally unrelated ones — would see a
 * permanently wrong, silently-degraded content index for as long as the server keeps running.
 */
function makeFakeRepository(readAllContent: () => Promise<ContentMeta[]>): ContentRepository {
  return {
    readAllContent,
    readFileContent: async () => ({ content: "", frontmatter: {} }),
  };
}

describe("ContentService.getIndex — concurrent build deduplication", () => {
  it("builds the content index only once when multiple callers request it concurrently before the first build resolves", async () => {
    let callCount = 0;
    let releaseBuild: () => void = () => undefined;
    const buildGate = new Promise<void>((resolve) => {
      releaseBuild = resolve;
    });
    const repo = makeFakeRepository(async () => {
      callCount++;
      await buildGate;
      return [];
    });
    const service = new ContentService(repo);

    const callers = Promise.all([service.getIndex(), service.getIndex(), service.getIndex()]);
    releaseBuild();
    const [a, b, c] = await callers;

    expect(callCount).toBe(1);
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  it("still returns a usable index after the single in-flight build resolves (later callers hit the warm cache)", async () => {
    let callCount = 0;
    const repo = makeFakeRepository(async () => {
      callCount++;
      return [];
    });
    const service = new ContentService(repo);

    await service.getIndex();
    await service.getIndex();

    expect(callCount).toBe(1);
  });

  it("clears the in-flight build promise on failure so the next caller retries instead of caching a rejection", async () => {
    let callCount = 0;
    const repo = makeFakeRepository(async () => {
      callCount++;
      if (callCount === 1) {
        throw new Error("boom");
      }
      return [];
    });
    const service = new ContentService(repo);

    await expect(service.getIndex()).rejects.toThrow("boom");
    expect(callCount).toBe(1);

    const index = await service.getIndex();

    expect(callCount).toBe(2);
    expect(index.contentMap.size).toBe(0);
  });
});

/** A search-data store that serves one JSON document at `path`, and fails for any other path. */
function searchDataStore(path: string, json: string): SearchDataFileSystem & { reads: string[] } {
  const reads: string[] = [];
  return {
    reads,
    async readFile(filePath) {
      reads.push(filePath);
      if (filePath !== path) throw new Error(`ENOENT: ${filePath}`);
      return json;
    },
  };
}

describe("ContentService.search — pre-built search data (in-memory store)", () => {
  const SEARCH_PATH = "/build/search-data.json";
  const alphaDoc: SearchDoc = {
    id: "en:learn/alpha",
    title: "Alpha guide",
    content: "Alpha basics for readers.",
    slug: "learn/alpha",
    locale: "en",
  };

  it("indexes the pre-built documents when the search data loads, and finds them", async () => {
    const store = searchDataStore(SEARCH_PATH, JSON.stringify([alphaDoc]));
    const service = new ContentService(
      makeFakeRepository(async () => []),
      SEARCH_PATH,
      store,
    );

    const results = await service.search("en", "alpha");

    expect(store.reads).toEqual([SEARCH_PATH]);
    expect(service.isSearchIndexReady("en")).toBe(true);
    expect(results.map((result) => result.slug)).toContain("learn/alpha");
  });

  it("returns an excerpt of the leading content when the query is not in the body text", async () => {
    const longBody = "Body text without the query word. ".repeat(10);
    const store = searchDataStore(
      SEARCH_PATH,
      JSON.stringify([{ ...alphaDoc, id: "en:learn/long", slug: "learn/long", content: longBody }]),
    );
    const service = new ContentService(
      makeFakeRepository(async () => []),
      SEARCH_PATH,
      store,
    );

    const results = await service.search("en", "alpha");

    const hit = results.find((result) => result.slug === "learn/long");
    expect(hit?.excerpt).toBe(`${longBody.slice(0, 150)}...`);
  });

  it("falls back to scanning the files when the search data cannot be read", async () => {
    const store = searchDataStore(SEARCH_PATH, "");
    const service = new ContentService(
      makeFakeRepository(async () => []),
      "/build/missing.json",
      store,
    );

    const results = await service.search("en", "alpha");

    expect(store.reads).toEqual(["/build/missing.json"]);
    expect(results).toEqual([]);
  });
});
