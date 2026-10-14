"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { contentUrl } from "@/features/content/core/content-url";
import { slugForCourseId } from "@/features/course-paths/shell/course-path-nav";
import { LEARN_PATHS_PREFIX } from "@/features/course-paths/shell/paths-route";
import type { Locale } from "@/features/i18n/core/config";
import { tf } from "@/features/i18n/core/fill";
import { t } from "@/features/i18n/core/translations";
import { courseProgress } from "../core/progress-derivations";
import type { LessonPage } from "../core/lesson-sequence";
import { setPageComplete } from "../core/progress-state";
import { useLessonContext, type LessonPathContext } from "./lesson-context-provider";
import { learningProgressStore } from "./progress-storage";

/**
 * The lesson action row (plan ayokoding-learn-revamp-04, Screen 2 option A): Previous, the
 * completion toggle, and "Mark complete & continue", which marks the page and opens the next stop
 * — the next page of the course, the next course of the path, or the path page itself
 * (tech-docs/003 lesson navigation).
 *
 * It keeps today's `Page navigation` landmark and names every target by its title, so the
 * sibling-link scenarios that already find those links keep working (U4). Below `sm` the controls
 * stack full width in the order primary, toggle, Previous. Nothing else writes completion: there
 * is no scroll, time, or visibility listener (S18).
 */
export function LessonNav() {
  const { locale, courseId, courseTitle, pagePath, pageTitle, sequence, index, snapshot, path } = useLessonContext();
  const loc = locale as Locale;
  const [announcement, setAnnouncement] = useState<"complete" | "incomplete" | null>(null);

  if (index < 0) {
    return null;
  }

  const ready = snapshot.status === "ready";
  const complete = (ready ? (snapshot.state.completed[courseId] ?? []) : []).includes(pagePath);
  const done = ready
    ? courseProgress(
        snapshot.state,
        courseId,
        sequence.map((page) => page.pagePath),
      ).done
    : 0;
  const pathId = path?.pathId;
  const previousPage = index > 0 ? sequence[index - 1] : undefined;
  const previous =
    previousPage === undefined
      ? { href: contentUrl(loc, slugForCourseId(courseId), pathId), title: courseTitle }
      : { href: contentUrl(loc, previousPage.slug, pathId), title: previousPage.title };
  const primary = primaryTarget(loc, courseId, sequence, index, path);

  return (
    <nav
      aria-label="Page navigation"
      data-progress-slot="lesson-nav"
      className="mt-12 flex min-h-11 flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between"
    >
      <Link
        href={previous.href}
        className="flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <span aria-hidden="true">←</span>
        {tf(loc, "lessonPrevious", { title: previous.title })}
      </Link>

      <button
        type="button"
        aria-pressed={complete}
        disabled={!ready}
        data-progress-control="lesson-toggle"
        onClick={() => {
          learningProgressStore.update((state) => setPageComplete(state, courseId, pagePath, !complete));
          setAnnouncement(complete ? "incomplete" : "complete");
        }}
        className="min-h-11 w-full rounded-md border border-border px-4 text-sm font-medium hover:border-primary disabled:opacity-50 sm:w-auto"
      >
        {complete ? (
          <span className="inline-flex items-center gap-1">
            {t(loc, "lessonCompleted")}
            <Check className="h-4 w-4" aria-hidden="true" />
          </span>
        ) : (
          t(loc, "lessonMarkComplete")
        )}
      </button>

      <Link
        href={primary.href}
        data-progress-control="lesson-primary"
        onClick={() => {
          if (!complete) {
            learningProgressStore.update((state) => setPageComplete(state, courseId, pagePath, true));
          }
        }}
        className="flex min-h-11 w-full flex-col justify-center rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 sm:w-auto sm:items-end"
      >
        <span className="font-semibold">
          {complete ? t(loc, "lessonContinue") : t(loc, "lessonMarkCompleteContinue")} →
        </span>
        <span className="text-xs">{primary.sub}</span>
      </Link>

      <p role="status" aria-live="polite" className="sr-only">
        {announcement === null
          ? ""
          : tf(loc, announcement === "complete" ? "lessonAnnounceComplete" : "lessonAnnounceIncomplete", {
              title: pageTitle,
              done,
              total: sequence.length,
            })}
      </p>
    </nav>
  );
}

/**
 * Where "Mark complete & continue" goes from `index`, and the sentence under it (tech-docs/003):
 * the course's next page, the next course of the path, the path page, or the course landing page.
 * Every path-context target keeps `?path=`; the path page itself carries none.
 */
function primaryTarget(
  locale: Locale,
  courseId: string,
  sequence: readonly LessonPage[],
  index: number,
  path: LessonPathContext | null,
): { href: string; sub: string } {
  const nextPage = sequence[index + 1];

  if (nextPage !== undefined) {
    return {
      href: contentUrl(locale, nextPage.slug, path?.pathId),
      sub: tf(locale, "lessonNextPage", { title: nextPage.title }),
    };
  }

  if (path !== null && path.nextCourse !== null) {
    return {
      href: contentUrl(locale, slugForCourseId(path.nextCourse.courseId), path.pathId),
      sub: tf(locale, "lessonNextCourse", { title: path.nextCourse.title }),
    };
  }

  if (path !== null) {
    return {
      href: contentUrl(locale, `${LEARN_PATHS_PREFIX}/${path.pathId}`),
      sub: t(locale, "lessonBackToPath"),
    };
  }

  return { href: contentUrl(locale, slugForCourseId(courseId)), sub: t(locale, "lessonBackToCourse") };
}
