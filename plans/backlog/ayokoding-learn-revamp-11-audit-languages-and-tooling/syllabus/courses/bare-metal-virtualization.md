# Bare-Metal Virtualization (By Example)

**Course ID**: `bare-metal-virtualization` · **Format**: By Example · **Family**: infrastructure-and-operations.

**Scope note**: Audits and fixes the existing `bare-metal-virtualization` course to the series definition of done and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. The neighbouring courses `containers-and-orchestration`, `cloud-and-iac`, `networking-essentials` keep their own scope. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course.

**Short summary**: Operating your own virtualization hosts: KVM and QEMU, Proxmox clusters, storage and networking, templates and cloud-init, Packer, Terraform and Ansible, backup and recovery. A safe-lab boundary runs through the course: commands inspect, print a plan, or validate bundled text.

## Why this exists · the big idea

- **The problem before the solution**: The examples print sentences with `printf` and assert nothing, so a green run proves nothing, and drilling is 227 words.
- **Keep-this-if-you-forget-everything**: Virtualization is operated safely when each step is checked in a model first; every example computes its answer.

## Prerequisites

- **Prior courses**: `containers-and-orchestration`, `cloud-and-iac`, `networking-essentials` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Eighty examples already walk from hypervisor vocabulary to Proxmox clusters, images, and recovery. By Example fits if each example becomes an executable model of the operation rather than a printed sentence.
- **Wave**: 10 (slot 1); **size class**: L (words to write 14,332, new unit folders 89); **expected defect classes**: 5 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                                                                                                                   | Target                                                                                                                                                                                   | Work                            |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 13,668                                                                                                                                                                                                                                                                            | at least 28,000                                                                                                                                                                          | 14,332 to write                 |
| Examples as `### Example N: Title`                            | 80                                                                                                                                                                                                                                                                                | at least 75, numbered 1 to N without gaps                                                                                                                                                | none                            |
| Mermaid diagrams                                              | 30                                                                                                                                                                                                                                                                                | 30 to 50 (adapter band)                                                                                                                                                                  | none                            |
| "Why It Matters" (50 to 100 words each)                       | 80 of 80 present; 77 under 50 words; 3 over 100; median 28 words                                                                                                                                                                                                                  | one per example, 50 to 100 words                                                                                                                                                         | 80 to write or fix              |
| Annotation density (comment lines per code line)              | median 1.0; 0 examples below 1.0; 1 above 2.25 (of 80 code-bearing)                                                                                                                                                                                                               | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 1 to fix                        |
| Code fences                                                   | 112 fences; 82 code fences unanchored                                                                                                                                                                                                                                             | every code fence anchored or marked as an illustration (budget: at most 12 fences (hypervisor commands and packer templates))                                                            | 82 to anchor                    |
| Lesson-to-file anchors (plan 05's method)                     | 0 path anchors (match 0, mismatch 0, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                                                                                                                                              | every anchor matches its file                                                                                                                                                            | 0 to repair                     |
| Output blocks                                                 | 0 output fences; 0 unanchored                                                                                                                                                                                                                                                     | every `**Output**` block anchored to an expected file                                                                                                                                    | 0 to anchor                     |
| Harness units                                                 | 0 example folders, 0 kata folders, 1 code file, 0 `run.yaml`                                                                                                                                                                                                                      | 80 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | create 89, convert 0            |
| Drilling page                                                 | 227 words; 0 of 5 standard `##` sections exact; 0 `<details>` blocks; headings found: 1. Recall: name the layers, 2. Judgment: choose the smallest safe substrate, 3. Code: validate rather than operate, 4. Transfer: write a change record, 5. Self-check: prove recoverability | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 4,773 words short; fix sections |
| Katas                                                         | 0 kata folders                                                                                                                                                                                                                                                                    | at least 8 as `before`/`after` units                                                                                                                                                     | 8                               |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                                                                                                            | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                                                | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X5** The code is `printf`: the examples print a sentence (for example `printf '%s\n' 'Type 1 uses hardware directly; Type 2 has a host OS layer'`), so a green run proves nothing. 82 of 112 fences are unanchored and only 1 code file exists.
- **X8** 77 of 80 "Why It Matters" blocks are under 50 words (median 28) and 3 are over 100.
- **X11** Drilling is 227 words under five numbered, nonstandard headings with no `<details>` answers; 0 kata units.
- **X13** Words 13,668, a gap of 14,332. Diagrams (30) are in the band.
- **X17** Hypervisor commands (`virsh`, `qm`, `pvesh`) need a host; Terraform and Packer need their tools; the capstone has cloud-init, Packer, and Terraform files.

## Fixes and design

- Replace each printed sentence with an executable model that computes the answer from a fixture: parse a bundled `lscpu` and `/proc/cpuinfo` sample for virtualization flags, plan CPU and memory placement, parse a qcow2 header, validate libvirt domain XML and cloud-init YAML with the standard library, and check an Ansible-style convergence rule.
- Mapping: HCL in a `tofu validate` unit (static, reason `cloud`); cloud-init and libvirt XML in Python parse-and-assert units (real mode); Packer templates and hypervisor commands are launch illustrations with the budget below.
- No extension of the closed static-reason set (a plan 05 contract change; its rule M11 forbids weakening). Everything not static is a real-mode model.
- Illustration budget: 4 hypervisor-command fences and the Packer templates; the content gate judges the rest.

## Harness mode and toolchain

- **Harness mode**: Real mode, `shell` and `python`; static mode with `opentofu` for HCL.
- **Toolchain ids**: shell and python models; opentofu (static, reason cloud) for Terraform HCL.
- **Toolchain additions**: none; every unit uses an id already in plan 05's catalog.
- **Phase 1 spikes**: SP3, SP12 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: At most 12 fences (hypervisor commands and Packer templates).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 2.0 s per container invocation × 2 executions × 99 runs (80 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 6.6 minutes.

## Size class and sequencing

- **Size class L** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 14,332 (the larger of the word gap and the drilling shortfall), new unit folders 89.
- **Agent packets**: authoring split by learning page (one packet per page), then one packet per remaining defect group.
- **Wave 10**, slot 1. Makers and fixers for this course: `apps-ayokoding-www-by-example-maker` for authoring gaps, `tutorial-by-example-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `self-managed-kubernetes-and-gitops` (each is audited in a later wave, so this course is final first).

## Prerequisite re-check

- Plan 02 result: Kept; `containers-and-orchestration` and `cloud-and-iac` are audited earlier in this plan (waves 7 and 9).
- In-plan prerequisites are audited first: `containers-and-orchestration` in wave 7, `cloud-and-iac` in wave 9.
- Prerequisites outside this plan (unchanged here): `networking-essentials`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-core-and-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `bare-metal-virtualization` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder; compare its findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (L): authoring split by learning page (one packet per page), then one packet per remaining defect group. Classes: X5, X8, X11, X13, X17.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `bare-metal-virtualization`; a course that fires is fixed, never baselined.
- [ ] Units: 80 example units, 8 kata units, 1 capstone unit (create 89, convert 0); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 12 fences (hypervisor commands and packer templates).
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `bare-metal-virtualization` exits 0 (at most 2 repair cycles).
- [ ] CP-6 The registry row for `bare-metal-virtualization` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit bare-metal-virtualization course` with explicit paths only: the course folder with its `_index.md`, the registry row.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/bare-metal-virtualization/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–28 (28): from "Why Own the Substrate" to "Calculate a Quorum Majority".
- **co-02 · intermediate** — examples 29–56 (28): from "Plan a Cluster Join" to "Choose a Maintained Provider".
- **co-03 · advanced** — examples 57–80 (24): from "Describe Packer's Image Contract" to "Assemble the Bare Metal Capstone".

## Lineage

- Follows Containers and Cloud and IaC; prerequisite of Self-Managed Kubernetes and GitOps.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 45 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 44 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 48 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
