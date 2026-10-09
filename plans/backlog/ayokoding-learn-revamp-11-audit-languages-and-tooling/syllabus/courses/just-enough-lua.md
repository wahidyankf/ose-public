# Just Enough Lua (Primer)

**Course ID**: `just-enough-lua` · **Format**: Primer · **Family**: programming-languages.

**Scope note**: Audits and fixes the existing `just-enough-lua` course to the series definition of done and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. The neighbouring course `just-enough-nvim` keeps its own scope. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course.

**Short summary**: Lua for productive scripting and for Neovim configuration: values and tables, functions and closures, metatables, modules, error handling, coroutines, and the differences among Lua 5.1, LuaJIT, and Lua 5.5.

## Why this exists · the big idea

- **The problem before the solution**: All 87 path anchors disagree with their files, 23 "Why It Matters" blocks are too short, and 25 examples are over the density ceiling.
- **Keep-this-if-you-forget-everything**: Lua is small enough to hold in your head; each example runs on the declared runtime and says where Lua 5.1 or LuaJIT and Lua 5.5 differ.

## Prerequisites

- **Prior courses**: `just-enough-nvim` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: Primer (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Primer: 75 to 85 examples at By Example pace, the By Example parts and lengths, the layout `just-enough-<x>/learning/` with overview, example pages, `capstone/`, and `code/`, and a light consolidation capstone. The 84 examples are Lua scripts.
- **Wave**: 5 (slot 3); **size class**: S (words to write 0, new unit folders 0); **expected defect classes**: 5 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                                       | Target                                                                                                                                                                                   | Work                 |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 28,205                                                                                                                                                                                                | at least 28,000                                                                                                                                                                          | none                 |
| Examples as `### Example N: Title`                            | 84                                                                                                                                                                                                    | at least 75, numbered 1 to N without gaps                                                                                                                                                | none                 |
| Mermaid diagrams                                              | 8                                                                                                                                                                                                     | no count band (a diagram where it helps)                                                                                                                                                 | none required        |
| "Why It Matters" (50 to 100 words each)                       | 84 of 84 present; 23 under 50 words; 1 over 100; median 55 words                                                                                                                                      | one per example, 50 to 100 words                                                                                                                                                         | 24 to write or fix   |
| Annotation density (comment lines per code line)              | median 1.58; 0 examples below 1.0; 25 above 2.25 (of 84 code-bearing)                                                                                                                                 | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 25 to fix            |
| Code fences                                                   | 230 fences; 10 code fences unanchored                                                                                                                                                                 | every code fence anchored or marked as an illustration (budget: at most 2 fences)                                                                                                        | 10 to anchor         |
| Lesson-to-file anchors (plan 05's method)                     | 87 path anchors (match 0, mismatch 87, missing 0); 18 labelled anchors (match 2, mismatch 16, missing 0)                                                                                              | every anchor matches its file                                                                                                                                                            | 103 to repair        |
| Output blocks                                                 | 93 output fences; 93 unanchored                                                                                                                                                                       | every `**Output**` block anchored to an expected file                                                                                                                                    | 93 to anchor         |
| Harness units                                                 | 84 example folders, 8 kata folders, 105 code files, 0 `run.yaml`                                                                                                                                      | 84 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | create 0, convert 93 |
| Drilling page                                                 | 6,779 words; 5 of 5 standard `##` sections exact; 45 `<details>` blocks; headings found: Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | words ok             |
| Katas                                                         | 8 kata folders                                                                                                                                                                                        | at least 8 as `before`/`after` units                                                                                                                                                     | 0                    |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                                | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                                                | recompute            |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X1** 105 Lua files in 84 example folders, 8 kata folders, and a capstone folder, with no `run.yaml`.
- **X3** 87 path anchors (all mismatch) and 18 labelled anchors (2 match, 16 mismatch); 10 fences unanchored; 93 `Output` blocks unanchored.
- **X8** 23 "Why It Matters" blocks under 50 words (median 55) and 1 over 100.
- **X9** 25 examples are above the density ceiling (median 1.58).
- **X18** The prose mentions Lua 5.1, LuaJIT, and Lua 5.5; the harness must say which runtime each example ran on.

## Fixes and design

- Declare the runtime in each unit's `run.yaml` (`luajit` by default because Neovim embeds a LuaJIT-compatible runtime, `lua` 5.5 where the lesson is about 5.5 behaviour, `neovim` where it calls `vim.*`).
- Read each of the 103 mismatch diffs to find the dominant cause before repairing with `examples sync --write`; trim the 25 over-dense examples.
- Words are above the floor (28,205). The work is wiring and repair, not authoring.

## Harness mode and toolchain

- **Harness mode**: Real mode, `luajit`, `lua`, and `neovim`.
- **Toolchain ids**: luajit by default, neovim for `vim.*` units, lua 5.5 for version-difference units.
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP17 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: At most 2 fences.
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 1.0 s per container invocation × 2 executions × 103 runs (84 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 3.4 minutes.

## Size class and sequencing

- **Size class S** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 0 (the larger of the word gap and the drilling shortfall), new unit folders 0.
- **Agent packets**: one packet per defect group (mechanical fixes, then prose fixes); no page split.
- **Wave 5**, slot 3. Makers and fixers for this course: `apps-ayokoding-www-primer-maker` for authoring gaps, `tutorial-primer-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `capstone-forge-ready`, `extending-neovim` (each is audited in a later wave, so this course is final first).

## Prerequisite re-check

- Plan 02 result: Plan 02 keeps `just-enough-nvim` under T3 (the course uses `vim.*` throughout).
- In-plan prerequisites are audited first: `just-enough-nvim` in wave 2.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-core-and-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `just-enough-lua` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-primer-checker` over the course folder; compare its findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (S): one packet per defect group (mechanical fixes, then prose fixes); no page split. Classes: X1, X3, X8, X9, X18.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `just-enough-lua`; a course that fires is fixed, never baselined.
- [ ] Units: 84 example units, 8 kata units, 1 capstone unit (create 0, convert 93); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 2 fences.
- [ ] CP-3 `tutorial-primer-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `just-enough-lua` exits 0 (at most 2 repair cycles).
- [ ] CP-6 The registry row for `just-enough-lua` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit just-enough-lua course` with explicit paths only: the course folder with its `_index.md`, the registry row.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/just-enough-lua/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Plan 05's layout survey (2026-10-09) found the course mentioning Lua 5.1, LuaJIT, and Lua 5.5; the catalog has `lua` 5.5.1 and `luajit` v2.1, so each unit declares which runtime it runs on.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–26 (26): from "Hello World Print" to "Functions Returning Multiple Values".
- **co-02 · intermediate** — examples 27–58 (32): from "Varargs -- a Basic Sum Function" to "error() with a Message, Caught by pcall()".
- **co-03 · advanced** — examples 59–84 (26): from "error() Can Raise ANY Value, Not Just a String" to "vim.split -- Splitting a String on a Separator".

## Lineage

- Prerequisite of Extending Neovim.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 2 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 2 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 2 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
