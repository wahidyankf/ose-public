import type { CSSProperties } from "react";
import Link from "next/link";
import { contentUrl } from "@/features/content/core/content-url";
import type { Locale } from "@/features/i18n/core/config";
import { t } from "@/features/i18n/core/translations";
import { MarkdownRenderer } from "@/features/content/shell/markdown-renderer";
import type { PathManifest } from "../core/schemas";
import { hueCssVars, hueForManifest } from "../core/path-hue";
import { corePhases, extensionPhases } from "../core/path-phases";
import { isPendingSkillsRestructure } from "../core/skills-restructure-allowlist";
import { manifestCourseOrder, slugForCourseId } from "./course-path-nav";
import { AssumedCourses } from "./assumed-courses";
import { PhaseSection } from "./phase-section";
import { PathPositionNumber } from "./path-position-number";

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
}

/**
 * Path landing (Cycles 3.1/3.1d, Screen 2; plan 02 Phase 4, FR-4/FR-7) — a manifest rendered as
 * phase sections: the "Before you start" note when `assumes` is non-empty, a "Core" label with
 * one `PhaseSection` per core phase, then an "Optional extensions" heading with one
 * `PhaseSection` per extension phase. Position numbers continue across phases (plan 01's
 * numbering, rendered per row by the shared `PathPositionNumber` inside `PhaseSection`);
 * every course link carries `?path=`. For a `skills/` path, `bodyHtml` (the shipped
 * `content.getBySlug` procedure's `html` for this path's own `_index.md`) renders via the
 * shipped `MarkdownRenderer` between the title/arc-summary and the syllabus — the rendering
 * surface for the ramp can/cannot table, runway-justification paragraph, and
 * linked-prerequisite outbound links. A careers path's `_index.md` supplies no body, so
 * `bodyHtml` is omitted and this slot is a silent no-op.
 */
export function PathLanding({
  locale,
  manifest,
  courseTitles,
  bodyHtml,
  outlineCourseIds = [],
  assumedCourseTitles = {},
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

  // Phase sections with continuous position numbers (plan 02, Phase 4, FR-4): core phases first
  // (each numbered among the core), then the "Optional extensions" heading with the extension
  // phases. `startPosition` accumulates in manifest order so course numbers never restart at a
  // phase boundary.
  const cores = corePhases(manifest);
  const extensions = extensionPhases(manifest);
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
    <div className="mx-auto max-w-3xl flex-1 px-6 py-8 lg:px-8">
      <div aria-hidden="true" style={barStyle} className={barClassName} />
      <h1 className="text-4xl font-extrabold tracking-tight">{manifest.title}</h1>
      <p className="mt-2 text-muted-foreground">{manifest.description}</p>

      {bodyHtml && <MarkdownRenderer html={bodyHtml} locale={locale} />}

      <nav aria-label={`${manifest.title} syllabus`}>
        <section>
          <h2 className="mt-8 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            {t(locale as Locale, "pathsSyllabus")}
          </h2>
          {/* // Decision 39: removed by plan 07 — a marked skills path keeps today's flat ordered
              list with plan 01's position numbers and no phase chrome. */}
          {isPendingSkillsRestructure(manifest) ? (
            <ol className="mt-3 space-y-1">
              {manifestCourseOrder(manifest).map((course, index) => {
                const title = courseTitles[course.id] ?? course.id;

                return (
                  <li key={course.id} className="flex items-baseline gap-2">
                    {/* Position number (plan ayokoding-learn-revamp-01 §4.2): outside the link, so
                        the link's accessible name stays exactly the title (WCAG 2.5.3). */}
                    <PathPositionNumber position={index + 1} />
                    <Link
                      href={contentUrl(locale as Locale, slugForCourseId(course.id), manifest.pathId)}
                      className="rounded-md px-2 py-1 text-sm text-primary underline underline-offset-2 hover:bg-accent hover:text-foreground"
                    >
                      {title}
                    </Link>
                  </li>
                );
              })}
            </ol>
          ) : (
            <>
              {manifest.assumes.length > 0 && (
                <AssumedCourses locale={locale} assumes={manifest.assumes} courseTitles={assumedCourseTitles} />
              )}
              {cores.length > 0 && (
                <p className="mt-8 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                  {t(locale as Locale, "pathsCoreLabel")}
                </p>
              )}
              {coreSections.map(({ phase, phaseNumber, startPosition }) => (
                <PhaseSection
                  key={phase.id}
                  locale={locale}
                  pathId={manifest.pathId}
                  phase={phase}
                  phaseNumber={phaseNumber}
                  startPosition={startPosition}
                  courseTitles={courseTitles}
                  outlineCourseIds={outlineCourseIds}
                />
              ))}
              {extensions.length > 0 && (
                <>
                  <h2 className="mt-8 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                    {t(locale as Locale, "pathsOptionalExtensions")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t(locale as Locale, "pathsExtensionsNote")}</p>
                </>
              )}
              {extensionSections.map(({ phase, startPosition }) => (
                <PhaseSection
                  key={phase.id}
                  locale={locale}
                  pathId={manifest.pathId}
                  phase={phase}
                  startPosition={startPosition}
                  courseTitles={courseTitles}
                  outlineCourseIds={outlineCourseIds}
                />
              ))}
            </>
          )}
        </section>
      </nav>
    </div>
  );
}
