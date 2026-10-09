# Concurrency & Parallelism

**Course ID**: `concurrency-and-parallelism` · **Format**: By Example · **Category**: computer-science.

**Scope note**: Audits and fixes the existing `concurrency-and-parallelism` course to the series definition of done (decision 27) and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. `actor-model-concurrency` and `csp-style-concurrency` teach two message-passing models; `distributed-systems` teaches failure across machines; this course keeps threads, locks, asyncio, process pools, and the failures between them. It does not touch `content/id/**`, any path manifest (except an AI manifest co-update when a prerequisite change alters the AI core), or another course.

**Short summary**: Run work at the same time with threads and async code without corrupting state.

## Why this exists · the big idea

- **The problem before the solution**: none of its 87 examples is run by any check (0 `run.yaml`); 193 fences and output blocks without an anchor; 80 of 87 code units below the annotation band (median 0.86).
- **Keep-this-if-you-forget-everything**: Concurrency is about structure and parallelism is about speed; threads, asyncio, and processes each get an example that shows a bug and its fix.

## Prerequisites

- **Prior courses** (plan 02's revised list, kept plus added, as read on 2026-10-09): `just-enough-python`, `data-structures-and-algorithms-essentials`, `programming-paradigms`.
- **Edges plan 02 removes**: `functional-programming`.
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Every mechanism has a good run and a bad run; 87 examples already follow By Example pace.
- **Wave**: 4 (slot 1); **size class**: L (words to write 0, units authored 0); **expected defect classes**: 6 of 15 variable classes, plus the two universal ones (DC2, DC15).

| Measure                                                                      | Today (2026-10-09, `bb7f90137`)                                                                                                                                  | Target                                                                                                                                                                                   | Work                                                                             |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded)                | 90,432                                                                                                                                                           | at least 28,000                                                                                                                                                                          | none (floor met)                                                                 |
| Examples                                                                     | 87 as `### Example N`                                                                                                                                            | at least 75, as `### Example N: Title`, numbered 1 to N without gaps                                                                                                                     | none (the floor is never a cap)                                                  |
| Mermaid diagrams                                                             | 34                                                                                                                                                               | 30 to 50                                                                                                                                                                                 | none                                                                             |
| "Why It Matters" (50 to 100 words) and key takeaway                          | 87 and 87 (for 87 examples)                                                                                                                                      | one of each per example, each "Why It Matters" block 50 to 100 words                                                                                                                     | bring 1 of the 87 blocks found into 50 to 100 words (median 67; heuristic count) |
| Annotation density (comment lines per code line, measured on the code files) | median 0.86; 80 below 1.0; 0 above 2.25 (of 87 units)                                                                                                            | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 80 to fix                                                                        |
| Code fences and anchors                                                      | 401 non-diagram fences; 5 code fences unanchored                                                                                                                 | every code fence anchored or marked as an illustration                                                                                                                                   | 5 to anchor                                                                      |
| Lesson-to-file anchors (plan 05's method)                                    | 194 path anchors: 194 resolve to a file, of which 10 differ from it; 0 missing                                                                                   | every anchor matches its file                                                                                                                                                            | 10 to repair after reading each diff                                             |
| Output blocks                                                                | 188 unanchored                                                                                                                                                   | every `**Output**` block anchored to an expected file                                                                                                                                    | 188 to anchor                                                                    |
| Harness units                                                                | 87 example folders, 10 kata folders in `drilling/code`, 206 code files, 0 `run.yaml`                                                                             | 87 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | convert the 87 existing folders (add `run.yaml` and expected files)              |
| Drilling page                                                                | 13,387 words; 5 of 5 exact `##` sections; headings: Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 0 words short                                                                    |
| Katas                                                                        | 10                                                                                                                                                               | at least 8 as `before`/`after` units in `drilling/code`                                                                                                                                  | none                                                                             |
| Accuracy-note files and verification tags                                    | files: 0; tags: 0                                                                                                                                                | none; the facts sit in References                                                                                                                                                        | none                                                                             |
| `## Examples by Level` in `learning/overview.md`                             | present                                                                                                                                                          | present, one bullet per example                                                                                                                                                          | none                                                                             |
| Frontmatter                                                                  | `format` by-example, `category` computer-science, `description` from plan 03; `estimatedHours` snapshot 12                                                       | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed by plan 03's drift test after the last edit                                                  | recompute                                                                        |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **DC2** The course has 0 `run.yaml` files: not opted in to plan 05's harness.
- **DC3** 5 code fences and 188 output blocks carry no anchor.
- **DC4** 10 of 194 anchors differ from their files; 0 point at no file.
- **DC6** 1 of 87 "Why It Matters" blocks outside 50 to 100 words (median 67; heuristic count).
- **DC7** Annotation density (comment lines per code line, code files of 87 units): median 0.86, 80 units below 1.0, 0 above 2.25.
- **DC12** Scan hits (approximate, CP-1 reads each): wall-clock reads: 30, sleeps: 57, unseeded random uses: 3, thread/goroutine/process uses: 119, asyncio uses: 36, subprocess uses: 1, hash-order prints: 18.
- **DC13** Scan hits (approximate): file-system uses: 2, Windows-only calls: 2, Linux-only calls: 3.
- **DC15** Prerequisites and metadata: re-derived and re-checked in CP-6 (universal).

## Fixes and design

- Replace sleeps and clock reads with events, barriers, and the virtual clock; fix pool sizes explicitly.
- Re-anchor the 10 mismatched anchors, anchor the 188 output blocks and 5 code fences.
- Keep the drilling page (13,387 words) and the 10 katas; run the katas as `before` (exit 1 with a `FAIL:` line) and `after` (exit 0) units.
- Raise annotation in the 80 units outside the band (median 0.86): add `# =>` result lines and why-comments, never filler comments (guard FG6 reads repeated text). The scan measures the code files; the mode checker's reading of the lesson fences is authoritative.
- Bring 1 of the 87 "Why It Matters" blocks found (median 67 words) into the 50 to 100 word band by adding the example-specific consequence, not a template sentence (guard FG6). The count is a heuristic; the mode checker's reading is authoritative.
- Determinism and environment: The scan found 119 thread, 57 sleep, 30 wall-clock, and 36 asyncio uses. Real-thread examples are deterministic by construction (`Event`, `Barrier`, queues, joined results, sorted output) and never print a pool size taken from the CPU count (`os.cpu_count()` differs under the halved CPU quota). Speed-up examples count work units, not seconds. The free-threaded build example prints the GIL state of the catalog's default build and says so.
- Anchors: after every edit run `EX-SYNC`; where a lesson fence and its file differ, read both and decide which is right before changing either (no quiet narrowing; no prose-only repair of a code fact).

## Harness mode and toolchain

- **Harness mode**: Real mode with the simulation convention.
- **Toolchain ids**: `python` (ids that are already in plan 05's catalog use its pins as read on 2026-10-09; Phase 0 re-reads them).
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Course lock** (hash-locked, plan 05's lock recipe; no run installs anything): `pytest` (3 files), `reactivex` (2 files).
- **Phase 1 spikes**: SP1 (hash-locked course locks resolve and install offline on the Python image), SP6 (output independent of CPU count), SP12 (timing and CI projection) (defined in [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-budget.md#phase-1-spikes)).
- **Illustration budget**: at most 3 fences.
- **CI cost** (planning figure, replaced by the SP12 measurement): about 2.8 s per container invocation × 2 executions × 106 runs (87 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 9.9 minutes.

## Simulation convention

Plan 05's simulation convention (rules S1 to S9: single-threaded event loop, virtual clock, one seeded SplitMix64 generator, pure state machines, invariants after every step) applies to this course as follows (details in [tech-docs/003](../../tech-docs/003-harness-modes-simulation-and-determinism.md#simulation-convention)).

- **Units that use it**: The race, deadlock, starvation, bounded-buffer, reader-writer, semaphore, and cancellation examples (about 14 of 87) run on a cooperative scheduler model inside the unit, with a virtual clock and a seeded SplitMix64 choice of the next runnable task.
- **Invariants** (checked after every step):
  - Mutual exclusion: at most one task is inside a critical section.
  - Lock-guarded counters equal the number of increments; the unguarded version loses updates on at least one seed (a demonstrated bug, expected exit 1 for that named run).
  - A deadlock is reported if and only if the wait-for graph has a cycle.
  - A bounded buffer never exceeds its capacity and never underflows; every produced item is consumed exactly once.
  - No writer overlaps a reader or another writer; a semaphore never exceeds its permits.
  - A cancelled task releases every resource it held.
- **Seeds**: 1 to 64. At least 32 seeds per unit (the convention's floor). A violation prints `failing seed: <n> (<invariant>)`; the last line is `seeds: <passed> passed, <failed> failed (of <total>)`; `AYOKODING_SEED=<n>` replays one seed with a trace; `run.yaml` sets `simulation: true`. A demonstrated bug may expect exit 1 for its named seed, and the unit's `invariant` sentence says so.

## Size class and sequencing

- **Size class L** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#size-class-rule): words to write 0 (class S), units authored from scratch 0 (class S), reading edits 91 (class M). Raised by a documented override: about 60 thread, sleep, and clock units are rewritten.
- **Agent packets**: one packet per learning page (unit conversion, anchors, and annotation for that page), then one packet per remaining defect group.
- **CI weight**: about 9.9 CI shard-minutes per full run of this course (a planning figure; SP12 replaces it with a measurement).
- **Wave 4**, slot 1. Maker: `apps-ayokoding-www-by-example-maker` for authoring gaps; fixer: `tutorial-by-example-fixer` for gate findings; `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `capstone-solid-core` (wave 7), `distributed-systems` (wave 8), `actor-model-concurrency` (wave 9), `csp-style-concurrency` (wave 9).

## Prerequisite re-check

- Plan 02 result: Added: `just-enough-python`, `data-structures-and-algorithms-essentials`, `programming-paradigms`; Removed: `functional-programming`.
- In-plan prerequisites are audited first: `data-structures-and-algorithms-essentials` (wave 1), `programming-paradigms` (wave 3).
- Prerequisites outside this plan (unchanged here): `just-enough-python`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests.

## Per-course checklist

- [ ] CP-0 Readiness: in-plan prerequisites `data-structures-and-algorithms-essentials`, `programming-paradigms` are DONE in the ledger; spikes SP1, SP6, SP12 are recorded as passed.
- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `concurrency-and-parallelism` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder in report-only form (not a gate cycle); `COMPLETION-PROBE concurrency-and-parallelism by-example` (RED; the failing scenarios go in the ledger); `FILLER` and the course's row in the printed metrics table; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (L): the packets above. Classes: DC2, DC3, DC4, DC6, DC7, DC12, DC13. Author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file. Unit rule: first run plus at most 2 fix attempts, then a simpler replacement.
- [ ] Units: all 87 existing example folders converted to units; kata units in `drilling/code`; harness pre-check green for every unit before the gate starts.
- [ ] Illustration budget kept (see Harness mode and toolchain); no runnable block is marked as an illustration to pass sync (plan 05 M11).
- [ ] Simulation: every unit above follows S1 to S9; each prints the `seeds:` summary line; a deliberately broken variant fails on a named seed.
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `concurrency-and-parallelism` exits 0 (at most 2 repair cycles).
- [ ] CP-6 Registry, guard, metadata, and closure: `FILLER` shows no fired rule for the course; `estimatedHours` recomputed from plan 03's drift test; `prerequisites` re-derived; the row `concurrency-and-parallelism` (`by-example`) added to `AUDITED_COURSES` and `COMPLETION` green; plan 02's integrity tests (`PATH-TESTS`) green.
- [ ] CP-7 Ledger row complete in `local-tmp/ayokoding-learn/execution-ledger.md`; one commit `fix(ayokoding-www): audit concurrency-and-parallelism course` with only this course folder, its `_index.md`, and its `AUDITED_COURSES` row, and any other metadata file CP-6 changed (a prerequisite edge or the AI manifest).
- [ ] C11 Course-specific obligation: No real-thread unit depends on scheduling order for its output; every ordering claim is shown by a model unit with a printed `seeds: N passed, 0 failed (of 64)` line.

## Accuracy notes

- Python 3.14 concurrency facts (free-threaded build status, `asyncio.TaskGroup`, `interpreters`) are re-read on python.org on the execution date; the lessons state what the catalog image does.
- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/concurrency-and-parallelism/` (stable repository facts; Phase 0 and CP-1 re-measure). Scan hits for determinism and environment are approximate and are read, not trusted, in CP-1.
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; SP12 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them beyond the notes above.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–28 (28): from "Concurrency vs. Parallelism, Illustrated" to "`asyncio.gather` Runs `asyncio.sleep` Tasks Concurrently".
- **co-02 · intermediate** — examples 29–57 (29): from "Two Threads, Two Locks, Opposite Order -- A Reproduced Deadl" to "Map-Reduce -- Split the Work, Combine the Partial Results".
- **co-03 · advanced** — examples 58–87 (30): from "On a Free-Threaded Build, CPU-Bound Threads Actually Scale" to "An Annotated Marble Diagram for merge -> map -> debounce".

## Lineage

- Follows Programming Paradigms; prepares actor, CSP, distributed systems, and advanced algorithms' parallel preview.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 81 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 80 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 62 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
