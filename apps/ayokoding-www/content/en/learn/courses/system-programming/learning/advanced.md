---
title: "Advanced Examples"
date: 2026-08-15T00:00:00+07:00
draft: false
weight: 30
---

Examples 53–78 bring the basic discipline to binary boundaries, allocators, signals, and local TCP.

| Examples                                                                                            | Focus                                              |
| --------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 53 compilation-units; 54 include-guard; 55 static-library; 56 dynamic-library; 57 abi-struct-layout | interfaces and binary contracts                    |
| 58 memory-pool; 59 arena-allocator; 60 pool-reuse; 61 aligned-alloc                                 | bounded allocation strategies                      |
| 62 signal-handler; 63 signal-safe-flag; 64 sigaction                                                | minimum work in a handler                          |
| 65 socket-create; 66 socket-bind-listen; 67 socket-accept; 68 socket-connect; 69 socket-send-recv   | TCP endpoint lifecycle                             |
| 70 socket-serialized; 71 client-server-echo                                                         | message bytes over a connection                    |
| 72 overflow-then-fix; 73 uaf-then-fix; 74 valgrind-clean; 75 asan-clean                             | verify the safe implementation                     |
| 76 full-systems-slice; 77 integration-memclean; 78 capstone-systems-component                       | pool, serialization, and socket ownership together |

```mermaid
flowchart LR
  accTitle: flowchart diagram
  accDescr: Flowchart with 4 nodes and 3 connections. Nodes: header declaration, object file, linker, executable. Connections: header declaration to object file, object file to linker, linker to executable.
  H[header declaration] --> O[object file] --> L[linker] --> X[executable]
  classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

```mermaid
flowchart LR
  accTitle: flowchart diagram
  accDescr: Flowchart with 4 nodes and 3 connections. Nodes: free pool slot, allocate, use, return slot. Connections: free pool slot to allocate, allocate to use, use to return slot.
  P[free pool slot] --> A[allocate] --> U[use] --> R[return slot]
  classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

```mermaid
flowchart LR
  accTitle: flowchart diagram
  accDescr: Flowchart with 3 nodes and 2 connections. Nodes: signal, handler sets sig_atomic_t flag, normal flow acts. Connections: signal to handler sets sig_atomic_t flag, handler sets sig_atomic_t flag to normal flow acts.
  S[signal] --> H[handler sets<br/>sig_atomic_t flag] --> M[normal flow acts]
  classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

```mermaid
sequenceDiagram
  accTitle: sequenceDiagram diagram
  accDescr: Sequence diagram between client, server. Messages: client to server: connect + network-order frame; server to client: decoded echo frame; client to client: close client fd; server to server: close accepted/listen fds.
  participant C as client
  participant S as server
  C->>S: connect + network-order frame
  S->>C: decoded echo frame
  C->>C: close client fd
  S->>S: close accepted/listen fds
```

The capstone source is a distinct, complete program with its own build script. It is the required
proof that the patterns compose; the numbered files are deliberately small local experiments.
