# Database Internals and Storage Engines

**Course ID**: `database-internals-and-storage-engines` · **Format**: By Example · **Category**: data-and-databases.

**Scope note**: Audits and fixes the existing `database-internals-and-storage-engines` course to the series definition of done (decision 27) and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. `build-your-own-database` assembles the pieces into one engine; `advanced-sql-and-query-performance` uses a finished engine; this course keeps pages, B-trees, LSM trees, WAL, recovery, MVCC, and locking. It does not touch `content/id/**`, any path manifest (except an AI manifest co-update when a prerequisite change alters the AI core), or another course.

**Short summary**: Learn how B-trees, LSM-trees, and write-ahead logs store and protect data.

## Why this exists · the big idea

- **The problem before the solution**: none of its 80 examples is run by any check (0 `run.yaml`); 177 fences and output blocks without an anchor; 136 anchors that differ from their files; 80 of 80 code units below the annotation band (median 0.47).
- **Keep-this-if-you-forget-everything**: A database is files plus rules for keeping them correct after a crash; each example builds one piece (page, tree, log, lock) in Python and breaks it on purpose.

## Prerequisites

- **Prior courses** (plan 02's revised list, kept plus added, as read on 2026-10-09): `sql-essentials`, `advanced-sql-and-query-performance`.
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Each mechanism is a small program with a visible failure case; 80 examples already follow By Example pace.
- **Wave**: 5 (slot 3); **size class**: L (words to write 0, units authored 0); **expected defect classes**: 6 of 15 variable classes, plus the two universal ones (DC2, DC15).

| Measure                                                                      | Today (2026-10-09, `bb7f90137`)                                                                                                                                 | Target                                                                                                                                                                                   | Work                                                                               |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded)                | 71,340                                                                                                                                                          | at least 28,000                                                                                                                                                                          | none (floor met)                                                                   |
| Examples                                                                     | 80 as `### Example N`                                                                                                                                           | at least 75, as `### Example N: Title`, numbered 1 to N without gaps                                                                                                                     | none                                                                               |
| Mermaid diagrams                                                             | 36                                                                                                                                                              | 30 to 50                                                                                                                                                                                 | none                                                                               |
| "Why It Matters" (50 to 100 words) and key takeaway                          | 112 and 84 (for 80 examples)                                                                                                                                    | one of each per example, each "Why It Matters" block 50 to 100 words                                                                                                                     | bring 22 of the 112 blocks found into 50 to 100 words (median 64; heuristic count) |
| Annotation density (comment lines per code line, measured on the code files) | median 0.47; 80 below 1.0; 0 above 2.25 (of 80 units)                                                                                                           | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 80 to fix                                                                          |
| Code fences and anchors                                                      | 369 non-diagram fences; 0 code fences unanchored                                                                                                                | every code fence anchored or marked as an illustration                                                                                                                                   | none                                                                               |
| Lesson-to-file anchors (plan 05's method)                                    | 184 path anchors: 184 resolve to a file, of which 136 differ from it; 0 missing                                                                                 | every anchor matches its file                                                                                                                                                            | 136 to repair after reading each diff                                              |
| Output blocks                                                                | 177 unanchored                                                                                                                                                  | every `**Output**` block anchored to an expected file                                                                                                                                    | 177 to anchor                                                                      |
| Harness units                                                                | 80 example folders, 8 kata folders in `drilling/code`, 184 code files, 0 `run.yaml`                                                                             | 80 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | convert the 80 existing folders (add `run.yaml` and expected files)                |
| Drilling page                                                                | 8,667 words; 5 of 5 exact `##` sections; headings: Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 0 words short                                                                      |
| Katas                                                                        | 8                                                                                                                                                               | at least 8 as `before`/`after` units in `drilling/code`                                                                                                                                  | none                                                                               |
| Accuracy-note files and verification tags                                    | files: 2; tags: 6                                                                                                                                               | none; the facts sit in References                                                                                                                                                        | convert to References                                                              |
| `## Examples by Level` in `learning/overview.md`                             | present                                                                                                                                                         | present, one bullet per example                                                                                                                                                          | none                                                                               |
| Frontmatter                                                                  | `format` by-example, `category` data-and-databases, `description` from plan 03; `estimatedHours` snapshot 13                                                    | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed by plan 03's drift test after the last edit                                                  | recompute                                                                          |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **DC2** The course has 0 `run.yaml` files: not opted in to plan 05's harness.
- **DC3** 0 code fences and 177 output blocks carry no anchor.
- **DC4** 136 of 184 anchors differ from their files; 0 point at no file.
- **DC6** 22 of 112 "Why It Matters" blocks outside 50 to 100 words (median 64; heuristic count).
- **DC7** Annotation density (comment lines per code line, code files of 80 units): median 0.47, 80 units below 1.0, 0 above 2.25.
- **DC12** Scan hits (approximate, CP-1 reads each): hash-order prints: 13.
- **DC14** Leftover accuracy-note files: 2; verification tags: 6; both are converted into References.
- **DC15** Prerequisites and metadata: re-derived and re-checked in CP-6 (universal).

## Fixes and design

- Reconcile the 136 anchor differences the scan found (plan 05 counted 120); the CLI is the authority. Read each diff; a difference may be a stale lesson or a stale file.
- Anchor the 177 output blocks; convert the 2 leftover accuracy-note files and 6 verification tags into References.
- Confirm the 8 katas and the capstone mini storage engine run twice with equal output.
- Raise annotation in the 80 units outside the band (median 0.47): add `# =>` result lines and why-comments, never filler comments (guard FG6 reads repeated text). The scan measures the code files; the mode checker's reading of the lesson fences is authoritative.
- Bring 22 of the 112 "Why It Matters" blocks found (median 64 words) into the 50 to 100 word band by adding the example-specific consequence, not a template sentence (guard FG6). The count is a heuristic; the mode checker's reading is authoritative.
- Determinism and environment: Files live under `/tmp` (an in-memory filesystem in the harness) and paths are printed relative to the unit. `fsync` is a no-op there; the lessons that discuss durability say what the run proves (the protocol, not the device). Checksums use `zlib.crc32`, whose value is stable; compressed bytes are never printed.
- Anchors: after every edit run `EX-SYNC`; where a lesson fence and its file differ, read both and decide which is right before changing either (no quiet narrowing; no prose-only repair of a code fact).

## Harness mode and toolchain

- **Harness mode**: Real mode with the simulation convention.
- **Toolchain ids**: `python` (ids that are already in plan 05's catalog use its pins as read on 2026-10-09; Phase 0 re-reads them).
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Course lock** (hash-locked, plan 05's lock recipe; no run installs anything): `pytest` (6 files).
- **Phase 1 spikes**: SP1 (hash-locked course locks resolve and install offline on the Python image), SP12 (timing and CI projection) (defined in [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-budget.md#phase-1-spikes)).
- **Illustration budget**: at most 3 fences.
- **CI cost** (planning figure, replaced by the SP12 measurement): about 2.6 s per container invocation × 2 executions × 99 runs (80 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 8.6 minutes.

## Simulation convention

Plan 05's simulation convention (rules S1 to S9: single-threaded event loop, virtual clock, one seeded SplitMix64 generator, pure state machines, invariants after every step) applies to this course as follows (details in [tech-docs/003](../../tech-docs/003-harness-modes-simulation-and-determinism.md#simulation-convention)).

- **Units that use it**: Crash and recovery, group commit, lock schedules, and anomaly examples (about 20 of 80) run a storage model with a crash injected at a chosen or seeded step, files in `/tmp`, and a virtual clock.
- **Invariants** (checked after every step):
  - Durability: every transaction acknowledged before the crash is present after recovery, for every injected crash point.
  - Atomicity: no effect of an unacknowledged transaction is present after recovery.
  - Recovery is idempotent: running it twice gives the same state as running it once.
  - B-tree: keys stay sorted, all leaves are at one depth, and no node is below minimum fill after seeded insert and delete workloads.
  - A serial schedule's result equals the result of every schedule the lock protocol permits (the isolation claim of each lock example).
- **Seeds**: 1 to 64 for workloads; crash points are enumerated exhaustively for the short logs. At least 32 seeds per unit (the convention's floor). A violation prints `failing seed: <n> (<invariant>)`; the last line is `seeds: <passed> passed, <failed> failed (of <total>)`; `AYOKODING_SEED=<n>` replays one seed with a trace; `run.yaml` sets `simulation: true`. A demonstrated bug may expect exit 1 for its named seed, and the unit's `invariant` sentence says so.

## Size class and sequencing

- **Size class L** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#size-class-rule): words to write 0 (class S), units authored from scratch 0 (class S), reading edits 238 (class L).
- **Agent packets**: one packet per learning page (unit conversion, anchors, and annotation for that page), then one packet per remaining defect group.
- **CI weight**: about 8.6 CI shard-minutes per full run of this course (a planning figure; SP12 replaces it with a measurement).
- **Wave 5**, slot 3. Maker: `apps-ayokoding-www-by-example-maker` for authoring gaps; fixer: `tutorial-by-example-fixer` for gate findings; `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `build-your-own-database` (wave 9).

## Prerequisite re-check

- Plan 02 result: Kept: `sql-essentials`, `advanced-sql-and-query-performance`.
- In-plan prerequisites are audited first: `sql-essentials` (wave 1), `advanced-sql-and-query-performance` (wave 2).
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests.

## Per-course checklist

- [ ] CP-0 Readiness: in-plan prerequisites `sql-essentials`, `advanced-sql-and-query-performance` are DONE in the ledger; spikes SP1, SP12 are recorded as passed.
- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `database-internals-and-storage-engines` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder in report-only form (not a gate cycle); `COMPLETION-PROBE database-internals-and-storage-engines by-example` (RED; the failing scenarios go in the ledger); `FILLER` and the course's row in the printed metrics table; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (L): the packets above. Classes: DC2, DC3, DC4, DC6, DC7, DC12, DC14. Author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file. Unit rule: first run plus at most 2 fix attempts, then a simpler replacement.
- [ ] Units: all 80 existing example folders converted to units; kata units in `drilling/code`; harness pre-check green for every unit before the gate starts.
- [ ] Illustration budget kept (see Harness mode and toolchain); no runnable block is marked as an illustration to pass sync (plan 05 M11).
- [ ] Simulation: every unit above follows S1 to S9; each prints the `seeds:` summary line; a deliberately broken variant fails on a named seed.
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `database-internals-and-storage-engines` exits 0 (at most 2 repair cycles).
- [ ] CP-6 Registry, guard, metadata, and closure: `FILLER` shows no fired rule for the course; `estimatedHours` recomputed from plan 03's drift test; `prerequisites` re-derived; the row `database-internals-and-storage-engines` (`by-example`) added to `AUDITED_COURSES` and `COMPLETION` green; plan 02's integrity tests (`PATH-TESTS`) green.
- [ ] CP-7 Ledger row complete in `local-tmp/ayokoding-learn/execution-ledger.md`; one commit `fix(ayokoding-www): audit database-internals-and-storage-engines course` with only this course folder, its `_index.md`, and its `AUDITED_COURSES` row, and any other metadata file CP-6 changed (a prerequisite edge or the AI manifest).
- [ ] C11 Course-specific obligation: Every durability or atomicity claim is proved by a crash-injection run, not by a statement.

## Accuracy notes

- Claims about ARIES, LSM compaction strategies, PostgreSQL and SQLite WAL formats are cited with a source and date; any 'PostgreSQL 18 does X' statement is checked against postgresql.org.
- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/database-internals-and-storage-engines/` (stable repository facts; Phase 0 and CP-1 re-measure). Scan hits for determinism and environment are approximate and are read, not trusted, in CP-1.
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; SP12 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them beyond the notes above.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–28 (28): from "Allocate a Fixed-Size Page" to "Bloom Filter Never False-Negatives".
- **co-02 · intermediate** — examples 29–56 (28): from "Append-Only Log Replay" to "A Column Scan Reads Fewer Bytes for a Single-Column Aggregat".
- **co-03 · advanced** — examples 57–80 (24): from "Dictionary Encoding" to "A Mini Storage Engine: Pages + B-Tree Index + WAL + Snapshot".

## Lineage

- Follows SQL Essentials and Advanced SQL; prepares Build Your Own Database.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 94 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 93 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 78 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
