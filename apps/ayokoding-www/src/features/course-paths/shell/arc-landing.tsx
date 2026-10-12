import { contentUrl } from "@/features/content/core/content-url";
import type { Locale } from "@/features/i18n/core/config";
import type { PathManifest } from "../core/schemas";
import { normalizeCourseRef } from "../core/manifest";
import { PathCard } from "./path-card";
import { EmptyPathListState } from "./empty-path-list-state";
import { SyllabusPreview } from "./syllabus-preview";
import { LEARN_PATHS_PREFIX } from "./paths-route";

export interface ArcLandingProps {
  locale: string;
  arc: string;
  /** This arc's own manifests only (careers-only — R8: no `skills/<arc>/` route). */
  manifests: readonly PathManifest[];
  /** courseId -> title, covering every course in every manifest passed in. */
  courseTitles: Readonly<Record<string, string>>;
}

/**
 * Arc landing (Cycle 3.1c-i/3.1c-ii, R7) — `/en/learn/paths/careers/<arc>/`. Renders **exactly as
 * many** `PathCard`s as the arc has roles — never a fixed-size grid; the single-role state
 * additionally renders an inline first-phase `SyllabusPreview` inside that one card so it never
 * reads as a stub next to a fabricated empty second card.
 */
export function ArcLanding({ locale, arc, manifests, courseTitles }: ArcLandingProps) {
  if (manifests.length === 0) {
    return (
      <EmptyPathListState
        fallbackHref={contentUrl(locale as Locale, `${LEARN_PATHS_PREFIX}/careers`)}
        fallbackLabel="Careers"
      />
    );
  }

  const isSingleRole = manifests.length === 1;

  return (
    <nav aria-label={`${arc} paths`}>
      <ul className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {manifests.map((manifest) => (
          <li key={manifest.pathId}>
            <PathCard locale={locale} manifest={manifest} context="hub" />
            {isSingleRole &&
              manifest.phases
                .slice(0, 1)
                .map((firstPhase) => (
                  <SyllabusPreview
                    key={firstPhase.id}
                    locale={locale}
                    phaseTitle={firstPhase.title}
                    courseTitles={firstPhase.courses.map(
                      (ref) => courseTitles[normalizeCourseRef(ref).id] ?? normalizeCourseRef(ref).id,
                    )}
                  />
                ))}
          </li>
        ))}
      </ul>
    </nav>
  );
}
