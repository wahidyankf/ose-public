---
description: "Requires the verified accessible palette in Mermaid diagrams and gives implementation templates and best practices."
when_to_use: "Use when writing or reviewing a Mermaid diagram under docs/ that needs accessible color classDefs."
---

# Application Contexts: Mermaid Diagrams in docs/

**Use Case**: Visual diagrams, flowcharts, architecture diagrams where color may be a primary visual differentiator.

**Accessibility Approach**: MUST use verified accessible color palette - no red/green/yellow.

**Requirement**: All Mermaid diagrams in `docs/` directory MUST use the verified accessible color palette.

## Implementation Example

%% Color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161, Gray #808080
%% All colors are color-blind friendly and meet WCAG AA contrast standards

```mermaid
<!-- Uses colors: blue (#0173B2), orange (#DE8F05), teal (#029E73) for accessibility -->
graph TD
    A["User Request<br/>(Blue)"]:::blue
    B["Processing<br/>(Orange)"]:::orange
    C["Response<br/>(Teal)"]:::teal

    A --> B
    B --> C

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
```

## Best Practices for Mermaid Diagrams

1. **Always include borders**: Use `stroke:#000000` (black) for shape definition and contrast
2. **Use white text only on blue**: `color:#FFFFFF` on Blue `#0173B2` measures 5.13:1
3. **Use black text on orange, teal, purple, and gray**: `color:#000000`, since white text on those fills measures below 4.5:1 (see [Text on Palette Fills](./verified-color-palette.md#text-on-palette-fills))
4. **Define colors in classDef**: Don't use inline color specifications
5. **Use hex codes**: Never use CSS color names like "red", "green"
6. **Use accessible palette in classDef** (REQUIRED FOR ACCESSIBILITY): The `classDef` must contain the correct accessible hex codes from the verified palette - this is what makes diagrams accessible
7. **Document color scheme** (RECOMMENDED FOR TRANSPARENCY): Add HTML comment above diagram listing which colors are used - this aids verification and signals intent, but is somewhat redundant if `classDef` already uses correct hex codes
8. **Provide text labels**: Never rely on color alone; include descriptive node labels
9. **Use shape differentiation**: Rectangles, circles, diamonds, hexagons provide additional visual distinction
10. **Test vertical orientation**: Prefer `graph TD` (top-down) for mobile-friendly viewing

## Complete Mermaid Template with Accessibility

```mermaid
<!--
Uses accessible colors:
- Blue (#0173B2) for primary flow
- Orange (#DE8F05) for decision points
- Teal (#029E73) for success outcomes
- Gray (#808080) for optional paths
Always includes black borders for shape definition.
-->
graph TD
    A["Start Process<br/>Primary"]:::blue
    B{"Decision<br/>Evaluate"}:::orange
    C["Success Path<br/>Complete"]:::teal
    D["Alternate Path<br/>Optional"]:::gray

    A --> B
    B -->|Yes| C
    B -->|No| D

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef gray fill:#808080,stroke:#000000,color:#000000,stroke-width:2px
```
