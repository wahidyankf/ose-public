# Build Your Own Raft

**Course ID**: `build-your-own-raft` · **Format**: By Example · **Category**: architecture-and-distributed-systems.

**Scope note**: Audits and fixes the existing `build-your-own-raft` course to the series definition of done (decision 27) and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. `distributed-systems` surveys the field; this course builds one protocol and a replicated key-value store. It does not touch `content/id/**`, any path manifest (except an AI manifest co-update when a prerequisite change alters the AI core), or another course. Because plan 09's filler guard lists the course, the fix also removes its baseline entry in the same commit.

**Short summary**: Build a small Raft cluster with leader election and a replicated key-value store.

## Why this exists · the big idea

- **The problem before the solution**: none of its 78 examples is run by any check (0 `run.yaml`); 2,578 words against a floor of 28,000; none of 78 examples has a "Why It Matters" block; plan 09's filler guard flags it (FG2 and FG4; unique-code ratio 0.01; stub share 1.0); a drilling page of 168 words.
- **Keep-this-if-you-forget-everything**: Raft is a state machine plus a few rules about terms, votes, and logs; you build it in Go as a pure function and let a simulator try to break it.

## Prerequisites

- **Prior courses** (plan 02's revised list, kept plus added, as read on 2026-10-09): `just-enough-go`, `distributed-systems`.
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Each rule is a small Go program with a test; the guard finds the 78 existing sources templated and stub-like (FG2, and FG4 with a stub share of 1.0), so all units are rewritten.
- **Wave**: 10 (slot 1); **size class**: XL (words to write 25,422, units authored 87); **expected defect classes**: 6 of 15 variable classes, plus the two universal ones (DC2, DC15).

| Measure                                                                      | Today (2026-10-09, `bb7f90137`)                                                                                                               | Target                                                                                                                                                                                   | Work                                                     |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded)                | 2,578                                                                                                                                         | at least 28,000                                                                                                                                                                          | 25,422 to write                                          |
| Examples                                                                     | 78 as `## Example N`                                                                                                                          | at least 75, as `### Example N: Title`, numbered 1 to N without gaps                                                                                                                     | rename 78 headings to `### Example N: Title`             |
| Mermaid diagrams                                                             | 0                                                                                                                                             | 30 to 50                                                                                                                                                                                 | 30 to add                                                |
| "Why It Matters" (50 to 100 words) and key takeaway                          | 0 and 0 (for 78 examples)                                                                                                                     | one of each per example, each "Why It Matters" block 50 to 100 words                                                                                                                     | write 78 "Why It Matters" blocks; write 78 key takeaways |
| Annotation density (comment lines per code line, measured on the code files) | median 1.0; 0 below 1.0; 0 above 2.25 (of 78 units)                                                                                           | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | none                                                     |
| Code fences and anchors                                                      | 0 non-diagram fences; 0 code fences unanchored                                                                                                | every code fence anchored or marked as an illustration                                                                                                                                   | none                                                     |
| Lesson-to-file anchors (plan 05's method)                                    | 0 path anchors                                                                                                                                | every anchor matches its file                                                                                                                                                            | none                                                     |
| Output blocks                                                                | 0 unanchored                                                                                                                                  | every `**Output**` block anchored to an expected file                                                                                                                                    | none                                                     |
| Harness units                                                                | 78 example folders, 0 kata folders in `drilling/code`, 83 code files, 0 `run.yaml`                                                            | 78 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | author about 87                                          |
| Drilling page                                                                | 168 words; 1 of 5 exact `##` sections; headings: Recall Q&A, Calculation practice, Scenario judgment, Design exercise, Automaticity checklist | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 4,832 words short; fix sections                          |
| Katas                                                                        | 0                                                                                                                                             | at least 8 as `before`/`after` units in `drilling/code`                                                                                                                                  | 8 to write                                               |
| Accuracy-note files and verification tags                                    | files: 0; tags: 0                                                                                                                             | none; the facts sit in References                                                                                                                                                        | none                                                     |
| `## Examples by Level` in `learning/overview.md`                             | absent (CRITICAL)                                                                                                                             | present, one bullet per example                                                                                                                                                          | add (regenerate with the index command)                  |
| Frontmatter                                                                  | `format` by-example, `category` architecture-and-distributed-systems, `description` from plan 03; `estimatedHours` snapshot 1                 | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed by plan 03's drift test after the last edit                                                  | recompute                                                |
| Filler guard (plan 09)                                                       | in `FILLER_BASELINE`: FG2 and FG4 (unique-code ratio 0.01; stub share 1.0)                                                                    | no entry; guard passes with no baseline help                                                                                                                                             | remove the entry in this course's commit                 |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **DC2** The course has 0 `run.yaml` files: not opted in to plan 05's harness.
- **DC5** Headings are 78 × `## Example N` instead of `### Example N: Title`; `learning/overview.md` has no `## Examples by Level` section (CRITICAL when absent).
- **DC6** 0 "Why It Matters" blocks for 78 examples; 0 key takeaways for 78 examples; 0 diagrams, 30 below the floor of 30.
- **DC9** 2,578 words; the floor is 28,000 (25,422 short).
- **DC10** 1 of 5 exact `##` sections (found: Recall Q&A, Calculation practice, Scenario judgment, Design exercise, Automaticity checklist); 168 drilling words, 4,832 short.
- **DC11** 0 katas; the floor is 8 (8 to write).
- **DC16** Listed in plan 09's `FILLER_BASELINE`; the guard's measured values are in the course notes below.
- **DC15** Prerequisites and metadata: re-derived and re-checked in CP-6 (universal).

## Fixes and design

- Rewrite all 78 units and the capstone; write the lessons (2,578 words, 28,000 needed); replace the `## Example NN` headings with `### Example N: Title` headings that carry real titles.
- Replace the nonstandard drilling headings with the five exact sections; add 8 katas and 5,000 drilling words; add 30 or more diagrams (none exist).
- Remove `build-your-own-raft` from `FILLER_BASELINE` in the same commit (guards FG2 and FG4).
- 78 example programs, 8 katas, and the capstone are rewritten from scratch by `swe-developer` (test first); the existing stubs are discarded.
- Determinism and environment: `go run` and `go test` write to `GOCACHE=/tmp/gocache` (read-only root); modules are standard library only (`GOFLAGS=-mod=mod`, `GOPROXY=off`); `GOMAXPROCS` is fixed in `env` so the double run matches; no `time.Now`, `time.Sleep`, or `math/rand` default source.
- Anchors: after every edit run `EX-SYNC`; where a lesson fence and its file differ, read both and decide which is right before changing either (no quiet narrowing; no prose-only repair of a code fact).

## Harness mode and toolchain

- **Harness mode**: Real mode with the simulation convention (all units).
- **Toolchain ids**: `go` (ids that are already in plan 05's catalog use its pins as read on 2026-10-09; Phase 0 re-reads them).
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP6 (output independent of CPU count), SP10 (Go `testing/synctest` and offline modules), SP12 (timing and CI projection) (defined in [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-budget.md#phase-1-spikes)).
- **Illustration budget**: at most 3 fences.
- **CI cost** (planning figure, replaced by the SP12 measurement): about 4.0 s per container invocation × 2 executions × 97 runs (78 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 12.9 minutes.

## Simulation convention

Plan 05's simulation convention (rules S1 to S9: single-threaded event loop, virtual clock, one seeded SplitMix64 generator, pure state machines, invariants after every step) applies to this course as follows (details in [tech-docs/003](../../tech-docs/003-harness-modes-simulation-and-determinism.md#simulation-convention)).

- **Units that use it**: Every election, replication, and failure unit runs the Raft core (`Step(message) -> messages`, no goroutines, no sockets) inside a cluster simulator with a virtual clock and seeded faults (drop, delay, duplicate, partition, crash and restart). The early units (types, terms, timers) are plain functions.
- **Invariants** (checked after every step):
  - Election safety: at most one leader is elected in a given term.
  - Leader append-only: a leader never overwrites or deletes entries in its own log.
  - Log matching: if two logs hold an entry with the same index and term, the logs are identical up to that index.
  - Leader completeness: an entry committed in a term is present in the logs of leaders of all later terms.
  - State-machine safety: no two nodes apply different commands at the same index.
  - Bounded liveness: after the partition heals and a majority is up, a leader exists within a stated number of virtual ticks.
- **Seeds**: 1 to 64 per unit that injects faults; the capstone runs 64 seeds of 5 nodes with crash and partition schedules. A bug demonstration (committing an old-term entry by counting replicas, the figure 8 case) expects exit 1 on its named seed. At least 32 seeds per unit (the convention's floor). A violation prints `failing seed: <n> (<invariant>)`; the last line is `seeds: <passed> passed, <failed> failed (of <total>)`; `AYOKODING_SEED=<n>` replays one seed with a trace; `run.yaml` sets `simulation: true`. A demonstrated bug may expect exit 1 for its named seed, and the unit's `invariant` sentence says so.

## Size class and sequencing

- **Size class XL** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#size-class-rule): words to write 25,422 (class XL), units authored from scratch 87 (class XL), reading edits 0 (class S). Every unit counts as fresh because the course is in plan 09's baseline.
- **Agent packets**: authoring split by learning page and by blocks of at most 15 examples, units by `swe-developer` in blocks of 10 (test first), then one packet per remaining defect group.
- **CI weight**: about 12.9 CI shard-minutes per full run of this course (a planning figure; SP12 replaces it with a measurement).
- **Wave 10**, slot 1. Maker: `apps-ayokoding-www-by-example-maker` for authoring gaps; fixer: `tutorial-by-example-fixer` for gate findings; `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 result: Kept: `just-enough-go`, `distributed-systems`.
- In-plan prerequisites are audited first: `distributed-systems` (wave 8).
- Prerequisites outside this plan (unchanged here): `just-enough-go`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests.

## Per-course checklist

- [ ] CP-0 Readiness: in-plan prerequisites `distributed-systems` are DONE in the ledger; spikes SP6, SP10, SP12 are recorded as passed.
- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `build-your-own-raft` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder in report-only form (not a gate cycle); `COMPLETION-PROBE build-your-own-raft by-example` (RED; the failing scenarios go in the ledger); `FILLER` and the course's row in the printed metrics table; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (XL): the packets above. Classes: DC2, DC5, DC6, DC9, DC10, DC11, DC16. Author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file. Unit rule: first run plus at most 2 fix attempts, then a simpler replacement.
- [ ] Units: about 87 units authored; kata units in `drilling/code`; harness pre-check green for every unit before the gate starts.
- [ ] Illustration budget kept (see Harness mode and toolchain); no runnable block is marked as an illustration to pass sync (plan 05 M11).
- [ ] Simulation: every unit above follows S1 to S9; each prints the `seeds:` summary line; a deliberately broken variant fails on a named seed.
- [ ] CP-2b Filler baseline (plan 09): in this course's commit, remove `build-your-own-raft` from `FILLER_BASELINE` and lower `FILLER_BASELINE_CAP` by one; leave `REWRITTEN_FILLER_COURSES` alone (decision D12); `FILLER` exits 0 and the course's row shows no fired rule with no baseline help.
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `build-your-own-raft` exits 0 (at most 2 repair cycles).
- [ ] CP-6 Registry, guard, metadata, and closure: `FILLER` shows no fired rule for the course; `estimatedHours` recomputed from plan 03's drift test; `prerequisites` re-derived; the row `build-your-own-raft` (`by-example`) added to `AUDITED_COURSES` and `COMPLETION` green; plan 02's integrity tests (`PATH-TESTS`) green.
- [ ] CP-7 Ledger row complete in `local-tmp/ayokoding-learn/execution-ledger.md`; one commit `fix(ayokoding-www): rewrite build-your-own-raft course and leave the filler baseline` with only this course folder, its `_index.md`, and its `AUDITED_COURSES` row, plus the two baseline edits (the entry and the cap), and any other metadata file CP-6 changed (a prerequisite edge or the AI manifest).
- [ ] C11 Course-specific obligation: The course leaves the filler baseline in the commit that fixes it; the capstone passes 64 seeds; every safety invariant is checked after every step.

## Accuracy notes

- The invariants and rules follow the Raft paper (Ongaro and Ousterhout, 2014) and the dissertation; the lessons cite the figure and section for each rule; any named implementation (etcd/raft, HashiCorp raft) is checked with a date.
- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/build-your-own-raft/` (stable repository facts; Phase 0 and CP-1 re-measure). Scan hits for determinism and environment are approximate and are read, not trusted, in CP-1.
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; SP12 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them beyond the notes above.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–26 (26): from "node-roles-enum" to "go-test-reelection".
- **co-02 · intermediate** — examples 27–52 (26): from "log-entry-struct" to "no-op-on-election".
- **co-03 · advanced** — examples 53–78 (26): from "kv-state-machine" to "capstone-raft-kv".

## Lineage

- Follows Distributed Systems and the Go primer.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 104 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 102 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 87 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
