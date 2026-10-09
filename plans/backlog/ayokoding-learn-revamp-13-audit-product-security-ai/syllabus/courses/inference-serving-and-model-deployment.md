# Inference Serving & Model Deployment (By Example)

**Course ID**: `inference-serving-and-model-deployment` · **Format**: By Example · **Family**: ai-engineering.

**Scope note**: Audits and fixes the existing `inference-serving-and-model-deployment` course to the series definition of done and brings every example green in plan 05's code harness. The subject, slug, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course (except a capstone's `relies-on` row, CP-7).

**Short summary**: Serving a model as a service: batching, scheduling, memory budgets, latency and cost, autoscaling, rollout, and observability.

## Why this exists · the big idea

- **The problem before the solution**: Content is nearly complete (48,109 words, 75 examples), but 75 of 75 output blocks are unanchored, 54 "Why It Matters" blocks are under 50 words, and no example folder has a `run.yaml`.
- **Keep-this-if-you-forget-everything**: Serving is a queue in front of a scarce resource; every example simulates the queue on a virtual clock so latency can be computed, not guessed.

## Prerequisites

- **Prior courses**: `creating-ai-powered-apps`, `backend-at-scale`, `containers-and-orchestration`, `computer-architecture`, `site-reliability-engineering`, `just-enough-python` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example. **Reason**: By Example, as plan 03 records it: 75 typed Python programs with simulated schedulers and budgets.
  A maker may not switch modes except where the reason above says so; a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user.
- **Mode-convention fit**: today the course fits the convention: `overview.md` plus beginner, intermediate, and advanced pages. Example headings per page today: `learning/advanced.md` (25), `learning/beginner.md` (28), `learning/intermediate.md` (22).
- **Wave**: 7 (slot 2); **size class**: S (words to write 522, new unit folders 8); **expected defect classes**: 8 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                                       | Target                                                                                                                                                               | Work                 |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 48,109                                                                                                                                                                                                | at least 28,000                                                                                                                                                      | none                 |
| Examples as `### Example N: Title`                            | 75                                                                                                                                                                                                    | at least 75, numbered 1 to N without gaps                                                                                                                            | none                 |
| Mermaid diagrams                                              | 27                                                                                                                                                                                                    | 30 to 50 (adapter band)                                                                                                                                              | 3 to add             |
| "Why It Matters" (50 to 100 words each)                       | 75 of 75 present; 54 under 50 words; 0 over 100; median 45 words                                                                                                                                      | one per example, 50 to 100 words                                                                                                                                     | 54 to write or fix   |
| Annotation density (comment lines per code line)              | median 1.0; 0 examples below 1.0; 0 above 2.25 (of 75 code-bearing)                                                                                                                                   | 1.0 to 2.25 on every code-bearing example                                                                                                                            | 0 to fix             |
| Code fences                                                   | 80 code fences in the lessons; 0 unanchored                                                                                                                                                           | every code fence anchored or marked as an illustration (budget: 4 at most; `vllm serve` and Kubernetes manifests)                                                    | 0 to anchor          |
| Lesson-to-file anchors (plan 05's method)                     | 80 path anchors (match 80, mismatch 0, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                                                                | every anchor matches its file                                                                                                                                        | 0 to repair          |
| Output blocks                                                 | 75 output fences; 75 unanchored                                                                                                                                                                       | every `**Output**` block anchored to an expected file                                                                                                                | 75 to anchor         |
| Harness units                                                 | 75 example folders, 0 kata folders, 86 code files, 0 `run.yaml`                                                                                                                                       | 75 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                              | create 8, convert 76 |
| Drilling page                                                 | 4,478 words; 5 of 5 standard `##` sections exact; 43 `<details>` blocks; headings found: Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) | 522 words short      |
| Katas                                                         | 0 kata folders                                                                                                                                                                                        | at least 8 as `before`/`after` units                                                                                                                                 | 8                    |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                                | unchanged, except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                           | recompute            |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X1** 86 code files (75 example folders, 0 kata folders, 1 test-like files); none has a `run.yaml`.
- **X4** 75 of 75 `**Output**` blocks are not labelled anchors to expected files.
- **X8** 75 "Why It Matters" blocks present: 54 under 50 words, 0 over 100, median 45 words.
- **X11** Drilling: 4,478 words (522 short of 5,000); 5 of 5 exact `##` sections; 0 kata folders against 8.
- **X15** No clock or random source is used by the programs (the scan found none); arrival traces are fixed lists.
- **X17** A real inference server needs a GPU and model weights. The units simulate continuous batching, KV-cache budgets, and autoscaling on a virtual clock and a fixed arrival trace.
- **X18** The lessons name vLLM 7 times and Python 3.13 five times; engine features are dated and the Python version is aligned (policy AI7).
- **X20** 27 Mermaid diagrams against the band of 30 to 50.

## Fixes and design

- Anchor the 75 output blocks to expected files (the 80 path anchors already match); convert 75 example folders and the capstone folder to units.
- Lengthen the 54 short "Why It Matters" blocks; add 8 kata units.
- Remove 5 duplicate-body files; add diagrams only if the band needs them (27 today, so 3 more).

## Harness mode and toolchain

- **Harness mode**: Real mode: `python`, standard library only.
- **Toolchain ids**: python.
- **Toolchain additions** (budget-gated, default NO-GO; [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-cost.md)): none.
- **Fixtures** (AI course): Deterministic fixtures only (policy AI1 to AI6 in [tech-docs/011](../../tech-docs/011-ai-fixtures-and-sourcing-policy.md)): a scripted `FakeModel`, recorded responses stored in the unit folder, no API key or provider variable read, no network, fixed seeds, and a counter clock. A call to a hosted model appears only as a marked illustration with a dated Reference.
- **Phase 1 spikes**: SP12 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: at most 4 (`vllm serve` and Kubernetes manifests).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 2.0 s per container invocation × 2 executions × 94 runs (75 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 6.3 minutes.

## Size class and sequencing

- **Size class S** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 522 (the larger of the word gap and the drilling shortfall), new unit folders 8.
- **Estimated effort** (size, not time): class S; agent packets: one packet per defect group (mechanical fixes, then prose fixes); no page split.
- **Wave 7**, slot 2. Makers and fixers for this course: `apps-ayokoding-www-by-example-maker` for authoring gaps, `tutorial-by-example-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `fine-tuning-and-adaptation` (each is audited in a later wave, so this course is final first).

## Prerequisite re-check

- Plan 02 keeps the current list (the list above is the result).
- In-plan prerequisites are audited first: `creating-ai-powered-apps` in wave 3, `backend-at-scale` in wave 3.
- Prerequisites outside this plan (unchanged here): `containers-and-orchestration`, `computer-architecture`, `site-reliability-engineering`, `just-enough-python`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-path-and-capstone-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `inference-serving-and-model-deployment` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder; `AUDIT_PROBE=inference-serving-and-model-deployment:by-example` with `UNIT-NODE tests/unit/be-steps/audited-course-completion.steps.ts` to record the scenarios the course fails; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (S): one packet per defect group (mechanical fixes, then prose fixes); no page split. Classes: X1, X4, X8, X11, X15, X17, X18, X20.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `inference-serving-and-model-deployment`; a course that fires is fixed, never baselined.
- [ ] Units: 75 example units, 8 kata units, 1 capstone unit (create 8, convert 76); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 4 (`vllm serve` and Kubernetes manifests).
- [ ] AI fixtures: every unit uses the shared `FakeModel` and recorded responses (AI1 to AI6); `rtk git grep -n -E "api_key|API_KEY|openai|anthropic|requests|urllib|socket" -- <course>/learning/code <course>/drilling/code <course>/learning/capstone/code` shows no unexplained hit; every product, model, protocol, or price claim has a dated Reference within 30 days of the commit (AI7).
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `inference-serving-and-model-deployment` exits 0 (at most 2 repair cycles); `EX-COVERAGE` shows `covered: true` for `inference-serving-and-model-deployment`.
- [ ] CP-6 The registry row for `inference-serving-and-model-deployment` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit inference-serving-and-model-deployment course` with explicit paths only: the course folder with its `_index.md`, the registry row.
- [ ] CP-7 Capstone relies-on: `rtk git grep -n "inference-serving-and-model-deployment" -- 'apps/ayokoding-www/content/en/learn/courses/capstone-*/learning/overview.md'` shows no capstone row for this course today; if the search finds one at execution time, handle it as in the other courses and note it in the ledger.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/inference-serving-and-model-deployment/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Claims about products, models, protocols, prices, and limits are not facts of this brief: the maker re-verifies each one against its primary source on the day it writes it and records the value and date in the ledger (accuracy rules A1 to A7 and policy AI7).
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–28 (28): from "Serve a Model Locally" to "Beginner Recap -- the End-to-End Admission Pipeline".
- **co-02 · intermediate** — examples 29–50 (22): from "Static Batching" to "Cache Block Size Tradeoff".
- **co-03 · advanced** — examples 51–75 (25): from "Quantize a Model" to "TCO Sensitivity to Utilization".

## Lineage

- Builds on: `creating-ai-powered-apps`, `backend-at-scale`, `containers-and-orchestration`, `computer-architecture`, `site-reliability-engineering`, `just-enough-python`. Required by (in this plan): `fine-tuning-and-adaptation`.

## In which paths

- `careers/immediately-effective/ai-engineer` — position 27 of 28 in the manifest as specified by plan 08 (read 2026-10-09), phase `serving-and-adapting`, role `extension`; this plan changes no path membership or order.
- `careers/immediately-effective/ai-engineer` — a prerequisite change here also changes that manifest, its `assumes`, and its tests in the same PR (plan 02's rule R6, plan 08's duty).
