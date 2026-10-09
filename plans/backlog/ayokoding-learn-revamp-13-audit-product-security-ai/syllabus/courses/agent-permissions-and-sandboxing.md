# Agent Permissions & Sandboxing (By Example)

**Course ID**: `agent-permissions-and-sandboxing` · **Format**: By Example · **Family**: ai-engineering.

**Scope note**: Audits and fixes the existing `agent-permissions-and-sandboxing` course to the series definition of done and brings every example green in plan 05's code harness. The subject, slug, and place in every path stay; no new topic is added. It does not touch `content/id/**`, any path manifest (except an AI manifest update when a prerequisite changes), or another course (except a capstone's `relies-on` row, CP-7).

**Short summary**: Keeping an agent inside safe bounds: permission modes, allow and deny rules, path and command policies, sandbox layers, secrets, and audit trails.

## Why this exists · the big idea

- **The problem before the solution**: Plan 09's filler guard lists this course (FG2: unique-code ratio 0.06; FG6: repeated-paragraph share 0.29). The code files differ only by literals, 2 comment lines are copied 18 times each, the lessons are a table of links (2,861 words), and the count is 52 against a floor of 75.
- **Keep-this-if-you-forget-everything**: A permission system answers one question, allow or deny, and a sandbox limits the damage when the answer is wrong; every example asks the question of a fake host that can be inspected afterwards.

## Prerequisites

- **Prior courses**: `the-agent-loop` (plan 02's revised list as read on 2026-10-09).
- **Assumed knowledge**: as the course overview states it today; the audit keeps it unless the prerequisite re-check finds a gap.

## Mode and targets

- **Mode**: By Example. **Reason**: By Example, as plan 03 records it: 75 or more small policy programs, each with a fixed input and a printed decision.
  A maker may not switch modes except where the reason above says so; a course that does not fit its mode after 2 cycles is BLOCKED and the question goes to the user.
- **Mode-convention fit**: today the course fits the convention: `overview.md` plus beginner, intermediate, and advanced pages. Example headings per page today: `learning/advanced.md` (18), `learning/beginner.md` (16), `learning/intermediate.md` (18).
- **Wave**: 9 (slot 1); **size class**: XL (words to write 25,139, new unit folders 32); **expected defect classes**: 10 of 20.

| Measure                                                       | Today (2026-10-09, `bb7f90137`)                                                                                                                                                           | Target                                                                                                                                                                          | Work                            |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Words (all pages, code blocks included, frontmatter excluded) | 2,861                                                                                                                                                                                     | at least 28,000                                                                                                                                                                 | 25,139 to write                 |
| Examples as `### Example N: Title`                            | 52                                                                                                                                                                                        | at least 75, numbered 1 to N without gaps                                                                                                                                       | 23 to add                       |
| Mermaid diagrams                                              | 0                                                                                                                                                                                         | 30 to 50 (adapter band)                                                                                                                                                         | 30 to add                       |
| "Why It Matters" (50 to 100 words each)                       | none of 52 examples has one                                                                                                                                                               | one per example, 50 to 100 words                                                                                                                                                | 52 to write                     |
| Annotation density (comment lines per code line)              | not measurable: no code-bearing examples of the mode's form today                                                                                                                         | 1.0 to 2.25 on every code-bearing example                                                                                                                                       | all new                         |
| Code fences                                                   | 0 code fences in the lessons; 0 unanchored                                                                                                                                                | every code fence anchored or marked as an illustration (budget: 8 at most; real `bubblewrap`, `seccomp`, and container commands, shown as illustrations with the safety banner) | 0 to anchor                     |
| Lesson-to-file anchors (plan 05's method)                     | 0 path anchors (match 0, mismatch 0, missing 0); 0 labelled anchors (match 0, mismatch 0, missing 0)                                                                                      | every anchor matches its file                                                                                                                                                   | 0 to repair                     |
| Output blocks                                                 | 0 output fences; 0 unanchored                                                                                                                                                             | every `**Output**` block anchored to an expected file                                                                                                                           | 0 to anchor                     |
| Harness units                                                 | 52 example folders, 0 kata folders, 52 code files, 0 `run.yaml`                                                                                                                           | 75 example units, 8 kata units, 1 capstone unit, each with a `run.yaml`                                                                                                         | create 32, convert 52           |
| Drilling page                                                 | 147 words; 1 of 5 standard `##` sections exact; 0 `<details>` blocks; headings found: Recall Q&A, Scenario Judgment, Hands-on Implementation, Automaticity Checklist, Extension challenge | at least 5,000 words and the five exact `##` sections (Recall Q&A, Applied problems, Code katas, Self-check checklist, Elaborative interrogation & self-explanation)            | 4,853 words short; fix sections |
| Katas                                                         | 0 kata folders                                                                                                                                                                            | at least 8 as `before`/`after` units                                                                                                                                            | 8                               |
| Frontmatter                                                   | `format`, `category`, `description` from plan 03; no `status: outline`                                                                                                                    | unchanged, except `prerequisites` if CP-1 finds a rubric change; `estimatedHours` recomputed from plan 03's drift test after the last edit                                      | recompute                       |

## Expected defect classes

The class codes are defined in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#defect-classes). Each line below is a measured fact from 2026-10-09; CP-1 confirms or corrects it.

- **X1** 52 code files (52 example folders, 0 kata folders, 0 test-like files); none has a `run.yaml`.
- **X5** 2,861 words across 52 examples is about 55 words per example; a complete example in this mode needs about 373.
- **X7** The overview has no `## Examples by Level` heading (CRITICAL under the adapter); 52 of 52 examples have no "Why It Matters" block.
- **X11** Drilling: 147 words (4,853 short of 5,000); 1 of 5 exact `##` sections; 0 kata folders against 8.
- **X13** 2,861 words against a floor of 28,000; 25,139 to write.
- **X14** The plan 09 filler guard lists this course (owner `plan-13`): FG2 and FG6 on 2026-10-09. The comments "=> Production denies unsafe actions even when exploration permits them." and "=> The simulated harness proves policy without touching host resources." each appear 18 times in 52 files.
- **X15** The programs touch no clock, network, or random source (keyword scan found none); the risk is the opposite: a rewrite that touches a real path or process must not. Rule SL1 in tech-docs/012 keeps every host effect inside a fake filesystem, a fake process table, and a fake network.
- **X18** Sandbox and permission features (seccomp, Landlock, container isolation, product permission modes) change by release; the lessons describe the control and cite a dated Reference (policy AI7).
- **X19** 52 example folders exist against 75 example units: 23 to create.
- **X20** 0 Mermaid diagrams against the band of 30 to 50.
- **Filler baseline**: the course must stop firing every rule, and its entry leaves `FILLER_BASELINE` (and the cap falls by one) in the same commit as the course ([tech-docs/007](../../tech-docs/007-testing-strategy.md#the-filler-baseline-ratchet)).

## Fixes and design

- Rewrite the 52 programs so each differs in code, not only in literals (rule FG2 needs distinct code after comments and literals are stripped), and add 23 more to reach 75.
- Delete the two copied comment lines; annotate each program from its own policy rule and decision.
- Model a sandbox as data: a virtual filesystem with path normalization (traversal, symlink, and case cases), a command allow-list parser, a fake environment with fake secrets, and an audit log with counter times. No example executes a real command, opens a real socket, or reads a real path outside `/tmp`.
- Write the lessons (about 25,000 words), 8 kata units, the drilling page (147 words today), the diagrams (0 today) to the band, and remove the `agent-permissions-and-sandboxing` entry from `FILLER_BASELINE` in the same commit.

## Harness mode and toolchain

- **Harness mode**: Real mode: `python`, standard library only; the container is the real sandbox, and the examples model policy on data.
- **Toolchain ids**: python.
- **Toolchain additions** (budget-gated, default NO-GO; [tech-docs/004](../../tech-docs/004-toolchain-additions-and-ci-cost.md)): none.
- **Fixtures** (AI course): Deterministic fixtures only (policy AI1 to AI6 in [tech-docs/011](../../tech-docs/011-ai-fixtures-and-sourcing-policy.md)): a scripted `FakeModel`, recorded responses stored in the unit folder, no API key or provider variable read, no network, fixed seeds, and a counter clock. A call to a hosted model appears only as a marked illustration with a dated Reference.
- **Phase 1 spikes**: SP11, SP12 (defined in [tech-docs/003](../../tech-docs/003-harness-conversion-design.md#phase-1-spikes)).
- **Illustration budget**: at most 8 (real `bubblewrap`, `seccomp`, and container commands, shown as illustrations with the safety banner).
- **CI cost** (planning figure, replaced by the Phase 1 measurement): about 2.0 s per container invocation × 2 executions × 94 runs (75 examples + 2 × 8 kata runs + 3 capstone runs) ≈ 6.3 minutes.

## Size class and sequencing

- **Size class XL** by the rule in [tech-docs/002](../../tech-docs/002-definition-of-done-and-targets.md#size-class-rule): words to write 25,139 (the larger of the word gap and the drilling shortfall), new unit folders 32.
- **Estimated effort** (size, not time): class XL; agent packets: authoring split by learning page and again by blocks of at most 15 examples, then one packet per remaining defect group; the course folder is committed only when every unit exists.
- **Wave 9**, slot 1. Makers and fixers for this course: `apps-ayokoding-www-by-example-maker` for authoring gaps, `tutorial-by-example-fixer` for gate findings, `swe-developer` for units, `run.yaml`, and determinism.
- **Dependents in this plan**: none.

## Prerequisite re-check

- Plan 02 keeps the current list (the list above is the result).
- In-plan prerequisites are audited first: `the-agent-loop` in wave 5.
- CP-1 re-reads the first ten examples and the overview against the list (plan 02's rubric rules T1 and L1). A needed addition or a superfluous edge is a frontmatter `prerequisites` change, made together with plan 02's closure checks (R4, R7, R10) and, for an AI-path course, the AI manifest and its tests ([tech-docs/005](../../tech-docs/005-prerequisites-ai-path-and-capstone-integrity.md)).

## Per-course checklist

- [ ] CP-1 Audit: `EX-VALIDATE` and `EX-SYNC` for `agent-permissions-and-sandboxing` (plan 05 step M1) with the finding counts saved in the ledger; `tutorial-by-example-checker` over the course folder; `AUDIT_PROBE=agent-permissions-and-sandboxing:by-example` with `UNIT-NODE tests/unit/be-steps/audited-course-completion.steps.ts` to record the scenarios the course fails; compare the findings with the expected classes above and edit this brief if they differ materially.
- [ ] CP-2 Fix (XL): authoring split by learning page and again by blocks of at most 15 examples, then one packet per remaining defect group; the course folder is committed only when every unit exists. Classes: X1, X5, X7, X11, X13, X14, X15, X18, X19, X20.
- [ ] Filler guard: `UNIT-NODE tests/unit/be-steps/course-filler.steps.ts` prints no fired rule (FG1 to FG6) in the row for `agent-permissions-and-sandboxing`; a course that fires is fixed, never baselined.
- [ ] Units: 75 example units, 8 kata units, 1 capstone unit (create 32, convert 52); author workflow: edit, format, `EX-SYNC-WRITE`, `EX-RECORD`, read every recorded file.
- [ ] Illustration budget kept: at most 8 (real `bubblewrap`, `seccomp`, and container commands, shown as illustrations with the safety banner).
- [ ] AI fixtures: every unit uses the shared `FakeModel` and recorded responses (AI1 to AI6); `rtk git grep -n -E "api_key|API_KEY|openai|anthropic|requests|urllib|socket" -- <course>/learning/code <course>/drilling/code <course>/learning/capstone/code` shows no unexplained hit; every product, model, protocol, or price claim has a dated Reference within 30 days of the commit (AI7).
- [ ] Safe lab: the safety scan (rules SL1 to SL3, tech-docs/012) finds no unexplained hit in `learning/code`, `drilling/code`, and `learning/capstone/code`; every sandbox and permission example acts on a fake filesystem, a fake process table, and a fake network, and the reserved-address scan is clean; the `## Safety boundary` section is present in the learning overview; the Content Quality Gate is told to read tech-docs/012.
- [ ] CP-3 `tutorial-by-example-quality-gate` (`mode: normal`, `max-cycles: 2`) ends `PASS` or `PASS_WITH_FINDINGS` with no open `needs-decision` row.
- [ ] CP-4 Content Quality Gate (`mode: normal`, `max-cycles: 2`), same rule.
- [ ] CP-5 `EX-CHECK` for `agent-permissions-and-sandboxing` exits 0 (at most 2 repair cycles); `EX-COVERAGE` shows `covered: true` for `agent-permissions-and-sandboxing`.
- [ ] CP-6 The registry row for `agent-permissions-and-sandboxing` is green in the completion test; `estimatedHours` recomputed after the last edit; ledger row complete; one commit `fix(ayokoding-www): audit agent-permissions-and-sandboxing course` with explicit paths only: the course folder with its `_index.md`, the registry row. Delete the `agent-permissions-and-sandboxing` entry from `FILLER_BASELINE` and lower `FILLER_BASELINE_CAP` by one in the same commit; `course-filler.steps.ts` stays green without the entry.
- [ ] CP-7 Capstone relies-on: `rtk git grep -n "agent-permissions-and-sandboxing" -- 'apps/ayokoding-www/content/en/learn/courses/capstone-*/learning/overview.md'` lists `capstone-build-your-own-coding-agent`, `capstone-build-your-own-pentest-engine`; read each `## What this course relies on` row for this course and confirm the audited course still teaches the named concepts at definition level; edit the row and the capstone paragraph that restates it in the same commit if not. The content-shape test (CL1, CL4) must stay green.

## Accuracy notes

- Every number in this file was measured on 2026-10-09 at `origin/main` `bb7f90137` by read-only scans of `apps/ayokoding-www/content/en/learn/courses/agent-permissions-and-sandboxing/` (stable repository facts; Phase 0 and CP-1 re-measure).
- Toolchain ids and versions are plan 05's catalog pins as read on 2026-10-09; Phase 0 re-reads the merged catalog and records any change.
- The prerequisite list is plan 02's revised list as read on 2026-10-09; Phase 0 compares it with the merged frontmatter.
- CI minutes are planning figures with invented per-invocation seconds, not measurements; Phase 1 replaces them.
- Claims about products, models, protocols, prices, and limits are not facts of this brief: the maker re-verifies each one against its primary source on the day it writes it and records the value and date in the ledger (accuracy rules A1 to A7 and policy AI7).
- Facts the lessons teach (versions, flags, behaviour) are re-checked against current sources by the mode checker and `docs-validating-factual-accuracy` in cycle 1; this brief makes no claim about them.

## Concepts

The concepts are the course's pages as taught today; CP-1 may refine them.

- **co-01 · beginner** — examples 1–16 (16): from "Unconstrained Agent Risk" to "Failsafe Default Deny".
- **co-02 · intermediate** — examples 17–34 (18): from "Container Sandboxed Shell" to "Policy Driven Permissions".
- **co-03 · advanced** — examples 35–52 (18): from "Fully Sandboxed Coding Agent" to "Capstone Guarded Agent".

## Lineage

- Builds on: `the-agent-loop`. Required by (in this plan): none.
- Listed as a prerequisite by plan 08's capstones: `capstone-build-your-own-coding-agent`, `capstone-build-your-own-pentest-engine` (read from plan 08's briefs on 2026-10-09).

## In which paths

- `careers/fundamentally-strong/software-engineer` — position 109 of 121 in the manifest as specified by plan 02 (read 2026-10-09), phase `ai-and-agents`, role `extension`; this plan changes no path membership or order.
- `careers/immediately-effective/ai-engineer` — position 10 of 28 in the manifest as specified by plan 08 (read 2026-10-09), phase `agents`, role `core`; this plan changes no path membership or order.
- `careers/immediately-effective/software-engineer` — position 106 of 114 in the manifest as specified by plan 02 (read 2026-10-09), phase `ai-and-agents`, role `extension`; this plan changes no path membership or order.
- `careers/interview-ready/software-engineer` — position 107 of 116 in the manifest as specified by plan 02 (read 2026-10-09), phase `ai-and-agents`, role `extension`; this plan changes no path membership or order.
- `careers/immediately-effective/ai-engineer` — a prerequisite change here also changes that manifest, its `assumes`, and its tests in the same PR (plan 02's rule R6, plan 08's duty).
