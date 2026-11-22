import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { normalizeHeadingLevels } from "@/features/content/core/parser";

/** Minimal mdast shape: only heading depths in document order matter here. */
interface MdastNode {
  type: string;
  depth?: number;
  children?: MdastNode[];
}

/** Collects mdast heading depths in document order. */
function collectMdastHeadingDepths(node: MdastNode, depths: number[]): void {
  if (node.type === "heading" && typeof node.depth === "number") {
    depths.push(node.depth);
  }
  for (const child of node.children ?? []) {
    collectMdastHeadingDepths(child, depths);
  }
}

/** Every violation of the lesson-outline contract in one normalized level list. */
function checkNormalizedOutline(levels: number[]): string[] {
  const problems: string[] = [];
  if (levels.includes(1)) {
    problems.push("body renders an h1 (page would have 2+ h1s)");
  }
  if (levels.length === 0) return problems;
  if (levels[0] !== 2) {
    problems.push(`first body heading is h${levels[0]}, skipping from the page h1`);
  }
  for (let i = 1; i < levels.length; i += 1) {
    const prev = levels[i - 1];
    const curr = levels[i];
    if (prev === undefined || curr === undefined) continue;
    if (curr > prev + 1) {
      problems.push(`skipped level h${prev} -> h${curr}`);
      break;
    }
  }
  return problems;
}

/**
 * Fence content never parses as headings; dropping it keeps this sweep fast (no shiki).
 * Mirrors CommonMark fences so the kept lines agree with remark: at most 3 spaces of
 * indent, and a fence only closes on the same fence character (traceback ASCII art like
 * `    ~~~~^^^` inside a ``` block is literal text, not a fence).
 */
function stripFencedCode(body: string): string {
  const kept: string[] = [];
  let opener: { char: string; length: number } | null = null;
  for (const line of body.split("\n")) {
    const fence = line.match(/^ {0,3}(`{3,}|~{3,})/);
    const run = fence?.[1];
    const ch = run?.[0];
    if (
      fence &&
      run !== undefined &&
      ch !== undefined &&
      (opener === null || (ch === opener.char && run.length >= opener.length))
    ) {
      opener = opener === null ? { char: ch, length: run.length } : null;
      continue;
    }
    if (opener === null) kept.push(line);
  }
  return kept.join("\n");
}

/**
 * Sweeps one shard of the lesson corpus for heading-outline violations.
 *
 * Same walk, fence-strip, frontmatter-strip, mdast depths, minimal-hast + real
 * `normalizeHeadingLevels` as the original single-`it` sweep; files are sorted
 * and dealt round-robin (`index % shards === shard`) so every shard run covers
 * a disjoint slice of the same corpus. Offender entries keep the original
 * `rel: problems` format, prefixed with the shard id.
 */
export function sweepCorpusShard(shard: number, shards: number): { lessons: number; offenders: string[] } {
  const root = path.join(process.cwd(), "content/en/learn/courses");
  const lessonFiles: string[] = [];
  const walk = (relative: string) => {
    for (const entry of fs.readdirSync(path.join(root, relative), { withFileTypes: true })) {
      const rel = path.posix.join(relative, entry.name);
      if (entry.isDirectory()) {
        walk(rel);
        continue;
      }
      if (rel.split("/").includes("learning") && entry.name.endsWith(".md")) {
        lessonFiles.push(rel);
      }
    }
  };
  walk("");

  const sorted = lessonFiles.sort();
  const mine = sorted.filter((_, index) => index % shards === shard);

  const mdastProcessor = unified().use(remarkParse).use(remarkGfm);
  const offenders: string[] = [];
  for (const rel of mine) {
    const raw = fs.readFileSync(path.join(root, rel), "utf8");
    const body = stripFencedCode(matter(raw).content);
    const mdast = mdastProcessor.parse(body) as unknown as MdastNode;
    const depths: number[] = [];
    collectMdastHeadingDepths(mdast, depths);
    const tree = {
      type: "root",
      children: depths.map((depth) => ({ type: "element", tagName: `h${depth}`, children: [] })),
    };
    normalizeHeadingLevels(tree);
    const levels = tree.children.map((node) => parseInt(node.tagName.slice(1), 10));
    const problems = checkNormalizedOutline(levels);
    if (problems.length > 0) {
      offenders.push(`[shard ${shard}/${shards}] ${rel}: ${problems.join("; ")}`);
    }
  }
  return { lessons: mine.length, offenders };
}
