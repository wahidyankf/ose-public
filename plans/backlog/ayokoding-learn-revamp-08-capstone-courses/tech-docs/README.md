# Technical Design — Capstone Courses

This directory is the plan's single technical form. Read the companions in order; each one is
self-contained enough for a junior engineer to carry out its part.

| File                                                                                         | What it covers                                                                                                                                          |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [001-current-state-and-architecture.md](./001-current-state-and-architecture.md)             | The 8 skeleton capstones and the 5 filled ones today (measured 2026-10-09), the career paths, where things live in the app, and the prior art           |
| [002-capstone-course-contract-and-modes.md](./002-capstone-course-contract-and-modes.md)     | The definition of done as ten checks, the capstone contract, mode selection, word, example, hour, and drilling targets, metadata, layout, gate settings |
| [003-prerequisites-readiness-and-ordering.md](./003-prerequisites-readiness-and-ordering.md) | The prerequisite rubric re-run (nine edge changes), course-level coupling, Gate R, and the order of the courses                                         |
| [004-code-harness-and-determinism-design.md](./004-code-harness-and-determinism-design.md)   | Units per course, the capstone unit, determinism, the CI time budget and its ladder, cross-course figures, two-language capstones, safety checks        |
| [005-ai-path-goal-and-closure.md](./005-ai-path-goal-and-closure.md)                         | The AI Engineer path's new goal, the closure proof, the membership test edit, and the tests and copy that change                                        |
| [006-e2e-rebinding-and-testing-strategy.md](./006-e2e-rebinding-and-testing-strategy.md)     | The new Gherkin features, the Start-fallback and outline-anchor exemptions, the scenario-to-test map, and the manual checks                             |
| [007-execution-model.md](./007-execution-model.md)                                           | Batches, agents, the per-course pipeline with its 2-cycle caps, BLOCKED handling, the ledger, commits, and recovery                                     |
| [008-decision-records.md](./008-decision-records.md)                                         | Material decisions with alternatives, prior art, trade-offs, consequences, and revisit triggers                                                         |
| [009-rule-and-docs-impact.md](./009-rule-and-docs-impact.md)                                 | Rules this plan creates or extends, their homes and enforcement, and the docs to update                                                                 |
| [010-file-impact.md](./010-file-impact.md)                                                   | Root-relative file-impact tree with `[E]`/`[N]`/`[D]`/`[G]` markers                                                                                     |

## Summary

1. **Courses.** The 8 skeleton capstones are rewritten from scratch: 7 in Annotated-Concept standard mode
   (45 worked examples in five themes, a project with five milestones) and 1, `capstone-lead-at-altitude`,
   in the no-code sub-mode (24 scenarios in four themes). Each meets its mode convention and the capstone
   contract, has a full drilling page, passes its mode quality gate and the Content Quality Gate with no
   blocking finding (at most 2 cycles each), and is green in plan 05's code harness. The syllabus in
   [../syllabus/](../syllabus/README.md) is each course's brief.
2. **Code.** Seven courses are code courses: coding agent (Python), pentest engine (TypeScript), secure
   service (Python), real-world delivery (Python plus offline validators), data pipeline (Python and
   PostgreSQL), concurrency and systems (Go), and concurrency showdown (Go and Elixir). Every example,
   kata, and capstone is a harness unit with a `run.yaml`, about 358 units in all. The CI time budget is
   measured first, with a response ladder ([004](./004-code-harness-and-determinism-design.md#run-time-budget)).
3. **Prerequisites.** The rubric is re-run on the written courses: 9 edge changes (7 language primers,
   1 added course, 1 removed course). Capstones link prerequisites at course level only, restate what they
   use, and keep a `relies-on` table, so a later rewrite of a prerequisite by plans 09 to 13 cannot make
   a capstone wrong.
4. **Safety.** The three security-flavoured courses teach in a self-owned, offline lab with a written
   safety boundary, a deterministic scan for network and shell APIs, and documentation-range addresses only.
5. **AI path.** The Immediately Effective AI Engineer path gets its goal,
   `capstone-build-your-own-coding-agent`. Its core becomes the goal's prerequisite closure: 12 core
   courses (down from 25), 16 extension courses, 4 assumed courses (down from 11).
6. **E2E.** The "Start falls back to the first learning page" scenario and every scenario that opens a real
   outline course get an E2E exemption with Unit proof over fixtures, because no such course exists once
   this plan merges.
7. **End state.** No capstone carries `status: outline`, none is under 1,000 words, every career-path goal
   course is filled, and no career core contains an outline course. A new content-shape test keeps it
   that way, and a new career-goals test keeps every career core a closure.

## Cross-Plan Assumptions

The series runs strictly in order (series decision 42), so plans 01 to 07 are merged when this plan
starts, and plans 09 to 14 have not started. This plan builds directly on plans 02, 03, and 05. Each
assumption below is checked in Phase 0; a failed check stops the plan with a report to the user.

| From          | What this plan assumes                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Phase 0 check                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan 02       | `status: outline` in the 8 capstones' frontmatter; `checkPathModelIntegrity` (R1–R10) and `computeCore`; the frozen `legacy-membership.ts` and `manifest-membership.unit.test.ts`; `course-frontmatter.unit.test.ts` (a course under 1,000 words must be an outline); the AI manifest drafted without goals (core 25, extension 1, `assumes` 11); the revised prerequisite graph with both kept and added edges. Names may differ slightly as merged.                                | `rtk git grep` for each name on `origin/main`; recompute the closure from the merged graph; record merged names                                                     |
| Plan 03       | Course metadata keys `category`, `description`, `format` (with the value `capstone`), `estimatedHours`; the drift test in `tests/unit/be-steps/course-metadata.steps.ts` printing "Expected estimatedHours for every non-outline course"; the Start button's three shapes and the scenario "Start falls back to the first learning page"; rule R3 (mode read from `format`) in `tutorial-kinds.md`.                                                                                  | `rtk git grep` for the schema keys, the scenario title, and the R3 sentence                                                                                         |
| Plan 04       | Not a dependency. Merged before this plan. Its roadmap builds from the manifest, so the AI path's new shape renders without code changes. It may hold a scenario that opens a real outline course.                                                                                                                                                                                                                                                                                   | Search the merged specs and E2E steps for outline anchors ([006](./006-e2e-rebinding-and-testing-strategy.md#outline-anchors-tests-that-use-a-real-outline-course)) |
| Plan 05       | `apps/ayokoding-cli` with `examples validate`, `sync`, `run --record`, `check --course`, `coverage`, and `affected`; the Nx target `ayokoding-www:examples:check`; the `run.yaml` contract `ayokoding.run/v1` with unit kinds example, kata, and capstone; toolchains `python`, `go`, `elixir`, `typescript`, `postgres`, `kubeconform`, and `opentofu`; `mode: static`; the simulation convention; the CI design (one shard for at most 8 courses, 60 minutes); migration step M11. | Build the CLI; run `toolchains list`, `examples validate`, and the smoke fixtures; read the merged `run.yaml` field guide                                           |
| Plans 06, 07  | Merged before this plan. Each re-pointed the outline anchors of plans 02 to 04 as it filled courses; after plan 07 the 8 capstones are the only courses with `status: outline`. Plan 06 created `sharia-content.md` and plan 05 created `code-example-harness.md` in the skill's `reference/` folder.                                                                                                                                                                                | Count `status: outline` on `origin/main` (expect 8); list the skill's `reference/` folder                                                                           |
| Plan 09       | Not started. It rewrites `defensive-security` and `vulnerability-management-and-assessment` after this plan. **Duty:** before its merge, search `capstone-*/learning/overview.md` for each slug it rewrites and re-read the `relies-on` rows ([003](./003-prerequisites-readiness-and-ordering.md#what-later-plans-must-do-handoff)).                                                                                                                                                | Not checkable now; recorded in the handoff table                                                                                                                    |
| Plans 10 – 13 | Not started. **Duty:** the same re-check for any course they rewrite or whose `prerequisites` they change; a change that alters the AI core updates the AI manifest in the same PR (rule R6 fails otherwise). Plans 11 – 13 audit `capstone-first-working-software`; if one gives it a `learning/` folder, that plan rebinds the shape-3 step of the Start-fallback scenario.                                                                                                        | Not checkable now; recorded in the handoff table                                                                                                                    |
| Plan 14       | Not started. **Duty:** its end-state gate runs the whole unit suite (the capstone content-shape test is part of it) and re-reads each capstone's `relies-on` table against the prerequisite courses that changed since this plan merged; a concept that disappeared is a finding.                                                                                                                                                                                                    | Not checkable now; recorded in the handoff table                                                                                                                    |
| Cycle cap     | The user's cap of 2 cycles on every gate and loop (2026-10-09, "semua jadi 2 aja") applies here. Sibling plans 02 to 04 may still say 3 in places; this plan does not edit them and flags the difference to the user.                                                                                                                                                                                                                                                                | `rtk git grep -n "max-cycles"` in the sibling plans if they are still in `plans/`                                                                                   |

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

`archive-with-plan`. The `syllabus/` corpus (8 course specifications and the AI Engineer manifest
specification, with their indexes) moves to `plans/done/` with this plan. The durable products are the
course pages under `apps/ayokoding-www/content/en/learn/courses/` and the manifest under
`apps/ayokoding-www/src/features/course-paths/manifests/careers/immediately-effective/`; no checker, Nx
target, build step, or shipped content reads the syllabus files. The course makers read them during
execution only, as a plan input.

## Corpus Custody

- This plan is the custodian of its own corpus (`**Custodian**` line in
  [../syllabus/README.md](../syllabus/README.md)).
- It consumes one other corpus read-only: the drafted AI Engineer phases in plan 02's
  `syllabus/paths/manifest-careers-immediately-effective-ai-engineer.md`.
  `custodied-by:ayokoding-learn-revamp-02-path-model`. Plan 02 is archived under `plans/done/` before
  this plan runs, so this plan names that file instead of linking it, and records every change against
  it in [../syllabus/paths/README.md](../syllabus/paths/README.md).
- Plans 09 to 13 may read this corpus for capstone prerequisites; they link to the shipped course pages,
  not into this corpus. If a live plan links into this corpus when this plan archives, the archival step
  rewrites that link (branch (a) of the custody rule).
- The archived capstone outlines of 2026-08-15 are cited as lineage only.

## Out of Scope

- The five non-skeleton capstones (`capstone-first-working-software`, `capstone-forge-ready`,
  `capstone-full-stack-app`, `capstone-interview-loop`, `capstone-solid-core`): plans 11 to 13.
- The two filler prerequisites `defensive-security` and `vulnerability-management-and-assessment`
  (plan 09), and every other course outside the 8.
- Indonesian course content: `content/id/**` stays untouched (series decision 35).
- Any change to plan 05's harness beyond a shard-count fix or a timeout change that the CI ladder
  requires and that plan 05's migration step M11 allows for a defect that blocks this plan.
- Live attack labs, real targets, and operational attack material of any kind.
