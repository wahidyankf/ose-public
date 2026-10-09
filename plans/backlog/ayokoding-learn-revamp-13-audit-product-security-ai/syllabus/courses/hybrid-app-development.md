# Hybrid App Development (By Example)

**Course ID**: `hybrid-app-development` · **Format**: By Example · **Family**: application-development.

**Scope note**: Audits and fixes the existing `hybrid-app-development` course to the series definition of done and brings every example green in plan 05's code harness. The subject, slug, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course (except a capstone's `relies-on` row, CP-7).

**Short summary**: One Flutter app for mobile and desktop from a single Dart codebase: widgets, layout constraints, state with providers, navigation, platform channels, testing, and packaging.

## Why this exists · the big idea

- **The problem before the solution**: 78 Dart examples live only as fences in the lessons (78 unanchored, 4 code files exist), and 78 "Why It Matters" blocks are under 50 words.
- **Keep-this-if-you-forget-everything**: A Flutter app is a tree of widgets rebuilt from state; widget tests can build and inspect that tree with no device.

## Prerequisites

- **Prior courses**: `just-enough-dart`, `frontend-essentials` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example. **Reason**: By Example, as plan 03 records it: 78 numbered examples in three level pages, each shown as an inline Dart fence.
  A maker may not switch modes except where the reason above says so; a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user.
- **Mode-convention fit**: today the course fits the convention: `overview.md` plus beginner, intermediate, and advanced pages. Example headings per page today: `learning/advanced.md` (24), `learning/beginner.md` (26), `learning/intermediate.md` (28).
- **Wave**: 11 (slot 2); **size class**: L (words to write 14,351, new unit folders 86); **expected defect classes**: 9 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                               | Target                                                                                                                                                               | Work                            |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 13,649                                                                                                                                                                        | at least 28,000                                                                                                                                                      | 14,351 to write                 |
| Examples as `### Example N: Title`                            | 78                                                                                                                                                                            | at least 75, numbered 1 to N without gaps                                                                                                                            | none                            |
| Mermaid diagrams                                              | 32                                                                                                                                                                            | 30 to 50 (adapter band)                                                                                                                                              | none                            |
| "Why It Matters" (50 to 100 words each)                       | 78 of 78 present; 78 under 50 words; 0 over 100; median 17 words                                                                                                              | one per example, 50 to 100 words                                                                                                                                     | 78 to write or fix              |
| Annotation density (comment lines per code line)              | median 1.0; 29 examples below 1.0; 0 above 2.25 (of 77 code-bearing)                                                                                                          | 1.0 to 2.25 on every code-bearing example                                                                                                                            | 29 to fix                       |
| Code fences                                                   | 78 code fences in the lessons; 78 unanchored                                                                                                                                  | every code fence anchored or marked as an illustration (budget: 12 at most; `flutter create`, emulator, device, and store-packaging lines)                           | 78 to anchor                    |
| Lesson-to-file anchors (plan 05's method)                     | 0 path anchors (match 0, mismatch 0, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                                          | every anchor matches its file                                                                                                                                        | 0 to repair                     |
| Output blocks                                                 | 0 output fences; 0 unanchored                                                                                                                                                 | every `**Output**` block anchored to an expected file                                                                                                                | 0 to anchor                     |
| Harness units                                                 | 0 example folders, 0 kata folders, 4 code files, 0 `run.yaml`                                                                                                                 | 78 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                              | create 86, convert 1            |
| Drilling page                                                 | 785 words; 1 of 5 standard `##` sections exact; 13 `<details>` blocks; headings found: Recall Q&A, Applied Problems, Deliberate Practice, Automaticity Checklist, Explain Why | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) | 4,215 words short; fix sections |
| Katas                                                         | 0 kata folders                                                                                                                                                                | at least 8 as `before`/`after` units                                                                                                                                 | 8                               |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                        | unchanged, except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                           | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X1** 4 code files (0 example folders, 0 kata folders, 3 test-like files); none has a `run.yaml`.
- **X3** 78 of 78 code fences are neither anchored nor marked as illustrations.
- **X5** 13,649 words across 78 examples is about 175 words per example; a complete example in this mode needs about 373.
- **X8** 78 "Why It Matters" blocks present: 78 under 50 words, 0 over 100, median 17 words.
- **X9** Annotation density: median 1.0; 29 examples below 1.0 and 0 above 2.25 (of 77 code-bearing).
- **X11** Drilling: 785 words (4,215 short of 5,000); 1 of 5 exact `##` sections; 0 kata folders against 8.
- **X13** 13,649 words against a floor of 28,000; 14,351 to write.
- **X17** Emulators, device builds, and platform channels cannot run in the sandbox; widget and unit tests (`flutter test`) can.
- **X19** No example folder exists: 78 examples have only inline fences, and the capstone has 4 files (2 Dart, a pubspec, a lockfile).

## Fixes and design

- Create 78 example units from the inline fences: pure Dart logic under `dart`, widget and state examples as `flutter test` runs under `flutter` (spike SP5 measures start-up and determinism).
- Fake platform channels with the test channel binding; build, install, and emulator lines are launch illustrations.
- Lock Flutter packages with the course `pubspec.lock` (it exists for the capstone; extend it).
- Anchor all 78 fences, lengthen 78 "Why It Matters" blocks, add 8 kata units and the 5 exact drilling sections (785 words today), and write the missing 14,351 words of lesson text.

## Harness mode and toolchain

- **Harness mode**: Real mode: `dart` for logic units and `flutter` for widget tests; no static mode is needed.
- **Toolchain ids**: dart; flutter (pubspec.lock).
- **Toolchain additions** (budget-gated, default NO-GO; [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-cost.md)): none.
- **Phase 1 spikes**: SP5 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: at most 12 (`flutter create`, emulator, device, and store-packaging lines).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 8.0 s per container invocation × 2 executions × 97 runs (78 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 25.9 minutes.

## Size class and sequencing

- **Size class L** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 14,351 (the larger of the word gap and the drilling shortfall), new unit folders 86.
- **Estimated effort** (size, not time): class L; agent packets: authoring split by learning page (one packet per page), then one packet per remaining defect group.
- **Wave 11**, slot 2. Makers and fixers for this course: `apps-ayokoding-www-by-example-maker` for authoring gaps, `tutorial-by-example-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 keeps the current list (the list above is the result).
- In-plan prerequisites are audited first: `frontend-essentials` in wave 1.
- Prerequisites outside this plan (unchanged here): `just-enough-dart`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-path-and-capstone-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `hybrid-app-development` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder; `AUDIT_PROBE=hybrid-app-development:by-example` with `UNIT-NODE tests/unit/be-steps/audited-course-completion.steps.ts` to record the scenarios the course fails; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (L): authoring split by learning page (one packet per page), then one packet per remaining defect group. Classes: X1, X3, X5, X8, X9, X11, X13, X17, X19.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `hybrid-app-development`; a course that fires is fixed, never baselined.
- [ ] Units: 78 example units, 8 kata units, 1 capstone unit (create 86, convert 1); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 12 (`flutter create`, emulator, device, and store-packaging lines).
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `hybrid-app-development` exits 0 (at most 2 repair cycles); `EX-COVERAGE` shows `covered: true` for `hybrid-app-development`.
- [ ] CP-6 The registry row for `hybrid-app-development` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit hybrid-app-development course` with explicit paths only: the course folder with its `_index.md`, the registry row.
- [ ] CP-7 Capstone relies-on: `rtk git grep -n "hybrid-app-development" -- 'apps/ayokoding-www/content/en/learn/courses/capstone-*/learning/overview.md'` shows no capstone row for this course today; if the search finds one at execution time, handle it as in the other courses and note it in the ledger.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/hybrid-app-development/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–26 (26): from "Flutter Create" to "Build a Lazy ListView".
- **co-02 · intermediate** — examples 27–54 (28): from "Observe the Constraints Model" to "Update a Provider List".
- **co-03 · advanced** — examples 55–78 (24): from "Invoke a Method Channel" to "Preview the Multiplatform Capstone".

## Lineage

- Builds on: `just-enough-dart`, `frontend-essentials`. Required by (in this plan): none.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 53 of 121 in the manifest as specified by plan 02 (read 2026-10-09), phase `apps-and-interfaces`, role `extension`; this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 40 of 114 in the manifest as specified by plan 02 (read 2026-10-09), phase `apps-and-interfaces`, role `extension`; this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 43 of 116 in the manifest as specified by plan 02 (read 2026-10-09), phase `apps-and-interfaces`, role `extension`; this plan changes no path membership or order.
