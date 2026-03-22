# Component Diagram: Single Page Application

Level 3 of the C4 model. Shows the logical components inside the SPA container and how they relate.
Organised into five layers: pages, shared components, state management, API client, and
infrastructure.

**Public pages** (login, registration) bypass Auth Guard.
**Protected pages** pass through Auth Guard before rendering.
**Admin pages** additionally pass through Admin Guard after Auth Guard.

```mermaid
%% Color Palette: Blue #0173B2 | Orange #DE8F05 | Teal #029E73 | Purple #CC78BC | Brown #CA9161 | Gray #808080
graph LR
    EU("End User<br/>Desktop / Tablet / Mobile"):::actor
    ADM("Administrator"):::actor_admin

    subgraph SPA["Single Page Application"]

        subgraph LAYER1["Pages"]
            LP["Login Page<br/>────────────────<br/>Username + password<br/>Error display<br/>Public"]:::page
            RP["Registration Page<br/>────────────────<br/>Form validation<br/>Password strength<br/>Public"]:::page
            DP["Dashboard Page<br/>────────────────<br/>Overview stats<br/>Quick actions<br/>Protected"]:::page
            PP["Profile Page<br/>────────────────<br/>Display name edit<br/>Password change<br/>Deactivate account"]:::page
            ELP["Entry List Page<br/>────────────────<br/>Paginated table/cards<br/>Filter and sort<br/>Responsive layout"]:::page
            EDP["Entry Detail Page<br/>────────────────<br/>Full entry view<br/>Edit inline<br/>Attachment list"]:::page
            NEP["New Entry Page<br/>────────────────<br/>Entry form<br/>Currency select<br/>Unit select"]:::page
            RPP["Reporting Page<br/>────────────────<br/>Date range picker<br/>Currency filter<br/>P&L chart"]:::page
            AP["Admin Panel<br/>────────────────<br/>User list and search<br/>Disable, enable<br/>Unlock, reset"]:::page_admin
            HSP["Health Status<br/>────────────────<br/>Backend health<br/>indicator"]:::page
        end

        subgraph LAYER2["Shared Components"]
            NAV["Navigation<br/>────────────────<br/>Sidebar (desktop)<br/>Icons (tablet)<br/>Drawer (mobile)"]:::component
            FORM["Form Kit<br/>────────────────<br/>Inputs, selects<br/>Validation display<br/>File upload"]:::component
            TABLE["Data Display<br/>────────────────<br/>Table (desktop)<br/>Cards (mobile)<br/>Pagination"]:::component
            MODAL["Modal and Dialog<br/>────────────────<br/>Confirmation<br/>Focus trap<br/>Accessible"]:::component
        end

        subgraph LAYER3["State Management"]
            AUTH_STORE["Auth Store<br/>────────────────<br/>Access token<br/>Refresh token<br/>User info<br/>Auto-refresh"]:::state
            ENTRY_STORE["Entry Store<br/>────────────────<br/>Entry list cache<br/>Pagination state<br/>Filter state"]:::state
            UI_STORE["UI Store<br/>────────────────<br/>Viewport size<br/>Sidebar state<br/>Theme"]:::state
        end

        subgraph LAYER4["API Client"]
            HTTP["HTTP Client<br/>────────────────<br/>Base URL config<br/>Auth header inject<br/>Token refresh<br/>Error handling"]:::api
            AUTH_API["Auth API<br/>────────────────<br/>login, register<br/>refresh, logout"]:::api
            USER_API["User API<br/>────────────────<br/>profile, password<br/>deactivate"]:::api
            EXPENSE_API["Expense API<br/>────────────────<br/>CRUD, summary<br/>P&L reports"]:::api
            ATTACH_API["Attachment API<br/>────────────────<br/>upload, list<br/>delete"]:::api
            ADMIN_API["Admin API<br/>────────────────<br/>users, disable<br/>enable, unlock<br/>reset"]:::api
        end

        subgraph LAYER5["Infrastructure"]
            ROUTER["Router<br/>────────────────<br/>Client-side routing<br/>Route guards<br/>Lazy loading"]:::infra
            AUTH_GUARD["Auth Guard<br/>────────────────<br/>Check token<br/>Redirect to login"]:::guard
            ADMIN_GUARD["Admin Guard<br/>────────────────<br/>Check admin role<br/>Redirect to 403"]:::guard
            VIEWPORT["Viewport Observer<br/>────────────────<br/>Resize listener<br/>Breakpoint detection<br/>desktop/tablet/mobile"]:::infra
        end

    end

    API["Demo Backend<br/>REST API"]:::external

    %% Public entry points — bypass Auth Guard
    EU -->|"public: login, register"| ROUTER
    EU -->|"protected routes"| ROUTER

    ADM -->|"admin routes"| ROUTER

    %% Router → Guards → Pages
    ROUTER -->|"public routes"| LP
    ROUTER -->|"public routes"| RP
    ROUTER -->|"public routes"| HSP
    ROUTER -->|"protected routes"| AUTH_GUARD
    AUTH_GUARD --> DP
    AUTH_GUARD --> PP
    AUTH_GUARD --> ELP
    AUTH_GUARD --> EDP
    AUTH_GUARD --> NEP
    AUTH_GUARD --> RPP
    AUTH_GUARD -->|"admin routes"| ADMIN_GUARD
    ADMIN_GUARD --> AP

    %% Pages → Shared Components
    ELP --> TABLE
    ELP --> NAV
    EDP --> FORM
    EDP --> MODAL
    NEP --> FORM
    AP --> TABLE
    RPP --> TABLE

    %% Pages → State
    LP --> AUTH_STORE
    DP --> ENTRY_STORE
    ELP --> ENTRY_STORE
    NAV --> UI_STORE

    %% State → API Client
    AUTH_STORE --> AUTH_API
    ENTRY_STORE --> EXPENSE_API
    PP --> USER_API
    EDP --> ATTACH_API
    AP --> ADMIN_API

    %% API Client → HTTP Client → Backend
    AUTH_API --> HTTP
    USER_API --> HTTP
    EXPENSE_API --> HTTP
    ATTACH_API --> HTTP
    ADMIN_API --> HTTP
    HTTP -->|"REST calls"| API

    %% Infrastructure
    VIEWPORT --> UI_STORE
    AUTH_GUARD --> AUTH_STORE

    classDef actor fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef actor_admin fill:#CA9161,stroke:#000000,color:#000000,stroke-width:2px
    classDef page fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef page_admin fill:#CA9161,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef component fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef state fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef api fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef infra fill:#808080,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef guard fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef external fill:#808080,stroke:#000000,color:#FFFFFF,stroke-width:2px,stroke-dasharray:5 5
```

## Gherkin Coverage by Component

Each component above is exercised by Gherkin features from
[`specs/apps/demo/fe/gherkin/`](../fe/gherkin/README.md) (15 features, 92 scenarios):

| Component                             | Gherkin Domain(s) | Features                                                         |
| ------------------------------------- | ----------------- | ---------------------------------------------------------------- |
| Health Status                         | health            | health-status (2)                                                |
| Login Page + Auth Store               | authentication    | login (5), session (7)                                           |
| Registration Page                     | user-lifecycle    | registration (6)                                                 |
| Profile Page                          | user-lifecycle    | user-profile (6)                                                 |
| Admin Panel                           | admin             | admin-panel (6)                                                  |
| Entry List + Entry Detail + New Entry | expenses          | expense-management (7), currency-handling (6), unit-handling (4) |
| Reporting Page                        | expenses          | reporting (6)                                                    |
| Entry Detail (attachments)            | expenses          | attachments (10)                                                 |
| Auth Store + Auth Guard               | token-management  | tokens (6)                                                       |
| Login Page (lockout)                  | security          | security (5)                                                     |
| Navigation + Data Display + all pages | layout            | responsive (10)                                                  |
| Form Kit + Modal + all pages          | layout            | accessibility (6)                                                |

## API Contract

All 3 frontend implementations generate types from the same OpenAPI 3.1 spec:

- **Source**: [`specs/apps/demo/contracts/openapi.yaml`](../contracts/openapi.yaml)
- **Codegen target**: `nx run <frontend>:codegen` (depends on `demo-contracts:bundle`)
- **Output**: `<frontend>/generated-contracts/` or `<frontend>/src/generated-contracts/`

## Testing

| Level       | What                            | Gherkin            | Coverage |
| ----------- | ------------------------------- | ------------------ | -------- |
| `test:unit` | Service-layer calls, mocked API | Yes (92 scenarios) | >= 70%   |
| `test:e2e`  | Full browser via Playwright     | Yes (92 scenarios) | N/A      |

Frontends do not have `test:integration` — the unit/E2E split covers the
same ground. Unit tests use in-memory service clients (Flutter) or mocked
API modules (Next.js, TanStack Start).

## Related

- **Container diagram**: [container.md](./container.md)
- **Backend component diagram**: [component-be.md](./component-be.md)
- **API contract**: [../contracts/openapi.yaml](../contracts/openapi.yaml)
- **Frontend gherkin specs**: [fe/gherkin/](../fe/gherkin/README.md)
