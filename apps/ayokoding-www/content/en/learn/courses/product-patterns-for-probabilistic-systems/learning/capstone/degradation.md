---
title: "Degradation"
date: 2026-07-26T00:00:00+07:00
draft: false
weight: 5
---

> Meridian Claims Assistant -- degradation design.

## Fallback hierarchy

| Rung | Condition                                                       | Behaviour                                                                                                                                                                                                  | Quality                               |
| ---- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| 1    | Primary model responds within 8s                                | Full structured recommendation with per-clause citations.                                                                                                                                                  | Best available.                       |
| 2    | Primary model slow (8-20s) or rate-limited                      | Falls to a smaller, faster model, same structured citation format, flagged "fast mode."                                                                                                                    | Slightly lower accuracy, still cited. |
| 3    | Both models unavailable, this exact claim was recently assessed | Serves the most recent draft for this claim, explicitly labelled "draft from [timestamp], not re-verified."                                                                                                | Stale but labelled, never silent.     |
| 4    | No model available, no recent draft                             | Deterministic fallback: surfaces the raw policy section matching the claim's declared damage type, no generated recommendation at all -- Dana assesses manually with the relevant policy text pre-located. | Lowest, but honest and never wrong.   |
| 5    | Even the raw policy-section lookup is unavailable               | Explicit "Assistant unavailable -- assess this claim manually; your queue is unaffected" banner, input disabled but visible.                                                                               | No recommendation offered.            |

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    accTitle: Fallback hierarchy
    accDescr: Graph with 5 nodes and 4 connections. Nodes: Rung 1: Full recommendation trigger: primary under 8s, Rung 2: Fast-mode fallback trigger: primary 8-20s, Rung 3: Recent draft trigger: no models, cache, Rung 4: Raw policy link trigger: no model, no draft, Rung 5: Unavailable trigger: raw lookup down. Connections: Rung 1: Full recommendation trigger: primary under 8s to Rung 2: Fast-mode fallback trigger: primary 8-20s (degrades to), Rung 2: Fast-mode fallback trigger: primary 8-20s to Rung 3: Recent draft trigger: no models, cache (degrades to), Rung 3: Recent draft trigger: no models, cache to Rung 4: Raw policy link trigger: no model, no draft (degrades to), Rung 4: Raw policy link trigger: no model, no draft to Rung 5: Unavailable trigger: raw lookup down (degrades to).
    R1["Rung 1: Full<br/>recommendation<br/>trigger: primary<br/>under 8s"]:::teal
    R2["Rung 2: Fast-mode<br/>fallback<br/>trigger: primary<br/>8-20s"]:::blue
    R3["Rung 3: Recent draft<br/>trigger: no models,<br/>cache"]:::orange
    R4["Rung 4: Raw policy<br/>link<br/>trigger: no model,<br/>no draft"]:::purple
    R5["Rung 5: Unavailable<br/>trigger: raw lookup<br/>down"]:::brown

    R1 -->|degrades to| R2
    R2 -->|degrades to| R3
    R3 -->|degrades to| R4
    R4 -->|degrades to| R5

    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef brown fill:#CA9161,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

_Diagram: five rungs, each with an observable trigger condition, falling one at a time from a full
recommendation to an explicit unavailable state -- never silently skipping a level._

## Visibility check

Every rung carries its own explicit label (a "fast mode" flag, a "draft from [timestamp]" note, the
raw-lookup's absence of any generated text, or the unavailable banner) so Dana can always tell which
rung the assistant is currently operating on -- no rung is rendered identically to rung 1's full
recommendation.

**Verify**: every rung states a concrete, observable trigger condition (co-18); the diagram matches
the table exactly and terminates at an explicit unavailable state (co-16); no rung is visually
indistinguishable from a fully healthy recommendation (co-19).

**Key takeaway**: The fallback hierarchy gives Dana five distinct, honestly labelled states instead
of one binary "working or broken" state -- and rung 4's raw-policy-section fallback means even a
total model outage leaves her with a genuine time-saving head start rather than nothing at all.
