# Advanced Frontend (By Example)

**Course ID**: `advanced-frontend` · **Format**: By Example · **Family**: application-development.

**Scope note**: Audits and fixes the existing `advanced-frontend` course to the series definition of done and brings every example green in plan 05's code harness. The subject, slug, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course (except a capstone's `relies-on` row, CP-7).

**Short summary**: Making a web UI fast, accessible, and maintainable as it grows: rendering strategy, state ownership, forms, data fetching, bundles, and performance, in typed TypeScript.

## Why this exists · the big idea

- **The problem before the solution**: The examples run as TypeScript modules, but drilling is 4,252 words under five nonstandard headings, 14 of 80 examples are under the annotation floor, and nothing has a `run.yaml`.
- **Keep-this-if-you-forget-everything**: A fast UI is a set of measured decisions about where work happens; each decision here is modelled with fixed inputs so it can be checked twice.

## Prerequisites

- **Prior courses**: `frontend-essentials`, `just-enough-typescript`, `software-testing` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example. **Reason**: By Example, as plan 03 records it: 80 numbered examples in three level pages, each with a TypeScript file and a result.
  A maker may not switch modes except where the reason above says so; a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user.
- **Mode-convention fit**: today the course fits the convention: `overview.md` plus beginner, intermediate, and advanced pages. Example headings per page today: `learning/advanced.md` (24), `learning/beginner.md` (28), `learning/intermediate.md` (28).
- **Wave**: 2 (slot 3); **size class**: S (words to write 748, new unit folders 2); **expected defect classes**: 10 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                         | Target                                                                                                                                                               | Work                          |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 54,025                                                                                                                                                                                  | at least 28,000                                                                                                                                                      | none                          |
| Examples as `### Example N: Title`                            | 80                                                                                                                                                                                      | at least 75, numbered 1 to N without gaps                                                                                                                            | none                          |
| Mermaid diagrams                                              | 2                                                                                                                                                                                       | 30 to 50 (adapter band)                                                                                                                                              | 28 to add                     |
| "Why It Matters" (50 to 100 words each)                       | 80 of 80 present; 0 under 50 words; 2 over 100; median 74 words                                                                                                                         | one per example, 50 to 100 words                                                                                                                                     | 2 to write or fix             |
| Annotation density (comment lines per code line)              | median 1.3; 14 examples below 1.0; 2 above 2.25 (of 80 code-bearing)                                                                                                                    | 1.0 to 2.25 on every code-bearing example                                                                                                                            | 16 to fix                     |
| Code fences                                                   | 94 code fences in the lessons; 6 unanchored                                                                                                                                             | every code fence anchored or marked as an illustration (budget: 8 at most; launch lines for a bundler or dev server and the browser DevTools steps)                  | 6 to anchor                   |
| Lesson-to-file anchors (plan 05's method)                     | 87 path anchors (match 85, mismatch 2, missing 0); 1 labelled anchors (match 0, mismatch 1, missing 0)                                                                                  | every anchor matches its file                                                                                                                                        | 3 to repair                   |
| Output blocks                                                 | 89 output fences; 89 unanchored                                                                                                                                                         | every `**Output**` block anchored to an expected file                                                                                                                | 89 to anchor                  |
| Harness units                                                 | 80 example folders, 6 kata folders, 100 code files, 0 `run.yaml`                                                                                                                        | 80 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                              | create 2, convert 87          |
| Drilling page                                                 | 4,252 words; 0 of 5 standard `##` sections exact; 53 `<details>` blocks; headings found: Drills Overview, Drill List, Difficulty Progression, Evaluation Criteria, Capstone Integration | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) | 748 words short; fix sections |
| Katas                                                         | 6 kata folders                                                                                                                                                                          | at least 8 as `before`/`after` units                                                                                                                                 | 2                             |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                  | unchanged, except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                           | recompute                     |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X1** 100 code files (80 example folders, 6 kata folders, 1 test-like files); none has a `run.yaml`.
- **X3** 6 of 94 code fences are neither anchored nor marked as illustrations; 3 anchors mismatch their files and 0 point at missing files.
- **X4** 89 of 89 `**Output**` blocks are not labelled anchors to expected files.
- **X8** 80 "Why It Matters" blocks present: 0 under 50 words, 2 over 100, median 74 words.
- **X9** Annotation density: median 1.3; 14 examples below 1.0 and 2 above 2.25 (of 80 code-bearing).
- **X11** Drilling: 4,252 words (748 short of 5,000); 0 of 5 exact `##` sections; 6 kata folders against 8.
- **X15** 36 of 100 code files touch DOM or browser APIs (keyword scan), 4 read a clock, 4 use timers or promises, and 3 draw random numbers; each needs a fixed input or a virtual clock.
- **X16** `vitest` and `@testing-library/dom` are third-party packages; there is no `package-lock.json` in the course.
- **X17** Waterfall, bundle-size, and layout-cost examples describe browser measurements that a container cannot make.
- **X20** 2 Mermaid diagrams against the band of 30 to 50.

## Fixes and design

- Lock the test stack (jsdom, vitest, testing-library) in a course `package-lock.json` and run it under the `typescript` toolchain (spike SP1); DOM-semantic examples run for real in jsdom.
- Turn measurement examples (serial fetch waterfall, bundle analysis, long tasks) into deterministic models: a virtual clock and fixed byte sizes, with the lesson saying it is a model, not a browser measurement.
- Convert the 80 example folders and 6 kata folders to units; add the 2 missing kata units; rewrite drilling under the five exact headings.
- Raise the 14 low-density examples to 1.0 comment lines per code line, trim the 2 long "Why It Matters" blocks, repair the 3 mismatching anchors and 6 unanchored fences, and add diagrams until the band is met.

## Harness mode and toolchain

- **Harness mode**: Real mode: `typescript` with a locked jsdom test stack for DOM examples; models for browser measurements.
- **Toolchain ids**: typescript (jsdom, vitest, testing-library from a hash-locked `package-lock.json`).
- **Toolchain additions** (budget-gated, default NO-GO; [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-cost.md)): none; the lockfile is a course file, not a catalog change.
- **Phase 1 spikes**: SP1 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: at most 8 (launch lines for a bundler or dev server and the browser DevTools steps).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 4.0 s per container invocation × 2 executions × 99 runs (80 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 13.2 minutes.

## Size class and sequencing

- **Size class S** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 748 (the larger of the word gap and the drilling shortfall), new unit folders 2.
- **Estimated effort** (size, not time): class S; agent packets: one packet per defect group (mechanical fixes, then prose fixes); no page split.
- **Wave 2**, slot 3. Makers and fixers for this course: `apps-ayokoding-www-by-example-maker` for authoring gaps, `tutorial-by-example-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `android-app-development`, `build-your-own-reactive-ui`, `information-architecture-and-seo` (each is audited in a later wave, so this course is final first).

## Prerequisite re-check

- Plan 02 keeps the current list (the list above is the result).
- In-plan prerequisites are audited first: `frontend-essentials` in wave 1.
- Prerequisites outside this plan (unchanged here): `just-enough-typescript`, `software-testing`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-path-and-capstone-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `advanced-frontend` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder; `AUDIT_PROBE=advanced-frontend:by-example` with `UNIT-NODE tests/unit/be-steps/audited-course-completion.steps.ts` to record the scenarios the course fails; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (S): one packet per defect group (mechanical fixes, then prose fixes); no page split. Classes: X1, X3, X4, X8, X9, X11, X15, X16, X17, X20.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `advanced-frontend`; a course that fires is fixed, never baselined.
- [ ] Units: 80 example units, 8 kata units, 1 capstone unit (create 2, convert 87); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 8 (launch lines for a bundler or dev server and the browser DevTools steps).
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `advanced-frontend` exits 0 (at most 2 repair cycles); `EX-COVERAGE` shows `covered: true` for `advanced-frontend`.
- [ ] CP-6 The registry row for `advanced-frontend` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit advanced-frontend course` with explicit paths only: the course folder with its `_index.md`, the registry row.
- [ ] CP-7 Capstone relies-on: `rtk git grep -n "advanced-frontend" -- 'apps/ayokoding-www/content/en/learn/courses/capstone-*/learning/overview.md'` shows no capstone row for this course today; if the search finds one at execution time, handle it as in the other courses and note it in the ledger.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/advanced-frontend/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–28 (28): from "Client Side Rendering Boots an Empty Shell" to "A Controlled Input Owns Its Value in State".
- **co-02 · intermediate** — examples 29–56 (28): from "An Uncontrolled Input Reads Its Value via a Ref" to "Bundle Analysis Flags an Oversized Dependency".
- **co-03 · advanced** — examples 57–80 (24): from "A Serial Fetch Waterfall" to "A Searchable Dashboard Assembled End to End".

## Lineage

- Builds on: `frontend-essentials`, `just-enough-typescript`, `software-testing`. Required by (in this plan): `android-app-development`, `build-your-own-reactive-ui`, `information-architecture-and-seo`.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 47 of 121 in the manifest as specified by plan 02 (read 2026-10-09), phase `apps-and-interfaces`, role `extension`; this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 34 of 114 in the manifest as specified by plan 02 (read 2026-10-09), phase `apps-and-interfaces`, role `extension`; this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 37 of 116 in the manifest as specified by plan 02 (read 2026-10-09), phase `apps-and-interfaces`, role `extension`; this plan changes no path membership or order.
