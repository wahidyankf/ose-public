# Just Enough C# (Primer)

**Course ID**: `just-enough-csharp` · **Format**: Primer · **Family**: programming-languages.

**Scope note**: Audits and fixes the existing `just-enough-csharp` course to the series definition of done and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. The neighbouring course `object-oriented-programming-essentials` keeps its own scope. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course.

**Short summary**: The bounded C# surface that Windows App Development assumes: the .NET CLI and top-level statements, type semantics and null safety, models and collections, LINQ, patterns and failures, and an async preview.

## Why this exists · the big idea

- **The problem before the solution**: Only 7,874 words for 78 examples, no "Why It Matters", annotation density 0.75, and a .NET start-up cost that makes every unit slow.
- **Keep-this-if-you-forget-everything**: A C# 14 console project per example with nullable types on, each with its output, and a run design that respects dotnet's start-up cost.

## Prerequisites

- **Prior courses**: `object-oriented-programming-essentials` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: Primer (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Primer: 75 to 85 examples at By Example pace, the By Example parts and lengths, the layout `just-enough-<x>/learning/` with overview, example pages, `capstone/`, and `code/`, and a light consolidation capstone. Each of the 78 examples is a complete `Program.cs` for a nullable-enabled console project.
- **Wave**: 6 (slot 1); **size class**: XL (words to write 20,126, new unit folders 3); **expected defect classes**: 7 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                                      | Target                                                                                                                                                                                   | Work                            |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 7,874                                                                                                                                                                                                | at least 28,000                                                                                                                                                                          | 20,126 to write                 |
| Examples as `### Example N: Title`                            | 78 (headings in the wrong form today)                                                                                                                                                                | at least 75, numbered 1 to N without gaps                                                                                                                                                | none; rename the headings       |
| Mermaid diagrams                                              | 1                                                                                                                                                                                                    | no count band (a diagram where it helps)                                                                                                                                                 | none required                   |
| "Why It Matters" (50 to 100 words each)                       | none of 78 examples has one                                                                                                                                                                          | one per example, 50 to 100 words                                                                                                                                                         | 78 to write                     |
| Annotation density (comment lines per code line)              | median 0.75; 43 examples below 1.0; 0 above 2.25 (of 78 code-bearing)                                                                                                                                | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 43 to fix                       |
| Code fences                                                   | 85 fences; 84 code fences unanchored                                                                                                                                                                 | every code fence anchored or marked as an illustration (budget: at most 5 fences (`dotnet new`))                                                                                         | 84 to anchor                    |
| Lesson-to-file anchors (plan 05's method)                     | 0 path anchors (match 0, mismatch 0, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                                                                 | every anchor matches its file                                                                                                                                                            | 0 to repair                     |
| Output blocks                                                 | 0 output fences; 0 unanchored                                                                                                                                                                        | every `**Output**` block anchored to an expected file                                                                                                                                    | 0 to anchor                     |
| Harness units                                                 | 78 example folders, 5 kata folders, 181 code files, 0 `run.yaml`                                                                                                                                     | 78 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | create 3, convert 84            |
| Drilling page                                                 | 403 words; 4 of 5 standard `##` sections exact; 3 `<details>` blocks; headings found: Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation and self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 4,597 words short; fix sections |
| Katas                                                         | 5 kata folders                                                                                                                                                                                       | at least 8 as `before`/`after` units                                                                                                                                                     | 3                               |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                               | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                                                | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X6** All 78 example headings are `##`.
- **X7** No "Why It Matters" blocks (0 of 78); 84 of 85 fences unanchored.
- **X9** 43 of 78 examples are under the density floor (median 0.75).
- **X1** 181 files (90 `.cs`, 90 `.csproj`) in 78 example folders, 5 kata folders, and a capstone folder, with no `run.yaml`; 87 files sit in duplicate-body groups (identical project files).
- **X16** xunit needs a NuGet lockfile (`packages.lock.json`) and an offline restore.
- **X11** Drilling is 403 words; X13 words 7,874, a gap of 20,126; 5 katas of 8.
- **X18** The overview says to use a current .NET LTS and does not pin; the harness runs SDK 10, and the lesson must say so.

## Fixes and design

- Raise headings, write 78 "Why It Matters" blocks, lift density, add the missing prose to reach the floor, and wire 78 units with a project file each (units own their files; duplicates are allowed).
- Environment: one `packages.lock.json` per course for xunit; `dotnet test --no-restore` after an environment build.
- Planning cost is the highest in this plan: about 12 seconds per invocation, 2 executions per run (spike SP5 measures it and tries `DOTNET_CLI_TELEMETRY_OPTOUT`, `DOTNET_NOLOGO`, release configuration, and `--no-restore`). If one course cannot fit a shard, tech-docs/004 rung 4 applies.

## Harness mode and toolchain

- **Harness mode**: Real mode, `dotnet`.
- **Toolchain ids**: dotnet (SDK 10, C# 14); xunit locked.
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP5 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: At most 5 fences (`dotnet new`).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 12.0 s per container invocation × 2 executions × 97 runs (78 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 38.8 minutes.

## Size class and sequencing

- **Size class XL** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 20,126 (the larger of the word gap and the drilling shortfall), new unit folders 3.
- **Agent packets**: authoring split by learning page and again by blocks of at most 15 examples, then one packet per remaining defect group; the course folder is committed only when every unit exists.
- **Wave 6**, slot 1. Makers and fixers for this course: `apps-ayokoding-www-primer-maker` for authoring gaps, `tutorial-primer-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 result: Kept; outside this plan.
- Prerequisites outside this plan (unchanged here): `object-oriented-programming-essentials`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-core-and-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `just-enough-csharp` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-primer-checker` over the course folder; compare its findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (XL): authoring split by learning page and again by blocks of at most 15 examples, then one packet per remaining defect group; the course folder is committed only when every unit exists. Classes: X1, X6, X7, X9, X11, X16, X18.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `just-enough-csharp`; a course that fires is fixed, never baselined.
- [ ] Units: 78 example units, 8 kata units, 1 capstone unit (create 3, convert 84); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 5 fences (`dotnet new`).
- [ ] CP-3 `tutorial-primer-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `just-enough-csharp` exits 0 (at most 2 repair cycles).
- [ ] CP-6 The registry row for `just-enough-csharp` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit just-enough-csharp course` with explicit paths only: the course folder with its `_index.md`, the registry row.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/just-enough-csharp/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- The catalog has `dotnet` SDK 10 with C# 14 (plan 05, 2026-10-09).
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–26 (26): from "dotnet new console" to "dictionary".
- **co-02 · intermediate** — examples 27–54 (28): from "define an interface" to "NuGet package command".
- **co-03 · advanced** — examples 55–78 (24): from "switch expression" to "capstone CLI".

## Lineage

- Follows Object-Oriented Programming Essentials.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 22 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 21 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
