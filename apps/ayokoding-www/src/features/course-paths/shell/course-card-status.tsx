"use client";

import { courseProgress } from "@/features/learning-progress/core/progress-derivations";
import { CourseStatusLabel } from "@/features/learning-progress/shell/course-status-label";
import { ProgressPlaceholder } from "@/features/learning-progress/shell/progress-placeholder";
import { useLearningProgress } from "@/features/learning-progress/shell/use-learning-progress";

export interface CourseCardStatusProps {
  locale: string;
  courseId: string;
  /** The course's lesson page paths (`loadLessonPagePaths`), so stale pages never count. */
  sequence: readonly string[];
}

/**
 * One roadmap course card's status (plan ayokoding-learn-revamp-04, Phase 4, tech-docs/004 Shared
 * Rules): the word Done / In progress / Not started over a hidden icon, in a fixed-height slot.
 *
 * While the progress snapshot is `unknown` — the server render and hydration — the slot holds a
 * neutral placeholder, so the card's size never changes when progress arrives (S8). Pure except for
 * the store read; no IO.
 *
 * The slot is block-level (`flex`, never `inline-flex`): an inline-level box inherits the line
 * box's strut, so its height shifts a pixel with the surrounding font metrics between the
 * placeholder and the label on some platforms (S8 layout-shift failure, deploy run 39079366390).
 */
export function CourseCardStatus({ locale, courseId, sequence }: CourseCardStatusProps) {
  const snapshot = useLearningProgress();

  return (
    <span data-progress-slot="course-status" className="flex h-5 items-center">
      {snapshot.status === "ready" ? (
        <CourseStatusLabel
          locale={locale}
          status={courseProgress(snapshot.state, courseId, sequence).status}
          size="sm"
        />
      ) : (
        <ProgressPlaceholder className="h-4 w-24" />
      )}
    </span>
  );
}
