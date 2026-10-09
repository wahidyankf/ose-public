---
title: "Overview"
date: 2026-07-14T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [4 · Just Enough Python](../../just-enough-python/learning/overview.md) -- Python
  drives every database-access example in this topic's Python-marked (†) examples, and by this point
  you should be comfortable running a `.py` script and reading typed function signatures.
- **Tools & environment**: a macOS/Linux terminal; **SQLite** (`sqlite3 --version` confirms it is
  installed -- the same engine Python's stdlib `sqlite3` module embeds); **Python 3.10 or newer** with `pytest`
  installed in a `venv`. `psql`/PostgreSQL is only referenced for cross-checking dialect-agnostic SQL
  semantics (JOIN/GROUP BY/HAVING/NULL behavior) -- it is not required to complete this topic.
- **Assumed knowledge**: basic Python (variables, functions, running a script). No prior SQL or
  database background is assumed -- this topic is your SQL starting point.

## Why this exists -- the big idea

Application data outlives the process that created it. A list or dictionary in memory vanishes the
moment your program exits; a table in a database survives restarts, crashes, and years of accumulated
history. That durability comes with a cost: the data has to be queried, related to other data, and
kept internally consistent -- exactly the problems the relational model and SQL were built to solve.

**Keep-this-if-you-forget-everything**: declare _what_ result you want and let the engine decide _how_
to get it. This is the `mechanism-vs-policy` big idea in concrete form: SQL is declarative policy (the
result you describe), and the query planner is the mechanism (how it actually fetches rows) -- you
never write a loop to find "every book over $25," you just say `WHERE price > 25` and the engine
figures out the rest. Normalization -- splitting data into related tables instead of repeating it --
is the other half of this topic's foundation: it keeps one fact in exactly one place, so updating an
author's name never means hunting down every book row that repeated it.

## How this topic is organized

- **Beginner** (Examples 1-30) -- schema declaration (`CREATE TABLE`, `.schema`), the CRUD basics
  (`INSERT`, `SELECT`, `UPDATE`, `DELETE`), `WHERE`/`ORDER BY`/`LIMIT` filtering and paging, the four
  core constraints (`NOT NULL`, `UNIQUE`, `DEFAULT`, `CHECK`), foreign keys (declaring and enforcing),
  a first `JOIN`, and the first two Python `sqlite3` examples (connecting, querying, and
  parameterized inserts).
- **Intermediate** (Examples 31-58) -- multi-table joins with aliases, `LEFT JOIN` and anti-joins,
  `GROUP BY`/`HAVING` aggregation, NULL's three-valued logic and `COALESCE`, normalization walkthroughs
  (1NF and 3NF), more Python `sqlite3` (named parameters, `executemany`, `fetchone` streaming,
  `sqlite3.Row`), transactions (commit/rollback/context-manager), injection-safe vs. injection-unsafe
  queries side by side, upsert (`ON CONFLICT`), subqueries, self-joins, and `CASE` expressions.
- **Advanced** (Examples 59-80) -- additive schema migrations with `PRAGMA user_version` tracking,
  diagnosing and fixing the N+1 query problem, composite primary keys, `ON DELETE CASCADE`/`RESTRICT`,
  `SAVEPOINT`/`ROLLBACK TO` partial-transaction undo, a typed Python data-access-layer module tested
  with `pytest`, CSV export via the CLI, integrity-check pragmas, designing a 3NF schema from scratch,
  and correlated subqueries.

Every example cites the concept (`co-NN`) it exercises, and every example is fully self-contained --
none of them depend on state left behind by an earlier example, so you can run any single one from a
clean, empty directory.

## Scope: the usable slice

This topic covers the **usable slice**: schema design, core queries, and safe database access from
Python, entirely from the CLI. Window functions, common table expressions (CTEs), indexing strategy,
and transaction isolation levels are **deliberately out of scope** here -- they are deferred to a
later Advanced SQL topic in this curriculum. If a SQL feature is not exercised by an example in this
topic, it is out of scope on purpose, not by oversight.

**Accuracy**: SQLite is **public domain** (no license required); check the
[official release history](https://www.sqlite.org/changes.html) for the latest patch release.
Note that the SQLite version bundled with a given Python install varies -- this topic reads
`sqlite3.sqlite_version` at runtime rather than asserting a fixed bundled version wherever that
matters. Every concrete, checkable claim in this topic (constraint error text, CLI dot-command
behavior, `PRAGMA` semantics, Python `sqlite3` API surface) was verified against sqlite.org and
docs.python.org primary documentation on 2026-07-12, and re-verified with no drift found on
2026-07-14. The release history and links on this page were checked again on 2026-10-10.

## Examples by Level

### Beginner (Examples 1–30)

- [Example 1: Create Author Table](/en/learn/courses/sql-essentials/learning/beginner#example-1-create-author-table)
- [Example 2: Open Database CLI](/en/learn/courses/sql-essentials/learning/beginner#example-2-open-database-cli)
- [Example 3: Insert Single Row](/en/learn/courses/sql-essentials/learning/beginner#example-3-insert-single-row)
- [Example 4: Insert Multiple Rows](/en/learn/courses/sql-essentials/learning/beginner#example-4-insert-multiple-rows)
- [Example 5: Select All Columns](/en/learn/courses/sql-essentials/learning/beginner#example-5-select-all-columns)
- [Example 6: Select Projection](/en/learn/courses/sql-essentials/learning/beginner#example-6-select-projection)
- [Example 7: Where Equality](/en/learn/courses/sql-essentials/learning/beginner#example-7-where-equality)
- [Example 8: Where Comparison](/en/learn/courses/sql-essentials/learning/beginner#example-8-where-comparison)
- [Example 9: Where And Or](/en/learn/courses/sql-essentials/learning/beginner#example-9-where-and-or)
- [Example 10: Where Like Prefix](/en/learn/courses/sql-essentials/learning/beginner#example-10-where-like-prefix)
- [Example 11: Where In Set](/en/learn/courses/sql-essentials/learning/beginner#example-11-where-in-set)
- [Example 12: Order By Ascending](/en/learn/courses/sql-essentials/learning/beginner#example-12-order-by-ascending)
- [Example 13: Order By Descending](/en/learn/courses/sql-essentials/learning/beginner#example-13-order-by-descending)
- [Example 14: Limit Rows](/en/learn/courses/sql-essentials/learning/beginner#example-14-limit-rows)
- [Example 15: Limit Offset Paging](/en/learn/courses/sql-essentials/learning/beginner#example-15-limit-offset-paging)
- [Example 16: Select Distinct](/en/learn/courses/sql-essentials/learning/beginner#example-16-select-distinct)
- [Example 17: Type Affinity](/en/learn/courses/sql-essentials/learning/beginner#example-17-type-affinity)
- [Example 18: Not Null Constraint](/en/learn/courses/sql-essentials/learning/beginner#example-18-not-null-constraint)
- [Example 19: Unique Constraint](/en/learn/courses/sql-essentials/learning/beginner#example-19-unique-constraint)
- [Example 20: Default Value](/en/learn/courses/sql-essentials/learning/beginner#example-20-default-value)
- [Example 21: Check Constraint](/en/learn/courses/sql-essentials/learning/beginner#example-21-check-constraint)
- [Example 22: Autoincrement Rowid](/en/learn/courses/sql-essentials/learning/beginner#example-22-autoincrement-rowid)
- [Example 23: Update One Row](/en/learn/courses/sql-essentials/learning/beginner#example-23-update-one-row)
- [Example 24: Update All Rows](/en/learn/courses/sql-essentials/learning/beginner#example-24-update-all-rows)
- [Example 25: Delete Row](/en/learn/courses/sql-essentials/learning/beginner#example-25-delete-row)
- [Example 26: Declare Foreign Key](/en/learn/courses/sql-essentials/learning/beginner#example-26-declare-foreign-key)
- [Example 27: Enforce Foreign Key](/en/learn/courses/sql-essentials/learning/beginner#example-27-enforce-foreign-key)
- [Example 28: Inner Join Two Tables](/en/learn/courses/sql-essentials/learning/beginner#example-28-inner-join-two-tables)
- [Example 29: Python Connect And Query](/en/learn/courses/sql-essentials/learning/beginner#example-29-python-connect-and-query)
- [Example 30: Python Parameterized Insert](/en/learn/courses/sql-essentials/learning/beginner#example-30-python-parameterized-insert)

### Intermediate (Examples 31–58)

- [Example 31: Left Join Unmatched](/en/learn/courses/sql-essentials/learning/intermediate#example-31-left-join-unmatched)
- [Example 32: Join with Aliases](/en/learn/courses/sql-essentials/learning/intermediate#example-32-join-with-aliases)
- [Example 33: Three-Table Join](/en/learn/courses/sql-essentials/learning/intermediate#example-33-three-table-join)
- [Example 34: Group By Count](/en/learn/courses/sql-essentials/learning/intermediate#example-34-group-by-count)
- [Example 35: Group By Sum](/en/learn/courses/sql-essentials/learning/intermediate#example-35-group-by-sum)
- [Example 36: Group By Avg](/en/learn/courses/sql-essentials/learning/intermediate#example-36-group-by-avg)
- [Example 37: Min-Max Aggregate](/en/learn/courses/sql-essentials/learning/intermediate#example-37-min-max-aggregate)
- [Example 38: Having Filter Groups](/en/learn/courses/sql-essentials/learning/intermediate#example-38-having-filter-groups)
- [Example 39: Where Plus Having](/en/learn/courses/sql-essentials/learning/intermediate#example-39-where-plus-having)
- [Example 40: Count Star vs Column](/en/learn/courses/sql-essentials/learning/intermediate#example-40-count-star-vs-column)
- [Example 41: Null Is Null](/en/learn/courses/sql-essentials/learning/intermediate#example-41-null-is-null)
- [Example 42: Null Coalesce](/en/learn/courses/sql-essentials/learning/intermediate#example-42-null-coalesce)
- [Example 43: Null Three-Valued](/en/learn/courses/sql-essentials/learning/intermediate#example-43-null-three-valued)
- [Example 44: Aggregate Over Join](/en/learn/courses/sql-essentials/learning/intermediate#example-44-aggregate-over-join)
- [Example 45: Normalize Repeating Group (1NF)](/en/learn/courses/sql-essentials/learning/intermediate#example-45-normalize-repeating-group-1nf)
- [Example 46: Normalize Transitive Dependency (3NF)](/en/learn/courses/sql-essentials/learning/intermediate#example-46-normalize-transitive-dependency-3nf)
- [Example 47: Python Named Params](/en/learn/courses/sql-essentials/learning/intermediate#example-47-python-named-params)
- [Example 48: Python Executemany](/en/learn/courses/sql-essentials/learning/intermediate#example-48-python-executemany)
- [Example 49: Python Fetchone Loop](/en/learn/courses/sql-essentials/learning/intermediate#example-49-python-fetchone-loop)
- [Example 50: Python Row Factory](/en/learn/courses/sql-essentials/learning/intermediate#example-50-python-row-factory)
- [Example 51: Transaction Commit](/en/learn/courses/sql-essentials/learning/intermediate#example-51-transaction-commit)
- [Example 52: Transaction Rollback](/en/learn/courses/sql-essentials/learning/intermediate#example-52-transaction-rollback)
- [Example 53: Transaction Context Manager](/en/learn/courses/sql-essentials/learning/intermediate#example-53-transaction-context-manager)
- [Example 54: Injection Safe vs Unsafe](/en/learn/courses/sql-essentials/learning/intermediate#example-54-injection-safe-vs-unsafe)
- [Example 55: Upsert On Conflict](/en/learn/courses/sql-essentials/learning/intermediate#example-55-upsert-on-conflict)
- [Example 56: Subquery in Where](/en/learn/courses/sql-essentials/learning/intermediate#example-56-subquery-in-where)
- [Example 57: Self Join](/en/learn/courses/sql-essentials/learning/intermediate#example-57-self-join)
- [Example 58: Case Expression](/en/learn/courses/sql-essentials/learning/intermediate#example-58-case-expression)

### Advanced (Examples 59–80)

- [Example 59: Migration Add Column](/en/learn/courses/sql-essentials/learning/advanced#example-59-migration-add-column)
- [Example 60: Migration Backfill](/en/learn/courses/sql-essentials/learning/advanced#example-60-migration-backfill)
- [Example 61: Migration Version Tracking](/en/learn/courses/sql-essentials/learning/advanced#example-61-migration-version-tracking)
- [Example 62: N+1 Query Problem Demonstrated](/en/learn/courses/sql-essentials/learning/advanced#example-62-n1-query-problem-demonstrated)
- [Example 63: N+1 Fixed with a Single Join](/en/learn/courses/sql-essentials/learning/advanced#example-63-n1-fixed-with-a-single-join)
- [Example 64: N+1 Fixed with a Batched Fetch](/en/learn/courses/sql-essentials/learning/advanced#example-64-n1-fixed-with-a-batched-fetch)
- [Example 65: Composite Primary Key](/en/learn/courses/sql-essentials/learning/advanced#example-65-composite-primary-key)
- [Example 66: Cascade Delete](/en/learn/courses/sql-essentials/learning/advanced#example-66-cascade-delete)
- [Example 67: Restrict Delete](/en/learn/courses/sql-essentials/learning/advanced#example-67-restrict-delete)
- [Example 68: Savepoint Partial Rollback](/en/learn/courses/sql-essentials/learning/advanced#example-68-savepoint-partial-rollback)
- [Example 69: Python Report Function](/en/learn/courses/sql-essentials/learning/advanced#example-69-python-report-function)
- [Example 70: Group Concat](/en/learn/courses/sql-essentials/learning/advanced#example-70-group-concat)
- [Example 71: Anti-Join Missing Rows](/en/learn/courses/sql-essentials/learning/advanced#example-71-anti-join-missing-rows)
- [Example 72: Atomic Transfer](/en/learn/courses/sql-essentials/learning/advanced#example-72-atomic-transfer)
- [Example 73: Python DAL Module](/en/learn/courses/sql-essentials/learning/advanced#example-73-python-dal-module)
- [Example 74: Seed from SQL File](/en/learn/courses/sql-essentials/learning/advanced#example-74-seed-from-sql-file)
- [Example 75: Export Query to CSV](/en/learn/courses/sql-essentials/learning/advanced#example-75-export-query-to-csv)
- [Example 76: Integrity Checks](/en/learn/courses/sql-essentials/learning/advanced#example-76-integrity-checks)
- [Example 77: Design a 3NF Schema](/en/learn/courses/sql-essentials/learning/advanced#example-77-design-a-3nf-schema)
- [Example 78: Correlated Subquery](/en/learn/courses/sql-essentials/learning/advanced#example-78-correlated-subquery)
- [Example 79: Join, Group, and Having Report](/en/learn/courses/sql-essentials/learning/advanced#example-79-join-group-and-having-report)
- [Example 80: pytest Rollback Integration](/en/learn/courses/sql-essentials/learning/advanced#example-80-pytest-rollback-integration)

---

← Previous: [9 · Project Management](../../project-management/drilling/overview.md) · Next: [Beginner Examples](./beginner.md) →
