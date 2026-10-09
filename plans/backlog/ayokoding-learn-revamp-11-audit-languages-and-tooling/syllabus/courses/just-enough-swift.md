# Just Enough Swift (Primer)

**Course ID**: `just-enough-swift` · **Format**: Primer · **Family**: programming-languages.

**Scope note**: Audits and fixes the existing `just-enough-swift` course to the series definition of done and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. The neighbouring courses `object-oriented-programming-essentials`, `just-enough-kotlin` keep their own scope. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course.

**Short summary**: Just enough Swift for iOS work: syntax, modelling with structs and enums, protocols, closures, error handling, and one carefully bounded `async`/`await` preview. Xcode, SwiftUI, UIKit, actors, and production concurrency are outside the boundary.

## Why this exists · the big idea

- **The problem before the solution**: Two code files for 78 examples, no "Why It Matters", annotation density 0.71, and UI code that the Linux toolchain cannot run.
- **Keep-this-if-you-forget-everything**: Swift 6.4 on Linux for the language itself; SwiftUI and UIKit examples are validated by parsing and labelled, not run.

## Prerequisites

- **Prior courses**: `object-oriented-programming-essentials`, `just-enough-kotlin` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: Primer (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Primer: 75 to 85 examples at By Example pace, the By Example parts and lengths, the layout `just-enough-<x>/learning/` with overview, example pages, `capstone/`, and `code/`, and a light consolidation capstone. The 78 examples are self-contained Swift programs.
- **Wave**: 6 (slot 2); **size class**: L (words to write 19,512, new unit folders 86); **expected defect classes**: 5 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                 | Target                                                                                                                                                                                   | Work                            |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 8,488                                                                                                                                                                           | at least 28,000                                                                                                                                                                          | 19,512 to write                 |
| Examples as `### Example N: Title`                            | 78 (headings in the wrong form today)                                                                                                                                           | at least 75, numbered 1 to N without gaps                                                                                                                                                | none; rename the headings       |
| Mermaid diagrams                                              | 0                                                                                                                                                                               | no count band (a diagram where it helps)                                                                                                                                                 | none required                   |
| "Why It Matters" (50 to 100 words each)                       | none of 78 examples has one                                                                                                                                                     | one per example, 50 to 100 words                                                                                                                                                         | 78 to write                     |
| Annotation density (comment lines per code line)              | median 0.71; 44 examples below 1.0; 0 above 2.25 (of 78 code-bearing)                                                                                                           | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 44 to fix                       |
| Code fences                                                   | 78 fences; 78 code fences unanchored                                                                                                                                            | every code fence anchored or marked as an illustration (budget: at most 5 fences)                                                                                                        | 78 to anchor                    |
| Lesson-to-file anchors (plan 05's method)                     | 0 path anchors (match 0, mismatch 0, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                                            | every anchor matches its file                                                                                                                                                            | 0 to repair                     |
| Output blocks                                                 | 0 output fences; 0 unanchored                                                                                                                                                   | every `**Output**` block anchored to an expected file                                                                                                                                    | 0 to anchor                     |
| Harness units                                                 | 0 example folders, 0 kata folders, 2 code files, 0 `run.yaml`                                                                                                                   | 78 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | create 86, convert 1            |
| Drilling page                                                 | 1,197 words; 1 of 5 standard `##` sections exact; 29 `<details>` blocks; headings found: Recall Q&A, Applied Problems, Deliberate Practice, Automaticity Checklist, Explain Why | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 3,803 words short; fix sections |
| Katas                                                         | 0 kata folders                                                                                                                                                                  | at least 8 as `before`/`after` units                                                                                                                                                     | 8                               |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                          | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                                                | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X6** All 78 example headings are `##`; X3 78 fences unanchored; only 2 code files exist, so 78 units are created.
- **X7** No "Why It Matters" blocks; X9 44 examples under the density floor (median 0.71).
- **X11** Drilling is 1,197 words under nonstandard headings; 0 kata units.
- **X13** Words 8,488, a gap of 19,512.
- **X18** The overview says to use an unpinned current toolchain; the harness runs Swift 6.4 on Linux.

## Fixes and design

- Create 78 units, wire them, write the missing parts, lift density, rewrite drilling, write 8 katas.
- Foundation-only code runs for real on Linux; any example that needs SwiftUI or UIKit is `mode: static` with reason `ios`, validated by `swiftc -parse`, and the note says what that proves.
- `async`/`await` examples use an in-process executor with fixed order; no wall-clock `Task.sleep` reaches output.

## Harness mode and toolchain

- **Harness mode**: Real mode, `swift`, with `swift-parse` static units for UI-only code.
- **Toolchain ids**: swift (6.4, Linux) real; swift-parse static (reason `ios`) for UI code.
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP15 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: At most 5 fences.
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 8.0 s per container invocation × 2 executions × 97 runs (78 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 25.9 minutes.

## Size class and sequencing

- **Size class L** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 19,512 (the larger of the word gap and the drilling shortfall), new unit folders 86.
- **Agent packets**: authoring split by learning page (one packet per page), then one packet per remaining defect group.
- **Wave 6**, slot 2. Makers and fixers for this course: `apps-ayokoding-www-primer-maker` for authoring gaps, `tutorial-primer-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 result: Kept; `just-enough-kotlin` is audited first (wave 3).
- In-plan prerequisites are audited first: `just-enough-kotlin` in wave 3.
- Prerequisites outside this plan (unchanged here): `object-oriented-programming-essentials`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-core-and-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `just-enough-swift` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-primer-checker` over the course folder; compare its findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (L): authoring split by learning page (one packet per page), then one packet per remaining defect group. Classes: X6, X7, X11, X13, X18.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `just-enough-swift`; a course that fires is fixed, never baselined.
- [ ] Units: 78 example units, 8 kata units, 1 capstone unit (create 86, convert 1); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 5 fences.
- [ ] CP-3 `tutorial-primer-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `just-enough-swift` exits 0 (at most 2 repair cycles).
- [ ] CP-6 The registry row for `just-enough-swift` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit just-enough-swift course` with explicit paths only: the course folder with its `_index.md`, the registry row.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/just-enough-swift/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- The catalog has `swift` 6.4 on Linux and the `swift-parse` validator (static, reason `ios`); SwiftUI and UIKit cannot run on Linux (plan 05, 2026-10-09).
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–26 (26): from "Compile a Swift File" to "Use Trailing-Closure Syntax".
- **co-02 · intermediate** — examples 27–54 (28): from "Define a Struct" to "Accept Any Conformer".
- **co-03 · advanced** — examples 55–78 (24): from "Write a Generic Swap" to "Assemble the Primer CLI".

## Lineage

- Follows Just Enough Kotlin; feeds the iOS app course.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 21 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 20 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 21 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
