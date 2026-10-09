# 007 — Testing Strategy

This plan changes three kinds of thing, and each is proven a different way:

| What changes                                    | Proven by                                                                                                                                                   |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 24 courses (prose, code, drilling)              | Per course: the mode quality gate and the Content Quality Gate (judgement), and the code harness (execution). For all 24 together: a new content-shape test |
| Two manifests, prerequisites, marker, allowlist | Plan 02's integrity tests over the real manifests, plus the edited manifest tests below                                                                     |
| The skills landing, hub strapline, path pages   | Unit tests with React Testing Library, the E2E suite, and manual browser checks on port 3101                                                                |

## Layers

The app's BDD contract binds every Gherkin scenario in `specs/apps/ayokoding/www/behaviours/` to the
adapters declared in `apps/ayokoding-www/behaviour-coverage.json`:

| Adapter     | Bindings folder                        | In `test:quick`? |
| ----------- | -------------------------------------- | ---------------- |
| Unit        | `apps/ayokoding-www/tests/unit`        | Yes              |
| Integration | `apps/ayokoding-www/tests/integration` | No (CI)          |
| E2E         | `apps/ayokoding-www-fe-e2e/tests/e2e`  | No (CI)          |

A scenario needs exactly one binding per adapter, or an exemption tag with an
`# Exemption(<adapter>): <reason>; alternative-proof: <target> / <scenario>` comment, as the existing
features do. `test:coverage:behaviour` checks this statically. The backend corpus is also bound by
`apps/ayokoding-www-be-e2e`, so a new backend feature needs an E2E binding there or an E2E exemption.

## New Feature: Accounting Course Completion

`specs/apps/ayokoding/www/behaviours/backend/content/accounting-course-completion.feature` holds
seven scenarios. Their text, with the exemption comments, is in
[../prd.md](../prd.md#new-backendcontentaccounting-course-completionfeature). Every scenario carries
`@integration-exempt @e2e-exempt`.

- **Unit binding:** `apps/ayokoding-www/tests/unit/be-steps/accounting-course-completion.steps.ts`.
  It reads the two real manifests to get the course list (so the test follows the paths, not a
  hard-coded list), parses each `_index.md` with gray-matter, and reads the Markdown files of each
  course from `content/en/learn/courses/<slug>/`.
- **Word count:** whitespace-separated tokens across every `.md` file in the course folder, with
  frontmatter removed and code blocks included. This is the same rule plan 02's outline guard uses,
  written as a small helper in the step file (test code, not product code).
- **Why a test and not a script:** series decision 37 keeps checks inside the app's tested TypeScript
  or `ayokoding-cli`, never ad-hoc scripts. A test also keeps guarding these courses after the plan
  archives: a later edit that empties a course fails `test:quick`.
- **What it does not check:** example counts, diagram counts, annotation density, and prose quality
  belong to the quality gates; whether code runs belongs to `ayokoding-www:examples:check`.
- **The last two scenarios** enforce Sharia rules SC6 and SC7; how they match text is in
  [010](./010-rule-and-docs-impact.md#how-the-gated-rules-are-checked).

## Modified Features

### `frontend/course-paths/skills-fixed-arc-statement.feature`

The one scenario is reworded, and the feature title and narrative follow; the text is in
[../prd.md](../prd.md#modified-frontendcourse-pathsskills-fixed-arc-statementfeature).

Bindings: `tests/unit/fe-steps/skills-fixed-arc-statement.steps.tsx` (Unit) and
`apps/ayokoding-www-fe-e2e/tests/e2e/steps/course-paths.steps.ts` (E2E; today's step text "Get up and
running fast on the ramp" is replaced). The file name stays, so no binding moves.

### `frontend/course-paths/skills-path-composition.feature`

One scenario outline is added after the existing one; the text is in
[../prd.md](../prd.md#modified-frontendcourse-pathsskills-path-compositionfeature).

Bindings: `tests/unit/features/course-paths/manifests/skills/skills-path-composition.unit.test.ts`
(Unit) and `tests/integration/fe-steps/skills-path-composition.steps.ts` (Integration). In both, the
expected order for the existing scenario swaps journal entries before financial statements.

### `frontend/course-paths/path-copy.feature` (plan 02's)

One scenario is added, following the form of plan 02's two scenarios as merged (Phase 0 reads
them); the text is in
[../prd.md](../prd.md#modified-frontendcourse-pathspath-copyfeature-plan-02s).

Bindings: plan 02's `tests/unit/fe-steps/path-copy.steps.ts` (Unit), with the same Integration and
E2E exemptions as plan 02's scenarios.

## Unit Tests That Change (Not Bound to Gherkin)

| File (under `apps/ayokoding-www/`)                                                                | Change                                                                                                                              |
| ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `tests/unit/features/course-paths/shell/category-landing.test.tsx`                                | The skills statement test expects the new text once; a new case asserts no "Dangerous", "Comfortable", or "Confident" label renders |
| `tests/unit/features/course-paths/shell/ramp-milestone-strip.test.tsx`                            | Deleted with the component                                                                                                          |
| `tests/unit/features/course-paths/manifests/skills/conventional-accounting-manifest.unit.test.ts` | New order, six phases, outcomes, no marker, `assumes`                                                                               |
| `tests/unit/features/course-paths/manifests/skills/sharia-accounting-manifest.unit.test.ts`       | The same with seven phases                                                                                                          |
| `tests/unit/features/course-paths/core/skills-restructure-allowlist.test.ts`                      | Exactly two entries, both ERP, both `plan-07`                                                                                       |
| `tests/unit/features/course-paths/core/schemas.test.ts`                                           | Marker cases move to ERP and `plan-07`; `plan-06` is rejected                                                                       |
| `tests/unit/features/course-paths/content/path-copy.unit.test.ts`                                 | Scope adds `paths/skills/_index.md` and the two accounting path pages                                                               |
| `tests/unit/features/course-paths/manifests/skills-order.unit.test.ts`, `legacy-skills-order.ts`  | Only if the test iterates the frozen keys: the two accounting keys are removed                                                      |

The synthetic fixtures in `schemas.test.ts`, `path-hue.test.ts`, and `manifest-repository.test.ts`
mention accounting path IDs only as example data and need no change unless they assert the marker.

## Tests That Use an Accounting Course as a Real Outline Example

Plans 02, 03, and 04 write tests while the 24 courses are still outlines, and some may use a real
accounting course as "an outline course". Plan 03's E2E catalog steps, for example, use
`accounting-foundations` for "An outline course …". After this PR those tests would fail, because the
course is no longer an outline. Phase 0 finds every such test with a search of `origin/main`, and the
metadata phase re-points each one, before the flip, to `erp-foundations-and-history`, which stays an
outline until plan 07 (decision D16 in [008](./008-decision-records.md)). A test that uses synthetic
fixtures needs no change.

## The Harness and the Gates

- `ayokoding-www:examples:check` (plan 05) runs in the PR gate for every affected opted-in course. A
  change under `apps/ayokoding-cli/toolchains/` (the new `psql` entry) puts it in full mode for the
  PR.
- The `psql` catalog entry gets a fixture unit under `apps/ayokoding-cli/tests/testdata/courses/` and
  a row in the CLI's toolchain smoke table, following plan 05's "Adding a Toolchain"; it is proven
  RED (no entry: the fixture fails validation) then GREEN.
- The mode gate and the Content Quality Gate judge each course; their reports are the proof for the
  judged parts of the definition of done.

## Scenario-to-Test Map

| Scenario                                                                              | Unit                                                    | Integration                                 | E2E                        |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------- | -------------------------- |
| No accounting course is an outline                                                    | `be-steps/accounting-course-completion.steps.ts`        | exempt                                      | exempt (both E2E projects) |
| Every accounting course reaches the word floor of its format                          | same                                                    | exempt                                      | exempt                     |
| Every accounting course has the full drilling page                                    | same                                                    | exempt                                      | exempt                     |
| Every accounting course runs its code in the example harness                          | same                                                    | exempt                                      | exempt                     |
| Every Sharia accounting course states its limit and flags board decisions in one form | same                                                    | exempt                                      | exempt                     |
| Sharia accounting courses name superseded AAOIFI standards only as history            | same                                                    | exempt                                      | exempt                     |
| Every AAOIFI link in an accounting course was checked by a person                     | same                                                    | exempt                                      | exempt                     |
| The skills category landing says who its paths are for, once, with no chooser         | `fe-steps/skills-fixed-arc-statement.steps.tsx`         | exempt                                      | `course-paths.steps.ts`    |
| Each accounting skills path is grouped into titled phases with outcomes (2 rows)      | `manifests/skills/skills-path-composition.unit.test.ts` | `fe-steps/skills-path-composition.steps.ts` | exempt                     |
| The skills hub and the accounting path pages use plain words                          | `fe-steps/path-copy.steps.ts`                           | exempt                                      | exempt                     |

## Manual Checks

Run on the dev server (port 3101) with Playwright MCP at 375, 768, and 1280 px, with zero console
errors (hydration warnings count as errors). The exact steps are in [../delivery.md](../delivery.md).

| Page                                                                                          | What must be true                                                                                                     |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `/en/learn/paths/skills`                                                                      | The new statement once; four path cards; no milestone strip                                                           |
| `/en/learn/paths`                                                                             | The accessibility snapshot holds the screen-reader-only skills strapline "Accounting and ERP for software engineers"  |
| `/en/learn/paths/skills/conventional-accounting`                                              | New description and body; six phase headings with outcomes; three assumed courses listed; no Outline badge; no jargon |
| `/en/learn/paths/skills/sharia-accounting`                                                    | Seven phases; the seventh phase's limit line; no Outline badge                                                        |
| `/en/learn/courses/journal-entries-and-posting-mechanics?path=skills/conventional-accounting` | The rail shows phases and position 3 of 19; Next goes to Financial Statements and Close Cycle with `?path=` kept      |
| `/en/learn/courses/sharia-accounting-and-aaoifi-standards`                                    | The disclaimer sentence; one board-decision callout rendered as the warning alert                                     |
| `/en/learn/courses`                                                                           | Accounting cards show a format and a time, with no Outline badge                                                      |
| One By Example level page and one Annotated Concept theme page                                | Code, output, tables, and Mermaid diagrams render                                                                     |
| `/id` and the Phase 0 Indonesian pages                                                        | Same as the Phase 0 baseline; nothing under `content/id/` changed                                                     |

The tRPC route data is checked at the HTTP boundary (`coursePaths.getRouteData`, locales `en`, `id`,
and the invalid `xx`), as plan 02 did.
