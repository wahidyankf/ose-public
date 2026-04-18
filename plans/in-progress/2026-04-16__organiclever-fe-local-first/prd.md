# Product Requirements Document (PRD)

**Plan**: OrganicLever FE — Local-First Mode
**Date**: 2026-04-16 (migrated to BRD/PRD layout 2026-04-18)

## Product Overview

Reshape `organiclever-fe` into a standalone landing site with a single diagnostic page (`/system/status/be`), removing all BE-dependent user routes from the built surface. The existing BFF/auth code (Effect TS service layer + Route Handlers) is preserved as dormant library code in `src/services/` and `src/layers/` so a future rewire is a routes-only change.

## Personas

> Solo-maintainer repo collaborating with AI agents. Personas are hats the maintainer wears plus consuming agents. No external sponsor or product owner.

| Persona                                    | Primary file(s)               | Need                                                                                           |
| ------------------------------------------ | ----------------------------- | ---------------------------------------------------------------------------------------------- |
| Public visitor                             | `/` rendered landing page     | Arrive at `www.organiclever.com`, see a working page, not a redirect or 5xx.                   |
| Ops (maintainer in operations hat)         | `/system/status/be`           | Verify BE is reachable from Vercel once BE deploys, observe UP/DOWN/timeout/not-config states. |
| Maintainer (author, intent mode)           | `brd.md`                      | Capture why local-first now, affected roles, success metrics.                                  |
| Maintainer (author, product-spec mode)     | `prd.md`                      | Author R1-R7 + Gherkin acceptance criteria.                                                    |
| Maintainer (author, engineering mode)      | `tech-docs.md`, `delivery.md` | Record route-tree changes, status-page implementation, phased checklist.                       |
| Maintainer (reviewer at PR / cold re-read) | `README.md` → targeted file   | Navigate to the concern relevant to the current review.                                        |
| `plan-maker` agent                         | All five                      | Scaffold the five-doc layout on request.                                                       |
| `plan-checker` agent                       | All five                      | Validate presence, content placement, Gherkin formatting.                                      |
| plan-execution workflow (calling context)  | `delivery.md`                 | Drive checklist execution; may read brd/prd/tech-docs for context.                             |
| `plan-execution-checker` agent             | `prd.md` + `delivery.md`      | Verify completed work satisfies acceptance criteria in `prd.md`.                               |

## User Stories

### US-1: Visitor sees a working landing page at root

**As a** public visitor typing `www.organiclever.com`
**I want** the root URL to render a landing page immediately
**So that** I see a working site, not a redirect loop or a cookie-based auth prompt

### US-2: Visitor is not exposed to disabled routes

**As a** public visitor
**I want** `/login`, `/profile`, and `/api/auth/*` to not exist on the built surface
**So that** I do not hit 503s from unbacked routes or reveal dormant auth plumbing

### US-3: Ops observes BE readiness without infra access

**As an** operator (maintainer, ops hat)
**I want** a public `/system/status/be` page that reports BE reachability
**So that** I can watch for BE availability after deploy without logging into infrastructure

### US-4: Ops sees graceful states for unreachable or slow BE

**As an** operator
**I want** the BE status page to show clearly labelled `Not configured`, `UP`, `DOWN`, or `timeout` states at HTTP 200
**So that** the page never 5xxs or blanks when the BE is unconfigured, unreachable, or slow

### US-5: Future rewire does not require a rebuild

**As a** future maintainer rewiring the BE
**I want** `src/services/auth-service.ts`, `src/layers/backend-client-live.ts`, `src/services/backend-client.ts`, `src/services/errors.ts` preserved with passing unit tests
**So that** re-enabling BFF routes is a routes-only change, not a rebuild from scratch

### US-6: Reader is not misled by dead code

**As a** future maintainer reading the repo
**I want** `src/proxy.ts` removed outright
**So that** I do not assume Next.js is executing it as middleware (Next.js only runs `middleware.ts`)

### US-7: Docs reflect local-first reality

**As a** contributor reading `organiclever-fe` docs
**I want** the Architecture sections in `apps/organiclever-fe/README.md`, `CLAUDE.md`, and `docs/reference/system-architecture/applications.md` to describe the local-first mode and the `/system/status/be` diagnostic
**So that** I do not waste time looking for BFF routes that do not exist on the built surface

## Functional Requirements

### R1 — Disable BE-dependent user routes

Remove `/login`, `/profile`, and `/api/auth/*` from the built surface so Vercel does not expose routes that 503 on invoke. Keep `src/services/auth-service.ts`, `src/layers/backend-client-live.ts`, `src/services/backend-client.ts`, and `src/services/errors.ts` as library code; their unit tests stay green.

### R2 — Landing page at `/`

Root renders a static landing page — no cookie inspection, no redirect, no BE call. Content can be the minimum viable "OrganicLever — coming soon" card; it can be expanded later without a plan revision.

### R3 — Diagnostic page `/system/status/be`

Server-rendered page that:

1. Reads `ORGANICLEVER_BE_URL` at request time.
2. If unset → renders "Not configured — set `ORGANICLEVER_BE_URL` to probe".
3. If set → `fetch(${url}/health)` with `AbortSignal.timeout(3000)` (3-second timeout).
4. On success → renders `UP`, the URL, the response body, and round-trip latency.
5. On any failure (timeout, network error, non-2xx, JSON parse error) → renders `DOWN` with the reason. Never throws; never returns non-200 to the user.

All failures are caught at the page level. The page is marked `dynamic = 'force-dynamic'` so Vercel never attempts to prerender it at build time.

### R4 — `ORGANICLEVER_BE_URL` is optional

Unset at build time on Vercel is allowed. Nothing in the build pipeline depends on it. At runtime only `/system/status/be` reads it; other routes must not reference it.

### R5 — Dead-code file `src/proxy.ts` removed

`src/proxy.ts` is dead code — it exports a `proxy` function but is never imported anywhere and is not wired as Next.js middleware (Next.js only executes files named `middleware.ts`). Remove `src/proxy.ts` entirely. If future route protection is introduced, it will be a new `middleware.ts` created in its own plan.

### R6 — Documentation refreshed

- `apps/organiclever-fe/README.md` — rewrite the Architecture section to describe the local-first mode; list `/system/status/be` and its failure modes; note BE code is dormant.
- `CLAUDE.md` — update the `organiclever-fe` description if it claims a BFF pattern.
- `docs/reference/system-architecture/applications.md` — update the organiclever-fe section to reflect landing-site scope; explicitly note BE integration is deferred.

### R7 — Vercel deploys green without BE

Deploying `main` to `prod-organiclever-web`:

- Build succeeds with `ORGANICLEVER_BE_URL` unset.
- `/` renders.
- `/system/status/be` renders with "Not configured" branch and HTTP 200.
- No console errors visible in Vercel's function logs for either request.

## Acceptance Criteria (Gherkin)

```gherkin
Feature: Local-first organiclever-fe

  Scenario: Root renders landing without BE
    Given ORGANICLEVER_BE_URL is unset
    When a visitor requests GET /
    Then the response status is 200
    And the body contains the landing page heading
    And no request is made to organiclever-be
    And the page loads at / without intermediate redirect

  Scenario: BE status page shows Not Configured when env unset
    Given ORGANICLEVER_BE_URL is unset
    When a visitor requests GET /system/status/be
    Then the response status is 200
    And the body contains "Not configured"

  Scenario: BE status page shows UP when backend healthy
    Given ORGANICLEVER_BE_URL is "http://be.example.test"
    And GET http://be.example.test/health returns 200 with body {"status":"UP"}
    When a visitor requests GET /system/status/be
    Then the response status is 200
    And the body contains "UP"
    And the body contains the backend URL

  Scenario: BE status page shows DOWN when backend unreachable
    Given ORGANICLEVER_BE_URL is "http://be.example.test"
    And GET http://be.example.test/health fails with connection refused
    When a visitor requests GET /system/status/be
    Then the response status is 200
    And the body contains "DOWN"
    And the body contains the failure reason
    And no uncaught exception reaches the Next.js error boundary

  Scenario: BE status page shows DOWN when backend times out
    Given ORGANICLEVER_BE_URL is "http://be.example.test"
    And GET http://be.example.test/health does not respond within 3 seconds
    When a visitor requests GET /system/status/be
    Then the response status is 200
    And the body contains "DOWN"
    And the body contains "timeout"

  Scenario Outline: Disabled routes return 404
    When a visitor requests <method> <path>
    Then the response status is 404

    Examples:
      | method | path                |
      | GET    | /login              |
      | GET    | /profile            |
      | POST   | /api/auth/google    |
      | GET    | /api/auth/refresh   |
      | GET    | /api/auth/me        |
```

## Out of Scope (Product)

- **Auth, profile, or any BFF-dependent feature** — deferred until BE ships in a future plan.
- **Expanded landing-page copy beyond the MVP "coming soon" card** — content growth is a post-plan content-only task, not a plan deliverable.
- **A future rewire migration plan** — authored separately when BE is ready.
- **Tests for routes that do not exist** (`/login`, `/profile`, `/api/auth/*`) — removed alongside the routes themselves.

## Product-Level Risks

| Risk                                                              | Likelihood | Mitigation                                                                           |
| ----------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------ |
| `/system/status/be` ships without the 3s timeout guard            | Low        | R3 is specified explicitly; Playwright E2E covers timeout and DOWN scenarios.        |
| Landing page caches stale MVP copy after expansion                | Low        | Root is a static page; cache busts naturally on each deploy.                         |
| Disabled routes accidentally resurface via stale Playwright tests | Low        | E2E specs for removed routes are deleted in the same commit as the route removal.    |
| `/system/status/be` reveals BE URL in public response             | Low        | Intentional — the diagnostic page is meant to show the URL being probed; no secrets. |
