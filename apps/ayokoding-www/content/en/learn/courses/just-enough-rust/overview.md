---
title: "Overview"
date: 2026-08-15T00:00:00+07:00
draft: false
weight: 1
---

This Primer is **just enough Rust to be productive in modern systems programming**. It gives you
the Cargo loop, ownership and borrowing, ordinary data modeling, fallible control flow, traits,
generics, and collections—the small surface consumed by
[Modern System Programming](../modern-system-programming/overview.md).

It deliberately stops before concurrency design, FFI, `unsafe`, custom allocators, macros, and
platform APIs. Those belong to Modern System Programming, where the systems problem supplies the
reason to use them. You need only a terminal, a current stable Rust toolchain, and an editor with
rust-analyzer support. There are no prior course prerequisites.

## Productive Rust loop

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Gray #808080
%% Each label names a step; color and shape are not the sole cue.
graph TD
    accTitle: Productive Rust loop
    accDescr: Graph with 5 nodes and 5 connections. Nodes: Write a small typed program, Run cargo check or cargo run, Compiler accepts ownership and types, Add a focused test, Compose the next small behavior. Connections: Write a small typed program to Run cargo check or cargo run, Run cargo check or cargo run to Compiler accepts ownership and types, Compiler accepts ownership and types to Add a focused test (Yes), Compiler accepts ownership and types to Write a small typed program (No), Add a focused test to Compose the next small behavior.
    A[Write a small typed<br/>program]:::blue --> B[Run cargo check or<br/>cargo run]:::orange
    B --> C{Compiler accepts<br/>ownership and types}:::orange
    C -->|Yes| D[Add a focused test]:::teal
    C -->|No| A
    D --> E[Compose the next<br/>small behavior]:::blue
    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

Start at the [learning overview](./learning/overview.md), run each numbered example, then use the
[five-part drilling routine](./drilling/overview.md) to recall and repair the core ideas.
