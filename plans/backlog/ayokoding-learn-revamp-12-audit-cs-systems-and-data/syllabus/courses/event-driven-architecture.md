# Event-Driven Architecture

**Course ID**: `event-driven-architecture` · **Format**: By Example · **Category**: architecture-and-distributed-systems.

**Scope note**: Audits and fixes the existing `event-driven-architecture` course to the series definition of done (decision 27) and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. `distributed-systems` keeps protocols; `software-architecture` keeps boundaries; this course keeps events, brokers, consumer groups, event sourcing, outbox, sagas, and schema evolution. It does not touch `content/id/**`, any path manifest (except an AI manifest co-update when a prerequisite change alters the AI core), or another course.

**Short summary**: Connect services with durable events instead of fragile synchronous calls.

## Why this exists · the big idea

- **The problem before the solution**: none of its 80 examples is run by any check (0 `run.yaml`); 11,289 words against a floor of 28,000; 84 fences and output blocks without an anchor; a drilling page of 925 words; 0 of 8 katas.
- **Keep-this-if-you-forget-everything**: Events are facts that already happened; each example sends events through an in-process broker and shows what delivery guarantees do and do not give.

## Prerequisites

- **Prior courses** (plan 02's revised list, kept plus added, as read on 2026-10-09): `software-architecture`, `backend-essentials`.
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Each pattern is a small broker plus a consumer a reader can run and crash; 80 examples already follow By Example pace.
- **Wave**: 6 (slot 1); **size class**: XL (words to write 16,711, units authored 88); **expected defect classes**: 8 of 15 variable classes, plus the two universal ones (DC2, DC15).

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                               | Target                                                                                                                                                                                   | Work                                                                              |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 11,289                                                                                                                                                        | at least 28,000                                                                                                                                                                          | 16,711 to write                                                                   |
| Examples                                                      | 80 as `### Example N`                                                                                                                                         | at least 75, as `### Example N: Title`, numbered 1 to N without gaps                                                                                                                     | none                                                                              |
| Mermaid diagrams                                              | 1                                                                                                                                                             | 30 to 50                                                                                                                                                                                 | 29 to add                                                                         |
| "Why It Matters" (50 to 100 words) and key takeaway           | 84 and 84 (for 80 examples)                                                                                                                                   | one of each per example, each "Why It Matters" block 50 to 100 words                                                                                                                     | bring 84 of the 84 blocks found into 50 to 100 words (median 33; heuristic count) |
| Code fences and anchors                                       | 86 non-diagram fences; 84 code fences unanchored                                                                                                              | every code fence anchored or marked as an illustration                                                                                                                                   | 84 to anchor                                                                      |
| Lesson-to-file anchors (plan 05's method)                     | 0 path anchors                                                                                                                                                | every anchor matches its file                                                                                                                                                            | none                                                                              |
| Output blocks                                                 | 0 unanchored                                                                                                                                                  | every `**Output**` block anchored to an expected file                                                                                                                                    | none                                                                              |
| Harness units                                                 | 0 example folders, 0 kata folders in `drilling/code`, 6 code files, 0 `run.yaml`                                                                              | 80 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | author about 88                                                                   |
| Drilling page                                                 | 925 words; 5 of 5 exact `##` sections; headings: Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 4,075 words short                                                                 |
| Katas                                                         | 0                                                                                                                                                             | at least 8 as `before`/`after` units in `drilling/code`                                                                                                                                  | 8 to write                                                                        |
| Accuracy-note files and verification tags                     | files: 1; tags: 0                                                                                                                                             | none; the facts sit in References                                                                                                                                                        | convert to References                                                             |
| `## Examples by Level` in `learning/overview.md`              | present                                                                                                                                                       | present, one bullet per example                                                                                                                                                          | none                                                                              |
| Frontmatter                                                   | `format` by-example, `category` architecture-and-distributed-systems, `description` from plan 03; `estimatedHours` snapshot 1                                 | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed by plan 03's drift test after the last edit                                                  | recompute                                                                         |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **DC1** Only 6 code files for 80 examples; the code is inside lesson fences.
- **DC2** The course has 0 `run.yaml` files: not opted in to plan 05's harness.
- **DC3** 84 code fences and 0 output blocks carry no anchor.
- **DC6** 84 of 84 "Why It Matters" blocks outside 50 to 100 words (median 33; heuristic count); 1 diagrams, 29 below the floor of 30.
- **DC9** 11,289 words; the floor is 28,000 (16,711 short).
- **DC10** 925 drilling words, 4,075 short.
- **DC11** 0 katas; the floor is 8 (8 to write).
- **DC12** Scan hits (approximate, CP-1 reads each): hash-order prints: 2.
- **DC14** Leftover accuracy-note files: 1; verification tags: 0; both are converted into References.
- **DC15** Prerequisites and metadata: re-derived and re-checked in CP-6 (universal).

## Fixes and design

- Extract 80 units from the fences (or write them), with `run.yaml` and expected output; the lessons gain the missing parts (11,289 words, 28,000 needed, 1 diagram, 30 needed).
- Replace the drilling heading `Elaborative interrogation and self-explanation` with the exact `&` form and fix the others; write 8 katas and 4,075 drilling words.
- Convert the leftover accuracy-note file into References.
- Determinism and environment: Only 6 code files exist; the 84 Python fences in the lessons are the code, so every example needs a unit extracted from its fence and then anchored. Backoff uses the virtual clock; no real sleep.
- Anchors: after every edit run `EX-SYNC`; where a lesson fence and its file differ, read both and decide which is right before changing either (no quiet narrowing; no prose-only repair of a code fact).

## Harness mode and toolchain

- **Harness mode**: Real mode with the simulation convention.
- **Toolchain ids**: `python` (ids that are already in plan 05's catalog use its pins as read on 2026-10-09; Phase 0 re-reads them).
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP12 (timing and CI projection) (defined in [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-budget.md#phase-1-spikes)).
- **Illustration budget**: at most 3 fences.
- **CI cost** (planning figure, replaced by the SP12 measurement): about 2.6 s per container invocation × 2 executions × 99 runs (80 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 8.6 minutes.

## Simulation convention

Plan 05's simulation convention (rules S1 to S9: single-threaded event loop, virtual clock, one seeded SplitMix64 generator, pure state machines, invariants after every step) applies to this course as follows (details in [tech-docs/003](../../tech-docs/003-harness-modes-simulation-and-determinism.md#simulation-convention)).

- **Units that use it**: About 50 of the 80 units (delivery semantics, partitions and consumer groups, outbox, saga, retry and dead-letter, replay) run a broker model with a virtual clock and seeded delivery faults (drop, duplicate, reorder, consumer crash before and after acknowledgement).
- **Invariants** (checked after every step):
  - At-least-once delivery loses no event; at-most-once duplicates none; an idempotent consumer's final state equals the exactly-once result.
  - Within a partition key, events are consumed in publish order; each partition has one active consumer in a group; offsets never move backwards.
  - Outbox: every committed event is published at least once and no event is published without its commit.
  - Saga: after all compensations the conserved quantity (for example total balance) equals its starting value.
  - A message exceeding its retry budget lands in the dead-letter queue exactly once.
- **Seeds**: 1 to 64. At least 32 seeds per unit (the convention's floor). A violation prints `failing seed: <n> (<invariant>)`; the last line is `seeds: <passed> passed, <failed> failed (of <total>)`; `AYOKODING_SEED=<n>` replays one seed with a trace; `run.yaml` sets `simulation: true`. A demonstrated bug may expect exit 1 for its named seed, and the unit's `invariant` sentence says so.

## Size class and sequencing

- **Size class XL** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#size-class-rule): words to write 16,711 (class L), units authored from scratch 88 (class XL), reading edits 84 (class M).
- **Agent packets**: authoring split by learning page and by blocks of at most 15 examples, units by `swe-developer` in blocks of 10 (test first), then one packet per remaining defect group.
- **CI weight**: about 8.6 CI shard-minutes per full run of this course (a planning figure; SP12 replaces it with a measurement).
- **Wave 6**, slot 1. Maker: `apps-ayokoding-www-by-example-maker` for authoring gaps; fixer: `tutorial-by-example-fixer` for gate findings; `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 result: Kept: `software-architecture`, `backend-essentials`.
- In-plan prerequisites are audited first: `software-architecture` (wave 3).
- Prerequisites outside this plan (unchanged here): `backend-essentials`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests.

## Per-course checklist

- [ ] CP-0 Readiness: in-plan prerequisites `software-architecture` are DONE in the ledger; spikes SP12 are recorded as passed.
- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `event-driven-architecture` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder in report-only form (not a gate cycle); `COMPLETION-PROBE event-driven-architecture by-example` (RED; the failing scenarios go in the ledger); `FILLER` and the course's row in the printed metrics table; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (XL): the packets above. Classes: DC1, DC2, DC3, DC6, DC9, DC10, DC11, DC12, DC14. Author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file. Unit rule: first run plus at most 2 fix attempts, then a simpler replacement.
- [ ] Units: about 88 units authored; kata units in `drilling/code`; harness pre-check green for every unit before the gate starts.
- [ ] Illustration budget kept (see Harness mode and toolchain); no runnable block is marked as an illustration to pass sync (plan 05 M11).
- [ ] Simulation: every unit above follows S1 to S9; each prints the `seeds:` summary line; a deliberately broken variant fails on a named seed.
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `event-driven-architecture` exits 0 (at most 2 repair cycles).
- [ ] CP-6 Registry, guard, metadata, and closure: `FILLER` shows no fired rule for the course; `estimatedHours` recomputed from plan 03's drift test; `prerequisites` re-derived; the row `event-driven-architecture` (`by-example`) added to `AUDITED_COURSES` and `COMPLETION` green; plan 02's integrity tests (`PATH-TESTS`) green.
- [ ] CP-7 Ledger row complete in `local-tmp/ayokoding-learn/execution-ledger.md`; one commit `fix(ayokoding-www): audit event-driven-architecture course` with only this course folder, its `_index.md`, and its `AUDITED_COURSES` row, and any other metadata file CP-6 changed (a prerequisite edge or the AI manifest).
- [ ] C11 Course-specific obligation: Every delivery-guarantee claim is shown by a seeded run that prints the loss and duplicate counts, not by a statement.

## Accuracy notes

- Kafka, CloudEvents, and AsyncAPI statements are cited with versions and dates; the lessons say that the broker here is a model.
- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/event-driven-architecture/` (stable repository facts; Phase 0 and CP-1 re-measure). Scan hits for determinism and environment are approximate and are read, not trusted, in CP-1.
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; SP12 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them beyond the notes above.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–28 (28): from "Event as Fact" to "Poison Retry Limit".
- **co-02 · intermediate** — examples 29–56 (28): from "Event Store Append" to "Ack and Nack".
- **co-03 · advanced** — examples 57–80 (24): from "Dual-Write Problem" to "EDA Slice".

## Lineage

- Follows Software Architecture.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 101 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 99 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 84 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
