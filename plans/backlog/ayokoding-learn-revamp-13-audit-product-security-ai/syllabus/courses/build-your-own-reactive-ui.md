# Build Your Own Reactive UI (By Example)

**Course ID**: `build-your-own-reactive-ui` · **Format**: By Example · **Family**: application-development.

**Scope note**: Audits and fixes the existing `build-your-own-reactive-ui` course to the series definition of done and brings every example green in plan 05's code harness. The subject, slug, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course (except a capstone's `relies-on` row, CP-7).

**Short summary**: A small reactive UI library built two ways, a virtual DOM and signals, with keyed diffing, batching, and effects, in strict TypeScript.

## Why this exists · the big idea

- **The problem before the solution**: Two comment lines are copied into all 80 files, all 80 lesson fences show a 9-line excerpt of a 33-line file (so all 80 anchors mismatch), and the files run with `npx tsx`, which the harness does not have.
- **Keep-this-if-you-forget-everything**: A reactive library is a graph of values and a rule for when to recompute; every example prints the graph and the recomputations.

## Prerequisites

- **Prior courses**: `advanced-frontend` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example. **Reason**: By Example, as plan 03 records it: 80 numbered examples, each an independently runnable TypeScript file.
  A maker may not switch modes except where the reason above says so; a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user.
- **Mode-convention fit**: today the course fits the convention: `overview.md` plus beginner, intermediate, and advanced pages. Example headings per page today: `learning/advanced.md` (26), `learning/beginner.md` (26), `learning/intermediate.md` (28).
- **Wave**: 12 (slot 2); **size class**: M (words to write 8,753, new unit folders 8); **expected defect classes**: 8 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                           | Target                                                                                                                                                               | Work                            |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 19,247                                                                                                                                                                                    | at least 28,000                                                                                                                                                      | 8,753 to write                  |
| Examples as `### Example N: Title`                            | 80                                                                                                                                                                                        | at least 75, numbered 1 to N without gaps                                                                                                                            | none                            |
| Mermaid diagrams                                              | 1                                                                                                                                                                                         | 30 to 50 (adapter band)                                                                                                                                              | 29 to add                       |
| "Why It Matters" (50 to 100 words each)                       | 80 of 80 present; 0 under 50 words; 0 over 100; median 58 words                                                                                                                           | one per example, 50 to 100 words                                                                                                                                     | 0 to write or fix               |
| Annotation density (comment lines per code line)              | median 1.25; 0 examples below 1.0; 0 above 2.25 (of 80 code-bearing)                                                                                                                      | 1.0 to 2.25 on every code-bearing example                                                                                                                            | 0 to fix                        |
| Code fences                                                   | 80 code fences in the lessons; 0 unanchored                                                                                                                                               | every code fence anchored or marked as an illustration (budget: 6 at most; browser mount lines)                                                                      | 0 to anchor                     |
| Lesson-to-file anchors (plan 05's method)                     | 80 path anchors (match 0, mismatch 80, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                                                    | every anchor matches its file                                                                                                                                        | 80 to repair                    |
| Output blocks                                                 | 80 output fences; 80 unanchored                                                                                                                                                           | every `**Output**` block anchored to an expected file                                                                                                                | 80 to anchor                    |
| Harness units                                                 | 80 example folders, 0 kata folders, 84 code files, 0 `run.yaml`                                                                                                                           | 80 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                              | create 8, convert 81            |
| Drilling page                                                 | 415 words; 1 of 5 standard `##` sections exact; 6 `<details>` blocks; headings found: Recall Q&A, Scenario judgment, Hands-on implementation, Automaticity checklist, Extension challenge | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) | 4,585 words short; fix sections |
| Katas                                                         | 0 kata folders                                                                                                                                                                            | at least 8 as `before`/`after` units                                                                                                                                 | 8                               |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                    | unchanged, except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                           | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X1** 84 code files (80 example folders, 0 kata folders, 0 test-like files); none has a `run.yaml`.
- **X3** 80 anchors mismatch their files and 0 point at missing files.
- **X4** 80 of 80 `**Output**` blocks are not labelled anchors to expected files.
- **X11** Drilling: 415 words (4,585 short of 5,000); 1 of 5 exact `##` sections; 0 kata folders against 8.
- **X13** 19,247 words against a floor of 28,000; 8,753 to write.
- **X14** The plan 09 filler guard lists this course (owner `plan-13`): unique-code ratio 0.06 (limit 0.50), near-duplicate share 0.65 (limit 0.50), repeated-paragraph share 0.48 (limit 0.25). The comments "Run with npx tsx example.ts; every assertion is part of the example" and "A failed runtime contract must stop the lesson, not merely log a warning" each appear 80 times.
- **X17** `npx tsx` downloads a runner; the harness has no network. Spike SP1 settles the run command (compile with `tsc` to `/tmp` and run with `node`).
- **X20** 1 Mermaid diagrams against the band of 30 to 50.
- **Filler baseline**: the course must stop firing every rule, and its entry leaves `FILLER_BASELINE` (and the cap falls by one) in the same commit as the course ([tech-docs/007](../../tech-docs/007-testing-strategy.md#the-filler-baseline-ratchet)).

## Fixes and design

- Delete the two copied comment lines and the copied assertion helper from the 80 files; give each file its own annotations (rule FG2 needs distinct code after comments are stripped).
- Replace the lesson excerpts with full-file anchors or range anchors (`#Lx-Ly`) so `examples sync` reports no mismatch.
- Run each file with the locked `typescript` toolchain; the DOM-free reactive core needs no jsdom.
- Rewrite the drilling page (415 words today, nonstandard headings) to 5,000 words under the five exact headings with 8 kata units, add diagrams (1 today) to the band, lengthen the missing 8,753 words of lesson text, and remove the `build-your-own-reactive-ui` entry from `FILLER_BASELINE` in the same commit.

## Harness mode and toolchain

- **Harness mode**: Real mode: `typescript`; a `run.sh` compiles to `/tmp` and runs `node`.
- **Toolchain ids**: typescript.
- **Toolchain additions** (budget-gated, default NO-GO; [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-cost.md)): none.
- **Phase 1 spikes**: SP1 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: at most 6 (browser mount lines).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 3.0 s per container invocation × 2 executions × 99 runs (80 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 9.9 minutes.

## Size class and sequencing

- **Size class M** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 8,753 (the larger of the word gap and the drilling shortfall), new unit folders 8.
- **Estimated effort** (size, not time): class M; agent packets: one packet per defect group plus one authoring packet for the word gap.
- **Wave 12**, slot 2. Makers and fixers for this course: `apps-ayokoding-www-by-example-maker` for authoring gaps, `tutorial-by-example-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 keeps the current list (the list above is the result).
- In-plan prerequisites are audited first: `advanced-frontend` in wave 2.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-path-and-capstone-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `build-your-own-reactive-ui` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder; `AUDIT_PROBE=build-your-own-reactive-ui:by-example` with `UNIT-NODE tests/unit/be-steps/audited-course-completion.steps.ts` to record the scenarios the course fails; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (M): one packet per defect group plus one authoring packet for the word gap. Classes: X1, X3, X4, X11, X13, X14, X17, X20.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `build-your-own-reactive-ui`; a course that fires is fixed, never baselined.
- [ ] Units: 80 example units, 8 kata units, 1 capstone unit (create 8, convert 81); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 6 (browser mount lines).
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `build-your-own-reactive-ui` exits 0 (at most 2 repair cycles); `EX-COVERAGE` shows `covered: true` for `build-your-own-reactive-ui`.
- [ ] CP-6 The registry row for `build-your-own-reactive-ui` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit build-your-own-reactive-ui course` with explicit paths only: the course folder with its `_index.md`, the registry row. Delete the `build-your-own-reactive-ui` entry from `FILLER_BASELINE` and lower `FILLER_BASELINE_CAP` by one in the same commit; `course-filler.steps.ts` stays green without the entry.
- [ ] CP-7 Capstone relies-on: `rtk git grep -n "build-your-own-reactive-ui" -- 'apps/ayokoding-www/content/en/learn/courses/capstone-*/learning/overview.md'` shows no capstone row for this course today; if the search finds one at execution time, handle it as in the other courses and note it in the ledger.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/build-your-own-reactive-ui/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–26 (26): from "H Function" to "Signal Set".
- **co-02 · intermediate** — examples 27–54 (28): from "Keyed List Diff" to "Signal Vs VDOM Update".
- **co-03 · advanced** — examples 55–80 (26): from "Batching Multiple Sets" to "Reactive UI Capstone".

## Lineage

- Builds on: `advanced-frontend`. Required by (in this plan): none.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 48 of 121 in the manifest as specified by plan 02 (read 2026-10-09), phase `apps-and-interfaces`, role `extension`; this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 35 of 114 in the manifest as specified by plan 02 (read 2026-10-09), phase `apps-and-interfaces`, role `extension`; this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 38 of 116 in the manifest as specified by plan 02 (read 2026-10-09), phase `apps-and-interfaces`, role `extension`; this plan changes no path membership or order.
