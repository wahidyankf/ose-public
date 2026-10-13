import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@open-sharia-enterprise/web-ui";
import { contentUrl } from "@/features/content/core/content-url";
import type { Locale } from "@/features/i18n/core/config";
import { t } from "@/features/i18n/core/translations";
import type { CourseHeaderData } from "./course-header-data";
import { CourseMetaRow } from "./course-meta-row";
import { PrerequisiteList } from "./prerequisite-list";
import { PathCourseLinks } from "./path-course-links";
import type { PathBadge, PrerequisiteLink } from "./course-path-nav";

/**
 * The course landing header (plan 03, S2 option A): description, meta row, Start button,
 * prerequisites, and the paths that use the course, above the contents list. Plan 04 fills
 * the `primaryAction` ("Continue") and `progress` slots without rebuilding this header.
 */
export interface CourseHeaderProps {
  locale: string;
  data: CourseHeaderData;
  prerequisites: readonly PrerequisiteLink[];
  pathBadges: readonly PathBadge[];
  showPathBadges: boolean;
  /** The active path id, kept on the Start link as `?path=` when present. */
  activePathId?: string;
  /** Plan 04: replaces the default Start button, for example with "Continue: <page>". */
  primaryAction?: ReactNode;
  /** Plan 04: course progress shown under the meta row. Renders nothing when absent. */
  progress?: ReactNode;
}

export function CourseHeader({
  locale,
  data,
  prerequisites,
  pathBadges,
  showPathBadges,
  activePathId,
  primaryAction,
  progress,
}: CourseHeaderProps) {
  const loc = locale as Locale;
  return (
    <header aria-label={t(loc, "courseHeaderLabel")} className="mb-8">
      {data.description ? <p className="text-lg text-muted-foreground">{data.description}</p> : null}
      <div className="mt-3">
        <CourseMetaRow
          locale={locale}
          format={data.format}
          estimatedHours={data.estimatedHours}
          isOutline={data.isOutline}
          categoryLabel={data.category ? t(loc, data.category.labelKey) : undefined}
        />
      </div>
      {progress}
      {primaryAction ??
        (data.startSlug ? (
          <StartCourseButton locale={locale} startSlug={data.startSlug} activePathId={activePathId} />
        ) : null)}
      <PrerequisiteList locale={locale} prerequisites={prerequisites} />
      {showPathBadges ? <PathCourseLinks locale={locale} paths={pathBadges} /> : null}
    </header>
  );
}

export function StartCourseButton({
  locale,
  startSlug,
  activePathId,
}: {
  locale: string;
  startSlug: string;
  activePathId?: string;
}) {
  const loc = locale as Locale;
  return (
    <div className="mt-4">
      <Button asChild className="w-full sm:w-auto">
        <Link href={contentUrl(loc, startSlug, activePathId)}>{t(loc, "courseStart")}</Link>
      </Button>
    </div>
  );
}
