# Detection Engineering & SIEM Operations (By Example)

**Course ID**: `detection-engineering-and-siem-operations` · **Format**: By Example · **Family**: security.

**Scope note**: Audits and fixes the existing `detection-engineering-and-siem-operations` course to the series definition of done and brings every example green in plan 05's code harness. The subject, slug, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course (except a capstone's `relies-on` row, CP-7).

**Short summary**: Writing and tuning detections: decoders, rules, test fixtures, dashboards, tuning, and operating a SIEM, on original synthetic telemetry.

## Why this exists · the big idea

- **The problem before the solution**: 78 examples show 80 `sh` fences of one command each (`python3 code/detection_lab.py <subcommand>`), unanchored; the 7 code files sit flat in `learning/code/`; 9,085 words against 28,000; the drilling page (225 words) uses numbered nonstandard headings.
- **Keep-this-if-you-forget-everything**: A detection is a claim with a test: a decoder, a rule, a fixture of invented events, and the alert it should raise; every example checks one of the four, offline.

## Prerequisites

- **Prior courses**: `defensive-security`, `just-enough-python` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example. **Reason**: By Example, as plan 03 records it: 75 or more commands over one lab script and fixtures, each with a printed result and a safety boundary.
  A maker may not switch modes except where the reason above says so; a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user.
- **Mode-convention fit**: today the course fits the convention: `overview.md` plus beginner, intermediate, and advanced pages. Example headings per page today: `learning/advanced.md` (26), `learning/beginner.md` (26), `learning/intermediate.md` (26).
- **Wave**: 8 (slot 3); **size class**: L (words to write 18,915, new unit folders 87); **expected defect classes**: 11 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                                                                                                                                            | Target                                                                                                                                                               | Work                            |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 9,085                                                                                                                                                                                                                                                                                                      | at least 28,000                                                                                                                                                      | 18,915 to write                 |
| Examples as `### Example N: Title`                            | 78                                                                                                                                                                                                                                                                                                         | at least 75, numbered 1 to N without gaps                                                                                                                            | none                            |
| Mermaid diagrams                                              | 1                                                                                                                                                                                                                                                                                                          | 30 to 50 (adapter band)                                                                                                                                              | 29 to add                       |
| "Why It Matters" (50 to 100 words each)                       | none of 78 examples has one                                                                                                                                                                                                                                                                                | one per example, 50 to 100 words                                                                                                                                     | 78 to write                     |
| Annotation density (comment lines per code line)              | median 1.0; 0 examples below 1.0; 0 above 2.25 (of 78 code-bearing)                                                                                                                                                                                                                                        | 1.0 to 2.25 on every code-bearing example                                                                                                                            | 0 to fix                        |
| Code fences                                                   | 80 code fences in the lessons; 80 unanchored                                                                                                                                                                                                                                                               | every code fence anchored or marked as an illustration (budget: 6 at most; SIEM console screens and collector configuration shown as text)                           | 80 to anchor                    |
| Lesson-to-file anchors (plan 05's method)                     | 0 path anchors (match 0, mismatch 0, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                                                                                                                                                                       | every anchor matches its file                                                                                                                                        | 0 to repair                     |
| Output blocks                                                 | 0 output fences; 0 unanchored                                                                                                                                                                                                                                                                              | every `**Output**` block anchored to an expected file                                                                                                                | 0 to anchor                     |
| Harness units                                                 | 0 example folders, 0 kata folders, 7 code files, 0 `run.yaml`                                                                                                                                                                                                                                              | 78 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                              | create 87, convert 0            |
| Drilling page                                                 | 225 words; 0 of 5 standard `##` sections exact; 0 `<details>` blocks; headings found: 1. Recall: name the detection path, 2. Judgment: reduce noise without removing evidence, 3. Code: validate only local material, 4. Transfer: write a tuning decision, 5. Self-check: release a maintained hypothesis | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) | 4,775 words short; fix sections |
| Katas                                                         | 0 kata folders                                                                                                                                                                                                                                                                                             | at least 8 as `before`/`after` units                                                                                                                                 | 8                               |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                                                                                                                                     | unchanged, except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                           | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X1** 7 code files (0 example folders, 0 kata folders, 0 test-like files); none has a `run.yaml`.
- **X2** The 7 code files (`detection_lab.py`, 3 XML files, `check-lab.sh`, a JSON plan, an NDJSON fixture) sit directly in `learning/code/`; they are shared files, and no `ex-NN` unit folders exist.
- **X3** 80 of 80 code fences are neither anchored nor marked as illustrations.
- **X5** The 78 examples hold about 80 words each; there is no program, output block, or diagram per example (1 in the course).
- **X7** 78 of 78 examples have no "Why It Matters" block.
- **X11** Drilling: 225 words (4,775 short of 5,000); 0 of 5 exact `##` sections; 0 kata folders against 8.
- **X13** 9,085 words against a floor of 28,000; 18,915 to write.
- **X17** A real SIEM (Wazuh, Elastic, Splunk) is not in the catalog and would need network and a service. The lab parses decoders and rules itself in Python; rule-engine behaviour is a model and the lessons say so.
- **X18** The course names Python 3.13 1 times; the catalog pin is 3.14.8, so the text and recorded output are aligned to the pin.
- **X19** 0 example folders exist against 78 example units: 78 to create.
- **X20** 1 Mermaid diagrams against the band of 30 to 50.

## Fixes and design

- Keep `detection_lab.py` and the fixtures as shared files; create 78 unit folders whose `run.yaml` runs the lab subcommand the example shows, with `expected/` output recorded and read.
- Anchor the 80 `sh` fences to a `run.sh` in each unit (the lesson shows exactly the command in the file); write the missing 18,900 words (program narration, output reading, tuning decisions).
- Apply the safe-lab rules S1 to S7 (tech-docs/012): synthetic telemetry only, documentation-reserved addresses, no host or account name, no credential, no collection from the container.
- Rewrite the drilling page (225 words today) under the five exact headings, add 8 kata units, and diagrams (1 today) to the band.

## Harness mode and toolchain

- **Harness mode**: Real mode: `python` for the lab script and `shell` for `check-lab.sh`; XML rules are parsed by the lab.
- **Toolchain ids**: python; shell.
- **Toolchain additions** (budget-gated, default NO-GO; [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-cost.md)): none; a SIEM engine would serve few units and fails the budget rule (decision D9).
- **Safe-lab boundary** (security course): Safe-lab rules S1 to S7 and the four additions SL1 to SL4 ([tech-docs/012](../../tech-docs/012-safe-lab-and-content-safety-rules.md)): synthetic data, no target, no attack code for real software, reserved addresses only (SEC1), fictional identifiers, and an in-process model for every target. The course keeps a `## Safety boundary` section, and the security-course safety scan finds no unexplained hit.
- **Phase 1 spikes**: SP11 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: at most 6 (SIEM console screens and collector configuration shown as text).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 2.0 s per container invocation × 2 executions × 97 runs (78 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 6.5 minutes.

## Size class and sequencing

- **Size class L** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 18,915 (the larger of the word gap and the drilling shortfall), new unit folders 87.
- **Estimated effort** (size, not time): class L; agent packets: authoring split by learning page (one packet per page), then one packet per remaining defect group.
- **Wave 8**, slot 3. Makers and fixers for this course: `apps-ayokoding-www-by-example-maker` for authoring gaps, `tutorial-by-example-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 removes `security-essentials`, `offensive-security` (the list above is the result).
- Prerequisites outside this plan (unchanged here): `defensive-security`, `just-enough-python`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-path-and-capstone-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `detection-engineering-and-siem-operations` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder; `AUDIT_PROBE=detection-engineering-and-siem-operations:by-example` with `UNIT-NODE tests/unit/be-steps/audited-course-completion.steps.ts` to record the scenarios the course fails; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (L): authoring split by learning page (one packet per page), then one packet per remaining defect group. Classes: X1, X2, X3, X5, X7, X11, X13, X17, X18, X19, X20.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `detection-engineering-and-siem-operations`; a course that fires is fixed, never baselined.
- [ ] Units: 78 example units, 8 kata units, 1 capstone unit (create 87, convert 0); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 6 (SIEM console screens and collector configuration shown as text).
- [ ] Safe lab: the security-course safety scan (S1 to S7, SL1 to SL4, tech-docs/012) finds no unexplained hit; the SEC1 address scan is clean; the `## Safety boundary` section is present in the learning overview; the Content Quality Gate is told to read it.
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `detection-engineering-and-siem-operations` exits 0 (at most 2 repair cycles); `EX-COVERAGE` shows `covered: true` for `detection-engineering-and-siem-operations`.
- [ ] CP-6 The registry row for `detection-engineering-and-siem-operations` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit detection-engineering-and-siem-operations course` with explicit paths only: the course folder with its `_index.md`, the registry row.
- [ ] CP-7 Capstone relies-on: `rtk git grep -n "detection-engineering-and-siem-operations" -- 'apps/ayokoding-www/content/en/learn/courses/capstone-*/learning/overview.md'` lists `capstone-build-your-own-pentest-engine`; read each `## What this course relies on` row for this course and confirm the audited course still teaches the named concepts at definition level; edit the row and the capstone paragraph that restates it in the same commit if not. The content-shape test (CL1, CL4) must stay green.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/detection-engineering-and-siem-operations/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- The safe-lab rules are content requirements judged by the Content Quality Gate; the harness enforces the network part at run time, and SEC1 plus the safety scan are tests ([tech-docs/012](../../tech-docs/012-safe-lab-and-content-safety-rules.md)).
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–26 (26): from "Frame a Detection Hypothesis" to "Verify the Decoder-to-Alert Path".
- **co-02 · intermediate** — examples 27–52 (26): from "Model a Failed-Then-Success Chain" to "Verify Correlation and Tuning Together".
- **co-03 · advanced** — examples 53–78 (26): from "Build a Decoder Regression Test" to "Complete the Detection-Pack Capstone".

## Lineage

- Builds on: `defensive-security`, `just-enough-python`. Required by (in this plan): none.
- Listed as a prerequisite by plan 08's capstones: `capstone-build-your-own-pentest-engine` (read from plan 08's briefs on 2026-10-09).

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 98 of 121 in the manifest as specified by plan 02 (read 2026-10-09), phase `security`, role `extension`; this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 91 of 114 in the manifest as specified by plan 02 (read 2026-10-09), phase `security`, role `extension`; this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 92 of 116 in the manifest as specified by plan 02 (read 2026-10-09), phase `security`, role `extension`; this plan changes no path membership or order.
