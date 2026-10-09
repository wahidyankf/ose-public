# Debugging and Profiling (By Example)

**Course ID**: `debugging-and-profiling` · **Format**: By Example · **Family**: tools-and-practices.

**Scope note**: Audits and fixes the existing `debugging-and-profiling` course to the series definition of done and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. The neighbouring courses `software-testing`, `just-enough-python`, `just-enough-bash` keep their own scope. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course.

**Short summary**: Debugging and profiling as method: reading failures, reproducing bugs, `pdb` and `debugpy`, logging and tracing, `cProfile`, `tracemalloc`, sampling profilers, flame graphs, native and systems tools, and bisecting regressions.

## Why this exists · the big idea

- **The problem before the solution**: The course is large and mostly sound, but 120 unanchored fences, wall-clock outputs, and profilers that need privileges mean no machine can check it yet.
- **Keep-this-if-you-forget-everything**: Debugging is a method: every technique runs on a deterministic bug, and a tool the harness cannot run is taught through a model of what it reports.

## Prerequisites

- **Prior courses**: `software-testing`, `just-enough-python`, `just-enough-bash` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Eighty examples already pair a deliberately faulty program with the technique that finds the fault. Each technique is a rule a reader can run on a bug.
- **Wave**: 8 (slot 1); **size class**: S (words to write 13, new unit folders 8); **expected defect classes**: 6 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                         | Target                                                                                                                                                                                   | Work                         |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 78,115                                                                                                                                                  | at least 28,000                                                                                                                                                                          | none                         |
| Examples as `### Example N: Title`                            | 80                                                                                                                                                      | at least 75, numbered 1 to N without gaps                                                                                                                                                | none                         |
| Mermaid diagrams                                              | 32                                                                                                                                                      | 30 to 50 (adapter band)                                                                                                                                                                  | none                         |
| "Why It Matters" (50 to 100 words each)                       | 80 of 80 present; 0 under 50 words; 0 over 100; median 77 words                                                                                         | one per example, 50 to 100 words                                                                                                                                                         | 0 to write or fix            |
| Annotation density (comment lines per code line)              | median 1.07; 4 examples below 1.0; 0 above 2.25 (of 78 code-bearing)                                                                                    | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 4 to fix                     |
| Code fences                                                   | 247 fences; 120 code fences unanchored                                                                                                                  | every code fence anchored or marked as an illustration (budget: at most 24 fences (`py-spy`, `perf`, `gdb`, `lldb` launch lines))                                                        | 120 to anchor                |
| Lesson-to-file anchors (plan 05's method)                     | 0 path anchors (match 0, mismatch 0, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                    | every anchor matches its file                                                                                                                                                            | 0 to repair                  |
| Output blocks                                                 | 92 output fences; 92 unanchored                                                                                                                         | every `**Output**` block anchored to an expected file                                                                                                                                    | 92 to anchor                 |
| Harness units                                                 | 80 example folders, 0 kata folders, 154 code files, 0 `run.yaml`                                                                                        | 80 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | create 8, convert 81         |
| Drilling page                                                 | 4,987 words; 4 of 5 standard `##` sections exact; 36 `<details>` blocks; headings found: Recall Q&A, Applied problems, Code katas, Self-check checklist | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 13 words short; fix sections |
| Katas                                                         | 0 kata folders                                                                                                                                          | at least 8 as `before`/`after` units                                                                                                                                                     | 8                            |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                  | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                                                | recompute                    |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X1** 154 code files in 80 example folders and a capstone folder, no `run.yaml`; no `drilling/code/` although the drilling page has a Code katas section.
- **X3** 120 of 247 fences are unanchored, there are no anchors at all, and 92 `Output` blocks are unanchored.
- **X11** Drilling is 4,987 words (13 under the 5,000 floor) with four of the five standard sections; Elaborative interrogation is missing.
- **X15** Clock use in 13 files, threads in 31, network use in 8; `cProfile`, `tracemalloc`, and `py-spy` outputs carry timings and addresses.
- **X17** `py-spy`, `perf`, `gdb`, and `lldb` need `ptrace` or perf events, which `--cap-drop ALL` removes (the `native-and-systems` page has 18 examples).
- **X9** Four examples are under the density floor (median 1.07).

## Fixes and design

- Make output deterministic by invariants or normalized fields (counts, call names, never seconds); fixed seeds; virtual clocks.
- Anchor all 120 fences and 92 outputs; write 8 katas; add the Elaborative interrogation section and bring drilling over 5,000 words.
- For profilers that need privileges, teach the idea with a deterministic Python model (call counts, a collapsed-stack file) and mark only the tool launch lines as illustrations (spike SP14).
- `debugpy` is hash-locked and listens on loopback, which the harness allows; the unit connects to itself in-process.
- `git bisect` examples run in the `shell` toolchain with a pure-bash test script and fixed `GIT_*_DATE` values (spike SP10); the Python examples run in `python`.

## Harness mode and toolchain

- **Harness mode**: Real mode, `python` for most units and `shell` for bisect units; 80 example units, 8 kata units, 1 capstone unit.
- **Toolchain ids**: python (debugpy, hypothesis locked), shell for git bisect.
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP10, SP14 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: At most 24 fences (`py-spy`, `perf`, `gdb`, `lldb` launch lines).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 2.5 s per container invocation × 2 executions × 99 runs (80 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 8.2 minutes.

## Size class and sequencing

- **Size class S** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 13 (the larger of the word gap and the drilling shortfall), new unit folders 8.
- **Agent packets**: one packet per defect group (mechanical fixes, then prose fixes); no page split.
- **Wave 8**, slot 1. Makers and fixers for this course: `apps-ayokoding-www-by-example-maker` for authoring gaps, `tutorial-by-example-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 result: Plan 02 adds `just-enough-python` and `just-enough-bash` to the existing `software-testing` edge; all three are in this plan and are audited first.
- In-plan prerequisites are audited first: `software-testing` in wave 4, `just-enough-python` in wave 1, `just-enough-bash` in wave 1.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-core-and-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `debugging-and-profiling` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder; compare its findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (S): one packet per defect group (mechanical fixes, then prose fixes); no page split. Classes: X1, X3, X9, X11, X15, X17.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `debugging-and-profiling`; a course that fires is fixed, never baselined.
- [ ] Units: 80 example units, 8 kata units, 1 capstone unit (create 8, convert 81); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 24 fences (`py-spy`, `perf`, `gdb`, `lldb` launch lines).
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `debugging-and-profiling` exits 0 (at most 2 repair cycles).
- [ ] CP-6 The registry row for `debugging-and-profiling` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit debugging-and-profiling course` with explicit paths only: the course folder with its `_index.md`, the registry row.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/debugging-and-profiling/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–27 (27): from "First Breakpoint with breakpoint()" to "Before/After Timing a One-Line Fix".
- **co-02 · intermediate** — examples 28–49 (22): from "Profiling Two Ways -- Sampling and Instrumenting" to "Profiling Under Concurrent Load".
- **co-03 · advanced** — examples 50–62 (13): from "pdb's interact Mode" to "Delta-Debugging a 10,000-Line Crash".
- **co-04 · native-and-systems** — examples 63–80 (18): from "gdb Attach to CPython -- a Real Limitation" to "A Low-Overhead Tracer with sys.monitoring".

## Lineage

- Follows Software Testing: testing finds that something is wrong, this course finds why.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 52 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 51 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 50 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
