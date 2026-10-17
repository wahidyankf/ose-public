import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { contentUrl } from "@/features/content/core/content-url";
import type { Locale } from "@/features/i18n/core/config";

/**
 * The active fixture path context (course-paths plan, Cycle 2.3) — when present, the trail
 * collapses to `Home / <learnLabel> / <pathTitle> / <current>`, replacing the plain
 * content-tree ancestor segments. `learnLabel`/`learnHref` are supplied by the caller (rather
 * than hardcoded here) so `Breadcrumb` stays presentation-only, with no i18n-key or routing-
 * convention knowledge of its own.
 */
export interface BreadcrumbPathContext {
  pathId: string;
  pathTitle: string;
  learnLabel: string;
  learnHref: string;
}

interface BreadcrumbProps {
  locale: string;
  slug: string;
  segments: { label: string; slug: string; href?: string }[];
  // When true, the final (current-page) segment is rendered as a non-link
  // aria-current="page" crumb instead of being dropped. Callers that already
  // surface the current page in an <h1> leave this absent (default behaviour).
  showCurrent?: boolean;
  // Course-paths plan (Cycle 2.3) — when set, collapses the trail to the path-aware shape
  // documented on {@link BreadcrumbPathContext} instead of the plain `segments` array.
  pathContext?: BreadcrumbPathContext;
}

/**
 * Build the effective segments array to render — the plain `segments` as-is when no
 * `pathContext` is active, or the collapsed `Home / Learn / <Path Title> / <current>` trail when
 * one is (Cycle 2.3). Keeping this the single place that chooses between the two trails is the
 * cycle's own REFACTOR note: canonical and path-aware rendering can never drift apart because
 * they share every downstream line (`showCurrent`, `aria-current`, mobile collapse) below.
 */
function resolveEffectiveSegments(
  locale: string,
  segments: { label: string; slug: string; href?: string }[],
  pathContext: BreadcrumbPathContext | undefined,
): { label: string; slug: string; href?: string }[] {
  if (!pathContext || segments.length === 0) {
    return segments;
  }

  const home = segments[0]!;
  const current = segments[segments.length - 1]!;
  const pathSlug = `learn/paths/${pathContext.pathId}`;

  // UWT-015: the path crumb never carries `?path=` — on the path's own page that query is
  // self-referential cruft (`<path>?path=<itself>`), and the path page never consumes it.
  return [
    home,
    { label: pathContext.learnLabel, slug: "learn", href: pathContext.learnHref },
    { label: pathContext.pathTitle, slug: pathSlug, href: contentUrl(locale as Locale, pathSlug) },
    current,
  ];
}

// Always resolves through contentUrl() — once contentUrl() is a uniform bare
// join (DD-48 de-namespacing removed its /c/-prefix branch), this is
// identical to a plain `/{locale}/{slug}` join for every content href, so
// there is no longer a distinct "content" vs "non-content" href mode.
function hrefFor(locale: string, segment: { slug: string; href?: string }): string {
  if (segment.href !== undefined) return segment.href;
  if (!segment.slug) return `/${locale}`;
  return contentUrl(locale as Locale, segment.slug);
}

export function Breadcrumb({ locale, segments, showCurrent = false, pathContext }: BreadcrumbProps) {
  const effectiveSegments = resolveEffectiveSegments(locale, segments, pathContext);
  // Default: exclude the last segment — the current page title is shown in the h1.
  // showCurrent: keep every segment; render the last one as a non-link crumb.
  const visibleSegments = showCurrent ? effectiveSegments : effectiveSegments.slice(0, -1);
  if (visibleSegments.length === 0) return null;

  const lastIndex = visibleSegments.length - 1;
  // DWT-001: beyond 3 crumbs, the middle ones collapse behind one ellipsis at
  // mobile widths — see the mobile-collapse doc comment above the <ol> below.
  const hasMobileCollapse = visibleSegments.length > 3;

  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted-foreground">
      {/*
       * DWT-001: the base class is non-wrapping (no bare `flex-wrap`) so a deep
       * breadcrumb never wraps to multiple rows at 375px — prd.md's Screen 4
       * acceptance requires "no multi-line breadcrumb wrap at 375 px", and the
       * committed legacy-landing mobile mockups (`plans/in-progress/
       * ayokoding-learning-path-01-url-restructure/assets/
       * legacy-landing-option-{a,b}-mobile.png`) show a single-line, middle-
       * truncated `Home / … / Legacy`. When there are more than 3 visible
       * crumbs, the middle ones (`hidden sm:flex` below) drop out at mobile
       * widths and one collapsed ellipsis crumb (`sm:hidden` below) stands in
       * for them, keeping the first and last crumbs always visible. At `sm:`
       * and up every crumb reappears and the ellipsis disappears (the desktop
       * trail is otherwise unchanged apart from the removed `flex-wrap`). Because
       * the row no longer wraps at any width, `overflow-x-auto` + `whitespace-nowrap`
       * give a self-contained horizontal-scroll fallback so a very deep trail
       * scrolls within its own box rather than overflowing the page in the
       * tablet band (>=sm, where the mobile collapse is inactive).
       */}
      <ol className="flex items-center gap-1 overflow-x-auto whitespace-nowrap">
        {visibleSegments.flatMap((segment, i) => {
          const isCurrent = showCurrent && i === lastIndex;
          const isMobileCollapsedMiddle = hasMobileCollapse && i > 0 && i < lastIndex;
          const crumb = (
            <li
              key={segment.slug}
              className={isMobileCollapsedMiddle ? "hidden items-center gap-1 sm:flex" : "flex items-center gap-1"}
            >
              {i > 0 && <ChevronRight className="h-3 w-3 shrink-0" />}
              {isCurrent ? (
                <span aria-current="page" className="font-medium text-foreground">
                  {segment.label}
                </span>
              ) : (
                <Link href={hrefFor(locale, segment)} className="hover:text-foreground">
                  {segment.label}
                </Link>
              )}
            </li>
          );

          // Insert the collapsed ellipsis crumb right after the first crumb —
          // it stands in for the mobile-hidden middle crumbs above, mobile-only.
          if (hasMobileCollapse && i === 0) {
            return [
              crumb,
              <li
                key="breadcrumb-ellipsis"
                data-testid="breadcrumb-ellipsis"
                className="flex items-center gap-1 sm:hidden"
              >
                <ChevronRight className="h-3 w-3 shrink-0" />
                <span aria-hidden="true">…</span>
                <span className="sr-only">More breadcrumb items</span>
              </li>,
            ];
          }
          return [crumb];
        })}
      </ol>
    </nav>
  );
}
