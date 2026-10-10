---
title: "Overview"
date: 2026-07-17T00:00:00+07:00
draft: false
weight: 1
---

This page is the spaced-repetition companion to the Advanced SQL & Query Performance topic: five
fixed drills that force active recall instead of passive re-reading. Work through them in order --
short-answer recall first, then scenario judgment, then hands-on repetition against a real
PostgreSQL 18.4 database, then a checklist to confirm real automaticity, and finally why/why-not
prompts that test whether you can explain the reasoning -- including this topic's cross-cutting big
ideas, `consistency-latency-throughput` and `abstraction-and-its-cost` -- not just execute the
syntax. Every answer is hidden in a `<details>` block; try each item yourself before opening it.
Together, the five drills below touch every one of this topic's 28 concepts and cite specific
examples spanning all 85 worked examples in the Beginner, Intermediate, and Advanced tiers, plus the
capstone.

## Recall Q&A

Twenty-eight short-answer questions, one per concept. Answer from memory before opening each answer.

**Q1 (co-01 -- Subqueries and derived tables).** What is the difference between a correlated and an
uncorrelated subquery, and why does that difference matter for how many times it runs?

<details>
<summary>Answer</summary>

An uncorrelated subquery references nothing from the outer query, so the engine can evaluate it
exactly once and reuse the result for every outer row; a correlated subquery references a column
from the outer query's current row, so conceptually it runs once per outer row (though the planner
can often rewrite it into a join in practice). A subquery used AS a table in `FROM` (a derived
table) is the same idea applied to a whole result set instead of a single scalar value (Example 1
contrasts an uncorrelated `AVG(price)` subquery against its `CROSS JOIN` derived-table equivalent;
Example 29 rewrites a correlated subquery as a join).

</details>

**Q2 (co-02 -- Common table expressions).** What does a `WITH` clause give you that a nested
subquery in `FROM` does not?

<details>
<summary>Answer</summary>

A CTE names an intermediate result once, and later parts of the same query can reference that name
directly instead of the subquery being repeated verbatim wherever it's needed -- a deeply nested
query becomes a sequence of named, readable steps instead of one large expression read inside-out
(Example 4 factors one filter into a CTE; Example 5 chains several CTEs, each building on the
previous step's named result).

</details>

**Q3 (co-03 -- Recursive CTEs).** What are the two parts of a `WITH RECURSIVE` query, and what stops
it from running forever over a graph that contains a cycle?

<details>
<summary>Answer</summary>

An anchor (non-recursive) term establishes the starting rows, and a recursive term repeatedly joins
the working table back onto itself, adding new rows until a pass produces zero new rows. Over a
graph that contains a cycle, the engine itself does not detect the cycle for you -- only an
explicit guard in the RECURSIVE term (typically excluding any node already on the current path)
stops the recursion; without one anywhere in the query, nothing stops it (Example 6's counter;
Example 30's cycle-safe graph walk; Kata 2 reproduces exactly what happens when that guard is
missing entirely).

</details>

**Q4 (co-04 -- Window functions).** What does `OVER()` let a function do that plain aggregation
cannot?

<details>
<summary>Answer</summary>

`OVER()` computes a value across a set of related rows (its "window") WITHOUT collapsing those rows
into one output row the way `GROUP BY` does -- every input row keeps its own row in the result, now
carrying a value computed across its window (a running total, a rank, a neighboring row's value)
(Example 8's running total keeps all 5 input rows; Example 9's partitioned average attaches the
group average to every row in that group, unlike a `GROUP BY` that would collapse them).

</details>

**Q5 (co-05 -- Window frames and partitions).** What three things does a window's `OVER (...)`
clause let you control, and what specifically does the frame clause add beyond `ORDER BY`?

<details>
<summary>Answer</summary>

`PARTITION BY` restricts the window to rows sharing the same partition key (like a per-group
`GROUP BY`, but without collapsing rows); `ORDER BY` establishes a sequence within each partition;
and an explicit frame (`ROWS`/`RANGE BETWEEN ...`) narrows exactly which rows within that ordered
partition the function actually sees, from "just this row" to "every row so far" to a custom sliding
window. `RANGE` (the default frame mode) treats tied `ORDER BY` peers as arriving together;
`ROWS` counts physical rows one at a time regardless of ties (Example 33 shows the two frame modes
diverge on tied data; Kata 3 reproduces the double-counted running total the default `RANGE` frame
produces on ties).

</details>

**Q6 (co-06 -- Ranking and analytic functions).** Contrast `ROW_NUMBER()`, `RANK()`, and
`DENSE_RANK()` on a set of tied rows.

<details>
<summary>Answer</summary>

`ROW_NUMBER()` assigns a unique, strictly increasing integer to every row regardless of ties (an
arbitrary but deterministic tiebreak given a fully-specified `ORDER BY`); `RANK()` gives tied rows
the SAME rank and then skips the following rank numbers by the tie's size (1, 2, 2, 4);
`DENSE_RANK()` also gives tied rows the same rank but never skips a number (1, 2, 2, 3) (Example 10
contrasts all three side by side; Example 36's top-N-per-group and Kata 4 both show why the choice
between `RANK()` and `ROW_NUMBER()` changes how many rows a "top-N" filter actually returns when a
tie lands at the boundary).

</details>

**Q7 (co-07 -- Set operations).** What do `UNION`, `INTERSECT`, and `EXCEPT` each compute, and what
does appending `ALL` change?

<details>
<summary>Answer</summary>

`UNION` combines two result sets' rows; `INTERSECT` keeps only rows present in BOTH; `EXCEPT` keeps
rows present in the first but NOT the second. All three deduplicate their output by default (an
implicit `DISTINCT` pass across the combined rows); appending `ALL` skips that deduplication, keeping
every row including duplicates, which is also cheaper because no dedup pass runs at all (Example 13
measures the row-count difference `UNION` vs `UNION ALL` produces on data with real duplicates;
Example 14 uses `INTERSECT`/`EXCEPT` to compare two sets directly).

</details>

**Q8 (co-08 -- Grouping sets, ROLLUP, CUBE).** What does `GROUP BY ROLLUP(a, b)` compute in ONE pass
that a plain `GROUP BY a, b` does not, and why does column order matter?

<details>
<summary>Answer</summary>

`ROLLUP` adds progressively coarser subtotal rows on top of the normal per-`(a, b)` groups -- a
subtotal per `a` (across every `b`), plus one grand-total row -- all in a single query, instead of
requiring several separately-grouped queries `UNION`ed together. Because `ROLLUP` treats its
argument list as a HIERARCHY read left to right, the column order determines which level each
subtotal collapses at -- reversing the arguments produces subtotals at the WRONG level entirely
(Example 15's category rollup; Example 16's more general `GROUPING SETS` for combinations `ROLLUP`
can't express; Kata 5 reproduces the wrong-level subtotal a reversed column order produces).

</details>

**Q9 (co-09 -- LATERAL joins).** What can a `LATERAL` subquery reference that an ordinary subquery
in `FROM` cannot?

<details>
<summary>Answer</summary>

A `LATERAL` subquery may reference columns from tables that appear EARLIER in the same `FROM`
clause, effectively running once per row of that earlier table -- much like a correlated subquery,
but explicitly written as a join. An ordinary (non-`LATERAL`) subquery in `FROM` is evaluated
independently and can never see the other tables around it at all (Example 37 uses `LATERAL` for a
per-row top-N; Example 38 directly contrasts the same query written as a correlated subquery versus
`LATERAL`).

</details>

**Q10 (co-10 -- Conditional aggregation).** What is the difference between `FILTER (WHERE ...)` and
wrapping the same condition in a `CASE` expression inside an aggregate?

<details>
<summary>Answer</summary>

`FILTER (WHERE cond)` is dedicated PostgreSQL syntax that restricts which rows an aggregate consumes
-- it reads as "aggregate this, but only over rows matching `cond`." A `CASE WHEN cond THEN value
END` inside an aggregate instead controls what VALUE each row contributes (`NULL` for a non-match),
which composes with any aggregate portably across engines but is easy to get subtly wrong -- an
unnecessary `ELSE` can turn a `NULL`-skipping `COUNT` into a plain row count (Example 17's `FILTER`;
Example 18's `CASE`-based pivot; Kata 6 reproduces exactly the `ELSE 0` trap).

</details>

**Q11 (co-11 -- ACID properties).** Define atomicity concretely, and state what makes a failed
transaction different from a series of ordinary statements run one after another.

<details>
<summary>Answer</summary>

Atomicity guarantees a transaction's writes apply as a single all-or-nothing unit -- if any
statement inside it fails (or `ROLLBACK` is issued), every write since `BEGIN` is undone, leaving no
partial state a reader could ever observe. Ordinary statements run OUTSIDE a transaction each commit
independently the instant they succeed, so a failure partway through a sequence of them leaves
exactly the earlier ones applied and the rest not -- the very inconsistency atomicity exists to
prevent (Example 19's `BEGIN`/`COMMIT`/`ROLLBACK`; Example 20 genuinely reproduces a mid-transaction
failure and confirms every prior write in that same transaction rolled back too).

</details>

**Q12 (co-12 -- MVCC).** What does "readers see a snapshot and don't block writers" mean concretely
under PostgreSQL's MVCC, and what makes that possible at the storage level?

<details>
<summary>Answer</summary>

PostgreSQL never overwrites a row in place for an `UPDATE` -- it writes a NEW row version and marks
the old one for eventual cleanup by `VACUUM`, so a reader whose snapshot started before a concurrent
writer's commit keeps seeing the OLD row version it opened against, while the writer proceeds
independently on its own new version, with neither one blocking the other for a plain read (Example
27's Read Committed default takes a fresh per-statement snapshot, the directly observable effect of
MVCC).

</details>

**Q13 (co-13 -- Isolation levels).** Name PostgreSQL's three isolation levels this topic covers, and
state the ONE guarantee each one adds over the previous.

<details>
<summary>Answer</summary>

Read Committed (the default) gives each individual STATEMENT its own fresh snapshot, so it never
sees an uncommitted write, but two statements in the SAME transaction can see different committed
data if a concurrent commit lands between them. Repeatable Read gives the whole TRANSACTION one
snapshot taken at its first statement, so every statement inside it sees the same data throughout.
Serializable adds SSI's dependency-tracking on top of Repeatable Read's snapshot, aborting a
transaction whose committed effects could not have arisen from SOME serial (one-at-a-time) execution
order (Example 27, Example 57, Example 77's full anomaly matrix side by side).

</details>

**Q14 (co-14 -- Read phenomena).** Define non-repeatable read, phantom read, and write skew, and
state which of PostgreSQL's isolation levels prevents each.

<details>
<summary>Answer</summary>

A non-repeatable read is re-running the same query in one transaction and seeing DIFFERENT
already-committed data the second time (Read Committed allows this; Repeatable Read prevents it). A
phantom read is a range query that returns a DIFFERENT SET OF ROWS the second time inside one
transaction (PostgreSQL's Repeatable Read already prevents this -- stronger than the SQL standard
technically requires). Write skew is two transactions each independently reading an overlapping
condition, then each writing to a DIFFERENT row in a way that, combined, violates an invariant
neither one's own write alone would have broken -- Repeatable Read does NOT prevent this (no single
row is contested); only Serializable does (Example 57's non-repeatable read prevented; Example 58's
phantom read prevented; Example 59's write skew, which slips through Repeatable Read).

</details>

**Q15 (co-15 -- Serializable snapshot isolation).** What does PostgreSQL's SSI actually detect to
decide which transaction to abort, given that it cannot literally try every possible execution
order?

<details>
<summary>Answer</summary>

SSI tracks "dangerous structures" -- specific patterns of read-write dependencies between
concurrently committing transactions (a rw-antidependency cycle) that are a NECESSARY condition for
a non-serializable outcome to occur; when it detects such a cycle forming, it aborts one of the
participating transactions with a `serialization_failure` (SQLSTATE `40001`) BEFORE the anomaly can
land, rather than proving after the fact that one specific anomaly already happened (Example 59
shows the anomaly Repeatable Read misses; Example 60 shows Serializable catching the equivalent case
and the retry loop an application needs).

</details>

**Q16 (co-16 -- Explicit locking).** What is the difference between `FOR UPDATE` and `FOR SHARE`,
and what is an advisory lock for?

<details>
<summary>Answer</summary>

`FOR UPDATE` takes an EXCLUSIVE row lock -- no other transaction can lock (or update/delete) that
row until the holder commits or rolls back; `FOR SHARE` takes a weaker lock that lets other
`FOR SHARE` readers proceed concurrently but still blocks a concurrent `FOR UPDATE`/write. An
advisory lock is not tied to any row or table at all -- it is an application-defined lock (keyed by
an arbitrary integer you choose) for coordinating something outside the data model itself, like
ensuring only one instance of a scheduled job runs at a time (Example 26 proves a real block with
`lock_timeout`; Example 63's advisory lock; Kata 7 reproduces the lost update a missing `FOR UPDATE`
causes).

</details>

**Q17 (co-17 -- Database deadlocks).** What structural condition must exist for PostgreSQL to detect
a deadlock, and what is the one reliable prevention technique?

<details>
<summary>Answer</summary>

A deadlock requires a CYCLE of transactions each waiting on a lock the next one in the cycle already
holds (A waits for a lock B holds, B waits for a lock A holds) -- PostgreSQL's deadlock detector
checks for exactly this cycle (by default every `deadlock_timeout`, 1 second) and aborts one
participant to break it. The one reliable prevention technique is enforcing a single, CONSISTENT
lock-acquisition order across every transaction that touches the same set of rows -- if every
transaction always locks row 1 before row 2, a cycle can never form in the first place (Example 61
reproduces a real deadlock with two threads locking in opposite order; Example 62 fixes it with
consistent ordering).

</details>

**Q18 (co-18 -- B-tree index mechanics).** Why does a B-tree index speed up an equality lookup, a
range query, AND an `ORDER BY`, when a hash index only speeds up equality?

<details>
<summary>Answer</summary>

A B-tree keeps its keys in SORTED order across a balanced tree structure, so it can binary-search
down to any single key (equality), walk sequentially from any starting key to satisfy a range
(`BETWEEN`, `<`, `>`), and its keys are already in the exact order an `ORDER BY` on that column would
need. A hash index only maps a key to its location via a hash function, which tells you nothing
about ordering or ranges, so it can only ever answer "does this EXACT value exist" (Example 21
creates a first B-tree index; Example 24 measures the Seq Scan-to-Index Scan flip it enables).

</details>

**Q19 (co-19 -- Composite and covering indexes).** Why must a composite index's LEADING column
appear in the query's `WHERE` clause for the index to be searchable, and what does `INCLUDE` add to
a covering index?

<details>
<summary>Answer</summary>

A composite B-tree is sorted first by its leading column, then by the next column WITHIN each
leading-column value -- exactly like a phone book sorted by last name then first name. Searching by
first name alone can't use that sort order to narrow anything, so a query that omits the leading
column forces a scan of the whole index (or table) instead of a targeted search. `INCLUDE` appends
extra columns to an index's LEAF pages without making them part of the sort key, so a query that
only needs columns already present in the index (an "index-only scan") never has to visit the
underlying table (heap) at all (Example 40's column-order lesson; Example 41's covering index;
Kata 8 reproduces the exact leading-column mismatch).

</details>

**Q20 (co-20 -- Specialized indexes).** Name the workload each of hash, GIN, and BRIN indexes is
built for.

<details>
<summary>Answer</summary>

A hash index is built for pure equality lookups on a column never queried by range or sort order
(marginally smaller/faster than a B-tree for that ONE narrow case). GIN (Generalized Inverted
Index) is built for "contains" queries over composite/multi-valued data -- a `jsonb` document's
keys, an array's elements -- indexing every individual element rather than the whole value. BRIN
(Block Range Index) is built for very large tables where a column strongly correlates with physical
insertion order (a timestamp column on an append-only log) -- it stores only a min/max summary per
block RANGE, staying tiny even over a huge table, at the cost of a coarser (less exact) filter
(Example 44's hash index; Example 45's GIN over `jsonb`; Example 46's BRIN over a timeseries).

</details>

**Q21 (co-21 -- Partial and expression indexes).** What must be true, syntactically, for a partial
index to be used by a query's `WHERE` clause?

<details>
<summary>Answer</summary>

The planner only uses a partial index when it can PROVE the query's `WHERE` clause implies the
index's own predicate -- in practice this generally means the two conditions have to match closely
in their written form (or one is a trivially provable subset of the other). Two conditions that are
merely LOGICALLY equivalent but spelled differently (`status != 'closed'` versus the index's
`status = 'open'`) are not recognized as equivalent, and the index is silently never even
considered, with no error to flag the miss (Example 42's partial index; Example 43's expression
index; Kata 9 reproduces the silent miss directly).

</details>

**Q22 (co-22 -- Index cost tradeoff).** Every index that speeds up a read imposes what cost on every
write to that table, and what is index bloat?

<details>
<summary>Answer</summary>

Every `INSERT`, `UPDATE` (of an indexed column), or `DELETE` has to update EVERY index on that
table, not just the heap -- more indexes mean strictly more work per write, in both time and the
storage the index itself occupies. Index bloat is dead index entries (pointing at row versions a
prior `UPDATE`/`DELETE` already superseded) accumulating faster than autovacuum reclaims them, which
grows the index's on-disk size and can slow lookups, without ever being visible in the row count
itself (Example 47 measures the write-side slowdown directly; Example 48 observes bloat growing).

</details>

**Q23 (co-23 -- EXPLAIN and EXPLAIN ANALYZE).** What is the one crucial difference between `EXPLAIN`
and `EXPLAIN ANALYZE`, and why does that make `EXPLAIN ANALYZE` risky to run carelessly?

<details>
<summary>Answer</summary>

Plain `EXPLAIN` shows the planner's ESTIMATED plan and costs without running the query at all;
`EXPLAIN ANALYZE` actually EXECUTES the query (and, by default in PostgreSQL 18, reports real
buffer/IO stats alongside real row counts and timing) so you can compare the estimate against
reality -- which means `EXPLAIN ANALYZE` on an `UPDATE`, `DELETE`, or a genuinely slow query really
performs that write or that slow scan, not a simulation of it (Example 22's estimate-only `EXPLAIN`;
Example 23's `EXPLAIN ANALYZE`; Example 52's `Buffers` output; Example 79's IO-tuning workflow).

</details>

**Q24 (co-24 -- Reading a query plan).** Name the three join-node types this topic covers and, in
one clause each, when the planner tends to prefer each one.

<details>
<summary>Answer</summary>

Nested Loop scans the outer side once and re-probes the inner side per outer row (best when the
outer side is small or the inner side has a fast index lookup, and PostgreSQL's `Memoize` node can
cache repeated inner lookups). Hash Join builds an in-memory hash table from the smaller side once,
then streams the larger side through it (best for equality joins with no useful index, given enough
`work_mem`). Merge Join walks both already-sorted sides together (best when both inputs are already
sorted, e.g. by an index, avoiding a separate sort step) (Example 49, Example 50, Example 51, each
forcing one join type deterministically for teaching).

</details>

**Q25 (co-25 -- Table statistics and ANALYZE).** What does `ANALYZE` actually compute, and what
specifically goes wrong for the planner when it has never run on a table?

<details>
<summary>Answer</summary>

`ANALYZE` samples a table's rows and records per-column statistics -- a histogram of value
distribution, the most-common values and their frequencies, an estimated distinct-value count, and
the correlation between physical row order and logical column order -- all of which the planner's
cost model reads to estimate how many rows a `WHERE` clause will match and pick a strategy sized to
that estimate. Without it, the planner falls back to generic default selectivity constants that
assume no skew at all, which can be wildly wrong for a column where one value is far more (or less)
common than a uniform guess would assume (Example 25 refreshes stats after a bulk load; Example 53's
skewed column shows the wrong-strategy consequence directly; Example 70's `CREATE STATISTICS` for
correlated columns).

</details>

**Q26 (co-26 -- N+1 diagnosis and fix).** What is the "N+1" query pattern, and what makes a `JOIN`
and a batched `IN (...)` both valid fixes for it?

<details>
<summary>Answer</summary>

N+1 is issuing one query to fetch N parent rows, then, inside application code, ONE ADDITIONAL query
PER PARENT to fetch that parent's related rows -- N+1 total round trips where the data could have
been fetched in far fewer. A `JOIN` fetches every parent-child pair in exactly one round trip; a
batched `WHERE id IN (?, ?, ...)` fetches every child row for the WHOLE current batch of parents in
one additional round trip (two total) -- both replace "one query per parent" with "one query for the
whole batch," they just differ in whether the result needs re-assembling in application code
afterward (Example 54 reproduces N+1 with real Python timing; Example 55's `JOIN` fix; Example 56's
`IN (...)` fix).

</details>

**Q27 (co-27 -- Denormalization and materialized views).** What do you trade away to gain read speed
from denormalization, and how does a materialized view differ from a plain `VIEW` in exactly what it
stores?

<details>
<summary>Answer</summary>

Denormalization duplicates data (or precomputes a derived value) to make reads cheaper, at the
direct cost of write complexity (every write now also has to keep the duplicate in sync) and extra
storage -- the same normalization-versus-denormalization trade this curriculum first named in SQL
Essentials, now measured with real numbers. A plain `VIEW` stores nothing -- it re-runs its defining
query fresh on every reference; a MATERIALIZED VIEW stores the query's RESULT as an actual on-disk
snapshot, so reading it is cheap, but that snapshot goes stale the instant the underlying data
changes and stays stale until an explicit `REFRESH` (Example 64's plain refresh; Example 74's
denormalization measured in both directions; Example 75's non-blocking `CONCURRENTLY` refresh;
Kata 10 reproduces the staleness directly).

</details>

**Q28 (co-28 -- Partitioning, pooling, and OLTP vs. OLAP).** What does declarative range partitioning
let the planner skip entirely, and why is a persistent connection pool cheaper than opening a fresh
connection per request?

<details>
<summary>Answer</summary>

Declarative partitioning splits one logical table into several physical child tables by a partition
key (a date range, for instance); when a query's `WHERE` clause can only match rows from a KNOWN
subset of partitions, the planner performs "partition pruning," skipping every non-matching
partition's storage entirely rather than scanning (or even index-probing) rows it can prove in
advance won't match. A fresh PostgreSQL connection pays real, measurable setup cost (a new backend
process, auth negotiation) on every single request; a connection pool keeps a small set of
connections open and hands them out for reuse, paying that setup cost once per pooled connection
instead of once per request (Example 71's partitioning; Example 72's pruning; Example 76's pooling
benchmark; Example 83's OLTP-vs-OLAP schema contrast).

</details>

## Applied problems

Twelve scenarios. Each describes a symptom without naming the concept -- decide which one applies,
then check.

**AP1.** A "5 most recent orders per customer" report is built with a ranking window function, and
it works correctly for every customer with distinct order timestamps -- but for the one customer
whose 5th and 6th most recent orders share the EXACT same timestamp, the report returns 6 rows for
that customer instead of 5.

<details>
<summary>Answer</summary>

This is `RANK()` used where the requirement is an exact row count (co-06) -- `RANK()` gives every
row in a tie the SAME rank, so a tie landing exactly at the cutoff produces MORE rows than the
cutoff allows. `ROW_NUMBER()` with a fully deterministic `ORDER BY` (adding a tiebreaker column)
guarantees exactly N rows regardless of ties (Example 36; Kata 4).

</details>

**AP2.** A concert venue's booking system lets two customers each check "how many seats are left"
(both independently see 1 seat left), and each concludes it's safe to book their own customer into
that last seat. Both transactions commit successfully -- no lock conflict ever fired, because the
two transactions never wrote to the SAME row -- yet the venue ends up double-booked.

<details>
<summary>Answer</summary>

This is write skew (co-14, co-15) -- each transaction's read (checking `seats_left`) and write
(inserting its own booking row) touch DIFFERENT rows from the other transaction's, so no row-level
conflict is ever detected under Repeatable Read. Only Serializable's SSI, which tracks the READ
dependency between the two transactions (not just the writes), catches this class of anomaly
(Example 59).

</details>

**AP3.** A report query's `EXPLAIN` shows an estimated 50 rows will match a filter and picks a
Nested Loop join accordingly, but `EXPLAIN ANALYZE` on the SAME query shows the actual row count is
40,000 -- and the Nested Loop, fine for 50 rows, takes minutes instead of milliseconds against the
real 40,000.

<details>
<summary>Answer</summary>

This is a stale-or-missing-statistics misestimate (co-23, co-24, co-25) -- the planner's ESTIMATE
(shown by plain `EXPLAIN`) came from stats that no longer reflect the table's real distribution, so
it picked a join strategy sized for the WRONG row count. Only `EXPLAIN ANALYZE` reveals the
estimate-versus-reality gap directly, and running `ANALYZE` on the table (refreshing its stats)
is the fix that lets the planner choose correctly next time (Example 53; Example 80).

</details>

**AP4.** A dashboard needs, for every order, that order's own customer's running total UP TO that
order -- a subquery written in `FROM` to compute it references the outer query's `customer_id`
column, and the query fails to parse the way the developer expected.

<details>
<summary>Answer</summary>

An ordinary (non-`LATERAL`) subquery in `FROM` cannot see any other table in the same `FROM` clause
at all -- it is evaluated completely independently. `LATERAL` (co-09) is the construct built
specifically to let a subquery in `FROM` reference an earlier table's columns, running once per row
of that earlier table (Example 37; Example 38).

</details>

**AP5.** A new index added to speed up a slow report DOES make that report noticeably faster -- but
a nightly batch job that bulk-inserts a million rows becomes measurably slower than before the index
existed, and nobody connects the two changes until a profiler points at the insert path.

<details>
<summary>Answer</summary>

This is the index cost tradeoff (co-22) -- every index on a table has to be updated on every write
to that table, so adding an index that helps ONE read-heavy report imposes a real, ongoing tax on
every insert, regardless of whether that insert ever touches the indexed column's read path
(Example 47).

</details>

**AP6.** A monthly dashboard needs a subtotal per region, a SEPARATE subtotal per product category
(not nested under region), and a grand total, all computed from the same detail rows -- the current
implementation runs three separately-grouped queries and `UNION`s them together by hand.

<details>
<summary>Answer</summary>

`GROUPING SETS` (co-08) computes an arbitrary LIST of independent grouping combinations -- including
non-hierarchical ones a single `ROLLUP` can't express -- in one pass over the underlying data,
instead of scanning it three separate times and combining the results afterward (Example 16).

</details>

**AP7.** A batch job deletes a large chunk of old rows with `DELETE FROM events WHERE created_at <
...` against a single big table, and it holds locks across a long-running scan of the whole table's
indexes for the entire duration, blocking other writers -- while a colleague's events table, set up
with monthly range partitioning, drops an entire old month's data in milliseconds via `DROP TABLE`.

<details>
<summary>Answer</summary>

This is the partition-vs-index bulk-delete tradeoff (co-28) -- a `DELETE` against an unpartitioned
table has to find and remove matching rows (and every index entry pointing at them) one at a time,
however many rows match. Dropping an entire PARTITION is a metadata-only operation against the
catalog, not a row-by-row delete, because the partition's storage simply stops being attached to the
parent table (Example 73).

</details>

**AP8.** A report needs every user who was active last year but has churned entirely this year --
present in last year's active-user list, absent from this year's.

<details>
<summary>Answer</summary>

`EXCEPT` (co-07) computes exactly "rows in the first set, not in the second" -- `last_year EXCEPT
this_year` returns exactly the churned users, in one query, with no manual `NOT IN`/`NOT EXISTS`
subquery required (Example 14).

</details>

**AP9.** A funds-transfer feature has run in production for months with no issue; under a burst of
real concurrent load one day, two transfers between the SAME two accounts (one going
account-1-then-account-2, the other going account-2-then-account-1) briefly hang and then one of
them aborts with an unfamiliar error the application never anticipated.

<details>
<summary>Answer</summary>

This is a deadlock (co-17) -- the two transactions lock the same two rows in OPPOSITE orders,
creating exactly the circular-wait condition PostgreSQL's deadlock detector exists to break by
aborting one participant. The reliable fix is enforcing one CONSISTENT lock-acquisition order across
every transaction that touches both accounts (e.g. always the lower account id first) (Example 61;
Example 62).

</details>

**AP10.** A `preferences` column stores each customer's settings as `jsonb`, and a new feature needs
to quickly find every customer whose preferences contain a specific key -- a plain B-tree index on
the whole column does nothing to speed this up, because a B-tree can only compare whole `jsonb`
values, not look inside one.

<details>
<summary>Answer</summary>

A GIN index (co-20) indexes every individual key/element INSIDE a composite value like `jsonb`,
rather than the value as a single opaque unit -- it is built exactly for "does this document
contain X" queries a B-tree cannot answer efficiently (Example 45).

</details>

**AP11.** A team's checkout flow (many small, single-row, latency-sensitive transactions) performs
great, but their analytics queries (scanning millions of rows, wide aggregations, few concurrent
users) against the SAME normalized schema are painfully slow, and the team can't explain why "the
same database" behaves so differently for the two workloads.

<details>
<summary>Answer</summary>

This is an OLTP-shaped schema being asked to do OLAP-shaped work (co-28) -- a normalized schema
optimized for fast, narrow, single-row writes is exactly the wrong shape for wide analytical scans,
which benefit from a denormalized, star-schema layout designed to minimize joins across millions of
rows instead of minimizing update-time duplication (Example 83).

</details>

**AP12.** A "live" dashboard reads from an hourly-rollup materialized view, and stakeholders
complain the numbers are consistently about 45 minutes stale even though the underlying `orders`
table itself is fully up to date at all times.

<details>
<summary>Answer</summary>

This is materialized-view staleness by design (co-27) -- a materialized view is a stored SNAPSHOT,
current only as of its last `REFRESH`; if it refreshes hourly, the numbers it shows are, on average,
about half that interval stale by construction, regardless of how current the base table is. The fix
is either refreshing more frequently (trading more write cost) or clearly labeling the dashboard's
own staleness window (Example 64; Example 75; Kata 10).

</details>

## Code katas

Ten hands-on repetition drills against a real PostgreSQL 18.4 database. Each is a before/after `.sql`
or typed `.py` file colocated under `drilling/code/`. Every "before" script is real and runnable and
misapplies the concept being drilled -- run it yourself, diagnose the bug from the observed output,
fix it from memory, then compare your fix against the "after" script and the model solution before
checking your work against the actually-executed output shown. Every kata Python script is fully
type-annotated and `pyright --strict` clean (via the `# pyright: strict` file-level directive this
topic's own examples already use).

### Kata 1 -- NOT IN silently matches nothing when the subquery contains a NULL

_relates to co-01, Example 1_

**Task.** `book` rows whose author is NOT on the `banned_author` list should come back from the
query below. The version below is broken: one `banned_author` row has a `NULL` `author_id` (a
data-entry gap), and `NOT IN` against a subquery that returns even ONE `NULL` matches NOTHING at
all, for any row.

**Before** (`drilling/code/kata-01-not-in-null-trap/before/kata.sql`)

```sql
-- Kata 1 (before): NOT IN against a subquery containing NULL matches NOTHING.
SET
  client_min_messages TO WARNING;

DROP TABLE IF EXISTS book,
banned_author CASCADE;

CREATE TABLE book (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  author_id INTEGER
);

CREATE TABLE banned_author (author_id INTEGER);

INSERT INTO
  book (id, title, author_id)
VALUES
  (1, 'Refactoring', 10),
  (2, 'Domain-Driven Design', 20),
  (3, 'Working Effectively', NULL);

-- a data-entry gap: one banned_author row was inserted with a NULL author_id
INSERT INTO
  banned_author (author_id)
VALUES
  (20),
  (NULL);

-- intent: list every book whose author is NOT on the banned list.
SELECT
  id,
  title
FROM
  book
WHERE
  author_id NOT IN (
    SELECT
      author_id
    FROM
      banned_author
  );
```

**Observed (buggy) output** (captured by actually running `psql -U asqp -d asqp -f kata.sql` --
zero rows, even though book 1's author (10) is genuinely not on the banned list):

```text
 id | title
----+-------
(0 rows)
```

**After** (`drilling/code/kata-01-not-in-null-trap/after/kata.sql`)

```sql
-- Kata 1 (after): NOT EXISTS is immune to NULLs inside the subquery's result.
SET
  client_min_messages TO WARNING;

DROP TABLE IF EXISTS book,
banned_author CASCADE;

CREATE TABLE book (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  author_id INTEGER
);

CREATE TABLE banned_author (author_id INTEGER);

INSERT INTO
  book (id, title, author_id)
VALUES
  (1, 'Refactoring', 10),
  (2, 'Domain-Driven Design', 20),
  (3, 'Working Effectively', NULL);

INSERT INTO
  banned_author (author_id)
VALUES
  (20),
  (NULL);

-- THE FIX: NOT EXISTS correlates row-by-row and never compares against NULL directly.
SELECT
  id,
  title
FROM
  book b
WHERE
  NOT EXISTS (
    SELECT
      1
    FROM
      banned_author ba
    WHERE
      ba.author_id = b.author_id
  );
```

<details>
<summary>Model solution</summary>

**Root cause**: `x NOT IN (SELECT ...)` desugars to `x <> v1 AND x <> v2 AND ...` for every value
`v` the subquery returns. The moment ANY `v` is `NULL`, `x <> NULL` evaluates to `NULL` (unknown,
per three-valued logic), and `TRUE AND NULL` is `NULL` -- so the WHOLE `AND` chain becomes `NULL`
for every row, and `WHERE` discards a `NULL` result exactly like `FALSE`. `NOT EXISTS` never
compares against the subquery's values directly; it only asks "did a matching row exist," which a
`NULL` value simply never satisfies, leaving every genuinely-non-banned book correctly visible.

**Run**: `psql -U asqp -d asqp -f kata.sql`

**Output**:

```text
 id |        title
----+---------------------
  1 | Refactoring
  3 | Working Effectively
(2 rows)
```

</details>

### Kata 2 -- a recursive CTE has no cycle guard at all

_relates to co-03, Example 30_

**Task.** A walk over a small graph containing a cycle (`A -> B -> C -> A`) should visit each
reachable node exactly once. The version below is broken: the recursive term has NO guard against
revisiting an already-seen node, so the walk keeps retracing the cycle -- only an artificial depth
cap keeps this demo from running forever.

**Before** (`drilling/code/kata-02-recursive-cte-cycle-guard-missing/before/kata.sql`)

```sql
-- Kata 2 (before): a depth cap keeps this demo finite, but the MISSING cycle
-- guard still lets the walk retrace A -> B -> C -> A forever, wasting every
-- step on nodes already visited instead of reaching D even once.
SET client_min_messages TO WARNING;
DROP TABLE IF EXISTS edge CASCADE;
CREATE TABLE edge(from_node TEXT NOT NULL, to_node TEXT NOT NULL);
INSERT INTO edge(from_node, to_node) VALUES
    ('A', 'B'),
    ('B', 'C'),
    ('C', 'A'),   -- => closes a cycle: A -> B -> C -> A
    ('A', 'D');   -- => a real, non-cycling branch the walk should also reach

-- intent: walk every path reachable from A, never revisiting a node already on the path.
WITH RECURSIVE walk(node, path, depth) AS (
    SELECT 'A'::TEXT, ARRAY['A']::TEXT[], 1
    UNION ALL
    SELECT e.to_node, w.path || e.to_node, w.depth + 1
    FROM edge e
    JOIN walk w ON e.from_node = w.node
    WHERE w.depth < 6
    -- BUG: no "NOT (e.to_node = ANY(w.path))" guard here -- every recursive step
    -- blindly follows every outgoing edge, including the C -> A edge that revisits
    -- a node already on the path. Only the depth < 6 cap keeps this demo finite.
)
SELECT node, path, depth FROM walk ORDER BY depth, node;
```

**Observed (buggy) output** (captured by actually running `psql -U asqp -d asqp -f kata.sql` --
node A is revisited at depth 4, and D is reached twice, at depth 2 AND depth 5):

```text
 node |     path      | depth
------+---------------+-------
 A    | {A}           |     1
 B    | {A,B}         |     2
 D    | {A,D}         |     2
 C    | {A,B,C}       |     3
 A    | {A,B,C,A}     |     4
 B    | {A,B,C,A,B}   |     5
 D    | {A,B,C,A,D}   |     5
 C    | {A,B,C,A,B,C} |     6
(8 rows)
```

**After** (`drilling/code/kata-02-recursive-cte-cycle-guard-missing/after/kata.sql`)

```sql
-- Kata 2 (after): the cycle guard sits in the RECURSIVE term, where it is
-- actually evaluated on every step -- the walk now terminates on its own.
SET client_min_messages TO WARNING;
DROP TABLE IF EXISTS edge CASCADE;
CREATE TABLE edge(from_node TEXT NOT NULL, to_node TEXT NOT NULL);
INSERT INTO edge(from_node, to_node) VALUES
    ('A', 'B'),
    ('B', 'C'),
    ('C', 'A'),
    ('A', 'D');

WITH RECURSIVE walk(node, path, depth) AS (
    SELECT 'A'::TEXT, ARRAY['A']::TEXT[], 1
    UNION ALL
    SELECT e.to_node, w.path || e.to_node, w.depth + 1
    FROM edge e
    JOIN walk w ON e.from_node = w.node
    -- THE FIX: NOT (e.to_node = ANY(w.path)) skips any edge leading BACK to a
    -- node already on this path -- the C -> A edge is now excluded once A is
    -- already visited, so the recursion terminates on its own, no depth cap needed.
    WHERE NOT (e.to_node = ANY(w.path))
)
SELECT node, path, depth FROM walk ORDER BY depth, node;
```

<details>
<summary>Model solution</summary>

**Root cause**: `WITH RECURSIVE` has NO built-in cycle detection -- the anchor term runs exactly
once and can never usefully "guard" anything about steps taken later, so a guard written there (or
omitted from the recursive term entirely) does nothing to stop the recursion. Moving
`NOT (e.to_node = ANY(w.path))` INTO the recursive term means every single step re-checks whether
the candidate next node is already on ITS OWN path before following that edge, which is what
actually breaks the cycle.

**Run**: `psql -U asqp -d asqp -f kata.sql`

**Output**:

```text
 node |  path   | depth
------+---------+-------
 A    | {A}     |     1
 B    | {A,B}   |     2
 D    | {A,D}   |     2
 C    | {A,B,C} |     3
(4 rows)
```

</details>

### Kata 3 -- the default RANGE frame double-counts a tied running total

_relates to co-05, Example 33_

**Task.** A strict row-by-row running total should credit each SALE row exactly once, even when two
rows tie on the `ORDER BY` column. The version below is broken: it omits an explicit frame, so the
default `RANGE UNBOUNDED PRECEDING` treats tied peers as arriving TOGETHER, giving both of them the
SAME (too-large) running total.

**Before** (`drilling/code/kata-03-window-range-vs-rows-default/before/kata.sql`)

```sql
-- Kata 3 (before): the default RANGE frame double-counts tied peer rows.
SET
  client_min_messages TO WARNING;

DROP TABLE IF EXISTS sale CASCADE;

CREATE TABLE sale (
  id INTEGER PRIMARY KEY,
  amount NUMERIC(8, 2) NOT NULL
);

INSERT INTO
  sale (id, amount)
VALUES
  (1, 10.00),
  (2, 20.00),
  (3, 20.00), -- => TIES with row 2
  (4, 30.00);

-- intent: a strict row-by-row running total -- each row contributes ONCE.
SELECT
  id,
  amount,
  SUM(amount) OVER (
    ORDER BY
      amount
  ) AS running_total
  -- BUG: no explicit frame -- the DEFAULT is RANGE UNBOUNDED PRECEDING,
  -- which sums every TIED peer together, not one physical row at a time.
FROM
  sale
ORDER BY
  amount,
  id;
```

**Observed (buggy) output** (captured by actually running `psql -U asqp -d asqp -f kata.sql` --
rows 2 and 3 both show 50.00, not the strictly cumulative 30.00 then 50.00):

```text
 id | amount | running_total
----+--------+---------------
  1 |  10.00 |         10.00
  2 |  20.00 |         50.00
  3 |  20.00 |         50.00
  4 |  30.00 |         80.00
(4 rows)
```

**After** (`drilling/code/kata-03-window-range-vs-rows-default/after/kata.sql`)

```sql
-- Kata 3 (after): an explicit ROWS frame counts each physical row exactly once.
SET
  client_min_messages TO WARNING;

DROP TABLE IF EXISTS sale CASCADE;

CREATE TABLE sale (
  id INTEGER PRIMARY KEY,
  amount NUMERIC(8, 2) NOT NULL
);

INSERT INTO
  sale (id, amount)
VALUES
  (1, 10.00),
  (2, 20.00),
  (3, 20.00),
  (4, 30.00);

-- THE FIX: ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW walks physical
-- rows one at a time, regardless of ties in the ORDER BY column.
SELECT
  id,
  amount,
  SUM(amount) OVER (
    ORDER BY
      amount,
      id ROWS BETWEEN UNBOUNDED PRECEDING
      AND CURRENT ROW
  ) AS running_total
FROM
  sale
ORDER BY
  amount,
  id;
```

<details>
<summary>Model solution</summary>

**Root cause**: `RANGE` (the default frame mode when only `ORDER BY` is given) defines "preceding"
in terms of VALUE, not physical row position -- every row that TIES the current row's `ORDER BY`
value is treated as arriving in the same instant, so both rows 2 and 3 (tied at 20.00) see the SAME
frame, including each other. `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` instead counts
PHYSICAL rows one at a time regardless of value ties, with `id` added to the `ORDER BY` purely as a
deterministic tiebreaker for which row counts as "current" first.

**Run**: `psql -U asqp -d asqp -f kata.sql`

**Output**:

```text
 id | amount | running_total
----+--------+---------------
  1 |  10.00 |         10.00
  2 |  20.00 |         30.00
  3 |  20.00 |         50.00
  4 |  30.00 |         80.00
(4 rows)
```

</details>

### Kata 4 -- RANK() lets a tie inflate a top-N filter past the intended count

_relates to co-06, Example 36_

**Task.** A report needs exactly the top-2 highest-priced books per author. The version below is
broken: it uses `RANK()`, and when the 2nd and would-be-3rd book tie on price, `RANK()` gives them
BOTH rank 2 -- the `rnk <= 2` filter then returns 3 rows for that author instead of 2.

**Before** (`drilling/code/kata-04-rank-ties-inflate-topn/before/kata.sql`)

```sql
-- Kata 4 (before): RANK() lets a tie inflate the row count past the intended N.
SET
  client_min_messages TO WARNING;

DROP TABLE IF EXISTS book CASCADE;

CREATE TABLE book (
  id INTEGER PRIMARY KEY,
  author_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  price NUMERIC(6, 2) NOT NULL
);

INSERT INTO
  book (id, author_id, title, price)
VALUES
  (1, 1, 'Refactoring', 45.00),
  (2, 1, 'Domain-Driven Design', 40.00),
  (3, 1, 'Clean Code', 40.00), -- ties Domain-Driven Design for 2nd place
  (4, 1, 'Working Effectively', 30.00);

-- intent: exactly the top-2 highest-priced books per author.
SELECT
  author_id,
  title,
  price,
  rnk
FROM
  (
    SELECT
      author_id,
      title,
      price,
      RANK() OVER (
        PARTITION BY
          author_id
        ORDER BY
          price DESC
      ) AS rnk
    FROM
      book
  ) ranked
WHERE
  rnk <= 2
ORDER BY
  author_id,
  price DESC,
  title;
```

**Observed (buggy) output** (captured by actually running `psql -U asqp -d asqp -f kata.sql` --
3 rows, not the intended 2, because both 40.00 books tie at rank 2):

```text
 author_id |        title         | price | rnk
-----------+----------------------+-------+-----
         1 | Refactoring          | 45.00 |   1
         1 | Clean Code           | 40.00 |   2
         1 | Domain-Driven Design | 40.00 |   2
(3 rows)
```

**After** (`drilling/code/kata-04-rank-ties-inflate-topn/after/kata.sql`)

```sql
-- Kata 4 (after): ROW_NUMBER() with a deterministic tiebreaker caps at exactly N.
SET
  client_min_messages TO WARNING;

DROP TABLE IF EXISTS book CASCADE;

CREATE TABLE book (
  id INTEGER PRIMARY KEY,
  author_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  price NUMERIC(6, 2) NOT NULL
);

INSERT INTO
  book (id, author_id, title, price)
VALUES
  (1, 1, 'Refactoring', 45.00),
  (2, 1, 'Domain-Driven Design', 40.00),
  (3, 1, 'Clean Code', 40.00),
  (4, 1, 'Working Effectively', 30.00);

-- THE FIX: ROW_NUMBER() assigns a UNIQUE, strictly increasing number per row --
-- id is added as a tiebreaker so the choice among tied prices is reproducible.
SELECT
  author_id,
  title,
  price,
  rn
FROM
  (
    SELECT
      author_id,
      title,
      price,
      ROW_NUMBER() OVER (
        PARTITION BY
          author_id
        ORDER BY
          price DESC,
          id
      ) AS rn
    FROM
      book
  ) ranked
WHERE
  rn <= 2
ORDER BY
  author_id,
  price DESC,
  title;
```

<details>
<summary>Model solution</summary>

**Root cause**: `RANK()` (co-06) is defined to give every row in a tie the SAME rank number --
correct for "what place did this row finish in," but wrong for "give me exactly N rows," because a
tie at the cutoff means MORE than N rows share a rank `<= N`. `ROW_NUMBER()` assigns a strictly
unique, ever-increasing number regardless of ties, so `rn <= 2` is guaranteed to return exactly 2
rows per partition; adding `id` to the `ORDER BY` makes WHICH of the tied books wins the 2nd slot
deterministic and reproducible instead of arbitrary.

**Run**: `psql -U asqp -d asqp -f kata.sql`

**Output**:

```text
 author_id |        title         | price | rn
-----------+----------------------+-------+----
         1 | Refactoring          | 45.00 |  1
         1 | Domain-Driven Design | 40.00 |  2
(2 rows)
```

</details>

### Kata 5 -- ROLLUP's column order produces subtotals at the wrong level

_relates to co-08, Example 15_

**Task.** A sales report needs a subtotal per CATEGORY (across all regions), plus a grand total. The
version below is broken: it writes `ROLLUP(region, category)` -- the reversed order produces a
subtotal per REGION instead, and the per-category subtotal the report actually needs never appears
at all.

**Before** (`drilling/code/kata-05-rollup-column-order/before/kata.sql`)

```sql
-- Kata 5 (before): ROLLUP is ORDER-sensitive -- the wrong column order produces
-- subtotals at the wrong level of the hierarchy, not the ones the report needs.
SET
  client_min_messages TO WARNING;

DROP TABLE IF EXISTS sale CASCADE;

CREATE TABLE sale (
  id INTEGER PRIMARY KEY,
  category TEXT NOT NULL,
  region TEXT NOT NULL,
  amount NUMERIC(8, 2) NOT NULL
);

INSERT INTO
  sale (id, category, region, amount)
VALUES
  (1, 'Books', 'West', 100.00),
  (2, 'Books', 'East', 50.00),
  (3, 'Games', 'West', 80.00),
  (4, 'Games', 'East', 20.00);

-- intent: total per CATEGORY (across all regions), plus a grand total.
SELECT
  category,
  region,
  SUM(amount) AS total
FROM
  sale
  -- BUG: ROLLUP(region, category) rolls up in the WRONG order -- it produces a
  -- subtotal per REGION (across categories), not per category as intended.
GROUP BY
  ROLLUP (region, category)
ORDER BY
  region NULLS LAST,
  category NULLS LAST;
```

**Observed (buggy) output** (captured by actually running `psql -U asqp -d asqp -f kata.sql` --
subtotals appear per REGION (East 70.00, West 180.00); there is no per-category subtotal anywhere):

```text
 category | region | total
----------+--------+--------
 Books    | East   |  50.00
 Games    | East   |  20.00
          | East   |  70.00
 Books    | West   | 100.00
 Games    | West   |  80.00
          | West   | 180.00
          |        | 250.00
(7 rows)
```

**After** (`drilling/code/kata-05-rollup-column-order/after/kata.sql`)

```sql
-- Kata 5 (after): ROLLUP(category, region) rolls up in the INTENDED hierarchy --
-- a subtotal per category first, then the grand total.
SET
  client_min_messages TO WARNING;

DROP TABLE IF EXISTS sale CASCADE;

CREATE TABLE sale (
  id INTEGER PRIMARY KEY,
  category TEXT NOT NULL,
  region TEXT NOT NULL,
  amount NUMERIC(8, 2) NOT NULL
);

INSERT INTO
  sale (id, category, region, amount)
VALUES
  (1, 'Books', 'West', 100.00),
  (2, 'Books', 'East', 50.00),
  (3, 'Games', 'West', 80.00),
  (4, 'Games', 'East', 20.00);

-- THE FIX: ROLLUP(category, region) (co-08) matches the report's actual
-- hierarchy -- category is the OUTER grouping, region the inner one.
SELECT
  category,
  region,
  SUM(amount) AS total
FROM
  sale
GROUP BY
  ROLLUP (category, region)
ORDER BY
  category NULLS LAST,
  region NULLS LAST;
```

<details>
<summary>Model solution</summary>

**Root cause**: `ROLLUP(a, b)` treats its argument list as a HIERARCHY read left to right --
subtotals collapse the RIGHTMOST column first, then the next one leftward, ending in a single grand
total. `ROLLUP(region, category)` collapses `category` first (giving a per-region subtotal), the
exact opposite of what a per-category report needs; swapping the arguments to
`ROLLUP(category, region)` collapses `region` first instead, producing the per-category subtotal the
report actually wants.

**Run**: `psql -U asqp -d asqp -f kata.sql`

**Output**:

```text
 category | region | total
----------+--------+--------
 Books    | East   |  50.00
 Books    | West   | 100.00
 Books    |        | 150.00
 Games    | East   |  20.00
 Games    | West   |  80.00
 Games    |        | 100.00
          |        | 250.00
(7 rows)
```

</details>

### Kata 6 -- an ELSE 0 inside COUNT(CASE...) counts every row, not just the matches

_relates to co-10, Example 17_

**Task.** `paid_count` should count only the invoices whose `status` is `'paid'`. The version below
is broken: it adds `ELSE 0` inside the `CASE` expression, and `COUNT()` counts every NON-NULL value
it receives -- a literal `0` is non-NULL, so every pending invoice gets counted too.

**Before** (`drilling/code/kata-06-count-case-else-zero/before/kata.sql`)

```sql
-- Kata 6 (before): an ELSE 0 inside COUNT(CASE...) makes COUNT count EVERY row.
SET
  client_min_messages TO WARNING;

DROP TABLE IF EXISTS invoice CASCADE;

CREATE TABLE invoice (
  id INTEGER PRIMARY KEY,
  status TEXT NOT NULL,
  amount NUMERIC(8, 2) NOT NULL
);

INSERT INTO
  invoice (id, status, amount)
VALUES
  (1, 'paid', 100.00),
  (2, 'paid', 200.00),
  (3, 'pending', 50.00),
  (4, 'pending', 75.00),
  (5, 'pending', 20.00);

-- intent: count only the PAID invoices (expected: 2).
SELECT
  COUNT(
    CASE
      WHEN status = 'paid' THEN 1
      ELSE 0
    END
  ) AS paid_count
  -- BUG: COUNT() counts every NON-NULL value it's handed -- ELSE 0 hands it
  -- a non-NULL 0 for every pending row too, so COUNT counts ALL 5 rows.
FROM
  invoice;
```

**Observed (buggy) output** (captured by actually running `psql -U asqp -d asqp -f kata.sql` -- 5,
not the intended 2):

```text
 paid_count
------------
          5
(1 row)
```

**After** (`drilling/code/kata-06-count-case-else-zero/after/kata.sql`)

```sql
-- Kata 6 (after): dropping ELSE lets non-matching rows stay NULL, so COUNT
-- correctly skips them; SUM(CASE...) is the correct pattern when a 0 is needed.
SET
  client_min_messages TO WARNING;

DROP TABLE IF EXISTS invoice CASCADE;

CREATE TABLE invoice (
  id INTEGER PRIMARY KEY,
  status TEXT NOT NULL,
  amount NUMERIC(8, 2) NOT NULL
);

INSERT INTO
  invoice (id, status, amount)
VALUES
  (1, 'paid', 100.00),
  (2, 'paid', 200.00),
  (3, 'pending', 50.00),
  (4, 'pending', 75.00),
  (5, 'pending', 20.00);

-- THE FIX: no ELSE -- a non-matching row's CASE evaluates to NULL, and COUNT()
-- (co-10) skips NULLs, so only the 2 genuinely 'paid' rows are counted.
SELECT
  COUNT(
    CASE
      WHEN status = 'paid' THEN 1
    END
  ) AS paid_count,
  SUM(
    CASE
      WHEN status = 'paid' THEN amount
      ELSE 0
    END
  ) AS paid_total
  -- SUM legitimately needs the ELSE 0 -- it is folding a running total, not
  -- counting rows, and 0 is the correct additive identity for a non-match.
FROM
  invoice;
```

<details>
<summary>Model solution</summary>

**Root cause**: `COUNT(expr)` counts every row whose `expr` is NON-NULL, regardless of what value
that expression holds -- `CASE WHEN cond THEN 1 ELSE 0 END` produces a `0` (not `NULL`) for every
non-matching row, and `COUNT` treats that `0` exactly like a `1`: both get counted. Dropping the
`ELSE` (leaving a non-match as the implicit `NULL`) is what makes `COUNT` skip those rows correctly.
`SUM(CASE ... ELSE 0 END)`, by contrast, genuinely needs the `0` -- `SUM` is folding a total, and `0`
is the correct value to add for a non-match, which is why the SAME `ELSE 0` pattern is right in one
aggregate and wrong in the other.

**Run**: `psql -U asqp -d asqp -f kata.sql`

**Output**:

```text
 paid_count | paid_total
------------+------------
          2 |     300.00
(1 row)
```

</details>

### Kata 7 -- a missing FOR UPDATE loses one of two concurrent decrements

_relates to co-16, Example 26_

**Task.** Two checkout sessions each decrement the SAME item's stock by 1; starting from 10, the
final stock should be 8. The version below is broken: neither session locks the row it reads, so
both sessions read the SAME stale value (10) before either writes, and one decrement is silently
lost.

**Before** (`drilling/code/kata-07-missing-for-update-lost-update/before/kata.py`)

```python
# pyright: strict
"""Kata 7 (before): no row lock -- two sessions race a read-modify-write and lose an update."""

import psycopg

DSN = "host=localhost port=55432 dbname=asqp user=asqp password=asqp"


def setup(conn: psycopg.Connection) -> None:
    with conn.cursor() as cur:
        cur.execute("SET client_min_messages TO WARNING")
        cur.execute("DROP TABLE IF EXISTS inventory CASCADE")
        cur.execute("CREATE TABLE inventory(id INTEGER PRIMARY KEY, stock INTEGER NOT NULL)")
        cur.execute("INSERT INTO inventory(id, stock) VALUES (1, 10)")
    conn.commit()


def main() -> None:
    session_a = psycopg.connect(DSN)  # => session A: one checkout decrementing stock
    session_b = psycopg.connect(DSN)  # => session B: a SECOND checkout, same item
    setup(session_a)

    with session_a.cursor() as cur_a, session_b.cursor() as cur_b:
        cur_a.execute("BEGIN")
        cur_b.execute("BEGIN")

        # BUG: plain SELECT, no FOR UPDATE -- takes no lock, so nothing stops
        # session B from reading the SAME stale value session A just read.
        cur_a.execute("SELECT stock FROM inventory WHERE id = 1")
        stock_a = cur_a.fetchone()
        assert stock_a is not None
        print(f"Session A read stock: {stock_a[0]}")  # both sessions read stock BEFORE either writes

        cur_b.execute("SELECT stock FROM inventory WHERE id = 1")
        stock_b = cur_b.fetchone()
        assert stock_b is not None
        print(f"Session B read stock: {stock_b[0]}")

        cur_a.execute("UPDATE inventory SET stock = %s WHERE id = 1", (stock_a[0] - 1,))
        session_a.commit()
        print(f"Session A wrote stock: {stock_a[0] - 1}")

        cur_b.execute("UPDATE inventory SET stock = %s WHERE id = 1", (stock_b[0] - 1,))
        session_b.commit()
        # => session B's write OVERWRITES session A's, using the SAME stale stock_b
        # => it read before A ever wrote -- one decrement is silently lost
        print(f"Session B wrote stock: {stock_b[0] - 1}")

    with session_a.cursor() as cur_check:
        cur_check.execute("SELECT stock FROM inventory WHERE id = 1")
        final = cur_check.fetchone()
        assert final is not None
        print(f"Final stock: {final[0]}")  # expected 8 (two decrements); got 9

    session_a.close()
    session_b.close()


if __name__ == "__main__":
    main()
```

**Observed (buggy) output** (captured by actually running `python3 kata.py` -- final stock is 9,
not the expected 8; one decrement never landed):

```text
Session A read stock: 10
Session B read stock: 10
Session A wrote stock: 9
Session B wrote stock: 9
Final stock: 9
```

**After** (`drilling/code/kata-07-missing-for-update-lost-update/after/kata.py`)

```python
# pyright: strict
"""Kata 7 (after): SELECT ... FOR UPDATE forces session B to wait for A's write."""

import psycopg

DSN = "host=localhost port=55432 dbname=asqp user=asqp password=asqp"


def setup(conn: psycopg.Connection) -> None:
    with conn.cursor() as cur:
        cur.execute("SET client_min_messages TO WARNING")
        cur.execute("DROP TABLE IF EXISTS inventory CASCADE")
        cur.execute("CREATE TABLE inventory(id INTEGER PRIMARY KEY, stock INTEGER NOT NULL)")
        cur.execute("INSERT INTO inventory(id, stock) VALUES (1, 10)")
    conn.commit()


def main() -> None:
    session_a = psycopg.connect(DSN)
    session_b = psycopg.connect(DSN)
    setup(session_a)

    with session_a.cursor() as cur_a, session_b.cursor() as cur_b:
        cur_a.execute("BEGIN")
        cur_b.execute("BEGIN")
        cur_b.execute("SET lock_timeout = '500ms'")

        # THE FIX: FOR UPDATE (co-16) takes an exclusive row lock -- held open
        # until session A commits or rolls back.
        cur_a.execute("SELECT stock FROM inventory WHERE id = 1 FOR UPDATE")
        stock_a = cur_a.fetchone()
        assert stock_a is not None
        print(f"Session A locked stock: {stock_a[0]}")

        # PROOF the lock is real: session B's own FOR UPDATE on the SAME row
        # blocks and times out instead of reading a stale value silently.
        try:
            cur_b.execute("SELECT stock FROM inventory WHERE id = 1 FOR UPDATE")
            print("Session B acquired the lock (unexpected)")
        except psycopg.errors.LockNotAvailable as exc:
            print(f"Session B blocked: {type(exc).__name__}")
        session_b.rollback()

        cur_a.execute("UPDATE inventory SET stock = %s WHERE id = 1", (stock_a[0] - 1,))
        session_a.commit()
        print(f"Session A wrote stock: {stock_a[0] - 1}")

        # session B retries AFTER A's commit -- now it reads the FRESH value.
        cur_b.execute("BEGIN")
        cur_b.execute("SELECT stock FROM inventory WHERE id = 1 FOR UPDATE")
        stock_b = cur_b.fetchone()
        assert stock_b is not None
        print(f"Session B locked stock: {stock_b[0]}")

        cur_b.execute("UPDATE inventory SET stock = %s WHERE id = 1", (stock_b[0] - 1,))
        session_b.commit()
        print(f"Session B wrote stock: {stock_b[0] - 1}")

    with session_a.cursor() as cur_check:
        cur_check.execute("SELECT stock FROM inventory WHERE id = 1")
        final = cur_check.fetchone()
        assert final is not None
        print(f"Final stock: {final[0]}")  # both decrements now land: 8

    session_a.close()
    session_b.close()


if __name__ == "__main__":
    main()
```

<details>
<summary>Model solution</summary>

**Root cause**: a plain `SELECT` takes no lock at all, so nothing stops a second session from
reading the exact same pre-write value -- both sessions' subsequent `UPDATE` overwrite each other
using their OWN stale copy, and whichever commits last simply wins, silently discarding the other's
decrement. `SELECT ... FOR UPDATE` (co-16) takes an exclusive row lock the instant it runs, held
until commit or rollback -- session B's own `FOR UPDATE` against the SAME row genuinely blocks
(proven here via a short `lock_timeout` raising `LockNotAvailable` instead of hanging the demo
forever) until session A releases the lock by committing, at which point B's retry reads the
FRESH, already-updated value and its own decrement lands correctly on top of it.

**Run**: `python3 kata.py`

**Output**:

```text
Session A locked stock: 10
Session B blocked: LockNotAvailable
Session A wrote stock: 9
Session B locked stock: 9
Session B wrote stock: 8
Final stock: 8
```

</details>

### Kata 8 -- a composite index's leading column doesn't match the query's filter

_relates to co-19, Example 40_

**Task.** A report filters `book` rows by `published_year` alone. The version below is broken: the
only index on the table is `(author_id, published_year)`, with `author_id` LEADING -- a query that
never constrains `author_id` cannot use that B-tree's sort order at all, and falls back to a full
Seq Scan.

**Before** (`drilling/code/kata-08-composite-index-wrong-leading-column/before/kata.sql`)

```sql
-- Kata 8 (before): a composite index's LEADING column doesn't match the query's
-- actual filter, so the B-tree can't be searched efficiently for this query.
SET client_min_messages TO WARNING;
DROP TABLE IF EXISTS book CASCADE;
CREATE TABLE book(id INTEGER PRIMARY KEY, author_id INTEGER NOT NULL, published_year INTEGER NOT NULL);
INSERT INTO book(id, author_id, published_year)
SELECT n, 1 + (n % 5000), 1990 + (n % 35)
FROM generate_series(1, 200000) AS n;
-- the report always filters by published_year ALONE -- but the index was
-- built leading with author_id, the column the report never filters on solo.
CREATE INDEX idx_book_author_year ON book(author_id, published_year);
ANALYZE book;

-- BUG: no author_id in the WHERE clause -- a B-tree's leading column must be
-- constrained for the tree to narrow the search; published_year alone can only
-- be checked by scanning the WHOLE index (or the whole table), not searched.
EXPLAIN SELECT id FROM book WHERE published_year = 2010;
```

**Observed (buggy) output** (captured by actually running `psql -U asqp -d asqp -f kata.sql` --
Seq Scan; the composite index is never even considered for this query):

```text
                        QUERY PLAN
------------------------------------------------------------
 Seq Scan on book  (cost=0.00..3582.00 rows=5767 width=4)
   Filter: (published_year = 2010)
(2 rows)
```

**After** (`drilling/code/kata-08-composite-index-wrong-leading-column/after/kata.sql`)

```sql
-- Kata 8 (after): a dedicated index with published_year LEADING makes the
-- report's actual filter pattern searchable.
SET client_min_messages TO WARNING;
DROP TABLE IF EXISTS book CASCADE;
CREATE TABLE book(id INTEGER PRIMARY KEY, author_id INTEGER NOT NULL, published_year INTEGER NOT NULL);
INSERT INTO book(id, author_id, published_year)
SELECT n, 1 + (n % 5000), 1990 + (n % 35)
FROM generate_series(1, 200000) AS n;
CREATE INDEX idx_book_author_year ON book(author_id, published_year);
-- THE FIX: a SEPARATE index (co-19) with published_year as the leading (and
-- only) column -- the composite index above stays for queries that DO filter
-- by author_id first; this one exists for the report's actual access pattern.
CREATE INDEX idx_book_year ON book(published_year);
ANALYZE book;

EXPLAIN SELECT id FROM book WHERE published_year = 2010;
```

<details>
<summary>Model solution</summary>

**Root cause**: a composite B-tree sorts by its FIRST column, then the next column WITHIN each value
of the first -- exactly like a phone book sorted by last name then first name. A query that filters
only on `published_year` (the SECOND column) has no way to use that sort order to narrow anything,
because rows with `published_year = 2010` are scattered throughout the index under every different
`author_id`. A dedicated index with `published_year` as its OWN leading column makes exactly this
access pattern searchable, without removing the original composite index, which still serves any
query that DOES filter by `author_id` first.

**Run**: `psql -U asqp -d asqp -f kata.sql`

**Output** (row-estimate numbers vary slightly run to run because `ANALYZE` samples the table
statistically):

```text
                                   QUERY PLAN
--------------------------------------------------------------------------------
 Bitmap Heap Scan on book  (cost=63.64..1215.55 rows=5593 width=4)
   Recheck Cond: (published_year = 2010)
   ->  Bitmap Index Scan on idx_book_year  (cost=0.00..62.24 rows=5593 width=0)
         Index Cond: (published_year = 2010)
(4 rows)
```

</details>

### Kata 9 -- a partial index's predicate doesn't syntactically match the query

_relates to co-21, Example 42_

**Task.** A partial index exists over only the `'open'` tickets. The version below is broken: the
query filters with `status != 'closed'` -- logically the SAME set of rows in this two-status table,
but spelled differently from the index's own `status = 'open'` predicate, so the planner cannot
prove the index applies and silently falls back to a Seq Scan.

**Before** (`drilling/code/kata-09-partial-index-predicate-mismatch/before/kata.sql`)

```sql
-- Kata 9 (before): a partial index whose predicate does NOT syntactically match
-- the query's WHERE clause is silently unusable -- no error, just a Seq Scan.
SET client_min_messages TO WARNING;
DROP TABLE IF EXISTS ticket CASCADE;
CREATE TABLE ticket(id INTEGER PRIMARY KEY, status TEXT NOT NULL);
INSERT INTO ticket(id, status)
SELECT n, CASE WHEN n % 200 = 0 THEN 'open' ELSE 'closed' END
FROM generate_series(1, 100000) AS n;
-- a partial index over ONLY the 'open' tickets -- most tickets are 'closed'
-- and never need this index at all.
CREATE INDEX idx_ticket_open ON ticket(id) WHERE status = 'open';
ANALYZE ticket;

-- BUG: the query's predicate is status != 'closed', which is LOGICALLY the
-- same set of rows as status = 'open' here, but the planner only matches a
-- partial index's predicate SYNTACTICALLY -- it does not prove the two forms
-- are equivalent, so the index below is silently never considered.
EXPLAIN SELECT * FROM ticket WHERE status != 'closed';
```

**Observed (buggy) output** (captured by actually running `psql -U asqp -d asqp -f kata.sql` --
Seq Scan, no mention of `idx_ticket_open` anywhere in the plan):

```text
                         QUERY PLAN
------------------------------------------------------------
 Seq Scan on ticket  (cost=0.00..1791.00 rows=533 width=10)
   Filter: (status <> 'closed'::text)
(2 rows)
```

**After** (`drilling/code/kata-09-partial-index-predicate-mismatch/after/kata.sql`)

```sql
-- Kata 9 (after): rewriting the WHERE clause to match the index's predicate
-- syntax lets the planner prove the index applies.
SET client_min_messages TO WARNING;
DROP TABLE IF EXISTS ticket CASCADE;
CREATE TABLE ticket(id INTEGER PRIMARY KEY, status TEXT NOT NULL);
INSERT INTO ticket(id, status)
SELECT n, CASE WHEN n % 200 = 0 THEN 'open' ELSE 'closed' END
FROM generate_series(1, 100000) AS n;
CREATE INDEX idx_ticket_open ON ticket(id) WHERE status = 'open';
ANALYZE ticket;

-- THE FIX: status = 'open' (co-21) matches the index's own predicate text
-- exactly -- the planner can now prove every row this index covers satisfies
-- the query's WHERE clause too, so it uses the much smaller partial index.
EXPLAIN SELECT * FROM ticket WHERE status = 'open';
```

<details>
<summary>Model solution</summary>

**Root cause**: a partial index is only eligible when the planner can PROVE, from the query's `WHERE`
clause text, that every row the index covers satisfies the query -- in practice this generally
requires the two predicates to match closely in written form, not merely be logically equivalent.
`status != 'closed'` and `status = 'open'` return the identical set of rows on THIS two-status table,
but the planner never runs a general theorem prover to confirm that -- it silently drops the index
from consideration with no error or warning. Rewriting the query to match the index's own predicate
text exactly restores the match.

**Run**: `psql -U asqp -d asqp -f kata.sql`

**Output** (row-estimate numbers vary slightly run to run because `ANALYZE` samples the table
statistically):

```text
                                    QUERY PLAN
------------------------------------------------------------------------------------
 Index Scan using idx_ticket_open on ticket  (cost=0.28..31.87 rows=573 width=10)
(1 row)
```

</details>

### Kata 10 -- a materialized view keeps showing a stale total after the base table changes

_relates to co-27, Example 64_

**Task.** `author_revenue` is a materialized view summing each author's book revenue. The version
below is broken: after a new book is inserted for an author already in the view, reading the view
still shows the OLD total -- no `REFRESH` was ever issued, and PostgreSQL never auto-refreshes a
materialized view for you.

**Before** (`drilling/code/kata-10-stale-materialized-view/before/kata.sql`)

```sql
-- Kata 10 (before): a materialized view is a SNAPSHOT -- writing to the base
-- table never touches it, and no error warns a reader the numbers are stale.
SET
  client_min_messages TO WARNING;

DROP MATERIALIZED VIEW IF EXISTS author_revenue CASCADE;

DROP TABLE IF EXISTS book CASCADE;

CREATE TABLE book (
  id INTEGER PRIMARY KEY,
  author_id INTEGER NOT NULL,
  price NUMERIC(8, 2) NOT NULL
);

INSERT INTO
  book (id, author_id, price)
VALUES
  (1, 1, 40.00),
  (2, 1, 20.00);

CREATE MATERIALIZED VIEW author_revenue AS
SELECT
  author_id,
  SUM(price) AS total
FROM
  book
GROUP BY
  author_id;

-- author 1's total is captured HERE, at CREATE time: 60.00
-- a new book is added to the SAME author AFTER the view was built.
INSERT INTO
  book (id, author_id, price)
VALUES
  (3, 1, 100.00);

-- BUG: reading the materialized view still returns the OLD total -- no
-- REFRESH was ever issued, and PostgreSQL never auto-refreshes it for you.
SELECT
  author_id,
  total
FROM
  author_revenue;
```

**Observed (buggy) output** (captured by actually running `psql -U asqp -d asqp -f kata.sql` --
60.00, the value from BEFORE the 100.00 book was inserted, not the current 160.00):

```text
 author_id | total
-----------+-------
         1 | 60.00
(1 row)
```

**After** (`drilling/code/kata-10-stale-materialized-view/after/kata.sql`)

```sql
-- Kata 10 (after): REFRESH MATERIALIZED VIEW re-runs the defining query,
-- replacing the stale snapshot with current data.
SET
  client_min_messages TO WARNING;

DROP MATERIALIZED VIEW IF EXISTS author_revenue CASCADE;

DROP TABLE IF EXISTS book CASCADE;

CREATE TABLE book (
  id INTEGER PRIMARY KEY,
  author_id INTEGER NOT NULL,
  price NUMERIC(8, 2) NOT NULL
);

INSERT INTO
  book (id, author_id, price)
VALUES
  (1, 1, 40.00),
  (2, 1, 20.00);

CREATE MATERIALIZED VIEW author_revenue AS
SELECT
  author_id,
  SUM(price) AS total
FROM
  book
GROUP BY
  author_id;

INSERT INTO
  book (id, author_id, price)
VALUES
  (3, 1, 100.00);

-- THE FIX: REFRESH MATERIALIZED VIEW (co-27) re-executes the defining query
-- NOW, replacing every row in the view with a fresh result.
REFRESH MATERIALIZED VIEW author_revenue;

SELECT
  author_id,
  total
FROM
  author_revenue;
```

<details>
<summary>Model solution</summary>

**Root cause**: a materialized view stores its defining query's RESULT as an on-disk snapshot at
`CREATE`/`REFRESH` time -- unlike a plain `VIEW`, it does not re-run its query on every reference, so
nothing about writing to the underlying `book` table ever touches the view's own stored rows.
`REFRESH MATERIALIZED VIEW` is the only thing that re-executes the defining query and replaces the
view's contents; forgetting to schedule or trigger it after a relevant write is what leaves a
dashboard silently stale with no error anywhere to flag the gap.

**Run**: `psql -U asqp -d asqp -f kata.sql`

**Output**:

```text
 author_id | total
-----------+--------
         1 | 160.00
(1 row)
```

</details>

## Self-check checklist

Work through this list without looking anything up. Every item should be something you can do from
memory, not something you'd need to search for.

**Subqueries, CTEs, and window-function basics**

- [ ] I can write both a correlated and an uncorrelated subquery and explain why the engine can
      evaluate the uncorrelated one exactly once (co-01).
- [ ] I can factor a nested subquery into a named `WITH` step and explain what that buys over the
      nested form (co-02).
- [ ] I can write a `WITH RECURSIVE` query with an explicit cycle guard over a graph that genuinely
      contains a cycle (co-03).
- [ ] I can write a window function with `OVER()` and explain why it doesn't collapse rows the way
      `GROUP BY` does (co-04).
- [ ] I can write an explicit `ROWS BETWEEN` frame and explain when it diverges from the default
      `RANGE` frame (co-05).
- [ ] I can pick correctly among `ROW_NUMBER()`, `RANK()`, and `DENSE_RANK()` for a tied data set,
      based on what the report actually needs (co-06).

**Set operations, grouping, LATERAL, and conditional aggregation**

- [ ] I can write `UNION`, `INTERSECT`, and `EXCEPT`, and explain what appending `ALL` changes about
      deduplication (co-07).
- [ ] I can write a `GROUP BY ROLLUP(...)` with the columns in the correct hierarchical order for
      the subtotal the report actually needs (co-08).
- [ ] I can write a `LATERAL` subquery that references an earlier table in the same `FROM` clause
      (co-09).
- [ ] I can write `FILTER (WHERE ...)` and a `CASE`-based conditional aggregate, and explain the
      `ELSE 0` trap that breaks a `COUNT(CASE...)` (co-10).

**Transactions, MVCC, isolation, and locking**

- [ ] I can explain atomicity concretely and predict what a `ROLLBACK` undoes versus what a series
      of auto-committing statements would have left behind (co-11).
- [ ] I can explain why a reader under MVCC never blocks a concurrent writer, and what makes that
      possible at the storage level (co-12).
- [ ] I can name Read Committed, Repeatable Read, and Serializable and state the ONE guarantee each
      adds over the previous (co-13).
- [ ] I can define non-repeatable read, phantom read, and write skew, and state which isolation
      level prevents each (co-14).
- [ ] I can explain what a `serialization_failure` under SSI actually detected, and that an
      application MUST be ready to retry it (co-15).
- [ ] I can write a `SELECT ... FOR UPDATE` and explain the difference between it and `FOR SHARE`
      (co-16).
- [ ] I can explain the lock-cycle condition a deadlock requires and state the one reliable
      prevention technique (co-17).

**Indexing**

- [ ] I can explain why a B-tree helps an equality lookup, a range query, AND an `ORDER BY`, when a
      hash index only helps equality (co-18).
- [ ] I can design a composite index's column order to match an actual query's `WHERE` clause, and
      explain what `INCLUDE` adds to a covering index (co-19).
- [ ] I can pick the right specialized index (hash, GIN, BRIN) for a described workload shape
      (co-20).
- [ ] I can write a partial index and explain exactly what has to match, syntactically, for the
      planner to use it (co-21).
- [ ] I can explain the write-and-storage cost every index adds, and what index bloat is (co-22).

**Reading and trusting the query plan**

- [ ] I can explain the one crucial difference between `EXPLAIN` and `EXPLAIN ANALYZE`, and why the
      latter is risky to run carelessly (co-23).
- [ ] I can read a plan and name which of Nested Loop, Hash Join, or Merge Join the planner chose,
      and state when the planner tends to prefer each (co-24).
- [ ] I can explain what `ANALYZE` computes and predict what goes wrong for the planner on a table
      it has never run against (co-25).

**Application-level and system-level performance**

- [ ] I can recognize an N+1 query pattern from a query log and fix it with either a `JOIN` or a
      batched `IN (...)` (co-26).
- [ ] I can explain what denormalization trades away for read speed, and the difference between a
      plain `VIEW` and a materialized one (co-27).
- [ ] I can explain what partition pruning lets the planner skip, and why a persistent connection
      pool beats a fresh connection per request (co-28).

## Elaborative interrogation & self-explanation

Nine why/why-not prompts. Answer in your own words before checking -- the goal is explaining the
reasoning, not reciting a definition.

**W1.** Why does this topic teach BOTH Repeatable Read and Serializable, instead of just always
recommending Serializable everywhere, given that it prevents strictly more anomalies?

<details>
<summary>Answer</summary>

Ties to `consistency-latency-throughput` -- Serializable's SSI does real bookkeeping (predicate
locking, dependency tracking) that costs measurable throughput under contention (Example 78 measures
this directly), and it can convert a legitimate concurrent transaction into a `serialization_failure`
the application MUST be ready to retry (Example 60). Repeatable Read is cheaper and already
sufficient for workloads that don't have write-skew-shaped invariants spanning multiple rows;
recommending the strongest isolation level unconditionally would trade away throughput plenty of
workloads never needed to spend.

</details>

**W2.** Why does the topic insist `EXPLAIN ANALYZE`'s REAL (not just estimated) numbers matter, when
plain `EXPLAIN` is faster and doesn't require actually running the query?

<details>
<summary>Answer</summary>

`EXPLAIN`'s cost/row numbers are the planner's OWN estimate, built from a cost model applied to
whatever `ANALYZE` stats happen to exist -- a plan can look cheap on paper and still be wrong if
those stats are stale (Example 53) or the workload doesn't match the model's assumptions
(Example 80). `EXPLAIN ANALYZE` is the only way to see whether the planner's estimate and reality
actually agree, and the SIZE of that disagreement is often the most useful diagnostic signal of all,
independent of what either number says alone (Example 52's real `Buffers`; Example 79's IO-tuning
workflow built entirely around comparing estimate to reality).

</details>

**W3.** Why does index cost tradeoff (co-22) matter as ITS OWN concept, given every index type this
topic teaches (B-tree, GIN, BRIN, partial, composite) already gets its own dedicated lesson on how
it works?

<details>
<summary>Answer</summary>

Ties to `abstraction-and-its-cost` -- every index in this topic buys read speed by charging writes
and storage, and that is a single unifying insight independent of which specific index type is under
discussion. Naming it separately keeps a developer from evaluating a new index purely on "will this
make my `SELECT` faster" without ever asking the other half of the question (Example 47 and
Example 48 measure the write-side cost and bloat directly, distinct from any single index type's own
mechanics lesson).

</details>

**W4.** Why does write skew (Example 59) survive Repeatable Read, when a simple lost update
(Kata 7's missing `FOR UPDATE`) doesn't need Serializable to fix -- `FOR UPDATE` alone is enough?

<details>
<summary>Answer</summary>

A lost update is a conflict on the SAME row -- the fix (`FOR UPDATE`, or even Repeatable Read's own
first-committer-wins rule on that row) can see the conflict because both transactions touch
identical data. Write skew's two transactions write to DIFFERENT rows, so no row-level lock or
Repeatable-Read conflict check ever sees an overlap at all -- only Serializable's SSI, which tracks
the READS each transaction made (not just the writes), has the information needed to catch the
invariant violation.

</details>

**W5.** Why does the topic frame partition pruning (Example 72) and a covering index's index-only
scan (Example 41) as the SAME underlying idea -- "let the planner prove it can skip work entirely" --
rather than as two unrelated features?

<details>
<summary>Answer</summary>

Both features work by giving the planner enough STATIC information to prove, before touching any
data, that an entire category of work is unnecessary -- partition pruning proves whole partitions
can't match a `WHERE` clause; a covering index proves the heap itself never needs visiting because
every needed column is already present in the index. Recognizing the shared shape (prove, then skip)
is what lets a developer look for the same opportunity in a PostgreSQL feature this topic never
explicitly covers.

</details>

**W6.** Why does the topic include connection pooling (Example 76) and OLTP-vs-OLAP schema shape
(Example 83) inside a topic ostensibly about "query performance," when neither one is about a single
query's plan at all?

<details>
<summary>Answer</summary>

Ties to `consistency-latency-throughput` and this topic's own opening framing -- a slow SYSTEM is
not always a slow QUERY. Connection setup overhead and a schema shaped for the wrong workload both
degrade real, end-to-end latency and throughput without any single `EXPLAIN` plan ever looking wrong
in isolation. The topic's closing examples deliberately widen the lens from "is this one query's
plan good" to "is the whole system, including its connection and schema choices, shaped for its
actual workload."

</details>

**W7.** Why does this topic's capstone combine a window report, an index-tuning pass, an N+1 fix,
AND a concurrency-anomaly reproduction into ONE workflow (Example 85), instead of one clean example
each?

<details>
<summary>Answer</summary>

Each pattern proven in isolation (Examples 1-84) demonstrates the mechanism works; a real production
incident rarely arrives as one isolated concept -- it's a slow report (needing a window function AND
the right index), degraded further by an N+1 pattern nobody had noticed, made worse under real
concurrent load that surfaces an isolation anomaly nobody had reproduced before. The capstone's job
is proving the individually-learned tools compose under a realistic, tangled diagnostic sequence, not
re-teaching any one of them again.

</details>

**W8.** Why does this topic prefer `NOT EXISTS` over `NOT IN` as a general habit (Kata 1), when
`NOT IN` is shorter to write and works correctly whenever the subquery's result genuinely has no
`NULL`s?

<details>
<summary>Answer</summary>

`NOT IN`'s correctness is CONDITIONAL on a fact the query text itself doesn't guarantee or even
mention -- "this column is never `NULL`" -- and that fact can silently stop being true the moment
someone adds a legitimate `NULL`-producing row to the referenced table, breaking a query that used
to work with no change at the call site itself. `NOT EXISTS` is correct unconditionally, regardless
of what the subquery's result ever contains, which is the same "don't depend on an invisible
precondition" instinct this whole topic reinforces elsewhere -- missing `ANALYZE`, a partial index's
exact predicate text, a composite index's column order: every one of them is a case where an
invisible, easy-to-violate precondition silently determines correctness or performance.

</details>

**W9.** Why does the topic teach `ROLLUP`/`CUBE`/`GROUPING SETS` as ONE aggregation pass, rather than
just recommending several separately-grouped queries `UNION`ed together, which reads more obviously
to someone unfamiliar with the syntax?

<details>
<summary>Answer</summary>

Ties to `abstraction-and-its-cost` from the opposite direction of W3 -- several separately-grouped
queries `UNION`ed together mean the engine aggregates over the underlying rows MULTIPLE times, once
per `UNION`ed query, where `ROLLUP`/`CUBE`/`GROUPING SETS` compute every requested subtotal level in
a SINGLE pass over the data. The syntax costs a developer some upfront unfamiliarity -- learning
column-order sensitivity (Kata 5) and how the grouping levels compose -- in exchange for a real,
measurable reduction in how many times the underlying data actually gets touched.

</details>

---

← Previous: [Capstone](../learning/capstone/overview.md) &middot; Next: [Data Access: ORMs & Query Builders](../../data-access-orms-and-query-builders/learning/overview.md) →
