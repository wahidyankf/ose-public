# Inter-Topic Capstone · Full-Stack App (Capstone (Annotated Concept, standard))

**Course ID**: `capstone-full-stack-app` · **Format**: Capstone (Annotated Concept, standard) · **Family**: application-development.

**Scope note**: Audits and fixes the existing `capstone-full-stack-app` course to the series definition of done and brings every example green in plan 05's code harness. The subject, slug, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course (except a capstone's `relies-on` row, CP-7).

**Short summary**: Connect a typed frontend to a backend and a database in one working app, with a contract between the two halves.

## Why this exists · the big idea

- **The problem before the solution**: One 7,624-word page and a root `code/` folder of 19 files in two languages; no `learning/` folder, no worked examples, no drilling, and a plan 05 unit may use only one toolchain.
- **Keep-this-if-you-forget-everything**: A full-stack app is two programs and one contract; the contract is the thing that must never drift.

## Prerequisites

- **Prior courses**: `sql-essentials`, `backend-essentials`, `networking-essentials`, `frontend-essentials`, `software-testing`, `security-essentials` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: Capstone (Annotated Concept, standard). **Reason**: Plan 08's capstone contract applies (Annotated Concept, standard sub-mode): 45 worked examples, a rubric, a relies-on table, and a reference solution in `learning/capstone/code/`.
  A maker may not switch modes except where the reason above says so; a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user.
- **Mode-convention fit**: today the course needs `learning/overview.md` with the mode declaration, worked-example pages, and `learning/capstone/` with its overview, rubric, and code (plan 08's capstone contract). Example headings per page today: no page with numbered example headings.
- **Wave**: 10 (slot 2); **size class**: L (words to write 15,386, new unit folders 50); **expected defect classes**: 11 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                             | Target                                                                                                                                                               | Work                            |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 7,614                                                                                                       | at least 23,000                                                                                                                                                      | 15,386 to write                 |
| Examples as `### Worked Example N: Title`                     | 0                                                                                                           | at least 45, numbered 1 to N without gaps                                                                                                                            | 45 to add                       |
| Mermaid diagrams                                              | 1                                                                                                           | at least 10 (this plan's target)                                                                                                                                     | 9 to add                        |
| "Why It Matters" (50 to 100 words each)                       | not measurable: no numbered example headings of the mode's form exist today                                 | one per example, 50 to 100 words                                                                                                                                     | all new                         |
| Annotation density (comment lines per code line)              | not measurable: no code-bearing examples of the mode's form today                                           | 1.0 to 2.25 on every code-bearing example                                                                                                                            | all new                         |
| Code fences                                                   | 18 code fences in the lessons; 0 unanchored                                                                 | every code fence anchored or marked as an illustration (budget: 6 at most; dev-server and `npm install` lines)                                                       | 0 to anchor                     |
| Lesson-to-file anchors (plan 05's method)                     | 18 path anchors (match 18, mismatch 0, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)      | every anchor matches its file                                                                                                                                        | 0 to repair                     |
| Output blocks                                                 | 3 output fences; 3 unanchored                                                                               | every `**Output**` block anchored to an expected file                                                                                                                | 3 to anchor                     |
| Harness units                                                 | 0 example folders, 0 kata folders, 19 code files, 0 `run.yaml`                                              | 45 example units, 5 kata units, 1 capstone unit, each with a `run.yaml`                                                                                              | create 50, convert 1            |
| Drilling page                                                 | 0 words; 0 of 5 standard `##` sections exact; 0 `<details>` blocks; headings found: none (no drilling page) | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) | 5,000 words short; fix sections |
| Katas                                                         | 0 kata folders                                                                                              | at least 5 as `before`/`after` units                                                                                                                                 | 5                               |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                      | unchanged, except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                           | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X1** 19 code files (0 example folders, 0 kata folders, 2 test-like files); none has a `run.yaml`.
- **X2** The code lives in a root `code/` folder with `backend/` (Python) and `frontend/` (TypeScript, HTML), not in `learning/capstone/code/`.
- **X4** 3 of 3 `**Output**` blocks are not labelled anchors to expected files.
- **X11** Drilling: no drilling page exists; 0 kata folders against 5.
- **X12** No `learning/` folder, no drilling page, no capstone headings, no rubric, no relies-on table.
- **X13** 7,614 words against a floor of 23,000; 15,386 to write.
- **X16** fastapi, pydantic, pytest for the backend; vitest and `@testing-library/dom` for the frontend; no hash-locked file for either.
- **X17** One `run.yaml` names one toolchain, but the capstone has Python and TypeScript halves (decision D8: the capstone unit is Python; the frontend half is proven by `typescript` example units that read a byte-identical copy of the API contract).
- **X18** The course names Python 3.13 3 times; the catalog pin is 3.14.8, so the text and recorded output are aligned to the pin.
- **X19** 0 example folders exist against 45 example units: 45 to create.
- **X20** 1 Mermaid diagram against this plan's floor of 10.

## Fixes and design

- Build the course to plan 08's capstone contract: 45 worked examples in five themes (data model, API, contract, frontend, integration), the capstone page with its six headings, a rubric, 5 kata units, and the relies-on table.
- Capstone unit (Python): the backend reference solution, its tests, and a script that regenerates the OpenAPI contract and fails when it differs from the committed `contract/openapi.json`.
- Frontend units (TypeScript, jsdom): the typed client, the app shell, and component tests run against a fake server built from a byte-identical copy of `openapi.json`; a content test keeps the two copies equal (decision D8 in tech-docs/008).
- Give the course a `learning/overview.md` and rebind the shape-3 Start-fallback binding together with `capstone-first-working-software`.

## Harness mode and toolchain

- **Harness mode**: Real mode: `python` for the capstone unit and backend examples; `typescript` with jsdom for the frontend examples.
- **Toolchain ids**: python (fastapi stack); typescript (jsdom, vitest, testing-library).
- **Toolchain additions** (budget-gated, default NO-GO; [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-cost.md)): none; a combined Python and Node toolchain would serve one unit and fails the budget rule (decision D9).
- **Phase 1 spikes**: SP1, SP4 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: at most 6 (dev-server and `npm install` lines).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 4.0 s per container invocation × 2 executions × 58 runs (45 examples + 2 × 5 kata runs + 3 capstone runs) ≈ 7.7 minutes.

## Size class and sequencing

- **Size class L** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 15,386 (the larger of the word gap and the drilling shortfall), new unit folders 50.
- **Estimated effort** (size, not time): class L; agent packets: authoring split by learning page (one packet per page), then one packet per remaining defect group.
- **Wave 10**, slot 2. Makers and fixers for this course: `apps-ayokoding-www-annotated-concept-maker` for authoring gaps, `tutorial-annotated-concept-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 removes `capstone-first-working-software`; adds `sql-essentials`, `backend-essentials`, `networking-essentials`, `frontend-essentials`, `software-testing`, `security-essentials` (the list above is the result).
- In-plan prerequisites are audited first: `backend-essentials` in wave 1, `frontend-essentials` in wave 1, `security-essentials` in wave 2.
- Prerequisites outside this plan (unchanged here): `sql-essentials`, `networking-essentials`, `software-testing`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-path-and-capstone-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `capstone-full-stack-app` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-annotated-concept-checker` over the course folder; `AUDIT_PROBE=capstone-full-stack-app:capstone` with `UNIT-NODE tests/unit/be-steps/audited-course-completion.steps.ts` to record the scenarios the course fails; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (L): authoring split by learning page (one packet per page), then one packet per remaining defect group. Classes: X1, X2, X4, X11, X12, X13, X16, X17, X18, X19, X20.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `capstone-full-stack-app`; a course that fires is fixed, never baselined.
- [ ] Units: 45 example units, 5 kata units, 1 capstone unit (create 50, convert 1); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 6 (dev-server and `npm install` lines).
- [ ] CP-3 `tutorial-annotated-concept-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `capstone-full-stack-app` exits 0 (at most 2 repair cycles); `EX-COVERAGE` shows `covered: true` for `capstone-full-stack-app`.
- [ ] CP-6 The registry row for `capstone-full-stack-app` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit capstone-full-stack-app course` with explicit paths only: the course folder with its `_index.md`, the registry row, the slug added to plan 08's capstone content-shape constant (after the probe is GREEN), and the byte-identity pair for `contract/openapi.json` in that step file (rule CC6; `UNIT-NODE tests/unit/be-steps/capstone-course-completion.steps.ts` stays green).
- [ ] CP-7 Capstone relies-on: `rtk git grep -n "capstone-full-stack-app" -- 'apps/ayokoding-www/content/en/learn/courses/capstone-*/learning/overview.md'` shows no capstone row for this course today; if the search finds one at execution time, handle it as in the other courses and note it in the ledger.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/capstone-full-stack-app/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · course-as-taught** — no numbered example headings of the mode's form exist today (the pages use tables, `ex-NN` headings, or prose); CP-1 lists the concepts from the pages.

## Lineage

- Builds on: `sql-essentials`, `backend-essentials`, `networking-essentials`, `frontend-essentials`, `software-testing`, `security-essentials`. Required by (in this plan): none.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 118 of 121 in the manifest as specified by plan 02 (read 2026-10-09), phase `integrative-capstones`, role `extension`; this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 13 of 114 in the manifest as specified by plan 02 (read 2026-10-09), phase `full-stack-capstone`, role `core`; this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 112 of 116 in the manifest as specified by plan 02 (read 2026-10-09), phase `integrative-capstones`, role `extension`; this plan changes no path membership or order.
