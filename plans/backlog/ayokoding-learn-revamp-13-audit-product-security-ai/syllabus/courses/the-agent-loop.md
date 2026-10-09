# The Agent Loop (By Example)

**Course ID**: `the-agent-loop` · **Format**: By Example · **Family**: ai-engineering.

**Scope note**: Audits and fixes the existing `the-agent-loop` course to the series definition of done and brings every example green in plan 05's code harness. The subject, slug, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course (except a capstone's `relies-on` row, CP-7).

**Short summary**: The agent loop from first principles: a model reply, a tool call, a result, a stop rule, and the guards that keep the loop bounded.

## Why this exists · the big idea

- **The problem before the solution**: 1,244 words for 48 programs of about 6 lines each: three table-only pages, no example headings, no fences, no anchors, no "Why It Matters", and the lowest word count in the plan.
- **Keep-this-if-you-forget-everything**: An agent is a `while` loop with a stop rule; the whole course is that loop, built once with a fake model and then made safe.

## Prerequisites

- **Prior courses**: `agentic-ai` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example. **Reason**: By Example, as plan 03 records it: 75 or more typed Python programs, each a few lines around a fake model.
  A maker may not switch modes except where the reason above says so; a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user.
- **Mode-convention fit**: today the course fits the convention: `overview.md` plus beginner, intermediate, and advanced pages. Example headings per page today: no page with numbered example headings.
- **Wave**: 5 (slot 1); **size class**: XL (words to write 26,756, new unit folders 36); **expected defect classes**: 9 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                           | Target                                                                                                                                                               | Work                            |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 1,244                                                                                                                                                                                     | at least 28,000                                                                                                                                                      | 26,756 to write                 |
| Examples as `### Example N: Title`                            | 0                                                                                                                                                                                         | at least 75, numbered 1 to N without gaps                                                                                                                            | 75 to add                       |
| Mermaid diagrams                                              | 0                                                                                                                                                                                         | 30 to 50 (adapter band)                                                                                                                                              | 30 to add                       |
| "Why It Matters" (50 to 100 words each)                       | not measurable: no numbered example headings of the mode's form exist today                                                                                                               | one per example, 50 to 100 words                                                                                                                                     | all new                         |
| Annotation density (comment lines per code line)              | not measurable: no code-bearing examples of the mode's form today                                                                                                                         | 1.0 to 2.25 on every code-bearing example                                                                                                                            | all new                         |
| Code fences                                                   | 0 code fences in the lessons; 0 unanchored                                                                                                                                                | every code fence anchored or marked as an illustration (budget: 4 at most; hosted API calls)                                                                         | 0 to anchor                     |
| Lesson-to-file anchors (plan 05's method)                     | 0 path anchors (match 0, mismatch 0, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                                                      | every anchor matches its file                                                                                                                                        | 0 to repair                     |
| Output blocks                                                 | 0 output fences; 0 unanchored                                                                                                                                                             | every `**Output**` block anchored to an expected file                                                                                                                | 0 to anchor                     |
| Harness units                                                 | 48 example folders, 0 kata folders, 48 code files, 0 `run.yaml`                                                                                                                           | 75 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                              | create 36, convert 48           |
| Drilling page                                                 | 104 words; 1 of 5 standard `##` sections exact; 0 `<details>` blocks; headings found: Recall Q&A, Scenario judgment, Hands-on implementation, Automaticity checklist, Extension challenge | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) | 4,896 words short; fix sections |
| Katas                                                         | 0 kata folders                                                                                                                                                                            | at least 8 as `before`/`after` units                                                                                                                                 | 8                               |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                    | unchanged, except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                           | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X1** 48 code files (48 example folders, 0 kata folders, 0 test-like files); none has a `run.yaml`.
- **X5** The three level pages are tables of links (3,100 to 3,600 bytes each): no explanation, diagram, fence, output, or takeaway for any example.
- **X7** The overview has no `## Examples by Level` heading (CRITICAL under the adapter).
- **X11** Drilling: 104 words (4,896 short of 5,000); 1 of 5 exact `##` sections; 0 kata folders against 8.
- **X13** 1,244 words against a floor of 28,000; 26,756 to write.
- **X15** The programs touch no clock, network, or random source (scan found none); the existing `FakeModel` pattern is kept and becomes the shared convention.
- **X18** No version or vendor claim today; any added claim about provider APIs is dated (policy AI7).
- **X19** 48 example folders exist against 75 example units: 27 to create.
- **X20** 0 Mermaid diagrams against the band of 30 to 50.

## Fixes and design

- Write every example (about 26,000 words): explanation, diagram, the program with annotations, recorded output, takeaway, and a "Why It Matters" block of 50 to 100 words; add 27 examples to reach 75.
- Convert the 48 folders to units, rename each `example.py` to the lesson's name where the anchor needs it, and add 8 kata units, the capstone unit, and the "Examples by Level" section.
- Write the drilling page (104 words today) at 5,000 words and the diagrams (0 today) to the band.

## Harness mode and toolchain

- **Harness mode**: Real mode: `python`, standard library only.
- **Toolchain ids**: python.
- **Toolchain additions** (budget-gated, default NO-GO; [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-cost.md)): none.
- **Fixtures** (AI course): Deterministic fixtures only (policy AI1 to AI6 in [tech-docs/011](../../tech-docs/011-ai-fixtures-and-sourcing-policy.md)): a scripted `FakeModel`, recorded responses stored in the unit folder, no API key or provider variable read, no network, fixed seeds, and a counter clock. A call to a hosted model appears only as a marked illustration with a dated Reference.
- **Phase 1 spikes**: SP12 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: at most 4 (hosted API calls).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 1.5 s per container invocation × 2 executions × 94 runs (75 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 4.7 minutes.

## Size class and sequencing

- **Size class XL** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 26,756 (the larger of the word gap and the drilling shortfall), new unit folders 36.
- **Estimated effort** (size, not time): class XL; agent packets: authoring split by learning page and again by blocks of at most 15 examples, then one packet per remaining defect group; the course folder is committed only when every unit exists.
- **Wave 5**, slot 1. Makers and fixers for this course: `apps-ayokoding-www-by-example-maker` for authoring gaps, `tutorial-by-example-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `agent-context-and-memory`, `agent-permissions-and-sandboxing`, `agent-tools-and-mcp` (each is audited in a later wave, so this course is final first).

## Prerequisite re-check

- Plan 02 keeps the current list (the list above is the result).
- In-plan prerequisites are audited first: `agentic-ai` in wave 4.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-path-and-capstone-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `the-agent-loop` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder; `AUDIT_PROBE=the-agent-loop:by-example` with `UNIT-NODE tests/unit/be-steps/audited-course-completion.steps.ts` to record the scenarios the course fails; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (XL): authoring split by learning page and again by blocks of at most 15 examples, then one packet per remaining defect group; the course folder is committed only when every unit exists. Classes: X1, X5, X7, X11, X13, X15, X18, X19, X20.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `the-agent-loop`; a course that fires is fixed, never baselined.
- [ ] Units: 75 example units, 8 kata units, 1 capstone unit (create 36, convert 48); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 4 (hosted API calls).
- [ ] AI fixtures: every unit uses the shared `FakeModel` and recorded responses (AI1 to AI6); `rtk git grep -n -E "api_key|API_KEY|openai|anthropic|requests|urllib|socket" -- <course>/learning/code <course>/drilling/code <course>/learning/capstone/code` shows no unexplained hit; every product, model, protocol, or price claim has a dated Reference within 30 days of the commit (AI7).
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `the-agent-loop` exits 0 (at most 2 repair cycles); `EX-COVERAGE` shows `covered: true` for `the-agent-loop`.
- [ ] CP-6 The registry row for `the-agent-loop` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit the-agent-loop course` with explicit paths only: the course folder with its `_index.md`, the registry row.
- [ ] CP-7 Capstone relies-on: `rtk git grep -n "the-agent-loop" -- 'apps/ayokoding-www/content/en/learn/courses/capstone-*/learning/overview.md'` lists `capstone-build-your-own-coding-agent`, `capstone-build-your-own-pentest-engine`; read each `## What this course relies on` row for this course and confirm the audited course still teaches the named concepts at definition level; edit the row and the capstone paragraph that restates it in the same commit if not. The content-shape test (CL1, CL4) must stay green.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/the-agent-loop/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Claims about products, models, protocols, prices, and limits are not facts of this brief: the maker re-verifies each one against its primary source on the day it writes it and records the value and date in the ledger (accuracy rules A1 to A7 and policy AI7).
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–16 (16): from "Model response" to "Minimal agent".
- **co-02 · intermediate** — examples 17–34 (18): from "Multi-tool registry" to "Multi-step tool task".
- **co-03 · advanced** — examples 35–48 (14): from "File editing agent" to "Mini coding agent".

## Lineage

- Builds on: `agentic-ai`. Required by (in this plan): `agent-context-and-memory`, `agent-permissions-and-sandboxing`, `agent-tools-and-mcp`.
- Listed as a prerequisite by plan 08's capstones: `capstone-build-your-own-coding-agent`, `capstone-build-your-own-pentest-engine` (read from plan 08's briefs on 2026-10-09).

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 106 of 121 in the manifest as specified by plan 02 (read 2026-10-09), phase `ai-and-agents`, role `extension`; this plan changes no path membership or order.
- `careers/immediately-effective/ai-engineer` — position 7 of 28 in the manifest as specified by plan 08 (read 2026-10-09), phase `agents`, role `core`; this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 103 of 114 in the manifest as specified by plan 02 (read 2026-10-09), phase `ai-and-agents`, role `extension`; this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 104 of 116 in the manifest as specified by plan 02 (read 2026-10-09), phase `ai-and-agents`, role `extension`; this plan changes no path membership or order.
- `careers/immediately-effective/ai-engineer` — a prerequisite change here also changes that manifest, its `assumes`, and its tests in the same PR (plan 02's rule R6, plan 08's duty).
