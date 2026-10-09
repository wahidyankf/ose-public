# IT and Application Security (Annotated Concept (standard))

**Course ID**: `it-and-application-security` · **Format**: Annotated Concept (standard) · **Family**: security.

**Scope note**: Audits and fixes the existing `it-and-application-security` course to the series definition of done and brings every example green in plan 05's code harness. The subject, slug, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course (except a capstone's `relies-on` row, CP-7).

**Short summary**: Security in IT and applications: foundations, identity and access, and operations, with calculations and control design.

## Why this exists · the big idea

- **The problem before the solution**: 7,016 words for 52 worked examples (about 135 words each), 49 "Why It Matters" blocks under 50 words, six flat `ex-NN-*.py` files sitting in the capstone folder with no unit folders, and a drilling page (325 words) with nonstandard headings.
- **Keep-this-if-you-forget-everything**: Security work is choosing a control that fits a risk; every example states the risk, the control, and the check that shows the control works.

## Prerequisites

- **Prior courses**: `security-essentials`, `backend-at-scale`, `just-enough-python` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: Annotated Concept (standard). **Reason**: Annotated Concept (standard), as plan 03 records it: judgement with a code-bearing subset (27 of 45 or more); the existing Python files support a first 7 of them.
  A maker may not switch modes except where the reason above says so; a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user.
- **Mode-convention fit**: today the course needs `learning/overview.md`, worked-example pages (by theme), and `learning/capstone/`; CP-1 checks the layout against the mode checker. Example headings per page today: `learning/foundations.md` (18), `learning/identity.md` (20), `learning/operations.md` (14).
- **Wave**: 4 (slot 3); **size class**: L (words to write 14,984, new unit folders 32); **expected defect classes**: 11 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                    | Target                                                                                                                                                               | Work                            |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 7,016                                                                                                                                                                              | at least 22,000                                                                                                                                                      | 14,984 to write                 |
| Examples as `### Worked Example N: Title`                     | 52                                                                                                                                                                                 | at least 45, numbered 1 to N without gaps                                                                                                                            | none                            |
| Mermaid diagrams                                              | 3                                                                                                                                                                                  | at least 10 (this plan's target)                                                                                                                                     | 7 to add                        |
| "Why It Matters" (50 to 100 words each)                       | 52 of 52 present; 49 under 50 words; 0 over 100; median 32 words                                                                                                                   | one per example, 50 to 100 words                                                                                                                                     | 49 to write or fix              |
| Annotation density (comment lines per code line)              | not measurable: no code-bearing examples of the mode's form today                                                                                                                  | 1.0 to 2.25 on every code-bearing example                                                                                                                            | all new                         |
| Code fences                                                   | 0 code fences in the lessons; 0 unanchored                                                                                                                                         | every code fence anchored or marked as an illustration (budget: 4 at most; cloud console and identity-provider screens)                                              | 0 to anchor                     |
| Lesson-to-file anchors (plan 05's method)                     | 0 path anchors (match 0, mismatch 0, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                                               | every anchor matches its file                                                                                                                                        | 0 to repair                     |
| Output blocks                                                 | 0 output fences; 0 unanchored                                                                                                                                                      | every `**Output**` block anchored to an expected file                                                                                                                | 0 to anchor                     |
| Harness units                                                 | 0 example folders, 0 kata folders, 9 code files, 0 `run.yaml`                                                                                                                      | 27 example units, 5 kata units, 1 capstone unit, each with a `run.yaml`                                                                                              | create 32, convert 1            |
| Drilling page                                                 | 325 words; 1 of 5 standard `##` sections exact; 4 `<details>` blocks; headings found: Recall Q&A, Calculation practice, Scenario judgment, Design exercise, Automaticity checklist | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) | 4,675 words short; fix sections |
| Katas                                                         | 0 kata folders                                                                                                                                                                     | at least 5 as `before`/`after` units                                                                                                                                 | 5                               |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                             | unchanged, except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                           | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X1** 9 code files (0 example folders, 0 kata folders, 0 test-like files); none has a `run.yaml`.
- **X2** Six flat `ex-NN-*.py` files (`ex-14-parameterized-query.py`, `ex-17-allowlist.py`, `ex-20-symmetric-encryption.py`, `ex-22-23-passwords.py`, `ex-25-signature.py`, `ex-34-jwt-integrity.py`) sit in `learning/capstone/code/`, and `crypto.py` sits flat in `learning/code/`; no `ex-NN` unit folder exists.
- **X5** 52 worked examples in 7,016 words (about 135 each) hold no fences; the lessons name the Python files but do not show them.
- **X8** 52 "Why It Matters" blocks present: 49 under 50 words, 0 over 100, median 32 words.
- **X11** Drilling: 325 words (4,675 short of 5,000); 1 of 5 exact `##` sections; 0 kata folders against 5.
- **X13** 7,016 words against a floor of 22,000; 14,984 to write.
- **X16** `argon2-cffi==25.1.0` and `cryptography==49.0.0` are pinned in two `requirements.txt` files without hashes; the wheels for the catalog's Python 3.14 are proved by spike SP3.
- **X17** Identity, SIEM, and cloud IAM scenarios need real services; the units model policy decisions (access checks, password-entropy arithmetic, log sampling) in Python on invented data.
- **X18** Standards and frameworks named (NIST, ISO 27001, OWASP, CIS, PCI DSS) are cited with their current edition and a dated Reference.
- **X19** 0 example folders exist against 27 example units: 27 to create.
- **X20** 3 Mermaid diagrams against this plan's floor of 10.

## Fixes and design

- Write the code-bearing worked examples (27 units) around a small fake identity provider, an access-decision function, and an audit log, on invented users and documentation-reserved addresses, with `argon2-cffi` and `cryptography` locked in one hash-locked `requirements.lock`; move the 6 flat files into unit folders.
- Lengthen the 49 short "Why It Matters" blocks; add diagrams (3 today) to 10; write the missing 14,984 words.
- Add 5 kata units, the drilling page (325 words today) at 5,000 words under the five exact headings, and the capstone unit (the existing capstone folder).
- Apply the safe-lab rules S1 to S7 (tech-docs/012).

## Harness mode and toolchain

- **Harness mode**: Real mode: `python` with a hash-locked `cryptography` and `argon2-cffi` lockfile.
- **Toolchain ids**: python (cryptography, argon2-cffi from a hash-locked lockfile).
- **Toolchain additions** (budget-gated, default NO-GO; [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-cost.md)): none; the lockfile is a course file.
- **Safe-lab boundary** (security course): Safe-lab rules S1 to S7 and the four additions SL1 to SL4 ([tech-docs/012](../../tech-docs/012-safe-lab-and-content-safety-rules.md)): synthetic data, no target, no attack code for real software, reserved addresses only (SEC1), fictional identifiers, and an in-process model for every target. The course keeps a `## Safety boundary` section, and the security-course safety scan finds no unexplained hit.
- **Phase 1 spikes**: SP3, SP11 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: at most 4 (cloud console and identity-provider screens).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 2.0 s per container invocation × 2 executions × 40 runs (27 examples + 2 × 5 kata runs + 3 capstone runs) ≈ 2.7 minutes.

## Size class and sequencing

- **Size class L** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 14,984 (the larger of the word gap and the drilling shortfall), new unit folders 32.
- **Estimated effort** (size, not time): class L; agent packets: authoring split by learning page (one packet per page), then one packet per remaining defect group.
- **Wave 4**, slot 3. Makers and fixers for this course: `apps-ayokoding-www-annotated-concept-maker` for authoring gaps, `tutorial-annotated-concept-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `it-governance-grc`, `offensive-security` (each is audited in a later wave, so this course is final first).

## Prerequisite re-check

- Plan 02 keeps the current list (the list above is the result).
- In-plan prerequisites are audited first: `security-essentials` in wave 2, `backend-at-scale` in wave 3.
- Prerequisites outside this plan (unchanged here): `just-enough-python`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-path-and-capstone-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `it-and-application-security` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-annotated-concept-checker` over the course folder; `AUDIT_PROBE=it-and-application-security:annotated-concept` with `UNIT-NODE tests/unit/be-steps/audited-course-completion.steps.ts` to record the scenarios the course fails; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (L): authoring split by learning page (one packet per page), then one packet per remaining defect group. Classes: X1, X2, X5, X8, X11, X13, X16, X17, X18, X19, X20.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `it-and-application-security`; a course that fires is fixed, never baselined.
- [ ] Units: 27 example units, 5 kata units, 1 capstone unit (create 32, convert 1); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 4 (cloud console and identity-provider screens).
- [ ] Safe lab: the security-course safety scan (S1 to S7, SL1 to SL4, tech-docs/012) finds no unexplained hit; the SEC1 address scan is clean; the `## Safety boundary` section is present in the learning overview; the Content Quality Gate is told to read it.
- [ ] CP-3 `tutorial-annotated-concept-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `it-and-application-security` exits 0 (at most 2 repair cycles); `EX-COVERAGE` shows `covered: true` for `it-and-application-security`.
- [ ] CP-6 The registry row for `it-and-application-security` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit it-and-application-security course` with explicit paths only: the course folder with its `_index.md`, the registry row.
- [ ] CP-7 Capstone relies-on: `rtk git grep -n "it-and-application-security" -- 'apps/ayokoding-www/content/en/learn/courses/capstone-*/learning/overview.md'` lists `capstone-real-world-delivery`, `capstone-secure-service`; read each `## What this course relies on` row for this course and confirm the audited course still teaches the named concepts at definition level; edit the row and the capstone paragraph that restates it in the same commit if not. The content-shape test (CL1, CL4) must stay green.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/it-and-application-security/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- The safe-lab rules are content requirements judged by the Content Quality Gate; the harness enforces the network part at run time, and SEC1 plus the safety scan are tests ([tech-docs/012](../../tech-docs/012-safe-lab-and-content-safety-rules.md)).
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · foundations** — examples 1–18 (18): from "Map the CIA triad" to "See a deny-list bypass".
- **co-02 · identity** — examples 19–38 (20): from "Compare hashing and encryption" to "Distinguish XSS forms".
- **co-03 · operations** — examples 39–52 (14): from "Encode by context" to "Assemble a security assessment".

## Lineage

- Builds on: `security-essentials`, `backend-at-scale`, `just-enough-python`. Required by (in this plan): `it-governance-grc`, `offensive-security`.
- Listed as a prerequisite by plan 08's capstones: `capstone-real-world-delivery`, `capstone-secure-service` (read from plan 08's briefs on 2026-10-09).

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 95 of 121 in the manifest as specified by plan 02 (read 2026-10-09), phase `security`, role `extension`; this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 88 of 114 in the manifest as specified by plan 02 (read 2026-10-09), phase `security`, role `extension`; this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 89 of 116 in the manifest as specified by plan 02 (read 2026-10-09), phase `security`, role `extension`; this plan changes no path membership or order.
