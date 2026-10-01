---
title: "Learning Overview"
date: 2026-08-15T00:00:00+07:00
draft: false
weight: 1
---

> **Review, render, then operate.** The examples are deliberately offline: `printf` records an operation
> plan; YAML is inline and has harmless documentation values; any `kubectl` form uses
> `--dry-run=client`. They prove syntax and intent, not a live cluster. A real control-plane, network,
> storage, certificate, GitOps, or restore change needs an owner-approved lab and a current primary-source
> command check.

## Concepts

The course maps `co-01`–`co-15` to ownership, topology, distribution selection, lifecycle, backup, and
upgrades; `co-16`–`co-24` to CNI, policy, bare-metal networking, storage, ingress, and TLS; and
`co-25`–`co-34` to GitOps, promotion, secret delivery, backup/restore, and immutable nodes. Each example
identifies the concept it exercises, so a reader can trace from a safe artifact to an operational duty.

## Platform map

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC; labels carry meaning.
flowchart TB
    accTitle: Platform map
    accDescr: Flowchart with 5 nodes and 4 connections. Nodes: Owned nodes and quorum, Kubernetes control plane, CNI, LB, storage, ingress, TLS, Git desired state and reconciliation, Backup and restore evidence. Connections: Owned nodes and quorum to Kubernetes control plane, Kubernetes control plane to CNI, LB, storage, ingress, TLS, CNI, LB, storage, ingress, TLS to Git desired state and reconciliation, Git desired state and reconciliation to Backup and restore evidence.
    N["Owned nodes and<br/>quorum"]:::blue --> K["Kubernetes control<br/>plane"]:::orange
    K --> P["CNI, LB, storage,<br/>ingress, TLS"]:::teal
    P --> G["Git desired state<br/>and reconciliation"]:::purple
    G --> R["Backup and restore<br/>evidence"]:::blue
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

The arrows show responsibility dependencies, not an installer order. A working application depends on all
of them, and a restore drill checks that the declared system can return after failure.

Next: [Beginner Examples](./beginner.md) →
