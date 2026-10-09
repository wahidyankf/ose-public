# Just Enough C (Primer)

**Course ID**: `just-enough-c` · **Format**: Primer · **Family**: programming-languages.

**Scope note**: Audits and fixes the existing `just-enough-c` course to the series definition of done and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. The neighbouring courses `just-enough-python`, `just-enough-bash` keep their own scope. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course.

**Short summary**: The smallest dependable C surface for systems courses: the compile and link loop, scalar values and control flow, pointers and arrays, strings, structs, standard I/O, the preprocessor, small multi-file programs, and the first allocate-and-free discipline.

## Why this exists · the big idea

- **The problem before the solution**: All 78 example anchors disagree with their files by whitespace, the headings are one level too high, 359 filler comments say nothing, and the learning overview is 115 words.
- **Keep-this-if-you-forget-everything**: C is learned by compiling and running small programs with warnings on; each example shows the program, the compile line, and the output.

## Prerequisites

- **Prior courses**: `just-enough-python`, `just-enough-bash` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: Primer (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Primer: 75 to 85 examples at By Example pace, the By Example parts and lengths, the layout `just-enough-<x>/learning/` with overview, example pages, `capstone/`, and `code/`, and a light consolidation capstone. The 78 programs are small, warning-clean C17 sources.
- **Wave**: 5 (slot 1); **size class**: M (words to write 6,433, new unit folders 8); **expected defect classes**: 6 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                                      | Target                                                                                                                                                                                   | Work                            |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 21,567                                                                                                                                                                                               | at least 28,000                                                                                                                                                                          | 6,433 to write                  |
| Examples as `### Example N: Title`                            | 78 (headings in the wrong form today)                                                                                                                                                                | at least 75, numbered 1 to N without gaps                                                                                                                                                | none; rename the headings       |
| Mermaid diagrams                                              | 3                                                                                                                                                                                                    | no count band (a diagram where it helps)                                                                                                                                                 | none required                   |
| "Why It Matters" (50 to 100 words each)                       | 78 of 78 present; 0 under 50 words; 0 over 100; median 84 words                                                                                                                                      | one per example, 50 to 100 words                                                                                                                                                         | 0 to write or fix               |
| Annotation density (comment lines per code line)              | median 1.0; 0 examples below 1.0; 0 above 2.25 (of 78 code-bearing)                                                                                                                                  | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 0 to fix                        |
| Code fences                                                   | 161 fences; 0 code fences unanchored                                                                                                                                                                 | every code fence anchored or marked as an illustration (budget: at most 4 fences (install lines))                                                                                        | 0 to anchor                     |
| Lesson-to-file anchors (plan 05's method)                     | 78 path anchors (match 0, mismatch 78, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                                                               | every anchor matches its file                                                                                                                                                            | 78 to repair                    |
| Output blocks                                                 | 0 output fences; 0 unanchored                                                                                                                                                                        | every `**Output**` block anchored to an expected file                                                                                                                                    | 0 to anchor                     |
| Harness units                                                 | 78 example folders, 0 kata folders, 107 code files, 0 `run.yaml`                                                                                                                                     | 78 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | create 8, convert 79            |
| Drilling page                                                 | 696 words; 4 of 5 standard `##` sections exact; 6 `<details>` blocks; headings found: Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation and self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 4,304 words short; fix sections |
| Katas                                                         | 0 kata folders                                                                                                                                                                                       | at least 8 as `before`/`after` units                                                                                                                                                     | 8                               |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                               | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                                                | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X6** All 78 example headings are `##` (`## Example N: Title`); the convention needs `###`.
- **X3** 78 path anchors, all mismatching their files. A first sample shows the cause is whitespace: the lesson fence indents with 4 spaces, the source file with 2. The filler comments are in both.
- **X14** Filler comments: "=> this line is part of the complete runnable program" appears 194 times and a second template line 165 times.
- **X18** Example 3 is titled "Clang Compiles the Same Program" and uses `cc`; the catalog has GCC 16 and no Clang. The overview says GCC 15.
- **X11** Drilling is 696 words (five sections, thin), the learning overview is 115 words; 0 kata units.
- **X13** Words 21,567 against the 28,000 floor, a gap of 6,433. 13 Makefiles.

## Fixes and design

- Rewrite the filler as real `// =>` annotations in the source files, then run `examples sync --write` so the lessons match the files.
- Rewrite Example 3 to GCC (`gcc -std=c17`) and say in prose that Clang compiles the same source; no Clang toolchain is added (decision D5).
- Raise the heading level, expand drilling and the learning overview, write 8 katas.
- Warnings are part of the lesson: `-Wall -Wextra -pedantic` output goes to stderr and is recorded in an expected stderr file, or the example is warning-clean and expects empty stderr.
- Make is in the `gcc` image; Phase 1 spike SP4 confirms it and checks `cmake`, which the C++ course also needs.

## Harness mode and toolchain

- **Harness mode**: Real mode, `gcc`.
- **Toolchain ids**: gcc (C17, Make).
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP4 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: At most 4 fences (install lines).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 4.0 s per container invocation × 2 executions × 97 runs (78 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 12.9 minutes.

## Size class and sequencing

- **Size class M** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 6,433 (the larger of the word gap and the drilling shortfall), new unit folders 8.
- **Agent packets**: one packet per defect group plus one authoring packet for the word gap.
- **Wave 5**, slot 1. Makers and fixers for this course: `apps-ayokoding-www-primer-maker` for authoring gaps, `tutorial-primer-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `just-enough-cpp` (each is audited in a later wave, so this course is final first).

## Prerequisite re-check

- Plan 02 result: Plan 02 keeps both (the build scripts are shell, the C course is read after a first language, rule L1 and T1).
- In-plan prerequisites are audited first: `just-enough-python` in wave 1, `just-enough-bash` in wave 1.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-core-and-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `just-enough-c` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-primer-checker` over the course folder; compare its findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (M): one packet per defect group plus one authoring packet for the word gap. Classes: X3, X6, X11, X13, X14, X18.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `just-enough-c`; a course that fires is fixed, never baselined.
- [ ] Units: 78 example units, 8 kata units, 1 capstone unit (create 8, convert 79); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 4 fences (install lines).
- [ ] CP-3 `tutorial-primer-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `just-enough-c` exits 0 (at most 2 repair cycles).
- [ ] CP-6 The registry row for `just-enough-c` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit just-enough-c course` with explicit paths only: the course folder with its `_index.md`, the registry row.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/just-enough-c/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–26 (26): from "GCC Compiles a Source File" to "A #define Constant".
- **co-02 · intermediate** — examples 27–54 (28): from "Take an Address with &" to "Build Warning-Clean".
- **co-03 · advanced** — examples 55–78 (24): from "Allocate One int" to "Capstone: a Multi-File C Program".

## Lineage

- Prerequisite of Just Enough C++.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 8 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 10 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 11 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
