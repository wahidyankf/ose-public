import path from "node:path";
import fs from "node:fs/promises";
import matter from "gray-matter";
import { frontmatterSchema } from "@/lib/schemas/content";
import type { ContentMeta } from "./types";
import type { ContentRepository } from "./repository";

const DEFAULT_CONTENT_DIR = process.env.CONTENT_DIR ?? path.resolve(process.cwd(), "content");

export class FileSystemContentRepository implements ContentRepository {
  private readonly contentDir: string;

  constructor(contentDir?: string) {
    this.contentDir = contentDir ?? DEFAULT_CONTENT_DIR;
  }

  async readAllContent(): Promise<ContentMeta[]> {
    const files = await this.globMarkdownFiles(this.contentDir);
    const results: ContentMeta[] = [];

    for (const filePath of files) {
      try {
        const raw = await fs.readFile(filePath, "utf-8");
        const { data } = matter(raw);
        const parsed = frontmatterSchema.safeParse(data);

        if (!parsed.success) {
          continue;
        }

        const frontmatter = parsed.data;
        if (frontmatter.draft && process.env.SHOW_DRAFTS !== "true") {
          continue;
        }

        const { locale, slug, isSection } = this.deriveSlug(filePath);

        results.push({
          title: frontmatter.title,
          slug,
          locale,
          weight: frontmatter.weight,
          date: frontmatter.date,
          description: frontmatter.description,
          tags: frontmatter.tags,
          draft: frontmatter.draft,
          isSection,
          filePath,
        });
      } catch {
        // Skip files that can't be read
      }
    }

    return results;
  }

  async readFileContent(filePath: string): Promise<{ content: string; frontmatter: Record<string, unknown> }> {
    const raw = await fs.readFile(filePath, "utf-8");
    const { content, data } = matter(raw);
    return { content, frontmatter: data as Record<string, unknown> };
  }

  private deriveSlug(filePath: string): { locale: string; slug: string; isSection: boolean } {
    const relative = path.relative(this.contentDir, filePath).split(path.sep).join("/");
    const parts = relative.split("/");
    const locale = parts[0] ?? "";
    const rest = parts.slice(1).join("/");

    const isSection = rest.endsWith("_index.md");
    let slug = rest.replace(/\.md$/, "");
    slug = slug.replace(/\/_index$/, "");
    if (slug === "_index") slug = "";

    return { locale, slug, isSection };
  }

  private async globMarkdownFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const subFiles = await this.globMarkdownFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.name.endsWith(".md")) {
        files.push(fullPath);
      }
    }
    return files;
  }
}
