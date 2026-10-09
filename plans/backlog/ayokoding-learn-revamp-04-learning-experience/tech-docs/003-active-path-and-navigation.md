# 003 — Active Path and Navigation

## Lesson Sequence

A course's **lesson sequence** is the ordered list of its learning pages. Progress counts only pages
in this list, and "Previous" and "Mark complete & continue" walk it.

```ts
// src/features/learning-progress/core/lesson-sequence.ts (pure)
export interface LessonPage {
  pagePath: string; // relative to the course, e.g. "learning/beginner"
  slug: string; // "learn/courses/<id>/<pagePath>"
  title: string;
}

export function buildLessonSequence(
  courseNode: TreeNode, // findSubtree(tree, "learn/courses/<id>")
  isRealPage: (slug: string) => boolean, // contentMap has `${locale}:${slug}`
  startSlug: string | null, // plan 03's resolveCourseStartSlug(courseNode, isRealPage)
): LessonPage[];
```

The walk, in order:

1. Walk the course subtree depth-first. Order siblings by `weight`, then by `slug` (the same tie-break
   plan 03's `resolveCourseStartSlug` uses; `sortTreeByWeight` alone keeps file order on ties).
2. Skip any section node with no real `_index.md`, **together with everything under it**. On
   2026-10-09 this skips the `learning/artifacts/` folders of 11 courses (264 titled worked-example
   pages, linked from lesson pages rather than read in order).
3. Collect every non-section node that is a real page. Untitled files (such as `code/**`) are not in
   the tree as pages, so they are never collected.
4. Drop every page before `startSlug`. This removes the course-root `overview.md` (weight 1) in
   courses whose Start target is `learning/overview`, so the sequence starts exactly where "Start
   course" starts (decision 23). In the four courses without `learning/`, the root `overview` is the
   start page and stays. If `startSlug` is `null` or not found, return `[]`.

A corpus unit test (`tests/unit/features/learning-progress/lesson-sequence.corpus.unit.test.ts`)
reads the real English content and asserts, for every course directory: the sequence is not empty,
`sequence[0].slug` equals plan 03's start slug, and no page path repeats. It prints the totals (courses,
pages, skipped synthetic pages) for Phase 0 evidence.

Pages outside the sequence (the course-root `overview` where it is not the start page, and artifact
pages) render exactly as today, with today's `PrevNext`.

### Server Helper

```ts
// src/features/learning-progress/shell/lesson-sequences.ts (server only)
export async function loadLessonSequence(locale: string, courseId: string): Promise<LessonPage[]>;
export async function loadLessonPagePaths(locale: string): Promise<Readonly<Record<string, readonly string[]>>>;
```

Both build from `serverCaller.content.getTree({ locale })` and `loadRoutePathData(locale).contentMap`,
and memoize per locale for the life of the server process, like `loadRoutePathData`. The second
returns page paths only (no titles) for every course; it feeds the roadmap, path cards, and the Learn
home.

## Page Location

```ts
// src/features/learning-progress/core/course-location.ts (pure)
export function courseLocationFromSlug(slug: string): { courseId: string; pagePath: string | null } | null;
```

- `learn/courses/sql-essentials` → `{ courseId: "sql-essentials", pagePath: null }`
- `learn/courses/sql-essentials/learning/beginner` → `{ courseId: "sql-essentials", pagePath: "learning/beginner" }`
- `learn/courses` and any slug outside `learn/courses/` → `null`

`courseIdFromSlug` and plan 03's `courseRootIdFromSlug` do not change, so prerequisites and path
badges keep appearing only where they appear today.

## Active Path Rule

The URL stays the authority. A narrow memory fallback keeps the path inside one course.

```ts
// src/features/learning-progress/core/lesson-path-context.ts (pure)
export function resolveLessonPathContext(input: {
  pathParam: string | null; // searchParams.get("path")
  manifests: readonly PathManifest[];
  courseId: string;
  lastPath: { pathId: string; courseId: string } | null; // null until the store is ready
}): { manifest: PathManifest; source: "url" | "remembered" } | null;
```

1. If `pathParam` is present: return `{ source: "url" }` when a manifest with that id contains the
   course; otherwise return `null`. An invalid `?path=` never falls back to memory, so today's
   invalid-path fallback scenario keeps its meaning.
2. If `pathParam` is absent and `lastPath.courseId === courseId` and a manifest with
   `lastPath.pathId` contains the course: return `{ source: "remembered" }`.
3. Otherwise `null` (canonical mode).

This rule applies on **lesson pages only**. Course landing pages keep today's URL-only behaviour, so
the rail, banner, drawer, prerequisites, and path badge scenarios stay valid.

Every link this plan renders in path context carries `?path=` explicitly (context bar links, lesson
navigation, roadmap cards, Continue buttons). The memory fallback only catches links this plan does
not control: the sidebar tree, links inside lesson bodies, and the table of contents.

**Visit recording.** When a lesson page or a course landing page mounts on the client, it calls
`recordVisit(courseId, urlPathIdOrNull)` once the URL's path id has been validated against the runtime
manifests (or immediately when there is no `?path=`). Recording `null` keeps `lastPath` for the same
course (see [002](./002-progress-store-schema-and-migration.md#pure-operations-srcfeatureslearning-progresscoreprogress-statets)).

**Runtime manifests.** Lesson pages read manifests and course titles through the existing
`useRuntimeCoursePathData(locale, initial, enabled)`. `enabled` is true when `?path=` is present or
when the store's `lastPath.courseId` equals the current course. Until data arrives, the context bar
shows canonical mode in the same fixed-size slot.

## Progress Derivations

```ts
// src/features/learning-progress/core/progress-derivations.ts (pure)
export type CourseStatus = "done" | "in-progress" | "not-started";

export function courseProgress(
  state: ProgressState,
  courseId: string,
  sequence: readonly string[],
): { done: number; total: number; status: CourseStatus };

export function phaseProgress(
  phase: PathPhase,
  state: ProgressState,
  sequences: SequenceIndex,
): { done: number; total: number };

export function pathProgress(
  manifest: PathManifest,
  state: ProgressState,
  sequences: SequenceIndex,
): { coreDone: number; coreTotal: number; complete: boolean };
```

- `done` counts completed page paths that are in the current sequence; stale keys never count.
- `status` is `done` when `done === total && total > 0`, `in-progress` when `done > 0`, otherwise
  `not-started`. A course with an empty sequence is never `done`.
- Phase and path counts are **courses**, not pages. The path headline counts **core** courses only
  (extensions are optional, decision 38b); each extension phase shows its own count. For a path marked
  as pending restructure (plan 02's `isPendingSkillsRestructure`), its single phase counts all courses.
- `SequenceIndex` is `Readonly<Record<string, readonly string[]>>` from `loadLessonPagePaths`.

## Next-Step Rule

```ts
// src/features/learning-progress/core/next-step.ts (pure)
export type CourseTarget = { courseId: string; pagePath: string | null }; // null = course landing page

export function courseNextTarget(
  state: ProgressState,
  courseId: string,
  sequence: readonly string[],
): CourseTarget | null;

export type PathNextStep =
  | { kind: "start"; target: CourseTarget }
  | { kind: "continue"; target: CourseTarget }
  | { kind: "core-complete" };

export function resolvePathNextStep(
  manifest: PathManifest,
  state: ProgressState,
  sequences: SequenceIndex,
): PathNextStep;
```

`courseNextTarget`: `null` when the course is done; the first sequence page not completed when the
course has at least one completed page; otherwise the course landing page (`pagePath: null`), where
the reader sees the header and "Start course".

`resolvePathNextStep`, in order:

1. If `state.lastPath.pathId` is this path, its course is in the path, and that course is not done:
   `continue` at `courseNextTarget` of that course.
2. Otherwise take the first **core** course in `courseOrder` that is not done. If no course of the
   path has a completed page, return `start` with that course's landing page; else `continue` at its
   `courseNextTarget`.
3. Otherwise (every core course is done): `core-complete`.

Every target link carries `?path=<pathId>`.

### Learn Home Card

1. If `lastPath` names a loaded manifest: **path mode** — the path title and its next step. For
   `core-complete` the card says "You finished the core of <path>" and links to the path page.
2. Else if `lastCourse` names a course with a sequence: **course mode** — "Continue <course>" to
   `courseNextTarget`, or to the course landing page when it is done.
3. Else: **start mode** — "Start learning" with a link to the career paths section (`#career-paths`).

## Lesson Navigation

`LessonNav` renders `<nav aria-label="Page navigation">`, the same landmark name today's `PrevNext`
uses, so existing sibling-link scenarios keep finding it. Link accessible names contain the target
page titles.

| Situation (page `i` of sequence `S`)         | "Previous" target   | "Mark complete & continue" target          | Second line under the primary link |
| -------------------------------------------- | ------------------- | ------------------------------------------ | ---------------------------------- |
| `i > 0`                                      | `S[i-1]`            | `S[i+1]` when `i` is not last              | "Next: <title>"                    |
| `i = 0`                                      | course landing page | as above                                   | as above                           |
| last page, path context, a course follows    | as above            | next course in `courseOrder`, landing page | "Next course: <title>"             |
| last page, path context, last course of path | as above            | the path page                              | "Back to the path"                 |
| last page, no path context                   | as above            | the course landing page                    | "Back to the course"               |

- In path context, every target carries `?path=<pathId>`; the path page target has none (it is the
  path itself).
- The primary control is a `next/link` `Link`. Its `onClick` marks the current page complete in the
  store before navigation. When the page is already complete, its label is "Continue →" and the click
  writes nothing. Without JavaScript it is an ordinary link (navigation works; progress needs
  scripts).
- The toggle is `<button type="button" aria-pressed>`: "Mark as complete" (false) or "Completed ✓"
  (true). Clicking flips the state. It is `disabled` while the snapshot is `unknown`.
- Each change updates a visually hidden `role="status"` region with the sentence from
  [004](./004-ui-components-and-copy.md#translation-keys).
- Nothing else writes completion: no scroll, time, or visibility listener exists (S18).

## Overview Removal and Redirect

- Delete `apps/ayokoding-www/content/en/learn/overview.md`. The generated body of
  `content/en/learn/_index.md` loses its Overview link the next time `generate-indexes` runs; the
  home does not render that body.
- New module `src/redirects/learn-home.ts`:

  ```ts
  export const learnHomeRedirects: Array<{ source: string; destination: string; permanent: boolean }> = [
    { source: "/en/learn/overview", destination: "/en/learn", permanent: true },
  ];
  ```

- `next.config.ts` spreads it after `courseRehomeRedirects` and before `learnThreeBucketRedirects`.
  `permanent: true` makes Next.js answer 308. No blanket `/en/learn/:path*` source is added (the
  three-bucket module's ban stays true).
- `/en/c/learn/overview` reaches `/en/learn` in two hops (`contentNamespaceRedirects` first, then this
  rule); the existing namespace tests already accept a second hop for renamed targets.

HTTP checks against the running dev server (delivery Phase 6 and Phase 10):

```bash
rtk curl -sS -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3101/en/learn/overview
# expected: 308 http://localhost:3101/en/learn
rtk curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:3101/en/learn
# expected: 200
rtk curl -sS -o /dev/null -w "%{http_code}\n" http://localhost:3101/en/learn/overview-does-not-exist
# expected: 404
```

After Overview is gone, the Learn sidebar lists Paths (101), Courses (102), and Legacy (103), the
weights plan 01 set.
