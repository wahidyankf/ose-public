# Requirements

## Objectives

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
- Enforce 80%+ line coverage via `rhino-cli test-coverage validate` on unit tests
- Generate types from the OpenAPI contract via `codegen` Nx target
- Serve on port **3401** (new port range for fullstack apps)
- Add Docker Compose for local development and integration testing
- Add CI workflow `.github/workflows/test-demo-fs-ts-nextjs.yml`

## User Stories

**API — Authentication:**

```gherkin
Feature: Fullstack app serves authentication API

Scenario: Register via Route Handler
  Given the fullstack app is running on port 3401
  When a user sends POST /api/v1/auth/register with valid credentials
  Then the response status should be 201
  And the user account should be created

Scenario: Login via Route Handler
  Given a registered user exists
  When the user sends POST /api/v1/auth/login with valid credentials
  Then the response should contain accessToken and refreshToken

Scenario: Token refresh via Route Handler
  Given a user is authenticated
  When the user sends POST /api/v1/auth/refresh with a valid refresh token
  Then a new access token should be returned
```

**API — Expenses:**

```gherkin
Feature: Fullstack app serves expense API

Scenario: Create expense via Route Handler
  Given an authenticated user
  When the user sends POST /api/v1/expenses with valid expense data
  Then the response status should be 201

Scenario: List expenses via Route Handler
  Given an authenticated user with existing expenses
  When the user sends GET /api/v1/expenses
  Then the expense list should be returned
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

## Functional Requirements

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

## Non-Functional Requirements

- **Coverage**: 80% or higher line coverage (Codecov algorithm) on unit tests via Vitest
  v8 + `rhino-cli test-coverage validate`. Rationale: backends enforce 90%+, frontends
  enforce 70%+. This fullstack app blends both — 80% is the midpoint that accounts for
  harder-to-test frontend rendering code while keeping the backend service layer well-covered.
- **TypeScript**: Strict mode, no `any` escapes in production code
- **Port**: 3401 (new fullstack range — distinct from BE 8201 and FE 3301)
- **CI**: Same trigger schedule (2x daily cron + manual dispatch) as other demo app workflows
- **Docker**: Multi-stage build, PostgreSQL as companion service
- **Linting**: oxlint (same as demo-fe-ts-nextjs)

## Acceptance Criteria

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
  When rhino-cli test-coverage validate coverage/lcov.info 80 is executed
  Then the validation should pass with 80%+ line coverage

Scenario: Production build runs correctly in Docker
  Given docker compose up for infra/dev/demo-fs-ts-nextjs/ is run
  When the health check hits http://localhost:3401/health
  Then the response should be 200 OK

Scenario: CI workflow passes end-to-end
  Given the GitHub Actions workflow test-demo-fs-ts-nextjs.yml is triggered
  When the workflow completes
  Then all jobs should report success
```
