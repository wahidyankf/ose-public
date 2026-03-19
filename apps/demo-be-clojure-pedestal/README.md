# demo-be-clojure-pedestal

A Clojure/Pedestal REST API backend implementing the OrganicLever expense tracking API. This is a
functional twin of the other demo-be implementations (Java/Spring Boot, Go/Gin, Elixir/Phoenix,
etc.) using the same Gherkin scenarios.

## Tech Stack

| Component       | Technology                       | Version  |
| --------------- | -------------------------------- | -------- |
| Language        | Clojure                          | 1.12.0   |
| Web Framework   | Pedestal                         | 0.7.2    |
| HTTP Server     | Jetty (via Pedestal)             | embedded |
| Database        | SQLite (dev) / PostgreSQL (prod) | -        |
| DB Access       | next.jdbc                        | 1.3.1093 |
| Connection Pool | HikariCP                         | 6.3.0    |
| JSON            | Cheshire                         | 6.0.0    |
| JWT             | buddy-sign                       | 3.6.1    |
| Password Hash   | buddy-hashers (bcrypt+sha512)    | 2.0.167  |
| Testing         | Kaocha + kaocha-cucumber         | 1.91     |
| Coverage        | Cloverage                        | 1.2.4    |
| Linting         | clj-kondo                        | -        |

## Local Development

### Prerequisites

- Java 21+
- Clojure CLI tools

### Start Development Server

```bash
nx dev demo-be-clojure-pedestal
```

The server starts on port **8201** by default.

### Environment Variables

| Variable         | Default                 | Description        |
| ---------------- | ----------------------- | ------------------ |
| `PORT`           | `8201`                  | HTTP server port   |
| `DATABASE_URL`   | `jdbc:sqlite::memory:`  | JDBC database URL  |
| `APP_JWT_SECRET` | `default-dev-secret...` | JWT signing secret |

For PostgreSQL:

```bash
export DATABASE_URL="jdbc:postgresql://localhost:5432/demo_be_cjpd"
export DB_USER="demo_be_cjpd"
export DB_PASSWORD="demo_be_cjpd"
```

### Run with Docker Compose

```bash
docker-compose up
```

## Test Architecture

The project uses a three-level test architecture aligned with the monorepo standard:

### Level 1: Unit tests (`test:unit`)

Pure clojure.test unit tests plus kaocha-cucumber BDD scenarios that run against an in-memory
SQLite database. No external services required.

- `test/demo_be_cjpd/**/*_test.clj` — clojure.test namespaces
- `test/features/**/*.feature` + `test/step_definitions/` — BDD scenarios (76 total)

The BDD step definitions start the Pedestal server in-process against a named in-memory SQLite
database (`:memory:` with shared cache), so all 76 Gherkin scenarios run without Docker.

### Level 2: Quick gate (`test:quick`)

Runs all unit-level tests (both `:unit` and `:bdd` kaocha suites) with cloverage LCOV output,
then validates ≥90% line coverage via `rhino-cli`. No lint. This is the pre-push gate.

```bash
nx run demo-be-clojure-pedestal:test:quick
```

### Level 3: Integration tests (`test:integration`)

Runs the BDD scenarios against a real PostgreSQL 17 database inside Docker. Uses
`docker-compose.integration.yml` + `Dockerfile.integration`.

```bash
nx run demo-be-clojure-pedestal:test:integration
```

This target is **not cached** (`cache: false`) because it exercises an external database service.

### Coverage

Coverage is measured via cloverage LCOV output (`coverage/lcov.info`) and validated by
`rhino-cli test-coverage validate` using the Codecov line-based algorithm. The threshold is ≥90%.
The `demo-be-cjpd.main` namespace is excluded from coverage (entry point only).

## Nx Targets

| Target             | Description                                             |
| ------------------ | ------------------------------------------------------- |
| `dev`              | Start development server (port 8201)                    |
| `codegen`          | Generate contract types from OpenAPI spec               |
| `build`            | Build uberjar via tools.build (depends on codegen)      |
| `start`            | Run the built uberjar                                   |
| `test:quick`       | Unit + BDD (in-memory) tests + coverage check (no lint) |
| `test:unit`        | Unit + BDD (in-memory) tests without coverage           |
| `test:integration` | BDD tests against PostgreSQL via docker-compose         |
| `lint`             | Run clj-kondo linting (`src` and `test`)                |
| `typecheck`        | Run clj-kondo on `src` only (depends on codegen)        |

```bash
nx run demo-be-clojure-pedestal:test:quick
nx run demo-be-clojure-pedestal:test:unit
nx run demo-be-clojure-pedestal:test:integration
nx build demo-be-clojure-pedestal
nx run demo-be-clojure-pedestal:typecheck
```

## API Endpoints

All endpoints follow the shared demo-be API contract:

| Method | Path                                           | Auth   | Description               |
| ------ | ---------------------------------------------- | ------ | ------------------------- |
| GET    | `/health`                                      | None   | Health check              |
| GET    | `/.well-known/jwks.json`                       | None   | JWKS public key document  |
| POST   | `/api/v1/auth/register`                        | None   | Register new user         |
| POST   | `/api/v1/auth/login`                           | None   | Login, returns token pair |
| POST   | `/api/v1/auth/refresh`                         | None   | Refresh access token      |
| POST   | `/api/v1/auth/logout`                          | None   | Revoke current session    |
| POST   | `/api/v1/auth/logout-all`                      | Bearer | Revoke all sessions       |
| GET    | `/api/v1/users/me`                             | Bearer | Get own profile           |
| PATCH  | `/api/v1/users/me`                             | Bearer | Update display name       |
| POST   | `/api/v1/users/me/password`                    | Bearer | Change password           |
| POST   | `/api/v1/users/me/deactivate`                  | Bearer | Self-deactivate account   |
| GET    | `/api/v1/admin/users`                          | Admin  | List users (paginated)    |
| POST   | `/api/v1/admin/users/:id/disable`              | Admin  | Disable user              |
| POST   | `/api/v1/admin/users/:id/enable`               | Admin  | Enable user               |
| POST   | `/api/v1/admin/users/:id/unlock`               | Admin  | Unlock locked user        |
| POST   | `/api/v1/admin/users/:id/force-password-reset` | Admin  | Generate reset token      |
| GET    | `/api/v1/expenses`                             | Bearer | List expenses (paginated) |
| POST   | `/api/v1/expenses`                             | Bearer | Create expense            |
| GET    | `/api/v1/expenses/summary`                     | Bearer | Summary by currency       |
| GET    | `/api/v1/expenses/:id`                         | Bearer | Get expense by ID         |
| PUT    | `/api/v1/expenses/:id`                         | Bearer | Update expense            |
| DELETE | `/api/v1/expenses/:id`                         | Bearer | Delete expense            |
| POST   | `/api/v1/expenses/:id/attachments`             | Bearer | Upload attachment         |
| GET    | `/api/v1/expenses/:id/attachments`             | Bearer | List attachments          |
| DELETE | `/api/v1/expenses/:id/attachments/:aid`        | Bearer | Delete attachment         |
| GET    | `/api/v1/reports/pl`                           | Bearer | P&L report                |
| GET    | `/api/v1/tokens/claims`                        | Bearer | Decode token claims       |

## Architecture

The application follows a functional layered architecture:

```
src/demo_be_cjpd/
├── config.clj           # Environment variable configuration
├── main.clj             # Entry point with -main
├── routes.clj           # Pedestal route table
├── server.clj           # Server creation and lifecycle
├── auth/
│   ├── jwt.clj          # JWT signing and verification
│   └── password.clj     # bcrypt password hashing
├── db/
│   ├── core.clj         # HikariCP datasource creation
│   ├── schema.clj       # DDL and schema creation
│   ├── user_repo.clj    # User CRUD
│   ├── token_repo.clj   # Token revocation
│   ├── expense_repo.clj # Expense CRUD and reports
│   └── attachment_repo.clj # Attachment storage
├── domain/
│   ├── user.clj         # User validation rules
│   ├── expense.clj      # Currency, unit, amount validation
│   └── attachment.clj   # File type and size validation
├── handlers/
│   ├── health.clj       # Health check
│   ├── auth.clj         # Register, login, refresh, logout
│   ├── user.clj         # Profile management
│   ├── admin.clj        # Admin user management
│   ├── expense.clj      # Expense CRUD
│   ├── attachment.clj   # File upload/download
│   ├── report.clj       # P&L reporting
│   ├── token.clj        # Token claims introspection
│   └── jwks.clj         # JWKS endpoint
└── interceptors/
    ├── json.clj          # JSON body parsing and response
    ├── auth.clj          # JWT authentication
    ├── admin.clj         # Admin role enforcement
    ├── error.clj         # Global error handling
    └── multipart.clj     # File upload parsing
```
