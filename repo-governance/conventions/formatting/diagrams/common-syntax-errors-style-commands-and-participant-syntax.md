---
description: "Documents Error 4 and Error 5: style command placement in sequence diagrams and participant `as` syntax mistakes."
when_to_use: "Use when a Mermaid sequence diagram's style commands or participant aliasing aren't working as expected."
---

# Common Mermaid Syntax Errors: Style Commands and Sequence-Diagram Participant Syntax

## Error 4: Style Commands in Sequence Diagrams

**CRITICAL**: The `style` command only works in `graph`/`flowchart` diagrams, NOT in `sequenceDiagram`.

**Problem Example (FAIL: BROKEN):**

```text
sequenceDiagram
    participant User
    participant System

    User->>System: Request
    System-->>User: Response

    style User fill:#0173B2           %% ERROR: style not supported in sequence diagrams
    style System fill:#DE8F05         %% ERROR: style not supported in sequence diagrams
```

**Solution (PASS: WORKING):**

For sequence diagrams, use `box` syntax for grouping and coloring instead:

```mermaid
sequenceDiagram
    accTitle: Error 4: Style Commands in Sequence Diagrams
    accDescr: User sends Request to System; System sends Response to User.
    box Blue User Side
        participant User
    end
    box Orange System Side
        participant System
    end

    User->>System: Request
    System-->>User: Response
```

**Alternative: Use graph/flowchart for styled diagrams:**

```mermaid
flowchart LR
    accTitle: Error 4: Style Commands in Sequence Diagrams (2)
    accDescr: User leads to System.
    User[User]:::blue
    System[System]:::orange

    User --> System

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**Rationale**: Mermaid diagram types have different syntax capabilities. `style` commands are only valid in graph-based diagrams (graph, flowchart), not in interaction diagrams (sequenceDiagram, classDiagram, stateDiagram).

**Real-World Example Fixed:**

- Python intermediate Example 33 (context manager): Removed `style` commands from sequence diagram

## Error 5: Sequence Diagram Participant Syntax with "as" Keyword

**CRITICAL**: Using `participant X as "Display Name"` syntax with quotes in sequence diagrams causes rendering failures in some Mermaid environments.

**Problem Example (FAIL: BROKEN)**:

```text
sequenceDiagram
    participant Main as "main()"
    participant Loop as "Event Loop"
    participant F1 as "fetch_data(api1)"

    Main->>Loop: Start execution
    Loop->>F1: Call async function
    F1-->>Loop: Return result
```

**Why it fails**: Some Mermaid renderers struggle with complex display names containing spaces, parentheses, or special characters when combined with the `as` keyword and quotes. This syntax pattern causes parsing errors.

**Solution (PASS: WORKING)**:

Use simple participant identifiers without the `as` keyword:

```mermaid
sequenceDiagram
    accTitle: Error 5: Sequence Diagram Participant Syntax with as Keyword
    accDescr: Main sends Start execution to EventLoop; EventLoop sends Call async function to API1; API1 sends Return result to EventLoop.
    participant Main
    participant EventLoop
    participant API1

    Main->>EventLoop: Start execution
    EventLoop->>API1: Call async function
    API1-->>EventLoop: Return result
```

**Alternative - Descriptive names without quotes**:

If you need descriptive names, use CamelCase or underscores without the `as` keyword:

```mermaid
sequenceDiagram
    accTitle: Error 5: Sequence Diagram Participant Syntax with as Keyword (2)
    accDescr: MainFunction sends Initialize to EventLoop; EventLoop sends Retrieve data to FetchData; FetchData sends Data received to EventLoop.
    participant MainFunction
    participant EventLoop
    participant FetchData

    MainFunction->>EventLoop: Initialize
    EventLoop->>FetchData: Retrieve data
    FetchData-->>EventLoop: Data received
```

**Rule**: In sequence diagrams, use simple participant identifiers. Avoid the `as` keyword with quoted display names. Use CamelCase or simple names instead of quoted strings with spaces or special characters.

**Rationale**:

- Simple participant syntax is the canonical example in Mermaid documentation
- Complex display names with `as` keyword and quotes cause parsing errors in some renderers
- Simple identifiers are more reliable across different Mermaid versions and rendering contexts

**Affected diagram types**: `sequenceDiagram` only (not `graph`/`flowchart`)

**Real-World Examples Fixed:**

- Python intermediate Example 33 (async/await): Changed `participant Main as "main()"` to `participant Main`
- Elixir advanced Example 62 (GenServer): Changed `participant Client as "Client Process"` to `participant Client`
