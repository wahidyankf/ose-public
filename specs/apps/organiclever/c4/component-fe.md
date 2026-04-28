# Component Diagram: Next.js Frontend

Level 3 of the C4 model. Shows the logical components inside the Next.js 16 frontend container.
v0 has no authenticated screens. The frontend ships:

- **Landing page** (`/`) — marketing copy, "Open the app" CTA, principles, weekly-rhythm demo.
- **System status page** (`/system/status/be`) — diagnostic dashboard polling the backend
  `/api/v1/health` endpoint server-side.
- **App page** (`/app`) — provisional client-side event-mechanism page; PGlite-backed
  CRUD with Effect.ts runtime, `Schema`-validated drafts, and discriminated typed
  errors. Landed by the gear-up plan; the bigger app plan replaces this with the
  full app shell (TabBar / SideNav / typed loggers) on top of the same PGlite store.
- **404 fallbacks** for `/login` and `/profile` — guards against accidental re-introduction of
  Google auth UI.

```mermaid
%% Color Palette: Blue #0173B2 | Orange #DE8F05 | Teal #029E73 | Purple #CC78BC | Brown #CA9161 | Gray #808080
graph LR
    EU("End User<br/>Desktop / Mobile"):::actor

    subgraph FE["Next.js Frontend Container"]

        subgraph LAYER1["Pages"]
            LANDING["Landing Page<br/>────────────────<br/>/<br/>Marketing site<br/>Public"]:::page
            STATUS["System Status<br/>────────────────<br/>/system/status/be<br/>BE health diagnostics<br/>Public"]:::page
            APP["App Page<br/>────────────────<br/>/app<br/>Event mechanism (provisional)<br/>Public"]:::page
        end

        subgraph LAYER2["Client-side Runtime"]
            EFFECT["Effect.ts Runtime<br/>────────────────<br/>ManagedRuntime + PgliteLive Layer<br/>Schema + Data.TaggedError"]:::runtime
            STORE["lib/events/event-store.ts<br/>────────────────<br/>Effect-returning CRUD<br/>append/update/delete/bump/list"]:::runtime
            PGLITE["PGlite (Postgres-WASM)<br/>────────────────<br/>idb://ol_events_v1<br/>events table + storage_seq"]:::storage
        end

    end

    BE["F#/Giraffe Backend<br/>REST API"]:::external

    EU -->|"public: /"| LANDING
    EU -->|"public: /system/status/be"| STATUS
    EU -->|"public: /app"| APP

    STATUS -->|"server-side fetch<br/>HTTP/JSON"| BE
    APP -->|"useEvents hook<br/>runtime.runPromise"| EFFECT
    EFFECT -->|"Layer.scoped service"| STORE
    STORE -->|"raw parameterised SQL"| PGLITE

    classDef actor fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef page fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef runtime fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef storage fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef external fill:#808080,stroke:#000000,color:#FFFFFF,stroke-width:2px,stroke-dasharray:5 5
```

## Gherkin Coverage by Component

Each component above is exercised by Gherkin features from
[`specs/apps/organiclever/fe/gherkin/`](../fe/gherkin/README.md):

| Component                                | Gherkin Domain | Features         |
| ---------------------------------------- | -------------- | ---------------- |
| Landing Page                             | landing        | landing          |
| System Status Page                       | system         | system-status-be |
| All pages                                | layout         | accessibility    |
| `/login` + `/profile` 404s               | routing        | disabled-routes  |
| App Page + PGlite + Effect runtime/store | events         | events-mechanism |

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
