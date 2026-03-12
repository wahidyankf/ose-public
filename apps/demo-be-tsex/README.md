# demo-be-tsex

TypeScript/Effect REST API backend — a functional twin of `demo-be-jasb`, `demo-be-pyfa`,
`demo-be-rsax`, and others, using Node.js, Vite, and Effect TS.

**tsex** = **T**ype**S**cript + **E**ffect**X** — matching the suffix pattern of other demo-be
variants.

## Tech Stack

| Concern          | Choice                                    |
| ---------------- | ----------------------------------------- |
| Language         | TypeScript (strict)                       |
| Runtime          | Node.js (managed by Volta)                |
| Build            | Vite (library mode for server build)      |
| Web framework    | `@effect/platform` Node.js HTTP server    |
| Database         | `@effect/sql` + `@effect/sql-sqlite-node` |
| JWT              | `jose` library                            |
| Password hashing | `bcrypt`                                  |
| BDD tests        | Cucumber.js                               |
| Linting          | oxlint                                    |
| Coverage         | Vitest v8 → LCOV → rhino-cli              |
| Port             | **8201**                                  |

## Nx Targets

```bash
nx dev demo-be-tsex                      # Start dev server with tsx watch
nx build demo-be-tsex                    # Build with Vite
nx start demo-be-tsex                    # Run built dist/main.js
nx run demo-be-tsex:test:quick           # Full quality gate (unit + coverage + typecheck + lint)
nx run demo-be-tsex:test:unit            # Unit tests only
nx run demo-be-tsex:test:integration     # Cucumber.js BDD integration tests
nx run demo-be-tsex:lint                 # oxlint
nx run demo-be-tsex:typecheck            # tsc --noEmit
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
cd apps/demo-be-tsex
npm install
DATABASE_URL=sqlite::memory: npx tsx src/main.ts
```

### Docker Compose

```bash
cd infra/dev/demo-be-tsex
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
- **Database**: `@effect/sql` with SQLite (tests) or PostgreSQL (production)
- **Errors**: `Data.TaggedError` domain errors mapped to HTTP responses
- **Tests**: In-process HTTP server with SQLite in-memory database

## Related

- [specs/apps/demo-be/](../../specs/apps/demo-be/) — shared Gherkin specifications
- [apps/demo-be-e2e/](../demo-be-e2e/) — Playwright E2E test suite
- [infra/dev/demo-be-tsex/](../../infra/dev/demo-be-tsex/) — Docker Compose dev environment
