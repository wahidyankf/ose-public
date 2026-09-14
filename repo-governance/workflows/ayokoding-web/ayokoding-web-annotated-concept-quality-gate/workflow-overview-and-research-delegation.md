---
description: Shows the Maker-Checker-Fixer flow as a Mermaid diagram and documents how the maker/facts-checker agents delegate multi-page web research to the web-researcher agent.
when_to_use: Use when you need a visual summary of the quality-gate flow or want to understand how deep web research is delegated during content creation/verification.
---

# Workflow Overview and Research Delegation

## Workflow Overview

```mermaid
%%{init: {'theme':'base', 'themeVariables': { 'fontSize':'14px'}}}%%
graph TB
    accTitle: Workflow Overview
    accDescr: Maker: Create/Update Worked Examples leads to Checker: Detect Mode + Validate Quality via maker or manual; Checker: Detect Mode + Validate Quality leads to User Review via checker; and 5 more links.
    A[Maker: Create/Update<br/>Worked Examples] -- maker or manual --> B[Checker: Detect Mode<br/>+ Validate Quality]
    B -- checker --> C{User Review}
    C -- Issues found --> D[Fixer: Apply Fixes]
    D -- re-check --> E[Re-validate Quality]
    C -- Quality approved --> F[Publication Ready]
    C -- Major rework needed --> G[Iterate via Maker]

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000
    classDef teal fill:#029E73,stroke:#000000,color:#000000
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000
    classDef brown fill:#CA9161,stroke:#000000,color:#000000
    class A blue
    class B orange
    class D teal
    class F purple
    class G brown
```

## Research Delegation

The `apps-ayokoding-www-annotated-concept-maker` and `apps-ayokoding-www-facts-checker` agents
invoked by this workflow delegate multi-page web research to the
[`web-researcher`](../../../../.claude/agents/web/web-researcher.md) delegated agent when composing or
verifying claims about library versions, API signatures, or best practices requires more than one
or two searches, or more than two fetches. In-context `WebSearch`/`WebFetch` remain available for
single-shot verification against known authoritative URLs. This keeps each agent's context lean.
The delegation is encoded in each agent's prompt — no workflow-level configuration required.
