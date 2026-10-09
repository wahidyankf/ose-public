# 006 — E2E Rebinding and Testing Strategy

This plan changes four kinds of thing, and each is proven a different way:

| What changes                                              | Proven by                                                                                                                                                  |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 8 courses (prose, code, drilling)                         | Per course: the mode quality gate and the Content Quality Gate (judgement), and the code harness (execution). For all 8 together: a new content-shape test |
| One manifest, the membership list, the path page          | Plan 02's integrity tests over the real manifest, plus the edited manifest test and a new "every career path has a goal" test                              |
| Start-fallback scenario (shape 2) and the outline anchors | Edited Gherkin exemptions with Unit proof; no E2E binding left that needs a course that no longer exists                                                   |
| The reader's view (no new screen or component)            | Manual browser checks on port 3101                                                                                                                         |

## Layers

The app's BDD contract binds every Gherkin scenario in `specs/apps/ayokoding/www/behaviours/` to the
adapters declared in `apps/ayokoding-www/behaviour-coverage.json`:

| Adapter     | Bindings folder                        | In `test:quick`? |
| ----------- | -------------------------------------- | ---------------- |
| Unit        | `apps/ayokoding-www/tests/unit`        | Yes              |
| Integration | `apps/ayokoding-www/tests/integration` | No (CI)          |
| E2E         | `apps/ayokoding-www-fe-e2e/tests/e2e`  | No (CI)          |

A scenario needs exactly one binding per adapter, or an exemption tag with an
`# Exemption(<adapter>): <reason>; alternative-proof: <target> / <scenario>` comment immediately above the
tag. The reason is about the layer boundary, not about difficulty or cost, and Unit must still prove the
scenario. `test:coverage:behaviour` checks this statically. The backend corpus is also bound by
`apps/ayokoding-www-be-e2e`, so a new backend feature needs an E2E binding there or an E2E exemption.

## New Feature: Capstone Course Completion

`specs/apps/ayokoding/www/behaviours/backend/content/capstone-course-completion.feature` holds nine
scenarios (the text, with the exemption comments, is in [../prd.md](../prd.md#new-backendcontentcapstone-course-completionfeature)).
Every scenario carries `@integration-exempt @e2e-exempt`, because it reads committed course files only.

- **Unit binding:** `apps/ayokoding-www/tests/unit/be-steps/capstone-course-completion.steps.ts`. It
  lists the eight rewritten slugs in one constant (they are this plan's subject), plus the general rule
  over every `capstone-*` course. It parses each `_index.md` with gray-matter and reads the Markdown
  files of each course from `content/en/learn/courses/<slug>/`.
- **Word count:** whitespace-separated tokens across every `.md` file in the course folder, with
  frontmatter removed, code blocks included, and any file under a `code/` folder excluded (code
  folders hold unit READMEs, not course pages). This is the rule plan 02's outline guard uses, written as
  a small helper in the step file (test code, not product code).
- **Why a test and not a script:** series decision 37 keeps checks inside the app's tested TypeScript
  or `ayokoding-cli`, never ad-hoc scripts. A test also keeps guarding these courses after the plan
  archives: a later edit that empties a capstone, drops a heading, or adds a network call fails
  `test:quick`.
- **What it does not check:** example counts, annotation density, diagram counts, and prose quality
  belong to the quality gates; whether code runs belongs to `ayokoding-www:examples:check`.

What each scenario reads:

| Scenario                                                                          | Reads                                                                                                                                                                                                                                                       |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No capstone course is an outline                                                  | `_index.md` of every `capstone-*` course: no `status`, `format: capstone`                                                                                                                                                                                   |
| Every rewritten capstone reaches its word floor                                   | The word helper: 23,000 for the seven standard courses, 18,000 for the no-code course                                                                                                                                                                       |
| Every rewritten capstone states its project contract                              | `learning/capstone/overview.md` has the six H2 headings in order; the acceptance table has 8 or more rows and every row has a non-empty proof cell; the rubric has 6 or more rows; `learning/overview.md` has the mode sentence and the `relies-on` heading |
| Every rewritten capstone has the full drilling page                               | `drilling/overview.md` has the five drill headings and at least 5,000 words; standard courses have at least 5 `kata-NN-*` folders                                                                                                                           |
| Every code capstone is a harness course                                           | A `run.yaml` exists under `learning/code`, `drilling/code`, and `learning/capstone/code`; the no-code course has no `code/` folder and no `run.yaml`                                                                                                        |
| Capstone pages link prerequisites at course level only                            | CL1 and CL4 from [003](./003-prerequisites-readiness-and-ordering.md#course-level-coupling)                                                                                                                                                                 |
| Security-flavoured capstones state their boundary and use no network or shell API | `## Safety boundary` in the course `overview.md` of the three; no banned import or call in their code folders (list in [004](./004-code-harness-and-determinism-design.md#safety-checks-for-security-courses))                                              |
| The lead capstone repeats the concurrency capstone's figures exactly              | Each figure in the table in [004](./004-code-harness-and-determinism-design.md#cross-course-figures) appears in the source expected-output file and in the lead course                                                                                      |
| Shared copies are byte-identical                                                  | The showdown's `vectors.json` in the capstone unit and in ex-46; the real-world delivery's manifests and infrastructure files in the capstone unit and in ex-29, ex-30, ex-32                                                                               |

## New Feature: Career Path Goals

`specs/apps/ayokoding/www/behaviours/frontend/course-paths/career-path-goals.feature` holds two
scenarios (text in [../prd.md](../prd.md#new-frontendcourse-pathscareer-path-goalsfeature)).

- **Unit binding:** `tests/unit/fe-steps/career-path-goals.steps.ts`, calling the same helpers as
  `career-goals.unit.test.ts` and `careers-ai-manifest.unit.test.ts` (listed in
  [005](./005-ai-path-goal-and-closure.md#test-changes)).
- **Integration and E2E:** exempt for both scenarios. The scenarios read committed manifest files, and
  the browser-test server replaces production manifests with isolated route fixtures
  (`AYOKODING_WEB_MANIFESTS_DIR`), so the published AI manifest is not available through that boundary.
  The alternative proof is Unit over the real manifest.

## Modified Feature: `course-landing-header.feature` (plan 03)

Plan 03's scenario "Start falls back to the first learning page" has one real-content E2E binding:
`capstone-data-pipeline`, the one course of its kind with a `learning/` folder that holds only
`capstone/`. Eight courses had that shape on 2026-10-09 and all eight are the skeleton capstones this
plan writes. Plan 03's own note says what to do when plan 08 gives them a `learning/overview.md`:
rebind the E2E step to another course with the same shape, or if none remains, record a new exemption
with its own reason. None remains, so this plan records the exemption.

The edit, to the merged feature file (the scenario text and the Unit binding do not change):

```gherkin
  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / Start falls back to the first learning page
  @integration-exempt
  # Exemption(e2e): the browser-test server serves the published course tree, in which no course has a learning folder without an overview page once every capstone has one, and it substitutes manifests only, so the shape cannot be supplied at that boundary; alternative-proof: ayokoding-www:test:unit / Start falls back to the first learning page
  @e2e-exempt
  Scenario: Start falls back to the first learning page
```

- The integration exemption's alternative proof moves from the E2E target to the Unit target, because
  the E2E binding goes away.
- In `apps/ayokoding-www-fe-e2e/tests/e2e/steps/course-landing-header.steps.ts` the step bound to this
  scenario (and its `capstone-data-pipeline` navigation) is removed. The other steps in the file stay.
- The Unit binding in `tests/unit/fe-steps/course-landing-header.steps.tsx` already uses fixture trees for
  all three Start shapes, so it keeps proving the rule; Phase 0 confirms this before the edit. If the
  merged Unit binding is not fixture-based, a fixture-based proof is added first (RED, GREEN).
- **Shape 3** ("Start falls back to the course overview") binds to `capstone-first-working-software`, a
  course this plan does not touch. Its binding stays. Plans 11–13 audit that course; if one of them gives
  it a `learning/` folder, that plan rebinds the step (cross-plan assumption in
  [README.md](./README.md#cross-plan-assumptions)).
- **Shape 1** is unchanged. It now applies to all eight capstones; the manual check below confirms
  Start on each opens `learning/overview`.

## Outline Anchors: Tests That Use a Real Outline Course

Plans 02, 03, and 04 write E2E steps while outline courses exist, and some of them use a real outline
course as the example of "an outline course". After plan 07 merges, the eight capstones are the **only**
outline courses left, so any such step is anchored to one of them (plan 06 and plan 07 each re-point the
anchor as the previous one is filled). This plan fills the last eight. At this plan's pull-request head
**no course carries `status: outline`** (series decision 40), so every test that needs a real outline
course would fail.

The expected scenarios, to be confirmed by Phase 0's search of the merged `origin/main`:

| Plan | Scenario (feature)                                                                          | Layer that needs a real outline course |
| ---- | ------------------------------------------------------------------------------------------- | -------------------------------------- |
| 02   | An outline course carries an Outline badge wherever a path lists it (`outline-status`)      | E2E                                    |
| 03   | An outline course card says it is an outline (`course-catalog`)                             | E2E                                    |
| 03   | An outline course header says it is an outline (`course-landing-header`)                    | E2E                                    |
| 04   | The roadmap's outline course card shows an Outline badge (`path-roadmap` or the equivalent) | E2E, or Integration                    |

**Rule.** For every scenario found, at this plan's head:

1. Confirm a Unit binding proves the scenario with a **fixture course** that carries `status: outline`
   (the component and the data builder do not need real content). If it does not, add that Unit proof
   first (RED, then GREEN).
2. Remove the E2E (or Integration) step that opens a real outline course.
3. Add the exemption pair to the scenario in the exact grammar, with the reason:
   "the browser-test server serves the published course tree, in which no course carries the outline
   status by series decision 40, and it substitutes manifests only, so an outline course cannot be
   supplied at that boundary; alternative-proof: ayokoding-www:test:unit / `<scenario title>`".
4. Keep the product code. The outline status, the schema key, the badge component, and the integrity
   rule R5 stay: they are how a future course would be marked as unfinished. Only the real-content
   proof moves to fixtures.

The alternatives are recorded in D7 in [008](./008-decision-records.md): a permanent draft fixture
course with `status: outline` (rejected: it would be the one outline course left, it breaks the
end-state count of decision 40, and a draft course lives in the production content tree) and keeping a
real course unfinished on purpose (rejected: it contradicts the purpose of this plan).

Other tests may assume a non-empty outline set against real data. Phase 0 also searches for
`outlineCourseIds` assertions and the plan 02/03/06/07 counters ("62", "24 fewer IDs") that assume a
count against real content, and updates each to the new value (zero). Synthetic fixtures need no change.

## Unit Tests That Change (Not Bound to Gherkin)

| File (under `apps/ayokoding-www/`)                                                    | Change                                                                                                      |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `tests/unit/features/course-paths/manifests/careers/careers-ai-manifest.unit.test.ts` | Goal, core size and order, `assumes`, phase ids (see [005](./005-ai-path-goal-and-closure.md#test-changes)) |
| `tests/unit/features/course-paths/manifests/legacy-membership.ts`                     | AI array gains two IDs, with the reason in a comment                                                        |
| `tests/unit/features/course-paths/manifests/careers/career-goals.unit.test.ts` (new)  | Every career manifest has at least one goal                                                                 |
| `tests/unit/features/content/course-frontmatter.unit.test.ts` (plan 02)               | No edit; it must pass for the eight (each has more than 1,000 words, so `status: outline` is not required)  |
| The metadata drift test in `tests/unit/be-steps/course-metadata.steps.ts` (plan 03)   | No edit; it prints the expected `estimatedHours` for the eight; the maker copies the value                  |

## Layer Summary and Scenario-to-Test Map

| Scenario                                                                          | Unit                                                   | Integration | E2E                        |
| --------------------------------------------------------------------------------- | ------------------------------------------------------ | ----------- | -------------------------- |
| No capstone course is an outline                                                  | `be-steps/capstone-course-completion.steps.ts`         | exempt      | exempt (both E2E projects) |
| Every rewritten capstone reaches its word floor                                   | same                                                   | exempt      | exempt                     |
| Every rewritten capstone states its project contract                              | same                                                   | exempt      | exempt                     |
| Every rewritten capstone has the full drilling page                               | same                                                   | exempt      | exempt                     |
| Every code capstone is a harness course                                           | same                                                   | exempt      | exempt                     |
| Capstone pages link prerequisites at course level only                            | same                                                   | exempt      | exempt                     |
| Security-flavoured capstones state their boundary and use no network or shell API | same                                                   | exempt      | exempt                     |
| The lead capstone repeats the concurrency capstone's figures exactly              | same                                                   | exempt      | exempt                     |
| Shared copies are byte-identical                                                  | same                                                   | exempt      | exempt                     |
| Every career path declares at least one goal                                      | `fe-steps/career-path-goals.steps.ts`                  | exempt      | exempt                     |
| The AI Engineer path ends in the coding agent capstone                            | same                                                   | exempt      | exempt                     |
| Start falls back to the first learning page (edited)                              | `fe-steps/course-landing-header.steps.tsx` (unchanged) | exempt      | **exempt (new)**           |
| The outline-anchored scenarios of plans 02–04 (edited, as found in Phase 0)       | their existing Unit bindings, with fixture courses     | as before   | **exempt (new)**           |

## The Harness and the Gates

- `ayokoding-www:examples:check` (plan 05) runs in the PR gate for every affected opted-in course. With
  seven new opted-in courses it runs in `since` mode over 7 courses and 358 units; the time risk and its
  response ladder are in [004](./004-code-harness-and-determinism-design.md#run-time-budget).
- If the shard-count fix is needed (in `apps/ayokoding-cli` and, if the count is made there, the CI
  planning step), it is proven RED then GREEN with a regression test in the CLI's unit suite, per plan
  05's migration step M11.
- The mode gate and the Content Quality Gate judge each course; their reports are the proof for the
  judged parts of the definition of done.

## Manual Checks

Run on the dev server (port 3101) with Playwright MCP at 375, 768, and 1280 px, with zero console errors
(hydration warnings count as errors). The exact steps are in [../delivery.md](../delivery.md).

| Page                                                                         | What must be true                                                                                                                                            |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/en/learn/paths/careers/immediately-effective/ai-engineer`                  | Four core phases with outcomes, the goal as the last core course, "Before you start" lists the four assumed courses, five extension phases, no Outline badge |
| The three software-engineer career path pages                                | The capstones appear in their extension phases with no Outline badge; counts unchanged                                                                       |
| `/en/learn/courses`                                                          | The eight capstone cards show a format and "About N h", with no Outline badge; no Outline badge anywhere on the page                                         |
| `/en/learn/courses/capstone-data-pipeline` (and each of the other seven)     | Header shows the description, prerequisites as links (with the new ones), and Start; Start opens `learning/overview` (not the capstone page)                 |
| A theme page of a standard capstone and a theme page of the no-code capstone | Code, output, tables, and Mermaid diagrams render; the worked-example headings read well                                                                     |
| One capstone overview page                                                   | The acceptance table, the rubric table, and the milestones table render and fit at 375 px (scroll inside the table, not the page)                            |
| `/en/learn/courses/capstone-secure-service` and the pentest engine           | The safety boundary is visible near the top                                                                                                                  |
| `/id` and the Phase 0 Indonesian pages                                       | Same as the Phase 0 baseline; nothing under `content/id/` changed                                                                                            |

The tRPC route data is checked at the HTTP boundary (`coursePaths.getRouteData`, locales `en`, `id`, and
the invalid `xx`), as plans 02 and 06 did. For `en`, `outlineCourseIds` is empty.
