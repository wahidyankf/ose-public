# Async Python & FastAPI Services (By Example)

**Course ID**: `async-python-and-fastapi-services` · **Format**: By Example · **Family**: application-development.

**Scope note**: Audits and fixes the existing `async-python-and-fastapi-services` course to the series definition of done and brings every example green in plan 05's code harness. The subject, slug, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course (except a capstone's `relies-on` row, CP-7).

**Short summary**: Typed asynchronous Python services with FastAPI: coroutines, dependency injection, validation, database access, background work, testing, and deployment shape.

## Why this exists · the big idea

- **The problem before the solution**: The examples start servers and talk to them (67 files use network keywords), 55 "Why It Matters" blocks are under 50 words, and 72 of 78 examples are under the annotation floor.
- **Keep-this-if-you-forget-everything**: Async code is code whose order you prove with a controllable event loop; every example here runs in-process on a fixed schedule.

## Prerequisites

- **Prior courses**: `just-enough-python`, `backend-essentials`, `sql-essentials` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example. **Reason**: By Example, as plan 03 records it: 78 numbered examples across three level pages, each a Python file with a test.
  A maker may not switch modes except where the reason above says so; a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user.
- **Mode-convention fit**: today the course fits the convention: `overview.md` plus beginner, intermediate, and advanced pages. Example headings per page today: `learning/advanced.md` (40), `learning/beginner.md` (18), `learning/intermediate.md` (20).
- **Wave**: 15 (slot 3); **size class**: S (words to write 0, new unit folders 0); **expected defect classes**: 10 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                                       | Target                                                                                                                                                               | Work                 |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 44,146                                                                                                                                                                                                | at least 28,000                                                                                                                                                      | none                 |
| Examples as `### Example N: Title`                            | 78                                                                                                                                                                                                    | at least 75, numbered 1 to N without gaps                                                                                                                            | none                 |
| Mermaid diagrams                                              | 12                                                                                                                                                                                                    | 30 to 50 (adapter band)                                                                                                                                              | 18 to add            |
| "Why It Matters" (50 to 100 words each)                       | 78 of 78 present; 55 under 50 words; 0 over 100; median 46 words                                                                                                                                      | one per example, 50 to 100 words                                                                                                                                     | 55 to write or fix   |
| Annotation density (comment lines per code line)              | median 0.75; 72 examples below 1.0; 0 above 2.25 (of 78 code-bearing)                                                                                                                                 | 1.0 to 2.25 on every code-bearing example                                                                                                                            | 72 to fix            |
| Code fences                                                   | 107 code fences in the lessons; 10 unanchored                                                                                                                                                         | every code fence anchored or marked as an illustration (budget: 8 at most; `uvicorn`, `uv`, and `docker` launch lines)                                               | 10 to anchor         |
| Lesson-to-file anchors (plan 05's method)                     | 90 path anchors (match 82, mismatch 8, missing 0); 7 labelled anchors (match 0, mismatch 0, missing 7)                                                                                                | every anchor matches its file                                                                                                                                        | 15 to repair         |
| Output blocks                                                 | 88 output fences; 81 unanchored                                                                                                                                                                       | every `**Output**` block anchored to an expected file                                                                                                                | 81 to anchor         |
| Harness units                                                 | 78 example folders, 10 kata folders, 102 code files, 0 `run.yaml`                                                                                                                                     | 78 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                              | create 0, convert 87 |
| Drilling page                                                 | 5,831 words; 5 of 5 standard `##` sections exact; 55 `<details>` blocks; headings found: Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) | words ok             |
| Katas                                                         | 10 kata folders                                                                                                                                                                                       | at least 8 as `before`/`after` units                                                                                                                                 | 0                    |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                                | unchanged, except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                           | recompute            |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X1** 102 code files (78 example folders, 10 kata folders, 5 test-like files); none has a `run.yaml`.
- **X3** 10 of 107 code fences are neither anchored nor marked as illustrations; 8 anchors mismatch their files and 7 point at missing files.
- **X4** 81 of 88 `**Output**` blocks are not labelled anchors to expected files.
- **X8** 78 "Why It Matters" blocks present: 55 under 50 words, 0 over 100, median 46 words.
- **X9** Annotation density: median 0.75; 72 examples below 1.0 and 0 above 2.25 (of 78 code-bearing).
- **X15** 31 files use timers or the event loop and 67 use network keywords (`uvicorn` in 59, `httpx`, `localhost`); servers must be replaced by in-process ASGI calls and sleeps by a controllable loop clock.
- **X16** Third-party packages: fastapi, pydantic, pydantic-settings, httpx, aiosqlite, pytest-asyncio, starlette; the only dependency files are a `pyproject.toml` inside one example and a `pyrightconfig.json`.
- **X17** Example 77 (a `uv` project) and example 78 (a Dockerfile for a multi-worker ASGI deploy) need `uv` and Docker, neither in the catalog.
- **X18** The course names Python 3.13 4 times; the catalog pin is 3.14.8, so the text and recorded output are aligned to the pin.
- **X20** 12 Mermaid diagrams against the band of 30 to 50.

## Fixes and design

- Add one hash-locked `requirements.lock` for the course (spike SP4) and declare it in every unit's `dependencies.lockfile`.
- Replace each `uvicorn` server with `httpx.ASGITransport` or FastAPI's `TestClient`, and each real sleep with an event-loop clock the test advances.
- Show examples 77 and 78 as models (a TOML parse and a Dockerfile rule check in Python) with the real `uv` and `docker build` lines as illustrations.
- Lengthen 55 "Why It Matters" blocks, lift 72 examples to the density floor, add diagrams to the band, and repair 8 mismatching and 7 missing anchors and 10 unanchored fences.

## Harness mode and toolchain

- **Harness mode**: Real mode: `python` with a hash-locked FastAPI stack; ASGI calls in process.
- **Toolchain ids**: python (fastapi, pydantic, httpx, aiosqlite, pytest-asyncio from a hash-locked lockfile).
- **Toolchain additions** (budget-gated, default NO-GO; [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-cost.md)): none.
- **Phase 1 spikes**: SP4 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: at most 8 (`uvicorn`, `uv`, and `docker` launch lines).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 3.0 s per container invocation × 2 executions × 97 runs (78 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 9.7 minutes.

## Size class and sequencing

- **Size class S** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 0 (the larger of the word gap and the drilling shortfall), new unit folders 0.
- **Estimated effort** (size, not time): class S; agent packets: one packet per defect group (mechanical fixes, then prose fixes); no page split.
- **Wave 15**, slot 3. Makers and fixers for this course: `apps-ayokoding-www-by-example-maker` for authoring gaps, `tutorial-by-example-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 keeps the current list (the list above is the result).
- In-plan prerequisites are audited first: `backend-essentials` in wave 1.
- Prerequisites outside this plan (unchanged here): `just-enough-python`, `sql-essentials`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-path-and-capstone-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `async-python-and-fastapi-services` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder; `AUDIT_PROBE=async-python-and-fastapi-services:by-example` with `UNIT-NODE tests/unit/be-steps/audited-course-completion.steps.ts` to record the scenarios the course fails; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (S): one packet per defect group (mechanical fixes, then prose fixes); no page split. Classes: X1, X3, X4, X8, X9, X15, X16, X17, X18, X20.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `async-python-and-fastapi-services`; a course that fires is fixed, never baselined.
- [ ] Units: 78 example units, 8 kata units, 1 capstone unit (create 0, convert 87); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 8 (`uvicorn`, `uv`, and `docker` launch lines).
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `async-python-and-fastapi-services` exits 0 (at most 2 repair cycles); `EX-COVERAGE` shows `covered: true` for `async-python-and-fastapi-services`.
- [ ] CP-6 The registry row for `async-python-and-fastapi-services` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit async-python-and-fastapi-services course` with explicit paths only: the course folder with its `_index.md`, the registry row.
- [ ] CP-7 Capstone relies-on: `rtk git grep -n "async-python-and-fastapi-services" -- 'apps/ayokoding-www/content/en/learn/courses/capstone-*/learning/overview.md'` lists `capstone-build-your-own-coding-agent`; read each `## What this course relies on` row for this course and confirm the audited course still teaches the named concepts at definition level; edit the row and the capstone paragraph that restates it in the same commit if not. The content-shape test (CL1, CL4) must stay green.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/async-python-and-fastapi-services/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–18 (18): from "First Coroutine via asyncio Run" to "OpenAPI Docs Are Generated for Free".
- **co-02 · intermediate** — examples 19–38 (20): from "Injecting a Shared Resource with Depends" to "A Concurrency Safe Shared Counter".
- **co-03 · advanced** — examples 39–78 (40): from "A Full Typed Async CRUD Service" to "A Dockerfile for Multi Worker ASGI Deploy".

## Lineage

- Builds on: `just-enough-python`, `backend-essentials`, `sql-essentials`. Required by (in this plan): none.
- Listed as a prerequisite by plan 08's capstones: `capstone-build-your-own-coding-agent` (read from plan 08's briefs on 2026-10-09).

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 57 of 121 in the manifest as specified by plan 02 (read 2026-10-09), phase `backend-depth`, role `extension`; this plan changes no path membership or order.
- `careers/immediately-effective/ai-engineer` — position 2 of 28 in the manifest as specified by plan 08 (read 2026-10-09), phase `python-services-and-practice`, role `core`; this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 44 of 114 in the manifest as specified by plan 02 (read 2026-10-09), phase `backend-depth`, role `extension`; this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 45 of 116 in the manifest as specified by plan 02 (read 2026-10-09), phase `backend-depth`, role `extension`; this plan changes no path membership or order.
- `careers/immediately-effective/ai-engineer` — a prerequisite change here also changes that manifest, its `assumes`, and its tests in the same PR (plan 02's rule R6, plan 08's duty).
