# OrganicLever — Landing Page + UI Kit

## Context

Two parallel goals in one plan:

1. **UI Kit** — add the generic components missing from `ts-ui` that this and future
   apps need: `Textarea`, `Badge`. Propagate these before building any UI so downstream
   apps (including the app plan) can consume them cleanly.

2. **Landing page** — port the `organic-lever` handoff bundle's `LandingPage` component
   into `apps/organiclever-web/` as a pixel-close Next.js implementation. The landing page
   is a static marketing page; it has no dependency on the localStorage DB layer and ships
   independently of the app screens.

**Prerequisite for**: `2026-04-25__organiclever-web-app` — that plan depends on the ts-ui
additions delivered here.

## Scope

- `libs/ts-ui/` — `Textarea` + `Badge` components
- `apps/organiclever-web/src/app/page.tsx` + `src/components/landing/`

## Approach Summary

Port the `organic-lever` handoff bundle into Next.js using Tailwind v4 utility classes,
promoting two generic primitives (`Textarea`, `Badge`) to `ts-ui` first, then implementing
the landing page in parallel. All changes are additive; validated via Vitest Gherkin specs,
E2E, and manual Playwright MCP verification at both 375 px and 1280 px viewports.

**Git Workflow**: Executed in worktree `organiclever-v0` on branch `worktree-organiclever-v0`
inside `ose-public`. All commits go to this branch; merged to `main` via draft PR per the
subrepo worktree workflow convention.

## Navigation

| Document                       | Contents                                             |
| ------------------------------ | ---------------------------------------------------- |
| [brd.md](./brd.md)             | Business rationale, goals, success criteria          |
| [prd.md](./prd.md)             | Product requirements + Gherkin acceptance criteria   |
| [tech-docs.md](./tech-docs.md) | Architecture, component specs, propagation decisions |
| [delivery.md](./delivery.md)   | Step-by-step checklist                               |

## Phases at a Glance

| Phase | Scope                                    | Status |
| ----- | ---------------------------------------- | ------ |
| 0     | Environment setup + baseline green       | todo   |
| A     | ts-ui: `Textarea` + `Badge` components   | todo   |
| B     | Landing page implementation              | todo   |
| C     | Validation — tests, typecheck, lint, E2E | todo   |
