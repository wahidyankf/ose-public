# Advanced Algorithms

**Course ID**: `advanced-algorithms` · **Format**: By Example · **Category**: computer-science.

**Scope note**: Audits and fixes the existing `advanced-algorithms` course to the series definition of done (decision 27) and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. `data-structures-and-algorithms-essentials` keeps the basic structures; `concurrency-and-parallelism` keeps threads; this course keeps graphs, dynamic programming, greedy, backtracking, and amortized analysis. It does not touch `content/id/**`, any path manifest (except an AI manifest co-update when a prerequisite change alters the AI core), or another course.

**Short summary**: Solve hard problems with graphs, dynamic programming, and other proven techniques.

## Why this exists · the big idea

- **The problem before the solution**: none of its 80 examples is run by any check (0 `run.yaml`); 179 fences and output blocks without an anchor; 80 of 80 code units below the annotation band (median 0.84).
- **Keep-this-if-you-forget-everything**: Hard problems become tractable when you pick the right technique; each example solves one problem two ways and counts the work.

## Prerequisites

- **Prior courses** (plan 02's revised list, kept plus added, as read on 2026-10-09): `data-structures-and-algorithms-essentials`, `just-enough-python`.
- **Edges plan 02 removes**: `concurrency-and-parallelism`.
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Each technique is a program with a counted cost; 80 examples already follow By Example pace.
- **Wave**: 6 (slot 3); **size class**: L (words to write 0, units authored 0); **expected defect classes**: 5 of 15 variable classes, plus the two universal ones (DC2, DC15).

| Measure                                                                      | Today (2026-10-09, `bb7f90137`)                                                                                                                                 | Target                                                                                                                                                                                   | Work                                                                               |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded)                | 92,244                                                                                                                                                          | at least 28,000                                                                                                                                                                          | none (floor met)                                                                   |
| Examples                                                                     | 80 as `### Example N`                                                                                                                                           | at least 75, as `### Example N: Title`, numbered 1 to N without gaps                                                                                                                     | none                                                                               |
| Mermaid diagrams                                                             | 13                                                                                                                                                              | 30 to 50                                                                                                                                                                                 | 17 to add                                                                          |
| "Why It Matters" (50 to 100 words) and key takeaway                          | 111 and 84 (for 80 examples)                                                                                                                                    | one of each per example, each "Why It Matters" block 50 to 100 words                                                                                                                     | bring 35 of the 111 blocks found into 50 to 100 words (median 56; heuristic count) |
| Annotation density (comment lines per code line, measured on the code files) | median 0.84; 80 below 1.0; 0 above 2.25 (of 80 units)                                                                                                           | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 80 to fix                                                                          |
| Code fences and anchors                                                      | 377 non-diagram fences; 2 code fences unanchored                                                                                                                | every code fence anchored or marked as an illustration                                                                                                                                   | 2 to anchor                                                                        |
| Lesson-to-file anchors (plan 05's method)                                    | 188 path anchors: 188 resolve to a file, of which 18 differ from it; 0 missing                                                                                  | every anchor matches its file                                                                                                                                                            | 18 to repair after reading each diff                                               |
| Output blocks                                                                | 177 unanchored                                                                                                                                                  | every `**Output**` block anchored to an expected file                                                                                                                                    | 177 to anchor                                                                      |
| Harness units                                                                | 80 example folders, 10 kata folders in `drilling/code`, 189 code files, 0 `run.yaml`                                                                            | 80 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | convert the 80 existing folders (add `run.yaml` and expected files)                |
| Drilling page                                                                | 9,467 words; 5 of 5 exact `##` sections; headings: Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 0 words short                                                                      |
| Katas                                                                        | 10                                                                                                                                                              | at least 8 as `before`/`after` units in `drilling/code`                                                                                                                                  | none                                                                               |
| Accuracy-note files and verification tags                                    | files: 0; tags: 0                                                                                                                                               | none; the facts sit in References                                                                                                                                                        | none                                                                               |
| `## Examples by Level` in `learning/overview.md`                             | present                                                                                                                                                         | present, one bullet per example                                                                                                                                                          | none                                                                               |
| Frontmatter                                                                  | `format` by-example, `category` computer-science, `description` from plan 03; `estimatedHours` snapshot 14                                                      | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed by plan 03's drift test after the last edit                                                  | recompute                                                                          |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **DC2** The course has 0 `run.yaml` files: not opted in to plan 05's harness.
- **DC3** 2 code fences and 177 output blocks carry no anchor.
- **DC4** 18 of 188 anchors differ from their files; 0 point at no file.
- **DC6** 35 of 111 "Why It Matters" blocks outside 50 to 100 words (median 56; heuristic count); 13 diagrams, 17 below the floor of 30.
- **DC7** Annotation density (comment lines per code line, code files of 80 units): median 0.84, 80 units below 1.0, 0 above 2.25.
- **DC12** Scan hits (approximate, CP-1 reads each): unseeded random uses: 23, hash-order prints: 30.
- **DC15** Prerequisites and metadata: re-derived and re-checked in CP-6 (universal).

## Fixes and design

- Add about 17 diagrams (13 exist, 30 needed) where a graph, table, or recurrence is clearer drawn.
- Anchor the 177 output blocks and 2 code fences; repair the 18 anchors that differ from their files.
- Confirm the 10 katas run as `before` and `after` units.
- Raise annotation in the 80 units outside the band (median 0.84): add `# =>` result lines and why-comments, never filler comments (guard FG6 reads repeated text). The scan measures the code files; the mode checker's reading of the lesson fences is authoritative.
- Bring 35 of the 111 "Why It Matters" blocks found (median 56 words) into the 50 to 100 word band by adding the example-specific consequence, not a template sentence (guard FG6). The count is a heuristic; the mode checker's reading is authoritative.
- Determinism and environment: 23 files use random numbers without a visible seed; each takes `random.Random(seed)`. The empirical-timing example counts operations, and the threaded preview joins its threads and sorts results. 30 hash-order prints are sorted.
- Anchors: after every edit run `EX-SYNC`; where a lesson fence and its file differ, read both and decide which is right before changing either (no quiet narrowing; no prose-only repair of a code fact).

## Harness mode and toolchain

- **Harness mode**: Real mode.
- **Toolchain ids**: `python` (ids that are already in plan 05's catalog use its pins as read on 2026-10-09; Phase 0 re-reads them).
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Course lock** (hash-locked, plan 05's lock recipe; no run installs anything): `pytest` (3 files).
- **Phase 1 spikes**: SP1 (hash-locked course locks resolve and install offline on the Python image), SP12 (timing and CI projection) (defined in [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-budget.md#phase-1-spikes)).
- **Illustration budget**: at most 3 fences.
- **CI cost** (planning figure, replaced by the SP12 measurement): about 2.6 s per container invocation × 2 executions × 99 runs (80 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 8.6 minutes.

## Size class and sequencing

- **Size class L** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#size-class-rule): words to write 0 (class S), units authored from scratch 0 (class S), reading edits 133 (class L).
- **Agent packets**: one packet per learning page (unit conversion, anchors, and annotation for that page), then one packet per remaining defect group.
- **CI weight**: about 8.6 CI shard-minutes per full run of this course (a planning figure; SP12 replaces it with a measurement).
- **Wave 6**, slot 3. Maker: `apps-ayokoding-www-by-example-maker` for authoring gaps; fixer: `tutorial-by-example-fixer` for gate findings; `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `capstone-solid-core` (wave 7).

## Prerequisite re-check

- Plan 02 result: Added: `data-structures-and-algorithms-essentials`, `just-enough-python`; Removed: `concurrency-and-parallelism`.
- In-plan prerequisites are audited first: `data-structures-and-algorithms-essentials` (wave 1).
- Prerequisites outside this plan (unchanged here): `just-enough-python`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests.

## Per-course checklist

- [ ] CP-0 Readiness: in-plan prerequisites `data-structures-and-algorithms-essentials` are DONE in the ledger; spikes SP1, SP12 are recorded as passed.
- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `advanced-algorithms` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder in report-only form (not a gate cycle); `COMPLETION-PROBE advanced-algorithms by-example` (RED; the failing scenarios go in the ledger); `FILLER` and the course's row in the printed metrics table; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (L): the packets above. Classes: DC2, DC3, DC4, DC6, DC7, DC12. Author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file. Unit rule: first run plus at most 2 fix attempts, then a simpler replacement.
- [ ] Units: all 80 existing example folders converted to units; kata units in `drilling/code`; harness pre-check green for every unit before the gate starts.
- [ ] Illustration budget kept (see Harness mode and toolchain); no runnable block is marked as an illustration to pass sync (plan 05 M11).
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `advanced-algorithms` exits 0 (at most 2 repair cycles).
- [ ] CP-6 Registry, guard, metadata, and closure: `FILLER` shows no fired rule for the course; `estimatedHours` recomputed from plan 03's drift test; `prerequisites` re-derived; the row `advanced-algorithms` (`by-example`) added to `AUDITED_COURSES` and `COMPLETION` green; plan 02's integrity tests (`PATH-TESTS`) green.
- [ ] CP-7 Ledger row complete in `local-tmp/ayokoding-learn/execution-ledger.md`; one commit `fix(ayokoding-www): audit advanced-algorithms course` with only this course folder, its `_index.md`, and its `AUDITED_COURSES` row, and any other metadata file CP-6 changed (a prerequisite edge or the AI manifest).
- [ ] C11 Course-specific obligation: No example prints a measured time; the diagram count reaches the band.

## Accuracy notes

- Complexity statements (amortized bounds, the Master theorem cases, NP-hardness claims) are checked against standard references in the content gate.
- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/advanced-algorithms/` (stable repository facts; Phase 0 and CP-1 re-measure). Scan hits for determinism and environment are approximate and are read, not trusted, in CP-1.
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; SP12 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them beyond the notes above.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–24 (24): from "Big-O Empirical Timing" to "Maximum Sum of a Fixed-Size Window".
- **co-02 · intermediate** — examples 25–52 (28): from "A Doubling Dynamic Array's Amortized O(1) Append" to "Binary Search Boundaries".
- **co-03 · advanced** — examples 53–80 (28): from "N-Queens by Backtracking" to "Capstone Preview -- a Threaded Mini Scheduler".

## Lineage

- Follows DSA Essentials; prepares the SQL and SOLID-core capstone work.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 82 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 81 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 63 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
