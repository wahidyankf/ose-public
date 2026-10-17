import { contentUrl } from "@/features/content/core/content-url";
import type { Locale } from "@/features/i18n/core/config";
import type { ContentMeta } from "@/features/content/core/types";
import type { SequenceIndex } from "@/features/learning-progress/core/progress-derivations";
import type { PathManifest } from "../core/schemas";
import { CareersArcSections, type CareersArcSection } from "./careers-arc-sections";
import { buildPathCardCourseData, LearnPathCard } from "./learn-path-card";
import { EmptyPathListState } from "./empty-path-list-state";
import { RampMilestoneStrip } from "./ramp-milestone-strip";
import { groupCareersManifestsByArc, skillsManifests, LEARN_PATHS_PREFIX } from "./paths-route";
import { buildArcTitleIndex, buildCourseTitleIndex, humanizeKebabSlug } from "./course-path-nav";

export type PathCategory = "careers" | "skills";

export interface CategoryLandingProps {
  locale: string;
  category: PathCategory;
  manifests: readonly PathManifest[];
  /**
   * The loaded content index's `contentMap` — resolves each arc's humanized title from its own
   * `_index.md` (UWT-001 fix, phase-5 rule-15 retest), rather than rendering the raw arc slug, and
   * supplies each card's course titles, formats, and hours. Optional/defaulted to an empty map so
   * existing callers/tests unaware of it still render (via `buildArcTitleIndex`'s own
   * humanized-slug fallback), just without real authored copy.
   */
  contentMap?: ReadonlyMap<string, ContentMeta>;
  /**
   * Every course's lesson page paths (`loadLessonPagePaths`), so each path card states real
   * progress (plan 04 Phase 7, S32). Optional/defaulted to an empty index.
   */
  sequences?: SequenceIndex;
}

/**
 * Category landing (Cycle 3.1b-i/3.1b-ii, R7; plan 04 Phase 7) — `/en/learn/paths/careers/` and
 * `/en/learn/paths/skills/`. **Two distinct instances, not one template with swapped data (R8)**:
 * the careers instance renders `CareersArcSections` — one section per arc, its heading linking to
 * the arc page, then that arc's `LearnPathCard`s — while the skills instance renders the same
 * `LearnPathCard` grid with a `RampMilestoneStrip` per card and states the fixed-arc ramp promise
 * once, with no chooser markup present at all (decision 39).
 */
export function CategoryLanding({
  locale,
  category,
  manifests,
  contentMap = new Map(),
  sequences = {},
}: CategoryLandingProps) {
  if (category === "careers") {
    return (
      <CareersCategoryLanding locale={locale} manifests={manifests} contentMap={contentMap} sequences={sequences} />
    );
  }

  return <SkillsCategoryLanding locale={locale} manifests={manifests} contentMap={contentMap} sequences={sequences} />;
}

function CareersCategoryLanding({
  locale,
  manifests,
  contentMap,
  sequences,
}: {
  locale: string;
  manifests: readonly PathManifest[];
  contentMap: ReadonlyMap<string, ContentMeta>;
  sequences: SequenceIndex;
}) {
  const arcGroups = groupCareersManifestsByArc(manifests);

  if (arcGroups.length === 0) {
    return (
      <EmptyPathListState
        fallbackHref={contentUrl(locale as Locale, `${LEARN_PATHS_PREFIX}/skills`)}
        fallbackLabel="Skills"
      />
    );
  }

  const arcTitles = buildArcTitleIndex(
    contentMap,
    locale,
    arcGroups.map(({ arc }) => arc),
  );
  const courseTitles = buildCourseTitleIndex(contentMap, locale, manifests);
  const courseCards = buildPathCardCourseData(contentMap, locale, manifests, courseTitles);
  const sections: CareersArcSection[] = arcGroups.map(({ arc, manifests: arcManifests }) => ({
    arc,
    arcTitle: arcTitles[arc] ?? humanizeKebabSlug(arc),
    manifests: arcManifests,
  }));

  return (
    <CareersArcSections
      locale={locale}
      sections={sections}
      courseTitles={courseTitles}
      courseCards={courseCards}
      sequences={sequences}
    />
  );
}

function SkillsCategoryLanding({
  locale,
  manifests,
  contentMap,
  sequences,
}: {
  locale: string;
  manifests: readonly PathManifest[];
  contentMap: ReadonlyMap<string, ContentMeta>;
  sequences: SequenceIndex;
}) {
  const skills = skillsManifests(manifests);

  if (skills.length === 0) {
    return (
      <EmptyPathListState
        fallbackHref={contentUrl(locale as Locale, `${LEARN_PATHS_PREFIX}/careers`)}
        fallbackLabel="Careers"
      />
    );
  }

  const courseTitles = buildCourseTitleIndex(contentMap, locale, manifests);
  const courseCards = buildPathCardCourseData(contentMap, locale, manifests, courseTitles);

  return (
    <>
      <p className="mt-2 text-muted-foreground">
        Get up and running fast on the ramp — every skills path starts safe, gets you productive quickly, and goes
        deeper from there.
      </p>
      <nav aria-label="Skills paths">
        <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {skills.map((manifest) => (
            <li key={manifest.pathId}>
              <LearnPathCard
                locale={locale}
                manifest={manifest}
                courseTitles={courseTitles}
                courseCards={courseCards}
                sequences={sequences}
              />
              <RampMilestoneStrip />
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
