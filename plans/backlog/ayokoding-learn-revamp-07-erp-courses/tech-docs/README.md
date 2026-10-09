# Technical Design — ERP Courses

This directory is the plan's single technical form. Read the companions in order. Each one is
self-contained enough for a junior engineer to build its part. The `syllabus/` corpus next to it holds
the per-course specifications that the delivery checklist executes.

| File                                                                                         | What it covers                                                                                                   |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [001-current-state-and-architecture.md](./001-current-state-and-architecture.md)             | Measured state of the 30 skeleton courses and the two ERP paths; the contracts this plan consumes; data flow     |
| [002-course-catalog-and-modes.md](./002-course-catalog-and-modes.md)                         | The 30 courses in path order, the mode chosen for each with its reason, and the accounting boundary              |
| [003-definition-of-done-and-targets.md](./003-definition-of-done-and-targets.md)             | The definition of done per mode, measurable targets, file layout, drilling convention, metadata, and References  |
| [004-code-runtime-and-run-yaml.md](./004-code-runtime-and-run-yaml.md)                       | Python and PostgreSQL runtimes, `run.yaml` templates, determinism rules, simulation, CI cost, and Phase 0 probes |
| [005-sharia-policy-and-source-register.md](./005-sharia-policy-and-source-register.md)       | Sharia content rules, the source register, difference rows, the AAOIFI URL register, and per-course checks       |
| [006-path-restructure-and-pending-removal.md](./006-path-restructure-and-pending-removal.md) | The two ERP path manifests, the landing split with plan 06, and the removal of the pending-restructure mechanism |
| [007-execution-batching-and-ledger.md](./007-execution-batching-and-ledger.md)               | The per-course loop, the 13 waves, the execution ledger, BLOCKED handling, commits, and checkpoint pushes        |
| [008-testing-and-verification.md](./008-testing-and-verification.md)                         | Test layers, the Gherkin-to-test binding map, the end-state gate, and the manual verification matrix             |
| [009-decision-records.md](./009-decision-records.md)                                         | Material decisions with alternatives, prior art, trade-offs, consequences, and revisit triggers                  |
| [010-file-impact.md](./010-file-impact.md)                                                   | Root-relative file-impact tree with `[E]`/`[N]`/`[D]`/`[G]` markers                                              |
| [011-rule-and-docs-impact.md](./011-rule-and-docs-impact.md)                                 | Rule changes and retirements, enforcement dispositions, generated routes, docs and specs propagation, C4         |

## Summary

1. **Scope.** The 30 ERP courses (27 conventional, 3 Sharia) go from 215 to 250-word skeletons to complete
   courses, and the two ERP skills paths are restructured in the same PR (series decisions 26, 27, 39, 40).
2. **Modes.** 18 courses are By Example and 12 are Annotated-Concept. None is a primer, an in-the-field
   guide, or a no-code course ([002](./002-course-catalog-and-modes.md), D2 and D3 in
   [009](./009-decision-records.md)).
3. **Definition of done.** A course is done when it meets its mode's tutorial convention, has drilling,
   passes its mode quality gate and the Content Quality Gate with no blocking finding, has real metadata
   (`category`, `description`, `format`, `estimatedHours`), no `status: outline`, and every code example is
   green in the harness ([003](./003-definition-of-done-and-targets.md)).
4. **Code.** Every example is Python 3.14. Fourteen courses also run PostgreSQL 18 as a service container,
   through `psql` SQL units or Python units with the hash-locked `pg8000` driver, using plan 06's database
   conventions. Money is `Decimal`, time is a fixed date, and concurrency is scripted, never timed
   ([004](./004-code-runtime-and-run-yaml.md)).
5. **Sharia content.** The three Sharia courses follow plan 06's rules SC1 to SC8: they cite AAOIFI and
   recognized fatwa bodies, never issue rulings, flag board decision points with the warning callout, show only
   sourced madhhab and jurisdiction differences, and use current standards. Every AAOIFI URL needs a human tick
   before the PR is marked ready ([005](./005-sharia-policy-and-source-register.md)).
6. **Paths.** Both ERP manifests move from one `all-courses` phase to titled core phases with outcomes. The
   pending-restructure mechanism that plan 02 added is deleted: the marker field, the allowlist module, the
   marker scenarios, and every flat-render branch. Closure and no-outline-in-core enforcement turn on
   ([006](./006-path-restructure-and-pending-removal.md)).
7. **Execution.** 13 prerequisite-ordered waves of at most three parallel courses. Each course runs the same
   loop: maker, mode gate (at most 2 cycles), Content Quality Gate (at most 2 cycles), harness green. A
   course still blocked at the caps is `BLOCKED`, reported, and restored to its skeleton
   ([007](./007-execution-batching-and-ledger.md)).
8. **Proof.** Real-corpus unit tests, the harness, the end-state gate, and a manual browser check of both
   path pages ([008](./008-testing-and-verification.md)).

## File-Impact Analysis

The annotated, root-relative file tree is owned by [010-file-impact.md](./010-file-impact.md#file-impact-analysis).

## Dependencies

- **No new npm or Go dependency.** The plan edits course content, a handful of TypeScript files, and
  Gherkin. The only third-party package in the courses is the `pg8000` database driver, locked with hashes
  inside the PostgreSQL courses that use it from Python, never installed in the repository
  ([004](./004-code-runtime-and-run-yaml.md#postgresql-example-shape)).
  Plans 01 to 06 are merged when this plan starts: the series runs strictly in sequence, one plan, one worktree,
  and one PR at a time (series decision 42). Plan 08 follows this plan.

- **Plan 02** (merged first): the `phases`/`assumes` manifest model, `status: outline`, the integrity rules
  R1 to R10, the path-copy test, and the pending-restructure mechanism this plan deletes
  ([006](./006-path-restructure-and-pending-removal.md)).
- **Plan 03** (merged first): course metadata (`category`, `description`, `format`, `estimatedHours`), its
  real-corpus drift test, and the `erp-systems` category.
- **Plan 04** (merged first, [D1](./009-decision-records.md#d1--order-against-the-other-plans)): the phase
  roadmap and its flat branch for pending skills paths, which this plan removes.
- **Plan 05** (merged first): `apps/ayokoding-cli`, the `run.yaml` contract, the toolchain catalog, the
  `ayokoding-www:examples:check` Nx target, and the simulation convention.
- **Plan 06** (merged first): the 24 accounting courses this path assumes, the accounting path
  restructure, the skills category landing work
  ([006](./006-path-restructure-and-pending-removal.md#landing-split-with-plan-06)), the `psql` toolchain and the
  PostgreSQL conventions, the Sharia rule module (SC1 to SC8), and the content-shape test whose helpers this plan
  reuses.

Names above come from the plan documents of 2026-10-09. Phase 0 checks each against `origin/main` and
records the as-merged name in `<plan>/evidence/phase-0-contracts.md`; a missing contract stops execution.

## Surfaces and Quality Gates

- **Content-bearing:** yes, and it is the main surface. Each course runs its mode's tutorial quality gate
  ([By Example](../../../../repo-governance/workflows/quality/tutorial-by-example-quality-gate.md) or
  [Annotated Concept](../../../../repo-governance/workflows/quality/tutorial-annotated-concept-quality-gate.md)),
  the [Content Quality Gate](../../../../repo-governance/workflows/quality/content-quality-gate.md), and the
  harness. Every loop runs at most 2 cycles (the user's cap of 2026-10-09).
- **UI-bearing:** yes, narrowly. The two ERP path pages gain the phase structure that plans 02 and 04
  already built, and the skills category landing copy changes. No component or screen is designed here
  (see the UI design funnel exemption in [prd.md](../prd.md#ui-design-funnel)). The delivery runs the
  [UI Web Quality Gate](../../../../repo-governance/workflows/quality/ui-web-quality-gate.md) and the
  [UX review triad](../../../../repo-governance/workflows/quality/ux-review-fix-planning.md) (rule 15) on the
  changed pages in `en` and `id`.
- **API-bearing:** no procedure or schema changes. Phase 0 confirms with `rtk git grep` that the marker
  never appears in a tRPC output schema; if it does, the
  [API HTTP Quality Gate](../../../../repo-governance/workflows/quality/api-http-quality-gate.md) and the
  rule-16 retest run on `coursePaths.getRouteData` ([006](./006-path-restructure-and-pending-removal.md#removal-inventory)).
- **Rule-bearing:** yes, by retirement. The marker rule of decision 39 and its enforcement are retired. The
  Sharia content rules and the drilling convention are consumed from plan 06, and land here only if plan 06 did
  not land them ([011](./011-rule-and-docs-impact.md)).

## Corpus Disposition

`archive-with-plan`. The `syllabus/` corpus (30 course specifications and the two path manifest
specifications) moves to `plans/done/` with this plan. The durable products are the course content under
`apps/ayokoding-www/content/en/learn/courses/`, the JSON manifests, and the tests; no checker, Nx target,
build step, or shipped content reads the syllabus files. The Custodian is named in
[syllabus/README.md](../syllabus/README.md).

## Corpus Custody

`custodied-by:ayokoding-learn-revamp-02-path-model`. This plan reads plan 02's drafted ERP manifests under
`plans/backlog/ayokoding-learn-revamp-02-path-model/syllabus/paths/` as read-only input and never edits,
copies, or forks them. A needed change to a draft is a change request routed to plan 02, which in practice
means this plan's own copy under [syllabus/paths/](../syllabus/paths/README.md) supersedes the draft.
Plan 02 is archived before this plan starts (strict sequence), so its archival hand-off has rewritten the two
inbound links; `./rhino md internal-link validate` in Phase 0 catches a missed rewrite.

## Vercel MCP Capability

- **In scope:** yes. `apps/ayokoding-www/vercel.json` covers every app path this plan changes.
- **Planning-time probe (2026-10-09, authoring session):** the authoring agent had no Vercel MCP tools
  available, so the server is treated as **absent**.
- **What follows:** the plan uses no Vercel tool. Production builds only from the `prod-ayokoding-www`
  branch (the `vercel.json` `ignoreCommand`). After merge, the existing GitHub workflow
  `.github/workflows/ayokoding-www-test-local-deploy-prod.yml` moves `main` to that branch. The plan
  dispatches it and checks the live site with Playwright, which needs no Vercel access. No step needs
  billing, usage, firewall, domain, or project settings.
- **Phase 0 re-probe:** the executor re-checks Vercel MCP availability and records the result. If the
  server is present, the plan still uses no Vercel tool. No Vercel identifiers are recorded.

## Feature Flag

None needed. Plan 02's `restructurePendingIn` marker was the temporary production-disabled state for these
two paths: while it is present the paths render exactly as before. This plan fills every course and then
removes the marker in the same PR, so `main` never shows a half-restructured path.

- **Rollout:** the marker stays through Phase 2; Phase 3 removes it with the restructure.
- **Both paths tested:** until Phase 3, the plan 02 tests cover the marked path; from Phase 3, the new
  scenarios in [prd.md](../prd.md#part-a-specs-bound-gherkin) cover the unmarked path.
- **Rollback:** revert the merge commit ([008](./008-testing-and-verification.md#rollback)).
- **Removal:** the marker and its machinery are deleted in Phase 3, which is this plan's flag removal.

## Out-of-Scope Follow-Up

Plan 14 measures the series end state, including harness coverage at 100% and a green full run
(decision 40). This plan measures its own share with `examples coverage` and does not touch plan 14's gate.
