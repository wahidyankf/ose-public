# Computer Science Foundations

**Course ID**: `computer-science-foundations` · **Format**: Annotated Concept · **Category**: computer-science.

**Scope note**: Audits and fixes the existing `computer-science-foundations` course to the series definition of done (decision 27) and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. `computer-architecture` keeps hardware; `data-structures-and-algorithms-essentials` keeps structures and cost; this course keeps number representation, logic, automata, and the limits of computation. It does not touch `content/id/**`, any path manifest (except an AI manifest co-update when a prerequisite change alters the AI core), or another course.

**Short summary**: Understand number representation, automata, and the limits of computation.

## Why this exists · the big idea

- **The problem before the solution**: none of its 55 examples is run by any check (0 `run.yaml`); 111 fences and output blocks without an anchor; a drilling page of 4,899 words; 0 of 5 katas.
- **Keep-this-if-you-forget-everything**: Everything a computer does is built from bits, rules, and limits; worked examples in Python show each idea on a small case.

## Prerequisites

- **Prior courses** (plan 02's revised list, kept plus added, as read on 2026-10-09): `just-enough-python`, `data-structures-and-algorithms-essentials`.
- **Edges plan 02 removes**: `technical-communication`.
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: Annotated Concept (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Half of the ideas (automata, proofs, limits) read better as annotated tables and diagrams than as programs, so Annotated Concept fits; 55 worked examples already exist.
- **Wave**: 2 (slot 2); **size class**: M (words to write 101, units authored 5); **expected defect classes**: 6 of 15 variable classes, plus the two universal ones (DC2, DC15).

| Measure                                                                      | Today (2026-10-09, `bb7f90137`)                                                                                   | Target                                                                                                                                                                                   | Work                                                                              |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded)                | 50,712                                                                                                            | at least 22,000                                                                                                                                                                          | none (floor met)                                                                  |
| Examples                                                                     | 55 as `### Example N`                                                                                             | at least 45, as `### Worked Example N: Title`, numbered 1 to N without gaps                                                                                                              | rename 55 headings to `### Worked Example N: Title`                               |
| Mermaid diagrams                                                             | 8                                                                                                                 | at least 10                                                                                                                                                                              | 2 to add                                                                          |
| "Why It Matters" (50 to 100 words) and key takeaway                          | 58 and 58 (for 55 examples)                                                                                       | one of each per example, each "Why It Matters" block 50 to 100 words                                                                                                                     | bring 45 of the 58 blocks found into 50 to 100 words (median 42; heuristic count) |
| Annotation density (comment lines per code line, measured on the code files) | median 1.11; 0 below 1.0; 0 above 2.25 (of 55 units)                                                              | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | none                                                                              |
| Code fences and anchors                                                      | 117 non-diagram fences; 58 code fences unanchored                                                                 | every code fence anchored or marked as an illustration                                                                                                                                   | 58 to anchor                                                                      |
| Lesson-to-file anchors (plan 05's method)                                    | 0 path anchors                                                                                                    | every anchor matches its file                                                                                                                                                            | none                                                                              |
| Output blocks                                                                | 53 unanchored                                                                                                     | every `**Output**` block anchored to an expected file                                                                                                                                    | 53 to anchor                                                                      |
| Harness units                                                                | 55 example folders, 0 kata folders in `drilling/code`, 58 code files, 0 `run.yaml`                                | at least 27 code-bearing worked examples as example units (plan 06's 60 percent rule, adopted by plan 11), 5 kata units, 1 capstone unit, each with a `run.yaml`                         | author about 5; convert the 55 existing folders                                   |
| Drilling page                                                                | 4,899 words; 4 of 5 exact `##` sections; headings: Recall Q&A, Applied problems, Code katas, Self-check checklist | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 101 words short; fix sections                                                     |
| Katas                                                                        | 0                                                                                                                 | at least 5 as `before`/`after` units in `drilling/code`                                                                                                                                  | 5 to write                                                                        |
| Accuracy-note files and verification tags                                    | files: 0; tags: 0                                                                                                 | none; the facts sit in References                                                                                                                                                        | none                                                                              |
| Frontmatter                                                                  | `format` annotated-concept, `category` computer-science, `description` from plan 03; `estimatedHours` snapshot 5  | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed by plan 03's drift test after the last edit                                                  | recompute                                                                         |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **DC2** The course has 0 `run.yaml` files: not opted in to plan 05's harness.
- **DC3** 58 code fences and 53 output blocks carry no anchor.
- **DC5** 55 headings use `### Example N`, but the Annotated Concept convention and plan 11's completion test need `### Worked Example N: Title`.
- **DC6** 45 of 58 "Why It Matters" blocks outside 50 to 100 words (median 42; heuristic count); 8 diagrams, 2 below the floor of 10.
- **DC10** 4 of 5 exact `##` sections (found: Recall Q&A, Applied problems, Code katas, Self-check checklist); 4,899 drilling words, 101 short.
- **DC11** 0 katas; the floor is 5 (5 to write).
- **DC12** Scan hits (approximate, CP-1 reads each): wall-clock reads: 4, hash-order prints: 6.
- **DC15** Prerequisites and metadata: re-derived and re-checked in CP-6 (universal).

## Fixes and design

- Write the 5 katas, one drilling section (elaborative interrogation) and 101 drilling words.
- Anchor the 58 unanchored code fences and 53 output blocks.
- Rename the 55 `### Example N` headings to `### Worked Example N: Title`; the Annotated Concept convention and plan 11's completion test (which this plan extends) need that form.
- Add 2 diagrams: 8 exist and plan 11's completion test needs 10 for an Annotated Concept course.
- Bring 45 of the 58 "Why It Matters" blocks found (median 42 words) into the 50 to 100 word band by adding the example-specific consequence, not a template sentence (guard FG6). The count is a heuristic; the mode checker's reading is authoritative.
- Determinism and environment: The hashing and avalanche examples use fixed inputs; the four wall-clock reads are removed; set printing is sorted. Turing-machine and automaton runs are step counts.
- Anchors: after every edit run `EX-SYNC`; where a lesson fence and its file differ, read both and decide which is right before changing either (no quiet narrowing; no prose-only repair of a code fact).

## Harness mode and toolchain

- **Harness mode**: Real mode.
- **Toolchain ids**: `python` (ids that are already in plan 05's catalog use its pins as read on 2026-10-09; Phase 0 re-reads them).
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP12 (timing and CI projection) (defined in [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-budget.md#phase-1-spikes)).
- **Illustration budget**: at most 3 fences.
- **CI cost** (planning figure, replaced by the SP12 measurement): about 2.5 s per container invocation × 2 executions × 68 runs (55 examples + 2 × 5 kata runs + 3 capstone runs) ≈ 5.7 minutes.

## Size class and sequencing

- **Size class M** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#size-class-rule): words to write 101 (class S), units authored from scratch 5 (class S), reading edits 45 (class M).
- **Agent packets**: one packet per defect group (anchors and sync, annotation and density, drilling and katas).
- **CI weight**: about 5.7 CI shard-minutes per full run of this course (a planning figure; SP12 replaces it with a measurement).
- **Wave 2**, slot 2. Maker: `apps-ayokoding-www-annotated-concept-maker` for authoring gaps; fixer: `tutorial-annotated-concept-fixer` for gate findings; `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `computer-architecture` (wave 4), `capstone-solid-core` (wave 7).

## Prerequisite re-check

- Plan 02 result: Added: `just-enough-python`, `data-structures-and-algorithms-essentials`; Removed: `technical-communication`.
- In-plan prerequisites are audited first: `data-structures-and-algorithms-essentials` (wave 1).
- Prerequisites outside this plan (unchanged here): `just-enough-python`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests.

## Per-course checklist

- [ ] CP-0 Readiness: in-plan prerequisites `data-structures-and-algorithms-essentials` are DONE in the ledger; spikes SP12 are recorded as passed.
- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `computer-science-foundations` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-annotated-concept-checker` over the course folder in report-only form (not a gate cycle); `COMPLETION-PROBE computer-science-foundations annotated-concept` (RED; the failing scenarios go in the ledger); `FILLER` and the course's row in the printed metrics table; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (M): the packets above. Classes: DC2, DC3, DC5, DC6, DC10, DC11, DC12. Author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file. Unit rule: first run plus at most 2 fix attempts, then a simpler replacement.
- [ ] Units: about 5 units authored and the 55 existing folders converted; kata units in `drilling/code`; harness pre-check green for every unit before the gate starts.
- [ ] Illustration budget kept (see Harness mode and toolchain); no runnable block is marked as an illustration to pass sync (plan 05 M11).
- [ ] CP-3 `tutorial-annotated-concept-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `computer-science-foundations` exits 0 (at most 2 repair cycles).
- [ ] CP-6 Registry, guard, metadata, and closure: `FILLER` shows no fired rule for the course; `estimatedHours` recomputed from plan 03's drift test; `prerequisites` re-derived; the row `computer-science-foundations` (`annotated-concept`) added to `AUDITED_COURSES` and `COMPLETION` green; plan 02's integrity tests (`PATH-TESTS`) green.
- [ ] CP-7 Ledger row complete in `local-tmp/ayokoding-learn/execution-ledger.md`; one commit `fix(ayokoding-www): audit computer-science-foundations course` with only this course folder, its `_index.md`, and its `AUDITED_COURSES` row, and any other metadata file CP-6 changed (a prerequisite edge or the AI manifest).
- [ ] C11 Course-specific obligation: Worked examples that are tables or diagrams carry no code unit; every code-bearing worked example has a unit.

## Accuracy notes

- Number-format facts (IEEE 754 binary64 behaviour, UTF-8 rules, SHA-256 test vectors) are re-checked in the mode gate.
- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/computer-science-foundations/` (stable repository facts; Phase 0 and CP-1 re-measure). Scan hits for determinism and environment are approximate and are read, not trusted, in CP-1.
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; SP12 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them beyond the notes above.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–18 (18): from "Decimal to Binary by Repeated Division" to "The Implication Truth Table -- p -> q".
- **co-02 · intermediate** — examples 19–40 (22): from "Modeling forall/exists with all()/any() over a Domain" to "Classifying Sample Languages into the Four Chomsky-Hierarchy".
- **co-03 · advanced** — examples 41–55 (15): from "A Turing Machine Incrementing a Binary Number on Its Tape" to "SHA-256 Avalanche -- Two Near-Identical Inputs, ~50% of Dige".

## Lineage

- Prepares computer architecture, advanced algorithms, and the programming paradigms.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 76 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 75 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 57 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
