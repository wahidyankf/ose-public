# SQL Essentials

**Course ID**: `sql-essentials` · **Format**: By Example · **Category**: data-and-databases.

**Scope note**: Audits and fixes the existing `sql-essentials` course to the series definition of done (decision 27) and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. `advanced-sql-and-query-performance` keeps plans, indexes, and locks on PostgreSQL; this course keeps tables, joins, aggregates, transactions, and Python `sqlite3`. The engine stays SQLite (decision D14). It does not touch `content/id/**`, any path manifest (except an AI manifest co-update when a prerequisite change alters the AI core), or another course.

**Short summary**: Model data in tables and query it with joins, filters, and aggregates.

## Why this exists · the big idea

- **The problem before the solution**: none of its 80 examples is run by any check (0 `run.yaml`); 96 fences and output blocks without an anchor; 28 anchors that differ from their files.
- **Keep-this-if-you-forget-everything**: SQL asks a table a question; every example is a script whose printed rows the lesson shows, against SQLite.

## Prerequisites

- **Prior courses** (plan 02's revised list, kept plus added, as read on 2026-10-09): `just-enough-python`.
- **Edges plan 02 removes**: `project-management`.
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Every concept is a statement a reader can run and break. Plans 06 and 07 cite this course as the By Example exemplar, so it must not regress.
- **Wave**: 1 (slot 1); **size class**: M (words to write 0, units authored 0); **expected defect classes**: 6 of 15 variable classes, plus the two universal ones (DC2, DC15).

| Measure                                                                      | Today (2026-10-09, `bb7f90137`)                                                                                                                                 | Target                                                                                                                                                                                   | Work                                                                             |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded)                | 51,835                                                                                                                                                          | at least 28,000                                                                                                                                                                          | none (floor met)                                                                 |
| Examples                                                                     | 80 as `### Example N`                                                                                                                                           | at least 75, as `### Example N: Title`, numbered 1 to N without gaps                                                                                                                     | none                                                                             |
| Mermaid diagrams                                                             | 33                                                                                                                                                              | 30 to 50                                                                                                                                                                                 | none                                                                             |
| "Why It Matters" (50 to 100 words) and key takeaway                          | 80 and 80 (for 80 examples)                                                                                                                                     | one of each per example, each "Why It Matters" block 50 to 100 words                                                                                                                     | bring 8 of the 80 blocks found into 50 to 100 words (median 63; heuristic count) |
| Annotation density (comment lines per code line, measured on the code files) | median 1.03; 14 below 1.0; 0 above 2.25 (of 80 units)                                                                                                           | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 14 to fix                                                                        |
| Code fences and anchors                                                      | 223 non-diagram fences; 8 code fences unanchored                                                                                                                | every code fence anchored or marked as an illustration                                                                                                                                   | 8 to anchor                                                                      |
| Lesson-to-file anchors (plan 05's method)                                    | 112 path anchors: 111 resolve to a file, of which 28 differ from it; 1 missing                                                                                  | every anchor matches its file                                                                                                                                                            | 29 to repair after reading each diff                                             |
| Output blocks                                                                | 88 unanchored                                                                                                                                                   | every `**Output**` block anchored to an expected file                                                                                                                                    | 88 to anchor                                                                     |
| Harness units                                                                | 80 example folders, 8 kata folders in `drilling/code`, 111 code files, 0 `run.yaml`                                                                             | 80 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | convert the 80 existing folders (add `run.yaml` and expected files)              |
| Drilling page                                                                | 8,502 words; 5 of 5 exact `##` sections; headings: Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 0 words short                                                                    |
| Katas                                                                        | 8                                                                                                                                                               | at least 8 as `before`/`after` units in `drilling/code`                                                                                                                                  | none                                                                             |
| Accuracy-note files and verification tags                                    | files: 1; tags: 0                                                                                                                                               | none; the facts sit in References                                                                                                                                                        | convert to References                                                            |
| `## Examples by Level` in `learning/overview.md`                             | present                                                                                                                                                         | present, one bullet per example                                                                                                                                                          | none                                                                             |
| Frontmatter                                                                  | `format` by-example, `category` data-and-databases, `description` from plan 03; `estimatedHours` snapshot 8                                                     | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed by plan 03's drift test after the last edit                                                  | recompute                                                                        |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **DC2** The course has 0 `run.yaml` files: not opted in to plan 05's harness.
- **DC3** 8 code fences and 88 output blocks carry no anchor.
- **DC4** 28 of 112 anchors differ from their files; 1 point at no file.
- **DC6** 8 of 80 "Why It Matters" blocks outside 50 to 100 words (median 63; heuristic count).
- **DC7** Annotation density (comment lines per code line, code files of 80 units): median 1.03, 14 units below 1.0, 0 above 2.25.
- **DC13** Scan hits (approximate): database uses: 105, file-system uses: 5.
- **DC14** Leftover accuracy-note files: 1; verification tags: 0; both are converted into References.
- **DC15** Prerequisites and metadata: re-derived and re-checked in CP-6 (universal).

## Fixes and design

- Re-anchor the 28 fences the CLI reports as different from their files, reading each diff before choosing a direction; fix the 1 missing anchor; anchor the 8 unanchored fences and the output blocks.
- Lock `pytest` with hashes (`requirements.in` and `requirements.lock` inside the course) and run the pytest examples as `kind: test` runs.
- Raise the 14 examples below the density band; reconcile the lesson's SQLite release claim with the version the image ships.
- Bring 8 of the 80 "Why It Matters" blocks found (median 63 words) into the 50 to 100 word band by adding the example-specific consequence, not a template sentence (guard FG6). The count is a heuristic; the mode checker's reading is authoritative.
- Determinism and environment: The `sqlite3` CLI comes from the `shell` image and the Python module from the `python` image; their SQLite versions can differ from each other and from the version the lessons name. One unit prints the library version into an expected file and the lesson states that value. `ORDER BY` is explicit on every query; `datetime('now')` and `random()` never reach output.
- Anchors: after every edit run `EX-SYNC`; where a lesson fence and its file differ, read both and decide which is right before changing either (no quiet narrowing; no prose-only repair of a code fact).

## Harness mode and toolchain

- **Harness mode**: Real mode.
- **Toolchain ids**: `shell`, `python` (ids that are already in plan 05's catalog use its pins as read on 2026-10-09; Phase 0 re-reads them).
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Course lock** (hash-locked, plan 05's lock recipe; no run installs anything): `pytest` (3 files).
- **Phase 1 spikes**: SP1 (hash-locked course locks resolve and install offline on the Python image), SP12 (timing and CI projection) (defined in [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-budget.md#phase-1-spikes)).
- **Illustration budget**: at most 3 fences.
- **CI cost** (planning figure, replaced by the SP12 measurement): about 2.2 s per container invocation × 2 executions × 99 runs (80 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 7.3 minutes.

## Size class and sequencing

- **Size class M** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#size-class-rule): words to write 0 (class S), units authored from scratch 0 (class S), reading edits 51 (class M).
- **Agent packets**: one packet per defect group (anchors and sync, annotation and density, drilling and katas).
- **CI weight**: about 7.3 CI shard-minutes per full run of this course (a planning figure; SP12 replaces it with a measurement).
- **Wave 1**, slot 1. Maker: `apps-ayokoding-www-by-example-maker` for authoring gaps; fixer: `tutorial-by-example-fixer` for gate findings; `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `advanced-sql-and-query-performance` (wave 2), `database-internals-and-storage-engines` (wave 5), `data-access-orms-and-query-builders` (wave 7), `search-and-information-retrieval` (wave 7), `build-your-own-orm-and-query-builder` (wave 8), `build-your-own-database` (wave 9), `nosql-databases` (wave 10), `graph-databases` (wave 11), `data-engineering` (wave 11).

## Prerequisite re-check

- Plan 02 result: Added: `just-enough-python`; Removed: `project-management`.
- No prerequisite of this course is in this plan's 34; readiness (CP-0) has nothing to wait for.
- Prerequisites outside this plan (unchanged here): `just-enough-python`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests.

## Per-course checklist

- [ ] CP-0 Readiness: no in-plan prerequisite; spikes SP1, SP12 are recorded as passed.
- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `sql-essentials` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder in report-only form (not a gate cycle); `COMPLETION-PROBE sql-essentials by-example` (RED; the failing scenarios go in the ledger); `FILLER` and the course's row in the printed metrics table; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (M): the packets above. Classes: DC2, DC3, DC4, DC6, DC7, DC13, DC14. Author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file. Unit rule: first run plus at most 2 fix attempts, then a simpler replacement.
- [ ] Units: all 80 existing example folders converted to units; kata units in `drilling/code`; harness pre-check green for every unit before the gate starts.
- [ ] Illustration budget kept (see Harness mode and toolchain); no runnable block is marked as an illustration to pass sync (plan 05 M11).
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `sql-essentials` exits 0 (at most 2 repair cycles).
- [ ] CP-6 Registry, guard, metadata, and closure: `FILLER` shows no fired rule for the course; `estimatedHours` recomputed from plan 03's drift test; `prerequisites` re-derived; the row `sql-essentials` (`by-example`) added to `AUDITED_COURSES` and `COMPLETION` green; plan 02's integrity tests (`PATH-TESTS`) green.
- [ ] CP-7 Ledger row complete in `local-tmp/ayokoding-learn/execution-ledger.md`; one commit `fix(ayokoding-www): audit sql-essentials course` with only this course folder, its `_index.md`, and its `AUDITED_COURSES` row, and any other metadata file CP-6 changed (a prerequisite edge or the AI manifest).
- [ ] C11 Course-specific obligation: Exemplar guard: the counts that pass today (80 examples, 80 Why It Matters blocks, 80 takeaways, 5 exact drilling sections, 8 katas) are floors that no edit may lower.

## Accuracy notes

- The overview names SQLite 3.53.3 (2026-06-26) as current; the image ships another version. Phase 0 re-reads sqlite.org and the lesson says which version each output came from.
- Python's bundled SQLite varies by build; the version-printing unit is the single source for that statement.
- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/sql-essentials/` (stable repository facts; Phase 0 and CP-1 re-measure). Scan hits for determinism and environment are approximate and are read, not trusted, in CP-1.
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; SP12 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them beyond the notes above.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–30 (30): from "Create Author Table" to "Python Parameterized Insert".
- **co-02 · intermediate** — examples 31–58 (28): from "Left Join Unmatched" to "Case Expression".
- **co-03 · advanced** — examples 59–80 (22): from "Migration Add Column" to "pytest Rollback Integration".

## Lineage

- The first SQL course; prepares advanced SQL, NoSQL, graph, search, and database internals.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 27 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 26 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 24 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
