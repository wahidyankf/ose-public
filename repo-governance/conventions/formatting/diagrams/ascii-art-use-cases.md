---
description: "Lists concrete ASCII art use cases — directory structures, simple diagrams, process flow, component relationships, tables."
when_to_use: "Use when you need a worked ASCII art example for a specific use case like directory trees or simple flows."
---

# ASCII Art Use Cases

## Directory Structure

Perfect for showing file and folder hierarchies:

```
open-sharia-enterprise/
 ├── .opencode/                   # Secondary coding-agent binding
 │   ├── agent/               # Specialized AI agents
 │   └── skill/               # Progressive knowledge packages
 ├── docs/                      # Documentation (Diátaxis framework)
│   ├── tutorials/            # Learning-oriented guides
│   ├── how-to/               # Problem-oriented guides
│   ├── reference/            # Technical reference
│   └── explanation/          # Conceptual documentation
├── src/                       # Source code
├── package.json              # Node.js manifest
└── README.md                 # Project README
```

## Simple Diagrams

Basic flowcharts and relationships:

```mermaid
flowchart TD
    accTitle: Simple request flow
    accDescr {
        A request goes to validation, then to process, then to the response.
    }
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
    req["Request"]
    val["Validation"]
    proc["Process"]
    resp["Response"]
    req --> val --> proc --> resp
```

## Process Flow

Sequential steps with connectors:

```mermaid
flowchart TD
    accTitle: Process flow with authentication branch
    accDescr {
        A user action starts two branches: an authentication check and a log event.
        A successful check processes the request and returns the result.
        A failed check returns 401.
    }
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
    act["User Action"]
    auth["Authentication Check"]
    ok["Process Request"]
    res["Return Result"]
    fail["Return 401"]
    log["Log Event"]
    act --> auth
    act --> log
    auth -->|Success| ok
    ok --> res
    auth -->|Failure| fail
```

## Component Relationships

System architecture overview:

```mermaid
flowchart TD
    accTitle: Component relationships
    accDescr {
        The frontend calls the API gateway.
        The gateway calls the auth service and the business logic.
        The business logic calls the database.
    }
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
    fe["Frontend (React)"]
    api["API Gateway<br/>(Express)"]
    auth["Auth Service"]
    biz["Business Logic"]
    db["Database"]
    fe --> api
    api --> auth
    api --> biz
    biz --> db
```

## Tables and Matrices

Structured data representation:

```
┌──────────────┬─────────────────────────┐
│   Category   │         Example         │
├──────────────┼─────────────────────────┤
│  Tutorials   │  docs/tutorials/start.md│
│  How-To      │  docs/how-to/api.md     │
│  Reference   │  docs/reference/spec.md │
│  Explanation │  docs/explanation/arch.md│
└──────────────┴─────────────────────────┘
```
