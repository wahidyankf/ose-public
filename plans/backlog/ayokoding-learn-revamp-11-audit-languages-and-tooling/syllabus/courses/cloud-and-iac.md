# Cloud and IaC (Annotated Concept)

**Course ID**: `cloud-and-iac` · **Format**: Annotated Concept · **Family**: infrastructure-and-operations.

**Scope note**: Audits and fixes the existing `cloud-and-iac` course to the series definition of done and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. The neighbouring courses `just-enough-bash`, `backend-essentials`, `containers-and-orchestration` keep their own scope. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course.

**Short summary**: Cloud as remotely operated capabilities and infrastructure as code: providers and resources, state, plan and apply, modules, environments, secrets, drift, and policy, using OpenTofu-compatible configuration against LocalStack and a local backend.

## Why this exists · the big idea

- **The problem before the solution**: The text says Terraform 88 times and OpenTofu 3 while the harness validates with OpenTofu, and only 22 of 53 examples carry code.
- **Keep-this-if-you-forget-everything**: Infrastructure as code is reviewed before it is applied; every configuration validates offline.

## Prerequisites

- **Prior courses**: `just-enough-bash`, `backend-essentials`, `containers-and-orchestration` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: Annotated Concept (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Annotated Concept: 53 worked examples already compare resource, state, plan, and module designs; roughly half are annotated artifacts rather than programs.
- **Wave**: 9 (slot 3); **size class**: L (words to write 13,358, new unit folders 11); **expected defect classes**: 7 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                 | Target                                                                                                                                                                                   | Work                            |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 8,642                                                                                                                                                                           | at least 22,000                                                                                                                                                                          | 13,358 to write                 |
| Examples as `### Worked Example N: Title`                     | 53                                                                                                                                                                              | at least 45, numbered 1 to N without gaps                                                                                                                                                | none                            |
| Mermaid diagrams                                              | 6                                                                                                                                                                               | at least 10 (this plan's target)                                                                                                                                                         | 4 to add                        |
| "Why It Matters" (50 to 100 words each)                       | 53 of 53 present; 48 under 50 words; 0 over 100; median 45 words                                                                                                                | one per example, 50 to 100 words                                                                                                                                                         | 48 to write or fix              |
| Annotation density (comment lines per code line)              | median 1.0; 7 examples below 1.0; 2 above 2.25 (of 22 code-bearing)                                                                                                             | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 9 to fix                        |
| Code fences                                                   | 32 fences; 25 code fences unanchored                                                                                                                                            | every code fence anchored or marked as an illustration (budget: at most 6 fences (localstack and apply lines))                                                                           | 25 to anchor                    |
| Lesson-to-file anchors (plan 05's method)                     | 0 path anchors (match 0, mismatch 0, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                                            | every anchor matches its file                                                                                                                                                            | 0 to repair                     |
| Output blocks                                                 | 0 output fences; 0 unanchored                                                                                                                                                   | every `**Output**` block anchored to an expected file                                                                                                                                    | 0 to anchor                     |
| Harness units                                                 | 25 example folders, 0 kata folders, 30 code files, 0 `run.yaml`                                                                                                                 | 30 example units, 5 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | create 11, convert 25           |
| Drilling page                                                 | 441 words; 4 of 5 standard `##` sections exact; 8 `<details>` blocks; headings found: Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 4,559 words short; fix sections |
| Katas                                                         | 0 kata folders                                                                                                                                                                  | at least 5 as `before`/`after` units                                                                                                                                                     | 5                               |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                          | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                                                | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X3** 25 of 32 fences are unanchored; no anchors exist.
- **X1** 30 files (12 `.tf`, 9 `.sh`) in 25 example folders and a capstone folder, no `run.yaml`; 0 kata units.
- **X8** 48 of 53 "Why It Matters" blocks are under 50 words (median 45).
- **X9** 7 examples are under the density floor and 2 are over the ceiling.
- **X11** Drilling is 441 words; X13 words 8,642 against 22,000, a gap of 13,358.
- **X20** 22 of 53 worked examples are code-bearing; the mode needs at least 27.
- **X18** The text names Terraform in 88 places and OpenTofu in 3; plan 05 validates with OpenTofu.
- **X20** 6 Mermaid diagrams against this plan's target of 10 for Annotated Concept (at least one per page).

## Fixes and design

- State the Terraform and OpenTofu relationship once and use `tofu` commands in the lessons (decision D3 of plan 05); validate every configuration with `tofu validate` (static, reason `cloud`), with providers baked from the course's `.terraform.lock.hcl`.
- LocalStack needs Docker and cannot run in the harness: LocalStack steps are launch illustrations and the configuration they apply is validated statically. Real-mode units use the `local` and `random` providers, which need no network.
- Add at least 5 code-bearing worked examples, lengthen blocks, write drilling and 5 katas.
- Provider cost: the AWS provider binary is large. Keep the provider set to at most two, record the image size in Phase 1 (spike SP12), and share one lockfile across units.

## Harness mode and toolchain

- **Harness mode**: Static mode (reason `cloud`) with `opentofu` for cloud-provider configuration, and real mode with `opentofu` and the local providers.
- **Toolchain ids**: opentofu (static, reason cloud) and shell/python models.
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP12 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: At most 6 fences (LocalStack and apply lines).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 6.0 s per container invocation × 2 executions × 43 runs (30 examples + 2 × 5 kata runs + 3 capstone runs) ≈ 8.6 minutes.

## Size class and sequencing

- **Size class L** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 13,358 (the larger of the word gap and the drilling shortfall), new unit folders 11.
- **Agent packets**: authoring split by learning page (one packet per page), then one packet per remaining defect group.
- **Wave 9**, slot 3. Makers and fixers for this course: `apps-ayokoding-www-annotated-concept-maker` for authoring gaps, `tutorial-annotated-concept-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `bare-metal-virtualization`, `platform-engineering-and-devex` (each is audited in a later wave, so this course is final first).

## Prerequisite re-check

- Plan 02 result: Kept; `containers-and-orchestration` is audited first (wave 7).
- In-plan prerequisites are audited first: `just-enough-bash` in wave 1, `containers-and-orchestration` in wave 7.
- Prerequisites outside this plan (unchanged here): `backend-essentials`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-core-and-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `cloud-and-iac` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-annotated-concept-checker` over the course folder; compare its findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (L): authoring split by learning page (one packet per page), then one packet per remaining defect group. Classes: X1, X3, X8, X9, X11, X18, X20.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `cloud-and-iac`; a course that fires is fixed, never baselined.
- [ ] Units: 30 example units, 5 kata units, 1 capstone unit (create 11, convert 25); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 6 fences (localstack and apply lines).
- [ ] CP-3 `tutorial-annotated-concept-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `cloud-and-iac` exits 0 (at most 2 repair cycles).
- [ ] CP-6 The registry row for `cloud-and-iac` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit cloud-and-iac course` with explicit paths only: the course folder with its `_index.md`, the registry row.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/cloud-and-iac/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Plan 05's survey (2026-10-09) counted Terraform in 29 files and OpenTofu in 5; this plan's own count of mentions is 88 and 3. Plan 05's decision D3 makes OpenTofu the validator.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–18 (18): from "NIST cloud characteristics" to "Destroy managed objects".
- **co-02 · intermediate** — examples 19–38 (20): from "Variables and outputs" to "Idempotent configuration task".
- **co-03 · advanced** — examples 39–53 (15): from "Serverless function" to "Capstone readiness review".

## Lineage

- Follows Containers and Orchestration; prerequisite of Bare-Metal Virtualization and Platform Engineering.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 42 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 37 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 35 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
