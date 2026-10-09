# Search and Information Retrieval

**Course ID**: `search-and-information-retrieval` · **Format**: By Example · **Category**: data-and-databases.

**Scope note**: Audits and fixes the existing `search-and-information-retrieval` course to the series definition of done (decision 27) and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. `nosql-databases` keeps document stores; `database-internals-and-storage-engines` keeps storage; this course keeps analyzers, inverted indexes, BM25, query parsing, and segment merging as models, not as a live Elasticsearch. It does not touch `content/id/**`, any path manifest (except an AI manifest co-update when a prerequisite change alters the AI core), or another course.

**Short summary**: Build full-text search with inverted indexes and relevance ranking.

## Why this exists · the big idea

- **The problem before the solution**: none of its 80 examples is run by any check (0 `run.yaml`); 84 fences and output blocks without an anchor; 84 anchors that differ from their files; 80 of 80 code units below the annotation band (median 0.45); 0 of 8 katas.
- **Keep-this-if-you-forget-everything**: Search is an index built ahead of time; each example builds a piece of one (tokens, postings, scoring, merging) in Python and ranks fixed documents.

## Prerequisites

- **Prior courses** (plan 02's revised list, kept plus added, as read on 2026-10-09): `sql-essentials`, `data-structures-and-algorithms-essentials`.
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Each stage is a function from text to postings to scores; 80 examples already follow By Example pace.
- **Wave**: 7 (slot 3); **size class**: L (words to write 0, units authored 8); **expected defect classes**: 7 of 15 variable classes, plus the two universal ones (DC2, DC15).

| Measure                                                                      | Today (2026-10-09, `bb7f90137`)                                                                                                                                 | Target                                                                                                                                                                                   | Work                                            |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded)                | 80,822                                                                                                                                                          | at least 28,000                                                                                                                                                                          | none (floor met)                                |
| Examples                                                                     | 80 as `### Example N`                                                                                                                                           | at least 75, as `### Example N: Title`, numbered 1 to N without gaps                                                                                                                     | none                                            |
| Mermaid diagrams                                                             | 34                                                                                                                                                              | 30 to 50                                                                                                                                                                                 | none                                            |
| "Why It Matters" (50 to 100 words) and key takeaway                          | 80 and 80 (for 80 examples)                                                                                                                                     | one of each per example, each "Why It Matters" block 50 to 100 words                                                                                                                     | none                                            |
| Annotation density (comment lines per code line, measured on the code files) | median 0.45; 80 below 1.0; 0 above 2.25 (of 80 units)                                                                                                           | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 80 to fix                                       |
| Code fences and anchors                                                      | 168 non-diagram fences; 0 code fences unanchored                                                                                                                | every code fence anchored or marked as an illustration                                                                                                                                   | none                                            |
| Lesson-to-file anchors (plan 05's method)                                    | 84 path anchors: 84 resolve to a file, of which 84 differ from it; 0 missing                                                                                    | every anchor matches its file                                                                                                                                                            | 84 to repair after reading each diff            |
| Output blocks                                                                | 84 unanchored                                                                                                                                                   | every `**Output**` block anchored to an expected file                                                                                                                                    | 84 to anchor                                    |
| Harness units                                                                | 80 example folders, 0 kata folders in `drilling/code`, 84 code files, 0 `run.yaml`                                                                              | 80 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | author about 8; convert the 80 existing folders |
| Drilling page                                                                | 6,433 words; 5 of 5 exact `##` sections; headings: Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 0 words short                                   |
| Katas                                                                        | 0                                                                                                                                                               | at least 8 as `before`/`after` units in `drilling/code`                                                                                                                                  | 8 to write                                      |
| Accuracy-note files and verification tags                                    | files: 1; tags: 1                                                                                                                                               | none; the facts sit in References                                                                                                                                                        | convert to References                           |
| `## Examples by Level` in `learning/overview.md`                             | present                                                                                                                                                         | present, one bullet per example                                                                                                                                                          | none                                            |
| Frontmatter                                                                  | `format` by-example, `category` data-and-databases, `description` from plan 03; `estimatedHours` snapshot 15                                                    | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed by plan 03's drift test after the last edit                                                  | recompute                                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **DC2** The course has 0 `run.yaml` files: not opted in to plan 05's harness.
- **DC3** 0 code fences and 84 output blocks carry no anchor.
- **DC4** 84 of 84 anchors differ from their files; 0 point at no file.
- **DC7** Annotation density (comment lines per code line, code files of 80 units): median 0.45, 80 units below 1.0, 0 above 2.25.
- **DC11** 0 katas; the floor is 8 (8 to write).
- **DC12** Scan hits (approximate, CP-1 reads each): wall-clock reads: 3, hash-order prints: 37.
- **DC13** Scan hits (approximate): database uses: 1, file-system uses: 1.
- **DC14** Leftover accuracy-note files: 1; verification tags: 1; both are converted into References.
- **DC15** Prerequisites and metadata: re-derived and re-checked in CP-6 (universal).

## Fixes and design

- Reconcile the 84 anchor differences (every anchor differs from its file) after reading each diff; anchor the 84 output blocks.
- Write 8 katas (none exist); the 6,433-word drilling page stays.
- Convert the leftover accuracy-note file and its verification tag into References.
- Raise annotation in the 80 units outside the band (median 0.45): add `# =>` result lines and why-comments, never filler comments (guard FG6 reads repeated text). The scan measures the code files; the mode checker's reading of the lesson fences is authoritative.
- Determinism and environment: 37 files iterate sets or dictionaries into output; postings and scores are sorted with explicit tie-breaks. Floating-point scores are printed with a fixed format. The near-real-time refresh and segment-merge examples are pure functions over a virtual clock.
- Anchors: after every edit run `EX-SYNC`; where a lesson fence and its file differ, read both and decide which is right before changing either (no quiet narrowing; no prose-only repair of a code fact).

## Harness mode and toolchain

- **Harness mode**: Real mode.
- **Toolchain ids**: `python` (ids that are already in plan 05's catalog use its pins as read on 2026-10-09; Phase 0 re-reads them).
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP12 (timing and CI projection) (defined in [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-budget.md#phase-1-spikes)).
- **Illustration budget**: at most 3 fences.
- **CI cost** (planning figure, replaced by the SP12 measurement): about 2.5 s per container invocation × 2 executions × 99 runs (80 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 8.2 minutes.

## Size class and sequencing

- **Size class L** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#size-class-rule): words to write 0 (class S), units authored from scratch 8 (class S), reading edits 164 (class L).
- **Agent packets**: one packet per learning page (unit conversion, anchors, and annotation for that page), then one packet per remaining defect group.
- **CI weight**: about 8.2 CI shard-minutes per full run of this course (a planning figure; SP12 replaces it with a measurement).
- **Wave 7**, slot 3. Maker: `apps-ayokoding-www-by-example-maker` for authoring gaps; fixer: `tutorial-by-example-fixer` for gate findings; `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 result: Kept: `sql-essentials`, `data-structures-and-algorithms-essentials`.
- In-plan prerequisites are audited first: `sql-essentials` (wave 1), `data-structures-and-algorithms-essentials` (wave 1).
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests.

## Per-course checklist

- [ ] CP-0 Readiness: in-plan prerequisites `sql-essentials`, `data-structures-and-algorithms-essentials` are DONE in the ledger; spikes SP12 are recorded as passed.
- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `search-and-information-retrieval` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder in report-only form (not a gate cycle); `COMPLETION-PROBE search-and-information-retrieval by-example` (RED; the failing scenarios go in the ledger); `FILLER` and the course's row in the printed metrics table; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (L): the packets above. Classes: DC2, DC3, DC4, DC7, DC11, DC12, DC13, DC14. Author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file. Unit rule: first run plus at most 2 fix attempts, then a simpler replacement.
- [ ] Units: about 8 units authored and the 80 existing folders converted; kata units in `drilling/code`; harness pre-check green for every unit before the gate starts.
- [ ] Illustration budget kept (see Harness mode and toolchain); no runnable block is marked as an illustration to pass sync (plan 05 M11).
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `search-and-information-retrieval` exits 0 (at most 2 repair cycles).
- [ ] CP-6 Registry, guard, metadata, and closure: `FILLER` shows no fired rule for the course; `estimatedHours` recomputed from plan 03's drift test; `prerequisites` re-derived; the row `search-and-information-retrieval` (`by-example`) added to `AUDITED_COURSES` and `COMPLETION` green; plan 02's integrity tests (`PATH-TESTS`) green.
- [ ] CP-7 Ledger row complete in `local-tmp/ayokoding-learn/execution-ledger.md`; one commit `fix(ayokoding-www): audit search-and-information-retrieval course` with only this course folder, its `_index.md`, and its `AUDITED_COURSES` row, and any other metadata file CP-6 changed (a prerequisite edge or the AI manifest).
- [ ] C11 Course-specific obligation: Ranking examples print scores with an explicit tie-break so that equal scores have a fixed order.

## Accuracy notes

- BM25 parameter defaults, Lucene scoring changes, and any named product behaviour are checked against current documentation with a date.
- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/search-and-information-retrieval/` (stable repository facts; Phase 0 and CP-1 re-measure). Scan hits for determinism and environment are approximate and are read, not trusted, in CP-1.
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; SP12 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them beyond the notes above.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–28 (28): from "Tokenize Whitespace" to "Analyzer Order".
- **co-02 · intermediate** — examples 29–56 (28): from "BM25 IDF Term" to "Segment Merge Model".
- **co-03 · advanced** — examples 57–80 (24): from "NRT Refresh Model" to "Mini Search Engine".

## Lineage

- Follows SQL Essentials and DSA Essentials.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 31 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 40 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 40 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
