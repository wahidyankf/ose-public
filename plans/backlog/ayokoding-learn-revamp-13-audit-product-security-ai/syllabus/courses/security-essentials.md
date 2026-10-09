# Security Essentials (By Example)

**Course ID**: `security-essentials` · **Format**: By Example · **Family**: security.

**Scope note**: Audits and fixes the existing `security-essentials` course to the series definition of done and brings every example green in plan 05's code harness. The subject, slug, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course (except a capstone's `relies-on` row, CP-7).

**Short summary**: Security for working developers: threat thinking, authentication and sessions, injection and validation, secrets, TLS, dependencies, and a hardened service.

## Why this exists · the big idea

- **The problem before the solution**: Content is the largest in the plan (102,328 words, 80 examples), but 130 of 130 code fences and 94 of 94 output blocks are unanchored, 8 of 11 path anchors mismatch, the drilling page has 4 of 5 sections, and 58 of 132 code files use network or socket words.
- **Keep-this-if-you-forget-everything**: Security bugs are inputs the author did not imagine; every example shows the attack input, the vulnerable code, and the fix, against a program that cannot reach the outside.

## Prerequisites

- **Prior courses**: `just-enough-python`, `sql-essentials`, `backend-essentials` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example. **Reason**: By Example, as plan 03 records it: 80 Python programs, each with a vulnerable and a fixed version.
  A maker may not switch modes except where the reason above says so; a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user.
- **Mode-convention fit**: today the course fits the convention: `overview.md` plus beginner, intermediate, and advanced pages. Example headings per page today: `learning/advanced.md` (31), `learning/beginner.md` (27), `learning/intermediate.md` (22).
- **Wave**: 2 (slot 2); **size class**: S (words to write 0, new unit folders 8); **expected defect classes**: 12 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                         | Target                                                                                                                                                               | Work                   |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 102,328                                                                                                                                                 | at least 28,000                                                                                                                                                      | none                   |
| Examples as `### Example N: Title`                            | 80                                                                                                                                                      | at least 75, numbered 1 to N without gaps                                                                                                                            | none                   |
| Mermaid diagrams                                              | 21                                                                                                                                                      | 30 to 50 (adapter band)                                                                                                                                              | 9 to add               |
| "Why It Matters" (50 to 100 words each)                       | 80 of 80 present; 1 under 50 words; 0 over 100; median 68 words                                                                                         | one per example, 50 to 100 words                                                                                                                                     | 1 to write or fix      |
| Annotation density (comment lines per code line)              | median 1.04; 1 examples below 1.0; 0 above 2.25 (of 80 code-bearing)                                                                                    | 1.0 to 2.25 on every code-bearing example                                                                                                                            | 1 to fix               |
| Code fences                                                   | 141 code fences in the lessons; 130 unanchored                                                                                                          | every code fence anchored or marked as an illustration (budget: 10 at most; `openssl`, `curl`, and `docker` lines)                                                   | 130 to anchor          |
| Lesson-to-file anchors (plan 05's method)                     | 11 path anchors (match 3, mismatch 8, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                   | every anchor matches its file                                                                                                                                        | 8 to repair            |
| Output blocks                                                 | 94 output fences; 94 unanchored                                                                                                                         | every `**Output**` block anchored to an expected file                                                                                                                | 94 to anchor           |
| Harness units                                                 | 80 example folders, 0 kata folders, 132 code files, 0 `run.yaml`                                                                                        | 80 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                              | create 8, convert 81   |
| Drilling page                                                 | 8,364 words; 4 of 5 standard `##` sections exact; 44 `<details>` blocks; headings found: Recall Q&A, Applied problems, Code katas, Self-check checklist | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation) | words ok; fix sections |
| Katas                                                         | 0 kata folders                                                                                                                                          | at least 8 as `before`/`after` units                                                                                                                                 | 8                      |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                  | unchanged, except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                           | recompute              |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X1** 132 code files (80 example folders, 0 kata folders, 2 test-like files); none has a `run.yaml`.
- **X3** 130 of 141 code fences are neither anchored nor marked as illustrations; 8 anchors mismatch their files and 0 point at missing files.
- **X4** 94 of 94 `**Output**` blocks are not labelled anchors to expected files.
- **X7** The overview has no `## Examples by Level` heading (CRITICAL under the adapter).
- **X8** 80 "Why It Matters" blocks present: 1 under 50 words, 0 over 100, median 68 words.
- **X9** Annotation density: median 1.04; 1 examples below 1.0 and 0 above 2.25 (of 80 code-bearing).
- **X11** Drilling: 8,364 words; 4 of 5 exact `##` sections; 0 kata folders against 8.
- **X15** 58 of 132 files use network words (`localhost`, `urllib`, `socket`), 26 a database, 15 a random source, 10 a clock; sockets and servers become in-process calls, hashing salts and tokens use a fixed seed, and times come from a counter clock.
- **X16** FastAPI and Pydantic appear in 2 pinned mentions; the stack has no hash-locked requirements file (spike SP4 locks it once for the course).
- **X17** 2 files use `docker`/`sudo`-style system words and 1 a Windows API; they become illustrations or models.
- **X18** 10 mentions of Python 3.13.12 and 11 CVE references; versions are aligned to the catalog's 3.14, and each CVE is checked against the NVD at fix time and dated.
- **X20** 21 Mermaid diagrams against the band of 30 to 50.

## Fixes and design

- Anchor the 130 fences and 94 output blocks and repair the 8 mismatching anchors; convert the 80 example folders, 1 capstone, and 8 katas created to units.
- Remove every real network call: servers are WSGI-style callables, HTTP clients are test clients, TLS is a model of a handshake with fixed certificates in the unit; payloads are inert strings in fixtures (rule S2).
- Apply the safe-lab rules S1 to S7 (tech-docs/012); the capstone's `CAPSTONE_AUTH_SECRET` is a fixed fake value set by `run.yaml`.
- Add the missing drilling section, 9 diagrams to reach 30, and one low-density and one short "Why It Matters" repair.

## Harness mode and toolchain

- **Harness mode**: Real mode: `python` with a hash-locked FastAPI stack; `shell` for 2 scripts; in-process calls only.
- **Toolchain ids**: python (fastapi, pydantic from a hash-locked lockfile); shell.
- **Toolchain additions** (budget-gated, default NO-GO; [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-cost.md)): none.
- **Safe-lab boundary** (security course): Safe-lab rules S1 to S7 and the four additions SL1 to SL4 ([tech-docs/012](../../tech-docs/012-safe-lab-and-content-safety-rules.md)): synthetic data, no target, no attack code for real software, reserved addresses only (SEC1), fictional identifiers, and an in-process model for every target. The course keeps a `## Safety boundary` section, and the security-course safety scan finds no unexplained hit.
- **Phase 1 spikes**: SP4, SP11 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: at most 10 (`openssl`, `curl`, and `docker` lines).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 3.0 s per container invocation × 2 executions × 99 runs (80 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 9.9 minutes.

## Size class and sequencing

- **Size class S** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 0 (the larger of the word gap and the drilling shortfall), new unit folders 8.
- **Estimated effort** (size, not time): class S; agent packets: one packet per defect group (mechanical fixes, then prose fixes); no page split.
- **Wave 2**, slot 2. Makers and fixers for this course: `apps-ayokoding-www-by-example-maker` for authoring gaps, `tutorial-by-example-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: `backend-at-scale`, `capstone-first-working-software`, `capstone-full-stack-app`, `it-and-application-security`, `offensive-security` (each is audited in a later wave, so this course is final first).

## Prerequisite re-check

- Plan 02 removes `debugging-and-profiling`; adds `just-enough-python`, `sql-essentials`, `backend-essentials` (the list above is the result).
- In-plan prerequisites are audited first: `backend-essentials` in wave 1.
- Prerequisites outside this plan (unchanged here): `just-enough-python`, `sql-essentials`.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-path-and-capstone-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `security-essentials` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder; `AUDIT_PROBE=security-essentials:by-example` with `UNIT-NODE tests/unit/be-steps/audited-course-completion.steps.ts` to record the scenarios the course fails; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (S): one packet per defect group (mechanical fixes, then prose fixes); no page split. Classes: X1, X3, X4, X7, X8, X9, X11, X15, X16, X17, X18, X20.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `security-essentials`; a course that fires is fixed, never baselined.
- [ ] Units: 80 example units, 8 kata units, 1 capstone unit (create 8, convert 81); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 10 (`openssl`, `curl`, and `docker` lines).
- [ ] Safe lab: the security-course safety scan (S1 to S7, SL1 to SL4, tech-docs/012) finds no unexplained hit; the SEC1 address scan is clean; the `## Safety boundary` section is present in the learning overview; the Content Quality Gate is told to read it.
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `security-essentials` exits 0 (at most 2 repair cycles); `EX-COVERAGE` shows `covered: true` for `security-essentials`.
- [ ] CP-6 The registry row for `security-essentials` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit security-essentials course` with explicit paths only: the course folder with its `_index.md`, the registry row.
- [ ] CP-7 Capstone relies-on: `rtk git grep -n "security-essentials" -- 'apps/ayokoding-www/content/en/learn/courses/capstone-*/learning/overview.md'` lists `capstone-build-your-own-pentest-engine`, `capstone-secure-service`; read each `## What this course relies on` row for this course and confirm the audited course still teaches the named concepts at definition level; edit the row and the capstone paragraph that restates it in the same commit if not. The content-shape test (CL1, CL4) must stay green.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/security-essentials/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- The safe-lab rules are content requirements judged by the Content Quality Gate; the harness enforces the network part at run time, and SEC1 plus the safety scan are tests ([tech-docs/012](../../tech-docs/012-safe-lab-and-content-safety-rules.md)).
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–27 (27): from "Trust-Boundary Map -- Tainted Input" to "ORM Raw-Fragment Injection".
- **co-02 · intermediate** — examples 28–49 (22): from "Blind Boolean SQL Injection" to "Security Misconfiguration -- Debug Mode".
- **co-03 · advanced** — examples 50–80 (31): from "Directory Listing and Default Credentials" to "A Safe Error and Logging Review Under Fuzzing".

## Lineage

- Builds on: `just-enough-python`, `sql-essentials`, `backend-essentials`. Required by (in this plan): `backend-at-scale`, `capstone-first-working-software`, `capstone-full-stack-app`, `it-and-application-security`, `offensive-security`.
- Listed as a prerequisite by plan 08's capstones: `capstone-build-your-own-pentest-engine`, `capstone-secure-service` (read from plan 08's briefs on 2026-10-09).

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 11 of 121 in the manifest as specified by plan 02 (read 2026-10-09), phase `first-working-software`, role `core`; this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 12 of 114 in the manifest as specified by plan 02 (read 2026-10-09), phase `frontend-and-quality`, role `core`; this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 48 of 116 in the manifest as specified by plan 02 (read 2026-10-09), phase `backend-depth`, role `extension`; this plan changes no path membership or order.
