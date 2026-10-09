# Extending Neovim (By Example)

**Course ID**: `extending-neovim` · **Format**: By Example · **Family**: tools-and-practices.

**Scope note**: Audits and fixes the existing `extending-neovim` course to the series definition of done and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. The neighbouring courses `just-enough-lua`, `just-enough-nvim` keep their own scope. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course.

**Short summary**: Writing a Neovim configuration in Lua: options and keymaps, autocommands, user commands, the built-in `vim.pack` plugin manager, LSP, Treesitter, and a capstone configuration, taught as 80 examples with 8 katas.

## Why this exists · the big idea

- **The problem before the solution**: 89 of the 90 path anchors disagree with their files, and the recorded transcripts name an older Neovim than the one the harness runs.
- **Keep-this-if-you-forget-everything**: Every configuration piece is a unit that runs headless, and the lesson quotes its output exactly.

## Prerequisites

- **Prior courses**: `just-enough-lua`, `just-enough-nvim` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Eighty examples already build a Neovim configuration piece by piece: options, keymaps, autocommands, user commands, and plugins. Each piece is a rule that can be run headless and broken.
- **Wave**: 8 (slot 2); **size class**: S (words to write 0, new unit folders 0); **expected defect classes**: 5 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                                       | Target                                                                                                                                                                                   | Work                 |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 34,423                                                                                                                                                                                                | at least 28,000                                                                                                                                                                          | none                 |
| Examples as `### Example N: Title`                            | 80                                                                                                                                                                                                    | at least 75, numbered 1 to N without gaps                                                                                                                                                | none                 |
| Mermaid diagrams                                              | 36                                                                                                                                                                                                    | 30 to 50 (adapter band)                                                                                                                                                                  | none                 |
| "Why It Matters" (50 to 100 words each)                       | 80 of 80 present; 5 under 50 words; 0 over 100; median 65 words                                                                                                                                       | one per example, 50 to 100 words                                                                                                                                                         | 5 to write or fix    |
| Annotation density (comment lines per code line)              | median 1.0; 0 examples below 1.0; 0 above 2.25 (of 69 code-bearing)                                                                                                                                   | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 0 to fix             |
| Code fences                                                   | 238 fences; 8 code fences unanchored                                                                                                                                                                  | every code fence anchored or marked as an illustration (budget: at most 8 fences)                                                                                                        | 8 to anchor          |
| Lesson-to-file anchors (plan 05's method)                     | 90 path anchors (match 1, mismatch 89, missing 0); 16 labelled anchors (match 0, mismatch 16, missing 0)                                                                                              | every anchor matches its file                                                                                                                                                            | 105 to repair        |
| Output blocks                                                 | 84 output fences; 84 unanchored                                                                                                                                                                       | every `**Output**` block anchored to an expected file                                                                                                                                    | 84 to anchor         |
| Harness units                                                 | 80 example folders, 8 kata folders, 322 code files, 0 `run.yaml`                                                                                                                                      | 80 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | create 0, convert 89 |
| Drilling page                                                 | 6,077 words; 5 of 5 standard `##` sections exact; 45 `<details>` blocks; headings found: Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | words ok             |
| Katas                                                         | 8 kata folders                                                                                                                                                                                        | at least 8 as `before`/`after` units                                                                                                                                                     | 0                    |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                                | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                                                | recompute            |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X1** 322 code files (Lua 205, text 111) in 80 example folders, 8 kata folders, and a capstone folder, with no `run.yaml`.
- **X3** Anchors: 90 path anchors (1 matches, 89 mismatch their file) and 16 labelled anchors (all mismatch); 8 fences unanchored; 84 `Output` blocks unanchored.
- **X8** 5 of 80 "Why It Matters" blocks are under 50 words (median 65).
- **X15** 33 files use the network through `vim.pack.add` of GitHub URLs.
- **X18** The recorded transcripts say Neovim v0.12.3 and the overview says v0.12.4; the catalog pins 0.12.5, so every transcript is re-recorded (`:checkhealth` output cannot be reproduced and becomes prose).

## Fixes and design

- Diagnose the dominant cause of the 105 mismatches before editing (likely tab-versus-space display copies, as the forge-ready page also says), then repair with `examples sync --write` after reading each diff.
- Plugin examples: local fixture repositories addressed with `file://` URLs if the `neovim` image has `git` (spike SP2); otherwise the plugin step is a stub seam and the install line a launch illustration.
- Headless runs use `nvim --headless -u NONE -i NONE -n` plus the unit's own `init.lua`; output comes from `print` or `io.stdout:write`, never from the UI.
- A unit that needs `git` and the image lacks it is a catalog change; it is reported to the user under the budget rule in tech-docs/004, not made silently.

## Harness mode and toolchain

- **Harness mode**: Real mode, `neovim`; 80 example units, 8 kata units, 1 capstone unit.
- **Toolchain ids**: neovim (headless), python for 2 helper files.
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP1, SP2 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: At most 8 fences.
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 2.5 s per container invocation × 2 executions × 100 runs (80 examples + 2 × 8 kata runs + 4 capstone runs) ≈ 8.3 minutes.

## Size class and sequencing

- **Size class S** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 0 (the larger of the word gap and the drilling shortfall), new unit folders 0.
- **Agent packets**: one packet per defect group (mechanical fixes, then prose fixes); no page split.
- **Wave 8**, slot 2. Makers and fixers for this course: `apps-ayokoding-www-by-example-maker` for authoring gaps, `tutorial-by-example-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `capstone-forge-ready` (each is audited in a later wave, so this course is final first).

## Prerequisite re-check

- Plan 02 result: Plan 02 adds `just-enough-nvim` next to `just-enough-lua` (the editor edge is kept under T3 because the course configures Neovim).
- In-plan prerequisites are audited first: `just-enough-lua` in wave 5, `just-enough-nvim` in wave 2.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-core-and-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `extending-neovim` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder; compare its findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (S): one packet per defect group (mechanical fixes, then prose fixes); no page split. Classes: X1, X3, X8, X15, X18.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `extending-neovim`; a course that fires is fixed, never baselined.
- [ ] Units: 80 example units, 8 kata units, 1 capstone unit (create 0, convert 89); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 8 fences.
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `extending-neovim` exits 0 (at most 2 repair cycles).
- [ ] CP-6 The registry row for `extending-neovim` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit extending-neovim course` with explicit paths only: the course folder with its `_index.md`, the registry row.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/extending-neovim/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- The recorded transcripts say Neovim v0.12.3 and the overview says v0.12.4; the harness catalog pins 0.12.5 (plan 05's catalog, read 2026-10-09). Every transcript is re-recorded on the pinned build.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–28 (28): from "Locate Init.lua" to "Install a Plugin with vim.pack.add".
- **co-02 · intermediate** — examples 29–58 (30): from "Pin a Plugin Version with vim.pack.add" to "Augroup Clear Idempotence Across Three Re-Sources".
- **co-03 · advanced** — examples 59–80 (22): from "Merge Shared Capabilities via the LSP Wildcard" to "Full Config Healthcheck".

## Lineage

- The third course of the Pass 0 sequence; the capstone `capstone-forge-ready` integrates it.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 3 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 3 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 3 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
