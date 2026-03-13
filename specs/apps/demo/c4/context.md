# Context Diagram: Demo Application

Level 1 of the C4 model. Shows the Demo Application as a single system with four external actors.
The system contains both the frontend SPA and backend REST API — this diagram treats them as one
boundary.

```mermaid
%% Color Palette: Blue #0173B2 | Orange #DE8F05 | Teal #029E73 | Purple #CC78BC | Brown #CA9161 | Gray #808080
graph TD
    EU("End User<br/>──────────────────<br/>Auth and profile<br/>Entries and P&L<br/>Attachments<br/><br/>Desktop, Tablet, Mobile"):::actor

    ADM("Administrator<br/>──────────────────<br/>User management<br/>Disable and unlock<br/>Password reset"):::actor_admin

    OPS("Operations Engineer<br/>──────────────────<br/>Health monitoring"):::actor_ops

    SI("Service Integrator<br/>──────────────────<br/>JWT verification<br/>via JWKS endpoint"):::actor_si

    SYSTEM["Demo Application<br/>──────────────────────<br/>Frontend SPA + Backend API<br/><br/>Auth lifecycle<br/>User management<br/>Expense management<br/>P&L reporting<br/>File attachments<br/>Responsive UI"]:::system

    EU -->|"browse and interact"| SYSTEM
    ADM -->|"manage users"| SYSTEM
    OPS -->|"health check"| SYSTEM
    SI -->|"JWKS public key"| SYSTEM

    classDef actor fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef actor_admin fill:#CA9161,stroke:#000000,color:#000000,stroke-width:2px
    classDef actor_ops fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef actor_si fill:#808080,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef system fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:3px
```

## Related

- **Container diagram**: [container.md](./container.md)
- **Backend component diagram**: [component-be.md](./component-be.md)
- **Frontend component diagram**: [component-fe.md](./component-fe.md)
- **Parent**: [demo specs](../README.md)
