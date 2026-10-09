# Object-Oriented Design & Patterns

**Course ID**: `object-oriented-design-and-patterns` · **Format**: By Example · **Category**: computer-science.

**Scope note**: Audits and fixes the existing `object-oriented-design-and-patterns` course to the series definition of done (decision 27) and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. `object-oriented-programming-essentials` keeps classes and invariants; `software-architecture` keeps boundaries between services; this course keeps SOLID, patterns, composition, and cohesion measurements. It does not touch `content/id/**`, any path manifest (except an AI manifest co-update when a prerequisite change alters the AI core), or another course.

**Short summary**: Apply SOLID principles and design patterns to keep code easy to change.

## Why this exists · the big idea

- **The problem before the solution**: none of its 84 examples is run by any check (0 `run.yaml`); 181 fences and output blocks without an anchor; 75 of 84 code units below the annotation band (median 0.87).
- **Keep-this-if-you-forget-everything**: Good object design keeps change cheap; each example refactors a small Python program toward a SOLID shape or a named pattern.

## Prerequisites

- **Prior courses** (plan 02's revised list, kept plus added, as read on 2026-10-09): `object-oriented-programming-essentials`, `just-enough-python`.
- **Edges plan 02 removes**: `computer-architecture`.
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Each refactor is a before-and-after program a reader can run; 84 examples already follow By Example pace.
- **Wave**: 2 (slot 3); **size class**: M (words to write 0, units authored 0); **expected defect classes**: 6 of 15 variable classes, plus the two universal ones (DC2, DC15).

| Measure                                                                      | Today (2026-10-09, `bb7f90137`)                                                                                                                                  | Target                                                                                                                                                                                   | Work                                                                               |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded)                | 90,032                                                                                                                                                           | at least 28,000                                                                                                                                                                          | none (floor met)                                                                   |
| Examples                                                                     | 84 as `### Example N`                                                                                                                                            | at least 75, as `### Example N: Title`, numbered 1 to N without gaps                                                                                                                     | none                                                                               |
| Mermaid diagrams                                                             | 37                                                                                                                                                               | 30 to 50                                                                                                                                                                                 | none                                                                               |
| "Why It Matters" (50 to 100 words) and key takeaway                          | 121 and 84 (for 84 examples)                                                                                                                                     | one of each per example, each "Why It Matters" block 50 to 100 words                                                                                                                     | bring 30 of the 121 blocks found into 50 to 100 words (median 59; heuristic count) |
| Annotation density (comment lines per code line, measured on the code files) | median 0.87; 75 below 1.0; 0 above 2.25 (of 84 units)                                                                                                            | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 75 to fix                                                                          |
| Code fences and anchors                                                      | 397 non-diagram fences; 0 code fences unanchored                                                                                                                 | every code fence anchored or marked as an illustration                                                                                                                                   | none                                                                               |
| Lesson-to-file anchors (plan 05's method)                                    | 200 path anchors: 200 resolve to a file, of which 0 differ from it; 0 missing                                                                                    | every anchor matches its file                                                                                                                                                            | none                                                                               |
| Output blocks                                                                | 181 unanchored                                                                                                                                                   | every `**Output**` block anchored to an expected file                                                                                                                                    | 181 to anchor                                                                      |
| Harness units                                                                | 84 example folders, 12 kata folders in `drilling/code`, 202 code files, 0 `run.yaml`                                                                             | 84 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | convert the 84 existing folders (add `run.yaml` and expected files)                |
| Drilling page                                                                | 10,123 words; 5 of 5 exact `##` sections; headings: Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 0 words short                                                                      |
| Katas                                                                        | 12                                                                                                                                                               | at least 8 as `before`/`after` units in `drilling/code`                                                                                                                                  | none                                                                               |
| Accuracy-note files and verification tags                                    | files: 1; tags: 0                                                                                                                                                | none; the facts sit in References                                                                                                                                                        | convert to References                                                              |
| `## Examples by Level` in `learning/overview.md`                             | present                                                                                                                                                          | present, one bullet per example                                                                                                                                                          | none                                                                               |
| Frontmatter                                                                  | `format` by-example, `category` computer-science, `description` from plan 03; `estimatedHours` snapshot 14                                                       | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed by plan 03's drift test after the last edit                                                  | recompute                                                                          |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **DC2** The course has 0 `run.yaml` files: not opted in to plan 05's harness.
- **DC3** 0 code fences and 181 output blocks carry no anchor.
- **DC6** 30 of 121 "Why It Matters" blocks outside 50 to 100 words (median 59; heuristic count).
- **DC7** Annotation density (comment lines per code line, code files of 84 units): median 0.87, 75 units below 1.0, 0 above 2.25.
- **DC12** Scan hits (approximate, CP-1 reads each): wall-clock reads: 1, hash-order prints: 5.
- **DC13** Scan hits (approximate): database uses: 1, file-system uses: 1, Windows-only calls: 3, Linux-only calls: 1.
- **DC14** Leftover accuracy-note files: 1; verification tags: 0; both are converted into References.
- **DC15** Prerequisites and metadata: re-derived and re-checked in CP-6 (universal).

## Fixes and design

- Raise annotation in the 75 of 84 units below the density band (median 0.87) and convert the leftover accuracy-note file into References; the course is among the largest at 90,032 words, so the reading takes more than one pass.
- Anchor the 181 output blocks; the 200 code anchors already resolve.
- Confirm the 12 kata units sit in `drilling/code` and run.
- Bring 30 of the 121 "Why It Matters" blocks found (median 59 words) into the 50 to 100 word band by adding the example-specific consequence, not a template sentence (guard FG6). The count is a heuristic; the mode checker's reading is authoritative.
- Determinism and environment: Cohesion and coupling measurements are computed from source text or counts, never from timing. The one database-flavoured example uses `sqlite3` in memory.
- Anchors: after every edit run `EX-SYNC`; where a lesson fence and its file differ, read both and decide which is right before changing either (no quiet narrowing; no prose-only repair of a code fact).

## Harness mode and toolchain

- **Harness mode**: Real mode.
- **Toolchain ids**: `python` (ids that are already in plan 05's catalog use its pins as read on 2026-10-09; Phase 0 re-reads them).
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Course lock** (hash-locked, plan 05's lock recipe; no run installs anything): `pytest` (17 files).
- **Phase 1 spikes**: SP1 (hash-locked course locks resolve and install offline on the Python image), SP12 (timing and CI projection) (defined in [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-budget.md#phase-1-spikes)).
- **Illustration budget**: at most 3 fences.
- **CI cost** (planning figure, replaced by the SP12 measurement): about 2.5 s per container invocation × 2 executions × 103 runs (84 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 8.6 minutes.

## Size class and sequencing

- **Size class M** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#size-class-rule): words to write 0 (class S), units authored from scratch 0 (class S), reading edits 105 (class M).
- **Agent packets**: one packet per defect group (anchors and sync, annotation and density, drilling and katas).
- **CI weight**: about 8.6 CI shard-minutes per full run of this course (a planning figure; SP12 replaces it with a measurement).
- **Wave 2**, slot 3. Maker: `apps-ayokoding-www-by-example-maker` for authoring gaps; fixer: `tutorial-by-example-fixer` for gate findings; `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `software-architecture` (wave 3), `domain-driven-design` (wave 5), `capstone-solid-core` (wave 7).

## Prerequisite re-check

- Plan 02 result: Added: `object-oriented-programming-essentials`, `just-enough-python`; Removed: `computer-architecture`.
- In-plan prerequisites are audited first: `object-oriented-programming-essentials` (wave 1).
- Prerequisites outside this plan (unchanged here): `just-enough-python`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests.

## Per-course checklist

- [ ] CP-0 Readiness: in-plan prerequisites `object-oriented-programming-essentials` are DONE in the ledger; spikes SP1, SP12 are recorded as passed.
- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `object-oriented-design-and-patterns` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder in report-only form (not a gate cycle); `COMPLETION-PROBE object-oriented-design-and-patterns by-example` (RED; the failing scenarios go in the ledger); `FILLER` and the course's row in the printed metrics table; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (M): the packets above. Classes: DC2, DC3, DC6, DC7, DC12, DC13, DC14. Author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file. Unit rule: first run plus at most 2 fix attempts, then a simpler replacement.
- [ ] Units: all 84 existing example folders converted to units; kata units in `drilling/code`; harness pre-check green for every unit before the gate starts.
- [ ] Illustration budget kept (see Harness mode and toolchain); no runnable block is marked as an illustration to pass sync (plan 05 M11).
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `object-oriented-design-and-patterns` exits 0 (at most 2 repair cycles).
- [ ] CP-6 Registry, guard, metadata, and closure: `FILLER` shows no fired rule for the course; `estimatedHours` recomputed from plan 03's drift test; `prerequisites` re-derived; the row `object-oriented-design-and-patterns` (`by-example`) added to `AUDITED_COURSES` and `COMPLETION` green; plan 02's integrity tests (`PATH-TESTS`) green.
- [ ] CP-7 Ledger row complete in `local-tmp/ayokoding-learn/execution-ledger.md`; one commit `fix(ayokoding-www): audit object-oriented-design-and-patterns course` with only this course folder, its `_index.md`, and its `AUDITED_COURSES` row, and any other metadata file CP-6 changed (a prerequisite edge or the AI manifest).
- [ ] C11 Course-specific obligation: No example output contains an object address or a hash-order dependent line.

## Accuracy notes

- Pattern names and SOLID statements are checked against their primary sources in the content gate; no version-sensitive claim is known.
- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/object-oriented-design-and-patterns/` (stable repository facts; Phase 0 and CP-1 re-measure). Scan hits for determinism and environment are approximate and are read, not trusted, in CP-1.
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; SP12 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them beyond the notes above.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–27 (27): from "Split a God Class by Responsibility" to "Value Object: Immutable Money with Value Equality".
- **co-02 · intermediate** — examples 28–57 (30): from "An Abstract Factory for UI Widget Families" to "Measuring Cohesion Before and After an SRP Split".
- **co-03 · advanced** — examples 58–84 (27): from "Refactor Inheritance to Composition" to "Transition-Table FSM vs. Boolean-Flag Soup -- a Direct Contr".

## Lineage

- Follows OOP Essentials; prepares software architecture and domain-driven design.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 78 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 77 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 59 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
