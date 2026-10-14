import type { TreeNode } from "@/features/content/core/types";

/** One page of a course's lesson sequence, in reading order. */
export interface LessonPage {
  /** Page path relative to the course, e.g. `learning/beginner`. */
  pagePath: string;
  /** Content slug, e.g. `learn/courses/extending-neovim/learning/beginner`. */
  slug: string;
  title: string;
}

/**
 * The ordered lesson sequence of a course: its real pages, walked depth-first with siblings
 * ordered by `weight` then `slug` (the tie-break `resolveCourseStartSlug` uses), skipping any
 * section without a real `_index.md` together with everything under it (tech-docs/003). Pages
 * before `startSlug` are dropped so the sequence starts exactly where "Start course" starts. An
 * absent or unresolvable `startSlug` yields `[]`.
 *
 * Pure — no IO, never throws. Never mutates the tree: sibling ordering sorts copies.
 */
export function buildLessonSequence(
  courseNode: TreeNode,
  isRealPage: (slug: string) => boolean,
  startSlug: string | null,
): LessonPage[] {
  if (startSlug === null) {
    return [];
  }

  const pages: LessonPage[] = [];
  collectPages(courseNode, courseNode, isRealPage, pages);

  const startIndex = pages.findIndex((page) => page.slug === startSlug);
  return startIndex === -1 ? [] : pages.slice(startIndex);
}

function collectPages(
  node: TreeNode,
  courseNode: TreeNode,
  isRealPage: (slug: string) => boolean,
  pages: LessonPage[],
): void {
  for (const child of orderedChildren(node)) {
    if (child.isSection) {
      // A section with no real _index.md is synthetic (e.g. learning/artifacts): skip its subtree.
      if (isRealPage(child.slug)) {
        collectPages(child, courseNode, isRealPage, pages);
      }
      continue;
    }

    if (!isRealPage(child.slug)) {
      continue;
    }

    pages.push({
      pagePath: child.slug.slice(courseNode.slug.length + 1),
      slug: child.slug,
      title: child.title,
    });
  }
}

function orderedChildren(node: TreeNode): TreeNode[] {
  return [...node.children].sort((a, b) => a.weight - b.weight || a.slug.localeCompare(b.slug));
}
