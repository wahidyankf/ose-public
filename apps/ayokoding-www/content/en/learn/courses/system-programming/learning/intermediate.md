---
title: "Intermediate Examples"
date: 2026-08-15T00:00:00+07:00
draft: false
weight: 20
---

Examples 27–52 make failure paths, descriptor ownership, and byte boundaries explicit.

| Examples                                                                                                             | Focus                                                 |
| -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 27 double-free-detect; 28 use-after-free-detect; 29 buffer-overflow-detect; 30 dangling-pointer; 31 null-deref-guard | diagnostics explained with safe runnable counterparts |
| 32 integer-overflow-signed; 33 unsigned-wraparound; 34 size-overflow-check                                           | defined arithmetic versus rejected size math          |
| 35 goto-cleanup-single; 36 goto-cleanup-multi                                                                        | portable C cleanup                                    |
| 37 attribute-cleanup; 38 attribute-cleanup-fd                                                                        | GCC/Clang-only comparison; never ISO C                |
| 39 errno-open-fail; 40 perror-strerror; 41 errno-save                                                                | error reporting while errno is fresh                  |
| 42 fd-open-close; 43 fd-leak-detect; 44 read-syscall; 45 write-syscall                                               | descriptors and I/O                                   |
| 46 endianness-detect; 47 htonl-ntohl                                                                                 | host versus network order                             |
| 48 serialize-int; 49 deserialize-int; 50 serialize-struct; 51 serialize-roundtrip                                    | format-defined bytes                                  |
| 52 linked-list-owned                                                                                                 | transfer-free linked ownership                        |

```mermaid
flowchart LR
  accTitle: flowchart diagram
  accDescr: Flowchart with 4 nodes and 3 connections. Nodes: operation fails, save errno, format diagnostic, cleanup. Connections: operation fails to save errno, save errno to format diagnostic, format diagnostic to cleanup.
  A[operation fails] --> B[save errno] --> C[format diagnostic] --> D[cleanup]
  classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

```mermaid
flowchart LR
  accTitle: flowchart diagram
  accDescr: Flowchart with 3 nodes and 2 connections. Nodes: open fd, read/write, close on all exits. Connections: open fd to read/write, read/write to close on all exits.
  A[open fd] --> B[read/write] --> C[close on all exits]
  classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

```mermaid
flowchart LR
  accTitle: flowchart diagram
  accDescr: Flowchart with 4 nodes and 3 connections. Nodes: host uint32, explicit big-endian bytes, wire, decode uint32. Connections: host uint32 to explicit big-endian bytes, explicit big-endian bytes to wire, wire to decode uint32.
  H[host uint32] --> E[explicit big-endian<br/>bytes] --> W[wire] --> D[decode uint32]
  classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

```mermaid
flowchart LR
  accTitle: flowchart diagram
  accDescr: Flowchart with 4 nodes and 3 connections. Nodes: head owner, node next, tail, free each node. Connections: head owner to node next, node next to tail, tail to free each node.
  H[head owner] --> N[node next] --> T[tail] --> F[free each node]
  classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

The source for examples 37–38 is intentionally marked extension-only. The reusable course pattern is
examples 35–36: acquire one resource at a time and jump to a single cleanup label on failure.
