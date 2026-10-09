# Version Control and Git (By Example)

**Course ID**: `version-control-and-git` · **Format**: By Example · **Family**: tools-and-practices.

**Scope note**: Audits and fixes the existing `version-control-and-git` course to the series definition of done and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. The neighbouring courses `just-enough-bash`, `just-enough-python` keep their own scope. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course.

**Short summary**: Git from the object model to team workflow: commits, branches, merges and rebases, remotes, history inspection, recovery with the reflog, hooks, and collaboration patterns, every example in a temporary repository.

## Why this exists · the big idea

- **The problem before the solution**: All 94 path anchors disagree with their files, and commit hashes, dates, and author lines change on every run.
- **Keep-this-if-you-forget-everything**: Git's state is deterministic once identity and dates are fixed, so every example can show the real state it produces.

## Prerequisites

- **Prior courses**: `just-enough-bash`, `just-enough-python` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Eighty-two examples each run a real Git operation in a throwaway repository and show the resulting state. Each operation is a rule a reader can run and break.
- **Wave**: 4 (slot 2); **size class**: S (words to write 0, new unit folders 0); **expected defect classes**: 5 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                                       | Target                                                                                                                                                                                   | Work                 |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 46,221                                                                                                                                                                                                | at least 28,000                                                                                                                                                                          | none                 |
| Examples as `### Example N: Title`                            | 82                                                                                                                                                                                                    | at least 75, numbered 1 to N without gaps                                                                                                                                                | none                 |
| Mermaid diagrams                                              | 34                                                                                                                                                                                                    | 30 to 50 (adapter band)                                                                                                                                                                  | none                 |
| "Why It Matters" (50 to 100 words each)                       | 82 of 82 present; 0 under 50 words; 0 over 100; median 71 words                                                                                                                                       | one per example, 50 to 100 words                                                                                                                                                         | 0 to write or fix    |
| Annotation density (comment lines per code line)              | median 1.27; 1 examples below 1.0; 0 above 2.25 (of 82 code-bearing)                                                                                                                                  | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 1 to fix             |
| Code fences                                                   | 230 fences; 8 code fences unanchored                                                                                                                                                                  | every code fence anchored or marked as an illustration (budget: at most 4 fences (remote hosting commands))                                                                              | 8 to anchor          |
| Lesson-to-file anchors (plan 05's method)                     | 94 path anchors (match 0, mismatch 94, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                                                                | every anchor matches its file                                                                                                                                                            | 94 to repair         |
| Output blocks                                                 | 93 output fences; 93 unanchored                                                                                                                                                                       | every `**Output**` block anchored to an expected file                                                                                                                                    | 93 to anchor         |
| Harness units                                                 | 82 example folders, 8 kata folders, 182 code files, 0 `run.yaml`                                                                                                                                      | 82 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | create 0, convert 91 |
| Drilling page                                                 | 6,977 words; 5 of 5 standard `##` sections exact; 58 `<details>` blocks; headings found: Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | words ok             |
| Katas                                                         | 8 kata folders                                                                                                                                                                                        | at least 8 as `before`/`after` units                                                                                                                                                     | 0                    |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                                | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                                                | recompute            |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X1** 182 files (91 shell scripts, 91 text files) in 82 example folders, 8 kata folders, and a capstone folder, with no `run.yaml`.
- **X3** 94 path anchors, all mismatching their file; 8 fences unanchored; 93 `Output` blocks unanchored.
- **X15** Commit hashes, timestamps, and author lines vary unless `GIT_AUTHOR_DATE`, `GIT_COMMITTER_DATE`, the author and committer names, `GIT_CONFIG_GLOBAL`, and the default branch are fixed. `mktemp` is used in 91 files.
- **X18** The overview says Git 2.55.0 and leaves it unpinned; the `shell` image has the Debian snapshot's Git, so the lesson must state the version the examples ran on.
- **X9** One example is below the density floor (median 1.27).

## Fixes and design

- A shared preamble is not allowed between units, so each unit sets its own fixed environment (a `env:` block in `run.yaml` for dates and identity) and works in a fixed directory.
- Read the 94 mismatch diffs, find the dominant cause, repair, then `examples sync --write`.
- Hashes are deterministic once dates, identity, and content are fixed; the double run proves it. Pager and editor are fixed (`GIT_PAGER=cat`, `GIT_EDITOR=true`).
- Example output that shows an object ID is kept (it teaches that IDs are content-derived) and only after the double run confirms it.

## Harness mode and toolchain

- **Harness mode**: Real mode, `shell`; 82 example units, 8 kata units, 1 capstone unit.
- **Toolchain ids**: shell (bash, git, coreutils, jq, sqlite3).
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP10 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: At most 4 fences (remote hosting commands).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 1.5 s per container invocation × 2 executions × 101 runs (82 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 5.0 minutes.

## Size class and sequencing

- **Size class S** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 0 (the larger of the word gap and the drilling shortfall), new unit folders 0.
- **Agent packets**: one packet per defect group (mechanical fixes, then prose fixes); no page split.
- **Wave 4**, slot 2. Makers and fixers for this course: `apps-ayokoding-www-by-example-maker` for authoring gaps, `tutorial-by-example-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `build-automation-and-task-runners`, `cicd-and-release-engineering` (each is audited in a later wave, so this course is final first).

## Prerequisite re-check

- Plan 02 result: Plan 02 keeps `just-enough-bash` and adds `just-enough-python` (the course reads a small commit hook).
- In-plan prerequisites are audited first: `just-enough-bash` in wave 1, `just-enough-python` in wave 1.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-core-and-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `version-control-and-git` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder; compare its findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (S): one packet per defect group (mechanical fixes, then prose fixes); no page split. Classes: X1, X3, X9, X15, X18.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `version-control-and-git`; a course that fires is fixed, never baselined.
- [ ] Units: 82 example units, 8 kata units, 1 capstone unit (create 0, convert 91); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 4 fences (remote hosting commands).
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `version-control-and-git` exits 0 (at most 2 repair cycles).
- [ ] CP-6 The registry row for `version-control-and-git` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit version-control-and-git course` with explicit paths only: the course folder with its `_index.md`, the registry row.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/version-control-and-git/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- The overview names Git 2.55.0 without pinning it; the `shell` toolchain ships the Debian snapshot's Git, whose version the audit records in the lesson.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–28 (28): from "Init a Repository" to "A Lightweight Tag".
- **co-02 · intermediate** — examples 29–60 (32): from "Stage Hunks Interactively" to "A Named Stash and the Stash List".
- **co-03 · advanced** — examples 61–82 (22): from "Inspect the Reflog" to "Verify History Is Intact After Recovery".

## Lineage

- Prerequisite of CI/CD and Build Automation.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 7 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 7 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 7 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
