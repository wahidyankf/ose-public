# Delivery

## Phase 1: Project Scaffolding

- [ ] Create `apps/demo-fs-ts-nextjs/` directory
- [ ] Run `npx create-next-app@16` with TypeScript, App Router, src/ directory
- [ ] Remove default Next.js boilerplate (placeholder pages, globals.css)
- [ ] Configure `next.config.ts` with `output: 'standalone'` for Docker builds
- [ ] Create `project.json` with 7 mandatory Nx targets (codegen, typecheck, lint, build,
      test:unit, test:quick, test:integration) + `dev`
- [ ] Set up `tsconfig.json` with strict mode
- [ ] Set up `vitest.config.ts` with v8 coverage
- [ ] Add `codegen` target (same openapi-ts config as demo-fe-ts-nextjs)
- [ ] Run `nx run demo-fs-ts-nextjs:codegen` to verify types generate
- [ ] Add oxlint config (same as demo-fe-ts-nextjs)

## Phase 2: Database Layer

- [ ] Install Drizzle ORM + drizzle-kit + pg driver
- [ ] Create `src/db/schema.ts` with users, sessions, expenses, attachments tables
- [ ] Create `drizzle.config.ts` for migration generation
- [ ] Generate initial SQL migration
- [ ] Create `src/db/client.ts` — Drizzle client singleton
- [ ] Verify migration runs against local PostgreSQL

## Phase 3: Repository Layer

- [ ] Create `src/repositories/user-repository.ts` — CRUD for users
- [ ] Create `src/repositories/session-repository.ts` — token session management
- [ ] Create `src/repositories/expense-repository.ts` — expense CRUD + pagination
- [ ] Create `src/repositories/attachment-repository.ts` — file metadata + binary storage
- [ ] Define repository interfaces for mock injection in tests

## Phase 4: Service Layer

- [ ] Create `src/services/auth-service.ts` — register, login, logout, refresh, JWT
      signing/verification
- [ ] Create `src/services/user-service.ts` — profile update, password change,
      deactivation, admin operations
- [ ] Create `src/services/expense-service.ts` — expense CRUD, pagination, summary
- [ ] Create `src/services/attachment-service.ts` — upload, download metadata, delete
- [ ] Create `src/services/report-service.ts` — P&L report generation
- [ ] Create `src/lib/jwt.ts` — JWT utilities (sign, verify, decode) using jose library

## Phase 5: API Route Handlers

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
- [ ] Create `src/app/api/v1/tokens/claims/route.ts` — GET current token claims
- [ ] Create `src/app/health/route.ts` — GET health check
- [ ] Create `src/app/.well-known/jwks.json/route.ts` — GET JWKS public key
- [ ] Create `src/app/api/v1/test/reset-db/route.ts` — POST reset database (test-only,
      guarded by `ENABLE_TEST_API` env var)
- [ ] Create `src/app/api/v1/test/promote-admin/route.ts` — POST promote user to admin
      (test-only, guarded by `ENABLE_TEST_API` env var)

## Phase 6: Backend Unit Tests (BE Gherkin)

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

## Phase 7: Frontend Components and Pages

- [ ] Create `src/lib/auth-provider.tsx` — client-side auth context with token refresh
- [ ] Create `src/lib/api-client.ts` — fetch wrapper for `/api/v1/*` (no proxy needed)
- [ ] Create navigation sidebar component (desktop/tablet/mobile responsive)
- [ ] Create expense table component with pagination
- [ ] Create expense form component (create + edit)
- [ ] Create confirmation dialog component (delete actions)
- [ ] Create user table component (admin panel)
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

## Phase 8: Frontend Unit Tests (FE Gherkin)

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

## Phase 9: Coverage Gate

- [ ] Run `nx run demo-fs-ts-nextjs:test:quick` (unit tests + rhino-cli 80%+)
- [ ] Add coverage exclusions if needed (e.g., generated-contracts, migration files)
- [ ] Ensure `typecheck` and `lint` pass cleanly

## Phase 10: Integration Tests

- [ ] Create `docker-compose.integration.yml` with PostgreSQL 17
- [ ] Configure integration test BDD runner (`@cucumber/cucumber` with `cucumber.integration.js`)
- [ ] Create `test/integration/be-steps/` — same BE Gherkin steps but with real DB
- [ ] Implement Drizzle-based test setup/teardown (transaction rollback or truncation)
- [ ] Verify all BE integration tests pass:
      `nx run demo-fs-ts-nextjs:test:integration`

## Phase 11: Docker and Local Development

- [ ] Create `Dockerfile` (multi-stage: deps → build → runtime)
- [ ] Create `infra/dev/demo-fs-ts-nextjs/docker-compose.yml`
- [ ] Verify app starts correctly via Docker Compose
- [ ] Verify health check at `http://localhost:3401/health`

## Phase 12: E2E Verification

- [ ] Start app + PostgreSQL locally with `ENABLE_TEST_API=true`
- [ ] Run `demo-be-e2e` with `BASE_URL=http://localhost:3401` — all BE scenarios pass
- [ ] Run `demo-fe-e2e` with `BASE_URL=http://localhost:3401` and
      `BACKEND_URL=http://localhost:3401` — all FE scenarios pass
      (Note: `demo-fe-e2e` uses `BACKEND_URL` separately for direct API calls like
      reset-db and promote-admin; for the fullstack app both point to the same origin)
- [ ] Fix any E2E compatibility issues (ARIA attributes, response shapes, etc.)

## Phase 13: CI and Documentation

- [ ] Create `.github/workflows/test-demo-fs-ts-nextjs.yml`
- [ ] Create `apps/demo-fs-ts-nextjs/README.md` with project overview, commands, testing
      docs, and related documentation links
- [ ] Add Codecov upload for unit test coverage
- [ ] Update `specs/apps/demo/README.md` to mention fullstack category
- [ ] Update CLAUDE.md to include demo-fs-ts-nextjs in Current Apps listing
- [ ] Update Nx dependency graph documentation if needed
- [ ] Verify CI workflow passes on push

## Validation Checklist

- [ ] `nx run demo-fs-ts-nextjs:codegen` succeeds
- [ ] `nx run demo-fs-ts-nextjs:typecheck` succeeds
- [ ] `nx run demo-fs-ts-nextjs:lint` succeeds
- [ ] `nx run demo-fs-ts-nextjs:build` succeeds
- [ ] `nx run demo-fs-ts-nextjs:test:unit` — all BE + FE Gherkin scenarios pass
- [ ] `nx run demo-fs-ts-nextjs:test:quick` — 80%+ line coverage
- [ ] `nx run demo-fs-ts-nextjs:test:integration` — all BE scenarios pass with real PG
- [ ] `demo-be-e2e` passes with `BASE_URL=http://localhost:3401`
- [ ] `demo-fe-e2e` passes with `BASE_URL=http://localhost:3401` and
      `BACKEND_URL=http://localhost:3401`
- [ ] Docker Compose local dev setup works
- [ ] CI workflow passes
- [ ] README.md is complete with related documentation links
