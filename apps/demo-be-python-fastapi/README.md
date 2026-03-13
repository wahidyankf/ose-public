# demo-be-python-fastapi

Python/FastAPI implementation of the demo backend REST API — a functional twin of `demo-be-java-springboot`,
`demo-be-elixir-phoenix`, and `demo-be-fsharp-giraffe`.

## Tech Stack

| Concern          | Choice                                                         |
| ---------------- | -------------------------------------------------------------- |
| Language         | Python 3.13+                                                   |
| Web framework    | FastAPI (Uvicorn)                                              |
| Database ORM     | SQLAlchemy 2.0+ (PostgreSQL prod / SQLite in-memory for tests) |
| JWT              | PyJWT                                                          |
| Password hashing | bcrypt                                                         |
| BDD tests        | pytest-bdd (Gherkin feature files)                             |
| Linting          | Ruff                                                           |
| Type checking    | Pyright                                                        |
| Coverage         | coverage.py + LCOV                                             |
| Port             | **8201**                                                       |
| Package manager  | uv                                                             |

## Local Development

### Prerequisites

- Python 3.13+
- [uv](https://github.com/astral-sh/uv) (`pip install uv` or `curl -LsSf https://astral.sh/uv/install.sh | sh`)

### Setup

```bash
cd apps/demo-be-python-fastapi
uv sync
```

### Environment Variables

| Variable                    | Default                  | Description                           |
| --------------------------- | ------------------------ | ------------------------------------- |
| `DATABASE_URL`              | `sqlite:///:memory:`     | SQLAlchemy database URL               |
| `APP_JWT_SECRET`            | dev default              | Secret for JWT signing (min 32 chars) |
| `APP_JWT_ISSUER`            | `demo-be-python-fastapi` | JWT issuer claim                      |
| `MAX_FAILED_LOGIN_ATTEMPTS` | `5`                      | Login attempts before account lock    |

Create a `.env` file or export these variables before running.

### Start Dev Server

```bash
uv run uvicorn demo_be_python_fastapi.main:app --reload --port 8201
```

Or via Nx:

```bash
nx dev demo-be-python-fastapi
```

### With Docker Compose (PostgreSQL)

```bash
cd infra/dev/demo-be-python-fastapi
docker compose up --build
```

## Nx Targets

| Target                                           | Description                                              |
| ------------------------------------------------ | -------------------------------------------------------- |
| `nx build demo-be-python-fastapi`                | Build distributable wheel                                |
| `nx dev demo-be-python-fastapi`                  | Start dev server with reload                             |
| `nx start demo-be-python-fastapi`                | Start production server                                  |
| `nx run demo-be-python-fastapi:test:quick`       | Unit tests + coverage check (no lint, no integration)    |
| `nx run demo-be-python-fastapi:test:unit`        | Unit tests only (SQLite in-memory, no external services) |
| `nx run demo-be-python-fastapi:test:integration` | Integration tests via Docker Compose (real PostgreSQL)   |
| `nx lint demo-be-python-fastapi`                 | Ruff lint check                                          |
| `nx run demo-be-python-fastapi:typecheck`        | Pyright type check                                       |

## Three-Level Test Architecture

This project follows a three-level test strategy that separates concerns by execution context:

### Level 1: Unit tests (`pytest -m unit`)

- Location: `tests/unit/` (pure function tests) and `tests/unit/steps/` (BDD step definitions)
- Database: SQLite shared-cache in-memory (no external services required)
- Coverage: Measures ≥90% line coverage from unit tests alone
- Includes all 76 Gherkin scenarios via pytest-bdd with `TestClient` + SQLite override
- Fast, fully deterministic, safe to cache

### Level 2: Integration tests (`pytest -m integration`, local)

- Location: `tests/integration/steps/`
- Database: SQLite shared-cache in-memory (same as unit level, but for clarity)
- Includes all 76 Gherkin scenarios via pytest-bdd with `TestClient` + SQLite override
- Identical functional coverage to level 1; distinguishes test intent

### Level 3: Docker integration tests (`nx run demo-be-python-fastapi:test:integration`)

- Runs `tests/integration/` step definitions via Docker Compose
- Database: Real PostgreSQL 17-alpine service
- Tests the full stack including real SQL dialect behavior, ACID transactions, and
  PostgreSQL-specific constraints
- Not cached (`cache: false`)

### Running Tests

```bash
# Fast quality gate (unit tests + coverage) — run by pre-push hook
nx run demo-be-python-fastapi:test:quick

# Unit tests only
nx run demo-be-python-fastapi:test:unit

# Full Docker integration tests (requires Docker)
nx run demo-be-python-fastapi:test:integration

# Run unit tests directly
cd apps/demo-be-python-fastapi
uv run pytest -m unit

# Run with coverage
uv run coverage run -m pytest -m unit
uv run coverage lcov -o coverage/lcov.info
```

## API Endpoints

| Method | Path                                            | Auth  | Description           |
| ------ | ----------------------------------------------- | ----- | --------------------- |
| GET    | `/health`                                       | No    | Health check          |
| POST   | `/api/v1/auth/register`                         | No    | Register new user     |
| POST   | `/api/v1/auth/login`                            | No    | Login, return JWT     |
| POST   | `/api/v1/auth/refresh`                          | No    | Refresh access token  |
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
| GET    | `/api/v1/expenses/summary`                      | JWT   | Summary by currency   |
| GET    | `/api/v1/expenses/{id}`                         | JWT   | Get expense           |
| PUT    | `/api/v1/expenses/{id}`                         | JWT   | Update expense        |
| DELETE | `/api/v1/expenses/{id}`                         | JWT   | Delete expense        |
| POST   | `/api/v1/expenses/{id}/attachments`             | JWT   | Upload attachment     |
| GET    | `/api/v1/expenses/{id}/attachments`             | JWT   | List attachments      |
| DELETE | `/api/v1/expenses/{id}/attachments/{aid}`       | JWT   | Delete attachment     |
| GET    | `/api/v1/reports/pl`                            | JWT   | P&L report            |
| GET    | `/api/v1/tokens/claims`                         | JWT   | Decode JWT claims     |
| GET    | `/.well-known/jwks.json`                        | No    | JWKS endpoint         |

## Gherkin BDD Tests

Tests consume the shared `specs/apps/demo/be/gherkin/` feature files (76 scenarios across 13
features) using **pytest-bdd**.

Unit-level BDD tests (`tests/unit/steps/`) use `TestClient` backed by SQLite in-memory for fast,
deterministic execution without external services. Integration-level BDD tests
(`tests/integration/steps/`) use the same `TestClient` approach locally but run against a real
PostgreSQL instance in Docker.
