# Just Enough Elixir (Primer)

**Course ID**: `just-enough-elixir` · **Format**: Primer · **Family**: programming-languages.

**Scope note**: Audits and fixes the existing `just-enough-elixir` course to the series definition of done and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. The neighbouring courses `functional-programming`, `just-enough-python` keep their own scope. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course.

**Short summary**: Immutable values, pattern matching, modules, recursion, `Enum`, strings, and a first look at isolated BEAM processes, as the preparation for actor-model concurrency.

## Why this exists · the big idea

- **The problem before the solution**: A 26-word learning overview, no `=>` notation in 79 fences, and five kata folders that hold only one-line overview pages.
- **Keep-this-if-you-forget-everything**: Elixir is taught through immutability, pattern matching, and processes; each example is a script whose printed result the lesson shows.

## Prerequisites

- **Prior courses**: `functional-programming`, `just-enough-python` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: Primer (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Primer: 75 to 85 examples at By Example pace, the By Example parts and lengths, the layout `just-enough-<x>/learning/` with overview, example pages, `capstone/`, and `code/`, and a light consolidation capstone. The 78 examples are `main.exs` scripts.
- **Wave**: 5 (slot 2); **size class**: L (words to write 19,595, new unit folders 8); **expected defect classes**: 5 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                                      | Target                                                                                                                                                                                   | Work                            |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 8,405                                                                                                                                                                                                | at least 28,000                                                                                                                                                                          | 19,595 to write                 |
| Examples as `### Example N: Title`                            | 78 (headings in the wrong form today)                                                                                                                                                                | at least 75, numbered 1 to N without gaps                                                                                                                                                | none; rename the headings       |
| Mermaid diagrams                                              | 0                                                                                                                                                                                                    | no count band (a diagram where it helps)                                                                                                                                                 | none required                   |
| "Why It Matters" (50 to 100 words each)                       | none of 78 examples has one                                                                                                                                                                          | one per example, 50 to 100 words                                                                                                                                                         | 78 to write                     |
| Annotation density (comment lines per code line)              | median 1.0; 4 examples below 1.0; 0 above 2.25 (of 78 code-bearing)                                                                                                                                  | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 4 to fix                        |
| Code fences                                                   | 79 fences; 79 code fences unanchored                                                                                                                                                                 | every code fence anchored or marked as an illustration (budget: at most 3 fences)                                                                                                        | 79 to anchor                    |
| Lesson-to-file anchors (plan 05's method)                     | 0 path anchors (match 0, mismatch 0, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                                                                 | every anchor matches its file                                                                                                                                                            | 0 to repair                     |
| Output blocks                                                 | 0 output fences; 0 unanchored                                                                                                                                                                        | every `**Output**` block anchored to an expected file                                                                                                                                    | 0 to anchor                     |
| Harness units                                                 | 78 example folders, 0 kata folders, 87 code files, 0 `run.yaml`                                                                                                                                      | 78 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | create 8, convert 79            |
| Drilling page                                                 | 448 words; 4 of 5 standard `##` sections exact; 3 `<details>` blocks; headings found: Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation and self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 4,552 words short; fix sections |
| Katas                                                         | 0 kata folders                                                                                                                                                                                       | at least 8 as `before`/`after` units                                                                                                                                                     | 8                               |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                               | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                                                | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X6** All 78 example headings are `##`; X7 no key takeaways and no "Why It Matters" blocks.
- **X10** `=>` annotation notation appears in 0 of 79 fences.
- **X1** 87 files (84 `.exs`) in 78 example folders and a capstone folder, no `run.yaml`; 14 files use thread markers (process timing).
- **X11** Drilling is 448 words; the learning overview is 26 words; 0 kata units; 12 Markdown files.
- **X13** Words 8,405, a gap of 19,595.

## Fixes and design

- Add real annotations, key takeaways, and "Why It Matters" blocks; lengthen overviews; write 8 katas.
- Process examples synchronize on messages (`receive` with `send`), never on sleeps, and sort results before printing.
- Scripts run with `elixir main.exs`; no Mix project is needed, so nothing is fetched. A Mix project for the capstone uses only OTP.

## Harness mode and toolchain

- **Harness mode**: Real mode, `elixir`.
- **Toolchain ids**: elixir (1.20 on OTP 29, standard library and OTP only).
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP16 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: At most 3 fences.
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 4.0 s per container invocation × 2 executions × 97 runs (78 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 12.9 minutes.

## Size class and sequencing

- **Size class L** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 19,595 (the larger of the word gap and the drilling shortfall), new unit folders 8.
- **Agent packets**: authoring split by learning page (one packet per page), then one packet per remaining defect group.
- **Wave 5**, slot 2. Makers and fixers for this course: `apps-ayokoding-www-primer-maker` for authoring gaps, `tutorial-primer-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 result: Kept; `just-enough-python` is audited first (wave 1).
- In-plan prerequisites are audited first: `just-enough-python` in wave 1.
- Prerequisites outside this plan (unchanged here): `functional-programming`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-core-and-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `just-enough-elixir` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-primer-checker` over the course folder; compare its findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (L): authoring split by learning page (one packet per page), then one packet per remaining defect group. Classes: X1, X6, X10, X11, X13.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `just-enough-elixir`; a course that fires is fixed, never baselined.
- [ ] Units: 78 example units, 8 kata units, 1 capstone unit (create 8, convert 79); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 3 fences.
- [ ] CP-3 `tutorial-primer-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `just-enough-elixir` exits 0 (at most 2 repair cycles).
- [ ] CP-6 The registry row for `just-enough-elixir` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit just-enough-elixir course` with explicit paths only: the course folder with its `_index.md`, the registry row.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/just-enough-elixir/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–26 (26): from "IEx Start Eval" to "Pipe Vs Nested".
- **co-02 · intermediate** — examples 27–54 (28): from "Defmodule Def" to "Keyword List Opts".
- **co-03 · advanced** — examples 55–78 (24): from "Spawn Basic" to "Capstone Preview Roundtrip".

## Lineage

- Prepares the actor-model and concurrency courses.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 84 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 83 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 68 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
