# Software Architecture

**Course ID**: `software-architecture` · **Format**: Annotated Concept · **Category**: architecture-and-distributed-systems.

**Scope note**: Audits and fixes the existing `software-architecture` course to the series definition of done (decision 27) and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. `system-design` keeps estimation and building blocks; `domain-driven-design` and `event-driven-architecture` keep modelling and events; this course keeps dependencies, C4 views, trade-off records, and consistency choices. It does not touch `content/id/**`, any path manifest (except an AI manifest co-update when a prerequisite change alters the AI core), or another course.

**Short summary**: Decide where to draw boundaries in a system and what each one costs.

## Why this exists · the big idea

- **The problem before the solution**: none of its 52 examples is run by any check (0 `run.yaml`); 6,989 words against a floor of 22,000; a drilling page of 327 words; 0 of 5 katas.
- **Keep-this-if-you-forget-everything**: An architecture is the set of boundaries you decided to make expensive to cross; each worked example draws one boundary and prices it.

## Prerequisites

- **Prior courses** (plan 02's revised list, kept plus added, as read on 2026-10-09): `backend-essentials`, `object-oriented-design-and-patterns`.
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: Annotated Concept (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Most worked examples are diagrams, tables, and decision records with small Python checks, so Annotated Concept fits; 52 worked examples exist.
- **Wave**: 3 (slot 1); **size class**: L (words to write 15,011, units authored 16); **expected defect classes**: 9 of 15 variable classes, plus the two universal ones (DC2, DC15).

| Measure                                                                      | Today (2026-10-09, `bb7f90137`)                                                                                                                         | Target                                                                                                                                                                                   | Work                                                                              |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded)                | 6,989                                                                                                                                                   | at least 22,000                                                                                                                                                                          | 15,011 to write                                                                   |
| Examples                                                                     | 52 as `### Worked Example N`                                                                                                                            | at least 45, as `### Worked Example N: Title`, numbered 1 to N without gaps                                                                                                              | none                                                                              |
| Mermaid diagrams                                                             | 11                                                                                                                                                      | at least 10                                                                                                                                                                              | none                                                                              |
| "Why It Matters" (50 to 100 words) and key takeaway                          | 52 and 52 (for 52 examples)                                                                                                                             | one of each per example, each "Why It Matters" block 50 to 100 words                                                                                                                     | bring 52 of the 52 blocks found into 50 to 100 words (median 26; heuristic count) |
| Annotation density (comment lines per code line, measured on the code files) | median 1.0; 0 below 1.0; 0 above 2.25 (of 20 units)                                                                                                     | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | none                                                                              |
| Code fences and anchors                                                      | 35 non-diagram fences; 18 code fences unanchored                                                                                                        | every code fence anchored or marked as an illustration                                                                                                                                   | 18 to anchor                                                                      |
| Lesson-to-file anchors (plan 05's method)                                    | 2 path anchors: 2 resolve to a file, of which 2 differ from it; 0 missing                                                                               | every anchor matches its file                                                                                                                                                            | 2 to repair after reading each diff                                               |
| Output blocks                                                                | 0 unanchored                                                                                                                                            | every `**Output**` block anchored to an expected file                                                                                                                                    | none                                                                              |
| Harness units                                                                | 0 example folders, 20 flat files, 0 kata folders in `drilling/code`, 20 code files, 0 `run.yaml`                                                        | at least 27 code-bearing worked examples as example units (plan 06's 60 percent rule, adopted by plan 11), 5 kata units, 1 capstone unit, each with a `run.yaml`                         | author about 16; convert the 20 existing folders                                  |
| Drilling page                                                                | 327 words; 1 of 5 exact `##` sections; headings: Recall Q&A, Scenario judgment, Hands-on boundary exercise, Automaticity checklist, Extension challenge | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 4,673 words short; fix sections                                                   |
| Katas                                                                        | 0                                                                                                                                                       | at least 5 as `before`/`after` units in `drilling/code`                                                                                                                                  | 5 to write                                                                        |
| Accuracy-note files and verification tags                                    | files: 0; tags: 0                                                                                                                                       | none; the facts sit in References                                                                                                                                                        | none                                                                              |
| Frontmatter                                                                  | `format` annotated-concept, `category` architecture-and-distributed-systems, `description` from plan 03; `estimatedHours` snapshot 1                    | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed by plan 03's drift test after the last edit                                                  | recompute                                                                         |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **DC1** 20 example files are flat (`ex-nn-<slug>.py`), not unit folders.
- **DC2** The course has 0 `run.yaml` files: not opted in to plan 05's harness.
- **DC3** 18 code fences and 0 output blocks carry no anchor.
- **DC4** 2 of 2 anchors differ from their files; 0 point at no file.
- **DC6** 52 of 52 "Why It Matters" blocks outside 50 to 100 words (median 26; heuristic count).
- **DC9** 6,989 words; the floor is 22,000 (15,011 short).
- **DC10** 1 of 5 exact `##` sections (found: Recall Q&A, Scenario judgment, Hands-on boundary exercise, Automaticity checklist, Extension challenge); 327 drilling words, 4,673 short.
- **DC11** 0 katas; the floor is 5 (5 to write).
- **DC12** Scan hits (approximate, CP-1 reads each): environment/pid reads: 1, hash-order prints: 1.
- **DC13** Scan hits (approximate): database uses: 2.
- **DC15** Prerequisites and metadata: re-derived and re-checked in CP-6 (universal).

## Fixes and design

- The lessons are thin (6,989 words for 52 examples): write each worked example to about 290 words plus overviews, a capstone page, and the drilling page, to the 22,000-word floor.
- Turn the 20 flat `ex-NN-*.py` files into unit folders, anchor the 18 unanchored fences, and add units only for code-bearing worked examples.
- Write 5 katas and a drilling page of at least 5,000 words with the five exact sections.
- Add the missing key takeaway and Why It Matters blocks; add `=>` annotation and keep density in band for the code-bearing examples.
- Determinism and environment: Dependency-count and cycle-detection examples read a fixed module graph in the unit. No network or clock is used.
- Anchors: after every edit run `EX-SYNC`; where a lesson fence and its file differ, read both and decide which is right before changing either (no quiet narrowing; no prose-only repair of a code fact).

## Harness mode and toolchain

- **Harness mode**: Real mode.
- **Toolchain ids**: `python` (ids that are already in plan 05's catalog use its pins as read on 2026-10-09; Phase 0 re-reads them).
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP12 (timing and CI projection) (defined in [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-budget.md#phase-1-spikes)).
- **Illustration budget**: at most 3 fences.
- **CI cost** (planning figure, replaced by the SP12 measurement): about 2.5 s per container invocation × 2 executions × 65 runs (52 examples + 2 × 5 kata runs + 3 capstone runs) ≈ 5.4 minutes.

## Simulation convention

Plan 05's simulation convention (rules S1 to S9: single-threaded event loop, virtual clock, one seeded SplitMix64 generator, pure state machines, invariants after every step) applies to this course as follows (details in [tech-docs/003](../../tech-docs/003-harness-modes-simulation-and-determinism.md#simulation-convention)).

- **Units that use it**: The partition-behaviour and consistency examples (about 6 of 52) run a small replica model.
- **Invariants** (checked after every step):
  - A write acknowledged by the majority is visible to every later majority read (when the model claims strong consistency).
  - During a partition the minority side either refuses writes (CP) or accepts writes that the merge later reports as conflicts (AP); never both silently.
  - Replaying the same seed gives the same history.
- **Seeds**: 1 to 64 (the convention's floor is 32). At least 32 seeds per unit (the convention's floor). A violation prints `failing seed: <n> (<invariant>)`; the last line is `seeds: <passed> passed, <failed> failed (of <total>)`; `AYOKODING_SEED=<n>` replays one seed with a trace; `run.yaml` sets `simulation: true`. A demonstrated bug may expect exit 1 for its named seed, and the unit's `invariant` sentence says so.

## Size class and sequencing

- **Size class L** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#size-class-rule): words to write 15,011 (class L), units authored from scratch 16 (class M), reading edits 54 (class M).
- **Agent packets**: authoring split by learning page (one packet per page), then one packet per remaining defect group.
- **CI weight**: about 5.4 CI shard-minutes per full run of this course (a planning figure; SP12 replaces it with a measurement).
- **Wave 3**, slot 1. Maker: `apps-ayokoding-www-annotated-concept-maker` for authoring gaps; fixer: `tutorial-annotated-concept-fixer` for gate findings; `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `domain-driven-design` (wave 5), `event-driven-architecture` (wave 6).

## Prerequisite re-check

- Plan 02 result: Kept: `backend-essentials`, `object-oriented-design-and-patterns`.
- In-plan prerequisites are audited first: `object-oriented-design-and-patterns` (wave 2).
- Prerequisites outside this plan (unchanged here): `backend-essentials`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests.

## Per-course checklist

- [ ] CP-0 Readiness: in-plan prerequisites `object-oriented-design-and-patterns` are DONE in the ledger; spikes SP12 are recorded as passed.
- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `software-architecture` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-annotated-concept-checker` over the course folder in report-only form (not a gate cycle); `COMPLETION-PROBE software-architecture annotated-concept` (RED; the failing scenarios go in the ledger); `FILLER` and the course's row in the printed metrics table; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (L): the packets above. Classes: DC1, DC2, DC3, DC4, DC6, DC9, DC10, DC11, DC12, DC13. Author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file. Unit rule: first run plus at most 2 fix attempts, then a simpler replacement.
- [ ] Units: about 16 units authored and the 20 existing folders converted; kata units in `drilling/code`; harness pre-check green for every unit before the gate starts.
- [ ] Illustration budget kept (see Harness mode and toolchain); no runnable block is marked as an illustration to pass sync (plan 05 M11).
- [ ] Simulation: every unit above follows S1 to S9; each prints the `seeds:` summary line; a deliberately broken variant fails on a named seed.
- [ ] CP-3 `tutorial-annotated-concept-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `software-architecture` exits 0 (at most 2 repair cycles).
- [ ] CP-6 Registry, guard, metadata, and closure: `FILLER` shows no fired rule for the course; `estimatedHours` recomputed from plan 03's drift test; `prerequisites` re-derived; the row `software-architecture` (`annotated-concept`) added to `AUDITED_COURSES` and `COMPLETION` green; plan 02's integrity tests (`PATH-TESTS`) green.
- [ ] CP-7 Ledger row complete in `local-tmp/ayokoding-learn/execution-ledger.md`; one commit `fix(ayokoding-www): audit software-architecture course` with only this course folder, its `_index.md`, and its `AUDITED_COURSES` row, and any other metadata file CP-6 changed (a prerequisite edge or the AI manifest).
- [ ] C11 Course-specific obligation: Every diagram and table worked example states the decision and its cost; no worked example is a list of definitions.

## Accuracy notes

- C4 model terms and the PACELC / CAP statements are re-checked against their sources; the course names no version-specific tool.
- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/software-architecture/` (stable repository facts; Phase 0 and CP-1 re-measure). Scan hits for determinism and environment are approximate and are read, not trusted, in CP-1.
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; SP12 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them beyond the notes above.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–18 (18): from "Count outgoing and incoming dependencies" to "Draw a C4 context boundary".
- **co-02 · intermediate** — examples 19–38 (20): from "Draw a C4 container view" to "Choose behavior during a partition".
- **co-03 · advanced** — examples 39–52 (14): from "Add PACELC to the question" to "Re-architect a tangled service".

## Lineage

- Follows OO Design; prepares domain-driven design and event-driven architecture.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 97 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 95 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 80 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
