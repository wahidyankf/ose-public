---
title: "Overview"
date: 2026-07-27T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [SQL Essentials](../sql-essentials/learning/overview.md) and
  [Advanced SQL & Query Performance](../advanced-sql-and-query-performance/learning/overview.md).
- **Tools & environment**: a macOS/Linux terminal; a local relational DB whose internals you can
  inspect (Postgres-style MVCC and/or an embedded B-tree/LSM store); a hex/page viewer; **Python 3.x**
  (fully type-annotated, stdlib only) to model the structures; a text editor with a Python LSP.
- **Assumed knowledge**: writing SQL and reading an `EXPLAIN` plan; how an index changes a query
  plan; reading typed Python.

## Why this exists -- the big idea

**The problem before the solution**: treating the database as an opaque box means you can't explain
why a workload is slow, why the same schema is fast on one engine and slow on another, or what
actually happens on `COMMIT` -- the abstraction hides exactly the costs you must reason about at
scale. **Keep this if you forget everything else**: durability and performance come from the same
few ideas -- an append-only log for crash-safe writes, a page/buffer-pool cache for reads, and an
index structure (B-tree or LSM) chosen to favor either reads or writes.

**Cross-cutting big ideas**: `consistency-latency-throughput` (B-tree vs LSM is a read-latency-vs-
write-throughput choice, and the WAL and buffer pool trade durability guarantees against latency),
`layering-and-leaks` (the SQL abstraction leaks its storage engine -- page size, index type, and MVCC
version bloat all surface as performance you have to explain).

> **Scope note -- this is not a NoSQL or graph-database course.** How a document store, wide-column
> store, or key-value store distributes and shards data across nodes belongs to
> [NoSQL Databases](/en/learn/courses/nosql-databases) -- and how a
> native graph engine stores and traverses adjacency belongs to
> [Graph Databases](/en/learn/courses/graph-databases) -- both are
> sibling courses, not substitutes: they share some of the same substrate (a page, a WAL, an index
> structure that must still be built on disk somehow) but answer a different question -- "how does
> this data model distribute, shard, or traverse" -- rather than "how does a single storage engine on
> a single node achieve durability and a read/write trade-off," which is this course's entire scope.
> Everything here -- the slotted page, the buffer pool, the B-tree and LSM-tree, the write-ahead log,
> MVCC, and row-vs-column layout -- is the single-node substrate that a NoSQL store or a graph engine
> is itself built on top of, not an alternative to it. An engineer who wants distributed sharding,
> a document or wide-column data model, or native graph traversal should read `nosql-databases` or
> `graph-databases` instead of expecting this course to cover them.

## How this topic is organized

- **[Learning](./learning/overview.md)** -- 80 runnable, heavily annotated examples across
  Beginner (Examples 1-28: the slotted-page layout, the buffer pool, a B+-tree's core operations,
  and an LSM tree's memtable/SSTable/Bloom-filter fundamentals), Intermediate (Examples 29-56:
  write-ahead logging and MVCC fundamentals, buffer-pool eviction policy comparisons, B-tree
  bulk-load/split/underflow, clustered-vs-heap storage, LSM compaction strategies and
  amplification, and row-vs-column byte layout), and Advanced (Examples 57-80: column encodings,
  durability mechanics (fsync, group commit, torn pages), the full ARIES recovery algorithm,
  concurrency control (2PL, strict 2PL, OCC, deadlock detection), the four classical isolation
  anomalies plus write skew and serializable isolation, and a measured B-tree-vs-LSM comparison) --
  plus a **[Capstone](./learning/capstone/overview.md)** that assembles a slotted-page buffer pool,
  a B+-tree-style index, a write-ahead log with crash recovery, and an MVCC snapshot read into one
  small, integrated storage engine.

Every example is a complete, self-contained `example.py` file colocated under `learning/code/`,
independently checked with `pyright --strict` (zero errors, zero warnings) and actually executed to
capture its documented output -- every printed value in this topic's pages is a genuine, captured
transcript, never a fabricated one.

- **[Drilling](./drilling/overview.md)** -- the spaced-repetition companion: recall Q&A across all
  twenty-eight concepts, applied problems, self-contained code katas exercising real storage-engine
  bugs, a self-check checklist, and elaborative-interrogation prompts.

## References

- **Durable spine**: the internals taught here (B-tree and LSM-tree structure,
  write-ahead logging, buffer pool, MVCC, slotted-page layout) are long-settled, engine-independent
  concepts. The canonical WAL/recovery reference remains ARIES (Mohan et al., 1992) and the
  canonical LSM reference is O'Neil et al. (1996).
- Specific engine defaults (page sizes, MVCC vacuum behavior, compaction strategy)
  vary by product and version -- this topic describes them as engine-dependent rather than
  asserting one product's numbers as universal.
- **Slotted page** -- PostgreSQL's storage page layout: a header, an `ItemIdData`
  slot array growing from the front, tuple data growing from the back, free space between; a slot
  index is a stable long-term handle even after in-page compaction. Page size is engine-specific
  (**Postgres/SQL Server 8 KB, InnoDB 16 KB**) -- this topic does not present 8 KB as universal.
- **Buffer pool** -- pin count + dirty bit per frame; a dirty page is flushed (or its
  WAL made durable) before its frame is reused. **CLOCK/second-chance** approximates LRU via a
  per-frame reference bit -- it is an approximation, not exact LRU. **LRU-K** (O'Neil et al.,
  SIGMOD 1993) is a distinct algorithm, not "LRU with K frames."
- **B-tree vs B+-tree** -- a B+-tree keeps values only in leaves with linked siblings
  for range scans; PostgreSQL's `nbtree` (Lehman & Yao) and InnoDB are B+-trees though their public
  API says "btree." SQLite `WITHOUT ROWID` tables are a genuine classical-B-tree counter-example.
  The illustrative fanout/height figures used in this topic's examples
  (e.g. fanout 200-500 -> height 3-4 for 1e9 keys) are pedagogical, not vendor constants; they are
  shown as illustrative, not as a specific product's measured number.
- **LSM** -- memtable (RocksDB default = skiplist) -> immutable sorted SSTables; a
  read checks the memtable then SSTables newest to oldest; compaction is **leveled** (RocksDB
  default) vs **size-tiered** (Cassandra). The amplification trade-off is the **RUM conjecture**
  (Read/Update/Memory -- a conjecture, not a law).
- **Bloom filter** -- false positives possible, false **negatives impossible**;
  per-SSTable, skips files that definitely lack a key.
- **WAL / ARIES** (Mohan et al. 1992) -- a log record reaches stable storage before
  its page (the WAL rule); LSN + pageLSN; three phases **analysis -> redo -> undo**. ARIES
  **"repeats history"**: redo replays _all_ logged changes (committed or not), _then_ undo rolls
  back losers via Compensation Log Records -- this topic does not teach "redo skips uncommitted."
- **MVCC** -- row versions tagged `xmin`/`xmax` (PostgreSQL terms); a snapshot sees
  versions committed before it and not yet deleted; readers don't block writers. Dead versions need
  VACUUM/GC. PostgreSQL `REPEATABLE READ` **is snapshot isolation** and permits **write skew**
  (Berenson et al. 1995); true `SERIALIZABLE` (SSI, 9.1+) catches it.
- **Durability** -- a page write is **not atomic** across a crash (torn page);
  mitigations are PostgreSQL **full-page-writes** and InnoDB **doublewrite buffer**; `fsync` forces
  durability, **group commit** batches it. InnoDB's specific checksum
  algorithm was not confirmed against a primary source; treat any InnoDB
  checksum-algorithm detail as unconfirmed.
- **Clustered vs heap** -- InnoDB clusters rows in the PK B+-tree leaf; PostgreSQL
  uses a heap with `ctid` (page, slot) row pointers; SQLite rowid tables cluster on rowid. **Row
  store** (OLTP) vs **column store** (OLAP: dictionary/run-length/delta encoding) -- C-Store,
  Stonebraker et al. 2005.

---

Next: [Learning Overview](./learning/overview.md) →
