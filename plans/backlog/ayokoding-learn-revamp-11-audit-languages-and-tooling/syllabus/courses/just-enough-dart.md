# Just Enough Dart (Primer)

**Course ID**: `just-enough-dart` · **Format**: Primer · **Family**: programming-languages.

**Scope note**: Audits and fixes the existing `just-enough-dart` course to the series definition of done and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. The neighbouring courses `object-oriented-programming-essentials`, `just-enough-typescript` keep their own scope. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course.

**Short summary**: Just enough Dart for Flutter code: the CLI, types and sound null safety, collections, classes and mixins, and the `Future` and `Stream` spelling that Flutter code uses every day. Isolates, FFI, macros, and framework widgets are outside the boundary.

## Why this exists · the big idea

- **The problem before the solution**: The 78 programs live only inside lesson fences: no units, no "Why It Matters", no anchors.
- **Keep-this-if-you-forget-everything**: Dart 3.13 programs are units; widget code that cannot run here is validated and labelled as such.

## Prerequisites

- **Prior courses**: `object-oriented-programming-essentials`, `just-enough-typescript` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: Primer (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Primer: 75 to 85 examples at By Example pace, the By Example parts and lengths, the layout `just-enough-<x>/learning/` with overview, example pages, `capstone/`, and `code/`, and a light consolidation capstone. The 78 examples are self-contained Dart programs saved as `example.dart`.
- **Wave**: 3 (slot 3); **size class**: L (words to write 13,890, new unit folders 86); **expected defect classes**: 5 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                               | Target                                                                                                                                                                                   | Work                            |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 14,110                                                                                                                                                                        | at least 28,000                                                                                                                                                                          | 13,890 to write                 |
| Examples as `### Example N: Title`                            | 78                                                                                                                                                                            | at least 75, numbered 1 to N without gaps                                                                                                                                                | none                            |
| Mermaid diagrams                                              | 0                                                                                                                                                                             | no count band (a diagram where it helps)                                                                                                                                                 | none required                   |
| "Why It Matters" (50 to 100 words each)                       | none of 78 examples has one                                                                                                                                                   | one per example, 50 to 100 words                                                                                                                                                         | 78 to write                     |
| Annotation density (comment lines per code line)              | median 1.0; 0 examples below 1.0; 0 above 2.25 (of 78 code-bearing)                                                                                                           | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 0 to fix                        |
| Code fences                                                   | 78 fences; 78 code fences unanchored                                                                                                                                          | every code fence anchored or marked as an illustration (budget: at most 5 fences)                                                                                                        | 78 to anchor                    |
| Lesson-to-file anchors (plan 05's method)                     | 0 path anchors (match 0, mismatch 0, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                                          | every anchor matches its file                                                                                                                                                            | 0 to repair                     |
| Output blocks                                                 | 0 output fences; 0 unanchored                                                                                                                                                 | every `**Output**` block anchored to an expected file                                                                                                                                    | 0 to anchor                     |
| Harness units                                                 | 0 example folders, 0 kata folders, 5 code files, 0 `run.yaml`                                                                                                                 | 78 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | create 86, convert 1            |
| Drilling page                                                 | 785 words; 1 of 5 standard `##` sections exact; 14 `<details>` blocks; headings found: Recall Q&A, Applied Problems, Deliberate Practice, Automaticity Checklist, Explain Why | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 4,215 words short; fix sections |
| Katas                                                         | 0 kata folders                                                                                                                                                                | at least 8 as `before`/`after` units                                                                                                                                                     | 8                               |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                        | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                                                | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X19** Only 5 code files exist (no example folders): 78 units have to be created from the 78 inline programs.
- **X3** All 78 fences are unanchored; X7 no "Why It Matters" blocks.
- **X11** Drilling is 785 words with nonstandard headings (Applied Problems, Deliberate Practice, Automaticity Checklist, Explain Why); 0 kata units.
- **X13** Words 14,110, a gap of 13,890.
- **X18** The overview says to use a current SDK and avoids a number; the harness runs Dart 3.13.

## Fixes and design

- Create 78 units from the inline programs, anchor them, write the missing parts, rename drilling headings to the standard five, write 8 katas.
- `Future` and `Stream` examples use virtual time (a fake clock passed in), not real delays.
- Widget code is outside this primer's boundary; if any example shows a Flutter widget, it is either a `flutter test` unit (the `flutter` toolchain exists) or an illustration.

## Harness mode and toolchain

- **Harness mode**: Real mode, `dart`.
- **Toolchain ids**: dart (3.13); flutter only if a widget test is kept.
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP15 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: At most 5 fences.
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 4.0 s per container invocation × 2 executions × 97 runs (78 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 12.9 minutes.

## Size class and sequencing

- **Size class L** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 13,890 (the larger of the word gap and the drilling shortfall), new unit folders 86.
- **Agent packets**: authoring split by learning page (one packet per page), then one packet per remaining defect group.
- **Wave 3**, slot 3. Makers and fixers for this course: `apps-ayokoding-www-primer-maker` for authoring gaps, `tutorial-primer-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 result: Kept; `just-enough-typescript` is audited earlier in this plan (wave 2).
- In-plan prerequisites are audited first: `just-enough-typescript` in wave 2.
- Prerequisites outside this plan (unchanged here): `object-oriented-programming-essentials`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-core-and-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `just-enough-dart` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-primer-checker` over the course folder; compare its findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (L): authoring split by learning page (one packet per page), then one packet per remaining defect group. Classes: X3, X11, X13, X18, X19.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `just-enough-dart`; a course that fires is fixed, never baselined.
- [ ] Units: 78 example units, 8 kata units, 1 capstone unit (create 86, convert 1); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 5 fences.
- [ ] CP-3 `tutorial-primer-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `just-enough-dart` exits 0 (at most 2 repair cycles).
- [ ] CP-6 The registry row for `just-enough-dart` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit just-enough-dart course` with explicit paths only: the course folder with its `_index.md`, the registry row.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/just-enough-dart/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- The catalog has `dart` 3.13.5 and `flutter` 3.41.5 (plan 05, 2026-10-09).
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–26 (26): from "Create a Console Project" to "Create a Set Literal".
- **co-02 · intermediate** — examples 27–54 (28): from "Add an Element Conditionally" to "Clean Up with `finally`".
- **co-03 · advanced** — examples 55–78 (24): from "Create a Positional Record" to "Preview the Console Capstone".

## Lineage

- Follows Just Enough TypeScript; feeds the cross-platform app courses.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 49 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 48 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 45 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
