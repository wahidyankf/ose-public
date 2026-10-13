import fs from "node:fs/promises";
import matter from "gray-matter";
import { FileSystemContentRepository } from "./repository-fs";
import { buildTrees } from "../core/tree-builder";
import type { TreeNode } from "../core/types";
import { contentUrl } from "../core/content-url";
import type { Locale } from "../../i18n/core/config";
import type { ContentRepository } from "../core/repository";

export function generateChildList(locale: string, children: TreeNode[], knownSlugs: Set<string>): string {
  const lines: string[] = [];

  for (const child of children) {
    if (!knownSlugs.has(`${locale}:${child.slug}`)) continue;
    lines.push(`- [${child.title}](${contentUrl(locale as Locale, child.slug)})`);
    for (const grandchild of child.children) {
      if (!knownSlugs.has(`${locale}:${grandchild.slug}`)) continue;
      lines.push(`  - [${grandchild.title}](${contentUrl(locale as Locale, grandchild.slug)})`);
    }
  }

  return lines.join("\n");
}

export function extractRawFrontmatter(rawContent: string): string {
  const match = rawContent.match(/^---\n([\s\S]*?)\n---/);
  return match ? (match[1] ?? "") : "";
}

export function rebuildIndexFile(rawContent: string, newChildList: string): string {
  const rawFm = extractRawFrontmatter(rawContent);
  const frontmatterBlock = `---\n${rawFm}\n---`;

  if (newChildList.length === 0) {
    return frontmatterBlock + "\n";
  }
  return frontmatterBlock + "\n\n" + newChildList + "\n";
}

export function ensureFrontmatterFields(rawContent: string, now: Date = new Date()): string {
  const { data } = matter(rawContent);
  const rawFm = extractRawFrontmatter(rawContent);
  const lines: string[] = [];

  if (data.date === undefined) {
    lines.push(`date: ${now.toISOString()}`);
  }

  if (data.draft === undefined) {
    lines.push("draft: false");
  }

  if (lines.length === 0) return rawContent;

  const body = rawContent.slice(rawContent.indexOf("---", 3) + 3).replace(/^\n+/, "");
  const newFm = rawFm + "\n" + lines.join("\n");
  if (body.length === 0) {
    return `---\n${newFm}\n---\n`;
  }
  return `---\n${newFm}\n---\n\n${body}`;
}

export interface ProcessResult {
  changed: string[];
  errors: string[];
}

export interface IndexGeneratorPort {
  repository: ContentRepository;
  readText(filePath: string): Promise<string>;
  writeText(filePath: string, content: string): Promise<void>;
  now(): Date;
}

function nodeIndexGeneratorPort(contentDir: string): IndexGeneratorPort {
  return {
    repository: new FileSystemContentRepository(contentDir),
    readText(filePath) {
      return fs.readFile(filePath, "utf-8");
    },
    async writeText(filePath, content) {
      await fs.writeFile(filePath, content, "utf-8");
    },
    now() {
      return new Date();
    },
  };
}

export async function processAllIndexFiles(
  contentDir: string,
  mode: "generate" | "validate",
  port: IndexGeneratorPort = nodeIndexGeneratorPort(contentDir),
): Promise<ProcessResult> {
  const repository = port.repository;
  const allContent = await repository.readAllContent();
  const trees = buildTrees(allContent);

  // Draft pages never belong in a generated index: their visibility is a request-scoped
  // concern (the repository's AYOKODING_WEB_SHOW_DRAFTS flag), and the E2E build runs with
  // that flag on — admitting draft entries here wrote them into the tracked index files and
  // changed the nav/drawer rendering (discovered via the learn-revamp plan's drawer test).
  const knownSlugs = new Set(allContent.filter((c) => !c.draft).map((c) => `${c.locale}:${c.slug}`));
  const sectionFiles = allContent.filter((c) => c.isSection);
  const changed: string[] = [];
  const errors: string[] = [];

  for (const section of sectionFiles) {
    try {
      const localeTree = trees[section.locale];
      if (!localeTree) continue;

      const children = section.slug === "" ? localeTree : (findNodeBySlug(localeTree, section.slug)?.children ?? null);
      if (!children) continue;

      const rawContent = await port.readText(section.filePath);
      const withFields = ensureFrontmatterFields(rawContent, port.now());

      // A childless section (e.g. a course-paths plan path-landing `_index.md` carrying its own
      // hand-authored runway-justification body, or a not-yet-populated arc/category root) has no
      // child list to generate. Regenerating its body unconditionally — as this loop used to do —
      // would silently discard any hand-authored content it already carries (discovered via the
      // course-paths plan's Cycle 3.1d skills-fixture `_index.md` files losing their authored
      // paragraph on every `generate-indexes` run). Only the frontmatter-completeness pass above
      // applies here; the body is left untouched.
      if (children.length === 0) {
        if (rawContent !== withFields) {
          changed.push(section.filePath);
          if (mode === "generate") {
            await port.writeText(section.filePath, withFields);
          }
        }
        continue;
      }

      // The catalog section (plan 03): page.tsx renders the catalog from course metadata,
      // so the generator keeps this one _index.md frontmatter-only. Every other section is
      // generated as before.
      const isCatalogSection = section.locale === "en" && section.slug === "learn/courses";
      const childList = isCatalogSection ? "" : generateChildList(section.locale, children, knownSlugs);
      const expected = rebuildIndexFile(withFields, childList);

      if (rawContent !== expected) {
        changed.push(section.filePath);
        if (mode === "generate") {
          await port.writeText(section.filePath, expected);
        }
      }
    } catch (err) {
      errors.push(`${section.filePath}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { changed, errors };
}

function findNodeBySlug(nodes: TreeNode[], slug: string): TreeNode | null {
  for (const node of nodes) {
    if (node.slug === slug) return node;
    const found = findNodeBySlug(node.children, slug);
    if (found) return found;
  }
  return null;
}
