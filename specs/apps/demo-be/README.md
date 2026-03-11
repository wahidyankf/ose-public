# Demo Backend API Specs

Platform-agnostic Gherkin acceptance specifications for a demo-scale backend service covering
authentication, user management, and a multi-currency expense domain. The spec is sized for
ergonomic evaluation — small enough to implement in a weekend, but complex enough to exercise
the patterns that matter: JWT lifecycle, input validation, error handling, password hashing,
dependency injection, decimal money handling, unit-of-measure validation, and file upload
handling.

No external services are required. Implementations need only a local database (SQLite or Docker
Postgres). Supported currencies: **USD** and **IDR**.

## What This Covers

| Domain           | Description                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------- |
| health           | Service liveness check                                                                    |
| authentication   | Password login, token refresh, logout                                                     |
| user-lifecycle   | Registration, profile, password change, self-deactivation                                 |
| security         | Password policy, account lockout, admin unlock                                            |
| token-management | JWT claims, JWKS endpoint, token revocation                                               |
| admin            | User listing, search, account control, password reset token                               |
| expenses         | Income/expense CRUD, currency precision, unit-of-measure, P&L reporting, file attachments |

## Implementations

| Implementation | Language         | Integration runner          | E2E runner |
| -------------- | ---------------- | --------------------------- | ---------- |
| demo-be-jasb   | Java (Spring)    | Cucumber + MockMvc          | Playwright |
| demo-be-exph   | Elixir (Phoenix) | Cabbage + ConnCase          | Playwright |
| demo-be-fsgi   | F# (Giraffe)     | TickSpec + xUnit            | Playwright |
| demo-be-gogn   | Go (Gin)         | Godog + httptest            | Playwright |
| demo-be-pyfa   | Python (FastAPI) | pytest-bdd + TestClient     | Playwright |
| demo-be-rsax   | Rust (Axum)      | cucumber + Tower TestClient | Playwright |
| demo-be-ktkt   | Kotlin (Ktor)    | Cucumber + testApplication  | Playwright |
| demo-be-javx   | Java (Vert.x)    | Cucumber + Vert.x Test      | Playwright |

Each new language implementation adds its own step definitions. The feature files here are the
single source of truth and must not contain language-specific concepts (framework names, library
paths, runtime-specific error formats).

## Spec Artifacts

This spec is organized into two subdirectories:

- **[gherkin/](./gherkin/README.md)** — 13 Gherkin feature files, 76 scenarios, covering 7
  domains
- **[c4/](./c4/README.md)** — C4 architecture diagrams for the demo backend service

## Feature File Organization

```
specs/apps/demo-be/
├── README.md
├── gherkin/
│   ├── README.md
│   ├── health/
│   │   └── health-check.feature          (2 scenarios)
│   ├── authentication/
│   │   ├── password-login.feature        (5 scenarios)
│   │   └── token-lifecycle.feature       (7 scenarios)
│   ├── user-lifecycle/
│   │   ├── registration.feature          (6 scenarios)
│   │   └── user-account.feature          (6 scenarios)
│   ├── security/
│   │   └── security.feature              (5 scenarios)
│   ├── token-management/
│   │   └── tokens.feature                (6 scenarios)
│   ├── admin/
│   │   └── admin.feature                 (6 scenarios)
│   └── expenses/
│       ├── expense-management.feature    (7 scenarios)
│       ├── currency-handling.feature     (6 scenarios)
│       ├── unit-handling.feature         (4 scenarios)
│       ├── reporting.feature             (6 scenarios)
│       └── attachments.feature           (10 scenarios)
└── c4/
    └── README.md
```

**File naming**: `[domain-capability].feature` (kebab-case)

## Running Specs

TBD — depends on the chosen implementation language and framework.

## Adding a Feature File

1. Identify the bounded context (e.g., `authentication`, `user-lifecycle`)
2. Create the folder if it does not exist: `specs/apps/demo-be/gherkin/[context]/`
3. Create the `.feature` file: `[domain-capability].feature`
4. Open with `Feature:` then a user story block (`As a … / I want … / So that …`)
5. Use `Given the API is running` as the first Background step
6. Use only HTTP-semantic steps — no framework or library names

## Related

- **BDD Standards**: [behavior-driven-development-bdd/](../../../docs/explanation/software-engineering/development/behavior-driven-development-bdd/README.md)
