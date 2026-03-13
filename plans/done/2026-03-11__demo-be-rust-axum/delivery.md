# Delivery Checklist: demo-be-rust-axum

Execute phases in order. Each phase produces a working, committable state.

---

## Phase 0: Prerequisites

- [x] Verify Rust stable toolchain available locally (`rustup show` — stable channel)
- [x] Verify `cargo-llvm-cov` is installed (`cargo llvm-cov --version`)
- [x] Verify `cargo-watch` is installed (`cargo watch --version`)
- [x] Verify `sqlx-cli` is installed (`sqlx --version`)
- [x] Verify `llvm-tools-preview` component is installed (`rustup component list --installed`)
- [x] Verify `rhino-cli test-coverage validate` supports LCOV (it does — already used by
      `organiclever-web`, `demo-be-elixir-phoenix`, and `demo-be-fsharp-giraffe`)
- [x] Verify `demo-be-e2e` Playwright config reads `BASE_URL` from env (it does)
- [x] Confirm cucumber-rs latest version supports async `World` and `#[given]`/`#[when]`/`#[then]`
      macros compatible with the shared `.feature` file syntax

---

## Phase 1: Project Scaffold

**Commit**: `feat(demo-be-rust-axum): scaffold Rust/Axum project`

- [x] Create `apps/demo-be-rust-axum/` directory structure per tech-docs.md
- [x] Create `Cargo.toml` as a package (not workspace root) with all dependencies listed
      in the Dependencies Summary section of tech-docs.md
- [x] Create `rust-toolchain.toml` pinning `channel = "stable"`
- [x] Create `src/main.rs` — binds port from `APP_PORT` env var (default 8201), creates
      `AppState`, calls `app::router`, starts Tokio runtime
- [x] Create `src/lib.rs` — re-exports `app::router` and `state::AppState` for test reuse
- [x] Create `src/app.rs` — builds the Axum `Router` with a minimal health route placeholder
- [x] Create `src/state.rs` — `AppState` struct holding `sqlx::SqlitePool` and JWT config
- [x] Create `src/config.rs` — reads `DATABASE_URL`, `APP_JWT_SECRET`, `APP_PORT` from env
- [x] Add `.rustfmt.toml` with edition = "2021", max_width = 100
- [x] Create `project.json` with all Nx targets from tech-docs.md
- [x] Verify `cargo build` compiles with zero warnings
- [x] Verify `cargo fmt --check` passes
- [x] Verify `cargo clippy -- -D warnings` passes

---

## Phase 2: Domain Types and Database

**Commit**: `feat(demo-be-rust-axum): add domain types and SQLx database layer`

- [x] Create `src/domain/types.rs` — enums: `Currency` (Usd/Idr), `Role` (User/Admin),
      `UserStatus` (Active/Inactive/Disabled/Locked), `EntryType` (Expense/Income), `SUPPORTED_UNITS`
- [x] Create `src/domain/errors.rs` — `AppError` enum with `thiserror::Error` and
      `axum::response::IntoResponse` implementation
- [x] Create `src/domain/user.rs` — `User` struct with validation functions (email format,
      password complexity: min 12 chars, requires special char and uppercase)
- [x] Create `src/domain/expense.rs` — `Expense` struct with `parse_amount` logic
      for integer storage with decimal precision enforcement
- [x] Create `src/domain/attachment.rs` — `Attachment` struct
- [x] Create `src/db/migrations/` with SQL migration files: - `001_users.sql` — users table - `002_token_revocations.sql` — token revocations table - `003_expenses.sql` — expenses table - `004_attachments.sql` — attachments table
- [x] Create `src/db/pool.rs` — `create_pool` and `create_test_pool` (sqlite::memory:);
      calls `sqlx::migrate!` to run migrations
- [x] Create `src/db/user_repo.rs` — async CRUD using runtime queries (no compile-time macros)
- [x] Create `src/db/token_repo.rs` — revoke_token, revoke_all_for_user, is_revoked,
      is_user_all_revoked_after (sentinel JTI pattern for logout-all detection)
- [x] Create `src/db/expense_repo.rs` — create, find_by_id, list_for_user, update, delete,
      summarize_by_currency, pl_report
- [x] Create `src/db/attachment_repo.rs` — create (with NewAttachment struct), list_for_expense,
      find_by_id, delete
- [x] Write unit tests in `src/domain/` (`#[cfg(test)]`)
- [x] Verify `cargo test --lib` passes (all domain unit tests green)

---

## Phase 3: Health Endpoint

**Commit**: `feat(demo-be-rust-axum): add /health endpoint`

- [x] Create `src/handlers/health.rs` — `get_health()` returns `Json(json!({"status": "UP"}))`
- [x] Wire `GET /health` in `src/app.rs` router
- [x] Create `tests/integration/world.rs` — `AppWorld` with `#[derive(cucumber::World)]` and
      `#[world(init = Self::new_world)]` for async initialization
- [x] Create `tests/integration/main.rs` — cucumber-rs entry point
- [x] Create `tests/integration/steps/common_steps.rs` — shared step definitions

---

## Phase 4: Auth — Register and Login

**Commit**: `feat(demo-be-rust-axum): add register and login endpoints`

- [x] Create `src/auth/jwt.rs` — access/refresh token encode/decode, unchecked decode
- [x] Create `src/auth/password.rs` — bcrypt hash/verify via spawn_blocking
- [x] Create `src/auth/middleware.rs` — `AuthUser` and `AdminUser` extractors
- [x] Create `src/handlers/auth.rs` — register, login (with 5-attempt lockout)
- [x] Wire public auth routes in `src/app.rs`
- [x] Create `tests/integration/steps/auth_steps.rs`

---

## Phase 5: Token Lifecycle and Management

**Commit**: `feat(demo-be-rust-axum): add token lifecycle and management endpoints`

- [x] Add refresh, logout, logout_all to `src/handlers/auth.rs`
- [x] Create `src/handlers/token.rs` — claims endpoint, JWKS endpoint
- [x] Wire token routes in `src/app.rs`
- [x] Create `tests/integration/steps/token_lifecycle_steps.rs`
- [x] Create `tests/integration/steps/token_management_steps.rs`

---

## Phase 6: User Account and Security

**Commit**: `feat(demo-be-rust-axum): add user account and security endpoints`

- [x] Create `src/handlers/user.rs` — get_profile, update_profile, change_password, deactivate
      Note: change_password does NOT enforce password complexity (matches Java/Elixir behavior)
- [x] Wire authenticated user routes in `src/app.rs`
- [x] Create `tests/integration/steps/user_account_steps.rs`
- [x] Create `tests/integration/steps/security_steps.rs`

---

## Phase 7: Admin

**Commit**: `feat(demo-be-rust-axum): add admin endpoints`

- [x] Create `src/handlers/admin.rs` — list_users, disable_user, enable_user, unlock_user,
      force_password_reset
- [x] Wire admin routes under `/api/v1/admin` using `AdminUser` extractor
- [x] Create `tests/integration/steps/admin_steps.rs`

---

## Phase 8: Expenses — CRUD and Currency

**Commit**: `feat(demo-be-rust-axum): add expense CRUD and currency handling`

- [x] Create `src/handlers/expense.rs` — create, list, get_by_id, update, delete, summary
- [x] Wire expense routes in `src/app.rs`
- [x] Create `tests/integration/steps/expense_steps.rs` (exports `create_expense_helper`)
- [x] Create `tests/integration/steps/currency_steps.rs`

---

## Phase 9: Expenses — Units, Reporting, Attachments

**Commit**: `feat(demo-be-rust-axum): add unit handling, reporting, and attachments`

- [x] Unit-of-measure support in expense handlers
- [x] Create `src/handlers/report.rs` — P&L report with date range and currency filter
- [x] Create `src/handlers/attachment.rs` — upload (multipart, content-type + size checks),
      list, delete; `DefaultBodyLimit::max(20MB)` on upload route to allow 11MB files
      (so handler can return 413 rather than Axum's 500)
- [x] Wire reporting and attachment routes in `src/app.rs`
- [x] Create `tests/integration/steps/unit_handling_steps.rs`
- [x] Create `tests/integration/steps/reporting_steps.rs`
- [x] Create `tests/integration/steps/attachment_steps.rs`
- [x] All 76 integration scenarios pass

---

## Phase 10: Coverage and Quality Gate

**Commit**: `fix(demo-be-rust-axum): achieve 90% coverage and pass quality gates`

- [x] `cargo llvm-cov --lcov --output-path coverage/lcov.info` — generates LCOV report
- [x] `rhino-cli test-coverage validate apps/demo-be-rust-axum/coverage/lcov.info 90` — PASS 90.27%
- [x] `cargo fmt --check` — passes
- [x] `cargo clippy -- -D warnings` — passes (fixed: `from_str` renamed to `parse_str`,
      `create_attachment` parameters reduced via `NewAttachment` struct)
- [x] `cargo check` — passes
- [x] `cargo build --release` — passes
- [x] `project.json` created with all required Nx targets

### Quality Gate Results (2026-03-11)

| Check                         | Status | Details                        |
| ----------------------------- | ------ | ------------------------------ |
| cargo fmt                     | PASS   | No formatting issues           |
| cargo clippy                  | PASS   | Zero warnings with -D warnings |
| cargo test --lib              | PASS   | 43 unit tests                  |
| cargo test --test integration | PASS   | 76/76 scenarios                |
| coverage                      | PASS   | 90.27% (threshold: 90%)        |

### Key Implementation Notes

- **cucumber-rs**: Must use `#[derive(cucumber::World)]` with `#[world(init = Self::new_world)]`
  for async world initialization; manual `impl cucumber::World` doesn't generate `WorldInventory`
- **Step patterns**: URLs with `/` in literal step text must use `regex` attribute (not `expr`);
  step text with JSON `{` must use `regex` with `\{`/`\}` escaping
- **Duplicate steps**: Each step pattern must be unique across all step files
- **Password change**: `change_password` endpoint does NOT validate complexity (only non-empty),
  matching the Java/Elixir spec behavior (`NewPass#456` = 11 chars is valid)
- **Attachment body limit**: Axum's default 2MB body limit is overridden with
  `DefaultBodyLimit::max(20MB)` so the handler can return 413 (not Axum's 500) for oversized files
- **SQLx runtime queries**: All DB code uses `sqlx::query().bind()...` (not compile-time macros)
  to avoid requiring `DATABASE_URL` at compile time

---

## Phase 11: Infra — Docker Compose

- [x] Create `infra/dev/demo-be-rust-axum/Dockerfile.be.dev`
- [x] Create `infra/dev/demo-be-rust-axum/Dockerfile.be.e2e`
- [x] Create `infra/dev/demo-be-rust-axum/docker-compose.yml`
- [x] Create `infra/dev/demo-be-rust-axum/docker-compose.e2e.yml`
- [x] Create `infra/dev/demo-be-rust-axum/README.md`
- [x] Manual test: Docker Compose starts and health check passes

---

## Phase 12: GitHub Actions — E2E Workflow

- [x] Create `.github/workflows/e2e-demo-be-rust-axum.yml`
- [x] Trigger workflow_dispatch manually; verify green

---

## Phase 13: CI — main-ci.yml Update

- [x] Add `dtolnay/rust-toolchain@stable` step to `main-ci.yml`
- [x] Add `taiki-e/install-action@cargo-llvm-cov` step
- [x] Add coverage upload step for `apps/demo-be-rust-axum/coverage/lcov.info`
- [x] Push to `main`; verify `Main CI` workflow passes

---

## Phase 14: Documentation Updates

- [x] Update `CLAUDE.md`
- [x] Update `README.md`
- [x] Update `specs/apps/demo/be/README.md`
- [x] Update `apps/demo-be-e2e/project.json`

---

## Phase 15: Final Validation

- [x] All 76 integration scenarios pass (`cargo test --test integration`)
- [x] All 43 unit tests pass (`cargo test --lib`)
- [x] Coverage ≥ 90% (90.27%)
- [x] `cargo clippy -- -D warnings` clean
- [x] `cargo fmt --check` clean
- [x] `cargo build --release` succeeds
- [x] Docker Compose stack starts and health check passes (manual verification)
- [x] `e2e-demo-be-rust-axum.yml` workflow green (requires CI push)
- [x] `main-ci.yml` workflow green (requires CI push)
- [x] All documentation updated
- [x] Move plan folder to `plans/done/`
