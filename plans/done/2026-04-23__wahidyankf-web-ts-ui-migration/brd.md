# BRD — wahidyankf-web Component Migration to ts-ui

## Business Goal

Consolidate generic, framework-agnostic UI components into the shared `libs/ts-ui` library so
that `apps/wahidyankf-web` is not the sole owner of primitives any future OSE web app could
reuse without copy-pasting.

## Problem Statement

`apps/wahidyankf-web` currently owns four pure-React components — `HighlightText`,
`ScrollToTop`, `SearchComponent`, and `ThemeToggle` — that have no Next.js-specific
dependencies. Keeping them local to one app creates two problems:

1. **Drift risk.** Any future OSE app that needs the same primitives must copy the files.
   Copies diverge silently over time; bugs fixed in one app do not propagate.
2. **Library gap.** `libs/ts-ui` is the designated single source of truth for generic UI
   primitives. While it already exports many components, these four remain stranded in an app.

## Business Impact

- Removes drift risk for current and future OSE apps consuming generic UI primitives.
- Makes `libs/ts-ui` more complete, reducing the time a new app needs to implement basic
  search, highlight, scroll-to-top, and theme-toggle behaviour from scratch.
- Establishes the correct ownership boundary: app-specific logic stays in apps; generic
  components live in the library.

## Affected Roles

- **Maintainer (developer hat)** — the solo maintainer who authors, tests, and deploys
  `ose-public` apps. This migration reduces future copy-paste work when bootstrapping new OSE
  apps.
- **Consuming agents** — `swe-typescript-dev`, `swe-ui-maker`, and related agents that read
  `CLAUDE.md` and `libs/ts-ui` to understand available UI primitives.

## Business-Level Success Metrics

**Observable fact (no numeric target required):** After migration:

- `apps/wahidyankf-web/src/components/` contains exactly two files: `Navigation.tsx` and
  `Navigation.unit.test.tsx`.
- All local quality gates (`typecheck`, `lint`, `test:quick`, `spec-coverage`) pass green for
  both `wahidyankf-web` and `ts-ui` with zero errors.
- No import in `apps/wahidyankf-web/src/` references the local component paths that were
  deleted.
- `test-and-deploy-wahidyankf-web.yml` GitHub Actions workflow completes with all jobs green
  — Lint, Unit tests, Spec coverage, Integration tests, E2E tests, Detect changes, and
  Deploy to production.
- `prod-wahidyankf-web` branch tip matches the `main` HEAD SHA; Vercel deployment for
  `www.wahidyankf.com` succeeds and the production site renders visually identical to the
  pre-migration baseline.

Judgment call: these five observable conditions fully capture the business goal. No KPI
targets are appropriate for a structural migration with bounded, prop-surface refactoring.

## Business-Scope Non-Goals

- No changes to `Navigation.tsx` — it imports `next/link` and `next/navigation`, making it
  ineligible for the framework-agnostic library.
- No changes to any app other than `wahidyankf-web` (no `ayokoding-web`, `oseplatform-web`,
  `organiclever-web`, etc.).
- No visual changes to `wahidyankf-web`'s rendered output — `wahidyankf-web` call-sites pass
  props that reproduce the current appearance exactly.
- Refactoring scope is limited to the prop surface of each component — no new business logic,
  no new external dependencies, no behavioural changes beyond what the added props control.
- No new Gherkin spec files for ts-ui component coverage — that is a separate future concern.

## Business Risks and Mitigations

| Risk                                                                          | Mitigation                                                                                                                                                                                                                                     |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Visual regression — refactoring introduces unintended behaviour change        | Refactoring scope limited to prop surface; hardcoded values become defaults so zero-prop usage is identical to original. Playwright MCP visual verification against the running dev server before and after migration confirms no regressions. |
| Import site missed — a consuming file still references the deleted local path | Post-migration grep confirms zero matches for the deleted local import paths before pushing.                                                                                                                                                   |
| Quality gate regression — existing tests break due to path or export mismatch | All quality gates run locally before push; CI must be green before plan archival.                                                                                                                                                              |
