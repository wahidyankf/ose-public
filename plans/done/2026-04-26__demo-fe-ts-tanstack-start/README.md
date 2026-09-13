# Plan: Create `a-demo-fe-ts-tanstack-start` — TanStack Start Frontend

## Overview

- **Status**: Done
- **Goal**: Build a new TypeScript frontend app (`apps/a-demo-fe-ts-tanstack-start`) using
  TanStack Start that mirrors `apps/a-demo-fe-ts-nextjs` with full feature parity, passing
  all 92 Gherkin E2E scenarios from `a-demo-fe-e2e`, and following the same CI and Docker
  Compose patterns.
- **Git Workflow**: Work on `main` (Trunk Based Development)

---

## Requirements

### Objectives

- Build `apps/a-demo-fe-ts-tanstack-start` as a production-quality alternative frontend
  implementation using TanStack Start (TanStack Router + Vinxi/Nitro)
- Achieve feature parity with `apps/a-demo-fe-ts-nextjs` across all pages and interactions
- Pass all 92 E2E Gherkin scenarios in `a-demo-fe-e2e` without modifying any E2E test code
- Maintain the same localStorage token keys (`demo_fe_access_token`,
  `demo_fe_refresh_token`) so existing E2E auth helpers work without changes
- Provide an identical API proxy setup (`/api/*`, `/health`, `/.well-known/*` → backend)
  that the E2E tests rely on for seamless backend communication
- Add a CI workflow `.github/workflows/test-a-demo-fe-ts-tanstack-start.yml` following
  the same pattern as `test-a-demo-fe-ts-nextjs.yml`
- Serve the production build on port 3301 (matching the Playwright `BASE_URL` default)
- Enforce ≥70% line coverage via `rhino-cli test-coverage validate` on unit tests

### User Stories

**Authentication:**

```gherkin
Feature: User can authenticate

Scenario: Successful login stores tokens in localStorage
  Given a registered user "alice" with password "Str0ng#Pass1"
  When alice submits the login form with username "alice" and password "Str0ng#Pass1"
  Then an authentication session should be active
  And a refresh token should be stored
  And localStorage["demo_fe_access_token"] should contain a JWT
  And localStorage["demo_fe_refresh_token"] should contain a JWT

Scenario: Login redirects to expenses page after success
  Given a registered user "alice" with password "Str0ng#Pass1"
  When alice submits the login form with username "alice" and password "Str0ng#Pass1"
  Then alice should be on the dashboard page

Scenario: Invalid credentials show error
  Given a registered user "alice" with password "Str0ng#Pass1"
  When alice submits the login form with username "alice" and password "WrongPass1!"
  Then alice should remain on the login page
  And an error message about invalid credentials should be displayed

Scenario: Unauthenticated access redirects to login
  Given alice has logged out
  When alice navigates to a protected page
  Then alice should be redirected to the login page
```

**Expense Management:**

```gherkin
Feature: User manages expenses

Scenario: Create a new expense entry
  Given alice is registered and logged in
  When alice navigates to the new entry form
  And alice fills in amount "25.00", currency "USD", category "food",
      description "Lunch", date "2025-06-01", type "EXPENSE"
  And alice submits the entry form
  Then the entry list should contain an entry with description "Lunch"

Scenario: Edit an existing expense
  Given alice has created an entry with description "Old Desc"
  When alice opens the entry detail for "Old Desc"
  And alice edits the description to "New Desc"
  And alice submits the entry form
  Then the entry detail should display "New Desc"

Scenario: Delete an expense with confirmation
  Given alice has created an entry with description "To Delete"
  When alice opens the entry detail for "To Delete"
  And alice clicks the "Delete" button
  And alice confirms the deletion
  Then the entry list should not contain an entry with description "To Delete"
```

**Reporting:**

```gherkin
Feature: User views expense summary

Scenario: P&L report generates for date range
  Given alice has created an income entry and an expense entry
  When alice navigates to the reporting page
  Then the report should display Total Income, Total Expense, and Net values
  And the income and expense breakdowns should be separated by category
```

**Admin:**

```gherkin
Feature: Admin manages users

Scenario: Admin disables a user account
  Given an admin user "admin1" is logged in
  And a user "bob" is registered
  When the admin navigates to bob's user detail page
  And the admin disables bob's account with reason "Test"
  Then bob's status should display as "DISABLED"

Scenario: Admin search filters user list
  Given an admin user "admin1" is logged in
  And users "alice" and "bob" are registered
  When the admin navigates to the user management page
  And the admin searches for "alice"
  Then only rows containing "alice" should be visible in the table
```

**Token Inspector:**

```gherkin
Feature: User inspects session tokens

Scenario: Token page shows JWT claims
  Given alice is logged in
  When alice opens the session info panel
  Then the token claims panel should display Subject, Issuer, Issued At, Expires At, and Roles
  And the JWKS section should display the key count
```

**Profile:**

```gherkin
Feature: User manages profile

Scenario: Update display name
  Given alice is logged in
  When alice navigates to the profile page
  And alice changes the display name to "Alice Wonderland"
  And alice saves the changes
  Then the profile page should display the new display name "Alice Wonderland"

Scenario: Change password with correct old password succeeds
  Given alice is logged in
  When alice navigates to the change password form
  And alice fills in the old password "Str0ng#Pass1" and new password "NewP@ssw0rd1"
  And alice submits the change password form
  Then a success message should be displayed

Scenario: Deactivate account logs the user out
  Given alice is logged in
  When alice navigates to the profile page
  And alice clicks "Deactivate Account" and confirms
  Then alice should be redirected to the login page
```

**Responsive Layout:**

```gherkin
Feature: Layout adapts to screen size

Scenario: Hamburger menu visible on mobile
  Given a user is logged in on a mobile viewport (width 375px)
  When the page loads
  Then the sidebar should be hidden
  And the hamburger menu button should be visible

Scenario: Sidebar collapses to icons on tablet
  Given a user is logged in on a tablet viewport (width 768px)
  When the page loads
  Then the sidebar should show icons only without text labels

Scenario: Mobile drawer closes on nav item selection
  Given a user is logged in on a mobile viewport
  When the user opens the hamburger menu
  And clicks a navigation link
  Then the drawer should close
```

### Functional Requirements

1. **Routes**: `/` (home/health), `/login`, `/register`, `/expenses`, `/expenses/$id`,
   `/expenses/summary`, `/profile`, `/tokens`, `/admin`
2. **API proxy**: All `/api/*`, `/health`, `/.well-known/*` requests forwarded to
   `BACKEND_URL` (default `http://localhost:8201`)
3. **Token storage**: localStorage keys `demo_fe_access_token` and
   `demo_fe_refresh_token` — identical to Next.js implementation
4. **Auth events**: `window.dispatchEvent(new CustomEvent("auth:set"))` on login and
   `window.dispatchEvent(new CustomEvent("auth:cleared"))` on logout — required for
   auth state synchronization
5. **Auto token refresh**: Every 4 minutes using the refresh token while authenticated
6. **401 handling**: Clear tokens and redirect to `/login` on 401 API responses
7. **403 handling**: Show error message — do NOT clear tokens (only `401` triggers logout)
8. **ARIA attributes**: `role="alert"` for errors, `role="alertdialog"` for confirmation
   modals, `role="menu"` / `role="menuitem"` for user dropdown, `aria-label` on icon
   buttons, `data-testid="entry-card"` on expense table rows,
   `data-testid="health-status"` on health indicator, `data-testid="pl-chart"` on
   report output, `data-testid="reset-token"` on generated password reset tokens,
   `data-testid="token-subject"` on token claims
9. **Table structure**: Standard `<table>/<tbody>/<tr>` elements for expense list and
   admin user list (E2E tests use `document.querySelectorAll("tbody tr")`)
10. **Pagination**: `aria-label="Previous page"` and `aria-label="Next page"` on buttons,
    with a `role="navigation"` or `data-testid="pagination"` wrapper
11. **Sidebar navigation**: `aria-label="Main navigation"` on `<nav>`, `data-testid="nav-drawer"`
    on mobile drawer, `aria-label="Toggle navigation menu"` on hamburger button
12. **User menu**: `aria-label="User menu"` on trigger button, menu items with
    `role="menuitem"` for "Log out" and "Log out all devices"
13. **File upload**: Accepts `image/*,.pdf,.txt`, max 10MB; client-side validation
    matching Next.js behavior
14. **Supported currencies**: USD, IDR
15. **Supported types**: INCOME, EXPENSE
16. **Supported units**: kg, g, mg, lb, oz, l, ml, m, cm, km, ft, in, unit, pcs, dozen,
    box, pack

### Non-Functional Requirements

- **Coverage**: ≥70% line coverage (Codecov algorithm) on unit tests via Vitest v8 +
  `rhino-cli test-coverage validate`
- **TypeScript**: Strict mode, no `any` escapes in production code
- **Build output**: Static-compatible SSR build served by Node.js on port 3301
- **Docker**: Multi-stage build producing a minimal Node.js image, same pattern as
  Next.js Dockerfile
- **Port**: 3301 (E2E `BASE_URL` default)
- **CI**: Same trigger schedule (2x daily cron + manual dispatch) as
  `test-a-demo-fe-ts-nextjs.yml`

### Acceptance Criteria

```gherkin
Scenario: All E2E scenarios pass
  Given a-demo-fe-ts-tanstack-start is running on port 3301
  And a-demo-be-golang-gin is running on port 8201
  When npx nx run a-demo-fe-e2e:test:e2e is executed with BASE_URL=http://localhost:3301
  Then all 92 Gherkin scenarios should pass
  And 0 scenarios should be skipped or pending

Scenario: Unit test coverage meets threshold
  Given a-demo-fe-ts-tanstack-start unit tests are run with coverage
  When rhino-cli test-coverage validate coverage/lcov.info 70 is executed
  Then the validation should pass with ≥70% line coverage

Scenario: Production build runs correctly in Docker
  Given docker compose up for infra/dev/a-demo-fe-ts-tanstack-start/ is run
  # Note: infra/dev/a-demo-fe-ts-tanstack-start/ is created in Phase 8
  When the frontend health check hits http://localhost:3301
  Then the response should be 200 OK
  And API proxying should forward /api/* to the backend correctly

Scenario: CI workflow passes end-to-end
  Given the GitHub Actions workflow test-a-demo-fe-ts-tanstack-start.yml is triggered
  When the workflow completes
  Then all jobs should report success
  And the Playwright report artifact should be uploaded
```

---

## Technical Documentation

### Architecture

TanStack Start uses **TanStack Router** for file-based routing with SSR support via
**Vinxi** (a Nitro-based dev/build server). The app runs as a Node.js server in
production — like Next.js `output: "standalone"` — which makes the proxy setup
straightforward via Vinxi's server middleware or a custom Nitro plugin.

```mermaid
flowchart TD
    Browser["Browser\n(React SPA + TanStack Query)"]
    Server["TanStack Start\nNode.js server\n(Vinxi/Nitro)\n/api/* → proxy"]
    Backend["a-demo-be-golang-gin\nport 8201"]

    Browser -- "fetch /api/*" --> Server
    Server -- "HTTP" --> Backend

    style Browser fill:#4D9FD6,color:#ffffff
    style Server fill:#5A9E5E,color:#ffffff
    style Backend fill:#E07B39,color:#ffffff
```

### Design Decisions

| Decision         | Choice                                  | Reason                                                           |
| ---------------- | --------------------------------------- | ---------------------------------------------------------------- |
| Framework        | TanStack Start (beta/rc)                | Requirement; file-based routing, SSR, Vinxi                      |
| State management | TanStack Query v5                       | Same as Next.js app; familiar API, no new dep                    |
| HTTP client      | `fetch` (native)                        | No extra dependency; same pattern as Next.js                     |
| Auth storage     | localStorage (client-side only)         | Must match keys `demo_fe_access_token` + `demo_fe_refresh_token` |
| Token refresh    | `setInterval` 4 minutes in AuthProvider | Mirrors Next.js auth-provider.tsx exactly                        |
| API proxy        | Vinxi server middleware (`app.use`)     | TanStack Start's built-in mechanism; replaces Next.js rewrites   |
| Routing          | TanStack Router file-based (`routes/`)  | Framework-native; `$id` param for expense detail                 |
| Coverage         | Vitest v8 → LCOV → rhino-cli ≥70%       | Same as Next.js app                                              |
| Docker serving   | Node.js server (same as Next.js)        | TanStack Start produces a Node.js server output                  |
| Port             | 3301                                    | Must match E2E `BASE_URL` default                                |

### API Proxy Implementation

TanStack Start / Vinxi exposes a server middleware API via `app.use()` in
`app.config.ts`. This is the equivalent of Next.js `rewrites()`.

```typescript
// app.config.ts
import { defineConfig } from "@tanstack/react-start/config";
import { createRouter } from "@tanstack/react-router";

export default defineConfig({
  server: {
    middleware: [
      // Proxy /api/*, /health, /.well-known/* to BACKEND_URL
    ],
  },
});
```

The proxy is implemented using `h3` (Vinxi's underlying HTTP framework) event handlers
that pipe requests to `BACKEND_URL`. This exactly mirrors Next.js rewrites behavior.

**Exact proxy paths** (from `next.config.ts`):

- `/api/:path*` → `${BACKEND_URL}/api/:path*`
- `/health` → `${BACKEND_URL}/health`
- `/.well-known/:path*` → `${BACKEND_URL}/.well-known/:path*`

### File-Based Routing Structure

TanStack Start uses a `routes/` directory with a specific file naming convention:

```
routes/
├── __root.tsx              # Root layout (QueryClientProvider + AuthProvider)
├── index.tsx               # / → Home (health check)
├── login.tsx               # /login
├── register.tsx            # /register
├── expenses/
│   ├── index.tsx           # /expenses (list + create form)
│   ├── $id.tsx             # /expenses/$id (detail + edit + attachments)
│   └── summary.tsx         # /expenses/summary (P&L report)
├── profile.tsx             # /profile
├── tokens.tsx              # /tokens
└── admin.tsx               # /admin
```

### Token Storage (Critical — must match exactly)

The E2E tests check for `demo_fe_access_token` and `demo_fe_refresh_token` in
`localStorage` directly:

```typescript
// src/lib/api/client.ts — identical to Next.js
const TOKEN_KEY = "demo_fe_access_token";
const REFRESH_KEY = "demo_fe_refresh_token";

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  window.dispatchEvent(new CustomEvent("auth:set"));
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  window.dispatchEvent(new CustomEvent("auth:cleared"));
}
```

The `auth:set` and `auth:cleared` custom events are required for `AuthProvider` state
synchronization across the same tab (e.g., when a 401 response clears tokens).

### SSR vs CSR Considerations

TanStack Start supports SSR by default. Since auth state lives in `localStorage` (client-only),
all authenticated routes must render client-side only. Approaches:

1. Use `createFileRoute` with a `beforeLoad` that checks a cookie or skips on server
2. Use `useEffect`-based hydration guard — TanStack Start has no `"use client"` directive
   or `createClientComponent` primitive equivalent to Next.js; client-only rendering is
   achieved via `useEffect` guards or the `AuthGuard` component described below

The recommended approach is to use a client-side `AuthGuard` component (identical
pattern to Next.js `auth-guard.tsx`) that checks `getAccessToken()` — this returns
`null` on the server and redirects to `/login` on the client if no token exists.

### Critical E2E Selectors

The following selectors from `a-demo-fe-e2e` must be present in the DOM:

| Selector                                                            | Required DOM element                           | Location                               |
| ------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------- |
| `getByRole("textbox", { name: /username/i })`                       | `<input>` with label "Username"                | Login, Register forms                  |
| `getByRole("textbox", { name: /password/i })`                       | `<input>` with label "Password"                | Login, Register, Change Password forms |
| `getByRole("button", { name: /log in\|sign in\|login/i })`          | `<button>`                                     | Login form                             |
| `getByRole("button", { name: /new expense/i })`                     | `<button>`                                     | Expenses list page                     |
| `getByRole("button", { name: /submit\|save\|create\|add entry/i })` | `<button>`                                     | Expense create/edit form               |
| `getByRole("alertdialog").filter({ hasText: /delete\|remove/i })`   | `role="alertdialog"`                           | Delete confirmation modal              |
| `getByRole("button", { name: /confirm\|yes\|delete/i })`            | `<button>`                                     | Inside alertdialog                     |
| `getByRole("button", { name: /log.*out\|sign.*out/i })`             | `role="menuitem"` inside `role="menu"`         | Header user dropdown                   |
| `getByRole("button", { name: /user menu/i })`                       | `<button aria-label="User menu">`              | Header                                 |
| `getByRole("button", { name: /toggle navigation menu/i })`          | `<button aria-label="Toggle navigation menu">` | Header                                 |
| `getByRole("alert")`                                                | `role="alert"`                                 | Error messages throughout              |
| `getByTestId("health-status")`                                      | `data-testid="health-status"`                  | Home page                              |
| `getByTestId("entry-card")`                                         | `data-testid="entry-card"`                     | Each `<tr>` in expenses table          |
| `getByTestId("pl-chart")`                                           | `data-testid="pl-chart"`                       | P&L report output container            |
| `getByTestId("reset-token")`                                        | `data-testid="reset-token"`                    | Admin password reset token display     |
| `getByTestId("token-subject")`                                      | `data-testid="token-subject"`                  | Token claims `<dd>`                    |
| `getByTestId("pagination")`                                         | `data-testid="pagination"`                     | Pagination wrapper                     |
| `getByTestId("nav-drawer")`                                         | `data-testid="nav-drawer"`                     | Mobile sidebar `<nav>`                 |
| `document.querySelectorAll("tbody tr")`                             | `<table><tbody><tr>`                           | Admin user list, expense list          |
| `page.getByRole("navigation", { name: /pagination/i })`             | `<nav aria-label="Pagination">`                | Pagination                             |
| `page.getByRole("textbox", { name: /search/i })`                    | `<input>` with label "Search"                  | Admin search                           |
| `page.getByRole("textbox", { name: /start.?date\|from/i })`         | `<input>` with label "Start Date"              | Summary/report form                    |
| `page.getByRole("textbox", { name: /end.?date/i })`                 | `<input>` with label "End Date"                | Summary/report form                    |
| `page.getByRole("button", { name: /generate report/i })`            | `<button>`                                     | Summary form                           |
| `page.getByRole("link", { name: /^tokens$/i })`                     | `<a>` with text "Tokens"                       | Sidebar nav                            |
| `localStorage.removeItem("demo_fe_access_token")`                   | localStorage key                               | Auth token                             |
| `localStorage.removeItem("demo_fe_refresh_token")`                  | localStorage key                               | Refresh token                          |

**Note on `#__next-route-announcer__`**: This selector is Next.js-specific. TanStack
Start uses a different route announcer ID or none. The E2E steps use `.filter()` with
`hasNot`, meaning they exclude elements that match — which tolerates TanStack Start's
different announcer selector. Before completing Phase 10, verify by running:

```bash
grep -r "next-route-announcer" apps/a-demo-fe-e2e/
```

Confirm every usage employs `.filter({ hasNot: ... })` semantics (not positive assertion)
so that the absence of `#__next-route-announcer__` in TanStack Start's DOM does not cause
false failures. If any step uses it as a positive selector, a DOM adapter will be needed.

### Project Structure

```
apps/a-demo-fe-ts-tanstack-start/
├── app.config.ts                  # Vinxi/TanStack Start config (proxy middleware)
├── routes/
│   ├── __root.tsx                 # Root layout: QueryClient + AuthProvider
│   ├── index.tsx                  # / → Home (health check)
│   ├── login.tsx                  # /login
│   ├── register.tsx               # /register
│   ├── expenses/
│   │   ├── index.tsx              # /expenses (list + new expense form)
│   │   ├── $id.tsx                # /expenses/$id (detail + edit + attachments)
│   │   └── summary.tsx            # /expenses/summary (P&L + currency totals)
│   ├── profile.tsx                # /profile
│   ├── tokens.tsx                 # /tokens
│   └── admin.tsx                  # /admin
├── src/
│   ├── components/
│   │   └── layout/
│   │       ├── app-shell.tsx      # Authenticated layout wrapper
│   │       ├── header.tsx         # Top bar + user menu dropdown
│   │       └── sidebar.tsx        # Responsive sidebar (desktop/tablet/mobile)
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts          # apiFetch, setTokens, clearTokens, ApiError
│   │   │   ├── types.ts           # All TypeScript interfaces (identical to Next.js)
│   │   │   ├── auth.ts            # login, register, logout, logoutAll, refreshToken
│   │   │   ├── expenses.ts        # CRUD + summary + P&L
│   │   │   ├── attachments.ts     # upload, list, delete
│   │   │   ├── users.ts           # getMe, updateProfile, changePassword, deactivate
│   │   │   ├── admin.ts           # listUsers, disable/enable/unlock, forcePasswordReset
│   │   │   ├── tokens.ts          # JWKS, decode claims
│   │   │   └── reports.ts         # P&L report
│   │   ├── auth/
│   │   │   ├── auth-provider.tsx  # AuthContext, 4-min refresh timer, auth:set/cleared events
│   │   │   └── auth-guard.tsx     # Redirects to /login if no token
│   │   └── queries/
│   │       ├── use-auth.ts        # useLogin, useLogout, useLogoutAll
│   │       ├── use-expenses.ts    # useExpenses, useExpense, useCreateExpense, etc.
│   │       ├── use-attachments.ts # useAttachments, useUploadAttachment, useDeleteAttachment
│   │       ├── use-user.ts        # useCurrentUser, useUpdateProfile, useChangePassword, useDeactivateAccount
│   │       ├── use-admin.ts       # useAdminUsers, useDisableUser, useEnableUser, useUnlockUser, useForcePasswordReset
│   │       └── use-tokens.ts      # useTokenClaims, useJwks
│   └── test/
│       └── setup.ts               # Vitest setup (jsdom, testing-library)
├── coverage/                      # Generated by vitest --coverage
├── Dockerfile                     # Multi-stage: deps → build → runtime (Node.js)
├── package.json                   # TanStack Start, TanStack Query, Vitest
├── project.json                   # Nx targets
├── tsconfig.json
└── README.md
```

### Dockerfile

TanStack Start produces a Node.js server (similar to Next.js standalone). The Dockerfile
pattern mirrors the Next.js version:

```dockerfile
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-alpine
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build --chown=app:app /app/.output ./
USER app
EXPOSE 3301
# BACKEND_URL is a runtime environment variable (not a build arg).
# The Vinxi server proxy reads it at startup, not at build time.
# Pass it via docker run -e BACKEND_URL=... or docker-compose environment:
ENV PORT=3301 NODE_ENV=production BACKEND_URL=http://localhost:8201
CMD ["node", "server/index.mjs"]
```

TanStack Start (Vinxi) outputs to `.output/` by default. The entry point is
`.output/server/index.mjs`. `BACKEND_URL` is a **runtime** environment variable read by
the Vinxi server middleware at startup — do not bake it as a build arg. Override it via
`docker run -e BACKEND_URL=http://demo-be:8201` or the `environment:` block in
docker-compose.

### Infrastructure Files to Create

**`infra/dev/a-demo-fe-ts-tanstack-start/docker-compose.yml`** — same structure as
`infra/dev/a-demo-fe-ts-nextjs/docker-compose.yml`:

- Service `a-demo-be-db`: `postgres:17-alpine`, container `a-demo-fe-tss-db`, volume `a-demo-fe-tss-db-data`
  - Environment: `POSTGRES_DB=a_demo_fe_tss`, `POSTGRES_USER=a_demo_fe_tss`, `POSTGRES_PASSWORD=a_demo_fe_tss`
- Service `demo-be`: Go/Gin backend, container `a-demo-fe-tss-be`, port 8201, `ENABLE_TEST_API=true`
  - `DATABASE_URL=postgresql://a_demo_fe_tss:${POSTGRES_PASSWORD}@a-demo-be-db:5432/a_demo_fe_tss`
- Service `demo-fe`: TanStack Start, container `a-demo-fe-tss`, port 3301, `BACKEND_URL=http://demo-be:8201`
- Network: `a-demo-fe-tss-network`

### CI Workflow

**`.github/workflows/test-a-demo-fe-ts-tanstack-start.yml`** — identical pattern to
`test-a-demo-fe-ts-nextjs.yml`:

- Triggers: schedule (2x daily), `workflow_dispatch`
- Docker Compose: `infra/dev/a-demo-fe-ts-tanstack-start/docker-compose.yml`
- Wait for port 3301
- Run `a-demo-fe-e2e:test:e2e` with `BASE_URL=http://localhost:3301` and
  `BACKEND_URL=http://localhost:8201`
- Upload artifact `playwright-report-a-demo-fe-ts-tanstack-start`

### Existing Files to Modify

1. **`apps/a-demo-fe-e2e/project.json`** — add `"a-demo-fe-ts-tanstack-start"` to
   `implicitDependencies`
2. **`CLAUDE.md`** — add `a-demo-fe-ts-tanstack-start` entry under Current Apps list
3. **`docs/reference/re__monorepo-structure.md`** — add to apps listing (if file exists)

### Dependencies

**Production:**

- `@tanstack/react-start` — framework (Vinxi-based SSR + file routing)
- `@tanstack/react-router` — file-based routing
- `@tanstack/react-query` v5 — data fetching (same as Next.js)
- `react` 19, `react-dom` 19

**Dev:**

- `vitest`, `@vitest/coverage-v8` — unit testing + coverage
- `@testing-library/react`, `@testing-library/user-event` — component testing
- `jsdom` — test environment
- `typescript`, `vite-tsconfig-paths`
- `@amiceli/vitest-cucumber` — BDD step definitions consuming Gherkin specs (same as Next.js)

### Testing Strategy

**Unit (`test:unit`)**:

- Vitest with jsdom environment
- Uses `@amiceli/vitest-cucumber` to consume Gherkin specs from `specs/apps/a-demo/fe/gherkin/`
- Mocks all API calls via `vi.mock`
- Tests component behavior: form validation, state changes, render output
- Coverage measured with `@vitest/coverage-v8` → LCOV → `rhino-cli validate` ≥70%

**Integration (`test:integration`)**:

- Not implemented in this plan (deferred to a follow-up)
- MSW-based integration tests (as used in `a-demo-fe-ts-nextjs`) would be the appropriate
  pattern when added; they would run in-process with no Docker dependency (`cache: true`)
- This app ships with unit + E2E only, matching the initial delivery scope of `a-demo-fe-ts-nextjs`

**E2E (`test:e2e`)**:

- Reuses `a-demo-fe-e2e` Playwright tests unchanged
- Requires full stack running (docker-compose or local processes)
- `BASE_URL=http://localhost:3301`, `BACKEND_URL=http://localhost:8201`

---

## Delivery Plan

### Phase 1: Project Scaffold and Foundation

- [ ] Step 1.1: Create `apps/a-demo-fe-ts-tanstack-start/` directory with `package.json`
  - TanStack Start + TanStack Router + TanStack Query + React 19
  - Vitest, @vitest/coverage-v8, testing-library, @amiceli/vitest-cucumber
  - Pinned versions matching Next.js app where applicable
- [ ] Step 1.2: Create `tsconfig.json` with strict mode, path alias `@/` → `src/`
- [ ] Step 1.3: Create `app.config.ts` with Vinxi/TanStack Start configuration including
      the API proxy middleware for `/api/*`, `/health`, `/.well-known/*`
- [ ] Step 1.4: Create `project.json` with Nx targets:
  - `dev`: `vinxi dev --port 3301`
  - `build`: `vinxi build`
  - `start`: `vinxi start`
  - `typecheck`: `tsc --noEmit`
  - `lint`: `npx oxlint@latest .`
  - `test:unit`: `npx vitest run --project unit` (separately runnable; cacheable)
  - `test:quick`: `npx vitest run --coverage && rhino-cli test-coverage validate coverage/lcov.info 70`
    - Calls vitest with coverage (which runs `test:unit` internally), then validates
      coverage threshold — follows the same pattern as `a-demo-fe-ts-nextjs`
    - Does NOT include `test:integration` or `test:e2e`
  - `test:integration`: omitted for this app — frontend integration tests via MSW are
    deferred to a follow-up plan. This app follows the same scope as `a-demo-fe-ts-nextjs`
    initial delivery (unit + E2E only). Add explicitly as `"test:integration": null`
    or document its absence in `project.json` comments.
  - Tags: `["type:app", "platform:tanstack-start", "lang:ts", "domain:a-demo-fe"]`
- [ ] Step 1.5: Create `routes/__root.tsx` with `QueryClientProvider`, `AuthProvider`,
      and `<Outlet />`. Include error boundary and loading state handling.
- [ ] Step 1.6: Verify `npm install` succeeds in the app directory

**Phase 1 Validation:**

```gherkin
Scenario: Phase 1 scaffold complete
  Given the app directory is created
  When npm install is run
  Then dependencies install without errors
  And vinxi dev starts the server on port 3301
  And the root layout renders without TypeScript errors
```

### Phase 2: API Client and Auth Foundation

- [ ] Step 2.1: Create `src/lib/api/types.ts` — copy verbatim from Next.js app (all
      TypeScript interfaces: `AuthTokens`, `User`, `Expense`, `Attachment`, etc.)
- [ ] Step 2.2: Create `src/lib/api/client.ts` — copy verbatim from Next.js app:
  - `TOKEN_KEY = "demo_fe_access_token"`, `REFRESH_KEY = "demo_fe_refresh_token"`
  - `getAccessToken()`, `getRefreshToken()`, `setTokens()`, `clearTokens()`
  - `auth:set` and `auth:cleared` CustomEvent dispatch
  - `ApiError` class
  - `apiFetch()` with Bearer token injection and 401 handling
- [ ] Step 2.3: Create all API modules: `auth.ts`, `expenses.ts`, `attachments.ts`,
      `users.ts`, `admin.ts`, `tokens.ts`, `reports.ts` — copy from Next.js, adjusting
      imports only
- [ ] Step 2.4: Create `src/lib/auth/auth-provider.tsx` — copy verbatim from Next.js:
  - `AuthContext` with `isAuthenticated`, `isLoading`, `logout`, `error`, `setError`
  - 4-minute token refresh interval
  - `auth:set` / `auth:cleared` event listeners
- [ ] Step 2.5: Create `src/lib/auth/auth-guard.tsx` — client-side redirect to `/login`
      if `getAccessToken()` returns null (use `useEffect` + `router.navigate`)
- [ ] Step 2.6: Create all TanStack Query hooks in `src/lib/queries/` — copy from
      Next.js, replacing `next/navigation` hooks with TanStack Router equivalents

**Phase 2 Validation:**

```gherkin
Scenario: Phase 2 API client complete
  Given the API client is implemented
  When a test calls setTokens("access", "refresh")
  Then localStorage["demo_fe_access_token"] equals "access"
  And localStorage["demo_fe_refresh_token"] equals "refresh"
  And a "auth:set" CustomEvent is dispatched on window
  When clearTokens() is called
  Then both localStorage keys are removed
  And a "auth:cleared" CustomEvent is dispatched
```

### Phase 3: Layout Components

- [ ] Step 3.1: Create `src/components/layout/sidebar.tsx` — port from Next.js,
      replacing `Link` from `next/link` with TanStack Router `<Link>`, replacing
      `usePathname()` with `useRouterState().location.pathname`
  - `aria-label="Main navigation"` on `<nav>`
  - `data-testid="nav-drawer"` on mobile `<nav>`
  - Three variants: desktop (14rem), tablet (4rem icons-only), mobile (fixed drawer)
  - Same nav items: Home, Expenses, Summary, Admin, Tokens, Profile
- [ ] Step 3.2: Create `src/components/layout/header.tsx` — port from Next.js:
  - `aria-label="Toggle navigation menu"` on hamburger button
  - `aria-label="User menu"` on account button
  - `aria-expanded`, `aria-haspopup` on user menu trigger
  - `role="menu"` on dropdown container
  - `role="menuitem"` on "Log out" and "Log out all devices" buttons
  - Display `user?.username` in trigger button
- [ ] Step 3.3: Create `src/components/layout/app-shell.tsx` — port from Next.js,
      using `useWindowSize` or `window.innerWidth` for responsive breakpoints:
  - Mobile: width < 640px → hamburger only (no sidebar by default)
  - Tablet: 640–1023px → icon-only sidebar
  - Desktop: ≥1024px → full sidebar with labels

**Phase 3 Validation:**

```gherkin
Scenario: Phase 3 layout complete
  Given a logged-in user is viewing the app on desktop
  Then the sidebar should display all navigation links with labels
  And the user's username should appear in the header

Scenario: Mobile layout shows hamburger by default
  Given a logged-in user is viewing the app on a 375px viewport
  Then the hamburger button should be visible
  And the nav-drawer should not be visible by default

Scenario: Clicking hamburger opens the nav-drawer
  Given a logged-in user is viewing the app on a 375px viewport
  When the hamburger is clicked
  Then the nav-drawer should appear
```

### Phase 4: Authentication Pages

- [ ] Step 4.1: Create `routes/login.tsx` — port from Next.js login page:
  - `role="textbox"` inputs with labels matching `/username/i` and `/password/i`
  - Submit button matching `/log in|sign in|login/i`
  - `role="alert"` error display on invalid credentials (401) or deactivated account (403)
  - Redirect to `/expenses` on success
  - Redirect to `/expenses` if already authenticated (check in `useEffect`)
  - `?registered=true` query param shows success message
- [ ] Step 4.2: Create `routes/register.tsx` — port from Next.js register page:
  - `role="textbox"` inputs: username, email, password
  - Submit button matching `/register|sign up|create account/i`
  - Redirect to `/login?registered=true` on success
  - Password validation error display
- [ ] Step 4.3: Add auth redirect to protected routes — wrap each protected route with
      `AuthGuard` or use TanStack Router's `beforeLoad` to check token

**Phase 4 Validation:**

```gherkin
Scenario: Phase 4 authentication complete
  Given a registered user submits the login form
  Then tokens are stored in localStorage
  And the user is redirected to /expenses
  When an unauthenticated user navigates to /expenses
  Then they are redirected to /login
```

### Phase 5: Expenses Pages

- [ ] Step 5.1: Create `routes/expenses/index.tsx` — port from Next.js expenses page:
  - "New Expense" button (matches `/new expense/i`)
  - Inline create form with all fields: amount, currency, type, category, date, quantity,
    unit, description
  - `<table>/<tbody>/<tr data-testid="entry-card">` structure
  - Each row: date, description (link), category, type, amount, Edit/Delete actions
  - Delete confirmation `role="alertdialog"` with confirm/cancel buttons
  - Pagination: previous/next buttons with `aria-label`, page indicator
  - Field validation matching Next.js: required amount, valid currency, required category,
    required description, required date, valid type, valid unit
- [ ] Step 5.2: Create `routes/expenses/$id.tsx` — port from Next.js expense detail page:
  - Display expense fields: amount, type, category, date, quantity, unit
  - Edit form (same fields as create)
  - Delete button → `role="alertdialog"` with focus trap (Tab cycling)
  - Attachments section with file upload input (`accept="image/*,.pdf,.txt"`)
  - Upload error display for invalid type or oversized files
  - Attachment list with delete per attachment
  - Owner check: only show upload and delete attachment controls if `currentUser.id === expense.userId`
  - Not-found error display
- [ ] Step 5.3: Create `routes/expenses/summary.tsx` — port from Next.js summary page:
  - "Total by Currency" cards section
  - P&L report form: start date input (label `/start.?date|from/i`), end date input
    (label `/end.?date/i`), currency select, "Generate Report" button
  - Report output wrapped in `data-testid="pl-chart"`:
    - Summary cards: Total Income, Total Expense, Net
    - Income Breakdown category table
    - Expense Breakdown category table

**Phase 5 Validation:**

```gherkin
Scenario: Phase 5 expenses complete
  Given alice is logged in with an existing expense "Lunch"
  When alice navigates to /expenses
  Then "Lunch" should appear in a tbody tr row
  And the row should have data-testid="entry-card"
  When alice clicks "Edit" on "Lunch"
  Then the expense detail page loads at /expenses/{id}
  When alice generates a P&L report
  Then data-testid="pl-chart" should be visible with income and expense totals
```

### Phase 6: Profile and Token Pages

- [ ] Step 6.1: Create `routes/profile.tsx` — port from Next.js profile page:
  - Account Information section (username, email, display name, status)
  - Edit Display Name form with `id="displayName"` input and Save Changes button
  - Change Password form with `id="oldPassword"` and `id="newPassword"` inputs
  - Deactivate Account section with "Deactivate Account" button → confirmation
    `role="alertdialog"` → on confirm: logout + redirect to `/login`
- [ ] Step 6.2: Create `routes/tokens.tsx` — port from Next.js tokens page:
  - Access Token Claims section with `<dl>` containing:
    - Subject: `<dd data-testid="token-subject">`
    - Issuer, Issued At, Expires At, Roles
  - Raw Claims `<details>` / `<summary>` collapsible JSON display
  - JWKS Endpoint section with key count and key list (kid, kty, use)

**Phase 6 Validation:**

```gherkin
Scenario: Phase 6 profile and tokens complete
  Given alice is logged in
  When alice navigates to /profile
  Then her username, email, and display name are visible
  When alice navigates to /tokens
  Then data-testid="token-subject" shows her user ID
  And the JWKS section shows the key count
```

### Phase 7: Admin Page and Home Page

- [ ] Step 7.1: Create `routes/admin.tsx` — port from Next.js admin page:
  - Search form: input with `placeholder="Search by username or email"` matching
    `/search/i`, Search button, Clear button
  - Users table: `<table><tbody>` with rows per user (username, email, status badge, actions)
  - Per-user actions: Disable (ACTIVE), Enable (DISABLED), Unlock (LOCKED),
    Generate Reset Token
  - Disable dialog: `role="alertdialog"` with reason textarea (`id="disable-reason"`),
    Disable/Cancel buttons
  - Reset token display: `<code data-testid="reset-token">` with Copy button
  - Pagination matching expenses page pattern
- [ ] Step 7.2: Create `routes/index.tsx` — home page with health status:
  - Fetches `/health` endpoint
  - Displays `data-testid="health-status"` element with status text

**Phase 7 Validation:**

```gherkin
Scenario: Phase 7 admin and home complete
  Given admin is logged in
  When admin searches for user "alice"
  Then only rows containing "alice" appear in tbody
  And document.querySelectorAll("tbody tr") returns only alice's row
  When admin generates a reset token for alice
  Then data-testid="reset-token" shows the token value
```

### Phase 8: Unit Tests and Coverage

- [ ] Step 8.0: Verify Gherkin specs directory exists and is shared with `a-demo-fe-ts-nextjs`:

  ```bash
  ls specs/apps/a-demo/fe/gherkin/
  ```

  Confirm subdirectories (`admin`, `authentication`, `expenses`, `health`, `layout`) are
  present. This directory is part of the monorepo and already contains all 92 feature
  files used by `a-demo-fe-ts-nextjs`. No creation needed — it is shared.

- [ ] Step 8.1: Create `src/test/setup.ts` — Vitest setup file (same as Next.js app)
- [ ] Step 8.2: Create `vitest.config.ts` with:
  - `environment: "jsdom"`
  - `coverage.provider: "v8"`
  - `coverage.reporter: ["lcov", "text"]`
  - `coverage.thresholds: { lines: 70 }` (matches Next.js threshold)
  - Path aliases for `@/`
- [ ] Step 8.3: Write unit tests using `@amiceli/vitest-cucumber` consuming
      `specs/apps/a-demo/fe/gherkin/**/*.feature`:
  - Authentication: login success, login failure, register, session management
  - Expenses: create, list, edit, delete, validation errors
  - Admin: user list, search, disable/enable/unlock
  - Profile: display name update, change password
  - Tokens: claims display, JWKS display
  - Health: status display
- [ ] Step 8.4: Run `npx vitest run --coverage` and verify LCOV output at
      `coverage/lcov.info`
- [ ] Step 8.5: Run `rhino-cli test-coverage validate coverage/lcov.info 70` and
      verify it passes

**Phase 8 Validation:**

```gherkin
Scenario: Phase 8 unit tests and coverage complete
  Given all unit tests are written
  When npx vitest run --coverage is executed
  Then all unit tests pass
  And coverage/lcov.info is generated
  When rhino-cli test-coverage validate coverage/lcov.info 70 is run
  Then the coverage check passes with ≥70% line coverage
```

### Phase 9: Docker, Infrastructure, and CI

- [ ] Step 9.1: Create `apps/a-demo-fe-ts-tanstack-start/Dockerfile` using multi-stage
      build:
  - Stage `deps`: `node:24-alpine`, install from `package.json`/`package-lock.json`
  - Stage `build`: copy deps, copy source, run `npm run build` (no `ARG BACKEND_URL` —
    it is a runtime variable, not a build arg)
  - Stage runtime: `node:24-alpine`, non-root `app` user, copy `.output/`, `EXPOSE 3301`,
    `ENV BACKEND_URL=http://localhost:8201` (default, override at runtime),
    `CMD ["node", "server/index.mjs"]`
- [ ] Step 9.2: Create `infra/dev/a-demo-fe-ts-tanstack-start/docker-compose.yml`:
  - Service `a-demo-be-db`: postgres:17-alpine, container `a-demo-fe-tss-db`,
    volume `a-demo-fe-tss-db-data`, network `a-demo-fe-tss-network`
  - Service `demo-be`: Go/Gin backend, container `a-demo-fe-tss-be`, port 8201,
    `ENABLE_TEST_API=true`
  - Service `demo-fe`: TanStack Start, container `a-demo-fe-tss`, port 3301,
    `BACKEND_URL=http://demo-be:8201`
- [ ] Step 9.3: Create `.github/workflows/test-a-demo-fe-ts-tanstack-start.yml`:
  - Same trigger pattern: schedule (0 23 and 0 11 UTC), `workflow_dispatch`
  - Docker compose up → wait for port 3301 (36 × 10s = 6 min max)
  - Setup Volta → `npm ci` → install Playwright chromium
  - Run `npx nx run a-demo-fe-e2e:test:e2e`
  - Upload artifact `playwright-report-a-demo-fe-ts-tanstack-start`
  - Teardown: `docker compose down -v`

**Phase 9 Validation:**

```gherkin
Scenario: Phase 9 Docker build succeeds
  Given the Dockerfile is written
  When docker build is run against apps/a-demo-fe-ts-tanstack-start
  Then the image builds without errors
  When docker compose up is run for infra/dev/a-demo-fe-ts-tanstack-start/
  Then all three services start successfully
  And the frontend responds at http://localhost:3301
  And /api/v1/auth/login proxies to the backend at http://localhost:8201
```

### Phase 10: End-to-End Validation and Documentation

- [ ] Step 10.1: Update `apps/a-demo-fe-e2e/project.json` — add
      `"a-demo-fe-ts-tanstack-start"` to `implicitDependencies`
- [ ] Step 10.2: Run full E2E locally:

  ```bash
  docker compose -f infra/dev/a-demo-fe-ts-tanstack-start/docker-compose.yml up --build -d
  BASE_URL=http://localhost:3301 BACKEND_URL=http://localhost:8201 \
    npx nx run a-demo-fe-e2e:test:e2e
  ```

- [ ] Step 10.3: Fix any E2E failures by adjusting selectors, ARIA attributes, or
      DOM structure until all 92 scenarios pass
- [ ] Step 10.4: Create `apps/a-demo-fe-ts-tanstack-start/README.md`
- [ ] Step 10.5: Update `CLAUDE.md`:
  - Add `a-demo-fe-ts-tanstack-start` under Current Apps
  - Add TanStack Start coverage note (70% threshold) under Demo-fe TypeScript frontends section
- [ ] Step 10.6: Trigger `test-a-demo-fe-ts-tanstack-start.yml` via `workflow_dispatch`
      and confirm all green

**Phase 10 Validation (Final Acceptance):**

```gherkin
Scenario: All 92 E2E scenarios pass
  Given the full stack is running via docker compose
  When npx nx run a-demo-fe-e2e:test:e2e is executed
  Then 92 scenarios should pass
  And 0 scenarios should fail

Scenario: No regressions in existing tests
  Given a-demo-fe-ts-nextjs is unchanged
  When test-a-demo-fe-ts-nextjs.yml is triggered
  Then all scenarios still pass

Scenario: CI workflow succeeds
  Given test-a-demo-fe-ts-tanstack-start.yml is triggered via workflow_dispatch
  When the workflow completes
  Then all jobs are green
  And the playwright-report-a-demo-fe-ts-tanstack-start artifact is available
```

### Validation Checklist

- [ ] `npm install` succeeds in `apps/a-demo-fe-ts-tanstack-start/`
- [ ] `nx typecheck a-demo-fe-ts-tanstack-start` passes with no TypeScript errors
- [ ] `nx lint a-demo-fe-ts-tanstack-start` passes with no lint errors
- [ ] `nx run a-demo-fe-ts-tanstack-start:test:quick` passes (unit tests + coverage ≥70%)
- [ ] `nx build a-demo-fe-ts-tanstack-start` produces `.output/` directory
- [ ] Docker build succeeds: `docker build apps/a-demo-fe-ts-tanstack-start`
- [ ] `docker compose up` starts all 3 services without error
- [ ] Frontend responds at `http://localhost:3301`
- [ ] API proxy works: `curl http://localhost:3301/health` returns `{"status":"ok"}`
- [ ] All 92 E2E scenarios pass locally
- [ ] CI workflow `test-a-demo-fe-ts-tanstack-start.yml` passes end-to-end
- [ ] `a-demo-fe-e2e` `implicitDependencies` updated
- [ ] `CLAUDE.md` updated with new app entry
- [ ] No modifications made to `apps/a-demo-fe-e2e/` test code (E2E tests reused as-is)
