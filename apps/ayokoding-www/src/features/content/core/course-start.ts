import type { TreeNode } from "./types";

/**
 * The Start-target rule (plan ayokoding-learn-revamp-03, tech-docs/004), in order:
 * 1. `learning/overview` when it is a real page;
 * 2. otherwise the first leaf page of the `learning` subtree, depth-first, siblings ordered
 *    by weight then slug, skipping section nodes with no real `_index.md` (synthetic folders
 *    such as `learning/artifacts`);
 * 3. otherwise a top-level `overview` page;
 * 4. otherwise null (the caller renders no Start button).
 *
 * Pure — no IO. Never mutates the tree: sibling ordering sorts copies.
 */
export function resolveCourseStartSlug(courseNode: TreeNode, isRealPage: (slug: string) => boolean): string | null {
  const learning = courseNode.children.find((child) => lastSegment(child.slug) === "learning");

  if (learning) {
    const overview = learning.children.find((child) => child.slug === `${learning.slug}/overview`);
    if (overview && !overview.isSection && isRealPage(overview.slug)) {
      return overview.slug;
    }
    const first = firstLeafPage(learning, isRealPage);
    if (first !== null) {
      return first;
    }
  }

  const topOverview = courseNode.children.find(
    (child) => child.slug === `${courseNode.slug}/overview` && !child.isSection,
  );
  if (topOverview && isRealPage(topOverview.slug)) {
    return topOverview.slug;
  }

  return null;
}

function lastSegment(slug: string): string {
  const parts = slug.split("/");
  return parts[parts.length - 1] ?? slug;
}

function orderedChildren(node: TreeNode): TreeNode[] {
  return [...node.children].sort((a, b) => a.weight - b.weight || a.slug.localeCompare(b.slug));
}

function firstLeafPage(node: TreeNode, isRealPage: (slug: string) => boolean): string | null {
  for (const child of orderedChildren(node)) {
    if (!child.isSection) {
      if (isRealPage(child.slug)) {
        return child.slug;
      }
      continue;
    }
    // A section with no real _index.md is synthetic (e.g. learning/artifacts): skip its subtree.
    if (!isRealPage(child.slug)) {
      continue;
    }
    const found = firstLeafPage(child, isRealPage);
    if (found !== null) {
      return found;
    }
  }
  return null;
}
