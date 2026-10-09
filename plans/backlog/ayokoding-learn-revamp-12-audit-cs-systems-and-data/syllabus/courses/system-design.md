# System Design

**Course ID**: `system-design` · **Format**: Annotated Concept · **Category**: architecture-and-distributed-systems.

**Scope note**: Audits and fixes the existing `system-design` course to the series definition of done (decision 27) and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. `software-architecture` keeps boundaries; `advanced-networking` keeps the network layer; `distributed-systems` keeps protocols. This course keeps requirements, capacity estimation, caching, sharding, queues, and design walkthroughs. It does not touch `content/id/**`, any path manifest (except an AI manifest co-update when a prerequisite change alters the AI core), or another course.

**Short summary**: Estimate load, find bottlenecks, and choose building blocks for a system.

## Why this exists · the big idea

- **The problem before the solution**: none of its 53 examples is run by any check (0 `run.yaml`); 6,175 words against a floor of 22,000; a drilling page of 418 words; 0 of 5 katas.
- **Keep-this-if-you-forget-everything**: A system design is arithmetic plus trade-offs; each worked example estimates a load, finds the bottleneck, and picks a building block with its cost.

## Prerequisites

- **Prior courses** (plan 02's revised list, kept plus added, as read on 2026-10-09): `backend-at-scale`, `advanced-networking`, `advanced-sql-and-query-performance`.
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: Annotated Concept (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Most worked examples are estimates, tables, and diagrams with small Python models; 53 worked examples exist (floor 45).
- **Wave**: 11 (slot 1); **size class**: L (words to write 15,825, units authored 10); **expected defect classes**: 6 of 15 variable classes, plus the two universal ones (DC2, DC15).

| Measure                                                                      | Today (2026-10-09, `bb7f90137`)                                                                                                               | Target                                                                                                                                                                                   | Work                                                                              |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded)                | 6,175                                                                                                                                         | at least 22,000                                                                                                                                                                          | 15,825 to write                                                                   |
| Examples                                                                     | 53 as `### Worked Example N`                                                                                                                  | at least 45, as `### Worked Example N: Title`, numbered 1 to N without gaps                                                                                                              | none                                                                              |
| Mermaid diagrams                                                             | 5                                                                                                                                             | at least 10                                                                                                                                                                              | 5 to add                                                                          |
| "Why It Matters" (50 to 100 words) and key takeaway                          | 53 and 53 (for 53 examples)                                                                                                                   | one of each per example, each "Why It Matters" block 50 to 100 words                                                                                                                     | bring 53 of the 53 blocks found into 50 to 100 words (median 27; heuristic count) |
| Annotation density (comment lines per code line, measured on the code files) | median 1.27; 0 below 1.0; 0 above 2.25 (of 25 units)                                                                                          | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | none                                                                              |
| Code fences and anchors                                                      | 0 non-diagram fences; 0 code fences unanchored                                                                                                | every code fence anchored or marked as an illustration                                                                                                                                   | none                                                                              |
| Lesson-to-file anchors (plan 05's method)                                    | 0 path anchors                                                                                                                                | every anchor matches its file                                                                                                                                                            | none                                                                              |
| Output blocks                                                                | 0 unanchored                                                                                                                                  | every `**Output**` block anchored to an expected file                                                                                                                                    | none                                                                              |
| Harness units                                                                | 0 example folders, 25 flat files, 0 kata folders in `drilling/code`, 27 code files, 0 `run.yaml`                                              | at least 27 code-bearing worked examples as example units (plan 06's 60 percent rule, adopted by plan 11), 5 kata units, 1 capstone unit, each with a `run.yaml`                         | author about 10; convert the 25 existing folders                                  |
| Drilling page                                                                | 418 words; 1 of 5 exact `##` sections; headings: Recall Q&A, Calculation practice, Scenario judgment, Design exercise, Automaticity checklist | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 4,582 words short; fix sections                                                   |
| Katas                                                                        | 0                                                                                                                                             | at least 5 as `before`/`after` units in `drilling/code`                                                                                                                                  | 5 to write                                                                        |
| Accuracy-note files and verification tags                                    | files: 0; tags: 0                                                                                                                             | none; the facts sit in References                                                                                                                                                        | none                                                                              |
| Frontmatter                                                                  | `format` annotated-concept, `category` architecture-and-distributed-systems, `description` from plan 03; `estimatedHours` snapshot 1          | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed by plan 03's drift test after the last edit                                                  | recompute                                                                         |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **DC1** 25 example files are flat (`ex-nn-<slug>.py`), not unit folders.
- **DC2** The course has 0 `run.yaml` files: not opted in to plan 05's harness.
- **DC6** 53 of 53 "Why It Matters" blocks outside 50 to 100 words (median 27; heuristic count); 5 diagrams, 5 below the floor of 10.
- **DC9** 6,175 words; the floor is 22,000 (15,825 short).
- **DC10** 1 of 5 exact `##` sections (found: Recall Q&A, Calculation practice, Scenario judgment, Design exercise, Automaticity checklist); 418 drilling words, 4,582 short.
- **DC11** 0 katas; the floor is 5 (5 to write).
- **DC12** Scan hits (approximate, CP-1 reads each): unseeded random uses: 1, hash-order prints: 4.
- **DC15** Prerequisites and metadata: re-derived and re-checked in CP-6 (universal).

## Fixes and design

- The lessons are thin (6,175 words for 53 examples): write each worked example to about 290 words plus overviews, a capstone page, and the drilling page, to 22,000 words.
- Turn the 25 flat files into unit folders; add units only for code-bearing worked examples; write 5 katas and 4,582 drilling words with the five exact sections; add 5 diagrams (5 exist, 10 needed).
- Determinism and environment: Estimation examples print arithmetic, with units, from fixed inputs. Latency numbers come from a stated table (with source and date), never from a measurement.
- Anchors: after every edit run `EX-SYNC`; where a lesson fence and its file differ, read both and decide which is right before changing either (no quiet narrowing; no prose-only repair of a code fact).

## Harness mode and toolchain

- **Harness mode**: Real mode with deterministic load models.
- **Toolchain ids**: `python` (ids that are already in plan 05's catalog use its pins as read on 2026-10-09; Phase 0 re-reads them).
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP12 (timing and CI projection) (defined in [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-budget.md#phase-1-spikes)).
- **Illustration budget**: at most 3 fences.
- **CI cost** (planning figure, replaced by the SP12 measurement): about 2.5 s per container invocation × 2 executions × 66 runs (53 examples + 2 × 5 kata runs + 3 capstone runs) ≈ 5.5 minutes.

## Simulation convention

Plan 05's simulation convention (rules S1 to S9: single-threaded event loop, virtual clock, one seeded SplitMix64 generator, pure state machines, invariants after every step) applies to this course as follows (details in [tech-docs/003](../../tech-docs/003-harness-modes-simulation-and-determinism.md#simulation-convention)).

- **Units that use it**: Load-balancing policies, cache hit ratios, token buckets, consistent hashing, and queue back-pressure (about 12 of 53) run models driven by a seeded load generator and a virtual clock.
- **Invariants** (checked after every step):
  - A token bucket never admits more than its burst plus rate times elapsed virtual time.
  - Adding a node to a consistent-hash ring moves at most about K/N keys (within the stated bound) and never moves keys between two old nodes.
  - A queue is stable (length bounded) when arrival rate is below service rate and grows without bound otherwise, over the run.
  - A cache's hit ratio is between 0 and 1 and equals hits over requests.
- **Seeds**: 1 to 64. At least 32 seeds per unit (the convention's floor). A violation prints `failing seed: <n> (<invariant>)`; the last line is `seeds: <passed> passed, <failed> failed (of <total>)`; `AYOKODING_SEED=<n>` replays one seed with a trace; `run.yaml` sets `simulation: true`. A demonstrated bug may expect exit 1 for its named seed, and the unit's `invariant` sentence says so.

## Size class and sequencing

- **Size class L** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#size-class-rule): words to write 15,825 (class L), units authored from scratch 10 (class M), reading edits 53 (class M).
- **Agent packets**: authoring split by learning page (one packet per page), then one packet per remaining defect group.
- **CI weight**: about 5.5 CI shard-minutes per full run of this course (a planning figure; SP12 replaces it with a measurement).
- **Wave 11**, slot 1. Maker: `apps-ayokoding-www-annotated-concept-maker` for authoring gaps; fixer: `tutorial-annotated-concept-fixer` for gate findings; `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 result: Kept: `backend-at-scale`, `advanced-networking`, `advanced-sql-and-query-performance`.
- In-plan prerequisites are audited first: `advanced-networking` (wave 10), `advanced-sql-and-query-performance` (wave 2).
- Prerequisites outside this plan (unchanged here): `backend-at-scale`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests.

## Per-course checklist

- [ ] CP-0 Readiness: in-plan prerequisites `advanced-networking`, `advanced-sql-and-query-performance` are DONE in the ledger; spikes SP12 are recorded as passed.
- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `system-design` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-annotated-concept-checker` over the course folder in report-only form (not a gate cycle); `COMPLETION-PROBE system-design annotated-concept` (RED; the failing scenarios go in the ledger); `FILLER` and the course's row in the printed metrics table; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (L): the packets above. Classes: DC1, DC2, DC6, DC9, DC10, DC11, DC12. Author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file. Unit rule: first run plus at most 2 fix attempts, then a simpler replacement.
- [ ] Units: about 10 units authored and the 25 existing folders converted; kata units in `drilling/code`; harness pre-check green for every unit before the gate starts.
- [ ] Illustration budget kept (see Harness mode and toolchain); no runnable block is marked as an illustration to pass sync (plan 05 M11).
- [ ] Simulation: every unit above follows S1 to S9; each prints the `seeds:` summary line; a deliberately broken variant fails on a named seed.
- [ ] CP-3 `tutorial-annotated-concept-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `system-design` exits 0 (at most 2 repair cycles).
- [ ] CP-6 Registry, guard, metadata, and closure: `FILLER` shows no fired rule for the course; `estimatedHours` recomputed from plan 03's drift test; `prerequisites` re-derived; the row `system-design` (`annotated-concept`) added to `AUDITED_COURSES` and `COMPLETION` green; plan 02's integrity tests (`PATH-TESTS`) green.
- [ ] CP-7 Ledger row complete in `local-tmp/ayokoding-learn/execution-ledger.md`; one commit `fix(ayokoding-www): audit system-design course` with only this course folder, its `_index.md`, and its `AUDITED_COURSES` row, and any other metadata file CP-6 changed (a prerequisite edge or the AI manifest).
- [ ] C11 Course-specific obligation: Every constructed figure is labelled constructed, and every real figure has a source and date.

## Accuracy notes

- Reference latency and throughput figures (the 'numbers every programmer should know' table) are cited with a source and year; capacity examples are labelled as constructed.
- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/system-design/` (stable repository facts; Phase 0 and CP-1 re-measure). Scan hits for determinism and environment are approximate and are read, not trusted, in CP-1.
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; SP12 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them beyond the notes above.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–18 (18): from "Separate requirements" to "Pick read-your-writes".
- **co-02 · intermediate** — examples 19–38 (20): from "Rotate requests with round robin" to "Trace an edge-cache hit".
- **co-03 · advanced** — examples 39–53 (15): from "Design a URL shortener" to "Split by federation".

## Lineage

- Follows Advanced Networking, Advanced SQL, and Backend at Scale.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 100 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 98 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 83 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
