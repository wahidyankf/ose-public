# 007 — Testing Strategy

This plan changes content, not product code, so most of its proof is not a new test. It changes five kinds of
thing, and each is proven a different way:

| What changes                                                   | Proven by                                                                                                                                                                                        |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 32 courses (prose, code, drilling)                             | Per course: the mode quality gate and the Content Quality Gate (judgement), and the code harness (execution). For all 32 together: a new content-shape test, written first for each course (RED) |
| Five filler-baseline entries                                   | Plan 09's filler-guard tests: the entry must leave the baseline in the same commit as the fixed course                                                                                           |
| `prerequisites` and `estimatedHours` of the 32 course indexes  | Plan 02's integrity tests and plan 03's drift test over the real content                                                                                                                         |
| The AI manifest, only on the exception in 005                  | `careers-ai-manifest.unit.test.ts` and the integrity tests, RED then GREEN                                                                                                                       |
| CI shard count and timeout (rungs 2b and 3), only if triggered | Go unit tests in `apps/ayokoding-cli` and the workflow's own run on the draft PR, regression test first                                                                                          |

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
`apps/ayokoding-www-be-e2e`, so a new backend feature needs an E2E binding there or an E2E exemption.

## New Feature: Audited Course Completion

`specs/apps/ayokoding/www/behaviours/backend/content/audited-course-completion.feature` holds eight
scenarios. Their text, with the exemption comments, is in
[../prd.md](../prd.md#new-backendcontentaudited-course-completionfeature). Every scenario carries
`@integration-exempt @e2e-exempt`: course completeness is a property of committed content, not of a browser or
HTTP boundary, and whether the code runs belongs to `ayokoding-www:examples:check`.

- **Unit binding:** `apps/ayokoding-www/tests/unit/be-steps/audited-course-completion.steps.ts`.
- **Registry:** `apps/ayokoding-www/tests/unit/be-steps/audited-courses.ts` exports `AUDITED_COURSES`, a list of
  `{ slug, format }` rows, and `DEFERRED_BY_USER`, a list of slugs that is empty unless the user decides in
  writing to ship the PR without a BLOCKED course. It is test support code, not product code. The registry starts
  empty (a Gherkin `Scenario Outline` needs no rows to bind) and gains one row per course in that course's
  commit. Plans 12 and 13 add their courses to the same list, so one feature guards every audited course in the
  series.
- **Probe row.** An environment variable, `AUDIT_PROBE=<slug>:<format>`, adds one course to the registry for a
  single run. CP-1 uses it to show a course RED before the audit, without a red row in the working tree.
- **Seven scenarios first, the eighth last.** Phase 1 commits the first seven scenarios (they pass on an empty
  registry). The eighth, "The registry lists every course of this plan", cannot be green until every course
  is registered, so Phase 7 adds it, Gherkin first, once the last row exists.- **Why a registry and not a manifest.** Plan 06's completion test follows the two accounting manifests to
  find its courses. The 32 courses here belong to many paths, so no manifest lists them; a registry lists
  exactly the courses that have been audited, and the test fails when one of them regresses.
- **Floors by mode.** The step file holds one table (word floor, example floor and heading form, diagram rule,
  kata floor, example-unit floor) and reads the row for the course's registered `format`. The table is the
  one in [002](./002-definition-of-done-and-targets.md#targets-by-mode); a change to a floor changes both in
  one commit.
- **Counting rules.** Words are whitespace-separated tokens across every `.md` file of the course outside
  `code/` folders and without `_index.md`, frontmatter removed, fenced code included (the rule behind every number in the briefs). Examples are the headings of the mode's form, read in page order and checked for
  numbering 1 to N without a gap. Diagrams are ` ```mermaid ` fences. "Why It Matters" is the block that
  follows the heading `**Why It Matters**` or `### Why It Matters` and runs to the next heading or the next
  bold label.
- **Why a test and not a script.** Series decision 37 keeps checks in the app's tested TypeScript or in
  `ayokoding-cli`, never ad-hoc scripts. A test also keeps guarding these courses after the plan archives: a
  later edit that thins a course fails `test:quick`.
- **What it does not check.** Annotation density, the code-bearing share of an Annotated Concept course,
  illustration justification, accuracy, and prose quality belong to the quality gates. Whether the code runs
  and its output is stable belongs to `examples check`.

### Test-First for Content

Each course follows the same loop. CP-1 runs the step file with the course as a probe row and `UNIT-NODE`: the
scenarios that the course does not yet meet fail, and the ledger records which. CP-2 to CP-5 close them. CP-6
adds the real row to `AUDITED_COURSES` and commits it with the course, GREEN. A row is never committed RED, so
no push has a failing test, and the red probe run per course is the evidence that the test could fail.

## The Filler Baseline Ratchet

Plan 09 added a deterministic filler guard (`core/course-filler.ts`, rules FG1 to FG6) with a closed baseline
in `core/course-filler-baseline.ts`: `FILLER_BASELINE`, `FILLER_BASELINE_CAP`, and
`REWRITTEN_FILLER_COURSES`. The baseline held 25 non-outline courses that fire a rule on 2026-10-09; plan 09
rewrites 8 of them, so the baseline and its cap read 17 when this plan starts. Each entry carries an owner tag.
Five of the 17 are tagged `plan-11`. The guard's three rules, which live in the skill module
`reference/course-quality-guards.md`, bind this plan:

- **FILL1.** A course that is not an outline must not be templated filler: it passes FG1 to FG6.
- **FILL2.** The baseline only shrinks: no new entry, the cap falls in the commit that removes an entry, and a
  listed course that no longer fires must leave the list.
- **SEC1.** Security course examples use only reserved addresses. It binds plan 09's two security courses and
  none of the 32 here.

The six measures, in plan 09's words: FG1 is the ratio of distinct example bodies (below 0.5 fires); FG2 the
ratio of distinct unit code (below 0.5); FG3 the share of bodies that have a near-duplicate (0.5 or more);
FG4 the share of stub units of fewer than 4 non-blank code lines (0.8 or more); FG5 total words below 1,000;
FG6 the share of words in paragraphs that repeat in at least 10 example bodies (0.25 or more). A rule needs at
least 10 samples (20 for FG6) before it can fire.

| Course                          | Rules fired on 2026-10-09 | Measured values (plan 09's calibration)                                  | Wave |
| ------------------------------- | ------------------------- | ------------------------------------------------------------------------ | ---- |
| `just-enough-go`                | FG6                       | Repeated-paragraph share 0.55 (limit 0.25); near-duplicate share 0.37    | 1    |
| `just-enough-java`              | FG2, FG3, FG4             | Unique code 0.34 (limit 0.5); near-duplicate share 1.00; stub share 0.95 | 3    |
| `building-production-cli-tools` | FG6                       | Repeated-paragraph share 0.49                                            | 6    |
| `just-enough-cpp`               | FG3, FG6                  | Near-duplicate share 0.95; repeated-paragraph share 0.67                 | 7    |
| `cicd-and-release-engineering`  | FG6                       | Repeated-paragraph share 0.42                                            | 9    |

The ratchet binds this plan in four ways:

1. **CP-6 removes the entry.** For each of the five courses the coordinator deletes the course's entry from
   `FILLER_BASELINE` and lowers `FILLER_BASELINE_CAP` by one, in the same commit as the course. If the entry
   stayed, the guard's test "every baseline course still fires" would fail once the course no longer fires; if
   the course still fired, "every non-outline course that fires a rule is in the baseline" would fail after
   the removal. The course's audit is therefore not DONE until `course-filler.steps.ts` is green without its
   entry. After the fifth removal the baseline holds 12 entries (the `plan-12` and `plan-13` courses), the cap
   is 12, and no entry carries the tag `plan-11`.
2. **The other 27 courses must not start firing.** Rewriting 826 units and about 312,328 words
   risks templated output: a maker that writes 86 "Why It Matters" paragraphs from one template fires FG1,
   FG3, or FG6, and a maker that copies one program with new literals fires FG2. Two details of the
   normalization matter to makers. Comments are stripped before FG2 and FG4 measure a unit, so a unit with
   twenty annotation lines and three code lines counts as a stub; write each example with at least four code
   lines. And FG6 counts a paragraph that repeats in ten example bodies, so a closing "why it matters" sentence
   is written from the example's own code and output, never from a template. CP-2 runs
   `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts`, which scans the whole corpus, and the packet owner
   reads the course's own row in the printed metrics table before the gates. A course that fires is fixed,
   never added to the baseline (FILL2 forbids a new entry).
3. **No exemption.** If a rule seems wrong for a course, the rule is changed with a fixture and a new
   calibration table in plan 09's module, not exempted here.
4. **`REWRITTEN_FILLER_COURSES` is plan 09's list.** This plan does not add to it: once an entry is gone, the
   guard's general scenario ("every non-outline course that fires a rule is in the baseline") keeps guarding
   the course, and a course cannot be in both lists.

The end-state gate reads the result directly: no entry tagged `plan-11` remains, the cap is 12, the
scan reports no fired rule for any of the 32 slugs, and `course-filler.steps.ts` exits 0
([delivery.md](../delivery.md#phase-8-end-state-gate)).

Phase 0 reads the merged baseline. If a plan 11 course has already left the list, the owner tags differ, or the
cap is not 17, the table above is corrected in the evidence, and the ledger rows say which courses need the
removal. An unexplained difference (an extra course in the baseline that plan 09's calibration did not list) is
reported to the user and is not baselined by this plan.

## Scenario-to-Test Map

| Scenario                                                              | Unit                                          | Integration | E2E                        |
| --------------------------------------------------------------------- | --------------------------------------------- | ----------- | -------------------------- |
| No audited course is an outline and each declares its mode            | `be-steps/audited-course-completion.steps.ts` | exempt      | exempt (both E2E projects) |
| Every audited course reaches the word floor of its mode               | same                                          | exempt      | exempt                     |
| Every audited course has the example count and numbering of its mode  | same                                          | exempt      | exempt                     |
| Every audited course has the diagrams of its mode                     | same                                          | exempt      | exempt                     |
| Every example has a "Why It Matters" block of 50 to 100 words         | same                                          | exempt      | exempt                     |
| Every audited course has the full drilling page                       | same                                          | exempt      | exempt                     |
| Every audited course keeps its code in units with a run specification | same                                          | exempt      | exempt                     |
| The registry lists every course of this plan                          | same                                          | exempt      | exempt                     |

Other tests this plan relies on, all existing:

| Test                                                                                                                     | Run when                                                      |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` (plan 09)                                                         | CP-2, and CP-6 for the five baseline courses                  |
| `UNIT-NODE tests/unit/be-steps/course-metadata.steps.ts` (plan 03)                                                       | CP-6, to read the expected `estimatedHours`                   |
| The path integrity tests in [005](./005-prerequisites-ai-core-and-integrity.md#the-integrity-tests-that-must-stay-green) | CP-6 when `prerequisites` changed                             |
| `ayokoding-www:examples:check` (plan 05)                                                                                 | CP-5 per course; the PR gate on every push                    |
| `QUICK`, `BEHAVIOUR`, `E2E-BEHAVIOUR`, `BE-E2E-BEHAVIOUR`                                                                | Each checkpoint push and the end-state gate                   |
| `INTEGRATION`, `E2E-QUICK`, `E2E`                                                                                        | The end-state gate (regression only; this plan changes no UI) |

## Conditional Harness Tests

If the ladder's rung 2b triggers ([004](./004-toolchain-additions-and-ci-cost.md#the-response-ladder)), the
shard-count rule gets a regression test before the change, in the place Phase 1 finds it:

- **RED:** a selection of 813 units over 9 courses returns four shards; the rule says eight.
- **GREEN:** it returns eight; 800 units return four; 120 units return one.
- If rung 2c triggers, a test shows the split is by unit count (largest first), with no overlap and no gap
  across `1..N`, as plan 05's selection tests already assert for the slug split.

These are Go tests in `apps/ayokoding-cli` (`CLI-QUICK`) or workflow-plan tests, and they carry plan 05's
selection scenarios (the two Gherkin scenarios in the text of [../prd.md](../prd.md#conditional-modified-cli-selection-scenarios)).
Rung 3 (the timeout) is a workflow constant and is proven by the draft PR's own run finishing inside it.

## Manual Verification

The plan changes course pages and code, not components, but a reader sees them, so the end-state gate checks
them in a browser and on the wire. Each check names its expected observation in
[../delivery.md](../delivery.md#phase-9-manual-verification).

- **Browser (port 3101, 375×800 and 1280×800, English).** For one course per family (a tools course, a
  language, an infrastructure course) and the no-code course: open the course landing, a learning page, the
  drilling page, and the capstone page. Expect: examples render in order with their code and output blocks;
  Mermaid diagrams render; `<details>` blocks in drilling open; no "Outline" badge; the catalog card shows the
  format and the hours; the course appears in its path unchanged.
- **Wire.** The tRPC catalog payload lists the same `outlineCourseIds` as at baseline (this plan changes none)
  and carries the recomputed `estimatedHours` for three sampled courses.
- **Harness.** Run `EX-CHECK` directly for three sampled courses (one per family) and read the coverage
  report: 31 of 31 applicable courses covered, one not applicable.
- **Indonesian locale.** `rtk git status --short -- apps/ayokoding-www/content/id` is empty after every
  index generation; the `/id` landing pages are unchanged.
