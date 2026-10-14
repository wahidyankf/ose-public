"use client";

import type { Locale } from "@/features/i18n/core/config";
import { tf } from "@/features/i18n/core/fill";
import { t } from "@/features/i18n/core/translations";
import { courseProgress } from "../core/progress-derivations";
import { emptyProgress } from "../core/progress-state";
import { CourseStatusLabel } from "./course-status-label";
import { ProgressMeter } from "./progress-meter";
import { ProgressPlaceholder } from "./progress-placeholder";
import { useLearningProgress } from "./use-learning-progress";

export interface CourseProgressSummaryProps {
  locale: string;
  courseId: string;
  /** This course's lesson page paths, in reading order — the count's denominator. */
  sequence: readonly string[];
}

/**
 * The course landing header's `progress` slot (plan ayokoding-learn-revamp-04, Phase 5,
 * tech-docs/004): the course's status in words, how many of its pages are done, a bar, and the
 * browser-only note.
 *
 * While the progress snapshot is `unknown` — the server render and hydration — every line holds a
 * `ProgressPlaceholder` inside the same fixed `h-16` box, so the header is complete without
 * scripts and nothing below it moves when progress arrives (S8, S33, S34). Only the words carry
 * the count; the bar is `aria-hidden` decoration.
 */
export function CourseProgressSummary({ locale, courseId, sequence }: CourseProgressSummaryProps) {
  const loc = locale as Locale;
  const snapshot = useLearningProgress();
  const ready = snapshot.status === "ready";
  const state = ready ? snapshot.state : emptyProgress();
  const { done, total, status } = courseProgress(state, courseId, sequence);

  return (
    <div className="mt-4 flex h-16 flex-col justify-center rounded-xl border border-border px-4">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex h-5 items-center">
          {ready ? (
            <CourseStatusLabel status={status} locale={locale} size="sm" />
          ) : (
            <ProgressPlaceholder className="h-4 w-24" />
          )}
        </span>
        <span className="inline-flex h-5 items-center text-sm text-muted-foreground">
          {ready ? tf(loc, "progressPagesDone", { done, total }) : <ProgressPlaceholder className="h-4 w-40" />}
        </span>
      </div>

      <div className="mt-1 h-2">
        {ready ? (
          <ProgressMeter
            value={done}
            max={total}
            tone={status === "done" ? "done" : status === "in-progress" ? "progress" : "primary"}
          />
        ) : (
          <ProgressPlaceholder className="h-2 w-full" />
        )}
      </div>

      <p className="mt-1 h-4 text-xs text-muted-foreground">
        {ready ? t(loc, "progressSavedInBrowser") : <ProgressPlaceholder className="h-3 w-32" />}
      </p>
    </div>
  );
}
