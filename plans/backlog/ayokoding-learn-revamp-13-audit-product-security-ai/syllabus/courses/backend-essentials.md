# Backend Essentials (By Example)

**Course ID**: `backend-essentials` · **Format**: By Example · **Family**: application-development.

**Scope note**: Audits and fixes the existing `backend-essentials` course to the series definition of done and brings every example green in plan 05's code harness. The subject, slug, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course (except a capstone's `relies-on` row, CP-7).

**Short summary**: An HTTP backend that stores data and serves many clients: servers, routing, validation, persistence, auth, testing, and a second worker.

## Why this exists · the big idea

- **The problem before the solution**: The largest course in the plan (87,306 words, 177 code files) was authored against a live server and real sockets: 104 `Output` blocks are not anchored to files, 19 fences are unanchored, and 53 labelled anchors point to files that are missing.
- **Keep-this-if-you-forget-everything**: A backend is a loop that turns requests into stored facts; each example runs the loop in process so the facts can be checked.

## Prerequisites

- **Prior courses**: `sql-essentials`, `just-enough-python` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example. **Reason**: By Example, as plan 03 records it: 80 numbered examples in three level pages, each a Python program with a test.
  A maker may not switch modes except where the reason above says so; a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user.
- **Mode-convention fit**: today the course fits the convention: `overview.md` plus beginner, intermediate, and advanced pages. Example headings per page today: `learning/advanced.md` (24), `learning/beginner.md` (28), `learning/intermediate.md` (28).
- **Wave**: 1 (slot 1); **size class**: S (words to write 0, new unit folders 0); **expected defect classes**: 8 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                          | Target                                                                                                                                                               | Work                   |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 87,306                                                                                                                                                   | at least 28,000                                                                                                                                                      | none                   |
| Examples as `### Example N: Title`                            | 80                                                                                                                                                       | at least 75, numbered 1 to N without gaps                                                                                                                            | none                   |
| Mermaid diagrams                                              | 40                                                                                                                                                       | 30 to 50 (adapter band)                                                                                                                                              | none                   |
| "Why It Matters" (50 to 100 words each)                       | 80 of 80 present; 5 under 50 words; 0 over 100; median 62 words                                                                                          | one per example, 50 to 100 words                                                                                                                                     | 5 to write or fix      |
| Annotation density (comment lines per code line)              | median 1.08; 0 examples below 1.0; 0 above 2.25 (of 80 code-bearing)                                                                                     | 1.0 to 2.25 on every code-bearing example                                                                                                                            | 0 to fix               |
| Code fences                                                   | 178 code fences in the lessons; 19 unanchored                                                                                                            | every code fence anchored or marked as an illustration (budget: 10 at most; `curl`, `uvicorn`, and multi-process launch lines)                                       | 19 to anchor           |
| Lesson-to-file anchors (plan 05's method)                     | 106 path anchors (match 106, mismatch 0, missing 0); 53 labelled anchors (match 0, mismatch 0, missing 53)                                               | every anchor matches its file                                                                                                                                        | 53 to repair           |
| Output blocks                                                 | 157 output fences; 104 unanchored                                                                                                                        | every `**Output**` block anchored to an expected file                                                                                                                | 104 to anchor          |
| Harness units                                                 | 80 example folders, 19 kata folders, 177 code files, 0 `run.yaml`                                                                                        | 80 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                              | create 0, convert 89   |
| Drilling page                                                 | 10,674 words; 4 of 5 standard `##` sections exact; 60 `<details>` blocks; headings found: Recall Q&A, Applied problems, Code katas, Self-check checklist | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) | words ok; fix sections |
| Katas                                                         | 19 kata folders                                                                                                                                          | at least 8 as `before`/`after` units                                                                                                                                 | 0                      |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                   | unchanged, except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                           | recompute              |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X1** 177 code files (80 example folders, 19 kata folders, 53 test-like files); none has a `run.yaml`.
- **X3** 19 of 178 code fences are neither anchored nor marked as illustrations; 0 anchors mismatch their files and 53 point at missing files.
- **X4** 104 of 157 `**Output**` blocks are not labelled anchors to expected files.
- **X8** 80 "Why It Matters" blocks present: 5 under 50 words, 0 over 100, median 62 words.
- **X11** Drilling: 10,674 words; 4 of 5 exact `##` sections.
- **X15** 126 files use network keywords (`TestClient` in 55, `uvicorn` in 53, `http.server` in 8 that bind real sockets); 4 draw random numbers, 2 use timers.
- **X16** Third-party packages: fastapi, pydantic, starlette, flask, uvicorn, pytest; no hash-locked requirements file exists.
- **X18** The course names Python 3.13 2 times; the catalog pin is 3.14.8, so the text and recorded output are aligned to the pin.

## Fixes and design

- Lock the stack once (spike SP4) and run every example in process; the 8 `http.server` programs become WSGI-style calls without a socket.
- Anchor the 104 unanchored output blocks to recorded `expected/` files, repair the 53 labelled anchors that point to missing files, and anchor or mark the 19 unanchored fences.
- Add the missing drilling section and trim the rest to the five exact headings; keep the 19 existing kata units and add none beyond the 8 required.
- Run examples that use SQL against `sqlite3` from the standard library; no PostgreSQL service is needed (the keyword scan found `sqlite3` in 40 files and no `psycopg`).

## Harness mode and toolchain

- **Harness mode**: Real mode: `python` with a hash-locked FastAPI/Flask stack; in-process calls; SQLite.
- **Toolchain ids**: python (fastapi, flask, pydantic, starlette, pytest from a hash-locked lockfile).
- **Toolchain additions** (budget-gated, default NO-GO; [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-cost.md)): none.
- **Phase 1 spikes**: SP4, SP9 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: at most 10 (`curl`, `uvicorn`, and multi-process launch lines).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 3.0 s per container invocation × 2 executions × 99 runs (80 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 9.9 minutes.

## Size class and sequencing

- **Size class S** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 0 (the larger of the word gap and the drilling shortfall), new unit folders 0.
- **Estimated effort** (size, not time): class S; agent packets: one packet per defect group (mechanical fixes, then prose fixes); no page split.
- **Wave 1**, slot 1. Makers and fixers for this course: `apps-ayokoding-www-by-example-maker` for authoring gaps, `tutorial-by-example-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `api-design`, `async-python-and-fastapi-services`, `backend-at-scale`, `build-your-own-web-framework`, `capstone-first-working-software`, `capstone-full-stack-app`, `creating-ai-powered-apps`, `software-product-engineering`, `system-design-interview`, `security-essentials` (each is audited in a later wave, so this course is final first).

## Prerequisite re-check

- Plan 02 adds `just-enough-python` (the list above is the result).
- Prerequisites outside this plan (unchanged here): `sql-essentials`, `just-enough-python`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-path-and-capstone-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `backend-essentials` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder; `AUDIT_PROBE=backend-essentials:by-example` with `UNIT-NODE tests/unit/be-steps/audited-course-completion.steps.ts` to record the scenarios the course fails; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (S): one packet per defect group (mechanical fixes, then prose fixes); no page split. Classes: X1, X3, X4, X8, X11, X15, X16, X18.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `backend-essentials`; a course that fires is fixed, never baselined.
- [ ] Units: 80 example units, 8 kata units, 1 capstone unit (create 0, convert 89); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 10 (`curl`, `uvicorn`, and multi-process launch lines).
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `backend-essentials` exits 0 (at most 2 repair cycles); `EX-COVERAGE` shows `covered: true` for `backend-essentials`.
- [ ] CP-6 The registry row for `backend-essentials` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit backend-essentials course` with explicit paths only: the course folder with its `_index.md`, the registry row.
- [ ] CP-7 Capstone relies-on: `rtk git grep -n "backend-essentials" -- 'apps/ayokoding-www/content/en/learn/courses/capstone-*/learning/overview.md'` shows no capstone row for this course today; if the search finds one at execution time, handle it as in the other courses and note it in the ledger.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/backend-essentials/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–28 (28): from "Raw Server Hello" to "curl POST JSON, End to End".
- **co-02 · intermediate** — examples 29–56 (28): from "A Missing Required Field Fails Validation" to "pytest + FastAPI's TestClient, Explicitly".
- **co-03 · advanced** — examples 57–80 (24): from "Sessions vs Tokens" to "Stateless, Two Workers".

## Lineage

- Builds on: `sql-essentials`, `just-enough-python`. Required by (in this plan): `api-design`, `async-python-and-fastapi-services`, `backend-at-scale`, `build-your-own-web-framework`, `capstone-first-working-software`, `capstone-full-stack-app`, `creating-ai-powered-apps`, `software-product-engineering`, `system-design-interview`, `security-essentials`.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 6 of 121 in the manifest as specified by plan 02 (read 2026-10-09), phase `first-working-software`, role `core`; this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 7 of 114 in the manifest as specified by plan 02 (read 2026-10-09), phase `python-and-backend`, role `core`; this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 6 of 116 in the manifest as specified by plan 02 (read 2026-10-09), phase `algorithms-and-backend-basics`, role `core`; this plan changes no path membership or order.
