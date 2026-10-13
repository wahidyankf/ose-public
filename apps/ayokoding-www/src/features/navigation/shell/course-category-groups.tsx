"use client";

import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { TreeNode } from "@/features/content/core/types";
import { contentUrl } from "@/features/content/core/content-url";
import type { Locale } from "@/features/i18n/core/config";
import { t } from "@/features/i18n/core/translations";
import { tf } from "@/features/i18n/core/fill";
import { groupByCourseCategory } from "@/features/content/core/course-categories";
import { SidebarTree } from "./sidebar-tree";

/**
 * The sidebar "Courses" groups (plan 03, S3 option A): the children of `learn/courses`
 * grouped by category into disclosure buttons. Only the group holding the current page
 * starts open; server and client markup match because the initial state comes from the
 * pathname available during server rendering of this client component (NFR-04). The
 * wrapper always renders (hidden when closed) so `aria-controls` always resolves.
 */
export interface CourseCategoryGroupsProps {
  nodes: TreeNode[];
  locale: string;
  depth: number;
}

export function CourseCategoryGroups({ nodes, locale, depth }: CourseCategoryGroupsProps) {
  const pathname = usePathname();
  const groups = groupByCourseCategory(nodes, (n) => n.category);

  return (
    <ul className="min-w-max space-y-0.5">
      {groups.map((group) => (
        <CourseCategoryGroup
          key={group.category ? group.category.id : "other-courses"}
          label={
            group.category ? t(locale as Locale, group.category.labelKey) : t(locale as Locale, "catalogOtherCourses")
          }
          groupId={group.category ? group.category.id : "other-courses"}
          nodes={group.items}
          locale={locale}
          depth={depth}
          pathname={pathname}
        />
      ))}
    </ul>
  );
}

function groupContainsCurrent(nodes: TreeNode[], pathname: string | null, locale: string): boolean {
  if (!pathname) return false;
  return nodes.some((node) => {
    const href = contentUrl(locale as Locale, node.slug);
    return pathname === href || pathname.startsWith(href + "/");
  });
}

function CourseCategoryGroup({
  label,
  groupId,
  nodes,
  locale,
  depth,
  pathname,
}: {
  label: string;
  groupId: string;
  nodes: TreeNode[];
  locale: string;
  depth: number;
  pathname: string | null;
}) {
  const initiallyOpen = groupContainsCurrent(nodes, pathname, locale);
  const [open, setOpen] = useState(initiallyOpen);

  // Client navigation into this group opens it; it never closes a group the reader opened.
  useEffect(() => {
    if (groupContainsCurrent(nodes, pathname, locale)) {
      setOpen(true);
    }
  }, [nodes, pathname, locale]);

  const panelId = `sidebar-group-${groupId}`;
  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold tracking-wide whitespace-nowrap text-muted-foreground uppercase hover:bg-accent"
      >
        <ChevronRight className={cn("h-3.5 w-3.5 motion-safe:transition-transform", open && "rotate-90")} aria-hidden />
        <span>{label}</span>
        <span className="ml-auto tabular-nums">{nodes.length}</span>
        <span className="sr-only">{tf(locale as Locale, "sidebarCategoryCount", { count: nodes.length })}</span>
      </button>
      <div id={panelId} hidden={!open}>
        {open ? <SidebarTree nodes={nodes} locale={locale} depth={depth + 1} /> : null}
      </div>
    </li>
  );
}
