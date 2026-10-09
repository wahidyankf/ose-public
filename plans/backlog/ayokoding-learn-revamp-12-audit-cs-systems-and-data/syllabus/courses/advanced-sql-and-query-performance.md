# Advanced SQL & Query Performance

**Course ID**: `advanced-sql-and-query-performance` · **Format**: By Example · **Category**: data-and-databases.

**Scope note**: Audits and fixes the existing `advanced-sql-and-query-performance` course to the series definition of done (decision 27) and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. `sql-essentials` keeps SQLite basics; `database-internals-and-storage-engines` keeps how pages and trees work; `data-access-orms-and-query-builders` keeps the application side. It does not touch `content/id/**`, any path manifest (except an AI manifest co-update when a prerequisite change alters the AI core), or another course.

**Short summary**: Read query plans and use indexes to make slow SQL fast.

## Why this exists · the big idea

- **The problem before the solution**: none of its 85 examples is run by any check (0 `run.yaml`); 88 fences and output blocks without an anchor; 58 anchors that differ from their files.
- **Keep-this-if-you-forget-everything**: A slow query is a plan you have not read yet; every example runs on a real PostgreSQL and prints a plan or a result a reader can compare.

## Prerequisites

- **Prior courses** (plan 02's revised list, kept plus added, as read on 2026-10-09): `sql-essentials`, `just-enough-python`, `backend-essentials`.
- **Edges plan 02 removes**: `advanced-algorithms`.
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Each lesson is a statement or a plan a reader can run, change, and compare; 85 examples already follow By Example pace.
- **Wave**: 2 (slot 1); **size class**: M (words to write 0, units authored 0); **expected defect classes**: 6 of 15 variable classes, plus the two universal ones (DC2, DC15).

| Measure                                                                      | Today (2026-10-09, `bb7f90137`)                                                                                                                                  | Target                                                                                                                                                                                   | Work                                                                             |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded)                | 90,061                                                                                                                                                           | at least 28,000                                                                                                                                                                          | none (floor met)                                                                 |
| Examples                                                                     | 85 as `### Example N`                                                                                                                                            | at least 75, as `### Example N: Title`, numbered 1 to N without gaps                                                                                                                     | none (the floor is never a cap)                                                  |
| Mermaid diagrams                                                             | 31                                                                                                                                                               | 30 to 50                                                                                                                                                                                 | none                                                                             |
| "Why It Matters" (50 to 100 words) and key takeaway                          | 85 and 85 (for 85 examples)                                                                                                                                      | one of each per example, each "Why It Matters" block 50 to 100 words                                                                                                                     | bring 6 of the 85 blocks found into 50 to 100 words (median 64; heuristic count) |
| Annotation density (comment lines per code line, measured on the code files) | median 1.14; 0 below 1.0; 0 above 2.25 (of 85 units)                                                                                                             | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | none                                                                             |
| Code fences and anchors                                                      | 224 non-diagram fences; 2 code fences unanchored                                                                                                                 | every code fence anchored or marked as an illustration                                                                                                                                   | 2 to anchor                                                                      |
| Lesson-to-file anchors (plan 05's method)                                    | 109 path anchors: 109 resolve to a file, of which 58 differ from it; 0 missing                                                                                   | every anchor matches its file                                                                                                                                                            | 58 to repair after reading each diff                                             |
| Output blocks                                                                | 86 unanchored                                                                                                                                                    | every `**Output**` block anchored to an expected file                                                                                                                                    | 86 to anchor                                                                     |
| Harness units                                                                | 85 example folders, 10 kata folders in `drilling/code`, 111 code files, 0 `run.yaml`                                                                             | 85 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | convert the 85 existing folders (add `run.yaml` and expected files)              |
| Drilling page                                                                | 12,845 words; 5 of 5 exact `##` sections; headings: Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 0 words short                                                                    |
| Katas                                                                        | 10                                                                                                                                                               | at least 8 as `before`/`after` units in `drilling/code`                                                                                                                                  | none                                                                             |
| Accuracy-note files and verification tags                                    | files: 1; tags: 0                                                                                                                                                | none; the facts sit in References                                                                                                                                                        | convert to References                                                            |
| `## Examples by Level` in `learning/overview.md`                             | present                                                                                                                                                          | present, one bullet per example                                                                                                                                                          | none                                                                             |
| Frontmatter                                                                  | `format` by-example, `category` data-and-databases, `description` from plan 03; `estimatedHours` snapshot 16                                                     | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed by plan 03's drift test after the last edit                                                  | recompute                                                                        |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **DC2** The course has 0 `run.yaml` files: not opted in to plan 05's harness.
- **DC3** 2 code fences and 86 output blocks carry no anchor.
- **DC4** 58 of 109 anchors differ from their files; 0 point at no file.
- **DC6** 6 of 85 "Why It Matters" blocks outside 50 to 100 words (median 64; heuristic count).
- **DC12** Scan hits (approximate, CP-1 reads each): wall-clock reads: 6, sleeps: 2, thread/goroutine/process uses: 5, hash-order prints: 1.
- **DC13** Scan hits (approximate): network calls: 22, database uses: 108, file-system uses: 1, Linux-only calls: 1, services needed: postgres.
- **DC14** Leftover accuracy-note files: 1; verification tags: 0; both are converted into References.
- **DC15** Prerequisites and metadata: re-derived and re-checked in CP-6 (universal).

## Fixes and design

- Convert the 85 example folders to units: `psql -X -v ON_ERROR_STOP=1 -f main.sql` runs with expected files; the 22 Python files import `psycopg` (one also `psycopg_pool`) and keep it: the course lock pins `psycopg[binary]` and `psycopg-pool` with hashes (plan 06's `pg8000` lock is not reused, because the lessons teach the `psycopg` API).
- Re-anchor the 58 fences that differ from their files after reading each diff; anchor the 86 unanchored output blocks.
- Replace plan text that depends on statistics timing, `\timing` durations, and wall-clock values with the deterministic forms above; record every expected plan only after reading it.
- Re-verify PostgreSQL 18 behaviour claims (index skip scan, `EXPLAIN` additions, async I/O settings) in the mode gate against the PostgreSQL 18 documentation.
- Bring 6 of the 85 "Why It Matters" blocks found (median 64 words) into the 50 to 100 word band by adding the example-specific consequence, not a template sentence (guard FG6). The count is a heuristic; the mode checker's reading is authoritative.
- Determinism and environment: Two-session lock examples use the `dblink` two-session pattern and the `deadlock_timeout` trick; `NOWAIT` and `SKIP LOCKED` replace waiting. `\timing` shows its on/off state, never a duration. Buffer counts are masked or left out because they depend on cache state. Example 82 needs `pg_stat_statements`, which needs a server start option (decision D5).
- Anchors: after every edit run `EX-SYNC`; where a lesson fence and its file differ, read both and decide which is right before changing either (no quiet narrowing; no prose-only repair of a code fact).

## Harness mode and toolchain

- **Harness mode**: Real mode with a PostgreSQL service.
- **Toolchain ids**: `psql`, `python`; services: `postgres` (ids that are already in plan 05's catalog use its pins as read on 2026-10-09; Phase 0 re-reads them).
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog. Plan 06's `psql` entry is reused.
- **Course lock** (hash-locked, plan 05's lock recipe; no run installs anything): `psycopg[binary]` (22 files), `psycopg-pool` (1 file).
- **Phase 1 spikes**: SP1 (hash-locked course locks resolve and install offline on the Python image), SP5 (`pg_stat_statements` mechanism), SP12 (timing and CI projection) (defined in [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-budget.md#phase-1-spikes)).
- **Illustration budget**: at most 3 fences.
- **CI cost** (planning figure, replaced by the SP12 measurement): about 9.5 s per container invocation × 2 executions × 104 runs (85 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 32.9 minutes.

## Database fixture

- **Container**: `postgres` service, trust authentication, host alias `postgres`, internal network, started once per unit run with `ready` and `readyTimeout` from the catalog.
- **Image**: The PostgreSQL 18.6 image pinned by digest in plan 05's catalog (the same digest `psql` uses). Phase 0 records the digest.
- **Fixed data**: Each unit creates its own schema (`CREATE SCHEMA ex_NN`), loads fixed rows with `generate_series` and integer formulas (no `random()`), runs `ANALYZE`, and queries with `ORDER BY ... COLLATE "C"`. Plans print `EXPLAIN (COSTS OFF)` after `ANALYZE`; analyzed plans use `TIMING OFF, SUMMARY OFF`.
- **Rules** (plan 05's service contract, [tech-docs/003](../../tech-docs/003-harness-modes-simulation-and-determinism.md#service-backed-units)): `services` in `run.yaml`; `ready` and `readyTimeout` from the catalog; no run reads the clock, a sequence, or a random value into output.

## Size class and sequencing

- **Size class M** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#size-class-rule): words to write 0 (class S), units authored from scratch 0 (class S), reading edits 64 (class M).
- **Agent packets**: one packet per defect group (anchors and sync, annotation and density, drilling and katas).
- **CI weight**: about 32.9 CI shard-minutes per full run of this course (a planning figure; SP12 replaces it with a measurement).
- **Wave 2**, slot 1. Maker: `apps-ayokoding-www-by-example-maker` for authoring gaps; fixer: `tutorial-by-example-fixer` for gate findings; `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `database-internals-and-storage-engines` (wave 5), `capstone-solid-core` (wave 7), `data-access-orms-and-query-builders` (wave 7), `build-your-own-orm-and-query-builder` (wave 8), `system-design` (wave 11), `data-engineering` (wave 11).

## Prerequisite re-check

- Plan 02 result: Added: `sql-essentials`, `just-enough-python`, `backend-essentials`; Removed: `advanced-algorithms`.
- In-plan prerequisites are audited first: `sql-essentials` (wave 1).
- Prerequisites outside this plan (unchanged here): `just-enough-python`, `backend-essentials`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests.

## Per-course checklist

- [ ] CP-0 Readiness: in-plan prerequisites `sql-essentials` are DONE in the ledger; spikes SP1, SP5, SP12 are recorded as passed.
- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `advanced-sql-and-query-performance` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder in report-only form (not a gate cycle); `COMPLETION-PROBE advanced-sql-and-query-performance by-example` (RED; the failing scenarios go in the ledger); `FILLER` and the course's row in the printed metrics table; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (M): the packets above. Classes: DC2, DC3, DC4, DC6, DC12, DC13, DC14. Author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file. Unit rule: first run plus at most 2 fix attempts, then a simpler replacement.
- [ ] Units: all 85 existing example folders converted to units; kata units in `drilling/code`; harness pre-check green for every unit before the gate starts.
- [ ] Illustration budget kept (see Harness mode and toolchain); no runnable block is marked as an illustration to pass sync (plan 05 M11).
- [ ] Database fixture: image digest pinned, schema or keyspace per unit, fixed data, ordered output; the double run matches byte for byte.
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `advanced-sql-and-query-performance` exits 0 (at most 2 repair cycles).
- [ ] CP-6 Registry, guard, metadata, and closure: `FILLER` shows no fired rule for the course; `estimatedHours` recomputed from plan 03's drift test; `prerequisites` re-derived; the row `advanced-sql-and-query-performance` (`by-example`) added to `AUDITED_COURSES` and `COMPLETION` green; plan 02's integrity tests (`PATH-TESTS`) green.
- [ ] CP-7 Ledger row complete in `local-tmp/ayokoding-learn/execution-ledger.md`; one commit `fix(ayokoding-www): audit advanced-sql-and-query-performance course` with only this course folder, its `_index.md`, and its `AUDITED_COURSES` row, and any other metadata file CP-6 changed (a prerequisite edge or the AI manifest).
- [ ] C11 Course-specific obligation: Every `EXPLAIN` in an expected file is deterministic for the pinned digest: `COSTS OFF` after `ANALYZE`, or an analyzed plan with timing and buffers removed.

## Accuracy notes

- PostgreSQL 18.6 feature statements (planner, `EXPLAIN` output, `pg_stat_statements` columns) are re-read against postgresql.org on the execution date; plan shapes are valid only for the pinned image digest and are recorded as such.
- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/advanced-sql-and-query-performance/` (stable repository facts; Phase 0 and CP-1 re-measure). Scan hits for determinism and environment are approximate and are read, not trusted, in CP-1.
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; SP12 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them beyond the notes above.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–28 (28): from "Uncorrelated Subquery" to "psql \\timing".
- **co-02 · intermediate** — examples 29–64 (36): from "Correlated Subquery to Join" to "Materialized View Refresh".
- **co-03 · advanced** — examples 65–85 (21): from "Recursive CTE, Shortest Path" to "Capstone Preview, Tuning".

## Lineage

- Follows SQL Essentials; prepares data access, database internals, data engineering, and system design.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 91 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 89 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 74 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
