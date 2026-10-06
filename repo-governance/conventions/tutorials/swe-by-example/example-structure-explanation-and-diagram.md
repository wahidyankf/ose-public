---
description: "Defines Parts 1 and 2 of the mandatory five-part example format (brief explanation and mermaid diagram) and introduces the annotation density standard for Part 3."
when_to_use: "Read when writing the brief explanation or diagram portion of an example, or when you need the annotation density requirement before writing annotated code."
---

# Example Structure: Brief Explanation, Diagram, and Annotation Density Standard

Every example follows a **mandatory five-part format**:

## Part 1: Brief Explanation (2-3 sentences)

**Purpose**: Provide context and motivation

**Must answer**:

- What is this concept/pattern?
- Why does it matter in production code?
- When should you use it?

**Example**:

```markdown
### Example 23: Context-Aware Cancellation

Go's `context` package provides a standardized way to pass cancellation signals, deadlines, and request-scoped values across API boundaries. Context enables graceful shutdown of operations when requests are cancelled or time out, preventing resource leaks in production systems.
```

## Part 2: Mermaid Diagram (when appropriate)

**When to include**:

- Data flow between components is non-obvious
- State transitions need visualization
- Concurrency patterns involve multiple goroutines/processes
- Request/response cycles span multiple layers
- Memory layout or pointer relationships clarify behaviour
- Architecture patterns benefit from visual representation

**When NOT to include**:

- Simple syntax demonstrations (variable declaration, basic loops)
- Single-function examples with clear linear flow
- Trivial transformations or calculations

**Diagram requirements**:

- Use color-blind friendly palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
- Include descriptive labels on nodes and edges
- Keep diagrams focused on the specific concept (avoid overwhelming detail)
- Use appropriate diagram type (graph LR/TD, sequenceDiagram, stateDiagram-v2)

## Part 3: Heavily Annotated Code (Density Standard)

**Core requirement**: Every significant line must have an inline comment

**CRITICAL REQUIREMENT: Annotation Density Standard**

- **Density target**: 1-2.25 lines of comment for every line of code
- **Simple lines**: 1 line of annotation (variable declarations, simple operations)
- **Complex lines**: 2 lines of annotation (method calls with multiple effects, state changes)
- **Focus**: Concise explanations that scale naturally with code complexity

**Annotation Quality Over Quantity**:

- Each line of code gets 1-2 lines explaining what it does and why
- Simple lines get brief explanations, complex lines get detailed breakdowns
- Annotations remain focused without repetitive patterns across similar code

**Comment annotations use `// =>` or `# =>` notation**:

```go
x := 10                          // => x is now 10 (type: int)
y := x * 2                       // => y is 20 (x remains unchanged at 10)
result := transform(y)           // => result is "20-transformed" (string)
fmt.Println(result)              // => Output: 20-transformed
```
