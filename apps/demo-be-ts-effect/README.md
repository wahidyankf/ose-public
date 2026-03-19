# demo-be-ts-effect

TypeScript/Effect REST API backend — a functional twin of `demo-be-golang-gin`, `demo-be-python-fastapi`,
`demo-be-rust-axum`, and others, using Node.js, Vite, and Effect TS.

**tsex** = **T**ype**S**cript + **E**ffect**X** — matching the suffix pattern of other demo-be
variants.

## Tech Stack

| Concern          | Choice                                           |
| ---------------- | ------------------------------------------------ |
| Language         | TypeScript (strict)                              |
| Runtime          | Node.js (managed by Volta)                       |
| Build            | Vite (library mode for server build)             |
| Web framework    | `@effect/platform` Node.js HTTP server           |
| Database         | `@effect/sql` + SQLite (unit) / PostgreSQL (int) |
| JWT              | `jose` library                                   |
| Password hashing | `bcrypt`                                         |
| Unit BDD tests   | Cucumber.js + SQLite in-memory                   |
| Coverage         | Vitest v8 → LCOV → rhino-cli                     |
| Linting          | oxlint                                           |
| Port             | **8201**                                         |

## Test Architecture

This project uses a three-level testing strategy:

### Level 1: Unit tests (`tests/unit/`)

Pure unit tests covering isolated functions, domain logic, and algorithms using Vitest. These run
fast with no external dependencies.

### Level 2: Unit BDD (`tests/unit/bdd/`)

Cucumber.js BDD scenarios from `specs/apps/demo/be/gherkin/` run against an in-process server
backed by SQLite in-memory. All 76 Gherkin scenarios execute with no real database required.
Deterministic, fast, and safe to cache.

Step definitions in `tests/unit/bdd/steps/` mirror the shared spec. The hooks start a local HTTP
server on port 8300 using SQLite and clear tables before each scenario for full isolation.

Both levels run as part of `test:quick` (the pre-push quality gate).

### Level 3: Integration tests (`tests/integration/`)

Full BDD scenarios run against a real PostgreSQL 17 database via Docker Compose. This level
validates database compatibility and production-equivalent behaviour. Results are never cached.

```bash
nx run demo-be-ts-effect:test:integration  # requires Docker
```

## Nx Targets

```bash
nx dev demo-be-ts-effect                      # Start dev server with tsx watch
nx build demo-be-ts-effect                    # Build with Vite (depends on codegen)
nx start demo-be-ts-effect                    # Run built dist/main.js
nx run demo-be-ts-effect:codegen              # Generate contract types from OpenAPI spec
nx run demo-be-ts-effect:test:quick           # Unit tests + coverage + BDD scenarios (pre-push gate)
nx run demo-be-ts-effect:test:unit            # Unit tests + BDD scenarios only
nx run demo-be-ts-effect:test:integration     # Cucumber.js BDD against PostgreSQL (Docker)
nx run demo-be-ts-effect:lint                 # oxlint
nx run demo-be-ts-effect:typecheck            # tsc --noEmit (depends on codegen)
```

## Environment Variables

| Variable         | Default                                 | Description              |
| ---------------- | --------------------------------------- | ------------------------ |
| `PORT`           | `8201`                                  | HTTP server port         |
| `DATABASE_URL`   | `sqlite::memory:`                       | PostgreSQL or SQLite URL |
| `APP_JWT_SECRET` | `dev-jwt-secret-at-least-32-chars-long` | JWT signing secret       |

## Local Development

### Direct (Node.js)

```bash
cd apps/demo-be-ts-effect
npm install
DATABASE_URL=sqlite::memory: npx tsx src/main.ts
```

### Docker Compose

```bash
cd infra/dev/demo-be-ts-effect
docker compose up --build
```

Then verify: `curl http://localhost:8201/health`

## API Endpoints

| Method | Path                                            | Auth  | Description           |
| ------ | ----------------------------------------------- | ----- | --------------------- |
| GET    | `/health`                                       | No    | Health check          |
| POST   | `/api/v1/auth/register`                         | No    | Register new user     |
| POST   | `/api/v1/auth/login`                            | No    | Login, return JWT     |
| POST   | `/api/v1/auth/refresh`                          | JWT   | Refresh access token  |
| POST   | `/api/v1/auth/logout`                           | No    | Logout (revoke token) |
| POST   | `/api/v1/auth/logout-all`                       | JWT   | Revoke all tokens     |
| GET    | `/api/v1/users/me`                              | JWT   | Current user profile  |
| PATCH  | `/api/v1/users/me`                              | JWT   | Update display name   |
| POST   | `/api/v1/users/me/password`                     | JWT   | Change password       |
| POST   | `/api/v1/users/me/deactivate`                   | JWT   | Self-deactivate       |
| GET    | `/api/v1/admin/users`                           | Admin | List/search users     |
| POST   | `/api/v1/admin/users/{id}/disable`              | Admin | Disable user          |
| POST   | `/api/v1/admin/users/{id}/enable`               | Admin | Enable user           |
| POST   | `/api/v1/admin/users/{id}/unlock`               | Admin | Unlock locked account |
| POST   | `/api/v1/admin/users/{id}/force-password-reset` | Admin | Generate reset token  |
| POST   | `/api/v1/expenses`                              | JWT   | Create expense        |
| GET    | `/api/v1/expenses`                              | JWT   | List expenses         |
| GET    | `/api/v1/expenses/{id}`                         | JWT   | Get expense           |
| PUT    | `/api/v1/expenses/{id}`                         | JWT   | Update expense        |
| DELETE | `/api/v1/expenses/{id}`                         | JWT   | Delete expense        |
| GET    | `/api/v1/expenses/summary`                      | JWT   | Summary by currency   |
| POST   | `/api/v1/expenses/{id}/attachments`             | JWT   | Upload attachment     |
| GET    | `/api/v1/expenses/{id}/attachments`             | JWT   | List attachments      |
| DELETE | `/api/v1/expenses/{id}/attachments/{aid}`       | JWT   | Delete attachment     |
| GET    | `/api/v1/reports/pl`                            | JWT   | P&L report            |
| GET    | `/api/v1/tokens/claims`                         | JWT   | Decode JWT claims     |
| GET    | `/.well-known/jwks.json`                        | No    | JWKS endpoint         |

## Architecture

The application uses Effect TS throughout:

- **Routes**: `HttpRouter` handlers returning `Effect` values
- **Services**: `Context.Tag` services with `Layer` composition
- **Database**: `@effect/sql` with SQLite (unit BDD / local dev) or PostgreSQL (integration)
- **Errors**: `Data.TaggedError` domain errors mapped to HTTP responses
- **Tests**: Three-level strategy — unit (Vitest), unit BDD (Cucumber+SQLite), integration (Cucumber+PostgreSQL+Docker)

## Related

- [specs/apps/demo/be/](../../specs/apps/demo/be/) — shared Gherkin specifications
- [apps/demo-be-e2e/](../demo-be-e2e/) — Playwright E2E test suite
- [infra/dev/demo-be-ts-effect/](../../infra/dev/demo-be-ts-effect/) — Docker Compose dev environment
