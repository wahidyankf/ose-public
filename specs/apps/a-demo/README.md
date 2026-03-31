# Demo Application Specs

Platform-agnostic specifications for a demo-scale full-stack application covering authentication,
user management, and a multi-currency expense domain. The application consists of a backend REST API
and a frontend single-page application (SPA).

## Structure

```
specs/apps/a-demo/
├── README.md              # This file
├── c4/                    # Unified C4 architecture diagrams
│   ├── context.md         # L1 — system context (4 actors)
│   ├── container.md       # L2 — containers (SPA, Static Server, API, DB, FS)
│   ├── component-be.md    # L3 — REST API internals
│   └── component-fe.md    # L3 — SPA internals
├── be/                    # Backend specs (HTTP-semantic)
│   ├── README.md
│   └── gherkin/           # Backend Gherkin scenarios (see be/gherkin/README)
├── fe/                    # Frontend specs (UI-semantic)
│   ├── README.md
│   └── gherkin/           # Frontend Gherkin scenarios (see fe/gherkin/README)
└── fs/                    # Fullstack specs (BE + FE combined)
    ├── README.md
    └── gherkin/           # Fullstack-specific Gherkin scenarios (see fs/gherkin/README)
```

## Backend vs Frontend

| Aspect      | Backend (be/)                                      | Frontend (fe/)                                     |
| ----------- | -------------------------------------------------- | -------------------------------------------------- |
| Perspective | HTTP-semantic (GET, POST, status codes)            | UI-semantic (clicks, types, sees)                  |
| Background  | `Given the API is running`                         | `Given the app is running`                         |
| Scenarios   | See [be/gherkin/](./be/gherkin/README.md)          | See [fe/gherkin/](./fe/gherkin/README.md)          |
| Domains     | 7 domains                                          | 8 domains (7 shared + layout)                      |
| Consumed by | `apps/a-demo-be-{lang}-{framework}/` (11 backends) | `apps/a-demo-fe-{lang}-{framework}/` (5 frontends) |

Both spec sets cover the same functional surface from different perspectives. The frontend app
consumes the backend API.

Fullstack apps (`apps/a-demo-fs-{lang}-{framework}/`) consume **both** BE and FE Gherkin specs
since they combine backend and frontend in a single deployable unit.

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
- **[be/](./be/README.md)** — Backend API specs ([Gherkin features](./be/gherkin/README.md))
- **[fe/](./fe/README.md)** — Frontend app specs ([Gherkin features](./fe/gherkin/README.md))
- **[fs/](./fs/README.md)** — Fullstack specs ([Gherkin features](./fs/gherkin/README.md))
- **[contracts/](./contracts/README.md)** — OpenAPI 3.1 API contract (request/response shapes,
  code generation, browsable documentation)

## Spec Consumption

All demo backends consume the backend Gherkin specs at **all three test levels**:

- **`test:unit`** — steps call service functions with mocked dependencies; Gherkin spec paths
  are included in Nx cache inputs so cache invalidates when specs change
- **`test:quick`** — unit + coverage check; Gherkin spec paths included in Nx cache inputs
- **`test:integration`** — steps call service functions with real PostgreSQL; cache disabled

Spec-coverage validation (`rhino-cli spec-coverage validate`) is planned but deferred — the tool
needs enhancement to support demo-be test file naming conventions before it can be enforced in
`test:quick`.

## Related

- [Three-Level Testing Standard](../../../governance/development/quality/three-level-testing-standard.md)
- [BDD Spec-Test Mapping](../../../governance/development/infra/bdd-spec-test-mapping.md)
- [BDD Standards](../../../docs/explanation/software-engineering/development/behavior-driven-development-bdd/README.md)
