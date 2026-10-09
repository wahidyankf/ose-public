# Just Enough Go (Primer)

**Course ID**: `just-enough-go` · **Format**: Primer · **Family**: programming-languages.

**Scope note**: Audits and fixes the existing `just-enough-go` course to the series definition of done and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course.

**Short summary**: Go before CSP-style concurrency: packages, values, functions, collections, interfaces, error values, JSON, generics, idiomatic tooling, tests, and cancellation, with only a concurrency preview.

## Why this exists · the big idea

- **The problem before the solution**: Filler comments appear 116 and 102 times, there is no "Why It Matters", 81 fences are unanchored, and the learning overview is 39 words.
- **Keep-this-if-you-forget-everything**: Go's surface is small and explicit: each example is one `main.go` with its output.

## Prerequisites

- **Prior courses**: none (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: Primer (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Primer: 75 to 85 examples at By Example pace, the By Example parts and lengths, the layout `just-enough-<x>/learning/` with overview, example pages, `capstone/`, and `code/`, and a light consolidation capstone. The 78 examples run with `go run main.go`.
- **Wave**: 1 (slot 3); **size class**: M (words to write 8,799, new unit folders 3); **expected defect classes**: 6 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                                      | Target                                                                                                                                                                                   | Work                            |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 19,201                                                                                                                                                                                               | at least 28,000                                                                                                                                                                          | 8,799 to write                  |
| Examples as `### Example N: Title`                            | 78                                                                                                                                                                                                   | at least 75, numbered 1 to N without gaps                                                                                                                                                | none                            |
| Mermaid diagrams                                              | 0                                                                                                                                                                                                    | no count band (a diagram where it helps)                                                                                                                                                 | none required                   |
| "Why It Matters" (50 to 100 words each)                       | none of 78 examples has one                                                                                                                                                                          | one per example, 50 to 100 words                                                                                                                                                         | 78 to write                     |
| Annotation density (comment lines per code line)              | median 1.55; 19 examples below 1.0; 0 above 2.25 (of 78 code-bearing)                                                                                                                                | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 19 to fix                       |
| Code fences                                                   | 81 fences; 81 code fences unanchored                                                                                                                                                                 | every code fence anchored or marked as an illustration (budget: at most 3 fences)                                                                                                        | 81 to anchor                    |
| Lesson-to-file anchors (plan 05's method)                     | 0 path anchors (match 0, mismatch 0, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                                                                 | every anchor matches its file                                                                                                                                                            | 0 to repair                     |
| Output blocks                                                 | 0 output fences; 0 unanchored                                                                                                                                                                        | every `**Output**` block anchored to an expected file                                                                                                                                    | 0 to anchor                     |
| Harness units                                                 | 78 example folders, 5 kata folders, 99 code files, 0 `run.yaml`                                                                                                                                      | 78 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | create 3, convert 84            |
| Drilling page                                                 | 345 words; 4 of 5 standard `##` sections exact; 7 `<details>` blocks; headings found: Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation and self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 4,655 words short; fix sections |
| Katas                                                         | 5 kata folders                                                                                                                                                                                       | at least 8 as `before`/`after` units                                                                                                                                                     | 3                               |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                               | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                                                | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X7** No "Why It Matters" blocks (0 of 78); 81 of 81 fences are unanchored.
- **X14** Filler comments appear 116 and 102 times.
- **X9** 19 of 78 examples are under the density floor (median 1.55).
- **X11** Drilling is 345 words and the learning overview 39 words; 5 katas of 8.
- **X13** Words 19,201, a gap of 8,799.
- **X1** 99 files (94 `.go`) in 78 example folders, 5 kata folders, and a capstone folder, with no `run.yaml`.
- **Filler guard (plan 09, owner `plan-11`)**: fires FG6 on 2026-10-09 (repeated-paragraph share 0.55 against the limit 0.25; near-duplicate share 0.37). The course must stop firing every rule, and its entry leaves `FILLER_BASELINE` (and the cap falls by one) in the same commit as the course ([tech-docs/007](../../tech-docs/007-testing-strategy.md#the-filler-baseline-ratchet)).

## Fixes and design

- Replace the filler with real annotations in the source, write the "Why It Matters" blocks, anchor fences, expand drilling, add 3 katas.
- Concurrency previews sort results by ID and use `testing/synctest` or channels with fixed order; `go test -race -count=1` runs as `kind: test` with `stdout: ignore`.
- Each unit is its own module with `go.mod`; no dependencies, so no lockfile.

## Harness mode and toolchain

- **Harness mode**: Real mode, `go`.
- **Toolchain ids**: go (1.27; standard library only).
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP11 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: At most 3 fences.
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 6.0 s per container invocation × 2 executions × 97 runs (78 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 19.4 minutes.

## Size class and sequencing

- **Size class M** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 8,799 (the larger of the word gap and the drilling shortfall), new unit folders 3.
- **Agent packets**: one packet per defect group plus one authoring packet for the word gap.
- **Wave 1**, slot 3. Makers and fixers for this course: `apps-ayokoding-www-primer-maker` for authoring gaps, `tutorial-primer-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `building-production-cli-tools` (each is audited in a later wave, so this course is final first).

## Prerequisite re-check

- Plan 02 result: No prerequisites, as before.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-core-and-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `just-enough-go` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-primer-checker` over the course folder; compare its findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (M): one packet per defect group plus one authoring packet for the word gap. Classes: X1, X7, X9, X11, X13, X14.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `just-enough-go`; a course that fires is fixed, never baselined.
- [ ] Units: 78 example units, 8 kata units, 1 capstone unit (create 3, convert 84); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 3 fences.
- [ ] CP-3 `tutorial-primer-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `just-enough-go` exits 0 (at most 2 repair cycles).
- [ ] CP-6 The registry row for `just-enough-go` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit just-enough-go course` with explicit paths only: the course folder with its `_index.md`, the registry row. Delete the `just-enough-go` entry from `FILLER_BASELINE` and lower `FILLER_BASELINE_CAP` by one in the same commit; `course-filler.steps.ts` stays green without the entry.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/just-enough-go/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–26 (26): from "Hello World and Run" to "Observe Defer LIFO Order".
- **co-02 · intermediate** — examples 27–54 (28): from "Compare an Array and Slice" to "Marshal Struct Tags".
- **co-03 · advanced** — examples 55–78 (24): from "Round-Trip JSON" to "Time Out a Context".

## Lineage

- Prerequisite of Building Production CLI Tools and of the Go concurrency course.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 11 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 11 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 17 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
