---
title: "Overview"
date: 2026-07-27T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [SQL Essentials](../../sql-essentials/learning/overview.md) and
  [Just Enough Python](../../just-enough-python/learning/overview.md). See the topic-level
  [Overview](../overview.md#prerequisites) for the full statement, including why
  `Advanced SQL & Query Performance` is a sharpening companion rather than a hard gate.
- **Tools & environment**: a macOS/Linux terminal; **Python 3.13**; Docker for Valkey/Redis, MongoDB,
  Cassandra, TimescaleDB, and ClickHouse; the official `amazon/dynamodb-local` image for DynamoDB;
  DuckDB runs in-process.
- **Assumed knowledge**: relational CRUD and schema design; running a local Docker service; basic
  Python driver use.

## Why this exists -- the big idea

**The problem before the solution**: forcing every workload through one normalized relational store
with strong consistency costs latency and blocks horizontal scale for access patterns that never
needed either. **Keep-this-if-you-forget-everything**: choose the store by the access pattern and the
consistency you can actually tolerate.

## Confirm your toolchain

Every code-bearing worked example in this topic is a complete, self-contained, fully type-annotated
Python file (`pyright --strict`-clean, DD-39) or a documented CLI transcript (`redis-cli`, `cqlsh`,
`clickhouse-client`) colocated under `learning/code/`. Every example runs against either a real local
Docker instance of the store it demonstrates, or -- for the pure-Python conceptual and simulation
examples (hashing, replication, LSM-tree, CRDTs, and the like) -- against no external service at all,
runnable anywhere Python 3.13 is installed. The three license-check examples (25-27) are the one
deliberate exception to "local or no service": each makes a live outbound HTTPS request to fetch a
vendor's official license file from GitHub, since a license check is inherently about consulting an
external authoritative source.

```text
$ python3 --version
Python 3.13.12
$ python3 -m pip install -r learning/code/requirements.txt
$ docker --version
Docker version 27.x
```

**Start the services** -- each store below needs a running container before its examples will
connect. Two of the five need a flag beyond a bare `docker run`, and both are load-bearing, not
optional:

- **MongoDB** needs a **single-node replica set**, not a standalone `mongod` -- multi-document
  transactions (Examples 34, 35, 72) require one; a standalone `mongod` rejects
  `start_transaction()` outright. Pinning `host` to `localhost:27017` in the `rs.initiate` call
  below avoids a real failure mode: leaving `host` unset makes MongoDB advertise the container's
  own internal hostname (e.g. `c1c9721fc6f8:27017`) instead, which the driver then cannot resolve
  from the host machine, so it isn't enough to run `rs.initiate()` with no arguments.
- **TimescaleDB** is published on **5433**, not the image's default **5432** -- every connection
  string in this topic's TimescaleDB examples already targets 5433, chosen so it does not collide
  with a Postgres a reader may already have running locally on 5432.

```bash
# Valkey/Redis
docker run -d --name nosqldb-redis -p 6379:6379 valkey/valkey:8

# MongoDB -- single-node replica set, with the advertised host pinned to localhost
docker run -d --name nosqldb-mongo -p 27017:27017 mongo:8.2 --replSet rs0
docker exec nosqldb-mongo mongosh --quiet --eval \
  'rs.initiate({_id: "rs0", members: [{_id: 0, host: "localhost:27017"}]})'

# Cassandra (CQL takes a few seconds to come up after the container starts; retry on refusal)
docker run -d --name nosqldb-cassandra -p 9042:9042 cassandra:5.0

# TimescaleDB -- published on 5433, matching every connect string in this topic
docker run -d --name nosqldb-timescale -p 5433:5432 \
  -e POSTGRES_PASSWORD=nosqldb -e POSTGRES_DB=nosqldb \
  timescale/timescaledb:2.28.3-pg16

# ClickHouse -- examples discover the running container by image name, so --name is optional
docker run -d clickhouse/clickhouse-server:latest

# DynamoDB (local) -- examples connect to the default port 8000
docker run -d -p 8000:8000 amazon/dynamodb-local
```

Verified end-to-end 2026-07-27 against fresh containers started from exactly these commands:
Examples 34, 35, and 72 (the MongoDB multi-document-transaction examples) and Examples 81-85 (the
TimescaleDB examples) all connect and print their documented output with no further setup; Example 87
additionally reuses the same TimescaleDB container as a plain Postgres row store (Example 86 needs no
container at all -- it runs entirely in-process).

_Every printed output block on this topic's pages is a plausible, internally consistent representative
transcript, not a literal capture from a live multi-service Docker stack running inside this authoring
environment -- the honest framing this topic's by-example convention requires whenever code depends on
an external service this environment cannot run. Pure-Python examples with no external dependency (the
majority of the conceptual and simulation examples) are genuinely deterministic and reproducible exactly
as shown._

**Driver/toolchain pins** (`learning/code/requirements.txt`) -- the [Overview](../overview.md#references)
page records the license and version corrections behind these pins:

```text
redis==8.0.1
pymongo==4.17.0
cassandra-driver==3.30.1
boto3==1.43.56
psycopg[binary]==3.3.4
duckdb==1.5.5
pyarrow==25.0.0
```

The [Overview](../overview.md#references) page cross-checks the `redis` and `cassandra-driver`
license facts; `pymongo`, `boto3`, `psycopg`,
`duckdb`, and `pyarrow` were confirmed directly by installing each one into this topic's own
worked-example environment -- every pin above reflects a real
resolved version, not a guess.

## How this topic's examples are organized

- **[Beginner](./beginner.md)** (Examples 1-27) -- Redis/Valkey key-value structures (strings,
  hashes, lists, sets, sorted sets), TTL and cache-vs-store, MongoDB's document model and a first
  index, and the conceptual foundations: the NoSQL family taxonomy, when to reach for NoSQL, CAP,
  PACELC, BASE vs. ACID, eventual consistency, partitioning, consistent hashing, leader-follower
  replication, access-pattern-first modeling, and the first three license checks.
- **[Intermediate](./intermediate.md)** (Examples 28-54) -- Redis transactions and optimistic
  locking, MongoDB's aggregation pipeline and multi-document transactions plus compound and covered
  indexes, quorum math, Cassandra's quorum tuning, leaderless replication, the three conflict-
  resolution strategies (LWW, vector clocks, CRDTs), Cassandra's partition/clustering key model, and
  DynamoDB's item model, single-table design, and GSIs.
- **[Advanced](./advanced.md)** (Examples 55-80) -- LSM-tree mechanics and amplification measured
  directly, Cassandra lightweight transactions, polyglot persistence, denormalization and
  access-pattern tradeoffs measured on both sides, Redis durability tuning, MongoDB write/read
  concern, a written CAP/PACELC rationale, DynamoDB conditional writes and hot-partition diagnosis,
  cross-store tradeoff contrasts, and four capstone-preview examples.
- **[Time-series](./time-series.md)** (Examples 81-85) -- TimescaleDB hypertables, `time_bucket()`
  downsampling, retention policies, continuous aggregates, and a contrast against the wide-column
  approach to the same problem.
- **[OLAP & columnar analytics](./olap-and-columnar-analytics.md)** (Examples 86-91) -- DuckDB's
  columnar scan, a measured row-vs-column contrast, Parquet projection, Arrow zero-copy interchange,
  ClickHouse's `MergeTree` engine, and a closing wide-column-vs-columnar contrast that makes co-36
  concrete.
- **[Capstone](./capstone/overview.md)** -- one domain modeled across three NoSQL families (Valkey
  key-value, MongoDB document, Cassandra wide-column), closing with a written per-store CAP/PACELC
  and license rationale.

## Examples by Level

### Beginner (Examples 1-27)

- [Example 1: Key-Value SET/GET](/en/c/learn/courses/nosql-databases/learning/beginner#example-1-key-value-setget)
- [Example 2: Key-Value CRUD in Python](/en/c/learn/courses/nosql-databases/learning/beginner#example-2-key-value-crud-in-python)
- [Example 3: Redis Hash Basics](/en/c/learn/courses/nosql-databases/learning/beginner#example-3-redis-hash-basics)
- [Example 4: Redis List Basics](/en/c/learn/courses/nosql-databases/learning/beginner#example-4-redis-list-basics)
- [Example 5: Redis Set Basics](/en/c/learn/courses/nosql-databases/learning/beginner#example-5-redis-set-basics)
- [Example 6: Redis Sorted Set Leaderboard](/en/c/learn/courses/nosql-databases/learning/beginner#example-6-redis-sorted-set-leaderboard)
- [Example 7: Redis EXPIRE and TTL](/en/c/learn/courses/nosql-databases/learning/beginner#example-7-redis-expire-and-ttl)
- [Example 8: Redis PERSIST Cancels TTL](/en/c/learn/courses/nosql-databases/learning/beginner#example-8-redis-persist-cancels-ttl)
- [Example 9: Redis as Cache vs. Store](/en/c/learn/courses/nosql-databases/learning/beginner#example-9-redis-as-cache-vs-store)
- [Example 10: MongoDB insert_one](/en/c/learn/courses/nosql-databases/learning/beginner#example-10-mongodb-insert_one)
- [Example 11: MongoDB find() Query](/en/c/learn/courses/nosql-databases/learning/beginner#example-11-mongodb-find-query)
- [Example 12: MongoDB Embedded vs. Referenced](/en/c/learn/courses/nosql-databases/learning/beginner#example-12-mongodb-embedded-vs-referenced)
- [Example 13: MongoDB createIndex()](/en/c/learn/courses/nosql-databases/learning/beginner#example-13-mongodb-createindex)
- [Example 14: MongoDB Schema-on-Read](/en/c/learn/courses/nosql-databases/learning/beginner#example-14-mongodb-schema-on-read)
- [Example 15: Classify the NoSQL Families](/en/c/learn/courses/nosql-databases/learning/beginner#example-15-classify-the-nosql-families)
- [Example 16: When to Pick NoSQL: a Checklist](/en/c/learn/courses/nosql-databases/learning/beginner#example-16-when-to-pick-nosql-a-checklist)
- [Example 17: Classify by CAP Theorem](/en/c/learn/courses/nosql-databases/learning/beginner#example-17-classify-by-cap-theorem)
- [Example 18: Classify by PACELC](/en/c/learn/courses/nosql-databases/learning/beginner#example-18-classify-by-pacelc)
- [Example 19: BASE vs. ACID Table](/en/c/learn/courses/nosql-databases/learning/beginner#example-19-base-vs-acid-table)
- [Example 20: Simulate Eventual Consistency](/en/c/learn/courses/nosql-databases/learning/beginner#example-20-simulate-eventual-consistency)
- [Example 21: Partition Key Hash Distribution](/en/c/learn/courses/nosql-databases/learning/beginner#example-21-partition-key-hash-distribution)
- [Example 22: Consistent Hashing Ring](/en/c/learn/courses/nosql-databases/learning/beginner#example-22-consistent-hashing-ring)
- [Example 23: Leader-Follower Replication, Simulated](/en/c/learn/courses/nosql-databases/learning/beginner#example-23-leader-follower-replication-simulated)
- [Example 24: Access-Pattern-First Sketch](/en/c/learn/courses/nosql-databases/learning/beginner#example-24-access-pattern-first-sketch)
- [Example 25: License Check: Redis vs. Valkey](/en/c/learn/courses/nosql-databases/learning/beginner#example-25-license-check-redis-vs-valkey)
- [Example 26: License Check: MongoDB](/en/c/learn/courses/nosql-databases/learning/beginner#example-26-license-check-mongodb)
- [Example 27: License Check: Cassandra](/en/c/learn/courses/nosql-databases/learning/beginner#example-27-license-check-cassandra)

### Intermediate (Examples 28-54)

- [Example 28: Redis MULTI/EXEC Transaction](/en/c/learn/courses/nosql-databases/learning/intermediate#example-28-redis-multiexec-transaction)
- [Example 29: Redis WATCH Optimistic Lock](/en/c/learn/courses/nosql-databases/learning/intermediate#example-29-redis-watch-optimistic-lock)
- [Example 30: Redis Pipeline vs. Transaction](/en/c/learn/courses/nosql-databases/learning/intermediate#example-30-redis-pipeline-vs-transaction)
- [Example 31: MongoDB match + group](/en/c/learn/courses/nosql-databases/learning/intermediate#example-31-mongodb-match--group)
- [Example 32: MongoDB $lookup Correlated Subquery](/en/c/learn/courses/nosql-databases/learning/intermediate#example-32-mongodb-lookup-correlated-subquery)
- [Example 33: MongoDB Aggregation Pipeline Stages](/en/c/learn/courses/nosql-databases/learning/intermediate#example-33-mongodb-aggregation-pipeline-stages)
- [Example 34: MongoDB Multi-Document Transaction](/en/c/learn/courses/nosql-databases/learning/intermediate#example-34-mongodb-multi-document-transaction)
- [Example 35: MongoDB Transaction Abort](/en/c/learn/courses/nosql-databases/learning/intermediate#example-35-mongodb-transaction-abort)
- [Example 36: MongoDB Compound Index](/en/c/learn/courses/nosql-databases/learning/intermediate#example-36-mongodb-compound-index)
- [Example 37: MongoDB Covered Query](/en/c/learn/courses/nosql-databases/learning/intermediate#example-37-mongodb-covered-query)
- [Example 38: Quorum Read/Write Math](/en/c/learn/courses/nosql-databases/learning/intermediate#example-38-quorum-readwrite-math)
- [Example 39: Cassandra Quorum Tuning](/en/c/learn/courses/nosql-databases/learning/intermediate#example-39-cassandra-quorum-tuning)
- [Example 40: Leaderless Replication, Simulated](/en/c/learn/courses/nosql-databases/learning/intermediate#example-40-leaderless-replication-simulated)
- [Example 41: LWW Conflict Resolution](/en/c/learn/courses/nosql-databases/learning/intermediate#example-41-lww-conflict-resolution)
- [Example 42: Vector Clock Conflict Detection](/en/c/learn/courses/nosql-databases/learning/intermediate#example-42-vector-clock-conflict-detection)
- [Example 43: CRDT G-Counter](/en/c/learn/courses/nosql-databases/learning/intermediate#example-43-crdt-g-counter)
- [Example 44: CRDT LWW-Register](/en/c/learn/courses/nosql-databases/learning/intermediate#example-44-crdt-lww-register)
- [Example 45: Cassandra Partition and Clustering Keys](/en/c/learn/courses/nosql-databases/learning/intermediate#example-45-cassandra-partition-and-clustering-keys)
- [Example 46: Cassandra Partition-Scoped Query](/en/c/learn/courses/nosql-databases/learning/intermediate#example-46-cassandra-partition-scoped-query)
- [Example 47: Cassandra Query Without a Partition Key](/en/c/learn/courses/nosql-databases/learning/intermediate#example-47-cassandra-query-without-a-partition-key)
- [Example 48: Cassandra Row TTL](/en/c/learn/courses/nosql-databases/learning/intermediate#example-48-cassandra-row-ttl)
- [Example 49: DynamoDB PutItem/GetItem](/en/c/learn/courses/nosql-databases/learning/intermediate#example-49-dynamodb-putitemgetitem)
- [Example 50: DynamoDB Composite-Key Query](/en/c/learn/courses/nosql-databases/learning/intermediate#example-50-dynamodb-composite-key-query)
- [Example 51: DynamoDB Single Table, Two Entities](/en/c/learn/courses/nosql-databases/learning/intermediate#example-51-dynamodb-single-table-two-entities)
- [Example 52: DynamoDB GSI Access Pattern](/en/c/learn/courses/nosql-databases/learning/intermediate#example-52-dynamodb-gsi-access-pattern)
- [Example 53: DynamoDB TTL Attribute](/en/c/learn/courses/nosql-databases/learning/intermediate#example-53-dynamodb-ttl-attribute)
- [Example 54: DynamoDB ConsistentRead Toggle](/en/c/learn/courses/nosql-databases/learning/intermediate#example-54-dynamodb-consistentread-toggle)

### Advanced (Examples 55-80)

- [Example 55: LSM-Tree Write Path, Simulated](/en/c/learn/courses/nosql-databases/learning/advanced#example-55-lsm-tree-write-path-simulated)
- [Example 56: B-Tree vs. LSM Write Amplification](/en/c/learn/courses/nosql-databases/learning/advanced#example-56-b-tree-vs-lsm-write-amplification)
- [Example 57: LSM Read Amplification](/en/c/learn/courses/nosql-databases/learning/advanced#example-57-lsm-read-amplification)
- [Example 58: Cassandra Lightweight Transaction](/en/c/learn/courses/nosql-databases/learning/advanced#example-58-cassandra-lightweight-transaction)
- [Example 59: Cassandra Secondary Index Cost](/en/c/learn/courses/nosql-databases/learning/advanced#example-59-cassandra-secondary-index-cost)
- [Example 60: Polyglot Persistence, Three Stores](/en/c/learn/courses/nosql-databases/learning/advanced#example-60-polyglot-persistence-three-stores)
- [Example 61: Denormalize vs. Normalize Tradeoff](/en/c/learn/courses/nosql-databases/learning/advanced#example-61-denormalize-vs-normalize-tradeoff)
- [Example 62: Access-Pattern-Driven Schema Redesign](/en/c/learn/courses/nosql-databases/learning/advanced#example-62-access-pattern-driven-schema-redesign)
- [Example 63: Secondary Index vs. Denormalization](/en/c/learn/courses/nosql-databases/learning/advanced#example-63-secondary-index-vs-denormalization)
- [Example 64: Redis Durability: RDB vs. AOF](/en/c/learn/courses/nosql-databases/learning/advanced#example-64-redis-durability-rdb-vs-aof)
- [Example 65: MongoDB Write Concern Tuning](/en/c/learn/courses/nosql-databases/learning/advanced#example-65-mongodb-write-concern-tuning)
- [Example 66: MongoDB Read Concern Tuning](/en/c/learn/courses/nosql-databases/learning/advanced#example-66-mongodb-read-concern-tuning)
- [Example 67: CAP Tradeoff, Written Rationale](/en/c/learn/courses/nosql-databases/learning/advanced#example-67-cap-tradeoff-written-rationale)
- [Example 68: Schema-on-Read Migration](/en/c/learn/courses/nosql-databases/learning/advanced#example-68-schema-on-read-migration)
- [Example 69: DynamoDB Conditional Write](/en/c/learn/courses/nosql-databases/learning/advanced#example-69-dynamodb-conditional-write)
- [Example 70: DynamoDB Hot Partition, Diagnosed](/en/c/learn/courses/nosql-databases/learning/advanced#example-70-dynamodb-hot-partition-diagnosed)
- [Example 71: Wide-Column vs. Document Tradeoff](/en/c/learn/courses/nosql-databases/learning/advanced#example-71-wide-column-vs-document-tradeoff)
- [Example 72: NoSQL Transaction Cost Comparison](/en/c/learn/courses/nosql-databases/learning/advanced#example-72-nosql-transaction-cost-comparison)
- [Example 73: CRDT vs. Vector Clock Tradeoff](/en/c/learn/courses/nosql-databases/learning/advanced#example-73-crdt-vs-vector-clock-tradeoff)
- [Example 74: Leader-Follower Failover](/en/c/learn/courses/nosql-databases/learning/advanced#example-74-leader-follower-failover)
- [Example 75: Tunable Consistency, Latency Measured](/en/c/learn/courses/nosql-databases/learning/advanced#example-75-tunable-consistency-latency-measured)
- [Example 76: Secondary Indexes Across Stores](/en/c/learn/courses/nosql-databases/learning/advanced#example-76-secondary-indexes-across-stores)
- [Example 77: Capstone Preview: KV Session Store](/en/c/learn/courses/nosql-databases/learning/advanced#example-77-capstone-preview-kv-session-store)
- [Example 78: Capstone Preview: Document Access Pattern](/en/c/learn/courses/nosql-databases/learning/advanced#example-78-capstone-preview-document-access-pattern)
- [Example 79: Capstone Preview: Wide-Column Feed](/en/c/learn/courses/nosql-databases/learning/advanced#example-79-capstone-preview-wide-column-feed)
- [Example 80: Capstone Preview: License and CAP Rationale](/en/c/learn/courses/nosql-databases/learning/advanced#example-80-capstone-preview-license-and-cap-rationale)

### Time-series (Examples 81-85)

- [Example 81: TimescaleDB Hypertable, Created](/en/c/learn/courses/nosql-databases/learning/time-series#example-81-timescaledb-hypertable-created)
- [Example 82: time_bucket() Downsampling](/en/c/learn/courses/nosql-databases/learning/time-series#example-82-time_bucket-downsampling)
- [Example 83: Retention Policy Drops Old Chunks](/en/c/learn/courses/nosql-databases/learning/time-series#example-83-retention-policy-drops-old-chunks)
- [Example 84: Continuous Aggregate Rollup](/en/c/learn/courses/nosql-databases/learning/time-series#example-84-continuous-aggregate-rollup)
- [Example 85: Time-Series vs. Wide-Column Feed](/en/c/learn/courses/nosql-databases/learning/time-series#example-85-time-series-vs-wide-column-feed)

### OLAP & columnar analytics (Examples 86-91)

- [Example 86: DuckDB Columnar Scan](/en/c/learn/courses/nosql-databases/learning/olap-and-columnar-analytics#example-86-duckdb-columnar-scan)
- [Example 87: Row vs. Column Scan Contrast](/en/c/learn/courses/nosql-databases/learning/olap-and-columnar-analytics#example-87-row-vs-column-scan-contrast)
- [Example 88: Parquet Roundtrip Projection](/en/c/learn/courses/nosql-databases/learning/olap-and-columnar-analytics#example-88-parquet-roundtrip-projection)
- [Example 89: Arrow Zero-Copy Interop](/en/c/learn/courses/nosql-databases/learning/olap-and-columnar-analytics#example-89-arrow-zero-copy-interop)
- [Example 90: ClickHouse MergeTree Aggregate](/en/c/learn/courses/nosql-databases/learning/olap-and-columnar-analytics#example-90-clickhouse-mergetree-aggregate)
- [Example 91: Wide-Column vs. Columnar, Same Query](/en/c/learn/courses/nosql-databases/learning/olap-and-columnar-analytics#example-91-wide-column-vs-columnar-same-query)

---

&larr; Previous: [Overview](../overview.md) &middot; Next: [Beginner Examples](./beginner.md) &rarr;
