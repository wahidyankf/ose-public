# Windows App Development (By Example)

**Course ID**: `windows-app-development` · **Format**: By Example · **Family**: application-development.

**Scope note**: Audits and fixes the existing `windows-app-development` course to the series definition of done and brings every example green in plan 05's code harness. The subject, slug, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course (except a capstone's `relies-on` row, CP-7).

**Short summary**: Responsive Windows desktop apps in C# with the MVVM pattern: WinUI and WinForms hosts, binding, commands, async work, dependency injection, persistence, and testing.

## Why this exists · the big idea

- **The problem before the solution**: 78 anchors all mismatch their files (the lessons show 7-line excerpts of 31-line files), 3 build-cache files are committed, and the filler guard fires FG3 (near-duplicate share 0.79).
- **Keep-this-if-you-forget-everything**: A Windows app is MVVM logic that runs anywhere .NET runs plus a host that only Windows can run; the examples check the logic and the project files and say so.

## Prerequisites

- **Prior courses**: `just-enough-csharp` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example. **Reason**: By Example, as plan 03 records it: 78 numbered examples in three level pages, each backed by a C# file or project.
  A maker may not switch modes except where the reason above says so; a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user.
- **Mode-convention fit**: today the course fits the convention: `overview.md` plus beginner, intermediate, and advanced pages. Example headings per page today: `learning/advanced.md` (24), `learning/beginner.md` (26), `learning/intermediate.md` (28).
- **Wave**: 13 (slot 2); **size class**: S (words to write 3,488, new unit folders 3); **expected defect classes**: 8 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                         | Target                                                                                                                                                               | Work                            |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 27,577                                                                                                                                                                                  | at least 28,000                                                                                                                                                      | 423 to write                    |
| Examples as `### Example N: Title`                            | 78                                                                                                                                                                                      | at least 75, numbered 1 to N without gaps                                                                                                                            | none                            |
| Mermaid diagrams                                              | 31                                                                                                                                                                                      | 30 to 50 (adapter band)                                                                                                                                              | none                            |
| "Why It Matters" (50 to 100 words each)                       | 78 of 78 present; 0 under 50 words; 0 over 100; median 59 words                                                                                                                         | one per example, 50 to 100 words                                                                                                                                     | 0 to write or fix               |
| Annotation density (comment lines per code line)              | median 2.33; 0 examples below 1.0; 78 above 2.25 (of 78 code-bearing)                                                                                                                   | 1.0 to 2.25 on every code-bearing example                                                                                                                            | 78 to fix                       |
| Code fences                                                   | 79 code fences in the lessons; 1 unanchored                                                                                                                                             | every code fence anchored or marked as an illustration (budget: 10 at most; `dotnet new winui`, Visual Studio, and MSIX packaging lines)                             | 1 to anchor                     |
| Lesson-to-file anchors (plan 05's method)                     | 78 path anchors (match 0, mismatch 78, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                                                  | every anchor matches its file                                                                                                                                        | 78 to repair                    |
| Output blocks                                                 | 0 output fences; 0 unanchored                                                                                                                                                           | every `**Output**` block anchored to an expected file                                                                                                                | 0 to anchor                     |
| Harness units                                                 | 78 example folders, 5 kata folders, 145 code files, 0 `run.yaml`                                                                                                                        | 78 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                              | create 3, convert 84            |
| Drilling page                                                 | 1,512 words; 1 of 5 standard `##` sections exact; 30 `<details>` blocks; headings found: Recall Q&A, Applied Scenarios, Hands-on Katas, Self-Check Checklist, Elaborative Interrogation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) | 3,488 words short; fix sections |
| Katas                                                         | 5 kata folders                                                                                                                                                                          | at least 8 as `before`/`after` units                                                                                                                                 | 3                               |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                  | unchanged, except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                           | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X1** 145 code files (78 example folders, 5 kata folders, 2 test-like files); none has a `run.yaml`.
- **X2** 3 `.cache` build-cache files are committed under the code folders.
- **X3** 1 of 79 code fences is neither anchored nor marked as illustrations; 78 anchors mismatch their files and 0 point at missing files.
- **X9** Annotation density: median 2.33; 0 examples below 1.0 and 78 above 2.25 (of 78 code-bearing).
- **X11** Drilling: 1,512 words (3,488 short of 5,000); 1 of 5 exact `##` sections; 5 kata folders against 8.
- **X13** 27,577 words against a floor of 28,000; 423 to write.
- **X14** The plan 09 filler guard lists this course (owner `plan-13`): near-duplicate share 0.79 (limit 0.50) on 2026-10-09.
- **X17** WinUI 3 compiles only on Windows; WPF and WinForms cross-compile with `-p:EnableWindowsTargeting=true` (spike SP8).
- **Filler baseline**: the course must stop firing every rule, and its entry leaves `FILLER_BASELINE` (and the cap falls by one) in the same commit as the course ([tech-docs/007](../../tech-docs/007-testing-strategy.md#the-filler-baseline-ratchet)).

## Fixes and design

- Run MVVM logic, view models, commands, and services for real under `dotnet` (`net10.0`).
- Project and XAML examples run `mode: static` with reason `windows`: WPF and WinForms projects build with the Windows targeting pack, and WinUI projects are checked by validators that read the project and XAML files (spike SP8).
- Replace excerpts by range anchors (`#Lx-Ly`) or full-file fences; delete the committed `.cache` files; give each example its own annotations and prose so FG3 stops firing.
- Trim the 78 over-annotated files (median 2.33 comment lines per code line) into the band of 1.0 to 2.25, keeping the comments that carry meaning.
- Lengthen the 1,512-word drilling page to 5,000 words under the five exact headings and add 3 kata units to reach 8 (5 exist); remove the `windows-app-development` entry from `FILLER_BASELINE` in the same commit.

## Harness mode and toolchain

- **Harness mode**: Mixed: `dotnet` for logic units (real), `windows-static` for project and XAML units (static, reason `windows`).
- **Toolchain ids**: dotnet; windows-static (static, reason windows).
- **Toolchain additions** (budget-gated, default NO-GO; [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-cost.md)): none.
- **What the static run proves**: The `windows-static` run proves that a WPF or WinForms project compiles against the Windows targeting pack and that WinUI project files and XAML are well formed and carry the required properties. It does not run any window, prove WinUI 3 compilation, or exercise the Windows message loop.
- **Phase 1 spikes**: SP8 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: at most 10 (`dotnet new winui`, Visual Studio, and MSIX packaging lines).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 13.0 s per container invocation × 2 executions × 97 runs (78 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 42.0 minutes.

## Size class and sequencing

- **Size class S** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 3,488 (the larger of the word gap and the drilling shortfall), new unit folders 3.
- **Estimated effort** (size, not time): class S; agent packets: one packet per defect group (mechanical fixes, then prose fixes); no page split.
- **Wave 13**, slot 2. Makers and fixers for this course: `apps-ayokoding-www-by-example-maker` for authoring gaps, `tutorial-by-example-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 keeps the current list (the list above is the result).
- Prerequisites outside this plan (unchanged here): `just-enough-csharp`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-path-and-capstone-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `windows-app-development` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder; `AUDIT_PROBE=windows-app-development:by-example` with `UNIT-NODE tests/unit/be-steps/audited-course-completion.steps.ts` to record the scenarios the course fails; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (S): one packet per defect group (mechanical fixes, then prose fixes); no page split. Classes: X1, X2, X3, X9, X11, X13, X14, X17.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `windows-app-development`; a course that fires is fixed, never baselined.
- [ ] Units: 78 example units, 8 kata units, 1 capstone unit (create 3, convert 84); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 10 (`dotnet new winui`, Visual Studio, and MSIX packaging lines).
- [ ] Static units: each `mode: static` unit's `static.reason` is in the closed set and its `static.note` states what the run proves (the sentence above).
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `windows-app-development` exits 0 (at most 2 repair cycles); `EX-COVERAGE` shows `covered: true` for `windows-app-development`.
- [ ] CP-6 The registry row for `windows-app-development` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit windows-app-development course` with explicit paths only: the course folder with its `_index.md`, the registry row. Delete the `windows-app-development` entry from `FILLER_BASELINE` and lower `FILLER_BASELINE_CAP` by one in the same commit; `course-filler.steps.ts` stays green without the entry.
- [ ] CP-7 Capstone relies-on: `rtk git grep -n "windows-app-development" -- 'apps/ayokoding-www/content/en/learn/courses/capstone-*/learning/overview.md'` shows no capstone row for this course today; if the search finds one at execution time, handle it as in the other courses and note it in the ledger.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/windows-app-development/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–26 (26): from "Dotnet New WinUI" to "Test Project".
- **co-02 · intermediate** — examples 27–54 (28): from "INPC Model" to "WinForms Async".
- **co-03 · advanced** — examples 55–78 (24): from "Cancellation Token" to "Capstone Desktop App".

## Lineage

- Builds on: `just-enough-csharp`. Required by (in this plan): none.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 54 of 121 in the manifest as specified by plan 02 (read 2026-10-09), phase `apps-and-interfaces`, role `extension`; this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 41 of 114 in the manifest as specified by plan 02 (read 2026-10-09), phase `apps-and-interfaces`, role `extension`; this plan changes no path membership or order.
