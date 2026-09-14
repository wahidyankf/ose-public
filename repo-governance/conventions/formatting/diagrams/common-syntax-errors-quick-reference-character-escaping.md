---
description: "Provides a quick-reference table summarizing which characters need escaping in Mermaid diagrams and how."
when_to_use: "Use as a fast lookup when you need to know how to escape a specific character in Mermaid."
---

# Common Mermaid Syntax Errors: Quick Reference — Character Escaping

**Characters requiring HTML entity codes in Mermaid node text:**

| Character       | HTML Entity | Example Usage                           |
| --------------- | ----------- | --------------------------------------- |
| `(`             | `#40;`      | `O#40;1#41;` for "O(1)"                 |
| `)`             | `#41;`      | `O#40;1#41;` for "O(1)"                 |
| `[`             | `#91;`      | `#91;0, 1#93;` for "[0, 1]"             |
| `]`             | `#93;`      | `#91;0, 1#93;` for "[0, 1]"             |
| `{`             | `#123;`     | `#123;key: value#125;` for "{key: ...}" |
| `}`             | `#125;`     | `#123;key: value#125;` for "{key: ...}" |
| `<` (less than) | `#60;`      | `Array#60;T#62;` for "Array<T>"         |
| `>` (more than) | `#62;`      | `Array#60;T#62;` for "Array<T>"         |

**When to escape:**

- Only when these characters appear **inside square bracket node definitions** `[text here]`
- Also required in **edge labels** (`-->|text|` syntax)
- NOT needed in regular text, comments, or code blocks

> **Note on `\n` in labels**: `\n` renders as literal text in **both** node labels (`["line1\nline2"]`) and edge labels (`-->|"line1\nline2"|`). Use `<br/>` for multi-line labels (`["line1<br/>line2"]`) or shorten to single-line text.

**Example: Complex node text with multiple escapes:**

```text
graph TD
    A[HashMap#60;K, V#62;<br/>O#40;1#41; lookup<br/>Values: #91;1, 2, 3#93;<br/>Dict: #123;a: 1#125;]
```

Renders as: "HashMap<K, V> / O(1) lookup / Values: [1, 2, 3] / Dict: {a: 1}"
