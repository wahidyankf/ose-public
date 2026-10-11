# Technical Design — Path Model

This directory is the plan's single technical form. Read the companions in order; each one is
self-contained enough for a junior engineer to implement its part.

| File                                                                                 | What it covers                                                                                               |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| [001-architecture-and-data-flow.md](./001-architecture-and-data-flow.md)             | Where manifests, frontmatter, the loader, tRPC, and the UI sit; the data flow before and after               |
| [002-manifest-schema-and-migration.md](./002-manifest-schema-and-migration.md)       | Data model (ERD), field guide, compatibility, expand → migrate → verify → contract, rollback, reconciliation |
| [003-prerequisite-rubric-and-evidence.md](./003-prerequisite-rubric-and-evidence.md) | The rubric for a "true conceptual dependency" and the per-course evidence table for all 181 courses          |
| [004-path-composition.md](./004-path-composition.md)                                 | Goals, computed cores, every phase of all 8 manifests, `assumes`, and how to recompute a core                |
| [005-integrity-validation-and-testing.md](./005-integrity-validation-and-testing.md) | Integrity rules, function signatures, test files, and the Gherkin-to-test map                                |
| [006-ui-and-copy-changes.md](./006-ui-and-copy-changes.md)                           | Component changes, i18n keys, and the full replacement copy for path pages and manifest descriptions         |
| [007-decision-records.md](./007-decision-records.md)                                 | Material decisions with alternatives, prior art, trade-offs, consequences, and revisit triggers              |
| [008-file-impact.md](./008-file-impact.md)                                           | Root-relative file-impact tree with `[E]`/`[N]`/`[D]`/`[G]` markers                                          |

## Summary

1. **Schema.** A manifest file holds `phases` (core first, then extension), optional `goals`, and
   `assumes`. The loader derives `courseOrder` from the phases, so Next/Prev, the banner, position
   numbers, and the tRPC payload keep working without per-consumer rewrites.
2. **Frontmatter.** `status: outline` marks the 62 skeleton courses. `prerequisites` is revised for
   all 181 courses (400 edges after the change: 325 kept, 36 removed, 75 added). None of the 43
   changed courses is an accounting or ERP course, so the skills paths' order is not affected.
3. **Validation.** A pure function `checkPathModelIntegrity` in `core/manifest-integrity.ts` checks
   closure, outline-in-core, goal closure, `assumes` exactness, phase shape, the skills rule, and the
   skills restructure marker. Unit tests run it on synthetic manifests and on the 8 real manifests with
   the real frontmatter. The runtime loader stays tolerant.
4. **Recompute.** `computeCore(goals, prerequisitesByCourse, assumes)` in `core/path-core.ts` is the
   single tested way to recompute a core. The real-manifest test prints the expected core when a core
   drifts. No script under `scripts/` or `local-tmp/` is part of the deliverable.
5. **UI.** For career paths, the syllabus and rail group by phase, show core outcomes, show Outline
   badges, and show a "Before you start" note. Plan 04 builds the roadmap and progress on top of this
   data.
6. **Skills paths wait for their content (decision 39).** The four skills manifests get only a
   mechanical shape migration: one `all-courses` phase with today's order, plus the marker
   `restructurePendingIn` (`"plan-06"` or `"plan-07"`). A closed allowlist in
   `core/skills-restructure-allowlist.ts` names exactly those four path IDs. Marked manifests skip the
   core rules, keep the ID, duplicate, and ordering checks, and render exactly as today.

## Cross-Plan Handoffs

Each handoff below is work this plan deliberately leaves to a later plan. The receiving plan owns it;
this plan only records it.

| To      | Work handed over                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Done when                                                                                       |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Plan 06 | In the same PR as the 24 filled accounting courses: restructure `skills/conventional-accounting` and `skills/sharia-accounting` into core phases with outcomes (decisions 16–18), with `assumes` and the closure and no-outline-in-core rules applying; remove their `restructurePendingIn` and their allowlist entries; rewrite their path pages without jargon; remove the skills milestone strip and rewrite the skills category statement and hub strapline; extend the path-copy test to their pages; drop `status: outline` from the 24 courses. | Both manifests pass every rule without the marker; the allowlist holds only the two ERP entries |
| Plan 07 | The same for `skills/conventional-erp` and `skills/sharia-erp` and the 30 ERP courses; extend the path-copy test to all of `content/en/learn/paths/**`; then delete `core/skills-restructure-allowlist.ts`, the `restructurePendingIn` field, the marker scenarios, and the flat-render branch.                                                                                                                                                                                                                                                        | No manifest carries the marker and the allowlist module no longer exists                        |
| Plan 08 | Write the 8 skeleton capstones and drop their `status: outline`; give the AI Engineer path `goals` and move its capstone into core.                                                                                                                                                                                                                                                                                                                                                                                                                    | The AI capstone is core and the AI manifest passes the goals rule                               |
| Plan 05 | Optional `ayokoding-cli paths core` subcommand that wraps `computeCore` (see below).                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Plan 05 decides                                                                                 |

The target phases this plan drafted for the four skills paths stay in
[syllabus/paths/](../syllabus/paths/README.md#skills-paths-input-for-plans-06-and-07) as **input** for
plans 06 and 07. They are not applied here, and those plans may change them once the courses exist.
The split of the skills category landing work between plans 06 and 07 is a suggestion; those plans
may move it.

## Vercel MCP Capability

- **In scope:** yes. `apps/ayokoding-www/vercel.json` covers every app path this plan changes.
- **Planning-time probe (2026-10-09, authoring session):** the authoring agent had no Vercel MCP
  tools available, so the server is treated as **absent**.
- **What follows:** the plan uses no Vercel tool. Production builds only from the
  `prod-ayokoding-www` branch (`vercel.json` `ignoreCommand`). After merge, the existing GitHub
  workflow `.github/workflows/ayokoding-www-test-local-deploy-prod.yml` (scheduled twice a day, or
  dispatched) moves `main` to that branch. The plan dispatches it and then checks the live site with
  Playwright, which needs no Vercel access. No step needs billing, usage, firewall, domain, or project
  settings. Acceptance before merge relies on local Nx gates, Playwright on the local dev server, and
  the PR's CI.
- **Phase 0 re-probe:** the executor re-checks Vercel MCP availability and records the result. If the
  server is present, the plan still uses no Vercel tool. No Vercel identifiers are recorded.

## Corpus Disposition

`archive-with-plan`. The `syllabus/` corpus (path manifest specifications) moves to `plans/done/`
with this plan. The durable product is the JSON manifests under
`apps/ayokoding-www/src/features/course-paths/manifests/` and the course frontmatter; no checker, Nx
target, build step, or shipped content reads the syllabus files.

## Corpus Custody

This plan is the custodian of its own `syllabus/` corpus (see
[syllabus/README.md](../syllabus/README.md)). It consumes no other plan's corpus. The prior-art
corpus in `plans/done/2026-07-24__ayokoding-learning-path-02-schema-and-prerequisite-dag/syllabus/`
is cited as history only and is not edited.

## Out-of-Scope Follow-Up

An `ayokoding-cli paths core` subcommand that wraps `computeCore` for maintainers could follow. It is
owned by plan 05 (`code-harness`), which revives `apps/ayokoding-cli`. This plan does not create it.
