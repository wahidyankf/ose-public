# Component Diagram: Next.js Frontend

Level 3 of the C4 model. Shows the logical components inside the Next.js 16 frontend container.
Organised into four layers: pages, API route handlers, Effect TS services, and Effect TS layers
(dependency injection).

**Public pages** (/login) bypass Auth Guard.
**Protected pages** (/profile) pass through Auth Guard before rendering.
**Root page** (/) redirects based on authentication state.

```mermaid
%% Color Palette: Blue #0173B2 | Orange #DE8F05 | Teal #029E73 | Purple #CC78BC | Brown #CA9161 | Gray #808080
graph LR
    EU("End User<br/>Desktop / Mobile"):::actor

    subgraph FE["Next.js Frontend Container"]

        subgraph LAYER1["Pages"]
            LP["Login Page<br/>────────────────<br/>/login<br/>Google sign-in button<br/>Public"]:::page
            PP["Profile Page<br/>────────────────<br/>/profile<br/>Name, email, avatar<br/>Protected"]:::page
            RP["Root Page<br/>────────────────<br/>/<br/>Redirect to /profile<br/>or /login"]:::page
        end

        subgraph LAYER2["API Route Handlers"]
            APRH["Auth Proxy Routes<br/>────────────────<br/>/api/auth/google<br/>/api/auth/refresh<br/>/api/auth/me<br/>Server-side proxy"]:::route
        end

        subgraph LAYER3["Effect TS Services"]
            BCS["BackendClient<br/>────────────────<br/>HTTP calls to backend<br/>Token injection<br/>Error handling"]:::service
            AS["AuthService<br/>────────────────<br/>Google login flow<br/>Token storage<br/>Session check"]:::service
        end

        subgraph LAYER4["Effect TS Layers"]
            BCL["BackendClientLive<br/>────────────────<br/>Real HTTP implementation<br/>fetch-based<br/>Production"]:::layer
            BCT["BackendClientTest<br/>────────────────<br/>In-memory mock<br/>Unit test layer"]:::layer
            AG["Auth Guard<br/>────────────────<br/>Check session<br/>Redirect to /login<br/>Protected routes only"]:::guard
        end

    end

    BE["F#/Giraffe Backend<br/>REST API"]:::external

    %% User entry points
    EU -->|"public: /login"| LP
    EU -->|"protected: /profile"| AG
    EU -->|"redirect: /"| RP

    %% Auth Guard -> Pages
    AG --> PP

    %% Pages -> Services
    LP --> AS
    PP --> BCS
    RP --> AS

    %% API Route Handlers
    AS --> APRH
    BCS --> APRH

    %% Services -> Layers
    BCS --> BCL
    BCS --> BCT

    %% Layers -> Backend
    BCL -->|"HTTP/JSON"| BE
    APRH -->|"HTTP/JSON"| BE

    %% Auth Guard -> Services
    AG --> AS

    classDef actor fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef page fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef route fill:#CA9161,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef service fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef layer fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef guard fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef external fill:#808080,stroke:#000000,color:#FFFFFF,stroke-width:2px,stroke-dasharray:5 5
```

## Gherkin Coverage by Component

Each component above is exercised by Gherkin features from
[`specs/apps/organiclever/fe/gherkin/`](../fe/gherkin/README.md):

| Component                    | Gherkin Domain | Features             |
| ---------------------------- | -------------- | -------------------- |
| Login Page + AuthService     | authentication | google-login (2)     |
| Profile Page + BackendClient | authentication | profile (2)          |
| Auth Guard + Root Page       | authentication | route-protection (4) |
| All pages                    | layout         | accessibility (5)    |

## Testing

| Level       | What                        | Gherkin             | Coverage |
| ----------- | --------------------------- | ------------------- | -------- |
| `test:unit` | Component logic, mocked API | Yes (all scenarios) | >= 70%   |
| `test:e2e`  | Full browser via Playwright | Yes (all scenarios) | N/A      |

## Related

- **Container diagram**: [container.md](./container.md)
- **Backend component diagram**: [component-be.md](./component-be.md)
- **Frontend gherkin specs**: [fe/gherkin/](../fe/gherkin/README.md)
- **Parent**: [organiclever specs](../README.md)
