# Data Engineering

**Course ID**: `data-engineering` · **Format**: Annotated Concept · **Category**: data-and-databases.

**Scope note**: Audits and fixes the existing `data-engineering` course to the series definition of done (decision 27) and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. `sql-essentials` and `advanced-sql-and-query-performance` keep SQL; `nosql-databases` keeps stores; this course keeps batch and streaming shape, layers, dimensional modelling, quality, and contracts. It does not touch `content/id/**`, any path manifest (except an AI manifest co-update when a prerequisite change alters the AI core), or another course.

**Short summary**: Build data pipelines that rerun safely and catch bad data early.

## Why this exists · the big idea

- **The problem before the solution**: none of its 52 examples is run by any check (0 `run.yaml`); 113 fences and output blocks without an anchor; a drilling page of 4,954 words; 0 of 5 katas.
- **Keep-this-if-you-forget-everything**: A pipeline you cannot rerun is a pipeline you cannot trust; each worked example shows one pattern (idempotence, slowly changing dimensions, contracts, quality checks) on small data.

## Prerequisites

- **Prior courses** (plan 02's revised list, kept plus added, as read on 2026-10-09): `sql-essentials`, `advanced-sql-and-query-performance`, `just-enough-python`.
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: Annotated Concept (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Many ideas are annotated models and tables with a SQL or Python check; 52 worked examples exist (floor 45).
- **Wave**: 11 (slot 3); **size class**: S (words to write 46, units authored 5); **expected defect classes**: 7 of 15 variable classes, plus the two universal ones (DC2, DC15).

| Measure                                                                      | Today (2026-10-09, `bb7f90137`)                                                                                                                                 | Target                                                                                                                                                                                   | Work                                            |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded)                | 50,255                                                                                                                                                          | at least 22,000                                                                                                                                                                          | none (floor met)                                |
| Examples                                                                     | 52 as `### Worked Example N`                                                                                                                                    | at least 45, as `### Worked Example N: Title`, numbered 1 to N without gaps                                                                                                              | none                                            |
| Mermaid diagrams                                                             | 4                                                                                                                                                               | at least 10                                                                                                                                                                              | 6 to add                                        |
| "Why It Matters" (50 to 100 words) and key takeaway                          | 60 and 60 (for 52 examples)                                                                                                                                     | one of each per example, each "Why It Matters" block 50 to 100 words                                                                                                                     | none                                            |
| Annotation density (comment lines per code line, measured on the code files) | median 1.04; 0 below 1.0; 0 above 2.25 (of 52 units)                                                                                                            | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | none                                            |
| Code fences and anchors                                                      | 114 non-diagram fences; 57 code fences unanchored                                                                                                               | every code fence anchored or marked as an illustration                                                                                                                                   | 57 to anchor                                    |
| Lesson-to-file anchors (plan 05's method)                                    | 0 path anchors                                                                                                                                                  | every anchor matches its file                                                                                                                                                            | none                                            |
| Output blocks                                                                | 56 unanchored                                                                                                                                                   | every `**Output**` block anchored to an expected file                                                                                                                                    | 56 to anchor                                    |
| Harness units                                                                | 52 example folders, 0 kata folders in `drilling/code`, 59 code files, 0 `run.yaml`                                                                              | at least 27 code-bearing worked examples as example units (plan 06's 60 percent rule, adopted by plan 11), 5 kata units, 1 capstone unit, each with a `run.yaml`                         | author about 5; convert the 52 existing folders |
| Drilling page                                                                | 4,954 words; 5 of 5 exact `##` sections; headings: Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 46 words short                                  |
| Katas                                                                        | 0                                                                                                                                                               | at least 5 as `before`/`after` units in `drilling/code`                                                                                                                                  | 5 to write                                      |
| Accuracy-note files and verification tags                                    | files: 5; tags: 4                                                                                                                                               | none; the facts sit in References                                                                                                                                                        | convert to References                           |
| Frontmatter                                                                  | `format` annotated-concept, `category` data-and-databases, `description` from plan 03; `estimatedHours` snapshot 5                                              | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed by plan 03's drift test after the last edit                                                  | recompute                                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **DC2** The course has 0 `run.yaml` files: not opted in to plan 05's harness.
- **DC3** 57 code fences and 56 output blocks carry no anchor.
- **DC6** 4 diagrams, 6 below the floor of 10.
- **DC10** 4,954 drilling words, 46 short.
- **DC11** 0 katas; the floor is 5 (5 to write).
- **DC12** Scan hits (approximate, CP-1 reads each): hash-order prints: 13.
- **DC13** Scan hits (approximate): database uses: 28, file-system uses: 7.
- **DC14** Leftover accuracy-note files: 5; verification tags: 4; both are converted into References.
- **DC15** Prerequisites and metadata: re-derived and re-checked in CP-6 (universal).

## Fixes and design

- Add a hash-locked lock for `duckdb` (28 files) and `pyarrow`; the one `pandas` unit is rewritten on DuckDB and PyArrow unless its lesson is about pandas, in which case `pandas` and `numpy` are locked too (the capstone's `requirements.txt` is not a lock).
- Anchor the 57 code fences and 56 output blocks; write 5 katas; add 46 drilling words.
- Add the 6 diagrams needed to reach 10 (4 exist; plan 11's completion test needs 10 for an Annotated Concept course); convert 5 accuracy-note files and 4 verification tags into References.
- Check that the DuckDB 1.5 statements (MERGE INTO and others) match the locked version.
- Determinism and environment: DuckDB and PyArrow run in-process: both are hash-locked wheels in the course lock, with no network at run time. Parquet files are written under `/tmp` and compared by content (row counts and sorted rows), never by bytes; DuckDB's thread count is set to 1 so the double run matches; the version printed is the locked one.
- Anchors: after every edit run `EX-SYNC`; where a lesson fence and its file differ, read both and decide which is right before changing either (no quiet narrowing; no prose-only repair of a code fact).

## Harness mode and toolchain

- **Harness mode**: Real mode with the simulation convention for streaming.
- **Toolchain ids**: `python` (ids that are already in plan 05's catalog use its pins as read on 2026-10-09; Phase 0 re-reads them).
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Course lock** (hash-locked, plan 05's lock recipe; no run installs anything): `duckdb` (28 files), `pandas` (1 file).
- **Phase 1 spikes**: SP1 (hash-locked course locks resolve and install offline on the Python image), SP6 (output independent of CPU count), SP12 (timing and CI projection) (defined in [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-budget.md#phase-1-spikes)).
- **Illustration budget**: at most 3 fences.
- **CI cost** (planning figure, replaced by the SP12 measurement): about 2.8 s per container invocation × 2 executions × 65 runs (52 examples + 2 × 5 kata runs + 3 capstone runs) ≈ 6.1 minutes.

## Simulation convention

Plan 05's simulation convention (rules S1 to S9: single-threaded event loop, virtual clock, one seeded SplitMix64 generator, pure state machines, invariants after every step) applies to this course as follows (details in [tech-docs/003](../../tech-docs/003-harness-modes-simulation-and-determinism.md#simulation-convention)).

- **Units that use it**: Late data, watermarks, and replay examples (about 8 of 52) run a stream model over a virtual event-time clock with seeded arrival order.
- **Invariants** (checked after every step):
  - Rerunning an idempotent step on the same input leaves the target identical.
  - A watermark never moves backwards; a record is either processed once or counted in the late-data output once.
  - After replay from the log, the derived state equals the state built live.
- **Seeds**: 1 to 64. At least 32 seeds per unit (the convention's floor). A violation prints `failing seed: <n> (<invariant>)`; the last line is `seeds: <passed> passed, <failed> failed (of <total>)`; `AYOKODING_SEED=<n>` replays one seed with a trace; `run.yaml` sets `simulation: true`. A demonstrated bug may expect exit 1 for its named seed, and the unit's `invariant` sentence says so.

## Size class and sequencing

- **Size class S** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#size-class-rule): words to write 46 (class S), units authored from scratch 5 (class S), reading edits 0 (class S).
- **Agent packets**: one packet for the whole course.
- **CI weight**: about 6.1 CI shard-minutes per full run of this course (a planning figure; SP12 replaces it with a measurement).
- **Wave 11**, slot 3. Maker: `apps-ayokoding-www-annotated-concept-maker` for authoring gaps; fixer: `tutorial-annotated-concept-fixer` for gate findings; `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 result: Kept: `sql-essentials`, `advanced-sql-and-query-performance`, `just-enough-python`.
- In-plan prerequisites are audited first: `sql-essentials` (wave 1), `advanced-sql-and-query-performance` (wave 2).
- Prerequisites outside this plan (unchanged here): `just-enough-python`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, because this course is on the AI Engineer path, the AI manifest and its tests (rule R6).

## Per-course checklist

- [ ] CP-0 Readiness: in-plan prerequisites `sql-essentials`, `advanced-sql-and-query-performance` are DONE in the ledger; spikes SP1, SP6, SP12 are recorded as passed.
- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `data-engineering` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-annotated-concept-checker` over the course folder in report-only form (not a gate cycle); `COMPLETION-PROBE data-engineering annotated-concept` (RED; the failing scenarios go in the ledger); `FILLER` and the course's row in the printed metrics table; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (S): the packets above. Classes: DC2, DC3, DC6, DC10, DC11, DC12, DC13, DC14. Author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file. Unit rule: first run plus at most 2 fix attempts, then a simpler replacement.
- [ ] Units: about 5 units authored and the 52 existing folders converted; kata units in `drilling/code`; harness pre-check green for every unit before the gate starts.
- [ ] Illustration budget kept (see Harness mode and toolchain); no runnable block is marked as an illustration to pass sync (plan 05 M11).
- [ ] Simulation: every unit above follows S1 to S9; each prints the `seeds:` summary line; a deliberately broken variant fails on a named seed.
- [ ] CP-3 `tutorial-annotated-concept-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `data-engineering` exits 0 (at most 2 repair cycles).
- [ ] CP-6 Registry, guard, metadata, and closure: `FILLER` shows no fired rule for the course; `estimatedHours` recomputed from plan 03's drift test; `prerequisites` re-derived; the row `data-engineering` (`annotated-concept`) added to `AUDITED_COURSES` and `COMPLETION` green; plan 02's integrity tests (`PATH-TESTS`) green; the AI manifest and its tests updated together if a prerequisite change alters its closure (rule R6).
- [ ] CP-7 Ledger row complete in `local-tmp/ayokoding-learn/execution-ledger.md`; one commit `fix(ayokoding-www): audit data-engineering course` with only this course folder, its `_index.md`, and its `AUDITED_COURSES` row, and any other metadata file CP-6 changed (a prerequisite edge or the AI manifest).
- [ ] C11 Course-specific obligation: Every idempotence claim is proved by running the step twice in one unit and comparing the target.

## Accuracy notes

- DuckDB 1.5.x, Parquet, and Delta/Iceberg statements are re-read on their sites; the lessons name the locked version.
- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/data-engineering/` (stable repository facts; Phase 0 and CP-1 re-measure). Scan hits for determinism and environment are approximate and are read, not trusted, in CP-1.
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; SP12 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them beyond the notes above.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–18 (18): from "Batch vs. Streaming Contrast" to "Non-Additive Ratio -- Store the Components, Divide at Query".
- **co-02 · intermediate** — examples 19–38 (20): from "SCD Type 1 -- Overwrite, No History" to "Data Quality -- Consistency (Cross-Source Reconciliation)".
- **co-03 · advanced** — examples 39–52 (14): from "Data Contract -- Enforce a Producer Schema" to "The Log as Source of Truth -- Replay Reconstructs State".

## Lineage

- Follows SQL and Advanced SQL.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 95 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 94 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/ai-engineer` — position 7 of 26 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 79 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
