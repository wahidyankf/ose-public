# Context Diagram: Demo Application

Level 1 of the C4 model. Shows the Demo Application as a single system with four external actors.
The system contains both the frontend SPA and backend REST API — this diagram treats them as one
boundary.

The system is implemented in 11 backend languages/frameworks and 3 frontend frameworks, all
conforming to a single OpenAPI 3.1 contract and shared Gherkin specifications.

```mermaid
%% Color Palette: Blue #0173B2 | Orange #DE8F05 | Teal #029E73 | Purple #CC78BC | Brown #CA9161 | Gray #808080
graph TD
    EU("End User<br/>──────────────────<br/>Auth and profile<br/>Entries and P&L<br/>Attachments<br/><br/>Desktop, Tablet, Mobile"):::actor

    ADM("Administrator<br/>──────────────────<br/>User management<br/>Disable and unlock<br/>Password reset"):::actor_admin

    OPS("Operations Engineer<br/>──────────────────<br/>Health monitoring"):::actor_ops

    SI("Service Integrator<br/>──────────────────<br/>JWT verification<br/>via JWKS endpoint"):::actor_si

    SYSTEM["Demo Application<br/>──────────────────────<br/>Frontend SPA + Backend API<br/><br/>Auth lifecycle<br/>User management<br/>Expense management<br/>P&L reporting<br/>File attachments<br/>Responsive UI"]:::system

    CI("CI Pipeline<br/>──────────────────<br/>Main CI: test:quick<br/>Per-app E2E: Playwright<br/>PR Quality Gate<br/>Codecov coverage"):::ci

    SPEC("Specifications<br/>──────────────────<br/>OpenAPI 3.1 contract<br/>14 BE Gherkin features<br/>15 FE Gherkin features"):::spec

    EU -->|"browse and interact"| SYSTEM
    ADM -->|"manage users"| SYSTEM
    OPS -->|"health check"| SYSTEM
    SI -->|"JWKS public key"| SYSTEM
    CI -->|"typecheck, lint, test"| SYSTEM
    SPEC -->|"contract and BDD specs"| SYSTEM

    classDef actor fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef actor_admin fill:#CA9161,stroke:#000000,color:#000000,stroke-width:2px
    classDef actor_ops fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef actor_si fill:#808080,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef system fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:3px
    classDef ci fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef spec fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px,stroke-dasharray:5 5
```

## Implementations

The system boundary above contains 14 interchangeable implementations:

- **11 backends**: Go/Gin, Java/Spring Boot, Java/Vert.x, Kotlin/Ktor, Python/FastAPI,
  Rust/Axum, TypeScript/Effect, F#/Giraffe, C#/ASP.NET Core, Clojure/Pedestal,
  Elixir/Phoenix
- **3 frontends**: TypeScript/Next.js, TypeScript/TanStack Start, Dart/Flutter Web

Any backend can pair with any frontend — the OpenAPI contract guarantees compatibility.

## Related

- **Container diagram**: [container.md](./container.md)
- **Backend component diagram**: [component-be.md](./component-be.md)
- **Frontend component diagram**: [component-fe.md](./component-fe.md)
- **API contract**: [../contracts/openapi.yaml](../contracts/openapi.yaml)
- **Parent**: [demo specs](../README.md)
