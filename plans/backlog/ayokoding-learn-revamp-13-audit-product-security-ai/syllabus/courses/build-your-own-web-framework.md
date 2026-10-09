# Build Your Own Web Framework (By Example)

**Course ID**: `build-your-own-web-framework` · **Format**: By Example · **Family**: application-development.

**Scope note**: Audits and fixes the existing `build-your-own-web-framework` course to the series definition of done and brings every example green in plan 05's code harness. The subject, slug, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course (except a capstone's `relies-on` row, CP-7).

**Short summary**: A small web framework core built from the standard library: WSGI and ASGI entry points, routing, middleware, dependency injection, and error handling.

## Why this exists · the big idea

- **The problem before the solution**: 80 examples are announced in 6,652 words: the lessons hold no code fences, no anchors, no "Why It Matters" blocks, and no diagrams, while the 86 code files sit unreferenced.
- **Keep-this-if-you-forget-everything**: A web framework is a function from a request to a response plus rules for composing functions; every example shows one rule with the request and response printed.

## Prerequisites

- **Prior courses**: `backend-essentials`, `networking-essentials` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example. **Reason**: By Example, as plan 03 records it: 80 numbered examples in three level pages, backed by 85 Python files.
  A maker may not switch modes except where the reason above says so; a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user.
- **Mode-convention fit**: today the course fits the convention: `overview.md` plus beginner, intermediate, and advanced pages. Example headings per page today: `learning/advanced.md` (24), `learning/beginner.md` (28), `learning/intermediate.md` (28).
- **Wave**: 13 (slot 1); **size class**: XL (words to write 21,348, new unit folders 8); **expected defect classes**: 7 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                           | Target                                                                                                                                                               | Work                            |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 6,652                                                                                                                                                                                     | at least 28,000                                                                                                                                                      | 21,348 to write                 |
| Examples as `### Example N: Title`                            | 80                                                                                                                                                                                        | at least 75, numbered 1 to N without gaps                                                                                                                            | none                            |
| Mermaid diagrams                                              | 0                                                                                                                                                                                         | 30 to 50 (adapter band)                                                                                                                                              | 30 to add                       |
| "Why It Matters" (50 to 100 words each)                       | none of 80 examples has one                                                                                                                                                               | one per example, 50 to 100 words                                                                                                                                     | 80 to write                     |
| Annotation density (comment lines per code line)              | not measurable: no code-bearing examples of the mode's form today                                                                                                                         | 1.0 to 2.25 on every code-bearing example                                                                                                                            | all new                         |
| Code fences                                                   | 0 code fences in the lessons; 0 unanchored                                                                                                                                                | every code fence anchored or marked as an illustration (budget: 6 at most; server launch lines)                                                                      | 0 to anchor                     |
| Lesson-to-file anchors (plan 05's method)                     | 0 path anchors (match 0, mismatch 0, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                                                      | every anchor matches its file                                                                                                                                        | 0 to repair                     |
| Output blocks                                                 | 0 output fences; 0 unanchored                                                                                                                                                             | every `**Output**` block anchored to an expected file                                                                                                                | 0 to anchor                     |
| Harness units                                                 | 80 example folders, 0 kata folders, 86 code files, 0 `run.yaml`                                                                                                                           | 80 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                              | create 8, convert 81            |
| Drilling page                                                 | 387 words; 1 of 5 standard `##` sections exact; 3 `<details>` blocks; headings found: Recall Q&A, Scenario Judgment, Hands-on Implementation, Automaticity Checklist, Extension challenge | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) | 4,613 words short; fix sections |
| Katas                                                         | 0 kata folders                                                                                                                                                                            | at least 8 as `before`/`after` units                                                                                                                                 | 8                               |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                    | unchanged, except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                           | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X1** 86 code files (80 example folders, 0 kata folders, 1 test-like files); none has a `run.yaml`.
- **X5** The three level pages have 28, 28, and 24 headings but 0 code fences, 0 anchors, 0 "Why It Matters" blocks, and 0 output blocks; the overview is 96 words.
- **X7** No "Why It Matters" or key-takeaway block exists for any of the 80 examples.
- **X11** Drilling: 387 words (4,613 short of 5,000); 1 of 5 exact `##` sections; 0 kata folders against 8.
- **X13** 6,652 words against a floor of 28,000; 21,348 to write.
- **X15** 3 files touch network keywords (one opens a socket); in-process request objects replace them.
- **X20** 0 Mermaid diagrams against the band of 30 to 50.

## Fixes and design

- Author the lessons around the existing 80 programs: for each example write the explanation, the anchored program, the recorded output, the takeaway, and a "Why It Matters" block of 50 to 100 words.
- Convert the 80 example folders to units and run them under `python`; no socket is opened.
- Write the overview and learning overview (96 and 516 words today), the drilling page (387 words today) with 8 kata units, and the diagram set (0 today).
- Authoring is split by level page and in blocks of at most 15 examples (size class XL).

## Harness mode and toolchain

- **Harness mode**: Real mode: `python`, standard library only; WSGI and ASGI shapes run through in-process callables.
- **Toolchain ids**: python.
- **Toolchain additions** (budget-gated, default NO-GO; [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-cost.md)): none.
- **Phase 1 spikes**: SP9 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: at most 6 (server launch lines).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 2.0 s per container invocation × 2 executions × 99 runs (80 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 6.6 minutes.

## Size class and sequencing

- **Size class XL** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 21,348 (the larger of the word gap and the drilling shortfall), new unit folders 8.
- **Estimated effort** (size, not time): class XL; agent packets: authoring split by learning page and again by blocks of at most 15 examples, then one packet per remaining defect group; the course folder is committed only when every unit exists.
- **Wave 13**, slot 1. Makers and fixers for this course: `apps-ayokoding-www-by-example-maker` for authoring gaps, `tutorial-by-example-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 keeps the current list (the list above is the result).
- In-plan prerequisites are audited first: `backend-essentials` in wave 1.
- Prerequisites outside this plan (unchanged here): `networking-essentials`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-path-and-capstone-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `build-your-own-web-framework` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder; `AUDIT_PROBE=build-your-own-web-framework:by-example` with `UNIT-NODE tests/unit/be-steps/audited-course-completion.steps.ts` to record the scenarios the course fails; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (XL): authoring split by learning page and again by blocks of at most 15 examples, then one packet per remaining defect group; the course folder is committed only when every unit exists. Classes: X1, X5, X7, X11, X13, X15, X20.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `build-your-own-web-framework`; a course that fires is fixed, never baselined.
- [ ] Units: 80 example units, 8 kata units, 1 capstone unit (create 8, convert 81); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 6 (server launch lines).
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `build-your-own-web-framework` exits 0 (at most 2 repair cycles); `EX-COVERAGE` shows `covered: true` for `build-your-own-web-framework`.
- [ ] CP-6 The registry row for `build-your-own-web-framework` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit build-your-own-web-framework course` with explicit paths only: the course folder with its `_index.md`, the registry row.
- [ ] CP-7 Capstone relies-on: `rtk git grep -n "build-your-own-web-framework" -- 'apps/ayokoding-www/content/en/learn/courses/capstone-*/learning/overview.md'` shows no capstone row for this course today; if the search finds one at execution time, handle it as in the other courses and note it in the ledger.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/build-your-own-web-framework/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–28 (28): from "Hello WSGI" to "Framework As Function".
- **co-02 · intermediate** — examples 29–56 (28): from "Hello ASGI" to "Query Parse ASGI".
- **co-03 · advanced** — examples 57–80 (24): from "DI Registry" to "Mini Framework".

## Lineage

- Builds on: `backend-essentials`, `networking-essentials`. Required by (in this plan): none.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 59 of 121 in the manifest as specified by plan 02 (read 2026-10-09), phase `backend-depth`, role `extension`; this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 46 of 114 in the manifest as specified by plan 02 (read 2026-10-09), phase `backend-depth`, role `extension`; this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 47 of 116 in the manifest as specified by plan 02 (read 2026-10-09), phase `backend-depth`, role `extension`; this plan changes no path membership or order.
