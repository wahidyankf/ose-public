# Plan: demo-be-clojure-pedestal (In Progress)

Clojure / Pedestal reimplementation of the demo backend REST API — a functional twin of
`apps/demo-be-java-springboot` (Java/Spring Boot), `apps/demo-be-elixir-phoenix` (Elixir/Phoenix),
`apps/demo-be-fsharp-giraffe` (F#/Giraffe), `apps/demo-be-golang-gin` (Go/Gin),
`apps/demo-be-python-fastapi` (Python/FastAPI), `apps/demo-be-rust-axum` (Rust/Axum),
`apps/demo-be-kotlin-ktor` (Kotlin/Ktor), `apps/demo-be-java-vertx` (Java/Vert.x),
`apps/demo-be-ts-effect` (TypeScript/Effect), and `apps/demo-be-csharp-aspnetcore` (C#/ASP.NET Core)
using Clojure 1.12+ and Pedestal 0.7.

**Status**: Done

## Goals

- Provide a functionally equivalent backend to all existing `demo-be-*` implementations using
  the Clojure / Pedestal ecosystem
- Consume the shared `specs/apps/demo/be/gherkin/` Gherkin feature files (76 scenarios across
  13 feature files) for BDD integration tests
- Integrate into the Nx monorepo with the same target surface (`build`, `dev`, `start`,
  `test:quick`, `test:unit`, `test:integration`, `lint`)
- Reuse the existing `demo-be-e2e` Playwright BDD test suite for E2E validation
- Add a dedicated GitHub Actions workflow and Docker Compose infra

## Naming

`cjpd` = **Cl**o**j**ure + **P**e**d**estal — matching the suffix pattern of `-jasb` (Java Spring Boot),
`-exph` (Elixir Phoenix), `-fsgi` (F# Giraffe), `-gogn` (Go Gin), `-pyfa` (Python FastAPI),
`-rsax` (Rust Axum), `-ktkt` (Kotlin Ktor), `-javx` (Java Vert.x), `-tsex` (TypeScript Effect),
and `-csas` (C# ASP.NET Core).

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
| Language         | Clojure 1.12+ (JVM)                                                       |
| Build            | Clojure CLI (deps.edn) + tools.build for uberjar                          |
| Web framework    | Pedestal 0.7.2 (Jetty engine)                                             |
| Database         | next.jdbc with PostgreSQL (prod) / SQLite in-memory (tests)               |
| JWT              | buddy-sign (HMAC-SHA256)                                                  |
| Password hashing | buddy-hashers (bcrypt+sha512)                                             |
| BDD (int. tests) | kaocha + kaocha-cucumber (Gherkin BDD runner)                             |
| Unit tests       | clojure.test + kaocha                                                     |
| Linting          | clj-kondo                                                                 |
| Coverage         | cloverage → LCOV → `rhino-cli test-coverage validate` ≥90%                |
| Port             | **8201** (same as all demo-be variants — mutually exclusive alternatives) |
| JDK              | 21+ (same as Kotlin/Ktor — shares JVM ≤24 setup in CI)                    |

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

- `apps/demo-be-clojure-pedestal/` — application source
- `infra/dev/demo-be-clojure-pedestal/` — Docker Compose dev infra
- `.github/workflows/e2e-demo-be-clojure-pedestal.yml` — E2E workflow
- `.github/workflows/main-ci.yml` — Clojure setup + coverage upload
- `specs/apps/demo/be/` — shared Gherkin specs (consumed, not modified)
- `apps/demo-be-e2e/` — reused Playwright E2E suite (consumed, not modified)

## Files to Update

| File                            | Change                                                                       |
| ------------------------------- | ---------------------------------------------------------------------------- |
| `CLAUDE.md`                     | Add demo-be-clojure-pedestal to Current Apps list, add Clojure coverage info |
| `README.md`                     | Add demo-be-clojure-pedestal badge and description in demo apps section      |
| `specs/apps/demo/be/README.md`  | Add Clojure/Pedestal row to Implementations table                            |
| `apps/demo-be-e2e/project.json` | Add `demo-be-clojure-pedestal` to `implicitDependencies`                     |
| `.github/workflows/main-ci.yml` | Add Clojure setup + coverage upload step                                     |
| `codecov.yml`                   | Add `demo-be-clojure-pedestal` flag                                          |

## Git Workflow

Trunk Based Development — all work on `main` branch. No feature branch needed.

## See Also

- [requirements.md](./requirements.md) — acceptance criteria
- [tech-docs.md](./tech-docs.md) — technical design
- [delivery.md](./delivery.md) — delivery checklist
