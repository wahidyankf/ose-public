# Offensive Security (By Example)

**Course ID**: `offensive-security` · **Format**: By Example · **Family**: security.

**Scope note**: Audits and fixes the existing `offensive-security` course to the series definition of done and brings every example green in plan 05's code harness. The subject, slug, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course (except a capstone's `relies-on` row, CP-7).

**Short summary**: Authorized security testing as an engagement: scope, rules of engagement, reconnaissance, exploitation reasoning, evidence, findings, and cleanup, in an isolated lab.

## Why this exists · the big idea

- **The problem before the solution**: 78 worked examples average about 50 words each (3,889 words in all); there is no program, output, or anchor for any example, only 4 files in the course, and the headings use the wrong form for the mode.
- **Keep-this-if-you-forget-everything**: Authorization comes first and evidence comes last; every example is a decision inside a lab that the learner owns.

## Prerequisites

- **Prior courses**: `it-and-application-security`, `security-essentials`, `just-enough-bash` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example. **Reason**: By Example, as plan 03 records it: 75 or more examples, each a small decision with a program or a recorded fixture. The headings are `### Worked Example N`, which belongs to Annotated Concept, and are renamed to `### Example N`.
  A maker may not switch modes except where the reason above says so; a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user.
- **Mode-convention fit**: today the course fits the convention: `overview.md` plus beginner, intermediate, and advanced pages. Example headings per page today: `learning/advanced.md` (24), `learning/beginner.md` (26), `learning/intermediate.md` (28).
- **Wave**: 10 (slot 1); **size class**: XL (words to write 24,111, new unit folders 87); **expected defect classes**: 12 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                                                                                                                          | Target                                                                                                                                                               | Work                            |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 3,889                                                                                                                                                                                                                                                                                    | at least 28,000                                                                                                                                                      | 24,111 to write                 |
| Examples as `### Example N: Title`                            | 0 (78 more in the wrong form)                                                                                                                                                                                                                                                            | at least 75, numbered 1 to N without gaps                                                                                                                            | none; rename the headings       |
| Mermaid diagrams                                              | 1                                                                                                                                                                                                                                                                                        | 30 to 50 (adapter band)                                                                                                                                              | 29 to add                       |
| "Why It Matters" (50 to 100 words each)                       | none of 78 examples has one                                                                                                                                                                                                                                                              | one per example, 50 to 100 words                                                                                                                                     | 78 to write                     |
| Annotation density (comment lines per code line)              | not measurable: no code-bearing examples of the mode's form today                                                                                                                                                                                                                        | 1.0 to 2.25 on every code-bearing example                                                                                                                            | all new                         |
| Code fences                                                   | 1 code fences in the lessons; 1 unanchored                                                                                                                                                                                                                                               | every code fence anchored or marked as an illustration (budget: 10 at most; tool command lines (shown with the authorization banner) and lab-setup steps)            | 1 to anchor                     |
| Lesson-to-file anchors (plan 05's method)                     | 0 path anchors (match 0, mismatch 0, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                                                                                                                                                     | every anchor matches its file                                                                                                                                        | 0 to repair                     |
| Output blocks                                                 | 0 output fences; 0 unanchored                                                                                                                                                                                                                                                            | every `**Output**` block anchored to an expected file                                                                                                                | 0 to anchor                     |
| Harness units                                                 | 0 example folders, 0 kata folders, 4 code files, 0 `run.yaml`                                                                                                                                                                                                                            | 78 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                              | create 87, convert 0            |
| Drilling page                                                 | 233 words; 0 of 5 standard `##` sections exact; 0 `<details>` blocks; headings found: 1. Recall: state the engagement gate, 2. Judgment: reject an unsafe request, 3. Code: validate a local-only scope, 4. Transfer: turn evidence into a finding, 5. Self-check: close the lab cleanly | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) | 4,767 words short; fix sections |
| Katas                                                         | 0 kata folders                                                                                                                                                                                                                                                                           | at least 8 as `before`/`after` units                                                                                                                                 | 8                               |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                                                                                                                   | unchanged, except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                           | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X1** 4 code files (0 example folders, 0 kata folders, 0 test-like files); none has a `run.yaml`.
- **X3** 1 of 1 code fences is neither anchored nor marked as illustrations.
- **X5** The three level pages hold 78 paragraphs of about 50 words and 1 fence; no example shows a program or an output.
- **X6** 78 headings use `### Worked Example N: Title` in a By Example course.
- **X7** The overview has no `## Examples by Level` heading (CRITICAL under the adapter); 78 of 78 examples have no "Why It Matters" block.
- **X11** Drilling: 233 words (4,767 short of 5,000); 0 of 5 exact `##` sections; 0 kata folders against 8.
- **X13** 3,889 words against a floor of 28,000; 24,111 to write.
- **X15** 3 of the 4 files mention `localhost` or `127.0.0.1` as scope strings (the scope checker rejects any other target); none opens a socket, and the units keep it that way.
- **X17** A vulnerable target (Juice Shop, DVWA) and an attack tool (nmap, sqlmap, Metasploit) are named but cannot run here. The units model the target as an in-process Python object with inert fixture strings, and the lessons say that no real tool runs.
- **X18** The course names Python 3.13 1 times; the catalog pin is 3.14.8, so the text and recorded output are aligned to the pin.
- **X19** 0 example folders exist against 78 example units: 78 to create.
- **X20** 1 Mermaid diagrams against the band of 30 to 50.

## Fixes and design

- Rename the 78 headings to `### Example N: Title`; write the lessons around 75 or more units (about 24,000 words): a scope-checker, a finding validator, an evidence parser, and decision logic over an in-process vulnerable-app model with inert payload strings.
- Apply the safe-lab rules S1 to S7 (tech-docs/012): no real exploit, no working payload for real software, no scanning of any address except the loopback model, no credential, no step that needs a network.
- Create 87 units (78 examples, 8 katas, 1 capstone), reuse the 4 existing files (`check_scope.sh`, `lab-evidence.json`, 2 Python files) as shared files, write the drilling page (233 words today) at 5,000 words, and add diagrams to the band.

## Harness mode and toolchain

- **Harness mode**: Real mode: `python` and `shell`; every target is a model.
- **Toolchain ids**: python; shell.
- **Toolchain additions** (budget-gated, default NO-GO; [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-cost.md)): none; no scanner or vulnerable-app image is added.
- **Safe-lab boundary** (security course): Safe-lab rules S1 to S7 and the four additions SL1 to SL4 ([tech-docs/012](../../tech-docs/012-safe-lab-and-content-safety-rules.md)): synthetic data, no target, no attack code for real software, reserved addresses only (SEC1), fictional identifiers, and an in-process model for every target. The course keeps a `## Safety boundary` section, and the security-course safety scan finds no unexplained hit.
- **Phase 1 spikes**: SP11 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: at most 10 (tool command lines (shown with the authorization banner) and lab-setup steps).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 2.0 s per container invocation × 2 executions × 97 runs (78 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 6.5 minutes.

## Size class and sequencing

- **Size class XL** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 24,111 (the larger of the word gap and the drilling shortfall), new unit folders 87.
- **Estimated effort** (size, not time): class XL; agent packets: authoring split by learning page and again by blocks of at most 15 examples, then one packet per remaining defect group; the course folder is committed only when every unit exists.
- **Wave 10**, slot 1. Makers and fixers for this course: `apps-ayokoding-www-by-example-maker` for authoring gaps, `tutorial-by-example-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 keeps the current list (the list above is the result).
- In-plan prerequisites are audited first: `it-and-application-security` in wave 4, `security-essentials` in wave 2.
- Prerequisites outside this plan (unchanged here): `just-enough-bash`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-path-and-capstone-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `offensive-security` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder; `AUDIT_PROBE=offensive-security:by-example` with `UNIT-NODE tests/unit/be-steps/audited-course-completion.steps.ts` to record the scenarios the course fails; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (XL): authoring split by learning page and again by blocks of at most 15 examples, then one packet per remaining defect group; the course folder is committed only when every unit exists. Classes: X1, X3, X5, X6, X7, X11, X13, X15, X17, X18, X19, X20.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `offensive-security`; a course that fires is fixed, never baselined.
- [ ] Units: 78 example units, 8 kata units, 1 capstone unit (create 87, convert 0); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 10 (tool command lines (shown with the authorization banner) and lab-setup steps).
- [ ] Safe lab: the security-course safety scan (S1 to S7, SL1 to SL4, tech-docs/012) finds no unexplained hit; the SEC1 address scan is clean; the `## Safety boundary` section is present in the learning overview; the Content Quality Gate is told to read it.
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `offensive-security` exits 0 (at most 2 repair cycles); `EX-COVERAGE` shows `covered: true` for `offensive-security`.
- [ ] CP-6 The registry row for `offensive-security` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit offensive-security course` with explicit paths only: the course folder with its `_index.md`, the registry row.
- [ ] CP-7 Capstone relies-on: `rtk git grep -n "offensive-security" -- 'apps/ayokoding-www/content/en/learn/courses/capstone-*/learning/overview.md'` lists `capstone-build-your-own-pentest-engine`, `capstone-real-world-delivery`, `capstone-secure-service`; read each `## What this course relies on` row for this course and confirm the audited course still teaches the named concepts at definition level; edit the row and the capstone paragraph that restates it in the same commit if not. The content-shape test (CL1, CL4) must stay green.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/offensive-security/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- The safe-lab rules are content requirements judged by the Content Quality Gate; the harness enforces the network part at run time, and SEC1 plus the safety scan are tests ([tech-docs/012](../../tech-docs/012-safe-lab-and-content-safety-rules.md)).
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–26 (26): from "Record authorization" to "Review a recorded request".
- **co-02 · intermediate** — examples 27–54 (28): from "Describe an injection boundary" to "Show salt's purpose".
- **co-03 · advanced** — examples 55–78 (24): from "Explain an out-of-bounds write" to "Prepare the local capstone".

## Lineage

- Builds on: `it-and-application-security`, `security-essentials`, `just-enough-bash`. Required by (in this plan): none.
- Listed as a prerequisite by plan 08's capstones: `capstone-build-your-own-pentest-engine`, `capstone-real-world-delivery`, `capstone-secure-service` (read from plan 08's briefs on 2026-10-09).

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 96 of 121 in the manifest as specified by plan 02 (read 2026-10-09), phase `security`, role `extension`; this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 89 of 114 in the manifest as specified by plan 02 (read 2026-10-09), phase `security`, role `extension`; this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 90 of 116 in the manifest as specified by plan 02 (read 2026-10-09), phase `security`, role `extension`; this plan changes no path membership or order.
