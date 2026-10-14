"use client";

import { useSearchParams } from "next/navigation";
import { CoursePageContent, type CoursePageContentProps } from "./course-page-content";
import {
  EMPTY_COURSE_PATH_CLIENT_DATA,
  type CoursePathRenderData,
  resolveCoursePathClientRenderData,
  type CoursePathClientData,
} from "./course-path-nav";
import { useRuntimeCoursePathData } from "./use-runtime-course-path-data";

interface CoursePagePathContentProps extends Omit<CoursePageContentProps, "renderData" | "courseId"> {
  courseId: string;
  /**
   * Compact, per-page canonical chrome captured during static generation. It preserves this
   * course's prerequisite links and path badges after hydration without serializing the complete
   * locale catalog into every ordinary page.
   */
  canonicalRenderData: CoursePathRenderData;
  /** Static pages start empty; opted-in path navigation refreshes this after hydration. */
  pathData?: CoursePathClientData;
  fallbackPrev: CoursePageContentProps["renderData"]["prev"];
  fallbackNext: CoursePageContentProps["renderData"]["next"];
}

/**
 * Hydrated course-page chrome. `useSearchParams()` stays inside the route's
 * narrow Suspense boundary, preserving a static HTML fallback for every
 * generated content URL while retaining `?path=` navigation after hydration.
 */
export function CoursePagePathContent({
  courseId,
  canonicalRenderData,
  pathData = EMPTY_COURSE_PATH_CLIENT_DATA,
  fallbackPrev,
  fallbackNext,
  ...page
}: CoursePagePathContentProps) {
  const searchParams = useSearchParams();
  const hasPathContext = searchParams.has("path");
  const runtimePathData = useRuntimeCoursePathData(page.locale, pathData, hasPathContext);
  // A path-aware view must not briefly erase canonical prerequisite links/badges while its
  // optional client request is pending (or if it fails). Only a successful response may replace
  // the compact server-rendered canonical chrome.
  //
  // The "part of paths" badges are the one part a response may not replace: the statically served
  // page always carries the canonical badge list (it cannot see `?path=`), so a path-aware response
  // that blanks it (tech-docs/003's server-side rule) would remove the whole `PathCourseLinks`
  // block below the header and move every line under it (S8). The page-level rule in
  // `CoursePageContent` decides whether the block renders at all, and a course landing page keeps
  // its badges whatever the URL carries, so the canonical list is the right one in both renders.
  const runtimeRenderData =
    hasPathContext && runtimePathData.isReady
      ? {
          ...resolveCoursePathClientRenderData(
            searchParams,
            runtimePathData.data,
            courseId,
            fallbackPrev,
            fallbackNext,
          ),
          pathBadges: canonicalRenderData.pathBadges,
        }
      : null;
  // An invalid or omitted-course path context is still the canonical view. Keep its original
  // server-rendered links/badges rather than rebuilding a different fallback from runtime data.
  const renderData =
    runtimeRenderData?.activeContext === null ? canonicalRenderData : (runtimeRenderData ?? canonicalRenderData);

  return (
    <CoursePageContent
      {...page}
      courseId={courseId}
      renderData={renderData}
      // The provider resolves the path context from the URL itself (tech-docs/003 active path
      // rule), so the live `?path=` value has to reach it here rather than in the static shell.
      lesson={page.lesson === undefined ? undefined : { ...page.lesson, pathParam: searchParams.get("path") }}
    />
  );
}
