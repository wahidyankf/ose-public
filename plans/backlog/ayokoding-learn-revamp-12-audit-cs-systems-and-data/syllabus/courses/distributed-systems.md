# Distributed Systems

**Course ID**: `distributed-systems` · **Format**: By Example · **Category**: architecture-and-distributed-systems.

**Scope note**: Audits and fixes the existing `distributed-systems` course to the series definition of done (decision 27) and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. `networking-essentials` keeps links and protocols; `concurrency-and-parallelism` keeps one machine; `build-your-own-raft` builds one protocol; `event-driven-architecture` keeps messaging patterns. This course keeps clocks, replication, consistency, failure detection, consensus, and coordination. It does not touch `content/id/**`, any path manifest (except an AI manifest co-update when a prerequisite change alters the AI core), or another course.

**Short summary**: Reason about partial failure, clocks, replication, and consensus across machines.

## Why this exists · the big idea

- **The problem before the solution**: none of its 85 examples is run by any check (0 `run.yaml`); 10,450 words against a floor of 28,000; 81 fences and output blocks without an anchor; a drilling page of 318 words; 0 of 8 katas.
- **Keep-this-if-you-forget-everything**: Machines fail separately and clocks disagree; each example runs a small cluster model and checks the property the lesson claims.

## Prerequisites

- **Prior courses** (plan 02's revised list, kept plus added, as read on 2026-10-09): `networking-essentials`, `concurrency-and-parallelism`.
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Each concept is a protocol or invariant a reader can run in a model and see hold or break; 85 examples already follow By Example pace.
- **Wave**: 8 (slot 2); **size class**: L (words to write 17,550, units authored 9); **expected defect classes**: 8 of 15 variable classes, plus the two universal ones (DC2, DC15).

| Measure                                                                      | Today (2026-10-09, `bb7f90137`)                                                                                                                  | Target                                                                                                                                                                                   | Work                                                                              |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded)                | 10,450                                                                                                                                           | at least 28,000                                                                                                                                                                          | 17,550 to write                                                                   |
| Examples                                                                     | 85 as `### Example N`                                                                                                                            | at least 75, as `### Example N: Title`, numbered 1 to N without gaps                                                                                                                     | none (the floor is never a cap)                                                   |
| Mermaid diagrams                                                             | 1                                                                                                                                                | 30 to 50                                                                                                                                                                                 | 29 to add                                                                         |
| "Why It Matters" (50 to 100 words) and key takeaway                          | 85 and 85 (for 85 examples)                                                                                                                      | one of each per example, each "Why It Matters" block 50 to 100 words                                                                                                                     | bring 85 of the 85 blocks found into 50 to 100 words (median 26; heuristic count) |
| Annotation density (comment lines per code line, measured on the code files) | median 1.14; 3 below 1.0; 0 above 2.25 (of 85 units)                                                                                             | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 3 to fix                                                                          |
| Code fences and anchors                                                      | 84 non-diagram fences; 81 code fences unanchored                                                                                                 | every code fence anchored or marked as an illustration                                                                                                                                   | 81 to anchor                                                                      |
| Lesson-to-file anchors (plan 05's method)                                    | 0 path anchors                                                                                                                                   | every anchor matches its file                                                                                                                                                            | none                                                                              |
| Output blocks                                                                | 0 unanchored                                                                                                                                     | every `**Output**` block anchored to an expected file                                                                                                                                    | none                                                                              |
| Harness units                                                                | 0 example folders, 85 flat files, 0 kata folders in `drilling/code`, 85 code files, 0 `run.yaml`                                                 | 85 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | author about 9; convert the 85 existing folders                                   |
| Drilling page                                                                | 318 words; 1 of 5 exact `##` sections; headings: Recall Q&A, Scenario judgment, Hands-on simulation, Automaticity checklist, Extension challenge | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 4,682 words short; fix sections                                                   |
| Katas                                                                        | 0                                                                                                                                                | at least 8 as `before`/`after` units in `drilling/code`                                                                                                                                  | 8 to write                                                                        |
| Accuracy-note files and verification tags                                    | files: 0; tags: 0                                                                                                                                | none; the facts sit in References                                                                                                                                                        | none                                                                              |
| `## Examples by Level` in `learning/overview.md`                             | present                                                                                                                                          | present, one bullet per example                                                                                                                                                          | none                                                                              |
| Frontmatter                                                                  | `format` by-example, `category` architecture-and-distributed-systems, `description` from plan 03; `estimatedHours` snapshot 3                    | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed by plan 03's drift test after the last edit                                                  | recompute                                                                         |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **DC1** 85 example files are flat (`ex-nn-<slug>.py`), not unit folders.
- **DC2** The course has 0 `run.yaml` files: not opted in to plan 05's harness.
- **DC3** 81 code fences and 0 output blocks carry no anchor.
- **DC6** 85 of 85 "Why It Matters" blocks outside 50 to 100 words (median 26; heuristic count); 1 diagrams, 29 below the floor of 30.
- **DC7** 3 of 85 units below density 1.0 and 0 above 2.25 (median 1.14).
- **DC9** 10,450 words; the floor is 28,000 (17,550 short).
- **DC10** 1 of 5 exact `##` sections (found: Recall Q&A, Scenario judgment, Hands-on simulation, Automaticity checklist, Extension challenge); 318 drilling words, 4,682 short.
- **DC11** 0 katas; the floor is 8 (8 to write).
- **DC12** Scan hits (approximate, CP-1 reads each): hash-order prints: 3.
- **DC15** Prerequisites and metadata: re-derived and re-checked in CP-6 (universal).

## Fixes and design

- Write the lessons: 10,450 words for 85 examples need about 28,000, with the five parts, diagrams (1 exists, 30 needed), and `=>` annotation.
- Convert the 85 flat files into unit folders with `run.yaml` and expected files; anchor the 81 unanchored fences.
- Replace the drilling headings (`Scenario judgment`, `Hands-on simulation`, `Extension challenge`) with the five exact sections; write 8 katas and 5,000 drilling words.
- Determinism and environment: The files are flat (`ex-NN-<slug>.py`); each becomes a unit folder. The scan found no clock or thread use; the sim convention is applied by reading each unit. Output ends with `seeds: <passed> passed, <failed> failed (of <total>)` and a failing run prints `failing seed: <n> (<invariant>)`; `AYOKODING_SEED=<n>` replays one seed with a trace.
- Anchors: after every edit run `EX-SYNC`; where a lesson fence and its file differ, read both and decide which is right before changing either (no quiet narrowing; no prose-only repair of a code fact).

## Harness mode and toolchain

- **Harness mode**: Real mode with the simulation convention (all units).
- **Toolchain ids**: `python` (ids that are already in plan 05's catalog use its pins as read on 2026-10-09; Phase 0 re-reads them).
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP12 (timing and CI projection) (defined in [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-budget.md#phase-1-spikes)).
- **Illustration budget**: at most 3 fences.
- **CI cost** (planning figure, replaced by the SP12 measurement): about 2.6 s per container invocation × 2 executions × 104 runs (85 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 9.0 minutes.

## Simulation convention

Plan 05's simulation convention (rules S1 to S9: single-threaded event loop, virtual clock, one seeded SplitMix64 generator, pure state machines, invariants after every step) applies to this course as follows (details in [tech-docs/003](../../tech-docs/003-harness-modes-simulation-and-determinism.md#simulation-convention)).

- **Units that use it**: About 70 of the 85 units run a cluster model: a single-threaded event loop, a virtual clock, one seeded SplitMix64 generator for delay, loss, duplication, reordering, and crash choices, pure node state machines, and invariants checked after every step. The remaining units are pure functions (clocks, quorum arithmetic).
- **Invariants** (checked after every step):
  - Lamport: if a happened before b then L(a) < L(b); vector clocks order two events as concurrent if and only if neither vector dominates.
  - Quorums: with R + W > N every read quorum intersects every write quorum.
  - Convergence: replicas that deliver all updates reach equal state (CRDT merge laws).
  - Agreement: no two nodes decide different values (Paxos, Raft, two-phase commit's atomicity).
  - Election safety: at most one leader per term; log matching holds on every pair of logs.
  - Failure detector: every crashed node is eventually suspected by every live node under the model's assumptions.
  - The same seed gives the same trace.
- **Seeds**: 1 to 64 (the convention's floor is 32). Demonstrated bugs (split brain, stale read below quorum, FLP non-termination, 2PC blocking) name a failing seed and expect exit 1 on that run only. At least 32 seeds per unit (the convention's floor). A violation prints `failing seed: <n> (<invariant>)`; the last line is `seeds: <passed> passed, <failed> failed (of <total>)`; `AYOKODING_SEED=<n>` replays one seed with a trace; `run.yaml` sets `simulation: true`. A demonstrated bug may expect exit 1 for its named seed, and the unit's `invariant` sentence says so.

## Size class and sequencing

- **Size class L** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#size-class-rule): words to write 17,550 (class L), units authored from scratch 9 (class S), reading edits 88 (class M).
- **Agent packets**: authoring split by learning page (one packet per page), then one packet per remaining defect group.
- **CI weight**: about 9.0 CI shard-minutes per full run of this course (a planning figure; SP12 replaces it with a measurement).
- **Wave 8**, slot 2. Maker: `apps-ayokoding-www-by-example-maker` for authoring gaps; fixer: `tutorial-by-example-fixer` for gate findings; `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `build-your-own-raft` (wave 10).

## Prerequisite re-check

- Plan 02 result: Kept: `networking-essentials`, `concurrency-and-parallelism`.
- In-plan prerequisites are audited first: `networking-essentials` (wave 6), `concurrency-and-parallelism` (wave 4).
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests.

## Per-course checklist

- [ ] CP-0 Readiness: in-plan prerequisites `networking-essentials`, `concurrency-and-parallelism` are DONE in the ledger; spikes SP12 are recorded as passed.
- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `distributed-systems` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder in report-only form (not a gate cycle); `COMPLETION-PROBE distributed-systems by-example` (RED; the failing scenarios go in the ledger); `FILLER` and the course's row in the printed metrics table; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (L): the packets above. Classes: DC1, DC2, DC3, DC6, DC7, DC9, DC10, DC11, DC12. Author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file. Unit rule: first run plus at most 2 fix attempts, then a simpler replacement.
- [ ] Units: about 9 units authored and the 85 existing folders converted; kata units in `drilling/code`; harness pre-check green for every unit before the gate starts.
- [ ] Illustration budget kept (see Harness mode and toolchain); no runnable block is marked as an illustration to pass sync (plan 05 M11).
- [ ] Simulation: every unit above follows S1 to S9; each prints the `seeds:` summary line; a deliberately broken variant fails on a named seed.
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `distributed-systems` exits 0 (at most 2 repair cycles).
- [ ] CP-6 Registry, guard, metadata, and closure: `FILLER` shows no fired rule for the course; `estimatedHours` recomputed from plan 03's drift test; `prerequisites` re-derived; the row `distributed-systems` (`by-example`) added to `AUDITED_COURSES` and `COMPLETION` green; plan 02's integrity tests (`PATH-TESTS`) green.
- [ ] CP-7 Ledger row complete in `local-tmp/ayokoding-learn/execution-ledger.md`; one commit `fix(ayokoding-www): audit distributed-systems course` with only this course folder, its `_index.md`, and its `AUDITED_COURSES` row, and any other metadata file CP-6 changed (a prerequisite edge or the AI manifest).
- [ ] C11 Course-specific obligation: Every unit follows S1 to S9: no real network, clock, thread, or unseeded random; at least 32 seeds; the summary line; and a replay by `AYOKODING_SEED`.

## Accuracy notes

- Statements about Raft, Paxos, FLP, CAP, PACELC, CRDTs, and named systems (etcd, ZooKeeper, Spanner, Dynamo) are cited with a source and date; the Raft invariants follow the Raft paper's Figure 3.
- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/distributed-systems/` (stable repository facts; Phase 0 and CP-1 re-measure). Scan hits for determinism and environment are approximate and are read, not trusted, in CP-1.
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; SP12 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them beyond the notes above.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–26 (26): from "Make the fallacies concrete" to "Achieve an effectively-once effect".
- **co-02 · intermediate** — examples 27–54 (28): from "Replicate from a leader" to "Expire a lease".
- **co-03 · advanced** — examples 55–85 (31): from "Start a Raft election" to "Choose a coordination-service boundary".

## Lineage

- Follows Networking Essentials and Concurrency; prepares Build Your Own Raft and system design.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 102 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 100 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 85 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
