---
description: "Shows a fully accessible Mermaid diagram and a fully inaccessible one, with a why breakdown of each."
when_to_use: "Use when you need a complete worked example contrasting accessible and inaccessible diagram color usage."
---

# Real-World Examples

## Good Example: Accessible Mermaid Diagram

```mermaid
%% Uses accessible colors:
%% - Blue (#0173B2) for primary flow
%% - Orange (#DE8F05) for decisions
%% - Teal (#029E73) for success
%% - Gray (#808080) for optional paths
%% Tested for: protanopia, deuteranopia, tritanopia
%% All colors meet WCAG AA contrast requirements
graph TD
    accTitle: Good Example: Accessible Mermaid Diagram
    accDescr: Receive Request Blue: Primary leads to Validate Request Orange: Decision; Validate Request Orange: Decision leads to Process Request Teal: Success via Valid; Validate Request Orange: Decision leads to Return Error Gray: Alternative via Invalid; and 1 more links.
    A["Receive Request<br/>(Blue: Primary)"]:::blue
    B{"Validate Request<br/>(Orange: Decision)"}:::orange
    C["Process Request<br/>(Teal: Success)"]:::teal
    D["Return Response<br/>(Teal: Success)"]:::teal
    E["Return Error<br/>(Gray: Alternative)"]:::gray

    A --> B
    B -->|Valid| C
    B -->|Invalid| E
    C --> D

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef gray fill:#808080,stroke:#000000,color:#000000,stroke-width:2px
```

**Why this works:**

- PASS: Uses only verified palette colors
- PASS: Black borders provide shape definition
- PASS: White text provides contrast on dark fills
- PASS: Text labels describe each element
- PASS: Diamond shape for decision point (not just color)
- PASS: Different rectangles for different steps
- PASS: Color scheme documented
- PASS: Safe for all color blindness types

## Bad Example: Inaccessible Diagram

```text
<!-- This diagram fails accessibility requirements -->
graph TD
    A[Success]:::green
    B[Error]:::red
    C[Warning]:::yellow

    classDef green fill:#029E73
    classDef red fill:#DE8F05
    classDef yellow fill:#DE8F05
```

**Why this fails:**

- FAIL: Uses red (invisible to protanopia/deuteranopia)
- FAIL: Uses green (invisible to protanopia/deuteranopia)
- FAIL: Uses yellow (invisible to tritanopia)
- FAIL: Red-green combination (worst case)
- FAIL: No borders for shape definition
- FAIL: No text labels
- FAIL: Relies on color alone
- FAIL: Not tested for color blindness
- FAIL: May fail WCAG contrast requirements
