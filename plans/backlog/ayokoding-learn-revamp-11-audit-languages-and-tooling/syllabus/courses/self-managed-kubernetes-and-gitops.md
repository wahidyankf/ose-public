# Self-Managed Kubernetes and GitOps (By Example)

**Course ID**: `self-managed-kubernetes-and-gitops` · **Format**: By Example · **Family**: infrastructure-and-operations.

**Scope note**: Audits and fixes the existing `self-managed-kubernetes-and-gitops` course to the series definition of done and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. The neighbouring courses `containers-and-orchestration`, `bare-metal-virtualization`, `cicd-and-release-engineering` keep their own scope. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course.

**Short summary**: Running Kubernetes yourself: ownership and topology, distribution choice, lifecycle, networking, storage, TLS, GitOps, and recovery, taught as offline models and client-side dry runs in an owner-operated lab.

## Why this exists · the big idea

- **The problem before the solution**: The "examples" are `printf` plans, 82 of 85 fences are unanchored, and drilling is 252 words.
- **Keep-this-if-you-forget-everything**: Running Kubernetes yourself is a list of duties; each is modelled offline before you do it on a real cluster.

## Prerequisites

- **Prior courses**: `containers-and-orchestration`, `bare-metal-virtualization`, `cicd-and-release-engineering` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Eighty-two examples cover the duties a cloud provider normally performs. By Example fits if the offline models compute something instead of printing a plan.
- **Wave**: 11 (slot 2); **size class**: XL (words to write 16,007, new unit folders 91); **expected defect classes**: 6 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                   | Target                                                                                                                                                                                   | Work                            |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 11,993                                                                                                                                            | at least 28,000                                                                                                                                                                          | 16,007 to write                 |
| Examples as `### Example N: Title`                            | 82                                                                                                                                                | at least 75, numbered 1 to N without gaps                                                                                                                                                | none                            |
| Mermaid diagrams                                              | 3                                                                                                                                                 | 30 to 50 (adapter band)                                                                                                                                                                  | 27 to add                       |
| "Why It Matters" (50 to 100 words each)                       | 82 of 82 present; 82 under 50 words; 0 over 100; median 34 words                                                                                  | one per example, 50 to 100 words                                                                                                                                                         | 82 to write or fix              |
| Annotation density (comment lines per code line)              | median 1.0; 0 examples below 1.0; 0 above 2.25 (of 82 code-bearing)                                                                               | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 0 to fix                        |
| Code fences                                                   | 85 fences; 82 code fences unanchored                                                                                                              | every code fence anchored or marked as an illustration (budget: at most 10 fences)                                                                                                       | 82 to anchor                    |
| Lesson-to-file anchors (plan 05's method)                     | 0 path anchors (match 0, mismatch 0, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                              | every anchor matches its file                                                                                                                                                            | 0 to repair                     |
| Output blocks                                                 | 0 output fences; 0 unanchored                                                                                                                     | every `**Output**` block anchored to an expected file                                                                                                                                    | 0 to anchor                     |
| Harness units                                                 | 0 example folders, 0 kata folders, 0 code files, 0 `run.yaml`                                                                                     | 82 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | create 91, convert 0            |
| Drilling page                                                 | 252 words; 0 of 5 standard `##` sections exact; 0 `<details>` blocks; headings found: Recall, Judgment, Safe local practice, Transfer, Self-check | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 4,748 words short; fix sections |
| Katas                                                         | 0 kata folders                                                                                                                                    | at least 8 as `before`/`after` units                                                                                                                                                     | 8                               |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                            | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                                                | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X5** The examples are `printf` plans (66 `sh` fences of 85), 11 YAML fences, and 5 `kubectl` fences; no code files or folders exist (0 code files).
- **X8** All 82 "Why It Matters" blocks are under 50 words (median 34).
- **X11** Drilling is 252 words under nonstandard headings (Recall, Judgment, Safe local practice, Transfer, Self-check); 0 kata units.
- **X13** Words 11,993, a gap of 16,007. 82 of 85 fences are unanchored.
- **X17** `kubectl --dry-run=client` needs `kubectl`, which is not in the catalog.
- **X20** 3 Mermaid diagrams against the 30 to 50 band for By Example.

## Fixes and design

- Rewrite the `printf` plans as executable models: a jq or Python model computes quorum and etcd sizing, a certificate-rotation schedule, a GitOps reconcile loop over two fixture trees, a drain-order plan from a fixture node list, a backup-and-restore check by checksum.
- YAML: `kubeconform -strict` (static, reason `cluster`). `kubectl` lines are launch illustrations.
- Create 82 units, anchor, write drilling and 8 katas.
- The course keeps its owner-operated-lab boundary; the harness runs models only, never a cluster.
- The plan 02 prerequisite change (remove `distributed-systems`, add `cicd-and-release-engineering`) is verified against the prose in the prerequisite re-check.

## Harness mode and toolchain

- **Harness mode**: Real mode, `shell` and `python`; static mode (reason `cluster`) with `kubeconform`.
- **Toolchain ids**: shell/jq and python models; kubeconform (static, reason cluster).
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP18 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: At most 10 fences.
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 2.5 s per container invocation × 2 executions × 101 runs (82 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 8.4 minutes.

## Size class and sequencing

- **Size class XL** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 16,007 (the larger of the word gap and the drilling shortfall), new unit folders 91.
- **Agent packets**: authoring split by learning page and again by blocks of at most 15 examples, then one packet per remaining defect group; the course folder is committed only when every unit exists.
- **Wave 11**, slot 2. Makers and fixers for this course: `apps-ayokoding-www-by-example-maker` for authoring gaps, `tutorial-by-example-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 result: Plan 02 removes `distributed-systems` and adds `cicd-and-release-engineering`; all three are audited earlier in this plan (waves 7, 9, and 10).
- In-plan prerequisites are audited first: `containers-and-orchestration` in wave 7, `bare-metal-virtualization` in wave 10, `cicd-and-release-engineering` in wave 9.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-core-and-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `self-managed-kubernetes-and-gitops` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder; compare its findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (XL): authoring split by learning page and again by blocks of at most 15 examples, then one packet per remaining defect group; the course folder is committed only when every unit exists. Classes: X5, X8, X11, X13, X17, X20.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `self-managed-kubernetes-and-gitops`; a course that fires is fixed, never baselined.
- [ ] Units: 82 example units, 8 kata units, 1 capstone unit (create 91, convert 0); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 10 fences.
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `self-managed-kubernetes-and-gitops` exits 0 (at most 2 repair cycles).
- [ ] CP-6 The registry row for `self-managed-kubernetes-and-gitops` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit self-managed-kubernetes-and-gitops course` with explicit paths only: the course folder with its `_index.md`, the registry row.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/self-managed-kubernetes-and-gitops/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Plan 02 removes `distributed-systems` and adds `cicd-and-release-engineering` (plan 02's revised graph, read 2026-10-09); the prose is checked against the new list.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–30 (30): from "Why Self-Managed Kubernetes" to "Plan a k3s Upgrade".
- **co-02 · intermediate** — examples 31–57 (27): from "CNI Is Required" to "ACME HTTP-01 Flow".
- **co-03 · advanced** — examples 58–82 (25): from "GitOps Model" to "Self-Managed Kubernetes Capstone".

## Lineage

- The last course of the infrastructure family.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 105 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 103 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 107 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
