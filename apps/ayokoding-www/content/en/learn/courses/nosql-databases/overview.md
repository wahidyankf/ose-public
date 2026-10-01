---
title: "Overview"
date: 2026-07-27T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [SQL Essentials](../sql-essentials/learning/overview.md) -- the relational model this
  topic contrasts against every time it reaches for a document, key-value, or wide-column shape
  instead; and [Just Enough Python](../just-enough-python/learning/overview.md) -- the type-annotated Python
  fluency every driver-facing example in this topic assumes (`†`, DD-39: every driver-facing example
  here is fully type-annotated and `pyright --strict`-clean, not a non-Python subject exception).
  `Advanced SQL & Query Performance` is **not** a hard prerequisite -- the syllabus source frames it as
  a topic that "sharpens the modeling contrast" if you have already taken it, not a gate you must pass
  first.
- **Tools & environment**: a macOS/Linux terminal; **Python 3.13** with pinned, CVE-clean-at-authoring
  drivers (`redis`, `pymongo`, `cassandra-driver`, `boto3`, `psycopg`, `duckdb`, `pyarrow`); local
  Docker instances of **Valkey** (BSD-3-Clause) or Redis, **MongoDB** (note the SSPLv1 license,
  and started as a **single-node replica set**, not a standalone `mongod` -- the multi-document
  transaction examples require one), **Cassandra** (Apache-2.0), **TimescaleDB** (Apache-2.0 core /
  TSL for the enterprise features this topic uses, published on a **non-default port** to avoid
  colliding with a locally installed Postgres), and **ClickHouse** (Apache-2.0); **DynamoDB Local**
  via the official `amazon/dynamodb-local` image; **DuckDB** runs in-process, no container needed.
  The exact provisioning commands for every service live in the learning tier's own
  [Confirm your toolchain](./learning/overview.md#confirm-your-toolchain) section. Each product's
  **license** is checked and recorded before use -- this topic treats that as a real engineering step
  (co-28, DD-15), not paperwork. One narrow exception to the local-only rule: the three license-check
  examples (25-27) make a live outbound HTTPS request to fetch each vendor's official license file
  from GitHub -- every other example in this topic runs entirely against a local Docker instance or
  in-process, no network access required.
- **Assumed knowledge**: relational schema design and CRUD from SQL Essentials; running a local
  service via Docker; basic Python driver use (opening a connection, running a query, reading a
  result).

## Why this exists -- the big idea

**The problem before the solution**: forcing every workload through one normalized relational store
with strong consistency costs latency and blocks horizontal scale for access patterns that never
needed either. **Keep-this-if-you-forget-everything**: choose the store by the access pattern and the
consistency you can actually tolerate -- CAP/PACELC says a distributed system trades consistency for
availability and latency, so pick the trade deliberately instead of inheriting it by default.

**Cross-cutting big ideas, taught here and reused elsewhere in this curriculum**:
`consistency-latency-throughput` (CAP/PACELC is the whole decision a distributed store forces on you);
`abstraction-and-its-cost` (denormalization buys read speed and charges duplication plus write
complexity).

## Scope boundary -- what this topic is not

This topic sits beside two other courses in the same catalog that could, on the surface, look like
they cover the same ground.

- **`graph-databases`** (Cypher + Python; modeling and querying connected data) is explicitly **out of
  scope here**, and remains **forthcoming, not yet present in the AyoKoding course library on disk**
  -- named here by description, without a working link, the same way this topic's own syllabus source
  names its own sibling cross-references. This topic's own scope note says it plainly: "Graph
  databases are their own topic." Nothing in this topic teaches a graph query language, a graph
  traversal engine, or graph-shaped modeling (nodes, edges, and relationship properties as first-class
  citizens) -- the moment a problem is really about traversing relationships (friend-of-a-friend,
  shortest path through a social graph, recommendation-by-connection), that is `graph-databases`'
  subject, not this one.
- **[`database-internals-and-storage-engines`](../database-internals-and-storage-engines/learning/overview.md)**
  (Python; B-trees, LSM-trees, and write-ahead-log internals) **is** present in the AyoKoding course
  library on disk. It is **not** duplicated here either, but the boundary is subtler than with graph databases
  because this topic does **touch** LSM-tree-vs-B-tree at a conceptual, comparative level (co-25,
  ex-55 through ex-57). That touch exists for one reason: understanding why Cassandra and other
  wide-column stores accept higher write and read amplification in exchange for write throughput is
  necessary to explain their access-pattern tradeoffs (co-08, co-22) -- you cannot honestly teach "why
  does Cassandra reject a query that skips the partition key" without first establishing what an
  SSTable and a compaction pass are. What this topic does **not** do is go further: no memtable
  implementation walkthrough, no write-ahead-log durability proof, no on-disk page-format internals, no
  B-tree node-splitting mechanics. That full internals-implementation treatment -- building the data
  structures themselves, not just reasoning about their consequences -- belongs entirely to
  `database-internals-and-storage-engines`. If a question is "how would I implement an SSTable's
  compaction strategy," it belongs there; if the question is "why does an LSM-tree-backed store trade
  read speed for write speed, and what does that mean for my schema," it belongs here.

## How this topic is organized

- **[Learning](./learning/overview.md)** -- 91 runnable, heavily annotated worked examples across five
  bands:
  - **[Beginner](./learning/beginner.md)** (Examples 1-27) -- Redis/Valkey key-value structures and
    TTL, MongoDB documents and indexes, and the conceptual foundations (the NoSQL family taxonomy,
    CAP/PACELC, BASE vs. ACID, partitioning, consistent hashing, replication, and license checks).
  - **[Intermediate](./learning/intermediate.md)** (Examples 28-54) -- Redis transactions, MongoDB's
    aggregation pipeline and multi-document transactions, quorum reads/writes, leaderless replication,
    conflict resolution (LWW, vector clocks, CRDTs), Cassandra's partition/clustering key model, and
    DynamoDB's single-table design.
  - **[Advanced](./learning/advanced.md)** (Examples 55-80) -- LSM-tree write/read amplification,
    Cassandra lightweight transactions, polyglot persistence, denormalization tradeoffs measured
    directly, tunable consistency, and four capstone-preview examples.
  - **[Time-series](./learning/time-series.md)** (Examples 81-85) -- TimescaleDB hypertables,
    `time_bucket()` downsampling, retention policies, and continuous aggregates.
  - **[OLAP & columnar analytics](./learning/olap-and-columnar-analytics.md)** (Examples 86-91) --
    DuckDB, row-vs-column scan cost, Parquet projection, Arrow zero-copy interchange, and ClickHouse's
    `MergeTree` engine.
  - **[Capstone](./learning/capstone/overview.md)** -- one domain modeled across three NoSQL
    families (Valkey key-value, MongoDB document, Cassandra wide-column), closing with a written
    per-store CAP/PACELC and license rationale.
- **[Drilling](./drilling/overview.md)** -- the spaced-repetition companion: recall Q&A across all
  36 concepts, applied problems, self-contained code katas, a self-check checklist, and
  elaborative-interrogation prompts.

## The 36 concepts this topic covers

- **co-01 -- NoSQL family taxonomy**: key-value, document, wide-column, and time-series stores
  optimize different access shapes and tradeoffs; graph is its own sibling topic.
- **co-02 -- When NoSQL vs. relational**: pick NoSQL when the access pattern, horizontal-scale need,
  or tolerable consistency does not fit the relational model's joins-plus-ACID default.
- **co-03 -- CAP theorem**: a partitioned distributed system must trade consistency for availability
  (Gilbert & Lynch's 2002 formal proof of Brewer's conjecture).
- **co-04 -- PACELC extension**: even absent a partition, a distributed system trades latency for
  consistency (Abadi, 2010).
- **co-05 -- BASE vs. ACID**: Basically Available / Soft state / Eventually consistent as the looser
  alternative many NoSQL stores default to instead of ACID.
- **co-06 -- Eventual consistency**: replicas converge to the same value over time without
  synchronous coordination on every write.
- **co-07 -- Tunable consistency (quorum)**: per-operation R/W/N (or write-concern/read-concern)
  settings let a client dial consistency versus latency for that one call.
- **co-08 -- Access-pattern-first modeling**: design the schema from the queries the application
  will actually run, not from a normalized entity diagram.
- **co-09 -- Denormalization and aggregates**: embedding or duplicating related data into one
  aggregate so the common read is a single fetch, at the cost of write-side duplication.
- **co-10 -- Partition/sharding keys**: the key chosen to distribute rows, documents, or items
  evenly across nodes; a poorly chosen one creates a hot partition.
- **co-11 -- Consistent hashing**: a hash ring that minimizes data movement when nodes are added or
  removed (the Dynamo-paper technique).
- **co-12 -- Replication: leader-follower**: one leader orders writes; followers replicate and can
  serve reads; failover promotes a follower.
- **co-13 -- Replication: leaderless**: any replica accepts a write; a read/write quorum reconciles
  the result (Dynamo-style).
- **co-14 -- Conflict resolution: LWW**: last-write-wins picks a winner among concurrent writes by
  timestamp, silently dropping the loser.
- **co-15 -- Conflict resolution: vector clocks**: vector clocks detect (not resolve) concurrent,
  causally unordered updates so the application can merge them.
- **co-16 -- CRDTs**: conflict-free replicated data types merge concurrent updates deterministically
  without app-level conflict code.
- **co-17 -- Secondary indexes in NoSQL**: indexing beyond the primary/partition key, and the extra
  write and cross-node coordination cost it adds in a distributed store.
- **co-18 -- MongoDB document model and schema-on-read**: BSON documents carry no schema enforced at
  write time by default; the reader interprets the shape it finds.
- **co-19 -- MongoDB aggregation pipeline**: a staged server-side pipeline (`$match`/`$group`/
  `$lookup`) transforms and joins documents without pulling raw data to the client.
- **co-20 -- Redis data structures**: Redis exposes typed structures (strings, lists, hashes, sets,
  sorted sets) as first-class server-side operations, not opaque blobs.
- **co-21 -- Redis: cache vs. store**: the same engine used as a disposable cache (TTL eviction, no
  durability) or as a durable primary store (RDB/AOF persistence tuned).
- **co-22 -- Wide-column partition/clustering keys**: Cassandra/DynamoDB rows and items are grouped
  by a partition key and ordered within it by a clustering key (Cassandra) or sort key (DynamoDB).
- **co-23 -- DynamoDB single-table design**: one physical table holding multiple entity types,
  distinguished by overloaded key prefixes, driven by named access patterns.
- **co-24 -- Time to live**: a per-item/per-key expiry attribute the store uses to auto-purge stale
  data.
- **co-25 -- LSM-tree vs. B-tree and amplification**: an append-only write path (memtable -> SSTable
  -> compaction) buys write throughput at the cost of write and read amplification, versus a B-tree's
  in-place updates.
- **co-26 -- Polyglot persistence**: deliberately using different stores for different services or
  access patterns within one system instead of forcing everything into one engine.
- **co-27 -- Multi-item transactions**: NoSQL stores adding ACID-style transactions across multiple
  keys, documents, or rows, and the latency cost versus a single-item write.
- **co-28 -- License awareness (DD-15)**: checking and recording a NoSQL product's actual license
  before adopting it, as a real engineering step.
- **co-29 -- Time-series data model**: a store optimized for append-heavy, timestamp-keyed
  measurements, where time is the primary axis and reads are almost always range-scans over a window.
- **co-30 -- Retention and downsampling**: bounding storage growth via a retention policy that drops
  raw data past a window, plus downsampling that rolls high-resolution points into coarser buckets.
- **co-31 -- Continuous aggregates**: incrementally maintained, pre-computed time-bucketed rollups so
  a range query reads summarized buckets instead of re-scanning raw points.
- **co-32 -- OLAP vs. OLTP**: OLTP is write-heavy point transactions at millisecond latency; OLAP is
  read-heavy analytical scans over many rows and few columns at second-to-minute latency.
- **co-33 -- Columnar storage and compression**: a column-oriented on-disk layout lets an analytical
  query read only the columns it touches and compresses far better.
- **co-34 -- Vectorized execution**: analytical engines process data in column batches rather than a
  row at a time, improving cache locality and enabling SIMD.
- **co-35 -- Columnar formats: Parquet and Arrow**: Parquet is an open columnar on-disk file format;
  Arrow is a columnar in-memory format enabling zero-copy interchange between engines.
- **co-36 -- Wide-column vs. columnar OLAP**: a wide-column store is row/partition-oriented on disk
  and tuned for operational writes; a columnar OLAP store is column-oriented on disk and tuned for
  analytical scans -- the word "column" names two different layouts.

## Tensions & tradeoffs -- when NOT to reach for this

- **Consistency vs. latency is a dial, not a switch**: `W=ALL` is not "more correct" in the abstract --
  it is slower, and the right setting depends entirely on what the operation actually needs (ex-75).
- **Denormalization buys reads and charges writes**: embedding is the default in document stores for a
  reason, but an unbounded embedded array eventually costs more to update than a reference would have
  (ex-61, ex-71).
- **A secondary index is not free in a distributed store**: unlike a single-node relational index, a
  NoSQL secondary index can require cross-node coordination on every write (co-17, ex-59).
- **When NOT to reach for NoSQL at all**: if the workload is genuinely relational (multi-table joins,
  ad hoc queries you cannot predict in advance, strong cross-entity ACID guarantees as the default
  requirement), a relational store is still the right default -- NoSQL's access-pattern-first modeling
  is a cost you pay for a benefit you must actually need.
- **What this topic deliberately does not cover**: graph-shaped modeling and traversal
  (`graph-databases`), and the implementation internals of the storage engines this topic only reasons
  about from the outside (`database-internals-and-storage-engines`).

## Accuracy notes

> Verified in the pre-authoring `web-researcher` sweep (2026-07-12, DD-28), with a follow-up
> spot-check sweep on 2026-07-27.

- 2026-07-12 -- verified (all five license claims confirmed against primary sources): **Redis** --
  tri-license RSALv2/SSPLv1/**AGPLv3** since Redis 8 (2025-05-01, re-adding an OSI-approved option);
  **Valkey** -- **BSD-3-Clause** (Linux Foundation fork, March 2024); **MongoDB** -- **SSPLv1**
  (unchanged since Oct 2018, not OSI-approved); **Cassandra** -- **Apache-2.0** (unchanged);
  **ScyllaDB** -- source-available (Enterprise 2025.1+; Open Source 6.2.x is the final AGPL release).
  CAP (Brewer 2000) and PACELC (Abadi 2010) framing stable. (redis.io/blog/agplv3 / valkey.io /
  mongodb.com / cassandra.apache.org / scylladb.com)
- 2026-07-12 -- **DynamoDB license caveat**: DynamoDB is a proprietary AWS managed service, not an OSS
  product -- it has no OSI license to record. Its examples (co-22, co-23, co-27) carry no co-28
  citation; this topic states that distinction explicitly rather than forcing DynamoDB into the
  OSS license-naming pattern.
- 2026-07-12 -- **TimescaleDB / Tiger Data license split** (drives co-28): `create_hypertable`,
  `time_bucket`, and basic hyperfunctions are **Apache-2.0**; continuous aggregates (ex-84),
  `add_retention_policy` (ex-83), and columnar compression ("Hypercore") are **TSL / Community** --
  source-available, not OSI-approved. The vendor rebrand Timescale -> Tiger Data (June 2025) moved
  docs to tigerdata.com; the license abbreviation TSL is unchanged.
- 2026-07-12 -- **Redis `MULTI`/`EXEC` is not ACID-isolated**: a runtime error inside the block does
  not roll back remaining queued commands (ex-28, ex-30, ex-72). `WATCH` gives optimistic
  compare-and-swap, aborting `EXEC` with `nil` on a conflicting concurrent write (ex-29).
- 2026-07-12 -- **Cassandra LWT cost**: the commonly quoted "four round trips" figure for
  `INSERT ... IF NOT EXISTS` was not confirmed against apache.org primary docs and is deliberately
  **not** repeated in ex-58 -- only the qualitative "LWTs are expensive, reserve them" framing is
  taught.
- 2026-07-12 -- **DynamoDB TTL is best-effort**: expired items are typically purged within roughly two
  days of their epoch expiry, and can still be read until purged (ex-53, ex-77) -- this topic never
  claims instant deletion.
- **2026-07-27 spot-check correction -- `redis-py` version**: the 2026-07-12 sweep's "~8.8.0" figure
  for the PyPI `redis` package does not exist. Verified current release is **`redis==8.0.1`**
  (2026-06-23; release history 7.4.x -> 8.0.0b1/b2 -> 8.0.0 on 2026-05-28 -> 8.0.1). Every
  `requirements.txt` in this topic pins `redis==8.0.1`, not the earlier incorrect figure.
  (source: PyPI redis release history -- https://pypi.org/project/redis/#history ; accessed
  2026-07-27)
- **2026-07-27 spot-check**: MongoDB's current default/stable line is **8.3.7** (with 8.2.12 and
  8.0.28 as still-live parallel lines -- MongoDB dropped the old odd/even stable-vs-rapid convention
  at 8.2, so minors are pinned explicitly rather than inferred from parity). This topic's worked
  examples are representative output, run against the 8.2.x line (**MongoDB 8.2.12**), one of the still-live parallel
  lines, not the newer 8.3.x line. License unchanged: SSPLv1.
- **2026-07-27 spot-check**: TimescaleDB's current point release is **2.28.3** (2026-07-16), a patch
  bump from the 2026-07-12 sweep's 2.28.2. The Apache-2.0/TSL license split and the Tiger Data
  branding are unchanged.
- **2026-07-27 spot-check, no changes needed**: Cassandra `5.0.8` (Apache-2.0) and its Python driver
  `cassandra-driver` `3.30.1` (now Apache Software Foundation-maintained, confirming the "3.30+,
  Apache-maintained" framing); ClickHouse (Apache-2.0); DuckDB `1.5.5` (MIT); DynamoDB Local
  (`amazon/dynamodb-local`, still the official image) all matched the 2026-07-12 sweep exactly.

## Read more

**Books**

- **Designing Data-Intensive Applications** -- Martin Kleppmann (2017). The modern canonical text
  spanning replication, partitioning, and consistency models across relational and NoSQL systems.
- **NoSQL Distilled: A Brief Guide to the Emerging World of Polyglot Persistence** -- Pramod J.
  Sadalage & Martin Fowler (2012). The standard short introduction to document, key-value,
  column-family, and graph NoSQL data models.
- **Seven Databases in Seven Weeks** -- Eric Redmond & Jim R. Wilson (2012; 2nd ed. 2018). A
  practical tour of relational and NoSQL databases including Redis, MongoDB, Cassandra, and Neo4j.

**Papers & articles**

- **Dynamo: Amazon's Highly Available Key-value Store** -- Giuseppe DeCandia et al. (2007). The
  paper whose design -- consistent hashing, vector clocks, quorum reads/writes -- inspired Cassandra,
  Riak, and Voldemort. <https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf>
- **Bigtable: A Distributed Storage System for Structured Data** -- Fay Chang et al. (2006). The
  paper defining the wide-column store model behind Bigtable, HBase, and Cassandra's data model.
  <https://research.google/pubs/bigtable-a-distributed-storage-system-for-structured-data/>
- **Brewer's Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web
  Services** -- Seth Gilbert & Nancy Lynch (2002). The formal proof of the CAP theorem that frames
  every NoSQL consistency tradeoff. <https://dl.acm.org/doi/10.1145/564585.564601>

---

Next: [Learning Overview](./learning/overview.md) &rarr;
