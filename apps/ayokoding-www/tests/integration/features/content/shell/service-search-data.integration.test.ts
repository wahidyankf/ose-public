import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ContentService } from "../../../../../src/features/content/shell/service";
import type { ContentRepository } from "../../../../../src/features/content/core/repository";
import type { ContentMeta } from "../../../../../src/features/content/core/types";

function makeFakeRepository(readAllContent: () => Promise<ContentMeta[]>): ContentRepository {
  return {
    readAllContent,
    readFileContent: async () => ({ content: "", frontmatter: {} }),
  };
}

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
