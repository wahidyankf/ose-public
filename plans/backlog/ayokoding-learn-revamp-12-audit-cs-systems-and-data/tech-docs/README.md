# Technical Design — Audit of Computer Science, Systems, and Data Courses

This directory is the plan's single technical form. Read the companions in order; each one is self-contained enough
for a junior engineer to carry out its part.

| File                                                                                                 | What it covers                                                                                                                                         |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [001-current-state-and-partition.md](./001-current-state-and-partition.md)                           | The 34 courses (measured 2026-10-09), why these 34, how much is audit and how much is authoring, the totals, and the baseline per course               |
| [002-definition-of-done-and-audit-method.md](./002-definition-of-done-and-audit-method.md)           | The definition of done C1 to C11, targets by mode, the 17 defect classes, the size-class rule, and the audit method                                    |
| [003-harness-modes-simulation-and-determinism.md](./003-harness-modes-simulation-and-determinism.md) | Harness modes per course, the simulation convention, service-backed units, networking, hardware, OS and Windows courses, locks, and determinism rules  |
| [004-toolchain-additions-and-ci-budget.md](./004-toolchain-additions-and-ci-budget.md)               | The seven toolchain ids, the budget rule, plan 09's changes and probe P9, planning figures, the response ladder, and the 13 Phase 1 spikes             |
| [005-execution-model-waves-and-ledger.md](./005-execution-model-waves-and-ledger.md)                 | Waves in prerequisite order, the per-course pipeline with its 2-cycle caps, BLOCKED handling, the ledger, and commits and pushes                       |
| [006-prerequisites-metadata-and-closure.md](./006-prerequisites-metadata-and-closure.md)             | Plan 02's prerequisites for the 34, order inside the plan, the re-check, the integrity tests, `estimatedHours`, the AI path, and `capstone-solid-core` |
| [007-testing-strategy.md](./007-testing-strategy.md)                                                 | The completion test and its registry (the ninth scenario), the filler baseline ratchet, the scenario-to-test map, CLI tests, and manual checks         |
| [008-decision-records.md](./008-decision-records.md)                                                 | Decisions D1 to D15 with alternatives, prior art, trade-offs, consequences, and revisit triggers                                                       |
| [009-file-impact.md](./009-file-impact.md)                                                           | Root-relative file-impact tree with `[N]`/`[E]`/`[D]`/`[G]`/`[C]` markers                                                                              |
| [010-rule-and-docs-impact.md](./010-rule-and-docs-impact.md)                                         | Rules AU1 to AU3, the rules applied from plans 05, 08, 09, and 11, their homes and enforcement, and the docs to update                                 |

## Summary

1. **Courses.** The 34 existing computer science, systems and networking, data and database, and architecture
   courses are audited and fixed in place to the series definition of done: 28 By Example, 5 Annotated Concept, and 1
   capstone. Each meets its mode's floors, has a five-section drilling page of at least 5,000 words, passes its mode
   quality gate and the Content Quality Gate with no blocking finding, and is green in plan 05's code harness. The
   briefs in [../syllabus/](../syllabus/README.md) say what each course needs.
2. **Not only an audit.** About 14 to 16 of the courses need real authoring: 14 need 3,000 or more words written
   (270,187 words in all, six of them templated filler), and two more (`computer-architecture`,
   `advanced-networking`) need heavy rewriting of their code units. The rest are repairs.
3. **Volume.** The courses hold 1,544,294 words today and are 257,144 words short of their floors; the drilling pages
   alone are 66,257 words short of their 5,000-word floors. They need 2,863 harness units: 2,151 convert existing code and
   712 are written new.
4. **Harness.** Every example, kata, and capstone becomes a deterministic unit. Fifteen courses use the simulation
   convention for some or all units; networking and hardware are rewritten as loopback, fixture, and model units;
   four courses use service databases; `windows-os` is checked statically. Thirteen small spikes prove the hard cases
   before the courses that need them.
5. **Toolchains.** Seven ids are added, each only after its spike passes and its value reaches five or more code
   units: `valkey`, `mongodb`, `cassandra`, `dynamodb-local`, `timescaledb`, `gremlin`, and `neo4j-gds`. Each has a
   model fallback, and nothing is BLOCKED if one fails. ClickHouse and a `pg_stat_statements` image are not added.
6. **CI.** At planning figures a full run of the 34 courses is 465 minutes and the end-of-plan full run
   of the repository is about 1,315, which no shard count fits. The first response is toolchain-aware selection
   (rung 2t) so that a toolchain change does not run every course; the ladder then continues with plan 11's rungs and
   a unit-level split for the heaviest course.
7. **Execution.** Twelve waves of at most three courses, in prerequisite order; one commit per course; four
   checkpoint pushes; every loop capped at 2 cycles; BLOCKED courses are restored, recorded, and reported.
8. **Guard.** Plan 11's completion test gains 34 rows and a ninth scenario. Six courses also leave plan 09's filler
   baseline, in the same commit that fixes them.
9. **End state.** All 34 courses meet the definition of done, `ayokoding-www:examples:check` exits 0, and the coverage
   report shows 34 of 34 courses covered (decision 40, this plan's share); plan 13 takes the series to 100 percent.

## Cross-Plan Assumptions

The series runs strictly in order (series decision 42), so plans 01 to 11 are merged when this plan starts and plans 13
and 14 have not started. Each assumption below is checked in Phase 0; a failed check stops the plan with a report to the
user. Names may differ slightly as merged: Phase 0 records the merged names and the rest of the plan uses them.

| From      | What this plan assumes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Phase 0 check                                                                                                                                                                  |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Plan 02   | The prerequisite rubric (T1 to T4, L1, C1), the revised `prerequisites` of the 34 courses as listed in 006, closure and integrity rules R1 to R10 in `path-model-integrity.unit.test.ts`, `manifest-membership.unit.test.ts`, and `course-frontmatter.unit.test.ts`                                                                                                                                                                                                                                                            | Compare each course's merged frontmatter with the table in 006; `rtk git grep` for each test file; record differences                                                          |
| Plan 03   | Frontmatter keys `format`, `category`, `description`, `estimatedHours`; the formula and the drift test in `tests/unit/be-steps/course-metadata.steps.ts`; a taxonomy that gives 39 courses to this plan's four categories, of which five belong to plans 08 and 09                                                                                                                                                                                                                                                             | `rtk git grep` for the schema keys and the scenario title; read the four category tables                                                                                       |
| Plan 05   | `apps/ayokoding-cli` with `examples validate`, `sync`, `run --record`, `check --course`, `coverage`, and `affected`; the Nx target `ayokoding-www:examples:check`; `ayokoding.run/v1` with its service contract; the catalog ids in 004; "Adding a Toolchain"; the simulation convention S1 to S9; static mode with reason `windows`; the `examples-plan` job, its selection code, the `since` and `all` timeouts (60 and 300), and `--shard K/N` by sorted slug                                                               | `CLI-BUILD`, `toolchains list`, and `examples validate --course sql-essentials`; read the workflow, the selection code, and the service contract fields (including any `args`) |
| Plan 06   | The `psql` toolchain; the drilling convention (five exact `##` sections, 5,000 words) and the completion-test pattern with exemptions                                                                                                                                                                                                                                                                                                                                                                                          | `toolchains list` shows `psql`; `rtk git grep` for `accounting-course-completion.feature`                                                                                      |
| Plan 07   | The execution ledger file already holds headings for plans 06 to 11; the Blocked procedure and checkpoint-push strategy this plan adapts                                                                                                                                                                                                                                                                                                                                                                                       | Read `local-tmp/ayokoding-learn/execution-ledger.md` if it exists; append this plan's heading                                                                                  |
| Plan 08   | The capstone contract (rules CC1 to CC7, CL1 to CL4, Gate R) and its content-shape test; `capstone-real-world-delivery` relying on `capstone-solid-core`; the AI Engineer path with one goal and a 12-course core that contains none of these 34 courses; `careers-ai-manifest.unit.test.ts` and `career-goals.unit.test.ts`; the CI ladder rungs                                                                                                                                                                              | Read the capstone step file and how it finds its courses; search `capstone-*/learning/overview.md` for `capstone-solid-core`; read the AI manifest and compute its closure     |
| Plan 09   | The filler guard (`core/course-filler.ts`, rules FG1 to FG6, `course-filler-baseline.ts` with `FILLER_BASELINE`, `FILLER_BASELINE_CAP`, and `REWRITTEN_FILLER_COURSES`, `course-filler.steps.ts`); rules FILL1, FILL2, and SEC1 in `course-quality-guards.md`; a baseline of 25, then 17 after plan 09, with six entries tagged `plan-12`; the `clojure` entry and the `java` jar recipe, which this plan neither uses nor re-adds; probe P9, whose failure blocks only plan 09's `enterprise-java-and-the-jvm`                | List the baseline entries with owner `plan-12` and the cap; read the merged `java` and `clojure` entries and take the Temurin base digest; read plan 09's recorded P9 result   |
| Plan 10   | The 48 new courses exist; some list courses of this plan as prerequisites; catalog additions by plan 10 may overlap the ids here                                                                                                                                                                                                                                                                                                                                                                                               | Search the new courses' `prerequisites` for these 34 slugs; read the merged catalog for any id this plan adds                                                                  |
| Plan 11   | `audited-course-completion.feature` with eight scenarios, its step file, the registry `AUDITED_COURSES` and `DEFERRED_BY_USER`, the probe variable, the constant of its 32 slugs; rules TC1 and TC2; rungs 2b, 2c, and 3 of the CI ladder; the audited language primers and tooling courses that this plan's courses require (`just-enough-python`, `just-enough-go`, `just-enough-c`, `just-enough-bash`, `just-enough-elixir`, `just-enough-rust`, `software-engineering-practices`); a baseline of 12, six tagged `plan-12` | Read plan 11's step file and record its names; read the merged workflow and CLI for rungs 2b, 2c, and 3; read the baseline                                                     |
| Plan 13   | Not started. It audits `backend-essentials`, `backend-at-scale`, `capstone-first-working-software`, `engineering-management`, and `software-product-engineering`, which some of these 34 courses require. It keeps the app shape that the `relies-on` row of `capstone-solid-core` names for `capstone-first-working-software`, or updates that row in the same commit. It adds its own tenth scenario and removes its six baseline entries                                                                                    | None at start; the final report names what it inherits, including the `capstone-solid-core` row                                                                                |
| Plan 14   | Not started. It requires an empty filler baseline and harness coverage of 100 percent; this plan removes its six entries and records its share of 34 courses                                                                                                                                                                                                                                                                                                                                                                   | None at start                                                                                                                                                                  |
| Cycle cap | The user set every cap to 2 on 2026-10-09 ("semua jadi 2 aja")                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Every gate and loop input in the delivery says 2                                                                                                                               |

## Vercel MCP Capability

- **In scope:** yes. `apps/ayokoding-www/vercel.json` covers every app path this plan changes.
- **Planning-time probe (2026-10-10, authoring session):** the authoring agent had no Vercel MCP tools available, so
  the server is treated as **absent**.
- **What follows:** the plan uses no Vercel tool. Production builds only from the `prod-ayokoding-www` branch. After
  merge, the workflow `.github/workflows/ayokoding-www-test-local-deploy-prod.yml` (scheduled, or dispatched) moves
  `main` to that branch; the plan dispatches it and checks the live site with Playwright. No step needs billing,
  usage, firewall, domain, or project settings.
- **Phase 0 re-probe:** the executor re-checks Vercel MCP availability and records the result. If the server is
  present, the plan still uses no Vercel tool. No Vercel identifiers are recorded.

## Corpus Disposition

`archive-with-plan`. The `syllabus/` corpus (34 course briefs, their index, and the README) moves to `plans/done/`
with this plan. The durable products are the course pages under `apps/ayokoding-www/content/en/learn/courses/`, the
registry rows and the ninth scenario under `apps/ayokoding-www/tests/unit/be-steps/` and `specs/`, and the catalog
entries in `apps/ayokoding-cli/toolchains/`; no checker, Nx target, build step, or shipped content reads the syllabus
files. The packet owners read them during execution only, as a plan input.

## Corpus Custody

- This plan is the custodian of its own corpus (`**Custodian**` line in [../syllabus/README.md](../syllabus/README.md)).
- It consumes other plans' corpora read-only, as text, not as links: plan 02's revised prerequisite lists and rubric
  (`custodied-by:ayokoding-learn-revamp-02-path-model`), plan 08's capstone contract
  (`custodied-by:ayokoding-learn-revamp-08-capstone-courses`), and plan 11's registry design
  (`custodied-by:ayokoding-learn-revamp-11-audit-languages-and-tooling`). Those plans are archived under
  `plans/done/` before this plan runs, so this plan names the facts instead of linking the files, and records every
  change against them in [../syllabus/README.md](../syllabus/README.md#differences-from-plan-02s-specification).
- Plan 13 may read this corpus for course names and the conversion design; it links to the shipped course pages, not
  into this corpus. If a live plan links into this corpus when this plan archives, the archival step rewrites that
  link (branch (a) of the custody rule).

## Out of Scope

- The five courses in [001](./001-current-state-and-partition.md#the-partition) that plans 08 and 09 own, and every
  course that plans 11 and 13 audit.
- Courses that do not exist yet (plan 10), and any new topic, slug, path, or phase.
- Any path manifest change, except the AI manifest on the exception in
  [006](./006-prerequisites-metadata-and-closure.md#the-ai-engineer-path).
- Indonesian course content: `content/id/**` stays untouched (series decision 35).
- Any toolchain addition beyond the seven in [004](./004-toolchain-additions-and-ci-budget.md#this-plans-own-additions),
  plan 09's `clojure` entry and `java` jar recipe, and any weakening of a harness check; a harness defect is fixed at
  its root with a regression test.
