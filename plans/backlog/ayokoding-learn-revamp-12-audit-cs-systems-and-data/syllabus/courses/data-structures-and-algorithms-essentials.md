# Data Structures & Algorithms Essentials

**Course ID**: `data-structures-and-algorithms-essentials` · **Format**: By Example · **Category**: computer-science.

**Scope note**: Audits and fixes the existing `data-structures-and-algorithms-essentials` course to the series definition of done (decision 27) and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. `advanced-algorithms` keeps graphs, dynamic programming, and heavy techniques; `computer-science-foundations` keeps number representation and automata; this course keeps lists, hashing, trees, heaps, recursion, and cost reasoning. It does not touch `content/id/**`, any path manifest (except an AI manifest co-update when a prerequisite change alters the AI core), or another course.

**Short summary**: Pick the right data structure and algorithm, and reason about their cost.

## Why this exists · the big idea

- **The problem before the solution**: none of its 82 examples is run by any check (0 `run.yaml`); 129 fences and output blocks without an anchor; 54 of 82 code units below the annotation band (median 0.88); 0 of 8 katas.
- **Keep-this-if-you-forget-everything**: A data structure is a promise about cost; each example builds one in Python and counts the operations it uses.

## Prerequisites

- **Prior courses** (plan 02's revised list, kept plus added, as read on 2026-10-09): `just-enough-python`.
- **Edges plan 02 removes**: `version-control-and-git`.
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Every concept is a structure or algorithm a reader can run, count, and break; the course already has 82 examples at By Example pace.
- **Wave**: 1 (slot 2); **size class**: M (words to write 0, units authored 8); **expected defect classes**: 7 of 15 variable classes, plus the two universal ones (DC2, DC15).

| Measure                                                                      | Today (2026-10-09, `bb7f90137`)                                                                                   | Target                                                                                                                                                                                   | Work                                                                               |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded)                | 56,936                                                                                                            | at least 28,000                                                                                                                                                                          | none (floor met)                                                                   |
| Examples                                                                     | 82 as `### Example N`                                                                                             | at least 75, as `### Example N: Title`, numbered 1 to N without gaps                                                                                                                     | none                                                                               |
| Mermaid diagrams                                                             | 39                                                                                                                | 30 to 50                                                                                                                                                                                 | none                                                                               |
| "Why It Matters" (50 to 100 words) and key takeaway                          | 105 and 85 (for 82 examples)                                                                                      | one of each per example, each "Why It Matters" block 50 to 100 words                                                                                                                     | bring 17 of the 105 blocks found into 50 to 100 words (median 60; heuristic count) |
| Annotation density (comment lines per code line, measured on the code files) | median 0.88; 54 below 1.0; 0 above 2.25 (of 82 units)                                                             | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 54 to fix                                                                          |
| Code fences and anchors                                                      | 218 non-diagram fences; 23 code fences unanchored                                                                 | every code fence anchored or marked as an illustration                                                                                                                                   | 23 to anchor                                                                       |
| Lesson-to-file anchors (plan 05's method)                                    | 85 path anchors: 85 resolve to a file, of which 0 differ from it; 0 missing                                       | every anchor matches its file                                                                                                                                                            | none                                                                               |
| Output blocks                                                                | 106 unanchored                                                                                                    | every `**Output**` block anchored to an expected file                                                                                                                                    | 106 to anchor                                                                      |
| Harness units                                                                | 82 example folders, 0 kata folders in `drilling/code`, 85 code files, 0 `run.yaml`                                | 82 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | author about 8; convert the 82 existing folders                                    |
| Drilling page                                                                | 9,667 words; 4 of 5 exact `##` sections; headings: Recall Q&A, Applied problems, Code katas, Self-check checklist | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 0 words short; fix sections                                                        |
| Katas                                                                        | 0                                                                                                                 | at least 8 as `before`/`after` units in `drilling/code`                                                                                                                                  | 8 to write                                                                         |
| Accuracy-note files and verification tags                                    | files: 0; tags: 0                                                                                                 | none; the facts sit in References                                                                                                                                                        | none                                                                               |
| `## Examples by Level` in `learning/overview.md`                             | present                                                                                                           | present, one bullet per example                                                                                                                                                          | none                                                                               |
| Frontmatter                                                                  | `format` by-example, `category` computer-science, `description` from plan 03; `estimatedHours` snapshot 8         | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed by plan 03's drift test after the last edit                                                  | recompute                                                                          |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **DC2** The course has 0 `run.yaml` files: not opted in to plan 05's harness.
- **DC3** 23 code fences and 106 output blocks carry no anchor.
- **DC6** 17 of 105 "Why It Matters" blocks outside 50 to 100 words (median 60; heuristic count).
- **DC7** Annotation density (comment lines per code line, code files of 82 units): median 0.88, 54 units below 1.0, 0 above 2.25.
- **DC10** 4 of 5 exact `##` sections (found: Recall Q&A, Applied problems, Code katas, Self-check checklist).
- **DC11** 0 katas; the floor is 8 (8 to write).
- **DC12** Scan hits (approximate, CP-1 reads each): unseeded random uses: 1, hash-order prints: 5.
- **DC13** Scan hits (approximate): file-system uses: 1.
- **DC15** Prerequisites and metadata: re-derived and re-checked in CP-6 (universal).

## Fixes and design

- Write the 8 missing katas as `drilling/code/kata-NN-<slug>/{before,after}` units; add the fifth drilling section (elaborative interrogation); the 9,667 drilling words already meet the floor.
- Anchor the 23 unanchored code fences and the output blocks; replace the single timing-style demonstration with an operation counter.
- Make the one unseeded random use explicit (`random.Random(seed)`) and sort the 5 hash-order prints the scan found.
- Raise annotation in the 54 units outside the band (median 0.88): add `# =>` result lines and why-comments, never filler comments (guard FG6 reads repeated text). The scan measures the code files; the mode checker's reading of the lesson fences is authoritative.
- Bring 17 of the 105 "Why It Matters" blocks found (median 60 words) into the 50 to 100 word band by adding the example-specific consequence, not a template sentence (guard FG6). The count is a heuristic; the mode checker's reading is authoritative.
- Determinism and environment: Complexity demonstrations count operations (comparisons, probes, swaps) instead of reading a clock. Set and dictionary iteration is sorted before printing. The deep-recursion example sets an explicit recursion limit so the `RecursionError` is reproducible.
- Anchors: after every edit run `EX-SYNC`; where a lesson fence and its file differ, read both and decide which is right before changing either (no quiet narrowing; no prose-only repair of a code fact).

## Harness mode and toolchain

- **Harness mode**: Real mode.
- **Toolchain ids**: `python` (ids that are already in plan 05's catalog use its pins as read on 2026-10-09; Phase 0 re-reads them).
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Course lock** (hash-locked, plan 05's lock recipe; no run installs anything): `pytest` (1 file).
- **Phase 1 spikes**: SP1 (hash-locked course locks resolve and install offline on the Python image), SP12 (timing and CI projection) (defined in [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-budget.md#phase-1-spikes)).
- **Illustration budget**: at most 3 fences.
- **CI cost** (planning figure, replaced by the SP12 measurement): about 2.5 s per container invocation × 2 executions × 101 runs (82 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 8.4 minutes.

## Size class and sequencing

- **Size class M** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#size-class-rule): words to write 0 (class S), units authored from scratch 8 (class S), reading edits 71 (class M).
- **Agent packets**: one packet per defect group (anchors and sync, annotation and density, drilling and katas).
- **CI weight**: about 8.4 CI shard-minutes per full run of this course (a planning figure; SP12 replaces it with a measurement).
- **Wave 1**, slot 2. Maker: `apps-ayokoding-www-by-example-maker` for authoring gaps; fixer: `tutorial-by-example-fixer` for gate findings; `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `computer-science-foundations` (wave 2), `concurrency-and-parallelism` (wave 4), `functional-programming` (wave 5), `advanced-algorithms` (wave 6), `search-and-information-retrieval` (wave 7).

## Prerequisite re-check

- Plan 02 result: Added: `just-enough-python`; Removed: `version-control-and-git`.
- No prerequisite of this course is in this plan's 34; readiness (CP-0) has nothing to wait for.
- Prerequisites outside this plan (unchanged here): `just-enough-python`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, because this course is on the AI Engineer path, the AI manifest and its tests (rule R6).

## Per-course checklist

- [ ] CP-0 Readiness: no in-plan prerequisite; spikes SP1, SP12 are recorded as passed.
- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `data-structures-and-algorithms-essentials` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder in report-only form (not a gate cycle); `COMPLETION-PROBE data-structures-and-algorithms-essentials by-example` (RED; the failing scenarios go in the ledger); `FILLER` and the course's row in the printed metrics table; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (M): the packets above. Classes: DC2, DC3, DC6, DC7, DC10, DC11, DC12, DC13. Author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file. Unit rule: first run plus at most 2 fix attempts, then a simpler replacement.
- [ ] Units: about 8 units authored and the 82 existing folders converted; kata units in `drilling/code`; harness pre-check green for every unit before the gate starts.
- [ ] Illustration budget kept (see Harness mode and toolchain); no runnable block is marked as an illustration to pass sync (plan 05 M11).
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `data-structures-and-algorithms-essentials` exits 0 (at most 2 repair cycles).
- [ ] CP-6 Registry, guard, metadata, and closure: `FILLER` shows no fired rule for the course; `estimatedHours` recomputed from plan 03's drift test; `prerequisites` re-derived; the row `data-structures-and-algorithms-essentials` (`by-example`) added to `AUDITED_COURSES` and `COMPLETION` green; plan 02's integrity tests (`PATH-TESTS`) green; the AI manifest and its tests updated together if a prerequisite change alters its closure (rule R6).
- [ ] CP-7 Ledger row complete in `local-tmp/ayokoding-learn/execution-ledger.md`; one commit `fix(ayokoding-www): audit data-structures-and-algorithms-essentials course` with only this course folder, its `_index.md`, and its `AUDITED_COURSES` row, and any other metadata file CP-6 changed (a prerequisite edge or the AI manifest).
- [ ] C11 Course-specific obligation: No example may print a measured time; every cost claim is an operation count the run reproduces.

## Accuracy notes

- Python 3.14.8 behaviour of `dict` ordering, `sys.getrecursionlimit()`, and `heapq` is re-checked against the image the harness runs.
- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/data-structures-and-algorithms-essentials/` (stable repository facts; Phase 0 and CP-1 re-measure). Scan hits for determinism and environment are approximate and are read, not trusted, in CP-1.
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; SP12 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them beyond the notes above.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–28 (28): from "List Append and Index" to "Linked List Length by Traversal".
- **co-02 · intermediate** — examples 29–60 (32): from "Reverse a Singly Linked List Iteratively" to "Maximum Sum of a Length-k Sliding Window".
- **co-03 · advanced** — examples 61–82 (22): from "Naive Recursive Fibonacci -- and Its Exponential Cost" to "Convert Deep Recursion to Iteration to Avoid RecursionError".

## Lineage

- Prepares object-oriented programming, search, and the algorithm courses.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 9 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 8 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/ai-engineer` — position 2 of 26 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 8 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
