# Linux App Development (By Example)

**Course ID**: `linux-app-development` · **Format**: By Example · **Family**: application-development.

**Scope note**: Audits and fixes the existing `linux-app-development` course to the series definition of done and brings every example green in plan 05's code harness. The subject, slug, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course (except a capstone's `relies-on` row, CP-7).

**Short summary**: Linux programs in Python that respect arguments, standard streams, files, signals, processes, sockets, and packaging.

## Why this exists · the big idea

- **The problem before the solution**: 78 examples are announced in 5,071 words with one fence, the lesson fences differ from their files only by blank lines (all 78 anchors mismatch), and the filler guard fires FG6 (repeated-paragraph share 0.32).
- **Keep-this-if-you-forget-everything**: A Linux program is a process with arguments, streams, files, and signals; each example drives one of them and prints what the kernel returned.

## Prerequisites

- **Prior courses**: `just-enough-python` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example. **Reason**: By Example, as plan 03 records it: 78 numbered examples in three level pages, each a Python file.
  A maker may not switch modes except where the reason above says so; a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user.
- **Mode-convention fit**: today the course fits the convention: `overview.md` plus beginner, intermediate, and advanced pages. Example headings per page today: `learning/advanced.md` (24), `learning/beginner.md` (26), `learning/intermediate.md` (28).
- **Wave**: 11 (slot 1); **size class**: XL (words to write 22,929, new unit folders 8); **expected defect classes**: 12 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                                      | Target                                                                                                                                                               | Work                            |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 5,071                                                                                                                                                                                                | at least 28,000                                                                                                                                                      | 22,929 to write                 |
| Examples as `### Example N: Title`                            | 78                                                                                                                                                                                                   | at least 75, numbered 1 to N without gaps                                                                                                                            | none                            |
| Mermaid diagrams                                              | 0                                                                                                                                                                                                    | 30 to 50 (adapter band)                                                                                                                                              | 30 to add                       |
| "Why It Matters" (50 to 100 words each)                       | none of 78 examples has one                                                                                                                                                                          | one per example, 50 to 100 words                                                                                                                                     | 78 to write                     |
| Annotation density (comment lines per code line)              | median 0.0; 78 examples below 1.0; 0 above 2.25 (of 78 code-bearing)                                                                                                                                 | 1.0 to 2.25 on every code-bearing example                                                                                                                            | 78 to fix                       |
| Code fences                                                   | 79 code fences in the lessons; 1 unanchored                                                                                                                                                          | every code fence anchored or marked as an illustration (budget: 8 at most; `systemctl`, package-manager, and desktop-launch lines)                                   | 1 to anchor                     |
| Lesson-to-file anchors (plan 05's method)                     | 78 path anchors (match 0, mismatch 78, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                                                               | every anchor matches its file                                                                                                                                        | 78 to repair                    |
| Output blocks                                                 | 0 output fences; 0 unanchored                                                                                                                                                                        | every `**Output**` block anchored to an expected file                                                                                                                | 0 to anchor                     |
| Harness units                                                 | 78 example folders, 0 kata folders, 86 code files, 0 `run.yaml`                                                                                                                                      | 78 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                              | create 8, convert 79            |
| Drilling page                                                 | 313 words; 4 of 5 standard `##` sections exact; 0 `<details>` blocks; headings found: Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation and self-explanation | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) | 4,687 words short; fix sections |
| Katas                                                         | 0 kata folders                                                                                                                                                                                       | at least 8 as `before`/`after` units                                                                                                                                 | 8                               |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                               | unchanged, except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                           | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X1** 86 code files (78 example folders, 0 kata folders, 2 test-like files); none has a `run.yaml`.
- **X3** 1 of 79 code fences is neither anchored nor marked as illustrations; 78 anchors mismatch their files and 0 point at missing files.
- **X5** The three level pages hold 26, 28, and 24 headings with 1 code fence between them; 78 path anchors all mismatch their files.
- **X7** The overview has no `## Examples by Level` heading (CRITICAL under the adapter); 78 of 78 examples have no "Why It Matters" block.
- **X9** Annotation density: median 0.0; 78 examples below 1.0 and 0 above 2.25 (of 78 code-bearing).
- **X10** The `=>` result notation appears in 0 of 79 code fences.
- **X11** Drilling: 313 words (4,687 short of 5,000); 4 of 5 exact `##` sections; 0 kata folders against 8.
- **X13** 5,071 words against a floor of 28,000; 22,929 to write.
- **X14** The plan 09 filler guard lists this course (owner `plan-13`): repeated-paragraph share 0.32 (limit 0.25).
- **X15** 10 files use timers or threads, 7 use sockets, 15 start subprocesses, 16 use temporary folders, 4 use GUI toolkit names, 4 mention `systemctl` or `docker`.
- **X17** systemd units, a desktop toolkit, and D-Bus cannot run in the container.
- **X20** 0 Mermaid diagrams against the band of 30 to 50.
- **Filler baseline**: the course must stop firing every rule, and its entry leaves `FILLER_BASELINE` (and the cap falls by one) in the same commit as the course ([tech-docs/007](../../tech-docs/007-testing-strategy.md#the-filler-baseline-ratchet)).

## Fixes and design

- Run the 78 programs for real under `python`: argparse, streams, files, signals, `AF_UNIX` sockets under `/tmp`, subprocesses that run only `python3`, `echo`, and `cat` (spike SP13).
- Model what the container cannot host: a systemd unit as an INI parse with the unit-file rules the lesson teaches, a GUI toolkit as an event-loop model; the real command is a launch illustration.
- Author the missing lesson text around the 78 programs (about 22,929 words), `sync --write` the anchors, write the drilling page (313 words today) with 8 kata units, and add diagrams (0 today) to the band.
- Remove the `linux-app-development` entry from `FILLER_BASELINE` in the same commit.

## Harness mode and toolchain

- **Harness mode**: Real mode: `python` (and `shell` for shell scripts); a systemd unit and a GUI are models.
- **Toolchain ids**: python; shell.
- **Toolchain additions** (budget-gated, default NO-GO; [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-cost.md)): none; a headless GUI toolkit would serve 4 units and fails the budget rule (decision D9).
- **Phase 1 spikes**: SP13 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: at most 8 (`systemctl`, package-manager, and desktop-launch lines).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 2.0 s per container invocation × 2 executions × 97 runs (78 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 6.5 minutes.

## Size class and sequencing

- **Size class XL** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 22,929 (the larger of the word gap and the drilling shortfall), new unit folders 8.
- **Estimated effort** (size, not time): class XL; agent packets: authoring split by learning page and again by blocks of at most 15 examples, then one packet per remaining defect group; the course folder is committed only when every unit exists.
- **Wave 11**, slot 1. Makers and fixers for this course: `apps-ayokoding-www-by-example-maker` for authoring gaps, `tutorial-by-example-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 keeps the current list (the list above is the result).
- Prerequisites outside this plan (unchanged here): `just-enough-python`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-path-and-capstone-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `linux-app-development` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder; `AUDIT_PROBE=linux-app-development:by-example` with `UNIT-NODE tests/unit/be-steps/audited-course-completion.steps.ts` to record the scenarios the course fails; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (XL): authoring split by learning page and again by blocks of at most 15 examples, then one packet per remaining defect group; the course folder is committed only when every unit exists. Classes: X1, X3, X5, X7, X9, X10, X11, X13, X14, X15, X17, X20.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `linux-app-development`; a course that fires is fixed, never baselined.
- [ ] Units: 78 example units, 8 kata units, 1 capstone unit (create 8, convert 79); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 8 (`systemctl`, package-manager, and desktop-launch lines).
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `linux-app-development` exits 0 (at most 2 repair cycles); `EX-COVERAGE` shows `covered: true` for `linux-app-development`.
- [ ] CP-6 The registry row for `linux-app-development` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit linux-app-development course` with explicit paths only: the course folder with its `_index.md`, the registry row. Delete the `linux-app-development` entry from `FILLER_BASELINE` and lower `FILLER_BASELINE_CAP` by one in the same commit; `course-filler.steps.ts` stays green without the entry.
- [ ] CP-7 Capstone relies-on: `rtk git grep -n "linux-app-development" -- 'apps/ayokoding-www/content/en/learn/courses/capstone-*/learning/overview.md'` shows no capstone row for this course today; if the search finds one at execution time, handle it as in the other courses and note it in the ledger.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/linux-app-development/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–26 (26): from "sys argv" to "pytest first".
- **co-02 · intermediate** — examples 27–54 (28): from "subprocess check" to "test exit code".
- **co-03 · advanced** — examples 55–78 (24): from "Full Cli" to "Capstone Cli And Daemon".

## Lineage

- Builds on: `just-enough-python`. Required by (in this plan): none.

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 55 of 121 in the manifest as specified by plan 02 (read 2026-10-09), phase `apps-and-interfaces`, role `extension`; this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 42 of 114 in the manifest as specified by plan 02 (read 2026-10-09), phase `apps-and-interfaces`, role `extension`; this plan changes no path membership or order.
