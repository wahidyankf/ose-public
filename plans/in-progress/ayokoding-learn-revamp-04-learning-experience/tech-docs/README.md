# Technical Design — Learning Experience

This directory is the plan's single technical form. Read the companions in order; each one is
self-contained enough for a junior engineer to implement its part. All paths are repository-relative;
app paths are under `apps/ayokoding-www/` unless stated.

| File                                                                                       | What it covers                                                                                                     |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| [001-current-state-and-architecture.md](./001-current-state-and-architecture.md)           | Series decisions, today's code, the contracts consumed from plans 02 and 03, and the architecture after            |
| [002-progress-store-schema-and-migration.md](./002-progress-store-schema-and-migration.md) | Stored data model (ERD), field guide, guarded storage, hydration, compatibility, migration, rollback               |
| [003-active-path-and-navigation.md](./003-active-path-and-navigation.md)                   | Lesson sequence, page location, active path rule, next-step rule, lesson navigation targets, the Overview redirect |
| [004-ui-components-and-copy.md](./004-ui-components-and-copy.md)                           | Every new or changed component with props, layout rules, and the English and Indonesian strings                    |
| [005-api-contract-delta.md](./005-api-contract-delta.md)                                   | No-delta disposition for the tRPC API and the HTTP surface, with evidence                                          |
| [006-testing-strategy.md](./006-testing-strategy.md)                                       | Test layers, the scenario-to-binding map, fixtures, and the no-layout-shift and no-network proofs                  |
| [007-decision-records.md](./007-decision-records.md)                                       | Material decisions with alternatives, prior art, trade-offs, consequences, and revisit triggers                    |
| [008-file-impact.md](./008-file-impact.md)                                                 | Root-relative file-impact tree with `[N]`/`[E]`/`[D]` markers                                                      |

## Summary

1. **Store.** One `localStorage` key, `ayokoding-learn-progress-v1`, holds completed page paths per
   course plus the last course and last path the reader worked in. A strict Zod schema validates every
   read; an invalid record is treated as empty. A small external store wraps storage access in
   `try/catch`, falls back to memory, notifies the current tab, and listens to the `storage` event for
   other tabs. Components read it through `useSyncExternalStore` with a fixed server snapshot, so the
   server render and the first client render match.
2. **Lesson sequence.** Each course has one reading order of its learning pages, built on the server
   from the content tree with the same walk as plan 03's Start target. Progress counts only pages in
   that order, so stale keys never count.
3. **Navigation.** `?path=` stays the authority for path context. Inside one course, the last path the
   reader used for that course is remembered as a fallback. "Mark complete & continue" walks the
   lesson sequence and, at the end of a course, the path's course order.
4. **Screens.** A roadmap replaces the path list; lesson pages get a context bar and a bottom action
   row; plan 03's course header gets progress and a smart primary button; `/en/learn` becomes a landing
   page; path hubs use one `LearnPathCard`.
5. **No API change.** All new data reaches the client as server-component props or from the existing
   `coursePaths.getRouteData` payload.

## Vercel MCP Capability

- **In scope:** yes. `apps/ayokoding-www/vercel.json` covers every app path this plan changes.
- **Planning-time probe (2026-10-09, authoring session):** the authoring agent had no Vercel MCP
  tools available, so the server is treated as **absent**.
- **What follows:** the plan uses no Vercel tool. Production builds only from the
  `prod-ayokoding-www` branch (`vercel.json` `ignoreCommand`). After merge, the existing GitHub
  workflow `.github/workflows/ayokoding-www-test-local-deploy-prod.yml` (scheduled twice a day, or
  dispatched) moves `main` to that branch. The plan dispatches it and then checks the live site with
  Playwright, which needs no Vercel access. No step needs billing, usage, firewall, domain, or project
  settings. Acceptance before merge relies on local Nx gates, Playwright on the local dev server and
  production build, and the PR's CI.
- **Phase 0 re-probe:** the executor re-checks Vercel MCP availability and records the result. If the
  server is present, the plan still uses no Vercel tool. No Vercel identifiers are recorded.

## Not Learning-Bearing

This plan changes the learning platform's interface, not learning content. It writes no course,
lesson, or syllabus material, so it has no `syllabus/` corpus. The only content edits are removing
`content/en/learn/overview.md` and the `description` of `content/en/learn/_index.md`.

## Rule Impact

No normative rule surface changes. Delivery Phase 9 records the classification with evidence (see
[008](./008-file-impact.md#rule-impact-classification)) and runs Docs Propagation for the app README
and the spec READMEs.
