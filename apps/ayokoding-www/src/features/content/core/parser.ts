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
 * UIW-004: lesson bodies author sections at `###` while the page title renders
 * as the h1, so the page outline skipped h1 → h3. Lift the shallowest body
 * heading level to h2 — shifting deeper levels by the same delta so nesting is
 * preserved — fixing every course at once. Bodies already starting at h1/h2
 * are untouched. Runs before slug/extraction so heading ids and the TOC
 * follow the normalized levels.
 */
function normalizeHeadingLevels(tree: HastNode): void {
  const levels: number[] = [];
  collectHeadingLevels(tree, levels);
  if (levels.length === 0) return;

  const min = Math.min(...levels);
  if (min <= 2) return;

  shiftHeadingLevels(tree, 2 - min);
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
    if (node.type === "element" && node.tagName !== undefined && /^h[2-6]$/.test(node.tagName)) {
      node.tagName = `h${parseInt(node.tagName.slice(1), 10) + delta}`;
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
