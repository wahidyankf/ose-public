# demo-be-exph

Elixir/Phoenix REST API backend for the Demo Backend platform.
This is an alternative implementation of `demo-be-jasb` (Spring Boot), built with
Phoenix 1.7+ on Elixir 1.19 / OTP 27.

## Local Development (Docker)

```bash
# From workspace root — start PostgreSQL + Phoenix server
docker compose -f infra/dev/demo-be-exph/docker-compose.yml up --build
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
nx run demo-be-exph:install          # mix deps.get
nx run demo-be-exph:dev              # mix phx.server (development)
nx run demo-be-exph:test:quick       # lint + format + coverage gate (>=90%)
nx run demo-be-exph:test:unit        # mix test --only unit
nx run demo-be-exph:test:integration # mix test --only integration (Gherkin BDD)
nx run demo-be-exph:lint             # mix credo --strict
nx run demo-be-exph:typecheck        # mix compile (warnings-as-errors)
nx run demo-be-exph:build            # mix compile (prod, warnings-as-errors)
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

## BDD Integration Tests

Feature specifications live in `specs/apps/demo-be/gherkin/` and are executed via
`elixir-cabbage` (vendored Gherkin BDD framework):

```bash
nx run demo-be-exph:test:integration
```

73 scenarios across 13 feature files cover all 9 feature domains:
health, authentication, token lifecycle, user registration, user account,
security, token management, admin, expense management, currency handling,
unit handling, financial reporting, and attachments.

### Mock Testing Architecture

Integration tests run **without a real database**. All context modules
(`Accounts`, `TokenContext`, `ExpenseContext`, `AttachmentContext`) are replaced
at test time with in-memory implementations backed by a shared `InMemoryStore`
(Agent-based state). The dispatch is configured via `Application.get_env` in
`config/test.exs`:

- `DemoBeExph.Accounts` -> `DemoBeExph.InMemoryAccounts`
- `DemoBeExph.Token.TokenContext` -> `DemoBeExph.InMemoryTokenContext`
- `DemoBeExph.Expense.ExpenseContext` -> `DemoBeExph.InMemoryExpenseContext`
- `DemoBeExph.Attachment.AttachmentContext` -> `DemoBeExph.InMemoryAttachmentContext`

The `Repo` GenServer is not started in the `:test` environment. Tests are fully
deterministic with no external service dependencies, making them safe for Nx caching.
