# Modern System Programming

**Course ID**: `modern-system-programming` · **Format**: By Example · **Category**: systems-and-networking.

**Scope note**: Audits and fixes the existing `modern-system-programming` course to the series definition of done (decision 27) and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. `system-programming` is the C side; `linux-os` teaches the system interface; this course keeps ownership, borrowing, unsafe boundaries, and systems patterns in Rust. It does not touch `content/id/**`, any path manifest (except an AI manifest co-update when a prerequisite change alters the AI core), or another course.

**Short summary**: Write safe, fast systems code in Rust, side by side with the C course.

## Why this exists · the big idea

- **The problem before the solution**: none of its 78 examples is run by any check (0 `run.yaml`); 2,211 words against a floor of 28,000; 78 of 78 code units below the annotation band (median 0.17); a drilling page of 275 words; 0 of 8 katas.
- **Keep-this-if-you-forget-everything**: Rust gives C-level control with the compiler checking ownership; each example is a small program or a deliberate compile error with its diagnostic.

## Prerequisites

- **Prior courses** (plan 02's revised list, kept plus added, as read on 2026-10-09): `just-enough-rust`.
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Each idea is a program the compiler accepts next to one it rejects; the 78 example folders already exist as Rust sources, with lessons that are tables.
- **Wave**: 4 (slot 3); **size class**: XL (words to write 25,789, units authored 8); **expected defect classes**: 10 of 15 variable classes, plus the two universal ones (DC2, DC15).

| Measure                                                                      | Today (2026-10-09, `bb7f90137`)                                                                                                                                 | Target                                                                                                                                                                                   | Work                                                         |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Words (all pages, code blocks included, frontmatter excluded)                | 2,211                                                                                                                                                           | at least 28,000                                                                                                                                                                          | 25,789 to write                                              |
| Examples                                                                     | 0 example headings (the lessons are tables)                                                                                                                     | at least 75, as `### Example N: Title`, numbered 1 to N without gaps                                                                                                                     | write 78 examples around the existing folders (gap in Fixes) |
| Mermaid diagrams                                                             | 30                                                                                                                                                              | 30 to 50                                                                                                                                                                                 | none                                                         |
| "Why It Matters" (50 to 100 words) and key takeaway                          | 0 and 0 (for 0 examples)                                                                                                                                        | one of each per example, each "Why It Matters" block 50 to 100 words                                                                                                                     | none                                                         |
| Annotation density (comment lines per code line, measured on the code files) | median 0.17; 78 below 1.0; 0 above 2.25 (of 78 units)                                                                                                           | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 78 to fix                                                    |
| Code fences and anchors                                                      | 0 non-diagram fences; 0 code fences unanchored                                                                                                                  | every code fence anchored or marked as an illustration                                                                                                                                   | none                                                         |
| Lesson-to-file anchors (plan 05's method)                                    | 0 path anchors                                                                                                                                                  | every anchor matches its file                                                                                                                                                            | none                                                         |
| Output blocks                                                                | 0 unanchored                                                                                                                                                    | every `**Output**` block anchored to an expected file                                                                                                                                    | none                                                         |
| Harness units                                                                | 78 example folders, 0 kata folders in `drilling/code`, 92 code files, 0 `run.yaml`                                                                              | 78 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | author about 8; convert the 78 existing folders              |
| Drilling page                                                                | 275 words; 0 of 5 exact `##` sections; headings: 1. Recall Q&A, 2. Scenario judgment, 3. Safety-boundary trace, 4. Hands-on practice, 5. Automaticity checklist | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 4,725 words short; fix sections                              |
| Katas                                                                        | 0                                                                                                                                                               | at least 8 as `before`/`after` units in `drilling/code`                                                                                                                                  | 8 to write                                                   |
| Accuracy-note files and verification tags                                    | files: 0; tags: 2                                                                                                                                               | none; the facts sit in References                                                                                                                                                        | convert to References                                        |
| `## Examples by Level` in `learning/overview.md`                             | absent (CRITICAL)                                                                                                                                               | present, one bullet per example                                                                                                                                                          | add (regenerate with the index command)                      |
| Frontmatter                                                                  | `format` by-example, `category` systems-and-networking, `description` from plan 03; `estimatedHours` snapshot 2                                                 | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed by plan 03's drift test after the last edit                                                  | recompute                                                    |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **DC1** 78 example folders exist but the lessons have no example headings that point at them.
- **DC2** The course has 0 `run.yaml` files: not opted in to plan 05's harness.
- **DC5** No `### Example N: Title` headings; `learning/overview.md` has no `## Examples by Level` section (CRITICAL when absent).
- **DC7** Annotation density (comment lines per code line, code files of 78 units): median 0.17, 78 units below 1.0, 0 above 2.25.
- **DC8** 0 example headings; the floor is 75.
- **DC9** 2,211 words; the floor is 28,000 (25,789 short).
- **DC10** 0 of 5 exact `##` sections (found: 1. Recall Q&A, 2. Scenario judgment, 3. Safety-boundary trace, 4. Hands-on practice, 5. Automaticity checklist); 275 drilling words, 4,725 short.
- **DC11** 0 katas; the floor is 8 (8 to write).
- **DC12** Scan hits (approximate, CP-1 reads each): thread/goroutine/process uses: 18, asyncio uses: 1, subprocess uses: 1.
- **DC13** Scan hits (approximate): Linux-only calls: 12.
- **DC14** Leftover accuracy-note files: 0; verification tags: 2; both are converted into References.
- **DC15** Prerequisites and metadata: re-derived and re-checked in CP-6 (universal).

## Fixes and design

- Write the lessons: the 2,211 words are tables and diagrams with no example headings. Each of the 78 examples gets its five parts around the existing source (about 28,000 words in all).
- Add the missing drilling headings in their exact form (the page uses numbered headings), 8 katas, and drilling to 5,000 words.
- Check the 12 files in the capstone folder against a single capstone unit and the `Cargo.lock` files against the offline rule: no run downloads crates.
- Raise annotation in the 78 units outside the band (median 0.17): add `# =>` result lines and why-comments, never filler comments (guard FG6 reads repeated text). The scan measures the code files; the mode checker's reading of the lesson fences is authoritative.
- Determinism and environment: `rustc --color never` pins diagnostics to the catalog's Rust 1.99.0; `BTreeMap` replaces `HashMap` iteration; thread examples join and sort; no `Instant::now()` reaches output. Compile-error examples are `kind: check` runs with a non-zero expected exit and the diagnostic in the expected stderr.
- Anchors: after every edit run `EX-SYNC`; where a lesson fence and its file differ, read both and decide which is right before changing either (no quiet narrowing; no prose-only repair of a code fact).

## Harness mode and toolchain

- **Harness mode**: Real mode.
- **Toolchain ids**: `rust` (ids that are already in plan 05's catalog use its pins as read on 2026-10-09; Phase 0 re-reads them).
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP6 (output independent of CPU count), SP9 (offline Rust), SP12 (timing and CI projection) (defined in [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-budget.md#phase-1-spikes)).
- **Illustration budget**: at most 3 fences.
- **CI cost** (planning figure, replaced by the SP12 measurement): about 6.0 s per container invocation × 2 executions × 97 runs (78 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 19.4 minutes.

## Size class and sequencing

- **Size class XL** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-audit-method.md#size-class-rule): words to write 25,789 (class XL), units authored from scratch 8 (class S), reading edits 78 (class M).
- **Agent packets**: authoring split by learning page and by blocks of at most 15 examples, units by `swe-developer` in blocks of 10 (test first), then one packet per remaining defect group.
- **CI weight**: about 19.4 CI shard-minutes per full run of this course (a planning figure; SP12 replaces it with a measurement).
- **Wave 4**, slot 3. Maker: `apps-ayokoding-www-by-example-maker` for authoring gaps; fixer: `tutorial-by-example-fixer` for gate findings; `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 result: Kept: `just-enough-rust`.
- No prerequisite of this course is in this plan's 34; readiness (CP-0) has nothing to wait for.
- Prerequisites outside this plan (unchanged here): `just-enough-rust`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests.

## Per-course checklist

- [ ] CP-0 Readiness: no in-plan prerequisite; spikes SP6, SP9, SP12 are recorded as passed.
- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `modern-system-programming` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder in report-only form (not a gate cycle); `COMPLETION-PROBE modern-system-programming by-example` (RED; the failing scenarios go in the ledger); `FILLER` and the course's row in the printed metrics table; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (XL): the packets above. Classes: DC1, DC2, DC5, DC7, DC8, DC9, DC10, DC11, DC12, DC13, DC14. Author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file. Unit rule: first run plus at most 2 fix attempts, then a simpler replacement.
- [ ] Units: about 8 units authored and the 78 existing folders converted; kata units in `drilling/code`; harness pre-check green for every unit before the gate starts.
- [ ] Illustration budget kept (see Harness mode and toolchain); no runnable block is marked as an illustration to pass sync (plan 05 M11).
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `modern-system-programming` exits 0 (at most 2 repair cycles).
- [ ] CP-6 Registry, guard, metadata, and closure: `FILLER` shows no fired rule for the course; `estimatedHours` recomputed from plan 03's drift test; `prerequisites` re-derived; the row `modern-system-programming` (`by-example`) added to `AUDITED_COURSES` and `COMPLETION` green; plan 02's integrity tests (`PATH-TESTS`) green.
- [ ] CP-7 Ledger row complete in `local-tmp/ayokoding-learn/execution-ledger.md`; one commit `fix(ayokoding-www): audit modern-system-programming course` with only this course folder, its `_index.md`, and its `AUDITED_COURSES` row, and any other metadata file CP-6 changed (a prerequisite edge or the AI manifest).
- [ ] C11 Course-specific obligation: Every compile-failure example records the compiler's diagnostic and error code in an expected file read by the maker.

## Accuracy notes

- Rust 1.99.0 edition 2024 behaviour and diagnostic text are verified against the image; two verification tags in the pages are converted to References.
- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/modern-system-programming/` (stable repository facts; Phase 0 and CP-1 re-measure). Scan hits for determinism and environment are approximate and are read, not trusted, in CP-1.
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; SP12 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them beyond the notes above.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · learning/advanced.md** — 57 words today; the example list is rebuilt by the maker.
- **co-02 · learning/beginner.md** — 68 words today; the example list is rebuilt by the maker.
- **co-03 · learning/capstone/overview.md** — 108 words today; the example list is rebuilt by the maker.
- **co-04 · learning/intermediate.md** — 52 words today; the example list is rebuilt by the maker.
- **co-05 · learning/overview.md** — 1,483 words today; the example list is rebuilt by the maker.

## Lineage

- Pairs with System Programming; prepares systems work and performance courses.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 17 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 16 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 16 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
