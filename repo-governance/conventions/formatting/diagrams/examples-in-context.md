---
description: "Shows four worked examples of diagrams used in real documentation contexts (API docs, README, tutorial, AGENTS.md)."
when_to_use: "Use when you want to see a diagram format applied in a realistic documentation context before writing your own."
---

# Examples in Context

## Example 1: API Flow in Documentation

**File**: `docs/explanation/architecture/request-flow.md`

**Use Mermaid**:

````markdown
## Request Processing Flow

```mermaid
sequenceDiagram
  participant Client
  participant Gateway
  participant Auth
  participant Business
  participant Database

  Client->>Gateway: HTTP Request
  Gateway->>Auth: Validate Token
  Auth-->>Gateway: Token Valid
  Gateway->>Business: Process Request
  Business->>Database: Query Data
  Database-->>Business: Result
  Business-->>Gateway: Response
  Gateway-->>Client: HTTP Response
```
````

## Example 2: Project Structure in README

**File**: `README.md`

**Recommended: Use Mermaid for Complex Diagrams**:

````markdown
## Project Architecture

```mermaid
graph TD
    A[Client Request] --> B[API Gateway]
    B --> C{Auth Check}
    C -->|Valid| D[Business Logic]
    C -->|Invalid| E[Return 401]
    D --> F[Database]
    F --> G[Response]
```
````

**Alternative: Use ASCII for Simple Directory Trees**:

```markdown
## Project Structure

open-sharia-enterprise/
├── .opencode/ # Secondary coding-agent binding
├── docs/ # Documentation
│ ├── tutorials/ # Step-by-step guides
│ ├── how-to/ # Problem solutions
│ └── reference/ # Technical specs
├── src/ # Source code
└── package.json # Dependencies
```

## Example 3: State Machine in Tutorial

**File**: `docs/tutorials/transactions/tu-tr__transaction-lifecycle.md`

**Use Mermaid**:

````markdown
## Transaction States

```mermaid
stateDiagram-v2
  [*] --> Draft
  Draft --> Submitted : submit()
  Submitted --> UnderReview : auto
  UnderReview --> Approved : approve()
  UnderReview --> Rejected : reject()
  Approved --> Completed : process()
  Rejected --> [*]
  Completed --> [*]
```
````

## Example 4: Component Architecture in AGENTS.md

**File**: `AGENTS.md`

**Recommended: Use Mermaid**:

````markdown
## Agent Architecture

```mermaid
graph TD
    A[Coding Agent- Main Agent] --> B[docs-maker.md]
    A --> C[rules-checker.md]
    B --> D[rules-maker.md]
    D --> E[plan-maker.md]

    B --> F[Documentation]
    D --> G[Validation]
    E --> H[Propagation]
    E --> I[Planning]
```
````

**Alternative: Use ASCII for Simple Hierarchies**:

```markdown
## Agent Architecture

Coding Agent(Main Agent)
├── docs-maker.md (Documentation)
├── rules-checker.md (Validation)
├── rules-maker.md (Propagation)
└── plan-maker.md (Planning)
```
