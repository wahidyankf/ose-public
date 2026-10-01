---
title: "Artifact: Dependency Graph — Checkout Redesign"
date: 2026-07-14T00:00:00+07:00
draft: false
weight: 44
---

> Aurora Checkout Redesign -- dependency graph -- exercises co-04.

```mermaid
%% Color Palette: Blue #0173B2
%% Aurora Checkout Redesign dependency graph, durations in working days
graph LR
    accTitle: graph diagram
    accDescr: Graph with 9 nodes and 8 connections. Nodes: 1.1 Stripe adapter 3d, 1.2 PayPal adapter 3d, 1.3 Apple Pay adapter 2d, 2.1 Cart persistence 4d, 2.2 Order summary UI 3d, 2.3 Order confirmation email 2d, 3.1 E2E test suite 5d, 3.2 Load test 3d, 3.3 Feature-flag rollout 2d. Connections: 2.1 Cart persistence 4d to 2.2 Order summary UI 3d, 2.2 Order summary UI 3d to 2.3 Order confirmation email 2d, 1.1 Stripe adapter 3d to 3.1 E2E test suite 5d, 1.2 PayPal adapter 3d to 3.1 E2E test suite 5d, 1.3 Apple Pay adapter 2d to 3.1 E2E test suite 5d, 2.2 Order summary UI 3d to 3.1 E2E test suite 5d, 3.1 E2E test suite 5d to 3.2 Load test 3d, 3.2 Load test 3d to 3.3 Feature-flag rollout 2d.
    A1["1.1 Stripe adapter<br/>3d"]:::blue
    A2["1.2 PayPal adapter<br/>3d"]:::blue
    A3["1.3 Apple Pay<br/>adapter<br/>2d"]:::blue
    B1["2.1 Cart persistence<br/>4d"]:::blue
    B2["2.2 Order summary UI<br/>3d"]:::blue
    B3["2.3 Order<br/>confirmation email<br/>2d"]:::blue
    C1["3.1 E2E test suite<br/>5d"]:::blue
    C2["3.2 Load test<br/>3d"]:::blue
    C3["3.3 Feature-flag<br/>rollout<br/>2d"]:::blue

    B1 --> B2
    B2 --> B3
    A1 --> C1
    A2 --> C1
    A3 --> C1
    B2 --> C1
    C1 --> C2
    C2 --> C3

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

Every edge is a genuine finish-to-start "must finish before" relation: the three payment adapters and
the order-summary UI all feed the end-to-end test suite; the test suite feeds the load test; the load
test feeds the rollout plan; the order-confirmation email depends only on the order-summary UI.
