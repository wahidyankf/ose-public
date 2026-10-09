# Pass 0 Capstone · Forge-Ready (Capstone (Annotated Concept, standard))

**Course ID**: `capstone-forge-ready` · **Format**: Capstone (Annotated Concept, standard) · **Family**: tools-and-practices.

**Scope note**: Audits and fixes the existing `capstone-forge-ready` course to the series definition of done and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. The neighbouring courses `extending-neovim`, `just-enough-nvim`, `just-enough-lua` keep their own scope. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course.

**Short summary**: A reproducible personal development forge: a versioned Neovim configuration repository with LSP and Treesitter that you can clone, plus a scripted, mouse-free refactor of a sample Python project, proving the skills of Just Enough Nvim, Just Enough Lua, and Extending Neovim.

## Why this exists · the big idea

- **The problem before the solution**: The capstone is one 1,977-word page whose code sits outside the unit layout and whose setup needs the network.
- **Keep-this-if-you-forget-everything**: A forge-ready setup is one you can rebuild from a clone without a network and prove with a scripted, mouse-free refactor.

## Prerequisites

- **Prior courses**: `extending-neovim`, `just-enough-nvim`, `just-enough-lua` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: Capstone (Annotated Concept, standard) (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Plan 08's capstone contract applies: Annotated Concept, standard sub-mode, declared in `learning/overview.md`, with the six capstone headings, a rubric, and a relies-on table. The page today is one 1,977-word file.
- **Wave**: 10 (slot 2); **size class**: XL (words to write 21,023, new unit folders 50); **expected defect classes**: 5 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                             | Target                                                                                                                                                                                   | Work                            |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 1,977                                                                                                       | at least 23,000                                                                                                                                                                          | 21,023 to write                 |
| Examples as `### Worked Example N: Title`                     | 0                                                                                                           | at least 45, numbered 1 to N without gaps                                                                                                                                                | 45 to add                       |
| Mermaid diagrams                                              | 1                                                                                                           | at least 10 (this plan's target)                                                                                                                                                         | 9 to add                        |
| "Why It Matters" (50 to 100 words each)                       | not measurable: no numbered example headings of the mode's form exist today                                 | one per example, 50 to 100 words                                                                                                                                                         | all new                         |
| Annotation density (comment lines per code line)              | not measurable: no code-bearing examples of the mode's form today                                           | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | all new                         |
| Code fences                                                   | 9 fences; 2 code fences unanchored                                                                          | every code fence anchored or marked as an illustration (budget: at most 6 fences (install and launch lines))                                                                             | 2 to anchor                     |
| Lesson-to-file anchors (plan 05's method)                     | 2 path anchors (match 2, mismatch 0, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)        | every anchor matches its file                                                                                                                                                            | 0 to repair                     |
| Output blocks                                                 | 3 output fences; 3 unanchored                                                                               | every `**Output**` block anchored to an expected file                                                                                                                                    | 3 to anchor                     |
| Harness units                                                 | 0 example folders, 0 kata folders, 10 code files, 0 `run.yaml`                                              | 45 example units, 5 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | create 50, convert 1            |
| Drilling page                                                 | 0 words; 0 of 5 standard `##` sections exact; 0 `<details>` blocks; headings found: none (no drilling page) | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 5,000 words short; fix sections |
| Katas                                                         | 0 kata folders                                                                                              | at least 5 as `before`/`after` units                                                                                                                                                     | 5                               |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                      | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                                                | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X20** The course is a single `overview.md` (1,977 words) with code in a root `code/` folder: no `learning/` pages, no drilling, no capstone page contract, no worked examples (45 needed), 9 fences (2 unanchored, 3 `Output` blocks unanchored).
- **X2** The code lives in root `code/` (7 Lua files, 2 Python files, a transcript), not in `learning/capstone/code/` and not in units.
- **X13** Words 1,977 against the 23,000 capstone floor, a gap of 21,023.
- **X15** `vim.pack.add` fetches pinned plugins from GitHub, and pyright needs a language-server download; neither can run with the network off.
- **X18** "Concepts exercised" cites topic numbers ("topics 1-3"), which plan 01 removes from titles; the prose must name courses, not positions.

## Fixes and design

- Build the course to plan 08's capstone contract: mode declaration, theme list of 45 worked examples in five themes, `learning/capstone/overview.md` with Project brief, Milestones, Acceptance criteria, Rubric, Evidence to keep, Extensions, a relies-on table, drilling with 5 katas.
- Move the config and sample project into `learning/capstone/code/`; one unit per worked example.
- Offline plugin seam: the config module under test loads with `vim.pack.add` replaced by a vendored or stubbed path (spike SP2); the real bootstrap command is a launch illustration. LSP configuration is validated as a Lua table; `:checkhealth` is described, not run.
- Keystroke-driven refactor steps replay headless with `nvim -u NONE -i NONE -n` (spike SP1) and print the resulting buffer.
- Coupling rules CL1 to CL4 of plan 08 apply: link prerequisites at course level only, restate concepts, import nothing from a prerequisite, keep the relies-on table.

## Harness mode and toolchain

- **Harness mode**: Real mode, `neovim` for the Lua and keystroke units and `python` for the sample project; 45 example units, 5 kata units, 1 capstone unit.
- **Toolchain ids**: neovim (headless) and python.
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP1, SP2 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: At most 6 fences (install and launch lines).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 2.5 s per container invocation × 2 executions × 60 runs (45 examples + 2 × 5 kata runs + 5 capstone runs) ≈ 5.0 minutes.

## Size class and sequencing

- **Size class XL** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 21,023 (the larger of the word gap and the drilling shortfall), new unit folders 50.
- **Agent packets**: authoring split by learning page and again by blocks of at most 15 examples, then one packet per remaining defect group; the course folder is committed only when every unit exists.
- **Wave 10**, slot 2. Makers and fixers for this course: `apps-ayokoding-www-annotated-concept-maker` for authoring gaps, `tutorial-annotated-concept-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 result: Plan 02 keeps `extending-neovim` and adds `just-enough-nvim` and `just-enough-lua` under rule C1 (a capstone requires the courses whose artifacts it integrates).
- In-plan prerequisites are audited first: `extending-neovim` in wave 8, `just-enough-nvim` in wave 2, `just-enough-lua` in wave 5.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-core-and-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `capstone-forge-ready` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-annotated-concept-checker` over the course folder; compare its findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (XL): authoring split by learning page and again by blocks of at most 15 examples, then one packet per remaining defect group; the course folder is committed only when every unit exists. Classes: X2, X13, X15, X18, X20.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `capstone-forge-ready`; a course that fires is fixed, never baselined.
- [ ] Units: 45 example units, 5 kata units, 1 capstone unit (create 50, convert 1); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 6 fences (install and launch lines).
- [ ] CP-3 `tutorial-annotated-concept-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `capstone-forge-ready` exits 0 (at most 2 repair cycles).
- [ ] CP-6 The registry row for `capstone-forge-ready` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit capstone-forge-ready course` with explicit paths only: the course folder with its `_index.md`, the registry row.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/capstone-forge-ready/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Plan 08's capstone contract (CL1 to CL4, the six capstone headings, the rubric of at least six criteria) applies to this capstone although plan 08 does not own it (read 2026-10-09).
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · versioned-config-repo** — a Neovim configuration repository you can clone and rebuild.
- **co-02 · lsp-and-treesitter** — language-server and Treesitter configuration for the sample project.
- **co-03 · scripted-refactor** — a mouse-free, replayable refactor of a sample Python project.
- **co-04 · evidence** — the commands and transcripts that prove the setup works.

## Lineage

- The Pass 0 capstone: it integrates Just Enough Nvim, Just Enough Lua, and Extending Neovim.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 4 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 4 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 4 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
