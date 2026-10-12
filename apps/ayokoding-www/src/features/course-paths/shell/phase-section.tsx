import Link from "next/link";
import { contentUrl } from "@/features/content/core/content-url";
import type { Locale } from "@/features/i18n/core/config";
import { t } from "@/features/i18n/core/translations";
import { normalizeCourseRef } from "../core/manifest";
import type { PathPhase } from "../core/schemas";
import { slugForCourseId } from "./course-path-nav";
import { OutlineBadge } from "./outline-badge";
import { PathPositionNumber } from "./path-position-number";

export interface PhaseSectionProps {
  locale: string;
  /** The owning manifest's path ID — every course link carries it as `?path=`. */
  pathId: string;
  phase: PathPhase;
  /**
   * The 1-based number among the manifest's core phases, rendered as the "Phase n" badge.
   * Omitted for extension phases, which show the title with no number.
   */
  phaseNumber?: number;
  /** The 1-based path position of the phase's first course — positions continue across phases. */
  startPosition: number;
  /** courseId -> title, covering every ID in the phase (falls back to the ID itself). */
  courseTitles: Readonly<Record<string, string>>;
  /** Locale-independent outline course IDs — an `OutlineBadge` renders on those rows only. */
  outlineCourseIds: readonly string[];
}

/**
 * One phase of a path landing's syllabus (plan ayokoding-learn-revamp-02-path-model, Phase 4,
 * FR-4) — an `h2` with the "Phase n" badge (core only), the phase title, and the course count;
 * the outcome lines for core phases; and an `<ol>` of course links with `OutlineBadge` where
 * needed.
 *
 * Pure — no IO. Position numbers render through plan 01's shared `PathPositionNumber` (outside
 * each link, so the link's accessible name stays exactly the title); the parent computes
 * `startPosition` so numbers continue across the phase boundary.
 */
export function PhaseSection({
  locale,
  pathId,
  phase,
  phaseNumber,
  startPosition,
  courseTitles,
  outlineCourseIds,
}: PhaseSectionProps) {
  const courseCount = phase.courses.length;

  return (
    <section>
      <h2 className="mt-8 text-lg font-bold tracking-tight">
        {phaseNumber !== undefined && (
          <span className="mr-2 rounded-full bg-secondary px-2 py-0.5 align-middle text-xs font-semibold text-secondary-foreground uppercase">
            {t(locale as Locale, "pathsPhaseLabel")} {phaseNumber}
          </span>
        )}
        {phase.title}{" "}
        <span className="text-sm font-normal text-muted-foreground">
          ({courseCount} {courseCount === 1 ? "course" : "courses"})
        </span>
      </h2>
      {phase.outcome && (
        <p className="mt-1 text-sm text-muted-foreground">
          {t(locale as Locale, "pathsAfterPhaseCan")} {phase.outcome.can}
        </p>
      )}
      {phase.outcome?.cannotYet && (
        <p className="mt-1 text-sm text-muted-foreground">
          {t(locale as Locale, "pathsCannotYet")} {phase.outcome.cannotYet}
        </p>
      )}
      <ol className="mt-3 space-y-1">
        {phase.courses.map((ref, index) => {
          const courseId = normalizeCourseRef(ref).id;
          const title = courseTitles[courseId] ?? courseId;

          return (
            <li key={courseId} className="flex items-baseline gap-2">
              {/* Position number (plan ayokoding-learn-revamp-01 §4.2): outside the link, so
                  the link's accessible name stays exactly the title (WCAG 2.5.3). */}
              <PathPositionNumber position={startPosition + index} />
              <Link
                href={contentUrl(locale as Locale, slugForCourseId(courseId), pathId)}
                className="rounded-md px-2 py-1 text-sm text-primary underline underline-offset-2 hover:bg-accent hover:text-foreground"
              >
                {title}
              </Link>
              {outlineCourseIds.includes(courseId) && <OutlineBadge locale={locale} />}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
