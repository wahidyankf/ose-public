import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeStringify from "rehype-stringify";
import type { Locale } from "@/features/i18n/core/config";
import type { Heading } from "./types";
import { transformShortcodes } from "./shortcodes";
import { resolveContentHref } from "./content-link-rewrite";

interface ParseResult {
  html: string;
  headings: Heading[];
}

export interface ParseContext {
  locale: Locale;
  slug: string;
  /**
   * True when the page being parsed is a section index (`_index.md`), whose containing
   * directory is `slug` itself rather than `dirname(slug)`. Required by
   * {@link resolveContentHref} to resolve in-body relative links correctly from section pages.
   */
  isSection?: boolean;
}

export async function parseMarkdown(content: string, context?: ParseContext): Promise<ParseResult> {
  const headings: Heading[] = [];

  // Pre-process shortcodes before markdown parsing
  const processed = transformShortcodes(content);

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath, { singleDollarTextMath: true })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(() => (tree) => normalizeHeadingLevels(tree))
    .use(rehypePrettyCode, {
      // The light palette must meet WCAG 2 AA against the code surface `globals.css` pins for it
      // (#f6f8fa, DWT-001): plain `github-light` renders keywords at #d73a49, only 4.29:1 there,
      // and axe reports every one of them (S39). The high-contrast variant is the same palette
      // with AA-safe values, so the pinned background and the copy-to-clipboard affordance are
      // untouched.
      theme: {
        dark: "github-dark",
        light: "github-light-high-contrast",
      },
      keepBackground: true,
    })
    .use(rehypeKatex)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, { behavior: "wrap" })
    .use(() => (tree) => {
      // Extract headings (H2-H4) for table of contents
      extractHeadings(tree, headings);
    })
    .use(() => (tree) => rewriteContentLinks(tree, context))
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(processed);

  return {
    html: String(file),
    headings,
  };
}

interface HastNode {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
  value?: string;
}

/**
 * UIW-004/EWT-002/EWT-003: the page title owns the h1, so the first body
 * heading maps to h2 and every other body heading shifts by the same delta —
 * nesting is preserved — clamped to [h2, h6] so nothing is promoted to h1
 * and nothing exceeds h6. Shifting from the FIRST body heading (not the
 * document-global minimum) keeps bodies that open with `# Title` (EWT-002)
 * and bodies whose first heading is h3 with a later `##` (EWT-003) on a clean
 * h1 → h2 outline. Runs before slug/extraction so heading ids and the TOC
 * follow the normalized levels.
 *
 * Exported (no behavior change) so the lesson-corpus outline sweep can run this
 * exact normalization over mdast-derived heading levels without the full
 * rehype/shiki pipeline.
 */
export function normalizeHeadingLevels(tree: HastNode): void {
  const levels: number[] = [];
  collectHeadingLevels(tree, levels);
  if (levels.length === 0) return;

  const first = levels[0];
  if (first === undefined) return;
  const delta = 2 - first;
  if (delta === 0) return;

  shiftHeadingLevels(tree, delta);
}

function collectHeadingLevels(tree: HastNode, levels: number[]): void {
  if (!tree.children) return;

  for (const node of tree.children) {
    if (node.type === "element" && node.tagName !== undefined && /^h[1-6]$/.test(node.tagName)) {
      levels.push(parseInt(node.tagName.slice(1), 10));
    }
    if (node.children) {
      collectHeadingLevels(node, levels);
    }
  }
}

function shiftHeadingLevels(tree: HastNode, delta: number): void {
  if (!tree.children) return;

  for (const node of tree.children) {
    if (node.type === "element" && node.tagName !== undefined && /^h[1-6]$/.test(node.tagName)) {
      const shifted = Math.min(6, Math.max(2, parseInt(node.tagName.slice(1), 10) + delta));
      node.tagName = `h${shifted}`;
    }
    if (node.children) {
      shiftHeadingLevels(node, delta);
    }
  }
}

function extractHeadings(tree: HastNode, headings: Heading[]): void {
  if (!tree.children) return;

  for (const node of tree.children) {
    if (node.type === "element" && node.tagName && ["h2", "h3", "h4"].includes(node.tagName)) {
      const id = (node.properties?.id as string) ?? "";
      const text = getTextContent(node);
      const level = parseInt(node.tagName.slice(1), 10);
      headings.push({ id, text, level });
    }
    if (node.children) {
      extractHeadings(node, headings);
    }
  }
}

function rewriteContentLinks(tree: HastNode, context?: ParseContext): void {
  if (!tree.children) return;

  for (const node of tree.children) {
    if (node.type === "element" && node.tagName === "a" && node.properties) {
      const href = node.properties.href;
      if (typeof href === "string") {
        node.properties.href = resolveContentHref(href, context);
      }
    }
    if (node.children) {
      rewriteContentLinks(node, context);
    }
  }
}

function getTextContent(node: HastNode): string {
  if (node.type === "text") return node.value ?? "";
  if (!node.children) return "";
  return node.children.map(getTextContent).join("");
}
