import { describe, expect, it, vi } from "vitest";
import {
  processAllIndexFiles,
  type IndexGeneratorPort,
} from "../../../../../src/features/content/shell/index-generator";
import type { ContentRepository } from "../../../../../src/features/content/core/repository";

// The generator's node port imports FileSystemContentRepository, whose module graph reads
// server-side env at import time — stub it; the test supplies its own repository port.
vi.mock("../../../../../src/features/content/shell/repository-fs", () => ({
  FileSystemContentRepository: class {},
}));

function contentEntry(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    locale: "en",
    title: "T",
    weight: 100,
    isSection: false,
    draft: false,
    body: "",
    ...overrides,
  };
}

function portWith(entries: Record<string, unknown>[], written: { value: string }): IndexGeneratorPort {
  return {
    repository: { readAllContent: async () => entries } as unknown as ContentRepository,
    readText: async () => "---\ntitle: T\n---\n",
    writeText: async (_filePath: string, content: string) => {
      written.value = content;
    },
    now: () => new Date("2026-01-01T00:00:00Z"),
  };
}

describe("processAllIndexFiles", () => {
  it("excludes draft pages from the generated child list even when the repository exposes them", async () => {
    const section = contentEntry({ slug: "", isSection: true, filePath: "content/en/_index.md" });
    const published = contentEntry({ slug: "overview", title: "Overview" });
    const draft = contentEntry({
      slug: "draft-fixture",
      title: "Draft Fixture",
      draft: true,
      filePath: "content/en/draft-fixture.md",
    });
    const written = { value: "" };
    const result = await processAllIndexFiles("content/en", "generate", portWith([section, published, draft], written));
    expect(result.errors).toEqual([]);
    expect(written.value).toContain("[Overview]");
    expect(written.value).not.toContain("Draft Fixture");
  });
});
