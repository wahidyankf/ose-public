"use client";

import type { PathPhase } from "../core/schemas";
import type { Locale } from "@/features/i18n/core/config";
import { tf } from "@/features/i18n/core/fill";
import {
  phaseProgress,
  type CourseStatus,
  type SequenceIndex,
} from "@/features/learning-progress/core/progress-derivations";
import { CourseStatusLabel } from "@/features/learning-progress/shell/course-status-label";
import { ProgressMeter } from "@/features/learning-progress/shell/progress-meter";
import { ProgressPlaceholder } from "@/features/learning-progress/shell/progress-placeholder";
import { useLearningProgress } from "@/features/learning-progress/shell/use-learning-progress";

export interface PhaseProgressProps {
  locale: string;
  phase: PathPhase;
  sequences: SequenceIndex;
}

/**
 * One roadmap phase's progress (plan ayokoding-learn-revamp-04, Phase 4, tech-docs/004): the phase
 * status in words, its "{done} of {total} done" course count, and a decoration bar in a
 * fixed-height slot.
 *
 * Counts are courses, not pages (tech-docs/003 Derivations). While the progress snapshot is
 * `unknown` the slot holds placeholders, so the phase heading below never moves once progress
 * arrives (S8). Pure except for the store read; no IO.
 */
export function PhaseProgress({ locale, phase, sequences }: PhaseProgressProps) {
  const snapshot = useLearningProgress();

  if (snapshot.status !== "ready") {
    return (
      <span data-progress-slot="phase-progress" className="flex h-5 items-center gap-2">
        <ProgressPlaceholder className="h-4 w-20" />
        <ProgressPlaceholder className="h-2 w-12" />
      </span>
    );
  }

  const { done, total } = phaseProgress(phase, snapshot.state, sequences);
  const status: CourseStatus = total > 0 && done === total ? "done" : done > 0 ? "in-progress" : "not-started";

  return (
    <span data-progress-slot="phase-progress" className="flex h-5 items-center gap-2">
      <CourseStatusLabel locale={locale} status={status} size="sm" />
      <span aria-hidden="true">·</span>
      <span className="text-sm whitespace-nowrap text-muted-foreground">
        {tf(locale as Locale, "progressPhaseDone", { done, total })}
      </span>
      <span className="w-12 sm:w-16">
        <ProgressMeter value={done} max={total} tone={status === "done" ? "done" : "progress"} />
      </span>
    </span>
  );
}
