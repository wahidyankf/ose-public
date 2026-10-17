import type { CSSProperties } from "react";
import type { SequenceIndex } from "@/features/learning-progress/core/progress-derivations";
import type { PathManifest } from "../core/schemas";
import { hueCssVars, hueForManifest } from "../core/path-hue";
import { normalizeCourseRef } from "../core/manifest";
import { isPendingSkillsRestructure } from "../core/skills-restructure-allowlist";
import { AssumedCourses } from "./assumed-courses";
import { PathRoadmap } from "./path-roadmap";
import type { RoadmapCourseData } from "./roadmap-course-card";

export interface PathLandingProps {
  locale: string;
  manifest: PathManifest;
  /** courseId -> title, covering every ID in `manifest.courseOrder` (falls back to the ID itself). */
  courseTitles: Readonly<Record<string, string>>;
  /**
   * The path's own `_index.md` markdown body (Cycle 3.1d), when one resolves — `undefined`/`null`
   * for a careers path (which supplies no body) is a silent no-op, not a rendering error.
   */
  bodyHtml?: string | null;
  /** Locale-independent outline course IDs — an `OutlineBadge` renders on those rows only. */
  outlineCourseIds?: readonly string[];
  /**
   * Assumed-course titles by course ID. `assumes` IDs sit outside the manifest's `courseOrder`,
   * so `courseTitles` never covers them — the route resolves these from the content map instead.
   */
  assumedCourseTitles?: Readonly<Record<string, string>>;
  /**
   * Per-course roadmap metadata (title, format, hours, outline), built on the server from the
   * content index. Optional: without it each card falls back to its title and outline flag, which
   * is what a caller that has only titles (a unit test, a synthetic render) still gets.
   */
  courseCards?: Record<string, RoadmapCourseData>;
  /**
   * Every course's lesson page paths (`loadLessonPagePaths`). Optional for the same reason —
   * without it the roadmap renders, but every course counts as having no pages yet.
   */
  sequences?: SequenceIndex;
}

/**
 * Path landing (Cycles 3.1/3.1d, Screen 2; plan 02 Phase 4, FR-4/FR-7; plan 04 Phase 4) — the
 * path's own chrome (hue bar, `h1`, description, markdown body, and the "Before you start" note for
 * a path that assumes courses) around plan 04's `PathRoadmap`, which renders the progress card
 * before — never inside — the `<nav aria-label="… syllabus">` wrapper every syllabus scenario
 * looks for, then the core milestones with their outcomes and progress, and the closed optional
 * extensions inside that nav.
 *
 * The "Before you start" note stays outside that nav: an assumed course is background, not a member
 * of the path, so it is never a roadmap row. A pending-restructure skills path skips the note (its
 * `assumes` is empty by the marked shape) and renders the Roadmap's flat course list unchanged.
 */
export function PathLanding({
  locale,
  manifest,
  courseTitles,
  bodyHtml,
  outlineCourseIds = [],
  assumedCourseTitles = {},
  courseCards,
  sequences = {},
}: PathLandingProps) {
  // DWT-001 fix (phase-5 rule-15 design-tester retest): prd.md's own Screen 2 hi-fi spec calls for
  // this bar to be framed by a hue-wash strip colour matching the path's hub card — the shipped
  // bar was hardcoded to a single, non-varying `--hue-honey` (the vivid base variant, not the
  // documented wash variant) for every path regardless of its actual arc/subject. `hue` is
  // `undefined` for any arc/subject not yet named in the DD-50 map, in which case the bar falls
  // back to the plain neutral `--color-border` token — never a guessed hue.
  const hue = hueForManifest(manifest);
  const barStyle = hue ? (hueCssVars(hue) as CSSProperties) : undefined;
  const barClassName = hue
    ? "mb-4 h-1.5 w-16 rounded-full bg-[var(--hue-current-wash)]"
    : "mb-4 h-1.5 w-16 rounded-full bg-border";

  // Every course the roadmap can show, so a caller that passes no server-built cards still renders
  // each card with its title and its outline flag.
  const cards: Record<string, RoadmapCourseData> = {};
  for (const reference of manifest.courseOrder) {
    const courseId = normalizeCourseRef(reference).id;
    cards[courseId] = courseCards?.[courseId] ?? {
      title: courseTitles[courseId] ?? courseId,
      isOutline: outlineCourseIds.includes(courseId),
    };
  }

  return (
    <div className="mx-auto max-w-3xl flex-1 px-6 py-8 lg:px-8">
      <div aria-hidden="true" style={barStyle} className={barClassName} />
      <h1 className="text-4xl font-extrabold tracking-tight">{manifest.title}</h1>
      <p className="mt-2 text-muted-foreground">{manifest.description}</p>

      {/* // Decision 39: a marked skills path keeps today's flat ordered list with plan 01's
          position numbers and no phase chrome, so it never carries the note either. */}
      {!isPendingSkillsRestructure(manifest) && manifest.assumes.length > 0 && (
        <AssumedCourses locale={locale} assumes={manifest.assumes} courseTitles={assumedCourseTitles} />
      )}

      <PathRoadmap locale={locale} manifest={manifest} courseCards={cards} sequences={sequences} bodyHtml={bodyHtml} />
    </div>
  );
}
