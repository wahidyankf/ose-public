# Android App Development (By Example)

**Course ID**: `android-app-development` · **Format**: By Example · **Family**: application-development.

**Scope note**: Audits and fixes the existing `android-app-development` course to the series definition of done and brings every example green in plan 05's code harness. The subject, slug, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course (except a capstone's `relies-on` row, CP-7).

**Short summary**: Native Android apps in Kotlin with Jetpack Compose: project structure, state in a ViewModel, navigation, persistence, networking, permissions, and testing.

## Why this exists · the big idea

- **The problem before the solution**: Every one of the 78 Kotlin files has no comment lines (density 0.0), every "Why It Matters" block is under 50 words, the example bodies are near-duplicates of one template (filler guard FG3 and FG6), and nothing can be compiled outside Android Studio.
- **Keep-this-if-you-forget-everything**: Android code is two kinds of file: logic that runs anywhere Kotlin runs, and framework code that only an Android build can check; this course says which is which and proves each as far as it can.

## Prerequisites

- **Prior courses**: `just-enough-kotlin`, `frontend-essentials`, `advanced-frontend` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example. **Reason**: By Example, as plan 03 records it: 78 numbered examples with one Kotlin file each, anchored to their files.
  A maker may not switch modes except where the reason above says so; a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user.
- **Mode-convention fit**: today the course fits the convention: `overview.md` plus beginner, intermediate, and advanced pages. Example headings per page today: `learning/advanced.md` (24), `learning/beginner.md` (26), `learning/intermediate.md` (28).
- **Wave**: 6 (slot 2); **size class**: M (words to write 9,089, new unit folders 2); **expected defect classes**: 10 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                                         | Target                                                                                                                                                               | Work                            |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 18,911                                                                                                                                                                                                  | at least 28,000                                                                                                                                                      | 9,089 to write                  |
| Examples as `### Example N: Title`                            | 78                                                                                                                                                                                                      | at least 75, numbered 1 to N without gaps                                                                                                                            | none                            |
| Mermaid diagrams                                              | 2                                                                                                                                                                                                       | 30 to 50 (adapter band)                                                                                                                                              | 28 to add                       |
| "Why It Matters" (50 to 100 words each)                       | 78 of 78 present; 78 under 50 words; 0 over 100; median 47 words                                                                                                                                        | one per example, 50 to 100 words                                                                                                                                     | 78 to write or fix              |
| Annotation density (comment lines per code line)              | median 0.0; 78 examples below 1.0; 0 above 2.25 (of 78 code-bearing)                                                                                                                                    | 1.0 to 2.25 on every code-bearing example                                                                                                                            | 78 to fix                       |
| Code fences                                                   | 78 code fences in the lessons; 0 unanchored                                                                                                                                                             | every code fence anchored or marked as an illustration (budget: 12 at most; Android Studio, emulator, Gradle, and device install lines)                              | 0 to anchor                     |
| Lesson-to-file anchors (plan 05's method)                     | 78 path anchors (match 78, mismatch 0, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                                                                  | every anchor matches its file                                                                                                                                        | 0 to repair                     |
| Output blocks                                                 | 0 output fences; 0 unanchored                                                                                                                                                                           | every `**Output**` block anchored to an expected file                                                                                                                | 0 to anchor                     |
| Harness units                                                 | 78 example folders, 6 kata folders, 96 code files, 0 `run.yaml`                                                                                                                                         | 78 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                              | create 2, convert 85            |
| Drilling page                                                 | 1,680 words; 4 of 5 standard `##` sections exact; 39 `<details>` blocks; headings found: Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation and self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) | 3,320 words short; fix sections |
| Katas                                                         | 6 kata folders                                                                                                                                                                                          | at least 8 as `before`/`after` units                                                                                                                                 | 2                               |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                                  | unchanged, except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                           | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X1** 96 code files (78 example folders, 6 kata folders, 3 test-like files); none has a `run.yaml`.
- **X8** 78 "Why It Matters" blocks present: 78 under 50 words, 0 over 100, median 47 words.
- **X9** Annotation density: median 0.0; 78 examples below 1.0 and 0 above 2.25 (of 78 code-bearing).
- **X10** The `=>` result notation appears in 0 of 78 code fences.
- **X11** Drilling: 1,680 words (3,320 short of 5,000); 4 of 5 exact `##` sections; 6 kata folders against 8.
- **X13** 18,911 words against a floor of 28,000; 9,089 to write.
- **X14** The plan 09 filler guard lists this course (owner `plan-13`): near-duplicate share 0.90 (limit 0.50) and repeated-paragraph share 0.52 (limit 0.25) on 2026-10-09.
- **X16** A code comment says "Imports are intentionally omitted: this app module needs Room, Retrofit, lifecycle-viewmodel, and coroutines"; none of these has a locked version.
- **X17** 68 of 96 code files use Android or Compose symbols (keyword scan). The Android SDK and Gradle are not in the catalog, so those files cannot compile in the harness.
- **X20** 2 Mermaid diagrams against the band of 30 to 50.
- **Filler baseline**: the course must stop firing every rule, and its entry leaves `FILLER_BASELINE` (and the cap falls by one) in the same commit as the course ([tech-docs/007](../../tech-docs/007-testing-strategy.md#the-filler-baseline-ratchet)).

## Fixes and design

- Rewrite the 78 example bodies so each is written from its own code and output; remove the templated paragraphs that fire FG3 and FG6.
- Annotate all 78 Kotlin files to 1.0 to 2.25 comment lines per code line with `=>` results, and lengthen the 78 "Why It Matters" blocks to 50 to 100 words.
- Split units by import: framework-free logic (reducers, repositories over fakes, formatting, validation) runs for real in `kotlin`; files that import `android.*`, `androidx.*`, or Compose run `mode: static` with reason `android` and the `ktlint` validator (spike SP7).
- State on each static fence what the run proves (below) and keep the Android Studio steps as launch illustrations.
- Add diagrams until the By Example band is met, write the drilling page with 8 kata units, and remove the `android-app-development` entry from `FILLER_BASELINE` in the same commit.

## Harness mode and toolchain

- **Harness mode**: Mixed: `kotlin` for logic units (real), `ktlint` for Compose and androidx units (static, reason `android`).
- **Toolchain ids**: kotlin; ktlint (static, reason android).
- **Toolchain additions** (budget-gated, default NO-GO; [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-cost.md)): none; a stronger Android validator stays a known gap (decision D9).
- **What the static run proves**: The `ktlint` run proves each Compose or androidx file is syntactically valid Kotlin. It does not prove that `androidx.*` symbols resolve, that the module builds, or that the screen renders or survives a configuration change.
- **Phase 1 spikes**: SP7 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: at most 12 (Android Studio, emulator, Gradle, and device install lines).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 6.4 s per container invocation × 2 executions × 97 runs (78 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 20.7 minutes.

## Size class and sequencing

- **Size class M** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 9,089 (the larger of the word gap and the drilling shortfall), new unit folders 2.
- **Estimated effort** (size, not time): class M; agent packets: one packet per defect group plus one authoring packet for the word gap.
- **Wave 6**, slot 2. Makers and fixers for this course: `apps-ayokoding-www-by-example-maker` for authoring gaps, `tutorial-by-example-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `ios-app-development` (each is audited in a later wave, so this course is final first).

## Prerequisite re-check

- Plan 02 keeps the current list (the list above is the result).
- In-plan prerequisites are audited first: `frontend-essentials` in wave 1, `advanced-frontend` in wave 2.
- Prerequisites outside this plan (unchanged here): `just-enough-kotlin`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-path-and-capstone-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `android-app-development` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder; `AUDIT_PROBE=android-app-development:by-example` with `UNIT-NODE tests/unit/be-steps/audited-course-completion.steps.ts` to record the scenarios the course fails; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (M): one packet per defect group plus one authoring packet for the word gap. Classes: X1, X8, X9, X10, X11, X13, X14, X16, X17, X20.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `android-app-development`; a course that fires is fixed, never baselined.
- [ ] Units: 78 example units, 8 kata units, 1 capstone unit (create 2, convert 85); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 12 (Android Studio, emulator, Gradle, and device install lines).
- [ ] Static units: each `mode: static` unit's `static.reason` is in the closed set and its `static.note` states what the run proves (the sentence above).
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `android-app-development` exits 0 (at most 2 repair cycles); `EX-COVERAGE` shows `covered: true` for `android-app-development`.
- [ ] CP-6 The registry row for `android-app-development` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit android-app-development course` with explicit paths only: the course folder with its `_index.md`, the registry row. Delete the `android-app-development` entry from `FILLER_BASELINE` and lower `FILLER_BASELINE_CAP` by one in the same commit; `course-filler.steps.ts` stays green without the entry.
- [ ] CP-7 Capstone relies-on: `rtk git grep -n "android-app-development" -- 'apps/ayokoding-www/content/en/learn/courses/capstone-*/learning/overview.md'` shows no capstone row for this course today; if the search finds one at execution time, handle it as in the other courses and note it in the ledger.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/android-app-development/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–26 (26): from "Scaffold a Project" to "Render List Items".
- **co-02 · intermediate** — examples 27–54 (28): from "Read State from a ViewModel" to "Offer a Retryable Error State".
- **co-03 · advanced** — examples 55–78 (24): from "Set Up a NavHost" to "Preview the Full App Capstone".

## Lineage

- Builds on: `just-enough-kotlin`, `frontend-essentials`, `advanced-frontend`. Required by (in this plan): `ios-app-development`.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 51 of 121 in the manifest as specified by plan 02 (read 2026-10-09), phase `apps-and-interfaces`, role `extension`; this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 38 of 114 in the manifest as specified by plan 02 (read 2026-10-09), phase `apps-and-interfaces`, role `extension`; this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 41 of 116 in the manifest as specified by plan 02 (read 2026-10-09), phase `apps-and-interfaces`, role `extension`; this plan changes no path membership or order.
