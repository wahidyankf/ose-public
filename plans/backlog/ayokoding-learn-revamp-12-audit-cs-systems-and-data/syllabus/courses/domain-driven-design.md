# Domain-Driven Design

**Course ID**: `domain-driven-design` · **Format**: By Example · **Category**: architecture-and-distributed-systems.

**Scope note**: Audits and fixes the existing `domain-driven-design` course to the series definition of done (decision 27) and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. `software-architecture` keeps boundaries and trade-offs; `event-driven-architecture` keeps events; `object-oriented-design-and-patterns` keeps patterns. This course keeps ubiquitous language, aggregates, entities, value objects, domain events, repositories, and context mapping. It does not touch `content/id/**`, any path manifest (except an AI manifest co-update when a prerequisite change alters the AI core), or another course.

**Short summary**: Model business rules in code with bounded contexts and aggregates.

## Why this exists · the big idea

- **The problem before the solution**: none of its 80 examples is run by any check (0 `run.yaml`); 4,477 words against a floor of 28,000; none of 80 examples has a "Why It Matters" block; a drilling page of 282 words; 0 of 8 katas.
- **Keep-this-if-you-forget-everything**: Put the business rules in code that speaks the business's language; each example models one rule with an aggregate, a value object, or a bounded-context boundary.

## Prerequisites

- **Prior courses** (plan 02's revised list, kept plus added, as read on 2026-10-09): `object-oriented-design-and-patterns`, `software-architecture`.
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Each concept is a rule enforced by a class a reader can run and violate; 80 examples exist (they use `Worked Example` headings, which By Example does not use).
- **Wave**: 5 (slot 1); **size class**: L (words to write 23,523, units authored 8); **expected defect classes**: 7 of 15 variable classes, plus the two universal ones (DC2, DC15).

| Measure                                                                      | Today (2026-10-09, `bb7f90137`)                                                                                                                                                                                                     | Target                                                                                                                                                                                   | Work                                            |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded)                | 4,477                                                                                                                                                                                                                               | at least 28,000                                                                                                                                                                          | 23,523 to write                                 |
| Examples                                                                     | 80 as `### Worked Example N`                                                                                                                                                                                                        | at least 75, as `### Example N: Title`, numbered 1 to N without gaps                                                                                                                     | rename 80 headings to `### Example N: Title`    |
| Mermaid diagrams                                                             | 1                                                                                                                                                                                                                                   | 30 to 50                                                                                                                                                                                 | 29 to add                                       |
| "Why It Matters" (50 to 100 words) and key takeaway                          | 0 and 80 (for 80 examples)                                                                                                                                                                                                          | one of each per example, each "Why It Matters" block 50 to 100 words                                                                                                                     | write 80 "Why It Matters" blocks                |
| Annotation density (comment lines per code line, measured on the code files) | median 1.0; 0 below 1.0; 0 above 2.25 (of 80 units)                                                                                                                                                                                 | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | none                                            |
| Code fences and anchors                                                      | 0 non-diagram fences; 0 code fences unanchored                                                                                                                                                                                      | every code fence anchored or marked as an illustration                                                                                                                                   | none                                            |
| Lesson-to-file anchors (plan 05's method)                                    | 0 path anchors                                                                                                                                                                                                                      | every anchor matches its file                                                                                                                                                            | none                                            |
| Output blocks                                                                | 0 unanchored                                                                                                                                                                                                                        | every `**Output**` block anchored to an expected file                                                                                                                                    | none                                            |
| Harness units                                                                | 80 example folders, 0 kata folders in `drilling/code`, 86 code files, 0 `run.yaml`                                                                                                                                                  | 80 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | author about 8; convert the 80 existing folders |
| Drilling page                                                                | 282 words; 0 of 5 exact `##` sections; headings: 1. Recall: name the boundary, 2. Judgment: choose the smallest aggregate, 3. Code: protect a value, 4. Transfer: translate at a context edge, 5. Self-check: explain the trade-off | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 4,718 words short; fix sections                 |
| Katas                                                                        | 0                                                                                                                                                                                                                                   | at least 8 as `before`/`after` units in `drilling/code`                                                                                                                                  | 8 to write                                      |
| Accuracy-note files and verification tags                                    | files: 0; tags: 0                                                                                                                                                                                                                   | none; the facts sit in References                                                                                                                                                        | none                                            |
| `## Examples by Level` in `learning/overview.md`                             | present                                                                                                                                                                                                                             | present, one bullet per example                                                                                                                                                          | none                                            |
| Frontmatter                                                                  | `format` by-example, `category` architecture-and-distributed-systems, `description` from plan 03; `estimatedHours` snapshot 3                                                                                                       | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed by plan 03's drift test after the last edit                                                  | recompute                                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **DC2** The course has 0 `run.yaml` files: not opted in to plan 05's harness.
- **DC5** Headings are 80 × `### Worked Example N` instead of `### Example N: Title`.
- **DC6** 0 "Why It Matters" blocks for 80 examples; 1 diagrams, 29 below the floor of 30.
- **DC9** 4,477 words; the floor is 28,000 (23,523 short).
- **DC10** 0 of 5 exact `##` sections (found: 1. Recall: name the boundary, 2. Judgment: choose the smallest aggregate, 3. Code: protect a value, 4. Transfer: translate at a context edge, 5. Self-check: explain the trade-off); 282 drilling words, 4,718 short.
- **DC11** 0 katas; the floor is 8 (8 to write).
- **DC12** Scan hits (approximate, CP-1 reads each): wall-clock reads: 1, hash-order prints: 2.
- **DC13** Scan hits (approximate): database uses: 1.
- **DC15** Prerequisites and metadata: re-derived and re-checked in CP-6 (universal).

## Fixes and design

- Write the lessons: 4,477 words for 80 examples need about 28,000; the 86 code files exist but no lesson shows them (no code fences), so each example gets its explanation, diagram, anchored code, takeaway, and Why It Matters.
- Rename the 80 `### Worked Example` headings to `### Example N: Title` and add a `## Examples by Level` section (the overview has one); add about 30 diagrams (1 exists), and write the 80 Why It Matters blocks (none exist; 80 key takeaways exist).
- Replace the nonstandard drilling headings with the five exact sections; add 8 katas and about 4,700 drilling words.
- Determinism and environment: No clock, database, or network: repositories are in-memory; times are fixed values passed in.
- Anchors: after every edit run `EX-SYNC`; where a lesson fence and its file differ, read both and decide which is right before changing either (no quiet narrowing; no prose-only repair of a code fact).

## Harness mode and toolchain

- **Harness mode**: Real mode.
- **Toolchain ids**: `python` (ids that are already in plan 05's catalog use its pins as read on 2026-10-09; Phase 0 re-reads them).
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP12 (timing and CI projection) (defined in [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-budget.md#phase-1-spikes)).
- **Illustration budget**: at most 3 fences.
- **CI cost** (planning figure, replaced by the SP12 measurement): about 2.5 s per container invocation × 2 executions × 99 runs (80 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 8.2 minutes.

## Size class and sequencing

- **Size class L** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#size-class-rule): words to write 23,523 (class L), units authored from scratch 8 (class S), reading edits 0 (class S).
- **Agent packets**: authoring split by learning page (one packet per page), then one packet per remaining defect group.
- **CI weight**: about 8.2 CI shard-minutes per full run of this course (a planning figure; SP12 replaces it with a measurement).
- **Wave 5**, slot 1. Maker: `apps-ayokoding-www-by-example-maker` for authoring gaps; fixer: `tutorial-by-example-fixer` for gate findings; `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 result: Kept: `object-oriented-design-and-patterns`, `software-architecture`.
- In-plan prerequisites are audited first: `object-oriented-design-and-patterns` (wave 2), `software-architecture` (wave 3).
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests.

## Per-course checklist

- [ ] CP-0 Readiness: in-plan prerequisites `object-oriented-design-and-patterns`, `software-architecture` are DONE in the ledger; spikes SP12 are recorded as passed.
- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `domain-driven-design` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder in report-only form (not a gate cycle); `COMPLETION-PROBE domain-driven-design by-example` (RED; the failing scenarios go in the ledger); `FILLER` and the course's row in the printed metrics table; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (L): the packets above. Classes: DC2, DC5, DC6, DC9, DC10, DC11, DC12, DC13. Author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file. Unit rule: first run plus at most 2 fix attempts, then a simpler replacement.
- [ ] Units: about 8 units authored and the 80 existing folders converted; kata units in `drilling/code`; harness pre-check green for every unit before the gate starts.
- [ ] Illustration budget kept (see Harness mode and toolchain); no runnable block is marked as an illustration to pass sync (plan 05 M11).
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `domain-driven-design` exits 0 (at most 2 repair cycles).
- [ ] CP-6 Registry, guard, metadata, and closure: `FILLER` shows no fired rule for the course; `estimatedHours` recomputed from plan 03's drift test; `prerequisites` re-derived; the row `domain-driven-design` (`by-example`) added to `AUDITED_COURSES` and `COMPLETION` green; plan 02's integrity tests (`PATH-TESTS`) green.
- [ ] CP-7 Ledger row complete in `local-tmp/ayokoding-learn/execution-ledger.md`; one commit `fix(ayokoding-www): audit domain-driven-design course` with only this course folder, its `_index.md`, and its `AUDITED_COURSES` row, and any other metadata file CP-6 changed (a prerequisite edge or the AI manifest).
- [ ] C11 Course-specific obligation: Each aggregate example has a run that shows the invariant held and a run (or kata `before`) that shows it broken.

## Accuracy notes

- Terms follow Evans (2003) and Vernon (2013); any claim about frameworks or tools is cited with a date.
- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/domain-driven-design/` (stable repository facts; Phase 0 and CP-1 re-measure). Scan hits for determinism and environment are approximate and are read, not trusted, in CP-1.
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; SP12 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them beyond the notes above.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–28 (28): from "Ubiquitous language rename" to "Specification selection".
- **co-02 · intermediate** — examples 29–56 (28): from "Aggregate boundary" to "Specification in repository".
- **co-03 · advanced** — examples 57–80 (24): from "Define bounded contexts" to "Full DDD model".

## Lineage

- Follows OO Design and Software Architecture.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 99 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 97 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 82 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
