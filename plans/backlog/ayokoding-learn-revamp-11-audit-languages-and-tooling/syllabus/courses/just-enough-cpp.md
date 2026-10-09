# Just Enough C++ (Primer)

**Course ID**: `just-enough-cpp` · **Format**: Primer · **Family**: programming-languages.

**Scope note**: Audits and fixes the existing `just-enough-cpp` course to the series definition of done and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. The neighbouring course `just-enough-c` keeps its own scope. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course.

**Short summary**: The productive delta from C to modern C++17: RAII, references and const contracts, classes, the STL, templates, smart pointers, exceptions, and the CMake-and-compiler loop.

## Why this exists · the big idea

- **The problem before the solution**: No "Why It Matters" blocks, 77 of 80 fences unanchored, 93 filler comments, and an 89-word learning overview.
- **Keep-this-if-you-forget-everything**: Modern C++ (C++17) is taught as small complete programs that use RAII and the standard library, each compiled warning-clean.

## Prerequisites

- **Prior courses**: `just-enough-c` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: Primer (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Primer: 75 to 85 examples at By Example pace, the By Example parts and lengths, the layout `just-enough-<x>/learning/` with overview, example pages, `capstone/`, and `code/`, and a light consolidation capstone. The 75 examples are independent C++17 programs.
- **Wave**: 7 (slot 3); **size class**: M (words to write 4,587, new unit folders 9); **expected defect classes**: 5 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                                      | Target                                                                                                                                                                                   | Work                            |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 24,759                                                                                                                                                                                               | at least 28,000                                                                                                                                                                          | 3,241 to write                  |
| Examples as `### Example N: Title`                            | 75                                                                                                                                                                                                   | at least 75, numbered 1 to N without gaps                                                                                                                                                | none                            |
| Mermaid diagrams                                              | 3                                                                                                                                                                                                    | no count band (a diagram where it helps)                                                                                                                                                 | none required                   |
| "Why It Matters" (50 to 100 words each)                       | none of 75 examples has one                                                                                                                                                                          | one per example, 50 to 100 words                                                                                                                                                         | 75 to write                     |
| Annotation density (comment lines per code line)              | median 1.0; 0 examples below 1.0; 0 above 2.25 (of 75 code-bearing)                                                                                                                                  | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 0 to fix                        |
| Code fences                                                   | 80 fences; 77 code fences unanchored                                                                                                                                                                 | every code fence anchored or marked as an illustration (budget: at most 6 fences (cmake and install lines))                                                                              | 77 to anchor                    |
| Lesson-to-file anchors (plan 05's method)                     | 0 path anchors (match 0, mismatch 0, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                                                                 | every anchor matches its file                                                                                                                                                            | 0 to repair                     |
| Output blocks                                                 | 0 output fences; 0 unanchored                                                                                                                                                                        | every `**Output**` block anchored to an expected file                                                                                                                                    | 0 to anchor                     |
| Harness units                                                 | 75 example folders, 0 kata folders, 90 code files, 0 `run.yaml`                                                                                                                                      | 75 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | create 9, convert 75            |
| Drilling page                                                 | 413 words; 4 of 5 standard `##` sections exact; 8 `<details>` blocks; headings found: Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation and self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 4,587 words short; fix sections |
| Katas                                                         | 0 kata folders                                                                                                                                                                                       | at least 8 as `before`/`after` units                                                                                                                                                     | 8                               |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                               | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                                                | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X7** No "Why It Matters" blocks (0 of 75); 77 of 80 fences are unanchored.
- **X14** Filler comments in the code: the line "=> <name>: this line establishes the runnable C++ state or behavior." appears 75 times and another template 18 times.
- **X11** Drilling is 413 words and the learning overview 89 words; 0 kata units.
- **X17** Sanitizers: the overview recommends `-fsanitize=address,undefined`. LeakSanitizer needs `ptrace`, which `--cap-drop ALL` removes. Three units (ex-51, ex-68, capstone) use `cmake`, which the `gcc` image may lack.
- **X13** Words 24,759, a gap of 3,241.
- **Filler guard (plan 09, owner `plan-11`)**: fires FG3 and FG6 on 2026-10-09 (near-duplicate share 0.95; repeated-paragraph share 0.67). The course must stop firing every rule, and its entry leaves `FILLER_BASELINE` (and the cap falls by one) in the same commit as the course ([tech-docs/007](../../tech-docs/007-testing-strategy.md#the-filler-baseline-ratchet)).

## Fixes and design

- Replace the filler with real annotations in the source files, write 75 "Why It Matters" blocks, anchor all fences, write drilling and katas.
- AddressSanitizer examples run with `ASAN_OPTIONS=detect_leaks=0` set in the unit's `env`, and the lesson says leak detection is off in the harness (spike SP4).
- CMake units: if the `gcc` image has `cmake`, keep them; if not, rewrite the three units as Makefile builds that teach the same target-and-library idea, and show the CMake files as illustrations (decision D5).
- Single-file units compile with `g++ -std=c++17` in about 6 planning seconds; keep each program to one source file where the lesson allows.

## Harness mode and toolchain

- **Harness mode**: Real mode, `gcc`.
- **Toolchain ids**: gcc (C++17, Make, CMake only if present).
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP4 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: At most 6 fences (CMake and install lines).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 6.0 s per container invocation × 2 executions × 94 runs (75 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 18.8 minutes.

## Size class and sequencing

- **Size class M** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 4,587 (the larger of the word gap and the drilling shortfall), new unit folders 9.
- **Agent packets**: one packet per defect group plus one authoring packet for the word gap.
- **Wave 7**, slot 3. Makers and fixers for this course: `apps-ayokoding-www-primer-maker` for authoring gaps, `tutorial-primer-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 result: Kept; the hard prerequisite is named in the overview.
- In-plan prerequisites are audited first: `just-enough-c` in wave 5.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-core-and-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `just-enough-cpp` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-primer-checker` over the course folder; compare its findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (M): one packet per defect group plus one authoring packet for the word gap. Classes: X7, X11, X13, X14, X17.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `just-enough-cpp`; a course that fires is fixed, never baselined.
- [ ] Units: 75 example units, 8 kata units, 1 capstone unit (create 9, convert 75); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 6 fences (cmake and install lines).
- [ ] CP-3 `tutorial-primer-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `just-enough-cpp` exits 0 (at most 2 repair cycles).
- [ ] CP-6 The registry row for `just-enough-cpp` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit just-enough-cpp course` with explicit paths only: the course folder with its `_index.md`, the registry row. Delete the `just-enough-cpp` entry from `FILLER_BASELINE` and lower `FILLER_BASELINE_CAP` by one in the same commit; `course-filler.steps.ts` stays green without the entry.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/just-enough-cpp/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–24 (24): from "Compile with g++" to "Split a header and source".
- **co-02 · intermediate** — examples 25–50 (26): from "Write a function template" to "Run a sanitizer-safe program".
- **co-03 · advanced** — examples 51–75 (25): from "Build a library and executable with CMake" to "Borrow text with string_view".

## Lineage

- Builds on Just Enough C.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 18 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 12 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 12 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
