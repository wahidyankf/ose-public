import { describe, expect, it } from "vitest";
import { buildSearchDocs } from "../../../../../src/features/search/shell/generate-search-data";
import type { ContentMeta } from "../../../../../src/features/content/core/types";

function meta(overrides: Partial<ContentMeta>): ContentMeta {
  return {
    title: "T",
    slug: "learn/t",
    locale: "en",
    weight: 0,
    description: "d",
    tags: [],
    draft: false,
    isSection: false,
    filePath: "/virtual/en/learn/t.md",
    ...overrides,
  };
}

describe("buildSearchDocs", () => {
  it("indexes readable pages and skips sections, drafts, and unreadable files", async () => {
    const repository = {
      readAllContent: async () => [
        meta({ slug: "learn/a", title: "Alpha", filePath: "/virtual/a.md" }),
        meta({ slug: "learn", isSection: true, filePath: "/virtual/_index.md" }),
        meta({ slug: "learn/draft", draft: true, filePath: "/virtual/draft.md" }),
        meta({ slug: "learn/gone", filePath: "/virtual/gone.md" }),
      ],
      readFileContent: async (filePath: string) => {
        if (filePath === "/virtual/gone.md") throw new Error("gone");
        return { content: "# Alpha\n\nBody text.", frontmatter: {} };
      },
    };
    const docs = await buildSearchDocs(repository);
    expect(docs).toEqual([
      {
        id: "en:learn/a",
        title: "Alpha",
        content: "Alpha\nBody text.",
        slug: "learn/a",
        locale: "en",
      },
    ]);
  });

  it("truncates long documents", async () => {
    const repository = {
      readAllContent: async () => [meta({})],
      readFileContent: async () => ({ content: `x${"y".repeat(3000)}`, frontmatter: {} }),
    };
    const docs = await buildSearchDocs(repository);
    expect(docs[0]?.content.length).toBe(2000);
  });
});
