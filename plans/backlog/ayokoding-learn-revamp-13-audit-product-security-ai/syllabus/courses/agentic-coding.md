# Agentic Coding (Annotated Concept (standard))

**Course ID**: `agentic-coding` · **Format**: Annotated Concept (standard) · **Family**: ai-engineering.

**Scope note**: Audits and fixes the existing `agentic-coding` course to the series definition of done and brings every example green in plan 05's code harness. The subject, slug, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course (except a capstone's `relies-on` row, CP-7).

**Short summary**: Working with a coding agent: specifying the work, supplying context, checking the result, using tools and MCP, and keeping a reviewable trail.

## Why this exists · the big idea

- **The problem before the solution**: Content is nearly complete (43,188 words, 54 worked examples), but 47 of 47 code fences are unanchored (12 JSON, 10 diff, and 4 TypeScript among them), 19 output blocks are unanchored, 4 labelled anchors point to missing files, 32 "Why It Matters" blocks are under 50 words, and only 16 example folders exist.
- **Keep-this-if-you-forget-everything**: An agent is only as useful as the specification and the check around it; every example shows a prompt, the work, and the check that decides whether to trust it.

## Prerequisites

- **Prior courses**: `software-engineering-practices`, `software-testing` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: Annotated Concept (standard). **Reason**: Annotated Concept (standard), as plan 03 records it: judgement about delegating to a coding agent, with a code-bearing subset (27 or more of 45).
  A maker may not switch modes except where the reason above says so; a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user.
- **Mode-convention fit**: today the course needs `learning/overview.md`, worked-example pages (by theme), and `learning/capstone/`; CP-1 checks the layout against the mode checker. Example headings per page today: `learning/advanced.md` (14), `learning/beginner.md` (18), `learning/intermediate.md` (22).
- **Wave**: 13 (slot 3); **size class**: M (words to write 1,175, new unit folders 16); **expected defect classes**: 12 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                                                   | Target                                                                                                                                                               | Work                            |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 43,188                                                                                                                                                                                                            | at least 22,000                                                                                                                                                      | none                            |
| Examples as `### Worked Example N: Title`                     | 54                                                                                                                                                                                                                | at least 45, numbered 1 to N without gaps                                                                                                                            | none                            |
| Mermaid diagrams                                              | 1                                                                                                                                                                                                                 | at least 10 (this plan's target)                                                                                                                                     | 9 to add                        |
| "Why It Matters" (50 to 100 words each)                       | 54 of 54 present; 32 under 50 words; 0 over 100; median 48 words                                                                                                                                                  | one per example, 50 to 100 words                                                                                                                                     | 32 to write or fix              |
| Annotation density (comment lines per code line)              | median 1.02; 11 examples below 1.0; 0 above 2.25 (of 25 code-bearing)                                                                                                                                             | 1.0 to 2.25 on every code-bearing example                                                                                                                            | 11 to fix                       |
| Code fences                                                   | 51 code fences in the lessons; 47 unanchored                                                                                                                                                                      | every code fence anchored or marked as an illustration (budget: 24 at most; agent prompts, JSON tool traces, and diffs that no file stands behind)                   | 47 to anchor                    |
| Lesson-to-file anchors (plan 05's method)                     | 0 path anchors (match 0, mismatch 0, missing 0); 4 labelled anchors (match 0, mismatch 0, missing 4)                                                                                                              | every anchor matches its file                                                                                                                                        | 4 to repair                     |
| Output blocks                                                 | 19 output fences; 19 unanchored                                                                                                                                                                                   | every `**Output**` block anchored to an expected file                                                                                                                | 19 to anchor                    |
| Harness units                                                 | 16 example folders, 0 kata folders, 24 code files, 0 `run.yaml`                                                                                                                                                   | 27 example units, 5 kata units, 1 capstone unit, each with a `run.yaml`                                                                                              | create 16, convert 17           |
| Drilling page                                                 | 3,825 words; 2 of 5 standard `##` sections exact; 43 `<details>` blocks; headings found: Recall Q&A, Applied scenarios, Hands-on repetition, Self-check checklist, Elaborative interrogation and self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) | 1,175 words short; fix sections |
| Katas                                                         | 0 kata folders                                                                                                                                                                                                    | at least 5 as `before`/`after` units                                                                                                                                 | 5                               |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                                            | unchanged, except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                           | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X1** 24 code files (16 example folders, 0 kata folders, 4 test-like files); none has a `run.yaml`.
- **X3** 47 of 51 code fences are neither anchored nor marked as illustrations; 0 anchors mismatch their files and 4 point at missing files.
- **X4** 19 of 19 `**Output**` blocks are not labelled anchors to expected files.
- **X8** 54 "Why It Matters" blocks present: 32 under 50 words, 0 over 100, median 48 words.
- **X9** Annotation density: median 1.02; 11 examples below 1.0 and 0 above 2.25 (of 25 code-bearing).
- **X10** The `=>` result notation appears in 21 of 47 code fences.
- **X11** Drilling: 3,825 words (1,175 short of 5,000); 2 of 5 exact `##` sections; 0 kata folders against 5.
- **X15** The code files use a seeded random source in 1 file; prompts and agent replies are recorded text fixtures, never live calls.
- **X17** TypeScript (4 files) and a shell script need the `typescript` and `shell` toolchains; each unit uses one.
- **X18** The lessons name products and a protocol ("MCP" 44 times, "Claude" 9 times); the claims about products are re-checked and dated at fix time (policy AI7), and Python 3.13 mentions (5) are aligned to the catalog's 3.14.
- **X19** 16 example folders exist against 27 example units: 11 to create.
- **X20** 1 Mermaid diagram against this plan's floor of 10.

## Fixes and design

- Anchor the Python and TypeScript fences to unit files; mark the JSON and diff fences that show agent output as illustrations only where no file stands behind them (budget below); repair the 4 missing labelled anchors.
- Create 11 more example units (27 code-bearing worked examples in all, from 16 folders), 5 kata units, and the capstone unit.
- Lengthen the 32 short "Why It Matters" blocks; raise the 11 low-density examples; add the drilling page sections (3,825 words today, so 1,175 more).

## Harness mode and toolchain

- **Harness mode**: Real mode: `python` (most units), `typescript` (4), `shell` (1).
- **Toolchain ids**: python; typescript; shell.
- **Toolchain additions** (budget-gated, default NO-GO; [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-cost.md)): none.
- **Fixtures** (AI course): Deterministic fixtures only (policy AI1 to AI6 in [tech-docs/011](../../tech-docs/011-ai-fixtures-and-sourcing-policy.md)): a scripted `FakeModel`, recorded responses stored in the unit folder, no API key or provider variable read, no network, fixed seeds, and a counter clock. A call to a hosted model appears only as a marked illustration with a dated Reference.
- **Phase 1 spikes**: SP12 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: at most 24 (agent prompts, JSON tool traces, and diffs that no file stands behind).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 2.5 s per container invocation × 2 executions × 40 runs (27 examples + 2 × 5 kata runs + 3 capstone runs) ≈ 3.3 minutes.

## Size class and sequencing

- **Size class M** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 1,175 (the larger of the word gap and the drilling shortfall), new unit folders 16.
- **Estimated effort** (size, not time): class M; agent packets: one packet per defect group plus one authoring packet for the word gap.
- **Wave 13**, slot 3. Makers and fixers for this course: `apps-ayokoding-www-annotated-concept-maker` for authoring gaps, `tutorial-annotated-concept-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 adds `software-testing` (the list above is the result).
- Prerequisites outside this plan (unchanged here): `software-engineering-practices`, `software-testing`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-path-and-capstone-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `agentic-coding` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-annotated-concept-checker` over the course folder; `AUDIT_PROBE=agentic-coding:annotated-concept` with `UNIT-NODE tests/unit/be-steps/audited-course-completion.steps.ts` to record the scenarios the course fails; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (M): one packet per defect group plus one authoring packet for the word gap. Classes: X1, X3, X4, X8, X9, X10, X11, X15, X17, X18, X19, X20.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `agentic-coding`; a course that fires is fixed, never baselined.
- [ ] Units: 27 example units, 5 kata units, 1 capstone unit (create 16, convert 17); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 24 (agent prompts, JSON tool traces, and diffs that no file stands behind).
- [ ] AI fixtures: every unit uses the shared `FakeModel` and recorded responses (AI1 to AI6); `rtk git grep -n -E "api_key|API_KEY|openai|anthropic|requests|urllib|socket" -- <course>/learning/code <course>/drilling/code <course>/learning/capstone/code` shows no unexplained hit; every product, model, protocol, or price claim has a dated Reference within 30 days of the commit (AI7).
- [ ] CP-3 `tutorial-annotated-concept-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `agentic-coding` exits 0 (at most 2 repair cycles); `EX-COVERAGE` shows `covered: true` for `agentic-coding`.
- [ ] CP-6 The registry row for `agentic-coding` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit agentic-coding course` with explicit paths only: the course folder with its `_index.md`, the registry row.
- [ ] CP-7 Capstone relies-on: `rtk git grep -n "agentic-coding" -- 'apps/ayokoding-www/content/en/learn/courses/capstone-*/learning/overview.md'` shows no capstone row for this course today; if the search finds one at execution time, handle it as in the other courses and note it in the ledger.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/agentic-coding/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Claims about products, models, protocols, prices, and limits are not facts of this brief: the maker re-verifies each one against its primary source on the day it writes it and records the value and date in the ledger (accuracy rules A1 to A7 and policy AI7).
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–18 (18): from "What Agentic Coding Is Not" to "Token-Usage-per-Turn Log".
- **co-02 · intermediate** — examples 19–40 (22): from "Adding an MCP Server to a Project's Config" to "A Three-Round Correction Loop, Converging".
- **co-03 · advanced** — examples 41–54 (14): from "Escalate a Security-Critical Change" to "Post-Mortem a Bad Agent Merge".

## Lineage

- Builds on: `software-engineering-practices`, `software-testing`. Required by (in this plan): none.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 103 of 121 in the manifest as specified by plan 02 (read 2026-10-09), phase `more-practice-and-leadership`, role `extension`; this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 98 of 114 in the manifest as specified by plan 02 (read 2026-10-09), phase `more-practice-and-leadership`, role `extension`; this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 99 of 116 in the manifest as specified by plan 02 (read 2026-10-09), phase `more-practice-and-leadership`, role `extension`; this plan changes no path membership or order.
