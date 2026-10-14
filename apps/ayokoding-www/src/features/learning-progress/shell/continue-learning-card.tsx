"use client";

import Link from "next/link";
import { contentUrl } from "@/features/content/core/content-url";
import { humanizeKebabSlug, slugForCourseId } from "@/features/course-paths/shell/course-path-nav";
import type { PathManifest } from "@/features/course-paths/core/schemas";
import { LEARN_PATHS_PREFIX } from "@/features/course-paths/shell/paths-route";
import type { Locale } from "@/features/i18n/core/config";
import { tf } from "@/features/i18n/core/fill";
import { t } from "@/features/i18n/core/translations";
import type { SequenceIndex } from "../core/progress-derivations";
import { courseNextTarget, resolvePathNextStep, type CourseTarget, type PathNextStep } from "../core/next-step";
import type { ProgressState } from "../core/progress-schema";
import { useLearningProgress } from "./use-learning-progress";

export interface ContinueLearningCardProps {
  locale: string;
  /** Every loaded manifest, so a remembered path is recognized by ID (tech-docs/003). */
  manifests: readonly PathManifest[];
  /** Course ID -> its title, for the card's "Continue: <course>" label. */
  courseTitles: Readonly<Record<string, string>>;
  /** Every course's lesson page paths (`loadLessonPagePaths`), so a stale page never counts. */
  sequences: SequenceIndex;
}

/** What the one card shows: start the reader off, resume a path, or resume a single course. */
type CardView =
  | { kind: "start" }
  | { kind: "path"; title: string; pathId: string; step: PathNextStep }
  | { kind: "course"; courseId: string; title: string; target: CourseTarget | null };

/**
 * The Learn home's Continue/Start card (plan ayokoding-learn-revamp-04, Phase 6, Screen 3 option A;
 * tech-docs/003 Learn Home Card): path mode when the reader's remembered path is loaded, course
 * mode when only a course is remembered, and start mode otherwise.
 *
 * The server render — and the first client render — is **start mode**, the same fixed-size box the
 * hydrated variants fill (`h-44 sm:h-32`), so saved progress swaps the card's contents without
 * moving anything below it (S8, S28, S29). Every target in path mode keeps `?path=`, so the reader
 * resumes inside the path they were following. Pure except for the store read; no IO.
 */
export function ContinueLearningCard({ locale, manifests, courseTitles, sequences }: ContinueLearningCardProps) {
  const loc = locale as Locale;
  const snapshot = useLearningProgress();
  const view: CardView =
    snapshot.status === "ready" ? cardView(snapshot.state, manifests, courseTitles, sequences) : { kind: "start" };

  return (
    <div
      data-progress-slot="continue-learning"
      className="mt-6 flex h-44 flex-col justify-between rounded-xl border border-border bg-muted/40 p-4 sm:h-32"
    >
      {view.kind === "start" ? (
        <>
          <div>
            <p className="text-base font-semibold">{t(loc, "homeStartLearning")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t(loc, "homeStartHint")}</p>
          </div>
          <Link
            href={`${contentUrl(loc, "learn")}#career-paths`}
            data-progress-control="continue-primary"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:w-auto"
          >
            {t(loc, "homeChoosePath")}
          </Link>
        </>
      ) : null}

      {view.kind === "path" ? (
        <>
          <div>
            <p className="text-sm font-semibold tracking-wide text-muted-foreground">
              {t(loc, "homeContinueLearning")}
            </p>
            <p className="mt-1 text-lg font-bold tracking-tight">{view.title}</p>
            {view.step.kind === "core-complete" ? (
              <p className="mt-1 text-sm text-muted-foreground">{tf(loc, "homeFinishedCore", { title: view.title })}</p>
            ) : null}
          </div>
          {view.step.kind === "core-complete" ? (
            <Link
              href={contentUrl(loc, `${LEARN_PATHS_PREFIX}/${view.pathId}`)}
              data-progress-control="continue-primary"
              className={primaryLinkClass}
            >
              {t(loc, "homeViewPath")}
            </Link>
          ) : (
            <Link
              href={targetHref(loc, view.step.target, view.pathId)}
              data-progress-control="continue-primary"
              className={primaryLinkClass}
            >
              {tf(loc, view.step.kind === "start" ? "roadmapStart" : "roadmapContinue", {
                title: courseTitles[view.step.target.courseId] ?? humanizeKebabSlug(view.step.target.courseId),
              })}
            </Link>
          )}
        </>
      ) : null}

      {view.kind === "course" ? (
        <>
          <div>
            <p className="text-sm font-semibold tracking-wide text-muted-foreground">
              {t(loc, "homeContinueLearning")}
            </p>
            <p className="mt-1 text-lg font-bold tracking-tight">{view.title}</p>
          </div>
          <Link
            href={
              view.target === null
                ? contentUrl(loc, slugForCourseId(view.courseId))
                : targetHref(loc, view.target, undefined)
            }
            data-progress-control="continue-primary"
            className={primaryLinkClass}
          >
            {tf(loc, "roadmapContinue", { title: view.title })}
          </Link>
        </>
      ) : null}
    </div>
  );
}

const primaryLinkClass =
  "inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:w-auto";

/** The card's mode for the current stored progress (tech-docs/003 Learn Home Card, in order). */
function cardView(
  state: ProgressState,
  manifests: readonly PathManifest[],
  courseTitles: Readonly<Record<string, string>>,
  sequences: SequenceIndex,
): CardView {
  const rememberedPath = manifests.find((manifest) => manifest.pathId === state.lastPath?.pathId);
  if (rememberedPath !== undefined) {
    return {
      kind: "path",
      title: rememberedPath.title,
      pathId: rememberedPath.pathId,
      step: resolvePathNextStep(rememberedPath, state, sequences),
    };
  }

  const courseId = state.lastCourse?.courseId;
  const sequence = courseId === undefined ? undefined : sequences[courseId];
  if (courseId !== undefined && sequence !== undefined && sequence.length > 0) {
    return {
      kind: "course",
      courseId,
      title: courseTitles[courseId] ?? humanizeKebabSlug(courseId),
      target: courseNextTarget(state, courseId, sequence),
    };
  }

  return { kind: "start" };
}

/** One course target as a link, carrying `?path=` only when the reader is inside that path. */
function targetHref(locale: Locale, target: CourseTarget, pathId: string | undefined): string {
  const slug =
    target.pagePath === null
      ? slugForCourseId(target.courseId)
      : `${slugForCourseId(target.courseId)}/${target.pagePath}`;
  return contentUrl(locale, slug, pathId);
}
