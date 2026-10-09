# Technical Design — Audit of Product, Security, and AI Courses

This directory is the plan's single technical form. Read the companions in order; each one is self-contained enough for
a junior engineer to carry out its part.

| File                                                                                                         | What it covers                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [001-current-state-and-partition.md](./001-current-state-and-partition.md)                                   | The 45 courses (measured 2026-10-09), why these 45, the totals, and the baseline per course                                                                            |
| [002-definition-of-done-and-targets.md](./002-definition-of-done-and-targets.md)                             | The definition of done A1 to A10, targets by mode, the 20 defect classes, and the size-class rule                                                                      |
| [003-harness-conversion-design.md](./003-harness-conversion-design.md)                                       | Conversion families, `run.yaml` templates, determinism rules, the 13 Phase 1 spikes, static mode, and the illustration policy                                          |
| [004-toolchain-additions-and-ci-cost.md](./004-toolchain-additions-and-ci-cost.md)                           | The toolchains the catalog lacks, the budget rule, planning figures, shard simulation, and the response ladder                                                         |
| [005-prerequisites-ai-path-and-capstone-integrity.md](./005-prerequisites-ai-path-and-capstone-integrity.md) | Plan 02's prerequisites for the 45, the re-check, the integrity tests, the AI Engineer core, capstone relies-on rows, and the capstones that gain a `learning/` folder |
| [006-execution-model.md](./006-execution-model.md)                                                           | Waves in prerequisite order, the per-course pipeline with its 2-cycle caps, BLOCKED handling, the ledger, and commits and pushes                                       |
| [007-testing-strategy.md](./007-testing-strategy.md)                                                         | The tenth completion scenario, the new content-safety feature, the filler baseline ratchet, the series harness coverage gate, and the scenario-to-test map             |
| [008-decision-records.md](./008-decision-records.md)                                                         | Decisions D1 to D18 with alternatives, prior art, trade-offs, consequences, and revisit triggers                                                                       |
| [009-file-impact.md](./009-file-impact.md)                                                                   | Root-relative file-impact tree with `[N]`/`[E]`/`[D]`/`[G]`/`[C]` markers                                                                                              |
| [010-rule-and-docs-impact.md](./010-rule-and-docs-impact.md)                                                 | Rules AF1, AF2, SF1, and SF2, their homes and enforcement, and the docs to update                                                                                      |
| [011-ai-fixtures-and-sourcing-policy.md](./011-ai-fixtures-and-sourcing-policy.md)                           | Policies AI1 to AI7: the scripted model, offline fixtures, and sourcing fast-moving claims on the day they are written                                                 |
| [012-safe-lab-and-content-safety-rules.md](./012-safe-lab-and-content-safety-rules.md)                       | Plan 09's safe-lab rules S1 to S7, the additions SL1 to SL4, the boundary section, the three checks, and the scope per course                                          |

## Summary

1. **Courses.** The 45 existing application-development, AI-engineering, product-and-leadership, interview-preparation,
   and security courses are audited and fixed in place to the series definition of done: 27 By Example,
   7 Annotated Concept, 8 no-code Annotated Concept, and 3 capstones. Each meets its
   mode's floors, has a five-section drilling page of at least 5,000 words (a no-code course has five design
   exercises in place of katas), passes its mode quality gate and the Content Quality Gate with no blocking finding,
   and, where it has code, is green in plan 05's code harness. The briefs in [../syllabus/](../syllabus/README.md) say
   what each course needs. Two interview courses are corrected from `annotated-concept` to the no-code mode they
   already are (decision D3).
2. **Volume.** The courses hold 1,136,652 words today and 27 of them are short of their floors by
   476,972 words in all; 39 have a drilling page under 5,000 words. About 487,871 words must be
   written. The plan needs 2,831 harness units: 1,007 to create and 1,824 to convert.
   13 courses are size XL. The scale is reported to the user, with the waves as the seam for a split (decision D7).
3. **Harness.** Every example, kata, and capstone becomes a deterministic unit. Three mobile and desktop courses split
   by import: code that imports no platform framework runs for real, and the rest is `mode: static` under the reasons
   `android`, `ios`, and `windows`, with a sentence that says what the static run proves. The 13 AI courses with code
   run offline on a scripted model and stored responses. The six safety-scanned courses run attacks and sandboxes in
   process on synthetic data. Eight no-code courses are "not applicable" in the coverage report.
4. **Toolchains.** The plan adds no toolchain by default. Four candidates are written down with fallbacks and a
   four-part budget rule; a hash-locked wheel in a course is not an addition. Thirteen small spikes prove the hard
   cases before the courses that need them.
5. **CI.** At planning figures four shards never fit the final push and eight shards with a 120-minute `since` timeout
   do. `windows-app-development` alone is 42.0 planning minutes. The plan carries the ladder of plans 11 and 12 and
   decides on Phase 1 measurements.
6. **Execution.** 15 waves of at most three courses in prerequisite order; one commit per course; five
   checkpoint pushes; every loop capped at 2 cycles; a BLOCKED course is restored, recorded, and reported.
7. **Guards.** The tenth scenario of the audited-course completion feature registers the 45 courses; a new
   four-scenario content-safety feature keeps AI examples offline and security examples in process, behind a stated
   boundary, and inside the reserved addresses; six courses leave plan 09's filler baseline, which ends empty. Four
   small rules (AF1, AF2, SF1, SF2) outlive the plan.
8. **End state.** All 45 courses meet the definition of done, `ayokoding-www:examples:check` exits 0, and the coverage
   report shows 37 of 37 applicable courses covered and 8 not applicable, with a green
   full run on the same commit (decision 40, the last share before plan 14).

## Cross-Plan Assumptions

The series runs strictly in order (series decision 42), so plans 01 to 12 are merged when this plan starts and plan 14
has not started. Each assumption below is checked in Phase 0; a failed check stops the plan with a report to the user.
Names may differ slightly as merged: Phase 0 records the merged names and the rest of the plan uses them.

| From    | What this plan assumes                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Phase 0 check                                                                                                                                       |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan 02 | The prerequisite rubric (T1 to T4, L1, C1), the revised `prerequisites` of the 45 courses as listed in 005, closure and integrity rules R1 to R10 in `path-model-integrity.unit.test.ts`, `manifest-membership.unit.test.ts` with `legacy-membership.ts`, and `course-frontmatter.unit.test.ts`                                                                                                                                                                                                | Compare each course's merged frontmatter with the table in 005; `rtk git grep` for each test file; record differences                               |
| Plan 03 | Frontmatter keys `format`, `category`, `description`, `estimatedHours`; the formula and the drift test in `tests/unit/be-steps/course-metadata.steps.ts` that prints "Expected estimatedHours for every non-outline course"; a category taxonomy that gives these 45 courses; the `course-landing-header.feature` Start-button cases, including "Start falls back to the course overview"                                                                                                      | `rtk git grep` for the schema keys and the scenario title; read the category tables; read the Start-button feature and its three bindings           |
| Plan 05 | `apps/ayokoding-cli` with `examples validate`, `sync`, `run --record`, `check --course`, `coverage` with `--min-percent`, and `affected`; the Nx target `ayokoding-www:examples:check`; `ayokoding.run/v1`; the catalog ids in 004; the "Adding a Toolchain" procedure; the `examples-plan` job's shard rule and the `since` and `all` timeouts (60 and 300); `--shard K/N` by sorted slug; the closed set of static reasons                                                                   | `CLI-BUILD`, `TC-LIST`, and `EX-VALIDATE backend-essentials`; read the workflow and the selection code                                              |
| Plan 06 | The accounting convention this plan reuses: the five exact drilling `##` sections, the 5,000-word drilling floor, the Annotated Concept code-bearing share (27 of 45) and 10-diagram floor, and the completion-test pattern with exemptions                                                                                                                                                                                                                                                    | `rtk git grep` for `accounting-course-completion.feature`; read the targets as merged                                                               |
| Plan 07 | The execution ledger file already holds headings for earlier plans; the Blocked procedure and checkpoint-push strategy this plan adapts                                                                                                                                                                                                                                                                                                                                                        | Read `local-tmp/ayokoding-learn/execution-ledger.md` if it exists; append this plan's heading                                                       |
| Plan 08 | The AI Engineer path (goal `capstone-build-your-own-coding-agent`, a 12-course core, four `assumes`, 28 courses); `careers-ai-manifest.unit.test.ts` and `career-goals.unit.test.ts`; the capstone contract (CC1 to CC7, CL1 to CL4) and its step file `capstone-course-completion.steps.ts` with a constant of eight slugs and a general rule over `capstone-*`; the six capstones' `## What this course relies on` tables; the shape-2 Start-button exemption; the CI ladder possibly merged | Read the AI manifest and its test; read the capstone step file; search the capstones for this plan's slugs; read the merged `examples-plan` rule    |
| Plan 09 | The filler guard (`core/course-filler.ts`, rules FG1 to FG6; `course-filler-baseline.ts` with `FILLER_BASELINE`, `FILLER_BASELINE_CAP`, and `REWRITTEN_FILLER_COURSES`; `course-filler.steps.ts`); rules FILL1, FILL2, and SEC1 in `course-quality-guards.md`; the safe-lab rules S1 to S7 and accuracy rules A1 to A7; a baseline of 25 entries that ends at 17 after plan 09; a `clojure` catalog entry and a hash-locked jar recipe on `java`                                               | `rtk git grep` the baseline for the owner tag `plan-13`; read the merged catalog for `java` and `kotlin`; run `TC-BUILD java` and `TC-BUILD kotlin` |
| Plan 10 | The 48 new courses exist; some depend on these courses; catalog additions (for example WebAssembly)                                                                                                                                                                                                                                                                                                                                                                                            | Search the new courses' `prerequisites` for these 45 slugs; read the merged catalog                                                                 |
| Plan 11 | The audited-course completion feature with eight scenarios, `audited-course-completion.steps.ts`, `audited-courses.ts` (`AUDITED_COURSES`, `DEFERRED_BY_USER`, the `AUDIT_PROBE` reader); rules TC1 (judged) and TC2 (gated); the response-ladder rungs 2b, 2c, and 3 if its Phase 1 took them; its five filler entries removed (the cap at 12)                                                                                                                                                | Read the merged step file, registry, and scenario titles; list the baseline entries and the cap                                                     |
| Plan 12 | The ninth scenario; its six filler entries removed (the cap at 6, the six remaining entries tagged `plan-13`); rules AU1 to AU3; rungs 2t and 2d if its Phase 1 took them; service ids for its database courses (not used here)                                                                                                                                                                                                                                                                | Read the merged step file and baseline; read the merged selection code; record which rungs exist                                                    |
| Plan 14 | Not started. It requires an empty filler baseline and harness coverage of 100 percent; this plan removes its six entries, proves its share, and the final report names what plan 14 inherits                                                                                                                                                                                                                                                                                                   | None at start                                                                                                                                       |

## Vercel MCP Capability

- **In scope:** yes. `apps/ayokoding-www/vercel.json` covers every app path this plan changes.
- **Planning-time probe (2026-10-10, authoring session):** the authoring agent had no Vercel MCP tools available, so
  the server is treated as **absent**.
- **What follows:** the plan uses no Vercel tool. Production builds only from the `prod-ayokoding-www` branch. After
  merge, the workflow `.github/workflows/ayokoding-www-test-local-deploy-prod.yml` (scheduled, or dispatched) moves
  `main` to that branch; the plan dispatches it and checks the live site with Playwright. No step needs billing, usage,
  firewall, domain, or project settings.
- **Phase 0 re-probe:** the executor re-checks Vercel MCP availability and records the result. If the server is
  present, the plan still uses no Vercel tool. No Vercel identifiers are recorded.

## Corpus Disposition

`archive-with-plan`. The `syllabus/` corpus (45 course briefs, their index, and the path note) moves to `plans/done/`
with this plan. The durable products are the course pages under `apps/ayokoding-www/content/en/learn/courses/`, the
completion and content-safety tests under `apps/ayokoding-www/tests/unit/be-steps/`, and the four rules in the skill
modules; no checker, Nx target, build step, or shipped content reads the syllabus files. The packet owners read them
during execution only, as a plan input.

## Corpus Custody

- This plan is the custodian of its own corpus (`**Custodian**` line in [../syllabus/README.md](../syllabus/README.md)).
- It consumes other corpora read-only, as text, not as links: plan 02's revised prerequisite lists and rubric
  (`custodied-by:ayokoding-learn-revamp-02-path-model`), plan 08's AI Engineer manifest specification and capstone
  briefs (`custodied-by:ayokoding-learn-revamp-08-capstone-courses`), and the harness conversion design and CI decisions
  of plans 11 and 12 (`custodied-by:ayokoding-learn-revamp-11-audit-languages-and-tooling` and
  `custodied-by:ayokoding-learn-revamp-12-audit-cs-systems-and-data`). All of those plans are archived under
  `plans/done/` before this plan runs, so this plan names the facts instead of linking the files, and records every
  change against them in [../syllabus/paths/README.md](../syllabus/paths/README.md).
- Plan 14 may read this corpus for course names; it links to the shipped course pages, not into this corpus. If a live
  plan links into this corpus when this plan archives, the archival step rewrites that link (branch (a) of the custody
  rule).

## Out of Scope

- The seven courses in [001](./001-current-state-and-partition.md#the-partition) that plans 08 and 09 own, and every
  course that plans 11 and 12 audit.
- Courses that do not exist yet (plan 10), and any new topic, slug, path, or phase.
- Any path manifest change, except the AI manifest on the exception in
  [005](./005-prerequisites-ai-path-and-capstone-integrity.md#the-ai-engineer-path-core).
- Indonesian course content: `content/id/**` stays untouched (series decision 35).
- Any toolchain addition by default ([004](./004-toolchain-additions-and-ci-cost.md#the-toolchain-budget-rule)), a CI
  ratchet that runs the coverage gate on every pull request ([007](./007-testing-strategy.md#the-series-harness-coverage-gate)),
  and any weakening of a harness check; a harness defect is fixed at its root with a regression test.
- Deleting `learn/legacy`, redirects, and link repointing: plan 14 owns them.
