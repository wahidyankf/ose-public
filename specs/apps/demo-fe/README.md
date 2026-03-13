# Demo Frontend App Specs

Platform-agnostic Gherkin acceptance specifications for a demo-scale frontend application that
consumes the [demo-be API](../demo-be/README.md). The spec mirrors the backend's 7 domains with 76
UI-centric scenarios covering: authentication forms, session management, user profile, admin panel,
expense CRUD, financial reporting, and file attachment handling.

## What This Covers

| Domain           | Description                                                                         |
| ---------------- | ----------------------------------------------------------------------------------- |
| health           | Service health status indicator                                                     |
| authentication   | Login form, session lifecycle, automatic token refresh, logout                      |
| user-lifecycle   | Registration form, profile management, password change, self-deactivation           |
| security         | Password complexity in forms, account lockout display, admin unlock                 |
| token-management | Session info display, token verification, logout behavior                           |
| admin            | User listing, search, disable/enable accounts, password reset token                 |
| expenses         | Entry CRUD UI, currency precision, unit-of-measure, P&L reporting, file attachments |

## Relationship to demo-be

| Aspect      | demo-be                                          | demo-fe                                 |
| ----------- | ------------------------------------------------ | --------------------------------------- |
| Perspective | Backend API — HTTP-semantic                      | Frontend UI — user interaction-semantic |
| Steps       | `sends GET/POST`, `status code`, `response body` | `clicks`, `types`, `sees`, `navigates`  |
| Background  | `Given the API is running`                       | `Given the app is running`              |
| Scenarios   | 76 across 13 features                            | 76 across 13 features                   |
| Domains     | 7 domains                                        | Same 7 domains                          |

Both spec sets cover the same functional surface. The frontend app consumes the backend API — step
definitions translate UI actions into API calls and verify the rendered output.

## Implementations

Each frontend implementation lives in `apps/demo-fe-{framework}/` (e.g., `demo-fe-react-nextjs`,
`demo-fe-vue-nuxt`). This mirrors the backend pattern where `specs/apps/demo-be/` is consumed by
`apps/demo-be-{lang}-{framework}/`.

Frontend implementations consume these 76 Gherkin scenarios at **three test levels**. The feature
files are the shared contract — only the step implementations differ per level.

| Level           | Nx Target          | What Happens                                         | Dependencies                |
| --------------- | ------------------ | ---------------------------------------------------- | --------------------------- |
| **Unit**        | `test:unit`        | Steps test component logic with mocked API calls     | All mocked                  |
| **Integration** | `test:integration` | Steps render components with mocked API responses    | MSW or similar mock layer   |
| **E2E**         | `test:e2e`         | Playwright drives a real browser against running app | Full running frontend + API |

### Unit Level

- Steps test component logic and state management with fully mocked dependencies
- No DOM rendering, no HTTP calls
- Coverage is measured here (>=90% line coverage via `rhino-cli test-coverage validate`)
- All 76 scenarios must pass

### Integration Level

- Steps render components in a test harness (JSDOM, Testing Library, etc.)
- API responses are mocked (MSW, vi.mock, etc.)
- No real backend needed — all API calls intercepted
- All 76 scenarios must pass

### E2E Level

- Playwright drives a real browser
- Frontend runs against a real backend (demo-be-\*) with real PostgreSQL
- Tests verify full user journeys end-to-end
- All 76 scenarios must pass

### Recommended Directory Structure for Step Definitions

Each frontend implementation should separate test levels:

```
apps/demo-fe-{framework}/
├── src/                          # Application source code
├── test/
│   ├── unit/                     # Unit-level step definitions (mocked deps)
│   │   ├── steps/                # Gherkin step implementations
│   │   └── support/              # Test helpers, mock factories
│   └── integration/              # Integration-level step definitions (rendered components)
│       ├── steps/                # Gherkin step implementations
│       └── support/              # MSW handlers, test harness setup
├── project.json
└── README.md
```

## Feature File Organization

```
specs/apps/demo-fe/
├── README.md
└── gherkin/
    ├── README.md
    ├── health/
    │   └── health-status.feature           (2 scenarios)
    ├── authentication/
    │   ├── login.feature                   (5 scenarios)
    │   └── session.feature                 (7 scenarios)
    ├── user-lifecycle/
    │   ├── registration.feature            (6 scenarios)
    │   └── user-profile.feature            (6 scenarios)
    ├── security/
    │   └── security.feature                (5 scenarios)
    ├── token-management/
    │   └── tokens.feature                  (6 scenarios)
    ├── admin/
    │   └── admin-panel.feature             (6 scenarios)
    └── expenses/
        ├── expense-management.feature      (7 scenarios)
        ├── currency-handling.feature       (6 scenarios)
        ├── unit-handling.feature           (4 scenarios)
        ├── reporting.feature               (6 scenarios)
        └── attachments.feature             (10 scenarios)
```

**File naming**: `[domain-capability].feature` (kebab-case)

## Adding a Feature File

1. Identify the domain (e.g., `authentication`, `expenses`)
2. Create the folder if it does not exist: `specs/apps/demo-fe/gherkin/[domain]/`
3. Create the `.feature` file: `[domain-capability].feature`
4. Open with `Feature:` then a user story block (`As a … / I want … / So that …`)
5. Use `Given the app is running` as the first Background step
6. Use only UI-semantic steps — no HTTP verbs, status codes, or API paths

## Related

- **Backend counterpart**: [specs/apps/demo-be/](../demo-be/README.md) — HTTP-semantic API specs
- **BDD Standards**: [behavior-driven-development-bdd/](../../../docs/explanation/software-engineering/development/behavior-driven-development-bdd/README.md)
