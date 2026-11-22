import { describe, expect, it, vi } from "vitest";
import { getContentDir, readAllContent, readFileContent } from "@/features/content/shell/reader";
import type { ContentFileSystem } from "@/features/content/shell/repository-fs";
import { memoryFileSystem } from "../features/content/shell/memory-file-system";

const PAGE = "---\ntitle: Hello\nweight: 2\n---\n# Hello\n";
const NESTED = "---\ntitle: Deep\ndescription: Nested page\ntags:\n  - intro\n---\n# Deep\n";
const DRAFT = "---\ntitle: Draft\ndraft: true\n---\n# Draft\n";
const INVALID = "---\nweight: 1\n---\n# No title\n";

function contentTree(): ContentFileSystem {
  return memoryFileSystem({
    "/virtual/content/en/learn/a.md": PAGE,
    "/virtual/content/en/learn/deep/b.md": NESTED,
    "/virtual/content/en/learn/draft.md": DRAFT,
    "/virtual/content/en/learn/broken.md": INVALID,
    "/virtual/content/en/learn/notes.txt": "not markdown",
  });
}

describe("readAllContent over a file-system double", () => {
  it("reads pages with locale and slug derived from the path", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    try {
      const metas = await readAllContent("/virtual/content", contentTree());
      const slugs = metas.map((meta) => meta.slug).sort();
      expect(slugs).toEqual(["learn/a", "learn/deep/b"]);
      const page = metas.find((meta) => meta.slug === "learn/a");
      expect(page).toMatchObject({ title: "Hello", locale: "en", weight: 2, isSection: false });
    } finally {
      warn.mockRestore();
    }
  });

  it("skips drafts while drafts stay hidden", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    try {
      const metas = await readAllContent("/virtual/content", contentTree());
      expect(metas.some((meta) => meta.slug === "learn/draft")).toBe(false);
    } finally {
      warn.mockRestore();
    }
  });

  it("skips files that fail to read", async () => {
    const failing: ContentFileSystem = {
      readdir: async () => [{ name: "gone.md", isDirectory: () => false }],
      readFile: async () => {
        throw new Error("boom");
      },
    };
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    try {
      await expect(readAllContent("/virtual/content", failing)).resolves.toEqual([]);
    } finally {
      warn.mockRestore();
    }
  });
});

describe("readFileContent over a file-system double", () => {
  it("returns the body and the frontmatter", async () => {
    const file = await readFileContent("/virtual/content/en/learn/a.md", contentTree());
    expect(file.content).toContain("# Hello");
    expect(file.frontmatter).toMatchObject({ title: "Hello", weight: 2 });
  });
});

describe("getContentDir", () => {
  it("resolves inside the content tree by default", () => {
    expect(getContentDir().endsWith("content")).toBe(true);
  });
});
