# Just Enough TypeScript (Primer)

**Course ID**: `just-enough-typescript` · **Format**: Primer · **Family**: programming-languages.

**Scope note**: Audits and fixes the existing `just-enough-typescript` course to the series definition of done and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course.

**Short summary**: TypeScript for productive scripting and services: types, interfaces, generics, narrowing, modules, async code, and tooling with `tsc`, `tsx`, ESLint, and Prettier.

## Why this exists · the big idea

- **The problem before the solution**: 72 of 82 "Why It Matters" blocks are under 50 words, annotation density is 0.82, 118 outputs are unanchored, and 40 fences are not tied to files.
- **Keep-this-if-you-forget-everything**: TypeScript's types are checked by the compiler; each example is a unit whose output, and whose type errors, the lesson shows.

## Prerequisites

- **Prior courses**: none (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: Primer (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Primer: 75 to 85 examples at By Example pace, the By Example parts and lengths, the layout `just-enough-<x>/learning/` with overview, example pages, `capstone/`, and `code/`, and a light consolidation capstone. The 82 examples are TypeScript programs run with `tsx` or compiled with `tsc`.
- **Wave**: 2 (slot 2); **size class**: S (words to write 0, new unit folders 0); **expected defect classes**: 5 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                                       | Target                                                                                                                                                                                   | Work                 |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 30,362                                                                                                                                                                                                | at least 28,000                                                                                                                                                                          | none                 |
| Examples as `### Example N: Title`                            | 82                                                                                                                                                                                                    | at least 75, numbered 1 to N without gaps                                                                                                                                                | none                 |
| Mermaid diagrams                                              | 3                                                                                                                                                                                                     | no count band (a diagram where it helps)                                                                                                                                                 | none required        |
| "Why It Matters" (50 to 100 words each)                       | 82 of 82 present; 72 under 50 words; 0 over 100; median 40 words                                                                                                                                      | one per example, 50 to 100 words                                                                                                                                                         | 72 to write or fix   |
| Annotation density (comment lines per code line)              | median 0.82; 51 examples below 1.0; 0 above 2.25 (of 82 code-bearing)                                                                                                                                 | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 51 to fix            |
| Code fences                                                   | 290 fences; 40 code fences unanchored                                                                                                                                                                 | every code fence anchored or marked as an illustration (budget: at most 3 fences)                                                                                                        | 40 to anchor         |
| Lesson-to-file anchors (plan 05's method)                     | 97 path anchors (match 97, mismatch 0, missing 0); 16 labelled anchors (match 14, mismatch 0, missing 2)                                                                                              | every anchor matches its file                                                                                                                                                            | 2 to repair          |
| Output blocks                                                 | 118 output fences; 118 unanchored                                                                                                                                                                     | every `**Output**` block anchored to an expected file                                                                                                                                    | 118 to anchor        |
| Harness units                                                 | 82 example folders, 8 kata folders, 152 code files, 0 `run.yaml`                                                                                                                                      | 82 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | create 0, convert 91 |
| Drilling page                                                 | 8,004 words; 5 of 5 standard `##` sections exact; 52 `<details>` blocks; headings found: Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | words ok             |
| Katas                                                         | 8 kata folders                                                                                                                                                                                        | at least 8 as `before`/`after` units                                                                                                                                                     | 0                    |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                                | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                                                | recompute            |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X1** 152 files (139 `.ts`, 11 `tsconfig` JSON, 2 `.mjs`) in 82 example folders, 8 kata folders, and a capstone folder, with no `run.yaml`; 11 duplicate `tsconfig` files.
- **X3** 118 `Output` blocks are unanchored, 40 fences are unanchored, and 2 labelled anchors point at missing files; the 97 path anchors and 14 labelled anchors match.
- **X8** 72 of 82 "Why It Matters" blocks are under 50 words (median 40).
- **X9** 51 of 82 examples are under the density floor (median 0.82), the largest low-density count of the primers with code.
- **X16** eslint and prettier are npm packages and need a `package-lock.json`.

## Fixes and design

- Lengthen blocks, add comments, anchor outputs, fix the 2 missing anchors, write the `run.yaml` files with the locked tools; `tsc` and `node --test` for tests.
- Words are above the floor (30,362) and drilling is 8,004 words; the work is wiring and repair.

## Harness mode and toolchain

- **Harness mode**: Real mode, `typescript` and `node`.
- **Toolchain ids**: typescript (7.0, derived from node 24); eslint and prettier locked.
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP3 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: At most 3 fences.
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 4.0 s per container invocation × 2 executions × 101 runs (82 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 13.5 minutes.

## Size class and sequencing

- **Size class S** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 0 (the larger of the word gap and the drilling shortfall), new unit folders 0.
- **Agent packets**: one packet per defect group (mechanical fixes, then prose fixes); no page split.
- **Wave 2**, slot 2. Makers and fixers for this course: `apps-ayokoding-www-primer-maker` for authoring gaps, `tutorial-primer-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `build-automation-and-task-runners`, `just-enough-dart` (each is audited in a later wave, so this course is final first).

## Prerequisite re-check

- Plan 02 result: Plan 02 removes `networking-essentials`; the course has no prerequisites.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-core-and-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `just-enough-typescript` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-primer-checker` over the course folder; compare its findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (S): one packet per defect group (mechanical fixes, then prose fixes); no page split. Classes: X1, X3, X8, X9, X16.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `just-enough-typescript`; a course that fires is fixed, never baselined.
- [ ] Units: 82 example units, 8 kata units, 1 capstone unit (create 0, convert 91); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 3 fences.
- [ ] CP-3 `tutorial-primer-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `just-enough-typescript` exits 0 (at most 2 repair cycles).
- [ ] CP-6 The registry row for `just-enough-typescript` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit just-enough-typescript course` with explicit paths only: the course folder with its `_index.md`, the registry row.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/just-enough-typescript/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Plan 05's layout survey (2026-10-09) found the course mentioning TypeScript 7.0; the catalog derives `typescript` 7.0.2 from `node` 24.21.0.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–28 (28): from "Hello tsx" to "Run Typed Script tsx".
- **co-02 · intermediate** — examples 29–60 (32): from "Narrow With typeof" to "Index Signature".
- **co-03 · advanced** — examples 61–82 (22): from "ESM Named Export Import" to "Full Typed Module".

## Lineage

- Prerequisite of Build Automation and of Just Enough Dart.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 33 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 29 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 28 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
