# Pass 1 Capstone · First Working Software (Capstone (Annotated Concept, standard))

**Course ID**: `capstone-first-working-software` · **Format**: Capstone (Annotated Concept, standard) · **Family**: application-development.

**Scope note**: Audits and fixes the existing `capstone-first-working-software` course to the series definition of done and brings every example green in plan 05's code harness. The subject, slug, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course (except a capstone's `relies-on` row, CP-7).

**Short summary**: Ship a small, tested habit-tracker app with a Python API and a SQLite database, then attack it and fix what breaks.

## Why this exists · the big idea

- **The problem before the solution**: One 9,754-word page and a root `code/` folder of 15 files; no `learning/` folder, no worked examples, no drilling, no rubric, and a script that opens real HTTP calls to an address on the machine.
- **Keep-this-if-you-forget-everything**: The first working software is small, tested, and secured on purpose; the capstone is the proof that you can ship one thing end to end.

## Prerequisites

- **Prior courses**: `security-essentials`, `just-enough-python`, `just-enough-bash`, `data-structures-and-algorithms-essentials`, `object-oriented-programming-essentials`, `sql-essentials`, `backend-essentials`, `networking-essentials`, `software-testing` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: Capstone (Annotated Concept, standard). **Reason**: Plan 08's capstone contract applies to every capstone (Annotated Concept, standard sub-mode, declared in `learning/overview.md`): the Annotated Concept gate needs 45 worked examples, a rubric, and a relies-on table. The page today is one file.
  A maker may not switch modes except where the reason above says so; a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user.
- **Mode-convention fit**: today the course needs `learning/overview.md` with the mode declaration, worked-example pages, and `learning/capstone/` with its overview, rubric, and code (plan 08's capstone contract). Example headings per page today: no page with numbered example headings.
- **Wave**: 11 (slot 3); **size class**: L (words to write 13,246, new unit folders 50); **expected defect classes**: 12 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                             | Target                                                                                                                                                               | Work                            |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 9,754                                                                                                       | at least 23,000                                                                                                                                                      | 13,246 to write                 |
| Examples as `### Worked Example N: Title`                     | 0                                                                                                           | at least 45, numbered 1 to N without gaps                                                                                                                            | 45 to add                       |
| Mermaid diagrams                                              | 1                                                                                                           | at least 10 (this plan's target)                                                                                                                                     | 9 to add                        |
| "Why It Matters" (50 to 100 words each)                       | not measurable: no numbered example headings of the mode's form exist today                                 | one per example, 50 to 100 words                                                                                                                                     | all new                         |
| Annotation density (comment lines per code line)              | not measurable: no code-bearing examples of the mode's form today                                           | 1.0 to 2.25 on every code-bearing example                                                                                                                            | all new                         |
| Code fences                                                   | 15 code fences in the lessons; 1 unanchored                                                                 | every code fence anchored or marked as an illustration (budget: 6 at most; install and `uvicorn` launch lines)                                                       | 1 to anchor                     |
| Lesson-to-file anchors (plan 05's method)                     | 14 path anchors (match 14, mismatch 0, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)      | every anchor matches its file                                                                                                                                        | 0 to repair                     |
| Output blocks                                                 | 5 output fences; 5 unanchored                                                                               | every `**Output**` block anchored to an expected file                                                                                                                | 5 to anchor                     |
| Harness units                                                 | 0 example folders, 0 kata folders, 15 code files, 0 `run.yaml`                                              | 45 example units, 5 kata units, 1 capstone unit, each with a `run.yaml`                                                                                              | create 50, convert 1            |
| Drilling page                                                 | 0 words; 0 of 5 standard `##` sections exact; 0 `<details>` blocks; headings found: none (no drilling page) | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) | 5,000 words short; fix sections |
| Katas                                                         | 0 kata folders                                                                                              | at least 5 as `before`/`after` units                                                                                                                                 | 5                               |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                      | unchanged, except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                           | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X1** 15 code files (0 example folders, 0 kata folders, 3 test-like files); none has a `run.yaml`.
- **X2** The code lives in a root `code/` folder (10 Python files, 2 SQL files, a shell script, a requirements file), not in `learning/capstone/code/` and not in units.
- **X3** 1 of 15 code fences is neither anchored nor marked as illustrations.
- **X4** 5 of 5 `**Output**` blocks are not labelled anchors to expected files.
- **X11** Drilling: no drilling page exists; 0 kata folders against 5.
- **X12** No `learning/` folder exists, so the Start rule falls back to the course overview (shape 3); no drilling page, no capstone headings, no rubric, no relies-on table.
- **X13** 9,754 words against a floor of 23,000; 13,246 to write.
- **X15** `uvicorn` appears in 3 files, a socket in 1, a clock in 1, and `attack_transcript.py` sends real `urllib` calls to `127.0.0.1`; all must run in process (spike SP11).
- **X16** fastapi, pydantic, hypothesis, argon2-cffi, and pytest are listed in an unhashed `requirements.txt` (spikes SP3, SP4, and SP10).
- **X18** The course names Python 3.13 5 times; the catalog pin is 3.14.8, so the text and recorded output are aligned to the pin.
- **X19** 0 example folders exist against 45 example units: 45 to create.
- **X20** 1 Mermaid diagram against this plan's floor of 10.

## Fixes and design

- Build the course to plan 08's capstone contract: a `learning/overview.md` with the mode declaration, 45 worked examples in five themes, `learning/capstone/overview.md` with the six required headings and a rubric, a drilling page with 5 kata units, and the relies-on table.
- Move the app, its tests, and the attack transcript into `learning/capstone/code/` and into 45 example units; the attack runs against the app in process and prints what it saw (rule SL2 in tech-docs/012).
- Add a `## Safety boundary` section to the course `overview.md`, where plan 08's rule CC5 puts it for a security-flavoured capstone: the attack is run only against the course's own app, in process, on synthetic data, and never against a real target (tech-docs/012).
- Because the course now has `learning/overview.md`, Start no longer falls back to the top-level overview: the shape-3 Start-fallback E2E binding is rebound (tech-docs/005).
- Keep the filenames that `capstone-solid-core` and the path manifests name; the course slug and the habit-tracker subject do not change.
- Plan 12 restructured `capstone-solid-core` first, and its `relies-on` table has a row that names this course as the starting app. In CP-0, read that row. In CP-6, confirm the rewritten app still has every concept the row names. If it does not, edit the row and the paragraph that restates it in the same commit.

## Harness mode and toolchain

- **Harness mode**: Real mode: `python` with a hash-locked FastAPI and Hypothesis stack; SQLite; in-process requests; fixed Hypothesis seed (SP10).
- **Toolchain ids**: python (fastapi, pydantic, hypothesis, argon2-cffi, pytest from a hash-locked lockfile).
- **Toolchain additions** (budget-gated, default NO-GO; [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-cost.md)): none.
- **Phase 1 spikes**: SP3, SP4, SP10, SP11 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: at most 6 (install and `uvicorn` launch lines).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 4.0 s per container invocation × 2 executions × 58 runs (45 examples + 2 × 5 kata runs + 3 capstone runs) ≈ 7.7 minutes.

## Size class and sequencing

- **Size class L** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 13,246 (the larger of the word gap and the drilling shortfall), new unit folders 50.
- **Estimated effort** (size, not time): class L; agent packets: authoring split by learning page (one packet per page), then one packet per remaining defect group.
- **Wave 11**, slot 3. Makers and fixers for this course: `apps-ayokoding-www-annotated-concept-maker` for authoring gaps, `tutorial-annotated-concept-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 adds `just-enough-python`, `just-enough-bash`, `data-structures-and-algorithms-essentials`, `object-oriented-programming-essentials`, `sql-essentials`, `backend-essentials`, `networking-essentials`, `software-testing` (the list above is the result).
- In-plan prerequisites are audited first: `security-essentials` in wave 2, `backend-essentials` in wave 1.
- Prerequisites outside this plan (unchanged here): `just-enough-python`, `just-enough-bash`, `data-structures-and-algorithms-essentials`, `object-oriented-programming-essentials`, `sql-essentials`, `networking-essentials`, `software-testing`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-path-and-capstone-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `capstone-first-working-software` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-annotated-concept-checker` over the course folder; `AUDIT_PROBE=capstone-first-working-software:capstone` with `UNIT-NODE tests/unit/be-steps/audited-course-completion.steps.ts` to record the scenarios the course fails; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (L): authoring split by learning page (one packet per page), then one packet per remaining defect group. Classes: X1, X2, X3, X4, X11, X12, X13, X15, X16, X18, X19, X20.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `capstone-first-working-software`; a course that fires is fixed, never baselined.
- [ ] Units: 45 example units, 5 kata units, 1 capstone unit (create 50, convert 1); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 6 (install and `uvicorn` launch lines).
- [ ] Safe lab: the safety scan (S1 to S7, SL1 to SL4, tech-docs/012) finds no unexplained hit in `learning/capstone/code`, the example units, and the katas; the reserved-address scan is clean; the `## Safety boundary` section is present in the course `overview.md`; the Content Quality Gate is told to read it.
- [ ] CP-3 `tutorial-annotated-concept-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `capstone-first-working-software` exits 0 (at most 2 repair cycles); `EX-COVERAGE` shows `covered: true` for `capstone-first-working-software`.
- [ ] CP-6 The registry row for `capstone-first-working-software` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit capstone-first-working-software course` with explicit paths only: the course folder with its `_index.md`, the registry row, the slug added to plan 08's capstone content-shape constant (after the probe is GREEN; `UNIT-NODE tests/unit/be-steps/capstone-course-completion.steps.ts` stays green), and the shape-3 Start-button exemption (the `@e2e-exempt` tag and comment in `course-landing-header.feature`, and the removal of the E2E step bound to this course) because no course without a `learning/` folder remains; if Phase 0 or this wave finds another course without one, rebind the E2E step to it instead (tech-docs/005).
- [ ] CP-7 Capstone relies-on: `rtk git grep -n "capstone-first-working-software" -- 'apps/ayokoding-www/content/en/learn/courses/capstone-*/learning/overview.md'` shows no capstone row for this course today; if the search finds one at execution time, handle it as in the other courses and note it in the ledger.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/capstone-first-working-software/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · course-as-taught** — no numbered example headings of the mode's form exist today (the pages use tables, `ex-NN` headings, or prose); CP-1 lists the concepts from the pages.

## Lineage

- Builds on: `security-essentials`, `just-enough-python`, `just-enough-bash`, `data-structures-and-algorithms-essentials`, `object-oriented-programming-essentials`, `sql-essentials`, `backend-essentials`, `networking-essentials`, `software-testing`. Required by (in this plan): none.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 12 of 121 in the manifest as specified by plan 02 (read 2026-10-09), phase `first-working-software`, role `core`; this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 110 of 114 in the manifest as specified by plan 02 (read 2026-10-09), phase `integrative-capstones`, role `extension`; this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 111 of 116 in the manifest as specified by plan 02 (read 2026-10-09), phase `integrative-capstones`, role `extension`; this plan changes no path membership or order.
