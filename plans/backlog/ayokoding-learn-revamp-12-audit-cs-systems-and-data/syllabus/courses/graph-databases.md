# Graph Databases

**Course ID**: `graph-databases` · **Format**: By Example · **Category**: data-and-databases.

**Scope note**: Audits and fixes the existing `graph-databases` course to the series definition of done (decision 27) and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. `nosql-databases` keeps the other families; `sql-essentials` is the relational contrast; this course keeps property graphs in Cypher 25, RDF and SPARQL, Gremlin, and graph algorithms. It does not touch `content/id/**`, any path manifest (except an AI manifest co-update when a prerequisite change alters the AI core), or another course.

**Short summary**: Model and query connected data when relationships are the real question.

## Why this exists · the big idea

- **The problem before the solution**: none of its 80 examples is run by any check (0 `run.yaml`); 79 fences and output blocks without an anchor; 22 anchors that differ from their files.
- **Keep-this-if-you-forget-everything**: When the question is about relationships, store them as relationships; each example loads a tiny graph and asks Cypher, SPARQL, or Gremlin the question.

## Prerequisites

- **Prior courses** (plan 02's revised list, kept plus added, as read on 2026-10-09): `sql-essentials`, `just-enough-python`.
- **Edges plan 02 removes**: `nosql-databases`.
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Each query is a statement over fixed data with a printed result; 80 examples already follow By Example pace.
- **Wave**: 11 (slot 2); **size class**: M (words to write 0, units authored 1); **expected defect classes**: 8 of 15 variable classes, plus the two universal ones (DC2, DC15).

| Measure                                                                      | Today (2026-10-09, `bb7f90137`)                                                                                                                                 | Target                                                                                                                                                                                   | Work                                                                               |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded)                | 49,420                                                                                                                                                          | at least 28,000                                                                                                                                                                          | none (floor met)                                                                   |
| Examples                                                                     | 80 as `### Example N`                                                                                                                                           | at least 75, as `### Example N: Title`, numbered 1 to N without gaps                                                                                                                     | none                                                                               |
| Mermaid diagrams                                                             | 30                                                                                                                                                              | 30 to 50                                                                                                                                                                                 | none                                                                               |
| "Why It Matters" (50 to 100 words) and key takeaway                          | 110 and 84 (for 80 examples)                                                                                                                                    | one of each per example, each "Why It Matters" block 50 to 100 words                                                                                                                     | bring 61 of the 110 blocks found into 50 to 100 words (median 47; heuristic count) |
| Annotation density (comment lines per code line, measured on the code files) | median 1.17; 15 below 1.0; 1 above 2.25 (of 80 units)                                                                                                           | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 16 to fix                                                                          |
| Code fences and anchors                                                      | 200 non-diagram fences; 8 code fences unanchored                                                                                                                | every code fence anchored or marked as an illustration                                                                                                                                   | 8 to anchor                                                                        |
| Lesson-to-file anchors (plan 05's method)                                    | 113 path anchors: 113 resolve to a file, of which 22 differ from it; 0 missing                                                                                  | every anchor matches its file                                                                                                                                                            | 22 to repair after reading each diff                                               |
| Output blocks                                                                | 71 unanchored                                                                                                                                                   | every `**Output**` block anchored to an expected file                                                                                                                                    | 71 to anchor                                                                       |
| Harness units                                                                | 80 example folders, 7 kata folders in `drilling/code`, 113 code files, 0 `run.yaml`                                                                             | 80 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | author about 1; convert the 80 existing folders                                    |
| Drilling page                                                                | 8,782 words; 5 of 5 exact `##` sections; headings: Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 0 words short                                                                      |
| Katas                                                                        | 7                                                                                                                                                               | at least 8 as `before`/`after` units in `drilling/code`                                                                                                                                  | 1 to write                                                                         |
| Accuracy-note files and verification tags                                    | files: 6; tags: 3                                                                                                                                               | none; the facts sit in References                                                                                                                                                        | convert to References                                                              |
| `## Examples by Level` in `learning/overview.md`                             | present                                                                                                                                                         | present, one bullet per example                                                                                                                                                          | none                                                                               |
| Frontmatter                                                                  | `format` by-example, `category` data-and-databases, `description` from plan 03; `estimatedHours` snapshot 7                                                     | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed by plan 03's drift test after the last edit                                                  | recompute                                                                          |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **DC2** The course has 0 `run.yaml` files: not opted in to plan 05's harness.
- **DC3** 8 code fences and 71 output blocks carry no anchor.
- **DC4** 22 of 113 anchors differ from their files; 0 point at no file.
- **DC6** 61 of 110 "Why It Matters" blocks outside 50 to 100 words (median 47; heuristic count).
- **DC7** Annotation density (comment lines per code line, code files of 80 units): median 1.17, 15 units below 1.0, 1 above 2.25.
- **DC11** 7 katas; the floor is 8 (1 to write).
- **DC12** Scan hits (approximate, CP-1 reads each): wall-clock reads: 2, sleeps: 1, thread/goroutine/process uses: 1.
- **DC13** Scan hits (approximate): network calls: 14, database uses: 79, file-system uses: 6, Linux-only calls: 3, services needed: neo4j, neo4j-gds.
- **DC14** Leftover accuracy-note files: 6; verification tags: 3; both are converted into References.
- **DC15** Prerequisites and metadata: re-derived and re-checked in CP-6 (universal).

## Fixes and design

- Add the `neo4j-gds` and `gremlin` toolchains (decision D6) and the course lock for the `neo4j` driver (14 files) and `rdflib` (5 files).
- Re-anchor the 22 differing anchors and anchor the 8 unanchored code fences and 71 output blocks; write the 1 missing kata; convert 6 accuracy-note files and 3 verification tags into References.
- Verify Cypher 25 versus Cypher 5 statements and GDS procedure names against the pinned versions; record version-specific plan text only for the pinned image.
- Raise annotation in the 16 units outside the band (median 1.17): add `# =>` result lines and why-comments, never filler comments (guard FG6 reads repeated text). The scan measures the code files; the mode checker's reading of the lesson fences is authoritative.
- Bring 61 of the 110 "Why It Matters" blocks found (median 47 words) into the 50 to 100 word band by adding the example-specific consequence, not a template sentence (guard FG6). The count is a heuristic; the mode checker's reading is authoritative.
- Determinism and environment: Gremlin units (7 Groovy files) need a JVM with Apache TinkerPop's console and an in-memory TinkerGraph; no server is needed. The relational contrast units (5 SQL files) run through Python's `sqlite3` module in the `python` image, so they need no extra image. RDF units use a hash-locked `rdflib`. Wall-clock uses (2) and the sleep (1) are removed; the concurrent-transactions example is a scripted two-session sequence.
- Anchors: after every edit run `EX-SYNC`; where a lesson fence and its file differ, read both and decide which is right before changing either (no quiet narrowing; no prose-only repair of a code fact).

## Harness mode and toolchain

- **Harness mode**: Real mode with a Neo4j service.
- **Toolchain ids**: `python`, `shell`, `gremlin`; services: `neo4j`, `neo4j-gds` (ids that are already in plan 05's catalog use its pins as read on 2026-10-09; Phase 0 re-reads them).
- **Toolchain additions** (this plan, [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-budget.md)): `gremlin`, `neo4j-gds`. Each is gated by its spike and added by plan 05's "Adding a Toolchain" procedure.
- **Course lock** (hash-locked, plan 05's lock recipe; no run installs anything): `neo4j` (14 files), `rdflib` (5 files).
- **Phase 1 spikes**: SP1 (hash-locked course locks resolve and install offline on the Python image), SP3 (`neo4j-gds` image), SP4 (`gremlin` image), SP12 (timing and CI projection) (defined in [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-budget.md#phase-1-spikes)).
- **Illustration budget**: at most 3 fences.
- **CI cost** (planning figure, replaced by the SP12 measurement): about 26.0 s per container invocation × 2 executions × 99 runs (80 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 85.8 minutes.

## Database fixture

- **Container**: `neo4j` service, authentication disabled, host alias `neo4j`, internal network; Bolt on the alias; `cypher-shell` from the same image for `.cypher` units.
- **Image**: The Neo4j 2026.09.0 image of plan 05's catalog, pinned by digest, Cypher 25. The graph-data-science units use a derived image `neo4j-gds` (same digest plus the GDS plugin jar, SHA-256-checked) that this plan adds.
- **Fixed data**: Each unit runs against a fresh service (the data folder is a tmpfs, and Community Edition has one user database), starts with `MATCH (n) DETACH DELETE n` where it runs several sections, and builds its graph from `CREATE` statements with explicit ids in properties; results use `ORDER BY` and print properties, never `elementId()` or internal ids. GDS procedures run with `concurrency: 1` and an explicit `randomSeed`.
- **Rules** (plan 05's service contract, [tech-docs/003](../../tech-docs/003-harness-modes-simulation-and-determinism.md#service-backed-units)): `services` in `run.yaml`; `ready` and `readyTimeout` from the catalog; no run reads the clock, a sequence, or a random value into output.

## Size class and sequencing

- **Size class M** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#size-class-rule): words to write 0 (class S), units authored from scratch 1 (class S), reading edits 99 (class M). Raised by a documented override: 79 units run against a Neo4j service and 7 need the Gremlin image.
- **Agent packets**: one packet per defect group (anchors and sync, annotation and density, drilling and katas).
- **CI weight**: about 85.8 CI shard-minutes per full run of this course (a planning figure; SP12 replaces it with a measurement).
- **Wave 11**, slot 2. Maker: `apps-ayokoding-www-by-example-maker` for authoring gaps; fixer: `tutorial-by-example-fixer` for gate findings; `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 result: Kept: `sql-essentials`, `just-enough-python`; Removed: `nosql-databases`.
- In-plan prerequisites are audited first: `sql-essentials` (wave 1).
- Prerequisites outside this plan (unchanged here): `just-enough-python`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests.

## Per-course checklist

- [ ] CP-0 Readiness: in-plan prerequisites `sql-essentials` are DONE in the ledger; spikes SP1, SP3, SP4, SP12 are recorded as passed; the additions `gremlin`, `neo4j-gds` are merged into the branch and `toolchains build` is green.
- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `graph-databases` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder in report-only form (not a gate cycle); `COMPLETION-PROBE graph-databases by-example` (RED; the failing scenarios go in the ledger); `FILLER` and the course's row in the printed metrics table; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (M): the packets above. Classes: DC2, DC3, DC4, DC6, DC7, DC11, DC12, DC13, DC14. Author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file. Unit rule: first run plus at most 2 fix attempts, then a simpler replacement.
- [ ] Units: about 1 units authored and the 80 existing folders converted; kata units in `drilling/code`; harness pre-check green for every unit before the gate starts.
- [ ] Illustration budget kept (see Harness mode and toolchain); no runnable block is marked as an illustration to pass sync (plan 05 M11).
- [ ] Database fixture: image digest pinned, schema or keyspace per unit, fixed data, ordered output; the double run matches byte for byte.
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `graph-databases` exits 0 (at most 2 repair cycles).
- [ ] CP-6 Registry, guard, metadata, and closure: `FILLER` shows no fired rule for the course; `estimatedHours` recomputed from plan 03's drift test; `prerequisites` re-derived; the row `graph-databases` (`by-example`) added to `AUDITED_COURSES` and `COMPLETION` green; plan 02's integrity tests (`PATH-TESTS`) green.
- [ ] CP-7 Ledger row complete in `local-tmp/ayokoding-learn/execution-ledger.md`; one commit `fix(ayokoding-www): audit graph-databases course` with only this course folder, its `_index.md`, and its `AUDITED_COURSES` row, and any other metadata file CP-6 changed (a prerequisite edge or the AI manifest).
- [ ] C11 Course-specific obligation: No expected file contains an internal graph id, a timestamp, or an unordered result.

## Accuracy notes

- Neo4j 2026.09.0, Cypher 25, GDS release, TinkerPop 3.x, and SPARQL 1.1 facts are re-read on the vendors' documentation with dates; GDS licensing is stated as the vendor states it.
- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/graph-databases/` (stable repository facts; Phase 0 and CP-1 re-measure). Scan hits for determinism and environment are approximate and are read, not trusted, in CP-1.
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; SP12 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them beyond the notes above.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–26 (26): from "Create a Single Node" to "A Basic SPARQL SELECT".
- **co-02 · intermediate** — examples 27–54 (28): from "OPTIONAL MATCH Preserves Rows as NULL" to "Refactor a Property into a Node".
- **co-03 · advanced** — examples 55–80 (26): from "GDS: Project an In-Memory Graph" to "Preview: a Multi-Model Contrast Report".

## Lineage

- Follows SQL Essentials.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 30 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 39 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 39 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
