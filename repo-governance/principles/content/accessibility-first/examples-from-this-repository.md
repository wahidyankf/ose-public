---
description: Real examples from this repository showing accessible Mermaid diagrams, agent categorization, and document frontmatter.
when_to_use: Use when looking for worked examples of accessibility principles applied within this repository's own content.
---

# Examples from This Repository

## Mermaid Diagrams

**Location**: All `docs/` and convention documents

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
%% All colors are color-blind friendly and meet WCAG AA contrast standards
graph TD
    accTitle: Mermaid Diagrams
    accDescr: Primary Flow Blue leads to Decision Point Orange; Decision Point Orange leads to Success Outcome Teal via Yes.
    A["Primary Flow<br/>(Blue)"]:::blue
    B["Decision Point<br/>(Orange)"]:::orange
    C["Success Outcome<br/>(Teal)"]:::teal

    A --> B
    B -->|Yes| C

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
```

**Accessibility features**:

- PASS: Color-blind friendly palette
- PASS: Black borders for shape definition
- PASS: White text for contrast
- PASS: Text labels describe each element
- PASS: Shape differentiation (rectangle vs diamond)

## AI Agent Categorization

**Location**: `.agents/agents/README.md`

```markdown
### 🟦 docs-maker.md

Expert documentation writer specializing in GitHub-compatible markdown and Diátaxis framework.
```

**Accessibility features**:

- PASS: Colored square emoji (supplementary)
- PASS: Agent name (primary identifier)
- PASS: Description text (semantic meaning)
- PASS: Accessible blue color (#0173B2)
- PASS: Multiple visual cues, not color alone

## Document Frontmatter

**Location**: All markdown documents

```yaml
---
title: "Accessibility First"
description: Design for universal access from the start
category: explanation
tags:
  - principles
  - accessibility
---
```

**Accessibility features**:

- PASS: Descriptive title
- PASS: Clear description for search engines
- PASS: Semantic categorization
- PASS: Machine-readable structure
