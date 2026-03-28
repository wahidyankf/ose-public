# Requirements: OrganicLever Fullstack Evolution

## Functional Requirements

### FR-1: Unified Specifications (`specs/apps/organiclever/`)

#### FR-1.1: C4 Architecture Diagrams

- **FR-1.1.1**: Context diagram (L1) -- OrganicLever system, user actor
- **FR-1.1.2**: Container diagram (L2) -- SPA, REST API, Database
- **FR-1.1.3**: Component diagram for backend (L3) -- handlers, domain, infrastructure
- **FR-1.1.4**: Component diagram for frontend (L3) -- pages, components, services

#### FR-1.2: Backend Gherkin Specs (`be/gherkin/`)

- **FR-1.2.1**: `health/health-check.feature` -- Health endpoint returns 200 with `{"status":"UP"}`
- **FR-1.2.2**: `authentication/google-login.feature` -- Google OAuth token exchange returns JWT;
  invalid token returns 401; user record created on first login
- **FR-1.2.3**: `authentication/me.feature` -- Authenticated user can fetch own profile;
  unauthenticated request returns 401
- **FR-1.2.4**: Background step convention: `Given the API is running`

#### FR-1.3: Frontend Gherkin Specs (`fe/gherkin/`)

- **FR-1.3.1**: `authentication/google-login.feature` -- `/login` page shows "Sign in with Google"
  button; successful OAuth redirects to `/profile`; user info displayed after login
- **FR-1.3.2**: `authentication/profile.feature` -- `/profile` page (protected) displays user
  name, email, avatar; redirects to `/login` if not authenticated
- **FR-1.3.3**: `authentication/route-protection.feature` -- Unauthenticated access to `/profile`
  redirects to `/login`
- **FR-1.3.4**: Background step convention: `Given the app is running`

#### FR-1.4: OpenAPI Contract (`contracts/`)

- **FR-1.4.1**: OpenAPI 3.1 spec with endpoints: `/api/v1/health`,
  `/api/v1/auth/google`, `/api/v1/auth/refresh`, `/api/v1/auth/me`
- **FR-1.4.2**: Schemas: `HealthResponse`, `AuthGoogleRequest`,
  `AuthTokenResponse` (access + refresh tokens), `RefreshRequest`, `UserProfile`, `ErrorResponse`
- **FR-1.4.3**: Paths: `paths/health.yaml`, `paths/auth.yaml`
- **FR-1.4.4**: Spectral linting rules (camelCase enforcement)
- **FR-1.4.5**: Nx `project.json` with lint, bundle, docs targets (as `organiclever-contracts`)
- **FR-1.4.6**: Codegen configuration for both F# backend and TypeScript frontend

### FR-2: Backend Application (`apps/organiclever-be`)

#### FR-2.1: Endpoints

- **FR-2.1.1**: `GET /api/v1/health` -- Returns `{"status":"UP"}` (200, no auth required)
- **FR-2.1.2**: `POST /api/v1/auth/google` -- Accepts Google OAuth ID token, validates with
  Google, creates user record on first login (name, email, avatar from Google profile),
  returns JWT access token + refresh token (200, 401)
- **FR-2.1.3**: `POST /api/v1/auth/refresh` -- Accepts refresh token, returns new access token +
  new refresh token (200, 401). Old refresh token invalidated (rotation).
- **FR-2.1.4**: `GET /api/v1/auth/me` -- Returns authenticated user profile (200, 401).
  This is the API that powers the `/profile` page on the frontend.
- **FR-2.1.5**: JWT access token: short-lived (15 min), includes userId, email, name
- **FR-2.1.6**: Refresh token: long-lived (7 days), stored hashed in DB, single-use (rotation)
- **FR-2.1.7**: No email/password registration or login -- Google OAuth is the sole auth method

#### FR-2.2: Architecture

- **FR-2.2.1**: F#/Giraffe HttpHandler composition
- **FR-2.2.2**: Clean Architecture: Handlers, Domain, Infrastructure layers
- **FR-2.2.3**: **Repository pattern** using F# function records (following demo-be-fsharp-giraffe):
  `UserRepository`, `RefreshTokenRepository` as interfaces; `EfRepositories`
  as EF Core implementations; injected via DI, mockable for unit tests
- **FR-2.2.4**: OpenAPI codegen for contract types (`generated-contracts/`). All API
  request/response types derived from OpenAPI spec -- no hand-written DTOs
- **FR-2.2.5**: Port 8202

#### FR-2.3: Database & Migrations

- **FR-2.3.1**: PostgreSQL 17 via EF Core with `Npgsql.EntityFrameworkCore.PostgreSQL`
- **FR-2.3.2**: DbUp (`dbup-core` + `dbup-postgresql`) for SQL file migrations
- **FR-2.3.3**: Migration files at `src/OrganicLeverBe/db/migrations/*.sql` as embedded resources
- **FR-2.3.4**: Migrations run automatically on startup via `Program.fs`
- **FR-2.3.5**: `DATABASE_URL` env var for PostgreSQL connection string
- **FR-2.3.6**: Unit tests use SQLite in-memory via `EnsureCreated()` (no DbUp)
- **FR-2.3.7**: Integration tests use real PostgreSQL via Docker Compose with DbUp migrations
- **FR-2.3.8**: Initial schema: `001-initial-schema.sql`

#### FR-2.4: Nx Targets (Standard 7 + Optional)

- **FR-2.4.1**: `codegen` -- Generate types from OpenAPI contract
- **FR-2.4.2**: `typecheck` -- `dotnet build` with warnings as errors (depends on codegen)
- **FR-2.4.3**: `lint` -- Fantomas + FSharpLint + G-Research analyzers
- **FR-2.4.4**: `build` -- `dotnet publish` (depends on codegen)
- **FR-2.4.5**: `test:unit` -- xUnit with **mocked repository function records**, consuming
  Gherkin specs from `specs/apps/organiclever/be/gherkin/`. Calls service/handler functions
  directly (no HTTP). Uses SQLite in-memory.
- **FR-2.4.6**: `test:quick` -- Unit tests + AltCover coverage + rhino-cli validation (90%)
- **FR-2.4.7**: `test:integration` -- Docker Compose with **real PostgreSQL and real EF Core
  repositories**, consuming the **same Gherkin specs**. Calls service/handler functions directly
  (no HTTP). No mocks.
- **FR-2.4.8**: `dev` (optional) -- `dotnet watch run`
- **FR-2.4.9**: `start` (optional) -- `dotnet run`

### FR-3: Frontend Application (`apps/organiclever-fe`)

#### FR-3.1: BFF Proxy Pattern

- **FR-3.1.1**: All calls to `organiclever-be` MUST go through Next.js server-side code
  (Server Components, Route Handlers, or Server Actions) -- never directly from the browser
- **FR-3.1.2**: Backend URL (`ORGANICLEVER_BE_URL`) is a server-only env var (no `NEXT_PUBLIC_`
  prefix), keeping the backend address private from the client
- **FR-3.1.3**: Route Handlers under `src/app/api/` act as proxy endpoints for any client-side
  code that needs backend data
- **FR-3.1.4**: Server Components fetch backend data directly during SSR

#### FR-3.2: Pages

- **FR-3.2.1**: `/login` page -- "Sign in with Google" button only (no email/password form);
  sends Google ID token to backend via BFF proxy; stores JWT in httpOnly cookie;
  redirects to `/profile` on success
- **FR-3.2.2**: `/profile` page (protected) -- Calls `GET /api/v1/auth/me` via BFF proxy;
  displays user name, email, avatar from Google; redirects to `/login` if not authenticated
- **FR-3.2.3**: Root page (`/`) -- Redirects to `/profile` if authenticated, `/login` if not
- **FR-3.2.4**: Token refresh: BFF proxy automatically refreshes expired access tokens
  using refresh token before returning 401 to client

#### FR-3.3: Effect TS Integration + Contract Types

- **FR-3.3.1**: Server-side API client using Effect TS (`Effect`, `Layer`, `Context`)
- **FR-3.3.2**: Structured error types (`NetworkError`, `ApiError`)
- **FR-3.3.3**: Service layer with dependency injection (server-side only)
- **FR-3.3.4**: `BackendClient` service encapsulates all HTTP calls to `organiclever-be`
- **FR-3.3.5**: All API calls use **generated contract types** from `@hey-api/openapi-ts` codegen.
  No hand-written request/response types -- all derived from the shared OpenAPI spec.
  Request payloads, response types, and error shapes match the contract exactly.

#### FR-3.4: Nx Targets (Standard 7 + Optional)

- **FR-3.4.1**: `codegen` -- Generate types from OpenAPI contract
- **FR-3.4.2**: `typecheck` -- `tsc --noEmit` (depends on codegen)
- **FR-3.4.3**: `lint` -- `oxlint` with jsx-a11y plugin
- **FR-3.4.4**: `build` -- `next build` (depends on codegen)
- **FR-3.4.5**: `test:unit` -- Vitest with mocked services, Gherkin specs
- **FR-3.4.6**: `test:quick` -- Unit tests + coverage + rhino-cli validation (70%)
- **FR-3.4.7**: `test:integration` -- Vitest with MSW, Gherkin specs
- **FR-3.4.8**: `dev` (optional) -- `next dev --port 3200`
- **FR-3.4.9**: `start` (optional) -- `next start --port 3200`

### FR-4: Backend E2E Tests (`apps/organiclever-be-e2e`)

- **FR-4.1**: Playwright-based E2E tests against running `organiclever-be` (real HTTP + real DB)
- **FR-4.2**: Consumes the **same Gherkin specs** from `specs/apps/organiclever/be/gherkin/`
  via `bddgen` (third level of the three-level testing standard)
- **FR-4.3**: Nx targets: `install`, `lint`, `typecheck`, `test:quick`, `test:e2e`, `test:e2e:ui`

### FR-5: Frontend E2E Tests (`apps/organiclever-fe-e2e`)

- **FR-5.1**: Playwright-based E2E tests against running `organiclever-fe` + `organiclever-be`
- **FR-5.2**: Consumes `specs/apps/organiclever/fe/gherkin/` specs via `bddgen`
- **FR-5.3**: Nx targets: `install`, `lint`, `typecheck`, `test:quick`, `test:e2e`, `test:e2e:ui`

### FR-6: Local Development Infrastructure (`infra/dev/organiclever/`)

- **FR-6.1**: Docker Compose with 3 services: PostgreSQL, organiclever-be, organiclever-fe
- **FR-6.2**: Replaces `infra/dev/organiclever-web/`
- **FR-6.3**: `npm run organiclever:dev` starts the full stack locally
- **FR-6.4**: Frontend connects to backend via Docker network
  (`ORGANICLEVER_BE_URL=http://organiclever-be:8202`)
- **FR-6.5**: CI variant (`docker-compose.ci.yml`) for integration and E2E test workflows

### FR-7: CI Pipelines (No CD/Deployment)

- **FR-6.1**: GitHub Actions workflow `test-organiclever-be.yml` -- Scheduled 2x daily
  (integration + E2E tests for backend)
- **FR-6.2**: GitHub Actions workflow `test-organiclever-fe.yml` -- Scheduled 2x daily
  (integration + E2E tests for frontend)
- **FR-6.3**: Both workflows follow same pattern as `test-demo-be-*.yml` / `test-demo-fe-*.yml`
- **FR-6.4**: All 4 apps included in `main-ci.yml` affected targets (`typecheck`, `lint`,
  `test:quick`)
- **FR-6.5**: All 4 apps included in `pr-quality-gate.yml` affected targets
- **FR-6.6**: CD/deployment is **out of scope** -- no Vercel setup, no production branches,
  no deployer agents. organiclever.com is expected to break.

### FR-8: Documentation Updates

#### FR-8.1: CLAUDE.md

- **FR-8.1.1**: Replace `organiclever-web` entries with `organiclever-fe`
- **FR-8.1.2**: Add `organiclever-be` entry (F#/Giraffe REST API)
- **FR-8.1.3**: Replace `organiclever-web-e2e` with `organiclever-fe-e2e` and `organiclever-be-e2e`
- **FR-8.1.4**: Update coverage sections (BE 90%, FE 70%)
- **FR-8.1.5**: Update dev port and deployment sections
- **FR-8.1.6**: Add codegen/contract information

#### FR-8.2: Agents (`.claude/agents/`)

- **FR-8.2.1**: Rename/update `apps-organiclever-web-deployer.md` -> `apps-organiclever-fe-deployer.md`
- **FR-8.2.2**: Update `README.md` agent listings
- **FR-8.2.3**: Update `specs-maker.md` example references

#### FR-8.3: Skills (`.claude/skills/`)

- **FR-8.3.1**: Rename/update `apps-organiclever-web-developing-content/` ->
  `apps-organiclever-fe-developing-content/`
- **FR-8.3.2**: Rewrite SKILL.md for new architecture (Effect TS, backend integration, codegen)

#### FR-8.4: Governance and Docs

- **FR-8.4.1**: Update all 14+ governance files referencing `organiclever-web`
- **FR-8.4.2**: Update all 14+ docs files referencing `organiclever-web`
- **FR-8.4.3**: Add `organiclever-be` to technology stack, CI/CD, and deployment docs
- **FR-8.4.4**: Update `governance/development/infra/github-actions-workflow-naming.md`

## Non-Functional Requirements

### NFR-1: Testing Standards

- **NFR-1.1**: Three-level testing for backend: unit (mocked repos), integration (real
  PostgreSQL), E2E (Playwright HTTP). All three levels consume the **same Gherkin specs**
  from `specs/apps/organiclever/be/gherkin/` -- only step implementations differ.
- **NFR-1.2**: Three-level testing for frontend: unit (mocked), integration (MSW),
  E2E (Playwright browser). All three levels consume the **same Gherkin specs**
  from `specs/apps/organiclever/fe/gherkin/`.
- **NFR-1.3**: All API types (request, response, error) derived from OpenAPI contract via
  codegen in both backend and frontend -- no hand-written DTOs
- **NFR-1.4**: Coverage: BE 90% line, FE 70% line (matching demo standards)
- **NFR-1.5**: Gherkin spec paths included in Nx cache inputs

### NFR-2: Code Quality

- **NFR-2.1**: Backend: Fantomas (formatting), FSharpLint (style), G-Research analyzers,
  warnings as errors
- **NFR-2.2**: Frontend: oxlint with jsx-a11y plugin, TypeScript strict mode
- **NFR-2.3**: E2E apps: oxlint, TypeScript strict mode

### NFR-3: Developer Experience

- **NFR-3.1**: `nx dev organiclever-be` starts backend on port 8202
- **NFR-3.2**: `nx dev organiclever-fe` starts frontend on port 3200
- **NFR-3.3**: Contract changes trigger codegen for both apps via Nx dependency graph
- **NFR-3.4**: Docker Compose for backend PostgreSQL in integration tests

### NFR-4: CI/CD

- **NFR-4.1**: Pre-push hook: `typecheck`, `lint`, `test:quick` for affected projects
- **NFR-4.2**: PR quality gate: Same as pre-push via GitHub Actions
- **NFR-4.3**: Scheduled: Integration + E2E tests 2x daily (matching demo-* cron schedule)
- **NFR-4.4**: Frontend deployment to Vercel via `prod-organiclever-fe` branch

## Acceptance Criteria

### AC-1: Specs Unified

```gherkin
Scenario: Unified spec structure exists
  Given the repository has been updated
  When I inspect specs/apps/organiclever/
  Then the following directories exist:
    | Directory      |
    | c4/            |
    | be/gherkin/    |
    | fe/gherkin/    |
    | contracts/     |
  And specs/apps/organiclever-be/ no longer exists
  And specs/apps/organiclever-web/ no longer exists
```

### AC-2: Backend Auth + Health

```gherkin
Scenario: Health endpoint returns UP
  Given organiclever-be is running on port 8202
  When I send GET /api/v1/health
  Then the response status is 200
  And the response body contains {"status":"UP"}

Scenario: Profile endpoint requires authentication
  Given organiclever-be is running on port 8202
  When I send GET /api/v1/auth/me without a token
  Then the response status is 401

Scenario: Backend quality gate passes
  Given I run nx run organiclever-be:test:quick
  Then all unit tests pass
  And line coverage is at least 90%
```

### AC-3: Frontend Profile (Protected)

```gherkin
Scenario: Profile page requires login
  Given organiclever-be is running on port 8202
  And organiclever-fe is running on port 3200
  When I navigate to /profile without being logged in
  Then I am redirected to /login

Scenario: Profile page shows user info after login
  Given I am logged in via Google OAuth
  When I navigate to /profile
  Then the page displays my name, email, and avatar

Scenario: Frontend quality gate passes
  Given I run nx run organiclever-fe:test:quick
  Then all unit tests pass
  And line coverage is at least 70%
```

### AC-4: Standard CI Targets

```gherkin
Scenario: All 4 apps have standard targets
  Given I run nx show projects --with-target test:quick
  Then the output includes:
    | Project              |
    | organiclever-be      |
    | organiclever-fe      |
    | organiclever-be-e2e  |
    | organiclever-fe-e2e  |
```

### AC-5: Contract Codegen

```gherkin
Scenario: Contract changes trigger codegen
  Given I modify specs/apps/organiclever/contracts/openapi.yaml
  When I run nx affected -t typecheck
  Then organiclever-be codegen runs
  And organiclever-fe codegen runs
  And typecheck validates generated types
```

### AC-6: Documentation Complete

```gherkin
Scenario: No stale references to organiclever-web
  Given I search the repository for "organiclever-web"
  Then no results are found in CLAUDE.md
  And no results are found in .claude/agents/
  And no results are found in .claude/skills/
  And no results are found in governance/
  And no results are found in docs/
  And the only results are in archived/organiclever-web/ or plans/
```
