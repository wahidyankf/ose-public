# Building Production CLI Tools (By Example)

**Course ID**: `building-production-cli-tools` · **Format**: By Example · **Family**: tools-and-practices.

**Scope note**: Audits and fixes the existing `building-production-cli-tools` course to the series definition of done and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. The neighbouring courses `just-enough-go`, `just-enough-rust` keep their own scope. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course.

**Short summary**: CLI tools as contracts for people and automation: discoverable commands, data on stdout and diagnostics on stderr, useful exit codes, configuration precedence, TTY behaviour, tests, and release artifacts, taught with paired Go and Rust programs.

## Why this exists · the big idea

- **The problem before the solution**: None of the 78 examples says why it matters, annotation is almost absent, and 78 of 81 fences are not tied to their files.
- **Keep-this-if-you-forget-everything**: A command-line tool is a contract with people and with scripts: each example shows one rule of that contract in Go or Rust, annotated, runnable, with its output.

## Prerequisites

- **Prior courses**: `just-enough-go`, `just-enough-rust` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Seventy-eight paired Go and Rust examples show one design lesson at a time (streams, exit codes, configuration precedence, TTY behaviour, tests, release artifacts). Each is a rule that a reader can run and break.
- **Wave**: 6 (slot 3); **size class**: L (words to write 17,236, new unit folders 8); **expected defect classes**: 7 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                                      | Target                                                                                                                                                                                   | Work                            |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 10,764                                                                                                                                                                                               | at least 28,000                                                                                                                                                                          | 17,236 to write                 |
| Examples as `### Example N: Title`                            | 78                                                                                                                                                                                                   | at least 75, numbered 1 to N without gaps                                                                                                                                                | none                            |
| Mermaid diagrams                                              | 0                                                                                                                                                                                                    | 30 to 50 (adapter band)                                                                                                                                                                  | 30 to add                       |
| "Why It Matters" (50 to 100 words each)                       | none of 78 examples has one                                                                                                                                                                          | one per example, 50 to 100 words                                                                                                                                                         | 78 to write                     |
| Annotation density (comment lines per code line)              | median 0.0; 78 examples below 1.0; 0 above 2.25 (of 78 code-bearing)                                                                                                                                 | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 78 to fix                       |
| Code fences                                                   | 81 fences; 78 code fences unanchored                                                                                                                                                                 | every code fence anchored or marked as an illustration (budget: at most 6 fences (install and release commands))                                                                         | 78 to anchor                    |
| Lesson-to-file anchors (plan 05's method)                     | 2 path anchors (match 0, mismatch 2, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                                                                 | every anchor matches its file                                                                                                                                                            | 2 to repair                     |
| Output blocks                                                 | 0 output fences; 0 unanchored                                                                                                                                                                        | every `**Output**` block anchored to an expected file                                                                                                                                    | 0 to anchor                     |
| Harness units                                                 | 78 example folders, 0 kata folders, 82 code files, 0 `run.yaml`                                                                                                                                      | 78 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | create 8, convert 79            |
| Drilling page                                                 | 516 words; 4 of 5 standard `##` sections exact; 3 `<details>` blocks; headings found: Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation and self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 4,484 words short; fix sections |
| Katas                                                         | 0 kata folders                                                                                                                                                                                       | at least 8 as `before`/`after` units                                                                                                                                                     | 8                               |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                               | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                                                | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X3** 78 of 81 code fences are unanchored and the 2 path anchors both mismatch their files.
- **X7** No "Why It Matters" at all (0 of 78) and no `## Examples by Level` heading in the learning overview (CRITICAL if absent).
- **X9** Annotation density has a median of 0.0 comment lines per code line (all 78 below the 1.0 floor) and only 10 of 80 fences use `// =>`.
- **X1** 82 code files (Go 45, Rust 36, shell 1) with no `run.yaml`; 0 kata units; the capstone folder has code but no unit.
- **X16** Cobra (Go) and clap (Rust) need lockfiles with hashes (`go.sum`, `Cargo.lock`).
- **X11** Drilling is 516 words; X13 words 10,764, a gap of 17,236.
- **X20** No Mermaid diagram at all against the 30 to 50 band for By Example (0 of 78 examples).
- **Filler guard (plan 09, owner `plan-11`)**: fires FG6 on 2026-10-09 (repeated-paragraph share 0.49 against the limit 0.25). The course must stop firing every rule, and its entry leaves `FILLER_BASELINE` (and the cap falls by one) in the same commit as the course ([tech-docs/007](../../tech-docs/007-testing-strategy.md#the-filler-baseline-ratchet)).

## Fixes and design

- Annotate every example to the density band with `=>` notation, write 78 "Why It Matters" paragraphs, add the `## Examples by Level` section, anchor all fences, and expand drilling and the capstone page.
- One unit per example, the Go or Rust toolchain per unit (never both in one unit), lockfiles for cobra and clap inside the course, 8 katas.
- Rust units that use only the standard library compile with `rustc` (planning 7 s); a unit that uses clap compiles with `cargo build --offline` after an environment image bakes the locked crates. Cost is the main CI risk of this course; see tech-docs/004.
- TTY behaviour examples run with a pseudo-terminal absent: the lesson shows the non-TTY branch the harness can run and states the TTY branch in prose.

## Harness mode and toolchain

- **Harness mode**: Real mode, `go` and `rust`; 78 example units, 8 kata units, 1 capstone unit.
- **Toolchain ids**: go and rust (standard library first; cobra and clap locked).
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP11 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: At most 6 fences (install and release commands).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 7.0 s per container invocation × 2 executions × 98 runs (78 examples + 2 × 8 kata runs + 4 capstone runs) ≈ 22.9 minutes.

## Size class and sequencing

- **Size class L** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 17,236 (the larger of the word gap and the drilling shortfall), new unit folders 8.
- **Agent packets**: authoring split by learning page (one packet per page), then one packet per remaining defect group.
- **Wave 6**, slot 3. Makers and fixers for this course: `apps-ayokoding-www-by-example-maker` for authoring gaps, `tutorial-by-example-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 result: Both primers are in this plan and are audited in wave 2, before this course (wave 6).
- In-plan prerequisites are audited first: `just-enough-go` in wave 1, `just-enough-rust` in wave 2.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-core-and-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `building-production-cli-tools` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder; compare its findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (L): authoring split by learning page (one packet per page), then one packet per remaining defect group. Classes: X1, X3, X7, X9, X11, X16, X20.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `building-production-cli-tools`; a course that fires is fixed, never baselined.
- [ ] Units: 78 example units, 8 kata units, 1 capstone unit (create 8, convert 79); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 6 fences (install and release commands).
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `building-production-cli-tools` exits 0 (at most 2 repair cycles).
- [ ] CP-6 The registry row for `building-production-cli-tools` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit building-production-cli-tools course` with explicit paths only: the course folder with its `_index.md`, the registry row. Delete the `building-production-cli-tools` entry from `FILLER_BASELINE` and lower `FILLER_BASELINE_CAP` by one in the same commit; `course-filler.steps.ts` stays green without the entry.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/building-production-cli-tools/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–26 (26): from "Go Hello CLI" to "Build a Go Binary".
- **co-02 · intermediate** — examples 27–54 (28): from "Load a Config File" to "Snapshot Help Text".
- **co-03 · advanced** — examples 55–78 (24): from "Cross-Compile Go" to "Preview the Production CLI Capstone".

## Lineage

- Follows the Go and Rust primers; feeds the release material in the CI/CD course.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 25 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 24 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 22 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
