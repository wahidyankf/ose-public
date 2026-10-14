import Link from "next/link";
import { contentUrl } from "@/features/content/core/content-url";
import type { Locale } from "@/features/i18n/core/config";
import { CourseMetaRow } from "./course-meta-row";
import { CourseCardStatus } from "./course-card-status";
import { PathPositionNumber } from "./path-position-number";
import { slugForCourseId } from "./course-path-nav";

/** Everything one roadmap course card needs about the course itself (built on the server). */
export interface RoadmapCourseData {
  title: string;
  /** Plan 03's `format` frontmatter, absent for an outline course. */
  format?: string;
  /** Plan 03's `estimatedHours` frontmatter, absent for an outline course. */
  estimatedHours?: number;
  /** True for a course whose frontmatter declares `status: outline` — shows `OutlineBadge`. */
  isOutline: boolean;
}

export interface RoadmapCourseCardProps {
  locale: string;
  /** The owning manifest's path ID — the card's link carries it as `?path=`. */
  pathId: string;
  /** The course's 1-based position in the path (plan 01's numbering, continued across phases). */
  position: number;
  courseId: string;
  data: RoadmapCourseData;
  /** The course's lesson page paths, so its status can be counted without stale pages. */
  sequence: readonly string[];
  /**
   * Whether the plan 03 meta row (format and "About N h", or the Outline badge) renders. False in
   * the pending-restructure flat list, which keeps plan 01's numbering and plan 02's copy alone
   * (S26).
   */
  showMeta?: boolean;
}

/**
 * One course in the roadmap (plan ayokoding-learn-revamp-04, Phase 4, Screen 1 option A): plan 01's
 * position number, the title as the card's only link, plan 03's `CourseMetaRow`, and the client
 * `CourseCardStatus` in a fixed-height slot.
 *
 * The title link carries `after:absolute after:inset-0` while the row is `relative`, so the whole
 * card is clickable without a second link or a nested interactive element, and the link's
 * accessible name stays exactly the course title (WCAG 2.5.3). Pure except for the status slot; no
 * IO.
 */
export function RoadmapCourseCard({
  locale,
  pathId,
  position,
  courseId,
  data,
  sequence,
  showMeta = true,
}: RoadmapCourseCardProps) {
  return (
    <li className="relative flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border px-3 py-2">
      <PathPositionNumber position={position} />
      <h4 className="min-w-0 text-sm font-semibold">
        <Link
          href={contentUrl(locale as Locale, slugForCourseId(courseId), pathId)}
          className="rounded-md underline underline-offset-2 after:absolute after:inset-0 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {data.title}
        </Link>
      </h4>
      {showMeta ? (
        <CourseMetaRow
          locale={locale}
          format={data.format}
          estimatedHours={data.estimatedHours}
          isOutline={data.isOutline}
        />
      ) : null}
      <span className="ml-auto">
        <CourseCardStatus locale={locale} courseId={courseId} sequence={sequence} />
      </span>
    </li>
  );
}
