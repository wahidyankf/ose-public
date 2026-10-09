# Technical Design — Audit of Language and Tooling Courses

This directory is the plan's single technical form. Read the companions in order; each one is
self-contained enough for a junior engineer to carry out its part.

| File                                                                                       | What it covers                                                                                                                   |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| [001-current-state-and-partition.md](./001-current-state-and-partition.md)                 | The 32 courses (measured 2026-10-09), why these 32, the totals, and the baseline per course                                      |
| [002-definition-of-done-and-targets.md](./002-definition-of-done-and-targets.md)           | The definition of done A1 to A10, targets by mode, the 20 defect classes, and the size-class rule                                |
| [003-harness-conversion-design.md](./003-harness-conversion-design.md)                     | Conversion families, `run.yaml` templates, determinism rules, the 18 Phase 1 spikes, static mode, and the illustration policy    |
| [004-toolchain-additions-and-ci-cost.md](./004-toolchain-additions-and-ci-cost.md)         | Toolchain candidates and the budget rule, planning figures, shard simulation, and the response ladder                            |
| [005-prerequisites-ai-core-and-integrity.md](./005-prerequisites-ai-core-and-integrity.md) | Plan 02's prerequisites for the 32, the re-check, the integrity tests, `estimatedHours`, and the AI Engineer core                |
| [006-execution-model.md](./006-execution-model.md)                                         | Waves in prerequisite order, the per-course pipeline with its 2-cycle caps, BLOCKED handling, the ledger, and commits and pushes |
| [007-testing-strategy.md](./007-testing-strategy.md)                                       | The completion test and its registry, the filler baseline ratchet, the scenario-to-test map, and manual checks                   |
| [008-decision-records.md](./008-decision-records.md)                                       | Decisions D1 to D16 with alternatives, prior art, trade-offs, consequences, and revisit triggers                                 |
| [009-file-impact.md](./009-file-impact.md)                                                 | Root-relative file-impact tree with `[N]`/`[E]`/`[D]`/`[G]`/`[C]` markers                                                        |
| [010-rule-and-docs-impact.md](./010-rule-and-docs-impact.md)                               | Rules TC1 and TC2, their homes and enforcement, and the docs to update                                                           |

## Summary

1. **Courses.** The 32 existing language, tooling, and infrastructure courses are audited and fixed in place
   to the series definition of done: 12 By Example, 15 Primer, 3 Annotated Concept, 1 no-code Annotated
   Concept, and 1 capstone. Each meets its mode's floors, has a five-section drilling page of at least 5,000
   words, passes its mode quality gate and the Content Quality Gate with no blocking finding, and is green in
   plan 05's code harness. The briefs in [../syllabus/](../syllabus/README.md) say what each course needs.
2. **Volume.** The courses hold 705,141 words today and are 305,207 words short of their floors, with
   95,746 more words of drilling to write. They need 2,571 harness units: 826 to create
   and 1,745 to convert.
3. **Harness.** Every example, kata, and capstone becomes a deterministic unit. Tools the sandbox cannot host
   are modelled and labelled; configuration is validated statically and labelled; the rest runs for real.
   Eighteen small spikes prove the hard cases before the courses that need them.
4. **Toolchains.** This plan adds no toolchain by default: any addition puts every push of this PR in FULL mode, and
   the plan's own load already needs a CI ladder. It reuses plan 09's `java` jar recipe where it can and does not
   re-add anything plan 09 added. Four candidates have honest fallbacks.
5. **CI.** At planning figures, four shards never fit the budget; eight shards and a 120-minute `since`
   timeout do. The plan carries the ladder and decides on Phase 1 measurements.
6. **Execution.** Eleven waves of at most three courses, in prerequisite order; one commit per course; four
   checkpoint pushes; every loop capped at 2 cycles; BLOCKED courses are restored, recorded, and reported.
7. **Guard.** A new content-shape test with a registry of audited courses keeps the mechanical floors after
   the plan archives. Five courses also leave plan 09's filler baseline.
8. **End state.** All 32 courses meet the definition of done, `ayokoding-www:examples:check` exits 0, and the
   coverage report shows 31 of 31 applicable courses covered (decision 40, this plan's share).

## Cross-Plan Assumptions

The series runs strictly in order (series decision 42), so plans 01 to 10 are merged when this plan starts
and plans 12 to 14 have not started. Each assumption below is checked in Phase 0; a failed check stops the
plan with a report to the user. Names may differ slightly as merged: Phase 0 records the merged names and
the rest of the plan uses them.

| From         | What this plan assumes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Phase 0 check                                                                                                                                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan 02      | The prerequisite rubric (T1 to T4, L1, C1), the revised `prerequisites` of the 32 courses as listed in 005, closure and integrity rules R1 to R10 in `path-model-integrity.unit.test.ts`, `manifest-membership.unit.test.ts` with `legacy-membership.ts`, and `course-frontmatter.unit.test.ts`                                                                                                                                                                                                                                                                                                                                                                                                   | Compare each course's merged frontmatter with the table in 005; `rtk git grep` for each test file; record differences                                                                                                                       |
| Plan 03      | Frontmatter keys `format`, `category`, `description`, `estimatedHours`; the formula and the drift test in `tests/unit/be-steps/course-metadata.steps.ts` that prints "Expected estimatedHours for every non-outline course"; category taxonomy that gives the 36 courses of this plan's three categories                                                                                                                                                                                                                                                                                                                                                                                          | `rtk git grep` for the schema keys and the scenario title; read the three category tables                                                                                                                                                   |
| Plan 05      | `apps/ayokoding-cli` with `examples validate`, `sync`, `run --record`, `check --course`, `coverage`, and `affected`; the Nx target `ayokoding-www:examples:check`; `ayokoding.run/v1`; the catalog ids in 004; the "Adding a Toolchain" procedure; the `examples-plan` job's shard rule and the `since` and `all` timeouts (60 and 300); `--shard K/N` by sorted slug                                                                                                                                                                                                                                                                                                                             | `CLI-BUILD`, `toolchains list`, and `examples validate --course just-enough-bash`; read the workflow and the selection code                                                                                                                 |
| Plan 06      | The accounting convention this plan reuses: the five exact drilling `##` sections, the 5,000-word drilling floor, the Annotated Concept code-bearing share (27 of 45) and 10-diagram floor, and the completion-test pattern with exemptions                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `rtk git grep` for `accounting-course-completion.feature`; read the drilling and Annotated Concept targets as merged                                                                                                                        |
| Plan 07      | The execution ledger file already holds headings for plans 06 to 10; the Blocked procedure and checkpoint-push strategy this plan adapts; ERP courses finished (none is a prerequisite of these 32)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Read `local-tmp/ayokoding-learn/execution-ledger.md` if it exists; append this plan's heading                                                                                                                                               |
| Plan 08      | The AI Engineer path with one goal and a 12-course core containing `just-enough-python` (1), `software-testing` (3), and `software-engineering-practices` (4); `careers-ai-manifest.unit.test.ts` and `career-goals.unit.test.ts`; the CI ladder (unit-count shards, 120-minute timeout) possibly already merged; the SRE budget figures (43.2 minutes; burn rates 14.4, 6, 1)                                                                                                                                                                                                                                                                                                                    | Read the AI manifest and its test; read the merged `examples-plan` rule; search the capstone for the SRE figures                                                                                                                            |
| Plan 09      | The filler guard (`core/course-filler.ts` with rules FG1 to FG6, `course-filler-baseline.ts` with `FILLER_BASELINE` and `FILLER_BASELINE_CAP`, `course-filler.steps.ts`, `course-filler-guard.feature`); rules FILL1, FILL2, and SEC1 in the new module `course-quality-guards.md`; a baseline that starts at 25 entries and ends at 17 after plan 09, with five entries tagged `plan-11` (`just-enough-cpp`, `just-enough-go`, `just-enough-java`, `building-production-cli-tools`, `cicd-and-release-engineering`); a new `clojure` catalog entry; a hash-locked jar recipe on the `java` entry; probe P9 (Spring Boot 4.1.1 offline), whose failure blocks `enterprise-java-and-the-jvm` there | `rtk git grep` the baseline for owner `plan-11` and list the entries and the cap; read the merged catalog for `java`, `kotlin`, and `clojure`; run `toolchains build java` and `toolchains build kotlin`; read plan 09's recorded P9 result |
| Plan 10      | The 48 new courses exist; some depend on this plan's courses (for example the Java, Kotlin, and Ktor courses); the legacy-to-course mapping may mark topics `covered` by these 32 courses; catalog additions (WebAssembly, and Clojure if plan 09 did not already add it)                                                                                                                                                                                                                                                                                                                                                                                                                         | Search the new courses' `prerequisites` for these 32 slugs; read the mapping rows that name them (optional source material); read the merged catalog                                                                                        |
| Plans 12, 13 | Not started. They reuse the registry, the harness conversion design, and the CI decisions recorded here, and remove their own baseline entries                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | None at start; the final report names what they inherit                                                                                                                                                                                     |
| Plan 14      | Not started. It requires an empty filler baseline and harness coverage of 100 percent; this plan removes its five entries and records its share                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | None at start                                                                                                                                                                                                                               |

## Vercel MCP Capability

- **In scope:** yes. `apps/ayokoding-www/vercel.json` covers every app path this plan changes.
- **Planning-time probe (2026-10-09, authoring session):** the authoring agent had no Vercel MCP tools
  available, so the server is treated as **absent**.
- **What follows:** the plan uses no Vercel tool. Production builds only from the `prod-ayokoding-www`
  branch. After merge, the workflow `.github/workflows/ayokoding-www-test-local-deploy-prod.yml` (scheduled,
  or dispatched) moves `main` to that branch; the plan dispatches it and checks the live site with Playwright.
  No step needs billing, usage, firewall, domain, or project settings.
- **Phase 0 re-probe:** the executor re-checks Vercel MCP availability and records the result. If the server
  is present, the plan still uses no Vercel tool. No Vercel identifiers are recorded.

## Corpus Disposition

`archive-with-plan`. The `syllabus/` corpus (32 course briefs, their index, and the path note) moves to
`plans/done/` with this plan. The durable products are the course pages under
`apps/ayokoding-www/content/en/learn/courses/` and the completion test under
`apps/ayokoding-www/tests/unit/be-steps/`; no checker, Nx target, build step, or shipped content reads the
syllabus files. The packet owners read them during execution only, as a plan input.

## Corpus Custody

- This plan is the custodian of its own corpus (`**Custodian**` line in
  [../syllabus/README.md](../syllabus/README.md)).
- It consumes two other corpora read-only, as text, not as links: plan 02's revised prerequisite lists and
  rubric (`custodied-by:ayokoding-learn-revamp-02-path-model`) and plan 08's AI Engineer manifest specification
  (`custodied-by:ayokoding-learn-revamp-08-capstone-courses`). Both plans are archived under `plans/done/`
  before this plan runs, so this plan names the facts instead of linking the files, and records every change
  against them in [../syllabus/paths/README.md](../syllabus/paths/README.md).
- Plans 12 and 13 may read this corpus for course names and the conversion design; they link to the shipped
  course pages, not into this corpus. If a live plan links into this corpus when this plan archives, the
  archival step rewrites that link (branch (a) of the custody rule).

## Out of Scope

- The four courses in [001](./001-current-state-and-partition.md#the-partition) that plans 08 and 09 own, and
  every course that plans 12 and 13 audit.
- Courses that do not exist yet (plan 10), and any new topic, slug, path, or phase.
- Any path manifest change, except the AI manifest on the exception in
  [005](./005-prerequisites-ai-core-and-integrity.md#the-ai-engineer-path-core).
- Indonesian course content: `content/id/**` stays untouched (series decision 35).
- Any toolchain addition by default ([004](./004-toolchain-additions-and-ci-cost.md#the-toolchain-budget-rule)),
  and any weakening of a harness check; a harness defect is fixed at its root with a regression test.
