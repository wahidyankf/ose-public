---
title: "Overview"
date: 2026-08-14T00:00:00+07:00
draft: false
weight: 1
---

## Mental model

Architecture is not a diagram collection or a framework selection. It is the deliberately chosen
set of costly-to-change decisions: dependency direction, module boundaries, runtime topology, and
the quality attributes those decisions protect. The examples test each decision by asking what can
change without forcing unrelated code or teams to change with it.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
flowchart TD
    accTitle: Mental model
    accDescr: Flowchart with 4 nodes and 3 connections. Nodes: Change pressure, Choose a boundary, Protect a quality attribute, Verify with a fitness function. Connections: Change pressure to Choose a boundary, Choose a boundary to Protect a quality attribute, Protect a quality attribute to Verify with a fitness function.
    A["Change pressure"]:::blue --> B{"Choose a boundary"}:::orange
    B --> C["Protect a quality<br/>attribute"]:::teal
    C --> D["Verify with a<br/>fitness function"]:::purple

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

## Concept map

- **Boundaries**: coupling and cohesion, dependency inversion, stable dependencies, layered,
  hexagonal, functional-core, clean/onion, and modular-monolith styles.
- **Decision quality**: quality attributes, ATAM scenarios, Conway's Law, CAP/PACELC, and explicit
  trade-offs.
- **Communication**: C4, 4+1 views, and Architecture Decision Records (ADRs).
- **Evolution**: fitness functions, strangler migration, and diagnosing a big ball of mud.

## Example progression

- **Foundations** (Examples 1–18) exposes coupling, layers, ports, quality attributes, and C4
  context diagrams.
- **Trade-offs** (Examples 19–38) compares styles and records decisions with evidence.
- **Evolution** (Examples 39–52) verifies architecture continuously and changes a system without a
  big-bang rewrite.

Every code-bearing example has a colocated file under `learning/code/`. Diagram and decision-artifact
examples are complete in their lesson page because their artifact is the runnable unit of reasoning.

Next: [Foundations](./beginner.md) →
