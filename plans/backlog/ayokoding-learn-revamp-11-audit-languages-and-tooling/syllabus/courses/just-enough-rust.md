# Just Enough Rust (Primer)

**Course ID**: `just-enough-rust` · **Format**: Primer · **Family**: programming-languages.

**Scope note**: Audits and fixes the existing `just-enough-rust` course to the series definition of done and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course.

**Short summary**: Just enough Rust for modern systems programming: the Cargo loop, ownership and borrowing, ordinary data modelling, fallible control flow, traits, generics, and collections, stopping before concurrency, FFI, and `unsafe`.

## Why this exists · the big idea

- **The problem before the solution**: 4,710 words for 78 examples and only 12 fences: the 84 programs sit in one Cargo project that no lesson shows.
- **Keep-this-if-you-forget-everything**: Ownership is learned from the compiler's answers; each example is one program and shows what the compiler or the run says.

## Prerequisites

- **Prior courses**: none (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: Primer (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Primer: 75 to 85 examples at By Example pace, the By Example parts and lengths, the layout `just-enough-<x>/learning/` with overview, example pages, `capstone/`, and `code/`, and a light consolidation capstone. The 78 examples are independent binaries.
- **Wave**: 2 (slot 1); **size class**: XL (words to write 23,290, new unit folders 86); **expected defect classes**: 6 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                               | Target                                                                                                                                                                                   | Work                            |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 4,710                                                                                                                                                                                         | at least 28,000                                                                                                                                                                          | 23,290 to write                 |
| Examples as `### Example N: Title`                            | 78                                                                                                                                                                                            | at least 75, numbered 1 to N without gaps                                                                                                                                                | none                            |
| Mermaid diagrams                                              | 1                                                                                                                                                                                             | no count band (a diagram where it helps)                                                                                                                                                 | none required                   |
| "Why It Matters" (50 to 100 words each)                       | 62 of 78 present; 62 under 50 words; 0 over 100; median 11 words                                                                                                                              | one per example, 50 to 100 words                                                                                                                                                         | 78 to write or fix              |
| Annotation density (comment lines per code line)              | median 0.5; 9 examples below 1.0; 0 above 2.25 (of 10 code-bearing)                                                                                                                           | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 9 to fix                        |
| Code fences                                                   | 12 fences; 11 code fences unanchored                                                                                                                                                          | every code fence anchored or marked as an illustration (budget: at most 3 fences)                                                                                                        | 11 to anchor                    |
| Lesson-to-file anchors (plan 05's method)                     | 0 path anchors (match 0, mismatch 0, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                                                          | every anchor matches its file                                                                                                                                                            | 0 to repair                     |
| Output blocks                                                 | 0 output fences; 0 unanchored                                                                                                                                                                 | every `**Output**` block anchored to an expected file                                                                                                                                    | 0 to anchor                     |
| Harness units                                                 | 0 example folders, 0 kata folders, 84 code files, 0 `run.yaml`                                                                                                                                | 78 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | create 86, convert 1            |
| Drilling page                                                 | 265 words; 0 of 5 standard `##` sections exact; 2 `<details>` blocks; headings found: 1. Recall, 2. Explain the Rules, 3. Predict Before Running, 4. Repair Katas, 5. Self-Check and Transfer | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 4,735 words short; fix sections |
| Katas                                                         | 0 kata folders                                                                                                                                                                                | at least 8 as `before`/`after` units                                                                                                                                                     | 8                               |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                        | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                                                | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X5** Thin lessons: 78 headings in 4,710 words with only 12 fences; the programs sit in one Cargo project (`src/bin/ex-NN.rs`), not in lessons.
- **X2** A single workspace at `learning/code/` is a layout finding; it must become 78 unit folders.
- **X8** 62 "Why It Matters" blocks, all under 50 words (median 11); 16 examples have none.
- **X9** Density median 0.5 (9 examples low).
- **X11** Drilling is 265 words under numbered nonstandard headings ("1. Recall", "2. Explain the Rules", and so on); 0 kata units.
- **X13** Words 4,710 against 28,000, a gap of 23,290 (the largest relative gap in the plan).

## Fixes and design

- Split the workspace into 78 units (a unit owns its `main.rs`), show each program and its output in its lesson, write all missing parts, rewrite drilling, write 8 katas.
- Examples 71, 72, and 77 carry tests: run them with `rustc --test` or `cargo test` in their own unit.
- Standard-library-only examples compile with `rustc` directly and avoid Cargo start-up cost; a `Cargo.lock` is needed only if a unit uses a crate.

## Harness mode and toolchain

- **Harness mode**: Real mode, `rust`.
- **Toolchain ids**: rust (1.99; `rustc` for single files, `cargo` only for locked crates).
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP11 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: At most 3 fences.
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 7.0 s per container invocation × 2 executions × 97 runs (78 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 22.6 minutes.

## Size class and sequencing

- **Size class XL** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 23,290 (the larger of the word gap and the drilling shortfall), new unit folders 86.
- **Agent packets**: authoring split by learning page and again by blocks of at most 15 examples, then one packet per remaining defect group; the course folder is committed only when every unit exists.
- **Wave 2**, slot 1. Makers and fixers for this course: `apps-ayokoding-www-primer-maker` for authoring gaps, `tutorial-primer-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `building-production-cli-tools` (each is audited in a later wave, so this course is final first).

## Prerequisite re-check

- Plan 02 result: No prerequisites, as before.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-core-and-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `just-enough-rust` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-primer-checker` over the course folder; compare its findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (XL): authoring split by learning page and again by blocks of at most 15 examples, then one packet per remaining defect group; the course folder is committed only when every unit exists. Classes: X2, X5, X8, X9, X11, X13.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `just-enough-rust`; a course that fires is fixed, never baselined.
- [ ] Units: 78 example units, 8 kata units, 1 capstone unit (create 86, convert 1); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 3 fences.
- [ ] CP-3 `tutorial-primer-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `just-enough-rust` exits 0 (at most 2 repair cycles).
- [ ] CP-6 The registry row for `just-enough-rust` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit just-enough-rust course` with explicit paths only: the course folder with its `_index.md`, the registry row.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/just-enough-rust/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–26 (26): from "Create a Cargo Project" to "Shadow a Binding".
- **co-02 · intermediate** — examples 27–52 (26): from "Ownership Move" to "Pass a Closure".
- **co-03 · advanced** — examples 53–78 (26): from "Use a HashMap" to "Capstone Preview".

## Lineage

- Prerequisite of Building Production CLI Tools.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 12 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 15 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 15 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
