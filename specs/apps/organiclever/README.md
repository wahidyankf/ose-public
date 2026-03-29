# OrganicLever Application Specs

Platform-agnostic specifications for the OrganicLever fullstack application covering service
health, Google OAuth authentication, and a protected user profile. The application consists of an
F#/Giraffe backend REST API and a Next.js 16 frontend with Effect TS.

## Structure

```
specs/apps/organiclever/
├── README.md              # This file
├── c4/                    # Unified C4 architecture diagrams
│   ├── README.md          # Diagram index
│   ├── context.md         # L1 — system context (2 actors)
│   ├── container.md       # L2 — containers (FE, BE, DB)
│   ├── component-be.md    # L3 — F#/Giraffe REST API internals
│   └── component-fe.md    # L3 — Next.js frontend internals
├── be/                    # Backend specs (HTTP-semantic)
│   ├── README.md
│   └── gherkin/           # Backend Gherkin scenarios (see be/gherkin/README)
└── fe/                    # Frontend specs (UI-semantic)
    ├── README.md
    └── gherkin/           # Frontend Gherkin scenarios (see fe/gherkin/README)
```

## Backend vs Frontend

| Aspect      | Backend (be/)                                 | Frontend (fe/)                                 |
| ----------- | --------------------------------------------- | ---------------------------------------------- |
| Perspective | HTTP-semantic (GET, POST, status codes)       | UI-semantic (clicks, types, sees)              |
| Background  | `Given the API is running`                    | `Given the app is running`                     |
| Scenarios   | See [be/gherkin/](./be/gherkin/README.md)     | See [fe/gherkin/](./fe/gherkin/README.md)      |
| Domains     | 2 domains                                     | 3 domains (2 shared + layout)                  |
| Consumed by | `apps/organiclever-be` (F#/Giraffe, TickSpec) | `apps/organiclever-fe` (Next.js 16, Effect TS) |

Both spec sets cover the same functional surface from different perspectives. The frontend app
consumes the backend API.

## Shared Domains

| Domain         | BE Features | FE Features | Description                                               |
| -------------- | ----------- | ----------- | --------------------------------------------------------- |
| health         | 1           | --          | Service health status                                     |
| authentication | 2           | 3           | Google OAuth login, profile (protected), route protection |
| layout         | --          | 1           | Accessibility (WCAG AA compliance)                        |

## Spec Artifacts

- **[c4/](./c4/README.md)** — C4 architecture diagrams (context, container, 2 component)
- **[be/](./be/README.md)** — Backend API specs ([Gherkin features](./be/gherkin/README.md))
- **[fe/](./fe/README.md)** — Frontend app specs ([Gherkin features](./fe/gherkin/README.md))

## Spec Consumption

All backends consume the backend Gherkin specs at **all three test levels**:

- **`test:unit`** — steps call service functions with mocked dependencies; Gherkin spec paths
  are included in Nx cache inputs so cache invalidates when specs change
- **`test:quick`** — unit + coverage check; Gherkin spec paths included in Nx cache inputs
- **`test:integration`** — steps call service functions with real PostgreSQL; cache disabled

## Related

- [Three-Level Testing Standard](../../../governance/development/quality/three-level-testing-standard.md)
- [BDD Spec-Test Mapping](../../../governance/development/infra/bdd-spec-test-mapping.md)
- [BDD Standards](../../../docs/explanation/software-engineering/development/behavior-driven-development-bdd/README.md)
