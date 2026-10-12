import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { describe, expect, it } from "vitest";

const appRoot = process.cwd();
const hubPagePath = path.join(appRoot, "content/en/learn/paths/_index.md");
const careersRoot = path.join(appRoot, "content/en/learn/paths/careers");
const aiPagePath = path.join(careersRoot, "immediately-effective/ai-engineer/_index.md");
const aiManifestPath = path.join(
  appRoot,
  "src/features/course-paths/manifests/careers/immediately-effective/ai-engineer.json",
);

/** Every markdown page the path-copy scenarios cover: the hub plus the careers tree. */
export function listPathCopyPages(): string[] {
  const found: string[] = [hubPagePath];
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).toSorted((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith(".md")) found.push(full);
    }
  };
  walk(careersRoot);
  return found;
}

/** Internal planning vocabulary no career path page may show a reader. */
export const FORBIDDEN_COPY_PATTERNS = [/dangerous/i, /oi-2/i, /append/i, /manifest/i, /from.scratch/i] as const;

/** Pages whose text matches at least one forbidden pattern, with the matched patterns. */
export function findOffendingPages(files: readonly string[]): { file: string; patterns: string[] }[] {
  return files
    .map((file) => {
      const text = fs.readFileSync(file, "utf8");
      const patterns = FORBIDDEN_COPY_PATTERNS.filter((pattern) => pattern.test(text)).map(String);
      return { file: path.relative(appRoot, file), patterns };
    })
    .filter((entry) => entry.patterns.length > 0);
}

describe("path-copy", () => {
  it("career path pages contain no internal planning vocabulary", () => {
    expect(findOffendingPages(listPathCopyPages())).toEqual([]);
  });

  it("the AI Engineer path says who it is for", () => {
    const pageDescription = (matter(fs.readFileSync(aiPagePath, "utf8")).data as { description?: string }).description;
    const manifestDescription = (JSON.parse(fs.readFileSync(aiManifestPath, "utf8")) as { description?: string })
      .description;
    expect(pageDescription?.toLowerCase()).toContain("for developers who already code");
    expect(manifestDescription?.toLowerCase()).toContain("for developers who already code");
  });
});
