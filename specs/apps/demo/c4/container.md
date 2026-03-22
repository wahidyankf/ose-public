# Container Diagram: Demo Application

Level 2 of the C4 model. Shows the runtime containers inside the Demo Application system
boundary: the browser-based SPA, the static file server, the REST API, the database, file
storage, and the supporting infrastructure (CI pipelines, API contract, Gherkin specs).

The SPA runs in the user's browser. Build artifacts are served by a static file server (CDN, Nginx,
or framework dev server). All API calls go through the REST API to the database and file storage.
The token blacklist is stored inside the Database — no separate cache is required at demo scale.

Each container has multiple interchangeable implementations (shown below the diagram).

```mermaid
%% Color Palette: Blue #0173B2 | Orange #DE8F05 | Teal #029E73 | Purple #CC78BC | Brown #CA9161 | Gray #808080
graph TD
    EU("End User<br/>Desktop / Tablet / Mobile"):::actor
    ADM("Administrator"):::actor_admin
    OPS("Operations Engineer"):::actor_ops
    SI("Service Integrator"):::actor_si

    subgraph SYSTEM["Demo Application"]
        SPA["Single Page Application<br/>──────────────────<br/>Browser-based SPA<br/><br/>Responsive layout<br/>Client-side routing<br/>State management<br/>Form validation<br/>Token management"]:::container_fe

        STATIC["Static File Server<br/>──────────────────<br/>CDN or Nginx<br/><br/>HTML, CSS, JS bundles<br/>Static assets"]:::infra

        API["REST API<br/>──────────────────<br/>Single REST API<br/><br/>All HTTP routes<br/>Auth enforcement<br/>Input validation<br/>Business logic<br/>JWKS endpoint"]:::container_be

        DB[("Database<br/>──────────────────<br/>PostgreSQL<br/><br/>Users and status<br/>Tokens and blacklist<br/>Entries<br/>Attachment metadata")]:::datastore

        FS[("File Storage<br/>──────────────────<br/>Filesystem or volume<br/><br/>JPEG, PNG, PDF")]:::filestorage
    end

    subgraph SPECS["Specifications"]
        CONTRACT["OpenAPI 3.1 Contract<br/>──────────────────<br/>specs/apps/demo/contracts/<br/><br/>Types, endpoints, schemas<br/>Generates code via codegen"]:::spec

        BE_GHERKIN["Backend Gherkin<br/>──────────────────<br/>specs/apps/demo/be/gherkin/<br/><br/>14 features, 82 scenarios<br/>9 domains"]:::spec

        FE_GHERKIN["Frontend Gherkin<br/>──────────────────<br/>specs/apps/demo/fe/gherkin/<br/><br/>15 features, 92 scenarios<br/>9 domains"]:::spec
    end

    subgraph CICD["CI Pipelines"]
        MAIN_CI["Main CI<br/>──────────────────<br/>typecheck, lint, test:quick<br/>Codecov upload<br/>On push to main"]:::ci

        E2E_CI["Per-App E2E CI<br/>──────────────────<br/>Docker Compose stack<br/>Playwright tests<br/>Twice daily"]:::ci

        PR_CI["PR Quality Gate<br/>──────────────────<br/>Affected projects only<br/>On pull request"]:::ci
    end

    EU -->|"browser"| SPA
    ADM -->|"browser"| SPA
    OPS -->|"browser / health check"| SPA
    SI -->|"JWKS public key"| API

    SPA -->|"initial page load"| STATIC
    SPA -->|"REST API calls<br/>JSON + multipart"| API

    API -->|"users, tokens, entries"| DB
    API -->|"binary files"| FS

    CONTRACT -->|"codegen types"| API
    CONTRACT -->|"codegen types"| SPA
    BE_GHERKIN -->|"BDD scenarios"| API
    FE_GHERKIN -->|"BDD scenarios"| SPA

    MAIN_CI -->|"test all"| API
    MAIN_CI -->|"test all"| SPA
    E2E_CI -->|"full stack test"| API
    E2E_CI -->|"full stack test"| SPA

    classDef actor fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef actor_admin fill:#CA9161,stroke:#000000,color:#000000,stroke-width:2px
    classDef actor_ops fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef actor_si fill:#808080,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef container_fe fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef container_be fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef infra fill:#808080,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef datastore fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef filestorage fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px,stroke-dasharray:5 5
    classDef spec fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px,stroke-dasharray:5 5
    classDef ci fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
```

## Container Implementations

### REST API (11 implementations)

| App                       | Language   | Framework    | Database   | Coverage |
| ------------------------- | ---------- | ------------ | ---------- | -------- |
| demo-be-golang-gin        | Go         | Gin          | PostgreSQL | >= 90%   |
| demo-be-java-springboot   | Java       | Spring Boot  | PostgreSQL | >= 90%   |
| demo-be-java-vertx        | Java       | Vert.x       | PostgreSQL | >= 90%   |
| demo-be-kotlin-ktor       | Kotlin     | Ktor         | PostgreSQL | >= 90%   |
| demo-be-python-fastapi    | Python     | FastAPI      | PostgreSQL | >= 90%   |
| demo-be-rust-axum         | Rust       | Axum         | PostgreSQL | >= 90%   |
| demo-be-ts-effect         | TypeScript | Effect       | PostgreSQL | >= 90%   |
| demo-be-fsharp-giraffe    | F#         | Giraffe      | PostgreSQL | >= 90%   |
| demo-be-csharp-aspnetcore | C#         | ASP.NET Core | PostgreSQL | >= 90%   |
| demo-be-clojure-pedestal  | Clojure    | Pedestal     | PostgreSQL | >= 90%   |
| demo-be-elixir-phoenix    | Elixir     | Phoenix      | PostgreSQL | >= 90%   |

### Single Page Application (3 implementations)

| App                       | Language   | Framework      | Coverage |
| ------------------------- | ---------- | -------------- | -------- |
| demo-fe-ts-nextjs         | TypeScript | Next.js 16     | >= 70%   |
| demo-fe-ts-tanstack-start | TypeScript | TanStack Start | >= 70%   |
| demo-fe-dart-flutterweb   | Dart       | Flutter Web    | >= 70%   |

### E2E Test Suites

| App         | Targets         | Scope                       |
| ----------- | --------------- | --------------------------- |
| demo-be-e2e | All 11 backends | Playwright, per-backend CI  |
| demo-fe-e2e | All 3 frontends | Playwright, per-frontend CI |

## Related

- **Context diagram**: [context.md](./context.md)
- **Backend component diagram**: [component-be.md](./component-be.md)
- **Frontend component diagram**: [component-fe.md](./component-fe.md)
- **API contract**: [../contracts/openapi.yaml](../contracts/openapi.yaml)
- **Parent**: [demo specs](../README.md)
