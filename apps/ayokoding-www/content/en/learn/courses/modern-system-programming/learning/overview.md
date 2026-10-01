---
title: "Overview"
date: 2026-08-15T00:00:00+07:00
draft: false
weight: 1
---

## Mental model

One owner releases a value when it drops. Shared access is many readers or one writer; crossing a
thread boundary additionally requires `Send` and `Sync`. Code the compiler cannot prove belongs in
the smallest possible `unsafe` block, documented and hidden behind a safe API.

## Example progression

- **Beginner (1–26):** ownership, borrowing, lifetimes, RAII, heap values, iterator basics, and `Result`.
- **Intermediate (27–52):** threads, ownership-transferring channels, `Arc<Mutex<_>>`, traits, and errors.
- **Advanced (53–78):** raw pointers, contracts, C ABI calls, async framing, and the full safety slice.

Run any example from `learning/code` with `cargo run --bin ex-NN-name`. Compile-error lessons are
represented by the accepted safe form and explain the rejected shape in a source comment, so all 78
examples remain runnable.

## Thirty concept diagrams

Each tiny diagram has adjacent text that states its meaning for screen-reader users.

1. **co-01 ownership-memory:** an owner releases its value at scope end.

```mermaid
flowchart LR
    accTitle: Thirty concept diagrams
    accDescr: Flowchart with 2 nodes and 1 connections. Nodes: Owner, Value. Connections: Owner to Value.
O[Owner] --> V[Value]
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

1. **co-02 move-semantics:** assignment transfers ownership.

```mermaid
flowchart LR
    accTitle: Thirty concept diagrams
    accDescr: Flowchart with 2 nodes and 1 connections. Nodes: Source, Destination. Connections: Source to Destination.
A[Source] --> B[Destination]
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

1. **co-03 borrow-shared:** many readers can view one value.

```mermaid
flowchart LR
    accTitle: Thirty concept diagrams
    accDescr: Flowchart with 3 nodes and 2 connections. Nodes: Value, Read, Read. Connections: Value to Read, Value to Read.
V[Value] --> R1[Read] & R2[Read]
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

1. **co-04 borrow-mut:** one writer has exclusive access.

```mermaid
flowchart LR
    accTitle: Thirty concept diagrams
    accDescr: Flowchart with 2 nodes and 1 connections. Nodes: Value, One mutable borrow. Connections: Value to One mutable borrow.
V[Value] --> W[One mutable borrow]
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

1. **co-05 borrow-rules:** readers and writer do not overlap.

```mermaid
flowchart LR
    accTitle: Thirty concept diagrams
    accDescr: Flowchart with 1 nodes and 0 connections. Nodes: Readers] -. not together .-> W[Writer.
R[Readers] -. not together .-> W[Writer]
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

1. **co-06 lifetimes:** reference use ends before its value drops.

```mermaid
flowchart LR
    accTitle: Thirty concept diagrams
    accDescr: Flowchart with 2 nodes and 1 connections. Nodes: Value lives, Reference lives less long. Connections: Value lives to Reference lives less long.
V[Value lives] --> R[Reference lives less<br/>long]
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

1. **co-07 drop:** scope ending invokes cleanup.

```mermaid
flowchart LR
    accTitle: Thirty concept diagrams
    accDescr: Flowchart with 2 nodes and 1 connections. Nodes: Scope end, Drop. Connections: Scope end to Drop.
S[Scope end] --> D[Drop]
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

1. **co-08 box:** a stack handle owns heap data.

```mermaid
flowchart LR
    accTitle: Thirty concept diagrams
    accDescr: Flowchart with 2 nodes and 1 connections. Nodes: Box, Heap value. Connections: Box to Heap value.
B[Box] --> H[Heap value]
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

1. **co-09 rc-refcell:** local sharing has runtime mutable-borrow checks.

```mermaid
flowchart LR
    accTitle: Thirty concept diagrams
    accDescr: Flowchart with 2 nodes and 1 connections. Nodes: Rc, RefCell. Connections: Rc to RefCell.
RC[Rc] --> RF[RefCell]
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

1. **co-10 threads:** parent joins child work.

```mermaid
flowchart LR
    accTitle: Thirty concept diagrams
    accDescr: Flowchart with 3 nodes and 2 connections. Nodes: Parent, Child thread, Join. Connections: Parent to Child thread, Child thread to Join.
P[Parent] --> C[Child thread] --> J[Join]
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

1. **co-11 channels:** send transfers a message to receive.

```mermaid
flowchart LR
    accTitle: Thirty concept diagrams
    accDescr: Flowchart with 3 nodes and 2 connections. Nodes: Sender, Owned message, Receiver. Connections: Sender to Owned message, Owned message to Receiver.
S[Sender] --> M[Owned message] --> R[Receiver]
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

1. **co-12 arc:** atomic counting supports shared thread ownership.

```mermaid
flowchart LR
    accTitle: Thirty concept diagrams
    accDescr: Flowchart with 3 nodes and 2 connections. Nodes: Arc, Thread, Thread. Connections: Arc to Thread, Arc to Thread.
A[Arc] --> T1[Thread] & T2[Thread]
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

1. **co-13 mutex:** a lock serializes mutation.

```mermaid
flowchart LR
    accTitle: Thirty concept diagrams
    accDescr: Flowchart with 2 nodes and 1 connections. Nodes: Mutex lock, Mutation. Connections: Mutex lock to Mutation.
L[Mutex lock] --> M[Mutation]
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

1. **co-14 send-sync:** marker traits gate thread transfer and sharing.

```mermaid
flowchart LR
    accTitle: Thirty concept diagrams
    accDescr: Flowchart with 3 nodes and 2 connections. Nodes: Type, Send / Sync check, Thread use. Connections: Type to Send / Sync check, Send / Sync check to Thread use.
T[Type] --> SS[Send / Sync check] --> TH[Thread use]
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

1. **co-15 data-race-compile-error:** invalid sharing stops at compile time.

```mermaid
flowchart LR
    accTitle: Thirty concept diagrams
    accDescr: Flowchart with 2 nodes and 1 connections. Nodes: Aliased mutation, Compiler error. Connections: Aliased mutation to Compiler error.
R[Aliased mutation] --> E[Compiler error]
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

1. **co-16 zero-cost-iterators:** adapters compile to direct work.

```mermaid
flowchart LR
    accTitle: Thirty concept diagrams
    accDescr: Flowchart with 2 nodes and 1 connections. Nodes: Iterator chain, Monomorphized loop. Connections: Iterator chain to Monomorphized loop.
I[Iterator chain] --> M[Monomorphized loop]
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

1. **co-17 traits-generics:** a concrete caller specializes generic code.

```mermaid
flowchart LR
    accTitle: Thirty concept diagrams
    accDescr: Flowchart with 2 nodes and 1 connections. Nodes: Generic trait, Concrete code. Connections: Generic trait to Concrete code.
G[Generic trait] --> C[Concrete code]
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

1. **co-18 trait-objects:** a vtable chooses an implementation at runtime.

```mermaid
flowchart LR
    accTitle: Thirty concept diagrams
    accDescr: Flowchart with 3 nodes and 2 connections. Nodes: dyn Trait, Vtable, Implementation. Connections: dyn Trait to Vtable, Vtable to Implementation.
D[dyn Trait] --> V[Vtable] --> I[Implementation]
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

1. **co-19 result-error:** a call yields success or an error value.

```mermaid
flowchart LR
    accTitle: Thirty concept diagrams
    accDescr: Flowchart with 3 nodes and 2 connections. Nodes: Function, Ok, Err. Connections: Function to Ok, Function to Err.
F[Function] --> O[Ok] & E[Err]
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

1. **co-20 question-mark:** `?` returns an error early.

```mermaid
flowchart LR
    accTitle: Thirty concept diagrams
    accDescr: Flowchart with 3 nodes and 2 connections. Nodes: ?, Continue on Ok, Return Err. Connections: ? to Continue on Ok, ? to Return Err.
Q[?] --> O[Continue on Ok] & E[Return Err]
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

1. **co-21 custom-errors:** variants preserve failure meaning.

```mermaid
flowchart LR
    accTitle: Thirty concept diagrams
    accDescr: Flowchart with 3 nodes and 2 connections. Nodes: Error enum, Variant, Variant. Connections: Error enum to Variant, Error enum to Variant.
E[Error enum] --> V1[Variant] & V2[Variant]
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

1. **co-22 anyhow:** context adds a human explanation to failure.

```mermaid
flowchart LR
    accTitle: Thirty concept diagrams
    accDescr: Flowchart with 2 nodes and 1 connections. Nodes: Error, Context. Connections: Error to Context.
E[Error] --> C[Context]
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

1. **co-23 unsafe-block:** manually proved code is visibly bounded.

```mermaid
flowchart LR
    accTitle: Thirty concept diagrams
    accDescr: Flowchart with 3 nodes and 2 connections. Nodes: Safe code, Small unsafe block, Safe result. Connections: Safe code to Small unsafe block, Small unsafe block to Safe result.
S[Safe code] --> U[Small unsafe block] --> S2[Safe result]
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

1. **co-24 raw-pointers:** dereference requires an unsafe proof.

```mermaid
flowchart LR
    accTitle: Thirty concept diagrams
    accDescr: Flowchart with 2 nodes and 1 connections. Nodes: Raw pointer, unsafe dereference. Connections: Raw pointer to unsafe dereference.
P[Raw pointer] --> U[unsafe dereference]
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

1. **co-25 unsafe-contract:** a wrapper enforces invariants for callers.

```mermaid
flowchart LR
    accTitle: Thirty concept diagrams
    accDescr: Flowchart with 3 nodes and 2 connections. Nodes: Caller, Safe wrapper, Audited unsafe. Connections: Caller to Safe wrapper, Safe wrapper to Audited unsafe.
C[Caller] --> W[Safe wrapper] --> U[Audited unsafe]
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

1. **co-26 ffi-extern:** an ABI declaration describes foreign linkage.

```mermaid
flowchart LR
    accTitle: Thirty concept diagrams
    accDescr: Flowchart with 2 nodes and 1 connections. Nodes: Rust, extern C ABI. Connections: Rust to extern C ABI.
R[Rust] --> A[extern C ABI]
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

1. **co-27 ffi-call-c:** the wrapper invokes a C function.

```mermaid
flowchart LR
    accTitle: Thirty concept diagrams
    accDescr: Flowchart with 2 nodes and 1 connections. Nodes: Wrapper, C function. Connections: Wrapper to C function.
W[Wrapper] --> C[C function]
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

1. **co-28 ffi-expose-rust:** an exported Rust symbol has a C ABI.

```mermaid
flowchart LR
    accTitle: Thirty concept diagrams
    accDescr: Flowchart with 2 nodes and 1 connections. Nodes: Rust export, C caller. Connections: Rust export to C caller.
R[Rust export] --> C[C caller]
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

1. **co-29 ffi-ownership:** allocation/free responsibility is explicit.

```mermaid
flowchart LR
    accTitle: Thirty concept diagrams
    accDescr: Flowchart with 3 nodes and 2 connections. Nodes: Allocator, User, Free owner. Connections: Allocator to User, User to Free owner.
A[Allocator] --> U[User] --> F[Free owner]
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```

1. **co-30 async-runtime:** a runtime polls a future to completion.

```mermaid
flowchart LR
    accTitle: Thirty concept diagrams
    accDescr: Flowchart with 3 nodes and 2 connections. Nodes: Future, Runtime, Output. Connections: Future to Runtime, Runtime to Output.
F[Future] --> R[Runtime] --> O[Output]
    classDef default fill:#0173B2,stroke:#000000,color:#FFFFFF
```
