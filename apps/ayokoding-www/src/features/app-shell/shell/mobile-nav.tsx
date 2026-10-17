"use client";

import Link from "next/link";
import {
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  parsePersistedWidth,
} from "@open-sharia-enterprise/web-ui/primitives";
import { SidebarTree } from "@/features/navigation/shell/sidebar-tree";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { TreeNode } from "@/features/content/core/types";
import { trpcClient } from "@/lib/trpc/client";
import { t } from "@/features/i18n/core/translations";
import type { Locale } from "@/features/i18n/core/config";
import { PRIMARY_NAV_LINKS } from "@/features/app-shell/core/nav-links";
import { resolveActiveCourseFromLocation } from "@/features/course-paths/shell/course-path-nav";
import {
  courseTitlesFromClientData,
  EMPTY_COURSE_PATH_CLIENT_DATA,
  type CoursePathClientData,
} from "@/features/course-paths/shell/course-path-nav";
import { PathRail } from "@/features/course-paths/shell/path-rail";
import { MOBILE_NAV_DRAWER_ID } from "@/features/course-paths/shell/path-banner";
import type { PathManifest } from "@/features/course-paths/core/schemas";
import { useMobileNavOpen } from "@/features/app-shell/shell/use-mobile-nav-open";
import { useRuntimeCoursePathData } from "@/features/course-paths/shell/use-runtime-course-path-data";

interface MobileNavProps {
  locale: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Course-paths plan (Cycle 2.9) — optional/additive so every pre-existing call site (that
  // renders no path chrome) stays valid unchanged.
  pathData?: CoursePathClientData;
  /** Legacy test and integration props; runtime data supersedes them after hydration. */
  manifests?: readonly PathManifest[];
  courseTitles?: Readonly<Record<string, string>>;
}

/**
 * `localStorage` key under which the mobile drawer's chosen preset width is
 * persisted (DD-7 — preset widths, not free drag, on an overlay drawer).
 */
const MOBILE_NAV_WIDTH_STORAGE_KEY = "ayokoding-mobilenav-width";

/**
 * The mobile nav drawer's fixed preset widths. Replaces the previously
 * hardcoded `w-[280px]` with a default and a wider preset the reader can
 * pick from — see prd.md's "Mobile drawer preset widths" scenario / DD-7.
 */
const MOBILE_NAV_WIDTH_PRESETS = [
  { id: "default", labelKey: "mobileNavWidthDefault", widthPx: 280 },
  { id: "wide", labelKey: "mobileNavWidthWide", widthPx: 360 },
] as const;

export function MobileNav({
  locale,
  open,
  onOpenChange,
  pathData,
  manifests = [],
  courseTitles: initialTitles,
}: MobileNavProps) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [widthPx, setWidthPx] = useState<number>(MOBILE_NAV_WIDTH_PRESETS[0].widthPx);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const runtimePathData = useRuntimeCoursePathData(
    locale,
    pathData ?? { ...EMPTY_COURSE_PATH_CLIENT_DATA, manifests },
    open || searchParams.has("path"),
  );
  const courseTitles = initialTitles ?? courseTitlesFromClientData(runtimePathData.data);
  // Cycle 3.4 — the control that opened this drawer (header menu button or `PathBanner`'s "View
  // path" button) is a plain, context-driven trigger, not a `Dialog.Trigger`, so Radix's own
  // close-focus restoration never applies (see `use-mobile-nav-open.ts`). Restore it ourselves.
  const { lastTriggerRef } = useMobileNavOpen();

  // A layout receives neither `searchParams` nor a descendant route's `[...slug]` params, so
  // MobileNav (hosted from `[locale]/layout.tsx` via `Header`, structurally disconnected from
  // `<ROUTE>`) detects the active path context itself — the same client-side pattern
  // `SidebarHost` uses for the desktop rail (Cycle 2.8).
  const active = resolveActiveCourseFromLocation(pathname, searchParams, locale, runtimePathData.data.manifests);

  // Mount-effect read of the persisted preset width — mirrors the pattern
  // `useResizableWidth` (libs/web-ui) uses for the desktop rail. Only one of
  // the two declared presets is accepted; a stale/tampered value (there is no
  // free-drag range to clamp into here) falls back to the default preset.
  useEffect(() => {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(MOBILE_NAV_WIDTH_STORAGE_KEY);
    } catch {
      raw = null;
    }
    const persisted = parsePersistedWidth(raw);
    const isValidPreset = MOBILE_NAV_WIDTH_PRESETS.some((preset) => preset.widthPx === persisted);
    if (isValidPreset) {
      setWidthPx(persisted as number);
    }
  }, []);

  useEffect(() => {
    if (open && tree.length === 0) {
      trpcClient.content.getTree.query({ locale: locale as "en" | "id" }).then((data) => {
        const raw = data as TreeNode[];
        // Skip the root locale node (e.g., "English Content") — mirror desktop Sidebar behaviour
        const rootNode = raw.find((n) => n.slug === "");
        setTree(rootNode ? rootNode.children : raw);
      });
    }
  }, [open, locale, tree.length]);

  function selectPreset(presetWidthPx: number) {
    setWidthPx(presetWidthPx);
    try {
      localStorage.setItem(MOBILE_NAV_WIDTH_STORAGE_KEY, String(presetWidthPx));
    } catch {
      // Storage can be blocked; the preset still applies for this session.
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        id={MOBILE_NAV_DRAWER_ID}
        side="left"
        className="overflow-y-auto p-4"
        style={{ width: `${widthPx}px` }}
        // EWT-003 fix (phase-8 rule-15 retest): the drawer intentionally has no description
        // element, so pass `undefined` explicitly — Radix otherwise logs a misleading
        // "Missing 'Description' or 'aria-describedby'" warning on every open.
        aria-describedby={undefined}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          lastTriggerRef.current?.focus();
        }}
      >
        <SheetHeader>
          <SheetTitle className="text-left text-lg font-bold">
            {active ? active.context.manifest.title : "AyoKoding"}
          </SheetTitle>
          <fieldset className="m-0 mb-2 border-0 p-0">
            <legend className="mb-1 block text-xs font-medium text-muted-foreground">
              {t(locale as Locale, "mobileNavWidthLabel")}
            </legend>
            {/* UWT-005 fix (phase-5 rule-15 retest): ties this control to a concrete, real
                benefit — a first-time reader had no way to know why they'd want a wider drawer. */}
            <p className="mb-1 text-xs text-muted-foreground">{t(locale as Locale, "mobileNavWidthHint")}</p>
            <div className="flex items-center gap-1">
              {MOBILE_NAV_WIDTH_PRESETS.map((preset) => (
                <Button
                  key={preset.id}
                  type="button"
                  variant={widthPx === preset.widthPx ? "secondary" : "outline"}
                  size="xs"
                  className="min-h-11 min-w-11"
                  aria-pressed={widthPx === preset.widthPx}
                  onClick={() => selectPreset(preset.widthPx)}
                >
                  {t(locale as Locale, preset.labelKey)}
                </Button>
              ))}
            </div>
          </fieldset>
        </SheetHeader>
        {active ? (
          /* UWT-008 fix (phase-8 rule-15 retest): a rail row pick must close the drawer, the way
             the primary-navigation links below already do — the capture handler closes on any link
             activation (mouse click or keyboard Enter) inside the rail. */
          <div
            onClickCapture={(event) => {
              if ((event.target as HTMLElement).closest("a")) {
                onOpenChange(false);
              }
            }}
          >
            <PathRail
              locale={locale}
              manifest={active.context.manifest}
              currentCourseId={active.courseId}
              courseTitles={courseTitles}
              outlineCourseIds={runtimePathData.data.outlineCourseIds}
            />
          </div>
        ) : (
          <nav className="mt-4" aria-label="Mobile navigation">
            <p className="px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Menu</p>
            <ul className="mt-2 mb-4 space-y-1">
              {PRIMARY_NAV_LINKS.map((link) => (
                <li key={link.labelKey}>
                  <Link
                    href={link.hrefFor(locale as Locale)}
                    onClick={() => onOpenChange(false)}
                    className="flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    {t(locale as Locale, link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
            <SidebarTree nodes={tree} locale={locale} />
          </nav>
        )}
      </SheetContent>
    </Sheet>
  );
}
