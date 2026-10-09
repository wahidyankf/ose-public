# Technical Design — Accounting Courses

This directory is the plan's single technical form. Read the companions in order; each one is
self-contained enough for a junior engineer to carry out its part.

| File                                                                                       | What it covers                                                                                                      |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| [001-current-state-and-architecture.md](./001-current-state-and-architecture.md)           | The 24 courses and two paths today (measured 2026-10-09), where they sit in the app, and the prior art              |
| [002-course-modes-and-definition-of-done.md](./002-course-modes-and-definition-of-done.md) | Mode selection, the definition of done, word, example, diagram, and drilling targets, metadata, and the file layout |
| [003-code-harness-and-determinism.md](./003-code-harness-and-determinism.md)               | The code medium, `run.yaml` per unit, database units, determinism, and the `psql` toolchain this plan adds          |
| [004-sharia-content-policy-and-sources.md](./004-sharia-content-policy-and-sources.md)     | Source hierarchy, attribution, the board-decision callout, the disclaimer, the source and URL registers             |
| [005-path-restructure-and-integrity.md](./005-path-restructure-and-integrity.md)           | Prerequisite changes, the closure proof, marker and allowlist removal, the skills landing, and the wire contract    |
| [006-execution-model.md](./006-execution-model.md)                                         | Batches in prerequisite order, the per-course pipeline with its 2-cycle caps, BLOCKED handling, and the ledger      |
| [007-testing-strategy.md](./007-testing-strategy.md)                                       | Gherkin features, the test pyramid for this plan, the scenario-to-test map, and manual checks                       |
| [008-decision-records.md](./008-decision-records.md)                                       | Material decisions with alternatives, prior art, trade-offs, consequences, and revisit triggers                     |
| [009-file-impact.md](./009-file-impact.md)                                                 | Root-relative file-impact tree with `[E]`/`[N]`/`[D]`/`[G]` markers                                                 |
| [010-rule-and-docs-impact.md](./010-rule-and-docs-impact.md)                               | Rules this plan creates or touches, their homes and enforcement, and the docs to update                             |

## Summary

1. **Courses.** All 24 accounting courses are rewritten from scratch: 11 in By Example mode and 13 in
   Annotated-Concept mode. Each meets its mode convention, has a drilling section, passes its mode
   quality gate and the Content Quality Gate with no blocking finding, and is green in plan 05's code
   harness. The syllabus in [../syllabus/](../syllabus/README.md) is each course's brief.
2. **Code.** Python 3 is the language of every course; three courses also use PostgreSQL 18. Every
   example, kata, and capstone is a harness unit with a `run.yaml`. This plan adds one toolchain
   entry, `psql`, to the harness catalog through plan 05's documented procedure.
3. **Sharia content.** The five Sharia courses cite AAOIFI, DSN-MUI, IAI (PSAK Syariah), and Bank
   Negara Malaysia with dates, show where scholars and jurisdictions differ, never issue rulings, and
   flag each Sharia board decision with one fixed callout. Every AAOIFI URL needs a human browser check
   before merge.
4. **Paths.** Both accounting paths become titled core phases with outcomes. Their temporary marker and
   allowlist entries go away, so the closure and no-outline-in-core rules apply to them. Two courses
   swap positions (journal entries before financial statements).
5. **Skills landing.** The ramp milestone strip is deleted; the skills statement, the skills hub
   strapline, and the skills hub description are rewritten in plain words.
6. **End state.** No accounting course carries `status: outline`, none is under 1,000 words, and both
   accounting paths contain only filled courses. A new content-shape test keeps it that way.

## Cross-Plan Assumptions

The series runs strictly in order (series decision 42), so plans 01 to 05 are merged when this plan
starts and plan 07 has not started. This plan builds directly on plans 02, 03, and 05 and edits the
skills landing as plan 04 left it. Each assumption below is checked in Phase 0; a failed check stops
the plan with a report to the user.

| From    | What this plan assumes                                                                                                                                                                                                                                                                                                                                    | Phase 0 check                                                                                   |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Plan 02 | `restructurePendingIn` with the closed allowlist module `core/skills-restructure-allowlist.ts` (4 entries), `isMarkedShape`, `checkPathModelIntegrity` (R1–R10), `status: outline` in course frontmatter, `outlineCourseIds` in the tRPC payload, the frozen `legacy-skills-order.ts`, and `path-copy.unit.test.ts`. Names may differ slightly as merged. | `rtk git grep` for each name on `origin/main`; record the merged names                          |
| Plan 03 | Course metadata keys `category`, `description`, `format`, `estimatedHours`, with `format` required unless `status: outline`; the drift test in `tests/unit/be-steps/course-metadata.steps.ts` that prints "Expected estimatedHours for every non-outline course".                                                                                         | `rtk git grep` for the schema keys and the scenario title                                       |
| Plan 05 | `apps/ayokoding-cli` with `examples validate`, `sync`, `run --record`, `check --course`, and `coverage`; the Nx target `ayokoding-www:examples:check`; the `run.yaml` contract `ayokoding.run/v1`; the `python` toolchain and `postgres` service in the catalog; the "Adding a Toolchain" procedure.                                                      | Build the CLI and run `toolchains list` and `examples validate --course accounting-foundations` |
| Plan 04 | Merged before this plan. The skills landing uses `LearnPathCard` and still renders `RampMilestoneStrip` with the old statement (plan 04 decision D11); this plan changes the statement and deletes the strip, and leaves the card alone. Plan 04's flat roadmap branch for marked paths stays, because the ERP paths keep their marker until plan 07.     | `rtk git grep -n "RampMilestoneStrip\|LearnPathCard"` on `origin/main`                          |
| Plan 07 | Not started; it starts only after this plan merges. Plan 07 removes the ERP marker, deletes the allowlist module, the `restructurePendingIn` field, and the flat-render branches, and consumes the Sharia content rule module this plan creates.                                                                                                          | `rtk git grep -n "plan-07"` shows the two ERP manifests still marked                            |

## Vercel MCP Capability

- **In scope:** yes. `apps/ayokoding-www/vercel.json` covers every app path this plan changes.
- **Planning-time probe (2026-10-09, authoring session):** the authoring agent had no Vercel MCP tools
  available, so the server is treated as **absent**.
- **What follows:** the plan uses no Vercel tool. Production builds only from the
  `prod-ayokoding-www` branch. After merge, the workflow
  `.github/workflows/ayokoding-www-test-local-deploy-prod.yml` (scheduled, or dispatched) moves `main`
  to that branch; the plan dispatches it and checks the live site with Playwright. No step needs
  billing, usage, firewall, domain, or project settings.
- **Phase 0 re-probe:** the executor re-checks Vercel MCP availability and records the result. If the
  server is present, the plan still uses no Vercel tool. No Vercel identifiers are recorded.

## Corpus Disposition

`archive-with-plan`. The `syllabus/` corpus (24 course specifications and 2 path specifications) moves
to `plans/done/` with this plan. The durable products are the course pages under
`apps/ayokoding-www/content/en/learn/courses/` and the manifests under
`apps/ayokoding-www/src/features/course-paths/manifests/skills/`; no checker, Nx target, build step, or
shipped content reads the syllabus files. The course makers read them during execution only, as a
plan input.

## Corpus Custody

- This plan is the custodian of its own corpus (`**Custodian**` line in
  [../syllabus/README.md](../syllabus/README.md)).
- It consumes one other corpus read-only: the drafted skills phases in plan 02's
  `syllabus/paths/manifest-skills-conventional-accounting.md` and
  `syllabus/paths/manifest-skills-sharia-accounting.md`.
  `custodied-by:ayokoding-learn-revamp-02-path-model`. Plan 02 is archived under `plans/done/` before
  this plan runs, so this plan names those files instead of linking them, and records every change
  against them in [../syllabus/paths/README.md](../syllabus/paths/README.md).
- Plan 07 (ERP courses) may read this corpus for accounting course names; it links to the shipped
  course pages, not into this corpus. If a live plan links into this corpus when this plan archives,
  the archival step rewrites that link (branch (a) of the custody rule).
- The archived corpora of the 2026-08-15 and 2026-08-16 accounting plans are cited as history only.

## Out of Scope

- The ERP courses and the two ERP skills paths (plan 07), and deleting the allowlist module, the
  marker field, and the flat-render branches (plan 07).
- Indonesian course content: `content/id/**` stays untouched (series decision 35).
- Any change to plan 05's harness beyond adding the `psql` catalog entry and fixing a harness defect
  that blocks this plan (plan 05's migration step M11).
- Issuing or endorsing any Sharia ruling.
