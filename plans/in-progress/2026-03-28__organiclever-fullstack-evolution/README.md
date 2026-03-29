# Plan: OrganicLever Fullstack Evolution

**Status**: In Progress
**Created**: 2026-03-28
**Delivery Type**: Multi-phase rollout
**Git Workflow**: Trunk Based Development

## Overview

Rebuild the OrganicLever product as a proper fullstack application with four apps following the
same patterns as `apps/demo-*`:

- **`organiclever-be`** -- F#/Giraffe REST API backend
- **`organiclever-fe`** -- Next.js 16 + TypeScript + Effect TS frontend (replaces `organiclever-fe`)
- **`organiclever-be-e2e`** -- Playwright E2E tests for backend API
- **`organiclever-fe-e2e`** -- Playwright E2E tests for frontend UI

The initial scope is intentionally minimal: Google OAuth login with a protected `/profile` page
as the core feature (first real database-backed feature), plus a health endpoint. This establishes
the fullstack scaffold, CI/CD pipelines, contract-driven codegen, and three-level testing standard
before adding domain features.

Existing `specs/apps/organiclever-be/` and `specs/apps/organiclever-fe/` are merged into a unified
`specs/apps/organiclever/` following the `specs/apps/demo/` structure (c4, be, fe, contracts).

## Problem Statement

1. **No real backend** -- `organiclever-fe` uses Next.js API routes with JSON files; no database,
   no persistent state, no formal API contract
2. **Non-standard structure** -- Unlike demo apps, there is no separated backend, no contract
   codegen, no E2E test apps, and no standard CI/CD workflows
3. **Fragmented specs** -- Backend and frontend specs live in separate top-level directories
   without C4 diagrams or OpenAPI contracts
4. **No Effect TS** -- Frontend lacks structured error handling and composability
5. **Naming mismatch** -- `organiclever-fe` should be `organiclever-fe` to match the
   `[domain]-[type]` naming convention used by demo apps

## Current State

| Aspect         | Details                                                             |
| -------------- | ------------------------------------------------------------------- |
| **Apps**       | `organiclever-fe` (Next.js 16), `organiclever-fe-e2e` (Playwright)  |
| **Backend**    | None (API routes inside organiclever-fe)                            |
| **Specs**      | Split: `specs/apps/organiclever-be/`, `specs/apps/organiclever-fe/` |
| **Data**       | JSON files (`members.json`, `users.json`)                           |
| **Auth**       | Cookie-based, plaintext password comparison                         |
| **CI/CD**      | `.github/workflows/test-organiclever-fe.yml` (single workflow)      |
| **Agents**     | `apps-organiclever-fe-deployer`                                     |
| **Skills**     | `apps-organiclever-fe-developing-content`                           |
| **Deployment** | Vercel via `prod-organiclever-fe` branch                            |

## Target State

| Aspect          | Details                                                                                                         |
| --------------- | --------------------------------------------------------------------------------------------------------------- |
| **Apps**        | `organiclever-be`, `organiclever-fe`, `organiclever-be-e2e`, `organiclever-fe-e2e`                              |
| **Backend**     | F#/Giraffe REST API with PostgreSQL                                                                             |
| **Frontend**    | Next.js 16 + TypeScript + Effect TS                                                                             |
| **Specs**       | Unified `specs/apps/organiclever/` (c4, be, fe, contracts)                                                      |
| **Initial API** | `GET /api/v1/health`, `POST /api/v1/auth/google`, `POST /api/v1/auth/refresh`, `GET /api/v1/auth/me`            |
| **Initial UI**  | `/login` (Google OAuth only), `/profile` (protected, logged-in users only)                                      |
| **CI/CD**       | 4 GitHub Actions workflows (matching demo-\* patterns)                                                          |
| **Agents**      | Updated deployer + new agents as needed                                                                         |
| **Skills**      | Updated developing-content skill                                                                                |
| **Coverage**    | BE: 90%, FE: 70% (matching demo standards)                                                                      |
| **Nx targets**  | Standard 7 mandatory targets per app (codegen, typecheck, lint, build, test:unit, test:quick, test:integration) |

## Scope

### In Scope

- **`specs/apps/organiclever/`** -- Unified spec structure
  - `c4/` -- Context, container, component-be, component-fe diagrams
  - `be/gherkin/` -- Backend Gherkin specs (HTTP-semantic): health, authentication
  - `fe/gherkin/` -- Frontend Gherkin specs (UI-semantic): authentication, profile
  - `contracts/` -- OpenAPI 3.1 contract (health, auth, profile)
- **`apps/organiclever-be`** -- F#/Giraffe REST API
  - `GET /api/v1/health` -> `{"status":"UP"}`
  - `POST /api/v1/auth/google`, `POST /api/v1/auth/refresh`, `GET /api/v1/auth/me`
  - Three-level testing, OpenAPI codegen, Docker support
- **`apps/organiclever-fe`** -- Next.js 16 + Effect TS (replaces `organiclever-fe`)
  - `/login` page (Google OAuth), `/profile` page (protected)
  - `@open-sharia-enterprise/ts-ui` for shared UI primitives with OrganicLever styling
  - Effect TS service layer for API calls via BFF proxy
  - Three-level testing, OpenAPI codegen
- **`apps/organiclever-be-e2e`** -- Playwright E2E for backend API
- **`apps/organiclever-fe-e2e`** -- Playwright E2E for frontend UI (replaces `organiclever-fe-e2e`)
- **CI/CD** -- GitHub Actions workflows for all 4 apps (matching demo-\* patterns)
- **`infra/dev/organiclever/`** -- Docker Compose for local development (replaces
  `infra/dev/organiclever-fe/`), supporting both backend + frontend + PostgreSQL
- **Cleanup** -- Archive `organiclever-fe`, remove `organiclever-fe-e2e`, delete old spec dirs
- **Documentation updates** -- CLAUDE.md, agents, skills, governance, docs references

### Out of Scope

- Existing features (auth, dashboard, members CRUD) -- will be added in future plans
- Landing page / marketing content
- **CD / Deployment** -- No Vercel deployment setup, no production branches, no deployer agents.
  organiclever.com is expected to break during this transition. Deployment will be addressed in a
  follow-up plan.
- Database migrations beyond initial schema

## Key Decisions

| Decision           | Choice                            | Rationale                                                  |
| ------------------ | --------------------------------- | ---------------------------------------------------------- |
| **FE name**        | `organiclever-fe` (not `-web`)    | Matches `[domain]-[type]` convention (`demo-fe-*`)         |
| **Initial scope**  | Google login + protected profile  | First DB-backed feature, establishes scaffold + CI         |
| **Auth provider**  | Google OAuth 2.0                  | Widely used, well-documented, free, no password management |
| **Backend lang**   | F# / Giraffe                      | Functional-first, proven by `demo-be-fsharp-giraffe`       |
| **Frontend extra** | Effect TS                         | Structured errors, DI, composable services                 |
| **FE-BE comm**     | BFF proxy (Next.js server-side)   | Backend URL private, no CORS, centralized middleware       |
| **Spec structure** | Unified `specs/apps/organiclever` | Follows `specs/apps/demo/` pattern                         |
| **Contract**       | OpenAPI 3.1                       | Codegen for F# backend and TypeScript frontend             |
| **BE port**        | 8202                              | Follows demo-be port convention                            |
| **FE port**        | 3200                              | Unchanged from current                                     |
| **BE coverage**    | 90%                               | Standard for backends                                      |
| **FE coverage**    | 70%                               | Standard for frontends (demo-fe-ts-nextjs uses 70%)        |
| **Archive**        | `archived/organiclever-fe/`       | Preserves git history of current app                       |

## Prerequisites (Manual Setup Before Development)

Google OAuth requires manual credential setup that cannot be automated:

1. **Google Cloud Console** ([console.cloud.google.com](https://console.cloud.google.com)):
   - Create a project (or use existing) for OrganicLever
   - Navigate to **APIs & Services** > **Credentials**
   - Create an **OAuth 2.0 Client ID** (Web application type)
   - Add authorized redirect URIs:
     - `http://localhost:3200/api/auth/callback/google` (local dev)
     - Production URL (when CD is set up later)
   - Note the **Client ID** and **Client Secret**
2. **Enable Google People API** (or Google+ API) in the same project for profile data
3. **Environment variables** to set locally (in `.env` or `infra/dev/organiclever/.env`):
   - `GOOGLE_CLIENT_ID` -- OAuth Client ID from step 1
   - `GOOGLE_CLIENT_SECRET` -- OAuth Client Secret from step 1
4. **Test accounts**: Any Google account can be used during development (no domain restrictions
   unless configured in the consent screen)

These credentials are **secrets** and must never be committed. The `.env.example` file will
document the required variables without values.

## Quick Links

- [Requirements](./requirements.md)
- [Technical Documentation](./tech-docs.md)
- [Delivery Plan](./delivery.md)

## Related Plans

- [OSE Platform Web - Next.js Rewrite](../../done/2026-03-28__oseplatform-web-nextjs-rewrite/README.md) -- Parallel effort
- [demo-fs-ts-nextjs](../../done/2026-03-22__demo-fs-ts-nextjs/README.md) -- Fullstack Next.js patterns

## Related Files

- Current frontend: [`apps/organiclever-fe/`](../../../apps/organiclever-fe/)
- Current E2E: [`apps/organiclever-fe-e2e/`](../../../apps/organiclever-fe-e2e/)
- Reference backend: [`apps/demo-be-fsharp-giraffe/`](../../../apps/demo-be-fsharp-giraffe/)
- Reference frontend: [`apps/demo-fe-ts-nextjs/`](../../../apps/demo-fe-ts-nextjs/)
- Reference BE E2E: [`apps/demo-be-e2e/`](../../../apps/demo-be-e2e/)
- Reference FE E2E: [`apps/demo-fe-e2e/`](../../../apps/demo-fe-e2e/)
- Reference specs: [`specs/apps/demo/`](../../../specs/apps/demo/)
- Current BE specs: [`specs/apps/organiclever/be/`](../../../specs/apps/organiclever/be/) (to be merged)
- Current FE specs: [`specs/apps/organiclever/fe/`](../../../specs/apps/organiclever/fe/) (to be merged)
- Deployer agent: [`.claude/agents/apps-organiclever-fe-deployer.md`](../../../.claude/agents/apps-organiclever-fe-deployer.md)
- Content skill: [`.claude/skills/apps-organiclever-fe-developing-content/`](../../../.claude/skills/apps-organiclever-fe-developing-content/)
- GitHub workflow: [`.github/workflows/test-organiclever.yml`](../../../.github/workflows/test-organiclever.yml)
