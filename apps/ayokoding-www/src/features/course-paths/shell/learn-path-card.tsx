import Link from "next/link";
import { contentUrl } from "@/features/content/core/content-url";
import type { Locale } from "@/features/i18n/core/config";
import { tf } from "@/features/i18n/core/fill";
import { t } from "@/features/i18n/core/translations";
import type { SequenceIndex } from "@/features/learning-progress/core/progress-derivations";
import { normalizeCourseRef } from "../core/manifest";
import { corePhases, extensionPhases } from "../core/path-phases";
import type { PathManifest } from "../core/schemas";
import { isPendingSkillsRestructure } from "../core/skills-restructure-allowlist";
import { humanizeKebabSlug } from "./course-path-nav";
import { PathCardProgress } from "./path-card-progress";
import { LEARN_PATHS_PREFIX } from "./paths-route";
import { roadmapHours } from "./path-roadmap";
import type { RoadmapCourseData } from "./roadmap-course-card";

export interface LearnPathCardProps {
  locale: string;
  manifest: PathManifest;
  /** Course ID -> its title, for the goal line's course names. */
  courseTitles: Readonly<Record<string, string>>;
  /** Per-course metadata built on the server — the card's size and time come from it. */
  courseCards: Record<string, RoadmapCourseData>;
  /** Every course's lesson page paths (`loadLessonPagePaths`), so progress counts real pages. */
  sequences: SequenceIndex;
}

/**
 * One path rendered as a learning card (plan ayokoding-learn-revamp-04, Phase 6, Screen 3 option A;
 * tech-docs/004 `LearnPathCard`): the title, who the path is for (the manifest's authored
 * description), its goal, its size in phases and courses, its estimated time, its progress in
 * words, and the way in.
 *
 * A path still waiting for its restructure has no meaningful phase split, so it states its course
 * count instead — the same flat rule the roadmap uses, so a card and its own path page always agree
 * (decision 39). The card is server-rendered; only its progress line is a client slot.
 */
export function LearnPathCard({ locale, manifest, courseTitles, courseCards, sequences }: LearnPathCardProps) {
  const loc = locale as Locale;
  const href = contentUrl(loc, `${LEARN_PATHS_PREFIX}/${manifest.pathId}`);
  const flat = isPendingSkillsRestructure(manifest);
  const courseIds = manifest.courseOrder.map((reference) => normalizeCourseRef(reference).id);
  const cores = corePhases(manifest);
  const coreCourseIds = cores.flatMap((phase) => phase.courses.map((reference) => normalizeCourseRef(reference).id));
  const { hours, withoutEstimate } = roadmapHours(flat ? courseIds : coreCourseIds, courseCards);

  const size = flat
    ? tf(loc, "roadmapCoursesCount", { count: courseIds.length })
    : `${tf(loc, "pathCardPhases", { count: cores.length })} · ${tf(loc, "pathCardOptional", {
        count: extensionPhases(manifest).length,
      })}`;
  const hoursText =
    hours > 0
      ? `${tf(loc, "courseEstimatedHours", { hours })}${
          withoutEstimate > 0 ? ` · ${tf(loc, "roadmapHoursPlusOutline", { count: withoutEstimate })}` : ""
        }`
      : "";
  const goalTitles = (manifest.goals ?? []).map((goal) => courseTitles[goal] ?? humanizeKebabSlug(goal));

  return (
    <div className="flex h-full flex-col justify-between rounded-xl border border-border p-4">
      <div>
        <Link
          href={href}
          className="text-lg font-semibold hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {manifest.title}
        </Link>
        <p className="mt-1 text-sm text-muted-foreground">{manifest.description}</p>
        {goalTitles.length > 0 ? (
          <p className="mt-2 text-sm">{`${t(loc, "roadmapGoal")} ${goalTitles.join(", ")}`}</p>
        ) : null}
        <p className="mt-2 text-sm text-muted-foreground">{hoursText === "" ? size : `${size} · ${hoursText}`}</p>
      </div>

      <div className="mt-3">
        <PathCardProgress locale={locale} manifest={manifest} sequences={sequences} />
        <Link
          href={href}
          className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {t(loc, "homeViewPath")} →
        </Link>
      </div>
    </div>
  );
}
