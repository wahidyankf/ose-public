---
description: "Shows real-world before/after examples of splitting oversized diagrams, plus a summary of the guidance."
when_to_use: "Use when you want worked before/after examples of diagram splitting, or a quick summary of the rule."
---

# Diagram Size and Splitting: Real-World Fixes and Summary

## Real-World Fixes

**Example 1: Sealed Classes (Before)**

Combined hierarchy + pattern matching:

```mermaid
graph TD
    accTitle: Real-World Fixes
    accDescr: Shape leads to Circle; Shape leads to Rectangle; Shape leads to Triangle; switchshape leads to Pattern Match; Pattern Match leads to Handle Circle via Circle; Pattern Match leads to Handle Rectangle via Rectangle; and 1 more links.
    Shape --> Circle
    Shape --> Rectangle
    Shape --> Triangle

    S[switch#40;shape#41;] --> Switch[Pattern Match]
    Switch --> |Circle| C[Handle Circle]
    Switch --> |Rectangle| R[Handle Rectangle]
    Switch --> |Triangle| T[Handle Triangle]
```

**Example 1: Sealed Classes (After)**

**Sealed Class Hierarchy:**

```mermaid
graph TD
    accTitle: Real-World Fixes (2)
    accDescr: Shape sealed interface leads to Circle; Shape sealed interface leads to Rectangle; Shape sealed interface leads to Triangle.
    Shape[Shape<br/>sealed interface] --> Circle
    Shape --> Rectangle
    Shape --> Triangle
```

**Pattern Matching Switch:**

```mermaid
graph TD
    accTitle: Real-World Fixes (3)
    accDescr: switchshape leads to Type?; Type? leads to area = π × r² via Circle; Type? leads to area = w × h via Rectangle; and 1 more links.
    A[switch#40;shape#41;] --> B{Type?}
    B -->|Circle| C[area = π × r²]
    B -->|Rectangle| D[area = w × h]
    B -->|Triangle| E[area = ½ × b × h]
```

**Example 2: Concurrent Collections (Before)**

Combined BlockingQueue + ConcurrentHashMap:

```mermaid
graph TD
    accTitle: Real-World Fixes (4)
    accDescr: BlockingQueue leads to put; put leads to take; ConcurrentHashMap leads to PutIfAbsent; PutIfAbsent leads to Compute; Compute leads to Merge.
    BQ[BlockingQueue] --> Put[put#40;#41;]
    Put --> Take[take#40;#41;]

    CHM[ConcurrentHashMap] --> PutIfAbsent
    PutIfAbsent --> Compute
    Compute --> Merge
```

**Example 2: Concurrent Collections (After)**

**BlockingQueue (Producer-Consumer):**

```mermaid
graph TD
    accTitle: Real-World Fixes (5)
    accDescr: Producer leads to BlockingQueue via putitem; BlockingQueue leads to Consumer via take; BlockingQueue leads to Producer via Blocks if full; Consumer leads to BlockingQueue via Blocks if empty.
    Producer --> |put#40;item#41;| Queue[BlockingQueue]
    Queue --> |take#40;#41;| Consumer
    Queue --> |Blocks if full| Producer
    Consumer --> |Blocks if empty| Queue
```

**ConcurrentHashMap (Atomic Operations):**

```mermaid
graph TD
    accTitle: Real-World Fixes (6)
    accDescr: putIfAbsent k,v leads to Key exists?; Key exists? leads to Insert value via No; Key exists? leads to Return existing via Yes.
    A[putIfAbsent<br/>#40;k,v#41;] --> B{Key exists?}
    B -->|No| C[Insert value]
    B -->|Yes| D[Return existing]
```

## Summary

**Golden Rules**:

1. **One concept per diagram** - Each diagram explains one idea
2. **Limit branching** - Maximum 3-4 branches per level
3. **No subgraphs** - Use separate diagrams with headers instead
4. **Descriptive headers** - Add `**Concept Name:**` above each diagram
5. **Mobile-first** - Ensure readability on narrow screens

This prevents "too small" diagram issues and improves mobile user experience.
