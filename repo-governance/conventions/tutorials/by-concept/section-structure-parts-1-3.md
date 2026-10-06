---
description: "Specifies the first half of the six-part concept-section structure: title/introduction, Mermaid diagram, and narrative explanation."
when_to_use: "Read when drafting the opening (title, diagram, narrative) of a By-Concept tutorial section."
---

# Section Structure: Title, Diagram, and Narrative (Parts 1-3)

Every concept section follows a **recommended structure**:

## Part 1: Concept Title and Brief Introduction (2-3 sentences)

**Purpose**: Introduce the concept and its importance

**Must answer**:

- What is this concept?
- Why does it matter in production code?
- How does it relate to previous concepts?

**Example**:

```markdown
## Goroutines and Concurrency

Go's goroutines are lightweight threads managed by the Go runtime, not the OS. Unlike traditional threads that consume 1MB+ of stack space, goroutines start with only 2KB and grow dynamically. This design enables Go programs to run millions of concurrent operations on a single machine, making Go ideal for high-throughput network services.
```

## Part 2: Mermaid Diagram (when appropriate)

**When to include**:

- Concept involves multiple components or flow
- State machines or lifecycle diagrams clarify behaviour
- Architecture or relationships need visualization
- Comparison between approaches benefits from visual aid

**When NOT to include**:

- Simple syntax demonstrations
- Single-function concepts with clear linear flow
- Trivial operations

**Diagram requirements**:

- Use color-blind friendly palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
- Include descriptive labels on nodes and edges
- Keep diagrams focused on the specific concept
- Use appropriate diagram type (graph LR/TD, sequenceDiagram, stateDiagram-v2)

## Part 3: Narrative Explanation (3-10 paragraphs)

**Purpose**: Explain the concept in depth before showing code

**Must cover**:

- How the concept works internally
- When to use this pattern
- Common use cases and applications
- Trade-offs and alternatives
- Best practices and pitfalls

**Example**:

```markdown
Goroutines are functions that run concurrently with other functions. To start a goroutine, use the `go` keyword before a function call. The Go runtime multiplexes goroutines onto OS threads, handling scheduling and context switching automatically.

Channel-based communication prevents the shared-memory concurrency bugs that plague C++ and Java. Instead of locks and mutexes, goroutines communicate by sending values through channels. This "share memory by communicating" philosophy eliminates entire classes of race conditions.

The Go scheduler is non-preemptive at the language level but preemptive at the runtime level. Goroutines yield control at communication points (channel operations, system calls, function calls), enabling efficient cooperative multitasking with minimal overhead.
```
