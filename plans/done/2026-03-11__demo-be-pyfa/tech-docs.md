# Technical Design: demo-be-pyfa

## BDD Integration Tests: pytest-bdd

Integration tests parse the canonical `.feature` files in `specs/apps/demo-be/gherkin/` using
**pytest-bdd**, a pytest plugin that implements the Gherkin BDD syntax natively. pytest-bdd
discovers scenarios via `@scenario` decorators or bulk collection helpers in `conftest.py`.

HTTP calls use FastAPI's `TestClient` (in-process — no live server needed, matching
`demo-be-jasb`'s MockMvc approach). The database layer uses SQLAlchemy bound to a SQLite
in-memory engine for full isolation and determinism.

Step definitions follow pytest-bdd conventions using `@given`, `@when`, and `@then` decorators
and pytest fixtures for shared state:

```python
# tests/integration/steps/health_steps.py
import pytest
from pytest_bdd import given, when, then
from fastapi.testclient import TestClient

@given("the API is running", target_fixture="client")
def api_is_running(test_client: TestClient) -> TestClient:
    return test_client

@when("an operations engineer sends GET /health", target_fixture="response")
def get_health(client: TestClient):
    return client.get("/health")

@then("the response status code should be 200")
def status_code_200(response):
    assert response.status_code == 200
```

### Feature File Path Resolution

Feature files are referenced from the `specs/apps/demo-be/gherkin/` workspace root. pytest-bdd
discovers feature files via absolute or relative paths passed to `@scenario` or
`scenarios()` helpers. A `conftest.py` at `tests/integration/` resolves the path using
`pathlib.Path`:

```python
# tests/integration/conftest.py
import pathlib

GHERKIN_ROOT = pathlib.Path(__file__).parents[3] / "specs" / "apps" / "demo-be" / "gherkin"
```

Each step module uses `scenarios()` bulk-import with the resolved path:

```python
from pytest_bdd import scenarios
from tests.integration.conftest import GHERKIN_ROOT

scenarios(str(GHERKIN_ROOT / "health" / "health-check.feature"))
```

---

## Application Architecture

### Project Structure

```
apps/demo-be-pyfa/
├── src/
│   └── demo_be_pyfa/
│       ├── __init__.py
│       ├── main.py                     # FastAPI app factory + lifespan
│       ├── config.py                   # Settings via pydantic-settings
│       ├── database.py                 # SQLAlchemy engine + session factory
│       ├── dependencies.py             # FastAPI Depends() providers
│       ├── domain/
│       │   ├── __init__.py
│       │   ├── types.py                # Enums: Currency, Role, UserStatus
│       │   ├── errors.py               # Domain error hierarchy
│       │   ├── user.py                 # User entity + validation functions
│       │   ├── expense.py              # Expense entity + currency precision
│       │   └── attachment.py           # Attachment entity
│       ├── infrastructure/
│       │   ├── __init__.py
│       │   ├── models.py               # SQLAlchemy ORM models
│       │   ├── repositories.py         # SQLAlchemy repository implementations
│       │   ├── in_memory/
│       │   │   ├── __init__.py
│       │   │   └── repositories.py     # Dict-based in-memory repositories (tests)
│       │   └── password_hasher.py      # passlib/bcrypt wrapper
│       ├── auth/
│       │   ├── __init__.py
│       │   ├── jwt_service.py          # JWT generation + validation
│       │   └── dependencies.py         # get_current_user, require_admin Depends()
│       └── routers/
│           ├── __init__.py
│           ├── health.py               # GET /health
│           ├── auth.py                 # register, login, refresh, logout
│           ├── users.py                # profile, password, deactivate
│           ├── admin.py                # user management
│           ├── expenses.py             # CRUD + summary
│           ├── reports.py              # P&L
│           ├── attachments.py          # file upload/list/delete
│           └── tokens.py              # claims, JWKS
├── tests/
│   ├── __init__.py
│   ├── conftest.py                     # pytest fixtures: app factory, test_client
│   ├── unit/
│   │   ├── __init__.py
│   │   ├── test_user_validation.py     # Password, email, username validation
│   │   ├── test_currency.py            # Decimal precision validation
│   │   └── test_password_hasher.py     # bcrypt wrapper tests
│   └── integration/
│       ├── __init__.py
│       ├── conftest.py                 # GHERKIN_ROOT path + shared fixtures
│       └── steps/
│           ├── __init__.py
│           ├── common_steps.py         # Shared: status code, API running
│           ├── auth_steps.py           # Register, login
│           ├── token_lifecycle_steps.py
│           ├── user_account_steps.py
│           ├── security_steps.py
│           ├── token_management_steps.py
│           ├── admin_steps.py
│           ├── expense_steps.py
│           ├── currency_steps.py
│           ├── unit_handling_steps.py
│           ├── reporting_steps.py
│           └── attachment_steps.py
├── pyproject.toml                      # uv, ruff, pyright, pytest config
├── .python-version                     # Pin Python 3.13
├── project.json                        # Nx targets
└── README.md
```

### Python Package Layout Notes

The `src/` layout (also called "src layout") isolates the importable package from the project
root, preventing accidental imports of uninstalled code during tests. uv installs the package
in editable mode (`uv pip install -e .`) so tests import `demo_be_pyfa` correctly.

---

## Key Design Decisions

### FastAPI Router Composition

All routes use FastAPI's `APIRouter` with prefix-based organisation:

```python
# src/demo_be_pyfa/main.py
from fastapi import FastAPI
from demo_be_pyfa.routers import health, auth, users, admin, expenses, reports, attachments, tokens

def create_app() -> FastAPI:
    app = FastAPI(title="demo-be-pyfa")

    app.include_router(health.router)
    app.include_router(auth.router, prefix="/api/v1/auth")
    app.include_router(users.router, prefix="/api/v1/users")
    app.include_router(admin.router, prefix="/api/v1/admin")
    app.include_router(expenses.router, prefix="/api/v1/expenses")
    app.include_router(reports.router, prefix="/api/v1/reports")
    app.include_router(attachments.router, prefix="/api/v1/expenses")
    app.include_router(tokens.router, prefix="/api/v1/tokens")

    return app
```

### Dependency Injection via FastAPI `Depends()`

Repositories are injected via FastAPI's dependency system, allowing test overrides without
monkey-patching:

```python
# src/demo_be_pyfa/dependencies.py
from typing import Generator
from sqlalchemy.orm import Session
from demo_be_pyfa.database import SessionLocal
from demo_be_pyfa.infrastructure.repositories import UserRepository

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_user_repo(db: Session = Depends(get_db)) -> UserRepository:
    return UserRepository(db)
```

Integration tests override `get_db` with an in-memory SQLite session:

```python
# tests/conftest.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from demo_be_pyfa.dependencies import get_db
from demo_be_pyfa.infrastructure.models import Base

@pytest.fixture(scope="function")
def test_client():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    TestingSessionLocal = sessionmaker(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app = create_app()
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client:
        yield client
    Base.metadata.drop_all(engine)
```

### Pydantic Models for Request/Response Validation

All request bodies and response shapes use Pydantic v2 models:

```python
# src/demo_be_pyfa/routers/auth.py
from pydantic import BaseModel, EmailStr

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    display_name: str | None = None

class RegisterResponse(BaseModel):
    id: str
    username: str
    email: str
    display_name: str | None
```

FastAPI automatically validates incoming JSON against these models and returns 422 Unprocessable
Entity with field-level detail on validation failure.

### Domain Error Handling

Domain operations raise typed exceptions that a global exception handler converts to HTTP
responses:

```python
# src/demo_be_pyfa/domain/errors.py
class DomainError(Exception):
    pass

class ValidationError(DomainError):
    def __init__(self, field: str, message: str):
        self.field = field
        self.message = message

class NotFoundError(DomainError):
    pass

class ForbiddenError(DomainError):
    pass

class ConflictError(DomainError):
    pass

class UnauthorizedError(DomainError):
    pass

class FileTooLargeError(DomainError):
    pass

class UnsupportedMediaTypeError(DomainError):
    pass
```

```python
# src/demo_be_pyfa/main.py
from fastapi import Request
from fastapi.responses import JSONResponse
from demo_be_pyfa.domain.errors import (
    ValidationError, NotFoundError, ForbiddenError,
    ConflictError, UnauthorizedError, FileTooLargeError, UnsupportedMediaTypeError,
)

@app.exception_handler(ValidationError)
async def validation_error_handler(request: Request, exc: ValidationError):
    return JSONResponse(status_code=400, content={"message": exc.message})

@app.exception_handler(NotFoundError)
async def not_found_handler(request: Request, exc: NotFoundError):
    return JSONResponse(status_code=404, content={"message": "Not found"})

@app.exception_handler(ForbiddenError)
async def forbidden_handler(request: Request, exc: ForbiddenError):
    return JSONResponse(status_code=403, content={"message": str(exc)})

@app.exception_handler(ConflictError)
async def conflict_handler(request: Request, exc: ConflictError):
    return JSONResponse(status_code=409, content={"message": str(exc)})

@app.exception_handler(UnauthorizedError)
async def unauthorized_handler(request: Request, exc: UnauthorizedError):
    return JSONResponse(status_code=401, content={"message": str(exc)})

@app.exception_handler(FileTooLargeError)
async def file_too_large_handler(request: Request, exc: FileTooLargeError):
    return JSONResponse(status_code=413, content={"message": "File size exceeds the maximum allowed limit"})

@app.exception_handler(UnsupportedMediaTypeError)
async def unsupported_media_type_handler(request: Request, exc: UnsupportedMediaTypeError):
    return JSONResponse(status_code=415, content={"message": "Unsupported media type"})
```

### Database: SQLAlchemy 2.0 with PostgreSQL

Production uses PostgreSQL via the `psycopg2` or `asyncpg` driver. Integration tests use
SQLite in-memory for isolation:

```python
# src/demo_be_pyfa/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from demo_be_pyfa.config import settings

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
```

The synchronous SQLAlchemy API is used throughout for simplicity — FastAPI's `TestClient` runs
synchronously, and the integration test pattern matches the other demo-be implementations.

### JWT Strategy

RSA-256 or HMAC-SHA256 signing using PyJWT. Access tokens (short-lived) and refresh tokens
(long-lived) follow the same scheme as all other demo-be implementations:

- Access token: 15 minutes
- Refresh token: 7 days
- Secret from `APP_JWT_SECRET` environment variable
- Claims: `sub` (user ID), `username`, `role`, `exp`, `iat`, `jti`

```python
# src/demo_be_pyfa/auth/jwt_service.py
import jwt
from datetime import datetime, timedelta, timezone
from uuid import uuid4

def create_access_token(user_id: str, username: str, role: str, secret: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "username": username,
        "role": role,
        "iat": now,
        "exp": now + timedelta(minutes=15),
        "jti": str(uuid4()),
    }
    return jwt.encode(payload, secret, algorithm="HS256")
```

### Currency Precision

Amounts stored as `Decimal` with currency-specific precision enforced at the domain level:

```python
# src/demo_be_pyfa/domain/expense.py
from decimal import Decimal, ROUND_DOWN
from demo_be_pyfa.domain.errors import ValidationError

CURRENCY_DECIMALS: dict[str, int] = {
    "USD": 2,
    "IDR": 0,
}

def validate_amount(currency: str, amount: Decimal) -> Decimal:
    if currency.upper() not in CURRENCY_DECIMALS:
        raise ValidationError("currency", f"Unsupported currency: {currency}")
    if amount < 0:
        raise ValidationError("amount", "Amount must not be negative")
    places = CURRENCY_DECIMALS[currency.upper()]
    quantized = amount.quantize(Decimal(10) ** -places)
    if quantized != amount:
        raise ValidationError("amount", f"{currency} requires {places} decimal places")
    return amount
```

---

## Nx Targets (`project.json`)

```json
{
  "name": "demo-be-pyfa",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "apps/demo-be-pyfa/src",
  "projectType": "application",
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "uv build",
        "cwd": "apps/demo-be-pyfa"
      },
      "outputs": ["{projectRoot}/dist"]
    },
    "dev": {
      "executor": "nx:run-commands",
      "options": {
        "command": "uv run uvicorn demo_be_pyfa.main:app --reload --port 8201",
        "cwd": "apps/demo-be-pyfa"
      }
    },
    "start": {
      "executor": "nx:run-commands",
      "options": {
        "command": "uv run uvicorn demo_be_pyfa.main:app --port 8201",
        "cwd": "apps/demo-be-pyfa"
      }
    },
    "test:quick": {
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "uv run coverage run -m pytest",
          "uv run coverage lcov -o coverage/lcov.info",
          "(cd ../../ && apps/rhino-cli/rhino-cli test-coverage validate apps/demo-be-pyfa/coverage/lcov.info 90)",
          "uv run ruff format --check .",
          "uv run ruff check .",
          "uv run pyright"
        ],
        "parallel": false,
        "cwd": "apps/demo-be-pyfa"
      }
    },
    "test:unit": {
      "executor": "nx:run-commands",
      "options": {
        "command": "uv run pytest -m unit",
        "cwd": "apps/demo-be-pyfa"
      }
    },
    "test:integration": {
      "executor": "nx:run-commands",
      "options": {
        "command": "uv run pytest -m integration",
        "cwd": "apps/demo-be-pyfa"
      },
      "cache": true,
      "inputs": [
        "{projectRoot}/src/**/*.py",
        "{projectRoot}/tests/**/*.py",
        "{workspaceRoot}/specs/apps/demo-be/gherkin/**/*.feature"
      ]
    },
    "lint": {
      "executor": "nx:run-commands",
      "options": {
        "command": "uv run ruff check .",
        "cwd": "apps/demo-be-pyfa"
      }
    },
    "typecheck": {
      "executor": "nx:run-commands",
      "options": {
        "command": "uv run pyright",
        "cwd": "apps/demo-be-pyfa"
      }
    }
  },
  "tags": ["type:app", "platform:fastapi", "lang:python", "domain:demo-be"],
  "implicitDependencies": ["rhino-cli"]
}
```

> **Note on `test:quick`**: Sequential execution (`parallel: false`) is required because
> coverage collection must finish before `rhino-cli` validates the LCOV output. Ruff format
> check, Ruff lint, and Pyright run after tests to avoid masking test failures.
>
> **Note on `test:integration` caching**: Integration tests use FastAPI `TestClient` with
> SQLAlchemy SQLite in-memory — no external services. Fully deterministic and safe to cache.

---

## pyproject.toml Configuration

```toml
[project]
name = "demo-be-pyfa"
version = "0.1.0"
description = "Python/FastAPI demo backend"
requires-python = ">=3.13"
dependencies = [
    "fastapi[standard]>=0.115",
    "uvicorn[standard]>=0.32",
    "sqlalchemy>=2.0",
    "psycopg2-binary>=2.9",
    "pyjwt>=2.9",
    "passlib[bcrypt]>=1.7",
    "pydantic[email]>=2.9",
    "pydantic-settings>=2.6",
    "python-multipart>=0.0.12",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.3",
    "pytest-bdd>=7.3",
    "coverage[toml]>=7.6",
    "httpx>=0.27",
    "ruff>=0.8",
    "pyright>=1.1",
]

[tool.uv]
dev-dependencies = ["demo-be-pyfa[dev]"]

[tool.pytest.ini_options]
testpaths = ["tests"]
markers = [
    "unit: unit tests",
    "integration: BDD integration tests",
]

[tool.coverage.run]
source = ["src/demo_be_pyfa"]
omit = ["tests/*"]

[tool.coverage.report]
show_missing = true

[tool.ruff]
src = ["src"]
line-length = 100

[tool.ruff.lint]
select = ["E", "F", "I", "N", "UP", "ANN", "S", "B", "A", "C4", "PT"]
ignore = ["ANN101", "ANN102"]

[tool.pyright]
include = ["src", "tests"]
pythonVersion = "3.13"
typeCheckingMode = "strict"
venvPath = "."
venv = ".venv"
```

---

## Infrastructure

### Port Assignment

| Service      | Port                                               |
| ------------ | -------------------------------------------------- |
| demo-be-db   | 5432                                               |
| demo-be-jasb | 8201                                               |
| demo-be-exph | 8201 (same port — mutually exclusive alternatives) |
| demo-be-fsgi | 8201 (same port — mutually exclusive alternatives) |
| demo-be-pyfa | 8201 (same port — mutually exclusive alternatives) |

### Docker Compose (`infra/dev/demo-be-pyfa/docker-compose.yml`)

```yaml
services:
  demo-be-db:
    image: postgres:17-alpine
    container_name: demo-be-db
    environment:
      POSTGRES_DB: demo_be_pyfa
      POSTGRES_USER: demo_be_pyfa
      POSTGRES_PASSWORD: demo_be_pyfa
    ports:
      - "5432:5432"
    volumes:
      - demo-be-pyfa-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U demo_be_pyfa"]
      interval: 5s
      timeout: 3s
      retries: 5
    networks:
      - demo-be-pyfa-network

  demo-be-pyfa:
    build:
      context: .
      dockerfile: Dockerfile.be.dev
    container_name: demo-be-pyfa
    ports:
      - "8201:8201"
    environment:
      - DATABASE_URL=postgresql://demo_be_pyfa:demo_be_pyfa@demo-be-db:5432/demo_be_pyfa
      - APP_JWT_SECRET=dev-jwt-secret-at-least-32-chars-long
    volumes:
      - ../../../apps/demo-be-pyfa:/workspace:rw
    depends_on:
      demo-be-db:
        condition: service_healthy
    networks:
      - demo-be-pyfa-network

volumes:
  demo-be-pyfa-db-data:

networks:
  demo-be-pyfa-network:
```

### Dockerfile.be.dev

```dockerfile
FROM python:3.13-slim

RUN pip install uv

WORKDIR /workspace

COPY pyproject.toml ./
RUN uv sync

CMD ["uv", "run", "uvicorn", "demo_be_pyfa.main:app", "--host", "0.0.0.0", "--port", "8201", "--reload"]
```

---

## GitHub Actions

### New Workflow: `e2e-demo-be-pyfa.yml`

Mirrors `e2e-demo-be-jasb.yml` with:

- Name: `E2E - Demo BE (PYFA)`
- Schedule: same crons as jasb/exph/fsgi
- Job: checkout → docker compose up → wait-healthy → Volta → npm ci →
  `nx run demo-be-e2e:test:e2e` with `BASE_URL=http://localhost:8201` →
  upload artifact `playwright-report-be-pyfa` → docker down (always)

### Updated Workflow: `main-ci.yml`

Add after existing .NET setup:

```yaml
- name: Setup Python
  uses: actions/setup-python@v5
  with:
    python-version: "3.13"

- name: Install uv
  run: pip install uv

- name: Upload coverage — demo-be-pyfa
  uses: codecov/codecov-action@v5
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
    files: apps/demo-be-pyfa/coverage/lcov.info
    flags: demo-be-pyfa
    fail_ci_if_error: false
```

---

## lint-staged Integration

Add Python formatting to `package.json` lint-staged using a bash wrapper (same pattern as the
F# fantomas integration for `demo-be-fsgi`):

```json
"*.py": [
  "bash -c 'cd apps/demo-be-pyfa && uv run ruff format \"$@\"' --"
]
```

---

## Dependencies Summary

### Python Packages (pyproject.toml — runtime)

| Package              | Purpose                                        |
| -------------------- | ---------------------------------------------- |
| fastapi[standard]    | Web framework with OpenAPI auto-docs           |
| uvicorn[standard]    | ASGI server                                    |
| sqlalchemy           | ORM (synchronous 2.0 API)                      |
| psycopg2-binary      | PostgreSQL driver for SQLAlchemy               |
| pyjwt                | JWT encoding/decoding                          |
| passlib[bcrypt]      | Password hashing                               |
| pydantic[email]      | Request/response validation (with EmailStr)    |
| pydantic-settings    | Settings management from env vars              |
| python-multipart     | File upload form data parsing                  |

### Python Packages (pyproject.toml — dev)

| Package   | Purpose                                   |
| --------- | ----------------------------------------- |
| pytest    | Test runner                               |
| pytest-bdd| Gherkin BDD plugin for pytest             |
| coverage  | Code coverage with LCOV output            |
| httpx     | Required by FastAPI TestClient            |
| ruff      | Linting and formatting (replaces Black)   |
| pyright   | Static type checker (strict mode)         |
