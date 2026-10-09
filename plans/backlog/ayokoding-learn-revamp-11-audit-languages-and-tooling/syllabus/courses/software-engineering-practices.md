# Software Engineering Practices (Annotated Concept)

**Course ID**: `software-engineering-practices` · **Format**: Annotated Concept · **Family**: tools-and-practices.

**Scope note**: Audits and fixes the existing `software-engineering-practices` course to the series definition of done and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. The neighbouring courses `just-enough-bash`, `software-testing`, `backend-essentials` keep their own scope. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course.

**Short summary**: The workflow around code: trunk-based branching, commits and review, hooks and CI, versioning and changelogs, decision records, and release hygiene, taught as 54 worked examples around a small Python project.

## Why this exists · the big idea

- **The problem before the solution**: The headings use the wrong form for the mode, 45 of 54 "Why It Matters" blocks are too short, and the git scripts depend on random directories and dates.
- **Keep-this-if-you-forget-everything**: Every practice makes change safe and reversible; the artifacts a reader writes are shown and checked.

## Prerequisites

- **Prior courses**: `just-enough-bash`, `software-testing`, `backend-essentials` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: Annotated Concept (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Annotated Concept: 54 worked examples wrap a workflow (branching, review, CI, releases) around testing; roughly half are better as annotated artifacts than as programs.
- **Wave**: 10 (slot 3); **size class**: S (words to write 0, new unit folders 6); **expected defect classes**: 7 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                                                                                                                    | Target                                                                                                                                                                                   | Work                      |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 39,794                                                                                                                                                                                                                                                                             | at least 22,000                                                                                                                                                                          | none                      |
| Examples as `### Worked Example N: Title`                     | 54 (headings in the wrong form today)                                                                                                                                                                                                                                              | at least 45, numbered 1 to N without gaps                                                                                                                                                | none; rename the headings |
| Mermaid diagrams                                              | 4                                                                                                                                                                                                                                                                                  | at least 10 (this plan's target)                                                                                                                                                         | 6 to add                  |
| "Why It Matters" (50 to 100 words each)                       | 54 of 54 present; 45 under 50 words; 0 over 100; median 34 words                                                                                                                                                                                                                   | one per example, 50 to 100 words                                                                                                                                                         | 45 to write or fix        |
| Annotation density (comment lines per code line)              | median 1.25; 0 examples below 1.0; 1 above 2.25 (of 29 code-bearing)                                                                                                                                                                                                               | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 1 to fix                  |
| Code fences                                                   | 139 fences; 2 code fences unanchored                                                                                                                                                                                                                                               | every code fence anchored or marked as an illustration (budget: at most 8 fences (`gh`, hook installs))                                                                                  | 2 to anchor               |
| Lesson-to-file anchors (plan 05's method)                     | 41 path anchors (match 13, mismatch 26, missing 2); 1 labelled anchors (match 0, mismatch 0, missing 1)                                                                                                                                                                            | every anchor matches its file                                                                                                                                                            | 29 to repair              |
| Output blocks                                                 | 31 output fences; 31 unanchored                                                                                                                                                                                                                                                    | every `**Output**` block anchored to an expected file                                                                                                                                    | 31 to anchor              |
| Harness units                                                 | 28 example folders, 0 kata folders, 70 code files, 0 `run.yaml`                                                                                                                                                                                                                    | 29 example units, 5 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | create 6, convert 29      |
| Drilling page                                                 | 7,474 words; 2 of 5 standard `##` sections exact; 61 `<details>` blocks; headings found: Recall Q&A, Applied scenarios, Hands-on drills, [Unreleased], [Unreleased], Status, Context, Decision, Consequences, Self-check checklist, Elaborative interrogation and self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | words ok; fix sections    |
| Katas                                                         | 0 kata folders                                                                                                                                                                                                                                                                     | at least 5 as `before`/`after` units                                                                                                                                                     | 5                         |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                                                                                                             | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                                                | recompute                 |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X6** Examples are headed `### Example N`; Annotated Concept needs `### Worked Example N: Title` (54 headings to rename).
- **X3** Anchors: 41 path anchors (13 match, 26 mismatch, 2 point at missing files) and 1 missing labelled anchor; 31 `Output` blocks unanchored.
- **X8** 45 of 54 "Why It Matters" blocks are under 50 words (median 34).
- **X11** Drilling is 7,474 words but the heading scan finds extra H2 headings (`[Unreleased]`, `Status`, `Context`, `Decision`, `Consequences`); the audit decides whether they are real headings or sample text, and the page has no Code katas units.
- **X15** `mktemp` creates random directory names (a 28-folder code tree); `git` author and dates must be fixed.
- **X17** `gh` is used in 44 lines, `pre-commit` hooks need network installs.
- **X20** 4 Mermaid diagrams against this plan's target of 10 for Annotated Concept (at least one per page).

## Fixes and design

- Rename headings, lengthen the 45 short "Why It Matters" blocks, anchor outputs, fix path anchors, write 5 katas, and settle the drilling headings.
- Git scripts run in `shell` with fixed dates and a fixed directory; pytest and ruff run in `python` with a hash-locked requirements file; `gh` lines and hook installs are launch illustrations.
- AI core: this course is in the 12-course core of the AI Engineer path (plan 08). Any prerequisite change is made together with the AI manifest and the frozen membership sets in the same PR (tech-docs/005).

## Harness mode and toolchain

- **Harness mode**: Real mode, `shell` and `python`; 29 example units (the code-bearing worked examples), 5 kata units, 1 capstone unit.
- **Toolchain ids**: shell (git), python (pytest, ruff locked).
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP3, SP10 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: At most 8 fences (`gh`, hook installs).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 2.0 s per container invocation × 2 executions × 42 runs (29 examples + 2 × 5 kata runs + 3 capstone runs) ≈ 2.8 minutes.

## Size class and sequencing

- **Size class S** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 0 (the larger of the word gap and the drilling shortfall), new unit folders 6.
- **Agent packets**: one packet per defect group (mechanical fixes, then prose fixes); no page split.
- **Wave 10**, slot 3. Makers and fixers for this course: `apps-ayokoding-www-annotated-concept-maker` for authoring gaps, `tutorial-annotated-concept-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 result: Plan 02 removes `advanced-networking` and adds all three. `just-enough-bash` and `software-testing` are audited in this plan before this course; `backend-essentials` is outside.
- In-plan prerequisites are audited first: `just-enough-bash` in wave 1, `software-testing` in wave 4.
- Prerequisites outside this plan (unchanged here): `backend-essentials`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-core-and-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `software-engineering-practices` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-annotated-concept-checker` over the course folder; compare its findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (S): one packet per defect group (mechanical fixes, then prose fixes); no page split. Classes: X3, X6, X8, X11, X15, X17, X20.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `software-engineering-practices`; a course that fires is fixed, never baselined.
- [ ] Units: 29 example units, 5 kata units, 1 capstone unit (create 6, convert 29); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 8 fences (`gh`, hook installs).
- [ ] CP-3 `tutorial-annotated-concept-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `software-engineering-practices` exits 0 (at most 2 repair cycles).
- [ ] CP-6 The registry row for `software-engineering-practices` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit software-engineering-practices course` with explicit paths only: the course folder with its `_index.md`, the registry row.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/software-engineering-practices/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- The overview cites Ruff 0.15 and `gh` 2.96.0 "as of this topic's last accuracy check"; both are re-checked in cycle 1 and the lesson states the version the examples ran on.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–18 (18): from "A Conventional-Commits `fix` Subject" to "`pre-commit run --all-files`".
- **co-02 · intermediate** — examples 19–43 (25): from "Test-Pyramid Shape Flagged in Review" to "Rewriting a Postmortem into Blameless Language".
- **co-03 · advanced** — examples 44–54 (11): from "Cleaning Up a Messy 8-Commit History" to "Bisect-Driven Debugging During Review".

## Lineage

- The workflow wrapper around testing and version control; one of the 12 core courses of the AI Engineer path after plan 08.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 108 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 106 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 88 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/ai-engineer` — a core course after plan 08 (12-course core); a prerequisite change here also changes that manifest, its `assumes`, and its tests in the same PR.
