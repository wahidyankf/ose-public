---
title: "Overview"
date: 2026-07-14T00:00:00+07:00
draft: false
weight: 1
---

This page is the spaced-repetition companion to the SQL Essentials primer: five fixed drills that
force active recall instead of passive re-reading. Work through them in order -- short-answer recall
first, then scenario judgment, then hands-on repetition against a real SQLite database, then a
checklist to confirm real automaticity, and finally why/why-not prompts that test whether you can
explain the reasoning -- including this topic's cross-cutting big idea, `mechanism-vs-policy` -- not
just execute the syntax. Every answer is hidden in a `<details>` block; try each item yourself before
opening it.

## Recall Q&A

Twenty-four short-answer questions, one per concept (`co-01` through `co-24`). Answer from memory,
then check.

**Q1 (co-01 -- relational-model).** What does it mean for data to be "modeled relationally," and how
does that differ from an in-memory structure connected by pointers?

<details>
<summary>Answer</summary>

Data lives in tables (relations) of rows and typed columns, and every fact is stored exactly once,
related to other facts by matching key _values_ rather than by memory addresses. An in-memory
structure connects records by pointers that only make sense while the process is alive; a relational
table's foreign-key values stay meaningful on disk, across processes, and across however many years
the data outlives the program that first wrote it.

</details>

**Q2 (co-02 -- primary-keys).** What does declaring a column `INTEGER PRIMARY KEY` do in SQLite, and
how does it relate to `rowid`?

<details>
<summary>Answer</summary>

It designates that column as the row's unique identifier, and in SQLite specifically, a
single-column `INTEGER PRIMARY KEY` becomes an alias for the table's internal `rowid` -- inserting
`NULL` (or omitting the column) makes SQLite auto-assign the next integer value for you, so you never
hand-manage ids.

</details>

**Q3 (co-03 -- foreign-keys).** What does a foreign key constraint do, and why do you have to
explicitly opt into it in SQLite?

<details>
<summary>Answer</summary>

A foreign key constrains a column to values matching a parent key (or to `NULL` when the child key
allows it). In SQLite, the referenced parent columns must be a primary key or collectively unique;
an enforced key also drives `ON DELETE` actions like `CASCADE` or `RESTRICT` (see
[SQLite foreign keys](https://www.sqlite.org/foreignkeys.html)).
SQLite disables foreign key enforcement by default for backward compatibility with older schemas --
you must run `PRAGMA foreign_keys = ON` on every connection where you want orphan rows rejected.

</details>

**Q4 (co-04 -- constraints).** Name the four column-level constraints this topic covers and the
invariant each one enforces.

<details>
<summary>Answer</summary>

`NOT NULL` forbids a missing value; `UNIQUE` forbids a duplicate value across the whole column;
`CHECK` forbids any value that fails a boolean expression you supply (e.g. `CHECK(price >= 0)`); and
`DEFAULT` supplies a value automatically when an `INSERT` omits that column.

</details>

**Q5 (co-05 -- normalization).** What problem does normalization (1NF -> 2NF -> 3NF) solve, and what
do you give up to get it?

<details>
<summary>Answer</summary>

It keeps every fact stored in exactly one place by splitting repeating groups and transitive
dependencies into their own tables, which prevents update anomalies -- e.g. a fact changing in one
row but not the other rows that duplicated it. The cost is more joins: recombining normalized data at
query time is more verbose than reading one wide, denormalized table.

</details>

**Q6 (co-06 -- column-types).** What is "type affinity" in SQLite, and how does it differ from the
rigid typing most other relational databases enforce?

<details>
<summary>Answer</summary>

SQLite assigns each column a _preferred_ storage class (INTEGER/TEXT/REAL/BLOB/NUMERIC) based on its
declared type, but it does not rigidly reject a value of a different class the way, say, a strictly
typed engine would -- the declared type _guides_ storage, it does not _enforce_ it. `typeof(column)`
reveals what storage class a given value actually landed as.

</details>

**Q7 (co-07 -- ddl-create-table).** What does `CREATE TABLE` do, and what command proves exactly what
definition SQLite stored?

<details>
<summary>Answer</summary>

`CREATE TABLE` declares a new relation: its name, its column list, and every constraint on it.
`.schema <table>` (a CLI dot-command) displays the table definition stored in `sqlite_schema`
(historically also called `sqlite_master`). SQLite normalizes parts of the original `CREATE` text
and later `ALTER TABLE` statements may change it, so inspect the stored definition rather than
assuming it is a byte-for-byte copy of your input (see
[SQLite's schema table](https://www.sqlite.org/schematab.html)).

</details>

**Q8 (co-08 -- select-projection-filtering).** In relational-algebra terms, what operation does a
`SELECT` column list perform, and what operation does `WHERE` perform?

<details>
<summary>Answer</summary>

The `SELECT` column list performs _projection_ -- choosing which columns come back; a plain
projection preserves rows, while `DISTINCT` or aggregates can reduce their number. `WHERE` performs
_selection_ -- choosing which rows come back, using comparisons,
`AND`/`OR`, `LIKE`, `IN`, `CASE`, or a subquery, never changing which columns are visible.

</details>

**Q9 (co-09 -- ordering-and-limiting).** What do `ORDER BY` and `LIMIT`/`OFFSET` each control, and how
do you combine them to fetch "page 2" of ten-row pages?

<details>
<summary>Answer</summary>

`ORDER BY` controls the _sequence_ rows come back in; `LIMIT` caps how many rows come back; `OFFSET`
skips a number of rows before that cap starts counting. `ORDER BY <col> LIMIT 10 OFFSET 10` sorts
first, then skips the first 10 (page 1) and returns the next 10 (page 2) -- ordering must come first
or "page 2" is meaningless.

</details>

**Q10 (co-10 -- insert).** What does a basic `INSERT` statement do, and what clause turns it into an
upsert?

<details>
<summary>Answer</summary>

`INSERT INTO table(columns) VALUES(...)` adds one or (with comma-separated tuples) many new rows.
Appending `ON CONFLICT(col) DO UPDATE SET ...` turns the same statement into an upsert -- insert if
the conflicting key is new, update in place if it already exists, instead of raising a constraint
error.

</details>

**Q11 (co-11 -- update).** What happens to an `UPDATE` statement if its `WHERE` clause is omitted
entirely?

<details>
<summary>Answer</summary>

The `SET` clause applies to _every single row_ in the table, not just the one you had in mind --
there is no implicit "current row" the way a cursor-based language might assume. This is the single
most dangerous omission in this whole topic (Kata 1).

</details>

**Q12 (co-12 -- delete).** What is `DELETE`'s equivalent of `UPDATE`'s missing-`WHERE` trap?

<details>
<summary>Answer</summary>

`DELETE FROM table` with no `WHERE` clause removes _every row_ in the table, not one -- the exact
same missing-filter danger as an unscoped `UPDATE`, just irreversible instead of merely wrong.

</details>

**Q13 (co-13 -- inner-join).** What rows does an inner join (`JOIN ... ON ...`) return, and what
happens to rows on either side that have no match?

<details>
<summary>Answer</summary>

An inner join returns only the rows where the join condition finds a match on _both_ sides -- a row
from either table with zero matches on the other side is silently dropped from the result entirely,
never appearing with NULLs or otherwise (Kata 3).

</details>

**Q14 (co-14 -- outer-join).** How does a `LEFT JOIN`'s result differ from an inner join's, and what
fills in for an unmatched right-side row?

<details>
<summary>Answer</summary>

A `LEFT JOIN` guarantees every row from the left table appears at least once in the result, even when
it has zero matches on the right -- unmatched right-side columns are filled with NULL instead of the
row being dropped. That NULL-filling is also what makes `LEFT JOIN ... WHERE right.id IS NULL` an
anti-join: it isolates exactly the left rows with no match at all.

</details>

**Q15 (co-15 -- aggregation).** What does `GROUP BY` do to a result set, and name at least four
aggregate functions you can apply within each group?

<details>
<summary>Answer</summary>

`GROUP BY <col>` collapses every row sharing the same value of `<col>` into a single summary row per
distinct value. Any of `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`, or `GROUP_CONCAT` can then summarize the
rows inside each group.

</details>

**Q16 (co-16 -- having-filter).** How does `HAVING` differ from `WHERE` in terms of _when_ its filter
applies relative to aggregation?

<details>
<summary>Answer</summary>

`WHERE` filters individual rows _before_ `GROUP BY` collapses them into groups -- it has no access to
aggregate values like `count(*)`. `HAVING` filters the already-formed _groups_, after aggregation has
run, so it can test conditions like `HAVING count(*) > 1` that only make sense once rows are already
summarized.

</details>

**Q17 (co-17 -- null-semantics).** Why does `WHERE column = NULL` never match any row, no matter what
is actually stored?

<details>
<summary>Answer</summary>

NULL means "unknown," and under SQL's three-valued logic, comparing anything to an unknown value --
including `NULL = NULL` -- yields NULL (neither true nor false), which `WHERE` treats as a non-match.
The only correct test for "is this value unknown" is `IS NULL` (or `IS NOT NULL` for the opposite);
`COALESCE(col, fallback)` substitutes a default when you want a NULL to read as a concrete value
instead.

</details>

**Q18 (co-18 -- transactions).** What guarantee does a transaction make about a group of writes, and
what construct lets you undo only _part_ of one without ending it?

<details>
<summary>Answer</summary>

A transaction (`BEGIN` ... `COMMIT`/`ROLLBACK`) makes every write inside it atomic as a group --
either all of them apply, or none do; there is no partially applied state a reader can ever observe.
`SAVEPOINT` creates a named point inside a still-open transaction that `ROLLBACK TO` can undo back
to, without ending the outer transaction or discarding writes made before the savepoint.

</details>

**Q19 (co-19 -- python-sqlite3-connection).** Name the four core lifecycle steps of a Python
`sqlite3` script, from opening a database to finalizing it.

<details>
<summary>Answer</summary>

`sqlite3.connect(path)` opens (or creates) the database file and returns a `Connection`; `.cursor()`
gets a cursor to run SQL through; `.execute(sql, params)` runs a statement; `.commit()` makes any
pending writes durable and `.close()` releases the connection -- skipping `.commit()` before
`.close()` silently discards uncommitted writes (Kata 6).

</details>

**Q20 (co-20 -- parameterized-queries).** Why does passing a value as a `?` placeholder rather than
splicing it into the SQL string neutralize SQL injection?

<details>
<summary>Answer</summary>

A `?` (or `:name`) placeholder tells the driver "this is a single opaque _value_, never SQL syntax"
-- the driver sends the query text and the value separately to the engine, so nothing the value
contains (quotes, `OR`, `;`, anything) can change the shape of the statement being executed. String
interpolation, by contrast, makes the value part of the SQL text itself before the engine ever sees
it, so a crafted value can add real clauses (Kata 4).

</details>

**Q21 (co-21 -- cursor-and-results).** What is the difference between `fetchone()` and `fetchall()`,
and what does setting `conn.row_factory = sqlite3.Row` change?

<details>
<summary>Answer</summary>

`fetchone()` returns the next single row (or `None` once exhausted), letting you stream through a
large result without holding it all in memory; `fetchall()` returns every remaining row as a list in
one call. Setting `row_factory = sqlite3.Row` changes how a _row_ itself is accessed -- from a plain
positional tuple (`row[0]`) to name-based access (`row["name"]`) as well, without giving up
tuple-style indexing.

</details>

**Q22 (co-22 -- schema-migration).** What makes an `ALTER TABLE ADD COLUMN` migration "safe" for
existing rows, and what does `PRAGMA user_version` track?

<details>
<summary>Answer</summary>

Adding a column with a `DEFAULT` value means every existing row instantly gets that default for the
new column -- no existing row becomes invalid or needs a separate backfill just to satisfy a
`NOT NULL` constraint on the new column. `PRAGMA user_version` is a single integer stored in the
database file itself that a migration script can read and bump, so a deploy script can tell "has this
migration already been applied to this exact file" and skip re-running it.

</details>

**Q23 (co-23 -- n-plus-1-avoidance).** What is the "N+1 query" problem, and name two different fixes
for it.

<details>
<summary>Answer</summary>

It is issuing one query to fetch N parent rows, then one _additional_ query per parent inside a loop
to fetch each parent's children -- N+1 total round trips for what should be a small, fixed number.
The two standard fixes are replacing the loop with a single `JOIN` query, or batching the child fetch
into one `WHERE id IN (?, ?, ...)` query (Kata 7).

</details>

**Q24 (co-24 -- cli-usage).** Name at least four `sqlite3` CLI dot-commands and what each one does.

<details>
<summary>Answer</summary>

Any four of: `.tables` (lists table names), `.schema` (echoes stored `CREATE TABLE` text), `.mode`
(sets output format, e.g. `column` or `csv`), `.output` (redirects query results to a file),
`.headers on` (prints a column-name header row), or `< file.sql` (feeding an entire script to the CLI
non-interactively) -- there is no GUI anywhere in this topic, every operation goes through the CLI
plus `PRAGMA` checks.

</details>

## Applied problems

Twelve scenarios. Each describes a task without naming the construct -- decide which SQL or Python
feature solves it, then check.

**AP1.** A monthly report needs per-author revenue totals, but only for authors whose combined
revenue exceeds $20 -- and out-of-print books must never count toward that total at all, not even to
be excluded later from the display.

<details>
<summary>Answer</summary>

Use both: `WHERE in_stock = 1 ... GROUP BY author_id HAVING sum(price) > 20`. `WHERE` excludes the
out-of-print rows _before_ aggregation ever runs, so they never contribute to the sum in the first
place; `HAVING` then filters the resulting per-author sums afterward. Using `HAVING` alone to exclude
out-of-print rows would still let their revenue count toward each sum first, since `HAVING` only
filters already-aggregated groups, not the raw rows that fed them.

</details>

**AP2.** A catalog report needs to list every author in the system alongside any books they have
published -- but a handful of newly signed authors with zero books published so far still need to
appear on the report by name, not silently disappear.

<details>
<summary>Answer</summary>

A `LEFT JOIN` from `author` to `book`, not an inner join. An inner join drops the zero-book side
entirely; `LEFT JOIN` keeps every row from the left table (`author`) regardless of whether it has any
matches (Kata 3).

</details>

**AP3.** A report needs to find every book whose `published_year` was never recorded, and a first
attempt using a plain equality test against SQL's NULL keyword returns zero rows, even though such
books clearly exist in the table.

<details>
<summary>Answer</summary>

`WHERE published_year IS NULL`, not `= NULL`. Under three-valued logic, `= NULL` never evaluates to
true no matter what is stored -- `IS NULL` is the dedicated operator for testing "unknown" (Kata 2).

</details>

**AP4.** A search-by-title feature takes free-text input straight from a web form and needs to safely
embed it into a `WHERE title LIKE ...` clause, without giving an attacker a way to inject arbitrary
SQL through that input box.

<details>
<summary>Answer</summary>

A parameterized query using a `?` or `:name` placeholder, never f-string/`.format`/`%`
interpolation. The driver binds the value as an opaque parameter, never as SQL text, so nothing the
input contains can change the query's shape (Kata 4).

</details>

**AP5.** A report page loads a list of 50 authors, then, for each one separately, issues a second
query to fetch just that author's books -- the page feels sluggish, and a query log shows 51 total
round trips for what should be a single page of data.

<details>
<summary>Answer</summary>

This is the N+1 query problem. Replace the per-author loop with one `JOIN` query, or one batched
`WHERE author_id IN (?, ?, ...)` query -- either collapses 51 round trips into 1 (Kata 7).

</details>

**AP6.** A nightly sync job needs to insert a row keyed by an external id if it is new, but update it
in place -- not raise a `UNIQUE`-constraint error -- if a row with that same id already exists.

<details>
<summary>Answer</summary>

`INSERT ... ON CONFLICT(id) DO UPDATE SET ...` -- an upsert. The same statement inserts on a new key
and updates on a colliding one, with no separate "does this row already exist?" query needed first.

</details>

**AP7.** A larger transaction handles three unrelated sub-tasks in sequence; if the second one fails
partway through, the first sub-task's writes need to stay intact, and only the second sub-task's work
should be undone -- restarting the whole transaction from scratch is not acceptable.

<details>
<summary>Answer</summary>

`SAVEPOINT` before the risky sub-task, then `ROLLBACK TO` that savepoint on failure. The outer
transaction stays open the whole time; only the work done since the savepoint is undone, and the
first sub-task's already-applied writes are untouched.

</details>

**AP8.** A migration script inserts a `book` row that references an `author_id` an earlier step in
the same script accidentally deleted, and the insert succeeds without complaint even though the
schema declares a `REFERENCES` clause on that column.

<details>
<summary>Answer</summary>

`PRAGMA foreign_keys = ON` was never set for that connection. SQLite disables foreign key enforcement
by default, so a `REFERENCES` clause is purely documentation until you explicitly turn enforcement on
(Kata 5).

</details>

**AP9.** A `book` table stores every contributing author's name as a single comma-separated string in
one `authors` text column, and a new report needs to count how many books each individual author has
written -- the comma-separated column makes that count awkward and error-prone to write.

<details>
<summary>Answer</summary>

Split the repeating group into its own table (a child or junction table holding one author per row)
-- 1NF normalization. A single column packing multiple values together is exactly the repeating-group
shape 1NF exists to eliminate.

</details>

**AP10.** A report function currently reads query results by numeric tuple index (`row[0]`,
`row[2]`), and every time a column gets added or reordered in the `SELECT` list, the indices silently
shift and the report starts reading the wrong column with no error raised.

<details>
<summary>Answer</summary>

Set `conn.row_factory = sqlite3.Row` and access columns by name (`row["title"]`) instead of position.
Name-based access is immune to a `SELECT` list being reordered or extended later.

</details>

**AP11.** A seed script inserts 500 rows one at a time inside a Python `for` loop, each with its own
`cur.execute(...)` call and its own round trip to the engine, and it is noticeably slower than it
needs to be for what is really one bulk load.

<details>
<summary>Answer</summary>

`cur.executemany("INSERT ... VALUES (?)", rows)` instead of looping over `cur.execute(...)` per row
-- one Python-level call driving the same 500 inserts, with far less per-row call overhead.

</details>

**AP12.** A deploy script needs to apply an additive schema migration exactly once, even if the
deploy is retried after a partial failure and the same script runs again against the same database
file -- running the identical `ALTER TABLE ADD COLUMN` a second time would error.

<details>
<summary>Answer</summary>

`PRAGMA user_version` tracks a single integer inside the database file itself. Read it before
migrating, bump it after, and skip the migration entirely if the stored version already reflects it
-- the migration becomes idempotent across retries.

</details>

## Code katas

Eight hands-on repetition drills against a real SQLite database. Each is a before/after `.sql` or
typed `.py` file colocated under `drilling/code/`. Every "before" script is real and runnable and
misapplies the concept being drilled -- run it yourself, diagnose the bug from the observed output,
fix it from memory, then compare your fix against the "after" script and the model solution before
checking your work against the actually-executed output shown.

### Kata 1 -- forgotten WHERE on UPDATE

**Task.** `UPDATE book SET price = 0` is meant to put exactly one book (id 2) on a free promo. The
version below is broken: without a `WHERE` clause, `UPDATE` has no way to know which row you meant,
so it rewrites every row's price to zero.

**Before** (`drilling/code/kata-01-forgotten-where-update/before/kata.sql`)

```sql
-- Kata 1 (before): UPDATE with no WHERE zeroes every row, not just the intended one.
DROP TABLE IF EXISTS book;
CREATE TABLE book(id INTEGER PRIMARY KEY, title TEXT NOT NULL, price REAL NOT NULL);
INSERT INTO book(title, price) VALUES
    ('Refactoring', 45.00),
    ('Domain-Driven Design', 55.00),
    ('Clean Code', 35.00);

.headers on
.mode column

-- intent: put ONE book (id 2) on a free promo -- the WHERE clause is missing.
UPDATE book SET price = 0;

SELECT id, title, price FROM book ORDER BY id;
```

**Observed (buggy) output** (captured by actually running `sqlite3 app.db < kata.sql` -- all three
prices went to zero, not just book 2's):

```text
id  title                 price
--  --------------------  -----
1   Refactoring           0.0
2   Domain-Driven Design  0.0
3   Clean Code            0.0
```

**After** (`drilling/code/kata-01-forgotten-where-update/after/kata.sql`)

```sql
-- Kata 1 (after): the WHERE clause narrows the UPDATE to the one intended row.
DROP TABLE IF EXISTS book;
CREATE TABLE book(id INTEGER PRIMARY KEY, title TEXT NOT NULL, price REAL NOT NULL);
INSERT INTO book(title, price) VALUES
    ('Refactoring', 45.00),
    ('Domain-Driven Design', 55.00),
    ('Clean Code', 35.00);

.headers on
.mode column

-- THE FIX: WHERE id = 2 scopes the write to exactly the row the promo applies to.
UPDATE book SET price = 0 WHERE id = 2;

SELECT id, title, price FROM book ORDER BY id;
```

<details>
<summary>Model solution</summary>

```sql
-- THE FIX: WHERE id = 2 (co-11) scopes the write to exactly the row the promo
-- applies to -- UPDATE without WHERE has no concept of "the row I meant."
UPDATE book
SET
  price = 0
WHERE
  id = 2;

SELECT
  id,
  title,
  price
FROM
  book
ORDER BY
  id;

-- => only row 2's price changed
```

**Root cause**: `UPDATE table SET ...` applies its `SET` clause to _every row currently in the
table_ unless a `WHERE` clause narrows it -- there is no implicit "current row" the way a
cursor-based or spreadsheet-style tool might assume. Omitting `WHERE` is not a smaller version of the
bug; it is the single most common way to silently destroy production data with one keystroke's
difference from the safe version.

**Run**: `sqlite3 app.db < kata.sql`

**Output**:

```text
id  title                 price
--  --------------------  -----
1   Refactoring           45.0
2   Domain-Driven Design  0.0
3   Clean Code            35.0
```

</details>

### Kata 2 -- NULL equality bug

**Task.** A report needs every book whose `published_year` was never recorded. The version below
tests `published_year = NULL`, which never matches anything, no matter how many books really do have
an unrecorded year.

**Before** (`drilling/code/kata-02-null-equality-bug/before/kata.sql`)

```sql
-- Kata 2 (before): WHERE column = NULL never matches under three-valued logic.
DROP TABLE IF EXISTS book;
CREATE TABLE book(id INTEGER PRIMARY KEY, title TEXT NOT NULL, published_year INTEGER);
INSERT INTO book(title, published_year) VALUES
    ('The Mythical Man-Month', 1975),
    ('Unknown Draft', NULL),
    ('Peopleware', 1987);

.headers on
.mode column

-- intent: find every book whose published_year was never recorded.
SELECT id, title FROM book WHERE published_year = NULL;
```

**Observed (buggy) output** (captured by actually running `sqlite3 app.db < kata.sql` -- zero rows,
even though "Unknown Draft" has a NULL `published_year`; `.headers on`/`.mode column` print nothing
at all for an empty result set):

```text

```

**After** (`drilling/code/kata-02-null-equality-bug/after/kata.sql`)

```sql
-- Kata 2 (after): IS NULL is the correct test for "unknown", not =.
DROP TABLE IF EXISTS book;
CREATE TABLE book(id INTEGER PRIMARY KEY, title TEXT NOT NULL, published_year INTEGER);
INSERT INTO book(title, published_year) VALUES
    ('The Mythical Man-Month', 1975),
    ('Unknown Draft', NULL),
    ('Peopleware', 1987);

.headers on
.mode column

-- THE FIX: IS NULL, not = NULL, matches rows whose value is unknown.
SELECT id, title FROM book WHERE published_year IS NULL;
```

<details>
<summary>Model solution</summary>

```sql
-- THE FIX: IS NULL (co-17), not = NULL, is the correct test for "value unknown".
SELECT
  id,
  title
FROM
  book
WHERE
  published_year IS NULL;

-- => matches the one row whose published_year was never recorded
```

**Root cause**: NULL means "unknown" under SQL's three-valued logic -- comparing anything to NULL,
including with `=`, yields NULL, and `WHERE` discards any row whose condition is not literally true.
`IS NULL` is a distinct operator built specifically to test for "unknown," which is why it is the
only correct way to find NULL values.

**Run**: `sqlite3 app.db < kata.sql`

**Output**:

```text
id  title
--  -------------
2   Unknown Draft
```

</details>

### Kata 3 -- inner join drops rows

**Task.** A report is meant to list every author in the catalog alongside any books they have
published. The version below uses an inner join, which silently drops authors who have zero books --
exactly the two authors the report was supposed to surface as "needs books."

**Before** (`drilling/code/kata-03-inner-join-drops-rows/before/kata.sql`)

```sql
-- Kata 3 (before): an inner join silently drops authors with zero books.
DROP TABLE IF EXISTS book;
DROP TABLE IF EXISTS author;
CREATE TABLE author(id INTEGER PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE book(id INTEGER PRIMARY KEY, title TEXT NOT NULL, author_id INTEGER REFERENCES author(id));
INSERT INTO author(name) VALUES
    ('Ada Lovelace'),
    ('Grace Hopper'),
    ('Margaret Hamilton');
-- Grace Hopper (id 2) and Margaret Hamilton (id 3) have zero books each so far.
INSERT INTO book(title, author_id) VALUES ('Notes on the Analytical Engine', 1);

.headers on
.mode column

-- intent: list every author in the catalog, alongside any books they've published.
SELECT author.name, book.title
FROM author
JOIN book ON book.author_id = author.id
ORDER BY author.name;
```

**Observed (buggy) output** (captured by actually running `sqlite3 app.db < kata.sql` -- only Ada
Lovelace appears; Grace Hopper and Margaret Hamilton vanish entirely instead of showing up with no
books):

```text
name          title
------------  ------------------------------
Ada Lovelace  Notes on the Analytical Engine
```

**After** (`drilling/code/kata-03-inner-join-drops-rows/after/kata.sql`)

```sql
-- Kata 3 (after): LEFT JOIN keeps every author, filling unmatched book columns with NULL.
DROP TABLE IF EXISTS book;
DROP TABLE IF EXISTS author;
CREATE TABLE author(id INTEGER PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE book(id INTEGER PRIMARY KEY, title TEXT NOT NULL, author_id INTEGER REFERENCES author(id));
INSERT INTO author(name) VALUES
    ('Ada Lovelace'),
    ('Grace Hopper'),
    ('Margaret Hamilton');
INSERT INTO book(title, author_id) VALUES ('Notes on the Analytical Engine', 1);

.headers on
.mode column
.nullvalue NULL

-- THE FIX: LEFT JOIN keeps every left-side (author) row, even with zero matches.
SELECT author.name, book.title
FROM author
LEFT JOIN book ON book.author_id = author.id
ORDER BY author.name;
```

<details>
<summary>Model solution</summary>

```sql
-- THE FIX: LEFT JOIN (co-14) keeps every author row, even ones with zero matching
-- books -- unmatched book columns come back as NULL instead of the row vanishing.
SELECT
  author.name,
  book.title
FROM
  author
  LEFT JOIN book ON book.author_id = author.id
ORDER BY
  author.name;

-- => all three authors appear; Grace Hopper and Margaret Hamilton show a NULL title
```

**Root cause**: An inner join (`JOIN`) only returns rows where both sides find a match -- an author
with zero books contributes zero rows to an inner join's result and simply disappears from the
output, with no error or warning. `LEFT JOIN` guarantees every row from the left table (`author`)
appears at least once, substituting NULL for any unmatched right-side (`book`) column.

**Run**: `sqlite3 app.db < kata.sql`

**Output**:

```text
name               title
-----------------  ------------------------------
Ada Lovelace       Notes on the Analytical Engine
Grace Hopper       NULL
Margaret Hamilton  NULL
```

</details>

### Kata 4 -- unparameterized query

**Task.** `find_author_by_name` should safely look up an author by a caller-supplied name. The
version below builds the `WHERE` clause with an f-string, so a crafted search value can inject its
own SQL and match every row in the table instead of none.

**Before** (`drilling/code/kata-04-unparameterized-query/before/kata.py`)

```python
# pyright: strict
"""Kata 4 (before): a WHERE clause built via string interpolation -- injectable."""

import sqlite3


def find_author_by_name(conn: sqlite3.Connection, name: str) -> list[tuple[int, str]]:
    cur = conn.cursor()
    # THE BUG: f-string interpolation lets the caller's input become SQL syntax,
    # not just a value -- the query text itself changes shape based on input.
    query = f"SELECT id, name FROM author WHERE name = '{name}'"
    cur.execute(query)
    return cur.fetchall()


conn: sqlite3.Connection = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE author(id INTEGER PRIMARY KEY, name TEXT NOT NULL)")
conn.executemany(
    "INSERT INTO author(name) VALUES (?)",
    [("Ada Lovelace",), ("Grace Hopper",)],
)
conn.commit()

# a crafted search value: no author is actually named this, but the OR clause
# it injects makes the WHERE condition true for every row in the table.
malicious_input: str = "nobody' OR '1'='1"
print(find_author_by_name(conn, malicious_input))
conn.close()
```

**Observed (buggy) output** (captured by actually running `python3 kata.py` -- both authors come
back, even though no author is named `"nobody' OR '1'='1"`):

```text
[(1, 'Ada Lovelace'), (2, 'Grace Hopper')]
```

**After** (`drilling/code/kata-04-unparameterized-query/after/kata.py`)

```python
# pyright: strict
"""Kata 4 (after): a parameterized query neutralizes the same injection attempt."""

import sqlite3


def find_author_by_name(conn: sqlite3.Connection, name: str) -> list[tuple[int, str]]:
    cur = conn.cursor()
    # THE FIX: ? is a placeholder, not a splice point -- the driver binds `name`
    # as a single opaque value, so it can never change the shape of the query.
    cur.execute("SELECT id, name FROM author WHERE name = ?", (name,))
    return cur.fetchall()


conn: sqlite3.Connection = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE author(id INTEGER PRIMARY KEY, name TEXT NOT NULL)")
conn.executemany(
    "INSERT INTO author(name) VALUES (?)",
    [("Ada Lovelace",), ("Grace Hopper",)],
)
conn.commit()

malicious_input: str = "nobody' OR '1'='1"
print(find_author_by_name(conn, malicious_input))
conn.close()
```

<details>
<summary>Model solution</summary>

```python
def find_author_by_name(conn: sqlite3.Connection, name: str) -> list[tuple[int, str]]:
    cur = conn.cursor()
    # THE FIX: ? is a placeholder (co-20), not a splice point -- the driver binds
    # `name` as one opaque value, so it can never change the shape of the query.
    cur.execute("SELECT id, name FROM author WHERE name = ?", (name,))
    return cur.fetchall()


malicious_input: str = "nobody' OR '1'='1"
print(find_author_by_name(conn, malicious_input))  # => Output: [] (correctly zero matches)
```

**Root cause**: Building `f"... WHERE name = '{name}'"` makes the caller's input part of the SQL
_text itself_ -- a value crafted with an embedded `' OR '1'='1` does not just fail to match, it adds
a real `OR` clause that makes the whole condition true for every row. A `?` placeholder sends the
value to the engine as a bound parameter, entirely separate from the query text, so no character
sequence inside it can ever be interpreted as SQL syntax.

**Run**: `python3 kata.py`

**Output**:

```text
[]
```

</details>

### Kata 5 -- foreign key not enforced

**Task.** `book.author_id` declares `REFERENCES author(id)`. The version below inserts a book row
whose `author_id` does not exist in `author` at all, and the insert succeeds without complaint,
because no connection in this script ever turned foreign key enforcement on.

**Before** (`drilling/code/kata-05-foreign-key-not-enforced/before/kata.sql`)

```sql
-- Kata 5 (before): PRAGMA foreign_keys is OFF by default -- an orphan insert succeeds silently.
DROP TABLE IF EXISTS book;
DROP TABLE IF EXISTS author;
CREATE TABLE author(id INTEGER PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE book(id INTEGER PRIMARY KEY, title TEXT NOT NULL, author_id INTEGER REFERENCES author(id));
INSERT INTO author(name) VALUES ('Ada Lovelace');

.headers on
.mode column

-- BUG: author_id 99 does not exist in author -- no PRAGMA foreign_keys=ON was ever set,
-- so SQLite does not enforce the REFERENCES clause for this connection.
INSERT INTO book(title, author_id) VALUES ('Ghost Reference', 99);

SELECT id, title, author_id FROM book;
```

**Observed (buggy) output** (captured by actually running `sqlite3 app.db < kata.sql` -- the orphan
row inserts and shows up in the `SELECT`, with no error anywhere):

```text
id  title            author_id
--  ---------------  ---------
1   Ghost Reference  99
```

**After** (`drilling/code/kata-05-foreign-key-not-enforced/after/kata.sql`)

```sql
-- Kata 5 (after): PRAGMA foreign_keys=ON rejects the same orphan insert.
DROP TABLE IF EXISTS book;
DROP TABLE IF EXISTS author;
-- THE FIX: turn on enforcement for this connection BEFORE any writes happen.
PRAGMA foreign_keys = ON;

CREATE TABLE author(id INTEGER PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE book(id INTEGER PRIMARY KEY, title TEXT NOT NULL, author_id INTEGER REFERENCES author(id));
INSERT INTO author(name) VALUES ('Ada Lovelace');

.headers on
.mode column

-- author_id 99 still does not exist -- this insert is now rejected.
INSERT INTO book(title, author_id) VALUES ('Ghost Reference', 99);

SELECT id, title, author_id FROM book;
```

<details>
<summary>Model solution</summary>

```sql
-- THE FIX: turn on enforcement (co-03) for this connection BEFORE any writes happen.
PRAGMA foreign_keys = ON;

-- author_id 99 still does not exist -- this insert is now rejected outright.
INSERT INTO
  book (title, author_id)
VALUES
  ('Ghost Reference', 99);

-- => the statement fails; zero rows are inserted (SQLite statements fail atomically)
```

**Root cause**: SQLite disables foreign key enforcement by default for backward compatibility with
database files created before FK support existed -- a `REFERENCES` clause in `CREATE TABLE` is purely
documentation until `PRAGMA foreign_keys = ON` is set on that specific connection. With it set, the
same orphan insert that silently succeeded before now fails outright, and because SQLite statements
fail atomically, the failed `INSERT` touches zero rows -- there is no partial write to clean up.

**Run**: `sqlite3 app.db < kata.sql`

**Output**:

```text
Runtime error near line 15: FOREIGN KEY constraint failed (19)
```

The script does not halt -- `sqlite3`'s non-interactive default does not stop on the first error, so
the trailing `SELECT id, title, author_id FROM book;` still runs. It prints nothing because the
rejected `INSERT` never touched `book`, so the query legitimately returns zero rows, and
`.headers on`/`.mode column` print nothing at all for an empty result set (the same mechanism Kata 2
uses above). That is exactly the point: the orphan row was never created to select.

</details>

### Kata 6 -- missing commit

**Task.** A script inserts an author row through one connection, closes it, then opens a _fresh_
connection to the same database file to confirm the write landed. The version below never calls
`.commit()` before `.close()`, so the fresh connection sees an empty table.

**Before** (`drilling/code/kata-06-missing-commit/before/kata.py`)

```python
# pyright: strict
"""Kata 6 (before): insert-then-close with no commit() -- the write never reaches disk."""

import os
import sqlite3

DB_PATH: str = "kata.db"

if os.path.exists(DB_PATH):
    os.remove(DB_PATH)

conn1: sqlite3.Connection = sqlite3.connect(DB_PATH)
conn1.execute("CREATE TABLE author(id INTEGER PRIMARY KEY, name TEXT NOT NULL)")
conn1.commit()  # the schema itself IS committed, so the table persists

conn1.execute("INSERT INTO author(name) VALUES ('Ada Lovelace')")
# THE BUG: no conn1.commit() here -- close() below discards the open transaction.
conn1.close()

# a completely fresh connection to the SAME file -- proves what actually landed on disk.
conn2: sqlite3.Connection = sqlite3.connect(DB_PATH)
rows: list[tuple[int, str]] = conn2.execute("SELECT id, name FROM author").fetchall()
print(rows)
conn2.close()
os.remove(DB_PATH)
```

**Observed (buggy) output** (captured by actually running `python3 kata.py` -- the author row is
gone, even though the `INSERT` itself never raised an error):

```text
[]
```

**After** (`drilling/code/kata-06-missing-commit/after/kata.py`)

```python
# pyright: strict
"""Kata 6 (after): an explicit commit() before close() makes the write durable."""

import os
import sqlite3

DB_PATH: str = "kata.db"

if os.path.exists(DB_PATH):
    os.remove(DB_PATH)

conn1: sqlite3.Connection = sqlite3.connect(DB_PATH)
conn1.execute("CREATE TABLE author(id INTEGER PRIMARY KEY, name TEXT NOT NULL)")
conn1.commit()

conn1.execute("INSERT INTO author(name) VALUES ('Ada Lovelace')")
# THE FIX: commit() BEFORE close() -- the write is durable before the connection ends.
conn1.commit()
conn1.close()

conn2: sqlite3.Connection = sqlite3.connect(DB_PATH)
rows: list[tuple[int, str]] = conn2.execute("SELECT id, name FROM author").fetchall()
print(rows)
conn2.close()
os.remove(DB_PATH)
```

<details>
<summary>Model solution</summary>

```python
conn1.execute("INSERT INTO author(name) VALUES ('Ada Lovelace')")
# THE FIX: commit() (co-18/co-19) BEFORE close() -- the write is durable before
# the connection that made it ever goes away.
conn1.commit()
conn1.close()

conn2: sqlite3.Connection = sqlite3.connect(DB_PATH)
rows: list[tuple[int, str]] = conn2.execute("SELECT id, name FROM author").fetchall()
print(rows)  # => Output: [(1, 'Ada Lovelace')] -- the row survived the connection swap
```

**Root cause**: `sqlite3`'s default `isolation_level` opens an implicit transaction before the first
data-modifying statement, and that transaction stays open -- uncommitted -- until `.commit()` is
called explicitly. `.close()` does not commit a pending transaction on your behalf; it simply ends
the connection, and the uncommitted `INSERT` never reached durable storage, so a fresh connection to
the same file sees a table that is still empty.

**Run**: `python3 kata.py`

**Output**:

```text
[(1, 'Ada Lovelace')]
```

</details>

### Kata 7 -- N+1 query loop

**Task.** `books_by_author` should return every author's list of book titles. The version below
fetches the author list with one query, then issues a _second_ query per author inside a loop --
N+1 total round trips for N authors, when a single join would do.

**Before** (`drilling/code/kata-07-n-plus-1-loop/before/kata.py`)

```python
# pyright: strict
"""Kata 7 (before): one SELECT per author inside a loop -- N+1 round trips."""

import sqlite3


def books_by_author(conn: sqlite3.Connection) -> dict[str, list[str]]:
    query_count: int = 0
    result: dict[str, list[str]] = {}
    cur = conn.cursor()
    cur.execute("SELECT id, name FROM author")
    authors: list[tuple[int, str]] = cur.fetchall()
    query_count += 1
    for author_id, name in authors:
        # THE BUG: one fresh SELECT for EVERY author, instead of one query total.
        cur.execute("SELECT title FROM book WHERE author_id = ?", (author_id,))
        titles: list[str] = [row[0] for row in cur.fetchall()]
        query_count += 1
        result[name] = titles
    print(f"queries issued: {query_count}")
    return result


conn: sqlite3.Connection = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE author(id INTEGER PRIMARY KEY, name TEXT NOT NULL)")
conn.execute(
    "CREATE TABLE book(id INTEGER PRIMARY KEY, title TEXT NOT NULL, author_id INTEGER)"
)
conn.executemany(
    "INSERT INTO author(name) VALUES (?)",
    [("Ada Lovelace",), ("Grace Hopper",), ("Alan Turing",)],
)
conn.executemany(
    "INSERT INTO book(title, author_id) VALUES (?, ?)",
    [
        ("Notes", 1),
        ("COBOL Manual", 2),
        ("Compiler Notes", 2),
        ("On Computable Numbers", 3),
    ],
)
conn.commit()

print(books_by_author(conn))
conn.close()
```

**Observed (buggy) output** (captured by actually running `python3 kata.py` -- correct data, but 4
queries for 3 authors, one query more than the round trip count should ever grow to as authors are
added):

```text
queries issued: 4
{'Ada Lovelace': ['Notes'], 'Grace Hopper': ['COBOL Manual', 'Compiler Notes'], 'Alan Turing': ['On Computable Numbers']}
```

**After** (`drilling/code/kata-07-n-plus-1-loop/after/kata.py`)

```python
# pyright: strict
"""Kata 7 (after): one LEFT JOIN replaces the per-author loop -- a single round trip."""

import sqlite3


def books_by_author(conn: sqlite3.Connection) -> dict[str, list[str]]:
    query_count: int = 0
    result: dict[str, list[str]] = {}
    cur = conn.cursor()
    # THE FIX: one LEFT JOIN fetches every author-book pair (or lone author) at once.
    cur.execute(
        "SELECT author.name, book.title FROM author "
        "LEFT JOIN book ON book.author_id = author.id "
        "ORDER BY author.name"
    )
    rows: list[tuple[str, str | None]] = cur.fetchall()
    query_count += 1
    for name, title in rows:
        result.setdefault(name, [])
        if title is not None:
            result[name].append(title)
    print(f"queries issued: {query_count}")
    return result


conn: sqlite3.Connection = sqlite3.connect(":memory:")
conn.execute("CREATE TABLE author(id INTEGER PRIMARY KEY, name TEXT NOT NULL)")
conn.execute(
    "CREATE TABLE book(id INTEGER PRIMARY KEY, title TEXT NOT NULL, author_id INTEGER)"
)
conn.executemany(
    "INSERT INTO author(name) VALUES (?)",
    [("Ada Lovelace",), ("Grace Hopper",), ("Alan Turing",)],
)
conn.executemany(
    "INSERT INTO book(title, author_id) VALUES (?, ?)",
    [
        ("Notes", 1),
        ("COBOL Manual", 2),
        ("Compiler Notes", 2),
        ("On Computable Numbers", 3),
    ],
)
conn.commit()

print(books_by_author(conn))
conn.close()
```

<details>
<summary>Model solution</summary>

```python
def books_by_author(conn: sqlite3.Connection) -> dict[str, list[str]]:
    query_count: int = 0
    result: dict[str, list[str]] = {}
    cur = conn.cursor()
    # THE FIX: one LEFT JOIN (co-13/co-14/co-23) fetches every author-book pair
    # (or lone author) in a single round trip, instead of one query per author.
    cur.execute(
        "SELECT author.name, book.title FROM author "
        "LEFT JOIN book ON book.author_id = author.id "
        "ORDER BY author.name"
    )
    rows: list[tuple[str, str | None]] = cur.fetchall()
    query_count += 1  # => exactly ONE query, regardless of how many authors exist
    for name, title in rows:
        result.setdefault(name, [])
        if title is not None:
            result[name].append(title)
    print(f"queries issued: {query_count}")  # => Output line 1: queries issued: 1
    return result
```

**Root cause**: The buggy version issues one `SELECT` to list authors, then a _second_ `SELECT` per
author inside the loop -- N+1 total round trips for N authors, each one paying its own overhead even
against a local file. Replacing the loop with one `LEFT JOIN` (kept instead of an inner join
specifically so authors with zero books still appear) fetches every author-book pair the query needs
in exactly one round trip, regardless of how many authors exist.

**Run**: `python3 kata.py`

**Output**:

```text
queries issued: 1
{'Ada Lovelace': ['Notes'], 'Alan Turing': ['On Computable Numbers'], 'Grace Hopper': ['COBOL Manual', 'Compiler Notes']}
```

</details>

### Kata 8 -- non-grouped column

**Task.** A per-author report groups `book` rows by `author_id` and also selects `book.title`
directly, even though `title` is neither aggregated nor part of `GROUP BY`. SQLite permits this
leniently and silently picks one arbitrary title per group instead of raising an error, which
surprises anyone expecting the stricter behavior of other engines.

**Before** (`drilling/code/kata-08-non-grouped-column/before/kata.sql`)

```sql
-- Kata 8 (before): title is neither aggregated nor in GROUP BY -- SQLite leniently
-- picks ONE arbitrary row's title per group instead of raising an error.
DROP TABLE IF EXISTS book;
CREATE TABLE book(id INTEGER PRIMARY KEY, title TEXT NOT NULL, author_id INTEGER NOT NULL, price REAL NOT NULL);
INSERT INTO book(title, author_id, price) VALUES
    ('Notes on the Analytical Engine', 1, 12.00),
    ('Sketch of the Analytical Engine', 1, 18.00),
    ('COBOL Manual', 2, 9.50);

.headers on
.mode column

-- BUG: title is a non-aggregated, non-grouping column -- which title does author_id
-- 1's group report back, when it has TWO distinct titles?
SELECT author_id, title, count(*) AS book_count, sum(price) AS total_price
FROM book
GROUP BY author_id;
```

**Observed (buggy) output** (captured by actually running `sqlite3 app.db < kata.sql` -- author_id
1's group shows only one of its two real titles, with no error or warning that a column was dropped
arbitrarily):

```text
author_id  title                           book_count  total_price
---------  ------------------------------  ----------  -----------
1          Notes on the Analytical Engine  2           30.0
2          COBOL Manual                    1           9.5
```

**After** (`drilling/code/kata-08-non-grouped-column/after/kata.sql`)

```sql
-- Kata 8 (after): group_concat aggregates every title per group explicitly.
DROP TABLE IF EXISTS book;
CREATE TABLE book(id INTEGER PRIMARY KEY, title TEXT NOT NULL, author_id INTEGER NOT NULL, price REAL NOT NULL);
INSERT INTO book(title, author_id, price) VALUES
    ('Notes on the Analytical Engine', 1, 12.00),
    ('Sketch of the Analytical Engine', 1, 18.00),
    ('COBOL Manual', 2, 9.50);

.headers on
.mode column
.width 10 70 12 12

-- THE FIX: group_concat(title, sep) is a real aggregate -- it names EVERY title
-- in the group explicitly, instead of silently picking one.
SELECT author_id, group_concat(title, '; ') AS titles, count(*) AS book_count, sum(price) AS total_price
FROM book
GROUP BY author_id;
```

<details>
<summary>Model solution</summary>

```sql
-- THE FIX: group_concat(title, sep) (co-15) is a genuine aggregate -- it names
-- EVERY title in the group explicitly, instead of SQLite silently picking one.
SELECT
  author_id,
  group_concat (title, '; ') AS titles,
  count(*) AS book_count,
  sum(price) AS total_price
FROM
  book
GROUP BY
  author_id;

-- => author_id 1's group now correctly shows BOTH of its titles, not just one
```

**Root cause**: SQLite's `GROUP BY` is lenient about non-aggregated, non-grouping columns in the
`SELECT` list -- rather than raising an error the way a stricter engine's default mode would, it
silently picks one arbitrary row's value for that column per group. `title` is neither wrapped in an
aggregate function nor listed in `GROUP BY`, so `author_id` 1's group (with two distinct titles)
reports back only one of them, and which one is an implementation detail, not a guarantee. Wrapping
`title` in a real aggregate (`group_concat`) makes every title in the group explicit instead of
leaving one silently dropped.

**Run**: `sqlite3 app.db < kata.sql`

**Output**:

```text
author_id   titles                                                                  book_count    total_price
----------  ----------------------------------------------------------------------  ------------  ------------
1           Notes on the Analytical Engine; Sketch of the Analytical Engine         2             30.0
2           COBOL Manual                                                            1             9.5
```

</details>

## Self-check checklist

Confirm each item without checking the manual first. If you hesitate, that concept needs another
pass.

- [ ] I can explain what it means for data to be "modeled relationally" instead of connected by
      in-memory pointers. (co-01)
- [ ] I can write a `CREATE TABLE` with an `INTEGER PRIMARY KEY` and explain how it aliases SQLite's
      rowid. (co-02)
- [ ] I can explain why `PRAGMA foreign_keys=ON` is required before SQLite enforces a `REFERENCES`
      clause. (co-03)
- [ ] I can name all four column-level constraints and the invariant each one enforces. (co-04)
- [ ] I can split a repeating-group column into a child table and explain which normal form the split
      satisfies. (co-05)
- [ ] I can explain SQLite's type affinity and predict what `typeof()` reports for a mismatched
      value. (co-06)
- [ ] I can write a `CREATE TABLE` statement and confirm what SQLite stored with `.schema`. (co-07)
- [ ] I can write a `SELECT` with a `WHERE` clause combining `AND`/`OR`/`LIKE`/`IN` and explain
      projection versus selection. (co-08)
- [ ] I can write `ORDER BY ... LIMIT ... OFFSET ...` to fetch a specific page of results. (co-09)
- [ ] I can write a multi-row `INSERT` and an `ON CONFLICT` upsert. (co-10)
- [ ] I can predict what happens to an `UPDATE` statement that omits its `WHERE` clause. (co-11)
- [ ] I can predict what happens to a `DELETE` statement that omits its `WHERE` clause. (co-12)
- [ ] I can write an inner join and explain what happens to rows on either side with no match.
      (co-13)
- [ ] I can write a `LEFT JOIN` and explain how it differs from an inner join for unmatched rows.
      (co-14)
- [ ] I can write a `GROUP BY` query using at least three different aggregate functions. (co-15)
- [ ] I can explain the difference between `WHERE` and `HAVING` in terms of when each one filters.
      (co-16)
- [ ] I can explain why `= NULL` never matches and write the correct `IS NULL` test instead. (co-17)
- [ ] I can write a transaction with a `SAVEPOINT` and explain what `ROLLBACK TO` undoes. (co-18)
- [ ] I can write the four-step lifecycle of a Python `sqlite3` script, from `connect` to `close`.
      (co-19)
- [ ] I can write a parameterized query with `?` and explain why it neutralizes SQL injection.
      (co-20)
- [ ] I can explain the difference between `fetchone()`/`fetchall()` and what `sqlite3.Row` changes.
      (co-21)
- [ ] I can write an additive `ALTER TABLE ADD COLUMN` migration and explain what
      `PRAGMA user_version` tracks. (co-22)
- [ ] I can recognize an N+1 query pattern and name two different fixes for it. (co-23)
- [ ] I can name at least four `sqlite3` CLI dot-commands and what each one does. (co-24)
- [ ] I can explain, in one sentence, why SQL lets you declare _what_ result you want and leaves _how_
      to fetch it entirely to the query planner. (`mechanism-vs-policy`)

## Elaborative interrogation & self-explanation

Six why/why-not prompts. Answer each in your own words before opening the model explanation.

**E1.** Why is SQL declarative -- you describe the result you want -- rather than a step-by-step
imperative loop over rows the way a general-purpose language would express the same query? Tie your
answer to `mechanism-vs-policy`.

<details>
<summary>Model explanation</summary>

SQL asks you to state the _policy_ -- the shape of the result you want ("every book with its author's
name, ordered by price") -- and leaves the _mechanism_ -- which index to scan, which join algorithm
to use, in what order to visit the tables -- entirely to the query planner. If SQL were imperative,
every query would also have to encode a specific execution strategy, and that strategy would need
rewriting by hand every time the data grew, an index appeared, or the storage engine changed.
Declarative SQL means the exact same `SELECT ... JOIN ... WHERE ...` text can get faster over years of
engine improvements and schema changes without a single line of application code changing -- the
mechanism is free to evolve because it was never specified in the first place. That separation is
`mechanism-vs-policy` in its purest form.

</details>

**E2.** Why does SQLite ship with foreign key enforcement OFF by default, rather than always-on the
way most other relational databases behave?

<details>
<summary>Model explanation</summary>

SQLite predates its own foreign-key support (added years after the file format was already widely
deployed), and turning enforcement on by default for every existing database file would have silently
started rejecting writes that had worked for years -- a breaking change hidden inside a routine
version upgrade. Making enforcement an explicit per-connection `PRAGMA foreign_keys = ON` keeps old
schemas and scripts working exactly as they always did, while letting any new code opt into the
stricter guarantee deliberately. The cost, as Kata 5 shows directly, is that forgetting the PRAGMA is
silent -- an orphaned row inserts without complaint -- so every connection that cares about
referential integrity has to remember to ask for it explicitly.

</details>

**E3.** Why can `expression = NULL` never evaluate to true under SQL's three-valued logic, instead of
the engine simply raising an error to warn you the comparison is meaningless?

<details>
<summary>Model explanation</summary>

NULL represents "unknown," not "empty" or "zero" -- and comparing any value to something genuinely
unknown can only honestly produce "unknown" as the answer, never a hard true or false. SQL encodes
that honesty directly into three-valued logic: every comparison involving NULL evaluates to NULL, and
`WHERE` only keeps rows whose condition evaluates to true, so a NULL result is silently treated the
same as false. Raising an error instead would treat every accidental `= NULL` as a hard failure, which
sounds safer, but it would also make NULL impossible to combine into larger boolean expressions
(`WHERE a = 1 AND b = NULL`) without every such expression crashing the whole query -- three-valued
logic lets NULL propagate through arbitrarily complex conditions predictably, at the cost of `= NULL`
being a trap for anyone who reaches for the wrong operator (Kata 2).

</details>

**E4.** Why does normalization trade query complexity -- more joins -- for write-safety, instead of
keeping data in one wide, easy-to-query table?

<details>
<summary>Model explanation</summary>

A wide, denormalized table duplicates every fact wherever it is needed for convenient reading, but
that duplication means a single real-world fact -- an author's name, say -- now lives in as many rows
as that author has books. Every `UPDATE` to that fact must remember to touch every duplicate copy, and
any `UPDATE` that misses even one copy leaves the database internally inconsistent with no error
raised anywhere. Normalization moves each fact back to exactly one row in exactly one table, so an
`UPDATE` to that fact is a single-row write with no possibility of a stale duplicate elsewhere -- the
price is that reading the combined view back out now requires a `JOIN` to recombine what normalization
split apart.

</details>

**E5.** Why must a transaction's `ROLLBACK` undo every write inside it atomically, rather than leaving
whichever writes had already succeeded in place?

<details>
<summary>Model explanation</summary>

The entire reason to group writes into a transaction in the first place is that some of them are only
individually meaningful in combination -- a debit from one account and a credit to another only make
sense together; a debit with no matching credit is simply money disappearing. If a failure partway
through could leave some writes applied and others not, every reader querying the database in that
window would see a state that never should have been observable at all, and no caller could ever
safely assume "if I see any of this transaction's writes, I see all of them." Atomic rollback is what
makes a transaction's boundary a real boundary -- readers only ever see the state from before the
transaction started, or the complete state after it commits, with nothing in between.

</details>

**E6.** Why are parameterized queries safe against SQL injection at the engine level, rather than
merely "escaping" dangerous characters in the input string?

<details>
<summary>Model explanation</summary>

Escaping tries to neutralize specific characters (quotes, semicolons) after the fact, inside a string
that is still ultimately going to be parsed as SQL syntax -- it is a defense that has to anticipate
every dangerous character an attacker might use, and history is full of escaping schemes that missed
an edge case. A parameterized query sidesteps the whole category of problem: the SQL text and the
value are sent to the engine as two entirely separate pieces of information from the start, and the
value is never parsed as SQL syntax at all, no matter what characters it contains. There is no
escaping step to get wrong, because there is no point at which the value and the query text are ever
combined into one string in the first place (Kata 4).

</details>

---

← Previous: [Capstone](../learning/capstone/overview.md)
