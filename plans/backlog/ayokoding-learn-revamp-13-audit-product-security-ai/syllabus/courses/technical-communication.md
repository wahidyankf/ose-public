# Technical Communication (Annotated Concept (no-code))

**Course ID**: `technical-communication` · **Format**: Annotated Concept (no-code) · **Family**: product-and-leadership.

**Scope note**: Audits and fixes the existing `technical-communication` course to the series definition of done and brings every example green in plan 05's code harness. The subject, slug, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course (except a capstone's `relies-on` row, CP-7).

**Short summary**: Writing and presenting technical work: audience, structure, design documents, requests for comments, postmortems, and talks.

## Why this exists · the big idea

- **The problem before the solution**: Content is complete (24,848 words, 25 worked scenarios, 25 artifact pages); the gaps are the drilling page (4,391 words, so 609 short) with nonstandard section names; 11 diagrams already meet the target.
- **Keep-this-if-you-forget-everything**: Good technical writing is a decision about a reader; every scenario shows the same content rewritten for a different reader.

## Prerequisites

- **Prior courses**: `project-management` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: Annotated Concept (no-code). **Reason**: Annotated Concept, no-code sub-mode, as plan 03 records it: communication judgement with written artifacts (RFCs, postmortems, memos); markdown fences show document text, not code.
  A maker may not switch modes except where the reason above says so; a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user.
- **Mode-convention fit**: today the course needs `learning/overview.md`, scenario pages (by level or theme), `learning/capstone/`, and no `code/` folder. Example headings per page today: no page with numbered example headings.
- **Wave**: 15 (slot 1); **size class**: S (words to write 609, new unit folders 0); **expected defect classes**: 2 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                                                          | Target                                                                                                                                                               | Work                          |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 24,848                                                                                                                                                                                                                   | at least 18,000                                                                                                                                                      | none                          |
| Scenarios as `### Worked Scenario N: Title`                   | 25 in the mode's form                                                                                                                                                                                                    | at least 20, numbered 1 to N without gaps                                                                                                                            | none                          |
| Mermaid diagrams                                              | 11                                                                                                                                                                                                                       | at least 10 (this plan's target)                                                                                                                                     | none                          |
| "Why It Matters" (50 to 100 words each)                       | the scenarios end with Key takeaway and Why It Matters blocks whose lengths the checker measures in CP-1                                                                                                                 | 50 to 100 words each                                                                                                                                                 | measured in CP-1              |
| Harness units                                                 | no `code/` folder with files and no non-prose fence                                                                                                                                                                      | none: the course stays free of code and is "not applicable" in the coverage report                                                                                   | none                          |
| Drilling page                                                 | 4,391 words; 2 of 5 standard `##` sections exact; 41 `<details>` blocks; headings found: Recall Q&A, Applied scenarios, Artifact recreation drills, Self-check checklist, Elaborative interrogation and self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) | 609 words short; fix sections |
| Katas                                                         | no kata folders                                                                                                                                                                                                          | five design exercises under `## Code katas`, with no code and no kata folder                                                                                         | 5 exercises to write          |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                                                   | unchanged, except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                           | recompute                     |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X11** Drilling: 4,391 words (609 short of 5,000); 2 of 5 exact `##` sections.
- **X18** The scenarios cite practices and sources by name; claims about frameworks and metrics are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1.

## Fixes and design

- Rename the drilling sections to the five exact headings and lengthen the page to 5,000 words; the third section holds five design exercises with no code.
- Add diagrams to reach 10 where the scenarios describe a flow, a ladder, or a feedback loop.
- Keep every scenario and artifact; check the "Why It Matters" lengths and the `**Key takeaway**` blocks in CP-1 and fix any outside 50 to 100 words.

## Harness mode and toolchain

- **Harness mode**: No code: the harness reports the course as not applicable (no `code/` folder, no fence, no `run.yaml`).
- **Toolchain ids**: none.
- **Toolchain additions** (budget-gated, default NO-GO; [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-cost.md)): none.
- **Illustration budget**: at most 0; the course has no code fence.
- **CI cost**: none; the course has no unit.

## Size class and sequencing

- **Size class S** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 609 (the larger of the word gap and the drilling shortfall), new unit folders 0.
- **Estimated effort** (size, not time): class S; agent packets: one packet per defect group (mechanical fixes, then prose fixes); no page split.
- **Wave 15**, slot 1. Makers and fixers for this course: `apps-ayokoding-www-annotated-concept-maker` for authoring gaps and `tutorial-annotated-concept-fixer` for gate findings; no `swe-developer` packet is needed because the course has no code.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 removes `capstone-full-stack-app`; adds `project-management` (the list above is the result).
- In-plan prerequisites are audited first: `project-management` in wave 6.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-path-and-capstone-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `technical-communication` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-annotated-concept-checker` over the course folder; `AUDIT_PROBE=technical-communication:annotated-concept-no-code` with `UNIT-NODE tests/unit/be-steps/audited-course-completion.steps.ts` to record the scenarios the course fails; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (S): one packet per defect group (mechanical fixes, then prose fixes); no page split. Classes: X11, X18.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `technical-communication`; a course that fires is fixed, never baselined.
- [ ] CP-3 `tutorial-annotated-concept-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-VALIDATE` for the slug reports the course as not applicable (no code folder with files, no non-prose fence); `EX-COVERAGE` lists it under not applicable.
- [ ] CP-6 The registry row for `technical-communication` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit technical-communication course` with explicit paths only: the course folder with its `_index.md`, the registry row.
- [ ] CP-7 Capstone relies-on: `rtk git grep -n "technical-communication" -- 'apps/ayokoding-www/content/en/learn/courses/capstone-*/learning/overview.md'` shows no capstone row for this course today; if the search finds one at execution time, handle it as in the other courses and note it in the ledger.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/technical-communication/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — scenarios 1–8 (8): from "BLUF Rewrite" to "Title and TL;DR First".
- **co-02 · intermediate** — scenarios 9–18 (10): from "One-Decision ADR" to "C4 Container Diagram".
- **co-03 · advanced** — scenarios 19–25 (7): from "Blameless Postmortem Timeline" to "Reader-Review Rubric Pass".

## Lineage

- Builds on: `project-management`. Required by (in this plan): none.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 102 of 121 in the manifest as specified by plan 02 (read 2026-10-09), phase `more-practice-and-leadership`, role `extension`; this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 96 of 114 in the manifest as specified by plan 02 (read 2026-10-09), phase `more-practice-and-leadership`, role `extension`; this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 97 of 116 in the manifest as specified by plan 02 (read 2026-10-09), phase `more-practice-and-leadership`, role `extension`; this plan changes no path membership or order.
