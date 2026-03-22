# Plan: Create `demo-fs-ts-nextjs` — Fullstack Next.js App

## Overview

- **Status**: Not Started
- **Created**: 2026-03-22
- **Goal**: Build a new fullstack TypeScript app (`apps/demo-fs-ts-nextjs`) using Next.js 16
  that combines backend API routes and frontend UI in a single application. It implements both
  the backend API (Route Handlers) and the frontend UI (App Router pages), consuming both
  BE and FE Gherkin spec sets and the shared OpenAPI contract.
- **Git Workflow**: Work on `main` (Trunk Based Development)

### What Makes This Different

This is the first **fullstack** (`fs`) demo app — all existing demos are either `demo-be-*`
(backend only) or `demo-fe-*` (frontend only). The fullstack app:

- Implements the full API surface via Next.js Route Handlers (replacing a separate backend)
- Implements the full UI via Next.js App Router pages (replacing a separate frontend)
- Connects directly to PostgreSQL (no API proxy needed — it IS the API)
- Must pass **both** [BE Gherkin specs](../../specs/apps/demo/be/gherkin/README.md) and [FE Gherkin specs](../../specs/apps/demo/fe/gherkin/README.md)
- Serves everything on a single port (3401)

---

## Requirements

### Objectives

- Build `apps/demo-fs-ts-nextjs` as a production-quality fullstack application using
  Next.js 16 (App Router + Route Handlers)
- Implement all API endpoints from the OpenAPI contract as Next.js Route Handlers
  (`app/api/v1/...`)
- Implement all frontend pages matching the existing `demo-fe-ts-nextjs` feature set
- Connect directly to PostgreSQL via Drizzle ORM for data persistence
- Consume **both** shared Gherkin spec sets:
  - Backend: `specs/apps/demo/be/gherkin/` (all shared scenarios)
  - Frontend: `specs/apps/demo/fe/gherkin/` (all shared scenarios)
- Pass E2E tests from both `demo-be-e2e` and `demo-fe-e2e` (via `BASE_URL` env var)
- Enforce >=90% line coverage via `rhino-cli test-coverage validate` on unit tests
- Generate types from the OpenAPI contract via `codegen` Nx target
- Serve on port **3401** (new port range for fullstack apps)
- Add Docker Compose for local development and integration testing
- Add CI workflow `.github/workflows/test-demo-fs-ts-nextjs.yml`

### User Stories

**API — Authentication:**

```gherkin
Feature: Fullstack app serves authentication API

Scenario: Register and login via Route Handlers
  Given the fullstack app is running on port 3401
  When a user sends POST /api/v1/auth/register with valid credentials
  Then the response status should be 201
  When the user sends POST /api/v1/auth/login with those credentials
  Then the response should contain accessToken and refreshToken

Scenario: Token refresh via Route Handler
  Given a user is authenticated
  When the user sends POST /api/v1/auth/refresh with a valid refresh token
  Then a new access token should be returned
```

**API — Expenses:**

```gherkin
Feature: Fullstack app serves expense API

Scenario: CRUD operations via Route Handlers
  Given an authenticated user
  When the user sends POST /api/v1/expenses with valid expense data
  Then the response status should be 201
  When the user sends GET /api/v1/expenses
  Then the created expense should appear in the list
```

**Frontend — Login Flow:**

```gherkin
Feature: User authenticates via UI

Scenario: Successful login redirects to dashboard
  Given the app is running
  And a user "alice" exists with password "Str0ng#Pass1"
  When alice submits the login form
  Then alice should be on the dashboard page
```

**Frontend — Expense Management:**

```gherkin
Feature: User manages expenses via UI

Scenario: Create a new expense entry
  Given alice is registered and logged in
  When alice navigates to the new entry form
  And alice fills in expense details
  And alice submits the entry form
  Then the entry list should contain the new entry
```

### Functional Requirements

1. **API Routes**: All endpoints from the OpenAPI contract implemented as Next.js Route
   Handlers under `app/api/v1/...` — same paths, same request/response shapes
2. **Frontend Routes**: `/` (home/health), `/login`, `/register`, `/expenses`,
   `/expenses/[id]`, `/expenses/summary`, `/profile`, `/tokens`, `/admin`
3. **Database**: PostgreSQL via Drizzle ORM — same schema as other backends (users,
   sessions, expenses, attachments)
4. **Auth**: JWT (HS256) with access + refresh tokens, same token format as other backends
5. **No API Proxy**: Unlike `demo-fe-*` apps, the fullstack app does NOT proxy API
   calls — the Route Handlers serve the API directly on the same origin
6. **Token storage**: localStorage keys `demo_fe_access_token` and
   `demo_fe_refresh_token` — matching existing frontend conventions
7. **Auth events**: `window.dispatchEvent(new CustomEvent("auth:set"))` on login and
   `window.dispatchEvent(new CustomEvent("auth:cleared"))` on logout
8. **Auto token refresh**: Every 4 minutes using the refresh token while authenticated
9. **401/403 handling**: 401 clears tokens and redirects to `/login`; 403 shows error
10. **ARIA attributes**: Same accessibility attributes as `demo-fe-ts-nextjs` (role="alert",
    role="alertdialog", data-testid values, etc.)
11. **Table structure**: Standard `<table>/<tbody>/<tr>` for expense and admin lists
12. **Pagination**: Same aria-labels as frontend apps
13. **File upload**: Accepts `image/*,.pdf,.txt`, max 10MB
14. **Supported currencies**: USD, IDR
15. **Supported types**: INCOME, EXPENSE
16. **Supported units**: kg, g, mg, lb, oz, l, ml, m, cm, km, ft, in, unit, pcs, dozen,
    box, pack

### Non-Functional Requirements

- **Coverage**: >=90% line coverage (Codecov algorithm) on unit tests via Vitest v8 +
  `rhino-cli test-coverage validate`. Note: if the frontend portion (components, pages) drags
  blended coverage below 90%, this may be adjusted to >=80% — evaluate during Phase 9.
- **TypeScript**: Strict mode, no `any` escapes in production code
- **Port**: 3401 (new fullstack range — distinct from BE 8201 and FE 3301)
- **CI**: Same trigger schedule (2x daily cron + manual dispatch) as other demo app workflows
- **Docker**: Multi-stage build, PostgreSQL as companion service
- **Linting**: oxlint (same as demo-fe-ts-nextjs)

### Acceptance Criteria

```gherkin
Scenario: All BE E2E scenarios pass
  Given demo-fs-ts-nextjs is running on port 3401 with real PostgreSQL
  When npx nx run demo-be-e2e:test:e2e is executed with BASE_URL=http://localhost:3401
  Then all shared BE Gherkin scenarios should pass

Scenario: All FE E2E scenarios pass
  Given demo-fs-ts-nextjs is running on port 3401 with real PostgreSQL
  When npx nx run demo-fe-e2e:test:e2e is executed with BASE_URL=http://localhost:3401
  Then all shared FE Gherkin scenarios should pass

Scenario: Unit test coverage meets threshold
  Given demo-fs-ts-nextjs unit tests are run with coverage
  When rhino-cli test-coverage validate coverage/lcov.info 90 is executed
  Then the validation should pass with >=90% line coverage

Scenario: Production build runs correctly in Docker
  Given docker compose up for infra/dev/demo-fs-ts-nextjs/ is run
  When the health check hits http://localhost:3401/health
  Then the response should be 200 OK

Scenario: CI workflow passes end-to-end
  Given the GitHub Actions workflow test-demo-fs-ts-nextjs.yml is triggered
  When the workflow completes
  Then all jobs should report success
```

---

## Technical Documentation

### Architecture

The fullstack app runs as a single Next.js server serving both API routes and UI pages.
No separate backend or API proxy is needed.

```mermaid
flowchart TD
    Browser["Browser\n(React SPA + TanStack Query)"]
    NextJS["Next.js 16\nApp Router + Route Handlers\nport 3401"]
    DB["PostgreSQL\n(Drizzle ORM)"]

    Browser -- "fetch /api/v1/*\n+ page navigation" --> NextJS
    NextJS -- "SQL queries" --> DB

    style Browser fill:#0173B2,color:#ffffff
    style NextJS fill:#029E73,color:#ffffff
    style DB fill:#DE8F05,color:#ffffff
```

### Project Structure

```
apps/demo-fs-ts-nextjs/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # Route Handlers (BE API)
│   │   │   └── v1/
│   │   │       ├── auth/             # /api/v1/auth/*
│   │   │       ├── users/            # /api/v1/users/*
│   │   │       ├── admin/            # /api/v1/admin/*
│   │   │       ├── expenses/         # /api/v1/expenses/*
│   │   │       └── reports/          # /api/v1/reports/*
│   │   ├── (auth)/                   # Auth pages (login, register)
│   │   ├── (dashboard)/              # Protected pages
│   │   │   ├── expenses/             # Expense list + detail + summary
│   │   │   ├── profile/              # User profile + password change
│   │   │   ├── tokens/               # Token inspector
│   │   │   └── admin/                # Admin panel
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Home/health page
│   ├── services/                     # Business logic (pure functions)
│   │   ├── auth-service.ts           # Auth logic
│   │   ├── user-service.ts           # User management
│   │   ├── expense-service.ts        # Expense CRUD
│   │   ├── attachment-service.ts     # File handling
│   │   └── report-service.ts         # P&L reporting
│   ├── repositories/                 # Data access layer (Drizzle)
│   │   ├── user-repository.ts
│   │   ├── session-repository.ts
│   │   ├── expense-repository.ts
│   │   └── attachment-repository.ts
│   ├── db/                           # Database setup
│   │   ├── schema.ts                 # Drizzle schema definitions
│   │   ├── client.ts                 # Drizzle client singleton
│   │   └── migrations/               # SQL migrations
│   ├── components/                   # Reusable React components
│   ├── lib/                          # Utilities, auth, hooks
│   │   ├── auth-provider.tsx         # Client-side auth context
│   │   ├── jwt.ts                    # JWT sign/verify (server-side)
│   │   └── api-client.ts            # Client-side fetch wrapper
│   ├── generated-contracts/          # OpenAPI codegen output
│   └── test/                         # Test utilities
├── test/
│   ├── unit/
│   │   ├── be-steps/                 # BE Gherkin step definitions
│   │   │   ├── health-steps.ts
│   │   │   ├── auth-steps.ts
│   │   │   ├── user-steps.ts
│   │   │   ├── admin-steps.ts
│   │   │   ├── expense-steps.ts
│   │   │   ├── currency-steps.ts
│   │   │   ├── unit-handling-steps.ts
│   │   │   ├── reporting-steps.ts
│   │   │   ├── attachment-steps.ts
│   │   │   ├── security-steps.ts
│   │   │   └── token-steps.ts
│   │   └── fe-steps/                 # FE Gherkin step definitions
│   │       ├── health-steps.ts
│   │       ├── login-steps.ts
│   │       ├── session-steps.ts
│   │       ├── registration-steps.ts
│   │       ├── profile-steps.ts
│   │       ├── security-steps.ts
│   │       ├── tokens-steps.ts
│   │       ├── admin-steps.ts
│   │       ├── expense-steps.ts
│   │       ├── currency-steps.ts
│   │       ├── unit-handling-steps.ts
│   │       ├── reporting-steps.ts
│   │       ├── attachment-steps.ts
│   │       ├── responsive-steps.ts
│   │       └── accessibility-steps.ts
│   └── integration/
│       └── be-steps/                 # BE integration steps (real PostgreSQL)
├── drizzle.config.ts                 # Drizzle Kit config
├── docker-compose.integration.yml    # Integration test: PG + test runner
├── Dockerfile                        # Production container
├── next.config.ts                    # Next.js configuration
├── vitest.config.ts                  # Vitest configuration
├── tsconfig.json                     # TypeScript config
└── project.json                      # Nx targets and tags
```

### Design Decisions

| Decision         | Choice                     | Reason                                             |
| ---------------- | -------------------------- | -------------------------------------------------- |
| App type         | Fullstack (fs)             | First demo combining BE + FE in one app            |
| Framework        | Next.js 16 (App Router)    | Proven fullstack framework; existing FE experience |
| API layer        | Next.js Route Handlers     | Native, zero-config API routes in App Router       |
| ORM              | Drizzle ORM                | Lightweight, SQL-like, type-safe, functional style |
| Database         | PostgreSQL                 | Same as all other demo backends                    |
| Auth             | JWT HS256 (jose library)   | Same token format as other backends                |
| State management | TanStack Query v5          | Same as existing FE apps                           |
| HTTP client      | fetch (native)             | No extra dependency                                |
| Auth storage     | localStorage (client-side) | Must match keys for E2E compatibility              |
| Coverage tool    | Vitest v8 + rhino-cli      | Same as TS projects; >=90% threshold               |
| Linter           | oxlint                     | Same as demo-fe-ts-nextjs                          |
| Port             | 3401                       | New range for fullstack apps                       |
| BDD tool         | @amiceli/vitest-cucumber   | Unified coverage: both BE + FE steps run in Vitest |
| Docker           | Multi-stage + PostgreSQL   | Same pattern as other demo backends                |

### Key Architectural Differences from Existing Apps

**vs `demo-be-*` backends:**

- API routes are Next.js Route Handlers, not standalone HTTP servers
- Same service layer pattern (services/ + repositories/) but in TypeScript
- Same PostgreSQL schema and migrations
- Route Handlers receive `NextRequest` and return `NextResponse`

**vs `demo-fe-*` frontends:**

- No API proxy needed — Route Handlers serve the API on the same origin
- Frontend code can import server-side utilities via server components
- Database connection is in-process, not over HTTP

**Service Layer Architecture:**

```
Route Handler (app/api/v1/...)  ──→  Service (services/)  ──→  Repository (repositories/)
         │                                                              │
         ↓                                                              ↓
    NextRequest/NextResponse                                      Drizzle ORM → PostgreSQL
         │
Page Component (app/(dashboard)/...)  ──→  API Client (lib/api-client.ts)  ──→  fetch("/api/v1/...")
```

Unit tests call service functions directly with mocked repositories (same pattern as all
demo backends). Frontend unit tests mock the API client layer (same pattern as demo-fe apps).

### Spec Consumption

The fullstack app is unique in consuming **both** spec sets:

| Spec Source                   | Consumed By                  | Test Level            | Step Style             |
| ----------------------------- | ---------------------------- | --------------------- | ---------------------- |
| `specs/apps/demo/be/gherkin/` | `test/unit/be-steps/`        | Unit (mocked repos)   | Service function calls |
| `specs/apps/demo/be/gherkin/` | `test/integration/be-steps/` | Integration (real PG) | Service function calls |
| `specs/apps/demo/be/gherkin/` | `demo-be-e2e`                | E2E                   | HTTP requests          |
| `specs/apps/demo/fe/gherkin/` | `test/unit/fe-steps/`        | Unit (mocked API)     | Component logic        |
| `specs/apps/demo/fe/gherkin/` | `demo-fe-e2e`                | E2E                   | Playwright browser     |

### Database Schema

Same schema as other backends (users, sessions, expenses, attachments). Defined in
Drizzle schema format (`src/db/schema.ts`), with SQL migrations generated by Drizzle Kit.

### Nx Configuration

**Tags:**

```json
"tags": ["type:app", "platform:nextjs", "lang:ts", "domain:demo-fs"]
```

**Implicit dependencies:**

```json
"implicitDependencies": ["demo-contracts", "rhino-cli"]
```

**7 mandatory targets** + optional `dev`:

| Target             | Purpose                                          | Cacheable |
| ------------------ | ------------------------------------------------ | --------- |
| `codegen`          | Generate types from OpenAPI spec                 | Yes       |
| `dev`              | Start dev server (port 3401)                     | No        |
| `typecheck`        | `tsc --noEmit` (depends on `codegen`)            | Yes       |
| `lint`             | oxlint                                           | Yes       |
| `build`            | `next build`                                     | Yes       |
| `test:unit`        | Unit tests — BE (mocked repos) + FE (mocked API) | Yes       |
| `test:quick`       | Unit tests + coverage validation (>=90%)         | Yes       |
| `test:integration` | Docker + real PostgreSQL                         | No        |

**Cache inputs for `test:unit` and `test:quick`:**

```json
"inputs": [
  "default",
  "{projectRoot}/src/generated-contracts/**/*",
  "{workspaceRoot}/specs/apps/demo/be/gherkin/**/*.feature",
  "{workspaceRoot}/specs/apps/demo/fe/gherkin/**/*.feature"
]
```

Note: Both BE and FE Gherkin specs are included as cache inputs since this app consumes both.

### Docker Compose

**Local development** (`infra/dev/demo-fs-ts-nextjs/docker-compose.yml`):

```yaml
services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: demo_fs_nextjs
      POSTGRES_PASSWORD: demo_fs_nextjs
      POSTGRES_DB: demo_fs_nextjs
    ports:
      - "5432:5432"
  app:
    build: ../../../apps/demo-fs-ts-nextjs
    ports:
      - "3401:3401"
    environment:
      DATABASE_URL: postgresql://demo_fs_nextjs:demo_fs_nextjs@postgres:5432/demo_fs_nextjs
      APP_JWT_SECRET: dev-secret-key-do-not-use-in-production
      ENABLE_TEST_API: "true"
      PORT: 3401
    depends_on:
      - postgres
```

**Integration tests** (`apps/demo-fs-ts-nextjs/docker-compose.integration.yml`):

Same pattern as other backends — PostgreSQL + test runner container.

### CI Workflow

`.github/workflows/test-demo-fs-ts-nextjs.yml` following the pattern of other demo app
workflows:

- **Triggers**: 2x daily cron (WIB 06, 18) + manual dispatch
- **Jobs**:
  - `unit`: `nx run demo-fs-ts-nextjs:test:quick`
  - `integration`: `nx run demo-fs-ts-nextjs:test:integration`
  - `e2e-be`: Start app + PG, run `demo-be-e2e` with `BASE_URL=http://localhost:3401`
  - `e2e-fe`: Start app + PG, run `demo-fe-e2e` with `BASE_URL=http://localhost:3401`
    and `BACKEND_URL=http://localhost:3401`
- **Codecov**: Upload coverage from unit tests

---

## Delivery

### Phase 1: Project Scaffolding

- [ ] Create `apps/demo-fs-ts-nextjs/` directory
- [ ] Initialize Next.js 16 project with App Router
- [ ] Create `project.json` with 7 mandatory Nx targets (codegen, typecheck, lint, build,
      test:unit, test:quick, test:integration) + `dev`
- [ ] Set up `tsconfig.json` with strict mode
- [ ] Set up `vitest.config.ts` with v8 coverage
- [ ] Add `codegen` target (same openapi-ts config as demo-fe-ts-nextjs)
- [ ] Run `nx run demo-fs-ts-nextjs:codegen` to verify types generate
- [ ] Add oxlint config (same as demo-fe-ts-nextjs)

### Phase 2: Database Layer

- [ ] Install Drizzle ORM + drizzle-kit + pg driver
- [ ] Create `src/db/schema.ts` with users, sessions, expenses, attachments tables
- [ ] Create `drizzle.config.ts` for migration generation
- [ ] Generate initial SQL migration
- [ ] Create `src/db/client.ts` — Drizzle client singleton
- [ ] Verify migration runs against local PostgreSQL

### Phase 3: Repository Layer

- [ ] Create `src/repositories/user-repository.ts` — CRUD for users
- [ ] Create `src/repositories/session-repository.ts` — token session management
- [ ] Create `src/repositories/expense-repository.ts` — expense CRUD + pagination
- [ ] Create `src/repositories/attachment-repository.ts` — file metadata + binary storage
- [ ] Define repository interfaces for mock injection in tests

### Phase 4: Service Layer

- [ ] Create `src/services/auth-service.ts` — register, login, logout, refresh, JWT
      signing/verification
- [ ] Create `src/services/user-service.ts` — profile update, password change,
      deactivation, admin operations
- [ ] Create `src/services/expense-service.ts` — expense CRUD, pagination, summary
- [ ] Create `src/services/attachment-service.ts` — upload, download metadata, delete
- [ ] Create `src/services/report-service.ts` — P&L report generation
- [ ] Create `src/lib/jwt.ts` — JWT utilities (sign, verify, decode) using jose library

### Phase 5: API Route Handlers

- [ ] Create `src/app/api/v1/auth/register/route.ts` — POST register
- [ ] Create `src/app/api/v1/auth/login/route.ts` — POST login
- [ ] Create `src/app/api/v1/auth/logout/route.ts` — POST logout
- [ ] Create `src/app/api/v1/auth/logout-all/route.ts` — POST logout all sessions
- [ ] Create `src/app/api/v1/auth/refresh/route.ts` — POST refresh token
- [ ] Create `src/app/api/v1/users/me/route.ts` — GET profile, PATCH display name
- [ ] Create `src/app/api/v1/users/me/password/route.ts` — POST change password
- [ ] Create `src/app/api/v1/users/me/deactivate/route.ts` — POST self-deactivate
- [ ] Create `src/app/api/v1/admin/users/route.ts` — GET user list (admin)
- [ ] Create `src/app/api/v1/admin/users/[id]/disable/route.ts` — POST disable user
- [ ] Create `src/app/api/v1/admin/users/[id]/enable/route.ts` — POST enable user
- [ ] Create `src/app/api/v1/admin/users/[id]/unlock/route.ts` — POST unlock user
- [ ] Create `src/app/api/v1/admin/users/[id]/force-password-reset/route.ts` — POST force reset
- [ ] Create `src/app/api/v1/expenses/route.ts` — GET list, POST create
- [ ] Create `src/app/api/v1/expenses/summary/route.ts` — GET summary
- [ ] Create `src/app/api/v1/expenses/[id]/route.ts` — GET, PUT, DELETE
- [ ] Create `src/app/api/v1/expenses/[id]/attachments/route.ts` — GET list, POST upload
- [ ] Create `src/app/api/v1/expenses/[id]/attachments/[attId]/route.ts` — GET, DELETE
- [ ] Create `src/app/api/v1/reports/pl/route.ts` — GET P&L report
- [ ] Create `src/app/health/route.ts` — GET health check
- [ ] Create `src/app/.well-known/jwks.json/route.ts` — GET JWKS public key
- [ ] Create `src/app/api/v1/test/reset-db/route.ts` — POST reset database (test-only,
      guarded by `ENABLE_TEST_API` env var)
- [ ] Create `src/app/api/v1/test/promote-admin/route.ts` — POST promote user to admin
      (test-only, guarded by `ENABLE_TEST_API` env var)

### Phase 6: Backend Unit Tests (BE Gherkin)

- [ ] Create `test/unit/be-steps/` directory
- [ ] Create in-memory repository implementations for unit testing
- [ ] Implement step definitions for all BE Gherkin domains:
  - [ ] health-steps.ts (health-check.feature)
  - [ ] auth-steps.ts (password-login.feature)
  - [ ] token-lifecycle-steps.ts (token-lifecycle.feature)
  - [ ] registration-steps.ts (registration.feature)
  - [ ] user-account-steps.ts (user-account.feature)
  - [ ] security-steps.ts (security.feature)
  - [ ] token-management-steps.ts (tokens.feature)
  - [ ] admin-steps.ts (admin.feature)
  - [ ] expense-steps.ts (expense-management.feature)
  - [ ] currency-steps.ts (currency-handling.feature)
  - [ ] unit-handling-steps.ts (unit-handling.feature)
  - [ ] reporting-steps.ts (reporting.feature)
  - [ ] attachment-steps.ts (attachments.feature)
  - [ ] test-api-steps.ts (test-api.feature)
- [ ] Verify all BE unit tests pass: `nx run demo-fs-ts-nextjs:test:unit`

### Phase 7: Frontend Components and Pages

- [ ] Create `src/lib/auth-provider.tsx` — client-side auth context with token refresh
- [ ] Create `src/lib/api-client.ts` — fetch wrapper for `/api/v1/*` (no proxy needed)
- [ ] Create `src/components/` — reusable UI components (forms, tables, modals, sidebar)
- [ ] Create `src/app/(auth)/login/page.tsx` — login form
- [ ] Create `src/app/(auth)/register/page.tsx` — registration form
- [ ] Create `src/app/(dashboard)/layout.tsx` — authenticated layout with sidebar
- [ ] Create `src/app/(dashboard)/expenses/page.tsx` — expense list with pagination
- [ ] Create `src/app/(dashboard)/expenses/[id]/page.tsx` — expense detail + edit
- [ ] Create `src/app/(dashboard)/expenses/new/page.tsx` — create expense
- [ ] Create `src/app/(dashboard)/expenses/summary/page.tsx` — expense summary
- [ ] Create `src/app/(dashboard)/profile/page.tsx` — user profile + password change
- [ ] Create `src/app/(dashboard)/tokens/page.tsx` — token inspector
- [ ] Create `src/app/(dashboard)/admin/page.tsx` — admin user management panel
- [ ] Create `src/app/page.tsx` — home page with health indicator
- [ ] Implement responsive layout (desktop/tablet/mobile) with sidebar navigation
- [ ] Add all required ARIA attributes and data-testid values

### Phase 8: Frontend Unit Tests (FE Gherkin)

- [ ] Create `test/unit/fe-steps/` directory
- [ ] Create mock API client for frontend unit tests
- [ ] Implement step definitions for all FE Gherkin domains:
  - [ ] health-steps.ts (health-status.feature)
  - [ ] login-steps.ts (login.feature)
  - [ ] session-steps.ts (session.feature)
  - [ ] registration-steps.ts (registration.feature)
  - [ ] profile-steps.ts (user-profile.feature)
  - [ ] security-steps.ts (security.feature)
  - [ ] tokens-steps.ts (tokens.feature)
  - [ ] admin-steps.ts (admin-panel.feature)
  - [ ] expense-steps.ts (expense-management.feature)
  - [ ] currency-steps.ts (currency-handling.feature)
  - [ ] unit-handling-steps.ts (unit-handling.feature)
  - [ ] reporting-steps.ts (reporting.feature)
  - [ ] attachment-steps.ts (attachments.feature)
  - [ ] responsive-steps.ts (responsive.feature)
  - [ ] accessibility-steps.ts (accessibility.feature)
- [ ] Verify all FE unit tests pass: `nx run demo-fs-ts-nextjs:test:unit`

### Phase 9: Coverage Gate

- [ ] Run `nx run demo-fs-ts-nextjs:test:quick` (unit tests + rhino-cli >=90%)
- [ ] Add coverage exclusions if needed (e.g., generated-contracts, migration files)
- [ ] Ensure `typecheck` and `lint` pass cleanly

### Phase 10: Integration Tests

- [ ] Create `docker-compose.integration.yml` with PostgreSQL 17
- [ ] Create `test/integration/be-steps/` — same BE Gherkin steps but with real DB
- [ ] Implement Drizzle-based test setup/teardown (transaction rollback or truncation)
- [ ] Verify all BE integration tests pass:
      `nx run demo-fs-ts-nextjs:test:integration`

### Phase 11: Docker and Local Development

- [ ] Create `Dockerfile` (multi-stage: deps → build → runtime)
- [ ] Create `infra/dev/demo-fs-ts-nextjs/docker-compose.yml`
- [ ] Verify app starts correctly via Docker Compose
- [ ] Verify health check at `http://localhost:3401/health`

### Phase 12: E2E Verification

- [ ] Start app + PostgreSQL locally with `ENABLE_TEST_API=true`
- [ ] Run `demo-be-e2e` with `BASE_URL=http://localhost:3401` — all BE scenarios pass
- [ ] Run `demo-fe-e2e` with `BASE_URL=http://localhost:3401` and
      `BACKEND_URL=http://localhost:3401` — all FE scenarios pass
      (Note: `demo-fe-e2e` uses `BACKEND_URL` separately for direct API calls like
      reset-db and promote-admin; for the fullstack app both point to the same origin)
- [ ] Fix any E2E compatibility issues (ARIA attributes, response shapes, etc.)

### Phase 13: CI and Documentation

- [ ] Create `.github/workflows/test-demo-fs-ts-nextjs.yml`
- [ ] Create `apps/demo-fs-ts-nextjs/README.md` with project overview, commands, testing
      docs, and related documentation links
- [ ] Add Codecov upload for unit test coverage
- [ ] Update `specs/apps/demo/README.md` to mention fullstack category
- [ ] Update Nx dependency graph documentation if needed
- [ ] Verify CI workflow passes on push

### Validation Checklist

- [ ] `nx run demo-fs-ts-nextjs:codegen` succeeds
- [ ] `nx run demo-fs-ts-nextjs:typecheck` succeeds
- [ ] `nx run demo-fs-ts-nextjs:lint` succeeds
- [ ] `nx run demo-fs-ts-nextjs:build` succeeds
- [ ] `nx run demo-fs-ts-nextjs:test:unit` — all BE + FE Gherkin scenarios pass
- [ ] `nx run demo-fs-ts-nextjs:test:quick` — >=90% line coverage
- [ ] `nx run demo-fs-ts-nextjs:test:integration` — all BE scenarios pass with real PG
- [ ] `demo-be-e2e` passes with `BASE_URL=http://localhost:3401`
- [ ] `demo-fe-e2e` passes with `BASE_URL=http://localhost:3401` and
      `BACKEND_URL=http://localhost:3401`
- [ ] Docker Compose local dev setup works
- [ ] CI workflow passes
- [ ] README.md is complete with related documentation links
