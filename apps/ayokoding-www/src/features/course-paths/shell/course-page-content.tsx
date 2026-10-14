import { Breadcrumb } from "@/features/navigation/shell/breadcrumb";
import { TableOfContents } from "@/features/navigation/shell/toc";
import { PrevNext } from "@/features/navigation/shell/prev-next";
import { MarkdownRenderer } from "@/features/content/shell/markdown-renderer";
import { ContextBar } from "@/features/learning-progress/shell/context-bar";
import { CourseProgressAction } from "@/features/learning-progress/shell/course-progress-action";
import { CourseProgressSummary } from "@/features/learning-progress/shell/course-progress-summary";
import type { LessonPage } from "@/features/learning-progress/core/lesson-sequence";
import { LessonContextProvider, type LessonProps } from "@/features/learning-progress/shell/lesson-context-provider";
import { LessonNav } from "@/features/learning-progress/shell/lesson-nav";
import { StorageNotice } from "@/features/learning-progress/shell/storage-notice";
import { PrerequisiteList } from "./prerequisite-list";
import { PathCourseLinks } from "./path-course-links";
import { PathBanner } from "./path-banner";
import { CourseHeader } from "./course-header";
import type { CourseHeaderData } from "./course-header-data";
import type { CoursePathRenderData } from "./course-path-nav";
import type { Heading } from "@/features/content/core/types";
import type { Locale } from "@/features/i18n/core/config";
import { t } from "@/features/i18n/core/translations";

export interface CoursePageContentProps {
  locale: string;
  slug: string;
  title: string;
  html: string;
  headings: Heading[];
  date?: Date;
  breadcrumbSegments: { label: string; slug: string; href?: string }[];
  renderData: CoursePathRenderData;
  courseId?: string;
  /** Plan 03: present only on a course root page; renders the header above the contents. */
  courseHeader?: CourseHeaderData;
  /**
   * Plan 04: present only when this page is part of its course's lesson sequence. It swaps the
   * page's chrome for the lesson context bar (above the `h1`) and the lesson action row (in place
   * of `PrevNext`). Pages outside a sequence keep today's render untouched.
   */
  lesson?: LessonProps;
  /**
   * Plan 04 Phase 5: the course landing header's `progress` slot (S33, S34) — the course's own id
   * and its lesson page paths. Built into `CourseProgressSummary` here rather than passed in as an
   * element, because only this component knows the live `renderData` the hydrated wrapper resolved
   * from `?path=`. Absent for every page that is not a course root.
   */
  courseHeaderProgress?: { courseId: string; sequence: readonly string[] };
  /**
   * Plan 04 Phase 5: the course landing header's `primaryAction` slot — the course's lesson pages
   * and plan 03's start slug. `CourseProgressAction` reads the path id from `renderData`, so a
   * header action keeps the reader's `?path=` exactly as the Start fallback does.
   */
  courseHeaderAction?: { courseId: string; sequence: LessonPage[]; startSlug: string | null };
}

/**
 * Shared static and hydrated rendering for a content page. The caller supplies
 * already-resolved path chrome, so this presentation component never reads
 * request state itself.
 */
export function CoursePageContent({
  locale,
  slug,
  title,
  html,
  headings,
  date,
  breadcrumbSegments,
  renderData,
  courseId,
  courseHeader,
  lesson,
  courseHeaderProgress,
  courseHeaderAction,
}: CoursePageContentProps) {
  const activeContext = renderData.activeContext;
  const pathContext =
    activeContext === null
      ? undefined
      : {
          pathId: activeContext.pathId,
          pathTitle: activeContext.manifest.title,
          learnLabel: t(locale as Locale, "navLearn"),
          learnHref: `/${locale}/browse`,
        };
  const coursePosition =
    activeContext === null || courseId === undefined
      ? undefined
      : activeContext.manifest.courseOrder.findIndex((ref) => (typeof ref === "string" ? ref : ref.id) === courseId) +
        1;
  const totalCourses = activeContext?.manifest.courseOrder.length;

  const page = (
    <article className="min-w-0 flex-1 px-6 py-8 lg:px-8">
      <Breadcrumb
        locale={locale}
        slug={slug}
        segments={breadcrumbSegments}
        showCurrent={pathContext !== undefined}
        pathContext={pathContext}
      />

      {lesson === undefined ? null : (
        <>
          <ContextBar />
          <StorageNotice locale={lesson.locale} />
        </>
      )}

      <h1 className="mb-6 text-4xl font-extrabold tracking-tight">{title}</h1>

      {pathContext !== undefined && coursePosition !== undefined && totalCourses !== undefined && (
        <PathBanner
          locale={locale}
          pathTitle={pathContext.pathTitle}
          courseIndex={coursePosition}
          totalCourses={totalCourses}
        />
      )}

      {courseHeader ? (
        <>
          <CourseHeader
            locale={locale}
            data={courseHeader}
            prerequisites={renderData.prerequisiteLinks}
            pathBadges={renderData.pathBadges}
            // Which paths include this course is a fact the URL's path context never changes, and the
            // statically served page always carries the list. Hiding it whenever a `?path=` resolved
            // would remove the whole block under the header — and move every line below it — the
            // moment the runtime path data arrived (S8), so the header always offers it.
            showPathBadges
            activePathId={renderData.activeContext?.pathId}
            progress={
              courseHeaderProgress === undefined ? undefined : (
                <CourseProgressSummary locale={locale} {...courseHeaderProgress} />
              )
            }
            primaryAction={
              courseHeaderAction === undefined ? undefined : (
                <CourseProgressAction
                  locale={locale}
                  {...courseHeaderAction}
                  pathId={renderData.activeContext?.pathId ?? null}
                />
              )
            }
          />
          <h2 className="mb-4 text-2xl font-bold tracking-tight">{t(locale as Locale, "courseContents")}</h2>
        </>
      ) : null}

      <MarkdownRenderer html={html} locale={locale} />

      {courseHeader ? null : <PrerequisiteList locale={locale} prerequisites={renderData.prerequisiteLinks} />}

      {courseHeader
        ? null
        : pathContext === undefined && <PathCourseLinks locale={locale} paths={renderData.pathBadges} />}

      {date && (
        <p className="mt-8 text-sm text-muted-foreground">
          {t(locale as Locale, "lastUpdated")}{" "}
          {new Date(date).toLocaleDateString(locale === "id" ? "id-ID" : "en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      )}

      {lesson === undefined ? (
        <PrevNext
          locale={locale}
          prev={renderData.prev}
          next={renderData.next}
          pathId={renderData.activeContext?.pathId}
        />
      ) : (
        <LessonNav />
      )}
    </article>
  );

  const chrome = (
    <>
      {page}

      <aside className="hidden w-[200px] shrink-0 xl:block">
        <div className="sticky top-20 p-4">
          <TableOfContents headings={headings} label={t(locale as Locale, "onThisPage")} />
        </div>
      </aside>
    </>
  );

  // One provider instance serves both the bar above the `h1` and the action row at the foot of the
  // page, so the runtime-manifest read, the active-path resolution, and the visit record each
  // happen once (tech-docs/004, tech-docs/003 visit recording).
  return lesson === undefined ? chrome : <LessonContextProvider {...lesson}>{chrome}</LessonContextProvider>;
}
