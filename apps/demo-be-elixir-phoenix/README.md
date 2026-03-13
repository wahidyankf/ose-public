# demo-be-elixir-phoenix

Elixir/Phoenix REST API backend for the Demo Backend platform.
This is an alternative implementation of `demo-be-java-springboot` (Spring Boot), built with
Phoenix 1.7+ on Elixir 1.19 / OTP 27.

## Local Development (Docker)

```bash
# From workspace root — start PostgreSQL + Phoenix server
docker compose -f infra/dev/demo-be-elixir-phoenix/docker-compose.yml up --build
```

The server listens on port **8201** (`http://localhost:8201`).

## Environment Variables

| Variable          | Required   | Description                          |
| ----------------- | ---------- | ------------------------------------ |
| `DATABASE_URL`    | Dev / Prod | Ecto connection URL (`ecto://...`)   |
| `APP_JWT_SECRET`  | Dev / Prod | HS256 secret for Guardian JWT tokens |
| `PORT`            | Optional   | HTTP port (default: `4000`)          |
| `PHX_HOST`        | Prod only  | Canonical hostname (`example.com`)   |
| `SECRET_KEY_BASE` | Prod only  | Phoenix cookie encryption key        |

> `APP_JWT_SECRET` is **not** required during `mix test` — `config/test.exs` supplies a
> hardcoded test secret so CI can run without injecting secrets.

## Nx Targets

```bash
nx run demo-be-elixir-phoenix:install          # mix deps.get
nx run demo-be-elixir-phoenix:dev              # mix phx.server (development)
nx run demo-be-elixir-phoenix:test:quick       # unit tests + coverage gate (>=90%)
nx run demo-be-elixir-phoenix:test:unit        # unit tests with coverage (same as test:quick)
nx run demo-be-elixir-phoenix:test:integration # docker compose: real PostgreSQL + all BDD scenarios
nx run demo-be-elixir-phoenix:lint             # mix credo --strict
nx run demo-be-elixir-phoenix:typecheck        # mix compile (warnings-as-errors)
nx run demo-be-elixir-phoenix:build            # mix compile (prod, warnings-as-errors)
```

## API Endpoints

| Method | Path                                           | Auth   | Description                  |
| ------ | ---------------------------------------------- | ------ | ---------------------------- |
| GET    | `/health`                                      | Public | Health check                 |
| GET    | `/.well-known/jwks.json`                       | Public | JWKS public key endpoint     |
| POST   | `/api/v1/auth/register`                        | Public | Register new user            |
| POST   | `/api/v1/auth/login`                           | Public | Login, receive JWT + refresh |
| POST   | `/api/v1/auth/logout`                          | Bearer | Logout current session       |
| POST   | `/api/v1/auth/logout-all`                      | Bearer | Logout all sessions          |
| POST   | `/api/v1/auth/refresh`                         | Public | Refresh access token         |
| GET    | `/api/v1/users/me`                             | Bearer | Get own profile              |
| PATCH  | `/api/v1/users/me`                             | Bearer | Update display name          |
| POST   | `/api/v1/users/me/password`                    | Bearer | Change password              |
| POST   | `/api/v1/users/me/deactivate`                  | Bearer | Self-deactivate account      |
| GET    | `/api/v1/admin/users`                          | Bearer | List users (admin only)      |
| POST   | `/api/v1/admin/users/:id/disable`              | Bearer | Disable user (admin only)    |
| POST   | `/api/v1/admin/users/:id/enable`               | Bearer | Enable user (admin only)     |
| POST   | `/api/v1/admin/users/:id/unlock`               | Bearer | Unlock user (admin only)     |
| POST   | `/api/v1/admin/users/:id/force-password-reset` | Bearer | Force password reset (admin) |
| GET    | `/api/v1/expenses`                             | Bearer | List own entries (paginated) |
| POST   | `/api/v1/expenses`                             | Bearer | Create financial entry       |
| GET    | `/api/v1/expenses/summary`                     | Bearer | Expense totals by currency   |
| GET    | `/api/v1/expenses/:id`                         | Bearer | Get entry by ID              |
| PUT    | `/api/v1/expenses/:id`                         | Bearer | Update entry                 |
| DELETE | `/api/v1/expenses/:id`                         | Bearer | Delete entry                 |
| GET    | `/api/v1/expenses/:id/attachments`             | Bearer | List attachments             |
| POST   | `/api/v1/expenses/:id/attachments`             | Bearer | Upload attachment            |
| GET    | `/api/v1/expenses/:id/attachments/:att_id`     | Bearer | Download attachment metadata |
| DELETE | `/api/v1/expenses/:id/attachments/:att_id`     | Bearer | Delete attachment            |
| GET    | `/api/v1/reports/pl`                           | Bearer | P&L report for date range    |

## Three-Level Test Architecture

This application follows the standard three-level testing strategy:

```
unit        → fast, in-memory, no external services, fully cached
integration → Docker Compose + real PostgreSQL, not cached
e2e         → Playwright against a live running stack (apps/demo-be-e2e)
```

### Level 1: Unit Tests (`test:quick` / `test:unit`)

Unit tests run with `MIX_ENV=test` using in-memory context implementations. No database
or external services are required. These tests are **fully cached** by Nx.

```bash
nx run demo-be-elixir-phoenix:test:quick
# or equivalently:
nx run demo-be-elixir-phoenix:test:unit
```

**What runs:**

- All 76 Gherkin BDD scenarios re-implemented in `test/unit/steps/` with `@moduletag :unit`
- Controller error-path tests in `test/demo_be_exph_web/controllers/coverage_test.exs`
- ExCoveralls LCOV report generated to `cover/lcov.info`
- `rhino-cli test-coverage validate` enforces ≥90% line coverage

**Mock architecture:**

All context modules are replaced at test time via `config/test.exs`:

- `DemoBeExph.Accounts` → `DemoBeExph.InMemoryAccounts`
- `DemoBeExph.Token.TokenContext` → `DemoBeExph.InMemoryTokenContext`
- `DemoBeExph.Expense.ExpenseContext` → `DemoBeExph.InMemoryExpenseContext`
- `DemoBeExph.Attachment.AttachmentContext` → `DemoBeExph.InMemoryAttachmentContext`

The `Repo` GenServer is not started in the `:test` environment. Tests are fully
deterministic with no external service dependencies, making them safe for Nx caching.

### Level 2: Integration Tests (`test:integration`)

Integration tests run the same 76 Gherkin BDD scenarios (`test/integration/steps/`) against
a real PostgreSQL 17 database via Docker Compose. These tests are **never cached**.

```bash
nx run demo-be-elixir-phoenix:test:integration
```

**What runs:**

- `docker-compose.integration.yml` spins up `postgres:17-alpine` + an `elixir:1.17-otp-27-alpine` test runner
- Migrations run with `MIX_ENV=integration mix ecto.create && mix ecto.migrate`
- All integration step files tagged `@moduletag :integration` execute against the real Ecto repo
- Ecto SQL Sandbox (`:manual` mode) provides test isolation

**Prerequisites:** Docker with Compose plugin must be installed.

### Level 3: E2E Tests

End-to-end tests live in `apps/demo-be-e2e` and run Playwright scenarios against a fully
deployed stack. See that project's README for details.

## BDD Feature Specifications

Feature specifications live in `specs/apps/demo-be/gherkin/` (workspace root) and are shared
across all demo backend implementations. 76 scenarios across 13 feature domains cover:

- Health check
- User registration
- Password login
- Token lifecycle
- Token management
- User account management
- Security (lockout, brute-force)
- Admin operations
- Expense management
- Currency handling
- Unit handling
- Financial reporting (P&L)
- Attachments

Both `test/unit/steps/` and `test/integration/steps/` contain step definitions for all
76 scenarios — the unit steps use in-memory stores, the integration steps use the real Ecto repo.
