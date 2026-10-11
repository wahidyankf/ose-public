"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { contentUrl } from "@/features/content/core/content-url";
import type { Locale } from "@/features/i18n/core/config";
import { t } from "@/features/i18n/core/translations";
import type { PathManifest } from "../core/schemas";
import { coursePositionInManifest, manifestCourseOrder, slugForCourseId } from "./course-path-nav";
import { scrollActiveCourseIntoView } from "./active-course-scroll";
import { PathPositionNumber } from "./path-position-number";

/**
 * Shared base classes for the ordered course-row `Link`s — factored out (rather than duplicated
 * per `isCurrent` branch) so the one focus-visible/min-height/spacing definition edits in a single
 * place. See Finding 2 of the check6 audit (`generated-reports/swe-ui__55d6c6__*__audit.md`): the
 * prior duplicated-string shape was the mechanical root cause of the check3-check5 "one new
 * drifted spot per round" trickle.
 */
const COURSE_LINK_BASE =
  "flex min-h-11 items-center gap-1 truncate px-2 py-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

/**
 * Shared, unconditional classes for both footer escape links — identical for each, so no `cn()`
 * branching is needed. `underline underline-offset-2` (UWT-003 fix, phase-5 rule-15 retest): the
 * prior styling gave no always-visible signal these rows are links, only a `:hover` color change.
 */
const FOOTER_LINK_CLASS =
  "flex min-h-11 items-center px-2 text-muted-foreground underline underline-offset-2 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

export interface PathRailProps {
  locale: string;
  manifest: PathManifest;
  /** The course ID currently being read — marked `aria-current="page"` in the ordered list. */
  currentCourseId: string;
  /** courseId -> title, covering every ID in `manifest.courseOrder` (falls back to the ID itself). */
  courseTitles: Readonly<Record<string, string>>;
}

/**
 * The left path rail (course-paths plan, Cycle 2.8 — the selected Screen 3 Option B).
 *
 * A content swap into the **existing** `ResizableSidebar` host — this component owns no `<aside>`,
 * no `hidden … md:block` gate, and no `localStorage` width key of its own; all three stay exactly
 * where `resizable-sidebar.tsx` already defines them (tech-docs.md §Screen 3).
 */
export function PathRail({ locale, manifest, currentCourseId, courseTitles }: PathRailProps) {
  const courses = manifestCourseOrder(manifest);
  const { index, total } = coursePositionInManifest(manifest, currentCourseId);
  // The current course's row — handed to scrollActiveCourseIntoView below (plan
  // ayokoding-learn-revamp-01 §4.3, Decision D5).
  const currentRowRef = useRef<HTMLLIElement>(null);

  // Auto-scroll the current course's row into the rail's own scroll container — keyed on
  // currentCourseId so it runs on mount and whenever the reader moves to another course. The
  // helper itself decides "only when hidden": an already-visible row never triggers a jump,
  // and it only ever moves the container's scrollTop, never the page.
  useEffect(() => {
    if (currentRowRef.current) {
      scrollActiveCourseIntoView(currentRowRef.current);
    }
  }, [currentCourseId]);

  return (
    <nav aria-label={`${manifest.title} course list`} className="flex flex-col gap-3 text-sm">
      {/* prd.md's Screen 3 responsive spec requires this readout at md+ widths (phase-5 EWT
          finding — the desktop/tablet rail shipped in Cycle 2.8 omitted it). */}
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {t(locale as Locale, "pathsCourseWordCapital")} {index} {t(locale as Locale, "pathsOfWord")} {total}
      </p>
      <ol className="flex flex-col gap-1">
        {courses.map((course, index) => {
          const isCurrent = course.id === currentCourseId;
          const title = courseTitles[course.id] ?? course.id;

          return (
            <li key={course.id} className="flex items-center gap-1" ref={isCurrent ? currentRowRef : undefined}>
              {/* Position number (plan ayokoding-learn-revamp-01 §4.2): outside the link, so the
                  link's aria-label stays exactly the title, and the number stays visible on the
                  current row too (Decision D4). */}
              <PathPositionNumber position={index + 1} />
              <Link
                href={contentUrl(locale as Locale, slugForCourseId(course.id), manifest.pathId)}
                aria-label={title}
                aria-current={isCurrent ? "page" : undefined}
                className={cn(
                  COURSE_LINK_BASE,
                  // `bg-accent` (DWT-005 fix, phase-5 rule-15 design-tester retest): prd.md's own
                  // Screen 3 hi-fi spec for this exact row states "Current row: aria-current="page"
                  // plus a ▸ marker plus font-semibold plus bg-accent — never hue alone" — the
                  // shipped row carried the marker and font-weight but never the background, so it
                  // read as plain bold text with no highlight, unlike this app's other left-nav
                  // component (`sidebar-tree.tsx`), which does give its own active row a
                  // background pill. Restoring `bg-accent` here (rather than borrowing
                  // `sidebar-tree.tsx`'s unrelated `bg-primary/10` treatment, which prd.md never
                  // specifies for this component) is the ground-truth-backed fix: it makes THIS
                  // component match its own documented spec, closing the "one row has zero
                  // background, one has a pill" gap DWT-005 identified.
                  isCurrent ? "bg-accent font-semibold text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {isCurrent && <span aria-hidden="true">▸</span>}
                <span className="truncate">{title}</span>
              </Link>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-col gap-1 border-t border-border pt-3 text-xs">
        <Link
          href={contentUrl(locale as Locale, `learn/paths/${manifest.pathId}`, manifest.pathId)}
          className={FOOTER_LINK_CLASS}
        >
          {t(locale as Locale, "pathsViewFullPath")}
        </Link>
        <Link href={`/${locale}/browse`} className={FOOTER_LINK_CLASS}>
          {t(locale as Locale, "pathsBrowseAllCourses")}
        </Link>
      </div>
    </nav>
  );
}
