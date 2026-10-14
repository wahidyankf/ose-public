import type { PathPhase } from "../core/schemas";
import type { Locale } from "@/features/i18n/core/config";
import { t } from "@/features/i18n/core/translations";
import { formatTemplate } from "./format-template";
import { PhaseProgress } from "./phase-progress";
import { RoadmapCourseCard, type RoadmapCourseData } from "./roadmap-course-card";
import { normalizeCourseRef } from "../core/manifest";
import type { SequenceIndex } from "@/features/learning-progress/core/progress-derivations";

export interface RoadmapPhaseProps {
  locale: string;
  /** The owning manifest's path ID — every card link carries it as `?path=`. */
  pathId: string;
  phase: PathPhase;
  /**
   * The 1-based number among the manifest's core phases, rendered as "Phase n · Title". Omitted
   * for extension phases, whose `<summary>` shows the title alone.
   */
  phaseNumber?: number;
  /** The 1-based path position of the phase's first course — positions continue across phases. */
  startPosition: number;
  courseCards: Record<string, RoadmapCourseData>;
  sequences: SequenceIndex;
  /** False in the pending-restructure flat list (see `RoadmapCourseCard`). */
  showCardMeta?: boolean;
}

/**
 * One milestone of the roadmap (plan ayokoding-learn-revamp-04, Phase 4, Screen 1 option A).
 *
 * A **core** phase is a `<section aria-labelledby>` with a stable `id="phase-<phase id>"` anchor
 * (the lesson context bar links to it), an `h3` reading "Phase n · title", its outcome lines, its
 * own progress, and its course cards. An **extension** phase is a `<details>` closed by default
 * whose `<summary>` carries the title, the course count, and the same progress; its cards live
 * inside, so opening the section reveals them (S23). Pure except for the progress slot; no IO.
 */
export function RoadmapPhase({
  locale,
  pathId,
  phase,
  phaseNumber,
  startPosition,
  courseCards,
  sequences,
  showCardMeta = true,
}: RoadmapPhaseProps) {
  const courseCount = phase.courses.length;
  // UWT-001: the count is interface chrome, so it localizes (Indonesian has no plural change:
  // "1 kursus" / "{count} kursus"); course data itself stays English per series decision 35.
  const countText =
    courseCount === 1
      ? t(locale as Locale, "pathsCourseCountOne")
      : formatTemplate(t(locale as Locale, "pathsCourseCountOther"), { count: courseCount });

  const cards = phase.courses.map((reference, index) => {
    const courseId = normalizeCourseRef(reference).id;

    return (
      <RoadmapCourseCard
        key={courseId}
        locale={locale}
        pathId={pathId}
        position={startPosition + index}
        courseId={courseId}
        data={courseCards[courseId] ?? { title: courseId, isOutline: false }}
        sequence={sequences[courseId] ?? []}
        showMeta={showCardMeta}
      />
    );
  });

  if (phase.kind === "extension") {
    return (
      <details className="mt-4 rounded-lg border border-border px-3 py-2">
        <summary className="flex cursor-pointer flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="text-base font-semibold tracking-tight">{phase.title}</h3>
          <span className="text-sm font-normal text-muted-foreground">({countText})</span>
          <PhaseProgress locale={locale} phase={phase} sequences={sequences} />
        </summary>
        <ol className="mt-3 space-y-2">{cards}</ol>
      </details>
    );
  }

  const headingId = `phase-${phase.id}-heading`;

  return (
    <section id={`phase-${phase.id}`} aria-labelledby={headingId} className="mt-6">
      <h3 id={headingId} className="text-lg font-bold tracking-tight">
        {phaseNumber === undefined
          ? phase.title
          : `${t(locale as Locale, "pathsPhaseLabel")} ${phaseNumber} · ${phase.title}`}
      </h3>
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
      <PhaseProgress locale={locale} phase={phase} sequences={sequences} />
      <ol className="mt-3 space-y-2">{cards}</ol>
    </section>
  );
}
