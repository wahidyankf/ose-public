# OrganicLever Frontend App Specs

Platform-agnostic Gherkin acceptance specifications for the OrganicLever frontend application
that consumes the [organiclever-be API](../be/README.md). The spec covers 3 domains: Google OAuth
login, protected user profile, route protection, and accessibility.

## What This Covers

| Domain         | Description                                                                 |
| -------------- | --------------------------------------------------------------------------- |
| authentication | Google sign-in page, protected profile page, route protection and redirects |
| layout         | WCAG AA accessibility compliance                                            |

## Relationship to organiclever-be

| Aspect      | organiclever-be                                  | organiclever-fe                         |
| ----------- | ------------------------------------------------ | --------------------------------------- |
| Perspective | Backend API — HTTP-semantic                      | Frontend UI — user interaction-semantic |
| Steps       | `sends GET/POST`, `status code`, `response body` | `clicks`, `types`, `sees`, `navigates`  |
| Background  | `Given the API is running`                       | `Given the app is running`              |
| Scenarios   | See [be/gherkin/](../be/gherkin/README.md)       | See [fe/gherkin/](gherkin/README.md)    |
| Domains     | 2 domains                                        | 3 domains (2 shared + layout)           |

Both spec sets cover the same functional surface. The frontend app consumes the backend API —
step definitions translate UI actions into API calls and verify the rendered output.

## Implementations

Frontend implementations consume these shared Gherkin scenarios at **two test levels**. The
feature files are the shared contract — only the step implementations differ per level.

| Implementation    | Framework               | BDD Tool                 |
| ----------------- | ----------------------- | ------------------------ |
| `organiclever-fe` | Next.js 16 (App Router) | @amiceli/vitest-cucumber |

| Level    | Nx Target   | What Happens                                         | Dependencies                |
| -------- | ----------- | ---------------------------------------------------- | --------------------------- |
| **Unit** | `test:unit` | Steps test component logic with mocked API calls     | All mocked                  |
| **E2E**  | `test:e2e`  | Playwright drives a real browser against running app | Full running frontend + API |

### Unit Level

- Steps test component logic and state management with fully mocked dependencies
- No DOM rendering, no HTTP calls
- Coverage is measured here (>=70% line coverage via `rhino-cli test-coverage validate`)
- All shared scenarios must pass

### E2E Level

- Playwright drives a real browser
- Frontend runs against `organiclever-be` with real PostgreSQL
- Tests verify full user journeys end-to-end
- All shared scenarios must pass

## Feature File Organization

```
specs/apps/organiclever/fe/
├── README.md
└── gherkin/
    ├── README.md
    ├── authentication/
    │   ├── google-login.feature         (2 scenarios)
    │   ├── profile.feature              (2 scenarios)
    │   └── route-protection.feature     (4 scenarios)
    └── layout/
        └── accessibility.feature        (5 scenarios)
```

**File naming**: `[domain-capability].feature` (kebab-case)

## Adding a Feature File

1. Identify the domain (e.g., `authentication`, `layout`)
2. Create the folder if it does not exist: `specs/apps/organiclever/fe/gherkin/[domain]/`
3. Create the `.feature` file: `[domain-capability].feature`
4. Open with `Feature:` then a user story block (`As a … / I want … / So that …`)
5. Use `Given the app is running` as the first Background step
6. Use only UI-semantic steps — no HTTP verbs, status codes, or API paths

## Related

- **Parent**: [organiclever specs](../README.md)
- **C4 Architecture**: [c4/](../c4/README.md) — Context, Container, and Component diagrams
- **Backend counterpart**: [be/](../be/README.md) — HTTP-semantic API specs
- **BDD Standards**: [behavior-driven-development-bdd/](../../../../docs/explanation/software-engineering/development/behavior-driven-development-bdd/README.md)
