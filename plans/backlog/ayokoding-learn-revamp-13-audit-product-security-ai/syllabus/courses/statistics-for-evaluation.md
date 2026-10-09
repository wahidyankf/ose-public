# Statistics for Evaluation (Annotated Concept (standard))

**Course ID**: `statistics-for-evaluation` · **Format**: Annotated Concept (standard) · **Family**: ai-engineering.

**Scope note**: Audits and fixes the existing `statistics-for-evaluation` course to the series definition of done and brings every example green in plan 05's code harness. The subject, slug, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course (except a capstone's `relies-on` row, CP-7).

**Short summary**: Statistics for judging model and system quality: uncertainty on a rate, sampling, agreement and judge concordance, and comparing runs.

## Why this exists · the big idea

- **The problem before the solution**: Content is nearly complete (54,047 words, 46 worked examples), but all 49 fences and 49 output blocks are unanchored, 37 of 49 programs use a random source, and 33 `requirements.txt` files pin numpy, scipy, and scikit-learn without hashes.
- **Keep-this-if-you-forget-everything**: A number without an interval is a guess; every example computes the interval twice, once from the definition and once with a library.

## Prerequisites

- **Prior courses**: `evaluating-ai-output-essentials`, `just-enough-python`, `data-structures-and-algorithms-essentials` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: Annotated Concept (standard). **Reason**: Annotated Concept (standard), as plan 03 records it: statistical judgement with code-bearing examples (45 folders) and a capstone report.
  A maker may not switch modes except where the reason above says so; a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user.
- **Mode-convention fit**: today the course needs `learning/overview.md`, worked-example pages (by theme), and `learning/capstone/`; CP-1 checks the layout against the mode checker. Example headings per page today: `learning/theme-a-uncertainty-on-a-rate.md` (12), `learning/theme-b-sampling.md` (8), `learning/theme-c-agreement-and-judge-concordance.md` (14), `learning/theme-d-comparing-runs-and-gating-on-them.md` (12).
- **Wave**: 5 (slot 2); **size class**: S (words to write 0, new unit folders 5); **expected defect classes**: 10 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                                       | Target                                                                                                                                                               | Work                 |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 54,047                                                                                                                                                                                                | at least 22,000                                                                                                                                                      | none                 |
| Examples as `### Worked Example N: Title`                     | 46                                                                                                                                                                                                    | at least 45, numbered 1 to N without gaps                                                                                                                            | none                 |
| Mermaid diagrams                                              | 2                                                                                                                                                                                                     | at least 10 (this plan's target)                                                                                                                                     | 8 to add             |
| "Why It Matters" (50 to 100 words each)                       | 46 of 46 present; 39 under 50 words; 0 over 100; median 41 words                                                                                                                                      | one per example, 50 to 100 words                                                                                                                                     | 39 to write or fix   |
| Annotation density (comment lines per code line)              | median 1.07; 2 examples below 1.0; 0 above 2.25 (of 45 code-bearing)                                                                                                                                  | 1.0 to 2.25 on every code-bearing example                                                                                                                            | 2 to fix             |
| Code fences                                                   | 49 code fences in the lessons; 49 unanchored                                                                                                                                                          | every code fence anchored or marked as an illustration (budget: 2 at most; `pip install` lines)                                                                      | 49 to anchor         |
| Lesson-to-file anchors (plan 05's method)                     | 0 path anchors (match 0, mismatch 0, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                                                                  | every anchor matches its file                                                                                                                                        | 0 to repair          |
| Output blocks                                                 | 49 output fences; 49 unanchored                                                                                                                                                                       | every `**Output**` block anchored to an expected file                                                                                                                | 49 to anchor         |
| Harness units                                                 | 45 example folders, 0 kata folders, 82 code files, 0 `run.yaml`                                                                                                                                       | 45 example units, 5 kata units, 1 capstone unit, each with a `run.yaml`                                                                                              | create 5, convert 46 |
| Drilling page                                                 | 5,170 words; 5 of 5 standard `##` sections exact; 39 `<details>` blocks; headings found: Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) | words ok             |
| Katas                                                         | 0 kata folders                                                                                                                                                                                        | at least 5 as `before`/`after` units                                                                                                                                 | 5                    |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                                | unchanged, except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                           | recompute            |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X1** 82 code files (45 example folders, 0 kata folders, 1 test-like files); none has a `run.yaml`.
- **X3** 49 of 49 code fences are neither anchored nor marked as illustrations.
- **X4** 49 of 49 `**Output**` blocks are not labelled anchors to expected files.
- **X8** 46 "Why It Matters" blocks present: 39 under 50 words, 0 over 100, median 41 words.
- **X9** Annotation density: median 1.07; 2 examples below 1.0 and 0 above 2.25 (of 45 code-bearing).
- **X11** Drilling: 5,170 words; 5 of 5 exact `##` sections; 0 kata folders against 5.
- **X15** 37 files draw random numbers (bootstrap and permutation tests); each gets a fixed seed and the output uses a fixed number of resamples.
- **X16** 33 `requirements.txt` files pin `numpy==2.5.1`, `scipy==1.18.0`, and `scikit-learn==1.9.0` without hashes. The harness needs one hash-locked `requirements.lock` per course (spike SP3 proves that wheels exist for the catalog's Python 3.14 and that the results match to the printed precision).
- **X18** The lessons name Python 3.13 eleven times, which does not match the catalog's 3.14.8.
- **X20** 2 Mermaid diagrams against this plan's floor of 10.

## Fixes and design

- Replace the 33 per-example `requirements.txt` files with one hash-locked `requirements.lock` for the course, declared in every unit's `dependencies.lockfile`.
- Anchor the 49 fences and 49 output blocks; add 5 kata units and convert the capstone folder to a unit; run all units under `python`.
- Print results at a fixed precision so the numpy and scipy version cannot change a printed digit; where SP3 shows a difference, the lesson prints the rounded value.
- Raise the 2 low-density examples and shorten the 39 "Why It Matters" blocks that are under 50 words to the 50 to 100 word band.

## Harness mode and toolchain

- **Harness mode**: Real mode: `python` with a hash-locked numeric stack (numpy, scipy, scikit-learn, statsmodels).
- **Toolchain ids**: python (numpy, scipy, scikit-learn, statsmodels from a hash-locked lockfile).
- **Toolchain additions** (budget-gated, default NO-GO; [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-cost.md)): none; the lockfile is a course file.
- **Phase 1 spikes**: SP3 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: at most 2 (`pip install` lines).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 4.0 s per container invocation × 2 executions × 58 runs (45 examples + 2 × 5 kata runs + 3 capstone runs) ≈ 7.7 minutes.

## Size class and sequencing

- **Size class S** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 0 (the larger of the word gap and the drilling shortfall), new unit folders 5.
- **Estimated effort** (size, not time): class S; agent packets: one packet per defect group (mechanical fixes, then prose fixes); no page split.
- **Wave 5**, slot 2. Makers and fixers for this course: `apps-ayokoding-www-annotated-concept-maker` for authoring gaps, `tutorial-annotated-concept-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `evaluating-ai-systems-in-depth`, `fine-tuning-and-adaptation` (each is audited in a later wave, so this course is final first).

## Prerequisite re-check

- Plan 02 keeps the current list (the list above is the result).
- In-plan prerequisites are audited first: `evaluating-ai-output-essentials` in wave 4.
- Prerequisites outside this plan (unchanged here): `just-enough-python`, `data-structures-and-algorithms-essentials`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-path-and-capstone-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `statistics-for-evaluation` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-annotated-concept-checker` over the course folder; `AUDIT_PROBE=statistics-for-evaluation:annotated-concept` with `UNIT-NODE tests/unit/be-steps/audited-course-completion.steps.ts` to record the scenarios the course fails; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (S): one packet per defect group (mechanical fixes, then prose fixes); no page split. Classes: X1, X3, X4, X8, X9, X11, X15, X16, X18, X20.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `statistics-for-evaluation`; a course that fires is fixed, never baselined.
- [ ] Units: 45 example units, 5 kata units, 1 capstone unit (create 5, convert 46); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 2 (`pip install` lines).
- [ ] CP-3 `tutorial-annotated-concept-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `statistics-for-evaluation` exits 0 (at most 2 repair cycles); `EX-COVERAGE` shows `covered: true` for `statistics-for-evaluation`.
- [ ] CP-6 The registry row for `statistics-for-evaluation` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit statistics-for-evaluation course` with explicit paths only: the course folder with its `_index.md`, the registry row.
- [ ] CP-7 Capstone relies-on: `rtk git grep -n "statistics-for-evaluation" -- 'apps/ayokoding-www/content/en/learn/courses/capstone-*/learning/overview.md'` shows no capstone row for this course today; if the search finds one at execution time, handle it as in the other courses and note it in the ledger.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/statistics-for-evaluation/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · theme-a-uncertainty-on-a-rate** — examples 1–12 (12): from "Two Runs, Two Numbers" to "A Reporting Helper -- Estimate, Interval, n, Method".
- **co-02 · theme-b-sampling** — examples 13–20 (8): from "A Random Sample" to "A Sample-Size Plan for a Real Eval Set".
- **co-03 · theme-c-agreement-and-judge-concordance** — examples 21–34 (14): from "Raw Percent Agreement" to "Concordance Report".
- **co-04 · theme-d-comparing-runs-and-gating-on-them** — examples 35–46 (12): from "Two Point Estimates Are Not a Comparison" to "A Defensible Ship Decision".

## Lineage

- Builds on: `evaluating-ai-output-essentials`, `just-enough-python`, `data-structures-and-algorithms-essentials`. Required by (in this plan): `evaluating-ai-systems-in-depth`, `fine-tuning-and-adaptation`.

## In which paths

- `careers/immediately-effective/ai-engineer` — position 24 of 28 in the manifest as specified by plan 08 (read 2026-10-09), phase `evaluation-in-depth`, role `extension`; this plan changes no path membership or order.
- `careers/immediately-effective/ai-engineer` — a prerequisite change here also changes that manifest, its `assumes`, and its tests in the same PR (plan 02's rule R6, plan 08's duty).
