# Plan: demo-be-rust-axum (In Progress)

Rust + Axum reimplementation of the demo backend REST API — a functional twin of
`apps/demo-be-java-springboot` (Java/Spring Boot), `apps/demo-be-elixir-phoenix` (Elixir/Phoenix), and
`apps/demo-be-fsharp-giraffe` (F#/Giraffe) using Rust and the Axum web framework.

**Status**: In Progress

## Goals

- Provide a functionally equivalent backend to `demo-be-java-springboot`, `demo-be-elixir-phoenix`, and
  `demo-be-fsharp-giraffe` using the Rust ecosystem
- Consume the shared `specs/apps/demo/be/gherkin/` Gherkin feature files (76 scenarios across
  13 feature files) for BDD integration tests
- Integrate into the Nx monorepo with the same target surface (`build`, `dev`, `start`,
  `test:quick`, `test:unit`, `test:integration`, `lint`, `typecheck`)
- Reuse the existing `demo-be-e2e` Playwright BDD test suite for E2E validation
- Add a dedicated GitHub Actions workflow and Docker Compose infra

## Naming

`rsax` = **R**u**S**t + **AX**um — matching the suffix pattern of `-jasb`
(Java Spring Boot), `-exph` (Elixir Phoenix), and `-fsgi` (F# Giraffe).

## API Surface (identical to all demo-be implementations)

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

## Tech Stack

| Concern          | Choice                                                                    |
| ---------------- | ------------------------------------------------------------------------- |
| Language         | Rust (stable, latest)                                                     |
| Web framework    | Axum (tokio-based)                                                        |
| Database ORM     | SQLx with PostgreSQL (prod) / SQLite in-memory (test)                     |
| JWT              | jsonwebtoken crate                                                        |
| Password hashing | bcrypt crate                                                              |
| BDD (int. tests) | cucumber-rs (Rust Gherkin runner)                                         |
| Linting          | Clippy (with pedantic warnings, `-D warnings`)                            |
| Formatting       | rustfmt (MANDATORY)                                                       |
| Type checking    | Rust compiler (no separate typecheck tool needed)                         |
| Coverage         | cargo-llvm-cov → LCOV → `rhino-cli test-coverage validate`                |
| Port             | **8201** (same as all demo-be variants — mutually exclusive alternatives) |
| Async runtime    | Tokio                                                                     |
| Serialization    | serde + serde_json                                                        |

## Gherkin Scenario Count

| Feature file               | Scenarios |
| -------------------------- | --------- |
| health-check.feature       | 2         |
| password-login.feature     | 5         |
| token-lifecycle.feature    | 7         |
| registration.feature       | 6         |
| user-account.feature       | 6         |
| security.feature           | 5         |
| tokens.feature             | 6         |
| admin.feature              | 6         |
| expense-management.feature | 7         |
| currency-handling.feature  | 6         |
| unit-handling.feature      | 4         |
| reporting.feature          | 6         |
| attachments.feature        | 10        |
| **Total**                  | **76**    |

## Git Workflow

Work on `main` branch (Trunk Based Development). No feature branch required — changes are
small, incremental, and continuously integrated.

## Related Files

- `apps/demo-be-rust-axum/` — application source
- `infra/dev/demo-be-rust-axum/` — Docker Compose dev infra
- `.github/workflows/e2e-demo-be-rust-axum.yml` — E2E workflow
- `.github/workflows/main-ci.yml` — Rust toolchain setup + coverage upload
- `specs/apps/demo/be/` — shared Gherkin specs (consumed, not modified)
- `apps/demo-be-e2e/` — reused Playwright E2E suite (consumed, not modified)

## Files to Update

| File                            | Change                                                             |
| ------------------------------- | ------------------------------------------------------------------ |
| `CLAUDE.md`                     | Add demo-be-rust-axum to Current Apps list, add Rust coverage info |
| `README.md`                     | Add demo-be-rust-axum badge and description in demo apps section   |
| `specs/apps/demo/be/README.md`  | Add Rust/Axum row to Implementations table                         |
| `apps/demo-be-e2e/project.json` | Add `demo-be-rust-axum` to `implicitDependencies`                  |
| `.github/workflows/main-ci.yml` | Add Rust toolchain setup + coverage upload step                    |
| `plans/in-progress/README.md`   | Add this plan to active plans list                                 |

## See Also

- [requirements.md](./requirements.md) — acceptance criteria
- [tech-docs.md](./tech-docs.md) — technical design
- [delivery.md](./delivery.md) — delivery checklist
