import type { Locale } from "@/features/i18n/core/config";
import { tf } from "@/features/i18n/core/fill";
import { t } from "@/features/i18n/core/translations";
import { MarkdownRenderer } from "@/features/content/shell/markdown-renderer";
import type { SequenceIndex } from "@/features/learning-progress/core/progress-derivations";
import { normalizeCourseRef } from "../core/manifest";
import { corePhases, extensionPhases } from "../core/path-phases";
import type { PathManifest } from "../core/schemas";
import { isPendingSkillsRestructure } from "../core/skills-restructure-allowlist";
import { RoadmapCourseCard, type RoadmapCourseData } from "./roadmap-course-card";
import { RoadmapPhase } from "./roadmap-phase";
import { RoadmapProgressCard } from "./roadmap-progress-card";

export interface PathRoadmapProps {
  locale: string;
  manifest: PathManifest;
  /** Per-course metadata (title, format, hours, outline), built on the server for every course. */
  courseCards: Record<string, RoadmapCourseData>;
  /** Every course's lesson page paths (`loadLessonPagePaths`), so progress counts real pages. */
  sequences: SequenceIndex;
  /** The path's own `_index.md` body, when one resolves — absent for a careers path. */
  bodyHtml?: string | null;
}

export interface RoadmapHours {
  /** The total `estimatedHours` of the counted courses that declare one (tech-docs/004 Path Hours). */
  hours: number;
  /** How many counted courses declare none (an outline course never does). */
  withoutEstimate: number;
}

/**
 * Path Hours (tech-docs/004): sum `estimatedHours` over the counted courses, and count those that
 * declare none so the caller can append `roadmapHoursPlusOutline`. Pure — no IO, never throws.
 */
export function roadmapHours(
  courseIds: readonly string[],
  courseCards: Record<string, RoadmapCourseData>,
): RoadmapHours {
  let hours = 0;
  let withoutEstimate = 0;

  for (const courseId of courseIds) {
    const estimatedHours = courseCards[courseId]?.estimatedHours;
    if (estimatedHours === undefined) {
      withoutEstimate += 1;
    } else {
      hours += estimatedHours;
    }
  }

  return { hours, withoutEstimate };
}

/**
 * The path roadmap (plan ayokoding-learn-revamp-04, Phase 4, Screen 1 option A) — the progress
 * card, then the core journey as one milestone per phase with its outcome and progress, then the
 * optional extensions as closed sections (S19, S23, S24, S25).
 *
 * Keeps plan 02's `<nav aria-label="… syllabus">` wrapper name, so every existing syllabus
 * scenario keeps finding the same landmark. The progress card renders immediately BEFORE that
 * nav, not inside it: a Start/Continue CTA is not syllabus navigation, and counting it as a nav
 * link inflated the syllabus link count. DOM order, margins, and tab order are unchanged, so the
 * card sits in exactly the same visual position as before. A pending-restructure skills path
 * renders one flat course list instead — today's order, plan 01's numbering, plan 02's copy, no
 * phase heading, outcome, or extensions block (S26). Pure except for its client progress slots;
 * no IO.
 */
export function PathRoadmap({ locale, manifest, courseCards, sequences, bodyHtml }: PathRoadmapProps) {
  const loc = locale as Locale;
  const flat = isPendingSkillsRestructure(manifest);
  const cores = corePhases(manifest);
  const extensions = extensionPhases(manifest);
  const allCourseIds = manifest.courseOrder.map((reference) => normalizeCourseRef(reference).id);
  const coreCourseIds = cores.flatMap((phase) => phase.courses.map((reference) => normalizeCourseRef(reference).id));
  const { hours, withoutEstimate } = roadmapHours(flat ? allCourseIds : coreCourseIds, courseCards);
  const hoursText =
    hours > 0
      ? `${tf(loc, "courseEstimatedHours", { hours })}${
          withoutEstimate > 0 ? ` · ${tf(loc, "roadmapHoursPlusOutline", { count: withoutEstimate })}` : ""
        }`
      : "";

  // Position numbers accumulate in manifest order, so course numbers never restart at a phase
  // boundary (plan 01's numbering, continued across the core and the extensions).
  let nextPosition = 1;
  const coreSections = cores.map((phase, index) => {
    const section = { phase, phaseNumber: index + 1, startPosition: nextPosition };
    nextPosition += phase.courses.length;
    return section;
  });
  const extensionSections = extensions.map((phase) => {
    const section = { phase, startPosition: nextPosition };
    nextPosition += phase.courses.length;
    return section;
  });

  return (
    <div>
      {bodyHtml ? <MarkdownRenderer html={bodyHtml} locale={locale} /> : null}

      <RoadmapProgressCard locale={locale} manifest={manifest} courseCards={courseCards} sequences={sequences} />

      <nav aria-label={`${manifest.title} syllabus`}>
        {flat ? (
          <>
            <p className="mt-8 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              {tf(loc, "roadmapCoursesCount", { count: allCourseIds.length })}
            </p>
            <ol className="mt-3 space-y-2">
              {allCourseIds.map((courseId, index) => (
                <RoadmapCourseCard
                  key={courseId}
                  locale={locale}
                  pathId={manifest.pathId}
                  position={index + 1}
                  courseId={courseId}
                  data={courseCards[courseId] ?? { title: courseId, isOutline: false }}
                  sequence={sequences[courseId] ?? []}
                  showMeta={false}
                />
              ))}
            </ol>
          </>
        ) : (
          <>
            {cores.length > 0 && (
              <h2 className="mt-8 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                {/* UWT-012: "Core path · 1 phase", never "1 phases". */}
                {cores.length === 1
                  ? t(loc, "roadmapCoreHeadingOne")
                  : tf(loc, "roadmapCoreHeading", { count: cores.length })}
                {hoursText === "" ? null : ` · ${hoursText}`}
              </h2>
            )}
            {/*
             * DWT-001: the milestone timeline (Screen 1 option A). One continuous spine at the
             * left edge at every width (PRD Responsive Strategy); each core `RoadmapPhase`
             * section draws its own node centred on this x in its left gutter. Extension
             * phases stay outside the timeline: closed rows, not milestones.
             */}
            <div data-timeline="roadmap-core" className="relative">
              <span aria-hidden="true" data-timeline-spine className="absolute top-2 bottom-2 left-3 w-px bg-border" />
              {coreSections.map(({ phase, phaseNumber, startPosition }) => (
                <RoadmapPhase
                  key={phase.id}
                  locale={locale}
                  pathId={manifest.pathId}
                  phase={phase}
                  phaseNumber={phaseNumber}
                  startPosition={startPosition}
                  courseCards={courseCards}
                  sequences={sequences}
                />
              ))}
            </div>
            {extensions.length > 0 && (
              <>
                <h2 className="mt-8 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                  {t(loc, "pathsOptionalExtensions")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t(loc, "pathsExtensionsNote")}</p>
              </>
            )}
            {extensionSections.map(({ phase, startPosition }) => (
              <RoadmapPhase
                key={phase.id}
                locale={locale}
                pathId={manifest.pathId}
                phase={phase}
                startPosition={startPosition}
                courseCards={courseCards}
                sequences={sequences}
              />
            ))}
          </>
        )}
      </nav>
    </div>
  );
}
