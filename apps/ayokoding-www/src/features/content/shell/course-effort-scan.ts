import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { countPageEffort, type CourseEffortCounts } from "../core/course-effort";

/**
 * Reads one course folder and returns its effort counts (tech-docs/004). Rendered pages
 * (titled, non-draft `.md` files that are not `_index.md`) contribute prose words and inline
 * code lines; every other regular file under a `code/` folder contributes non-blank lines as
 * a code file (untitled `.md` files there included); non-UTF-8 files are skipped.
 */
export async function scanCourseEffort(courseDir: string): Promise<CourseEffortCounts> {
  let proseWords = 0;
  let inlineCodeLines = 0;
  let codeFileLines = 0;

  for (const filePath of await walkFiles(courseDir)) {
    const relative = path.relative(courseDir, filePath).split(path.sep).join("/");
    const inCodeDir = relative.split("/").includes("code");
    const isMarkdown = filePath.endsWith(".md");

    if (isMarkdown && !inCodeDir) {
      const raw = await fs.readFile(filePath, "utf-8");
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
      const buffer = await fs.readFile(filePath);
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

async function walkFiles(dir: string): Promise<string[]> {
  let entries: import("node:fs").Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(full)));
    } else if (entry.isFile()) {
      files.push(full);
    }
  }
  return files.sort();
}
