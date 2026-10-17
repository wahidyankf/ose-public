"use client";

import type { Locale } from "@/features/i18n/core/config";
import { tf } from "@/features/i18n/core/fill";
import {
  pathProgress,
  type CourseStatus,
  type SequenceIndex,
} from "@/features/learning-progress/core/progress-derivations";
import { CourseStatusLabel } from "@/features/learning-progress/shell/course-status-label";
import { ProgressMeter } from "@/features/learning-progress/shell/progress-meter";
import { ProgressPlaceholder } from "@/features/learning-progress/shell/progress-placeholder";
import { useLearningProgress } from "@/features/learning-progress/shell/use-learning-progress";
import { isPendingSkillsRestructure } from "../core/skills-restructure-allowlist";
import type { PathManifest } from "../core/schemas";

export interface PathCardProgressProps {
  locale: string;
  manifest: PathManifest;
  /** Every course's lesson page paths (`loadLessonPagePaths`), so stale pages never count. */
  sequences: SequenceIndex;
}

/**
 * One path card's progress line (plan ayokoding-learn-revamp-04, Phase 6, tech-docs/004): the
 * status in words, the path headline count, and a decoration bar, in a wrapping row with a
 * minimum height (DWT-004) — it wraps instead of overflowing the viewport, while each label
 * stays unbroken on its own line.
 *
 * Counts core courses only — every course of a path still waiting for its restructure — exactly
 * like the roadmap headline, so a card and its own path page never disagree (tech-docs/003
 * Derivations). While the snapshot is `unknown` — the server render and hydration — the slot holds
 * placeholders, so the card's fields below it never move once progress arrives (S8). Pure except
 * for the store read; no IO.
 */
export function PathCardProgress({ locale, manifest, sequences }: PathCardProgressProps) {
  const loc = locale as Locale;
  const snapshot = useLearningProgress();
  const flat = isPendingSkillsRestructure(manifest);

  if (snapshot.status !== "ready") {
    // S8: the placeholder keeps the slot's own box classes, so hydration never moves the card's
    // fields below it — the same wrapping minimum-height row the ready branch renders.
    return (
      <span data-progress-slot="path-card-progress" className="flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1">
        <ProgressPlaceholder className="h-4 w-24" />
        <ProgressPlaceholder className="h-2 w-12" />
      </span>
    );
  }

  const { coreDone, coreTotal, complete } = pathProgress(manifest, snapshot.state, sequences);
  const status: CourseStatus = complete ? "done" : coreDone > 0 ? "in-progress" : "not-started";

  return (
    <span data-progress-slot="path-card-progress" className="flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1">
      <CourseStatusLabel locale={locale} status={status} size="sm" />
      <span aria-hidden="true">·</span>
      <span className="text-sm text-muted-foreground">
        {tf(loc, flat ? "progressCoursesDone" : "progressCoreCoursesDone", { done: coreDone, total: coreTotal })}
      </span>
      <span className="w-12 shrink-0 sm:w-16">
        <ProgressMeter value={coreDone} max={coreTotal} tone={complete ? "done" : "progress"} />
      </span>
    </span>
  );
}
