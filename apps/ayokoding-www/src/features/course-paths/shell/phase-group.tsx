import type { Ref } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { contentUrl } from "@/features/content/core/content-url";
import type { Locale } from "@/features/i18n/core/config";
import { t } from "@/features/i18n/core/translations";
import { normalizeCourseRef } from "../core/manifest";
import type { PathPhase } from "../core/schemas";
import { slugForCourseId } from "./course-path-nav";
import { OutlineBadge } from "./outline-badge";
import { PathPositionNumber } from "./path-position-number";

/**
 * Shared base classes for the ordered course-row `Link`s — the same definition `path-rail.tsx`'s
 * flat list used, kept as the single definition for grouped rows. See Finding 2 of the check6
 * audit (`generated-reports/swe-ui__55d6c6__*__audit.md`): the prior duplicated-string shape was
 * the mechanical root cause of the check3-check5 "one new drifted spot per round" trickle.
 */
const COURSE_LINK_BASE =
  "flex min-h-11 items-center gap-1 truncate px-2 py-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

export interface PhaseGroupProps {
  locale: string;
  /** The owning manifest's path ID — every row link carries it as `?path=`. */
  pathId: string;
  phase: PathPhase;
  /**
   * The 1-based number among the manifest's core phases, rendered as "Phase n · Title".
   * Omitted for extension phases, which show the title alone.
   */
  phaseNumber?: number;
  /** The 1-based path position of the phase's first course — positions continue across phases. */
  startPosition: number;
  /** courseId -> title, covering every ID in the phase (falls back to the ID itself). */
  courseTitles: Readonly<Record<string, string>>;
  /** Locale-independent outline course IDs — an `OutlineBadge` renders on those rows only. */
  outlineCourseIds: readonly string[];
  /** The course ID currently being read — marked `aria-current="page"` in its row. */
  currentCourseId: string;
  /** Attached to the current course's `<li>` so the rail can auto-scroll it into view. */
  currentRowRef?: Ref<HTMLLIElement>;
}

export interface RailCourseRowProps {
  locale: string;
  pathId: string;
  courseId: string;
  title: string;
  /** The course's 1-based path position (plan 01's numbering). */
  position: number;
  isCurrent: boolean;
  showOutlineBadge: boolean;
  /** Attached to the `<li>` when this is the current row (auto-scroll target). */
  rowRef?: Ref<HTMLLIElement>;
}

/**
 * One course row of the path rail — the single row definition the grouped phases and (until
 * plan 07 removes it) the marked-skills flat list both render, so the two branches cannot drift
 * apart (Finding 2 of the check6 audit).
 */
export function RailCourseRow({
  locale,
  pathId,
  courseId,
  title,
  position,
  isCurrent,
  showOutlineBadge,
  rowRef,
}: RailCourseRowProps) {
  return (
    <li key={courseId} className="flex items-center gap-1" ref={rowRef}>
      {/* Position number (plan ayokoding-learn-revamp-01 §4.2): outside the link, so the
          link's aria-label stays exactly the title, and the number stays visible on the
          current row too (Decision D4). */}
      <PathPositionNumber position={position} />
      <Link
        href={contentUrl(locale as Locale, slugForCourseId(courseId), pathId)}
        aria-label={title}
        aria-current={isCurrent ? "page" : undefined}
        className={cn(
          COURSE_LINK_BASE,
          // `bg-accent` (DWT-005 fix, phase-5 rule-15 design-tester retest): prd.md's own
          // Screen 3 hi-fi spec for this exact row states "Current row: aria-current="page"
          // plus a ▸ marker plus font-semibold plus bg-accent — never hue alone".
          isCurrent ? "bg-accent font-semibold text-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        {isCurrent && <span aria-hidden="true">▸</span>}
        <span className="truncate">{title}</span>
      </Link>
      {showOutlineBadge && <OutlineBadge locale={locale} />}
    </li>
  );
}

/**
 * One phase's group inside the path rail (plan ayokoding-learn-revamp-02-path-model, Phase 4,
 * FR-5) — a small uppercase phase label ("Phase n · Title" for core, the title for extensions)
 * over that phase's ordered rows, each with its path position number, `OutlineBadge` where
 * needed, and the current-row marker. The "Course k of N" readout and footer links stay in
 * `path-rail.tsx`; the "Optional extensions" divider renders there before the first extension
 * group.
 *
 * Pure — no IO (the ref is attached, never read, here). Used for both the desktop rail and the
 * drawer, since the drawer renders `PathRail`.
 */
export function PhaseGroup({
  locale,
  pathId,
  phase,
  phaseNumber,
  startPosition,
  courseTitles,
  outlineCourseIds,
  currentCourseId,
  currentRowRef,
}: PhaseGroupProps) {
  return (
    <div>
      <p className="px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {phaseNumber !== undefined
          ? `${t(locale as Locale, "pathsPhaseLabel")} ${phaseNumber} · ${phase.title}`
          : phase.title}
      </p>
      <ol className="flex flex-col gap-1">
        {phase.courses.map((ref, index) => {
          const courseId = normalizeCourseRef(ref).id;

          return (
            <RailCourseRow
              key={courseId}
              locale={locale}
              pathId={pathId}
              courseId={courseId}
              title={courseTitles[courseId] ?? courseId}
              position={startPosition + index}
              isCurrent={courseId === currentCourseId}
              showOutlineBadge={outlineCourseIds.includes(courseId)}
              rowRef={courseId === currentCourseId ? currentRowRef : undefined}
            />
          );
        })}
      </ol>
    </div>
  );
}
