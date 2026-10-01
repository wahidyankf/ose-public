---
title: "Artifact: Where the Light Eval Gate Sits"
date: 2026-07-26T00:00:00+07:00
draft: false
weight: 43
---

> A captioned diagram placing this course's light eval gate relative to prompt changes, retrieval,
> and agents -- exercises co-09 and co-12.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
%% All colors are color-blind friendly and meet WCAG AA contrast standards
graph LR
    accTitle: graph diagram
    accDescr: Graph with 6 nodes and 7 connections. Nodes: First Working Model Call creating-ai-powered- apps, Light Eval Gate this course, co-09, Prompt Changes measured against the gate, Retrieval Added measured against the SAME gate, Agents Added measured against the SAME gate, Deep Evals deep course, co-12. Connections: First Working Model Call creating-ai-powered- apps to Light Eval Gate this course, co-09, Light Eval Gate this course, co-09 to Prompt Changes measured against the gate, Light Eval Gate this course, co-09 to Retrieval Added measured against the SAME gate, Light Eval Gate this course, co-09 to Agents Added measured against the SAME gate, Prompt Changes measured against the gate to Deep Evals deep course, co-12, Retrieval Added measured against the SAME gate to Deep Evals deep course, co-12, Agents Added measured against the SAME gate to Deep Evals deep course, co-12.
    M["First Working Model<br/>Call<br/>creating-ai-powered-<br/>apps"]:::brown
    G["Light Eval Gate<br/>this course, co-09"]:::blue
    P["Prompt Changes<br/>measured against the<br/>gate"]:::orange
    R["Retrieval Added<br/>measured against the<br/>SAME gate"]:::orange
    A["Agents Added<br/>measured against the<br/>SAME gate"]:::orange
    D["Deep Evals<br/>deep course, co-12"]:::purple

    M --> G
    G --> P
    G --> R
    G --> A
    P --> D
    R --> D
    A --> D

    classDef brown fill:#CA9161,stroke:#000000,color:#000000,stroke-width:2px
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

_Figure: the gate installs immediately after the first working model call and BEFORE every
structural addition that follows -- prompt changes, retrieval, and agents each get measured against
the same fixed gate, so their individual effect is attributable (ex-42). Deep evals pick up only
once one of those additions needs error analysis or subjective scoring._

**Verify**: the gate node sits between the first model call and all three downstream additions
(prompt changes, retrieval, agents), and every one of those three feeds into deep evals -- never
directly, never skipping the gate.

**Key takeaway**: the gate's position is deliberate, not incidental -- installing it before retrieval
and agents is what lets a later regression be attributed to the specific change that caused it,
instead of "something in the last three additions broke it."

**Why It Matters**: a team that adds retrieval and agents before ever writing a gate has no way to
tell which of the two made a regression worse -- both changed at once, with nothing fixed to measure
either one against. This course sits early in the curriculum precisely to prevent that, installing the
gate while the system is still simple enough that ten to twenty cases can meaningfully cover it, rather
than retrofitting one onto a system that has already grown past the point where a small fixed dataset
tells the whole story.
