# NoSQL Databases

**Course ID**: `nosql-databases` · **Format**: By Example · **Category**: data-and-databases.

**Scope note**: Audits and fixes the existing `nosql-databases` course to the series definition of done (decision 27) and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. `graph-databases` keeps graphs; `search-and-information-retrieval` keeps indexes; `sql-essentials` is the relational contrast. This course keeps key-value, document, wide-column, time-series, and columnar stores plus consistency models. It does not touch `content/id/**`, any path manifest (except an AI manifest co-update when a prerequisite change alters the AI core), or another course.

**Short summary**: Choose document, key-value, or column stores to match how data is read.

## Why this exists · the big idea

- **The problem before the solution**: none of its 91 examples is run by any check (0 `run.yaml`); 93 fences and output blocks without an anchor; 93 anchors that differ from their files; 0 of 8 katas.
- **Keep-this-if-you-forget-everything**: Pick the store by how the data is read; each example runs one store's real client or shell on fixed data, or a model of the mechanism it teaches.

## Prerequisites

- **Prior courses** (plan 02's revised list, kept plus added, as read on 2026-10-09): `sql-essentials`, `just-enough-python`.
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Each store has commands a reader can run; 91 examples (floor 75, band top 85) follow By Example pace and the lesson count stays as is: no example is removed to meet the band.
- **Wave**: 10 (slot 3); **size class**: L (words to write 0, units authored 8); **expected defect classes**: 7 of 15 variable classes, plus the two universal ones (DC2, DC15).

| Measure                                                                      | Today (2026-10-09, `bb7f90137`)                                                                                                                                 | Target                                                                                                                                                                                   | Work                                            |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded)                | 95,523                                                                                                                                                          | at least 28,000                                                                                                                                                                          | none (floor met)                                |
| Examples                                                                     | 91 as `### Example N`                                                                                                                                           | at least 75, as `### Example N: Title`, numbered 1 to N without gaps                                                                                                                     | none (the floor is never a cap)                 |
| Mermaid diagrams                                                             | 37                                                                                                                                                              | 30 to 50                                                                                                                                                                                 | none                                            |
| "Why It Matters" (50 to 100 words) and key takeaway                          | 91 and 91 (for 91 examples)                                                                                                                                     | one of each per example, each "Why It Matters" block 50 to 100 words                                                                                                                     | none                                            |
| Annotation density (comment lines per code line, measured on the code files) | median 1.0; 22 below 1.0; 1 above 2.25 (of 91 units)                                                                                                            | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 23 to fix                                       |
| Code fences and anchors                                                      | 192 non-diagram fences; 3 code fences unanchored                                                                                                                | every code fence anchored or marked as an illustration                                                                                                                                   | 3 to anchor                                     |
| Lesson-to-file anchors (plan 05's method)                                    | 93 path anchors: 93 resolve to a file, of which 93 differ from it; 0 missing                                                                                    | every anchor matches its file                                                                                                                                                            | 93 to repair after reading each diff            |
| Output blocks                                                                | 90 unanchored                                                                                                                                                   | every `**Output**` block anchored to an expected file                                                                                                                                    | 90 to anchor                                    |
| Harness units                                                                | 91 example folders, 0 kata folders in `drilling/code`, 97 code files, 0 `run.yaml`                                                                              | 91 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | author about 8; convert the 91 existing folders |
| Drilling page                                                                | 6,588 words; 5 of 5 exact `##` sections; headings: Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 0 words short                                   |
| Katas                                                                        | 0                                                                                                                                                               | at least 8 as `before`/`after` units in `drilling/code`                                                                                                                                  | 8 to write                                      |
| Accuracy-note files and verification tags                                    | files: 2; tags: 0                                                                                                                                               | none; the facts sit in References                                                                                                                                                        | convert to References                           |
| `## Examples by Level` in `learning/overview.md`                             | present                                                                                                                                                         | present, one bullet per example                                                                                                                                                          | none                                            |
| Frontmatter                                                                  | `format` by-example, `category` data-and-databases, `description` from plan 03; `estimatedHours` snapshot 10                                                    | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed by plan 03's drift test after the last edit                                                  | recompute                                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **DC2** The course has 0 `run.yaml` files: not opted in to plan 05's harness.
- **DC3** 3 code fences and 90 output blocks carry no anchor.
- **DC4** 93 of 93 anchors differ from their files; 0 point at no file.
- **DC7** Annotation density (comment lines per code line, code files of 91 units): median 1.0, 22 units below 1.0, 1 above 2.25.
- **DC11** 0 katas; the floor is 8 (8 to write).
- **DC12** Scan hits (approximate, CP-1 reads each): wall-clock reads: 9, sleeps: 9, thread/goroutine/process uses: 1, hash-order prints: 13.
- **DC13** Scan hits (approximate): network calls: 58, database uses: 62, file-system uses: 5, Windows-only calls: 2, Linux-only calls: 2, services needed: valkey, mongodb, cassandra, dynamodb-local, timescaledb.
- **DC14** Leftover accuracy-note files: 2; verification tags: 0; both are converted into References.
- **DC15** Prerequisites and metadata: re-derived and re-checked in CP-6 (universal).

## Fixes and design

- Add the service entries that pass the Phase 1 admission spike; rewrite the units of every store that does not; add the course lock (`pymongo` 25 files, `cassandra-driver` 15, `redis` 9, `boto3` 8, `psycopg[binary]` 6, `duckdb` 4, `pyarrow` 2).
- Re-anchor all 93 anchors that differ from their files (the largest anchor repair in the set) and the 3 unanchored code fences and 90 output blocks.
- Write 8 katas as `drilling/code` units; two `license check` examples keep their text and are verified against the vendors' pages with dates.
- Raise annotation in the 23 units outside the band (median 1.0): add `# =>` result lines and why-comments, never filler comments (guard FG6 reads repeated text). The scan measures the code files; the mode checker's reading of the lesson fences is authoritative.
- Determinism and environment: About 60 units call a store. A store that fails the admission test (most likely Cassandra on start time) has its units rewritten as in-process models with the same lesson, labelled as models, and the real command is shown as an illustration only if the lesson says it is not run here (decision D4 keeps this to a stated budget). The TTL, cluster-timing, and measured-latency examples use model clocks.
- Anchors: after every edit run `EX-SYNC`; where a lesson fence and its file differ, read both and decide which is right before changing either (no quiet narrowing; no prose-only repair of a code fact).

## Harness mode and toolchain

- **Harness mode**: Real mode with services and models (decision D4).
- **Toolchain ids**: `python`, `shell`; services: `valkey`, `mongodb`, `cassandra`, `dynamodb-local`, `timescaledb` (ids that are already in plan 05's catalog use its pins as read on 2026-10-09; Phase 0 re-reads them).
- **Toolchain additions** (this plan, [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-budget.md)): `valkey`, `mongodb`, `cassandra`, `dynamodb-local`, `timescaledb`. Each is gated by its spike and added by plan 05's "Adding a Toolchain" procedure.
- **Course lock** (hash-locked, plan 05's lock recipe; no run installs anything): `pymongo` (28 files), `cassandra-driver` (15 files), `redis` (9 files), `boto3` (9 files), `psycopg[binary]` (6 files), `duckdb` (4 files), `pyarrow` (2 files).
- **Phase 1 spikes**: SP1 (hash-locked course locks resolve and install offline on the Python image), SP2 (service admission), SP12 (timing and CI projection) (defined in [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-budget.md#phase-1-spikes)).
- **Illustration budget**: at most 6 fences (decision D4: only for a store that fails the admission test).
- **CI cost** (planning figure, replaced by the SP12 measurement): about 12.0 s per container invocation × 2 executions × 110 runs (91 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 44.0 minutes.

## Simulation convention

Plan 05's simulation convention (rules S1 to S9: single-threaded event loop, virtual clock, one seeded SplitMix64 generator, pure state machines, invariants after every step) applies to this course as follows (details in [tech-docs/003](../../tech-docs/003-harness-modes-simulation-and-determinism.md#simulation-convention)).

- **Units that use it**: LSM write path, leaderless and leader-follower replication, quorum math, vector clocks, CRDTs, and failover (about 18 of 91) run in-process models with a virtual clock and seeded faults.
- **Invariants** (checked after every step):
  - A read of an LSM store returns the newest write for every key, before and after compaction; tombstones hide older values until compacted away.
  - With R + W > N a quorum read observes the latest acknowledged quorum write.
  - CRDT merges are commutative, associative, and idempotent; replicas that exchange all updates converge to equal state.
  - Last-writer-wins resolves a conflict to the same winner on every replica for a given virtual timestamp order.
- **Seeds**: 1 to 64. At least 32 seeds per unit (the convention's floor). A violation prints `failing seed: <n> (<invariant>)`; the last line is `seeds: <passed> passed, <failed> failed (of <total>)`; `AYOKODING_SEED=<n>` replays one seed with a trace; `run.yaml` sets `simulation: true`. A demonstrated bug may expect exit 1 for its named seed, and the unit's `invariant` sentence says so.

## Database fixture

- **Container**: One service per store, trust or no authentication, host alias equal to the service name, internal network. Admission test per service (decision D4): digest-pinned image, ready within the unit's `readyTimeout`, deterministic output on the double run.
- **Image**: Valkey (the Redis-compatible BSD server; the course's license-check examples explain the Redis license change), MongoDB, Apache Cassandra, DynamoDB Local, and TimescaleDB images, each pinned by digest after the Phase 1 spike records start time and memory. DuckDB runs in-process from the course lock. ClickHouse is not a service: the baseline scan finds one code unit that names it, below the value floor for an addition, so that unit is a labelled illustration and the columnar family runs on DuckDB.
- **Fixed data**: Each unit uses its own key prefix, database, keyspace, or table; fixed documents and rows; no TTL race (expiry uses a short fixed TTL only where the lesson is about expiry, observed through a model clock, not through sleeping); results sorted client-side.
- **Rules** (plan 05's service contract, [tech-docs/003](../../tech-docs/003-harness-modes-simulation-and-determinism.md#service-backed-units)): `services` in `run.yaml`; `ready` and `readyTimeout` from the catalog; no run reads the clock, a sequence, or a random value into output.

## Size class and sequencing

- **Size class L** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#size-class-rule): words to write 0 (class S), units authored from scratch 8 (class S), reading edits 116 (class M). Raised by a documented override: about 60 units are converted to services or labelled models.
- **Agent packets**: one packet per learning page (unit conversion, anchors, and annotation for that page), then one packet per remaining defect group.
- **CI weight**: about 44.0 CI shard-minutes per full run of this course (a planning figure; SP12 replaces it with a measurement).
- **Wave 10**, slot 3. Maker: `apps-ayokoding-www-by-example-maker` for authoring gaps; fixer: `tutorial-by-example-fixer` for gate findings; `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 result: Kept: `sql-essentials`, `just-enough-python`.
- In-plan prerequisites are audited first: `sql-essentials` (wave 1).
- Prerequisites outside this plan (unchanged here): `just-enough-python`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests.

## Per-course checklist

- [ ] CP-0 Readiness: in-plan prerequisites `sql-essentials` are DONE in the ledger; spikes SP1, SP2, SP12 are recorded as passed; the additions `valkey`, `mongodb`, `cassandra`, `dynamodb-local`, `timescaledb` are merged into the branch and `toolchains build` is green.
- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `nosql-databases` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder in report-only form (not a gate cycle); `COMPLETION-PROBE nosql-databases by-example` (RED; the failing scenarios go in the ledger); `FILLER` and the course's row in the printed metrics table; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (L): the packets above. Classes: DC2, DC3, DC4, DC7, DC11, DC12, DC13, DC14. Author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file. Unit rule: first run plus at most 2 fix attempts, then a simpler replacement.
- [ ] Units: about 8 units authored and the 91 existing folders converted; kata units in `drilling/code`; harness pre-check green for every unit before the gate starts.
- [ ] Illustration budget kept (see Harness mode and toolchain); no runnable block is marked as an illustration to pass sync (plan 05 M11).
- [ ] Simulation: every unit above follows S1 to S9; each prints the `seeds:` summary line; a deliberately broken variant fails on a named seed.
- [ ] Database fixture: image digest pinned, schema or keyspace per unit, fixed data, ordered output; the double run matches byte for byte.
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `nosql-databases` exits 0 (at most 2 repair cycles).
- [ ] CP-6 Registry, guard, metadata, and closure: `FILLER` shows no fired rule for the course; `estimatedHours` recomputed from plan 03's drift test; `prerequisites` re-derived; the row `nosql-databases` (`by-example`) added to `AUDITED_COURSES` and `COMPLETION` green; plan 02's integrity tests (`PATH-TESTS`) green.
- [ ] CP-7 Ledger row complete in `local-tmp/ayokoding-learn/execution-ledger.md`; one commit `fix(ayokoding-www): audit nosql-databases course` with only this course folder, its `_index.md`, and its `AUDITED_COURSES` row, and any other metadata file CP-6 changed (a prerequisite edge or the AI manifest).
- [ ] C11 Course-specific obligation: Every unit that names a store either runs that store or says in one sentence that it runs a model of it.

## Accuracy notes

- Valkey, Redis, MongoDB, Cassandra 5, DynamoDB, TimescaleDB, and ClickHouse licensing, versions, and consistency semantics are re-read on the vendors' pages on the execution date; any statement not reproduced by a run carries a source.
- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/nosql-databases/` (stable repository facts; Phase 0 and CP-1 re-measure). Scan hits for determinism and environment are approximate and are read, not trusted, in CP-1.
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; SP12 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them beyond the notes above.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–27 (27): from "Key-Value SET/GET" to "License Check: Cassandra".
- **co-02 · intermediate** — examples 28–54 (27): from "Redis MULTI/EXEC Transaction" to "DynamoDB ConsistentRead Toggle".
- **co-03 · advanced** — examples 55–80 (26): from "LSM-Tree Write Path, Simulated" to "Capstone Preview: License and CAP Rationale".
- **co-04 · time-series** — examples 81–85 (5): from "TimescaleDB Hypertable, Created" to "Time-Series vs. Wide-Column Feed".
- **co-05 · olap-and-columnar-analytics** — examples 86–91 (6): from "DuckDB Columnar Scan" to "Wide-Column vs. Columnar, Same Query".

## Lineage

- Follows SQL Essentials.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 29 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 38 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 38 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
