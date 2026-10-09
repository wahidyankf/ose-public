# 007 — Testing Strategy

This plan changes four kinds of thing, and each is proven a different way:

| What changes                                                     | Proven by                                                                                                                                                                                |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Eight courses (prose, code, drilling)                            | Per course: the mode quality gate and the Content Quality Gate (judgement), the code harness (execution), and the filler guard (structure). For all eight together: the completion test  |
| The filler guard, its baseline, and the completion test          | Test-driven development: unit tests on synthetic samples and temp folders first (RED), then the code (GREEN), then the real-corpus scenarios; Gherkin features bound to the unit adapter |
| Two toolchain changes (`clojure` entry, `java` install recipe)   | Plan 05's "Adding a Toolchain" proofs: a fixture unit, a smoke-table row, `toolchains build`, and the full CI run                                                                        |
| One skill reference, its index entries, and the generated routes | `./rhino harness adapters generate` and `validate`, then the Rules Quality Gate ([010](./010-rule-and-docs-impact.md))                                                                   |

## Layers

The app's BDD contract binds every Gherkin scenario in `specs/apps/ayokoding/www/behaviours/` to the adapters
declared in `apps/ayokoding-www/behaviour-coverage.json`:

| Adapter     | Bindings folder                        | In `test:quick`? |
| ----------- | -------------------------------------- | ---------------- |
| Unit        | `apps/ayokoding-www/tests/unit`        | Yes              |
| Integration | `apps/ayokoding-www/tests/integration` | No (CI)          |
| E2E         | `apps/ayokoding-www-fe-e2e/tests/e2e`  | No (CI)          |

A scenario needs exactly one binding per adapter, or an exemption tag with an
`# Exemption(<adapter>): <reason>; alternative-proof: <target> / <scenario>` comment, as the existing features
do. `test:coverage:behaviour` checks this statically. The backend corpus is also bound by
`apps/ayokoding-www-be-e2e`, so a new backend feature needs an E2E binding there or an E2E exemption. Steps use
`@amiceli/vitest-cucumber`, and the unit project enforces 99% line coverage over `src/**`, so every line of the
new modules is exercised ([Coverage](#coverage)).

## New Feature 1: Course Filler Guard

`specs/apps/ayokoding/www/behaviours/backend/content/course-filler-guard.feature` holds the rule scenarios, the
scan scenarios, and the baseline-ratchet scenarios. The text, with the exemption comments, is in
[../prd.md](../prd.md#new-backendcontentcourse-filler-guardfeature). Every scenario carries
`@integration-exempt @e2e-exempt`.

- **Unit binding:** `apps/ayokoding-www/tests/unit/be-steps/course-filler.steps.ts`. Rule scenarios build
  `CourseSample` values in memory and call `evaluateCourse`; scan scenarios write a temporary course tree and call
  `scanCourseFiller`; the ratchet scenarios call `scanCourseFiller` on the real course tree and compare the result
  with `FILLER_BASELINE`.
- **Why a test and not a script:** series decision 37 keeps checks inside the app's tested TypeScript or
  `ayokoding-cli`, never ad-hoc scripts. A test also keeps guarding after the plan archives: a later edit that
  adds a templated course, or breaks a rewritten one, fails `test:quick`.
- **What it does not check:** meaning, correctness, and prose quality (the quality gates), whether code runs
  (the harness), and floors and layout (the completion test).

### Supporting unit tests (not bound to Gherkin)

| File (under `apps/ayokoding-www/tests/unit/`)                                                                     | What it proves                                                                                                                                                                                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `features/content/core/course-filler.test.ts`                                                                     | Each rule fires exactly at its threshold and not one step before; samples below the minimum are not judged; empty and tiny samples; shingle edge cases (fewer than four tokens); normalization of digits, strings, and comments by extension; the cluster computation on chains and on two separate pairs                 |
| `features/content/core/course-filler-baseline.test.ts`                                                            | The baseline is sorted by slug, has unique slugs, uses the closed owner set, has a non-empty reason, and its length equals its cap or is below it                                                                                                                                                                         |
| `features/content/shell/course-filler-scan.unit.test.ts`                                                          | Temporary course trees: a templated course, a varied course, an outline course (skipped), a flat-file unit, a comment-heavy unit, an unknown extension, an `obj/` folder that must be ignored, a four-level-deep unit folder                                                                                              |
| `be-steps/support/course-completion-checks.unit.test.ts` (helper: `be-steps/support/course-completion-checks.ts`) | The completion test's helper functions on temp course folders: a complete course passes; a course with 23 Q&A blocks, a missing `## Examples by Level`, a missing `run.yaml`, a malformed object-id header, a capstone id missing from the vectors file, or a stray public address fails with a message naming the defect |

Each rule's test is written first and watched failing for the right reason (RED), then the smallest code makes
it pass (GREEN), then the code is cleaned (REFACTOR). Phase 1 of [../delivery.md](../delivery.md) lists the
rules in that order.

## New Feature 2: Filler Course Completion

`specs/apps/ayokoding/www/behaviours/backend/content/filler-course-completion.feature` holds eight scenarios at Phase 1 and a ninth in Phase 7.
The text is in [../prd.md](../prd.md#new-backendcontentfiller-course-completionfeature). Every scenario carries
`@integration-exempt @e2e-exempt`.

- **Unit binding:** `apps/ayokoding-www/tests/unit/be-steps/filler-course-completion.steps.ts`. It reads
  `REWRITTEN_FILLER_COURSES` for the course list, so the test follows the list and not a hard-coded set; it parses
  each `_index.md` with gray-matter and reads the course's Markdown and code files. The three scenarios that
  name one course (Git, the security courses, the primer) check a course only once it is listed; for an unlisted
  course the step logs `pending: <slug> not yet rewritten` and passes, so the build stays green while the waves
  run, and the Phase 7 scenario fails until all eight are listed. The helper tests on temporary folders
  ([above](#supporting-unit-tests-not-bound-to-gherkin)) are what prove each check can fail.
- **Word count:** whitespace-separated tokens across every `.md` file in the course folder outside `code/`, with
  frontmatter removed and fenced code included. The guard's `totalWords` function is imported, so the number
  matches FG5's.
- **What each scenario checks:**

| Scenario                                                             | How it matches                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No rewritten course is an outline or fires a filler rule             | `status` is not `outline`; the course's guard report has no fired rule                                                                                                                                                                                                                                                                                |
| Every rewritten course reaches the word floor of its format          | `totalWords` is at least 28,000 (By Example and Primer both)                                                                                                                                                                                                                                                                                          |
| Every rewritten course has the full drilling page                    | The five headings in [002](./002-course-modes-and-definition-of-done.md#drilling-targets) exist with the floor counts (`<details>` blocks counted for Q&A and applied problems; list items for the checklist), and the drilling page has at least 5,000 words                                                                                         |
| Every rewritten course lists its examples by level                   | `learning/overview.md` has `## Examples by Level`; the example headings on the three level pages number at least 75, and each heading has a bullet in the overview                                                                                                                                                                                    |
| Every rewritten course runs its code in the example harness          | `_index.md` and the course are opted in (as plan 05 defines opting in); every `ex-NN-*`, `kata-NN-*`, and the capstone folder has a `run.yaml`; the counts equal the example headings that are not marked as illustrations; every kata has `before/` and `after/`                                                                                     |
| The Git course writes the NUL terminator, not a backslash and a zero | No `.py` file in the course contains the three characters backslash, backslash, zero ([004](./004-code-harness-and-determinism.md#the-known-bug-and-its-regression-test)); every 40-digit id in the Git capstone's expected output also appears in the learning folder's `git-oracle-vectors.txt`, and the capstone's own copy of that file equals it |
| Security courses use only reserved addresses                         | The SEC1 scan of [005](./005-security-content-and-accuracy.md#sec1-in-detail) over the two courses' pages, code, and fixtures finds nothing                                                                                                                                                                                                           |
| The primer states its scope and its dependent topic                  | `just-enough-fsharp/overview.md` contains a "Scope" heading whose text names `compilers-parsers-and-transpilers`                                                                                                                                                                                                                                      |

An end-state scenario is added in Phase 7, after the waves: "All eight filler courses are rewritten" asserts that
`REWRITTEN_FILLER_COURSES` equals the eight slugs and `FILLER_BASELINE` holds none of them. It is added only then
because it is red until the last course lands; adding it earlier would put red tests in the series of commits.

## Real-Corpus Scenarios and Plan 14

The ratchet scenarios in the guard feature run on the real tree (181 courses at calibration). They print the
metrics table with `console.info`, so a run with the verbose reporter produces the evidence file for each phase
gate. Plan 14's terminal gate relies on the same module ([003](./003-filler-guard.md#how-plan-14-calls-it)); this
plan adds nothing for plan 14 beyond the scenario "The filler baseline is empty", which plan 14 may add or the
reviewer may run by hand: `FILLER_BASELINE.length` is zero.

## Coverage

- `test:unit` enforces 99% line coverage over `src/**`. The new `core` module is pure, and every branch has a
  boundary test; the `shell` module has temp-folder tests for each file-type branch. Phase 1 runs the unit
  project with coverage and records the new files' numbers.
- `test:coverage:behaviour` checks every scenario has its binding or exemption. Phase 1 and the end-state phase
  both run it.
- The two toolchain changes carry their proofs in `apps/ayokoding-cli` (Go): a fixture course with one unit per
  new toolchain, run through `SMOKE` ([../delivery.md](../delivery.md#command-reference)). The `clojure`
  fixture prints a sorted map; the `java` fixture installs two locked jars from a local file and compiles a
  class against them. Both are RED first (no catalog entry, so validation fails), then GREEN.

## The Harness and the Gates

- `ayokoding-www:examples:check` (plan 05) runs in the PR gate for every affected opted-in course. A change under
  `apps/ayokoding-cli/toolchains/` (the new `clojure` entry and the `java` recipe) puts it in full mode for the
  PR, so the whole opted-in library runs once. The PR's full run is the proof that the `java` entry change did
  not disturb existing Java courses.
- The mode gate and the Content Quality Gate judge each course; their reports are the proof for the judged parts
  of the definition of done.
- Plan 03's metadata drift test runs with each course (CP-6) and in the end-state phase.

## Scenario-to-Test Map

| Scenario                                                                                                                   | Unit                                         | Integration | E2E                        |
| -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ----------- | -------------------------- |
| Rule scenarios (FG1 to FG6, one each, plus the minimum-sample rule)                                                        | `be-steps/course-filler.steps.ts`            | exempt      | exempt (both E2E projects) |
| Scan scenarios (templated, varied, outline, flat file, unknown extension)                                                  | same                                         | exempt      | exempt                     |
| Ratchet scenarios (every firing course is baselined; every entry still fires; cap; owners; disjoint lists; rewritten pass) | same                                         | exempt      | exempt                     |
| No rewritten course is an outline or fires a filler rule                                                                   | `be-steps/filler-course-completion.steps.ts` | exempt      | exempt                     |
| Every rewritten course reaches the word floor of its format                                                                | same                                         | exempt      | exempt                     |
| Every rewritten course has the full drilling page                                                                          | same                                         | exempt      | exempt                     |
| Every rewritten course lists its examples by level                                                                         | same                                         | exempt      | exempt                     |
| Every rewritten course runs its code in the example harness                                                                | same                                         | exempt      | exempt                     |
| The Git course writes the NUL terminator, not a backslash and a zero                                                       | same                                         | exempt      | exempt                     |
| Security courses use only reserved addresses                                                                               | same                                         | exempt      | exempt                     |
| The primer states its scope and its dependent topic                                                                        | same                                         | exempt      | exempt                     |
| All eight filler courses are rewritten (Phase 7)                                                                           | same                                         | exempt      | exempt                     |

## Manual Checks

Run on the dev server (port 3101) with Playwright MCP at 375, 768, and 1280 px, with zero console errors
(hydration warnings count as errors). The exact steps are in [../delivery.md](../delivery.md).

| Page                                                                                                                      | What must be true                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `/en/learn/courses` (catalog)                                                                                             | The eight cards show their format and an hours value from the drift test; none shows an Outline badge             |
| `/en/learn/courses/<slug>` for each of the eight                                                                          | The course page lists overview, learning, drilling; the new description appears                                   |
| One level page of each course (for example `.../learning/beginner`)                                                       | Code, expected output, tables, and Mermaid diagrams render; the example list is long and not repeated             |
| `/en/learn/courses/build-your-own-git/learning/beginner`                                                                  | A shown object id equals the id in `git-oracle-vectors.txt`                                                       |
| `/en/learn/courses/lisp/learning/intermediate`                                                                            | A `syntax-rules` expansion and a Clojure `macroexpand` render as code blocks with output                          |
| `/en/learn/courses/defensive-security/learning/beginner`, `.../vulnerability-management-and-assessment/learning/beginner` | The safe-lab banner appears once at the top; no banner repeats under each example                                 |
| The three career paths that contain the eight courses                                                                     | The cards and the rail list the courses; the order and the phases are as before; no course shows an Outline badge |
| `/id` and the Phase 0 Indonesian pages                                                                                    | Same as the Phase 0 baseline; nothing under `content/id/` changed                                                 |

The tRPC route data is checked at the HTTP boundary (`coursePaths.getRouteData`, locales `en`, `id`, and the
invalid `xx`), as plans 02 and 06 did, because the three career paths are read on the same route.
