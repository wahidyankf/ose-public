import Link from "next/link";
import type { ContentMeta } from "@/features/content/core/types";
import { contentUrl } from "@/features/content/core/content-url";
import {
  buildArcTitleIndex,
  buildCourseTitleIndex,
  COURSE_CATALOG_SLUG,
  humanizeKebabSlug,
} from "@/features/course-paths/shell/course-path-nav";
import { EmptyPathListState } from "@/features/course-paths/shell/empty-path-list-state";
import { buildPathCardCourseData, LearnPathCard } from "@/features/course-paths/shell/learn-path-card";
import {
  groupCareersManifestsByArc,
  LEARN_PATHS_PREFIX,
  skillsManifests,
} from "@/features/course-paths/shell/paths-route";
import type { PathManifest } from "@/features/course-paths/core/schemas";
import type { Locale } from "@/features/i18n/core/config";
import { tf } from "@/features/i18n/core/fill";
import { t } from "@/features/i18n/core/translations";
import type { SequenceIndex } from "../core/progress-derivations";
import { ContinueLearningCard } from "./continue-learning-card";
import { ResetProgressControl } from "./reset-progress-control";

/** The element the Continue card's "Choose a path" link lands on. */
const CAREER_PATHS_ANCHOR = "career-paths";

export interface LearnHomeProps {
  locale: string;
  /** `content/en/learn/_index.md`'s title — the page's `h1`. */
  title: string;
  /** `content/en/learn/_index.md`'s description — the intro that folds in the old Overview text. */
  description: string;
  manifests: readonly PathManifest[];
  /** The locale's content index, for course and arc titles. */
  contentMap: ReadonlyMap<string, ContentMeta>;
  /** Every course's lesson page paths (`loadLessonPagePaths`). */
  sequences: SequenceIndex;
  /** How many courses and categories the catalog holds, for the browse card's summary line. */
  catalogCounts: { courses: number; categories: number };
}

/**
 * The Learn home (plan ayokoding-learn-revamp-04, Phase 6, Screen 3 option A; decision 38d).
 *
 * A landing page, not a list of courses: the intro, the Continue/Start card, career path cards
 * grouped by arc, skill path cards, the way into the full catalog, and the browser-only note with
 * the guarded reset. No individual course page is linked from here — the catalog is where a reader
 * picks single courses (S27). Server-rendered; only the card and the progress lines are client
 * slots. Pure except for those slots; no IO.
 */
export function LearnHome({
  locale,
  title,
  description,
  manifests,
  contentMap,
  sequences,
  catalogCounts,
}: LearnHomeProps) {
  const loc = locale as Locale;
  const courseTitles = buildCourseTitleIndex(contentMap, locale, manifests);
  const careerGroups = groupCareersManifestsByArc(manifests);
  const skillPaths = skillsManifests(manifests);
  const arcTitles = buildArcTitleIndex(
    contentMap,
    locale,
    careerGroups.map(({ arc }) => arc),
  );
  const courseCards = buildPathCardCourseData(contentMap, locale, manifests, courseTitles);

  return (
    <section className="mx-auto max-w-6xl flex-1 px-6 py-8 lg:px-8">
      <h1 className="text-4xl font-extrabold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">{description}</p>

      <ContinueLearningCard locale={locale} manifests={manifests} courseTitles={courseTitles} sequences={sequences} />

      <section id={CAREER_PATHS_ANCHOR} aria-labelledby={`${CAREER_PATHS_ANCHOR}-heading`} className="mt-8">
        <h2 id={`${CAREER_PATHS_ANCHOR}-heading`} className="text-2xl font-bold tracking-tight">
          {t(loc, "homeCareerPaths")}
        </h2>
        {careerGroups.length === 0 ? (
          <EmptyPathListState
            fallbackHref={contentUrl(loc, `${LEARN_PATHS_PREFIX}/skills`)}
            fallbackLabel={t(loc, "homeSkillPaths")}
          />
        ) : (
          careerGroups.map(({ arc, manifests: arcManifests }) => (
            <div key={arc} className="mt-4">
              <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                <Link
                  href={contentUrl(loc, `${LEARN_PATHS_PREFIX}/careers/${arc}`)}
                  className="hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {arcTitles[arc] ?? humanizeKebabSlug(arc)}
                </Link>
              </h3>
              <ul className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
                {arcManifests.map((manifest) => (
                  <li key={manifest.pathId}>
                    <LearnPathCard
                      locale={locale}
                      manifest={manifest}
                      courseTitles={courseTitles}
                      courseCards={courseCards}
                      sequences={sequences}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>

      <section aria-labelledby="skill-paths-heading" className="mt-8">
        <h2 id="skill-paths-heading" className="text-2xl font-bold tracking-tight">
          {t(loc, "homeSkillPaths")}
        </h2>
        {skillPaths.length === 0 ? (
          <EmptyPathListState
            fallbackHref={contentUrl(loc, `${LEARN_PATHS_PREFIX}/careers`)}
            fallbackLabel={t(loc, "homeCareerPaths")}
          />
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {skillPaths.map((manifest) => (
              <li key={manifest.pathId}>
                <LearnPathCard
                  locale={locale}
                  manifest={manifest}
                  courseTitles={courseTitles}
                  courseCards={courseCards}
                  sequences={sequences}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link
        href={contentUrl(loc, COURSE_CATALOG_SLUG)}
        className="mt-8 flex min-h-11 flex-wrap items-center gap-2 rounded-xl border border-border px-4 py-3 font-medium hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <span>{t(loc, "homeBrowseAll")}</span>
        <span aria-hidden="true">·</span>
        <span className="text-sm font-normal text-muted-foreground">
          {tf(loc, "catalogSummary", { courses: catalogCounts.courses, categories: catalogCounts.categories })}
        </span>
        <span aria-hidden="true">→</span>
      </Link>

      <div data-progress-slot="reset-footer" className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">{t(loc, "homePrivacyNote")}</p>
        <ResetProgressControl locale={locale} />
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {t(loc, "homeLegacyPrompt")}{" "}
        <Link
          href={contentUrl(loc, "learn/legacy")}
          className="font-medium text-primary underline underline-offset-2 hover:text-foreground"
        >
          Legacy
        </Link>
      </p>
    </section>
  );
}
