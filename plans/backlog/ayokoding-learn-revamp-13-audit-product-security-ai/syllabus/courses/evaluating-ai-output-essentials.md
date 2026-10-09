# Evaluating AI Output — Essentials (Annotated Concept (standard))

**Course ID**: `evaluating-ai-output-essentials` · **Format**: Annotated Concept (standard) · **Family**: ai-engineering.

**Scope note**: Audits and fixes the existing `evaluating-ai-output-essentials` course to the series definition of done and brings every example green in plan 05's code harness. The subject, slug, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course (except a capstone's `relies-on` row, CP-7).

**Short summary**: Checking what a model produced: why eyeballing fails, scorers that cost nothing, a runner that turns cases into one number, and a gate for a real change.

## Why this exists · the big idea

- **The problem before the solution**: Content is nearly complete (43,634 words, 46 worked examples, 46 "Why It Matters" blocks), but all 47 code fences and all 46 output blocks are unanchored, 5 code files are exact duplicates of others, and the drilling page is 1,241 words short.
- **Keep-this-if-you-forget-everything**: An evaluation is a fixed set of cases, a scorer, and a number you can reproduce; the model is the only part that is replaced by a fake.

## Prerequisites

- **Prior courses**: `creating-ai-powered-apps`, `software-testing`, `just-enough-python` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: Annotated Concept (standard). **Reason**: Annotated Concept (standard), as plan 03 records it: judgement about measurement, with a code-bearing subset and a scorer-and-runner capstone.
  A maker may not switch modes except where the reason above says so; a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user.
- **Mode-convention fit**: today the course needs `learning/overview.md`, worked-example pages (by theme), and `learning/capstone/`; CP-1 checks the layout against the mode checker. Example headings per page today: `learning/theme-a-why-you-cannot-eyeball-it.md` (10), `learning/theme-b-scorers-that-cost-nothing.md` (12), `learning/theme-c-the-runner-and-the-number.md` (12), `learning/theme-d-using-the-gate-on-a-real-change.md` (12).
- **Wave**: 4 (slot 2); **size class**: S (words to write 1,241, new unit folders 5); **expected defect classes**: 7 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                                       | Target                                                                                                                                                               | Work                 |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 43,634                                                                                                                                                                                                | at least 22,000                                                                                                                                                      | none                 |
| Examples as `### Worked Example N: Title`                     | 46                                                                                                                                                                                                    | at least 45, numbered 1 to N without gaps                                                                                                                            | none                 |
| Mermaid diagrams                                              | 6                                                                                                                                                                                                     | at least 10 (this plan's target)                                                                                                                                     | 4 to add             |
| "Why It Matters" (50 to 100 words each)                       | 46 of 46 present; 0 under 50 words; 0 over 100; median 71 words                                                                                                                                       | one per example, 50 to 100 words                                                                                                                                     | 0 to write or fix    |
| Annotation density (comment lines per code line)              | median 1.08; 0 examples below 1.0; 0 above 2.25 (of 43 code-bearing)                                                                                                                                  | 1.0 to 2.25 on every code-bearing example                                                                                                                            | 0 to fix             |
| Code fences                                                   | 47 code fences in the lessons; 47 unanchored                                                                                                                                                          | every code fence anchored or marked as an illustration (budget: 4 at most; hosted evaluation-service screenshots and CLI lines)                                      | 47 to anchor         |
| Lesson-to-file anchors (plan 05's method)                     | 0 path anchors (match 0, mismatch 0, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                                                                  | every anchor matches its file                                                                                                                                        | 0 to repair          |
| Output blocks                                                 | 46 output fences; 46 unanchored                                                                                                                                                                       | every `**Output**` block anchored to an expected file                                                                                                                | 46 to anchor         |
| Harness units                                                 | 43 example folders, 0 kata folders, 59 code files, 0 `run.yaml`                                                                                                                                       | 43 example units, 5 kata units, 1 capstone unit, each with a `run.yaml`                                                                                              | create 5, convert 44 |
| Drilling page                                                 | 3,759 words; 5 of 5 standard `##` sections exact; 27 `<details>` blocks; headings found: Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) | 1,241 words short    |
| Katas                                                         | 0 kata folders                                                                                                                                                                                        | at least 5 as `before`/`after` units                                                                                                                                 | 5                    |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                                | unchanged, except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                           | recompute            |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X1** 59 code files (43 example folders, 0 kata folders, 1 test-like files); none has a `run.yaml`.
- **X3** 47 of 47 code fences are neither anchored nor marked as illustrations.
- **X4** 46 of 46 `**Output**` blocks are not labelled anchors to expected files.
- **X11** Drilling: 3,759 words (1,241 short of 5,000); 5 of 5 exact `##` sections; 0 kata folders against 5.
- **X15** 5 files use a random source; each gets a fixed seed. The `.jsonl` case files (9) are fixtures and stay byte-identical.
- **X18** The lessons mention OpenAI and Anthropic evaluation tooling 8 times and Python 3.13 12 times; vendor claims are dated (policy AI7) and the Python version is aligned to the catalog's 3.14.
- **X20** 6 Mermaid diagrams against this plan's floor of 10.

## Fixes and design

- Anchor the 47 fences and the 46 `**Output**` blocks to unit files and expected files; remove the 5 duplicate-body files by giving each example its own case set.
- Keep the 43 example folders (46 worked examples, so 3 are concept-only) and the capstone folder; add 5 kata units.
- Expand the drilling page by 1,241 words under the five exact headings.

## Harness mode and toolchain

- **Harness mode**: Real mode: `python`, standard library only.
- **Toolchain ids**: python.
- **Toolchain additions** (budget-gated, default NO-GO; [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-cost.md)): none.
- **Fixtures** (AI course): Deterministic fixtures only (policy AI1 to AI6 in [tech-docs/011](../../tech-docs/011-ai-fixtures-and-sourcing-policy.md)): a scripted `FakeModel`, recorded responses stored in the unit folder, no API key or provider variable read, no network, fixed seeds, and a counter clock. A call to a hosted model appears only as a marked illustration with a dated Reference.
- **Phase 1 spikes**: SP12 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: at most 4 (hosted evaluation-service screenshots and CLI lines).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 2.0 s per container invocation × 2 executions × 56 runs (43 examples + 2 × 5 kata runs + 3 capstone runs) ≈ 3.7 minutes.

## Size class and sequencing

- **Size class S** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 1,241 (the larger of the word gap and the drilling shortfall), new unit folders 5.
- **Estimated effort** (size, not time): class S; agent packets: one packet per defect group (mechanical fixes, then prose fixes); no page split.
- **Wave 4**, slot 2. Makers and fixers for this course: `apps-ayokoding-www-annotated-concept-maker` for authoring gaps, `tutorial-annotated-concept-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `evaluating-ai-systems-in-depth`, `product-patterns-for-probabilistic-systems`, `statistics-for-evaluation` (each is audited in a later wave, so this course is final first).

## Prerequisite re-check

- Plan 02 keeps the current list (the list above is the result).
- In-plan prerequisites are audited first: `creating-ai-powered-apps` in wave 3.
- Prerequisites outside this plan (unchanged here): `software-testing`, `just-enough-python`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-path-and-capstone-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `evaluating-ai-output-essentials` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-annotated-concept-checker` over the course folder; `AUDIT_PROBE=evaluating-ai-output-essentials:annotated-concept` with `UNIT-NODE tests/unit/be-steps/audited-course-completion.steps.ts` to record the scenarios the course fails; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (S): one packet per defect group (mechanical fixes, then prose fixes); no page split. Classes: X1, X3, X4, X11, X15, X18, X20.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `evaluating-ai-output-essentials`; a course that fires is fixed, never baselined.
- [ ] Units: 43 example units, 5 kata units, 1 capstone unit (create 5, convert 44); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 4 (hosted evaluation-service screenshots and CLI lines).
- [ ] AI fixtures: every unit uses the shared `FakeModel` and recorded responses (AI1 to AI6); `rtk git grep -n -E "api_key|API_KEY|openai|anthropic|requests|urllib|socket" -- <course>/learning/code <course>/drilling/code <course>/learning/capstone/code` shows no unexplained hit; every product, model, protocol, or price claim has a dated Reference within 30 days of the commit (AI7).
- [ ] CP-3 `tutorial-annotated-concept-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `evaluating-ai-output-essentials` exits 0 (at most 2 repair cycles); `EX-COVERAGE` shows `covered: true` for `evaluating-ai-output-essentials`.
- [ ] CP-6 The registry row for `evaluating-ai-output-essentials` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit evaluating-ai-output-essentials course` with explicit paths only: the course folder with its `_index.md`, the registry row.
- [ ] CP-7 Capstone relies-on: `rtk git grep -n "evaluating-ai-output-essentials" -- 'apps/ayokoding-www/content/en/learn/courses/capstone-*/learning/overview.md'` shows no capstone row for this course today; if the search finds one at execution time, handle it as in the other courses and note it in the ledger.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/evaluating-ai-output-essentials/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Claims about products, models, protocols, prices, and limits are not facts of this brief: the maker re-verifies each one against its primary source on the day it writes it and records the value and date in the ledger (accuracy rules A1 to A7 and policy AI7).
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · theme-a-why-you-cannot-eyeball-it** — examples 1–10 (10): from "The Vibe Check Fails" to "Dataset Schema".
- **co-02 · theme-b-scorers-that-cost-nothing** — examples 11–22 (12): from "Exact-Match Scorer" to "Scorers on a Cost-vs-Reach Axis (diagram)".
- **co-03 · theme-c-the-runner-and-the-number** — examples 23–34 (12): from "Minimal Eval Runner" to "Runner as a Pytest Suite".
- **co-04 · theme-d-using-the-gate-on-a-real-change** — examples 35–46 (12): from "Baseline Run" to "The Capstone's First Eval Gate, Condensed".

## Lineage

- Builds on: `creating-ai-powered-apps`, `software-testing`, `just-enough-python`. Required by (in this plan): `evaluating-ai-systems-in-depth`, `product-patterns-for-probabilistic-systems`, `statistics-for-evaluation`.

## In which paths

- `careers/immediately-effective/ai-engineer` — position 23 of 28 in the manifest as specified by plan 08 (read 2026-10-09), phase `evaluation-in-depth`, role `extension`; this plan changes no path membership or order.
- `careers/immediately-effective/ai-engineer` — a prerequisite change here also changes that manifest, its `assumes`, and its tests in the same PR (plan 02's rule R6, plan 08's duty).
