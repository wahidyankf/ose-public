import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ContentService } from "../../../../../src/features/content/shell/service";
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

// `ContentService.search` builds its FlexSearch index from one of two sources:
// `tryLoadPreBuiltSearchData()` (a JSON file at `searchDataPath`, used in production) when it
// resolves, else a full file scan. Neither the pre-built-JSON success path, its
// missing/unreadable-file fallback, nor `createExcerpt`'s no-substring-match branch had a direct
// test — every existing caller constructs `ContentService` without `searchDataPath` at all.
describe("ContentService.search — pre-built search data", () => {
  it("builds the search index from a valid pre-built searchDataPath instead of scanning files", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ayokoding-search-"));
    const dataPath = join(dir, "search-data.json");

    try {
      await writeFile(
        dataPath,
        JSON.stringify([
          {
            id: "en:prebuilt",
            title: "Prebuilt Doc",
            content: "scattered quick words fox lives here",
            slug: "prebuilt",
            locale: "en",
          },
        ]),
        "utf-8",
      );
      const repo = makeFakeRepository(async () => []);
      const service = new ContentService(repo, dataPath);

      const results = await service.search("en", "Prebuilt");

      expect(results).toHaveLength(1);
      expect(results[0]?.slug).toBe("prebuilt");

      // "quick fox" never appears as a contiguous substring of the doc's content (the words are
      // scattered), so `createExcerpt`'s `idx === -1` branch truncates from the start instead of
      // centering the excerpt on a match.
      const excerptResults = await service.search("en", "quick fox");

      expect(excerptResults[0]?.excerpt.startsWith("scattered quick words fox lives here")).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("falls back to a file scan when searchDataPath does not resolve to a readable file", async () => {
    const repo = makeFakeRepository(async () => []);
    const service = new ContentService(repo, join(tmpdir(), "ayokoding-search-missing-dir", "does-not-exist.json"));

    const results = await service.search("en", "anything");

    expect(results).toEqual([]);
  });
});
