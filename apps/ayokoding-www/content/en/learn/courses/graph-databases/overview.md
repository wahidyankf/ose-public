---
title: "Overview"
date: 2026-07-27T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [SQL Essentials](../sql-essentials/learning/overview.md) -- the relational
  model and its join syntax, needed as the direct point of contrast every relational-vs-graph
  example in this course draws against; [NoSQL Databases](/en/learn/courses/nosql-databases) --
  supplies the broader
  non-relational framing this course's property-graph model sits beside; and
  [Just Enough Python](../just-enough-python/learning/overview.md) -- every driver-based worked
  example in this course's Intermediate and Advanced tiers is a Python script calling the Neo4j
  driver, and this course never re-teaches basic Python syntax.
- **Tools & environment**: a macOS/Linux terminal; a local **Neo4j** instance (or another
  GQL-compatible engine) -- Docker works fine, but check which edition's license fits your use
  (Neo4j Community Edition is GPLv3; Enterprise Edition is AGPLv3, a different license entirely);
  **Python 3.x** with a pinned, CVE-clean `neo4j` driver package; and the `cypher-shell` command-line
  tool for running `.cypher` files directly.
- **Assumed knowledge**: relational joins, well enough to feel the contrast when a graph pattern
  replaces a multi-table join chain; basic Python driver use (opening a session, running a
  parameterized query, reading back a result); and the general idea that entities can have
  relationships to other entities.

## Why this exists -- the big idea

**The problem before the solution**: when the relationships between entities are the actual
question being asked -- who knows whom, what is the shortest path, what should this person see
next -- a relational store answers with a chain of joins whose join count grows steadily with every
additional hop -- two more joins per hop, each one a full table scan plus an index lookup, not a
direct pointer follow. **The one idea worth keeping if you forget everything else**: when connections
between things are first-class data, model them as first-class data -- a property graph makes a
k-hop traversal cost roughly proportional to k, where the equivalent relational query adds two more
joins for every hop instead.

**Cross-cutting big ideas, taught here and reused throughout this course**:
`consistency-latency-throughput` -- deep-traversal performance, not raw storage volume, is the
specific win a graph database is built around; `coupling-vs-cohesion` -- in a graph database, the
domain being modeled genuinely _is_ connectedness itself, not an incidental property of otherwise
independent rows.

> **Scope guard -- graph databases vs. the wider NoSQL landscape vs. storage internals.**
> [NoSQL Databases](/en/learn/courses/nosql-databases) would own the **broader non-relational
> survey**: document stores, key-value
> stores, wide-column stores, and graph databases as one family of alternatives to the relational
> model, compared at the level of "which data shape fits which storage model." This course owns
> **one specific member of that family in depth**: the property-graph model, Cypher as its query
> language, and the specific problem classes (recommendations, fraud detection, knowledge graphs,
> variable-depth traversal) where a graph genuinely outperforms every other option, including the
> other NoSQL families.
> [36 · Database Internals and Storage Engines](../database-internals-and-storage-engines/learning/overview.md)
> owns the **storage-engine mechanics** beneath any database, relational or not: B-trees, LSM-trees,
> write-ahead logs, page layouts, and how a query planner turns a logical plan into physical disk
> I/O. This course treats
> index-free adjacency (co-04) as an observable behavior -- a hop's cost stays proportional to the
> traversed node's own degree, not the graph's total size -- without re-deriving how a storage
> engine implements that guarantee underneath. Neither course re-teaches the other's material.

## How this topic is organized

- **[Learning](./learning/overview.md)** -- 80 runnable, heavily annotated worked examples across
  Beginner (Examples 1-26: creating nodes and relationships, pattern matching, `MERGE`'s
  idempotency, variable-length and quantified paths, shortest-path queries, index-free adjacency's
  performance signature, the graph-vs-relational join-explosion contrast, constraints and indexes,
  transaction rollback, bulk loading via `LOAD CSV` and `neo4j-admin`, and RDF/SPARQL basics),
  Intermediate (Examples 27-54: `OPTIONAL MATCH`, the full `WITH`/`UNWIND`/`CALL {}` aggregation
  pipeline, many-to-many and hierarchical modeling, bill-of-materials traversal, recommendation and
  fraud-detection query patterns, supernode identification, Gremlin, more SPARQL, and pinning a
  query to a specific Cypher version), and Advanced (Examples 55-80: the Neo4j Graph Data Science
  library -- projection, PageRank, betweenness, Louvain community detection, node similarity, and
  weighted Dijkstra shortest paths -- knowledge-graph modeling, six worked previews of the
  capstone's own domain, supernode mitigation, community-aware sharding, a concurrent-write
  conflict, constraint enforcement during bulk import, SPARQL `CONSTRUCT`, a cycle-safe Gremlin
  traversal, the property-graph-vs-RDF trade-off modeled both ways, the modern GQL-conformant
  `SHORTEST` path selector, and a closing multi-model contrast report) -- plus a four-step capstone
  that loads a small recommendation domain, answers real graph questions against it from Python, and
  contrasts the equivalent relational query to show concretely why the graph wins.
- **Drilling** -- the spaced-repetition companion: recall Q&A across all 26 concepts, applied
  problems, self-contained code katas, a self-check checklist, and elaborative-interrogation
  prompts.

**A note on Cypher versions**: Neo4j ships two parallel Cypher dialects, one frozen and one evolving
-- see [References](#references) below for the current dialect names and the calendar
version at which the evolving dialect became the default. Most examples in this course run unchanged
under either dialect. Where the dialect genuinely matters, the example says so explicitly: Example 15
(quantified relationship paths) and Example 79 (the `SHORTEST` path selector) target the evolving
dialect / GQL-conformant mode specifically, since their syntax is new there; Examples 52 and 53 exist
specifically to demonstrate pinning a query to one dialect or the other with the `CYPHER 5`/
`CYPHER 25` prefix; and Examples 14, 16, and 17 use the classic `*1..3`/`shortestPath()`/
`allShortestPaths()` syntax, which remains valid and runs unchanged under both dialects (not
GQL-conformant, but not removed either).

## References

- **Calendar-versioned**: at the time this course was authored, Neo4j ships
  two parallel Cypher dialects -- **Cypher 5** (frozen, bug-fixes only) and **Cypher 25** (evolving,
  and the default dialect for newly created databases from Neo4j 2026.02 onward). Both the specific
  dialect names and the version at which the default last changed are calendar-versioning specifics
  that will keep moving release to release -- check Neo4j's own version-support
  documentation before relying on either claim in a later reading of this course. This same fact is
  cross-referenced, not restated, from `drilling/overview.md` (Q21, E6), `learning/overview.md`
  (co-21), `learning/beginner.md` (Example 15), and `learning/advanced.md` (Example 79).

---

Next: [Learning Overview](./learning/overview.md) →
