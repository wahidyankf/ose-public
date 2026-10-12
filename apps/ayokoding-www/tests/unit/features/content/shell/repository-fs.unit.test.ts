import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { FileSystemContentRepository } from "../../../../../src/features/content/shell/repository-fs";

describe("repository-fs env reads", () => {
  const src = readFileSync(resolve(__dirname, "../../../../../src/features/content/shell/repository-fs.ts"), "utf-8");

  it("reads AYOKODING_WEB_CONTENT_DIR via env object not process.env", () => {
    expect(src).toMatch(/env\.AYOKODING_WEB_CONTENT_DIR/);
  });

  it("reads AYOKODING_WEB_SHOW_DRAFTS via env object not process.env", () => {
    expect(src).toMatch(/env\.AYOKODING_WEB_SHOW_DRAFTS/);
  });
});

describe("FileSystemContentRepository#readAllContent — status (outline-course-status)", () => {
  it("carries frontmatter status outline onto ContentMeta and leaves it undefined when absent", async () => {
    const parent = await mkdtemp(join(tmpdir(), "repository-fs-status-test-"));
    const courseDir = join(parent, "en", "learn", "courses", "outline-sample");
    const plainDir = join(parent, "en", "learn", "courses", "plain-sample");

    try {
      await mkdir(courseDir, { recursive: true });
      await mkdir(plainDir, { recursive: true });
      await writeFile(
        join(courseDir, "_index.md"),
        '---\ntitle: "Outline Sample"\nprerequisites: []\nstatus: outline\n---\n\nBody.\n',
      );
      await writeFile(join(plainDir, "_index.md"), '---\ntitle: "Plain Sample"\nprerequisites: []\n---\n\nBody.\n');

      const repo = new FileSystemContentRepository(parent);
      const all = await repo.readAllContent();
      const bySlug = new Map(all.map((meta) => [meta.slug, meta]));

      expect(bySlug.has("learn/courses/outline-sample")).toBe(true);
      expect(bySlug.has("learn/courses/plain-sample")).toBe(true);
      expect(bySlug.get("learn/courses/outline-sample")?.status).toEqual("outline");
      expect(bySlug.get("learn/courses/plain-sample")?.status).toBeUndefined();
    } finally {
      await rm(parent, { recursive: true, force: true });
    }
  });
});

describe("FileSystemContentRepository#readAllContent — missing content directory", () => {
  // Regression test for the site-wide blast-radius gap flagged in PR #95 cycle-3 review: a
  // misconfigured/absent `AYOKODING_WEB_CONTENT_DIR` used to throw out of `globMarkdownFiles`'s
  // top-level `readdir`, uncaught by `loadRoutePathData` (called from the root `[locale]/layout.tsx`,
  // above the only `error.tsx` in the tree) — 500ing the entire site rather than degrading to an
  // empty content index. Fails before the fix (unhandled ENOENT rejection), passes after (resolves
  // to `[]`), mirroring `manifest-repository.test.ts`'s equivalent "does not exist yet" coverage for
  // `globManifestFiles`.
  it("returns an empty array instead of throwing when contentDir does not exist", async () => {
    const parent = await mkdtemp(join(tmpdir(), "repository-fs-test-"));
    const missingDir = join(parent, "does-not-exist");

    try {
      const repo = new FileSystemContentRepository(missingDir);
      await expect(repo.readAllContent()).resolves.toEqual([]);
    } finally {
      await rm(parent, { recursive: true, force: true });
    }
  });
});
