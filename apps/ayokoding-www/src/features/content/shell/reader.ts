import path from "node:path";
import matter from "gray-matter";
import { frontmatterSchema } from "@/features/content/core/schemas";
import type { ContentMeta } from "../core/types";
import { env } from "../../../env";
import { nodeContentFileSystem, type ContentFileSystem } from "./repository-fs";

const CONTENT_DIR = env.AYOKODING_WEB_CONTENT_DIR ?? path.resolve(process.cwd(), "content");

export function getContentDir(): string {
  return CONTENT_DIR;
}

export function deriveSlug(filePath: string, contentDir: string): { locale: string; slug: string; isSection: boolean } {
  const relative = path.relative(contentDir, filePath).split(path.sep).join("/");
  const parts = relative.split("/");
  const locale = parts[0] ?? "";
  const rest = parts.slice(1).join("/");

  const isSection = rest.endsWith("_index.md");
  let slug = rest.replace(/\.md$/, "");
  slug = slug.replace(/\/_index$/, "");
  if (slug === "_index") slug = "";

  return { locale, slug, isSection };
}

async function globMarkdownFiles(dir: string, io: ContentFileSystem): Promise<string[]> {
  const files: string[] = [];
  const entries = await io.readdir(dir);
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const subFiles = await globMarkdownFiles(fullPath, io);
      files.push(...subFiles);
    } else if (entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }
  return files;
}

export async function readAllContent(
  contentDir?: string,
  io: ContentFileSystem = nodeContentFileSystem,
): Promise<ContentMeta[]> {
  const dir = contentDir ?? CONTENT_DIR;
  const files = await globMarkdownFiles(dir, io);
  const results: ContentMeta[] = [];

  for (const filePath of files) {
    try {
      const raw = await io.readFile(filePath);
      const { data } = matter(raw);
      const parsed = frontmatterSchema.safeParse(data);

      if (!parsed.success) {
        console.warn(`[content] Invalid frontmatter in ${filePath}:`, parsed.error.issues);
        continue;
      }

      const frontmatter = parsed.data;
      if (frontmatter.draft && env.AYOKODING_WEB_SHOW_DRAFTS !== "true") {
        continue;
      }

      const { locale, slug, isSection } = deriveSlug(filePath, dir);

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
    } catch (err) {
      console.warn(`[content] Error reading ${filePath}:`, err);
    }
  }

  return results;
}

export async function readFileContent(
  filePath: string,
  io: ContentFileSystem = nodeContentFileSystem,
): Promise<{ content: string; frontmatter: Record<string, unknown> }> {
  const raw = await io.readFile(filePath);
  const { content, data } = matter(raw);
  return { content, frontmatter: data as Record<string, unknown> };
}

export function stripMarkdown(content: string): string {
  return content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*`/g, "")
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/{{<[^>]*>}}/g, "")
    .replace(/{{% [^%]* %}}/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}
