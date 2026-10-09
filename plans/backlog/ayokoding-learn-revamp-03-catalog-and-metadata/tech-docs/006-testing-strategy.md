# 006 — Testing Strategy

## Layers

The app's BDD contract (see `repo-governance/development/behaviour-driven-development.md`) binds every
Gherkin scenario in `specs/apps/ayokoding/www/behaviours/` to the adapters declared in
`apps/ayokoding-www/behaviour-coverage.json`:

| Adapter     | Bindings folder                        | Runner                         | In `test:quick`?             |
| ----------- | -------------------------------------- | ------------------------------ | ---------------------------- |
| Unit        | `apps/ayokoding-www/tests/unit`        | `vitest.config.ts`             | Yes (`test:unit`, 99% lines) |
| Integration | `apps/ayokoding-www/tests/integration` | `vitest.integration.config.ts` | No (`test:integration`, CI)  |
| E2E         | `apps/ayokoding-www-fe-e2e/tests/e2e`  | Playwright + playwright-bdd    | No (`test:e2e`, CI)          |

`test:quick` also runs `test:coverage`, the static checker that every scenario has exactly one
binding per non-exempt adapter. A scenario with no binding fails `test:quick`, which is why the
Gherkin lands first (RED) and the bindings land with the code (GREEN).

Unit step files use `@amiceli/vitest-cucumber` (`loadFeature` + `describeFeature`), like
`tests/unit/fe-steps/prerequisite-display.steps.tsx`. React components render with
`@testing-library/react`; `next/link` and `next/navigation` are mocked the same way existing step
files do.

## Gherkin-to-Test Binding Map

| Feature file (under `specs/apps/ayokoding/www/behaviours/`)  | Unit binding (new unless marked)                                                          | Integration binding                                                       | E2E binding (`apps/ayokoding-www-fe-e2e/tests/e2e/steps/`) |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `frontend/course-paths/course-catalog.feature`               | `tests/unit/fe-steps/course-catalog.steps.tsx`                                            | exempt (all scenarios)                                                    | `course-catalog.steps.ts`                                  |
| `frontend/course-paths/course-landing-header.feature`        | `tests/unit/fe-steps/course-landing-header.steps.tsx`                                     | exempt (all scenarios)                                                    | `course-landing-header.steps.ts`                           |
| `frontend/navigation/sidebar-course-categories.feature`      | `tests/unit/fe-steps/sidebar-course-categories.steps.tsx`                                 | exempt (all scenarios)                                                    | `sidebar-course-categories.steps.ts`                       |
| `backend/content/course-metadata.feature`                    | `tests/unit/be-steps/course-metadata.steps.ts`                                            | `tests/integration/be-steps/course-metadata.steps.ts` (scenarios 1 and 4) | exempt (all scenarios)                                     |
| `build-tools/index-generation/index-generation.feature` (+1) | `tests/unit/be-steps/index-generation.steps.ts` (edit)                                    | `tests/integration/be-steps/index-generation.steps.ts` (edit)             | exempt (as the existing scenarios)                         |
| `backend/navigation/navigation-api.feature` (+1)             | `tests/unit/be-steps/navigation-api.steps.ts` (edit) and `helpers/test-service.ts` (edit) | `tests/integration/be-steps/navigation-api.steps.ts` (edit)               | `backend-navigation-api.steps.ts` (edit)                   |

A second project also binds the backend corpus: `apps/ayokoding-www-be-e2e/behaviour-coverage.json`
covers `specs/apps/ayokoding/www/behaviours/backend` with its own E2E adapter
(`apps/ayokoding-www-be-e2e/tests/e2e`). So the new `navigation-api.feature` scenario also needs a
step in `apps/ayokoding-www-be-e2e/tests/e2e/steps/navigation-api.steps.ts` (edit), and
`ayokoding-www-be-e2e:test:coverage` must pass. `course-metadata.feature` is E2E-exempt in every
scenario, so it needs no step in either E2E project.

E2E data notes:

- `ayokoding-www-fe-e2e:test:e2e` builds the app with the fixture manifests in
  `apps/ayokoding-www-fe-e2e/fixtures/manifests/` (`AYOKODING_WEB_MANIFESTS_DIR`). Path counts and
  "This course is part of" links in E2E therefore come from those fixtures, not from the real
  `manifests/` folder. `sql-essentials` appears in two fixture manifests on 2026-10-09
  (`careers/immediately-effective/backend-track.json` and `skills/e2e-fixture-beta.json`), so the
  step asserts the form "In N paths" with N of at least 1, never an exact number.

- "A course card shows the facts needed to choose" and the sidebar scenarios use the real course
  `sql-essentials` (category `data-and-databases`, format `by-example`). The time is matched with the
  pattern `/^About \d+ h$/`, so a later content change does not break the test.
- "An outline course ..." uses `accounting-foundations` (outline under plan 02).
- "Start falls back to the first learning page" uses `capstone-data-pipeline` (only
  `learning/capstone/`); "Start falls back to the course overview" uses
  `capstone-first-working-software` (no `learning/`). See the note in [prd.md](../prd.md) about plan 08.

## The real-corpus guard

The first scenario of `course-metadata.feature` ("Every course in the library carries valid
metadata") is the permanent guard. Both its Unit and its Integration binding call one shell helper:

```ts
// apps/ayokoding-www/src/features/content/shell/course-corpus-check.ts (new)
export interface CourseCorpusReport {
  problems: string[]; // "<courseId>: <field>: <message>", sorted
  expectedHours: Record<string, number>; // every course that is not an outline
}
export async function checkCourseCorpus(contentDir: string, locale?: "en"): Promise<CourseCorpusReport>;
```

It reads the content with `FileSystemContentRepository`, builds the tree with `buildTrees`, parses
each course `_index.md` with gray-matter, and combines `checkCourseMetadata`, `scanCourseEffort` +
`estimateCourseHours`, and `resolveCourseStartSlug`. The Unit step points it at
`apps/ayokoding-www/content`, like the existing manifest unit tests
(`tests/unit/features/course-paths/manifests/**`) already read real content. When `problems` is not
empty, the step fails with the message format in
[004](./004-estimated-hours-and-start-target.md#the-drift-test), which includes the full expected-hours
table.

## Plain unit tests (no Gherkin)

These keep line coverage at 99% and pin edge cases that do not belong in a scenario.

| New or edited test file (under `apps/ayokoding-www/tests/unit/`)  | Covers                                                                                                       |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `features/content/core/course-categories.test.ts` (new)           | 14 ids, unique order, `groupByCourseCategory` order, empty groups skipped, "Other courses" group.            |
| `features/content/core/course-metadata.test.ts` (new)             | Each field rule; outline exemptions; description edge cases (`.NET`, semicolons, two sentences, `·`).        |
| `features/content/core/course-effort.test.ts` (new)               | `countPageEffort` fences and words; `estimateCourseHours` minimum 1, `max` of code counts, rounding at .5.   |
| `features/content/shell/course-effort-scan.unit.test.ts` (new)    | Temp folder: rendered page vs untitled `.md` in `code/`, draft skipped, binary skipped, `_index.md` skipped. |
| `features/content/core/course-start.test.ts` (new)                | Rules 1–4; synthetic `artifacts` folder skipped; weight tie broken by slug.                                  |
| `features/content/shell/course-corpus-check.unit.test.ts` (new)   | Temp content folder: a clean course, a stale estimate, a missing field; report sorting.                      |
| `features/course-paths/core/course-catalog.test.ts` (new)         | Locale filter, root-only courses, path counts, title sort, unknown category to "Other courses".              |
| `features/course-paths/shell/course-catalog.test.tsx` (new)       | Jump links, headings with ids, one link per card, outline card.                                              |
| `features/course-paths/shell/course-header.test.tsx` (new)        | Meta row variants, Start href with and without `?path=`, no button when `startSlug` is null, both slots.     |
| `features/course-paths/shell/course-header-data.test.ts` (new)    | Missing meta returns null; category lookup; Start resolution through the tree.                               |
| `features/navigation/shell/course-category-groups.test.tsx` (new) | Initial open state from pathname; toggle; `aria-expanded`/`aria-controls`; client navigation opens a group.  |
| `features/navigation/shell/sidebar-tree.test.tsx` (edit)          | `learn/courses` children render through the groups; other sections unchanged.                                |
| `features/content/core/schemas.test.ts` (edit)                    | A bad `category`/`format`/`estimatedHours` value parses to `undefined`; the page is kept.                    |
| `features/content/shell/repository-fs.unit.test.ts` (edit)        | The three fields are mapped into `ContentMeta`.                                                              |
| `features/course-paths/shell/course-path-nav.test.ts` (edit)      | `courseRootIdFromSlug` for root, subpage, and non-course slugs.                                              |
| `features/i18n/core/fill.test.ts` (new; moved cases)              | `fill`/`tf` behaviour moved from ai-benchmark; the ai-benchmark re-export still works.                       |

## Existing tests that change

| File                                                                                                    | Change                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/ayokoding-www-fe-e2e/tests/e2e/steps/resizable-sidebar.steps.ts`                                  | `TALL_WIDE_SIDEBAR_PAGE` becomes `/en/learn/courses/erp-foundations-and-history`: its ERP group (30 courses) is open, so the sidebar is still tall, and labels such as "ERP Procurement and Fulfillment Exceptions" are still wider than 150 px. The catalog page now shows 14 closed groups and may no longer overflow. Update the comment that explains the choice. |
| `apps/ayokoding-www-fe-e2e/tests/e2e/steps/navigation.steps.ts`                                         | No change expected: `/en/learn/courses` still has "Expand section" buttons (on `learn` and on course rows). Verify in Phase 5.                                                                                                                                                                                                                                        |
| `tests/unit/be-steps/helpers/test-service.ts`                                                           | Give one mock course a `category` so the new navigation-api scenario has data.                                                                                                                                                                                                                                                                                        |
| `tests/unit/be-steps/index-generation.steps.ts`, `tests/integration/be-steps/index-generation.steps.ts` | Bind the new scenario.                                                                                                                                                                                                                                                                                                                                                |

## Manual verification (Phase 5)

Run the dev server (port 3101) and use Playwright (MCP browser tools) against it. Save screenshots to
the plan's `evidence/` folder as `phase-5-<what>-<locale>-<width>px.png`.

| Check                                                                                                             | Widths         | Locale |
| ----------------------------------------------------------------------------------------------------------------- | -------------- | ------ |
| `/en/learn/courses`: 14 sections in order, 181 cards, jump links work, no sub-links, no sideways scroll           | 375, 768, 1280 | en     |
| `/en/learn/courses/sql-essentials`: header, Start goes to `learning/overview`, contents below, sidebar group open | 375, 1280      | en     |
| `/en/learn/courses/sql-essentials?path=<a path id>`: header keeps `?path=` on Start; no path chips                | 1280           | en     |
| `/en/learn/courses/accounting-foundations`: Outline badge, no time                                                | 1280           | en     |
| `/en/learn/courses/capstone-data-pipeline` and `/capstone-first-working-software`: Start targets                  | 1280           | en     |
| `/en/learn/courses/sql-essentials/learning/beginner`: no header                                                   | 1280           | en     |
| Mobile drawer on `sql-essentials`: groups, current group open                                                     | 375            | en     |
| Keyboard: Tab through jump links, cards, Start; Enter and Space on a group button                                 | 1280           | en     |
| `/id` home and one `/id/` content page: sidebar renders, no console errors; `/id/learn/courses` still 404         | 375, 1280      | id     |
| Browser console: no errors or hydration warnings on every page above                                              | —              | en, id |
