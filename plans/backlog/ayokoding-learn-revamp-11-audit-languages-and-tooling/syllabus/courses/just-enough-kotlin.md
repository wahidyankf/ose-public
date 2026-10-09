# Just Enough Kotlin (Primer)

**Course ID**: `just-enough-kotlin` · **Format**: Primer · **Family**: programming-languages.

**Scope note**: Audits and fixes the existing `just-enough-kotlin` course to the series definition of done and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course.

**Short summary**: The small, practical Kotlin surface for Android: values, nullability, functions, collections, classes, and a deliberately short coroutine preview.

## Why this exists · the big idea

- **The problem before the solution**: Only 29 code files exist for 78 examples, a Gradle cache is committed, coroutine code sits in a nested folder, and the overview has no scope sentence.
- **Keep-this-if-you-forget-everything**: Kotlin 2.4 on the JVM, one program per example; coroutines are previewed with a library the harness can run offline, or with the standard library alone.

## Prerequisites

- **Prior courses**: none (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: Primer (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Primer: 75 to 85 examples at By Example pace, the By Example parts and lengths, the layout `just-enough-<x>/learning/` with overview, example pages, `capstone/`, and `code/`, and a light consolidation capstone. The 78 examples are complete programs in their Markdown blocks.
- **Wave**: 3 (slot 1); **size class**: L (words to write 17,034, new unit folders 86); **expected defect classes**: 6 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                 | Target                                                                                                                                                                                   | Work                            |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 10,966                                                                                                                                                                          | at least 28,000                                                                                                                                                                          | 17,034 to write                 |
| Examples as `### Example N: Title`                            | 78 (headings in the wrong form today)                                                                                                                                           | at least 75, numbered 1 to N without gaps                                                                                                                                                | none; rename the headings       |
| Mermaid diagrams                                              | 0                                                                                                                                                                               | no count band (a diagram where it helps)                                                                                                                                                 | none required                   |
| "Why It Matters" (50 to 100 words each)                       | none of 78 examples has one                                                                                                                                                     | one per example, 50 to 100 words                                                                                                                                                         | 78 to write                     |
| Annotation density (comment lines per code line)              | median 1.0; 13 examples below 1.0; 0 above 2.25 (of 78 code-bearing)                                                                                                            | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 13 to fix                       |
| Code fences                                                   | 78 fences; 78 code fences unanchored                                                                                                                                            | every code fence anchored or marked as an illustration (budget: at most 8 fences (the coroutine library lines under option b))                                                           | 78 to anchor                    |
| Lesson-to-file anchors (plan 05's method)                     | 0 path anchors (match 0, mismatch 0, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                                            | every anchor matches its file                                                                                                                                                            | 0 to repair                     |
| Output blocks                                                 | 0 output fences; 0 unanchored                                                                                                                                                   | every `**Output**` block anchored to an expected file                                                                                                                                    | 0 to anchor                     |
| Harness units                                                 | 0 example folders, 0 kata folders, 29 code files, 0 `run.yaml`                                                                                                                  | 78 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | create 86, convert 1            |
| Drilling page                                                 | 1,204 words; 1 of 5 standard `##` sections exact; 35 `<details>` blocks; headings found: Recall Q&A, Applied Problems, Deliberate Practice, Automaticity Checklist, Explain Why | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 3,796 words short; fix sections |
| Katas                                                         | 0 kata folders                                                                                                                                                                  | at least 8 as `before`/`after` units                                                                                                                                                     | 8                               |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                          | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                                                | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X6** All 78 example headings are `##`; X3 78 fences are unanchored.
- **X7** No "Why It Matters" blocks; X9 13 examples under the density floor.
- **X2** Only 29 code files exist, including a nested `learning/coroutines/code/` and a committed Gradle build cache in the capstone folder (`.gradle/buildOutputCleanup`); both are layout findings.
- **X12** The overview has no "just enough" scope sentence; X11 drilling is 1,204 words under nonstandard headings; 0 kata units.
- **X13** Words 10,966, a gap of 17,034.
- **X16** The coroutine examples import `kotlinx.coroutines`, a library, resolved through Gradle (`kotlinx-coroutines-core:1.11.0`).

## Fixes and design

- Create 78 units, move the coroutine runner into canonical units, delete committed build output, write the missing parts.
- Coroutines (spike SP6): option (a) a pinned `kotlinx-coroutines-core-jvm` jar baked into the `kotlin` image (a catalog change, budget-gated); option (b) the preview uses only the standard library's `kotlin.coroutines` primitives and `sequence`, and the `kotlinx` lines are illustrations. Default if the budget rule fails: option (b).
- `kotlinc` compile time makes this one of the slowest toolchains (planning 10 s per invocation); see tech-docs/004.
- The scope sentence names the Android course as the consumer.

## Harness mode and toolchain

- **Harness mode**: Real mode, `kotlin`.
- **Toolchain ids**: kotlin (2.4; `kotlinc`, derived from the `java` image that plan 09 changes); coroutine library by decision D7 and spike SP6.
- **Toolchain additions** (budget-gated, default NO-GO; [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-cost.md)): kotlinx-coroutines jar (through plan 09's lock recipe if `kotlin` can use it, otherwise budget-gated).
- **Phase 1 spikes**: SP6, SP7 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: At most 8 fences (the coroutine library lines under option b).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 10.0 s per container invocation × 2 executions × 97 runs (78 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 32.3 minutes.

## Size class and sequencing

- **Size class L** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 17,034 (the larger of the word gap and the drilling shortfall), new unit folders 86.
- **Agent packets**: authoring split by learning page (one packet per page), then one packet per remaining defect group.
- **Wave 3**, slot 1. Makers and fixers for this course: `apps-ayokoding-www-primer-maker` for authoring gaps, `tutorial-primer-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `just-enough-swift` (each is audited in a later wave, so this course is final first).

## Prerequisite re-check

- Plan 02 result: No prerequisites, as before.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-core-and-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `just-enough-kotlin` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-primer-checker` over the course folder; compare its findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (L): authoring split by learning page (one packet per page), then one packet per remaining defect group. Classes: X2, X6, X7, X12, X13, X16.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `just-enough-kotlin`; a course that fires is fixed, never baselined.
- [ ] Units: 78 example units, 8 kata units, 1 capstone unit (create 86, convert 1); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 8 fences (the coroutine library lines under option b).
- [ ] CP-3 `tutorial-primer-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `just-enough-kotlin` exits 0 (at most 2 repair cycles).
- [ ] CP-6 The registry row for `just-enough-kotlin` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit just-enough-kotlin course` with explicit paths only: the course folder with its `_index.md`, the registry row.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/just-enough-kotlin/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- The catalog derives `kotlin` 2.4.21 from `java` (Temurin 25); `ktlint` is a validator in the catalog (plan 05, 2026-10-09).
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–26 (26): from "Compile a Kotlin Program" to "Use `if` as a Value".
- **co-02 · intermediate** — examples 27–54 (28): from "Store a Lambda" to "Add a Companion Factory".
- **co-03 · advanced** — examples 55–78 (24): from "Match a Value with `when`" to "Preview the Capstone Shape".

## Lineage

- Prerequisite of Just Enough Swift.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 20 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 19 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 20 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
