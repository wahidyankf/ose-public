"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import type { PathManifest } from "../core/schemas";
import {
  courseIdFromSlug,
  courseTitlesFromClientData,
  EMPTY_COURSE_PATH_CLIENT_DATA,
  type CoursePathClientData,
  resolveActiveCourseFromLocation,
  slugFromPathname,
} from "./course-path-nav";
import { PathRail } from "./path-rail";
import { useRuntimeCoursePathData } from "./use-runtime-course-path-data";

export interface SidebarHostProps {
  locale: string;
  pathData?: CoursePathClientData;
  /** Legacy test and integration props; runtime data supersedes them after hydration. */
  manifests?: readonly PathManifest[];
  courseTitles?: Readonly<Record<string, string>>;
  /** The pre-rendered fallback (today's `<Sidebar>`) — a Server Component's output, passed as `children`. */
  children: ReactNode;
}

/**
 * Content-swap host for `ResizableSidebar`'s `children` (course-paths plan, Cycle 2.8 — the
 * selected Screen 3 Option B).
 *
 * `ResizableSidebar` itself is never forked: its `<aside>`, `hidden … md:block` gate,
 * `ResizablePanel` 15%-35% band, resize handle, and persisted-width `localStorage` key are all
 * untouched (tech-docs.md §Screen 3) — only this one host's `children` decision changes.
 *
 * A layout receives neither `searchParams` nor a descendant route's `[...slug]` params (the App
 * Router constraint tech-docs.md documents), so this Client Component detects the active path
 * context itself via `usePathname()` + `useSearchParams()`, given `manifests` passed down as
 * props from the nearest Server ancestor that CAN do IO ((content)/layout.tsx).
 *
 * Renders the passed-through `children` (today's generic `<Sidebar>`) unchanged when there is no
 * active path context — the Cycle 2.10 invariant this component must never regress.
 */
export function SidebarHost(props: SidebarHostProps) {
  const pathname = usePathname();
  const slug = slugFromPathname(pathname, props.locale);
  if (slug === null || courseIdFromSlug(slug) === null) {
    return <>{props.children}</>;
  }

  return (
    <Suspense fallback={props.children}>
      <CourseSidebarHost {...props} />
    </Suspense>
  );
}

function CourseSidebarHost({
  locale,
  pathData,
  manifests = [],
  courseTitles: initialTitles,
  children,
}: SidebarHostProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const runtimePathData = useRuntimeCoursePathData(
    locale,
    pathData ?? { ...EMPTY_COURSE_PATH_CLIENT_DATA, manifests },
    searchParams.has("path"),
  );
  const courseTitles = initialTitles ?? courseTitlesFromClientData(runtimePathData.data);

  const active = resolveActiveCourseFromLocation(pathname, searchParams, locale, runtimePathData.data.manifests);

  if (!active) {
    return <>{children}</>;
  }

  return (
    <PathRail
      locale={locale}
      manifest={active.context.manifest}
      currentCourseId={active.courseId}
      courseTitles={courseTitles}
      outlineCourseIds={runtimePathData.data.outlineCourseIds}
    />
  );
}
