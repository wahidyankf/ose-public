# Product Patterns for Probabilistic Systems (Annotated Concept (no-code))

**Course ID**: `product-patterns-for-probabilistic-systems` · **Format**: Annotated Concept (no-code) · **Family**: ai-engineering.

**Scope note**: Audits and fixes the existing `product-patterns-for-probabilistic-systems` course to the series definition of done and brings every example green in plan 05's code harness. The subject, slug, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course (except a capstone's `relies-on` row, CP-7).

**Short summary**: Designing products around outputs that are sometimes wrong: confidence and provenance, human-in-the-loop friction and recovery, degradation and latency, and the launch decision.

## Why this exists · the big idea

- **The problem before the solution**: Content is nearly complete (30,210 words, 44 worked scenarios in four themes). Gaps are in drilling (4,127 words with nonstandard headings), 6 diagrams against a target of 10, and five design exercises.
- **Keep-this-if-you-forget-everything**: A product built on a probabilistic system ships a decision about wrong answers, not a feature; each scenario ends with the artifact that records the decision.

## Prerequisites

- **Prior courses**: `creating-ai-powered-apps`, `evaluating-ai-output-essentials`, `software-product-engineering`, `frontend-essentials` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: Annotated Concept (no-code). **Reason**: Annotated Concept, no-code sub-mode (unchanged): the course teaches design judgement with decision artifacts. The adapter reserves no-code for leadership and governance topics; this topic is product design judgement of the same kind and has no `code/` folder.
  A maker may not switch modes except where the reason above says so; a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user.
- **Mode-convention fit**: today the course needs `learning/overview.md`, scenario pages (by level or theme), `learning/capstone/`, and no `code/` folder. Example headings per page today: no page with numbered example headings.
- **Wave**: 14 (slot 3); **size class**: S (words to write 873, new unit folders 0); **expected defect classes**: 3 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                                                               | Target                                                                                                                                                               | Work                          |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 30,210                                                                                                                                                                                                                        | at least 18,000                                                                                                                                                      | none                          |
| Scenarios as `### Worked Scenario N: Title`                   | 44 in the mode's form                                                                                                                                                                                                         | at least 20, numbered 1 to N without gaps                                                                                                                            | none                          |
| Mermaid diagrams                                              | 6                                                                                                                                                                                                                             | at least 10 (this plan's target)                                                                                                                                     | 4 to add                      |
| "Why It Matters" (50 to 100 words each)                       | the scenarios end with Key takeaway and Why It Matters blocks whose lengths the checker measures in CP-1                                                                                                                      | 50 to 100 words each                                                                                                                                                 | measured in CP-1              |
| Harness units                                                 | no `code/` folder with files and no non-prose fence                                                                                                                                                                           | none: the course stays free of code and is "not applicable" in the coverage report                                                                                   | none                          |
| Drilling page                                                 | 4,127 words; 2 of 5 standard `##` sections exact; 47 `<details>` blocks; headings found: Recall Q&A, Applied scenarios, Decision-artifact repair drills, Self-check checklist, Elaborative interrogation and self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) | 873 words short; fix sections |
| Katas                                                         | no kata folders                                                                                                                                                                                                               | five design exercises under `## Code katas`, with no code and no kata folder                                                                                         | 5 exercises to write          |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                                                        | unchanged, except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                           | recompute                     |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X11** Drilling: 4,127 words (873 short of 5,000); 2 of 5 exact `##` sections.
- **X18** The scenarios name no vendor; time-sensitive claims (accuracy rates, regulatory notes) get a dated Reference at fix time.
- **X20** 6 Mermaid diagrams against this plan's floor of 10.

## Fixes and design

- Rename the drilling sections to the five exact headings (the second is "Applied problems" and the third is "Code katas", which holds five design exercises with no code for this sub-mode).
- Lengthen the drilling page by 873 words; add 4 diagrams; keep the 44 scenarios and their Key takeaway and "Why It Matters" blocks.
- Add the "not applicable" harness status: no `code/` folder and no fence.

## Harness mode and toolchain

- **Harness mode**: No code: the harness reports the course as not applicable.
- **Toolchain ids**: none.
- **Toolchain additions** (budget-gated, default NO-GO; [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-cost.md)): none.
- **Illustration budget**: at most 0; the course has no code fence.
- **CI cost**: none; the course has no unit.

## Size class and sequencing

- **Size class S** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 873 (the larger of the word gap and the drilling shortfall), new unit folders 0.
- **Estimated effort** (size, not time): class S; agent packets: one packet per defect group (mechanical fixes, then prose fixes); no page split.
- **Wave 14**, slot 3. Makers and fixers for this course: `apps-ayokoding-www-annotated-concept-maker` for authoring gaps and `tutorial-annotated-concept-fixer` for gate findings; no `swe-developer` packet is needed because the course has no code.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 keeps the current list (the list above is the result).
- In-plan prerequisites are audited first: `creating-ai-powered-apps` in wave 3, `evaluating-ai-output-essentials` in wave 4, `software-product-engineering` in wave 8, `frontend-essentials` in wave 1.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-path-and-capstone-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `product-patterns-for-probabilistic-systems` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-annotated-concept-checker` over the course folder; `AUDIT_PROBE=product-patterns-for-probabilistic-systems:annotated-concept-no-code` with `UNIT-NODE tests/unit/be-steps/audited-course-completion.steps.ts` to record the scenarios the course fails; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (S): one packet per defect group (mechanical fixes, then prose fixes); no page split. Classes: X11, X18, X20.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `product-patterns-for-probabilistic-systems`; a course that fires is fixed, never baselined.
- [ ] CP-3 `tutorial-annotated-concept-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-VALIDATE` for the slug reports the course as not applicable (no code folder with files, no non-prose fence); `EX-COVERAGE` lists it under not applicable.
- [ ] CP-6 The registry row for `product-patterns-for-probabilistic-systems` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit product-patterns-for-probabilistic-systems course` with explicit paths only: the course folder with its `_index.md`, the registry row.
- [ ] CP-7 Capstone relies-on: `rtk git grep -n "product-patterns-for-probabilistic-systems" -- 'apps/ayokoding-www/content/en/learn/courses/capstone-*/learning/overview.md'` shows no capstone row for this course today; if the search finds one at execution time, handle it as in the other courses and note it in the ledger.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/product-patterns-for-probabilistic-systems/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · theme-a-the-wrong-answer-is-coming** — scenarios 1–11 (11): from "The Deterministic Interface Fails" to "Decide Not to Ship".
- **co-02 · theme-b-uncertainty-confidence-and-provenance** — scenarios 12–22 (11): from "Where Uncertainty Belongs" to "Accessible Uncertainty".
- **co-03 · theme-c-humans-in-the-loop-friction-and-recovery** — scenarios 23–33 (11): from "Review as the Product" to "Feedback Into Error Analysis".
- **co-04 · theme-d-degradation-latency-and-the-launch-decision** — scenarios 34–44 (11): from "Model-Unavailable State" to "Capstone-Probabilistic-Feature-Design Dossier".

## Lineage

- Builds on: `creating-ai-powered-apps`, `evaluating-ai-output-essentials`, `software-product-engineering`, `frontend-essentials`. Required by (in this plan): none.

## In which paths

- `careers/immediately-effective/ai-engineer` — position 26 of 28 in the manifest as specified by plan 08 (read 2026-10-09), phase `evaluation-in-depth`, role `extension`; this plan changes no path membership or order.
- `careers/immediately-effective/ai-engineer` — a prerequisite change here also changes that manifest, its `assumes`, and its tests in the same PR (plan 02's rule R6, plan 08's duty).
