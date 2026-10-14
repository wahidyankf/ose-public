"use client";

import Link from "next/link";
import { contentUrl } from "@/features/content/core/content-url";
import { slugForCourseId } from "@/features/course-paths/shell/course-path-nav";
import { LEARN_PATHS_PREFIX } from "@/features/course-paths/shell/paths-route";
import type { Locale } from "@/features/i18n/core/config";
import { tf } from "@/features/i18n/core/fill";
import { t } from "@/features/i18n/core/translations";
import { courseProgress } from "../core/progress-derivations";
import { useLessonContext } from "./lesson-context-provider";
import { ProgressMeter } from "./progress-meter";
import { ProgressPlaceholder } from "./progress-placeholder";

/**
 * The thin lesson context bar (plan ayokoding-learn-revamp-04, Screen 2 option A): where the reader
 * is — path › phase › course n of N — and how far into this course's pages they are.
 *
 * It sits in a fixed-height box (`h-[4.75rem]` phone, `h-14` from `sm`) and shows placeholders
 * instead of counts while the progress snapshot is unknown, so the lesson body below never moves
 * once progress arrives (S8). Without a path context it is the course title plus the same page
 * counts (S11).
 */
export function ContextBar() {
  const { locale, courseId, courseTitle, sequence, index, snapshot, path } = useLessonContext();
  const loc = locale as Locale;
  const total = sequence.length;
  const ready = snapshot.status === "ready";
  const done = ready
    ? courseProgress(
        snapshot.state,
        courseId,
        sequence.map((page) => page.pagePath),
      ).done
    : 0;

  return (
    <nav
      aria-label={t(loc, "contextBarLabel")}
      data-progress-slot="context-bar"
      className="mb-4 flex h-[4.75rem] flex-col justify-center gap-1 rounded-md border border-border px-3 text-sm sm:h-14"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-2">
        {path === null ? (
          <Link href={contentUrl(loc, slugForCourseId(courseId))} className="truncate font-medium hover:text-primary">
            {courseTitle}
          </Link>
        ) : (
          <>
            <Link
              href={contentUrl(loc, `${LEARN_PATHS_PREFIX}/${path.pathId}`)}
              className="truncate font-medium text-primary hover:underline"
            >
              {path.title}
            </Link>
            <span aria-hidden="true">›</span>
            {path.phase === null ? null : path.phase.isExtension ? (
              // An extension phase has no `#phase-<id>` anchor on the roadmap (tech-docs/004
              // renders those as closed `<details>`), so it links to the path page itself.
              <Link
                href={contentUrl(loc, `${LEARN_PATHS_PREFIX}/${path.pathId}`)}
                className="truncate hover:text-primary"
              >
                {path.phase.title}
              </Link>
            ) : (
              <Link
                href={`${contentUrl(loc, `${LEARN_PATHS_PREFIX}/${path.pathId}`)}#phase-${path.phase.id}`}
                className="truncate hover:text-primary"
              >
                {`${t(loc, "pathsPhaseLabel")} ${path.phase.index} · ${path.phase.title}`}
              </Link>
            )}
            <span aria-hidden="true">›</span>
            <Link
              href={contentUrl(loc, slugForCourseId(courseId), path.pathId)}
              className="truncate hover:text-primary"
            >
              {tf(loc, "contextCourseOf", { position: path.coursePosition, total: path.totalCourses })}
            </Link>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 text-muted-foreground">
        {ready ? (
          <>
            <span className="whitespace-nowrap">{tf(loc, "contextPageOf", { position: index + 1, total })}</span>
            <span aria-hidden="true">·</span>
            <span className="whitespace-nowrap">{tf(loc, "progressPagesDone", { done, total })}</span>
            <span className="w-16 sm:w-24">
              <ProgressMeter value={done} max={total} tone="progress" />
            </span>
          </>
        ) : (
          <>
            <ProgressPlaceholder className="h-4 w-28" />
            <ProgressPlaceholder className="h-2 w-16 sm:w-24" />
          </>
        )}
      </div>
    </nav>
  );
}
