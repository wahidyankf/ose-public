import fs from "node:fs/promises";
import FlexSearch from "flexsearch";
import { cache } from "react";
import type { Locale } from "@/features/i18n/core/config";
import type { ContentRepository } from "../core/repository";
import type { ContentIndex, ContentMeta, TreeNode, PageLink, SearchResult, Heading } from "../core/types";
import { parseMarkdown } from "../core/parser";
import { stripMarkdown } from "./reader";
import { buildTrees, getParentSlug, findSubtree, computePrevNext } from "../core/tree-builder";
import { staticSearchDocs } from "../core/static-search-docs";

export interface SearchDoc {
  id: string;
  title: string;
  content: string;
  slug: string;
  locale: string;
}

/**
 * The store the pre-built search data is read from. The default reads the real file; unit tests pass
 * an in-memory double. A failed read means no pre-built data, and the service scans the files instead.
 */
export interface SearchDataFileSystem {
  readFile(filePath: string): Promise<string>;
}

export const nodeSearchDataFileSystem: SearchDataFileSystem = {
  readFile: (filePath) => fs.readFile(filePath, "utf-8"),
};

export class ContentService {
  private readonly repository: ContentRepository;
  private readonly searchDataPath: string | null;
  private readonly searchDataStore: SearchDataFileSystem;
  private contentIndex: ContentIndex | null = null;
  // Course-paths plan, Phase 3 — regression fix: `getIndex()`'s lazy-build guard used to be a
  // synchronous-check / asynchronous-fill (`if (!this.contentIndex) { this.contentIndex = await
  // ... }`), so every caller that arrived before the very first build resolved independently
  // triggered its own full `buildContentIndex()` scan, and whichever finished last silently
  // overwrote the cache for the process's lifetime. Tracking the in-flight build promise itself
  // means every concurrent caller awaits the exact same build (see `service.unit.test.ts`).
  private contentIndexPromise: Promise<ContentIndex> | null = null;
  private searchIndexes = new Map<string, FlexSearch.Document<SearchDoc, true>>();
  private docStore = new Map<string, SearchDoc>();
  private readonly getBySlugCached: ContentService["getBySlugUncached"];

  constructor(
    repository: ContentRepository,
    searchDataPath?: string,
    searchDataStore: SearchDataFileSystem = nodeSearchDataFileSystem,
  ) {
    this.repository = repository;
    this.searchDataPath = searchDataPath ?? null;
    this.searchDataStore = searchDataStore;
    // React.cache scopes this memoization to one Server Component render/request and keys it by
    // `(locale, slug)`. It avoids duplicate Markdown reads/parses when metadata and page rendering
    // resolve the same content simultaneously, without turning file content into a process-global
    // cache that could outlive content changes in development.
    this.getBySlugCached = cache((locale: string, slug: string) => this.getBySlugUncached(locale, slug));
  }

  async getIndex(): Promise<ContentIndex> {
    if (this.contentIndex) {
      return this.contentIndex;
    }
    if (!this.contentIndexPromise) {
      this.contentIndexPromise = this.buildContentIndex()
        .then((index) => {
          this.contentIndex = index;
          return index;
        })
        .catch((error: unknown) => {
          // Let a failed build be retried by the next caller instead of permanently caching a
          // rejection.
          this.contentIndexPromise = null;
          throw error;
        });
    }
    return this.contentIndexPromise;
  }

  async getBySlug(
    locale: string,
    slug: string,
  ): Promise<
    | (ContentMeta & {
        html: string;
        headings: Heading[];
        prev: PageLink | null;
        next: PageLink | null;
      })
    | null
  > {
    return this.getBySlugCached(locale, slug);
  }

  private async getBySlugUncached(
    locale: string,
    slug: string,
  ): Promise<
    | (ContentMeta & {
        html: string;
        headings: Heading[];
        prev: PageLink | null;
        next: PageLink | null;
      })
    | null
  > {
    const index = await this.getIndex();
    const meta = index.contentMap.get(`${locale}:${slug}`);
    if (!meta) return null;

    const { content } = await this.repository.readFileContent(meta.filePath);
    const { html, headings } = await parseMarkdown(content, {
      locale: locale as Locale,
      slug,
      isSection: meta.isSection,
    });
    const prevNext = index.prevNext.get(`${locale}:${slug}`);

    return {
      ...meta,
      html,
      headings,
      prev: prevNext?.prev ?? null,
      next: prevNext?.next ?? null,
    };
  }

  async listChildren(locale: string, parentSlug: string): Promise<ContentMeta[]> {
    const index = await this.getIndex();
    const children: ContentMeta[] = [];

    for (const [key, meta] of index.contentMap) {
      if (!key.startsWith(`${locale}:`)) continue;
      const parent = getParentSlug(meta.slug);
      if (parent === parentSlug && meta.slug !== parentSlug) {
        children.push(meta);
      }
    }

    return children.sort((a, b) => a.weight - b.weight);
  }

  async getTree(locale: string, rootSlug?: string): Promise<TreeNode[]> {
    const index = await this.getIndex();
    const tree = index.trees[locale] ?? [];

    if (rootSlug) {
      const subtree = findSubtree(tree, rootSlug);
      return subtree ? subtree.children : [];
    }

    return tree;
  }

  async search(locale: string, query: string, limit: number = 20): Promise<SearchResult[]> {
    await this.ensureSearchIndex(locale);

    const index = this.searchIndexes.get(locale);
    if (!index) return [];

    const results = index.search(query, { limit, enrich: true });
    const seen = new Set<string>();
    const output: SearchResult[] = [];

    for (const field of results) {
      for (const result of field.result) {
        const id = String(
          typeof result === "object" && result !== null && "id" in result ? (result as { id: unknown }).id : result,
        );
        if (seen.has(id)) continue;
        seen.add(id);

        const doc = this.docStore.get(id);
        if (!doc) continue;

        output.push({
          title: doc.title,
          slug: doc.slug,
          excerpt: createExcerpt(doc.content, query),
          locale: doc.locale,
        });
      }
    }

    return output.slice(0, limit);
  }

  isSearchIndexReady(locale: string): boolean {
    return this.searchIndexes.has(locale);
  }

  private async ensureSearchIndex(locale: string): Promise<void> {
    if (this.searchIndexes.has(locale)) return;

    const preBuiltDocs = await this.tryLoadPreBuiltSearchData();

    // Rule-15 UWT-001 fix: `staticSearchDocs()` covers app-route pages (the Tools section) that
    // carry no markdown file, so neither the pre-built index nor the file-scan fallback would ever
    // find them on its own — merged in here so BOTH paths (prod pre-built JSON, dev file-scan)
    // surface the same tool pages.
    if (preBuiltDocs) {
      this.buildSearchIndexFromDocs([...preBuiltDocs, ...staticSearchDocs()]);
    } else {
      await this.buildSearchIndexFromFiles();
    }
  }

  private async tryLoadPreBuiltSearchData(): Promise<SearchDoc[] | null> {
    if (!this.searchDataPath) return null;
    try {
      const raw = await this.searchDataStore.readFile(this.searchDataPath);
      return JSON.parse(raw) as SearchDoc[];
    } catch {
      return null;
    }
  }

  private buildSearchIndexFromDocs(docs: SearchDoc[]): void {
    const locales = [...new Set(docs.map((d) => d.locale))];

    for (const loc of locales) {
      if (this.searchIndexes.has(loc)) continue;

      const index = new FlexSearch.Document<SearchDoc, true>({
        document: { id: "id", index: ["title", "content"], store: true },
        tokenize: "forward",
      });

      for (const doc of docs.filter((d) => d.locale === loc)) {
        index.add(doc);
        this.docStore.set(doc.id, doc);
      }

      this.searchIndexes.set(loc, index);
    }
  }

  private async buildSearchIndexFromFiles(): Promise<void> {
    const contentIndex = await this.getIndex();
    const items = [...contentIndex.contentMap.values()];
    const locales = [...new Set(items.map((i) => i.locale))];
    // Rule-15 UWT-001 fix: see the comment in `ensureSearchIndex` — merged into this dev-mode
    // file-scan path too, so the Tools pages are searchable with or without a pre-built index.
    const statics = staticSearchDocs();

    for (const loc of locales) {
      if (this.searchIndexes.has(loc)) continue;

      const index = new FlexSearch.Document<SearchDoc, true>({
        document: { id: "id", index: ["title", "content"], store: true },
        tokenize: "forward",
      });

      const localeItems = items.filter((i) => i.locale === loc && !i.isSection);

      for (const item of localeItems) {
        try {
          const { content } = await this.repository.readFileContent(item.filePath);
          const plainText = stripMarkdown(content);
          const doc: SearchDoc = {
            id: `${loc}:${item.slug}`,
            title: item.title,
            content: plainText,
            slug: item.slug,
            locale: loc,
          };
          index.add(doc);
          this.docStore.set(doc.id, doc);
        } catch {
          // Skip files that can't be read
        }
      }

      for (const doc of statics.filter((d) => d.locale === loc)) {
        index.add(doc);
        this.docStore.set(doc.id, doc);
      }

      this.searchIndexes.set(loc, index);
    }
  }

  private async buildContentIndex(): Promise<ContentIndex> {
    const allContent = await this.repository.readAllContent();
    const contentMap = new Map<string, ContentMeta>();

    for (const meta of allContent) {
      contentMap.set(`${meta.locale}:${meta.slug}`, meta);
    }

    const trees = buildTrees(allContent);
    const prevNext = computePrevNext(allContent);

    return { contentMap, trees, prevNext };
  }
}

function createExcerpt(content: string, query: string): string {
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const idx = lowerContent.indexOf(lowerQuery);

  if (idx === -1) {
    return content.slice(0, 150) + (content.length > 150 ? "..." : "");
  }

  const start = Math.max(0, idx - 60);
  const end = Math.min(content.length, idx + query.length + 60);
  let excerpt = content.slice(start, end);

  if (start > 0) excerpt = "..." + excerpt;
  if (end < content.length) excerpt = excerpt + "...";

  return excerpt;
}
