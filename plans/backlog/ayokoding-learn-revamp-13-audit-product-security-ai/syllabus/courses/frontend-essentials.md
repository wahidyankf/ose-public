# Frontend Essentials (By Example)

**Course ID**: `frontend-essentials` · **Format**: By Example · **Family**: application-development.

**Scope note**: Audits and fixes the existing `frontend-essentials` course to the series definition of done and brings every example green in plan 05's code harness. The subject, slug, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course (except a capstone's `relies-on` row, CP-7).

**Short summary**: Interactive web pages where the UI is a function of state: HTML, CSS layout, the DOM and events, state-driven rendering, forms, accessibility, and typed components.

## Why this exists · the big idea

- **The problem before the solution**: Every one of the 77 page examples is checked by a Playwright script that drives a real browser; the harness has no browser, no example has a `run.yaml`, and drilling has no kata units.
- **Keep-this-if-you-forget-everything**: A page is the output of a function of state; each example proves one rule of that function by reading the page back.

## Prerequisites

- **Prior courses**: `just-enough-typescript` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example. **Reason**: By Example, as plan 03 records it: 80 numbered examples in three level pages, each an HTML page plus a verification script.
  A maker may not switch modes except where the reason above says so; a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user.
- **Mode-convention fit**: today the course fits the convention: `overview.md` plus beginner, intermediate, and advanced pages. Example headings per page today: `learning/advanced.md` (20), `learning/beginner.md` (28), `learning/intermediate.md` (32).
- **Wave**: 1 (slot 2); **size class**: S (words to write 129, new unit folders 8); **expected defect classes**: 8 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                         | Target                                                                                                                                                               | Work                          |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 54,122                                                                                                                                                  | at least 28,000                                                                                                                                                      | none                          |
| Examples as `### Example N: Title`                            | 80                                                                                                                                                      | at least 75, numbered 1 to N without gaps                                                                                                                            | none                          |
| Mermaid diagrams                                              | 36                                                                                                                                                      | 30 to 50 (adapter band)                                                                                                                                              | none                          |
| "Why It Matters" (50 to 100 words each)                       | 80 of 80 present; 0 under 50 words; 1 over 100; median 96 words                                                                                         | one per example, 50 to 100 words                                                                                                                                     | 1 to write or fix             |
| Annotation density (comment lines per code line)              | median 0.6; 62 examples below 1.0; 0 above 2.25 (of 80 code-bearing)                                                                                    | 1.0 to 2.25 on every code-bearing example                                                                                                                            | 62 to fix                     |
| Code fences                                                   | 89 code fences in the lessons; 5 unanchored                                                                                                             | every code fence anchored or marked as an illustration (budget: 8 at most; Playwright launch lines and browser DevTools steps)                                       | 5 to anchor                   |
| Lesson-to-file anchors (plan 05's method)                     | 84 path anchors (match 84, mismatch 0, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                  | every anchor matches its file                                                                                                                                        | 0 to repair                   |
| Output blocks                                                 | 82 output fences; 82 unanchored                                                                                                                         | every `**Output**` block anchored to an expected file                                                                                                                | 82 to anchor                  |
| Harness units                                                 | 80 example folders, 0 kata folders, 162 code files, 0 `run.yaml`                                                                                        | 80 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                              | create 8, convert 81          |
| Drilling page                                                 | 4,871 words; 4 of 5 standard `##` sections exact; 39 `<details>` blocks; headings found: Recall Q&A, Applied problems, Code katas, Self-check checklist | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) | 129 words short; fix sections |
| Katas                                                         | 0 kata folders                                                                                                                                          | at least 8 as `before`/`after` units                                                                                                                                 | 8                             |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                  | unchanged, except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                           | recompute                     |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X1** 162 code files (80 example folders, 0 kata folders, 1 test-like files); none has a `run.yaml`.
- **X3** 5 of 89 code fences are neither anchored nor marked as illustrations.
- **X4** 82 of 82 `**Output**` blocks are not labelled anchors to expected files.
- **X8** 80 "Why It Matters" blocks present: 0 under 50 words, 1 over 100, median 96 words.
- **X9** Annotation density: median 0.6; 62 examples below 1.0 and 0 above 2.25 (of 80 code-bearing).
- **X11** Drilling is 4,871 words with 4 of the 5 exact headings (no "Elaborative interrogation & self-explanation") and has no kata units.
- **X16** `playwright`, `vitest`, and `@testing-library/dom` have no lockfile in the course.
- **X17** 77 `verify.mjs` scripts import `playwright` and read `boundingBox` and computed layout from a real Chromium; the catalog has no browser (decision D5, spike SP2). About 14 examples (box model, flex, grid, responsive breakpoints, contrast) need layout.

## Fixes and design

- Default (budget rule, decision D5): rewrite the 77 verification scripts to run in jsdom under the locked `typescript` toolchain; DOM, event, state, form, ARIA, and keyboard examples run for real.
- Layout examples (about 14) become small Node models of the CSS algorithm they teach (box sizes, flex distribution, grid tracks, breakpoints), labelled as models; the Playwright script stays as a launch illustration. If spike SP2 and the budget rule give GO, a Chromium toolchain replaces the models.
- Re-record the 80 outputs and anchor them; lift the 62 low-density examples to the floor; anchor or mark 5 fences; add the missing drilling section and 8 kata units.

## Harness mode and toolchain

- **Harness mode**: Real mode: `typescript` with a locked jsdom stack (default); layout examples are models. Candidate: a Chromium toolchain only if decision D9's rule gives GO.
- **Toolchain ids**: typescript (jsdom from a hash-locked `package-lock.json`).
- **Toolchain additions** (budget-gated, default NO-GO; [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-cost.md)): none by default; candidate C1 `chromium` (77 units would use it) is NO-GO unless Phase 1 measures a fit.
- **Phase 1 spikes**: SP1, SP2 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: at most 8 (Playwright launch lines and browser DevTools steps).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 4.0 s per container invocation × 2 executions × 99 runs (80 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 13.2 minutes.

## Size class and sequencing

- **Size class S** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 129 (the larger of the word gap and the drilling shortfall), new unit folders 8.
- **Estimated effort** (size, not time): class S; agent packets: one packet per defect group (mechanical fixes, then prose fixes); no page split.
- **Wave 1**, slot 2. Makers and fixers for this course: `apps-ayokoding-www-by-example-maker` for authoring gaps, `tutorial-by-example-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `advanced-frontend`, `android-app-development`, `capstone-full-stack-app`, `hybrid-app-development`, `information-architecture-and-seo`, `ios-app-development`, `product-patterns-for-probabilistic-systems`, `software-product-engineering` (each is audited in a later wave, so this course is final first).

## Prerequisite re-check

- Plan 02 keeps the current list (the list above is the result).
- Prerequisites outside this plan (unchanged here): `just-enough-typescript`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-path-and-capstone-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `frontend-essentials` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder; `AUDIT_PROBE=frontend-essentials:by-example` with `UNIT-NODE tests/unit/be-steps/audited-course-completion.steps.ts` to record the scenarios the course fails; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (S): one packet per defect group (mechanical fixes, then prose fixes); no page split. Classes: X1, X3, X4, X8, X9, X11, X16, X17.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `frontend-essentials`; a course that fires is fixed, never baselined.
- [ ] Units: 80 example units, 8 kata units, 1 capstone unit (create 8, convert 81); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 8 (Playwright launch lines and browser DevTools steps).
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `frontend-essentials` exits 0 (at most 2 repair cycles); `EX-COVERAGE` shows `covered: true` for `frontend-essentials`.
- [ ] CP-6 The registry row for `frontend-essentials` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit frontend-essentials course` with explicit paths only: the course folder with its `_index.md`, the registry row.
- [ ] CP-7 Capstone relies-on: `rtk git grep -n "frontend-essentials" -- 'apps/ayokoding-www/content/en/learn/courses/capstone-*/learning/overview.md'` shows no capstone row for this course today; if the search finds one at execution time, handle it as in the other courses and note it in the ledger.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/frontend-essentials/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–28 (28): from "Minimal HTML Document" to "Flex Align Center".
- **co-02 · intermediate** — examples 29–60 (32): from "flex-grow Absorbs Space" to "aria-live Region".
- **co-03 · advanced** — examples 61–80 (20): from "Keyboard Tab Order" to "Accessible Interactive Widget".

## Lineage

- Builds on: `just-enough-typescript`. Required by (in this plan): `advanced-frontend`, `android-app-development`, `capstone-full-stack-app`, `hybrid-app-development`, `information-architecture-and-seo`, `ios-app-development`, `product-patterns-for-probabilistic-systems`, `software-product-engineering`.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 9 of 121 in the manifest as specified by plan 02 (read 2026-10-09), phase `first-working-software`, role `core`; this plan changes no path membership or order.
- `careers/immediately-effective/ai-engineer` — position 15 of 28 in the manifest as specified by plan 08 (read 2026-10-09), phase `shipping-and-operating`, role `extension`; this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 10 of 114 in the manifest as specified by plan 02 (read 2026-10-09), phase `frontend-and-quality`, role `core`; this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 36 of 116 in the manifest as specified by plan 02 (read 2026-10-09), phase `apps-and-interfaces`, role `extension`; this plan changes no path membership or order.
- `careers/immediately-effective/ai-engineer` — a prerequisite change here also changes that manifest, its `assumes`, and its tests in the same PR (plan 02's rule R6, plan 08's duty).
