import { Breadcrumb } from "@/features/navigation/shell/breadcrumb";
import { TableOfContents } from "@/features/navigation/shell/toc";
import { PrevNext } from "@/features/navigation/shell/prev-next";
import { MarkdownRenderer } from "@/features/content/shell/markdown-renderer";
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

  return (
    <>
      <article className="min-w-0 flex-1 px-6 py-8 lg:px-8">
        <Breadcrumb
          locale={locale}
          slug={slug}
          segments={breadcrumbSegments}
          showCurrent={pathContext !== undefined}
          pathContext={pathContext}
        />

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
              showPathBadges={pathContext === undefined}
              activePathId={renderData.activeContext?.pathId}
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

        <PrevNext
          locale={locale}
          prev={renderData.prev}
          next={renderData.next}
          pathId={renderData.activeContext?.pathId}
        />
      </article>

      <aside className="hidden w-[200px] shrink-0 xl:block">
        <div className="sticky top-20 p-4">
          <TableOfContents headings={headings} label={t(locale as Locale, "onThisPage")} />
        </div>
      </aside>
    </>
  );
}
