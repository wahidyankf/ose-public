# P3-Corpus: fe witness rewrites

The fe real-corpus config serves the real corpus; the fe fixture config serves the parity fixture. Each fe step
whose product behaviour is not yet real is either rewritten to a rule-found witness (real config) or kept on the
fixture literals and tagged for the unit that moves it (fixture config). No title, route, or count is hard-coded in a
rewritten real step. Finders live in `apps/ayokoding-web-fe-e2e/tests/e2e/support/witness.ts`.

## Finder rules

| Finder                       | Rule                                                                                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `coursePages()`              | Three-segment course files, excluding `_index.md` and `overview.md`. Overview files are excluded because their track routes do not serve every course.       |
| `servedLearnPages()`         | Every published file under `en/learn` except `_index.md` and `overview.md`; `courses/*` paths that are not of length 4 are skipped because they 404.         |
| `servedLearnPageWhere(rule)` | First `servedLearnPages()` entry whose source satisfies the rule. Throws a named reason when none does.                                                      |
| `learningPageWhere(rule)`    | First learning page whose source satisfies the rule.                                                                                                         |
| `primaryCourse()`            | First course with at least two top-level learning pages, in weight order. Fixed-index reads use `primaryPage(0\|1)`, which throws when the index is missing. |
| `pathContaining(course)`     | Manifest path whose phases contain the course.                                                                                                               |
| `outsideFences(text)`        | Source with fenced code removed, so a table or heading witness cannot match inside a code sample.                                                            |
| `relativeFragmentLink(text)` | First Markdown link that is genuinely relative (not `/`, `#`, `mailto:`, or `http(s):`) and carries a fragment.                                              |
| `nth(items, index, reason)`  | Indexed read that throws a named reason when the item is absent (`noUncheckedIndexedAccess` strictness).                                                     |

`translatedLearningPage` was removed: no real translated learning page is served yet (Indonesian learn routes are not
loaded), so the translation scenario uses the fixture literals instead (see below).

## Real-corpus steps rewritten to a rule-found witness

| Step file                                                                                                   | Step                                                               | Before                                             | Rule-found witness                                                                                      |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `content.steps.ts`                                                                                          | "a lesson contains a table" (new, split from the structures Given) | literal course page                                | `servedLearnPageWhere` with a Markdown table outside fences                                             |
| `content.steps.ts`                                                                                          | "the authored table renders with the established article styling"  | fixture literal                                    | status 200 and a visible `.article-body table` on the table witness                                     |
| `content.steps.ts`                                                                                          | "a reader opens that lesson" (shared When)                         | always opened the structures lesson                | opens `stateFor(page).lessonRoute`, which the Given sets; throws when unset                             |
| `content.steps.ts`                                                                                          | Code block Given                                                   | literal route                                      | `fencedCodeLesson()`: a learning page with a Go fence, recorded in `lessonRoute`                        |
| `content.steps.ts`                                                                                          | Code block label check                                             | first fence of the source (`mermaid` on that page) | the Go language the witness was chosen for (`const language = "go"`)                                    |
| `search.steps.ts`                                                                                           | "each result shows a title, section path, and matching excerpt"    | authored title from course pages only              | first `/en/learn/...` link in the results DOM; `gotoPage` to it; `main h1` must contain the shown title |
| `search.steps.ts`                                                                                           | "the reader chooses that result"                                   | literal result                                     | evaluates `{ href, title }` from the DOM, stores `searchResultTitle`, waits for `url.pathname === href` |
| `search.steps.ts`                                                                                           | "the corresponding content route opens"                            | course pages only                                  | exactly one `main h1` that contains `searchResultTitle`                                                 |
| `courses.steps.ts`, `routes.steps.ts`, `progress.steps.ts`, `localdev.steps.ts`, `browser-progress.spec.ts` | fixed-index and path reads                                         | literals and fixed indexes                         | `primaryCourse()`, `pathContaining()`, `coursePages()`, `primaryPage(N)`, `nth(...)`                    |

## Fixture-owned steps (kept on the parity fixture, tagged for the unit that moves them)

These steps keep their base fixture literals. Rule-found witnesses were tried first and returned 404 on the parity
fixture, so the literals stay for the fixture config only. The `@fixture-until-*` tags make the owner explicit.

| Tag                        | Scenarios                                                                                                                                                                | Product gap it waits on                                                                                                                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@fixture-until-p3-render` | Shortcodes (callout, tabs, steps); relative link to a fragment; KaTeX; mermaid; table of contents; one title heading and ordered outline; task list row; raw details row | `TransformShortcodes` unused; relative `.md` links not rewritten; KaTeX and mermaid not visible in chromium; no `data-toc`; no `<h1>` in the lesson template; bluemonday strips task-list checkboxes; goldmark omits raw `<details>` |
| `@fixture-until-p4-search` | "Results stay within the current locale"; "Choosing a result closes search and opens its destination"                                                                    | search runs on the P1H `FakeIndex` seeded with go-basics, not a tree-built index                                                                                                                                                     |
| `@fixture-until-p4-tree`   | "The locale switch preserves an available translated destination"; the YouTube responsive video scenario                                                                 | no Indonesian learn routes are loaded; no English YouTube witness in the real corpus                                                                                                                                                 |

The structures outline keeps its real table row untagged. Its task list and raw details rows carry
`@fixture-until-p3-render`. The be home's `@fixture` scenarios (drafts, the fixture-only old URL, the fixture-selected
lesson, the two course-manifest scenarios) are not fe scenarios and are outside this table.

## Fixture-only scenarios (B)

These two scenarios are tagged `@fixture` in
`specs/apps/ayokoding/web/behaviours/courses/course-catalog-and-paths.feature` and bind only to the fe fixture config:

- "A malformed path definition is left out and other paths still open" (`# Behaviour: AYB-056`).
- "An empty path category shows an intentional empty state" (`# Behaviour: AYB-053`).

The real corpus has no malformed manifest and no empty category, so no real witness exists. No behaviour ID was added.

## Other fe changes in this unit

- Routes example row (`routes-and-navigation-http.feature`, shared with the be home): the `intro` page of
  `just-enough-python` is absent from the real corpus, so the Examples row now uses `learning/beginner`. Recorded in
  `witness-rewrites-be.md` too, because the be home runs the same row.
- `state.ts` gained `lessonRoute` and `searchResultTitle`.

## Evidence

- Fe real-corpus config, final run (all three browsers): `fe-real-final.raw.txt`, 213 passed. Per project: `bdd-chromium`
  66, `bdd-firefox` 66, `bdd-webkit` 66; `specs-<browser>` 5 each.
- Fe fixture config, final run (all three browsers): `fe-fixture-final.raw.txt`, 58 passed. Per project:
  `bdd-fixture-<browser>` 17 each; `specs-chromium` (htmx) 7.
- Earlier runs kept for history: `fe-real-iter8-chromium.raw.txt`, `fe-real-firefox.raw.txt`, `fe-real-webkit.raw.txt`,
  `fe-fixture-all.raw.txt`. The 14-failure run `fe-real-iter5-chromium.raw.txt` is superseded.
