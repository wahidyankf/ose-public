"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { contentUrl } from "@/features/content/core/content-url";
import type { Locale } from "@/features/i18n/core/config";
import { t } from "@/features/i18n/core/translations";
import type { PathManifest } from "../core/schemas";
import { isPendingSkillsRestructure } from "../core/skills-restructure-allowlist";
import { coursePositionInManifest, manifestCourseOrder } from "./course-path-nav";
import { scrollActiveCourseIntoView } from "./active-course-scroll";
import { PhaseGroup, RailCourseRow } from "./phase-group";

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
  /** Locale-independent outline course IDs — an `OutlineBadge` renders on those rows only. */
  outlineCourseIds?: readonly string[];
}

/**
 * The left path rail (course-paths plan, Cycle 2.8 — the selected Screen 3 Option B).
 *
 * A content swap into the **existing** `ResizableSidebar` host — this component owns no `<aside>`,
 * no `hidden … md:block` gate, and no `localStorage` width key of its own; all three stay exactly
 * where `resizable-sidebar.tsx` already defines them (tech-docs.md §Screen 3).
 */
export function PathRail({ locale, manifest, currentCourseId, courseTitles, outlineCourseIds = [] }: PathRailProps) {
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

  // Phase groups with continuous position numbers (plan 02, Phase 4, FR-5): core phases first
  // ("Phase n · Title"), then an "Optional extensions" divider before the first extension phase.
  // `startPosition` accumulates in manifest order so course numbers never restart at a boundary.
  // The drawer renders this same component, so both surfaces group identically.
  let coreSeen = 0;
  let nextPosition = 1;
  let dividerShown = false;
  const sections = manifest.phases.map((phase) => {
    const section = {
      phase,
      phaseNumber: phase.kind === "core" ? coreSeen + 1 : undefined,
      startPosition: nextPosition,
      showDividerBefore: phase.kind === "extension" && !dividerShown,
    };
    if (phase.kind === "core") {
      coreSeen += 1;
    }
    if (section.showDividerBefore) {
      dividerShown = true;
    }
    nextPosition += phase.courses.length;
    return section;
  });

  return (
    <nav aria-label={`${manifest.title} course list`} className="flex h-full min-h-0 flex-col gap-3 text-sm">
      {/* prd.md's Screen 3 responsive spec requires this readout at md+ widths (phase-5 EWT
          finding — the desktop/tablet rail shipped in Cycle 2.8 omitted it). DWT-003 fix
          (phase-8 rule-15 retest): `shrink-0` keeps the readout pinned above the rows while the
          rows scroll in their own bounded region below — the mockup never shows the readout
          scrolled away with the course list. */}
      <p className="shrink-0 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {t(locale as Locale, "pathsCourseWordCapital")} {index} {t(locale as Locale, "pathsOfWord")} {total}
      </p>
      {/* // Decision 39: removed by plan 07 — a marked skills path keeps today's flat ordered
          list with plan 01's position numbers and no phase chrome. */}
      {isPendingSkillsRestructure(manifest) ? (
        <ol className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
          {manifestCourseOrder(manifest).map((course, position) => (
            <RailCourseRow
              key={course.id}
              locale={locale}
              pathId={manifest.pathId}
              courseId={course.id}
              title={courseTitles[course.id] ?? course.id}
              position={position + 1}
              isCurrent={course.id === currentCourseId}
              showOutlineBadge={false}
              rowRef={course.id === currentCourseId ? currentRowRef : undefined}
            />
          ))}
        </ol>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
          {sections.map(({ phase, phaseNumber, startPosition, showDividerBefore }) => (
            <div key={phase.id}>
              {showDividerBefore && (
                <p className="mb-2 border-t border-border px-2 pt-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {t(locale as Locale, "pathsOptionalExtensions")}
                </p>
              )}
              <PhaseGroup
                locale={locale}
                pathId={manifest.pathId}
                phase={phase}
                phaseNumber={phaseNumber}
                startPosition={startPosition}
                courseTitles={courseTitles}
                outlineCourseIds={outlineCourseIds}
                currentCourseId={currentCourseId}
                currentRowRef={currentRowRef}
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex shrink-0 flex-col gap-1 border-t border-border pt-3 text-xs">
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
