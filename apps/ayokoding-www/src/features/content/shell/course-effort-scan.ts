import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { countPageEffort, type CourseEffortCounts } from "../core/course-effort";

/**
 * The file-system port the effort scan reads through. The default is the real `node:fs/promises`
 * adapter; unit tests pass an in-memory double, and the integration suite scans real course folders.
 */
export interface EffortFileSystem {
  readdir(dir: string): Promise<{ name: string; isDirectory(): boolean; isFile(): boolean }[]>;
  readBytes(filePath: string): Promise<Uint8Array>;
}

export const nodeEffortFileSystem: EffortFileSystem = {
  readdir: (dir) => fs.readdir(dir, { withFileTypes: true }),
  readBytes: (filePath) => fs.readFile(filePath),
};

/**
 * Reads one course folder and returns its effort counts (tech-docs/004). Rendered pages
 * (titled, non-draft `.md` files that are not `_index.md`) contribute prose words and inline
 * code lines; every other regular file under a `code/` folder contributes non-blank lines as
 * a code file (untitled `.md` files there included); non-UTF-8 files are skipped.
 */
export async function scanCourseEffort(
  courseDir: string,
  io: EffortFileSystem = nodeEffortFileSystem,
): Promise<CourseEffortCounts> {
  let proseWords = 0;
  let inlineCodeLines = 0;
  let codeFileLines = 0;

  for (const filePath of await walkFiles(courseDir, io)) {
    const relative = path.relative(courseDir, filePath).split(path.sep).join("/");
    const inCodeDir = relative.split("/").includes("code");
    const isMarkdown = filePath.endsWith(".md");

    if (isMarkdown && !inCodeDir) {
      // `ignoreBOM` keeps a byte-order mark in the text, as `readFile(path, "utf-8")` does.
      const raw = new TextDecoder("utf-8", { ignoreBOM: true }).decode(await io.readBytes(filePath));
      const { data, content } = matter(raw);
      const title = (data as { title?: unknown }).title;
      const draft = (data as { draft?: unknown }).draft;
      const base = path.basename(filePath);
      if (typeof title !== "string" || title.length === 0 || draft === true || base === "_index.md") {
        continue;
      }
      const counts = countPageEffort(content);
      proseWords += counts.proseWords;
      inlineCodeLines += counts.inlineCodeLines;
      continue;
    }

    if (inCodeDir) {
      const buffer = await io.readBytes(filePath);
      let text: string;
      try {
        text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
      } catch {
        continue; // binary file: not countable code
      }
      // A rendered page inside code/ (titled .md) counts as a page, not a code file.
      if (isMarkdown) {
        const { data, content } = matter(text);
        const title = (data as { title?: unknown }).title;
        const draft = (data as { draft?: unknown }).draft;
        if (typeof title === "string" && title.length > 0 && draft !== true) {
          const counts = countPageEffort(content);
          proseWords += counts.proseWords;
          inlineCodeLines += counts.inlineCodeLines;
          continue;
        }
      }
      for (const line of text.split("\n")) {
        if (line.trim().length > 0) {
          codeFileLines += 1;
        }
      }
    }
  }

  return { proseWords, inlineCodeLines, codeFileLines };
}

async function walkFiles(dir: string, io: EffortFileSystem): Promise<string[]> {
  let entries: { name: string; isDirectory(): boolean; isFile(): boolean }[];
  try {
    entries = await io.readdir(dir);
  } catch {
    return [];
  }
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(full, io)));
    } else if (entry.isFile()) {
      files.push(full);
    }
  }
  return files.sort();
}
