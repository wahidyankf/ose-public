---
title: "Artifact: The Fixed-Dataset Eval Loop"
date: 2026-07-26T00:00:00+07:00
draft: false
weight: 6
---

> A captioned diagram of the four-stage loop this whole course teaches -- dataset, run, score,
> compare -- exercises co-03 and co-09.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
%% All colors are color-blind friendly and meet WCAG AA contrast standards
graph LR
    accTitle: graph diagram
    accDescr: Graph with 4 nodes and 4 connections. Nodes: Fixed Dataset versioned JSONL, co-03, Run call the system, co-01, Score deterministic scorers, co-05, Compare baseline vs candidate, co-09. Connections: Fixed Dataset versioned JSONL, co-03 to Run call the system, co-01, Run call the system, co-01 to Score deterministic scorers, co-05, Score deterministic scorers, co-05 to Compare baseline vs candidate, co-09, Compare baseline vs candidate, co-09 to Run call the system, co-01 (next candidate).
    D["Fixed Dataset<br/>versioned JSONL,<br/>co-03"]:::blue --> R["Run<br/>call the system,<br/>co-01"]:::orange
    R --> S["Score<br/>deterministic<br/>scorers, co-05"]:::teal
    S --> C["Compare<br/>baseline vs<br/>candidate, co-09"]:::purple
    C -->|next candidate| R

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

_Figure: the fixed-dataset loop. The Dataset stage never changes between runs -- that fixed-ness is
what makes the Compare stage's output meaningful, rather than an unfalsifiable "it feels better."_

**Verify**: all four stages appear, in this exact order, and the loop closes from Compare back into
Run (not back into Dataset) -- because the candidate change is what iterates, not the fixed cases.

**Key takeaway**: the dataset sits still while everything downstream of it iterates -- that is the
entire structural difference between a gate and a vibe check.

**Why It Matters**: every worked example in Theme A builds toward this one shape. Once a learner can
place any single technique on this loop (a scorer belongs in Score, a baseline belongs in Compare), the
rest of this course is filling in each stage's detail, not learning a new shape. A team that skips
straight to writing scorers without first fixing this loop's Dataset stage ends up unable to answer
whether a later Compare result reflects a real change or just different input cases -- the diagram is
worth drawing precisely because that failure mode is otherwise invisible until it has already happened.
