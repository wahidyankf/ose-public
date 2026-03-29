# Plan: demo-be-ts-effect (Done)

TypeScript / Effect TS reimplementation of the demo backend REST API — a functional twin of
`apps/demo-be-java-springboot` (Java/Spring Boot), `apps/demo-be-python-fastapi` (Python/FastAPI),
`apps/demo-be-rust-axum` (Rust/Axum), and others, using Node.js, Vite, and Effect TS.

**Status**: Done

## Goals

- Provide a functionally equivalent backend to all existing `demo-be-*` variants using the
  TypeScript/Effect ecosystem
- Consume the shared `specs/apps/demo/be/gherkin/` Gherkin feature files (76 scenarios across
  13 feature files) for BDD integration tests via Cucumber.js
- Integrate into the Nx monorepo with the same target surface (`build`, `dev`, `start`,
  `test:quick`, `test:unit`, `test:integration`, `lint`, `typecheck`)
- Reuse the existing `demo-be-e2e` Playwright BDD test suite for E2E validation
- Add a dedicated GitHub Actions workflow and Docker Compose infra

## Naming

`tsex` = **T**ype**S**cript + **E**ffect — matching the suffix pattern of `-jasb` (Java Spring
Boot), `-pyfa` (Python FastAPI), `-rsax` (Rust Axum), `-ktkt` (Kotlin Ktor), etc.

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

| Concern          | Choice                                                                         |
| ---------------- | ------------------------------------------------------------------------------ |
| Language         | TypeScript (latest, strict)                                                    |
| Runtime          | Node.js (managed by Volta, same version as workspace)                          |
| Build            | Vite (library mode for server build)                                           |
| Web framework    | `@effect/platform` Node.js HTTP server                                         |
| Database         | `@effect/sql` with `@effect/sql-sqlite-node` (tests) / `@effect/sql-pg` (prod) |
| JWT              | `jose` library                                                                 |
| Password hashing | `bcrypt` (with `@types/bcrypt`)                                                |
| BDD (int. tests) | Cucumber.js (Gherkin parser) with Effect TS test utilities                     |
| Linting          | oxlint (matching `organiclever-fe` pattern)                                    |
| Type checking    | `tsc --noEmit`                                                                 |
| Formatting       | Prettier (already in workspace)                                                |
| Coverage         | Vitest with v8 coverage → LCOV → `rhino-cli test-coverage validate`            |
| Port             | **8201** (same as all demo-be variants — mutually exclusive alternatives)      |
| Package manager  | npm (workspace uses npm)                                                       |

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

## Related Files

- `apps/demo-be-ts-effect/` — application source
- `infra/dev/demo-be-ts-effect/` — Docker Compose dev infra
- `.github/workflows/e2e-demo-be-ts-effect.yml` — E2E workflow
- `.github/workflows/main-ci.yml` — coverage upload step
- `specs/apps/demo/be/` — shared Gherkin specs (consumed, not modified)
- `apps/demo-be-e2e/` — reused Playwright E2E suite (consumed, not modified)

## Files to Update

| File                            | Change                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------- |
| `CLAUDE.md`                     | Add demo-be-ts-effect to Current Apps list, add TypeScript/Effect coverage note |
| `README.md`                     | Add demo-be-ts-effect badge and description in demo apps section                |
| `specs/apps/demo/be/README.md`  | Add TypeScript/Effect row to Implementations table                              |
| `apps/demo-be-e2e/project.json` | Add `demo-be-ts-effect` to `implicitDependencies`                               |
| `.github/workflows/main-ci.yml` | Add coverage upload step for demo-be-ts-effect LCOV                             |

## Git Workflow

Trunk Based Development — all work on `main` branch. No feature branch needed.

## See Also

- [requirements.md](./requirements.md) — acceptance criteria
- [tech-docs.md](./tech-docs.md) — technical design
- [delivery.md](./delivery.md) — delivery checklist
