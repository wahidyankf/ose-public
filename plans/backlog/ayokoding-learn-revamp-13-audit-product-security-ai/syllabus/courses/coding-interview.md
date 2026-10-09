# Coding Interview (By Example)

**Course ID**: `coding-interview` · **Format**: By Example · **Family**: interview-preparation.

**Scope note**: Audits and fixes the existing `coding-interview` course to the series definition of done and brings every example green in plan 05's code harness. The subject, slug, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course (except a capstone's `relies-on` row, CP-7).

**Short summary**: Solving coding problems under interview conditions: foundations, patterns, and round craft, in Python.

## Why this exists · the big idea

- **The problem before the solution**: 75 examples in three pages total 3,235 words (about 43 words each), with four Python files, one fence, no anchors, and a drilling page of 354 words.
- **Keep-this-if-you-forget-everything**: A coding round is a procedure: restate, clarify, example, approach, code, test, and complexity; each example performs one step of it on a small problem.

## Prerequisites

- **Prior courses**: `data-structures-and-algorithms-essentials`, `advanced-algorithms` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example. **Reason**: By Example, as plan 03 records it: 75 examples with a program, a test, and the spoken narration of each step.
  A maker may not switch modes except where the reason above says so; a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user.
- **Mode-convention fit**: today the course does not yet fit the convention (`overview.md`, `beginner.md`, `intermediate.md`, `advanced.md` with `### Example N: Title` headings). Example headings per page today: `learning/foundation-examples.md` (25), `learning/pattern-examples.md` (25), `learning/roundcraft-examples.md` (25).
- **Wave**: 1 (slot 3); **size class**: XL (words to write 22,768, new unit folders 83); **expected defect classes**: 9 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                    | Target                                                                                                                                                               | Work                            |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 5,232                                                                                                                                                                              | at least 28,000                                                                                                                                                      | 22,768 to write                 |
| Examples as `### Example N: Title`                            | 75                                                                                                                                                                                 | at least 75, numbered 1 to N without gaps                                                                                                                            | none                            |
| Mermaid diagrams                                              | 0                                                                                                                                                                                  | 30 to 50 (adapter band)                                                                                                                                              | 30 to add                       |
| "Why It Matters" (50 to 100 words each)                       | none of 75 examples has one                                                                                                                                                        | one per example, 50 to 100 words                                                                                                                                     | 75 to write                     |
| Annotation density (comment lines per code line)              | not measurable: no code-bearing examples of the mode's form today                                                                                                                  | 1.0 to 2.25 on every code-bearing example                                                                                                                            | all new                         |
| Code fences                                                   | 1 code fences in the lessons; 1 unanchored                                                                                                                                         | every code fence anchored or marked as an illustration (budget: 4 at most; online-judge submission screens and editor settings)                                      | 1 to anchor                     |
| Lesson-to-file anchors (plan 05's method)                     | 0 path anchors (match 0, mismatch 0, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                                               | every anchor matches its file                                                                                                                                        | 0 to repair                     |
| Output blocks                                                 | 0 output fences; 0 unanchored                                                                                                                                                      | every `**Output**` block anchored to an expected file                                                                                                                | 0 to anchor                     |
| Harness units                                                 | 0 example folders, 0 kata folders, 4 code files, 0 `run.yaml`                                                                                                                      | 75 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                              | create 83, convert 1            |
| Drilling page                                                 | 354 words; 1 of 5 standard `##` sections exact; 0 `<details>` blocks; headings found: Recall Q&A, Calculation practice, Scenario judgment, Design exercise, Automaticity checklist | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) | 4,646 words short; fix sections |
| Katas                                                         | 0 kata folders                                                                                                                                                                     | at least 8 as `before`/`after` units                                                                                                                                 | 8                               |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                             | unchanged, except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                           | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X1** 4 code files (0 example folders, 0 kata folders, 2 test-like files); none has a `run.yaml`.
- **X3** 1 of 1 code fences is neither anchored nor marked as illustrations.
- **X5** The three pages hold 75 `### Example` headings in 1,062 to 1,087 words each (about 43 words per example, no output or takeaway block); 4 code files cover 75 examples.
- **X7** The overview has no `## Examples by Level` heading (CRITICAL under the adapter); 75 of 75 examples have no "Why It Matters" block.
- **X11** Drilling: 354 words (4,646 short of 5,000); 1 of 5 exact `##` sections; 0 kata folders against 8.
- **X13** 5,232 words against a floor of 28,000; 22,768 to write.
- **X15** Programs are pure functions over fixed inputs; random inputs (stress tests) use a fixed seed.
- **X19** Only 4 Python files exist (2 are tests) for 75 examples; 83 unit folders are missing.
- **X20** 0 Mermaid diagrams against the band of 30 to 50.

## Fixes and design

- Write the 75 examples in the By Example shape (about 22,800 words): problem statement, approach narration, annotated program, recorded output, complexity note, takeaway, and a "Why It Matters" block.
- Create 83 units under `python` with standard-library code only; each has a `main` run and, where the lesson tests, a `tests` run with `unittest`.
- Move the capstone folder into place, write the drilling page (354 words today) at 5,000 words, and add diagrams (0 today) to the band.

## Harness mode and toolchain

- **Harness mode**: Real mode: `python`, standard library only.
- **Toolchain ids**: python.
- **Toolchain additions** (budget-gated, default NO-GO; [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-cost.md)): none.
- **Illustration budget**: at most 4 (online-judge submission screens and editor settings).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 2.0 s per container invocation × 2 executions × 94 runs (75 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 6.3 minutes.

## Size class and sequencing

- **Size class XL** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 22,768 (the larger of the word gap and the drilling shortfall), new unit folders 83.
- **Estimated effort** (size, not time): class XL; agent packets: authoring split by learning page and again by blocks of at most 15 examples, then one packet per remaining defect group; the course folder is committed only when every unit exists.
- **Wave 1**, slot 3. Makers and fixers for this course: `apps-ayokoding-www-by-example-maker` for authoring gaps, `tutorial-by-example-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `capstone-interview-loop`, `take-home-and-live-coding` (each is audited in a later wave, so this course is final first).

## Prerequisite re-check

- Plan 02 keeps the current list (the list above is the result).
- Prerequisites outside this plan (unchanged here): `data-structures-and-algorithms-essentials`, `advanced-algorithms`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-path-and-capstone-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `coding-interview` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder; `AUDIT_PROBE=coding-interview:by-example` with `UNIT-NODE tests/unit/be-steps/audited-course-completion.steps.ts` to record the scenarios the course fails; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (XL): authoring split by learning page and again by blocks of at most 15 examples, then one packet per remaining defect group; the course folder is committed only when every unit exists. Classes: X1, X3, X5, X7, X11, X13, X15, X19, X20.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `coding-interview`; a course that fires is fixed, never baselined.
- [ ] Units: 75 example units, 8 kata units, 1 capstone unit (create 83, convert 1); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 4 (online-judge submission screens and editor settings).
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `coding-interview` exits 0 (at most 2 repair cycles); `EX-COVERAGE` shows `covered: true` for `coding-interview`.
- [ ] CP-6 The registry row for `coding-interview` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit coding-interview course` with explicit paths only: the course folder with its `_index.md`, the registry row.
- [ ] CP-7 Capstone relies-on: `rtk git grep -n "coding-interview" -- 'apps/ayokoding-www/content/en/learn/courses/capstone-*/learning/overview.md'` shows no capstone row for this course today; if the search finds one at execution time, handle it as in the other courses and note it in the ledger.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/coding-interview/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · foundation-examples** — examples 1–25 (25): from "· clarify the ambiguous prompt" to "· combination sum".
- **co-02 · pattern-examples** — examples 26–50 (25): from "· memoized Fibonacci" to "· optimise under time pressure".
- **co-03 · roundcraft-examples** — examples 51–75 (25): from "· pattern-misfit recovery" to "· replay with a different pattern".

## Lineage

- Builds on: `data-structures-and-algorithms-essentials`, `advanced-algorithms`. Required by (in this plan): `capstone-interview-loop`, `take-home-and-live-coding`.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 113 of 121 in the manifest as specified by plan 02 (read 2026-10-09), phase `interview-preparation`, role `extension`; this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 9 of 116 in the manifest as specified by plan 02 (read 2026-10-09), phase `interview-skills`, role `core`; this plan changes no path membership or order.
