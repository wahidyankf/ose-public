# Context Diagram: OrganicLever

Level 1 of the C4 model. Shows the OrganicLever system as a single boundary with two external
actors. The system contains both the Next.js frontend and the F#/Giraffe backend REST API.

```mermaid
%% Color Palette: Blue #0173B2 | Orange #DE8F05 | Teal #029E73 | Purple #CC78BC | Brown #CA9161 | Gray #808080
graph TD
    EU("End User<br/>──────────────────<br/>Login via Google OAuth<br/>View profile<br/><br/>Desktop, Mobile"):::actor

    OPS("Operations Engineer<br/>──────────────────<br/>Health monitoring"):::actor_ops

    SYSTEM["OrganicLever<br/>──────────────────────<br/>Frontend SPA + Backend API<br/><br/>Google OAuth login<br/>Protected user profile<br/>Service health status"]:::system

    CI("CI Pipeline<br/>──────────────────<br/>Main CI: test:quick<br/>E2E: Playwright<br/>PR Quality Gate"):::ci

    SPEC("Specifications<br/>──────────────────<br/>3 BE Gherkin features<br/>4 FE Gherkin features"):::spec

    EU -->|"browse and interact"| SYSTEM
    OPS -->|"health check"| SYSTEM
    CI -->|"typecheck, lint, test"| SYSTEM
    SPEC -->|"BDD specs"| SYSTEM

    classDef actor fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef actor_ops fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef system fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:3px
    classDef ci fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef spec fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px,stroke-dasharray:5 5
```

## Related

- **Container diagram**: [container.md](./container.md)
- **Backend component diagram**: [component-be.md](./component-be.md)
- **Frontend component diagram**: [component-fe.md](./component-fe.md)
- **Parent**: [organiclever specs](../README.md)
