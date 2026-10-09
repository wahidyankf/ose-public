# Platform Engineering and DevEx (Annotated Concept, no-code)

**Course ID**: `platform-engineering-and-devex` · **Format**: Annotated Concept, no-code · **Family**: infrastructure-and-operations.

**Scope note**: Audits and fixes the existing `platform-engineering-and-devex` course to the series definition of done and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. The neighbouring courses `containers-and-orchestration`, `cloud-and-iac`, `cicd-and-release-engineering` keep their own scope. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course.

**Short summary**: Platform engineering as an internal product: when a platform is justified, golden paths and self-service, escape hatches, adoption, and developer-experience metrics, taught with the fictional Harbor organization.

## Why this exists · the big idea

- **The problem before the solution**: The course has 7,719 words against an 18,000 floor, 586 words of drilling under nonstandard headings, and no scope sentence.
- **Keep-this-if-you-forget-everything**: A platform is a product with users; each scenario ends in a decision the reader can defend.

## Prerequisites

- **Prior courses**: `containers-and-orchestration`, `cloud-and-iac`, `cicd-and-release-engineering` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: Annotated Concept, no-code (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Annotated Concept, no-code sub-mode: a leadership course on a fictional organization (Harbor) with 26 `### Worked Scenario N` blocks and decision artifacts. The adapter assigns leadership topics to the no-code sub-mode.
- **Wave**: 11 (slot 1); **size class**: M (words to write 10,281, new unit folders 0); **expected defect classes**: 5 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                              | Target                                                                                                                                                                                   | Work                            |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 7,719                                                                                                                                                        | at least 18,000                                                                                                                                                                          | 10,281 to write                 |
| Examples as `### Worked Scenario N: Title`                    | 26                                                                                                                                                           | at least 20, numbered 1 to N without gaps                                                                                                                                                | none                            |
| Mermaid diagrams                                              | 0                                                                                                                                                            | at least 10 (this plan's target)                                                                                                                                                         | 10 to add                       |
| "Why It Matters" (50 to 100 words each)                       | the scenarios end with Key takeaway and Why It Matters blocks whose lengths the checker measures in CP-1                                                     | 50 to 100 words each                                                                                                                                                                     | measured in CP-1                |
| Harness units                                                 | no `code/` folder, no fences, no `run.yaml`                                                                                                                  | none: the course stays free of code and is "not applicable" in the coverage report                                                                                                       | none                            |
| Drilling page                                                 | 586 words; 1 of 5 standard `##` sections exact; 6 `<details>` blocks; headings found: Recall Q&A, Scenario judgment, Design exercise, Automaticity checklist | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 4,414 words short; fix sections |
| Katas                                                         | no kata folders                                                                                                                                              | five design exercises under `## Code katas`, with no code and no kata folder                                                                                                             | 5 exercises to write            |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                       | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                                                | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X13** Words 7,719 against the 18,000 no-code floor, a gap of 10,281.
- **X8** The scenarios end with Key takeaway and Why It Matters blocks whose lengths the gate checks (50 to 100 words).
- **X11** Drilling is 586 words with four standard-looking sections under nonstandard names (Scenario judgment, Design exercise, Automaticity checklist); the standard five are Recall Q&A, Applied problems, Code katas (five design exercises here), Self-check checklist, and Elaborative interrogation.
- **X12** The overview has no explicit scope or dependent-topics sentence; the capstone has three artifact pages and a Goal, Build order, Acceptance criteria, Done bar page.
- **X20** No Mermaid diagram against this plan's target of 10 (golden-path flows and an adoption funnel are the natural ones).
- Positive: 26 scenarios are inside the 20 to 30 band; no `code/` folder exists, which is right for this mode.

## Fixes and design

- Lengthen scenarios and decision artifacts to the part lengths of the no-code sub-mode, bring drilling to five standard sections and 5,000 words with five design exercises under `## Code katas`, add the scope and dependents sentence.
- Confirm no `code/` folder and no `run.yaml` exist after the edit (the course is "not applicable" in the coverage report).
- Harness: not applicable. The end-state gate records this course as not applicable in the coverage denominator, as plan 05 defines.

## Harness mode and toolchain

- **Harness mode**: Not applicable (no code).
- **Toolchain ids**: none (no code, no run.yaml).
- **Toolchain additions**: none; the course has no unit.
- **Illustration budget**: None.
- **CI cost**: none; the course has no unit.

## Size class and sequencing

- **Size class M** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 10,281 (the larger of the word gap and the drilling shortfall), new unit folders 0.
- **Agent packets**: one packet per defect group plus one authoring packet for the word gap.
- **Wave 11**, slot 1. Makers and fixers for this course: `apps-ayokoding-www-annotated-concept-maker` for authoring gaps and `tutorial-annotated-concept-fixer` for gate findings; no `swe-developer` packet is needed because the course has no code.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 result: Kept; all three are audited earlier in this plan (waves 7 and 9).
- In-plan prerequisites are audited first: `containers-and-orchestration` in wave 7, `cloud-and-iac` in wave 9, `cicd-and-release-engineering` in wave 9.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-core-and-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `platform-engineering-and-devex` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-annotated-concept-checker` over the course folder; compare its findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (M): one packet per defect group plus one authoring packet for the word gap. Classes: X8, X11, X12, X13, X20.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `platform-engineering-and-devex`; a course that fires is fixed, never baselined.
- [ ] CP-3 `tutorial-annotated-concept-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-VALIDATE` for the slug reports the course as not applicable (no code folder, no fence).
- [ ] CP-6 The registry row for `platform-engineering-and-devex` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit platform-engineering-and-devex course` with explicit paths only: the course folder with its `_index.md`, the registry row.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/platform-engineering-and-devex/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Harbor is a fictional organization; no real company, figure, or incident is cited as evidence, and the audit keeps it that way.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · platform-product** — examples 1–8 (8): from "Platform before pain" to "Platform versus ops silo".
- **co-02 · golden-paths** — examples 9–20 (12): from "Golden-path CI wiring" to "Internal-customer feedback".
- **co-03 · metrics-and-devex** — examples 21–26 (6): from "DORA baseline" to "DevEx friction survey".

## Lineage

- The leadership view of the infrastructure family.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 46 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 45 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 49 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
