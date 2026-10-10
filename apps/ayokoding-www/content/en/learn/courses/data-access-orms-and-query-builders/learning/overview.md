---
title: "Overview"
date: 2026-07-18T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [SQL Essentials](../../sql-essentials/learning/overview.md) -- writing joins,
  `GROUP BY`, and the Python `sqlite3` DB-API this topic assumes you already know; [Advanced SQL & Query Performance](../../advanced-sql-and-query-performance/learning/overview.md) -- reading an
  `EXPLAIN` plan and how indexes change one, content this topic leans on throughout.
- **Tools & environment**: a macOS/Linux terminal; **Python 3.x**, fully type-annotated (DD-39); a
  local PostgreSQL instance (a container is the easiest path); the DB-API driver (psycopg, PEP 249), a
  query builder (PyPika), a Data-Mapper ORM (SQLAlchemy 2.0.x), an Active-Record ORM (peewee), and a
  migration tool (Alembic) -- every version pinned and CVE-clean in this topic's own
  `requirements.txt`; Neovim/VSCode with the Python LSP (DD-17); `pyright --strict` for typechecking.
- **Assumed knowledge**: writing joins and reading an `EXPLAIN` plan (topic 10); indexes and how they
  change a query plan (topic 26); reading a typed Python module and running a `.py` script
  ([Just Enough Python](../../just-enough-python/learning/overview.md)).

## Why this exists -- the big idea

**The problem before the solution**: hand-writing SQL and mapping every result row to an object by hand
is tedious and error-prone. Objects have identity, references, and inheritance; tables have rows, keys,
and joins. That mismatch bred a generation of boilerplate mapping code, and it is exactly the gap the
patterns in this topic -- Active Record, Data Mapper, Unit of Work, Identity Map -- were named to close.

**Keep-this-if-you-forget-everything**: an ORM is an abstraction over SQL, not a replacement for
understanding it. It buys real productivity on CRUD and charges you the moment the query matters -- a
report, a bulk job, a query with a shape the object model cannot express cleanly. Know which tier
(raw SQL, query builder, or ORM) you are standing on for any given piece of code, and what that tier
hides from you in exchange for its leverage.

**Cross-cutting big ideas, taught here and then reused for the rest of this curriculum**:
`abstraction-and-its-cost` -- each tier hides more SQL for more leverage, and the hidden SQL leaks back
out as the N+1 problem and the accidental full-table scan the moment you stop paying attention;
`coupling-vs-cohesion` -- a Data-Mapper/Session layer keeps persistence concerns cohesive and decoupled
from domain logic, instead of scattering hand-written SQL through the rest of the codebase.

## Confirm your toolchain

Every example in this topic is a self-contained, fully type-annotated Python file colocated under
`learning/code/`, run against a real local PostgreSQL instance -- every printed value and query count
on this topic's pages is a genuine, captured transcript, never a guessed one:

```text
$ python3 --version
Python 3.13.12
$ pip show sqlalchemy peewee pypika alembic psycopg pyright | grep -E "^(Name|Version)"
Name: SQLAlchemy
Version: 2.0.51
Name: peewee
Version: 4.2.6
Name: PyPika
Version: 0.51.1
Name: alembic
Version: 1.18.5
Name: psycopg
Version: 3.3.4
Name: pyright
Version: 1.1.411
```

Set up once, from this topic's own directory:

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
docker run --name orm-by-example -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=orm_by_example -p 5432:5432 -d postgres:18.4-alpine
```

Every example's own defaults point at `postgresql://postgres:postgres@localhost:5432/orm_by_example`,
so once the container above is running, `python3 learning/code/ex-01-.../example.py` (or any other
example, run directly) works with no further configuration. Every example resets and seeds its own
tables on every run, so examples are safe to run in any order, repeatedly. `pyright` (strict mode, via
this topic's own `pyrightconfig.json`) and `ruff format --check` both run clean across every example.

## How this topic's examples are organized

- **[Beginner](./beginner.md)** (Examples 1-28) -- the raw PEP 249 DB-API (connect, cursor,
  parameterized queries, typed row mapping, `executemany`, transactions), PyPika as a standalone query
  builder (`SELECT`, composed `WHERE`, `JOIN`, injection safety), SQLAlchemy Core's own builder (`Table`
  - `MetaData`, `select()`), declarative ORM mapping (`DeclarativeBase` + `Mapped[]`), the ORM's CRUD
    arc (insert, query, update, delete), the Active Record vs. Data Mapper contrast (peewee vs.
    SQLAlchemy), one-to-many and many-to-many relationships, the identity map, and the session lifecycle.
- **[Intermediate](./intermediate.md)** (Examples 29-56) -- the four session object states and
  expire/refresh, the unit of work's flush ordering, dirty tracking, and autoflush, lazy loading and the
  `DetachedInstanceError`, the N+1 problem reproduced and measured, the three eager-loading strategies
  (`selectinload`, `joinedload`, `subqueryload`) contrasted, `raiseload()` as a guard, ORM transactions
  and nested savepoints, connection pooling (sizing, exhaustion, `pool_pre_ping`), the full Alembic
  workflow (init, hand-written migrations, upgrade/downgrade, autogenerate and its blind spots,
  reversible vs. explicitly-irreversible data migrations), and ORM cascade vs. database `ON DELETE
CASCADE`.
- **[Advanced](./advanced.md)** (Examples 57-78) -- set-oriented bulk insert/update measured against a
  per-object ORM loop, the async ORM (`create_async_engine` + `AsyncSession`, why lazy loading is
  forbidden there, `asyncio.gather` over independent sessions), the ORM-vs-raw-SQL and
  query-builder-vs-ORM trade-offs made concrete (CRUD, reporting, a dynamic filter, a feature/cost
  table), a three-scenario tier-choosing rubric applied to a CRUD, an analytics, and a hot-path
  workload, a hybrid app that uses the ORM for CRUD and a raw-SQL escape hatch on the same session, the
  identity map dedup proven across two different query shapes, per-relationship default lazy-strategy
  configuration, a self-referential adjacency-list tree, an association object carrying extra columns
  on an M:N link, a zero-downtime expand-contract migration, connection-pool tuning measured against a
  concurrency target, and a capstone-preview example threading all three tiers plus an N+1 fix plus a
  migration into one script.

## The 27 concepts this topic covers

- **co-01 · data-access-spectrum** -- the raw-SQL to query-builder to ORM spectrum, and what each tier
  buys and hides.
- **co-02 · raw-sql-dbapi** -- the PEP 249 DB-API: connection, cursor, execute, fetch, and manual
  row-to-object mapping.
- **co-03 · query-builder-core** -- building queries as composable data structures rather than
  concatenated strings.
- **co-04 · query-builder-library-contrast** -- how a standalone builder (PyPika) and SQLAlchemy Core
  differ in style and scope.
- **co-05 · parameterized-queries-and-emitted-sql** -- placeholders keep values out of the SQL text;
  inspecting the emitted SQL and its bound parameters.
- **co-06 · declarative-orm-mapping** -- SQLAlchemy 2.0's `DeclarativeBase` + `Mapped[...]` typed column
  mapping.
- **co-07 · active-record-vs-data-mapper** -- the object persists itself (peewee) vs. a session/mapper
  persists it (SQLAlchemy).
- **co-08 · relationship-mapping** -- one-to-many/foreign-key relationships and bidirectional
  `back_populates`.
- **co-09 · many-to-many-association** -- association tables and association objects for M:N links.
- **co-10 · identity-map** -- one Python object per primary key within a session, deduplicated across
  queries.
- **co-11 · session-object-states** -- transient to pending to persistent to detached, plus
  expire/refresh.
- **co-12 · unit-of-work** -- the session batches, orders, and flushes changes as one coordinated write.
- **co-13 · lazy-loading** -- relationships fetched on first access, and the `DetachedInstanceError`
  when the session is gone.
- **co-14 · eager-loading-strategies** -- `selectinload`, `joinedload`, and `subqueryload`, and how each
  shapes the emitted SQL.
- **co-15 · n-plus-1-problem** -- one query fanning out into many, diagnosed by query count and fixed by
  eager loading.
- **co-16 · raiseload-guard** -- `raiseload()` turns an accidental lazy load into a loud error instead
  of a silent query.
- **co-17 · orm-transactions** -- session commit/rollback, `begin()` scope, and nested savepoints.
- **co-18 · connection-pooling** -- `pool_size`/`max_overflow`, pool exhaustion, and `pool_pre_ping`
  recovery.
- **co-19 · migrations-alembic-workflow** -- versioned schema evolution with Alembic (`init`, revision,
  `upgrade`).
- **co-20 · autogenerate-migrations** -- deriving a migration from a model-to-schema diff, and why you
  still review it.
- **co-21 · migration-reversibility** -- writing real `downgrade` paths and the expand-contract
  zero-downtime pattern.
- **co-22 · cascade-delete-orm** -- ORM `cascade="all, delete-orphan"` vs. database `ON DELETE CASCADE`.
- **co-23 · bulk-operations** -- set-oriented bulk insert/update instead of per-object round trips.
- **co-24 · async-orm-session** -- `create_async_engine` + `AsyncSession`, and why lazy loading is
  forbidden there.
- **co-25 · orm-vs-raw-sql-tradeoff** -- where the ORM's leverage helps (CRUD) and where raw SQL wins
  (reporting, bulk).
- **co-26 · query-builder-vs-orm-tradeoff** -- composition and injection safety without the
  identity-map/change-tracking machinery.
- **co-27 · choosing-tier-per-workload** -- matching CRUD, analytics, and hot-path workloads to the
  right tier.

## Examples by Level

### Beginner (Examples 1–28)

- [Example 1: Spectrum: Same Query, Three Ways](/en/c/learn/courses/data-access-orms-and-query-builders/learning/beginner#example-1-spectrum-same-query-three-ways)
- [Example 2: DB-API Connect And Cursor](/en/c/learn/courses/data-access-orms-and-query-builders/learning/beginner#example-2-db-api-connect-and-cursor)
- [Example 3: DB-API Parameterized Query](/en/c/learn/courses/data-access-orms-and-query-builders/learning/beginner#example-3-db-api-parameterized-query)
- [Example 4: DB-API Row To Typed Dataclass](/en/c/learn/courses/data-access-orms-and-query-builders/learning/beginner#example-4-db-api-row-to-typed-dataclass)
- [Example 5: DB-API Executemany Batch Insert](/en/c/learn/courses/data-access-orms-and-query-builders/learning/beginner#example-5-db-api-executemany-batch-insert)
- [Example 6: DB-API Transaction Commit And Rollback](/en/c/learn/courses/data-access-orms-and-query-builders/learning/beginner#example-6-db-api-transaction-commit-and-rollback)
- [Example 7: Query Builder Select](/en/c/learn/courses/data-access-orms-and-query-builders/learning/beginner#example-7-query-builder-select)
- [Example 8: Query Builder Where Compose](/en/c/learn/courses/data-access-orms-and-query-builders/learning/beginner#example-8-query-builder-where-compose)
- [Example 9: Query Builder Join](/en/c/learn/courses/data-access-orms-and-query-builders/learning/beginner#example-9-query-builder-join)
- [Example 10: Query Builder Execute](/en/c/learn/courses/data-access-orms-and-query-builders/learning/beginner#example-10-query-builder-execute)
- [Example 11: Query Builder vs String Safety](/en/c/learn/courses/data-access-orms-and-query-builders/learning/beginner#example-11-query-builder-vs-string-safety)
- [Example 12: SQLAlchemy Core Table](/en/c/learn/courses/data-access-orms-and-query-builders/learning/beginner#example-12-sqlalchemy-core-table)
- [Example 13: SQLAlchemy Core Select](/en/c/learn/courses/data-access-orms-and-query-builders/learning/beginner#example-13-sqlalchemy-core-select)
- [Example 14: Declarative Model Basic](/en/c/learn/courses/data-access-orms-and-query-builders/learning/beginner#example-14-declarative-model-basic)
- [Example 15: Declarative Typed Columns](/en/c/learn/courses/data-access-orms-and-query-builders/learning/beginner#example-15-declarative-typed-columns)
- [Example 16: ORM Insert Object](/en/c/learn/courses/data-access-orms-and-query-builders/learning/beginner#example-16-orm-insert-object)
- [Example 17: ORM Query Select](/en/c/learn/courses/data-access-orms-and-query-builders/learning/beginner#example-17-orm-query-select)
- [Example 18: ORM Update Object](/en/c/learn/courses/data-access-orms-and-query-builders/learning/beginner#example-18-orm-update-object)
- [Example 19: ORM Delete Object](/en/c/learn/courses/data-access-orms-and-query-builders/learning/beginner#example-19-orm-delete-object)
- [Example 20: Active Record Peewee Model](/en/c/learn/courses/data-access-orms-and-query-builders/learning/beginner#example-20-active-record-peewee-model)
- [Example 21: Active Record vs Data Mapper](/en/c/learn/courses/data-access-orms-and-query-builders/learning/beginner#example-21-active-record-vs-data-mapper)
- [Example 22: Relationship One To Many](/en/c/learn/courses/data-access-orms-and-query-builders/learning/beginner#example-22-relationship-one-to-many)
- [Example 23: Relationship Back Populates](/en/c/learn/courses/data-access-orms-and-query-builders/learning/beginner#example-23-relationship-back-populates)
- [Example 24: Foreign Key Mapping](/en/c/learn/courses/data-access-orms-and-query-builders/learning/beginner#example-24-foreign-key-mapping)
- [Example 25: Many To Many Association Table](/en/c/learn/courses/data-access-orms-and-query-builders/learning/beginner#example-25-many-to-many-association-table)
- [Example 26: Many To Many Navigate](/en/c/learn/courses/data-access-orms-and-query-builders/learning/beginner#example-26-many-to-many-navigate)
- [Example 27: Identity Map Same Object](/en/c/learn/courses/data-access-orms-and-query-builders/learning/beginner#example-27-identity-map-same-object)
- [Example 28: Session Lifecycle Begin](/en/c/learn/courses/data-access-orms-and-query-builders/learning/beginner#example-28-session-lifecycle-begin)

### Intermediate (Examples 29–56)

- [Example 29: Session States Transient Pending](/en/c/learn/courses/data-access-orms-and-query-builders/learning/intermediate#example-29-session-states-transient-pending)
- [Example 30: Session Expire Refresh](/en/c/learn/courses/data-access-orms-and-query-builders/learning/intermediate#example-30-session-expire-refresh)
- [Example 31: Unit Of Work Flush Order](/en/c/learn/courses/data-access-orms-and-query-builders/learning/intermediate#example-31-unit-of-work-flush-order)
- [Example 32: Unit Of Work Dirty Tracking](/en/c/learn/courses/data-access-orms-and-query-builders/learning/intermediate#example-32-unit-of-work-dirty-tracking)
- [Example 33: Unit Of Work Autoflush](/en/c/learn/courses/data-access-orms-and-query-builders/learning/intermediate#example-33-unit-of-work-autoflush)
- [Example 34: Lazy Loading Default](/en/c/learn/courses/data-access-orms-and-query-builders/learning/intermediate#example-34-lazy-loading-default)
- [Example 35: Lazy Loading Detached Error](/en/c/learn/courses/data-access-orms-and-query-builders/learning/intermediate#example-35-lazy-loading-detached-error)
- [Example 36: N Plus 1 Reproduce](/en/c/learn/courses/data-access-orms-and-query-builders/learning/intermediate#example-36-n-plus-1-reproduce)
- [Example 37: Eager Selectinload](/en/c/learn/courses/data-access-orms-and-query-builders/learning/intermediate#example-37-eager-selectinload)
- [Example 38: Eager Joinedload](/en/c/learn/courses/data-access-orms-and-query-builders/learning/intermediate#example-38-eager-joinedload)
- [Example 39: Eager Subqueryload](/en/c/learn/courses/data-access-orms-and-query-builders/learning/intermediate#example-39-eager-subqueryload)
- [Example 40: Eager Strategy Contrast](/en/c/learn/courses/data-access-orms-and-query-builders/learning/intermediate#example-40-eager-strategy-contrast)
- [Example 41: Raiseload Guard](/en/c/learn/courses/data-access-orms-and-query-builders/learning/intermediate#example-41-raiseload-guard)
- [Example 42: N Plus 1 Count Assert](/en/c/learn/courses/data-access-orms-and-query-builders/learning/intermediate#example-42-n-plus-1-count-assert)
- [Example 43: ORM Transaction Commit Rollback](/en/c/learn/courses/data-access-orms-and-query-builders/learning/intermediate#example-43-orm-transaction-commit-rollback)
- [Example 44: ORM Nested Savepoint](/en/c/learn/courses/data-access-orms-and-query-builders/learning/intermediate#example-44-orm-nested-savepoint)
- [Example 45: Connection Pool Basics](/en/c/learn/courses/data-access-orms-and-query-builders/learning/intermediate#example-45-connection-pool-basics)
- [Example 46: Pool Exhaustion](/en/c/learn/courses/data-access-orms-and-query-builders/learning/intermediate#example-46-pool-exhaustion)
- [Example 47: Pool Pre Ping](/en/c/learn/courses/data-access-orms-and-query-builders/learning/intermediate#example-47-pool-pre-ping)
- [Example 48: Alembic Init](/en/c/learn/courses/data-access-orms-and-query-builders/learning/intermediate#example-48-alembic-init)
- [Example 49: Alembic First Migration](/en/c/learn/courses/data-access-orms-and-query-builders/learning/intermediate#example-49-alembic-first-migration)
- [Example 50: Alembic Upgrade Downgrade](/en/c/learn/courses/data-access-orms-and-query-builders/learning/intermediate#example-50-alembic-upgrade-downgrade)
- [Example 51: Alembic Autogenerate](/en/c/learn/courses/data-access-orms-and-query-builders/learning/intermediate#example-51-alembic-autogenerate)
- [Example 52: Alembic Autogen Review](/en/c/learn/courses/data-access-orms-and-query-builders/learning/intermediate#example-52-alembic-autogen-review)
- [Example 53: Migration Reversible Data](/en/c/learn/courses/data-access-orms-and-query-builders/learning/intermediate#example-53-migration-reversible-data)
- [Example 54: Migration Irreversible Guard](/en/c/learn/courses/data-access-orms-and-query-builders/learning/intermediate#example-54-migration-irreversible-guard)
- [Example 55: Cascade Delete ORM](/en/c/learn/courses/data-access-orms-and-query-builders/learning/intermediate#example-55-cascade-delete-orm)
- [Example 56: Cascade vs DB Foreign Key](/en/c/learn/courses/data-access-orms-and-query-builders/learning/intermediate#example-56-cascade-vs-db-foreign-key)

### Advanced (Examples 57–78)

- [Example 57: Bulk Insert ORM](/en/c/learn/courses/data-access-orms-and-query-builders/learning/advanced#example-57-bulk-insert-orm)
- [Example 58: Bulk Update Core](/en/c/learn/courses/data-access-orms-and-query-builders/learning/advanced#example-58-bulk-update-core)
- [Example 59: Bulk vs ORM Performance](/en/c/learn/courses/data-access-orms-and-query-builders/learning/advanced#example-59-bulk-vs-orm-performance)
- [Example 60: Async Engine Session](/en/c/learn/courses/data-access-orms-and-query-builders/learning/advanced#example-60-async-engine-session)
- [Example 61: Async Eager Loading](/en/c/learn/courses/data-access-orms-and-query-builders/learning/advanced#example-61-async-eager-loading)
- [Example 62: Async Lazy Forbidden](/en/c/learn/courses/data-access-orms-and-query-builders/learning/advanced#example-62-async-lazy-forbidden)
- [Example 63: Async Concurrent Sessions](/en/c/learn/courses/data-access-orms-and-query-builders/learning/advanced#example-63-async-concurrent-sessions)
- [Example 64: ORM vs Raw CRUD](/en/c/learn/courses/data-access-orms-and-query-builders/learning/advanced#example-64-orm-vs-raw-crud)
- [Example 65: ORM vs Raw Reporting](/en/c/learn/courses/data-access-orms-and-query-builders/learning/advanced#example-65-orm-vs-raw-reporting)
- [Example 66: Query Builder vs ORM Dynamic Filter](/en/c/learn/courses/data-access-orms-and-query-builders/learning/advanced#example-66-query-builder-vs-orm-dynamic-filter)
- [Example 67: Query Builder vs ORM Tradeoff](/en/c/learn/courses/data-access-orms-and-query-builders/learning/advanced#example-67-query-builder-vs-orm-tradeoff)
- [Example 68: Choosing Tier CRUD](/en/c/learn/courses/data-access-orms-and-query-builders/learning/advanced#example-68-choosing-tier-crud)
- [Example 69: Choosing Tier Analytics](/en/c/learn/courses/data-access-orms-and-query-builders/learning/advanced#example-69-choosing-tier-analytics)
- [Example 70: Choosing Tier Hot Path](/en/c/learn/courses/data-access-orms-and-query-builders/learning/advanced#example-70-choosing-tier-hot-path)
- [Example 71: Hybrid ORM Plus Raw](/en/c/learn/courses/data-access-orms-and-query-builders/learning/advanced#example-71-hybrid-orm-plus-raw)
- [Example 72: Identity Map Across Queries](/en/c/learn/courses/data-access-orms-and-query-builders/learning/advanced#example-72-identity-map-across-queries)
- [Example 73: Relationship Lazy Strategy Config](/en/c/learn/courses/data-access-orms-and-query-builders/learning/advanced#example-73-relationship-lazy-strategy-config)
- [Example 74: Self Referential Relationship](/en/c/learn/courses/data-access-orms-and-query-builders/learning/advanced#example-74-self-referential-relationship)
- [Example 75: Association Object M2M](/en/c/learn/courses/data-access-orms-and-query-builders/learning/advanced#example-75-association-object-m2m)
- [Example 76: Migration Zero Downtime](/en/c/learn/courses/data-access-orms-and-query-builders/learning/advanced#example-76-migration-zero-downtime)
- [Example 77: Connection Pool Tuning](/en/c/learn/courses/data-access-orms-and-query-builders/learning/advanced#example-77-connection-pool-tuning)
- [Example 78: Capstone Preview Three Tier](/en/c/learn/courses/data-access-orms-and-query-builders/learning/advanced#example-78-capstone-preview-three-tier)

---

← Previous: [Advanced SQL & Query Performance Drilling](../../advanced-sql-and-query-performance/drilling/overview.md)
&middot; Next: [Beginner Examples](./beginner.md) →
