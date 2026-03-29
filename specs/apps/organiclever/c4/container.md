# Container Diagram: OrganicLever

Level 2 of the C4 model. Shows the runtime containers inside the OrganicLever system boundary:
the Next.js 16 frontend, the F#/Giraffe backend REST API, and the PostgreSQL database.

The frontend runs server-side in Next.js. Protected page routes proxy API calls to the backend
via Next.js API route handlers. All authentication and data storage flows through the backend to
the database.

```mermaid
%% Color Palette: Blue #0173B2 | Orange #DE8F05 | Teal #029E73 | Purple #CC78BC | Brown #CA9161 | Gray #808080
graph TD
    EU("End User<br/>Desktop / Mobile"):::actor
    OPS("Operations Engineer"):::actor_ops

    subgraph SYSTEM["OrganicLever"]
        FE["Next.js Frontend<br/>──────────────────<br/>Next.js 16, TypeScript<br/>Effect TS<br/><br/>Google OAuth login<br/>Protected /profile route<br/>Server-side rendering<br/>API route handlers"]:::container_fe

        BE["F#/Giraffe Backend<br/>──────────────────<br/>F#, Giraffe<br/><br/>Health endpoint<br/>Google OAuth login<br/>Token refresh<br/>User profile (me)"]:::container_be

        DB[("PostgreSQL<br/>──────────────────<br/>PostgreSQL<br/><br/>Users<br/>Refresh tokens")]:::datastore
    end

    subgraph SPECS["Specifications"]
        BE_GHERKIN["Backend Gherkin<br/>──────────────────<br/>specs/apps/organiclever/be/gherkin/<br/><br/>See be/gherkin/README"]:::spec

        FE_GHERKIN["Frontend Gherkin<br/>──────────────────<br/>specs/apps/organiclever/fe/gherkin/<br/><br/>See fe/gherkin/README"]:::spec
    end

    subgraph CICD["CI Pipelines"]
        MAIN_CI["Main CI<br/>──────────────────<br/>typecheck, lint, test:quick<br/>Codecov upload<br/>On push to main"]:::ci

        E2E_CI["E2E CI<br/>──────────────────<br/>Docker Compose stack<br/>Playwright tests"]:::ci
    end

    EU -->|"HTTPS"| FE
    OPS -->|"health check"| BE

    FE -->|"server-side proxy<br/>HTTP/JSON"| BE

    BE -->|"users, refresh tokens<br/>TCP/SQL"| DB

    BE_GHERKIN -->|"BDD scenarios"| BE
    FE_GHERKIN -->|"BDD scenarios"| FE

    MAIN_CI -->|"test all"| BE
    MAIN_CI -->|"test all"| FE
    E2E_CI -->|"full stack test"| BE
    E2E_CI -->|"full stack test"| FE

    classDef actor fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef actor_ops fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef container_fe fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef container_be fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef datastore fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef spec fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px,stroke-dasharray:5 5
    classDef ci fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
```

## Container Implementations

### Backend

| App             | Language | Framework | Database   | Coverage |
| --------------- | -------- | --------- | ---------- | -------- |
| organiclever-be | F#       | Giraffe   | PostgreSQL | >= 90%   |

### Frontend

| App             | Language   | Framework  | Coverage |
| --------------- | ---------- | ---------- | -------- |
| organiclever-fe | TypeScript | Next.js 16 | >= 70%   |

## Related

- **Context diagram**: [context.md](./context.md)
- **Backend component diagram**: [component-be.md](./component-be.md)
- **Frontend component diagram**: [component-fe.md](./component-fe.md)
- **Parent**: [organiclever specs](../README.md)
