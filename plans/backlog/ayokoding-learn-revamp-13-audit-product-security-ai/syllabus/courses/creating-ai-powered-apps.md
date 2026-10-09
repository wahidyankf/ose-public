# Creating AI-Powered Apps (By Example)

**Course ID**: `creating-ai-powered-apps` · **Format**: By Example · **Family**: ai-engineering.

**Scope note**: Audits and fixes the existing `creating-ai-powered-apps` course to the series definition of done and brings every example green in plan 05's code harness. The subject, slug, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course (except a capstone's `relies-on` row, CP-7).

**Short summary**: Building an application on a language model: prompts, structured output, retrieval, tool use, streaming, evaluation hooks, cost, and failure handling.

## Why this exists · the big idea

- **The problem before the solution**: 4,778 words for 80 programs, one fence, one anchor that mismatches, and 29 of 80 examples have a "Why It Matters" block (all 29 under 50 words).
- **Keep-this-if-you-forget-everything**: A model call is an unreliable function; the app around it is the work, and the unreliable part is replaced by a fake in every test.

## Prerequisites

- **Prior courses**: `backend-essentials`, `api-design` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example. **Reason**: By Example, as plan 03 records it: 80 typed Python programs in three level pages, with a capstone code folder.
  A maker may not switch modes except where the reason above says so; a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user.
- **Mode-convention fit**: today the course fits the convention: `overview.md` plus beginner, intermediate, and advanced pages. Example headings per page today: `learning/advanced.md` (25), `learning/beginner.md` (27), `learning/intermediate.md` (28).
- **Wave**: 3 (slot 1); **size class**: XL (words to write 23,222, new unit folders 8); **expected defect classes**: 11 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                           | Target                                                                                                                                                               | Work                            |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 4,778                                                                                                                                                                                     | at least 28,000                                                                                                                                                      | 23,222 to write                 |
| Examples as `### Example N: Title`                            | 80                                                                                                                                                                                        | at least 75, numbered 1 to N without gaps                                                                                                                            | none                            |
| Mermaid diagrams                                              | 0                                                                                                                                                                                         | 30 to 50 (adapter band)                                                                                                                                              | 30 to add                       |
| "Why It Matters" (50 to 100 words each)                       | 29 of 80 present; 29 under 50 words; 0 over 100; median 9 words                                                                                                                           | one per example, 50 to 100 words                                                                                                                                     | 80 to write or fix              |
| Annotation density (comment lines per code line)              | median 0.88; 1 examples below 1.0; 0 above 2.25 (of 1 code-bearing)                                                                                                                       | 1.0 to 2.25 on every code-bearing example                                                                                                                            | 1 to fix                        |
| Code fences                                                   | 1 code fences in the lessons; 0 unanchored                                                                                                                                                | every code fence anchored or marked as an illustration (budget: 8 at most; hosted SDK calls and `pip install` lines, shown with a dated Reference)                   | 0 to anchor                     |
| Lesson-to-file anchors (plan 05's method)                     | 1 path anchors (match 0, mismatch 1, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                                                      | every anchor matches its file                                                                                                                                        | 1 to repair                     |
| Output blocks                                                 | 0 output fences; 0 unanchored                                                                                                                                                             | every `**Output**` block anchored to an expected file                                                                                                                | 0 to anchor                     |
| Harness units                                                 | 80 example folders, 0 kata folders, 81 code files, 0 `run.yaml`                                                                                                                           | 80 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                              | create 8, convert 81            |
| Drilling page                                                 | 203 words; 1 of 5 standard `##` sections exact; 0 `<details>` blocks; headings found: Recall Q&A, Scenario judgment, Hands-on implementation, Automaticity checklist, Extension challenge | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) | 4,797 words short; fix sections |
| Katas                                                         | 0 kata folders                                                                                                                                                                            | at least 8 as `before`/`after` units                                                                                                                                 | 8                               |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                    | unchanged, except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                           | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X1** 81 code files (80 example folders, 0 kata folders, 0 test-like files); none has a `run.yaml`.
- **X3** 1 anchors mismatch their files and 0 point at missing files.
- **X5** 4,778 words across 80 examples is about 60 words per example; a complete example in this mode needs about 373.
- **X7** 51 of 80 examples have no "Why It Matters" block.
- **X8** 29 "Why It Matters" blocks present: 29 under 50 words, 0 over 100, median 9 words.
- **X9** Annotation density: median 0.88; 1 examples below 1.0 and 0 above 2.25 (of 1 code-bearing).
- **X11** Drilling: 203 words (4,797 short of 5,000); 1 of 5 exact `##` sections; 0 kata folders against 8.
- **X13** 4,778 words against a floor of 28,000; 23,222 to write.
- **X15** 11 files mention a model or provider, 4 a pentest keyword (prompt injection), and 1 a clock. Retrieval uses a bag-of-words embedding written in the course, never a vendor embedding.
- **X18** SDK names, parameters, and prices change; the lessons keep SDK calls as illustrations with a dated Reference and run the pattern against the fake model (policy AI7).
- **X20** 0 Mermaid diagrams against the band of 30 to 50.

## Fixes and design

- Write the lessons around the 80 programs and the capstone folder; the 51 missing "Why It Matters" blocks and 29 short ones are written to 50 to 100 words.
- Streaming is a scripted generator; cost is arithmetic on fixed token counts; retrieval is a bag-of-words cosine over a fixed corpus; structured output is validated against a hand-written schema checker.
- Add 8 kata units, the drilling page (203 words today) at 5,000 words, and diagrams (0 today) to the band; repair the one mismatching anchor.

## Harness mode and toolchain

- **Harness mode**: Real mode: `python`, standard library only.
- **Toolchain ids**: python.
- **Toolchain additions** (budget-gated, default NO-GO; [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-cost.md)): none.
- **Fixtures** (AI course): Deterministic fixtures only (policy AI1 to AI6 in [tech-docs/011](../../tech-docs/011-ai-fixtures-and-sourcing-policy.md)): a scripted `FakeModel`, recorded responses stored in the unit folder, no API key or provider variable read, no network, fixed seeds, and a counter clock. A call to a hosted model appears only as a marked illustration with a dated Reference.
- **Phase 1 spikes**: SP12 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: at most 8 (hosted SDK calls and `pip install` lines, shown with a dated Reference).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 2.0 s per container invocation × 2 executions × 99 runs (80 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 6.6 minutes.

## Size class and sequencing

- **Size class XL** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 23,222 (the larger of the word gap and the drilling shortfall), new unit folders 8.
- **Estimated effort** (size, not time): class XL; agent packets: authoring split by learning page and again by blocks of at most 15 examples, then one packet per remaining defect group; the course folder is committed only when every unit exists.
- **Wave 3**, slot 1. Makers and fixers for this course: `apps-ayokoding-www-by-example-maker` for authoring gaps, `tutorial-by-example-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `agentic-ai`, `evaluating-ai-output-essentials`, `fine-tuning-and-adaptation`, `inference-serving-and-model-deployment`, `product-patterns-for-probabilistic-systems` (each is audited in a later wave, so this course is final first).

## Prerequisite re-check

- Plan 02 keeps the current list (the list above is the result).
- In-plan prerequisites are audited first: `backend-essentials` in wave 1, `api-design` in wave 2.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-path-and-capstone-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `creating-ai-powered-apps` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder; `AUDIT_PROBE=creating-ai-powered-apps:by-example` with `UNIT-NODE tests/unit/be-steps/audited-course-completion.steps.ts` to record the scenarios the course fails; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (XL): authoring split by learning page and again by blocks of at most 15 examples, then one packet per remaining defect group; the course folder is committed only when every unit exists. Classes: X1, X3, X5, X7, X8, X9, X11, X13, X15, X18, X20.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `creating-ai-powered-apps`; a course that fires is fixed, never baselined.
- [ ] Units: 80 example units, 8 kata units, 1 capstone unit (create 8, convert 81); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 8 (hosted SDK calls and `pip install` lines, shown with a dated Reference).
- [ ] AI fixtures: every unit uses the shared `FakeModel` and recorded responses (AI1 to AI6); `rtk git grep -n -E "api_key|API_KEY|openai|anthropic|requests|urllib|socket" -- <course>/learning/code <course>/drilling/code <course>/learning/capstone/code` shows no unexplained hit; every product, model, protocol, or price claim has a dated Reference within 30 days of the commit (AI7).
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `creating-ai-powered-apps` exits 0 (at most 2 repair cycles); `EX-COVERAGE` shows `covered: true` for `creating-ai-powered-apps`.
- [ ] CP-6 The registry row for `creating-ai-powered-apps` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit creating-ai-powered-apps course` with explicit paths only: the course folder with its `_index.md`, the registry row.
- [ ] CP-7 Capstone relies-on: `rtk git grep -n "creating-ai-powered-apps" -- 'apps/ayokoding-www/content/en/learn/courses/capstone-*/learning/overview.md'` lists `capstone-data-pipeline`; read each `## What this course relies on` row for this course and confirm the audited course still teaches the named concepts at definition level; edit the row and the capstone paragraph that restates it in the same commit if not. The content-shape test (CL1, CL4) must stay green.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/creating-ai-powered-apps/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Claims about products, models, protocols, prices, and limits are not facts of this brief: the maker re-verifies each one against its primary source on the day it writes it and records the value and date in the ledger (accuracy rules A1 to A7 and policy AI7).
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–27 (27): from "Messages Request" to "Vector Store Index".
- **co-02 · intermediate** — examples 28–55 (28): from "Nearest-Neighbor Search" to "Cache Usage Math".
- **co-03 · advanced** — examples 56–80 (25): from "Batch Processing" to "Compose the Guarded AI App Capstone".

## Lineage

- Builds on: `backend-essentials`, `api-design`. Required by (in this plan): `agentic-ai`, `evaluating-ai-output-essentials`, `fine-tuning-and-adaptation`, `inference-serving-and-model-deployment`, `product-patterns-for-probabilistic-systems`.
- Listed as a prerequisite by plan 08's capstones: `capstone-data-pipeline` (read from plan 08's briefs on 2026-10-09).

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 104 of 121 in the manifest as specified by plan 02 (read 2026-10-09), phase `ai-and-agents`, role `extension`; this plan changes no path membership or order.
- `careers/immediately-effective/ai-engineer` — position 5 of 28 in the manifest as specified by plan 08 (read 2026-10-09), phase `building-with-models`, role `core`; this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 101 of 114 in the manifest as specified by plan 02 (read 2026-10-09), phase `ai-and-agents`, role `extension`; this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 102 of 116 in the manifest as specified by plan 02 (read 2026-10-09), phase `ai-and-agents`, role `extension`; this plan changes no path membership or order.
- `careers/immediately-effective/ai-engineer` — a prerequisite change here also changes that manifest, its `assumes`, and its tests in the same PR (plan 02's rule R6, plan 08's duty).
