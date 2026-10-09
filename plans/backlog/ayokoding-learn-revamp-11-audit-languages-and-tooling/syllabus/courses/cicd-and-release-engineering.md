# CI/CD and Release Engineering (By Example)

**Course ID**: `cicd-and-release-engineering` · **Format**: By Example · **Family**: infrastructure-and-operations.

**Scope note**: Audits and fixes the existing `cicd-and-release-engineering` course to the series definition of done and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. The neighbouring courses `version-control-and-git`, `containers-and-orchestration` keep their own scope. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course.

**Short summary**: A release pipeline as a chain of evidence: continuous integration and delivery, pipeline stages, trunk-based development, GitHub Actions workflows, artifacts and provenance, environments and approvals, rollouts, and release notes.

## Why this exists · the big idea

- **The problem before the solution**: All 83 workflow fences are unanchored, one comment is repeated 55 times, and drilling is 533 words.
- **Keep-this-if-you-forget-everything**: A release pipeline is a chain of evidence; each workflow is validated and each rule is checked by a small program.

## Prerequisites

- **Prior courses**: `version-control-and-git`, `containers-and-orchestration` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Eighty-three examples pair a GitHub Actions workflow with a typed Python verification. Each release-gate rule is something a reader can run and break.
- **Wave**: 9 (slot 2); **size class**: M (words to write 7,590, new unit folders 8); **expected defect classes**: 5 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                  | Target                                                                                                                                                                                   | Work                            |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 20,410                                                                                                                                                                           | at least 28,000                                                                                                                                                                          | 7,590 to write                  |
| Examples as `### Example N: Title`                            | 83                                                                                                                                                                               | at least 75, numbered 1 to N without gaps                                                                                                                                                | none                            |
| Mermaid diagrams                                              | 34                                                                                                                                                                               | 30 to 50 (adapter band)                                                                                                                                                                  | none                            |
| "Why It Matters" (50 to 100 words each)                       | 83 of 83 present; 0 under 50 words; 0 over 100; median 64 words                                                                                                                  | one per example, 50 to 100 words                                                                                                                                                         | 0 to write or fix               |
| Annotation density (comment lines per code line)              | median 1.0; 0 examples below 1.0; 0 above 2.25 (of 83 code-bearing)                                                                                                              | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 0 to fix                        |
| Code fences                                                   | 117 fences; 83 code fences unanchored                                                                                                                                            | every code fence anchored or marked as an illustration (budget: at most 8 fences)                                                                                                        | 83 to anchor                    |
| Lesson-to-file anchors (plan 05's method)                     | 0 path anchors (match 0, mismatch 0, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                                             | every anchor matches its file                                                                                                                                                            | 0 to repair                     |
| Output blocks                                                 | 0 output fences; 0 unanchored                                                                                                                                                    | every `**Output**` block anchored to an expected file                                                                                                                                    | 0 to anchor                     |
| Harness units                                                 | 83 example folders, 0 kata folders, 176 code files, 0 `run.yaml`                                                                                                                 | 83 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | create 8, convert 84            |
| Drilling page                                                 | 533 words; 1 of 5 standard `##` sections exact; 10 `<details>` blocks; headings found: Recall Q&A, Scenario Judgment, Hands-On Repetition, Automaticity Checklist, Why / Why Not | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 4,467 words short; fix sections |
| Katas                                                         | 0 kata folders                                                                                                                                                                   | at least 8 as `before`/`after` units                                                                                                                                                     | 8                               |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                           | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                                                | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X3** All 83 workflow fences are unanchored (117 fences in total); no anchors exist.
- **X1** 176 files (86 `.yml`, 84 `.py`) in 83 example folders and a capstone folder, no `run.yaml`; 0 kata units.
- **X14** The comment "=> dataclass gives each evidence record an explicit immutable ..." appears 55 times.
- **X11** Drilling is 533 words (five sections, one with a nonstandard heading); X13 words 20,410, a gap of 7,590.
- **X17** `kind` clusters, `docker`, and `gh` appear in a few lines; GitHub Actions cannot run here.
- **Filler guard (plan 09, owner `plan-11`)**: fires FG6 on 2026-10-09 (repeated-paragraph share 0.42 against the limit 0.25). The course must stop firing every rule, and its entry leaves `FILLER_BASELINE` (and the cap falls by one) in the same commit as the course ([tech-docs/007](../../tech-docs/007-testing-strategy.md#the-filler-baseline-ratchet)).

## Fixes and design

- Each unit runs its Python verification for real and validates its workflow YAML against GitHub's workflow schema with a locked `check-jsonschema` (`vendor.github-workflows`, spike SP3), as a `kind: check` run.
- Replace the repeated filler with real annotations; write drilling and 8 katas; lengthen the thin lessons.
- The schema check proves the workflow is well formed, not that it behaves on GitHub; the lesson says so. Launch lines for `act`, `kind`, and `gh` are illustrations.

## Harness mode and toolchain

- **Harness mode**: Real mode, `python`.
- **Toolchain ids**: python (PyYAML, check-jsonschema locked).
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP3 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: At most 8 fences.
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 2.0 s per container invocation × 2 executions × 103 runs (83 examples + 2 × 8 kata runs + 4 capstone runs) ≈ 6.9 minutes.

## Size class and sequencing

- **Size class M** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 7,590 (the larger of the word gap and the drilling shortfall), new unit folders 8.
- **Agent packets**: one packet per defect group plus one authoring packet for the word gap.
- **Wave 9**, slot 2. Makers and fixers for this course: `apps-ayokoding-www-by-example-maker` for authoring gaps, `tutorial-by-example-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `platform-engineering-and-devex`, `self-managed-kubernetes-and-gitops` (each is audited in a later wave, so this course is final first).

## Prerequisite re-check

- Plan 02 result: Kept; both are audited earlier in this plan (waves 4 and 7).
- In-plan prerequisites are audited first: `version-control-and-git` in wave 4, `containers-and-orchestration` in wave 7.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-core-and-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `cicd-and-release-engineering` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder; compare its findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (M): one packet per defect group plus one authoring packet for the word gap. Classes: X1, X3, X11, X14, X17.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `cicd-and-release-engineering`; a course that fires is fixed, never baselined.
- [ ] Units: 83 example units, 8 kata units, 1 capstone unit (create 8, convert 84); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 8 fences.
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `cicd-and-release-engineering` exits 0 (at most 2 repair cycles).
- [ ] CP-6 The registry row for `cicd-and-release-engineering` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit cicd-and-release-engineering course` with explicit paths only: the course folder with its `_index.md`, the registry row. Delete the `cicd-and-release-engineering` entry from `FILLER_BASELINE` and lower `FILLER_BASELINE_CAP` by one in the same commit; `course-filler.steps.ts` stays green without the entry.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/cicd-and-release-engineering/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–28 (28): from "Daily Merge and Self-Testing Build" to "Mark a Breaking Conventional Commit".
- **co-02 · intermediate** — examples 29–55 (27): from "Map Conventional Commits to SemVer" to "Order Gates for Fast Feedback".
- **co-03 · advanced** — examples 56–83 (28): from "Switch Blue-Green Traffic" to "Choose a Progressive Delivery Strategy".

## Lineage

- Prerequisite of Platform Engineering and of Self-Managed Kubernetes and GitOps.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 43 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/ai-engineer` — position 9 of 26 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 36 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 36 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/ai-engineer` — an extension course after plan 08; not part of the core closure.
