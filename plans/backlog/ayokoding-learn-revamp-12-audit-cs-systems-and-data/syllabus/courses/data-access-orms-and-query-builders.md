# Data Access: ORMs & Query Builders

**Course ID**: `data-access-orms-and-query-builders` · **Format**: By Example · **Category**: data-and-databases.

**Scope note**: Audits and fixes the existing `data-access-orms-and-query-builders` course to the series definition of done (decision 27) and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. `build-your-own-orm-and-query-builder` builds the tools; `advanced-sql-and-query-performance` tunes the SQL; this course keeps sessions, relationships, loading strategies, transactions, and migrations with SQLAlchemy. It does not touch `content/id/**`, any path manifest (except an AI manifest co-update when a prerequisite change alters the AI core), or another course.

**Short summary**: Use ORMs and query builders safely and avoid hidden extra queries.

## Why this exists · the big idea

- **The problem before the solution**: none of its 78 examples is run by any check (0 `run.yaml`); 85 fences and output blocks without an anchor.
- **Keep-this-if-you-forget-everything**: An ORM hides queries, so you must still see them; each example runs the same task through the driver, a query builder, and an ORM against PostgreSQL and prints the SQL it sent.

## Prerequisites

- **Prior courses** (plan 02's revised list, kept plus added, as read on 2026-10-09): `advanced-sql-and-query-performance`, `sql-essentials`.
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Each lesson runs the same task three ways; 78 examples already follow By Example pace.
- **Wave**: 7 (slot 2); **size class**: M (words to write 0, units authored 2); **expected defect classes**: 5 of 15 variable classes, plus the two universal ones (DC2, DC15).

| Measure                                                                      | Today (2026-10-09, `bb7f90137`)                                                                              | Target                                                                                                                                                                                   | Work                                            |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded)                | 90,222                                                                                                       | at least 28,000                                                                                                                                                                          | none (floor met)                                |
| Examples                                                                     | 78 as `### Example N`                                                                                        | at least 75, as `### Example N: Title`, numbered 1 to N without gaps                                                                                                                     | none                                            |
| Mermaid diagrams                                                             | 31                                                                                                           | 30 to 50                                                                                                                                                                                 | none                                            |
| "Why It Matters" (50 to 100 words) and key takeaway                          | 78 and 78 (for 78 examples)                                                                                  | one of each per example, each "Why It Matters" block 50 to 100 words                                                                                                                     | none                                            |
| Annotation density (comment lines per code line, measured on the code files) | median 1.03; 0 below 1.0; 0 above 2.25 (of 78 units)                                                         | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | none                                            |
| Code fences and anchors                                                      | 190 non-diagram fences; 1 code fences unanchored                                                             | every code fence anchored or marked as an illustration                                                                                                                                   | 1 to anchor                                     |
| Lesson-to-file anchors (plan 05's method)                                    | 94 path anchors: 94 resolve to a file, of which 0 differ from it; 0 missing                                  | every anchor matches its file                                                                                                                                                            | none                                            |
| Output blocks                                                                | 84 unanchored                                                                                                | every `**Output**` block anchored to an expected file                                                                                                                                    | 84 to anchor                                    |
| Harness units                                                                | 78 example folders, 6 kata folders in `drilling/code`, 94 code files, 0 `run.yaml`                           | 78 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | author about 2; convert the 78 existing folders |
| Drilling page                                                                | 8,714 words; 3 of 5 exact `##` sections; headings: Recall Q&A, Applied problems, Code katas, Why it matters  | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 0 words short; fix sections                     |
| Katas                                                                        | 6                                                                                                            | at least 8 as `before`/`after` units in `drilling/code`                                                                                                                                  | 2 to write                                      |
| Accuracy-note files and verification tags                                    | files: 0; tags: 0                                                                                            | none; the facts sit in References                                                                                                                                                        | none                                            |
| `## Examples by Level` in `learning/overview.md`                             | present                                                                                                      | present, one bullet per example                                                                                                                                                          | none                                            |
| Frontmatter                                                                  | `format` by-example, `category` data-and-databases, `description` from plan 03; `estimatedHours` snapshot 11 | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed by plan 03's drift test after the last edit                                                  | recompute                                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **DC2** The course has 0 `run.yaml` files: not opted in to plan 05's harness.
- **DC3** 1 code fences and 84 output blocks carry no anchor.
- **DC10** 3 of 5 exact `##` sections (found: Recall Q&A, Applied problems, Code katas, Why it matters).
- **DC11** 6 katas; the floor is 8 (2 to write).
- **DC12** Scan hits (approximate, CP-1 reads each): wall-clock reads: 4, thread/goroutine/process uses: 1, asyncio uses: 4, environment/pid reads: 85, hash-order prints: 1.
- **DC13** Scan hits (approximate): network calls: 86, database uses: 86, file-system uses: 10, Linux-only calls: 1, services needed: postgres.
- **DC15** Prerequisites and metadata: re-derived and re-checked in CP-6 (universal).

## Fixes and design

- Add a hash-locked course lock for the libraries the code imports: `sqlalchemy` (76 files), `psycopg[binary]` (15), `alembic` (10), `pypika` (10), `peewee` (2).
- Anchor the 84 output blocks and the one unanchored code fence; add the 2 missing katas; add the fifth drilling section (the page ends with a stray `Why it matters` heading).
- Replace every `os.environ` default that points at a real host with the service alias.
- Determinism and environment: The 85 files that read connection settings from the environment get them from `run.yaml` `env` (`PG_HOST=postgres`, a trust user, no password). SQL echo output is ordered and contains no timestamps. Async examples run one event loop and print results after `gather` in a fixed order.
- Anchors: after every edit run `EX-SYNC`; where a lesson fence and its file differ, read both and decide which is right before changing either (no quiet narrowing; no prose-only repair of a code fact).

## Harness mode and toolchain

- **Harness mode**: Real mode with a PostgreSQL service.
- **Toolchain ids**: `python`; services: `postgres` (ids that are already in plan 05's catalog use its pins as read on 2026-10-09; Phase 0 re-reads them).
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Course lock** (hash-locked, plan 05's lock recipe; no run installs anything): `sqlalchemy` (76 files), `psycopg[binary]` (15 files), `alembic` (10 files), `pypika` (10 files), `peewee` (2 files).
- **Phase 1 spikes**: SP1 (hash-locked course locks resolve and install offline on the Python image), SP12 (timing and CI projection) (defined in [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-budget.md#phase-1-spikes)).
- **Illustration budget**: at most 3 fences.
- **CI cost** (planning figure, replaced by the SP12 measurement): about 9.0 s per container invocation × 2 executions × 97 runs (78 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 29.1 minutes.

## Database fixture

- **Container**: `postgres` service, trust authentication, host alias `postgres`, one schema per unit.
- **Image**: The PostgreSQL 18.6 image pinned by digest in plan 05's catalog.
- **Fixed data**: Fixed seed rows loaded by the unit from a SQL file in the unit; ids are explicit integers, never sequences read back as output; timestamps are fixed literals.
- **Rules** (plan 05's service contract, [tech-docs/003](../../tech-docs/003-harness-modes-simulation-and-determinism.md#service-backed-units)): `services` in `run.yaml`; `ready` and `readyTimeout` from the catalog; no run reads the clock, a sequence, or a random value into output.

## Size class and sequencing

- **Size class M** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#size-class-rule): words to write 0 (class S), units authored from scratch 2 (class S), reading edits 0 (class S). Raised by a documented override: 78 units run against a PostgreSQL service.
- **Agent packets**: one packet per defect group (anchors and sync, annotation and density, drilling and katas).
- **CI weight**: about 29.1 CI shard-minutes per full run of this course (a planning figure; SP12 replaces it with a measurement).
- **Wave 7**, slot 2. Maker: `apps-ayokoding-www-by-example-maker` for authoring gaps; fixer: `tutorial-by-example-fixer` for gate findings; `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `build-your-own-orm-and-query-builder` (wave 8).

## Prerequisite re-check

- Plan 02 result: Kept: `advanced-sql-and-query-performance`; Added: `sql-essentials`.
- In-plan prerequisites are audited first: `advanced-sql-and-query-performance` (wave 2), `sql-essentials` (wave 1).
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests.

## Per-course checklist

- [ ] CP-0 Readiness: in-plan prerequisites `advanced-sql-and-query-performance`, `sql-essentials` are DONE in the ledger; spikes SP1, SP12 are recorded as passed.
- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `data-access-orms-and-query-builders` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder in report-only form (not a gate cycle); `COMPLETION-PROBE data-access-orms-and-query-builders by-example` (RED; the failing scenarios go in the ledger); `FILLER` and the course's row in the printed metrics table; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (M): the packets above. Classes: DC2, DC3, DC10, DC11, DC12, DC13. Author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file. Unit rule: first run plus at most 2 fix attempts, then a simpler replacement.
- [ ] Units: about 2 units authored and the 78 existing folders converted; kata units in `drilling/code`; harness pre-check green for every unit before the gate starts.
- [ ] Illustration budget kept (see Harness mode and toolchain); no runnable block is marked as an illustration to pass sync (plan 05 M11).
- [ ] Database fixture: image digest pinned, schema or keyspace per unit, fixed data, ordered output; the double run matches byte for byte.
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `data-access-orms-and-query-builders` exits 0 (at most 2 repair cycles).
- [ ] CP-6 Registry, guard, metadata, and closure: `FILLER` shows no fired rule for the course; `estimatedHours` recomputed from plan 03's drift test; `prerequisites` re-derived; the row `data-access-orms-and-query-builders` (`by-example`) added to `AUDITED_COURSES` and `COMPLETION` green; plan 02's integrity tests (`PATH-TESTS`) green.
- [ ] CP-7 Ledger row complete in `local-tmp/ayokoding-learn/execution-ledger.md`; one commit `fix(ayokoding-www): audit data-access-orms-and-query-builders course` with only this course folder, its `_index.md`, and its `AUDITED_COURSES` row, and any other metadata file CP-6 changed (a prerequisite edge or the AI manifest).
- [ ] C11 Course-specific obligation: Every example that prints SQL shows the statement text the driver received, with parameters, in a stable order.

## Accuracy notes

- SQLAlchemy 2.x API statements and PostgreSQL 18 behaviour are re-read on sqlalchemy.org and postgresql.org on the execution date.
- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/data-access-orms-and-query-builders/` (stable repository facts; Phase 0 and CP-1 re-measure). Scan hits for determinism and environment are approximate and are read, not trusted, in CP-1.
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; SP12 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them beyond the notes above.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–28 (28): from "Spectrum: Same Query, Three Ways" to "Session Lifecycle Begin".
- **co-02 · intermediate** — examples 29–56 (28): from "Session States Transient Pending" to "Cascade vs DB Foreign Key".
- **co-03 · advanced** — examples 57–78 (22): from "Bulk Insert ORM" to "Capstone Preview Three Tier".

## Lineage

- Follows Advanced SQL; prepares Build Your Own ORM and backend courses.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 92 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 90 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 75 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
