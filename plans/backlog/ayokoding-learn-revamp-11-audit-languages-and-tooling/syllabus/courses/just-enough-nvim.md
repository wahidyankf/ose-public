# Just Enough Nvim (Primer)

**Course ID**: `just-enough-nvim` · **Format**: Primer · **Family**: tools-and-practices.

**Scope note**: Audits and fixes the existing `just-enough-nvim` course to the series definition of done and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course.

**Short summary**: Modal editing in Neovim with no plugins: motions, operators, text objects, registers, macros, search and substitute, windows and buffers, taught as 91 keystroke transcripts with 8 katas.

## Why this exists · the big idea

- **The problem before the solution**: The 91 keystroke transcripts exist as text only, so nothing proves that replaying the keys really produces the After buffer.
- **Keep-this-if-you-forget-everything**: A keystroke transcript is true only if replaying it gives the After text; the harness replays every one it can.

## Prerequisites

- **Prior courses**: none (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: Primer (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: A primer: 91 examples teach modal editing with no plugins. Every example is a before-buffer, a keystroke transcript, and an after-buffer, so a unit can replay the keystrokes and compare.
- **Wave**: 2 (slot 3); **size class**: S (words to write 478, new unit folders 0); **expected defect classes**: 4 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                                       | Target                                                                                                                                                                                   | Work                  |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 28,547                                                                                                                                                                                                | at least 28,000                                                                                                                                                                          | none                  |
| Examples as `### Example N: Title`                            | 91                                                                                                                                                                                                    | at least 75, numbered 1 to N without gaps                                                                                                                                                | none                  |
| Mermaid diagrams                                              | 11                                                                                                                                                                                                    | no count band (a diagram where it helps)                                                                                                                                                 | none required         |
| "Why It Matters" (50 to 100 words each)                       | 91 of 91 present; 0 under 50 words; 0 over 100; median 86 words                                                                                                                                       | one per example, 50 to 100 words                                                                                                                                                         | 0 to write or fix     |
| Annotation density (comment lines per code line)              | not measurable: no code-bearing examples of the mode's form today                                                                                                                                     | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | all new               |
| Code fences                                                   | 320 fences; 0 code fences unanchored                                                                                                                                                                  | every code fence anchored or marked as an illustration (budget: up to 9 transcripts stay unreplayed (10 percent))                                                                        | 0 to anchor           |
| Lesson-to-file anchors (plan 05's method)                     | 0 path anchors (match 0, mismatch 0, missing 0); 17 labelled anchors (match 15, mismatch 0, missing 2)                                                                                                | every anchor matches its file                                                                                                                                                            | 2 to repair           |
| Output blocks                                                 | 0 output fences; 0 unanchored                                                                                                                                                                         | every `**Output**` block anchored to an expected file                                                                                                                                    | 0 to anchor           |
| Harness units                                                 | 91 example folders, 8 kata folders, 324 code files, 0 `run.yaml`                                                                                                                                      | 91 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | create 0, convert 100 |
| Drilling page                                                 | 4,522 words; 5 of 5 standard `##` sections exact; 47 `<details>` blocks; headings found: Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 478 words short       |
| Katas                                                         | 8 kata folders                                                                                                                                                                                        | at least 8 as `before`/`after` units                                                                                                                                                     | 0                     |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                                | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                                                | recompute             |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X1** 324 files (315 text, 6 Python, 3 Markdown) in 91 example folders, 8 kata folders, and a capstone folder; no `run.yaml`.
- **X3** 309 of 320 fences are `text` (Before, annotated keystroke transcript, After) and 11 are Mermaid. 17 labelled anchors exist (15 match, 2 point at missing files); most units have no anchor, which becomes `ayokoding.sync.unreferenced-unit`.
- **X18** The overview says the current stable Neovim is v0.12.4; the catalog pins 0.12.5.
- **X17** Some features cannot be replayed headless (UI popups, `:terminal`, mouse use).

## Fixes and design

- Design the replay unit once (spike SP1) and apply it to all 91 examples; wire each lesson to its unit with labelled-path anchors.
- Examples that cannot replay stay as `text` transcripts with a stated reason; the budget is 10 percent of the examples.
- Replay design: `before.txt`, `keys.vim` (a sequence of `normal! ...` commands), a run that executes `nvim -u NONE -i NONE -n --headless` and prints the buffer with `:%print`, and `expected/main.stdout.txt`. Spike SP1 proves five shapes (motion, change, `:s`, search, macro) and double-run identity before the other 86 are written.
- Words are above the 28,000 floor already (28,547); the work is wiring, not authoring.

## Harness mode and toolchain

- **Harness mode**: Real mode, `neovim`; 91 example units, 8 kata units, 1 capstone unit.
- **Toolchain ids**: neovim (headless keystroke replay).
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP1 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: Up to 9 transcripts stay unreplayed (10 percent).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 2.5 s per container invocation × 2 executions × 110 runs (91 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 9.2 minutes.

## Size class and sequencing

- **Size class S** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 478 (the larger of the word gap and the drilling shortfall), new unit folders 0.
- **Agent packets**: one packet per defect group (mechanical fixes, then prose fixes); no page split.
- **Wave 2**, slot 3. Makers and fixers for this course: `apps-ayokoding-www-primer-maker` for authoring gaps, `tutorial-primer-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `capstone-forge-ready`, `extending-neovim`, `just-enough-lua` (each is audited in a later wave, so this course is final first).

## Prerequisite re-check

- Plan 02 result: No prerequisites, as before; it is the entry point of the software-engineer paths.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-core-and-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `just-enough-nvim` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-primer-checker` over the course folder; compare its findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (S): one packet per defect group (mechanical fixes, then prose fixes); no page split. Classes: X1, X3, X17, X18.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `just-enough-nvim`; a course that fires is fixed, never baselined.
- [ ] Units: 91 example units, 8 kata units, 1 capstone unit (create 0, convert 100); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: up to 9 transcripts stay unreplayed (10 percent).
- [ ] CP-3 `tutorial-primer-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `just-enough-nvim` exits 0 (at most 2 repair cycles).
- [ ] CP-6 The registry row for `just-enough-nvim` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit just-enough-nvim course` with explicit paths only: the course folder with its `_index.md`, the registry row.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/just-enough-nvim/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- The overview says the current stable Neovim is v0.12.4; the harness catalog pins 0.12.5 (plan 05's catalog, read 2026-10-09).
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–30 (30): from "Launch Nvim on File" to "Repeat Search".
- **co-02 · intermediate** — examples 31–62 (32): from "Basic Substitute Line" to "Decrease Indent".
- **co-03 · advanced** — examples 63–91 (29): from "Indent Shift Multiple Lines" to "Terminal Run and Escape".

## Lineage

- The entry point of the software-engineer paths.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 1 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 1 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 1 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
