import { cache } from "react";
import { createTRPCContext } from "@/features/app-shell/shell/trpc-init";
import { buildCourseLibrary, deriveAllCourseIds, deriveOutlineCourseIds } from "./course-library";
import { defaultManifestsDir, loadManifests } from "./manifest-repository";
import type { CoursePathData } from "./course-path-nav";

/**
 * Load everything `<ROUTE>` needs to resolve a course page's path-aware chrome: the content
 * index's `contentMap` (for prev/next + prerequisite link title/slug lookups), the derived course
 * library (known course IDs + declared prerequisites, scoped to `locale`), and every loaded
 * manifest, validated against that library.
 *
 * IO lives entirely here (`shell/`) — the returned {@link CoursePathData} feeds the pure
 * `resolveCoursePathRenderData` composer, which performs no IO of its own.
 *
 * Manifest-integrity checking (`loadManifests`) is validated against `deriveAllCourseIds`'s
 * locale-independent course-ID list, not the locale-scoped `libraryCourseIds` — a manifest is
 * locale-independent navigational metadata, so a course whose translation into `locale` has not
 * shipped yet must not make every content page in `locale` fail to render. `libraryCourseIds` stays
 * locale-scoped for prerequisite-link rendering, which must only link to a page that truly exists in
 * `locale`.
 *
 * Wrapped in `React.cache()` (request-scoped memoization keyed on `locale`) — this is called from
 * 4+ independent RSC boundaries per request (root layout, content layout, `[...slug]/page.tsx`
 * up to twice, home page), and without memoization each boundary would re-glob + re-validate every
 * manifest under `manifests/` independently. `React.cache()` is a plain pass-through outside the
 * `react-server` bundling condition (see `react/cjs/react.development.js`), so this is a no-op in
 * Vitest/Node — this file's own unit tests still observe one `loadManifests` call per
 * `loadRoutePathData` call, unaffected.
 */
export const loadRoutePathData = cache(async function loadRoutePathData(locale: string): Promise<CoursePathData> {
  const { contentService } = createTRPCContext();
  const index = await contentService.getIndex();
  const { libraryCourseIds, prerequisitesByCourse } = buildCourseLibrary(index.contentMap, locale);
  const allCourseIds = deriveAllCourseIds(index.contentMap);
  const manifests = await loadManifests(defaultManifestsDir(), allCourseIds);
  const outlineCourseIds = deriveOutlineCourseIds(index.contentMap);

  return { contentMap: index.contentMap, manifests, prerequisitesByCourse, libraryCourseIds, outlineCourseIds };
});
