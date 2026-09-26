---
description: "Lists general best practices for writing maintainable, readable Mermaid diagrams."
when_to_use: "Use when writing a new Mermaid diagram and want the general best-practices checklist."
---

# Mermaid Best Practices

1. **Keep it Simple** - Complex diagrams become hard to maintain
2. **Use Descriptive Labels** - Clear node names improve readability
3. **Add Comments** - Explain complex logic with inline comments
4. **Test Rendering** - Preview on GitHub or in a markdown viewer before committing
5. **Version Control Friendly** - Use consistent formatting for easier diffs
6. **Default to LR Orientation** - Use `flowchart LR` or `graph LR` for mobile-friendly viewing; only use TD when semantically required (see Diagram Orientation rule)
7. **Use Color-Blind Friendly Colors** - REQUIRED: Use accessible hex codes in `classDef` from verified palette, including a palette `classDef default` in every flowchart, graph, class, ER, and requirement diagram (see Color Accessibility below)
8. **Document Color Scheme** - RECOMMENDED: Add ONE color palette comment at the start listing colors used (aids verification, but somewhat redundant if `classDef` already has correct hex codes). No duplicate comments
9. **Correct Comment Syntax** - Use `%%` for comments, NOT `%%{ }%%` (see Comment Syntax below)
