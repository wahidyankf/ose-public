# Analytics and Experimentation (By Example)

**Course ID**: `analytics-and-experimentation` · **Format**: By Example · **Family**: product-and-leadership.

**Scope note**: Audits and fixes the existing `analytics-and-experimentation` course to the series definition of done and brings every example green in plan 05's code harness. The subject, slug, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course (except a capstone's `relies-on` row, CP-7).

**Short summary**: Measuring a product and running experiments honestly: events and metrics, assignment and power, effect estimates, sequential looks, and a decision memo.

## Why this exists · the big idea

- **The problem before the solution**: 78 examples are rows in three theme tables with concept IDs and a one-line check each, but no example folder, no worked-example heading, and no recorded output exist; 5,618 words, one capstone file.
- **Keep-this-if-you-forget-everything**: An experiment is a commitment made before the data: metric, unit, size, and rule; each example here is one commitment checked by a small simulation.

## Prerequisites

- **Prior courses**: `sql-essentials`, `software-testing` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example. **Reason**: By Example, as plan 03 records it: 75 or more small statistics programs. The pages use concept IDs and tables, which are rewritten into the By Example shape.
  A maker may not switch modes except where the reason above says so; a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user.
- **Mode-convention fit**: today the course does not yet fit the convention (`overview.md`, `beginner.md`, `intermediate.md`, `advanced.md` with `### Example N: Title` headings). Example headings per page today: no page with numbered example headings.
- **Wave**: 12 (slot 1); **size class**: XL (words to write 22,382, new unit folders 83); **expected defect classes**: 11 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                           | Target                                                                                                                                                               | Work                            |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 5,618                                                                                                                                                                     | at least 28,000                                                                                                                                                      | 22,382 to write                 |
| Examples as `### Example N: Title`                            | 0                                                                                                                                                                         | at least 75, numbered 1 to N without gaps                                                                                                                            | 75 to add                       |
| Mermaid diagrams                                              | 0                                                                                                                                                                         | 30 to 50 (adapter band)                                                                                                                                              | 30 to add                       |
| "Why It Matters" (50 to 100 words each)                       | not measurable: no numbered example headings of the mode's form exist today                                                                                               | one per example, 50 to 100 words                                                                                                                                     | all new                         |
| Annotation density (comment lines per code line)              | not measurable: no code-bearing examples of the mode's form today                                                                                                         | 1.0 to 2.25 on every code-bearing example                                                                                                                            | all new                         |
| Code fences                                                   | 3 code fences in the lessons; 3 unanchored                                                                                                                                | every code fence anchored or marked as an illustration (budget: 4 at most; vendor analytics dashboards and SQL for a warehouse)                                      | 3 to anchor                     |
| Lesson-to-file anchors (plan 05's method)                     | 0 path anchors (match 0, mismatch 0, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                                      | every anchor matches its file                                                                                                                                        | 0 to repair                     |
| Output blocks                                                 | 0 output fences; 0 unanchored                                                                                                                                             | every `**Output**` block anchored to an expected file                                                                                                                | 0 to anchor                     |
| Harness units                                                 | 0 example folders, 0 kata folders, 1 code file, 0 `run.yaml`                                                                                                              | 75 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                              | create 83, convert 1            |
| Drilling page                                                 | 1,007 words; 1 of 5 standard `##` sections exact; 7 `<details>` blocks; headings found: Recall Q&A, Scenario judgment, Design exercise, Code kata, Automaticity checklist | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) | 3,993 words short; fix sections |
| Katas                                                         | 0 kata folders                                                                                                                                                            | at least 8 as `before`/`after` units                                                                                                                                 | 8                               |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                    | unchanged, except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                           | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X1** 1 code files (0 example folders, 0 kata folders, 0 test-like files); none has a `run.yaml`.
- **X2** `pyrightconfig.json` and `ruff.toml` sit at the course root, outside every code root; the only code file is the capstone's.
- **X3** 3 of 3 code fences are neither anchored nor marked as illustrations.
- **X5** The three theme pages hold tables of `ex-NN` rows (78 rows) and one "worked mechanism" fence each; the examples have no program, output, or takeaway of their own.
- **X7** The learning overview is 266 words and has no `## Examples by Level` section (CRITICAL under the adapter); the pages are named by theme, not level, so the section lists them by theme.
- **X11** Drilling: 1,007 words (3,993 short of 5,000); 1 of 5 exact `##` sections; 0 kata folders against 8.
- **X13** 5,618 words against a floor of 28,000; 22,382 to write.
- **X15** Assignment, power, and bootstrap examples are random by nature; every simulation takes a fixed seed and a fixed resample count, and bucketing uses SHA-256 of a fixed salt and ID.
- **X17** Event and SQL examples need a database; SQLite from the standard library serves every one (decision D4: no PostgreSQL service for this course).
- **X19** 0 example folders exist against 75 example units: 75 to create.
- **X20** 0 Mermaid diagrams against the band of 30 to 50.

## Fixes and design

- Write the 78 examples in the By Example shape: explanation, diagram, annotated program, recorded output, takeaway, and a "Why It Matters" block; add examples to reach at least 80 (the 78 table rows are the plan).
- Create 83 units under `python`: simulations use `random.Random(seed)`; event tables are SQLite files built in `/tmp`; the existing capstone file moves into `learning/capstone/code/` with tests.
- Move `pyrightconfig.json` and `ruff.toml` under `learning/code/` as shared files only if a `kind: check` run uses them; otherwise delete them.
- Write the drilling page (1,007 words today) at 5,000 words under the five exact headings and 8 kata units; add diagrams (0 today) to the band.

## Harness mode and toolchain

- **Harness mode**: Real mode: `python`, standard library only (SQLite, `random`, `statistics`).
- **Toolchain ids**: python.
- **Toolchain additions** (budget-gated, default NO-GO; [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-cost.md)): none.
- **Illustration budget**: at most 4 (vendor analytics dashboards and SQL for a warehouse).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 2.0 s per container invocation × 2 executions × 94 runs (75 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 6.3 minutes.

## Size class and sequencing

- **Size class XL** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 22,382 (the larger of the word gap and the drilling shortfall), new unit folders 83.
- **Estimated effort** (size, not time): class XL; agent packets: authoring split by learning page and again by blocks of at most 15 examples, then one packet per remaining defect group; the course folder is committed only when every unit exists.
- **Wave 12**, slot 1. Makers and fixers for this course: `apps-ayokoding-www-by-example-maker` for authoring gaps, `tutorial-by-example-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 keeps the current list (the list above is the result).
- Prerequisites outside this plan (unchanged here): `sql-essentials`, `software-testing`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-path-and-capstone-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `analytics-and-experimentation` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder; `AUDIT_PROBE=analytics-and-experimentation:by-example` with `UNIT-NODE tests/unit/be-steps/audited-course-completion.steps.ts` to record the scenarios the course fails; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (XL): authoring split by learning page and again by blocks of at most 15 examples, then one packet per remaining defect group; the course folder is committed only when every unit exists. Classes: X1, X2, X3, X5, X7, X11, X13, X15, X17, X19, X20.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `analytics-and-experimentation`; a course that fires is fixed, never baselined.
- [ ] Units: 75 example units, 8 kata units, 1 capstone unit (create 83, convert 1); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 4 (vendor analytics dashboards and SQL for a warehouse).
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `analytics-and-experimentation` exits 0 (at most 2 repair cycles); `EX-COVERAGE` shows `covered: true` for `analytics-and-experimentation`.
- [ ] CP-6 The registry row for `analytics-and-experimentation` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit analytics-and-experimentation course` with explicit paths only: the course folder with its `_index.md`, the registry row.
- [ ] CP-7 Capstone relies-on: `rtk git grep -n "analytics-and-experimentation" -- 'apps/ayokoding-www/content/en/learn/courses/capstone-*/learning/overview.md'` shows no capstone row for this course today; if the search finds one at execution time, handle it as in the other courses and note it in the ledger.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/analytics-and-experimentation/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · course-as-taught** — no numbered example headings of the mode's form exist today (the pages use tables, `ex-NN` headings, or prose); CP-1 lists the concepts from the pages.

## Lineage

- Builds on: `sql-essentials`, `software-testing`. Required by (in this plan): none.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 50 of 121 in the manifest as specified by plan 02 (read 2026-10-09), phase `apps-and-interfaces`, role `extension`; this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 37 of 114 in the manifest as specified by plan 02 (read 2026-10-09), phase `apps-and-interfaces`, role `extension`; this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 40 of 116 in the manifest as specified by plan 02 (read 2026-10-09), phase `apps-and-interfaces`, role `extension`; this plan changes no path membership or order.
