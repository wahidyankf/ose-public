# Container Diagram: OrganicLever

Level 2 of the C4 model. Shows the runtime containers inside the OrganicLever system boundary:
the Next.js 16 frontend (landing site + system-status diagnostic page) and the F#/Giraffe backend
REST API (health endpoint only).

The frontend is a Next.js App Router application. v0 has no authenticated screens, no
client-side state machine, no remote sync — every productivity-tracking feature in the v0
storyboard lives in the user's browser via `localStorage`. The backend exposes only the health
endpoint; future work will add the productivity-tracking API surface.

```mermaid
%% Color Palette: Blue #0173B2 | Orange #DE8F05 | Teal #029E73 | Purple #CC78BC | Brown #CA9161 | Gray #808080
graph TD
    EU("End User<br/>Desktop / Mobile"):::actor
    OPS("Operations Engineer"):::actor_ops

    subgraph SYSTEM["OrganicLever"]
        FE["Next.js Frontend<br/>──────────────────<br/>Next.js 16, TypeScript<br/><br/>Landing page<br/>System status diagnostics<br/>Server-side rendering"]:::container_fe

        BE["F#/Giraffe Backend<br/>──────────────────<br/>F#, Giraffe<br/><br/>Health endpoint"]:::container_be
    end

    EU -->|"HTTPS"| FE
    OPS -->|"health check"| BE

    FE -->|"system-status diagnostic<br/>HTTP/JSON"| BE

    classDef actor fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef actor_ops fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef container_fe fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef container_be fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

## Specifications and CI Pipelines

The Gherkin specs and CI pipelines are not rendered in this diagram (each container is exercised
by both, so adding them would clutter the rank without adding signal). Their wiring:

- **Backend Gherkin** (`specs/apps/organiclever/be/gherkin/`) feeds `organiclever-be` BDD
  scenarios at the `test:unit` and `test:integration` levels.
- **Frontend Gherkin** (`specs/apps/organiclever/fe/gherkin/`) feeds `organiclever-web` BDD
  scenarios at the `test:unit` level and `organiclever-web-e2e` Playwright scenarios at the
  `test:e2e` level.
- **Main CI** runs `typecheck`, `lint`, `test:quick` on push to `main` for both containers.
- **E2E CI** runs the full Docker Compose stack on a twice-daily cron.

## Container Implementations

### Backend

| App             | Language | Framework | Database | Coverage |
| --------------- | -------- | --------- | -------- | -------- |
| organiclever-be | F#       | Giraffe   | none     | >= 90%   |

### Frontend

| App              | Language   | Framework  | Coverage |
| ---------------- | ---------- | ---------- | -------- |
| organiclever-web | TypeScript | Next.js 16 | >= 70%   |

## Related

- **Context diagram**: [context.md](./context.md)
- **Backend component diagram**: [component-be.md](./component-be.md)
- **Frontend component diagram**: [component-fe.md](./component-fe.md)
- **Parent**: [organiclever specs](../README.md)
