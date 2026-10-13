import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { serverCaller } from "@/lib/trpc/server";
import { isValidLocale, type Locale } from "@/features/i18n/core/config";
import { t } from "@/features/i18n/core/translations";
import { contentUrl } from "@/features/content/core/content-url";
import { slugFromSegments } from "@/features/content/core/slug";
import { TRPCError } from "@trpc/server";
import { createTRPCContext } from "@/features/app-shell/shell/trpc-init";
import {
  courseIdFromSlug,
  resolveCoursePathRenderData,
  buildCourseTitleIndex,
  buildArcTitleIndex,
  pageLinkForCourseId,
  humanizeKebabSlug,
} from "@/features/course-paths/shell/course-path-nav";
import { loadRoutePathData } from "@/features/course-paths/shell/route-path-data";
import { CoursePageContent } from "@/features/course-paths/shell/course-page-content";
import { CoursePagePathContent } from "@/features/course-paths/shell/course-page-path-content";
import {
  isLearnPathsSlug,
  resolvePathsRoute,
  groupCareersManifestsByArc,
  skillsManifests,
  manifestsForArc,
  LEARN_PATHS_PREFIX,
} from "@/features/course-paths/shell/paths-route";
import { PathCard, CategorySection, ArcGroup } from "@/features/course-paths/shell/path-card";
import { COURSE_CATALOG_SLUG, courseRootIdFromSlug } from "@/features/course-paths/shell/course-path-nav";
import { buildCourseCatalog } from "@/features/course-paths/core/course-catalog";
import { CourseCatalog } from "@/features/course-paths/shell/course-catalog";
import { buildCourseHeaderData } from "@/features/course-paths/shell/course-header-data";
import { CategoryLanding } from "@/features/course-paths/shell/category-landing";
import { ArcLanding } from "@/features/course-paths/shell/arc-landing";
import { PathLanding } from "@/features/course-paths/shell/path-landing";
import { EmptyPathListState } from "@/features/course-paths/shell/empty-path-list-state";

/**
 * Course-path landing pages may use deployment-provided manifests, so their
 * unknown-at-build-time routes remain on demand while enumerated content stays
 * statically generated.
 */
export const dynamicParams = true;

export async function generateStaticParams({ params }: { params: { locale: string } }) {
  // Widened (DD-48 de-namespacing): this catch-all now serves the ENTIRE
  // content tree, not just the per-locale loose top-level pages — the merged
  // route absorbed this generateStaticParams from the retired c/[...slug]
  // route. Every content-tree slug, including the two loose pages
  // (about-ayokoding/terms-and-conditions for en, tentang-ayokoding/
  // syarat-dan-ketentuan for id), is already a member of index.contentMap
  // (readAllContent globs every .md under the locale's content dir with no
  // loose-page exclusion — verified at delivery time, apps/ayokoding-www/src/
  // features/content/shell/reader.ts + service.ts's buildContentIndex), so
  // one enumeration covers both without a separate LOOSE_PAGE_ALLOWLIST
  // union. LOOSE_PAGE_ALLOWLIST and isLoosePage() are therefore removed
  // entirely (content-url.ts) rather than kept for this call site.
  // (The locale root "" / "_index" is served by app/[locale]/page.tsx, not
  // this catch-all.)
  if (!isValidLocale(params.locale)) return [];

  const { contentService } = createTRPCContext();
  const index = await contentService.getIndex();
  const slugs: { slug: string[] }[] = [];

  for (const [key, meta] of index.contentMap) {
    if (!key.startsWith(`${params.locale}:`)) continue;
    if (meta.slug === "") continue;
    if (isLearnPathsSlug(meta.slug)) continue;
    slugs.push({ slug: meta.slug.split("/") });
  }

  return slugs;
}

interface Props {
  params: Promise<{ locale: string; slug: string[] }>;
}

/**
 * True when the slug's first segment under a locale's "learn" bucket is
 * "legacy" — i.e. one of the six relocated subject domains (DD-42). Used to
 * apply the Screen-4 design funnel's Option C treatment: noindex the whole
 * legacy bucket rather than an in-page landing-notice component, so search
 * engines stop ranking the older subject-organized material above the
 * course library while still crawling its internal links (follow: true).
 */
function isLegacySlug(slug: string[]): boolean {
  return slug[0] === "learn" && slug[1] === "legacy";
}

export async function generateMetadata({ params }: { params: Props["params"] }): Promise<Metadata> {
  const { locale, slug } = await params;
  const slugStr = slugFromSegments(slug);

  try {
    const page = await serverCaller.content.getBySlug({
      locale: locale as Locale,
      slug: slugStr,
    });

    return {
      title: page.title,
      description: page.description ?? undefined,
      alternates: {
        canonical: contentUrl(locale as Locale, slugStr),
        languages: {
          en: contentUrl("en", slugStr),
          "x-default": contentUrl("en", slugStr),
        },
      },
      openGraph: {
        title: page.title,
        description: page.description ?? undefined,
        type: "article",
        locale: locale === "id" ? "id_ID" : "en_US",
      },
      ...(isLegacySlug(slug) ? { robots: { index: false, follow: true } } : {}),
    };
  } catch {
    // A terminal path landing (e.g. `careers/<arc>/<role>`) has no `_index.md` of its own — its
    // title comes from the loaded manifest instead, best-effort, rather than a bare "Not Found".
    if (isLearnPathsSlug(slugStr)) {
      const pathData = await loadRoutePathData(locale);
      const resolution = resolvePathsRoute(slugStr, pathData.manifests);
      if (resolution.kind === "path") {
        return { title: resolution.manifest.title, description: resolution.manifest.description };
      }
      // A careers arc (`learn/paths/careers/<arc>`) has no `_index.md` of its own — it is a
      // synthetic grouping derived from manifest data, not a real content page — so `getBySlug`
      // always rejects for it, including the deliberately-empty "no manifests published yet" arc
      // state. That render is a normal 200 page (`ArcLanding`'s empty-state branch), so its title
      // must not read as an error; mirror the page body's own `resolution.arc` fallback (Cycle
      // 3.1a's `<h1>{seoPage?.title ?? resolution.arc}</h1>`) rather than falling through to a bare
      // "Not Found" (a real defect found live via Playwright MCP at phase-5 manual verification).
      // A bogus arc segment (no real `_index.md`, hence this catch, and no loaded manifest) must
      // not get a synthesized title — falls through to the shared "Not Found" below instead. A real
      // arc always has an `_index.md` (see the three `careers/<arc>/_index.md` content files), so
      // `getBySlug` succeeds in the `try` above and this branch is reached only for a bogus arc, or
      // (in principle) a genuine arc whose `_index.md` was removed but its manifests remain — the
      // `arcManifests.length > 0` check still recovers a title in that edge case.
      if (resolution.kind === "arc") {
        const arcManifests = manifestsForArc(pathData.manifests, resolution.arc);
        if (arcManifests.length > 0) {
          return { title: resolution.arc };
        }
      }
    }
    return { title: "Not Found" };
  }
}

/**
 * The `learn/paths/**` namespace's render dispatch (course-paths plan, Phase 3) — hub (Screen 1),
 * category landing (Screen 1a), arc landing (Screen 1b, careers-only), or terminal path landing
 * (Screen 2). Returns `null` for `{ kind: "not-found" }`, and also for a `{ kind: "arc" }`
 * resolution that names no real arc (no matching manifest AND no real `_index.md`), so the caller
 * falls through to the standard canonical content-page render (which itself 404s for a genuinely
 * nonexistent slug).
 */
async function renderPathsRoute(locale: string, slugStr: string) {
  const pathData = await loadRoutePathData(locale);
  const resolution = resolvePathsRoute(slugStr, pathData.manifests);

  if (resolution.kind === "not-found") {
    return null;
  }

  const courseTitles = buildCourseTitleIndex(pathData.contentMap, locale, pathData.manifests);

  // Best-effort SEO/body content from this route's own `_index.md`, when one exists — every
  // careers `_index.md` (hub/category/arc roots) already exists; a terminal path's `_index.md` may
  // not (Cycle 3.1d's careers no-regression clause: silent no-op when absent).
  let seoPage: { title: string; description?: string | null; html: string } | null = null;
  try {
    seoPage = await serverCaller.content.getBySlug({ locale: locale as Locale, slug: slugStr });
  } catch (err) {
    if (!(err instanceof TRPCError && err.code === "NOT_FOUND")) {
      throw err;
    }
  }

  if (resolution.kind === "hub") {
    const careersArcGroups = groupCareersManifestsByArc(pathData.manifests);
    const skills = skillsManifests(pathData.manifests);
    // Reuses the same humanized-arc-title resolution the careers category landing already uses
    // (UWT-001 fix) — closes the adjacent gap where this hub's own `<h3>` arc sub-heading still
    // rendered the raw kebab-case `arc` slug (e.g. `"immediately-effective"`) verbatim.
    const arcTitles = buildArcTitleIndex(
      pathData.contentMap,
      locale,
      careersArcGroups.map(({ arc }) => arc),
    );

    return (
      <section className="mx-auto max-w-6xl flex-1 px-6 py-8 lg:px-8">
        <h1 className="text-4xl font-extrabold tracking-tight">{seoPage?.title ?? "Paths"}</h1>
        <p className="mt-2 text-muted-foreground">{seoPage?.description ?? "Choose your path."}</p>

        <CategorySection id="careers" heading="Careers" strapline="A focused core for your goal, then optional depth">
          {careersArcGroups.length === 0 ? (
            <EmptyPathListState
              fallbackHref={contentUrl(locale as Locale, `${LEARN_PATHS_PREFIX}/skills`)}
              fallbackLabel="Skills"
            />
          ) : (
            careersArcGroups.map(({ arc, manifests: arcManifests }) => (
              <ArcGroup key={arc} arc={arc} arcTitle={arcTitles[arc]}>
                {arcManifests.map((manifest) => (
                  <li key={manifest.pathId}>
                    <PathCard locale={locale} manifest={manifest} context="hub" />
                  </li>
                ))}
              </ArcGroup>
            ))
          )}
        </CategorySection>

        <CategorySection id="skills" heading="Skills" strapline="Up and running fast, then deeper and deeper">
          {skills.length === 0 ? (
            <EmptyPathListState
              fallbackHref={contentUrl(locale as Locale, `${LEARN_PATHS_PREFIX}/careers`)}
              fallbackLabel="Careers"
            />
          ) : (
            <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {skills.map((manifest) => (
                <li key={manifest.pathId}>
                  <PathCard locale={locale} manifest={manifest} context="hub" showCourseCount={false} />
                </li>
              ))}
            </ul>
          )}
        </CategorySection>

        <Link
          href={`/${locale}/browse`}
          className="mt-6 inline-flex text-sm text-muted-foreground hover:text-foreground"
        >
          {t(locale as Locale, "pathsBrowseCourseLibrary")} →
        </Link>
      </section>
    );
  }

  if (resolution.kind === "category") {
    return (
      <section className="mx-auto max-w-6xl flex-1 px-6 py-8 lg:px-8">
        <h1 className="text-4xl font-extrabold tracking-tight">
          {seoPage?.title ?? (resolution.category === "careers" ? "Careers" : "Skills")}
        </h1>
        <p className="mt-2 text-muted-foreground">{seoPage?.description ?? ""}</p>
        <CategoryLanding
          locale={locale}
          category={resolution.category}
          manifests={pathData.manifests}
          contentMap={pathData.contentMap}
        />
      </section>
    );
  }

  if (resolution.kind === "arc") {
    const arcManifests = manifestsForArc(pathData.manifests, resolution.arc);
    // Reject an arc segment that is neither a real content page (`seoPage === null`, i.e. no
    // `careers/<arc>/_index.md`) nor a published manifest grouping (`arcManifests.length === 0`) —
    // an arbitrary string like `careers/asdkjhasdkjh` would otherwise fall into this branch (see
    // `resolvePathsRoute`'s doc comment: it is pure/no-IO and cannot itself validate the arc) and
    // render a fake 200 with a synthesized `<h1>` and an empty-state body. The three real arcs each
    // have a real `_index.md`, so `seoPage` is non-null for them and this check never rejects a
    // genuine arc, including the deliberate "no manifests published yet" empty state.
    if (arcManifests.length === 0 && seoPage === null) {
      return null;
    }
    return (
      <section className="mx-auto max-w-6xl flex-1 px-6 py-8 lg:px-8">
        <h1 className="text-4xl font-extrabold tracking-tight">{seoPage?.title ?? resolution.arc}</h1>
        <p className="mt-2 text-muted-foreground">{seoPage?.description ?? ""}</p>
        <ArcLanding locale={locale} arc={resolution.arc} manifests={arcManifests} courseTitles={courseTitles} />
      </section>
    );
  }

  // Assumed-course titles for the landing's "Before you start" note — `assumes` IDs sit
  // outside the manifest's `courseOrder`, so `courseTitles` never covers them; resolve each
  // from the content map, falling back to a humanized slug (never a raw slug) when the course
  // has no page in this locale.
  const assumedCourseTitles: Record<string, string> = {};
  for (const courseId of resolution.manifest.assumes) {
    const link = pageLinkForCourseId(pathData.contentMap, locale, courseId);
    assumedCourseTitles[courseId] = link ? link.title : humanizeKebabSlug(courseId);
  }

  return (
    <PathLanding
      locale={locale}
      manifest={resolution.manifest}
      courseTitles={courseTitles}
      bodyHtml={seoPage?.html}
      outlineCourseIds={pathData.outlineCourseIds}
      assumedCourseTitles={assumedCourseTitles}
    />
  );
}

export default async function ContentPage({ params }: Props) {
  const { locale, slug } = await params;
  const slugStr = slugFromSegments(slug);

  // The `learn/paths/**` namespace (hub, category, arc, terminal path landings) dispatches to its
  // own renderers before the standard content-page fetch below — `renderPathsRoute` returns `null`
  // for `{ kind: "not-found" }` (an unrecognized segment, or a terminal segment naming no loaded
  // manifest), in which case this falls through to the standard render unchanged.
  if (isLearnPathsSlug(slugStr)) {
    const rendered = await renderPathsRoute(locale, slugStr);
    if (rendered !== null) {
      return rendered;
    }
  }

  let page;
  try {
    page = await serverCaller.content.getBySlug({
      locale: locale as Locale,
      slug: slugStr,
    });
  } catch (err) {
    if (err instanceof TRPCError && err.code === "NOT_FOUND") {
      notFound();
    }
    throw err;
  }

  // Course path chrome is client-resolved so this statically generated route
  // never reads request query state. The Suspense fallback below is the same
  // canonical render a reader receives without `?path=`.
  const courseId = courseIdFromSlug(slugStr);
  const breadcrumbSegments = buildBreadcrumbs(locale, slugStr, page.title);
  const canonicalRenderData =
    courseId === null
      ? { activeContext: null, prerequisiteLinks: [], pathBadges: [], prev: page.prev, next: page.next }
      : resolveCoursePathRenderData(
          new URLSearchParams(),
          await loadRoutePathData(locale),
          courseId,
          locale,
          page.prev,
          page.next,
        );
  const contentProps = {
    locale,
    slug: slugStr,
    title: page.title,
    html: page.html,
    headings: page.headings,
    date: page.date ?? undefined,
    breadcrumbSegments,
  };

  // The catalog (plan 03): the courses section renders from course metadata, not from the
  // generated _index.md body (which the generator now keeps frontmatter-only). Checked before
  // the `courseId === null` early return because `courseIdFromSlug("learn/courses")` is null
  // (the slug is the section itself, not a course root).
  if (slugStr === COURSE_CATALOG_SLUG) {
    const catalogData = await loadRoutePathData(locale);
    return (
      <CourseCatalog
        locale={locale}
        title={page.title}
        breadcrumbSegments={breadcrumbSegments}
        groups={buildCourseCatalog(catalogData.contentMap, catalogData.manifests, locale)}
      />
    );
  }

  if (courseId === null) {
    return <CoursePageContent {...contentProps} renderData={canonicalRenderData} />;
  }

  const pathData = await loadRoutePathData(locale);
  const canonicalCourseRenderData = resolveCoursePathRenderData(
    new URLSearchParams(),
    pathData,
    courseId,
    locale,
    page.prev,
    page.next,
  );

  // Course root pages (plan 03) get the header; pages inside a course do not. The tree is
  // rebuilt from the already-loaded content metas — no extra fetch for the header.
  const rootId = courseRootIdFromSlug(slugStr);
  let courseHeader = undefined;
  if (rootId !== null) {
    const { buildTrees } = await import("@/features/content/core/tree-builder");
    const trees = buildTrees([...pathData.contentMap.values()]);
    courseHeader = buildCourseHeaderData(pathData.contentMap, trees[locale] ?? [], rootId, locale) ?? undefined;
  }

  return (
    <Suspense
      fallback={
        <CoursePageContent
          {...contentProps}
          courseId={courseId}
          renderData={canonicalCourseRenderData}
          courseHeader={courseHeader}
        />
      }
    >
      <CoursePagePathContent
        {...contentProps}
        courseId={courseId}
        courseHeader={courseHeader}
        canonicalRenderData={canonicalCourseRenderData}
        fallbackPrev={page.prev}
        fallbackNext={page.next}
      />
    </Suspense>
  );
}

function buildBreadcrumbs(
  locale: string,
  slug: string,
  currentTitle: string,
): { label: string; slug: string; href?: string }[] {
  const parts = slug.split("/");
  // Home -> /{locale}; Browse -> /{locale}/browse. The "Browse" segment,
  // carried over from the retired c/[...slug] route (DD-48), used to point
  // at /{locale}/c; it now points at the relocated browse/ route.
  const segments: { label: string; slug: string; href?: string }[] = [
    { label: t(locale as Locale, "breadcrumbHome"), slug: "" },
    { label: t(locale as Locale, "browseTitle"), slug: "browse", href: `/${locale}/browse` },
  ];

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!part) continue;
    segments.push({
      label: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " "),
      slug: parts.slice(0, i + 1).join("/"),
    });
  }

  segments.push({ label: currentTitle, slug });
  return segments;
}
