import fs from "node:fs";
import path from "node:path";
import { buildTrees, findSubtree } from "@/features/content/core/tree-builder";
import type { ContentMeta, TreeNode } from "@/features/content/core/types";
import { FileSystemContentRepository } from "@/features/content/shell/repository-fs";

export interface RealCourseTree {
  /** Every course directory under `content/en/learn/courses`, sorted. */
  courseIds: string[];
  /** The content tree of the `en` locale, built by the same tree builder the site uses. */
  tree: TreeNode[];
  /** True when `contentMap` holds `en:<slug>` — the same predicate plan 03's corpus check uses. */
  isRealPage: (slug: string) => boolean;
  /** `findSubtree(tree, "learn/courses/<id>")`, or `null` when the tree has no such node. */
  courseNode: (courseId: string) => TreeNode | null;
}

/**
 * Read the real English library off disk exactly as plan 03's start-slug corpus check does:
 * `FileSystemContentRepository` -> `buildTrees` -> `findSubtree`, with `isRealPage` backed by the
 * real content map. Test-only helper (never imported by `src/`); the shipped site never reads the
 * whole library from a test process.
 */
export async function loadRealCourseTree(): Promise<RealCourseTree> {
  const appRoot = process.cwd();
  const repository = new FileSystemContentRepository(path.join(appRoot, "content"));
  const allContent: ContentMeta[] = await repository.readAllContent();
  const tree = buildTrees(allContent)["en"] ?? [];
  const contentMap = new Map(allContent.map((meta) => [`${meta.locale}:${meta.slug}`, meta] as const));

  const courseIds = fs
    .readdirSync(path.join(appRoot, "content/en/learn/courses"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  return {
    courseIds,
    tree,
    isRealPage: (slug) => contentMap.has(`en:${slug}`),
    courseNode: (courseId) => findSubtree(tree, `learn/courses/${courseId}`),
  };
}

/**
 * The real pages the lesson-sequence walk skips because an ancestor section has no real
 * `_index.md` (synthetic folders such as `learning/artifacts`). Reported as evidence; the walk's
 * own tests own the behaviour.
 */
export function countSyntheticPages(node: TreeNode, isRealPage: (slug: string) => boolean): number {
  if (!node.isSection) {
    return 0;
  }

  if (!isRealPage(node.slug)) {
    return countRealPages(node, isRealPage);
  }

  let total = 0;
  for (const child of node.children) {
    total += countSyntheticPages(child, isRealPage);
  }
  return total;
}

function countRealPages(node: TreeNode, isRealPage: (slug: string) => boolean): number {
  let total = 0;
  for (const child of node.children) {
    if (child.isSection) {
      total += countRealPages(child, isRealPage);
    } else if (isRealPage(child.slug)) {
      total += 1;
    }
  }
  return total;
}
