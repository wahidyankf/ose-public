# OrganicLever Application Specs

Platform-agnostic specifications for the OrganicLever fullstack application. v0 ships a
marketing landing site, a system-status diagnostic page, and a `/api/v1/health` backend
endpoint — no authenticated screens, no remote sync. The application consists of an
F#/Giraffe backend REST API and a Next.js 16 frontend.

## Structure

```
specs/apps/organiclever/
├── README.md                  # This file
├── bounded-contexts.yaml      # DDD registry — 9 bounded contexts with layers, paths, relationships
├── c4/                        # Unified C4 architecture diagrams
│   ├── README.md          # Diagram index
│   ├── context.md         # L1 — system context (2 actors)
│   ├── container.md       # L2 — containers (FE, BE)
│   ├── component-be.md    # L3 — F#/Giraffe REST API internals
│   └── component-fe.md    # L3 — Next.js frontend internals
├── be/                    # Backend specs (HTTP-semantic)
│   ├── README.md
│   └── gherkin/           # Backend Gherkin scenarios (see be/gherkin/README)
├── fe/                    # Frontend specs (UI-semantic)
│   ├── README.md
│   └── gherkin/           # Frontend Gherkin scenarios (see fe/gherkin/README)
└── ubiquitous-language/   # Per-bounded-context glossary (shared by FE + future BE)
    ├── README.md          # Index + authoring rules
    └── *.md               # One glossary file per bounded context
```

## Backend vs Frontend

| Aspect      | Backend (be/)                                 | Frontend (fe/)                            |
| ----------- | --------------------------------------------- | ----------------------------------------- |
| Perspective | HTTP-semantic (GET, POST, status codes)       | UI-semantic (clicks, types, sees)         |
| Background  | `Given the API is running`                    | `Given the app is running`                |
| Scenarios   | See [be/gherkin/](./be/gherkin/README.md)     | See [fe/gherkin/](./fe/gherkin/README.md) |
| Domains     | health                                        | landing, system, layout, routing          |
| Consumed by | `apps/organiclever-be` (F#/Giraffe, TickSpec) | `apps/organiclever-web` (Next.js 16)      |

The frontend's system-status page consumes the backend's health endpoint. Otherwise the v0
frontend is local-first.

## Bounded Contexts

| Bounded Context | BE Features | FE Features | Description                                              |
| --------------- | ----------- | ----------- | -------------------------------------------------------- |
| app-shell       | --          | 2           | Navigation chrome, accessibility, entry-logging overlays |
| health          | 1           | 1           | Service health status (BE probe + FE diagnostic page)    |
| journal         | --          | 2           | Append-only event log — system of record (PGlite)        |
| landing         | --          | 1           | Marketing landing page                                   |
| routine         | --          | 1           | Workout routine management                               |
| routing         | --          | 2           | App routing and disabled-route 404 guards                |
| settings        | --          | 3           | User preferences — dark mode, language                   |
| stats           | --          | 2           | History and progress projections over journal events     |
| workout-session | --          | 1           | Active workout session FSM                               |

## Spec Artifacts

- **[bounded-contexts.yaml](./bounded-contexts.yaml)** — Machine-readable DDD registry consumed by `rhino-cli bc validate` and `rhino-cli ul validate` to enforce structural parity and glossary parity
- **[c4/](./c4/README.md)** — C4 architecture diagrams (context, container, 2 component)
- **[be/](./be/README.md)** — Backend API specs ([Gherkin features](./be/gherkin/README.md))
- **[fe/](./fe/README.md)** — Frontend app specs ([Gherkin features](./fe/gherkin/README.md))
- **[ubiquitous-language/](./ubiquitous-language/README.md)** — Per-bounded-context glossary, the shared platform-agnostic vocabulary consumed by `fe/` today and by `be/` once DDD adoption reaches `organiclever-be`

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
