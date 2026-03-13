# Component Diagram: REST API

Level 3 of the C4 model. Shows the logical components inside the REST API container and how
they relate. Organised into four layers: HTTP handlers, middleware, domain services, and
infrastructure (repositories + shared utilities).

**Public routes** (register, login, health, JWKS) bypass JWT Middleware.
**Protected routes** pass through JWT Middleware before reaching their handler.
**Admin routes** additionally pass through Admin Middleware after JWT Middleware.

```mermaid
%% Color Palette: Blue #0173B2 | Orange #DE8F05 | Teal #029E73 | Purple #CC78BC | Brown #CA9161 | Gray #808080
graph LR
    EU("End User"):::actor
    ADM("Administrator"):::actor_admin

    subgraph RESTAPI["REST API Container"]

        subgraph LAYER1["HTTP Handlers"]
            HH["Health Handler<br/>────────────────<br/>GET /health<br/>GET /jwks.json<br/>Public"]:::handler
            AH["Auth Handler<br/>────────────────<br/>register, login<br/>Public<br/>refresh, logout<br/>logout-all"]:::handler
            UH["User Handler<br/>────────────────<br/>GET profile<br/>PATCH profile<br/>change password<br/>deactivate"]:::handler
            ADMH["Admin Handler<br/>────────────────<br/>list users<br/>disable, enable<br/>unlock<br/>force-reset"]:::handler_admin
            EH["Expense Handler<br/>────────────────<br/>create, list<br/>get, update<br/>delete, summary"]:::handler
            RPH["Reporting Handler<br/>────────────────<br/>GET P&L report<br/>by date range"]:::handler
            ATH["Attachment Handler<br/>────────────────<br/>upload, list<br/>delete"]:::handler
        end

        subgraph LAYER2["Middleware"]
            JWTMW["JWT Middleware<br/>────────────────<br/>Validate token<br/>Check blacklist<br/>Check account<br/>All protected routes"]:::middleware
            ADMINMW["Admin Middleware<br/>────────────────<br/>Verify admin role<br/>Admin routes only"]:::middleware
        end

        subgraph LAYER3["Domain Services"]
            AS["Auth Service<br/>────────────────<br/>Password hash<br/>JWT issuance<br/>Token rotation<br/>Lockout tracking<br/>Revoke all tokens"]:::service
            US["User Service<br/>────────────────<br/>Profile CRUD<br/>Password change<br/>Self-deactivation"]:::service
            ADMS["Admin Service<br/>────────────────<br/>User list, search<br/>Disable, enable<br/>Unlock account<br/>Force-reset token"]:::service_admin
            ES["Expense Service<br/>────────────────<br/>Entry CRUD<br/>Currency validation<br/>Amount validation<br/>Ownership check"]:::service
            RS["Reporting Service<br/>────────────────<br/>P&L aggregation<br/>Category breakdown<br/>Net calculation"]:::service
            ATS["Attachment Service<br/>────────────────<br/>Type whitelist<br/>Size limit check<br/>File storage I/O<br/>Ownership check"]:::service
        end

        subgraph LAYER4["Infrastructure"]
            UR["User Repository<br/>────────────────<br/>User CRUD<br/>Status updates<br/>Email lookup"]:::repo
            TR["Token Repository<br/>────────────────<br/>Token rotation<br/>Blacklist CRUD<br/>Revoke all"]:::repo
            ER["Expense Repository<br/>────────────────<br/>Entry CRUD<br/>Summary queries<br/>P&L queries"]:::repo
            AR["Attachment Repo<br/>────────────────<br/>Metadata CRUD"]:::repo
            KP["JWT Key Pair<br/>────────────────<br/>RSA private key<br/>RSA public key"]:::infra
            PH["Password Hasher<br/>────────────────<br/>Hash on register<br/>Compare on login"]:::infra
        end

    end

    DB[("Database<br/>SQLite or Postgres")]:::datastore
    FS[("File Storage")]:::filestorage
    FE["Single Page Application"]:::external

    %% Public entry points — bypass JWT Middleware
    EU -->|"public: register, login"| AH
    EU -->|"public: health, JWKS"| HH

    %% Protected entry points — through JWT Middleware
    EU -->|"protected routes"| JWTMW
    ADM -->|"protected routes"| JWTMW

    %% Middleware routing
    JWTMW -->|"user routes"| UH
    JWTMW -->|"expense routes"| EH
    JWTMW -->|"report routes"| RPH
    JWTMW -->|"attachment routes"| ATH
    JWTMW -->|"refresh, logout"| AH
    JWTMW -->|"admin routes"| ADMINMW
    ADMINMW -->|"admin routes"| ADMH

    %% Middleware checks infrastructure
    JWTMW -->|"verify signature"| KP
    JWTMW -->|"check blacklist"| TR
    JWTMW -->|"check account"| UR

    %% Handlers → Services
    AH --> AS
    UH --> US
    ADMH --> ADMS
    EH --> ES
    RPH --> RS
    ATH --> ATS
    HH -->|"read public key"| KP

    %% Services → Repositories and shared infrastructure
    AS --> UR
    AS --> TR
    AS --> KP
    AS --> PH
    US --> UR
    US --> TR
    US --> PH
    ADMS --> UR
    ES --> ER
    RS --> ER
    ATS --> AR

    %% Repositories → Database
    UR --> DB
    TR --> DB
    ER --> DB
    AR --> DB

    %% Attachment Service → File Storage
    ATS --> FS

    classDef actor fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef actor_admin fill:#CA9161,stroke:#000000,color:#000000,stroke-width:2px
    classDef handler fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef handler_admin fill:#CA9161,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef middleware fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef service fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef service_admin fill:#CA9161,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef repo fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef infra fill:#808080,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef datastore fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef filestorage fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px,stroke-dasharray:5 5
    classDef external fill:#808080,stroke:#000000,color:#FFFFFF,stroke-width:2px,stroke-dasharray:5 5
```

## Related

- **Container diagram**: [container.md](./container.md)
- **Frontend component diagram**: [component-fe.md](./component-fe.md)
- **Backend gherkin specs**: [be/gherkin/](../be/gherkin/README.md)
