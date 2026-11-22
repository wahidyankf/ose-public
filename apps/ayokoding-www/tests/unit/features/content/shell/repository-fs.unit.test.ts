import { describe, expect, it, vi } from "vitest";
import {
  FileSystemContentRepository,
  nodeContentFileSystem,
  type ContentFileSystem,
} from "../../../../../src/features/content/shell/repository-fs";
import { memoryFileSystem } from "./memory-file-system";

const PAGE = "---\ntitle: Hello\nweight: 1\n---\n# Hello\n";
const DRAFT = "---\ntitle: Draft\ndraft: true\n---\n# Draft\n";
const INVALID = "---\nweight: 1\n---\n# No title\n";

function tree(): ContentFileSystem {
  return memoryFileSystem({
    "/virtual/content/en/learn/a.md": PAGE,
    "/virtual/content/en/_index.md": PAGE,
    "/virtual/content/en/draft.md": DRAFT,
    "/virtual/content/en/broken.md": INVALID,
  });
}

describe("FileSystemContentRepository over a memory file system", () => {
  it("reads pages with locale and slug", async () => {
    const repository = new FileSystemContentRepository("/virtual/content", tree());
    const metas = await repository.readAllContent();
    const slugs = metas.map((meta) => meta.slug).sort();
    expect(slugs).toEqual(["", "learn/a"]);
  });

  it("skips drafts while drafts stay hidden", async () => {
    const repository = new FileSystemContentRepository("/virtual/content", tree());
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    try {
      const metas = await repository.readAllContent();
      expect(metas.some((meta) => meta.slug === "learn/draft")).toBe(false);
    } finally {
      warn.mockRestore();
    }
  });

  it("skips invalid frontmatter without failing the read", async () => {
    const repository = new FileSystemContentRepository("/virtual/content", tree());
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    try {
      const metas = await repository.readAllContent();
      expect(metas.some((meta) => meta.filePath.endsWith("broken.md"))).toBe(false);
    } finally {
      warn.mockRestore();
    }
  });

  it("reads one file's content and frontmatter", async () => {
    const repository = new FileSystemContentRepository("/virtual/content", tree());
    const file = await repository.readFileContent("/virtual/content/en/learn/a.md");
    expect(file.content).toContain("# Hello");
    expect(file.frontmatter).toMatchObject({ title: "Hello" });
  });

  it("the node file-system adapter surfaces missing paths as failures", async () => {
    await expect(nodeContentFileSystem.readdir("/virtual/no-such-dir")).rejects.toThrow();
    await expect(nodeContentFileSystem.readFile("/virtual/no-such-file")).rejects.toThrow();
  });
});
