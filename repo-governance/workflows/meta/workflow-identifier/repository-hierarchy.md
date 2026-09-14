---
description: Shows where Workflows sit in the six-layer governance hierarchy, from Vision down through Principles, Conventions, Development, Agents, to Workflows.
when_to_use: Use when explaining how workflows relate to the layers below them (agents, development, conventions, principles, vision).
---

# Repository Hierarchy

```mermaid
flowchart TD
    accTitle: Repository Hierarchy
    accDescr: Layer 0: Vision leads to Layer 1: Principles via inspires; Layer 1: Principles leads to Layer 2: Conventions via governs; Layer 2: Conventions leads to Layer 3: Development via governs; and 2 more links.
    L0["Layer 0: Vision"] -->|inspires| L1["Layer 1: Principles"]
    L1 -->|governs| L2["Layer 2: Conventions"]
    L2 -->|governs| L3["Layer 3: Development"]
    L3 -->|governs| L4["Layer 4: AI Agents"]
    L4 -->|orchestrated by| L5["Layer 5: Workflows"]
```

Vision is why we exist, principles are the foundational values, conventions are the documentation rules,
development holds the software practices, AI agents execute atomic tasks, and workflows orchestrate multi-step
processes.

**Key relationship**: Workflows are to Agents what Agents are to Tools - a composition layer.
