"use client";

import { useEffect } from "react";
import Link from "next/link";
import { contentUrl } from "@/features/content/core/content-url";
import { humanizeKebabSlug, slugForCourseId } from "@/features/course-paths/shell/course-path-nav";
import type { Locale } from "@/features/i18n/core/config";
import { tf } from "@/features/i18n/core/fill";
import { t } from "@/features/i18n/core/translations";
import type { LessonPage } from "../core/lesson-sequence";
import { courseNextTarget } from "../core/next-step";
import { emptyProgress, recordVisit } from "../core/progress-state";
import { learningProgressStore } from "./progress-storage";
import { useLearningProgress } from "./use-learning-progress";

export interface CourseProgressActionProps {
  locale: string;
  courseId: string;
  /** This course's lesson pages, in reading order. */
  sequence: LessonPage[];
  /** Plan 03's start page slug — where "Start course" points before anything is done. */
  startSlug: string | null;
  /** The validated `?path=` of this URL, kept on the link so path context survives (tech-docs/004). */
  pathId: string | null;
}

/**
 * The course landing header's `primaryAction` slot (plan ayokoding-learn-revamp-04, Phase 5,
 * tech-docs/004): one button that reads "Start course", `courseContinueCourse` with the next
 * unfinished page's title, or `courseReviewCourse` to the first page once the course is done
 * (S33, S34).
 *
 * The target comes from the shared next-step rule, so "where I stopped" means the same thing here
 * as in the lesson action row. The server render — and hydration — shows "Start course" to plan
 * 03's start slug, which is why the header needs no script to offer a first step. Every target
 * keeps `?path=` when the URL carried a validated one. Mounting the landing page also records the
 * visit (tech-docs/003 visit recording), so the course is the reader's remembered one.
 */
export function CourseProgressAction({ locale, courseId, sequence, startSlug, pathId }: CourseProgressActionProps) {
  const loc = locale as Locale;
  const snapshot = useLearningProgress();
  const ready = snapshot.status === "ready";
  const state = ready ? snapshot.state : emptyProgress();

  // The course landing page is a visit, exactly like a lesson page: it makes this course the
  // remembered one (and no path fallback is read here — course landing pages keep URL-only
  // behaviour, tech-docs/003).
  useEffect(() => {
    learningProgressStore.update((current) => recordVisit(current, courseId, pathId));
  }, [courseId, pathId]);

  const target = courseNextTarget(
    state,
    courseId,
    sequence.map((page) => page.pagePath),
  );
  const link = courseActionLink(loc, courseId, sequence, startSlug, target, pathId ?? undefined);

  if (link === null) {
    return null;
  }

  return (
    <div data-progress-slot="course-action" className="mt-4 flex min-h-11 flex-col justify-center">
      <Link
        href={link.href}
        data-progress-control="course-primary"
        className="inline-flex min-h-11 w-full min-w-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:w-auto sm:self-start"
      >
        <span className="truncate">{link.label}</span>
      </Link>
    </div>
  );
}

/**
 * Where the header's one button goes, and what it reads: the next unfinished page (Continue), the
 * course's start page (Start), or the first page of a finished course (Review). `null` when there
 * is nothing to link to — no start slug to start at.
 */
function courseActionLink(
  locale: Locale,
  courseId: string,
  sequence: readonly LessonPage[],
  startSlug: string | null,
  target: ReturnType<typeof courseNextTarget>,
  pathId: string | undefined,
): { href: string; label: string } | null {
  if (target === null) {
    const first = sequence[0];
    return first === undefined
      ? null
      : { href: contentUrl(locale, first.slug, pathId), label: t(locale, "courseReviewCourse") };
  }

  if (target.pagePath === null) {
    return startSlug === null ? null : { href: contentUrl(locale, startSlug, pathId), label: t(locale, "courseStart") };
  }

  const title = sequence.find((page) => page.pagePath === target.pagePath)?.title ?? humanizeKebabSlug(target.pagePath);
  return {
    href: contentUrl(locale, `${slugForCourseId(courseId)}/${target.pagePath}`, pathId),
    label: tf(locale, "courseContinueCourse", { title }),
  };
}
