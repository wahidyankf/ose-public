# Capstone · Interview Loop (Capstone (Annotated Concept, standard))

**Course ID**: `capstone-interview-loop` · **Format**: Capstone (Annotated Concept, standard) · **Family**: interview-preparation.

**Scope note**: Audits and fixes the existing `capstone-interview-loop` course to the series definition of done and brings every example green in plan 05's code harness. The subject, slug, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course (except a capstone's `relies-on` row, CP-7).

**Short summary**: Run a full mock interview loop for one candidate: a coding round, a take-home review, a design round, and a behavioral round, each scored with the same rubric.

## Why this exists · the big idea

- **The problem before the solution**: 2,266 words in 11 pages plus a root `code/` folder (6 Python files, 3 transcripts); the structure follows the rounds (`design/`, `behavioral/`, `code/`) rather than the capstone contract, with no `learning/` worked examples.
- **Keep-this-if-you-forget-everything**: A loop is four rounds and one rubric; the capstone is the proof that you can run and score each of them.

## Prerequisites

- **Prior courses**: `coding-interview`, `take-home-and-live-coding`, `system-design-interview`, `behavioral-and-leadership-interviews` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: Capstone (Annotated Concept, standard). **Reason**: Plan 08's capstone contract applies (Annotated Concept, standard sub-mode, declared in `learning/overview.md`): 45 worked examples, a rubric, a relies-on table, and a reference solution. The round transcripts are text; the coding round has runnable code.
  A maker may not switch modes except where the reason above says so; a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user.
- **Mode-convention fit**: today the course needs `learning/overview.md` with the mode declaration, worked-example pages, and `learning/capstone/` with its overview, rubric, and code (plan 08's capstone contract). Example headings per page today: no page with numbered example headings.
- **Wave**: 14 (slot 1); **size class**: XL (words to write 20,734, new unit folders 50); **expected defect classes**: 8 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                    | Target                                                                                                                                                               | Work                            |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 2,266                                                                                                                                                                              | at least 23,000                                                                                                                                                      | 20,734 to write                 |
| Examples as `### Worked Example N: Title`                     | 0                                                                                                                                                                                  | at least 45, numbered 1 to N without gaps                                                                                                                            | 45 to add                       |
| Mermaid diagrams                                              | 1                                                                                                                                                                                  | at least 10 (this plan's target)                                                                                                                                     | 9 to add                        |
| "Why It Matters" (50 to 100 words each)                       | not measurable: no numbered example headings of the mode's form exist today                                                                                                        | one per example, 50 to 100 words                                                                                                                                     | all new                         |
| Annotation density (comment lines per code line)              | not measurable: no code-bearing examples of the mode's form today                                                                                                                  | 1.0 to 2.25 on every code-bearing example                                                                                                                            | all new                         |
| Code fences                                                   | 2 code fences in the lessons; 2 unanchored                                                                                                                                         | every code fence anchored or marked as an illustration (budget: 4 at most; video-call and whiteboard tool screens)                                                   | 2 to anchor                     |
| Lesson-to-file anchors (plan 05's method)                     | 0 path anchors (match 0, mismatch 0, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                                               | every anchor matches its file                                                                                                                                        | 0 to repair                     |
| Output blocks                                                 | 0 output fences; 0 unanchored                                                                                                                                                      | every `**Output**` block anchored to an expected file                                                                                                                | 0 to anchor                     |
| Harness units                                                 | 0 example folders, 0 kata folders, 9 code files, 0 `run.yaml`                                                                                                                      | 45 example units, 5 kata units, 1 capstone unit, each with a `run.yaml`                                                                                              | create 50, convert 1            |
| Drilling page                                                 | 424 words; 1 of 5 standard `##` sections exact; 0 `<details>` blocks; headings found: Recall Q&A, Calculation practice, Scenario judgment, Design exercise, Automaticity checklist | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) | 4,576 words short; fix sections |
| Katas                                                         | 0 kata folders                                                                                                                                                                     | at least 5 as `before`/`after` units                                                                                                                                 | 5                               |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                             | unchanged, except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                           | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X1** 9 code files (0 example folders, 0 kata folders, 3 test-like files); none has a `run.yaml`.
- **X2** Code lives in a root `code/` folder (6 Python files, 3 `.md` files), and transcripts under `code/coding-round/` and `code/live/` are Markdown inside a code folder.
- **X3** 2 of 2 code fences are neither anchored nor marked as illustrations.
- **X11** Drilling: 424 words (4,576 short of 5,000); 1 of 5 exact `##` sections; 0 kata folders against 5.
- **X12** The capstone has no `learning/overview.md` mode declaration, no six-heading capstone page, no rubric table in the shape plan 08 requires, and no relies-on table.
- **X13** 2,266 words against a floor of 23,000; 20,734 to write.
- **X19** 9 files exist for 45 worked examples and 5 katas; 50 unit folders are missing.
- **X20** 1 Mermaid diagram against this plan's floor of 10.

## Fixes and design

- Build the course to plan 08's capstone contract: `learning/overview.md` with the mode declaration, 45 worked examples in four themes (coding, take-home, design, behavioral), the capstone page with its six headings, a scoresheet and rubric, 5 kata units, and the relies-on table for `coding-interview`, `take-home-and-live-coding`, `system-design-interview`, and `behavioral-and-leadership-interviews`.
- Move the code to `learning/capstone/code/` and write at least 27 code-bearing units under `python` (coding-round solutions and tests with `unittest`); design and behavioral worked examples are text.
- Keep the round names and the scoresheet that the learning-path pages reference; write the drilling page (424 words today) at 5,000 words, and diagrams to 10.

## Harness mode and toolchain

- **Harness mode**: Real mode: `python`, standard library only.
- **Toolchain ids**: python.
- **Toolchain additions** (budget-gated, default NO-GO; [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-cost.md)): none.
- **Illustration budget**: at most 4 (video-call and whiteboard tool screens).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 2.0 s per container invocation × 2 executions × 58 runs (45 examples + 2 × 5 kata runs + 3 capstone runs) ≈ 3.9 minutes.

## Size class and sequencing

- **Size class XL** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 20,734 (the larger of the word gap and the drilling shortfall), new unit folders 50.
- **Estimated effort** (size, not time): class XL; agent packets: authoring split by learning page and again by blocks of at most 15 examples, then one packet per remaining defect group; the course folder is committed only when every unit exists.
- **Wave 14**, slot 1. Makers and fixers for this course: `apps-ayokoding-www-annotated-concept-maker` for authoring gaps, `tutorial-annotated-concept-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 keeps the current list (the list above is the result).
- In-plan prerequisites are audited first: `coding-interview` in wave 1, `take-home-and-live-coding` in wave 7, `system-design-interview` in wave 5, `behavioral-and-leadership-interviews` in wave 3.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-path-and-capstone-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `capstone-interview-loop` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-annotated-concept-checker` over the course folder; `AUDIT_PROBE=capstone-interview-loop:capstone` with `UNIT-NODE tests/unit/be-steps/audited-course-completion.steps.ts` to record the scenarios the course fails; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (XL): authoring split by learning page and again by blocks of at most 15 examples, then one packet per remaining defect group; the course folder is committed only when every unit exists. Classes: X1, X2, X3, X11, X12, X13, X19, X20.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `capstone-interview-loop`; a course that fires is fixed, never baselined.
- [ ] Units: 45 example units, 5 kata units, 1 capstone unit (create 50, convert 1); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 4 (video-call and whiteboard tool screens).
- [ ] CP-3 `tutorial-annotated-concept-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `capstone-interview-loop` exits 0 (at most 2 repair cycles); `EX-COVERAGE` shows `covered: true` for `capstone-interview-loop`.
- [ ] CP-6 The registry row for `capstone-interview-loop` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit capstone-interview-loop course` with explicit paths only: the course folder with its `_index.md`, the registry row, and the slug added to plan 08's capstone content-shape constant (after the probe is GREEN; `UNIT-NODE tests/unit/be-steps/capstone-course-completion.steps.ts` stays green).
- [ ] CP-7 Capstone relies-on: `rtk git grep -n "capstone-interview-loop" -- 'apps/ayokoding-www/content/en/learn/courses/capstone-*/learning/overview.md'` shows no capstone row for this course today; if the search finds one at execution time, handle it as in the other courses and note it in the ledger.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/capstone-interview-loop/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · course-as-taught** — no numbered example headings of the mode's form exist today (the pages use tables, `ex-NN` headings, or prose); CP-1 lists the concepts from the pages.

## Lineage

- Builds on: `coding-interview`, `take-home-and-live-coding`, `system-design-interview`, `behavioral-and-leadership-interviews`. Required by (in this plan): none.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 117 of 121 in the manifest as specified by plan 02 (read 2026-10-09), phase `interview-preparation`, role `extension`; this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 13 of 116 in the manifest as specified by plan 02 (read 2026-10-09), phase `interview-capstone`, role `core`; this plan changes no path membership or order.
