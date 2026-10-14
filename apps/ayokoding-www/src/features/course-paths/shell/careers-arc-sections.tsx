import Link from "next/link";
import { contentUrl } from "@/features/content/core/content-url";
import type { Locale } from "@/features/i18n/core/config";
import type { SequenceIndex } from "@/features/learning-progress/core/progress-derivations";
import type { PathManifest } from "../core/schemas";
import { LearnPathCard } from "./learn-path-card";
import { LEARN_PATHS_PREFIX } from "./paths-route";
import type { RoadmapCourseData } from "./roadmap-course-card";

/** One careers arc's own heading and its role cards, in first-seen arc order. */
export interface CareersArcSection {
  arc: string;
  /** The arc's authored/humanized display title — never the raw `arc` slug. */
  arcTitle: string;
  manifests: readonly PathManifest[];
}

export interface CareersArcSectionsProps {
  locale: string;
  sections: readonly CareersArcSection[];
  /** Course ID -> its title, for the cards' goal lines. */
  courseTitles: Readonly<Record<string, string>>;
  /** Per-course metadata built on the server — the cards' size and time come from it. */
  courseCards: Record<string, RoadmapCourseData>;
  /** Every course's lesson page paths, so a card's progress counts real pages. */
  sequences: SequenceIndex;
}

/**
 * The careers category landing's path cards, grouped one `<section>` per arc (plan
 * ayokoding-learn-revamp-04, Phase 7; tech-docs/004 `CareersArcSections`).
 *
 * Each arc's `<h2>` **links to that arc's own page** — the arc chooser's job, now carried by the
 * heading rather than by a separate `ArcCard` — immediately followed by that arc's role cards,
 * which are the same `LearnPathCard`s the Learn home renders (S32, U3). Server-rendered; only the
 * cards' progress lines are client slots. Pure; no IO.
 */
export function CareersArcSections({
  locale,
  sections,
  courseTitles,
  courseCards,
  sequences,
}: CareersArcSectionsProps) {
  const loc = locale as Locale;

  return (
    <nav aria-label="Careers arcs">
      {sections.map(({ arc, arcTitle, manifests }) => {
        const headingId = `careers-arc-${arc}`;

        return (
          <section key={arc} aria-labelledby={headingId} className="mt-8">
            <h2 id={headingId} className="text-2xl font-bold tracking-tight">
              <Link
                href={contentUrl(loc, `${LEARN_PATHS_PREFIX}/careers/${arc}`)}
                className="hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                {arcTitle}
              </Link>
            </h2>
            <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {manifests.map((manifest) => (
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
          </section>
        );
      })}
    </nav>
  );
}
