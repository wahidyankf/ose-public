---
description: "Documents Error 2 and Error 3: literal quotes inside node text and nested escaping problems in Mermaid."
when_to_use: "Use when a Mermaid diagram has quote characters or nested escaping that isn't rendering correctly."
---

# Common Mermaid Syntax Errors: Literal Quotes and Nested Escaping in Node Text

## Error 2: Literal Quotes Inside Node Text

**CRITICAL**: Literal quote characters inside Mermaid node text cause parsing errors.

**Problem Example (FAIL: BROKEN)**:

```text
graph TD
    F[let x = "hello"]        %% ERROR: Inner quotes conflict with node syntax
    G[const name = "Alice"]   %% ERROR: Parser sees "hello" as end of node label
```

**Why it fails**: The outer `[...]` syntax uses quotes for node label definition. When literal `"` characters appear inside, the Mermaid parser interprets them as structural syntax, not literal text.

**Solution (PASS: WORKING)**:

Remove the inner quotes or use descriptive text:

```mermaid
graph TD
    accTitle: Error 2: Literal Quotes Inside Node Text
    accDescr: Shows let x = hello, const name = Alice, let x = string value.
    F[let x = hello]              %% CORRECT: No inner quotes
    G[const name = Alice]         %% CORRECT: No inner quotes
    H[let x = string value]       %% CORRECT: Descriptive text
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

**Rule**: Avoid literal quote characters inside Mermaid node text. If you need to show a string value, omit the quotes or use descriptive text.

**Real-World Context**: This error was discovered when trying to show code syntax like `let x = "hello"` in Mermaid nodes.

## Error 3: Nested Escaping in Node Text

**CRITICAL**: Combining HTML entity codes with escaped quotes in the same node text causes parsing failures.

**Problem Example (FAIL: BROKEN):**

```text
graph TD
    A["JSON #123;name:Alice#125;"]    %% ERROR: Nested escaping fails
```

**Why it fails**: The combination of `#123;#125;` (entity codes for curly braces) with `\"` (escaped quotes) creates nested escaping that the Mermaid parser cannot handle.

**Solution (PASS: WORKING):**

Simplify the text - remove quotes or use plain text instead of trying to escape multiple special characters:

```text
graph TD
    A["JSON #123;name:Alice#125;"]                %% CORRECT: No quotes, just entity codes
    B["JSON object with name field"]              %% CORRECT: Plain text description
```

**Rule**: Avoid nested escaping patterns. If you need both entity codes AND special punctuation in the same node:

- Option 1: Remove the punctuation (often quotes can be omitted)
- Option 2: Simplify to plain text description
- Option 3: Split into multiple nodes
- Do NOT combine entity codes with escaped quotes (`#123;` + `\"`) in the same node

**Real-World Context**: This error was discovered when trying to show JSON syntax like `{"name":"value"}` in Mermaid nodes. The working solution is to use entity codes for braces but omit the quotes: `#123;name:value#125;`.
