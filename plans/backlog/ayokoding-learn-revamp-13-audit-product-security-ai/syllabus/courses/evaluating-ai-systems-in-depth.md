# Evaluating AI Systems In Depth (By Example)

**Course ID**: `evaluating-ai-systems-in-depth` · **Format**: By Example · **Family**: ai-engineering.

**Scope note**: Audits and fixes the existing `evaluating-ai-systems-in-depth` course to the series definition of done and brings every example green in plan 05's code harness. The subject, slug, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course (except a capstone's `relies-on` row, CP-7).

**Short summary**: Evaluating agents and multi-step systems: trajectories, rubric and judge design, human agreement, regression gates, and what to do when scores disagree.

## Why this exists · the big idea

- **The problem before the solution**: Content is complete (81,047 words, 80 examples), but all 86 fences and all 84 output blocks are unanchored, and no example folder has a `run.yaml`.
- **Keep-this-if-you-forget-everything**: A system's score is only as honest as the cases, the judge, and the agreement with people; each example shows how one of the three goes wrong.

## Prerequisites

- **Prior courses**: `evaluating-ai-output-essentials`, `statistics-for-evaluation`, `software-testing` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example. **Reason**: By Example, as plan 03 records it: 80 typed Python programs with fixed trajectories and judges.
  A maker may not switch modes except where the reason above says so; a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user.
- **Mode-convention fit**: today the course fits the convention: `overview.md` plus beginner, intermediate, and advanced pages. Example headings per page today: `learning/advanced.md` (34), `learning/beginner.md` (16), `learning/intermediate.md` (30).
- **Wave**: 7 (slot 3); **size class**: S (words to write 71, new unit folders 8); **expected defect classes**: 7 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                                       | Target                                                                                                                                                               | Work                 |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 81,047                                                                                                                                                                                                | at least 28,000                                                                                                                                                      | none                 |
| Examples as `### Example N: Title`                            | 80                                                                                                                                                                                                    | at least 75, numbered 1 to N without gaps                                                                                                                            | none                 |
| Mermaid diagrams                                              | 12                                                                                                                                                                                                    | 30 to 50 (adapter band)                                                                                                                                              | 18 to add            |
| "Why It Matters" (50 to 100 words each)                       | 80 of 80 present; 0 under 50 words; 0 over 100; median 59 words                                                                                                                                       | one per example, 50 to 100 words                                                                                                                                     | 0 to write or fix    |
| Annotation density (comment lines per code line)              | median 1.09; 0 examples below 1.0; 0 above 2.25 (of 80 code-bearing)                                                                                                                                  | 1.0 to 2.25 on every code-bearing example                                                                                                                            | 0 to fix             |
| Code fences                                                   | 86 code fences in the lessons; 86 unanchored                                                                                                                                                          | every code fence anchored or marked as an illustration (budget: 4 at most; hosted judge-model calls)                                                                 | 86 to anchor         |
| Lesson-to-file anchors (plan 05's method)                     | 0 path anchors (match 0, mismatch 0, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                                                                  | every anchor matches its file                                                                                                                                        | 0 to repair          |
| Output blocks                                                 | 84 output fences; 84 unanchored                                                                                                                                                                       | every `**Output**` block anchored to an expected file                                                                                                                | 84 to anchor         |
| Harness units                                                 | 80 example folders, 0 kata folders, 88 code files, 0 `run.yaml`                                                                                                                                       | 80 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                              | create 8, convert 81 |
| Drilling page                                                 | 4,929 words; 5 of 5 standard `##` sections exact; 43 `<details>` blocks; headings found: Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) | 71 words short       |
| Katas                                                         | 0 kata folders                                                                                                                                                                                        | at least 8 as `before`/`after` units                                                                                                                                 | 8                    |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                                | unchanged, except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                           | recompute            |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X1** 88 code files (80 example folders, 0 kata folders, 2 test-like files); none has a `run.yaml`.
- **X3** 86 of 86 code fences are neither anchored nor marked as illustrations.
- **X4** 84 of 84 `**Output**` blocks are not labelled anchors to expected files.
- **X11** Drilling: 4,929 words (71 short of 5,000); 5 of 5 exact `##` sections; 0 kata folders against 8.
- **X15** 6 files mention a model and 2 a browser; judges are scripted functions with fixed verdict tables, and trajectories are JSONL fixtures.
- **X18** The lessons mention "GPT-4" once and two providers six times; model names are dated or replaced by role names (policy AI7).
- **X20** 12 Mermaid diagrams against the band of 30 to 50.

## Fixes and design

- Anchor the 86 fences and 84 output blocks, convert the 80 example folders and the capstone folder to units, and run them under `python`.
- Add 8 kata units; trim the drilling page to the five exact headings (it is 71 words short of 5,000).
- Add diagrams to the band (12 today) and write the missing "Examples by Level" entries.

## Harness mode and toolchain

- **Harness mode**: Real mode: `python`, standard library only.
- **Toolchain ids**: python.
- **Toolchain additions** (budget-gated, default NO-GO; [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-cost.md)): none.
- **Fixtures** (AI course): Deterministic fixtures only (policy AI1 to AI6 in [tech-docs/011](../../tech-docs/011-ai-fixtures-and-sourcing-policy.md)): a scripted `FakeModel`, recorded responses stored in the unit folder, no API key or provider variable read, no network, fixed seeds, and a counter clock. A call to a hosted model appears only as a marked illustration with a dated Reference.
- **Phase 1 spikes**: SP12 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: at most 4 (hosted judge-model calls).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 2.0 s per container invocation × 2 executions × 99 runs (80 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 6.6 minutes.

## Size class and sequencing

- **Size class S** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 71 (the larger of the word gap and the drilling shortfall), new unit folders 8.
- **Estimated effort** (size, not time): class S; agent packets: one packet per defect group (mechanical fixes, then prose fixes); no page split.
- **Wave 7**, slot 3. Makers and fixers for this course: `apps-ayokoding-www-by-example-maker` for authoring gaps, `tutorial-by-example-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `fine-tuning-and-adaptation` (each is audited in a later wave, so this course is final first).

## Prerequisite re-check

- Plan 02 removes `agentic-ai`, `agent-orchestration-subagents-and-observability`, `cicd-and-release-engineering` (the list above is the result).
- In-plan prerequisites are audited first: `evaluating-ai-output-essentials` in wave 4, `statistics-for-evaluation` in wave 5.
- Prerequisites outside this plan (unchanged here): `software-testing`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-path-and-capstone-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `evaluating-ai-systems-in-depth` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder; `AUDIT_PROBE=evaluating-ai-systems-in-depth:by-example` with `UNIT-NODE tests/unit/be-steps/audited-course-completion.steps.ts` to record the scenarios the course fails; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (S): one packet per defect group (mechanical fixes, then prose fixes); no page split. Classes: X1, X3, X4, X11, X15, X18, X20.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `evaluating-ai-systems-in-depth`; a course that fires is fixed, never baselined.
- [ ] Units: 80 example units, 8 kata units, 1 capstone unit (create 8, convert 81); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 4 (hosted judge-model calls).
- [ ] AI fixtures: every unit uses the shared `FakeModel` and recorded responses (AI1 to AI6); `rtk git grep -n -E "api_key|API_KEY|openai|anthropic|requests|urllib|socket" -- <course>/learning/code <course>/drilling/code <course>/learning/capstone/code` shows no unexplained hit; every product, model, protocol, or price claim has a dated Reference within 30 days of the commit (AI7).
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `evaluating-ai-systems-in-depth` exits 0 (at most 2 repair cycles); `EX-COVERAGE` shows `covered: true` for `evaluating-ai-systems-in-depth`.
- [ ] CP-6 The registry row for `evaluating-ai-systems-in-depth` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit evaluating-ai-systems-in-depth course` with explicit paths only: the course folder with its `_index.md`, the registry row.
- [ ] CP-7 Capstone relies-on: `rtk git grep -n "evaluating-ai-systems-in-depth" -- 'apps/ayokoding-www/content/en/learn/courses/capstone-*/learning/overview.md'` shows no capstone row for this course today; if the search finds one at execution time, handle it as in the other courses and note it in the ledger.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/evaluating-ai-systems-in-depth/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Claims about products, models, protocols, prices, and limits are not facts of this brief: the maker re-verifies each one against its primary source on the day it writes it and records the value and date in the ledger (accuracy rules A1 to A7 and policy AI7).
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–16 (16): from "Metric-Before-Analysis Fails" to "Deterministic Scorer vs. Ground Truth".
- **co-02 · intermediate** — examples 17–62 (30): from "First Judge Prompt" to "Judge Scope Boundary Map".
- **co-03 · advanced** — examples 35–80 (34): from "Trajectory Capture" to "End-to-End Mini Dry Run of the Whole Pipeline".

## Lineage

- Builds on: `evaluating-ai-output-essentials`, `statistics-for-evaluation`, `software-testing`. Required by (in this plan): `fine-tuning-and-adaptation`.

## In which paths

- `careers/immediately-effective/ai-engineer` — position 25 of 28 in the manifest as specified by plan 08 (read 2026-10-09), phase `evaluation-in-depth`, role `extension`; this plan changes no path membership or order.
- `careers/immediately-effective/ai-engineer` — a prerequisite change here also changes that manifest, its `assumes`, and its tests in the same PR (plan 02's rule R6, plan 08's duty).
