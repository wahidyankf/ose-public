---
title: "Overview"
date: 2026-07-17T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [SQL Essentials](../../sql-essentials/learning/overview.md) -- `SELECT`,
  `JOIN`, `GROUP BY`/`HAVING`, `INSERT`/`UPDATE`/`DELETE`, foreign keys, basic transactions
  (`COMMIT`/`ROLLBACK`), and the first Python `sqlite3` examples this topic assumes as a floor and
  then extends into a real client-server engine; [Just Enough Python](../../just-enough-python/learning/overview.md)
  -- the type-annotated Python fluency this topic's data-access-layer examples assume; [Backend Essentials](../../backend-essentials/learning/overview.md) -- the N+1 query scenario that
  topic introduces at the application layer, which this topic's co-26 (N+1 diagnosis and fix,
  Examples 54-56) diagnoses and resolves from the database side.
- **Tools & environment**: a macOS/Linux terminal; **PostgreSQL 18.x** (the `psql` client and a
  running server -- Docker's `postgres:18` image is the simplest way to get one); **Python 3.x**
  with `psycopg` (v3, `pip install "psycopg[binary]"`) installed in a `venv`; Example 76
  additionally needs `psycopg-pool` (`pip install psycopg-pool`).
- **Assumed knowledge**: comfort writing and running `SELECT`/`JOIN`/`GROUP BY` queries and basic
  Python scripts (topic 10). No prior exposure to window functions, query planning, or transaction
  isolation is assumed -- this topic is where those begin.

## Why this exists -- the big idea

**The problem before the solution**: correct SQL can still be catastrophically slow -- the query
that flew on 100 rows melts at 10 million, and you cannot see _why_ without the planner.
**Keep-this-if-you-forget-everything**: the database does what you ask, well or badly; `EXPLAIN` is
how you see the _how_, and an index is a space-and-write-cost bargain you make to buy read speed.

**Cross-cutting big ideas, taught here and then reused for the rest of this curriculum**:
`consistency-latency-throughput` -- isolation levels and locking trade correctness guarantees
against concurrency and speed; `abstraction-and-its-cost` -- indexes and denormalization buy reads
by charging writes and storage.

## Confirm your toolchain

Every example in this topic runs against a real, running PostgreSQL 18 server:

```text
$ psql --version
psql (PostgreSQL) 18.4
$ psql -U asqp -d asqp -c "SELECT version();"
PostgreSQL 18.4 on aarch64-unknown-linux-musl, compiled by gcc ...
```

Every SQL example is a complete, self-contained, runnable `.sql` file colocated under
`learning/code/`, and every Python example is a complete, self-contained, runnable `.py` file --
both actually executed against a real PostgreSQL 18.4 instance (via Docker, `postgres:18.4-alpine`,
with `shared_preload_libraries = 'pg_stat_statements'` for Example 82) to capture the documented
output. Every query result, `EXPLAIN` plan, timing number, and server log excerpt on this topic's
pages is a genuine, captured transcript, never a fabricated one -- including the exact PostgreSQL 18
plan-output details that changed from prior versions (`Buffers:` shown by default under `EXPLAIN
ANALYZE`, fractional row counts on loop-averaged estimates, `Index Searches:` and `Heap Fetches:`
lines, and the new B-tree skip-scan capability).

## How this topic's examples are organized

- **[Beginner](./beginner.md)** (Examples 1-28) -- uncorrelated and correlated subqueries, derived
  tables, common table expressions (`WITH`) including a first recursive counter and tree walk, the
  four core window-function building blocks (running total, partitioned average, ranking functions,
  `LAG`/`LEAD`), `NTILE` quartiles, `UNION`/`INTERSECT`/`EXCEPT` set operations, `GROUP BY ROLLUP`
  and grouping sets, `FILTER`-based conditional aggregation, transactions (`BEGIN`/`COMMIT`/
  `ROLLBACK`) and a genuine atomicity-failure demonstration, creating a B-tree index, `EXPLAIN` and
  `EXPLAIN ANALYZE` basics, `ANALYZE` refreshing planner statistics, `FOR UPDATE` row locking and
  the default Read Committed isolation level (both via real two-session Python scripts), and `psql`'s
  `\timing`.
- **[Intermediate](./intermediate.md)** (Examples 29-64) -- rewriting a correlated subquery as a
  join, cycle-safe recursive CTEs over graphs and a bill-of-materials explosion, moving averages,
  explicit `RANGE` vs. `ROWS` window frames, the `FIRST_VALUE`/`LAST_VALUE` default-frame gotcha,
  `PERCENT_RANK`/`CUME_DIST`, top-N-per-group, `LATERAL` joins, `CUBE` crosstabs, every specialized
  index type PostgreSQL ships (composite, covering, partial, expression, hash, GIN, BRIN) with the
  write-cost and bloat tradeoffs each one carries, all three `EXPLAIN` join-node types (nested loop
  with `Memoize`, hash join, merge join) forced deterministically for teaching, `Buffers` in a real
  plan, a stale-statistics misestimate, the N+1 query problem diagnosed and fixed two ways in Python,
  every classic read anomaly PostgreSQL's isolation levels can and cannot produce (non-repeatable
  read, PostgreSQL's stronger-than-standard phantom-read prevention, write skew, and a genuine
  `SerializationFailure` retry), a real reproduced deadlock and its consistent-ordering fix, advisory
  locks, and a plain materialized view refresh.
- **[Advanced](./advanced.md)** (Examples 65-85) -- a recursive-CTE shortest path over a weighted
  graph, gaps-and-islands window sessionization, a measured window-function-vs-self-join
  performance gap (687x on this data), a multi-`LATERAL` dashboard report, deliberate covering-index
  design, `CREATE STATISTICS` for correlated columns, declarative range partitioning with verified
  pruning and a measured bulk-delete tradeoff against a single big index, denormalization measured
  honestly in both directions (reads faster, writes costlier), a non-blocking `REFRESH ...
CONCURRENTLY` proven via real thread timing, a connection-pooling benchmark, the full
  isolation-level anomaly matrix side by side, `SERIALIZABLE`'s measured bookkeeping overhead and
  real retry rate under contention, buffer-driven I/O tuning, a genuine planner-cost-constant plan
  flip, slow-query-log triage, `pg_stat_statements` top-N ranking (with its non-default setup
  prerequisites stated explicitly), OLTP-normalized vs. OLAP star-schema query shape, `COPY` vs.
  row-`INSERT` bulk-load throughput, and a closing example that threads a window report, index
  tuning, an N+1 fix, and a concurrency anomaly's reproduction-and-resolution into one workflow.

## The 28 concepts this topic covers

- **co-01 · Subqueries and derived tables** -- correlated vs. uncorrelated subqueries and subqueries
  used as derived tables in `FROM`.
- **co-02 · Common table expressions** -- `WITH` factoring a query into named, readable steps.
- **co-03 · Recursive CTEs** -- `WITH RECURSIVE` walking hierarchies and graphs with a termination
  guard.
- **co-04 · Window functions** -- `OVER()` computing across a row set without collapsing rows into
  groups.
- **co-05 · Window frames and partitions** -- `PARTITION BY` / `ORDER BY` / the `ROWS` vs. `RANGE`
  frame clause.
- **co-06 · Ranking and analytic functions** -- `ROW_NUMBER`/`RANK`/`DENSE_RANK`, `LAG`/`LEAD`,
  `NTILE`, `PERCENT_RANK`.
- **co-07 · Set operations** -- `UNION`/`INTERSECT`/`EXCEPT` and their `ALL` variants.
- **co-08 · Grouping sets, ROLLUP, CUBE** -- multi-level aggregation (subtotals, grand totals,
  crosstabs) in one pass.
- **co-09 · LATERAL joins** -- `LATERAL` correlating a subquery to each row of the left side.
- **co-10 · Conditional aggregation** -- `FILTER (WHERE ...)` and `CASE`-based aggregates for
  pivots.
- **co-11 · ACID properties** -- atomicity, consistency, isolation, and durability defined
  concretely.
- **co-12 · MVCC** -- multi-version concurrency control: readers see a snapshot and don't block
  writers.
- **co-13 · Isolation levels** -- Read Committed, Repeatable Read, and Serializable and the
  anomalies each forbids.
- **co-14 · Read phenomena** -- dirty read, non-repeatable read, phantom, and write skew as named
  anomalies.
- **co-15 · Serializable snapshot isolation** -- PostgreSQL SSI detecting dangerous dependency
  structures and aborting.
- **co-16 · Explicit locking** -- row locks (`FOR UPDATE`/`FOR SHARE`), advisory locks, and lock
  modes.
- **co-17 · Database deadlocks** -- how the engine detects a lock cycle and how consistent lock
  ordering avoids it.
- **co-18 · B-tree index mechanics** -- the sorted-tree index and why equality, range, and ordering
  all benefit.
- **co-19 · Composite and covering indexes** -- column order, index-only scans, and `INCLUDE`
  columns.
- **co-20 · Specialized indexes** -- hash, GIN, GiST, and BRIN indexes and the workload each fits.
- **co-21 · Partial and expression indexes** -- indexing a predicate subset or a computed
  expression.
- **co-22 · Index cost tradeoff** -- write amplification, bloat, and when an index hurts more than
  it helps.
- **co-23 · EXPLAIN and EXPLAIN ANALYZE** -- estimated vs. actual plans; PostgreSQL 18 shows buffer
  stats by default.
- **co-24 · Reading a query plan** -- scan and join node types (nested loop / hash / merge), cost,
  rows, width.
- **co-25 · Table statistics and ANALYZE** -- the planner depends on `ANALYZE` stats; stale stats
  cause bad plans.
- **co-26 · N+1 diagnosis and fix** -- the app-side query explosion and its join / batch fixes.
- **co-27 · Denormalization and materialized views** -- trading write cost and storage for read
  speed.
- **co-28 · Partitioning, pooling, and OLTP vs. OLAP** -- declarative partitioning, connection
  pooling, and workload-shaped schema.

## Examples by Level

### Beginner (Examples 1–28)

- [Example 1: Uncorrelated Subquery](/en/c/learn/courses/advanced-sql-and-query-performance/learning/beginner#example-1-uncorrelated-subquery)
- [Example 2: Correlated Subquery](/en/c/learn/courses/advanced-sql-and-query-performance/learning/beginner#example-2-correlated-subquery)
- [Example 3: Derived Table in FROM](/en/c/learn/courses/advanced-sql-and-query-performance/learning/beginner#example-3-derived-table-in-from)
- [Example 4: Simple CTE](/en/c/learn/courses/advanced-sql-and-query-performance/learning/beginner#example-4-simple-cte)
- [Example 5: Multi-Step CTE](/en/c/learn/courses/advanced-sql-and-query-performance/learning/beginner#example-5-multi-step-cte)
- [Example 6: Recursive CTE Counter](/en/c/learn/courses/advanced-sql-and-query-performance/learning/beginner#example-6-recursive-cte-counter)
- [Example 7: Recursive CTE Tree](/en/c/learn/courses/advanced-sql-and-query-performance/learning/beginner#example-7-recursive-cte-tree)
- [Example 8: Window Running Total](/en/c/learn/courses/advanced-sql-and-query-performance/learning/beginner#example-8-window-running-total)
- [Example 9: Window Partition Avg](/en/c/learn/courses/advanced-sql-and-query-performance/learning/beginner#example-9-window-partition-avg)
- [Example 10: Row Number vs Rank vs Dense Rank](/en/c/learn/courses/advanced-sql-and-query-performance/learning/beginner#example-10-row-number-vs-rank-vs-dense-rank)
- [Example 11: Lag/Lead Delta](/en/c/learn/courses/advanced-sql-and-query-performance/learning/beginner#example-11-laglead-delta)
- [Example 12: NTILE Quartiles](/en/c/learn/courses/advanced-sql-and-query-performance/learning/beginner#example-12-ntile-quartiles)
- [Example 13: UNION vs UNION ALL](/en/c/learn/courses/advanced-sql-and-query-performance/learning/beginner#example-13-union-vs-union-all)
- [Example 14: INTERSECT and EXCEPT](/en/c/learn/courses/advanced-sql-and-query-performance/learning/beginner#example-14-intersect-and-except)
- [Example 15: GROUP BY ROLLUP](/en/c/learn/courses/advanced-sql-and-query-performance/learning/beginner#example-15-group-by-rollup)
- [Example 16: Grouping Sets](/en/c/learn/courses/advanced-sql-and-query-performance/learning/beginner#example-16-grouping-sets)
- [Example 17: FILTER Aggregate](/en/c/learn/courses/advanced-sql-and-query-performance/learning/beginner#example-17-filter-aggregate)
- [Example 18: Conditional SUM (CASE Pivot)](/en/c/learn/courses/advanced-sql-and-query-performance/learning/beginner#example-18-conditional-sum-case-pivot)
- [Example 19: BEGIN, COMMIT, and ROLLBACK](/en/c/learn/courses/advanced-sql-and-query-performance/learning/beginner#example-19-begin-commit-and-rollback)
- [Example 20: Atomicity Failure](/en/c/learn/courses/advanced-sql-and-query-performance/learning/beginner#example-20-atomicity-failure)
- [Example 21: Create B-tree Index](/en/c/learn/courses/advanced-sql-and-query-performance/learning/beginner#example-21-create-b-tree-index)
- [Example 22: EXPLAIN Basic](/en/c/learn/courses/advanced-sql-and-query-performance/learning/beginner#example-22-explain-basic)
- [Example 23: EXPLAIN ANALYZE Basic](/en/c/learn/courses/advanced-sql-and-query-performance/learning/beginner#example-23-explain-analyze-basic)
- [Example 24: Seq Scan vs Index Scan](/en/c/learn/courses/advanced-sql-and-query-performance/learning/beginner#example-24-seq-scan-vs-index-scan)
- [Example 25: ANALYZE Refresh Stats](/en/c/learn/courses/advanced-sql-and-query-performance/learning/beginner#example-25-analyze-refresh-stats)
- [Example 26: FOR UPDATE Row Lock](/en/c/learn/courses/advanced-sql-and-query-performance/learning/beginner#example-26-for-update-row-lock)
- [Example 27: Read Committed Default](/en/c/learn/courses/advanced-sql-and-query-performance/learning/beginner#example-27-read-committed-default)
- [Example 28: psql \timing](/en/c/learn/courses/advanced-sql-and-query-performance/learning/beginner#example-28-psql-timing)

### Intermediate (Examples 29–64)

- [Example 29: Correlated Subquery to Join](/en/c/learn/courses/advanced-sql-and-query-performance/learning/intermediate#example-29-correlated-subquery-to-join)
- [Example 30: Recursive CTE Graph Cycle](/en/c/learn/courses/advanced-sql-and-query-performance/learning/intermediate#example-30-recursive-cte-graph-cycle)
- [Example 31: Recursive CTE Bill of Materials](/en/c/learn/courses/advanced-sql-and-query-performance/learning/intermediate#example-31-recursive-cte-bill-of-materials)
- [Example 32: Window Moving Average](/en/c/learn/courses/advanced-sql-and-query-performance/learning/intermediate#example-32-window-moving-average)
- [Example 33: RANGE vs ROWS Frame](/en/c/learn/courses/advanced-sql-and-query-performance/learning/intermediate#example-33-range-vs-rows-frame)
- [Example 34: FIRST_VALUE and LAST_VALUE](/en/c/learn/courses/advanced-sql-and-query-performance/learning/intermediate#example-34-first_value-and-last_value)
- [Example 35: PERCENT_RANK and CUME_DIST](/en/c/learn/courses/advanced-sql-and-query-performance/learning/intermediate#example-35-percent_rank-and-cume_dist)
- [Example 36: Top-N per Group](/en/c/learn/courses/advanced-sql-and-query-performance/learning/intermediate#example-36-top-n-per-group)
- [Example 37: LATERAL Join Top-N](/en/c/learn/courses/advanced-sql-and-query-performance/learning/intermediate#example-37-lateral-join-top-n)
- [Example 38: LATERAL vs Correlated Subquery](/en/c/learn/courses/advanced-sql-and-query-performance/learning/intermediate#example-38-lateral-vs-correlated-subquery)
- [Example 39: CUBE Crosstab](/en/c/learn/courses/advanced-sql-and-query-performance/learning/intermediate#example-39-cube-crosstab)
- [Example 40: Composite Index Order](/en/c/learn/courses/advanced-sql-and-query-performance/learning/intermediate#example-40-composite-index-order)
- [Example 41: Covering Index and Index Only Scan](/en/c/learn/courses/advanced-sql-and-query-performance/learning/intermediate#example-41-covering-index-and-index-only-scan)
- [Example 42: Partial Index](/en/c/learn/courses/advanced-sql-and-query-performance/learning/intermediate#example-42-partial-index)
- [Example 43: Expression Index](/en/c/learn/courses/advanced-sql-and-query-performance/learning/intermediate#example-43-expression-index)
- [Example 44: Hash Index](/en/c/learn/courses/advanced-sql-and-query-performance/learning/intermediate#example-44-hash-index)
- [Example 45: GIN Index on jsonb](/en/c/learn/courses/advanced-sql-and-query-performance/learning/intermediate#example-45-gin-index-on-jsonb)
- [Example 46: BRIN Index on Timeseries](/en/c/learn/courses/advanced-sql-and-query-performance/learning/intermediate#example-46-brin-index-on-timeseries)
- [Example 47: Index Hurts Writes](/en/c/learn/courses/advanced-sql-and-query-performance/learning/intermediate#example-47-index-hurts-writes)
- [Example 48: Index Bloat, Observed](/en/c/learn/courses/advanced-sql-and-query-performance/learning/intermediate#example-48-index-bloat-observed)
- [Example 49: EXPLAIN Nested Loop](/en/c/learn/courses/advanced-sql-and-query-performance/learning/intermediate#example-49-explain-nested-loop)
- [Example 50: EXPLAIN Hash Join](/en/c/learn/courses/advanced-sql-and-query-performance/learning/intermediate#example-50-explain-hash-join)
- [Example 51: EXPLAIN Merge Join](/en/c/learn/courses/advanced-sql-and-query-performance/learning/intermediate#example-51-explain-merge-join)
- [Example 52: Buffers in the Plan](/en/c/learn/courses/advanced-sql-and-query-performance/learning/intermediate#example-52-buffers-in-the-plan)
- [Example 53: Stale Stats, Bad Plan](/en/c/learn/courses/advanced-sql-and-query-performance/learning/intermediate#example-53-stale-stats-bad-plan)
- [Example 54: N+1 Reproduce](/en/c/learn/courses/advanced-sql-and-query-performance/learning/intermediate#example-54-n1-reproduce)
- [Example 55: N+1 Fix, JOIN](/en/c/learn/courses/advanced-sql-and-query-performance/learning/intermediate#example-55-n1-fix-join)
- [Example 56: N+1 Fix, IN Clause](/en/c/learn/courses/advanced-sql-and-query-performance/learning/intermediate#example-56-n1-fix-in-clause)
- [Example 57: Repeatable Read Anomaly (Prevented)](/en/c/learn/courses/advanced-sql-and-query-performance/learning/intermediate#example-57-repeatable-read-anomaly-prevented)
- [Example 58: Phantom Read (Prevented by PostgreSQL)](/en/c/learn/courses/advanced-sql-and-query-performance/learning/intermediate#example-58-phantom-read-prevented-by-postgresql)
- [Example 59: Write Skew](/en/c/learn/courses/advanced-sql-and-query-performance/learning/intermediate#example-59-write-skew)
- [Example 60: Serialization Failure, Retry](/en/c/learn/courses/advanced-sql-and-query-performance/learning/intermediate#example-60-serialization-failure-retry)
- [Example 61: Deadlock, Reproduce](/en/c/learn/courses/advanced-sql-and-query-performance/learning/intermediate#example-61-deadlock-reproduce)
- [Example 62: Deadlock, Avoid via Consistent Ordering](/en/c/learn/courses/advanced-sql-and-query-performance/learning/intermediate#example-62-deadlock-avoid-via-consistent-ordering)
- [Example 63: Advisory Lock](/en/c/learn/courses/advanced-sql-and-query-performance/learning/intermediate#example-63-advisory-lock)
- [Example 64: Materialized View Refresh](/en/c/learn/courses/advanced-sql-and-query-performance/learning/intermediate#example-64-materialized-view-refresh)

### Advanced (Examples 65–85)

- [Example 65: Recursive CTE, Shortest Path](/en/c/learn/courses/advanced-sql-and-query-performance/learning/advanced#example-65-recursive-cte-shortest-path)
- [Example 66: Window Sessionization](/en/c/learn/courses/advanced-sql-and-query-performance/learning/advanced#example-66-window-sessionization)
- [Example 67: Window vs Self-Join Performance](/en/c/learn/courses/advanced-sql-and-query-performance/learning/advanced#example-67-window-vs-self-join-performance)
- [Example 68: LATERAL Cross-Apply Report](/en/c/learn/courses/advanced-sql-and-query-performance/learning/advanced#example-68-lateral-cross-apply-report)
- [Example 69: Covering Index Design](/en/c/learn/courses/advanced-sql-and-query-performance/learning/advanced#example-69-covering-index-design)
- [Example 70: Multicolumn Statistics](/en/c/learn/courses/advanced-sql-and-query-performance/learning/advanced#example-70-multicolumn-statistics)
- [Example 71: Partition by Range](/en/c/learn/courses/advanced-sql-and-query-performance/learning/advanced#example-71-partition-by-range)
- [Example 72: Partition Pruning, EXPLAIN](/en/c/learn/courses/advanced-sql-and-query-performance/learning/advanced#example-72-partition-pruning-explain)
- [Example 73: Partition vs Index, Bulk-Delete Tradeoff](/en/c/learn/courses/advanced-sql-and-query-performance/learning/advanced#example-73-partition-vs-index-bulk-delete-tradeoff)
- [Example 74: Denormalization, Measured](/en/c/learn/courses/advanced-sql-and-query-performance/learning/advanced#example-74-denormalization-measured)
- [Example 75: Materialized View, CONCURRENTLY](/en/c/learn/courses/advanced-sql-and-query-performance/learning/advanced#example-75-materialized-view-concurrently)
- [Example 76: Connection Pooling Benchmark](/en/c/learn/courses/advanced-sql-and-query-performance/learning/advanced#example-76-connection-pooling-benchmark)
- [Example 77: Isolation Level Matrix](/en/c/learn/courses/advanced-sql-and-query-performance/learning/advanced#example-77-isolation-level-matrix)
- [Example 78: Serializable Throughput Cost](/en/c/learn/courses/advanced-sql-and-query-performance/learning/advanced#example-78-serializable-throughput-cost)
- [Example 79: EXPLAIN Buffers, I/O Tuning](/en/c/learn/courses/advanced-sql-and-query-performance/learning/advanced#example-79-explain-buffers-io-tuning)
- [Example 80: Planner Cost Constants](/en/c/learn/courses/advanced-sql-and-query-performance/learning/advanced#example-80-planner-cost-constants)
- [Example 81: Slow Query Log, Triage](/en/c/learn/courses/advanced-sql-and-query-performance/learning/advanced#example-81-slow-query-log-triage)
- [Example 82: pg_stat_statements, Top-N](/en/c/learn/courses/advanced-sql-and-query-performance/learning/advanced#example-82-pg_stat_statements-top-n)
- [Example 83: OLTP-Normalized vs OLAP Star Schema](/en/c/learn/courses/advanced-sql-and-query-performance/learning/advanced#example-83-oltp-normalized-vs-olap-star-schema)
- [Example 84: Bulk Load, COPY vs INSERT](/en/c/learn/courses/advanced-sql-and-query-performance/learning/advanced#example-84-bulk-load-copy-vs-insert)
- [Example 85: Capstone Preview, Tuning](/en/c/learn/courses/advanced-sql-and-query-performance/learning/advanced#example-85-capstone-preview-tuning)

---

← Previous: [Advanced Algorithms Drilling](../../advanced-algorithms/drilling/overview.md) &middot; Next: [Beginner Examples](./beginner.md) →
