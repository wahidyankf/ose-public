import path from "node:path";
import matter from "gray-matter";
import { frontmatterSchema } from "@/features/content/core/schemas";
import type { ContentMeta } from "../core/types";
import type { ContentRepository } from "../core/repository";
import { nodeContentFs, type ContentFs } from "./content-fs";
import { env } from "../../../env";

const DEFAULT_CONTENT_DIR = env.OSE_WEB_CONTENT_DIR ?? path.resolve(process.cwd(), "content");

export class FileSystemContentRepository implements ContentRepository {
  private readonly contentDir: string;
  private readonly showDrafts: boolean;
  private readonly fileSystem: ContentFs;

  constructor(
    contentDir?: string,
    showDrafts: boolean = env.OSE_WEB_SHOW_DRAFTS === "true",
    fileSystem: ContentFs = nodeContentFs,
  ) {
    this.contentDir = contentDir ?? DEFAULT_CONTENT_DIR;
    this.showDrafts = showDrafts;
    this.fileSystem = fileSystem;
  }

  async readAllContent(): Promise<ContentMeta[]> {
    const files = await this.globMarkdownFiles(this.contentDir);
    const results: ContentMeta[] = [];

    for (const filePath of files) {
      try {
        const raw = await this.fileSystem.readFile(filePath);
        const { data, content } = matter(raw);
        const parsed = frontmatterSchema.safeParse(data);

        if (!parsed.success) continue;

        const frontmatter = parsed.data;
        if (frontmatter.draft && !this.showDrafts) continue;

        const { slug, isSection } = this.deriveSlug(filePath);
        const readingTime = Math.max(1, Math.ceil(content.split(/\s+/).length / 200));
        const parts = slug.split("/");
        const category = parts.length > 1 ? parts[0] : undefined;

        results.push({
          title: frontmatter.title,
          slug,
          date: frontmatter.date,
          draft: frontmatter.draft,
          description: frontmatter.description,
          tags: frontmatter.tags,
          summary: frontmatter.summary,
          weight: frontmatter.weight,
          isSection,
          filePath,
          readingTime,
          category,
        });
      } catch {
        // Skip files that can't be read
      }
    }

    return results;
  }

  async readFileContent(filePath: string): Promise<{ content: string; frontmatter: Record<string, unknown> }> {
    const raw = await this.fileSystem.readFile(filePath);
    const { content, data } = matter(raw);
    return { content, frontmatter: data as Record<string, unknown> };
  }

  private deriveSlug(filePath: string): { slug: string; isSection: boolean } {
    const relative = path.relative(this.contentDir, filePath).split(path.sep).join("/");
    const isSection = relative.endsWith("_index.md");
    let slug = relative.replace(/\.md$/, "");
    slug = slug.replace(/\/_index$/, "");
    if (slug === "_index") slug = "";
    return { slug, isSection };
  }

  private async globMarkdownFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await this.fileSystem.readDirectory(dir);
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
