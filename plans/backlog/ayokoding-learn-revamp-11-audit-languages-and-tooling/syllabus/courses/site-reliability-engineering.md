# Site Reliability Engineering (Annotated Concept)

**Course ID**: `site-reliability-engineering` · **Format**: Annotated Concept · **Family**: infrastructure-and-operations.

**Scope note**: Audits and fixes the existing `site-reliability-engineering` course to the series definition of done and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. The neighbouring courses `containers-and-orchestration`, `system-design` keep their own scope. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course.

**Short summary**: Reliability as an engineering and product decision: observing user experience, SLIs and SLOs, error budgets, alerting, incident response, blameless learning, and capacity, with the fictional Harbor Checkout service.

## Why this exists · the big idea

- **The problem before the solution**: The overview promises 52 scenarios, but the three learning pages hold about 9 sections in 4,522 words.
- **Keep-this-if-you-forget-everything**: Reliability is a decision about user experience measured by objectives; each idea is a small simulation with fixed seeds.

## Prerequisites

- **Prior courses**: `containers-and-orchestration`, `system-design` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: Annotated Concept (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Annotated Concept: the course uses a fictional service (Harbor Checkout) and small typed Python mechanisms; the overview already declares the mode. Reasoning about objectives and budgets is clearer as annotated artifacts than as programs.
- **Wave**: 8 (slot 3); **size class**: L (words to write 17,478, new unit folders 35); **expected defect classes**: 5 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                         | Target                                                                                                                                                                                   | Work                            |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 4,522                                                                                                                                                                   | at least 22,000                                                                                                                                                                          | 17,478 to write                 |
| Examples as `### Worked Example N: Title`                     | 0                                                                                                                                                                       | at least 45, numbered 1 to N without gaps                                                                                                                                                | 45 to add                       |
| Mermaid diagrams                                              | 0                                                                                                                                                                       | at least 10 (this plan's target)                                                                                                                                                         | 10 to add                       |
| "Why It Matters" (50 to 100 words each)                       | not measurable: no numbered example headings of the mode's form exist today                                                                                             | one per example, 50 to 100 words                                                                                                                                                         | all new                         |
| Annotation density (comment lines per code line)              | not measurable: no code-bearing examples of the mode's form today                                                                                                       | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | all new                         |
| Code fences                                                   | 0 fences; 0 code fences unanchored                                                                                                                                      | every code fence anchored or marked as an illustration (budget: at most 2 fences)                                                                                                        | 0 to anchor                     |
| Lesson-to-file anchors (plan 05's method)                     | 0 path anchors (match 0, mismatch 0, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                                    | every anchor matches its file                                                                                                                                                            | 0 to repair                     |
| Output blocks                                                 | 0 output fences; 0 unanchored                                                                                                                                           | every `**Output**` block anchored to an expected file                                                                                                                                    | 0 to anchor                     |
| Harness units                                                 | 0 example folders, 0 kata folders, 1 code file, 0 `run.yaml`                                                                                                            | 30 example units, 5 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | create 35, convert 1            |
| Drilling page                                                 | 710 words; 1 of 5 standard `##` sections exact; 6 `<details>` blocks; headings found: Recall Q&A, Scenario judgment, Design exercise, Code kata, Automaticity checklist | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 4,290 words short; fix sections |
| Katas                                                         | 0 kata folders                                                                                                                                                          | at least 5 as `before`/`after` units                                                                                                                                                     | 5                               |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                  | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                                                | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X20** The overview promises 52 scenarios (`ex-01` to `ex-52`), but the three learning pages hold about 9 sections and no `### Worked Example N` headings; 3 "Why It Matters" tags; the promised examples do not exist.
- **X13** Words 4,522 against 22,000, a gap of 17,478.
- **X1** One code file exists (a capstone simulator); no example units; 0 kata units (the drilling page names a single Code kata).
- **X11** Drilling is 710 words under nonstandard headings.
- **X18** The overview says "Annotated-concept course with small Python examples" and links `system-design`; the prerequisite `backend-at-scale` is removed by plan 02.
- **X20** No Mermaid diagram against this plan's target of 10 for Annotated Concept (at least one per page).

## Fixes and design

- Write at least 45 worked examples (the promise is 52) in `### Worked Example N: Title` form on the existing three pages: at least 27 are code-bearing units, simulations with a virtual clock and fixed seeds (plan 05's simulation convention, rules S1 to S9), and the rest annotated artifacts (an SLO document, an alert policy, a postmortem).
- Bring drilling to five standard sections and 5,000 words, 5 katas, and a capstone page with code.
- The error-budget (43.2 minutes at 99.9 percent over 30 days) and burn-rate figures (14.4, 6, 1) are also used by the plan 08 concurrency capstone; this course must not change them, and the cross-course search in plan 08 compares them.

## Harness mode and toolchain

- **Harness mode**: Real mode, `python`; simulation runs (`simulation: true`).
- **Toolchain ids**: python (typed, deterministic simulations).
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Illustration budget**: At most 2 fences.
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 2.0 s per container invocation × 2 executions × 44 runs (30 examples + 2 × 5 kata runs + 4 capstone runs) ≈ 2.9 minutes.

## Size class and sequencing

- **Size class L** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 17,478 (the larger of the word gap and the drilling shortfall), new unit folders 35.
- **Agent packets**: authoring split by learning page (one packet per page), then one packet per remaining defect group.
- **Wave 8**, slot 3. Makers and fixers for this course: `apps-ayokoding-www-annotated-concept-maker` for authoring gaps, `tutorial-annotated-concept-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 result: Plan 02 removes `backend-at-scale`; `containers-and-orchestration` is audited earlier in this plan (wave 7); `system-design` is outside.
- In-plan prerequisites are audited first: `containers-and-orchestration` in wave 7.
- Prerequisites outside this plan (unchanged here): `system-design`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-core-and-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `site-reliability-engineering` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-annotated-concept-checker` over the course folder; compare its findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (L): authoring split by learning page (one packet per page), then one packet per remaining defect group. Classes: X1, X11, X13, X18, X20.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `site-reliability-engineering`; a course that fires is fixed, never baselined.
- [ ] Units: 30 example units, 5 kata units, 1 capstone unit (create 35, convert 1); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 2 fences.
- [ ] CP-3 `tutorial-annotated-concept-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `site-reliability-engineering` exits 0 (at most 2 repair cycles).
- [ ] CP-6 The registry row for `site-reliability-engineering` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit site-reliability-engineering course` with explicit paths only: the course folder with its `_index.md`, the registry row.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/site-reliability-engineering/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- The 43.2-minute budget for a 99.9 percent objective over 30 days, and the 14.4, 6, and 1 burn rates, are the figures plan 08's concurrency capstone copies; this audit keeps them exactly (plan 08, tech-docs 004, 2026-10-09).
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · objectives-budgets-and-alerting** — service objectives, error budgets, and alerting; a topic page today with no numbered worked examples.
- **co-02 · operations-learning-and-capacity** — incident response, blameless learning, and capacity; a topic page today with no numbered worked examples.
- **co-03 · telemetry-and-service-signals** — telemetry and the signals of a healthy service; a topic page today with no numbered worked examples.
- **co-04 · harbor-checkout-capstone** — the capstone page, a postmortem page, and one capstone code file.

## Lineage

- Follows Containers and Orchestration; plan 08's concurrency capstone reuses its figures.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 106 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/ai-engineer` — position 10 of 26 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 104 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 108 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/ai-engineer` — an extension course after plan 08; not part of the core closure.
