---
title: "Overview"
date: 2026-08-15T00:00:00+07:00
draft: false
weight: 1
---

This track has 78 contiguous, runnable, annotated Windows examples. Build each C example on Windows with `cl /W4 /TC example.c`; run each PowerShell inspection example from Windows PowerShell. Do not run them on Linux: the APIs, object model, and observations are deliberately Windows-only.

```mermaid
flowchart LR
  accTitle: flowchart diagram
  accDescr: Flowchart with 3 nodes and 2 connections. Nodes: Win32 and handles, Threads, memory, and I/O, Integrated Windows program. Connections: Win32 and handles to Threads, memory, and I/O, Threads, memory, and I/O to Integrated Windows program.
  A["Win32 and handles"]:::blue --> B["Threads, memory, and<br/>I/O"]:::orange --> C["Integrated Windows<br/>program"]:::teal
  classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
  classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
  classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
  classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

- [Beginner examples](./beginner.md) — Examples 1–26
- [Intermediate examples](./intermediate.md) — Examples 27–54
- [Advanced examples](./advanced.md) — Examples 55–78
- [Capstone](./capstone/overview.md)
