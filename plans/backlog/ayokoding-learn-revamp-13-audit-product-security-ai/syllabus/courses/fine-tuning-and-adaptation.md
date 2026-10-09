# Fine-Tuning & Adaptation (By Example)

**Course ID**: `fine-tuning-and-adaptation` · **Format**: By Example · **Family**: ai-engineering.

**Scope note**: Audits and fixes the existing `fine-tuning-and-adaptation` course to the series definition of done and brings every example green in plan 05's code harness. The subject, slug, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course (except a capstone's `relies-on` row, CP-7).

**Short summary**: Deciding between prompting, retrieval, and fine-tuning, then preparing data, running a training job, evaluating it, distilling it, and operating the result.

## Why this exists · the big idea

- **The problem before the solution**: Content is complete (74,436 words, 75 examples), but 79 fences and 79 output blocks are unanchored, 4 diagrams stand against a band of 30 to 50, and no training run can happen in a container with no GPU and no network.
- **Keep-this-if-you-forget-everything**: Most adaptation problems are data problems; every training step here is a model of the step on a few hundred numbers, so the data decisions can be checked.

## Prerequisites

- **Prior courses**: `creating-ai-powered-apps`, `evaluating-ai-systems-in-depth`, `statistics-for-evaluation`, `inference-serving-and-model-deployment`, `data-engineering`, `just-enough-python` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example. **Reason**: By Example, as plan 03 records it: 75 typed Python programs in three bands of the decision, the dataset and run, and operation.
  A maker may not switch modes except where the reason above says so; a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user.
- **Mode-convention fit**: today the course does not yet fit the convention (`overview.md`, `beginner.md`, `intermediate.md`, `advanced.md` with `### Example N: Title` headings). Example headings per page today: `learning/band-a-the-decision-not-the-technique.md` (24), `learning/band-b-the-dataset-and-the-training-run.md` (27), `learning/band-c-evaluation-distillation-and-operation.md` (24).
- **Wave**: 15 (slot 2); **size class**: S (words to write 85, new unit folders 10); **expected defect classes**: 9 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                                       | Target                                                                                                                                                               | Work                      |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 74,436                                                                                                                                                                                                | at least 28,000                                                                                                                                                      | none                      |
| Examples as `### Example N: Title`                            | 0 (75 more in the wrong form)                                                                                                                                                                         | at least 75, numbered 1 to N without gaps                                                                                                                            | none; rename the headings |
| Mermaid diagrams                                              | 4                                                                                                                                                                                                     | 30 to 50 (adapter band)                                                                                                                                              | 26 to add                 |
| "Why It Matters" (50 to 100 words each)                       | 75 of 75 present; 0 under 50 words; 0 over 100; median 59 words                                                                                                                                       | one per example, 50 to 100 words                                                                                                                                     | 0 to write or fix         |
| Annotation density (comment lines per code line)              | median 1.09; 0 examples below 1.0; 0 above 2.25 (of 74 code-bearing)                                                                                                                                  | 1.0 to 2.25 on every code-bearing example                                                                                                                            | 0 to fix                  |
| Code fences                                                   | 79 code fences in the lessons; 79 unanchored                                                                                                                                                          | every code fence anchored or marked as an illustration (budget: 8 at most; hosted fine-tuning API calls and GPU launch lines)                                        | 79 to anchor              |
| Lesson-to-file anchors (plan 05's method)                     | 0 path anchors (match 0, mismatch 0, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                                                                  | every anchor matches its file                                                                                                                                        | 0 to repair               |
| Output blocks                                                 | 79 output fences; 79 unanchored                                                                                                                                                                       | every `**Output**` block anchored to an expected file                                                                                                                | 79 to anchor              |
| Harness units                                                 | 74 example folders, 0 kata folders, 74 code files, 0 `run.yaml`                                                                                                                                       | 75 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                              | create 10, convert 74     |
| Drilling page                                                 | 4,915 words; 5 of 5 standard `##` sections exact; 47 `<details>` blocks; headings found: Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) | 85 words short            |
| Katas                                                         | 0 kata folders                                                                                                                                                                                        | at least 8 as `before`/`after` units                                                                                                                                 | 8                         |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                                | unchanged, except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                           | recompute                 |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X1** 74 code files (74 example folders, 0 kata folders, 2 test-like files); none has a `run.yaml`.
- **X3** 79 of 79 code fences are neither anchored nor marked as illustrations.
- **X4** 79 of 79 `**Output**` blocks are not labelled anchors to expected files.
- **X6** 75 headings use `### Worked Example N: Title` in a By Example course (the form is `### Example N: Title`).
- **X11** Drilling: 4,915 words (85 short of 5,000); 5 of 5 exact `##` sections; 0 kata folders against 8.
- **X17** A real fine-tune needs a GPU, model weights, and a hosted service. The units compute loss curves, LoRA rank arithmetic, data deduplication, and train/test leakage checks on a fixed tiny dataset in standard-library Python, and the lessons say so on the first page.
- **X18** Hosted fine-tuning APIs and base-model names change; the lessons name a role ("a small open-weight model") and keep API lines as illustrations with a dated Reference (policy AI7). 10 mentions of Python 3.13 are aligned to the catalog.
- **X19** 74 example folders exist against 75 example units: 1 to create.
- **X20** 4 Mermaid diagrams against the band of 30 to 50.

## Fixes and design

- Anchor the 79 fences and output blocks; convert the 74 example folders to units; add 1 more example folder, 8 kata units, and the capstone unit.
- State the model boundary: each training example is a simulation of the algorithm on data a person can read; the full training run is an illustration.
- Add 26 diagrams to reach the band; trim the drilling page to the five exact headings (85 words short).

## Harness mode and toolchain

- **Harness mode**: Real mode: `python`, standard library only; models of training, not training.
- **Toolchain ids**: python.
- **Toolchain additions** (budget-gated, default NO-GO; [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-cost.md)): none.
- **Fixtures** (AI course): Deterministic fixtures only (policy AI1 to AI6 in [tech-docs/011](../../tech-docs/011-ai-fixtures-and-sourcing-policy.md)): a scripted `FakeModel`, recorded responses stored in the unit folder, no API key or provider variable read, no network, fixed seeds, and a counter clock. A call to a hosted model appears only as a marked illustration with a dated Reference.
- **Phase 1 spikes**: SP12 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: at most 8 (hosted fine-tuning API calls and GPU launch lines).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 2.0 s per container invocation × 2 executions × 94 runs (75 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 6.3 minutes.

## Size class and sequencing

- **Size class S** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 85 (the larger of the word gap and the drilling shortfall), new unit folders 10.
- **Estimated effort** (size, not time): class S; agent packets: one packet per defect group (mechanical fixes, then prose fixes); no page split.
- **Wave 15**, slot 2. Makers and fixers for this course: `apps-ayokoding-www-by-example-maker` for authoring gaps, `tutorial-by-example-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 keeps the current list (the list above is the result).
- In-plan prerequisites are audited first: `creating-ai-powered-apps` in wave 3, `evaluating-ai-systems-in-depth` in wave 7, `statistics-for-evaluation` in wave 5, `inference-serving-and-model-deployment` in wave 7.
- Prerequisites outside this plan (unchanged here): `data-engineering`, `just-enough-python`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-path-and-capstone-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `fine-tuning-and-adaptation` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder; `AUDIT_PROBE=fine-tuning-and-adaptation:by-example` with `UNIT-NODE tests/unit/be-steps/audited-course-completion.steps.ts` to record the scenarios the course fails; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (S): one packet per defect group (mechanical fixes, then prose fixes); no page split. Classes: X1, X3, X4, X6, X11, X17, X18, X19, X20.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `fine-tuning-and-adaptation`; a course that fires is fixed, never baselined.
- [ ] Units: 75 example units, 8 kata units, 1 capstone unit (create 10, convert 74); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 8 (hosted fine-tuning API calls and GPU launch lines).
- [ ] AI fixtures: every unit uses the shared `FakeModel` and recorded responses (AI1 to AI6); `rtk git grep -n -E "api_key|API_KEY|openai|anthropic|requests|urllib|socket" -- <course>/learning/code <course>/drilling/code <course>/learning/capstone/code` shows no unexplained hit; every product, model, protocol, or price claim has a dated Reference within 30 days of the commit (AI7).
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `fine-tuning-and-adaptation` exits 0 (at most 2 repair cycles); `EX-COVERAGE` shows `covered: true` for `fine-tuning-and-adaptation`.
- [ ] CP-6 The registry row for `fine-tuning-and-adaptation` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit fine-tuning-and-adaptation course` with explicit paths only: the course folder with its `_index.md`, the registry row.
- [ ] CP-7 Capstone relies-on: `rtk git grep -n "fine-tuning-and-adaptation" -- 'apps/ayokoding-www/content/en/learn/courses/capstone-*/learning/overview.md'` shows no capstone row for this course today; if the search finds one at execution time, handle it as in the other courses and note it in the ledger.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/fine-tuning-and-adaptation/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Claims about products, models, protocols, prices, and limits are not facts of this brief: the maker re-verifies each one against its primary source on the day it writes it and records the value and date in the ledger (accuracy rules A1 to A7 and policy AI7).
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · band-a-the-decision-not-the-technique** — examples 1–58 (24): from "Measure the Gap First" to "Revisiting a No-Go Decision".
- **co-02 · band-b-the-dataset-and-the-training-run** — examples 17–34 (27): from "First SFT Dataset" to "Hyperparameters Cannot Fix Data".
- **co-03 · band-c-evaluation-distillation-and-operation** — examples 35–75 (24): from "Evaluate Against the Base" to "Writing the Maintenance and Retirement Plan".

## Lineage

- Builds on: `creating-ai-powered-apps`, `evaluating-ai-systems-in-depth`, `statistics-for-evaluation`, `inference-serving-and-model-deployment`, `data-engineering`, `just-enough-python`. Required by (in this plan): none.

## In which paths

- `careers/immediately-effective/ai-engineer` — position 28 of 28 in the manifest as specified by plan 08 (read 2026-10-09), phase `serving-and-adapting`, role `extension`; this plan changes no path membership or order.
- `careers/immediately-effective/ai-engineer` — a prerequisite change here also changes that manifest, its `assumes`, and its tests in the same PR (plan 02's rule R6, plan 08's duty).
