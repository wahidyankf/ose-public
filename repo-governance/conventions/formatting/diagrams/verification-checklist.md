---
description: "Provides the pre-publish verification checklist for diagrams covering format, syntax, accessibility, and rendering."
when_to_use: "Use as a final checklist before committing a new or edited diagram."
---

# Verification Checklist

Before committing documentation with diagrams:

- [ ] Primary format is Mermaid (unless specific reason for ASCII)
- [ ] Mermaid flowcharts/graphs use LR orientation by default (or TD with a `%%` comment justifying the exception)
- [ ] Mermaid diagrams use color-blind friendly colors (only accessible palette)
- [ ] Every flowchart, graph, class, ER, and requirement diagram declares a palette `classDef default`
- [ ] Colors work in both light and dark mode
- [ ] Shape differentiation used (not relying on color alone)
- [ ] Contrast ratios meet WCAG AA standards (4.5:1 for text)
- [ ] Color scheme documented in comment above diagram
- [ ] **Each diagram has exactly ONE color palette comment** (no duplicates)
- [ ] **Mermaid comments use `%%` syntax, NOT `%%{ }%%`** (correct comment syntax)
  - [ ] **Square brackets and angle brackets escaped** (use `#91;` `#93;` `#60;` `#62;` - prevents nested delimiter conflicts)
- [ ] **Parentheses and brackets escaped in node text** (use HTML entities: `#40;` `#41;` `#91;` `#93;`)
- [ ] **No literal quotes inside node text** (remove quotes or use descriptive text like "string value")
- [ ] **No style commands in sequence diagrams** (use `box` syntax or switch to flowchart)
- [ ] **No `\n` in any label** (`\n` renders as literal characters in node labels and edge labels — use `<br/>` for multi-line labels or shorten to single-line)
- [ ] **Edge labels use no HTML other than `<br/>`** (split long edge labels with `<br/>`)
- [ ] **Node label lines ≤20 characters** (each line between `<br/>` tags; `./rhino md mermaid validate` fails anything longer)
- [ ] **Edge label strings ≤20 characters** (text inside `|"..."|` must not exceed 20 characters)
- [ ] **No URL paths or dot-prefixed tokens in edge labels** (leading `.` is parsed as a CSS class selector — describe the action in plain words instead)
- [ ] Mermaid diagrams tested in GitHub preview or a markdown viewer
- [ ] ASCII art (if used) verified in monospace font
- [ ] Format choice is intentional (not mixing Mermaid and ASCII unnecessarily)
- [ ] All labels and text are clear and readable
- [ ] Complex diagrams simplified where possible
- [ ] Diagram serves the documentation purpose
- [ ] LR orientation used by default; TD used only when semantically required and documented with a `%%` comment
