import { describe, expect, it } from "vitest";
import { FileSystemContentRepository } from "@/features/content/shell/repository-fs";
import { memoryContentFs } from "./helpers/memory-content-fs";

const DIR = "/content";
const UNREADABLE = [`${DIR}/updates/unreadable.md`];

const PHASE_FOUR = `---
title: "Phase 4"
date: 2026-02-04T00:00:00Z
summary: "Phase four summary"
tags: ["phase"]
---

Phase closure records enterprise evidence.
`;

function fixtureFs(unreadable: string[] = UNREADABLE) {
  return memoryContentFs({
    unreadable,
    files: {
      [`${DIR}/_index.md`]: `---\ntitle: "Home"\n---\n\nHome section.\n`,
      [`${DIR}/about.md`]: `---\ntitle: "About"\n---\n\n# About\n\nAbout the platform.\n`,
      [`${DIR}/updates/_index.md`]: `---\ntitle: "Updates"\n---\n\nUpdates section.\n`,
      [`${DIR}/updates/2026-02-04-phase-4.md`]: PHASE_FOUR,
      [`${DIR}/updates/2026-02-05-draft.md`]: `---\ntitle: "Draft"\ndraft: true\n---\n\nNot yet.\n`,
      [`${DIR}/updates/broken.md`]: `---\nweight: 3\n---\n\nNo title, so the schema rejects it.\n`,
      [`${DIR}/updates/notes.txt`]: "Not markdown.",
      [`${DIR}/updates/unreadable.md`]: `---\ntitle: "Locked"\n---\n\nLocked.\n`,
    },
  });
}

describe("FileSystemContentRepository.readAllContent", () => {
  it("walks nested directories and keeps only markdown files that parse", async () => {
    const repository = new FileSystemContentRepository(DIR, false, fixtureFs());

    const slugs = (await repository.readAllContent()).map((meta) => meta.slug).toSorted();

    expect(slugs).toEqual(["", "about", "updates", "updates/2026-02-04-phase-4"]);
  });

  it("derives the slug, section flag, and category from the file path", async () => {
    const repository = new FileSystemContentRepository(DIR, false, fixtureFs());

    const bySlug = new Map((await repository.readAllContent()).map((meta) => [meta.slug, meta]));

    expect(bySlug.get("")).toMatchObject({ title: "Home", isSection: true, filePath: `${DIR}/_index.md` });
    expect(bySlug.get("updates")).toMatchObject({ title: "Updates", isSection: true, category: undefined });
    expect(bySlug.get("about")).toMatchObject({ title: "About", isSection: false, category: undefined });
    expect(bySlug.get("updates/2026-02-04-phase-4")).toMatchObject({
      title: "Phase 4",
      isSection: false,
      category: "updates",
      summary: "Phase four summary",
      tags: ["phase"],
      weight: 0,
      draft: false,
    });
  });

  it("reads the publication date from the frontmatter", async () => {
    const repository = new FileSystemContentRepository(DIR, false, fixtureFs());

    const phase = (await repository.readAllContent()).find((meta) => meta.slug.endsWith("phase-4"));

    expect(phase?.date).toEqual(new Date("2026-02-04T00:00:00Z"));
  });

  it("counts every page as at least one minute of reading", async () => {
    const repository = new FileSystemContentRepository(DIR, false, fixtureFs());

    const about = (await repository.readAllContent()).find((meta) => meta.slug === "about");

    expect(about?.readingTime).toBe(1);
  });

  it("hides drafts unless drafts are shown", async () => {
    const hidden = new FileSystemContentRepository(DIR, false, fixtureFs());
    const shown = new FileSystemContentRepository(DIR, true, fixtureFs());

    expect((await hidden.readAllContent()).some((meta) => meta.title === "Draft")).toBe(false);
    expect((await shown.readAllContent()).find((meta) => meta.title === "Draft")?.draft).toBe(true);
  });

  it("fails loudly when the content directory itself cannot be listed", async () => {
    const repository = new FileSystemContentRepository("/missing", false, fixtureFs());

    await expect(repository.readAllContent()).rejects.toThrow("ENOENT: /missing");
  });
});

describe("FileSystemContentRepository.readFileContent", () => {
  it("returns the body and the frontmatter of one page", async () => {
    const repository = new FileSystemContentRepository(DIR, false, fixtureFs());

    const page = await repository.readFileContent(`${DIR}/about.md`);

    expect(page.content.trim()).toBe("# About\n\nAbout the platform.");
    expect(page.frontmatter).toEqual({ title: "About" });
  });

  it("propagates a read failure to the caller", async () => {
    const repository = new FileSystemContentRepository(DIR, false, fixtureFs());

    await expect(repository.readFileContent(`${DIR}/missing.md`)).rejects.toThrow("ENOENT");
  });
});
