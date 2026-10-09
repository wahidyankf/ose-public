# 007 — Testing Strategy

This plan changes content, harness configuration, and two small pieces of CI selection code. Most of its proof is
therefore not a new test. It changes seven kinds of thing, and each is proven a different way:

| What changes                                                            | Proven by                                                                                                                                                                                                             |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 34 courses (prose, code, drilling)                                      | Per course: the mode quality gate and the Content Quality Gate (judgement), and the code harness (execution). For all 34 together: plan 11's content-shape test, extended, with the course as a probe row first (RED) |
| Six filler-baseline entries                                             | Plan 09's filler-guard tests: the entry leaves the baseline in the same commit as the fixed course, and the cap falls by one                                                                                          |
| `prerequisites` and `estimatedHours` of the 34 course indexes           | Plan 02's integrity tests and plan 03's drift test over the real content ([006](./006-prerequisites-metadata-and-closure.md))                                                                                         |
| The AI manifest, only on the exception in 006                           | `careers-ai-manifest.unit.test.ts` and the integrity tests, RED then GREEN                                                                                                                                            |
| Seven toolchain and service ids (five services, two derived images)     | Plan 05's "Adding a Toolchain" tests: a fixture unit and a smoke row per id in the CLI, a Phase 1 spike per id, and a double run at half the CPU quota                                                                |
| CI selection and sharding (rungs 2t and 2d; rungs 2b, 2c, and 3 reused) | Go unit tests in `apps/ayokoding-cli`, regression test first, and the workflow's own run on the draft PR                                                                                                              |
| Capstone obligations of `capstone-solid-core`                           | Plan 08's capstone content-shape test (the six sections, the `relies-on` table, course-level links) and the byte-identity rows of its step file                                                                       |

## Layers

The app's BDD contract binds every Gherkin scenario in `specs/apps/ayokoding/www/behaviours/` to the adapters
declared in `apps/ayokoding-www/behaviour-coverage.json`:

| Adapter     | Bindings folder                        | In `test:quick`? |
| ----------- | -------------------------------------- | ---------------- |
| Unit        | `apps/ayokoding-www/tests/unit`        | Yes              |
| Integration | `apps/ayokoding-www/tests/integration` | No (CI)          |
| E2E         | `apps/ayokoding-www-fe-e2e/tests/e2e`  | No (CI)          |

A scenario needs exactly one binding per adapter, or an exemption tag with an
`# Exemption(<adapter>): <reason>; alternative-proof: <target> / <scenario>` comment, as the existing features do.
`test:coverage:behaviour` checks this statically. The backend corpus is also bound by
`apps/ayokoding-www-be-e2e`, so a backend feature needs an E2E binding there or an E2E exemption.

## Extending the Audited Course Completion Feature

Plan 11 creates `specs/apps/ayokoding/www/behaviours/backend/content/audited-course-completion.feature` with eight
scenarios, its step file `apps/ayokoding-www/tests/unit/be-steps/audited-course-completion.steps.ts`, and the registry
`apps/ayokoding-www/tests/unit/be-steps/audited-courses.ts` that exports `AUDITED_COURSES` (rows of `{ slug, format }`)
and `DEFERRED_BY_USER`. It states that plans 12 and 13 add their courses to the same list, so one feature guards
every audited course in the series. This plan follows that. It creates no second feature file.

- **34 rows.** Each course adds one row in its own commit at CP-6, with `format` set to `by-example`,
  `annotated-concept`, or `capstone` (28, 5, and 1 rows). The row is added after the probe run is GREEN, so no commit
  has a red test and a BLOCKED course leaves no row behind. The registry then lists 66 rows when this plan is done:
  plan 11's 32 and this plan's 34.
- **One new scenario, the ninth.** "The registry lists every course audited by plan 12" holds a constant of the 34
  slugs next to plan 11's constant of its 32 and fails if one is missing from `AUDITED_COURSES` and not in
  `DEFERRED_BY_USER`. Like plan 11's eighth scenario, it cannot be green until the last course is registered, so
  Phase 7 adds it, Gherkin first (RED: the feature text and a step that fail), after the last row exists (GREEN).
  Plan 13 adds a tenth for its own courses. The Gherkin text and the exemption comments are in
  [../prd.md](../prd.md#audited-course-completion-the-ninth-scenario).
- **Phase 0 follows the merged names.** It reads plan 11's step file and records the constant's name and shape, the
  registry's exports, the probe variable, and the scenario titles as merged, and follows them. If plan 11 merged a
  different design (for example one constant per plan in a separate file), this plan adds its own constant in the same
  place and records the difference. The scenario's meaning does not change.
- **Probe row.** `AUDIT_PROBE=<slug>:<format>` adds one course to the registry for a single run. CP-1 uses it to show a
  course RED before the audit without a red row in the working tree. The variable's merged name is read in Phase 0.
- **Floors by mode.** The step file holds one table (word floor, example floor and heading form, diagram rule, kata
  floor, example-unit floor) and reads the row for the course's registered `format`. The table is the one in
  [002](./002-definition-of-done-and-audit-method.md#targets-by-mode); this plan changes no floor. If Phase 0 finds
  that plan 11's table lacks a row for `capstone`, it adds it (23,000 words, 45 worked examples, 10 diagrams, 5
  katas) in the same commit as the first row that needs it, and changes [002](./002-definition-of-done-and-audit-method.md#targets-by-mode)
  only if the numbers differ.
- **Counting rules.** As plan 11 states them: words are whitespace-separated tokens across every `.md` file of the
  course outside `code/` folders and without `_index.md`, frontmatter removed, fenced code included; examples are
  the headings of the mode's form, numbered 1 to N without a gap; diagrams are ` ```mermaid ` fences; "Why It
  Matters" is the block after the heading `**Why It Matters**` or `### Why It Matters` up to the next heading or
  bold label.
- **What it does not check.** Annotation density, the code-bearing share of an Annotated Concept course,
  illustration justification, accuracy, and prose quality belong to the quality gates. Whether the code runs and its
  output is stable belongs to `examples check`. Whether a simulation unit follows S1 to S9 is judged by the gates and
  proved by the double run; the convention's summary line is checked by the harness, not by this test.
- **Why a test and not a script.** Series decision 37 keeps checks in the app's tested TypeScript or in
  `ayokoding-cli`, never ad-hoc scripts. A test also keeps guarding these courses after the plan archives: a later
  edit that thins a course fails `test:quick`.

### Test-First for Content

Each course follows the same loop. CP-1 runs the step file with the course as a probe row and `UNIT-NODE`: the
scenarios the course does not yet meet fail, and the ledger records which. CP-2 to CP-5 close them. CP-6 adds the real
row and commits it with the course, GREEN. The red probe run per course is the evidence that the test could fail.

## The Filler Baseline Ratchet

Plan 09 added a deterministic filler guard (`core/course-filler.ts`, rules FG1 to FG6) with a closed baseline in
`core/course-filler-baseline.ts`: `FILLER_BASELINE`, `FILLER_BASELINE_CAP`, and `REWRITTEN_FILLER_COURSES`. Phase 0
reads the merged names. The arithmetic of the baseline across the series, with the owner tags plan 09 gave each entry:

| Moment                              | Entries | Cap | Entries tagged `plan-12` | Entries tagged `plan-13` |
| ----------------------------------- | ------- | --- | ------------------------ | ------------------------ |
| Plan 09 starts (2026-10-09)         | 25      | 25  | 6                        | 6                        |
| Plan 09 has rewritten eight courses | 17      | 17  | 6                        | 6                        |
| Plan 11 has removed its five        | 12      | 12  | 6                        | 6                        |
| This plan has removed its six       | 6       | 6   | 0                        | 6                        |
| Plan 13 has removed its six         | 0       | 0   | 0                        | 0                        |

The other entries in the first two rows are plan 09's and plan 11's own courses. The two rules that bind this plan
live in the skill module `reference/course-quality-guards.md`:

- **FILL1.** A course that is not an outline must not be templated filler: it passes FG1 to FG6.
- **FILL2.** The baseline only shrinks: no new entry, the cap falls in the commit that removes an entry, and a listed
  course that no longer fires must leave the list.
- **SEC1.** Security course examples use only reserved addresses. It binds plan 09's two security courses and none
  of the 34 here.

The six measures, in plan 09's words: FG1 is the ratio of distinct example bodies (below 0.5 fires); FG2 the ratio
of distinct unit code (below 0.5); FG3 the share of bodies that have a near-duplicate (0.5 or more); FG4 the share
of stub units of fewer than 4 non-blank code lines (0.8 or more); FG5 total words below 1,000; FG6 the share of words
in paragraphs that repeat in at least 10 example bodies (0.25 or more). A rule needs at least 10 samples (20 for
FG6) before it can fire. The six courses of this plan that are in the baseline:

| Course                    | Rules that fire   | Measured values                                                                  | Wave | Size | What is rewritten             |
| ------------------------- | ----------------- | -------------------------------------------------------------------------------- | ---- | ---- | ----------------------------- |
| `build-your-own-database` | FG2               | unique-code ratio 0.04                                                           | 9    | XL   | all units                     |
| `build-your-own-raft`     | FG2 and FG4       | unique-code ratio 0.01; stub share 1.0                                           | 10   | XL   | all units                     |
| `linux-os`                | FG2               | unique-code ratio 0.12                                                           | 3    | XL   | all units                     |
| `system-programming`      | FG2               | unique-code ratio 0.01; 0 bodies                                                 | 8    | XL   | all units                     |
| `windows-os`              | FG2, FG3, and FG6 | unique-code ratio 0.18; near-duplicate share 0.73; repeated-paragraph share 0.68 | 12   | XL   | all units                     |
| `csp-style-concurrency`   | FG6               | repeated-paragraph share 0.49                                                    | 9    | M    | lessons (repeated paragraphs) |

The ratchet binds this plan in five ways:

1. **CP-2b removes the entry.** For each of the six courses the coordinator deletes the course's entry from
   `FILLER_BASELINE` and lowers `FILLER_BASELINE_CAP` by one, in the same commit as the course. If the entry stayed,
   the guard's test "every baseline course still fires" would fail once the course no longer fires; if the course
   still fired, "every non-outline course that fires a rule is in the baseline" would fail after the removal. The
   audit is therefore not DONE until `course-filler.steps.ts` is green without the entry. After the sixth removal the
   baseline holds 6 entries (all `plan-13`), the cap is 6, and no entry carries the tag `plan-12`.
2. **The order of removals is the wave order.** The cap falls one step at each of these commits, so every commit has
   a consistent baseline:

   | Commit order | Course (wave, slot)              | Cap after the commit |
   | ------------ | -------------------------------- | -------------------- |
   | 1            | `linux-os` (3, 3)                | 11                   |
   | 2            | `system-programming` (8, 1)      | 10                   |
   | 3            | `build-your-own-database` (9, 2) | 9                    |
   | 4            | `csp-style-concurrency` (9, 3)   | 8                    |
   | 5            | `build-your-own-raft` (10, 1)    | 7                    |
   | 6            | `windows-os` (12, 1)             | 6                    |

   Two courses of wave 9 may commit in either order; the table follows slot order. A BLOCKED filler course keeps its
   entry and the cap stays above 6 for it; the BLOCKED procedure restores the baseline file too, and the end-state gate
   records the number left.

3. **The other 28 courses must not start firing.** The 14 authoring courses alone need 270,187
   new words, and the plan's target is 2,863 units in all. A maker that writes 85 "Why It Matters" paragraphs from one template fires FG1, FG3, or FG6, and a
   maker that copies one program with new literals fires FG2. Two details of the normalization matter to makers.
   Comments are stripped before FG2 and FG4 measure a unit, so a unit with twenty annotation lines and three code
   lines counts as a stub; write each example with at least four code lines. And FG6 counts a paragraph that repeats
   in ten example bodies, so a closing "why it matters" sentence is written from the example's own code and output,
   never from a template. CP-2 runs `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts`, which scans the whole
   corpus, and the packet owner reads the course's own row in the printed metrics table before the gates. Authoring
   is also split into blocks of at most 15 examples, and a block is not handed on until `FILLER` shows no fired rule
   for it ([005](./005-execution-model-waves-and-ledger.md#rules-that-keep-the-loop-bounded), rule 8). A course that
   fires is fixed, never added to the baseline (FILL2 forbids a new entry).
4. **No exemption.** If a rule seems wrong for a course, the rule is changed with a fixture and a new calibration
   table in plan 09's module, not exempted here.
5. **`REWRITTEN_FILLER_COURSES` is plan 09's list.** This plan does not add to it (decision D12). Once an entry is
   gone, the guard's general scenario keeps guarding the course, and a course cannot be in both lists.

Why the six are rewritten and not repaired: the guard measures the code and the lessons together, five of the six
fire on the programs themselves (FG2, FG3, or FG4), and a lesson cannot be made distinct while the programs repeat. The
sixth, `csp-style-concurrency`, fires only FG6, so its programs stay and its lessons are rewritten.

The end-state gate reads the result directly: no entry tagged `plan-12` remains, the cap is 6, the scan reports no
fired rule for any of the 34 slugs, and `course-filler.steps.ts` exits 0
([../delivery.md](../delivery.md#phase-8-end-state-gate)).

Phase 0 reads the merged baseline. If a plan 12 course has already left the list, the owner tags differ, or the cap is
not 12, the table above is corrected in the evidence, and the ledger rows say which courses need the removal. An
unexplained difference (an extra course in the baseline that plan 09's calibration did not list) is reported to the
user and is not baselined by this plan.

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
| The registry lists every course of plan 11                            | same                                          | exempt      | exempt                     |
| The registry lists every course audited by plan 12 (new)              | same                                          | exempt      | exempt                     |

The titles of the first eight are plan 11's, as merged; Phase 0 copies them exactly.

Other tests this plan relies on, all existing:

| Test                                                                                                                    | Run when                                                      |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` (plan 09)                                                        | CP-2, and CP-2b for the six baseline courses                  |
| `UNIT-NODE tests/unit/be-steps/course-metadata.steps.ts` (plan 03)                                                      | CP-6, to read the expected `estimatedHours`                   |
| The path integrity tests in [006](./006-prerequisites-metadata-and-closure.md#the-integrity-tests-that-must-stay-green) | CP-6 when `prerequisites` changed                             |
| Plan 08's capstone content-shape test                                                                                   | CP-6 for `capstone-solid-core`                                |
| `ayokoding-www:examples:check` (plan 05)                                                                                | CP-5 per course; the PR gate on every push                    |
| `QUICK`, `BEHAVIOUR`, `E2E-BEHAVIOUR`, `BE-E2E-BEHAVIOUR`                                                               | Each checkpoint push and the end-state gate                   |
| `INTEGRATION`, `E2E-QUICK`, `E2E`                                                                                       | The end-state gate (regression only; this plan changes no UI) |

## Conditional and New CLI Tests

These are Go tests in `apps/ayokoding-cli` (`CLI-QUICK`) or workflow-plan tests, written before the change they
cover, in the place Phase 1 finds them (expected: `internal/selection/` and the CLI's selection feature file). They
carry plan 05's selection scenarios; the two Gherkin scenarios in the text of
[../prd.md](../prd.md#conditional-cli-selection-scenarios).

| Rung or addition                | RED (fails before the change)                                                                           | GREEN (passes after)                                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 2t, a new id                    | A changed-path set that adds `toolchains/valkey/**` and one catalog entry selects every opted-in course | It selects only the courses whose `run.yaml` declares `valkey` (none yet) plus the courses changed by path         |
| 2t, an existing id              | A change to the `python` Dockerfile selects every opted-in course                                       | It selects every course that declares `python`; a change to the catalog schema still selects every opted-in course |
| 2d                              | A course of 99 units selected into eight shards appears in one shard                                    | It appears in at least two, every unit runs exactly once, and the course-level checks run once                     |
| 2b (reuse if merged by plan 11) | A selection of 813 units over 9 courses returns four shards where the rule says eight                   | It returns eight; 800 units return four; 120 units return one                                                      |
| 2c (reuse if merged by plan 11) | A split by sorted slug leaves the longest shard above the limit while a split by unit count fits        | The split is by unit count, largest first, with no overlap and no gap across `1..N`                                |
| Each added id (seven)           | `toolchains build <id>` has no catalog entry or smoke row, so the id's fixture unit cannot run          | The fixture unit's double run at half the CPU quota is byte-identical and the smoke row passes                     |

Rung 3 (the 120-minute `since` timeout) is a workflow constant and is proven by the draft PR's own run finishing
inside it. If plan 11 already merged rungs 2b, 2c, or 3, Phase 0 records them as present and runs their tests as
regression tests only. If rung 2t cannot be built, none of the seven ids is added and the fixture rows are never
written ([004](./004-toolchain-additions-and-ci-budget.md#the-response-ladder)).

**Rule AU1 proof.** Phase 7 checks whether plan 05's suite already has a fixture unit whose output depends on the CPU
count (it fails the double run at half the quota). If it does, AU1 cites it. If it does not, Phase 7 adds one:
RED, a unit that prints `os.cpu_count()` makes `examples check` exit non-zero with an output diff; GREEN, a unit with
a fixed pool size passes. Either way the proof runs in `CLI-QUICK`.

## Manual Verification

The plan changes course pages and code, not components, but a reader sees them, so the end-state gate checks them in
a browser and on the wire. Each check names its expected observation in
[../delivery.md](../delivery.md#phase-9-manual-verification).

- **Browser (port 3101, 375×800 and 1280×800, English).** For one course per category (computer science, systems and
  networking, data and databases, architecture and distributed systems), plus `capstone-solid-core` (capstone shape)
  and `windows-os` (static mode): open the course landing, a learning page, the drilling page, and, for the capstone,
  the capstone page. Expect: examples render in order with their code and output blocks; Mermaid diagrams render;
  `<details>` blocks in drilling open; no "Outline" badge; the catalog card shows the format and the hours; the
  course appears in its paths unchanged.
- **Wire.** The tRPC catalog payload lists the same `outlineCourseIds` as at baseline (this plan changes none) and
  carries the recomputed `estimatedHours` for three sampled courses.
- **Harness.** Run `EX-CHECK` directly for three sampled courses (one with a service, one simulation, one static) and
  read the coverage report: 34 of 34 courses covered, none not applicable, and the plan's share of the series total
  recorded for plan 13 (decision 40).
- **Indonesian locale.** `rtk git status --short -- apps/ayokoding-www/content/id` is empty after every index
  generation; the `/id` landing pages are unchanged.
