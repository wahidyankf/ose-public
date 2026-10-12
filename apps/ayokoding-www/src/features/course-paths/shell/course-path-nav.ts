import { normalizeCourseRef, type NormalizedCourseRef } from "../core/manifest";
import { parsePathContext } from "../core/path-context";
import { resolvePathNav, type PathNav } from "../core/path-nav";
import { resolvePrerequisites, type PrerequisitesByCourse } from "../core/prerequisites";
import type { PathManifest } from "../core/schemas";
import type { ContentMeta, PageLink } from "@/features/content/core/types";
import { LEARN_PATHS_PREFIX } from "./paths-route";

/** The content-slug prefix every course lives under — the one canonical course URL shape. */
const COURSE_SLUG_PREFIX = "learn/courses/";

/**
 * Extract a course ID from a content slug, or `null` when `slug` is not a course page.
 *
 * Pure — no IO. Path context only ever applies to course pages, so every caller uses this to scope
 * path-aware rendering to the pages where a `courseOrder` entry can possibly match.
 */
export function courseIdFromSlug(slug: string): string | null {
  return slug.startsWith(COURSE_SLUG_PREFIX) ? slug.slice(COURSE_SLUG_PREFIX.length) : null;
}

/** The canonical content slug for a course ID — the inverse of {@link courseIdFromSlug}. */
export function slugForCourseId(courseId: string): string {
  return `${COURSE_SLUG_PREFIX}${courseId}`;
}

/**
 * Normalize `manifest.courseOrder` to its object shape, in original order — the one ordering
 * helper `PathRail` and `PathLanding` (Cycle 3.1's REFACTOR note) both render from, so a manifest's
 * course sequence is never independently re-derived per renderer.
 *
 * Pure — no IO.
 */
export function manifestCourseOrder(manifest: PathManifest): NormalizedCourseRef[] {
  return manifest.courseOrder.map(normalizeCourseRef);
}

/** The resolved path context for a course page: which path, its manifest, and prev/next. */
export interface ActiveCoursePathContext {
  pathId: string;
  manifest: PathManifest;
  nav: PathNav;
}

/**
 * Resolve the active path context for `courseId` given `searchParams` and the loaded `manifests`.
 *
 * Returns `null` — the canonical-view signal — for every one of: no `?path=` present, a `?path=`
 * naming no loaded manifest (Cycle 2.6), and a valid path whose manifest omits `courseId` from its
 * `courseOrder` (Cycle 2.7). All three collapse onto the same branch by design (Cycle 2.6's
 * REFACTOR note): callers need exactly one `null` check, never three separate ones.
 *
 * Pure — no IO, never throws.
 */
export function resolveActiveCoursePathContext(
  searchParams: URLSearchParams,
  manifests: readonly PathManifest[],
  courseId: string,
): ActiveCoursePathContext | null {
  const pathId = parsePathContext(searchParams, manifests);
  if (pathId === null) {
    return null;
  }

  const manifest = manifests.find((candidate) => candidate.pathId === pathId);
  if (!manifest) {
    // Unreachable in practice — parsePathContext only returns a pathId present in `manifests` —
    // kept so this function is total over any (searchParams, manifests) pair, not just the ones
    // parsePathContext's own invariant currently guarantees.
    return null;
  }

  const isCourseInManifest = manifest.courseOrder.some((ref) => normalizeCourseRef(ref).id === courseId);
  if (!isCourseInManifest) {
    return null;
  }

  return { pathId, manifest, nav: resolvePathNav(manifest, courseId) };
}

/**
 * Resolve `courseId`'s canonical `PageLink` (title + slug) from a loaded content index's
 * `contentMap`, or `null` when no content page exists for it in `locale`.
 *
 * Pure — no IO. Shared by prerequisite-link and manifest-neighbour prev/next resolution so
 * neither re-implements the `contentMap` lookup key convention.
 */
export function pageLinkForCourseId(
  contentMap: ReadonlyMap<string, ContentMeta>,
  locale: string,
  courseId: string,
): PageLink | null {
  const meta = contentMap.get(`${locale}:${slugForCourseId(courseId)}`);
  return meta ? { title: meta.title, slug: meta.slug } : null;
}

/**
 * One prerequisite link — a plain {@link PageLink} that additionally carries the active `pathId`
 * only when the prerequisite's own course is a member of that active manifest's `courseOrder`
 * (EWT-002 fix, phase-5 rule-15 retest). Before this fix, every prerequisite link unconditionally
 * inherited the active `?path=`, even a declared-but-omitted prerequisite (OI-4's explicitly
 * supported "link-don't-walk" case) — misleading path-membership in the address bar for a course
 * that was never actually in that path, contradicting `prerequisite-display.feature`'s "canonical
 * URL" wording. `pathId` is `undefined` (never a falsy placeholder string) for a prerequisite
 * outside the active manifest, or when there is no active path context at all.
 */
export interface PrerequisiteLink extends PageLink {
  pathId?: string;
}

/** One path a course belongs to, as a renderable badge (Cycle 2.5's "part of paths" affordance). */
export interface PathBadge {
  pathId: string;
  title: string;
}

/**
 * Derive one {@link PathBadge} per loaded manifest whose `courseOrder` lists `courseId`, in
 * `manifests` order.
 *
 * Pure — no IO. Reads `manifests` once (Cycle 2.5's REFACTOR note) rather than being called once
 * per badge. A course ID shared by multiple manifests (the no-forked-body property) still yields
 * one badge per path — the course's canonical body slug ({@link slugForCourseId}) never varies by
 * path, only which paths list it.
 */
export function derivePathBadges(manifests: readonly PathManifest[], courseId: string): PathBadge[] {
  return manifests
    .filter((manifest) => manifest.courseOrder.some((ref) => normalizeCourseRef(ref).id === courseId))
    .map((manifest) => ({ pathId: manifest.pathId, title: manifest.title }));
}

/** The loaded, locale-scoped path data `<ROUTE>` needs to resolve a course page's path-aware render. */
export interface CoursePathData {
  contentMap: ReadonlyMap<string, ContentMeta>;
  manifests: readonly PathManifest[];
  prerequisitesByCourse: PrerequisitesByCourse;
  libraryCourseIds: readonly string[];
  /** Locale-independent outline course IDs (see `deriveOutlineCourseIds`) — the badge source. */
  outlineCourseIds: readonly string[];
}

/**
 * The serializable subset of {@link CoursePathData} a client-side course-page
 * chrome needs. `contentMap` deliberately becomes a plain course-ID lookup:
 * React Server Component props must not pass the server-side `Map`, while the
 * browser only needs each course's already-resolved title and slug.
 */
export interface CoursePathClientData {
  manifests: readonly PathManifest[];
  prerequisitesByCourse: PrerequisitesByCourse;
  libraryCourseIds: readonly string[];
  outlineCourseIds: readonly string[];
  courseLinks: Readonly<Record<string, PageLink>>;
}

/** Safe fallback while a statically generated page refreshes deployment data. */
export const EMPTY_COURSE_PATH_CLIENT_DATA: CoursePathClientData = {
  manifests: [],
  prerequisitesByCourse: {},
  libraryCourseIds: [],
  outlineCourseIds: [],
  courseLinks: {},
};

/** Convert route-loaded data into the safe prop shape used by client chrome. */
export function toCoursePathClientData(data: CoursePathData, locale: string): CoursePathClientData {
  const courseLinks: Record<string, PageLink> = {};
  for (const courseId of data.libraryCourseIds) {
    const link = pageLinkForCourseId(data.contentMap, locale, courseId);
    if (link) {
      courseLinks[courseId] = link;
    }
  }

  return {
    manifests: data.manifests,
    prerequisitesByCourse: data.prerequisitesByCourse,
    libraryCourseIds: data.libraryCourseIds,
    outlineCourseIds: data.outlineCourseIds,
    courseLinks,
  };
}

/**
 * Derive the path-rail title lookup from serializable client route data.
 *
 * This preserves {@link buildCourseTitleIndex}'s promise for manifest-only
 * course IDs. A statically generated client fallback can lack a content link
 * for such an ID, but the navigation chrome must still show a human-readable
 * title instead of the raw kebab-case identifier.
 */
export function courseTitlesFromClientData(data: CoursePathClientData): Readonly<Record<string, string>> {
  const courseIds = new Set<string>();
  for (const manifest of data.manifests) {
    for (const ref of manifest.courseOrder) {
      courseIds.add(normalizeCourseRef(ref).id);
    }
  }

  return Object.fromEntries(
    [...courseIds].map((courseId) => [courseId, data.courseLinks[courseId]?.title ?? humanizeKebabSlug(courseId)]),
  );
}

/** Everything `<ROUTE>` needs to render a course page's path-aware chrome, resolved in one call. */
export interface CoursePathRenderData {
  activeContext: ActiveCoursePathContext | null;
  prerequisiteLinks: readonly PrerequisiteLink[];
  pathBadges: readonly PathBadge[];
  prev: PageLink | null;
  next: PageLink | null;
}

/**
 * Resolve everything `<ROUTE>` needs to render a course page's path-aware chrome in one call: the
 * active path context (Cycles 2.6/2.7's fallback rules), the resolved prerequisite links (Cycle
 * 2.4 — path-independent, rendered in both views), the "part of paths" badges (Cycle 2.5 —
 * canonical branch only), and prev/next (Cycle 2.2 — manifest neighbours when a path is active,
 * `fallbackPrev`/`fallbackNext` unchanged otherwise).
 *
 * Pure — no IO, never throws. This is the **one place** that decides path-aware vs. canonical
 * (Cycle 2.6's REFACTOR note) — invalid, missing, and omitted-course contexts all converge on
 * `resolveActiveCoursePathContext`'s single `null` branch before this function ever runs its
 * path-aware logic.
 */
export function resolveCoursePathRenderData(
  searchParams: URLSearchParams,
  data: CoursePathData,
  courseId: string,
  locale: string,
  fallbackPrev: PageLink | null,
  fallbackNext: PageLink | null,
): CoursePathRenderData {
  const activeContext = resolveActiveCoursePathContext(searchParams, data.manifests, courseId);

  // EWT-002 fix: a prerequisite only inherits the active `?path=` when the prerequisite's own
  // course is ITSELF a member of that manifest's `courseOrder` — a declared-but-omitted
  // prerequisite (OI-4's link-don't-walk case) gets its plain canonical link instead, so the
  // address bar never claims path membership a course doesn't actually have.
  const activeManifestCourseIds = activeContext
    ? new Set(activeContext.manifest.courseOrder.map((ref) => normalizeCourseRef(ref).id))
    : null;

  const prerequisiteLinks: PrerequisiteLink[] = resolvePrerequisites(
    courseId,
    data.prerequisitesByCourse,
    data.libraryCourseIds,
  ).flatMap((id) => {
    const link = pageLinkForCourseId(data.contentMap, locale, id);
    if (!link) return [];
    const pathId = activeContext && activeManifestCourseIds?.has(id) ? activeContext.pathId : undefined;
    return [{ ...link, pathId }];
  });

  const pathBadges = activeContext === null ? derivePathBadges(data.manifests, courseId) : [];

  const prev = activeContext
    ? activeContext.nav.prev
      ? pageLinkForCourseId(data.contentMap, locale, activeContext.nav.prev.id)
      : null
    : fallbackPrev;

  const next = activeContext
    ? activeContext.nav.next
      ? pageLinkForCourseId(data.contentMap, locale, activeContext.nav.next.id)
      : null
    : fallbackNext;

  return { activeContext, prerequisiteLinks, pathBadges, prev, next };
}

/**
 * Client-side counterpart of {@link resolveCoursePathRenderData}. It keeps
 * `?path=` request state out of the statically rendered route while retaining
 * the identical path-aware navigation rules after hydration.
 */
export function resolveCoursePathClientRenderData(
  searchParams: URLSearchParams,
  data: CoursePathClientData,
  courseId: string,
  fallbackPrev: PageLink | null,
  fallbackNext: PageLink | null,
): CoursePathRenderData {
  const activeContext = resolveActiveCoursePathContext(searchParams, data.manifests, courseId);
  const activeManifestCourseIds = activeContext
    ? new Set(activeContext.manifest.courseOrder.map((ref) => normalizeCourseRef(ref).id))
    : null;

  const prerequisiteLinks: PrerequisiteLink[] = resolvePrerequisites(
    courseId,
    data.prerequisitesByCourse,
    data.libraryCourseIds,
  ).flatMap((id) => {
    const link = data.courseLinks[id];
    if (!link) return [];
    const pathId = activeContext && activeManifestCourseIds?.has(id) ? activeContext.pathId : undefined;
    return [{ ...link, pathId }];
  });

  const pathBadges = activeContext === null ? derivePathBadges(data.manifests, courseId) : [];
  const prev = activeContext
    ? activeContext.nav.prev
      ? (data.courseLinks[activeContext.nav.prev.id] ?? null)
      : null
    : fallbackPrev;
  const next = activeContext
    ? activeContext.nav.next
      ? (data.courseLinks[activeContext.nav.next.id] ?? null)
      : null
    : fallbackNext;

  return { activeContext, prerequisiteLinks, pathBadges, prev, next };
}

/**
 * Build a plain `courseId -> title` record covering every course ID that appears in any of
 * `manifests`' `courseOrder`. A course ID with no resolvable content page for `locale` (e.g. every
 * course under `id`, since course content is `en`-only per `brd.md`'s non-goal) still gets an
 * entry — {@link humanizeKebabSlug}`(id)` — rather than being omitted (DWT-004 fix, phase-5
 * rule-15 design-tester retest): before this fix, an unresolvable ID was silently absent from the
 * returned record, so callers' own `courseTitles[id] ?? id` fallback rendered the completely raw,
 * un-humanized slug (`"just-enough-bash"`) — the same defect class UWT-001 already fixed for arc/
 * role identifiers via this same humanization helper, just reached through a different fallback
 * path this function's own lookup didn't touch.
 *
 * Pure — no IO. Deliberately a plain `Record`, not a `Map`: `<APPSHELL>` server layouts pass this
 * to the client-side `SidebarHost`/`MobileNav` (Cycles 2.8/2.9), and a `Map` is not a safe RSC
 * prop shape, whereas a plain object always serializes across the server/client boundary.
 */
export function buildCourseTitleIndex(
  contentMap: ReadonlyMap<string, ContentMeta>,
  locale: string,
  manifests: readonly PathManifest[],
): Record<string, string> {
  const ids = new Set<string>();
  for (const manifest of manifests) {
    for (const ref of manifest.courseOrder) {
      ids.add(normalizeCourseRef(ref).id);
    }
  }

  const titles: Record<string, string> = {};
  for (const id of ids) {
    const link = pageLinkForCourseId(contentMap, locale, id);
    titles[id] = link ? link.title : humanizeKebabSlug(id);
  }
  return titles;
}

/**
 * Humanize a raw kebab-case slug segment (e.g. `"generalist-track"`) into a plain-language,
 * space-separated Title Case label (`"Generalist Track"`) — the last-resort fallback this plan's
 * arc/role identifiers use when no authored content title exists for them.
 *
 * Pure — no IO. UWT-001 fix (phase-5 rule-15 usability retest): before this, a raw arc/role slug
 * was rendered directly to readers in several places (the careers category-landing arc-card grid,
 * the hero path-card description, the arc-card role badges) even though a humanized rendering of
 * the identical identifier already existed elsewhere on the same screen (the content sidebar, the
 * arc-landing `<h1>`) — an internal-consistency break visible without navigating anywhere.
 */
export function humanizeKebabSlug(slug: string): string {
  return slug
    .split("-")
    .filter((word) => word.length > 0)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Build a plain `arc -> title` record for every careers arc slug in `arcs`, resolved from that
 * arc's own `_index.md` content title (the same authored title the content sidebar and the
 * arc-landing `<h1>` already render) — falling back to {@link humanizeKebabSlug} only when no
 * `_index.md` exists for that arc (every currently-shipped arc has one; this fallback exists so a
 * future arc added without its structural index page first still reads as plain language, never a
 * raw slug).
 *
 * Pure — no IO. UWT-001 fix (phase-5 rule-15 usability retest) — see {@link humanizeKebabSlug}'s
 * doc comment for the defect this closes.
 */
export function buildArcTitleIndex(
  contentMap: ReadonlyMap<string, ContentMeta>,
  locale: string,
  arcs: readonly string[],
): Record<string, string> {
  const titles: Record<string, string> = {};
  for (const arc of arcs) {
    const meta = contentMap.get(`${locale}:${LEARN_PATHS_PREFIX}/careers/${arc}`);
    titles[arc] = meta ? meta.title : humanizeKebabSlug(arc);
  }
  return titles;
}

/**
 * Strip a `/{locale}` prefix from a Next.js `usePathname()` value, yielding the bare content slug
 * `courseIdFromSlug` expects — or `null` when `pathname` does not start with that locale.
 *
 * Pure — no IO. Exists because two hosts structurally disconnected from `<ROUTE>` (`SidebarHost`,
 * `MobileNav` — Cycles 2.8/2.9) must independently derive "which course page am I on" client-side
 * via `usePathname()`, since a layout receives neither `searchParams` nor a descendant route's
 * `[...slug]` params.
 */
export function slugFromPathname(pathname: string, locale: string): string | null {
  const prefix = `/${locale}`;
  if (pathname === prefix) {
    return "";
  }
  if (!pathname.startsWith(`${prefix}/`)) {
    return null;
  }
  return pathname.slice(prefix.length + 1);
}

/** The course + active path context resolved from the current client-side location. */
export interface ActiveCourseLocation {
  courseId: string;
  context: ActiveCoursePathContext;
}

/**
 * Resolve "which course is the reader on, and is a path context active" purely from client-side
 * location primitives (`usePathname()` + `useSearchParams()`) — the composer `SidebarHost` and
 * `MobileNav` (Cycles 2.8/2.9) share, since both are structurally disconnected from `<ROUTE>`
 * (a layout receives neither `searchParams` nor a descendant route's `[...slug]` params).
 *
 * Returns `null` for a non-course pathname, a course with no active `?path=`, and every case
 * {@link resolveActiveCoursePathContext} itself returns `null` for (invalid path, omitted course).
 *
 * Pure — no IO, never throws.
 */
export function resolveActiveCourseFromLocation(
  pathname: string,
  searchParams: URLSearchParams,
  locale: string,
  manifests: readonly PathManifest[],
): ActiveCourseLocation | null {
  const slug = slugFromPathname(pathname, locale);
  if (slug === null) {
    return null;
  }

  const courseId = courseIdFromSlug(slug);
  if (courseId === null) {
    return null;
  }

  const context = resolveActiveCoursePathContext(searchParams, manifests, courseId);
  return context === null ? null : { courseId, context };
}

/** A course's 1-based position within a manifest's ordered arc, and the arc's total length. */
export interface CoursePosition {
  index: number;
  total: number;
}

/**
 * Resolve `courseId`'s 1-based position within `manifest.courseOrder`, and the manifest's total
 * course count — `PathBanner`'s "course k of N" readout (Cycle 2.9).
 *
 * Pure — no IO. Assumes `courseId` is a member of `manifest.courseOrder` (every caller reaches
 * this only after {@link resolveActiveCoursePathContext} has already confirmed membership);
 * returns `{ index: 0, total }` for a non-member rather than throwing, since this function's own
 * contract stays total even if a caller's invariant is ever violated.
 */
export function coursePositionInManifest(manifest: PathManifest, courseId: string): CoursePosition {
  const normalized = manifest.courseOrder.map(normalizeCourseRef);
  const index = normalized.findIndex((ref) => ref.id === courseId);
  return { index: index + 1, total: normalized.length };
}
