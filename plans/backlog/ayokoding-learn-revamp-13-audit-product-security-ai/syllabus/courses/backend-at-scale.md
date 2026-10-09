# Backend at Scale (By Example)

**Course ID**: `backend-at-scale` · **Format**: By Example · **Family**: application-development.

**Scope note**: Audits and fixes the existing `backend-at-scale` course to the series definition of done and brings every example green in plan 05's code harness. The subject, slug, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course (except a capstone's `relies-on` row, CP-7).

**Short summary**: Keeping a backend correct under load, retries, and partial failure: caching, queues, idempotency, rate limits, observability, auth flows, and API styles compared.

## Why this exists · the big idea

- **The problem before the solution**: All 80 "Why It Matters" blocks are under 50 words (median 13), 80 of 80 examples are under the annotation floor (median 0.81), and drilling uses five nonstandard headings.
- **Keep-this-if-you-forget-everything**: Scale problems are failure problems; each example here fails on purpose, on a fixed schedule, and shows the repair.

## Prerequisites

- **Prior courses**: `backend-essentials`, `sql-essentials`, `security-essentials`, `software-testing` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example. **Reason**: By Example, as plan 03 records it: 80 numbered examples, each a standard-library Python program.
  A maker may not switch modes except where the reason above says so; a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user.
- **Mode-convention fit**: today the course fits the convention: `overview.md` plus beginner, intermediate, and advanced pages. Example headings per page today: `learning/advanced.md` (24), `learning/beginner.md` (28), `learning/intermediate.md` (28).
- **Wave**: 3 (slot 2); **size class**: S (words to write 567, new unit folders 2); **expected defect classes**: 11 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                         | Target                                                                                                                                                               | Work                          |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 47,278                                                                                                                                                                                  | at least 28,000                                                                                                                                                      | none                          |
| Examples as `### Example N: Title`                            | 80                                                                                                                                                                                      | at least 75, numbered 1 to N without gaps                                                                                                                            | none                          |
| Mermaid diagrams                                              | 2                                                                                                                                                                                       | 30 to 50 (adapter band)                                                                                                                                              | 28 to add                     |
| "Why It Matters" (50 to 100 words each)                       | 80 of 80 present; 80 under 50 words; 0 over 100; median 13 words                                                                                                                        | one per example, 50 to 100 words                                                                                                                                     | 80 to write or fix            |
| Annotation density (comment lines per code line)              | median 0.81; 80 examples below 1.0; 0 above 2.25 (of 80 code-bearing)                                                                                                                   | 1.0 to 2.25 on every code-bearing example                                                                                                                            | 80 to fix                     |
| Code fences                                                   | 80 code fences in the lessons; 0 unanchored                                                                                                                                             | every code fence anchored or marked as an illustration (budget: 6 at most; Redis, broker, and load-test launch lines)                                                | 0 to anchor                   |
| Lesson-to-file anchors (plan 05's method)                     | 80 path anchors (match 75, mismatch 5, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                                                  | every anchor matches its file                                                                                                                                        | 5 to repair                   |
| Output blocks                                                 | 84 output fences; 84 unanchored                                                                                                                                                         | every `**Output**` block anchored to an expected file                                                                                                                | 84 to anchor                  |
| Harness units                                                 | 80 example folders, 6 kata folders, 98 code files, 0 `run.yaml`                                                                                                                         | 80 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                              | create 2, convert 87          |
| Drilling page                                                 | 4,433 words; 0 of 5 standard `##` sections exact; 53 `<details>` blocks; headings found: Drills Overview, Drill List, Difficulty Progression, Evaluation Criteria, Capstone Integration | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) | 567 words short; fix sections |
| Katas                                                         | 6 kata folders                                                                                                                                                                          | at least 8 as `before`/`after` units                                                                                                                                 | 2                             |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                  | unchanged, except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                           | recompute                     |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X1** 98 code files (80 example folders, 6 kata folders, 0 test-like files); none has a `run.yaml`.
- **X3** 5 anchors mismatch their files and 0 point at missing files.
- **X4** 84 of 84 `**Output**` blocks are not labelled anchors to expected files.
- **X8** 80 "Why It Matters" blocks present: 80 under 50 words, 0 over 100, median 13 words.
- **X9** Annotation density: median 0.81; 80 examples below 1.0 and 0 above 2.25 (of 80 code-bearing).
- **X11** Drilling: 4,433 words (567 short of 5,000); 0 of 5 exact `##` sections; 6 kata folders against 8.
- **X14** 96 of 98 code files open with the same directive line `pyright: strict` that the harness never runs.
- **X15** 2 files use timers, 2 draw random numbers, and 1 reaches a socket; queues, caches, and retries must use a virtual clock and a seeded generator.
- **X17** Redis, a message queue, and an OAuth provider are named in the lessons; the units must use in-memory fakes and say so.
- **X18** The course names Python 3.13 2 times; the catalog pin is 3.14.8, so the text and recorded output are aligned to the pin.
- **X20** 2 Mermaid diagrams against the band of 30 to 50.

## Fixes and design

- Run all 80 programs under `python`; replace any real clock, socket, or random call by a virtual clock, an in-memory fake, and a seeded generator (rules DR1 to DR3 in tech-docs/003).
- Rewrite the 80 "Why It Matters" blocks to 50 to 100 words from each example's own failure and output (the filler guard FG6 reads repeated paragraphs).
- Raise 80 examples to the density floor, add diagrams to the band (2 today), write drilling under the five exact headings, and create 2 missing kata units (6 exist).
- Apply the same SP9 decision as `api-design` for the type-check directive.

## Harness mode and toolchain

- **Harness mode**: Real mode: `python`, standard library only; in-memory fakes for queues and caches.
- **Toolchain ids**: python.
- **Toolchain additions** (budget-gated, default NO-GO; [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-cost.md)): none.
- **Phase 1 spikes**: SP9 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: at most 6 (Redis, broker, and load-test launch lines).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 2.0 s per container invocation × 2 executions × 99 runs (80 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 6.6 minutes.

## Size class and sequencing

- **Size class S** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 567 (the larger of the word gap and the drilling shortfall), new unit folders 2.
- **Estimated effort** (size, not time): class S; agent packets: one packet per defect group (mechanical fixes, then prose fixes); no page split.
- **Wave 3**, slot 2. Makers and fixers for this course: `apps-ayokoding-www-by-example-maker` for authoring gaps, `tutorial-by-example-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `inference-serving-and-model-deployment`, `it-and-application-security` (each is audited in a later wave, so this course is final first).

## Prerequisite re-check

- Plan 02 keeps the current list (the list above is the result).
- In-plan prerequisites are audited first: `backend-essentials` in wave 1, `security-essentials` in wave 2.
- Prerequisites outside this plan (unchanged here): `sql-essentials`, `software-testing`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-path-and-capstone-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `backend-at-scale` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder; `AUDIT_PROBE=backend-at-scale:by-example` with `UNIT-NODE tests/unit/be-steps/audited-course-completion.steps.ts` to record the scenarios the course fails; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (S): one packet per defect group (mechanical fixes, then prose fixes); no page split. Classes: X1, X3, X4, X8, X9, X11, X14, X15, X17, X18, X20.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `backend-at-scale`; a course that fires is fixed, never baselined.
- [ ] Units: 80 example units, 8 kata units, 1 capstone unit (create 2, convert 87); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 6 (Redis, broker, and load-test launch lines).
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `backend-at-scale` exits 0 (at most 2 repair cycles); `EX-COVERAGE` shows `covered: true` for `backend-at-scale`.
- [ ] CP-6 The registry row for `backend-at-scale` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit backend-at-scale course` with explicit paths only: the course folder with its `_index.md`, the registry row.
- [ ] CP-7 Capstone relies-on: `rtk git grep -n "backend-at-scale" -- 'apps/ayokoding-www/content/en/learn/courses/capstone-*/learning/overview.md'` lists `capstone-data-pipeline`, `capstone-real-world-delivery`, `capstone-secure-service`; read each `## What this course relies on` row for this course and confirm the audited course still teaches the named concepts at definition level; edit the row and the capstone paragraph that restates it in the same commit if not. The content-shape test (CL1, CL4) must stay green.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/backend-at-scale/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–28 (28): from "REST CRUD Endpoints -- One Resource, Four Verbs" to "Correlation ID -- Thread One Id Through Every Log Line".
- **co-02 · intermediate** — examples 29–56 (28): from "OAuth 2.0 Authorization Code Flow" to "REST vs GraphQL vs gRPC -- the Same Operation Three Ways".
- **co-03 · advanced** — examples 57–80 (24): from "Queue -- Produce a Job, Consume It Once" to "Scale-Ready Service -- the Assembled End-to-End Service".

## Lineage

- Builds on: `backend-essentials`, `sql-essentials`, `security-essentials`, `software-testing`. Required by (in this plan): `inference-serving-and-model-deployment`, `it-and-application-security`.
- Listed as a prerequisite by plan 08's capstones: `capstone-data-pipeline`, `capstone-real-world-delivery`, `capstone-secure-service` (read from plan 08's briefs on 2026-10-09).

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 60 of 121 in the manifest as specified by plan 02 (read 2026-10-09), phase `backend-depth`, role `extension`; this plan changes no path membership or order.
- `careers/immediately-effective/ai-engineer` — position 18 of 28 in the manifest as specified by plan 08 (read 2026-10-09), phase `shipping-and-operating`, role `extension`; this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 47 of 114 in the manifest as specified by plan 02 (read 2026-10-09), phase `backend-depth`, role `extension`; this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 49 of 116 in the manifest as specified by plan 02 (read 2026-10-09), phase `backend-depth`, role `extension`; this plan changes no path membership or order.
- `careers/immediately-effective/ai-engineer` — a prerequisite change here also changes that manifest, its `assumes`, and its tests in the same PR (plan 02's rule R6, plan 08's duty).
