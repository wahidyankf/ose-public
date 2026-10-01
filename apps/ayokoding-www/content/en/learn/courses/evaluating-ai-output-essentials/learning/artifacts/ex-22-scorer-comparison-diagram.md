---
title: "Artifact: Scorers on a Cost-vs-Reach Axis"
date: 2026-07-26T00:00:00+07:00
draft: false
weight: 22
---

> A captioned diagram placing every scorer type from Theme B on a cost-vs-reach axis -- exercises
> co-05, co-06, and co-12.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
%% All colors are color-blind friendly and meet WCAG AA contrast standards
graph TD
    accTitle: graph diagram
    accDescr: Graph with 6 nodes and 5 connections. Nodes: exact_match single right answer, substring one required fact, regex required format, numeric_tolerance a number, within bounds, schema structure, all fields, LLM-as-judge subjective quality. Connections: exact_match single right answer to substring one required fact, substring one required fact to regex required format, regex required format to numeric_tolerance a number, within bounds, numeric_tolerance a number, within bounds to schema structure, all fields, schema structure, all fields to LLM-as-judge subjective quality (needs measured agreement before trusting it).
    subgraph Cheap["Cheap, Narrow Reach<br/>-- this course,<br/>co-05/co-06"]
        EM["exact_match<br/>single right answer"]:::blue
        SUB["substring<br/>one required fact"]:::blue
        RE["regex<br/>required format"]:::orange
        NUM["numeric_tolerance<br/>a number, within<br/>bounds"]:::orange
        SCH["schema<br/>structure, all<br/>fields"]:::teal
        EM --- SUB
        SUB --- RE
        RE --- NUM
        NUM --- SCH
    end
    subgraph Expensive["Expensive, Broad<br/>Reach -- out of<br/>scope, co-12"]
        JUDGE["LLM-as-judge<br/>subjective quality"]:::purple
    end
    SCH -->|"needs measured<br/>agreement<br/>before trusting it"| JUDGE

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

_Figure: every scorer this course teaches sits in the cheap, narrow-reach cluster -- each checks one
mechanical property (an exact string, a fact's presence, a format, a number, a structure). The one
node outside that cluster, an LLM-as-judge, is where `evaluating-ai-systems-in-depth` picks up._

**Verify**: all five deterministic scorers (`exact_match`, `substring`, `regex`, `numeric_tolerance`,
`schema`) sit inside the "Cheap, Narrow Reach" cluster; exactly one node (`LLM-as-judge`) sits outside
it, connected by an edge naming the exact precondition (measured agreement) this course does not teach.

**Key takeaway**: "cheap" and "narrow reach" travel together for every scorer in this course --
none of them can judge tone, faithfulness, or any other subjective quality, and none of them cost
anything beyond ordinary CPU time to run.

**Why It Matters**: a team that reaches for an LLM-as-judge before exhausting the cheap cluster is
usually solving the wrong problem at the wrong cost -- most real breakage (a missing field, a wrong
number, a malformed ticket ID) is exactly what the cheap cluster already catches, per ex-17's measured
5x catch-rate advantage.
