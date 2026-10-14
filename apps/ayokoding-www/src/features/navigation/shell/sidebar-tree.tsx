"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { TreeNode } from "@/features/content/core/types";
import { contentUrl } from "@/features/content/core/content-url";
import type { Locale } from "@/features/i18n/core/config";
import { COURSE_CATALOG_SLUG } from "@/features/course-paths/shell/course-path-nav";
import { CourseCategoryGroups } from "./course-category-groups";

interface SidebarTreeProps {
  nodes: TreeNode[];
  locale: string;
  depth?: number;
}

export function SidebarTree({ nodes, locale, depth = 0 }: SidebarTreeProps) {
  const list = (
    <ul className={cn("min-w-max space-y-0.5", depth > 0 && "ml-3 border-l border-border pl-2")}>
      {nodes.map((node) => (
        <SidebarNode key={node.slug} node={node} locale={locale} depth={depth} />
      ))}
    </ul>
  );

  // Only the root-level tree owns the horizontal scroll container — wrapping every
  // recursive nested call too would nest scroll regions inside scroll regions.
  if (depth > 0) {
    return list;
  }

  return <ScrollableTree>{list}</ScrollableTree>;
}

/**
 * Wraps the root nav tree in a horizontally-scrollable container and fades its
 * trailing edge only while content actually overflows — tracked live so the
 * cue appears/disappears as the reader resizes the sidebar, rather than a
 * silent clip with no signal that a label continues off-screen (see UWT-002 in
 * this plan's rule-15 retest).
 */
function ScrollableTree({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }

    const checkOverflow = () => setIsOverflowing(el.scrollWidth > el.clientWidth);
    checkOverflow();

    if (typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(checkOverflow);
    observer.observe(el);
    return () => observer.disconnect();
  }, [children]);

  return (
    <div
      ref={containerRef}
      data-overflowing={isOverflowing || undefined}
      className="overflow-x-auto"
      style={
        isOverflowing
          ? {
              maskImage: "linear-gradient(to right, black calc(100% - 10px), transparent)",
              WebkitMaskImage: "linear-gradient(to right, black calc(100% - 10px), transparent)",
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}

function SidebarNode({ node, locale, depth }: { node: TreeNode; locale: string; depth: number }) {
  const pathname = usePathname();
  const href = contentUrl(locale as Locale, node.slug);
  const isActive = pathname === href;
  const isParent = pathname.startsWith(href + "/");
  const [expanded, setExpanded] = useState(isActive || isParent);

  const hasChildren = node.children.length > 0;

  return (
    <li>
      <div className="flex items-center">
        <Link
          href={href}
          // `title` (UWT-002 fix, phase-5 rule-15 retest): a second, independent, unconditional
          // recovery path for a label the visible rail is currently too narrow to show in full —
          // a sighted mouse user can always hover to read the complete text, regardless of scroll
          // position. Deliberately keeps `whitespace-nowrap` (never `truncate`/ellipsis) — this
          // component's own contract (`resizable-sidebar.feature`'s "the label is not clipped or
          // wrapped") is that an overflowing label is always fully recoverable via the tree's
          // horizontal scroll + fade cue, never silently clipped with an ellipsis instead.
          title={node.title}
          className={cn(
            "flex-1 rounded-md px-2 py-1.5 text-sm whitespace-nowrap transition-colors",
            isActive
              ? // The 10% tint put the active label's primary blue at 4.39:1 on the rail surface,
                // below the 4.5:1 AA minimum for body text (S39); the 5% tint keeps the same
                // colour-is-never-the-only-signal treatment at 4.8:1.
                "bg-primary/5 font-medium text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          {node.title}
        </Link>
        {hasChildren && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="sticky right-0 shrink-0 bg-background p-1 text-muted-foreground hover:text-foreground"
            aria-label={expanded ? "Collapse section" : "Expand section"}
          >
            <ChevronRight className={cn("h-4 w-4 transition-transform", expanded && "rotate-90")} />
          </button>
        )}
      </div>
      {hasChildren &&
        expanded &&
        (node.slug === COURSE_CATALOG_SLUG ? (
          <CourseCategoryGroups nodes={node.children} locale={locale} depth={depth + 1} />
        ) : (
          <SidebarTree nodes={node.children} locale={locale} depth={depth + 1} />
        ))}
    </li>
  );
}
