---
description: "Documents Error 1: how special characters in Mermaid node text and edge labels break rendering, with fixes."
when_to_use: "Use when a Mermaid diagram fails to render and the node text or edge labels contain special characters."
---

# Common Mermaid Syntax Errors: Special Characters in Node Text and Edge Labels

This section documents critical Mermaid syntax rules discovered through debugging production diagrams. These errors cause "syntax error in text" or rendering failures.

## Error 1: Special Characters in Node Text and Edge Labels

**CRITICAL**: Parentheses, square brackets, and curly braces inside node definitions AND edge labels cause syntax errors.

**Problem Examples (FAIL: BROKEN):**

```text
graph TD
    A[O 1 lookup]                   %% ERROR: Parentheses cause syntax error
    A --> B[function args]          %% ERROR: Parentheses cause syntax error
    B --> C[Array: 0 1 2]           %% ERROR: Square brackets cause syntax error
    C --> D[Dict: key value]        %% ERROR: Curly braces cause syntax error
    E -->|iter call| F[Iterator]    %% ERROR: Parentheses in edge label cause syntax error
```

**Solution (PASS: WORKING):**

Escape special characters using HTML entity codes:

**Entity Codes**:

- Parentheses: `(` → `#40;`, `)` → `#41;`
- Square brackets: `[` → `#91;`, `]` → `#93;`
- Curly braces: `{` → `#123;`, `}` → `#125;`
- Angle brackets: `<` → `#60;`, `>` → `#62;`

**In node text:**

```text
graph TD
    A[O#40;1#41; lookup]                     %% CORRECT: Escaped parentheses
    A --> B[function#40;args#41;]            %% CORRECT: Escaped parentheses
    B --> C[Array: #91;0, 1, 2#93;]          %% CORRECT: Escaped square brackets
    C --> D[Dict: #123;key: value#125;]      %% CORRECT: Escaped curly braces
    D --> E[Generic#60;T#62;]                %% CORRECT: Escaped angle brackets
```

**In edge labels:**

Edge labels use `-->|text|` syntax and require the same escaping:

```mermaid
graph TD
    accTitle: Error 1: Special Characters in Node Text and Edge Labels
    accDescr: A leads to Iterator via iter; Iterator leads to Has Item? via next; D leads to Value via get[key].
    A -->|iter#40;#41;| B[Iterator]          %% CORRECT: Escaped parentheses in edge label
    B -->|next#40;#41;| C{Has Item?}         %% CORRECT: Escaped parentheses in edge label
    D -->|get#91;key#93;| E[Value]           %% CORRECT: Escaped brackets in edge label
```

**Rationale**: Mermaid's parser interprets unescaped special characters as syntax elements in BOTH node text and edge labels, not literal characters.

**Real-World Examples Fixed:**

- Python beginner Example 12 (dictionaries): `O(1) lookup` → `O#40;1#41; lookup`
- Python intermediate Example 43 (deque): `O(1) operations` → `O#40;1#41; operations`
- SQL beginner (index lookup): `O(log n)` → `O#40;log n#41;`
- Rust advanced (generics): `Array<T>` → `Array#60;T#62;`
- Rust advanced (arrays): `[i32; 3]` → `#91;i32; 3#93;`
