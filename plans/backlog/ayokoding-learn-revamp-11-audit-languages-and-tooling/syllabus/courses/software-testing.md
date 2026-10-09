# Software Testing (By Example)

**Course ID**: `software-testing` · **Format**: By Example · **Family**: tools-and-practices.

**Scope note**: Audits and fixes the existing `software-testing` course to the series definition of done and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. The neighbouring course `just-enough-python` keeps its own scope. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course.

**Short summary**: Software testing as a discipline: the test pyramid, unit and integration tests with pytest, fixtures and parametrization, property-based testing with hypothesis, BDD with pytest-bdd and behave, contract testing, and the capstone test suite.

## Why this exists · the big idea

- **The problem before the solution**: Contract tests, property tests, and loopback servers are not yet proven repeatable, 98 of 100 outputs are unanchored, and the six anchors that exist point at missing files.
- **Keep-this-if-you-forget-everything**: A technique is understood when you have seen it fail and then pass; every example shows both, the same way every time.

## Prerequisites

- **Prior courses**: `just-enough-python` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Eighty-six examples show a test technique each, with a failing and a passing form. Every technique is a rule a reader can run and break.
- **Wave**: 4 (slot 1); **size class**: S (words to write 0, new unit folders 8); **expected defect classes**: 6 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                         | Target                                                                                                                                                                                   | Work                   |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 63,837                                                                                                                                                  | at least 28,000                                                                                                                                                                          | none                   |
| Examples as `### Example N: Title`                            | 86                                                                                                                                                      | at least 75, numbered 1 to N without gaps                                                                                                                                                | none                   |
| Mermaid diagrams                                              | 34                                                                                                                                                      | 30 to 50 (adapter band)                                                                                                                                                                  | none                   |
| "Why It Matters" (50 to 100 words each)                       | 86 of 86 present; 10 under 50 words; 0 over 100; median 60 words                                                                                        | one per example, 50 to 100 words                                                                                                                                                         | 10 to write or fix     |
| Annotation density (comment lines per code line)              | median 1.11; 8 examples below 1.0; 0 above 2.25 (of 86 code-bearing)                                                                                    | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 8 to fix               |
| Code fences                                                   | 258 fences; 110 code fences unanchored                                                                                                                  | every code fence anchored or marked as an illustration (budget: at most 10 fences)                                                                                                       | 110 to anchor          |
| Lesson-to-file anchors (plan 05's method)                     | 4 path anchors (match 0, mismatch 0, missing 4); 2 labelled anchors (match 0, mismatch 0, missing 2)                                                    | every anchor matches its file                                                                                                                                                            | 6 to repair            |
| Output blocks                                                 | 100 output fences; 98 unanchored                                                                                                                        | every `**Output**` block anchored to an expected file                                                                                                                                    | 98 to anchor           |
| Harness units                                                 | 86 example folders, 0 kata folders, 116 code files, 0 `run.yaml`                                                                                        | 86 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | create 8, convert 87   |
| Drilling page                                                 | 5,623 words; 4 of 5 standard `##` sections exact; 48 `<details>` blocks; headings found: Recall Q&A, Applied problems, Code katas, Self-check checklist | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | words ok; fix sections |
| Katas                                                         | 0 kata folders                                                                                                                                          | at least 8 as `before`/`after` units                                                                                                                                                     | 8                      |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                  | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                                                | recompute              |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X3** 110 of 258 fences are unanchored; 98 of 100 `Output` blocks are unanchored; the 4 path anchors and 2 labelled anchors all point at missing files.
- **X1** 116 code files in 86 example folders and a capstone folder, no `run.yaml`; 0 kata units.
- **X8** Every one of the 86 examples has a "Why It Matters" block, 10 under 50 words (median 60); X9 8 examples are below the density floor.
- **X11** Drilling is 5,623 words with four of five sections (Elaborative interrogation is missing).
- **X16** Third-party packages: pytest, hypothesis, pytest-bdd, fastapi, pydantic, pact, behave, freezegun, httpx, uvicorn, testcontainers.
- **X17** `testcontainers` needs a Docker daemon; two TypeScript files (Vitest, fast-check) are Node, not Python.

## Fixes and design

- One hash-locked `requirements.lock` for the course; `derandomize=True` and `database=None` for hypothesis; loopback servers for fastapi examples with a fixed port per unit.
- `testcontainers` examples become a fake container behind the same interface (the lesson says so) with the launch lines as illustrations; the TypeScript examples are separate units in the `typescript` toolchain.
- Anchor everything, fix the 10 short "Why It Matters" blocks, write 8 katas, add the missing drilling section.
- AI core: this course is in the AI core. A change to its prerequisites updates the AI manifest in the same PR (tech-docs/005).
- `pact` needs a native library from its wheel and a loopback mock server; spike SP13 proves the double run before the Pact examples are rewritten.

## Harness mode and toolchain

- **Harness mode**: Real mode, `python` for 84 units and `typescript` for 2; 86 example units, 8 kata units, 1 capstone unit.
- **Toolchain ids**: python (pytest, hypothesis, pytest-bdd, fastapi stack locked); node/typescript for 2 files.
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP13 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: At most 10 fences.
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 2.5 s per container invocation × 2 executions × 105 runs (86 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 8.8 minutes.

## Size class and sequencing

- **Size class S** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 0 (the larger of the word gap and the drilling shortfall), new unit folders 8.
- **Agent packets**: one packet per defect group (mechanical fixes, then prose fixes); no page split.
- **Wave 4**, slot 1. Makers and fixers for this course: `apps-ayokoding-www-by-example-maker` for authoring gaps, `tutorial-by-example-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `debugging-and-profiling`, `software-engineering-practices` (each is audited in a later wave, so this course is final first).

## Prerequisite re-check

- Plan 02 result: Plan 02 removes `frontend-essentials` and adds `just-enough-python` (the Python medium, rule L1). The TypeScript cross-reference in the prose is a mention only and stays out of the prerequisites.
- In-plan prerequisites are audited first: `just-enough-python` in wave 1.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-core-and-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `software-testing` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder; compare its findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (S): one packet per defect group (mechanical fixes, then prose fixes); no page split. Classes: X1, X3, X8, X11, X16, X17.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `software-testing`; a course that fires is fixed, never baselined.
- [ ] Units: 86 example units, 8 kata units, 1 capstone unit (create 8, convert 87); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 10 fences.
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `software-testing` exits 0 (at most 2 repair cycles).
- [ ] CP-6 The registry row for `software-testing` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit software-testing course` with explicit paths only: the course folder with its `_index.md`, the registry row.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/software-testing/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–28 (28): from "First Passing Test" to "A Verbose Test Report".
- **co-02 · intermediate** — examples 29–60 (32): from "A Stub Returns a Canned Value" to "A Marker for Integration Tests".
- **co-03 · advanced** — examples 61–80 (20): from "Organize a Suite in Pyramid Shape" to "One Feature, Every Gate -- TDD Units, a Property Test, Integration, All Green".
- **co-04 · bdd** — examples 81–86 (6): from "One Given/When/Then Scenario, Bound to pytest-bdd" to "One Codebase, Two Changes -- Which Gets a Unit Test, Which Gets a BDD Scenario".

## Lineage

- A core course of the AI Engineer path after plan 08; Debugging and Profiling builds on it.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 37 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/ai-engineer` — position 5 of 26 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 31 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 30 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/ai-engineer` — a core course after plan 08 (12-course core); a prerequisite change here also changes that manifest, its `assumes`, and its tests in the same PR.
