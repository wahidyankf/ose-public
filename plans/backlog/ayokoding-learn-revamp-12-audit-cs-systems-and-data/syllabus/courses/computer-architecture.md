# Computer Architecture

**Course ID**: `computer-architecture` · **Format**: By Example · **Category**: systems-and-networking.

**Scope note**: Audits and fixes the existing `computer-architecture` course to the series definition of done (decision 27) and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. `computer-science-foundations` keeps bits and logic; `system-programming` keeps memory ownership in C; this course keeps CPUs, caches, memory, pipelines, and parallel hardware. It does not touch `content/id/**`, any path manifest (except an AI manifest co-update when a prerequisite change alters the AI core), or another course.

**Short summary**: Learn how CPUs, caches, and memory decide how fast your code really runs.

## Why this exists · the big idea

- **The problem before the solution**: none of its 80 examples is run by any check (0 `run.yaml`); 164 fences and output blocks without an anchor; 60 of 80 code units below the annotation band (median 0.67); 0 of 8 katas.
- **Keep-this-if-you-forget-everything**: Speed comes from memory, not arithmetic; each C example shows a cache, branch, or pipeline effect as a count the run reproduces.

## Prerequisites

- **Prior courses** (plan 02's revised list, kept plus added, as read on 2026-10-09): `computer-science-foundations`, `just-enough-python`.
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Each effect is a small C program or model with an observable count; 80 examples already follow By Example pace.
- **Wave**: 4 (slot 2); **size class**: L (words to write 0, units authored 8); **expected defect classes**: 7 of 15 variable classes, plus the two universal ones (DC2, DC15).

| Measure                                                                      | Today (2026-10-09, `bb7f90137`)                                                                                   | Target                                                                                                                                                                                   | Work                                            |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded)                | 100,135                                                                                                           | at least 28,000                                                                                                                                                                          | none (floor met)                                |
| Examples                                                                     | 80 as `### Example N`                                                                                             | at least 75, as `### Example N: Title`, numbered 1 to N without gaps                                                                                                                     | none                                            |
| Mermaid diagrams                                                             | 31                                                                                                                | 30 to 50                                                                                                                                                                                 | none                                            |
| "Why It Matters" (50 to 100 words) and key takeaway                          | 80 and 80 (for 80 examples)                                                                                       | one of each per example, each "Why It Matters" block 50 to 100 words                                                                                                                     | none                                            |
| Annotation density (comment lines per code line, measured on the code files) | median 0.67; 60 below 1.0; 1 above 2.25 (of 80 units)                                                             | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 61 to fix                                       |
| Code fences and anchors                                                      | 166 non-diagram fences; 80 code fences unanchored                                                                 | every code fence anchored or marked as an illustration                                                                                                                                   | 80 to anchor                                    |
| Lesson-to-file anchors (plan 05's method)                                    | 0 path anchors                                                                                                    | every anchor matches its file                                                                                                                                                            | none                                            |
| Output blocks                                                                | 84 unanchored                                                                                                     | every `**Output**` block anchored to an expected file                                                                                                                                    | 84 to anchor                                    |
| Harness units                                                                | 80 example folders, 0 kata folders in `drilling/code`, 85 code files, 0 `run.yaml`                                | 80 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | author about 8; convert the 80 existing folders |
| Drilling page                                                                | 5,542 words; 4 of 5 exact `##` sections; headings: Recall Q&A, Applied problems, Code katas, Self-check checklist | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 0 words short; fix sections                     |
| Katas                                                                        | 0                                                                                                                 | at least 8 as `before`/`after` units in `drilling/code`                                                                                                                                  | 8 to write                                      |
| Accuracy-note files and verification tags                                    | files: 0; tags: 0                                                                                                 | none; the facts sit in References                                                                                                                                                        | none                                            |
| `## Examples by Level` in `learning/overview.md`                             | present                                                                                                           | present, one bullet per example                                                                                                                                                          | none                                            |
| Frontmatter                                                                  | `format` by-example, `category` systems-and-networking, `description` from plan 03; `estimatedHours` snapshot 16  | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed by plan 03's drift test after the last edit                                                  | recompute                                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **DC1** No `learning/capstone/overview.md`.
- **DC2** The course has 0 `run.yaml` files: not opted in to plan 05's harness.
- **DC3** 80 code fences and 84 output blocks carry no anchor.
- **DC7** Annotation density (comment lines per code line, code files of 80 units): median 0.67, 60 units below 1.0, 1 above 2.25.
- **DC10** 4 of 5 exact `##` sections (found: Recall Q&A, Applied problems, Code katas, Self-check checklist).
- **DC11** 0 katas; the floor is 8 (8 to write).
- **DC12** Scan hits (approximate, CP-1 reads each): wall-clock reads: 48, unseeded random uses: 13, thread/goroutine/process uses: 9, subprocess uses: 1, hash-order prints: 3.
- **DC13** Scan hits (approximate): file-system uses: 1, Linux-only calls: 2.
- **DC15** Prerequisites and metadata: re-derived and re-checked in CP-6 (universal).

## Fixes and design

- Convert every timing example to a model or a count; keep real-hardware lessons as explained reasoning with the model unit proving the logic.
- Write 8 katas (none exist) and add the missing fifth drilling section; anchor the 80 code fences and 84 output blocks; add `learning/capstone/overview.md` (the folder holds only `explanation.md` and `code/`).
- Review the 100,135 words for padding the guard cannot see; keep the diagram count in band.
- Raise annotation in the 61 units outside the band (median 0.67): add `# =>` result lines and why-comments, never filler comments (guard FG6 reads repeated text). The scan measures the code files; the mode checker's reading of the lesson fences is authoritative.
- Determinism and environment: 48 files read a clock (`clock()`, `rdtsc`, `clock_gettime`) and 13 use unseeded random numbers. Timing comparisons become simulated cycle counts from the models; real-hardware measurements are described in prose only and never reach an expected file. Output never depends on the CPU count or cache size of the host (decision D8).
- Anchors: after every edit run `EX-SYNC`; where a lesson fence and its file differ, read both and decide which is right before changing either (no quiet narrowing; no prose-only repair of a code fact).

## Harness mode and toolchain

- **Harness mode**: Real mode with deterministic models.
- **Toolchain ids**: `gcc`, `python` (ids that are already in plan 05's catalog use its pins as read on 2026-10-09; Phase 0 re-reads them).
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP6 (output independent of CPU count), SP8 (C toolchain: standard, sanitizers, seccomp profile), SP12 (timing and CI projection) (defined in [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-budget.md#phase-1-spikes)).
- **Illustration budget**: at most 3 fences.
- **CI cost** (planning figure, replaced by the SP12 measurement): about 3.2 s per container invocation × 2 executions × 99 runs (80 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 10.6 minutes.

## Simulation convention

Plan 05's simulation convention (rules S1 to S9: single-threaded event loop, virtual clock, one seeded SplitMix64 generator, pure state machines, invariants after every step) applies to this course as follows (details in [tech-docs/003](../../tech-docs/003-harness-modes-simulation-and-determinism.md#simulation-convention)).

- **Units that use it**: Cache-miss sweeps, branch prediction, pipeline hazards, TLB behaviour, and false sharing (about 30 of 80) run on a software model of the hardware effect (a set-associative cache simulator, a two-bit predictor, a pipeline hazard counter) fed by seeded or fixed traces.
- **Invariants** (checked after every step):
  - hits + misses equals accesses for every trace.
  - For an LRU cache of capacity C, a repeated sweep over at most C blocks has zero misses after the first pass (stack property).
  - Doubling associativity at equal capacity never raises the miss count of a fixed trace under LRU.
  - A saturating two-bit predictor mispredicts at most twice per loop exit pattern.
  - The same seed gives the same trace and the same counts.
- **Seeds**: 1 to 64 for generated traces. At least 32 seeds per unit (the convention's floor). A violation prints `failing seed: <n> (<invariant>)`; the last line is `seeds: <passed> passed, <failed> failed (of <total>)`; `AYOKODING_SEED=<n>` replays one seed with a trace; `run.yaml` sets `simulation: true`. A demonstrated bug may expect exit 1 for its named seed, and the unit's `invariant` sentence says so.

## Size class and sequencing

- **Size class L** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#size-class-rule): words to write 0 (class S), units authored from scratch 8 (class S), reading edits 61 (class M). Raised by a documented override: about 60 timing examples become model or count units.
- **Agent packets**: one packet per learning page (unit conversion, anchors, and annotation for that page), then one packet per remaining defect group.
- **CI weight**: about 10.6 CI shard-minutes per full run of this course (a planning figure; SP12 replaces it with a measurement).
- **Wave 4**, slot 2. Maker: `apps-ayokoding-www-by-example-maker` for authoring gaps; fixer: `tutorial-by-example-fixer` for gate findings; `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 result: Kept: `computer-science-foundations`; Added: `just-enough-python`.
- In-plan prerequisites are audited first: `computer-science-foundations` (wave 2).
- Prerequisites outside this plan (unchanged here): `just-enough-python`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, because this course is on the AI Engineer path, the AI manifest and its tests (rule R6).

## Per-course checklist

- [ ] CP-0 Readiness: in-plan prerequisites `computer-science-foundations` are DONE in the ledger; spikes SP6, SP8, SP12 are recorded as passed.
- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `computer-architecture` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder in report-only form (not a gate cycle); `COMPLETION-PROBE computer-architecture by-example` (RED; the failing scenarios go in the ledger); `FILLER` and the course's row in the printed metrics table; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (L): the packets above. Classes: DC1, DC2, DC3, DC7, DC10, DC11, DC12, DC13. Author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file. Unit rule: first run plus at most 2 fix attempts, then a simpler replacement.
- [ ] Units: about 8 units authored and the 80 existing folders converted; kata units in `drilling/code`; harness pre-check green for every unit before the gate starts.
- [ ] Illustration budget kept (see Harness mode and toolchain); no runnable block is marked as an illustration to pass sync (plan 05 M11).
- [ ] Simulation: every unit above follows S1 to S9; each prints the `seeds:` summary line; a deliberately broken variant fails on a named seed.
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `computer-architecture` exits 0 (at most 2 repair cycles).
- [ ] CP-6 Registry, guard, metadata, and closure: `FILLER` shows no fired rule for the course; `estimatedHours` recomputed from plan 03's drift test; `prerequisites` re-derived; the row `computer-architecture` (`by-example`) added to `AUDITED_COURSES` and `COMPLETION` green; plan 02's integrity tests (`PATH-TESTS`) green; the AI manifest and its tests updated together if a prerequisite change alters its closure (rule R6).
- [ ] CP-7 Ledger row complete in `local-tmp/ayokoding-learn/execution-ledger.md`; one commit `fix(ayokoding-www): audit computer-architecture course` with only this course folder, its `_index.md`, and its `AUDITED_COURSES` row, and any other metadata file CP-6 changed (a prerequisite edge or the AI manifest).
- [ ] C11 Course-specific obligation: No expected file contains a measured duration, a cycle counter read, or a host-specific cache size.

## Accuracy notes

- Cache sizes, latency figures, and ISA statements (x86-64, ARM64, RISC-V) are cited with a source and date; any figure not reproduced by a model is labelled as typical, not measured.
- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/computer-architecture/` (stable repository facts; Phase 0 and CP-1 re-measure). Scan hits for determinism and environment are approximate and are read, not trusted, in CP-1.
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; SP12 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them beyond the notes above.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–27 (27): from "Print Int Bytes" to "ISA Compare -- RISC-V vs x86".
- **co-02 · intermediate** — examples 28–57 (30): from "Cache-Miss Stride Sweep" to "CPI/IPC: Dependent Chain vs Independent Accumulators".
- **co-03 · advanced** — examples 58–80 (23): from "Optimize a Kernel End to End" to "Mechanical Sympathy Recap".

## Lineage

- Follows CS Foundations; prepares system programming, Linux, and performance work in other courses.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 77 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 76 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/ai-engineer` — position 3 of 26 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 58 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
