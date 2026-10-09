# API Design (By Example)

**Course ID**: `api-design` · **Format**: By Example · **Family**: application-development.

**Scope note**: Audits and fixes the existing `api-design` course to the series definition of done and brings every example green in plan 05's code harness. The subject, slug, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course (except a capstone's `relies-on` row, CP-7).

**Short summary**: Designing web APIs other teams can depend on: resources and verbs, status codes, pagination, versioning, hypermedia, GraphQL, errors, idempotency, and evolution without breaking clients.

## Why this exists · the big idea

- **The problem before the solution**: 78 of 80 examples are under the annotation floor (median 0.86), 27 diagrams sit just under the band, and 96 files start with the same `pyright: strict` line that nothing in the harness checks.
- **Keep-this-if-you-forget-everything**: An API is a contract; every example here is a small contract with a test that fails when the contract breaks.

## Prerequisites

- **Prior courses**: `backend-essentials` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example. **Reason**: By Example, as plan 03 records it: 80 numbered examples, each a standard-library Python program with a type-checked contract.
  A maker may not switch modes except where the reason above says so; a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user.
- **Mode-convention fit**: today the course fits the convention: `overview.md` plus beginner, intermediate, and advanced pages. Example headings per page today: `learning/advanced.md` (24), `learning/beginner.md` (28), `learning/intermediate.md` (28).
- **Wave**: 2 (slot 1); **size class**: S (words to write 0, new unit folders 2); **expected defect classes**: 9 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                                       | Target                                                                                                                                                               | Work                 |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 61,178                                                                                                                                                                                                | at least 28,000                                                                                                                                                      | none                 |
| Examples as `### Example N: Title`                            | 80                                                                                                                                                                                                    | at least 75, numbered 1 to N without gaps                                                                                                                            | none                 |
| Mermaid diagrams                                              | 27                                                                                                                                                                                                    | 30 to 50 (adapter band)                                                                                                                                              | 3 to add             |
| "Why It Matters" (50 to 100 words each)                       | 80 of 80 present; 0 under 50 words; 0 over 100; median 66 words                                                                                                                                       | one per example, 50 to 100 words                                                                                                                                     | 0 to write or fix    |
| Annotation density (comment lines per code line)              | median 0.86; 78 examples below 1.0; 0 above 2.25 (of 80 code-bearing)                                                                                                                                 | 1.0 to 2.25 on every code-bearing example                                                                                                                            | 78 to fix            |
| Code fences                                                   | 97 code fences in the lessons; 6 unanchored                                                                                                                                                           | every code fence anchored or marked as an illustration (budget: 6 at most; `curl` lines and the type-checker invocation if SP9 fails)                                | 6 to anchor          |
| Lesson-to-file anchors (plan 05's method)                     | 85 path anchors (match 84, mismatch 1, missing 0); 6 labelled anchors (match 6, mismatch 0, missing 0)                                                                                                | every anchor matches its file                                                                                                                                        | 1 to repair          |
| Output blocks                                                 | 90 output fences; 90 unanchored                                                                                                                                                                       | every `**Output**` block anchored to an expected file                                                                                                                | 90 to anchor         |
| Harness units                                                 | 80 example folders, 6 kata folders, 97 code files, 0 `run.yaml`                                                                                                                                       | 80 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                              | create 2, convert 87 |
| Drilling page                                                 | 8,942 words; 5 of 5 standard `##` sections exact; 61 `<details>` blocks; headings found: Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) | words ok             |
| Katas                                                         | 6 kata folders                                                                                                                                                                                        | at least 8 as `before`/`after` units                                                                                                                                 | 2                    |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                                | unchanged, except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                           | recompute            |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X1** 97 code files (80 example folders, 6 kata folders, 1 test-like files); none has a `run.yaml`.
- **X3** 6 of 97 code fences are neither anchored nor marked as illustrations; 1 anchors mismatch their files and 0 point at missing files.
- **X4** 90 of 90 `**Output**` blocks are not labelled anchors to expected files.
- **X9** Annotation density: median 0.86; 78 examples below 1.0 and 0 above 2.25 (of 80 code-bearing).
- **X11** Drilling: 8,942 words; 5 of 5 exact `##` sections; 6 kata folders against 8.
- **X14** 96 of 97 code files open with the same directive line `pyright: strict`; the line is a type-check directive, but the harness never runs the checker.
- **X17** The type checker `pyright` needs a Node download and is not in the catalog (spike SP9 tests a wheel-bundled checker).
- **X18** The course names Python 3.13 1 times; the catalog pin is 3.14.8, so the text and recorded output are aligned to the pin.
- **X20** 27 Mermaid diagrams against the band of 30 to 50.

## Fixes and design

- Run all 80 programs under `python`; use `http.server`-free, in-process request objects so nothing opens a socket.
- Decide the type-check claim with spike SP9: a hash-locked wheel-bundled checker runs as a `kind: check` run, or the directive stays as a documented illustration and the lessons say the harness does not run it.
- Lift the 78 low-density examples to the 1.0 floor with `=>` results that name the contract being shown.
- Add 3 diagrams, write 2 missing kata units (6 exist), and repair the one mismatching anchor and 6 unanchored fences.

## Harness mode and toolchain

- **Harness mode**: Real mode: `python`, standard library only, plus an optional `kind: check` run for the type checker (SP9).
- **Toolchain ids**: python.
- **Toolchain additions** (budget-gated, default NO-GO; [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-cost.md)): none.
- **Phase 1 spikes**: SP9 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: at most 6 (`curl` lines and the type-checker invocation if SP9 fails).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 2.0 s per container invocation × 2 executions × 99 runs (80 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 6.6 minutes.

## Size class and sequencing

- **Size class S** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 0 (the larger of the word gap and the drilling shortfall), new unit folders 2.
- **Estimated effort** (size, not time): class S; agent packets: one packet per defect group (mechanical fixes, then prose fixes); no page split.
- **Wave 2**, slot 1. Makers and fixers for this course: `apps-ayokoding-www-by-example-maker` for authoring gaps, `tutorial-by-example-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `creating-ai-powered-apps` (each is audited in a later wave, so this course is final first).

## Prerequisite re-check

- Plan 02 removes `backend-at-scale` (the list above is the result).
- In-plan prerequisites are audited first: `backend-essentials` in wave 1.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-path-and-capstone-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `api-design` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder; `AUDIT_PROBE=api-design:by-example` with `UNIT-NODE tests/unit/be-steps/audited-course-completion.steps.ts` to record the scenarios the course fails; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (S): one packet per defect group (mechanical fixes, then prose fixes); no page split. Classes: X1, X3, X4, X9, X11, X14, X17, X18, X20.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `api-design`; a course that fires is fixed, never baselined.
- [ ] Units: 80 example units, 8 kata units, 1 capstone unit (create 2, convert 87); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 6 (`curl` lines and the type-checker invocation if SP9 fails).
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `api-design` exits 0 (at most 2 repair cycles); `EX-COVERAGE` shows `covered: true` for `api-design`.
- [ ] CP-6 The registry row for `api-design` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit api-design course` with explicit paths only: the course folder with its `_index.md`, the registry row.
- [ ] CP-7 Capstone relies-on: `rtk git grep -n "api-design" -- 'apps/ayokoding-www/content/en/learn/courses/capstone-*/learning/overview.md'` shows no capstone row for this course today; if the search finds one at execution time, handle it as in the other courses and note it in the ledger.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/api-design/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–28 (28): from "Resource-Noun URIs" to "Accept-Language Selects a Localized Message".
- **co-02 · intermediate** — examples 29–56 (28): from "Versioning via the URI Path" to "A HAL Response with \_links and \_embedded".
- **co-03 · advanced** — examples 57–80 (24): from "Defining a GraphQL Schema and Types" to "A Versioned REST API From an OpenAPI Spec, End to End".

## Lineage

- Builds on: `backend-essentials`. Required by (in this plan): `creating-ai-powered-apps`.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 58 of 121 in the manifest as specified by plan 02 (read 2026-10-09), phase `backend-depth`, role `extension`; this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 45 of 114 in the manifest as specified by plan 02 (read 2026-10-09), phase `backend-depth`, role `extension`; this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 46 of 116 in the manifest as specified by plan 02 (read 2026-10-09), phase `backend-depth`, role `extension`; this plan changes no path membership or order.
