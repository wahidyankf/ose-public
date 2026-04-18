# OrganicLever FE — Local-First Mode

**Status**: In Progress
**Created**: 2026-04-16
**Scope**: `apps/organiclever-fe/` (and supporting docs/specs); `apps/organiclever-be/` untouched

## Overview

Pivot `organiclever-fe` to a local-first mode so it can deploy to Vercel
(`prod-organiclever-web` → www.organiclever.com) without depending on the F#/Giraffe backend at
`apps/organiclever-be/`. The backend is not deployed yet and will be re-wired in a future phase.

For this phase, the FE runs as a standalone landing site with a single diagnostic surface:
`/system/status/be`, which probes `organiclever-be`'s `/health` endpoint and degrades gracefully
when the BE is unconfigured, unreachable, or slow — never blanking the page.

The existing BFF/auth code (Effect TS service layer + Route Handlers) is preserved as dormant
library code in `src/services/` and `src/layers/` so future rewire is a routes-only change.

## Context and Motivation

Current state (`apps/organiclever-fe/`):

- Root `/` → redirects to `/profile` or `/login` based on cookie
- `/login` → Google Identity Services → posts to `/api/auth/google` (BFF route)
- `/profile` → server component fetches profile via `AuthService` → `BackendClient` → BE
- `/api/auth/{google,refresh,me}` → Route Handlers proxying to BE
- `src/proxy.ts` — dead-code middleware helper (exports `proxy` function but is not wired as
  Next.js middleware; Next.js requires the file to be named `middleware.ts` to execute)
- `ORGANICLEVER_BE_URL` default `http://localhost:8202`

Target state:

- Root `/` → renders a landing page (no network dependency)
- `/login`, `/profile`, `/api/auth/*` — removed
- `/system/status/be` — new server-rendered diagnostic page
- BE service/layer/contract code retained, unreferenced by any route
- `ORGANICLEVER_BE_URL` becomes purely optional (runtime-only)

Motivation:

- Ship a live landing site while backend platform work is in flight
- Validate Vercel deploy pipeline end-to-end with the new workflow
  (`test-and-deploy-organiclever.yml`) on a realistic FE-only surface
- Give ops a clearly-labelled place to watch BE readiness once it deploys

## Scope

**In scope:**

- `apps/organiclever-fe/src/` route and middleware changes
- `apps/organiclever-fe/` docs (README, env)
- `specs/apps/organiclever/fe/gherkin/` additions and removals
- `apps/organiclever-fe/test/unit/` additions and removals
- `apps/organiclever-fe-e2e/` spec changes for removed/added pages
- Top-level doc touch-ups referring to organiclever-fe BFF pattern

**Out of scope (explicitly preserved):**

- `apps/organiclever-be/` source and tests
- `specs/apps/organiclever/contracts/` OpenAPI spec
- `organiclever-contracts` Nx project
- `organiclever-be-e2e` workflow — still runs against local BE in CI
- The `codegen` Nx target on `organiclever-fe` (kept for future rewire)
- `.github/workflows/test-and-deploy-organiclever.yml` (already correctly gates deploy)

## Plan Documents

| Document                         | Purpose                                                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| [`brd.md`](./brd.md)             | Business Requirements Document — business goal, impact, affected roles, success metrics, business-scope non-goals and risks.         |
| [`prd.md`](./prd.md)             | Product Requirements Document — personas, user stories, functional requirements (R1-R7), Gherkin acceptance criteria, product scope. |
| [`tech-docs.md`](./tech-docs.md) | Route tree, `/system/status/be` implementation sketch, test strategy, CI/Vercel impact, risks.                                       |
| [`delivery.md`](./delivery.md)   | Phase-by-phase checklist including local quality gates, Playwright MCP verification, CI monitoring, and close-out.                   |

## References

- `apps/organiclever-fe/` — affected app
- `apps/organiclever-be/` — untouched; future re-enablement target
- `.github/workflows/test-and-deploy-organiclever.yml` — deploy pipeline
- [Plans Organization Convention](../../../governance/conventions/structure/plans.md)
- [CLAUDE.md](../../../CLAUDE.md) — `organiclever-fe` section
