import Link from "next/link";
import { contentUrl } from "@/features/content/core/content-url";
import type { Locale } from "@/features/i18n/core/config";
import { t } from "@/features/i18n/core/translations";
import { humanizeKebabSlug, slugForCourseId } from "./course-path-nav";

export interface AssumedCoursesProps {
  locale: string;
  /** The manifest's `assumes` — every outside prerequisite of the core, in manifest order. */
  assumes: readonly string[];
  /**
   * Assumed-course titles by course ID. `assumes` IDs sit outside the manifest's `courseOrder`,
   * so the landing's `courseTitles` index never covers them — the caller resolves these from the
   * content map instead. An ID with no entry falls back to its humanized slug, never a raw slug.
   */
  courseTitles: Readonly<Record<string, string>>;
}

/**
 * The "Before you start" note (plan ayokoding-learn-revamp-02-path-model, Phase 4, FR-7) — a
 * bordered note listing every assumed course as a link to its canonical course URL (no `?path=`:
 * an assumed course is background, not a member of this path).
 *
 * Pure — no IO. Returns `null` when `assumes` is empty; the caller additionally guards so the
 * note never renders for a path that assumes nothing.
 */
export function AssumedCourses({ locale, assumes, courseTitles }: AssumedCoursesProps) {
  if (assumes.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 rounded-lg border border-border p-4">
      <h2 className="text-sm font-semibold tracking-wide uppercase">{t(locale as Locale, "pathsBeforeYouStart")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t(locale as Locale, "pathsAssumesIntro")}</p>
      <ul className="mt-2 space-y-1">
        {assumes.map((courseId) => (
          <li key={courseId}>
            <Link
              href={contentUrl(locale as Locale, slugForCourseId(courseId))}
              className="rounded-md px-2 py-1 text-sm text-primary underline underline-offset-2 hover:bg-accent hover:text-foreground"
            >
              {courseTitles[courseId] ?? humanizeKebabSlug(courseId)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
