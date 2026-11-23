import { describe, it, expect } from "vitest";
import { nodeEffortFileSystem, scanCourseEffort } from "../../../../../src/features/content/shell/course-effort-scan";
import { memoryFileSystem } from "./memory-file-system";

// The real-disk version of these cases is tests/integration/features/content/shell/course-effort-scan.integration.test.ts.
const COURSE = "/library/course";

describe("scanCourseEffort (in-memory file system)", () => {
  it("classifies rendered pages, code files, drafts, binaries, and _index.md", async () => {
    const io = memoryFileSystem({
      [`${COURSE}/_index.md`]: '---\ntitle: "Course"\n---\n\nIndex words not counted here.\n',
      [`${COURSE}/page.md`]:
        '---\ntitle: "Page"\n---\n\nHello brave new world.\n\n```ts\nconst a = 1;\nconst b = 2;\n```\n',
      [`${COURSE}/draft.md`]: '---\ntitle: "Draft"\ndraft: true\n---\n\nDraft words never counted at all.\n',
      [`${COURSE}/code/README.md`]: "untitled notes line one\nline two\n",
      [`${COURSE}/code/main.py`]: "print(1)\n\nprint(2)\n",
      [`${COURSE}/code/blob.bin`]: new Uint8Array([0xff, 0xfe, 0x00, 0x01]),
    });

    const counts = await scanCourseEffort(COURSE, io);

    // page: 4 prose words, 2 inline code lines. code/: README 2 + main.py 2 = 4 code-file lines.
    expect(counts).toEqual({ proseWords: 4, inlineCodeLines: 2, codeFileLines: 4 });
  });

  it("counts a titled page inside code/ as a page and zeros a missing directory", async () => {
    const io = memoryFileSystem({
      [`${COURSE}/code/walkthrough.md`]:
        '---\ntitle: "Walkthrough"\n---\n\nSix brave words walk slowly home today.\n\n```ts\nconst a = 1;\n```\n',
    });

    expect(await scanCourseEffort(COURSE, io)).toEqual({ proseWords: 7, inlineCodeLines: 1, codeFileLines: 0 });
    expect(await scanCourseEffort("/library/does-not-exist", io)).toEqual({
      proseWords: 0,
      inlineCodeLines: 0,
      codeFileLines: 0,
    });
  });

  it("the node file-system adapter surfaces missing paths as failures", async () => {
    await expect(nodeEffortFileSystem.readdir("/virtual/no-such-dir")).rejects.toThrow();
    await expect(nodeEffortFileSystem.readBytes("/virtual/no-such-file")).rejects.toThrow();
  });
});
