# OrganicLever Frontend App Specs

Platform-agnostic Gherkin acceptance specifications for the OrganicLever frontend application.
v0 covers the marketing landing page, the system-status diagnostic page (which polls the
backend health endpoint), accessibility compliance, and 404 guards on `/login` and `/profile`
(no authenticated screens in v0).

## What This Covers

| Domain  | Description                                                  |
| ------- | ------------------------------------------------------------ |
| landing | Marketing landing page (hero, features, principles, CTAs)    |
| system  | System-status diagnostic page polling the BE health endpoint |
| layout  | WCAG AA accessibility compliance                             |
| routing | Disabled-route 404 guards (`/login`, `/profile`)             |

## Relationship to organiclever-be

| Aspect      | organiclever-be                                  | organiclever-web                        |
| ----------- | ------------------------------------------------ | --------------------------------------- |
| Perspective | Backend API — HTTP-semantic                      | Frontend UI — user interaction-semantic |
| Steps       | `sends GET/POST`, `status code`, `response body` | `clicks`, `types`, `sees`, `navigates`  |
| Background  | `Given the API is running`                       | `Given the app is running`              |
| Scenarios   | See [be/gherkin/](../be/gherkin/README.md)       | See [fe/gherkin/](gherkin/README.md)    |
| Domains     | health                                           | landing, system, layout, routing        |

The frontend's system-status page consumes the backend's health endpoint. Otherwise the v0
frontend is local-first — every productivity-tracking feature lives in the user's browser via
`localStorage`.

## Implementations

Frontend implementations consume these shared Gherkin scenarios at **two test levels**. The
feature files are the shared contract — only the step implementations differ per level.

| Implementation     | Framework               | BDD Tool                 |
| ------------------ | ----------------------- | ------------------------ |
| `organiclever-web` | Next.js 16 (App Router) | @amiceli/vitest-cucumber |

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
    ├── landing/
    │   └── landing.feature
    ├── system/
    │   └── system-status-be.feature
    ├── layout/
    │   └── accessibility.feature
    └── routing/
        └── disabled-routes.feature
```

**File naming**: `[domain-capability].feature` (kebab-case)

## Adding a Feature File

1. Identify the domain (e.g., `landing`, `layout`, `routing`)
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
