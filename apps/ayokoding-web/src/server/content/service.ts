import fs from "node:fs/promises";
import FlexSearch from "flexsearch";
import type { ContentRepository } from "./repository";
import type { ContentIndex, ContentMeta, TreeNode, PageLink, SearchResult, Heading } from "./types";
import { parseMarkdown } from "./parser";
import { stripMarkdown } from "./reader";
import { buildTrees, getParentSlug, findSubtree, computePrevNext } from "./tree-builder";

export interface SearchDoc {
  id: string;
  title: string;
  content: string;
  slug: string;
  locale: string;
}

export class ContentService {
  private readonly repository: ContentRepository;
  private readonly searchDataPath: string | null;
  private contentIndex: ContentIndex | null = null;
  private searchIndexes = new Map<string, FlexSearch.Document<SearchDoc, true>>();
  private docStore = new Map<string, SearchDoc>();

  constructor(repository: ContentRepository, searchDataPath?: string) {
    this.repository = repository;
    this.searchDataPath = searchDataPath ?? null;
  }

  async getIndex(): Promise<ContentIndex> {
    if (!this.contentIndex) {
      this.contentIndex = await this.buildContentIndex();
    }
    return this.contentIndex;
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
    const index = await this.getIndex();
    const meta = index.contentMap.get(`${locale}:${slug}`);
    if (!meta) return null;

    const { content } = await this.repository.readFileContent(meta.filePath);
    const { html, headings } = await parseMarkdown(content);
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

    if (preBuiltDocs) {
      this.buildSearchIndexFromDocs(preBuiltDocs);
    } else {
      await this.buildSearchIndexFromFiles();
    }
  }

  private async tryLoadPreBuiltSearchData(): Promise<SearchDoc[] | null> {
    if (!this.searchDataPath) return null;
    try {
      const raw = await fs.readFile(this.searchDataPath, "utf-8");
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
        tokenize: "full",
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

    for (const loc of locales) {
      if (this.searchIndexes.has(loc)) continue;

      const index = new FlexSearch.Document<SearchDoc, true>({
        document: { id: "id", index: ["title", "content"], store: true },
        tokenize: "full",
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
