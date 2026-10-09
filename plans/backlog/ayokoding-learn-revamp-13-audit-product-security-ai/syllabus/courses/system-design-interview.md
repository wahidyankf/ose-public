# System-Design Interview (Annotated Concept (no-code))

**Course ID**: `system-design-interview` · **Format**: Annotated Concept (no-code) · **Family**: interview-preparation.

**Scope note**: Audits and fixes the existing `system-design-interview` course to the series definition of done and brings every example green in plan 05's code harness. The subject, slug, and place in every path stay; no new topic is added. The `format` value is corrected (see the mode reason below). It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course (except a capstone's `relies-on` row, CP-7).

**Short summary**: Running a system design round: clarify, estimate, sketch, deep-dive, trade off, and close, with the standard building blocks.

## Why this exists · the big idea

- **The problem before the solution**: 8,520 words in 54 pages: 44 scenario pages of about 850 bytes under `## ex-NN` headings, no worked-scenario headings, 1 diagram, and a drilling page of 439 words with six sections.
- **Keep-this-if-you-forget-everything**: A design round is a spine (clarify, estimate, sketch, deepen, trade off, close) and a habit of naming trade-offs aloud; every scenario drills one step of the spine.

## Prerequisites

- **Prior courses**: `backend-essentials`, `networking-essentials`, `sql-essentials` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: Annotated Concept (no-code). **Reason**: Annotated Concept, no-code sub-mode. Plan 03 records `annotated-concept` (standard), but the course has no `code/` folder and no fence: its artifacts are diagrams, estimates, and spoken explanations. This plan corrects the `format` value (decision D3 in tech-docs/008).
  A maker may not switch modes except where the reason above says so; a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user.
- **Mode-convention fit**: today the course needs `learning/overview.md`, scenario pages (by level or theme), `learning/capstone/`, and no `code/` folder. Example headings per page today: no page with numbered example headings.
- **Wave**: 5 (slot 3); **size class**: M (words to write 9,480, new unit folders 0); **expected defect classes**: 7 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                                           | Target                                                                                                                                                                        | Work                            |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 8,520                                                                                                                                                                                                     | at least 18,000                                                                                                                                                               | 9,480 to write                  |
| Scenarios as `### Worked Scenario N: Title`                   | 0 in the mode's form (the scenarios, where they exist, use another heading)                                                                                                                               | at least 20, numbered 1 to N without gaps                                                                                                                                     | 20 to add                       |
| Mermaid diagrams                                              | 1                                                                                                                                                                                                         | at least 10 (this plan's target)                                                                                                                                              | 9 to add                        |
| "Why It Matters" (50 to 100 words each)                       | the scenarios end with Key takeaway and Why It Matters blocks whose lengths the checker measures in CP-1                                                                                                  | 50 to 100 words each                                                                                                                                                          | measured in CP-1                |
| Harness units                                                 | no `code/` folder with files and no non-prose fence                                                                                                                                                       | none: the course stays free of code and is "not applicable" in the coverage report                                                                                            | none                            |
| Drilling page                                                 | 439 words; 1 of 5 standard `##` sections exact; 7 `<details>` blocks; headings found: Recall Q&A, Calculation practice, Scenario judgment, Design exercise, Automaticity checklist, Why / why not prompts | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation)          | 4,561 words short; fix sections |
| Katas                                                         | no kata folders                                                                                                                                                                                           | five design exercises under `## Code katas`, with no code and no kata folder                                                                                                  | 5 exercises to write            |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                                    | unchanged, except `format` (see the mode reason) and `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X6** The 44 scenarios are `## ex-NN · title` headings in four pages, not `### Worked Scenario N: Title`; the count in the mode's form is 0 against a floor of 20.
- **X11** Drilling: 439 words (4,561 short of 5,000); 1 of 5 exact `##` sections.
- **X12** `format` is `annotated-concept` while the course is no-code; the registry and plan 03's backfill table record the corrected value in the same commit.
- **X13** 8,520 words against a floor of 18,000; 9,480 to write.
- **X17** Capacity and availability scenarios compute numbers by hand; they stay in the lesson as worked arithmetic with units, not as programs.
- **X18** Reference numbers (latencies, throughput of common components) are dated and sourced at fix time.
- **X20** 1 Mermaid diagram against this plan's floor of 10.

## Fixes and design

- Rewrite the 44 scenarios into at least 20 worked scenarios in the mode's form with a diagram each where the design needs one, and add the arithmetic as worked steps.
- Lengthen the course by 9,480 words to 18,000 and the drilling page by 4,561 words under the five exact headings (the sixth "Why / why not prompts" section is folded into the fifth).
- Add 9 diagrams to reach 10; change `format` to `annotated-concept-no-code` with the registry and backfill table in the same commit.

## Harness mode and toolchain

- **Harness mode**: No code: the harness reports the course as not applicable (no `code/` folder, no fence, no `run.yaml`).
- **Toolchain ids**: none.
- **Toolchain additions** (budget-gated, default NO-GO; [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-cost.md)): none.
- **Illustration budget**: at most 0; the course has no code fence.
- **CI cost**: none; the course has no unit.

## Size class and sequencing

- **Size class M** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 9,480 (the larger of the word gap and the drilling shortfall), new unit folders 0.
- **Estimated effort** (size, not time): class M; agent packets: one packet per defect group plus one authoring packet for the word gap.
- **Wave 5**, slot 3. Makers and fixers for this course: `apps-ayokoding-www-annotated-concept-maker` for authoring gaps and `tutorial-annotated-concept-fixer` for gate findings; no `swe-developer` packet is needed because the course has no code.
- **Dependents in this plan**: `capstone-interview-loop` (each is audited in a later wave, so this course is final first).

## Prerequisite re-check

- Plan 02 keeps the current list (the list above is the result).
- In-plan prerequisites are audited first: `backend-essentials` in wave 1.
- Prerequisites outside this plan (unchanged here): `networking-essentials`, `sql-essentials`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-path-and-capstone-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `system-design-interview` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-annotated-concept-checker` over the course folder; `AUDIT_PROBE=system-design-interview:annotated-concept-no-code` with `UNIT-NODE tests/unit/be-steps/audited-course-completion.steps.ts` to record the scenarios the course fails; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (M): one packet per defect group plus one authoring packet for the word gap. Classes: X6, X11, X12, X13, X17, X18, X20.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `system-design-interview`; a course that fires is fixed, never baselined.
- [ ] CP-3 `tutorial-annotated-concept-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-VALIDATE` for the slug reports the course as not applicable (no code folder with files, no non-prose fence); `EX-COVERAGE` lists it under not applicable.
- [ ] CP-6 The registry row for `system-design-interview` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit system-design-interview course` with explicit paths only: the course folder with its `_index.md`, the registry row. Change `format` to `annotated-concept-no-code` in the course index and the registry row in this same commit.
- [ ] CP-7 Capstone relies-on: `rtk git grep -n "system-design-interview" -- 'apps/ayokoding-www/content/en/learn/courses/capstone-*/learning/overview.md'` shows no capstone row for this course today; if the search finds one at execution time, handle it as in the other courses and note it in the ledger.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/system-design-interview/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · course-as-taught** — no numbered example headings of the mode's form exist today (the pages use tables, `ex-NN` headings, or prose); CP-1 lists the concepts from the pages.

## Lineage

- Builds on: `backend-essentials`, `networking-essentials`, `sql-essentials`. Required by (in this plan): `capstone-interview-loop`.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 115 of 121 in the manifest as specified by plan 02 (read 2026-10-09), phase `interview-preparation`, role `extension`; this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 11 of 116 in the manifest as specified by plan 02 (read 2026-10-09), phase `interview-skills`, role `core`; this plan changes no path membership or order.
