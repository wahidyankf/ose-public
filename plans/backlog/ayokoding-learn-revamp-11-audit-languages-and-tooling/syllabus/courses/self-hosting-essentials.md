# Self-Hosting Essentials (By Example)

**Course ID**: `self-hosting-essentials` · **Format**: By Example · **Family**: infrastructure-and-operations.

**Scope note**: Audits and fixes the existing `self-hosting-essentials` course to the series definition of done and brings every example green in plan 05's harness. The subject, slug, format, and place in every path stay; no new topic is added. The neighbouring courses `backend-essentials`, `just-enough-bash` keep their own scope. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course.

**Short summary**: Hosting a small service yourself: SSH hardening, a firewall, systemd units, a Caddy reverse proxy and TLS, backups with restic, monitoring, and updates, with scripts as the artifacts.

## Why this exists · the big idea

- **The problem before the solution**: Annotation density is 0.43, 76 of 78 "Why It Matters" blocks are too short, and all 86 anchors disagree with their files.
- **Keep-this-if-you-forget-everything**: A self-hosted service stays safe because each step is small and repeatable; scripts run in dry-run mode against a fixture root.

## Prerequisites

- **Prior courses**: `backend-essentials`, `just-enough-bash` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example (unchanged; a maker may not switch modes, and a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user). **Reason**: Seventy-eight examples harden and operate one small HTTP service on a VPS. The artifacts are shell scripts, systemd units, and proxy configs, each of which is a rule a reader can check.
- **Wave**: 7 (slot 2); **size class**: S (words to write 943, new unit folders 4); **expected defect classes**: 7 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                            | Target                                                                                                                                                                                   | Work                          |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 29,436                                                                                                                                                                                     | at least 28,000                                                                                                                                                                          | none                          |
| Examples as `### Example N: Title`                            | 78                                                                                                                                                                                         | at least 75, numbered 1 to N without gaps                                                                                                                                                | none                          |
| Mermaid diagrams                                              | 2                                                                                                                                                                                          | 30 to 50 (adapter band)                                                                                                                                                                  | 28 to add                     |
| "Why It Matters" (50 to 100 words each)                       | 78 of 78 present; 76 under 50 words; 0 over 100; median 38 words                                                                                                                           | one per example, 50 to 100 words                                                                                                                                                         | 76 to write or fix            |
| Annotation density (comment lines per code line)              | median 0.43; 63 examples below 1.0; 1 above 2.25 (of 69 code-bearing)                                                                                                                      | 1.0 to 2.25 on every code-bearing example                                                                                                                                                | 64 to fix                     |
| Code fences                                                   | 131 fences; 4 code fences unanchored                                                                                                                                                       | every code fence anchored or marked as an illustration (budget: at most 16 fences (`ufw`, `systemctl`, `ssh`, `restic`, nginx))                                                          | 4 to anchor                   |
| Lesson-to-file anchors (plan 05's method)                     | 82 path anchors (match 0, mismatch 82, missing 0); 4 labelled anchors (match 0, mismatch 4, missing 0)                                                                                     | every anchor matches its file                                                                                                                                                            | 86 to repair                  |
| Output blocks                                                 | 0 output fences; 0 unanchored                                                                                                                                                              | every `**Output**` block anchored to an expected file                                                                                                                                    | 0 to anchor                   |
| Harness units                                                 | 78 example folders, 4 kata folders, 91 code files, 0 `run.yaml`                                                                                                                            | 78 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                                  | create 4, convert 83          |
| Drilling page                                                 | 4,057 words; 4 of 5 standard `##` sections exact; 39 `<details>` blocks; headings found: Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative-interrogation prompts | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) at plan 06's counts | 943 words short; fix sections |
| Katas                                                         | 4 kata folders                                                                                                                                                                             | at least 8 as `before`/`after` units                                                                                                                                                     | 4                             |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                     | unchanged except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                                                | recompute                     |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X9** Density median 0.43 comment lines per code line (63 of 78 examples under the floor), the lowest in the plan.
- **X8** 76 of 78 "Why It Matters" blocks are under 50 words (median 38).
- **X3** 82 path anchors and 4 labelled anchors, all mismatching; 4 fences unanchored.
- **X1** 91 files (45 scripts, 11 Caddyfiles, 8 service units, 7 config files) in 78 example folders, 4 kata folders, and a capstone folder, with no `run.yaml`; 4 katas of 8.
- **X15** Scripts call `ufw`, `systemctl`, `restic`, `curl`, `ssh`, and `ssh-keygen` (52, 51, 8, 23, 6, and 3 command lines), with 64 system and 49 network markers.
- **X18** A section named "Accuracy notes" remains (1 section); it becomes `## References`.
- **X20** 2 Mermaid diagrams against the 30 to 50 band for By Example.

## Fixes and design

- Scripts take a fixture root and run in dry-run mode by default; a `bin/` directory of stub commands in the unit logs each call, so the scripts' logic (argument construction, ordering, idempotence) is tested without touching a system.
- ShellCheck through the locked wheel (spike SP3). Caddyfile units: `caddy validate` if the budget rule allows a `caddy` toolchain (about 13 units, spike SP8), otherwise a Python structure check labelled as a model. systemd units: `systemd-analyze verify` if allowed (about 14 units, spike SP9), otherwise an INI parse with the unit-file rules the lesson teaches, labelled as a model. Nginx and restic are illustrations.
- Dry-run first: no unit contacts a host. The lessons keep their real commands as the thing a reader runs on their own server; the harness proves the script logic around them.

## Harness mode and toolchain

- **Harness mode**: Real mode, `shell` and `python`; budget-gated `caddy` and `systemd-analyze` validators.
- **Toolchain ids**: shell (scripts with stub binaries) and python; caddy and systemd validators budget-gated.
- **Toolchain additions** (budget-gated, default NO-GO; [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-cost.md)): caddy (budget-gated), systemd-analyze (budget-gated).
- **Phase 1 spikes**: SP3, SP8, SP9 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: At most 16 fences (`ufw`, `systemctl`, `ssh`, `restic`, nginx).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 1.5 s per container invocation × 2 executions × 98 runs (78 examples + 2 × 8 kata runs + 4 capstone runs) ≈ 4.9 minutes.

## Size class and sequencing

- **Size class S** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 943 (the larger of the word gap and the drilling shortfall), new unit folders 4.
- **Agent packets**: one packet per defect group (mechanical fixes, then prose fixes); no page split.
- **Wave 7**, slot 2. Makers and fixers for this course: `apps-ayokoding-www-by-example-maker` for authoring gaps, `tutorial-by-example-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 result: Kept; `just-enough-bash` is audited first (wave 1).
- In-plan prerequisites are audited first: `just-enough-bash` in wave 1.
- Prerequisites outside this plan (unchanged here): `backend-essentials`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-core-and-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `self-hosting-essentials` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder; compare its findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (S): one packet per defect group (mechanical fixes, then prose fixes); no page split. Classes: X1, X3, X8, X9, X15, X18, X20.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `self-hosting-essentials`; a course that fires is fixed, never baselined.
- [ ] Units: 78 example units, 8 kata units, 1 capstone unit (create 4, convert 83); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 16 fences (`ufw`, `systemctl`, `ssh`, `restic`, nginx).
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `self-hosting-essentials` exits 0 (at most 2 repair cycles).
- [ ] CP-6 The registry row for `self-hosting-essentials` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit self-hosting-essentials course` with explicit paths only: the course folder with its `_index.md`, the registry row.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/self-hosting-essentials/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–16 (16): from "Provision a Linux VM and Record Its IP" to "Keep Secrets Out of the Repo".
- **co-02 · intermediate** — examples 17–32 (16): from "A Health-Check Endpoint Through the Proxy" to "A Zero-Downtime Restart".
- **co-03 · advanced** — examples 33–78 (46): from "A Data-Backed Service with a Persistent Volume" to "A cloud-init User-Data for First-Boot Setup".

## Lineage

- The owner-operated counterpart of the cloud course.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 40 of 121 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 34 of 114 at baseline (2026-10-09); this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 33 of 116 at baseline (2026-10-09); this plan changes no path membership or order.
