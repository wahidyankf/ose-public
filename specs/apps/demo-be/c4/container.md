# Container Diagram: Demo Backend

Level 2 of the C4 model. Shows the three runtime containers inside the Demo Backend system
boundary and how actors interact with them.

The token blacklist is stored inside the Database — no separate cache is required at
demo scale.

```mermaid
%% Color Palette: Blue #0173B2 | Orange #DE8F05 | Teal #029E73 | Purple #CC78BC | Brown #CA9161 | Gray #808080
graph TD
    EU("End User"):::actor
    ADM("Administrator"):::actor_admin
    OPS("Operations Engineer"):::actor_ops
    SI("Service Integrator"):::actor_si

    subgraph SYSTEM["Demo Backend System"]
        API["REST API<br/>──────────────────<br/>Single REST API<br/><br/>All HTTP routes<br/>Auth enforcement<br/>Input validation<br/>Business logic<br/>JWKS endpoint"]:::container

        DB[("Database<br/>──────────────────<br/>SQLite or Postgres<br/><br/>Users and status<br/>Tokens and blacklist<br/>Entries<br/>Attachment metadata")]:::datastore

        FS[("File Storage<br/>──────────────────<br/>Filesystem or volume<br/><br/>JPEG, PNG, PDF")]:::filestorage
    end

    EU -->|"auth and profile"| API
    EU -->|"entries and reports"| API
    EU -->|"attachments"| API
    ADM -->|"user management"| API
    OPS -->|"health check"| API
    SI -->|"JWKS public key"| API

    API -->|"users, tokens, entries"| DB
    API -->|"binary files"| FS

    classDef actor fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef actor_admin fill:#CA9161,stroke:#000000,color:#000000,stroke-width:2px
    classDef actor_ops fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef actor_si fill:#808080,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef container fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef datastore fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef filestorage fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px,stroke-dasharray:5 5
```
