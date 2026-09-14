---
description: "Documents the six common Mermaid diagram types (flowchart, sequence, class, ER, state, git graph) with examples."
when_to_use: "Use when choosing which Mermaid diagram type fits the relationship or process you're documenting."
---

# Common Mermaid Diagram Types

## Flowchart

Perfect for processes, workflows, and decision trees:

````markdown
```mermaid
flowchart LR
  A[User Request] --> B{Authenticated?}
  B -->|Yes| C[Process Request]
  B -->|No| D[Return 401]
  C --> E[Return Response]
```
````

```mermaid
flowchart LR
    accTitle: Flowchart
    accDescr: User Request leads to Authenticated?; Authenticated? leads to Process Request via Yes; Authenticated? leads to Return 401 via No; Process Request leads to Return Response.
    A[User Request] --> B{Authenticated?}
    B -->|Yes| C[Process Request]
    B -->|No| D[Return 401]
    C --> E[Return Response]
```

## Sequence Diagram

Shows interactions between components over time:

````markdown
```mermaid
sequenceDiagram
  participant Client
  participant API
  participant Database

  Client->>API: POST /transactions
  API->>Database: Save transaction
  Database-->>API: Confirmation
  API-->>Client: 201 Created
```
````

```mermaid
sequenceDiagram
    accTitle: Sequence Diagram
    accDescr: Client sends POST /transactions to API; API sends Save transaction to Database; Database sends Confirmation to API; API sends 201 Created to Client.
    participant Client
    participant API
    participant Database

    Client->>API: POST /transactions
    API->>Database: Save transaction
    Database-->>API: Confirmation
    API-->>Client: 201 Created
```

## Class Diagram

Represents object-oriented structures and relationships:

````markdown
```mermaid
classDiagram
  class Transaction {
    +String id
    +BigDecimal amount
    +Date timestamp
    +validate()
    +execute()
  }

  class Account {
    +String id
    +BigDecimal balance
    +debit()
    +credit()
  }

  Transaction --> Account : involves
```
````

```mermaid
classDiagram
    accTitle: Class Diagram
    accDescr: Transaction leads to Account via involves.
    class Transaction {
        +String id
        +BigDecimal amount
        +Date timestamp
        +validate()
        +execute()
    }

    class Account {
        +String id
        +BigDecimal balance
        +debit()
        +credit()
    }

    Transaction --> Account : involves
```

## Entity Relationship Diagram

Shows database schema relationships:

````markdown
```mermaid
erDiagram
  CUSTOMER ||--o{ ACCOUNT : owns
  ACCOUNT ||--o{ TRANSACTION : contains
  TRANSACTION }o--|| TRANSACTION_TYPE : has

  CUSTOMER {
    string id PK
    string name
    string email
  }

  ACCOUNT {
    string id PK
    string customer_id FK
    decimal balance
  }
```
````

```mermaid
erDiagram
    accTitle: Entity Relationship Diagram
    accDescr: CUSTOMER leads to ACCOUNT via owns; ACCOUNT leads to TRANSACTION via contains; TRANSACTION leads to TRANSACTION_TYPE via has.
    CUSTOMER ||--o{ ACCOUNT : owns
    ACCOUNT ||--o{ TRANSACTION : contains
    TRANSACTION }o--|| TRANSACTION_TYPE : has

    CUSTOMER {
        string id PK
        string name
        string email
    }

    ACCOUNT {
        string id PK
        string customer_id FK
        decimal balance
    }
```

## State Diagram

Illustrates state transitions in systems:

````markdown
```mermaid
stateDiagram-v2
  [*] --> Pending
  Pending --> Processing : start
  Processing --> Completed : success
  Processing --> Failed : error
  Failed --> Pending : retry
  Completed --> [*]
```
````

```mermaid
stateDiagram-v2
    accTitle: State Diagram
    accDescr: start moves to Pending; Pending moves to Processing on start; Processing moves to Completed on success; Processing moves to Failed on error; Failed moves to Pending on retry; Completed moves to end.
    [*] --> Pending
    Pending --> Processing : start
    Processing --> Completed : success
    Processing --> Failed : error
    Failed --> Pending : retry
    Completed --> [*]
```

## Git Graph

Shows branch and merge history:

````markdown
```mermaid
gitGraph
  commit
  branch develop
  checkout develop
  commit
  checkout main
  merge develop
  commit
```
````

```mermaid
gitGraph
    accTitle: Git Graph
    accDescr: Illustrates git graph.
    commit
    branch develop
    checkout develop
    commit
    checkout main
    merge develop
    commit
```
