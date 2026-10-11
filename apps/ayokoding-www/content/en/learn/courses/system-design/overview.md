---
title: "Overview"
date: 2026-08-14T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [Backend at Scale](../backend-at-scale/learning/overview.md) supplies
  single-service scaling, queues, and caching; [Advanced Networking](../advanced-networking/learning/overview.md)
  supplies latency, DNS, and load balancing; [26 · Advanced SQL](../advanced-sql-and-query-performance/learning/overview.md)
  supplies indexes, replication, and partitioning.
- **Tools and environment**: Python 3, a terminal, and a Mermaid-capable Markdown renderer. All
  runnable demonstrations use the Python standard library.
- **Assumed knowledge**: reading a request path, elementary arithmetic, and the distinction between
  latency, throughput, availability, and durability.

## Why this exists

System design is the practice of turning an uncertain workload into explicit choices: estimate the
load, locate the bottleneck, select a building block, and name what that choice sacrifices. The
course works from small arithmetic and request paths to complete designs for a URL shortener, news
feed, and distributed rate limiter.

**Scope boundary**: this is a depth course in production design reasoning, not a
`system-design-interview` rehearsal. It teaches durable mechanisms, checked estimates, failure
behaviour, and operational trade-offs; it does not optimize a timed whiteboard answer or a
company-specific interview rubric. A later interview-focused course may reuse the method, but this
course establishes the engineering judgment behind it.

## How the course is organized

- **[Learning](./learning/overview.md)** starts with requirements, capacity, APIs, and consistency
  choices; moves through load balancing, caches, replicas, partitions, queues, and limits; then
  applies them in case studies and failure-handling designs.
- **[Drilling](./drilling/overview.md)** turns the vocabulary, calculations, decision rules, and
  trade-off explanations into retrievable habits.

The 53 worked examples are annotated concepts. Code-bearing examples have a runnable Python file
under `learning/code/`; architecture and decision examples use complete, captioned artifacts where
code would hide the relationship being taught.

Next: [Learning Overview](./learning/overview.md) →
