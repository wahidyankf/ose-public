"use client";

import Link from "next/link";
import { contentUrl } from "@/features/content/core/content-url";
import type { Locale } from "@/features/i18n/core/config";
import { t } from "@/features/i18n/core/translations";
import { tf } from "@/features/i18n/core/fill";
import { pathProgress, type SequenceIndex } from "@/features/learning-progress/core/progress-derivations";
import { resolvePathNextStep } from "@/features/learning-progress/core/next-step";
import { emptyProgress } from "@/features/learning-progress/core/progress-state";
import { ProgressMeter } from "@/features/learning-progress/shell/progress-meter";
import { ProgressPlaceholder } from "@/features/learning-progress/shell/progress-placeholder";
import { useLearningProgress } from "@/features/learning-progress/shell/use-learning-progress";
import type { PathManifest } from "../core/schemas";
import { isPendingSkillsRestructure } from "../core/skills-restructure-allowlist";
import { slugForCourseId } from "./course-path-nav";
import type { RoadmapCourseData } from "./roadmap-course-card";

export interface RoadmapProgressCardProps {
  locale: string;
  manifest: PathManifest;
  /** Per-course metadata, built on the server — the button needs the target course's title. */
  courseCards: Record<string, RoadmapCourseData>;
  sequences: SequenceIndex;
}

/**
 * The roadmap's progress card (plan ayokoding-learn-revamp-04, Phase 4, Screen 1 option A): "Your
 * progress", the path headline, a bar, and **one** Start or Continue button.
 *
 * The headline counts core courses only, every course in the pending-restructure flat mode, and
 * says the core is complete instead once it is — in which case no button renders (S24, S25). The
 * button targets `resolvePathNextStep`, so it resumes the reader's own place in the path, always
 * with `?path=` (S21, S22). While the progress snapshot is `unknown` — the server render and
 * hydration — the headline slot holds a placeholder and the button shows the path's first core
 * course, so the card works without scripts and nothing moves when progress arrives (S8).
 */
export function RoadmapProgressCard({ locale, manifest, courseCards, sequences }: RoadmapProgressCardProps) {
  const loc = locale as Locale;
  const snapshot = useLearningProgress();
  const ready = snapshot.status === "ready";
  const state = ready ? snapshot.state : emptyProgress();
  const { coreDone, coreTotal, complete } = pathProgress(manifest, state, sequences);
  const flat = isPendingSkillsRestructure(manifest);
  const step = complete ? null : resolvePathNextStep(manifest, state, sequences);
  const target = step !== null && step.kind !== "core-complete" ? step.target : null;
  const targetTitle = target === null ? "" : (courseCards[target.courseId]?.title ?? target.courseId);

  return (
    <div
      data-progress-slot="roadmap-progress"
      className="mt-8 flex h-40 flex-col justify-between rounded-xl border border-border p-4 sm:h-36"
    >
      <div>
        <p className="text-sm font-semibold tracking-wide text-muted-foreground">{t(loc, "progressYourProgress")}</p>
        <div className="mt-1 flex h-6 items-center">
          {ready ? (
            <p className="text-lg font-bold tracking-tight">
              {tf(loc, flat ? "progressCoursesDone" : "progressCoreCoursesDone", {
                done: coreDone,
                total: coreTotal,
              })}
            </p>
          ) : (
            <ProgressPlaceholder className="h-5 w-56" />
          )}
        </div>
        {/* A reserved line, so the completion sentence costs no layout shift when it appears (S8). */}
        <div className="mt-1 h-5 text-sm text-muted-foreground">
          {ready && complete ? <p>{t(loc, "progressCoreComplete")}</p> : null}
        </div>
        <div className="mt-2">
          <ProgressMeter
            value={coreDone}
            max={coreTotal}
            tone={complete ? "done" : coreDone > 0 ? "progress" : "primary"}
          />
        </div>
      </div>

      {target !== null ? (
        <Link
          href={contentUrl(
            loc,
            target.pagePath === null
              ? slugForCourseId(target.courseId)
              : `${slugForCourseId(target.courseId)}/${target.pagePath}`,
            manifest.pathId,
          )}
          data-progress-control="roadmap-primary"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:w-auto sm:self-start"
        >
          {tf(loc, step !== null && step.kind === "continue" ? "roadmapContinue" : "roadmapStart", {
            title: targetTitle,
          })}
        </Link>
      ) : null}
    </div>
  );
}
