import type { ContentMeta, TreeNode, PageLink } from "./types";

export function buildTrees(allContent: ContentMeta[]): Record<string, TreeNode[]> {
  const trees: Record<string, TreeNode[]> = {};
  const locales = [...new Set(allContent.map((c) => c.locale))];

  for (const locale of locales) {
    const items = allContent.filter((c) => c.locale === locale);
    trees[locale] = buildTreeForLocale(items);
  }

  return trees;
}

export function buildTreeForLocale(items: ContentMeta[]): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  for (const item of items) {
    nodeMap.set(item.slug, {
      title: item.title,
      slug: item.slug,
      weight: item.weight,
      isSection: item.isSection,
      children: [],
      ...(item.category !== undefined ? { category: item.category } : {}),
    });
  }

  for (const item of items) {
    const parts = item.slug.split("/");
    for (let i = 1; i < parts.length; i++) {
      const ancestorSlug = parts.slice(0, i).join("/");
      if (!nodeMap.has(ancestorSlug)) {
        const lastPart = parts[i - 1] ?? ancestorSlug;
        nodeMap.set(ancestorSlug, {
          title: lastPart.charAt(0).toUpperCase() + lastPart.slice(1).replace(/-/g, " "),
          slug: ancestorSlug,
          weight: 0,
          isSection: true,
          children: [],
        });
      }
    }
  }

  for (const [, node] of nodeMap) {
    const parentSlug = getParentSlug(node.slug);
    if (parentSlug === null) {
      roots.push(node);
    } else {
      const parent = nodeMap.get(parentSlug);
      if (parent) {
        if (!parent.children.some((c) => c.slug === node.slug)) {
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    }
  }

  sortTreeByWeight(roots);
  return roots;
}

export function getParentSlug(slug: string): string | null {
  if (slug === "") return null;
  const parts = slug.split("/");
  if (parts.length <= 1) return "";
  return parts.slice(0, -1).join("/");
}

export function sortTreeByWeight(nodes: TreeNode[]): void {
  nodes.sort((a, b) => a.weight - b.weight);
  for (const node of nodes) {
    if (node.children.length > 0) {
      sortTreeByWeight(node.children);
    }
  }
}

export function computePrevNext(
  allContent: ContentMeta[],
): Map<string, { prev: PageLink | null; next: PageLink | null }> {
  const result = new Map<string, { prev: PageLink | null; next: PageLink | null }>();
  const locales = [...new Set(allContent.map((c) => c.locale))];

  for (const locale of locales) {
    const items = allContent.filter((c) => c.locale === locale);
    const groups = new Map<string, ContentMeta[]>();

    for (const item of items) {
      if (item.isSection) continue;
      const parent = getParentSlug(item.slug) ?? "";
      const group = groups.get(parent) ?? [];
      group.push(item);
      groups.set(parent, group);
    }

    for (const siblings of groups.values()) {
      siblings.sort((a, b) => a.weight - b.weight);
      for (let i = 0; i < siblings.length; i++) {
        const item = siblings[i];
        if (!item) continue;
        const key = `${locale}:${item.slug}`;
        const prev = i > 0 ? siblings[i - 1] : null;
        const next = i < siblings.length - 1 ? siblings[i + 1] : null;
        result.set(key, {
          prev: prev ? { title: prev.title, slug: prev.slug } : null,
          next: next ? { title: next.title, slug: next.slug } : null,
        });
      }
    }
  }

  return result;
}

export function findSubtree(nodes: TreeNode[], slug: string): TreeNode | null {
  for (const node of nodes) {
    if (node.slug === slug) return node;
    const found = findSubtree(node.children, slug);
    if (found) return found;
  }
  return null;
}
