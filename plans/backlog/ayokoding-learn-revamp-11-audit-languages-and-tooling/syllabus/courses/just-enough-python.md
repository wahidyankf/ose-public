# Just Enough Python (Primer)

**Course ID**: `just-enough-python` · **Format**: Primer · **Family**: programming-languages.

**Scope note**: Audits and fixes the existing `just-enough-python` course to the series definition of done and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course.

**Short summary**: Python for productive scripting and services: values and control flow, functions, classes and dataclasses, modules, errors, files, typing, testing with pytest, and tooling with ruff, black, and pyright.

## Why this exists · the big idea

- **The problem before the solution**: The closest to done after Bash: 72 of 84 "Why It Matters" blocks are under 50 words, 26 examples are below the density floor, and 94 outputs are unanchored.
- **Keep-this-if-you-forget-everything**: Python is learned by running it; every example is a unit with recorded output, and every claim repeats.

## Prerequisites

- **Prior courses**: none (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: Primer (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Primer: 75 to 85 examples at By Example pace, the By Example parts and lengths, the layout `just-enough-<x>/learning/` with overview, example pages, `capstone/`, and `code/`, and a light consolidation capstone. The 84 examples are typed Python programs.
- **Wave**: 1 (slot 1); **size class**: S (words to write 766, new unit folders 0); **expected defect classes**: 7 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                                       | Target                                                                                                                                                                                   | Work                 |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 27,234                                                                                                                                                                                                | at least 28,000                                                                                                                                                                          | 766 to write         |
| Examples as `### Example N: Title`                            | 84                                                                                                                                                                                                    | at least 75, numbered 1 to N without gaps                                                                                                                                                | none                 |
| Mermaid diagrams                                              | 5                                                                                                                                                                                                     | no count band (a diagram where it helps)                                                                                                                                                 | none required        |
| "Why It Matters" (50 to 100 words each)                       | 84 of 84 present; 72 under 50 words; 0 over 100; median 39 words                                                                                                                                      | one per example, 50 to 100 words                                                                                                                                                         | 72 to write or fix   |
| Annotation density (comment lines per code line)              | median 1.0; 26 examples below 1.0; 0 above 2.25 (of 84 code-bearing)                                                                                                                                  | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 26 to fix            |
| Code fences                                                   | 242 fences; 11 code fences unanchored                                                                                                                                                                 | every code fence anchored or marked as an illustration (budget: at most 4 fences)                                                                                                        | 11 to anchor         |
| Lesson-to-file anchors (plan 05's method)                     | 98 path anchors (match 98, mismatch 0, missing 0); 16 labelled anchors (match 16, mismatch 0, missing 0)                                                                                              | every anchor matches its file                                                                                                                                                            | 0 to repair          |
| Output blocks                                                 | 94 output fences; 94 unanchored                                                                                                                                                                       | every `**Output**` block anchored to an expected file                                                                                                                                    | 94 to anchor         |
| Harness units                                                 | 84 example folders, 8 kata folders, 121 code files, 0 `run.yaml`                                                                                                                                      | 84 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | create 0, convert 93 |
| Drilling page                                                 | 6,411 words; 5 of 5 standard `##` sections exact; 51 `<details>` blocks; headings found: Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | words ok             |
| Katas                                                         | 8 kata folders                                                                                                                                                                                        | at least 8 as `before`/`after` units                                                                                                                                                     | 0                    |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                                | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                                                | recompute            |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X1** 121 files (114 Python) in 84 example folders, 8 kata folders, and a capstone folder, with no `run.yaml`.
- **X4** 94 `Output` blocks are unanchored; the 98 path anchors and 16 labelled anchors all match.
- **X8** 72 of 84 "Why It Matters" blocks are under 50 words (median 39).
- **X9** 26 examples are under the density floor.
- **X13** Words 27,234 against 28,000, a gap of 766 (closes when the 72 short blocks are lengthened).
- **X16** pytest appears in 3 files; ruff, black, and pyright are named in the overview. Pyright needs a Node download and is shown as an illustration.
- **X18** Plan 02 removes the prerequisite `capstone-forge-ready`; the overview still recommends it.

## Fixes and design

- Lengthen the 72 short blocks and add comments to the 26 low-density examples; anchor the 94 outputs; write the `run.yaml` files.
- A hash-locked `requirements.lock` for pytest; ruff as a locked wheel (spike SP3); Pyright and Black are illustrations or a locked wheel for Black.
- AI core: this course is position 1 of the AI core. A prerequisite change updates the AI manifest in the same PR (tech-docs/005). Wave 1 pilot for the `python` toolchain.

## Harness mode and toolchain

- **Harness mode**: Real mode, `python`.
- **Toolchain ids**: python (3.14); pytest locked.
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP3 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: At most 4 fences.
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 2.0 s per container invocation × 2 executions × 103 runs (84 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 6.9 minutes.

## Size class and sequencing

- **Size class S** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 766 (the larger of the word gap and the drilling shortfall), new unit folders 0.
- **Agent packets**: one packet per defect group (mechanical fixes, then prose fixes); no page split.
- **Wave 1**, slot 1. Makers and fixers for this course: `apps-ayokoding-www-primer-maker` for authoring gaps, `tutorial-primer-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `browser-automation-with-cdp`, `debugging-and-profiling`, `software-testing`, `version-control-and-git`, `just-enough-c`, `just-enough-elixir` (each is audited in a later wave, so this course is final first).

## Prerequisite re-check

- Plan 02 result: Plan 02 removes the `capstone-forge-ready` edge; the course has no prerequisites. Remove the recommendation from the overview text.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-core-and-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `just-enough-python` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-primer-checker` over the course folder; compare its findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (S): one packet per defect group (mechanical fixes, then prose fixes); no page split. Classes: X1, X4, X8, X9, X13, X16, X18.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `just-enough-python`; a course that fires is fixed, never baselined.
- [ ] Units: 84 example units, 8 kata units, 1 capstone unit (create 0, convert 93); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 4 fences.
- [ ] CP-3 `tutorial-primer-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `just-enough-python` exits 0 (at most 2 repair cycles).
- [ ] CP-6 The registry row for `just-enough-python` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit just-enough-python course` with explicit paths only: the course folder with its `_index.md`, the registry row.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/just-enough-python/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–28 (28): from "Hello Script" to "enumerate + zip".
- **co-02 · intermediate** — examples 29–60 (32): from "List Comprehension" to "Class `__repr__`".
- **co-03 · advanced** — examples 61–84 (24): from "argparse CLI with a Positional Argument" to "pyright Catches a Type Error".

## Lineage

- The first core course of the AI Engineer path after plan 08; prerequisite of most Python-based courses.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 5 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/ai-engineer` — position 1 of 26 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 5 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 5 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/ai-engineer` — a core course after plan 08 (12-course core); a prerequisite change here also changes that manifest, its `assumes`, and its tests in the same PR.
