---
description: "The foundational-values layer: location, principle roster, requirements"
when_to_use: Use for Layer 1's scope and traceability requirements.
---

# Layer 1: Principles (WHY - Values)

**Purpose**: Foundational values that govern all conventions and development practices. Explains WHY we value certain approaches.

**Location**: `repo-governance/principles/`

**Key Document**: [Core Principles Index](../principles/README.md)

**Principles**:

**General Principles:**

- **Deliberate Problem-Solving** - Think before coding, surface assumptions, ask questions rather than guessing
- **Simplicity Over Complexity** - Minimum viable abstraction, avoid over-engineering
- **Root Cause Orientation** - Fix root causes, not symptoms; minimal impact; senior engineer standard

**Content Principles:**

- **Accessibility First** - WCAG compliance, universal design from the start
- **Documentation First** - Documentation is mandatory, not optional
- **No Time Estimates** - Outcomes over duration, respect different paces
- **Progressive Disclosure** - Layer complexity gradually

**Software Engineering Principles:**

- **Automation Over Manual** - Git hooks, AI agents for consistency
- **Explicit Over Implicit** - Transparent configuration, no magic
- **Immutability Over Mutability** - Prefer immutable data structures
- **Pure Functions Over Side Effects** - Deterministic, composable functions
- **Reproducibility First** - Eliminate "works on my machine" problems

**Characteristics**:

- Stable values that rarely change
- Each principle must include "Vision Supported" section
- Answers: "Why do we value this approach?"
- Governs both conventions (documentation) and development (software)

**Example Traceability**:

```mermaid
flowchart TD
    accTitle: Layer 1: Principles (WHY - Values)
    accDescr: Vision leads to Accessibility First principle via inspires; Accessibility First principle leads to Color Accessibility convention via governs; Accessibility First principle leads to AI Agents convention via governs.
    V["Vision"] -->|inspires| P["Accessibility<br/>First principle"]
    P -->|governs| C["Color Accessibility<br/>convention"]
    P -->|governs| D["AI Agents<br/>convention"]
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

The vision is to be accessible to everyone. The AI Agents Convention applies the principle by requiring agent
colors from the accessible palette.

**Requirements**:

- Each principle MUST include "Vision Supported" section linking to Layer 0
- Principles govern Layer 2 (Conventions) and Layer 3 (Development)
- Changes require careful consideration of downstream impact
