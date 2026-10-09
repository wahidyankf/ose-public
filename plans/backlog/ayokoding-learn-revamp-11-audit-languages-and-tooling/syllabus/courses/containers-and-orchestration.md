# Containers and Orchestration (By Example)

**Course ID**: `containers-and-orchestration` · **Format**: By Example · **Family**: infrastructure-and-operations.

**Scope note**: Audits and fixes the existing `containers-and-orchestration` course to the series definition of done and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. The neighbouring courses `just-enough-bash`, `backend-essentials`, `sql-essentials` keep their own scope. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course.

**Short summary**: Containers and orchestration: images and layers, Dockerfiles, Compose, Kubernetes objects (Pods, Deployments, Services, probes, configuration), rollouts, and a capstone that self-heals.

## Why this exists · the big idea

- **The problem before the solution**: Only 2 example folders exist for 83 examples, 87 fences are unanchored, and the drilling page has no kata units.
- **Keep-this-if-you-forget-everything**: A container is an image plus explicit configuration; each manifest is validated and each Dockerfile rule is checked.

## Prerequisites

- **Prior courses**: `just-enough-bash`, `backend-essentials`, `sql-essentials` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Eighty-three examples move from one image to a self-healing HTTP workload. Each is a copyable artifact or command with a production consequence.
- **Wave**: 7 (slot 1); **size class**: L (words to write 4,341, new unit folders 90); **expected defect classes**: 3 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                                     | Target                                                                                                                                                                                   | Work                 |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 37,622                                                                                                                                                                                              | at least 28,000                                                                                                                                                                          | none                 |
| Examples as `### Example N: Title`                            | 83                                                                                                                                                                                                  | at least 75, numbered 1 to N without gaps                                                                                                                                                | none                 |
| Mermaid diagrams                                              | 44                                                                                                                                                                                                  | 30 to 50 (adapter band)                                                                                                                                                                  | none                 |
| "Why It Matters" (50 to 100 words each)                       | 83 of 83 present; 0 under 50 words; 0 over 100; median 69 words                                                                                                                                     | one per example, 50 to 100 words                                                                                                                                                         | 0 to write or fix    |
| Annotation density (comment lines per code line)              | median 1.0; 2 examples below 1.0; 0 above 2.25 (of 70 code-bearing)                                                                                                                                 | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 2 to fix             |
| Code fences                                                   | 144 fences; 87 code fences unanchored                                                                                                                                                               | every code fence anchored or marked as an illustration (budget: at most 40 fences (28 percent of 144); the course teaches the cli, so the share is high by design)                       | 87 to anchor         |
| Lesson-to-file anchors (plan 05's method)                     | 0 path anchors (match 0, mismatch 0, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                                                                | every anchor matches its file                                                                                                                                                            | 0 to repair          |
| Output blocks                                                 | 0 output fences; 0 unanchored                                                                                                                                                                       | every `**Output**` block anchored to an expected file                                                                                                                                    | 0 to anchor          |
| Harness units                                                 | 2 example folders, 0 kata folders, 6 code files, 0 `run.yaml`                                                                                                                                       | 83 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | create 90, convert 2 |
| Drilling page                                                 | 659 words; 5 of 5 standard `##` sections exact; 10 `<details>` blocks; headings found: Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 4,341 words short    |
| Katas                                                         | 0 kata folders                                                                                                                                                                                      | at least 8 as `before`/`after` units                                                                                                                                                     | 8                    |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                              | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                                                | recompute            |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X19** Only 2 example folders and 6 code files exist for 83 examples; 87 of 144 fences are unanchored. By kind the fences are: Kubernetes manifests 29, `docker` commands 18, `kubectl` and `helm` 16, Dockerfiles 11, Compose files 5.
- **X11** Drilling is 659 words (five sections, thin); 0 kata units.
- **X17** `docker`, `podman`, `kubectl`, and `kind` need a daemon or a cluster (214, 45, 156, and 75 mentions).
- Positive: words (37,622) are above the 28,000 floor and the 44 diagrams sit inside the 30 to 50 band; no change is needed there.

## Fixes and design

- Kubernetes manifests: `kubeconform -strict` with offline schemas (static, reason `cluster`, spike SP18).
- Dockerfiles: a Python unit parses the file with a locked Dockerfile parser and asserts the rule the lesson teaches (pinned base, non-root user, layer order). Compose: `check-jsonschema` with the Compose schema, or a PyYAML structure check if the schema is not bundled (spike SP3).
- Container behaviour that needs a daemon is modelled in Python where the idea can be computed (layer cache keys, probe state machines, rollout arithmetic); the `docker`, `podman`, `kubectl`, and `kind` launch lines are illustrations. Budget below.
- A runtime `docker` call inside the harness is not available: the harness starts containers, not units that start containers. This is a plan 05 boundary, not a gap to close here.
- Illustration budget: the 34 `docker` and `kubectl` command fences plus install lines; every one carries a one-line reason in the ledger.

## Harness mode and toolchain

- **Harness mode**: Real mode with `python`; static mode (reason `cluster`) with `kubeconform`.
- **Toolchain ids**: kubeconform (static, reason cluster) for manifests; python models and parsers for Dockerfiles and Compose.
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP3, SP18 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: At most 40 fences (28 percent of 144); the course teaches the CLI, so the share is high by design.
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 2.5 s per container invocation × 2 executions × 102 runs (83 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 8.5 minutes.

## Size class and sequencing

- **Size class L** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 4,341 (the larger of the word gap and the drilling shortfall), new unit folders 90.
- **Agent packets**: authoring split by learning page (one packet per page), then one packet per remaining defect group.
- **Wave 7**, slot 1. Makers and fixers for this course: `apps-ayokoding-www-by-example-maker` for authoring gaps, `tutorial-by-example-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `bare-metal-virtualization`, `cicd-and-release-engineering`, `cloud-and-iac`, `platform-engineering-and-devex`, `self-managed-kubernetes-and-gitops`, `site-reliability-engineering` (each is audited in a later wave, so this course is final first).

## Prerequisite re-check

- Plan 02 result: Kept; the last two are outside this plan.
- In-plan prerequisites are audited first: `just-enough-bash` in wave 1.
- Prerequisites outside this plan (unchanged here): `backend-essentials`, `sql-essentials`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-core-and-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `containers-and-orchestration` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder; compare its findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (L): authoring split by learning page (one packet per page), then one packet per remaining defect group. Classes: X11, X17, X19.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `containers-and-orchestration`; a course that fires is fixed, never baselined.
- [ ] Units: 83 example units, 8 kata units, 1 capstone unit (create 90, convert 2); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 40 fences (28 percent of 144); the course teaches the cli, so the share is high by design.
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `containers-and-orchestration` exits 0 (at most 2 repair cycles).
- [ ] CP-6 The registry row for `containers-and-orchestration` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit containers-and-orchestration course` with explicit paths only: the course folder with its `_index.md`, the registry row.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/containers-and-orchestration/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–27 (27): from "Containers vs virtual machines" to "Host and none network".
- **co-02 · intermediate** — examples 28–55 (28): from "Named volume" to "Liveness probe".
- **co-03 · advanced** — examples 56–83 (28): from "Readiness probe" to "Containers capstone".

## Lineage

- The base of the infrastructure family.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 41 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/ai-engineer` — position 6 of 26 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 35 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 34 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/ai-engineer` — an extension course after plan 08; not part of the core closure.
