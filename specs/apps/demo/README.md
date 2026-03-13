# Demo Application Specs

Platform-agnostic specifications for a demo-scale full-stack application covering authentication,
user management, and a multi-currency expense domain. The application consists of a backend REST API
and a frontend single-page application (SPA).

## Structure

```
specs/apps/demo/
├── README.md              # This file
├── c4/                    # Unified C4 architecture diagrams
│   ├── context.md         # L1 — system context (4 actors)
│   ├── container.md       # L2 — containers (SPA, Static Server, API, DB, FS)
│   ├── component-be.md    # L3 — REST API internals
│   └── component-fe.md    # L3 — SPA internals
├── be/                    # Backend specs (HTTP-semantic)
│   ├── README.md
│   └── gherkin/           # 13 features, 76 scenarios, 7 domains
└── fe/                    # Frontend specs (UI-semantic)
    ├── README.md
    └── gherkin/           # 15 features, 92 scenarios, 8 domains
```

## Backend vs Frontend

| Aspect      | Backend (be/)                                    | Frontend (fe/)                       |
| ----------- | ------------------------------------------------ | ------------------------------------ |
| Perspective | HTTP-semantic (GET, POST, status codes)          | UI-semantic (clicks, types, sees)    |
| Background  | `Given the API is running`                       | `Given the app is running`           |
| Scenarios   | 76 across 13 features                            | 92 across 15 features                |
| Domains     | 7 domains                                        | 8 domains (7 shared + layout)        |
| Consumed by | `apps/demo-be-{lang}-{framework}/` (11 backends) | `apps/demo-fe-{framework}/` (future) |

Both spec sets cover the same functional surface from different perspectives. The frontend app
consumes the backend API.

## Shared Domains

| Domain           | BE Features | FE Features | Description                         |
| ---------------- | ----------- | ----------- | ----------------------------------- |
| health           | 1           | 1           | Service liveness/health status      |
| authentication   | 2           | 2           | Login, token refresh, logout        |
| user-lifecycle   | 2           | 2           | Registration, profile, deactivation |
| security         | 1           | 1           | Password policy, lockout, unlock    |
| token-management | 1           | 1           | JWT claims, JWKS, revocation        |
| admin            | 1           | 1           | User management panel               |
| expenses         | 5           | 5           | CRUD, currency, units, P&L, uploads |
| layout           | —           | 2           | Responsive design, accessibility    |

## Spec Artifacts

- **[c4/](./c4/README.md)** — C4 architecture diagrams (context, container, 2 component)
- **[be/](./be/README.md)** — Backend API specs (13 Gherkin features, 76 scenarios)
- **[fe/](./fe/README.md)** — Frontend app specs (15 Gherkin features, 92 scenarios)

## Related

- [Three-Level Testing Standard](../../../governance/development/quality/three-level-testing-standard.md)
- [BDD Spec-Test Mapping](../../../governance/development/infra/bdd-spec-test-mapping.md)
- [BDD Standards](../../../docs/explanation/software-engineering/development/behavior-driven-development-bdd/README.md)
