---
description: When to include Mermaid diagrams in a guide, plus the TDD state machine and Basic-Auth/JWT authentication-flow diagrams.
when_to_use: Use when deciding whether a guide needs a diagram, or building a TDD/authentication-flow diagram.
---

# Guide Structure Part 4: Diagram Guidance and Authentication Flow

**When to include**:

- Architecture patterns (multi-tier, microservices, event-driven)
- Data flow across multiple systems
- State machines or lifecycle diagrams
- Deployment topologies
- Integration patterns
- Authentication/authorization flows
- Database persistence patterns
- Containerization architectures
- CI/CD pipelines
- Messaging patterns

**When NOT to include**:

- Simple linear processes
- Single-service patterns
- Trivial workflows

**Diagram requirements**:

- Use color-blind friendly palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
- Include descriptive labels
- Focus on production architecture/flow
- Use appropriate diagram type
- Show progression from standard library to framework

**Example 1: TDD State Machine**

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
stateDiagram-v2
    accTitle: Guide Structure Part 4: Diagram Guidance and Authentication Flow
    accDescr: start moves to Red on Write test; Red moves to Green on Test fails; Green moves to Refactor on Test passes; Refactor moves to Red on Tests still pass, next feature.
    [*] --> Red: Write test

    Red --> Green: Test fails
    Green --> Refactor: Test passes
    Refactor --> Red: Tests still pass,<br/>next feature

    note right of Red
        🔴 RED
        Write failing test
        Specify desired behaviour
    end note

    note right of Green
        🟢 GREEN
        Write minimum code
        Make test pass
    end note

    note right of Refactor
        ♻️ REFACTOR
        Improve code quality
        Keep tests passing
    end note

    classDef redState fill:#CC78BC,stroke:#000000,color:#000000
    classDef greenState fill:#029E73,stroke:#000000,color:#000000
    classDef refactorState fill:#0173B2,stroke:#000000,color:#FFFFFF

    class Red redState
    class Green greenState
    class Refactor refactorState
```

**Example 2a: Authentication Flow - Standard Library (Basic Auth)**

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
graph TD
    accTitle: Guide Structure Part 4: Diagram Guidance and Authentication Flow (2)
    accDescr: Client leads to Server via Username + Password Base64; Server leads to Database via Checks credentials per request; Database leads to Server via User found; Server leads to Client via 200 OK + Resource.
    A1[Client] -->|Username + Password<br/>Base64| A2[Server]
    A2 -->|Checks credentials<br/>per request| A3[Database]
    A3 -->|User found| A2
    A2 -->|200 OK + Resource| A1

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF
    class A1,A2,A3 blue
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Limitation**: Database query on every request (high latency, database load).

**Example 2b: Authentication Flow - Framework (JWT)**

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
graph TD
    accTitle: Guide Structure Part 4: Diagram Guidance and Authentication Flow (3)
    accDescr: Client leads to Auth Server via credentials; Auth Server leads to Database via validates; Database leads to Auth Server: JWT via user found; Auth Server: JWT leads to Client: JWT via JWT token; and 2 more links.
    B1[Client] -- credentials --> B2[Auth Server]
    B2 -- validates --> B3[Database]
    B3 -- user found --> B4[Auth Server: JWT]
    B4 -- JWT token --> B5[Client: JWT]
    B5 -- JWT in header --> B6[App Server]
    B6 -- verify + respond --> B7[Protected Resource]

    classDef orange fill:#DE8F05,stroke:#000000,color:#000000
    class B1,B2,B3,B4,B5,B6,B7 orange
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

**Improvement**: Single database query during login, subsequent requests use cryptographic verification (fast, stateless).
