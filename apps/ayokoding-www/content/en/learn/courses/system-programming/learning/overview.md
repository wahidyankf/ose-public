---
title: "Overview"
date: 2026-08-15T00:00:00+07:00
draft: false
weight: 1
---

Every program under `learning/code/ex-NN-*/` is a standalone, annotated C source file. Examples
1–26 establish allocation and representation; 27–52 make error paths, POSIX resources, and portable
wire bytes deliberate; 53–78 combine separately compiled code, allocators, signals, and sockets.
The intentionally hazardous lessons describe the diagnostic rather than performing undefined behavior:
the companion safe code remains runnable.

## The 30 concepts

| Concept                  | Keep this invariant                                                             |
| ------------------------ | ------------------------------------------------------------------------------- |
| co-01 stack vs heap      | automatic storage ends with its scope; heap storage ends at its owner's release |
| co-02 pointers           | dereference only a live object with the right type and bounds                   |
| co-03 malloc/free        | one successful allocation has one eventual release                              |
| co-04 realloc            | preserve the old pointer until resize succeeds                                  |
| co-05 calloc             | check element-count multiplication before allocating                            |
| co-06 alignment          | store each object at an address aligned for its type                            |
| co-07 ownership          | exactly one owner releases a resource                                           |
| co-08 dangling pointers  | never use a pointer after owner release or scope exit                           |
| co-09 undefined behavior | do not make compiler assumptions your program violates                          |
| co-10 buffer overflow    | carry the capacity with every writable buffer                                   |
| co-11 use after free     | invalidate aliases as ownership ends                                            |
| co-12 double free        | release each allocation once, then clear the owning slot                        |
| co-13 integer overflow   | validate size arithmetic before allocating or indexing                          |
| co-14 fd ownership       | close each owned descriptor once                                                |
| co-15 goto cleanup       | acquire in order; release in reverse on every path                              |
| co-16 attribute cleanup  | GCC/Clang extension only, not portable ISO C                                    |
| co-17 errno              | inspect/save it immediately after a failing call                                |
| co-18 bits               | masks and shifts describe fields precisely                                      |
| co-19 structs            | padding is part of object layout, not a wire format                             |
| co-20 unions             | do not use a union as a portable serialization shortcut                         |
| co-21 endianness         | network bytes are defined order, never host-memory copies                       |
| co-22 serialization      | encode each field to a specified byte sequence                                  |
| co-23 compilation units  | compile interfaces and implementations separately                               |
| co-24 headers            | declarations have include guards and one owner                                  |
| co-25 static linking     | archive members are copied at link time                                         |
| co-26 dynamic linking    | shared-library ABI remains a compatibility contract                             |
| co-27 ABI                | layout and calling conventions cross a binary boundary                          |
| co-28 syscalls           | handle partial I/O and report POSIX failures                                    |
| co-29 signals            | handlers do the minimum async-signal-safe work                                  |
| co-30 sockets            | every endpoint and accepted connection has an owner                             |

## Ownership visual field guide

```mermaid
flowchart LR
  accTitle: Ownership visual field guide
  accDescr: Flowchart with 6 nodes and 5 connections. Nodes: allocate/open/socket, owner assigned?, design bug, use, goto cleanup, release once. Connections: allocate/open/socket to owner assigned?, owner assigned? to design bug (no), owner assigned? to use (yes), use to goto cleanup, goto cleanup to release once.
  A[allocate/open/socket] --> B{owner assigned?}
  B -- no --> X[design bug]
  B -- yes --> C[use]
  C --> D[goto cleanup]
  D --> E[release once]
  classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

Each small diagram below is an executable mental model, one per concept.

```mermaid
flowchart LR
  accTitle: Ownership visual field guide
  accDescr: Flowchart with 3 nodes and 2 connections. Nodes: stack scope, return releases] H[heap allocation, free by owner. Connections: stack scope to return releases] H[heap allocation, return releases] H[heap allocation to free by owner.
  S[stack scope] --> R[return releases]; H[heap allocation] --> F[free by owner]
  classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

```mermaid
flowchart LR
  accTitle: Ownership visual field guide
  accDescr: Flowchart with 3 nodes and 2 connections. Nodes: pointer, live object, dereference in bounds. Connections: pointer to live object, live object to dereference in bounds.
  P[pointer] --> L[live object] --> D[dereference in<br/>bounds]
  classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

```mermaid
flowchart LR
  accTitle: Ownership visual field guide
  accDescr: Flowchart with 3 nodes and 2 connections. Nodes: malloc success, owner, free once. Connections: malloc success to owner, owner to free once.
  M[malloc success] --> O[owner] --> F[free once]
  classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

```mermaid
flowchart LR
  accTitle: Ownership visual field guide
  accDescr: Flowchart with 6 nodes and 5 connections. Nodes: realloc, Q, yes, N, no, old pointer remains. Connections: realloc to Q, Q to yes, yes to N, N to no, no to old pointer remains.
  R[realloc] --> Q{success?}; Q--yes-->N[new pointer]; Q--no-->O[old pointer remains]
  classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

```mermaid
flowchart LR
  accTitle: Ownership visual field guide
  accDescr: Flowchart with 3 nodes and 2 connections. Nodes: count, checked multiply, calloc zeroed cells. Connections: count to checked multiply, checked multiply to calloc zeroed cells.
  N[count] --> C[checked multiply] --> Z[calloc zeroed cells]
  classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

```mermaid
flowchart LR
  accTitle: Ownership visual field guide
  accDescr: Flowchart with 3 nodes and 2 connections. Nodes: type alignment, aligned address, valid access. Connections: type alignment to aligned address, aligned address to valid access.
  T[type alignment] --> A[aligned address] --> V[valid access]
  classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

```mermaid
flowchart LR
  accTitle: Ownership visual field guide
  accDescr: Flowchart with 3 nodes and 2 connections. Nodes: one owner, explicit transfer, one release. Connections: one owner to explicit transfer, explicit transfer to one release.
  O[one owner] --> T[explicit transfer] --> R[one release]
  classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

```mermaid
flowchart LR
  accTitle: Ownership visual field guide
  accDescr: Flowchart with 3 nodes and 2 connections. Nodes: free or scope exit, dangling alias, never dereference. Connections: free or scope exit to dangling alias, dangling alias to never dereference.
  F[free or scope exit] --> D[dangling alias] --> X[never dereference]
  classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

```mermaid
flowchart LR
  accTitle: Ownership visual field guide
  accDescr: Flowchart with 3 nodes and 2 connections. Nodes: C rule, well-defined program, optimizer assumptions valid. Connections: C rule to well-defined program, well-defined program to optimizer assumptions valid.
  C[C rule] --> W[well-defined program] --> O[optimizer<br/>assumptions valid]
  classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

```mermaid
flowchart LR
  accTitle: Ownership visual field guide
  accDescr: Flowchart with 3 nodes and 2 connections. Nodes: buffer, capacity check, write in bounds. Connections: buffer to capacity check, capacity check to write in bounds.
  B[buffer] --> C[capacity check] --> W[write in bounds]
  classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

```mermaid
flowchart LR
  accTitle: Ownership visual field guide
  accDescr: Flowchart with 3 nodes and 2 connections. Nodes: use, free, no later use. Connections: use to free, free to no later use.
  U[use] --> F[free] --> X[no later use]
  classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

```mermaid
flowchart LR
  accTitle: Ownership visual field guide
  accDescr: Flowchart with 3 nodes and 2 connections. Nodes: owning slot, free, set NULL. Connections: owning slot to free, free to set NULL.
  O[owning slot] --> F[free] --> N[set NULL]
  classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

```mermaid
flowchart LR
  accTitle: Ownership visual field guide
  accDescr: Flowchart with 3 nodes and 2 connections. Nodes: a * b, SIZE_MAX / b check, malloc. Connections: a * b to SIZE_MAX / b check, SIZE_MAX / b check to malloc.
  A[a * b] --> C[SIZE_MAX / b check] --> M[malloc]
  classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

```mermaid
flowchart LR
  accTitle: Ownership visual field guide
  accDescr: Flowchart with 3 nodes and 2 connections. Nodes: open, use fd, close once. Connections: open to use fd, use fd to close once.
  O[open] --> U[use fd] --> C[close once]
  classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

```mermaid
flowchart LR
  accTitle: Ownership visual field guide
  accDescr: Flowchart with 4 nodes and 3 connections. Nodes: acquire A, acquire B, error, release B then A. Connections: acquire A to acquire B, acquire B to error, error to release B then A.
  A[acquire A] --> B[acquire B] --> E[error] --> RB[release B then A]
  classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

```mermaid
flowchart LR
  accTitle: Ownership visual field guide
  accDescr: Flowchart with 3 nodes and 2 connections. Nodes: GCC/Clang extension, scope cleanup, not portable ISO C. Connections: GCC/Clang extension to scope cleanup, scope cleanup to not portable ISO C.
  G[GCC/Clang extension] --> S[scope cleanup] --> P[not portable ISO C]
  classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

```mermaid
flowchart LR
  accTitle: Ownership visual field guide
  accDescr: Flowchart with 3 nodes and 2 connections. Nodes: failing call, errno now, report or save. Connections: failing call to errno now, errno now to report or save.
  F[failing call] --> E[errno now] --> R[report or save]
  classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

```mermaid
flowchart LR
  accTitle: Ownership visual field guide
  accDescr: Flowchart with 3 nodes and 2 connections. Nodes: value, mask/shift, flag field. Connections: value to mask/shift, mask/shift to flag field.
  V[value] --> M[mask/shift] --> F[flag field]
  classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

```mermaid
flowchart LR
  accTitle: Ownership visual field guide
  accDescr: Flowchart with 3 nodes and 2 connections. Nodes: struct fields, compiler padding, host layout. Connections: struct fields to compiler padding, compiler padding to host layout.
  F[struct fields] --> P[compiler padding] --> L[host layout]
  classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

```mermaid
flowchart LR
  accTitle: Ownership visual field guide
  accDescr: Flowchart with 3 nodes and 2 connections. Nodes: union storage, one active representation, not wire bytes. Connections: union storage to one active representation, one active representation to not wire bytes.
  U[union storage] --> O[one active<br/>representation] --> N[not wire bytes]
  classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```
