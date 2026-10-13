# 005 — UI Components and Copy

All paths are under `apps/ayokoding-www/src/`. "Selected" options refer to the design funnel in
[prd.md](../prd.md#ui-design-funnel): S1 option A (card grid), S2 option A (stacked header), S3
option A (collapsible groups).

## Shared helpers

- `features/content/core/course-categories.ts` (new):
  - `COURSE_CATEGORY_IDS` (a readonly tuple of the 14 ids), `COURSE_CATEGORIES` (id, order, label
    key, blurb key), `isCourseCategoryId(value): value is CourseCategoryId`.
  - `groupByCourseCategory<T>(items: readonly T[], categoryOf: (item: T) => string | undefined)`
    returns `{ category: CourseCategory | null; items: T[] }[]` in display order, skipping empty
    categories, with one final `category: null` group ("Other courses") only when an item has a
    missing or unknown category. Both the catalog and the sidebar use it, so they always agree.
- `features/i18n/core/fill.ts` (new): move `fill` and `tf` here from
  `features/ai-benchmark/shell/format.ts`, and re-export them from `format.ts` so the eight existing
  ai-benchmark imports keep working. The catalog and header need `{count}` and `{hours}`
  placeholders.
- `features/course-paths/shell/course-path-nav.ts` (edit): add
  `courseRootIdFromSlug(slug): string | null`, which returns the course id only when the slug is
  exactly `learn/courses/<id>` (no further `/`). `courseIdFromSlug` keeps its current behaviour.

## S1 — Catalog

### Data (`features/course-paths/core/course-catalog.ts`, new, pure)

```ts
export interface CourseCatalogEntry {
  courseId: string;
  slug: string; // "learn/courses/<id>"
  title: string;
  description?: string;
  format?: string;
  estimatedHours?: number;
  isOutline: boolean;
  pathCount: number;
}

export interface CourseCatalogGroup {
  category: CourseCategory | null; // null = "Other courses"
  entries: CourseCatalogEntry[]; // sorted by title, localeCompare(…, "en")
}

export function buildCourseCatalog(
  contentMap: ReadonlyMap<string, ContentMeta>,
  manifests: readonly PathManifest[],
  locale: string,
): CourseCatalogGroup[];
```

It keeps only entries whose key starts with `${locale}:` and whose slug passes
`courseRootIdFromSlug`, takes `pathCount` from `derivePathBadges(manifests, courseId).length`, and
groups with `groupByCourseCategory`.

### Render (`features/course-paths/shell/course-catalog.tsx`, new, server component)

```text
<article class="min-w-0 flex-1 px-6 py-8 lg:px-8">       // same wrapper as CoursePageContent
  <Breadcrumb segments={breadcrumbSegments} />          // Home / Browse / Learn / Courses, as today
  <h1>{page.title}</h1>                                  // "Courses" from _index.md
  <p>{catalogSummary: "181 courses in 14 categories."} {catalogEstimateNote}</p>
  <nav aria-label={catalogJumpLinksLabel}>               // CategoryJumpLinks
    <ul> <li><a href="#data-and-databases">Data and databases (11)</a></li> ... </ul>
  </nav>
  for each group:
    <section aria-labelledby="<id>">
      <h2 id="<id>" ...>{label} <span>({count})</span></h2>
      <p>{blurb}</p>
      <ul class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <li><CourseCard entry/></li> ...
      </ul>
    </section>
</article>
```

- The outer element stays an `<article>` with the content-page wrapper classes, because existing E2E
  steps that open `/en/learn/courses` wait for `getByRole("article")`, and the page keeps the same
  breadcrumb as other content pages.
- The `h2` carries the category id as its `id`, so `#data-and-databases` jumps to it. Use
  `scroll-mt-20` so the sticky header does not cover the heading.
- `CourseCard` uses `Card` from `@open-sharia-enterprise/web-ui` with `relative`. The title is the
  **only** link: `<h3><Link href={contentUrl(locale, slug)} className="after:absolute after:inset-0">`.
  The `after:` overlay makes the whole card clickable while the accessible name stays the title.
  Focus ring: `focus-visible:outline` on the link, shown around the card via `has-[:focus-visible]`.
- Meta row (`CourseMetaRow`, shared with the header): for a normal course, a `Badge`
  (`variant="secondary"`, `size="sm"`) with the format label, then `About {hours} h`; for an outline,
  plan 02's `OutlineBadge` only. Then `In {count} path` / `In {count} paths`.
- No sub-links. The generated `_index.md` body is not rendered on this route.

### Dispatch (`app/[locale]/(content)/[...slug]/page.tsx`, edit)

After the `isLearnPathsSlug` branch and after `getBySlug` succeeds:

```ts
if (slugStr === COURSE_CATALOG_SLUG) {
  const pathData = await loadRoutePathData(locale);
  return (
    <CourseCatalog
      locale={locale}
      title={page.title}
      breadcrumbSegments={buildBreadcrumbs(locale, slugStr, page.title)}
      groups={buildCourseCatalog(pathData.contentMap, pathData.manifests, locale)}
    />
  );
}
```

`COURSE_CATALOG_SLUG = "learn/courses"` lives in `course-path-nav.ts` next to `COURSE_SLUG_PREFIX`.
For `/id/learn/courses`, `getBySlug` throws `NOT_FOUND` as today, so the 404 behaviour is unchanged.

## S2 — Course header

### Data (`features/course-paths/shell/course-header-data.ts`, new)

```ts
export interface CourseHeaderData {
  courseId: string;
  description?: string;
  category: CourseCategory | null;
  format?: CourseFormat;
  estimatedHours?: number;
  isOutline: boolean;
  startSlug: string | null; // from resolveCourseStartSlug
}

export function buildCourseHeaderData(
  contentMap: ReadonlyMap<string, ContentMeta>,
  tree: readonly TreeNode[],
  courseId: string,
  locale: string,
): CourseHeaderData | null; // null when the course meta is missing
```

### Render (`features/course-paths/shell/course-header.tsx`, new)

```ts
export interface CourseHeaderProps {
  locale: string;
  data: CourseHeaderData;
  prerequisites: readonly PrerequisiteLink[]; // renderData.prerequisiteLinks (path-aware)
  pathBadges: readonly PathBadge[]; // renderData.pathBadges
  showPathBadges: boolean; // false when a path context is active, as today
  /** Plan 04: replaces the default Start button, for example with "Continue: <page>". */
  primaryAction?: React.ReactNode;
  /** Plan 04: course progress shown under the meta row. Renders nothing when absent. */
  progress?: React.ReactNode;
}
```

Order inside `<header aria-label={courseHeaderLabel}>`:

1. `<p class="text-lg text-muted-foreground">{description}</p>`
2. `CourseMetaRow` (format label or `OutlineBadge`, "About N h" unless outline, category label)
3. `progress` slot (empty in this plan)
4. `primaryAction ?? <StartCourseButton href={contentUrl(locale, startSlug, activePathId)} />`.
   The button keeps the active `?path=` context, like `PrevNext`. It uses `Button` (`asChild`
   with `Link`), label `courseStart` ("Start course"), full width below `sm`. When `startSlug` is
   `null`, nothing renders.
5. `PrerequisiteList` (unchanged component, unchanged "Prerequisites" landmark)
6. `PathCourseLinks` when `showPathBadges` (unchanged component and landmark)

### Changes to `course-page-content.tsx`

- New optional prop `courseHeader?: CourseHeaderData`.
- When present: render `CourseHeader` right after the `h1` and `PathBanner`; render an `h2`
  `courseContents` ("Course contents") before `MarkdownRenderer`; do **not** render the bottom
  `PrerequisiteList` and `PathCourseLinks`.
- When absent (every non-root page): render exactly as today.
- `page.tsx` builds `courseHeader` only when `courseRootIdFromSlug(slugStr)` is not null, using
  `serverCaller.content.getTree({ locale })` for the tree, and passes it to both
  `CoursePageContent` and `CoursePagePathContent` (which forwards it).

## S3 — Sidebar groups

### `features/navigation/shell/course-category-groups.tsx` (new, client)

```ts
interface CourseCategoryGroupsProps {
  nodes: TreeNode[]; // the children of the learn/courses node
  locale: string;
  depth: number;
}
```

- Groups the nodes with `groupByCourseCategory(nodes, (n) => n.category)`.
- Each group is an `<li>` with a disclosure button and a wrapper `<div id="sidebar-group-<id>"
hidden={!open}>` that always exists, so `aria-controls` always points at a real element. The
  wrapper holds `<SidebarTree nodes={group.items} depth={depth + 1}>` only while the group is open:

```tsx
<button
  type="button"
  aria-expanded={open}
  aria-controls={`sidebar-group-${categoryId}`}
  onClick={() => setOpen(!open)}
  className="flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold tracking-wide whitespace-nowrap text-muted-foreground uppercase hover:bg-accent"
>
  <ChevronRight className={cn("h-3.5 w-3.5 motion-safe:transition-transform", open && "rotate-90")} aria-hidden />
  <span>{label}</span>
  <span className="ml-auto tabular-nums">{count}</span>
  <span className="sr-only">{tf(locale, "sidebarCategoryCount", { count })}</span>
</button>
```

- Initial `open` = the group contains the current page (`pathname === href` or
  `pathname.startsWith(href + "/")` for any course in it). A `useEffect` opens the group when client
  navigation moves the current page into it; it never closes a group the reader opened.
- Initial state comes from `usePathname()`, which is available during server rendering of a client
  component, so server and client markup match (NFR-04).
- The existing course rows keep their own "Expand section" chevrons.

### `features/navigation/shell/sidebar-tree.tsx` (edit)

In `SidebarNode`, when `node.slug === COURSE_CATALOG_SLUG` and it is expanded, render
`<CourseCategoryGroups nodes={node.children} locale={locale} depth={depth + 1} />` instead of
`<SidebarTree nodes={node.children} …/>`. Nothing else in the file changes, so the desktop sidebar
and the mobile drawer (both render `SidebarTree`) get the groups.

## Translation keys

Added to both dictionaries in `features/i18n/core/translations.ts`. `{…}` placeholders are filled
with `tf`.

| Key                                   | en                                                                                                | id                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `catalogSummary`                      | {courses} courses in {categories} categories.                                                     | {courses} kursus dalam {categories} kategori.                                   |
| `catalogEstimateNote`                 | Times are estimates for reading each course and its code examples.                                | Waktu adalah perkiraan untuk membaca setiap kursus beserta contoh kodenya.      |
| `catalogJumpLinksLabel`               | Course categories                                                                                 | Kategori kursus                                                                 |
| `catalogOtherCourses`                 | Other courses                                                                                     | Kursus lainnya                                                                  |
| `courseEstimatedHours`                | About {hours} h                                                                                   | Sekitar {hours} jam                                                             |
| `coursePathCountOne`                  | In {count} path                                                                                   | Di {count} jalur                                                                |
| `coursePathCountMany`                 | In {count} paths                                                                                  | Di {count} jalur                                                                |
| `courseHeaderLabel`                   | Course summary                                                                                    | Ringkasan kursus                                                                |
| `courseStart`                         | Start course                                                                                      | Mulai kursus                                                                    |
| `courseContents`                      | Course contents                                                                                   | Isi kursus                                                                      |
| `sidebarCategoryCount`                | {count} courses                                                                                   | {count} kursus                                                                  |
| `courseFormatByExample`               | Code by example                                                                                   | Belajar lewat contoh kode                                                       |
| `courseFormatPrimer`                  | Language primer                                                                                   | Primer bahasa                                                                   |
| `courseFormatAnnotatedConcept`        | Concept walkthrough                                                                               | Penjelasan konsep                                                               |
| `courseFormatAnnotatedConceptNoCode`  | Concept walkthrough, no code                                                                      | Penjelasan konsep, tanpa kode                                                   |
| `courseFormatInTheField`              | In the field                                                                                      | Di lapangan                                                                     |
| `courseFormatCapstone`                | Capstone project                                                                                  | Proyek capstone                                                                 |
| `courseCategory<Name>` (14 keys)      | The "Label (en)" column in [003](./003-category-taxonomy-and-course-mapping.md#the-14-categories) | The "Label (id)" column in 003                                                  |
| `courseCategory<Name>Blurb` (14 keys) | The blurb column in 003                                                                           | The executor translates each blurb in the same plain style; reviewed in the PR. |

`<Name>` is the category id in PascalCase, for example `courseCategoryDataAndDatabases`.

The catalog's own frontmatter (`content/en/learn/courses/_index.md`) changes `description` to
"Browse all AyoKoding courses by category, with a short summary, format, and estimated time for
each." `title` ("Courses") and `weight` (102 after plan 01) stay.

## Accessibility checklist

- One `h1` per page; category headings are `h2`; card titles are `h3`.
- Every interactive element is reachable with Tab, in reading order.
- Group buttons follow the APG disclosure pattern (`button`, `aria-expanded`, `aria-controls`; Enter
  and Space toggle, which a native `<button>` provides).
- "Outline", the format, and the time are text; none relies on color alone.
- `motion-safe:` prefixes the chevron transition, so reduced-motion users see no animation.
