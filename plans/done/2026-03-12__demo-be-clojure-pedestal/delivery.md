# Delivery Checklist: demo-be-clojure-pedestal

## Phase 1: Project Scaffold

- [x] Create `apps/demo-be-clojure-pedestal/` directory
- [x] Create `deps.edn` with all dependencies and aliases
- [x] Create `build.clj` for uberjar build
- [x] Create `project.json` with Nx targets
- [x] Create `tests.edn` for kaocha configuration
- [x] Create `.clj-kondo/config.edn`
- [x] Create `resources/logback.xml`
- [x] Create `README.md`

## Phase 2: Core Implementation

- [x] `config.clj` — environment variable loading
- [x] `db/core.clj` — datasource creation (PostgreSQL / SQLite)
- [x] `db/schema.clj` — DDL table creation
- [x] `auth/password.clj` — bcrypt hash/verify
- [x] `auth/jwt.clj` — JWT sign/verify/JWKS
- [x] `domain/user.clj` — user status, password policy
- [x] `domain/expense.clj` — expense types, currency, units
- [x] `domain/attachment.clj` — file type/size validation

## Phase 3: Database Repositories

- [x] `db/user_repo.clj` — user CRUD
- [x] `db/token_repo.clj` — token revocation
- [x] `db/expense_repo.clj` — expense CRUD + summary
- [x] `db/attachment_repo.clj` — attachment CRUD

## Phase 4: Interceptors

- [x] `interceptors/json.clj` — JSON body parsing & response
- [x] `interceptors/auth.clj` — JWT authentication
- [x] `interceptors/admin.clj` — admin role check
- [x] `interceptors/error.clj` — error handling
- [x] `interceptors/multipart.clj` — multipart file upload

## Phase 5: Handlers & Routes

- [x] `handlers/health.clj` — health check
- [x] `handlers/auth.clj` — register, login, refresh, logout, logout-all
- [x] `handlers/user.clj` — profile, password change, deactivate
- [x] `handlers/admin.clj` — user management
- [x] `handlers/expense.clj` — expense CRUD + summary
- [x] `handlers/attachment.clj` — file attachments
- [x] `handlers/report.clj` — P&L report
- [x] `handlers/token.clj` — JWT claims
- [x] `handlers/jwks.clj` — JWKS endpoint
- [x] `routes.clj` — route table
- [x] `server.clj` — Pedestal server setup
- [x] `main.clj` — entry point

## Phase 6: Integration Tests

- [x] Set up feature file access (symlink or copy)
- [x] `common_steps.clj` — shared steps
- [x] `health_steps.clj` — 2 scenarios
- [x] `auth_steps.clj` — 12 scenarios (login + token lifecycle)
- [x] `user_steps.clj` — 12 scenarios (registration + account)
- [x] `admin_steps.clj` — 6 scenarios
- [x] `expense_steps.clj` — 17 scenarios (CRUD + currency + units)
- [x] `report_steps.clj` — 6 scenarios
- [x] `attachment_steps.clj` — 10 scenarios
- [x] `token_steps.clj` — 11 scenarios (tokens + security)
- [x] All 76 scenarios passing

## Phase 7: Unit Tests & Coverage

- [x] Unit tests for domain logic
- [x] Unit tests for JWT
- [x] Unit tests for password hashing
- [x] Unit tests for repositories
- [x] cloverage LCOV output ≥90%
- [x] `rhino-cli test-coverage validate` passes

## Phase 8: Infrastructure

- [x] `infra/dev/demo-be-clojure-pedestal/docker-compose.yml`
- [x] `infra/dev/demo-be-clojure-pedestal/docker-compose.e2e.yml`
- [x] `infra/dev/demo-be-clojure-pedestal/Dockerfile.be.dev`

## Phase 9: CI/CD

- [x] `.github/workflows/e2e-demo-be-clojure-pedestal.yml`
- [x] Update `.github/workflows/main-ci.yml` — Clojure setup + coverage upload
- [x] Update `codecov.yml` — add flag

## Phase 10: Cross-references

- [x] Update `CLAUDE.md` — add to Current Apps, add coverage info
- [x] Update `README.md` — add badge + coverage row
- [x] Update `specs/apps/demo/be/README.md` — add implementation row
- [x] Update `apps/demo-be-e2e/project.json` — add to implicitDependencies

## Phase 11: Verification

- [x] `nx run demo-be-clojure-pedestal:test:quick` passes locally
- [x] `nx run demo-be-clojure-pedestal:build` produces uberjar
- [x] Main CI passes on push
- [x] E2E workflow passes (manual trigger)
