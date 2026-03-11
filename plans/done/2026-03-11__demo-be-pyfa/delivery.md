# Delivery Checklist: demo-be-pyfa

Execute phases in order. Each phase produces a working, committable state.

---

## Phase 0: Prerequisites

- [x] Verify Python 3.13+ available locally (`python3 --version` or via `uv python list`)
- [x] Verify `uv` available (`uv --version`); install if missing (`pip install uv` or
      `curl -LsSf https://astral.sh/uv/install.sh | sh`)
- [x] Verify `pyright` available globally or confirm it will be invoked via `uv run pyright`
- [x] Verify `ruff` available globally or confirm it will be invoked via `uv run ruff`
- [x] Verify `rhino-cli test-coverage validate` supports LCOV (it does — already used by
      `organiclever-web` and `demo-be-exph`)
- [x] Confirm `demo-be-e2e` Playwright config reads `BASE_URL` from env (it does)
- [x] Confirm pytest-bdd is compatible with the current Gherkin syntax in
      `specs/apps/demo-be/gherkin/` (Given/When/Then with doc_string and data table parameters)

---

## Phase 1: Project Scaffold

**Commit**: `feat(demo-be-pyfa): scaffold Python/FastAPI project`

- [x] Create `apps/demo-be-pyfa/` directory structure per tech-docs.md (src layout)
- [x] Create `.python-version` pinning Python 3.13
- [x] Create `pyproject.toml` with all runtime and dev dependencies per tech-docs.md
- [x] Run `uv sync` to create `.venv` and lock `uv.lock`
- [x] Create `src/demo_be_pyfa/__init__.py` and `src/demo_be_pyfa/main.py` with minimal
      FastAPI app that starts on port 8201 (no routes yet)
- [x] Create `src/demo_be_pyfa/config.py` using `pydantic-settings` to read `DATABASE_URL`
      and `APP_JWT_SECRET` from environment
- [x] Create `project.json` with all Nx targets from tech-docs.md
- [x] Add `README.md` covering local dev, Docker, env vars, API endpoints, Nx targets
- [x] Verify `uv run uvicorn demo_be_pyfa.main:app --port 8201` starts without error
- [x] Verify `uv run ruff format --check .` passes (no formatting violations)
- [x] Verify `uv run ruff check .` passes (no lint violations)
- [x] Verify `uv run pyright` passes (no type errors)
- [x] Commit

---

## Phase 2: Domain Types and Database

**Commit**: `feat(demo-be-pyfa): add domain types and SQLAlchemy database layer`

- [x] Create `src/demo_be_pyfa/domain/types.py` — Python `StrEnum` classes:
  `Currency` (USD, IDR), `Role` (USER, ADMIN), `UserStatus` (ACTIVE, INACTIVE, DISABLED, LOCKED)
- [x] Create `src/demo_be_pyfa/domain/errors.py` — typed exception hierarchy:
  `DomainError`, `ValidationError`, `NotFoundError`, `ForbiddenError`,
  `ConflictError`, `UnauthorizedError`, `FileTooLargeError`, `UnsupportedMediaTypeError`
- [x] Create `src/demo_be_pyfa/domain/user.py` — `User` dataclass with validation functions
  (`validate_password_strength`, `validate_email_format`, `validate_username`)
- [x] Create `src/demo_be_pyfa/domain/expense.py` — `Expense` dataclass with
  `validate_amount(currency, amount)` enforcing decimal precision per currency
- [x] Create `src/demo_be_pyfa/domain/attachment.py` — `Attachment` dataclass
- [x] Create `src/demo_be_pyfa/infrastructure/models.py` — SQLAlchemy ORM models:
  `UserModel`, `ExpenseModel`, `AttachmentModel`, `RevokedTokenModel`
- [x] Create `src/demo_be_pyfa/database.py` — engine + `SessionLocal` factory
- [x] Create `src/demo_be_pyfa/infrastructure/password_hasher.py` — direct bcrypt (not passlib,
  due to bcrypt 5.x incompatibility) with `hash_password` and `verify_password`
- [x] Write unit tests in `tests/unit/` for:
  - `test_user_validation.py`: password strength (min 12 chars, uppercase, special char),
    email format, username uniqueness enforcement (pure function tests)
  - `test_currency.py`: USD 2dp enforcement, IDR 0dp enforcement, unsupported currency,
    negative amount rejection
  - `test_password_hasher.py`: hash/verify roundtrip, wrong password returns False
- [x] Mark all unit tests with `@pytest.mark.unit`
- [x] Verify `uv run pytest -m unit` passes
- [x] Verify `uv run pyright` still passes
- [x] Commit

---

## Phase 3: Health Endpoint

**Commit**: `feat(demo-be-pyfa): add /health endpoint`

- [x] Create `src/demo_be_pyfa/routers/health.py` with `GET /health` returning
  `{"status": "UP"}` (public, no auth)
- [x] Register health router in `main.py` (no prefix)
- [x] Register domain error exception handlers in `main.py` per tech-docs.md
- [x] Create `tests/conftest.py` with `test_client` fixture:
  - Creates SQLite shared-cache in-memory engine
    (`sqlite:///file:testdb?mode=memory&cache=shared&uri=true`)
  - Runs `Base.metadata.create_all(engine)`
  - Overrides `get_db` dependency via `app.dependency_overrides`
  - Yields `TestClient(app)` and drops tables on teardown
- [x] Create `tests/integration/conftest.py` with `GHERKIN_ROOT` path resolution and all
  shared step definitions
- [x] Create `tests/integration/steps/health_steps.py` consuming `health-check.feature`
  (2 scenarios)
- [x] Mark integration tests with `@pytest.mark.integration`
- [x] Verify `uv run pytest -m integration` passes — 2 scenarios
- [x] Commit

---

## Phase 4: Auth — Register and Login

**Commit**: `feat(demo-be-pyfa): add register and login endpoints`

- [x] Create `src/demo_be_pyfa/auth/jwt_service.py`:
  - `create_access_token(user_id, username, role, secret) -> str`
  - `create_refresh_token(user_id, secret) -> str`
  - `decode_token(token, secret) -> dict`
- [x] Create `src/demo_be_pyfa/auth/dependencies.py`:
  - `get_current_user(token: str = Depends(oauth2_scheme), db = Depends(get_db)) -> UserModel`
    raises `UnauthorizedError` if token invalid or revoked
  - `require_admin(current_user = Depends(get_current_user)) -> UserModel`
    raises `ForbiddenError` if not admin
- [x] Create `src/demo_be_pyfa/infrastructure/repositories.py` with `UserRepository`:
  - `create(username, email, password_hash, display_name) -> UserModel`
  - `find_by_username(username) -> UserModel | None`
  - `find_by_id(user_id) -> UserModel | None`
- [x] Create `src/demo_be_pyfa/routers/auth.py`:
  - `POST /api/v1/auth/register` → 201 `{id, username, email, display_name}`
    (validates password strength; returns 409 on duplicate username)
  - `POST /api/v1/auth/login` → 200 `{access_token, refresh_token, token_type: "Bearer"}`
    (raises 401 on wrong password, 401 on INACTIVE status, 423 on LOCKED)
- [x] Create `src/demo_be_pyfa/dependencies.py` with `get_db` and repository providers
- [x] Write integration steps in `tests/integration/steps/auth_steps.py` consuming
  `registration.feature` (6 scenarios) and `password-login.feature` (5 scenarios)
- [x] Verify `uv run pytest -m integration` passes — 13 scenarios
- [x] Verify `uv run pyright` passes
- [x] Commit

---

## Phase 5: Token Lifecycle and Management

**Commit**: `feat(demo-be-pyfa): add token lifecycle and management endpoints`

- [x] Add `RevokedTokenRepository` to `repositories.py`:
  - `revoke(jti: str) -> None` — idempotent (checks before INSERT)
  - `is_revoked(jti: str) -> bool`
  - `revoke_all_for_user(user_id: str) -> None`
- [x] Extend `auth.py` router:
  - `POST /api/v1/auth/refresh` — checks user status FIRST (before revocation check), then
    issues new pair, revokes old refresh jti (rotation); raises 401 if user inactive
  - `POST /api/v1/auth/logout` — revoke current access token jti (idempotent: 200 even if
    already revoked); public route (accepts token in Authorization header)
  - `POST /api/v1/auth/logout-all` — protected by JWT auth; revokes all tokens for user
- [x] Create `src/demo_be_pyfa/routers/tokens.py`:
  - `GET /api/v1/tokens/claims` — decode and return JWT claims (protected)
  - `GET /.well-known/jwks.json` — return JWKS public key info (public)
- [x] Wire new routers in `main.py`
- [x] Write integration steps in `tests/integration/steps/token_lifecycle_steps.py`
  consuming `token-lifecycle.feature` (7 scenarios) and
  `tests/integration/steps/token_management_steps.py` consuming `tokens.feature` (6 scenarios)
- [x] Verify `uv run pytest -m integration` passes — 26 scenarios
- [x] Commit

---

## Phase 6: User Account and Security

**Commit**: `feat(demo-be-pyfa): add user account and security endpoints`

- [x] Create `src/demo_be_pyfa/routers/users.py`:
  - `GET /api/v1/users/me` — return `{id, username, email, display_name, status}` (protected)
  - `PATCH /api/v1/users/me` — update `display_name` field (protected)
  - `POST /api/v1/users/me/password` — verify old password, hash new, update (protected);
    raises 400 on incorrect old password
  - `POST /api/v1/users/me/deactivate` — set status to INACTIVE, revoke all tokens (protected)
- [x] Implement account lockout in login logic:
  - Track `failed_login_attempts` counter on `UserModel`
  - After configurable threshold (e.g. 5), set status to LOCKED
  - Reset counter on successful login
- [x] Write integration steps in `tests/integration/steps/user_account_steps.py`
  consuming `user-account.feature` (6 scenarios) and
  `tests/integration/steps/security_steps.py` consuming `security.feature` (5 scenarios)
- [x] Verify `uv run pytest -m integration` passes — 37 scenarios
- [x] Verify `uv run pyright` passes
- [x] Commit

---

## Phase 7: Admin

**Commit**: `feat(demo-be-pyfa): add admin endpoints`

- [x] Create `src/demo_be_pyfa/routers/admin.py`:
  - `GET /api/v1/admin/users` — paginated list with optional `email` query filter
    (protected + admin role); returns `{items: [...], total, page, size}`
  - `POST /api/v1/admin/users/{id}/disable` — set status to DISABLED (admin only)
  - `POST /api/v1/admin/users/{id}/enable` — set status to ACTIVE (admin only)
  - `POST /api/v1/admin/users/{id}/unlock` — set status to ACTIVE, reset failed attempts
    (admin only)
  - `POST /api/v1/admin/users/{id}/force-password-reset` — generate and return one-time
    reset token (admin only)
- [x] Add `AdminUserRepository` methods: `list_users(page, size, email_filter)`,
  `set_status(user_id, status)`, `find_by_id(user_id)`
- [x] Apply `require_admin` dependency to all admin router endpoints
- [x] Write integration steps in `tests/integration/steps/admin_steps.py`
  consuming `admin.feature` (6 scenarios)
- [x] Verify `uv run pytest -m integration` passes — 43 scenarios
- [x] Commit

---

## Phase 8: Expenses — CRUD and Currency

**Commit**: `feat(demo-be-pyfa): add expense CRUD and currency handling`

- [x] Create `src/demo_be_pyfa/infrastructure/repositories.py` `ExpenseRepository`:
  - `create(user_id, data) -> ExpenseModel`
  - `find_by_id(expense_id, user_id) -> ExpenseModel | None`
  - `list_by_user(user_id, page, size) -> tuple[list[ExpenseModel], int]`
  - `update(expense_id, user_id, data) -> ExpenseModel`
  - `delete(expense_id, user_id) -> None`
  - `summary_by_currency(user_id) -> list[dict]`
- [x] Create `src/demo_be_pyfa/routers/expenses.py`:
  - `POST /api/v1/expenses` — create expense or income (protected); validates currency and
    amount precision; returns 201 with `{id, ...}`
  - `GET /api/v1/expenses` — list own (paginated, protected)
  - `GET /api/v1/expenses/summary` — grouped totals by currency (protected)
  - `GET /api/v1/expenses/{id}` — get by ID (protected, 403 if not owner)
  - `PUT /api/v1/expenses/{id}` — update (protected, 403 if not owner)
  - `DELETE /api/v1/expenses/{id}` — delete, returns 204 (protected, 403 if not owner)
- [x] Route ordering: `/api/v1/expenses/summary` registered BEFORE `/api/v1/expenses/{id}`
- [x] Write integration steps in `tests/integration/steps/expense_steps.py`
  consuming `expense-management.feature` (7 scenarios) and
  `tests/integration/steps/currency_steps.py` consuming `currency-handling.feature`
  (6 scenarios)
- [x] Verify `uv run pytest -m integration` passes — 56 scenarios
- [x] Commit

---

## Phase 9: Expenses — Units, Reporting, Attachments

**Commit**: `feat(demo-be-pyfa): add unit handling, reporting, and attachments`

- [x] Extend `ExpenseModel` with `quantity` (str nullable) and `unit` (str nullable)
- [x] Implement unit-of-measure validation — supported: SI units (liter, kilogram, meter) and
  imperial equivalents (gallon, pound, foot, mile, ounce); unsupported returns 400
- [x] Create `src/demo_be_pyfa/routers/reports.py`:
  - `GET /api/v1/reports/pl` — P&L report with `from`, `to` (ISO date), and `currency`
    query params (protected); returns `{income_total, expense_total, net, breakdown}`
- [x] Create `src/demo_be_pyfa/routers/attachments.py`:
  - `POST /api/v1/expenses/{id}/attachments` — upload file via multipart/form-data
    (protected); validates content type (image/jpeg, image/png, application/pdf) → 415;
    validates size ≤ 10MB → 413; returns 201 with metadata
  - `GET /api/v1/expenses/{id}/attachments` — list attachments (protected, 403 if not owner)
  - `DELETE /api/v1/expenses/{id}/attachments/{aid}` — delete (protected, 403 if not owner,
    404 if not found)
- [x] Create `AttachmentRepository` in `repositories.py`
- [x] Register `reports.router` and `attachments.router` in `main.py`
- [x] Write integration steps in:
  - `tests/integration/steps/unit_handling_steps.py` consuming `unit-handling.feature`
    (4 scenarios)
  - `tests/integration/steps/reporting_steps.py` consuming `reporting.feature` (6 scenarios)
  - `tests/integration/steps/attachment_steps.py` consuming `attachments.feature`
    (10 scenarios)
- [x] Verify `uv run pytest -m integration` passes — all 76 scenarios
- [x] Commit

---

## Phase 10: Coverage and Quality Gate

**Commit**: `fix(demo-be-pyfa): achieve 90% coverage and pass quality gates`

- [x] Run full test suite with coverage: `uv run coverage run -m pytest`
- [x] Generate LCOV: `uv run coverage lcov -o coverage/lcov.info`
- [x] Validate: `rhino-cli test-coverage validate apps/demo-be-pyfa/coverage/lcov.info 90`
  passes — 94.75% ≥ 90%
- [x] Verify `uv run ruff format --check .` passes (zero formatting changes)
- [x] Verify `uv run ruff check .` passes (zero lint violations)
- [x] Verify `uv run pyright` passes (zero type errors)
- [x] `nx run demo-be-pyfa:test:quick` passes all gates
- [x] Commit

---

## Phase 11: Infra — Docker Compose

**Commit**: `feat(infra): add demo-be-pyfa docker-compose dev environment`

- [x] Create `infra/dev/demo-be-pyfa/Dockerfile.be.dev` (python:3.13-slim + uv)
- [x] Create `infra/dev/demo-be-pyfa/docker-compose.yml` with PostgreSQL 17 + app per
  tech-docs.md
- [x] Create `infra/dev/demo-be-pyfa/docker-compose.e2e.yml` (E2E overrides: detach mode,
  wait-for-healthy)
- [x] Create `infra/dev/demo-be-pyfa/README.md` with startup instructions
- [x] Manual test: `docker compose up --build` → `curl http://localhost:8201/health`
  returns `{"status": "UP"}`

---
