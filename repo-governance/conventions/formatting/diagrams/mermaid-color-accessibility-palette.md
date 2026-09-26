---
description: "Explains why color-blind accessibility matters for Mermaid diagrams and gives the accessible color palette to use."
when_to_use: "Use when choosing colors for a Mermaid diagram and need the accessible palette and the reasoning behind it."
---

# Mermaid Color Accessibility: Palette and Rationale

**CRITICAL REQUIREMENT**: All Mermaid diagrams MUST use color-blind friendly colors that work in both light and dark modes.

**Master Reference**: See [Color Accessibility Convention](../color-accessibility.md) for the complete authoritative guide to color usage, including verified accessible palette, WCAG standards, testing methodology, and implementation details. This section provides a summary for diagram-specific context.

## Why This Matters

Approximately 8% of males and 0.5% of females have some form of color blindness. Accessible diagrams benefit everyone with clearer, more professional appearance and ensure compliance with accessibility standards.

## Color Blindness Types to Support

1. **Protanopia (red-blind)**: Cannot distinguish red/green, sees reds and greens as brownish-yellow
2. **Deuteranopia (green-blind)**: Cannot distinguish red/green, sees reds and greens as brownish-yellow
3. **Tritanopia (blue-yellow blind)**: Cannot distinguish blue/yellow, sees blues as pink and yellows as light pink

## Accessible Color Palette

Use ONLY these proven accessible colors for Mermaid diagram elements:

**Recommended Colors (safe for all color blindness types):**

- **Blue**: `#0173B2` - Safe for all types, works in light and dark mode
- **Orange**: `#DE8F05` - Safe for all types, works in light and dark mode
- **Teal**: `#029E73` - Safe for all types, works in light and dark mode
- **Purple**: `#CC78BC` - Safe for all types, works in light and dark mode
- **Brown**: `#CA9161` - Safe for all types, works in light and dark mode
- **Black**: `#000000` - Safe for borders and text on light backgrounds
- **White**: `#FFFFFF` - Safe for text on dark backgrounds
- **Gray**: `#808080` - Safe for secondary elements

### Palette Default (Enforced)

Every `flowchart`, `graph`, `classDiagram`, `erDiagram`, or `requirementDiagram` MUST declare a
`classDef default` that sets `fill`, `stroke`, and `color` from the palette above, so no node renders
in the Mermaid theme's colours. This holds even when every node already carries a class. Use blue
unless blue already carries a meaning in that diagram; then use the neutral default:

- `classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF`
- `classDef default fill:#FFFFFF,stroke:#000000,color:#000000`

Those five types are the ones whose Mermaid renderer applies a class named `default` to every
unclassed node. `stateDiagram`, `block`, `sequenceDiagram`, `gitGraph`, `timeline`, and `mindmap`
are exempt: they either lack `classDef` or never apply `default`, so leave them on the theme colours
rather than forcing a declaration the renderer ignores. The `md-mermaid-palette` gate enforces the
declaration on changed files; `md-mermaid` checks that its colours come from the palette and meet
contrast.

**DO NOT USE:**

- FAIL: Red (`#FF0000`, `#E74C3C`, `#DC143C`) - Invisible to protanopia/deuteranopia
- FAIL: Green (`#00FF00`, `#27AE60`, `#2ECC71`) - Invisible to protanopia/deuteranopia
- FAIL: Yellow (`#FFFF00`, `#F1C40F`) - Invisible to tritanopia
- FAIL: Light red/pink (`#FF69B4`, `#FFC0CB`) - Problematic for tritanopia
- FAIL: Bright magenta (`#FF00FF`) - Problematic for all types
