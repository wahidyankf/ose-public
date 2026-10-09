# Take-Home & Live Coding (By Example)

**Course ID**: `take-home-and-live-coding` · **Format**: By Example · **Family**: interview-preparation.

**Scope note**: Audits and fixes the existing `take-home-and-live-coding` course to the series definition of done and brings every example green in plan 05's code harness. The subject, slug, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course (except a capstone's `relies-on` row, CP-7).

**Short summary**: Take-home exercises and live coding sessions: scoping, structure, testing, narration, recovery from being stuck, and review.

## Why this exists · the big idea

- **The problem before the solution**: 5,251 words in three example pages of about 800 words each, no worked-example headings, two Python files in a nonstandard folder, and a drilling page of 749 words.
- **Keep-this-if-you-forget-everything**: A take-home is graded on judgement shown in small decisions; each example shows one decision, in code and in the README that explains it.

## Prerequisites

- **Prior courses**: `just-enough-python`, `just-enough-bash`, `version-control-and-git`, `coding-interview` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example. **Reason**: By Example, as plan 03 records it: 75 or more small programs, tests, and README excerpts that show the decisions an evaluator reads.
  A maker may not switch modes except where the reason above says so; a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user.
- **Mode-convention fit**: today the course does not yet fit the convention (`overview.md`, `beginner.md`, `intermediate.md`, `advanced.md` with `### Example N: Title` headings). Example headings per page today: no page with numbered example headings.
- **Wave**: 7 (slot 1); **size class**: XL (words to write 22,749, new unit folders 84); **expected defect classes**: 10 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                               | Target                                                                                                                                                               | Work                            |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 5,251                                                                                                                                                                                         | at least 28,000                                                                                                                                                      | 22,749 to write                 |
| Examples as `### Example N: Title`                            | 0                                                                                                                                                                                             | at least 75, numbered 1 to N without gaps                                                                                                                            | 75 to add                       |
| Mermaid diagrams                                              | 0                                                                                                                                                                                             | 30 to 50 (adapter band)                                                                                                                                              | 30 to add                       |
| "Why It Matters" (50 to 100 words each)                       | not measurable: no numbered example headings of the mode's form exist today                                                                                                                   | one per example, 50 to 100 words                                                                                                                                     | all new                         |
| Annotation density (comment lines per code line)              | not measurable: no code-bearing examples of the mode's form today                                                                                                                             | 1.0 to 2.25 on every code-bearing example                                                                                                                            | all new                         |
| Code fences                                                   | 2 code fences in the lessons; 2 unanchored                                                                                                                                                    | every code fence anchored or marked as an illustration (budget: 4 at most; editor screens and video-call settings)                                                   | 2 to anchor                     |
| Lesson-to-file anchors (plan 05's method)                     | 0 path anchors (match 0, mismatch 0, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                                                          | every anchor matches its file                                                                                                                                        | 0 to repair                     |
| Output blocks                                                 | 0 output fences; 0 unanchored                                                                                                                                                                 | every `**Output**` block anchored to an expected file                                                                                                                | 0 to anchor                     |
| Harness units                                                 | 0 example folders, 0 kata folders, 2 code files, 0 `run.yaml`                                                                                                                                 | 75 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                              | create 84, convert 0            |
| Drilling page                                                 | 749 words; 1 of 5 standard `##` sections exact; 6 `<details>` blocks; headings found: Recall Q&A, Calculation practice, Scenario judgment, Design exercise, Code kata, Automaticity checklist | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) | 4,251 words short; fix sections |
| Katas                                                         | 0 kata folders                                                                                                                                                                                | at least 8 as `before`/`after` units                                                                                                                                 | 8                               |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                        | unchanged, except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                           | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X1** 2 code files (0 example folders, 0 kata folders, 1 test-like files); none has a `run.yaml`.
- **X2** The only code sits in `learning/capstone/live/code/`, a nested code folder that the layout rules do not allow; it moves to `learning/capstone/code/`.
- **X3** 2 of 2 code fences are neither anchored nor marked as illustrations.
- **X5** The three pages (`take-home-examples`, `live-coding-examples`, `review-and-recovery-examples`) hold no `### Example N` headings and 2 fences between them.
- **X7** The overview has no `## Examples by Level` heading (CRITICAL under the adapter).
- **X11** Drilling: 749 words (4,251 short of 5,000); 1 of 5 exact `##` sections; 0 kata folders against 8.
- **X13** 5,251 words against a floor of 28,000; 22,749 to write.
- **X18** The course names Python 3.13 1 times; the catalog pin is 3.14.8, so the text and recorded output are aligned to the pin.
- **X19** 2 Python files exist for 75 examples; 84 unit folders are missing.
- **X20** 0 Mermaid diagrams against the band of 30 to 50.

## Fixes and design

- Write the 75 examples in the By Example shape: a decision, the code or README text that shows it, the output, a takeaway, and a "Why It Matters" block.
- Create 84 units under `python` and `shell` (one toolchain per unit); live-coding transcripts are text files a script replays at fixed times.
- Move the capstone code to `learning/capstone/code/`, write the drilling page (749 words today) at 5,000 words with the five exact headings (the sixth "Code kata" heading is renamed), and add diagrams (0 today) to the band.

## Harness mode and toolchain

- **Harness mode**: Real mode: `python`, standard library only; `shell` for command lines.
- **Toolchain ids**: python; shell.
- **Toolchain additions** (budget-gated, default NO-GO; [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-cost.md)): none.
- **Illustration budget**: at most 4 (editor screens and video-call settings).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 2.0 s per container invocation × 2 executions × 94 runs (75 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 6.3 minutes.

## Size class and sequencing

- **Size class XL** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 22,749 (the larger of the word gap and the drilling shortfall), new unit folders 84.
- **Estimated effort** (size, not time): class XL; agent packets: authoring split by learning page and again by blocks of at most 15 examples, then one packet per remaining defect group; the course folder is committed only when every unit exists.
- **Wave 7**, slot 1. Makers and fixers for this course: `apps-ayokoding-www-by-example-maker` for authoring gaps, `tutorial-by-example-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `capstone-interview-loop` (each is audited in a later wave, so this course is final first).

## Prerequisite re-check

- Plan 02 keeps the current list (the list above is the result).
- In-plan prerequisites are audited first: `coding-interview` in wave 1.
- Prerequisites outside this plan (unchanged here): `just-enough-python`, `just-enough-bash`, `version-control-and-git`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-path-and-capstone-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `take-home-and-live-coding` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder; `AUDIT_PROBE=take-home-and-live-coding:by-example` with `UNIT-NODE tests/unit/be-steps/audited-course-completion.steps.ts` to record the scenarios the course fails; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (XL): authoring split by learning page and again by blocks of at most 15 examples, then one packet per remaining defect group; the course folder is committed only when every unit exists. Classes: X1, X2, X3, X5, X7, X11, X13, X18, X19, X20.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `take-home-and-live-coding`; a course that fires is fixed, never baselined.
- [ ] Units: 75 example units, 8 kata units, 1 capstone unit (create 84, convert 0); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 4 (editor screens and video-call settings).
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `take-home-and-live-coding` exits 0 (at most 2 repair cycles); `EX-COVERAGE` shows `covered: true` for `take-home-and-live-coding`.
- [ ] CP-6 The registry row for `take-home-and-live-coding` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit take-home-and-live-coding course` with explicit paths only: the course folder with its `_index.md`, the registry row.
- [ ] CP-7 Capstone relies-on: `rtk git grep -n "take-home-and-live-coding" -- 'apps/ayokoding-www/content/en/learn/courses/capstone-*/learning/overview.md'` shows no capstone row for this course today; if the search finds one at execution time, handle it as in the other courses and note it in the ledger.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/take-home-and-live-coding/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · course-as-taught** — no numbered example headings of the mode's form exist today (the pages use tables, `ex-NN` headings, or prose); CP-1 lists the concepts from the pages.

## Lineage

- Builds on: `just-enough-python`, `just-enough-bash`, `version-control-and-git`, `coding-interview`. Required by (in this plan): `capstone-interview-loop`.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 114 of 121 in the manifest as specified by plan 02 (read 2026-10-09), phase `interview-preparation`, role `extension`; this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 10 of 116 in the manifest as specified by plan 02 (read 2026-10-09), phase `interview-skills`, role `core`; this plan changes no path membership or order.
