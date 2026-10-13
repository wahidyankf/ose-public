import { describe, it, expect } from "vitest";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scanCourseEffort } from "../../../../../src/features/content/shell/course-effort-scan";

describe("scanCourseEffort", () => {
  it("classifies rendered pages, code files, drafts, binaries, and _index.md", async () => {
    const dir = await mkdtemp(join(tmpdir(), "effort-scan-"));
    try {
      const course = join(dir, "course");
      await mkdir(join(course, "code"), { recursive: true });
      await writeFile(join(course, "_index.md"), '---\ntitle: "Course"\n---\n\nIndex words not counted here.\n');
      await writeFile(
        join(course, "page.md"),
        '---\ntitle: "Page"\n---\n\nHello brave new world.\n\n```ts\nconst a = 1;\nconst b = 2;\n```\n',
      );
      await writeFile(
        join(course, "draft.md"),
        '---\ntitle: "Draft"\ndraft: true\n---\n\nDraft words never counted at all.\n',
      );
      await writeFile(join(course, "code", "README.md"), "untitled notes line one\nline two\n");
      await writeFile(join(course, "code", "main.py"), "print(1)\n\nprint(2)\n");
      await writeFile(join(course, "code", "blob.bin"), Buffer.from([0xff, 0xfe, 0x00, 0x01]));

      const counts = await scanCourseEffort(course);
      // page: 4 prose words, 2 inline code lines. code/: README 2 + main.py 2 = 4 code-file lines.
      expect(counts).toEqual({ proseWords: 4, inlineCodeLines: 2, codeFileLines: 4 });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
