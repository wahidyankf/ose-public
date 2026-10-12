"use client";

import type { MouseEvent } from "react";
import { useMobileNavOpen } from "@/features/app-shell/shell/use-mobile-nav-open";
import type { Locale } from "@/features/i18n/core/config";
import { t } from "@/features/i18n/core/translations";
import { formatTemplate } from "@/features/course-paths/shell/format-template";

/** Must match the `id` the shipped drawer's content element renders (`mobile-nav.tsx`). */
export const MOBILE_NAV_DRAWER_ID = "mobile-nav-drawer";

export interface PathBannerProps {
  locale: string;
  pathTitle: string;
  /** 1-based position of the current course within the path. */
  courseIndex: number;
  totalCourses: number;
}

/**
 * The compact "on path · course k of N" readout and its `md:hidden` disclosure trigger
 * (course-paths plan, Cycle 2.9) — `PathRail`'s mobile form, per DD-46: retained from the
 * originally-selected Option A, demoted to the rail's always-visible compact readout.
 *
 * Activating the trigger opens the **existing** left navigation drawer (`MobileNav`'s shipped
 * `Sheet`, opened via the same shared `open` state the header's hamburger-menu button controls)
 * rather than a second overlay — `aria-controls` names that drawer's content element.
 */
export function PathBanner({ locale, pathTitle, courseIndex, totalCourses }: PathBannerProps) {
  const { open, setOpen } = useMobileNavOpen();

  function handleActivate(event: MouseEvent<HTMLButtonElement>) {
    // Pass the trigger explicitly — WebKit does not focus a clicked `<button>` by default, unlike
    // Chromium/Firefox, so `document.activeElement` alone is not a reliable stand-in here (see
    // `use-mobile-nav-open.ts`).
    setOpen(true, event.currentTarget);
  }

  return (
    <div className="mt-4 flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm md:hidden">
      <span>
        {t(locale as Locale, "pathsOnPathPrefix")} · {t(locale as Locale, "pathsCourseWordLower")} {courseIndex}{" "}
        {t(locale as Locale, "pathsOfWord")} {totalCourses}
      </span>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={MOBILE_NAV_DRAWER_ID}
        // UWT-002: the accessible name localizes like the visible trigger text (WCAG 2.5.3 keeps
        // the visible "View path"/"Lihat jalur" label as the name's prefix); the path title is
        // course data and stays as-is.
        aria-label={formatTemplate(t(locale as Locale, "pathsViewPathLabel"), {
          pathTitle,
          courseIndex,
          totalCourses,
        })}
        onClick={handleActivate}
        className="flex min-h-11 items-center px-2 font-medium underline underline-offset-2 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {t(locale as Locale, "pathsViewPath")}
      </button>
    </div>
  );
}
