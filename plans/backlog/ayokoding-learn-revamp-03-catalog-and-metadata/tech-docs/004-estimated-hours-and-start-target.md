# 004 — Estimated Hours and Start Target

## What "estimated time" means

`estimatedHours` is the time a reader needs to **read every learning and drilling page of the course
and read through every code example**, rounded to whole hours. It is not a promise of mastery and it
does not include setting up tools or redoing exercises. The catalog intro says so in one sentence
(key `catalogEstimateNote`, [005](./005-ui-components-and-copy.md#translation-keys)).

## The formula

```text
proseWords      = words outside fenced code blocks, in every rendered .md page of the course
inlineCodeLines = non-blank lines inside fenced code blocks, in the same pages
codeFileLines   = non-blank lines of the course's code files (any file under a code/ folder
                  that is not itself a rendered .md page)
codeLines       = max(inlineCodeLines, codeFileLines)
minutes         = proseWords / 200 + codeLines / 10
estimatedHours  = max(1, round(minutes / 60))     // round half up, as Math.round does
```

Definitions the implementation must follow exactly:

- **Rendered page.** A `.md` file under the course folder whose frontmatter parses and has a `title`,
  is not `draft: true`, and is not named `_index.md`. (`_index.md` bodies are generated link lists.)
  Untitled `.md` files, such as a `README.md` inside `code/`, are not rendered pages; they count as
  code files.
- **Word.** A match of `/[A-Za-z0-9][A-Za-z0-9'’-]*/g` in the page body after removing fenced code
  blocks (` ``` ` to ` ``` `). Frontmatter is not counted.
- **Code file.** Every regular file under any directory named `code` inside the course folder,
  excluding rendered pages. Files that are not valid UTF-8 (images, binaries) are skipped. Read them
  with `new TextDecoder("utf-8", { fatal: true })` and skip on error.
- **Why `max` and not a sum.** Many courses show the same code twice: inline in the page and as a
  runnable file under `code/` (plan 05's harness checks that they match). Adding both would count the
  same lines twice. Courses that keep code only in files (for example, the agent courses) still get
  credit through `codeFileLines`.

### Why these rates

- **200 words per minute.** A meta-analysis of 190 studies (18,573 participants) put the average adult
  silent reading rate for English non-fiction at **238 words per minute**, with most adults between
  175 and 300 (Brysbaert, "How many words do we read per minute? A review and meta-analysis of
  reading rate", _Journal of Memory and Language_ 109, 2019, 104047; accessed 2026-10-09 via the
  author's PDF and the BPS Research Digest summary at
  <https://www.bps.org.uk/research-digest/most-comprehensive-review-date-finds-average-persons-reading-speed-slower>).
  Technical text read by a learner is slower than average non-fiction, so this plan uses 200, inside
  the measured range and below the mean.
- **10 code lines per minute.** No comparable meta-analysis exists for reading code. This is a
  working assumption: one line every six seconds, which leaves time to read the annotation next to
  it. It is a named constant (`CODE_LINES_PER_MINUTE`) so a later plan can change it in one place.

### Snapshot on 2026-10-09

For the 119 courses that are not outlines, the formula gives: minimum 1 h, 25th percentile 1 h,
median 3 h, 75th percentile 6 h, 90th percentile 11 h, maximum 20 h (`security-essentials`); total
529 h. The highest values are `security-essentials` 20, `computer-architecture` 16,
`advanced-sql-and-query-performance` 16, `debugging-and-profiling` 15, and
`search-and-information-retrieval` 15. Many concept and leadership courses land at 1–2 h because
they are prose-heavy and short; plans 06–13 grow them, and the drift test forces the number to follow.

Plans 01 and 02 edit course files before this plan runs (plan 01 converts 82 "Accuracy notes"
sections into References), so the executor must take final values from the drift test's output, not
from the snapshot.

## Code

### Pure core (`src/features/content/core/course-effort.ts`, new)

```ts
export const PROSE_WORDS_PER_MINUTE = 200;
export const CODE_LINES_PER_MINUTE = 10;

export interface CourseEffortCounts {
  proseWords: number;
  inlineCodeLines: number;
  codeFileLines: number;
}

/** Pure. Whole hours, at least 1. */
export function estimateCourseHours(counts: CourseEffortCounts): number {
  const codeLines = Math.max(counts.inlineCodeLines, counts.codeFileLines);
  const minutes = counts.proseWords / PROSE_WORDS_PER_MINUTE + codeLines / CODE_LINES_PER_MINUTE;
  return Math.max(1, Math.round(minutes / 60));
}

/** Pure. Splits one page body into prose words and inline code lines. */
export function countPageEffort(body: string): { proseWords: number; inlineCodeLines: number };
```

### Shell scanner (`src/features/content/shell/course-effort-scan.ts`, new)

```ts
/** Reads one course folder and returns its counts. Uses node:fs/promises and gray-matter. */
export async function scanCourseEffort(courseDir: string): Promise<CourseEffortCounts>;
```

It walks the folder once, classifies each file (rendered page, code file, or ignored), calls
`countPageEffort` for rendered pages, and counts non-blank lines for code files.

## The drift test

The drift test is the Unit binding of the scenario "Every course in the library carries valid
metadata" in `tests/unit/be-steps/course-metadata.steps.ts` (new). It calls `checkCourseCorpus`
(`src/features/content/shell/course-corpus-check.ts`, see
[006](./006-testing-strategy.md#the-real-corpus-guard)), which reads every directory in
`content/en/learn/courses/`, parses its `_index.md` with gray-matter, and for each course:

1. runs `checkCourseMetadata(courseId, frontmatter)` ([002](./002-metadata-schema-and-migration.md));
2. if `estimatedHours` is present, or the course is not an outline, compares it with
   `estimateCourseHours(await scanCourseEffort(courseDir))`;
3. checks that `resolveCourseStartSlug` (below) returns a slug.

It collects every problem first, then fails once with a message like:

```text
Course metadata check failed for 3 courses:
sql-essentials: estimatedHours: stored 7, expected 8
graph-databases: description: exactly one sentence
lisp: format: required unless status is outline
Expected estimatedHours for every non-outline course:
advanced-algorithms 14
...
```

The second block lists the expected value for every course that is not an outline, so the executor
(and plans 06–13) can copy the numbers into frontmatter. This is the "recompute" tool: it lives in the
app's tested TypeScript core and test suite, not in an ad-hoc script. A later `ayokoding-cli`
subcommand (plan 05) may wrap the same functions.

The test runs in `ayokoding-www:test:unit`, so it runs in `test:quick`, the pre-push hook, and PR CI.

## Start target rule

"Start course" must open "the first learning page" (decision 23). The content tree has three shapes
that matter (measured 2026-10-09):

| Shape                                                                | Courses | Example                           |
| -------------------------------------------------------------------- | ------- | --------------------------------- |
| `learning/overview.md` exists                                        | 169     | `sql-essentials`                  |
| `learning/` exists without `overview.md` (only `learning/capstone/`) | 8       | `capstone-data-pipeline`          |
| No `learning/` folder; a top-level `overview.md` exists              | 4       | `capstone-first-working-software` |

Two traps make a naive "first child" rule wrong:

- **Synthetic sections.** 11 courses have `learning/artifacts/*.md` pages (264 titled pages) in a
  folder with no `_index.md`. `buildTreeForLocale` creates a weight-0 synthetic node for that folder,
  so a naive depth-first walk would start a learner on an artifact page.
- **Weight ties.** In `build-your-own-database`, `build-your-own-raft`, and `hybrid-app-development`,
  `learning/overview.md` and `learning/capstone/_index.md` both have weight 1.

The rule, in order:

1. If `learning/overview` is a real page, start there.
2. Otherwise walk the course's `learning` subtree depth-first, ordering siblings by weight and then
   by slug (the resolver sorts its own copy, because `sortTreeByWeight` in `tree-builder.ts` sorts
   by weight only and keeps file order on ties), **skipping any section node that has no real
   `_index.md`** (no `${locale}:${slug}` entry in the content map), and start at the first leaf page.
3. Otherwise, if the course has a top-level `overview` page, start there.
4. Otherwise render no Start button.

All 181 courses resolve under rules 1–3 on 2026-10-09 (169 + 8 + 4).

```ts
// src/features/content/core/course-start.ts (new, pure)
export function resolveCourseStartSlug(
  courseNode: TreeNode, // the course's subtree from findSubtree(tree, "learn/courses/<id>")
  isRealPage: (slug: string) => boolean, // true when contentMap has `${locale}:${slug}`
): string | null;
```

`buildCourseHeaderData` (shell) supplies `isRealPage` from `loadRoutePathData(locale).contentMap`.
