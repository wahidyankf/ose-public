# Pass 2 Capstone · SOLID Core

**Course ID**: `capstone-solid-core` · **Format**: Capstone (Annotated Concept, standard mode) · **Category**: architecture-and-distributed-systems.

**Scope note**: Restructures the existing `capstone-solid-core` course to plan 08's capstone contract and plan 12's definition of done, and brings every example green in plan 05's harness. The subject, slug, and place in every path stay. `capstone-first-working-software` (plan 13) is the starting app; the courses it relies on are CS Foundations, OO Design, Paradigms, Functional Programming, Concurrency, Advanced Algorithms, and Advanced SQL, all audited earlier in this plan. It does not touch `content/id/**`, any path manifest (except an AI manifest co-update when a prerequisite change alters the AI core), or another course.

**Short summary**: Rework the first capstone app into a clean, well-designed professional codebase.

## Why this exists · the big idea

- **The problem before the solution**: none of its 45 examples is run by any check (0 `run.yaml`); one 15,009-word page, no learning or drilling tree, and 35 files in a root `code/` folder.
- **Keep-this-if-you-forget-everything**: Take a working app and make it professional: separate the core, make one hot path safe and fast, tune one query, and wrap it in a delivery workflow.

## Prerequisites

- **Prior courses** (plan 02's revised list, kept plus added, as read on 2026-10-09): `engineering-management`, `capstone-first-working-software`, `computer-science-foundations`, `object-oriented-design-and-patterns`, `programming-paradigms`, `functional-programming`, `concurrency-and-parallelism`, `advanced-algorithms`, `advanced-sql-and-query-performance`, `software-engineering-practices`, `software-product-engineering`.
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: Capstone (Annotated Concept, standard mode) (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: It is a capstone (plan 03 `format: capstone`). Plan 08's capstone contract applies (decision D9): standard mode, 45 worked examples in five themes, a project brief with milestones and acceptance criteria, a rubric, and a reference solution.
- **Wave**: 7 (slot 1); **size class**: L (words to write 19,800, units authored 51); **expected defect classes**: 10 of 15 variable classes, plus the two universal ones (DC2, DC15).

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                             | Target                                                                                                                                                                                   | Work                            |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 15,009                                                                                                                      | at least 23,000                                                                                                                                                                          | 7,991 to write                  |
| Examples                                                      | 0 (one page, no worked examples)                                                                                            | 45 worked examples in five themes (`### Worked Example N: Title`)                                                                                                                        | write 45                        |
| Mermaid diagrams                                              | 1                                                                                                                           | at least 10                                                                                                                                                                              | 9 to add                        |
| Code fences and anchors                                       | 55 non-diagram fences; 43 code fences unanchored                                                                            | every code fence anchored or marked as an illustration                                                                                                                                   | 43 to anchor                    |
| Lesson-to-file anchors (plan 05's method)                     | 0 path anchors                                                                                                              | every anchor matches its file                                                                                                                                                            | none                            |
| Output blocks                                                 | 0 unanchored                                                                                                                | every `**Output**` block anchored to an expected file                                                                                                                                    | none                            |
| Harness units                                                 | 0 example folders, 35 files in a root `code/` folder, 0 `run.yaml`                                                          | 45 worked-example units, 5 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                           | author about 51                 |
| Drilling page                                                 | no drilling page                                                                                                            | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 5,000 words short; fix sections |
| Katas                                                         | 0                                                                                                                           | at least 5 as `before`/`after` units in `drilling/code`                                                                                                                                  | 5 to write                      |
| Accuracy-note files and verification tags                     | files: 0; tags: 0                                                                                                           | none; the facts sit in References                                                                                                                                                        | none                            |
| Frontmatter                                                   | `format` capstone, `category` architecture-and-distributed-systems, `description` from plan 03; `estimatedHours` snapshot 4 | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed by plan 03's drift test after the last edit                                                  | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **DC17** Capstone contract: one 15,009-word `overview.md` with no `learning/`, no `drilling/`, no worked-example pages, no `relies-on` table; the 35-file `code/` sits at the course root.
- **DC2** The course has 0 `run.yaml` files: not opted in to plan 05's harness.
- **DC3** 43 code fences and 0 output blocks carry no anchor.
- **DC5** No mode declaration in `learning/overview.md`.
- **DC6** 1 diagrams, 9 below the floor of 10.
- **DC8** 0 worked examples; the capstone contract needs 45 in five themes.
- **DC9** 15,009 words; the floor is 23,000 (7,991 short).
- **DC10** No drilling page.
- **DC11** 0 katas; the floor is 5 (5 to write).
- **DC12** Scan hits (approximate, CP-1 reads each): wall-clock reads: 6, thread/goroutine/process uses: 2, asyncio uses: 2, environment/pid reads: 1, hash-order prints: 3.
- **DC13** Scan hits (approximate): network calls: 1, database uses: 11, file-system uses: 5.
- **DC15** Prerequisites and metadata: re-derived and re-checked in CP-6 (universal).

## Fixes and design

- Restructure the single 15,009-word page into the capstone shape: `learning/overview.md`, five theme pages with 45 worked examples, `learning/capstone/overview.md` with the six required sections, `learning/capstone/code/` for the reference solution, and a `drilling/` tree; move `code/` (35 files) under the right unit folders.
- Write about 20,000 new words (45 worked examples at about 290 words, overviews, drilling); the existing walkthrough becomes the milestones of the capstone page.
- Reach at least 10 diagrams across the 45 worked examples (1 exists). Update the lesson's runtime claims: the page says Python 3.13.12 and pinned package versions from 2026-07-19; the lock and the image are the truth, re-resolved on the execution date.
- Add the `relies-on` table (the course-level coupling rule CL4 of plan 08) naming the concepts it relies on in each prerequisite course.
- Determinism and environment: The app is tested in process with an ASGI test client (no server port). The `ProcessPoolExecutor` benchmark prints work-unit counts, not seconds. `EXPLAIN QUERY PLAN` on SQLite is deterministic. The commit-history demo runs real `git` with fixed names, dates, and `GIT_CONFIG_NOSYSTEM`. `shellcheck`, `shfmt`, and `actionlint` come from hash-locked wheels (`shellcheck-py`, `shfmt-py`, `actionlint-py`) in the course lock; the type checker's offline form is decided in SP13. A unit holds one toolchain: the git demo is a `shell` unit and the app units are `python` units, with shared files verified by `cmp` unless the merged field guide allows two toolchains in one unit.
- Anchors: after every edit run `EX-SYNC`; where a lesson fence and its file differ, read both and decide which is right before changing either (no quiet narrowing; no prose-only repair of a code fact).

## Harness mode and toolchain

- **Harness mode**: Real mode.
- **Toolchain ids**: `python`, `shell` (ids that are already in plan 05's catalog use its pins as read on 2026-10-09; Phase 0 re-reads them).
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Course lock**: `fastapi`, `pydantic`, `starlette`, `argon2-cffi`, `pytest`, `hypothesis`, and the lint tools named under hazards; SP13 confirms the set.
- **Phase 1 spikes**: SP1 (hash-locked course locks resolve and install offline on the Python image), SP12 (timing and CI projection), SP13 (capstone toolchain: ASGI test client, linters, git, one or two toolchains per unit) (defined in [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-budget.md#phase-1-spikes)).
- **Illustration budget**: at most 3 fences.
- **CI cost** (planning figure, replaced by the SP12 measurement): about 3.0 s per container invocation × 2 executions × 58 runs (45 examples + 2 × 5 kata runs + 3 capstone runs) ≈ 5.8 minutes.

## Size class and sequencing

- **Size class L** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#size-class-rule): words to write 19,800 (class L), units authored from scratch 51 (class L), reading edits 4 (class S).
- **Agent packets**: authoring split by learning page (one packet per page), then one packet per remaining defect group.
- **CI weight**: about 5.8 CI shard-minutes per full run of this course (a planning figure; SP12 replaces it with a measurement).
- **Wave 7**, slot 1. Maker: `apps-ayokoding-www-annotated-concept-maker` for authoring gaps; fixer: `tutorial-annotated-concept-fixer` for gate findings; `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 result: Kept: `engineering-management`; Added: `capstone-first-working-software`, `computer-science-foundations`, `object-oriented-design-and-patterns`, `programming-paradigms`, `functional-programming`, `concurrency-and-parallelism`, `advanced-algorithms`, `advanced-sql-and-query-performance`, `software-engineering-practices`, `software-product-engineering`.
- In-plan prerequisites are audited first: `computer-science-foundations` (wave 2), `object-oriented-design-and-patterns` (wave 2), `programming-paradigms` (wave 3), `functional-programming` (wave 5), `concurrency-and-parallelism` (wave 4), `advanced-algorithms` (wave 6), `advanced-sql-and-query-performance` (wave 2).
- Prerequisites outside this plan (unchanged here): `engineering-management`, `capstone-first-working-software`, `software-engineering-practices`, `software-product-engineering`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests.
- Plan 08's capstone contract adds the `relies-on` table: `computer-science-foundations`, `object-oriented-design-and-patterns`, `programming-paradigms`, `functional-programming`, `concurrency-and-parallelism`, `advanced-algorithms`, `advanced-sql-and-query-performance` are re-read in CP-1 (rule CL4) against the audited text of each.
- Dependent outside this plan: `capstone-real-world-delivery` (plan 08) relies on this course for the service shape (rule C1) and ships its own copy of it. CP-1 searches `apps/ayokoding-www/content/en/learn/courses/capstone-*/learning/overview.md` for `capstone-solid-core` and reads each `relies-on` row that names it; CP-6 confirms the restructured course still teaches every concept named there (plan 08's handoff duty for plans 10 to 13), and edits the row and the paragraph that restates it in the same commit if it does not.

## Per-course checklist

- [ ] CP-0 Readiness: in-plan prerequisites `computer-science-foundations`, `object-oriented-design-and-patterns`, `programming-paradigms`, `functional-programming`, `concurrency-and-parallelism`, `advanced-algorithms`, `advanced-sql-and-query-performance` are DONE in the ledger; spikes SP1, SP12, SP13 are recorded as passed.
- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `capstone-solid-core` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-annotated-concept-checker` over the course folder in report-only form (not a gate cycle); `COMPLETION-PROBE capstone-solid-core capstone` (RED; the failing scenarios go in the ledger); `FILLER` and the course's row in the printed metrics table; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (L): the packets above. Classes: DC17, DC2, DC3, DC5, DC6, DC8, DC9, DC10, DC11, DC12, DC13. Author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file. Unit rule: first run plus at most 2 fix attempts, then a simpler replacement.
- [ ] Units: about 51 units authored; kata units in `drilling/code`; harness pre-check green for every unit before the gate starts.
- [ ] Illustration budget kept (see Harness mode and toolchain); no runnable block is marked as an illustration to pass sync (plan 05 M11).
- [ ] CP-3 `tutorial-annotated-concept-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `capstone-solid-core` exits 0 (at most 2 repair cycles).
- [ ] CP-6 Registry, guard, metadata, and closure: `FILLER` shows no fired rule for the course; `estimatedHours` recomputed from plan 03's drift test; `prerequisites` re-derived; the row `capstone-solid-core` (`capstone`) added to `AUDITED_COURSES` and `COMPLETION` green; plan 02's integrity tests (`PATH-TESTS`) green; the `relies-on` table re-read and the six capstone sections present (plan 08's contract tests).
- [ ] CP-7 Ledger row complete in `local-tmp/ayokoding-learn/execution-ledger.md`; one commit `feat(ayokoding-www): restructure capstone-solid-core to the capstone contract` with only this course folder, its `_index.md`, and its `AUDITED_COURSES` row, and any other metadata file CP-6 changed (a prerequisite edge or the AI manifest).
- [ ] C11 Course-specific obligation: The six required capstone sections exist, the `relies-on` table names only concepts present in the current text of the prerequisite courses, and the course has no top-level `code/` folder.

## Accuracy notes

- FastAPI, Pydantic, argon2-cffi, pytest, hypothesis, ruff, and coverage versions are re-resolved into the hash-locked lock on the execution date and checked for known vulnerabilities (`pip-audit` runs at lock time, never in the harness).
- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/capstone-solid-core/` (stable repository facts; Phase 0 and CP-1 re-measure). Scan hits for determinism and environment are approximate and are read, not trusted, in CP-1.
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; SP12 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them beyond the notes above.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · overview.md** — 15,007 words today; the example list is rebuilt by the maker.

## Lineage

- Pass 2 capstone; follows the first working software capstone; goal course of a career path.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 114 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 112 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 114 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
