---
title: "Overview"
date: 2026-07-18T00:00:00+07:00
draft: false
weight: 1
---

This page is the spaced-repetition companion to the Build Your Own ORM & Query Builder topic: five
fixed drills that force active recall instead of passive re-reading. Work through them in order --
short-answer recall first, then scenario judgment, then hands-on repetition against real runnable
Python scripts, then a checklist to confirm real automaticity, and finally why/why-not prompts that
test whether you can explain the reasoning -- including this topic's cross-cutting big idea,
`abstraction-and-its-cost` -- not just execute the syntax. Every answer is hidden in a `<details>`
block; try each item yourself before opening it. Together, the five drills below touch every one of
this topic's 25 concepts and cite specific examples spanning all 78 worked examples in the Beginner,
Intermediate, and Advanced tiers, plus the capstone.

## Recall Q&A

Twenty-five short-answer questions, one per concept. Answer from memory before opening each answer.

**Q1 (co-01 -- SQL as Data).** What does representing a query as a clause tree (data) buy you that a
raw SQL string doesn't, before anything ever executes?

<details>
<summary>Answer</summary>

A clause tree is a genuine Python value -- you can read its fields, walk it, compare two trees, and
compile the same tree twice, all without ever touching a database or re-parsing text. A raw string
only reveals its structure by being re-parsed; nothing about it is inspectable as data (Example 1
represents a single column reference as a data node and proves rendering is deferred; Example 2
extends it to a table-qualified node).

</details>

**Q2 (co-02 -- Parameterized SQL).** Why must a bound value ALWAYS render to a literal `?`
placeholder, no matter what the value itself contains?

<details>
<summary>Answer</summary>

Because the only way to guarantee a value can never change what the SQL statement DOES is to never
let it become part of the SQL text at all -- the driver treats a bound parameter as pure data, so a
value containing `'; DROP TABLE users;--` stays an inert string, never a second statement.
Interpolating it directly into the string (Kata 2's bug) reopens exactly this risk (Example 3 binds a
deliberately hostile string and proves the targeted table survives; Example 4 compiles two bound
values and verifies the params list stays left-to-right).

</details>

**Q3 (co-03 -- Immutable Fluent Builder).** What does returning a brand-new builder instance from
every method (instead of mutating the receiver) actually protect against?

<details>
<summary>Answer</summary>

It protects a shared, partially-built base query from ever being corrupted by ONE caller's branch
leaking into another's -- since nothing about the original instance can change, two callers can
safely start from the same base and add their own filters independently, with no aliasing bug
possible (Example 5 proves `.where()` never changes the original; Example 6 branches one shared base
into two independent variants; Kata 1 reproduces the mutable-default-argument version of exactly this
leak).

</details>

**Q4 (co-04 -- SELECT-Clause Composition).** Why does composing a SELECT from independent
columns/FROM/JOIN fragments matter, versus building the whole SELECT text as one big string?

<details>
<summary>Answer</summary>

Each fragment -- `.select()`, `.from_()`, `.join()` -- contributes its own piece independently, so
adding a JOIN never requires touching the code that renders columns, and each fragment stays
independently testable and independently correct (Example 7 lists explicit columns in call order;
Example 8 attaches FROM; Example 9 shows the `SELECT *` default; Example 10 adds a JOIN with its ON
predicate).

</details>

**Q5 (co-05 -- WHERE-Clause Composition).** How does the WHERE-clause boolean tree stay correctly
parenthesized when AND and OR nest inside each other?

<details>
<summary>Answer</summary>

Each `And`/`Or` combinator is a node that knows it is one, and the compiler wraps its own rendered
output in parentheses on every recursive step -- a query never has to reason about implicit operator
precedence, because every level of the tree renders its own explicit grouping (Example 11 compiles a
single equality; Example 12/13 combine two predicates with AND/OR; Example 14 covers `<`, `>`, `!=`,
`IN`; Example 15 nests a real three-leaf tree).

</details>

**Q6 (co-06 -- ORDER BY / LIMIT Composition).** Why are `LIMIT` and `OFFSET` bound as parameters
instead of inlined as literal numbers, given they're "just numbers"?

<details>
<summary>Answer</summary>

Treating them as ordinary bound parameters keeps the builder's "always parameterize" guarantee
uniform across every clause -- carving out "this literal is safe because it's just a number" as a
special case is exactly the kind of exception that's easy to get wrong later, or to forget applies
somewhere else too (Example 16 appends ORDER BY; Example 17 adds DESC; Example 18 parameterizes
LIMIT/OFFSET together against real seeded rows).

</details>

**Q7 (co-07 -- INSERT / UPDATE / DELETE Builders).** What do `insert()`, `update()`, and `delete()`
reuse from the SELECT machinery already built, and why does that matter?

<details>
<summary>Answer</summary>

All three reuse the exact same `Predicate` protocol SELECT's WHERE already uses, so the
parameterization guarantee (co-02) and the composability guarantee (co-05) apply uniformly to every
write path too -- there is no separate, easier-to-get-wrong code path just for mutations (Example 19
builds a parameterized INSERT; Example 20 an UPDATE whose SET params precede its WHERE params;
Example 21 a DELETE scoped by WHERE).

</details>

**Q8 (co-08 -- Compile to SQL and Params).** Why must `compile()` be pure -- reading only `self`,
touching no database, mutating nothing?

<details>
<summary>Answer</summary>

A hard boundary between "building a query" (pure data + pure function) and "running a query" (the
driver) means the builder can be fully tested with no database required, and the same compiled
`(sql, params)` tuple can be logged, cached, or replayed exactly and deterministically -- calling
`compile()` twice on the same builder must never mutate the builder or share mutable state between the
two returned params lists (Example 22 asserts the return value is genuinely a 2-tuple; Example 23
proves purity directly).

</details>

**Q9 (co-09 -- Table Metadata Registration).** What breaks silently when the query builder and the
row mapper each keep their own idea of a table's columns, instead of reading from one shared
registry?

<details>
<summary>Answer</summary>

The builder's column list and the mapper's column list can drift apart without either side noticing --
a column renamed in one place and not the other becomes a `KeyError` far from its actual cause,
discovered only when a query actually runs. One registry means exactly one place to update (Example
27 registers columns and a primary key; Example 28 builds a SELECT whose column order matches
registration; Example 29 reads the primary key back out).

</details>

**Q10 (co-10 -- Row-to-Object Mapping).** What does a mapper give you that reading `row[0]`, `row[1]`,
... by hand at every call site does not?

<details>
<summary>Answer</summary>

Centralizing "which column goes to which attribute" in one function means a schema change gets fixed
in exactly one place, instead of every caller having to remember column order (or names) and re-derive
the mapping independently -- a fragile, easy-to-desync duplication otherwise (Example 30 maps a tuple
by column order; Example 31 maps a dict by column name; Example 32 maps a whole `fetchall()` to a list
of objects).

</details>

**Q11 (co-11 -- Object-to-Row Mapping).** Why does mapping an object back to an UPDATE's SET dict need
to EXCLUDE the primary key column specifically?

<details>
<summary>Answer</summary>

The primary key identifies WHICH row the UPDATE targets (via WHERE) -- including it in SET as well
would attempt to rewrite the very column the statement uses to find the row, which for an immutable PK
column the database itself rejects (Example 33 reads an object into an INSERT-ready dict; Example 34
builds an UPDATE SET dict excluding the PK; Example 35 round-trips object-row-object and proves
equality).

</details>

**Q12 (co-12 -- Type Coercion on Load).** Why does SQLite specifically need an explicit
type-coercion step that, say, a database with native boolean and date types would not?

<details>
<summary>Answer</summary>

SQLite's storage types are only `NULL`, `INTEGER`, `REAL`, `TEXT`, `BLOB` -- there is no native
boolean or date type at all, so a "boolean" column is actually an integer at the storage level, and
without an explicit coercion step every caller would have to remember that and compare against `1` by
hand, every time (Example 36 coerces `0`/`1` to `bool` on load; Example 37 an ISO string to `date`;
Example 38 coerces both back on store; Example 39 registers a custom converter; Kata 8 reproduces the
`is True` failure this coercion prevents).

</details>

**Q13 (co-13 -- Identity Map).** What does `a is b` for two loads of the same primary key actually
guarantee, and what does it make possible later?

<details>
<summary>Answer</summary>

It guarantees exactly one in-memory object per primary key within a session -- two loads of the same
row return the identical instance, not two independent copies that can silently drift apart when one
is mutated. That guarantee is a precondition for the unit of work's dirty tracking (co-17) to even
make sense (Example 40 loads the same PK twice and asserts identity; Example 41 asserts distinct
instances for distinct keys; Example 42 shows a miss then a hit issuing no second query; Example 43
keys by `(table, pk)`; Kata 3 reproduces the two-independent-copies bug directly).

</details>

**Q14 (co-14 -- Weak-Reference Identity Map).** Why does backing the identity map with a
`WeakValueDictionary` matter specifically for a long-running session?

<details>
<summary>Answer</summary>

A plain dict-backed identity map keeps every object it ever loaded alive for the whole session's
lifetime, even after every caller has finished with it -- a slow, silent memory leak for a
long-running worker or REPL. A `WeakValueDictionary` lets an entry disappear the moment nothing else
in the program still references its object, so the cache tracks the program's actual live working set
(Example 44 proves an entry drops after GC; Example 45 loads many rows, drops references, and proves
the map shrinks).

</details>

**Q15 (co-15 -- Session as Transaction Boundary).** Why must the session be the ONLY object that ever
calls `commit()` or `rollback()` on its connection?

<details>
<summary>Answer</summary>

Scattering `commit()` calls across unrelated functions makes it impossible to reason about what's
actually atomic -- two writes meant to succeed or fail together could end up split across two separate
implicit transactions the moment anything outside the session commits early. A session that owns the
boundary exclusively is the one place transaction scope is decided (Example 46 shows one connection
shared across every query; Example 47 begin/write/commit persists; Example 48 begin/write/rollback
leaves the row absent; Example 49 uses the session as a context manager).

</details>

**Q16 (co-16 -- Unit of Work -- New Tracking).** Why does `session.add(obj)` only record the object
in a "new" set, instead of issuing its INSERT immediately?

<details>
<summary>Answer</summary>

Recording it in a set (not writing immediately) is what lets the unit of work batch every pending
write into a single flush, and -- combined with flush ordering (co-19) -- insert a parent before the
child that references it, all inside one transaction, regardless of what order objects were added in
(Example 55 calls `.add()` and asserts the new-set; Example 56 flushes it and asserts exactly one
INSERT).

</details>

**Q17 (co-17 -- Unit of Work -- Dirty Tracking).** Why must the load-time attribute snapshot be taken
BEFORE the caller has any chance to mutate the object?

<details>
<summary>Answer</summary>

Dirty detection works by comparing an object's current state against that snapshot -- if the snapshot
is taken AFTER a mutation already happened, the snapshot matches the already-changed state and nothing
is ever detected as dirty, no matter what actually changed (Example 50 takes the load-time snapshot;
Example 57 mutates and detects dirty; Example 58 proves only the changed column appears in the UPDATE;
Example 59 proves an unmodified object emits no UPDATE; Kata 4 reproduces the snapshot-taken-too-late
bug directly).

</details>

**Q18 (co-18 -- Unit of Work -- Deleted Tracking).** Why is `session.delete(obj)` a distinct,
explicit tracked action, rather than "just drop every reference to the object"?

<details>
<summary>Answer</summary>

In a garbage-collected language, releasing a reference is NOT the same operation as deleting a
database row -- conflating the two is a common source of "why is this row still here" bugs. An
explicit deleted-set makes deletion a first-class, trackable intent that the flush step can act on,
independent of Python's own reference counting (Example 60 calls `.delete()` and asserts the
deleted-set; Example 61 flushes it and asserts exactly one DELETE).

</details>

**Q19 (co-19 -- Flush Ordering).** What specific ordering rule does a flush apply to INSERTs, and
what's the mirror-image rule for DELETEs?

<details>
<summary>Answer</summary>

INSERTs of parent rows happen BEFORE INSERTs of rows that reference them by foreign key; DELETEs of
child rows happen BEFORE DELETEs of the parents they reference -- flushing in an arbitrary order
(say, insertion order into the tracked sets) would frequently violate the FK constraint the database
itself enforces (Example 62 proves a parent's INSERT precedes its FK-dependent child's; Example 63
proves a child's DELETE precedes its parent's; Kata 5 reproduces the exact `IntegrityError` the wrong
order produces).

</details>

**Q20 (co-20 -- Atomic Transaction Flush).** Why must an ENTIRE flush -- every new, dirty, and
deleted write together -- commit or roll back as one transaction?

<details>
<summary>Answer</summary>

A flush that commits some writes and fails partway through the rest leaves the database in a state no
application logic ever intended -- half a batch persisted, the rest not. Wrapping the whole flush in
one transaction makes "all or nothing" the only possible outcome, and a successful flush clears the
tracking sets afterward so the next flush starts clean (Example 64 commits a mixed batch together;
Example 65 injects a mid-flush error and proves a full rollback; Example 66 proves the sets are empty
after success).

</details>

**Q21 (co-21 -- Descriptor-Protocol Lazy Load).** What two things does a Python descriptor need to
implement to defer a relationship's query until first access, and cache it per-instance afterward?

<details>
<summary>Answer</summary>

`__set_name__` (PEP 487) lets the descriptor learn its own attribute name at class-definition time;
`__get__` is what actually runs the deferred query, and caches the result so a SECOND access on the
same object issues no additional query (Example 67 proves the query is deferred until access; Example
68 uses `__set_name__` to bind the descriptor's own name; Example 69 accesses the lazy attribute twice
and proves only one query runs).

</details>

**Q22 (co-22 -- N+1 from Lazy Loading).** Precisely why does iterating N parent objects and touching
a lazy relationship on each one issue N+1 queries total, and what's the arithmetic fix?

<details>
<summary>Answer</summary>

One query loads the N parents; then each parent's first access to its lazy relationship issues its own
separate query -- N additional queries, N+1 total. Batching the child load into one extra query
(fetching every child row for the whole current batch of parents via `WHERE customer_id IN (...)`)
collapses N+1 down to exactly 2, regardless of how large N is (Example 70 counts N+1 real queries in a
log; Example 71 adds the eager batch load and proves exactly 2; Kata 6 reproduces both counts
directly).

</details>

**Q23 (co-23 -- Connection/Cursor Wiring).** What is the ONE exact boundary where the builder's
output shape and the driver's input shape must match, per PEP 249?

<details>
<summary>Answer</summary>

`compile()`'s `(sql, params)` output is exactly the pair `cursor.execute(sql, params)` consumes --
nothing in the builder ever imports or calls into the driver directly, which is what keeps pure query
construction and real I/O cleanly separable and independently testable, with the driver boundary
crossed in exactly one place per query (Example 24 feeds a compiled tuple into a real cursor; Example
25 walks the full connect/cursor/execute/fetch/close lifecycle explicitly).

</details>

**Q24 (co-24 -- Schema Migration Runner).** What does a `schema_version` tracking table let a
migration runner do that a bare sequence of DDL scripts, run in order, cannot?

<details>
<summary>Answer</summary>

It records WHICH migrations already ran, so re-running the migration runner against an
already-migrated database is a safe no-op instead of re-executing DDL that has already applied (and
typically fails the second time, e.g. `CREATE TABLE` against a table that already exists) -- Kata 7
reproduces exactly that crash and its fix (Example 72 applies ordered scripts; Example 73 records
applied versions and proves a re-run skips them; Example 74 applies out-of-order files and proves they
still run in version order).

</details>

**Q25 (co-25 -- Fully Typed Builder API).** What does a fully type-annotated public API actually buy
over a working-but-untyped one, given both execute correctly at runtime?

<details>
<summary>Answer</summary>

An ORM's whole value proposition is hiding raw SQL rows behind typed Python objects -- if the
resulting API is untyped (or typed `Any` anywhere), that hiding buys nothing, because every caller
still has to know the underlying row shape by convention rather than by the type checker catching a
mismatch before the query ever runs. Generics (`session.get[T](pk) -> T`) and explicit return types
let `pyright --strict` verify the whole stack, including the deliberate, explicitly
`# type: ignore[override]`-marked exceptions where the query DSL intentionally overrides
`object.__eq__` (Example 26 confirms a typed fluent chain is `pyright --strict` clean; Example 54
types `session.get[T]`; Example 77 runs `pyright --strict` over the whole stack).

</details>

## Applied problems

Ten scenarios. Each describes a symptom without naming the concept -- decide which one applies, then
check.

**AP1.** A developer, in a hurry, writes `sql = f"SELECT * FROM {table} WHERE id = {user_input}"`
directly, bypassing the query builder entirely because "the builder felt like overkill for one
query."

<details>
<summary>Answer</summary>

Skipping the builder throws away BOTH the clause-as-data guarantee (co-01 -- nothing here is
inspectable before it runs) and parameterization (co-02 -- `user_input` is now literally part of the
SQL text). This is exactly Kata 2's bug, reached by a different path: hand-writing an f-string instead
of ever touching the builder at all.

</details>

**AP2.** Two request handlers share one module-level `Builder("customers").where(col("active") ==
True)` "base query" constant, and each handler calls `.where(...)` again to add its own filter before
compiling and executing. After a deploy, one handler's results occasionally include the OTHER
handler's filter too, but only under concurrent load.

<details>
<summary>Answer</summary>

This is the mutable-builder leak (co-03) -- if `.where()` genuinely always returns a NEW instance
(never mutates the receiver), sharing one base object between two handlers is safe by construction,
regardless of concurrency. The symptom described can only happen if `.where()` secretly mutates
`self.wheres` in place, which is precisely Kata 1's bug, reproduced under load instead of two
sequential calls.

</details>

**AP3.** A column named `email` is renamed to `email_address` in the underlying SQLite table via a
migration. The query builder immediately starts producing a correct new query for it, but the row
mapper starts raising `KeyError: 'email'` on every load.

<details>
<summary>Answer</summary>

This is metadata drift from having no single shared registry (co-09) -- the builder and the mapper
each read their OWN idea of the table's columns instead of one shared source, so updating the column
name in only one place leaves the other silently out of sync until it fails at runtime, far from the
actual rename.

</details>

**AP4.** After loading a `Customer`, changing one attribute, then mapping it back to an UPDATE
`.set()` dict, the generated UPDATE statement includes the primary key column itself in its SET list --
and the write fails.

<details>
<summary>Answer</summary>

Object-to-row mapping (co-11) forgot to exclude the primary key from the SET dict -- the PK identifies
WHICH row the UPDATE targets via WHERE; including it in SET as well tries to rewrite the very column
used to find the row (Example 34 builds the SET dict correctly, excluding the PK).

</details>

**AP5.** A `signup_date` column stores an ISO string, but a report iterates loaded customers and
calls `.signup_date.year`, crashing with `AttributeError: 'str' object has no attribute 'year'`.

<details>
<summary>Answer</summary>

This is a missing type-coercion-on-load step (co-12) -- the exact same class of bug Kata 8 reproduces
for `bool`, here applied to `date`. Without an explicit coercion, the loaded attribute is whatever raw
type SQLite actually stored (`TEXT`), not the type the domain object declared (Example 37 coerces an
ISO string to `date` on load).

</details>

**AP6.** A long-running batch worker loads millions of rows over a multi-hour run through a plain
dict-backed identity map, holding no other reference to most of them after each row finishes
processing -- the worker's memory grows without bound.

<details>
<summary>Answer</summary>

This is the case a weak-reference identity map (co-14) exists for -- a plain dict keeps every loaded
object alive for the whole session's lifetime regardless of whether anything else still references it.
Backing the map with a `WeakValueDictionary` lets an entry disappear the moment the caller's own
reference to it does (Example 45 loads many rows, drops references, and proves the map shrinks under
GC).

</details>

**AP7.** A helper function grabs the session's connection and calls `conn.commit()` on it directly,
bypassing `session.commit()`. Later in the same request, an unrelated error triggers
`session.rollback()`, expected to undo everything since the transaction began -- but the earlier write
survives the rollback.

<details>
<summary>Answer</summary>

This violates the session-as-sole-transaction-owner rule (co-15) -- calling `commit()` directly on the
connection ends the transaction boundary early, splitting what should have been one atomic unit into
two separate ones. Only the session should ever call `commit()`/`rollback()` on its own connection.

</details>

**AP8.** `session.add(new_customer)` is called, but the caller never calls `session.flush()` and
never uses `with Session() as s:` -- the code just lets the session object go out of scope with no
error raised. The customer row was never inserted.

<details>
<summary>Answer</summary>

This is the deferred nature of new-object tracking (co-16) working exactly as designed but never
triggered -- `session.add()` only records the object in a "new" SET; nothing writes to the database
until an actual `flush()` runs (or a context-managed session exits cleanly and flushes on the way out).
No flush call, no INSERT, no error -- the write was simply never asked for.

</details>

**AP9.** `del my_customer` (dropping the last Python reference) is run instead of
`session.delete(my_customer)`, on the assumption that "removing the reference removes the row." The
row is still present on the next query.

<details>
<summary>Answer</summary>

Deleted tracking (co-18) is a distinct, explicit action for exactly this reason -- releasing a Python
reference is invisible to the unit of work and does nothing to the underlying row. Only
`session.delete(obj)`, recorded in the deleted-set and acted on at flush time, produces a real DELETE.

</details>

**AP10.** A teammate adds a new relationship helper that returns `Any` instead of a real generic
type. `pyright --strict` still reports zero errors across the whole stack, and a caller later passes
the wrong type into it -- nothing catches the mistake until it fails at runtime.

<details>
<summary>Answer</summary>

This is exactly what the fully typed API (co-25) exists to prevent -- `pyright --strict` treats `Any`
as compatible with everything, silently, even with strict mode on everywhere else. A single `Any`
boundary anywhere throws away the "IDE/type-checker catches a mismatched type before the query runs"
guarantee for every caller downstream of it, not just at that one call site.

</details>

## Code katas

Eight hands-on repetition drills against a real local SQLite database (`:memory:`, PEP 249 stdlib
`sqlite3`). Each is a before/after `.py` file colocated under `drilling/code/`. Every "before" script
is real and runnable and misapplies the concept being drilled -- run it yourself, diagnose the bug
from the observed output, fix it from memory, then compare your fix against the "after" script and the
model solution before checking your work against the actually-executed output shown. Every kata Python
script is fully type-annotated and `pyright --strict` clean (via the `# pyright: strict` file-level
directive this topic's own examples already use).

### Kata 1 -- a mutable default argument leaks WHERE clauses across every new Builder instance

_relates to co-03, Example 5_

**Task.** `b2 = Builder("orders")` never calls `.where()` at all, so it should compile to a plain,
unfiltered `SELECT`. The version below is broken: `wheres: list[str] = []` as a default argument
creates exactly ONE list object, shared by every `Builder` call that never passes its own list -- `b1`
mutating "its" list actually mutates the SAME list `b2` silently inherited.

**Before** (`drilling/code/kata-01-mutable-default-where/before/kata.py`)

```python
# pyright: strict
"""Kata 1 (before): a mutable default argument makes a "builder" leak WHERE clauses
across EVERY instance that never explicitly passes its own list (co-03)."""


class Builder:
    def __init__(self, table: str, wheres: list[str] = []) -> None:  # BUG: the SAME list, shared forever
        self.table = table
        self.wheres = wheres  # not copied -- aliases the ONE default list object every call re-uses

    def where(self, clause: str) -> "Builder":
        self.wheres.append(clause)  # mutates the SHARED default list, not a per-instance one
        return self

    def compile(self) -> str:
        if self.wheres:
            return f"SELECT * FROM {self.table} WHERE {' AND '.join(self.wheres)}"
        return f"SELECT * FROM {self.table}"


# intent: b2 never calls .where() at all -- it should compile to a plain, unfiltered SELECT.
b1 = Builder("customer").where("id = 1")
b2 = Builder("orders")
print(b1.compile())
print(b2.compile())
```

**Observed (buggy) output** (captured by actually running `python3 kata.py` -- `b2` picks up `b1`'s
`id = 1` filter even though `b2` never called `.where()`):

```text
SELECT * FROM customer WHERE id = 1
SELECT * FROM orders WHERE id = 1
```

**After** (`drilling/code/kata-01-mutable-default-where/after/kata.py`)

```python
# pyright: strict
"""Kata 1 (after): a None default plus a fresh list built INSIDE __init__ gives every
instance its OWN wheres list -- nothing leaks across instances anymore (co-03)."""


class Builder:
    def __init__(self, table: str, wheres: list[str] | None = None) -> None:  # THE FIX: None, not []
        self.table = table
        self.wheres = wheres if wheres is not None else []  # a FRESH list, built fresh on EVERY call

    def where(self, clause: str) -> "Builder":
        self.wheres.append(clause)  # mutates THIS instance's own list, never a shared one
        return self

    def compile(self) -> str:
        if self.wheres:
            return f"SELECT * FROM {self.table} WHERE {' AND '.join(self.wheres)}"
        return f"SELECT * FROM {self.table}"


b1 = Builder("customer").where("id = 1")
b2 = Builder("orders")  # gets its OWN empty list -- b1's clause cannot possibly reach it
print(b1.compile())
print(b2.compile())
```

<details>
<summary>Model solution</summary>

**Root cause**: Python evaluates a `def`'s default argument value exactly ONCE, at function-definition
time -- not once per call. `wheres: list[str] = []` therefore creates a single list object bound to
every future call that doesn't pass its own `wheres` explicitly, and mutating it via `.append()`
mutates that ONE shared object for every instance relying on the default. Switching the default to
`None` and building a genuinely fresh `[]` inside `__init__` (evaluated on EVERY call) gives every
instance its own independent list, restoring the immutable-builder guarantee co-03 depends on.

**Run**: `python3 kata.py`

**Output**:

```text
SELECT * FROM customer WHERE id = 1
SELECT * FROM orders
```

</details>

### Kata 2 -- an f-string WHERE clause lets a hostile value change what the query does

_relates to co-02, Example 3_

**Task.** Looking up a customer by a name that happens to contain a single quote should return
whatever rows genuinely match that literal string -- nothing more. The version below is broken: the
name is interpolated directly into the SQL text, so a value that is ALSO valid SQL syntax changes what
the statement does.

**Before** (`drilling/code/kata-02-string-interpolated-where/before/kata.py`)

```python
# pyright: strict
"""Kata 2 (before): building WHERE with an f-string interpolates the value directly
into the SQL text -- a value containing SQL syntax changes what the statement DOES (co-02)."""

import contextlib
import sqlite3


def find_by_name(conn: sqlite3.Connection, name: str) -> list[tuple[int, str]]:
    # BUG: the value is interpolated straight into the SQL text, not bound as a parameter.
    sql = f"SELECT id, name FROM customer WHERE name = '{name}'"
    return conn.execute(sql).fetchall()


with contextlib.closing(sqlite3.connect(":memory:")) as conn:
    conn.execute("CREATE TABLE customer(id INTEGER PRIMARY KEY, name TEXT)")
    conn.executemany("INSERT INTO customer(name) VALUES (?)", [("Ada",), ("Bob",)])
    conn.commit()

    # intent: look up a customer whose name genuinely contains a single quote.
    hostile = "x' OR '1'='1"  # a value that is ALSO valid SQL syntax once interpolated
    rows = find_by_name(conn, hostile)
    print(rows)
```

**Observed (buggy) output** (captured by actually running `python3 kata.py` -- both `Ada` and `Bob`
come back, even though NEITHER customer is named `x' OR '1'='1`):

```text
[(1, 'Ada'), (2, 'Bob')]
```

**After** (`drilling/code/kata-02-string-interpolated-where/after/kata.py`)

```python
# pyright: strict
"""Kata 2 (after): a bound "?" placeholder treats the value as pure data -- the SQL text
never changes shape no matter what the value contains (co-02)."""

import contextlib
import sqlite3


def find_by_name(conn: sqlite3.Connection, name: str) -> list[tuple[int, str]]:
    # THE FIX: the value is bound as a parameter -- never part of the SQL text at all.
    sql = "SELECT id, name FROM customer WHERE name = ?"
    return conn.execute(sql, (name,)).fetchall()


with contextlib.closing(sqlite3.connect(":memory:")) as conn:
    conn.execute("CREATE TABLE customer(id INTEGER PRIMARY KEY, name TEXT)")
    conn.executemany("INSERT INTO customer(name) VALUES (?)", [("Ada",), ("Bob",)])
    conn.commit()

    hostile = "x' OR '1'='1"  # the EXACT same value -- now inert, treated as literal data
    rows = find_by_name(conn, hostile)
    print(rows)
```

<details>
<summary>Model solution</summary>

**Root cause**: `f"... = '{name}'"` folds `name`'s literal characters into the SQL text itself before
the driver ever sees it -- a value containing `' OR '1'='1` doesn't just fill in a string literal, it
rewrites the WHERE clause's boolean logic entirely, matching every row. A bound `?` parameter is never
part of the SQL text; the driver passes it to SQLite as pure data, so its contents can never change
what the statement's syntax means, regardless of what characters it contains.

**Run**: `python3 kata.py`

**Output**:

```text
[]
```

</details>

### Kata 3 -- loading the same primary key twice with no identity map returns two objects that silently drift apart

_relates to co-13, Example 40_

**Task.** Two "loads" of the same row, from two different parts of a program, should see the SAME
in-memory state once one of them is renamed. The version below is broken: every `load()` call runs a
fresh query and builds a brand-new object, with no cache checking whether that primary key was already
loaded.

**Before** (`drilling/code/kata-03-missing-identity-map/before/kata.py`)

```python
# pyright: strict
"""Kata 3 (before): loading the same primary key twice with NO identity map produces
TWO separate objects that silently drift apart the moment either one is mutated (co-13)."""

import contextlib
import dataclasses
import sqlite3


@dataclasses.dataclass
class Customer:
    id: int
    name: str


def load(conn: sqlite3.Connection, pk: int) -> Customer:
    # BUG: every call runs a fresh query and builds a BRAND NEW object -- no cache anywhere.
    row = conn.execute("SELECT id, name FROM customer WHERE id = ?", (pk,)).fetchone()
    return Customer(id=row[0], name=row[1])


with contextlib.closing(sqlite3.connect(":memory:")) as conn:
    conn.execute("CREATE TABLE customer(id INTEGER PRIMARY KEY, name TEXT)")
    conn.execute("INSERT INTO customer VALUES (1, 'Ada')")
    conn.commit()

    # intent: two "loads" of the same row, in two different parts of a program, should
    # see the SAME in-memory state once one of them is renamed.
    a = load(conn, 1)
    b = load(conn, 1)
    a.name = "Ada Renamed"  # mutates ONLY a's copy -- the database itself is untouched here
    print(a is b, a.name, b.name)
```

**Observed (buggy) output** (captured by actually running `python3 kata.py` -- `a` and `b` are
different objects, and renaming `a` leaves `b` still showing the stale `"Ada"`):

```text
False Ada Renamed Ada
```

**After** (`drilling/code/kata-03-missing-identity-map/after/kata.py`)

```python
# pyright: strict
"""Kata 3 (after): a per-session {pk: object} cache guarantees the SECOND load of the SAME
primary key returns the IDENTICAL object the first load already produced (co-13)."""

import contextlib
import dataclasses
import sqlite3


@dataclasses.dataclass
class Customer:
    id: int
    name: str


class IdentityMap:  # THE FIX: a cache keyed by primary key, checked BEFORE any new object is built
    def __init__(self) -> None:
        self._cache: dict[int, Customer] = {}

    def load(self, conn: sqlite3.Connection, pk: int) -> Customer:
        if pk in self._cache:  # a cache HIT -- return the SAME object, no query at all
            return self._cache[pk]
        row = conn.execute("SELECT id, name FROM customer WHERE id = ?", (pk,)).fetchone()
        customer = Customer(id=row[0], name=row[1])
        self._cache[pk] = customer  # registered BEFORE returning -- the NEXT load() call hits this entry
        return customer


with contextlib.closing(sqlite3.connect(":memory:")) as conn:
    conn.execute("CREATE TABLE customer(id INTEGER PRIMARY KEY, name TEXT)")
    conn.execute("INSERT INTO customer VALUES (1, 'Ada')")
    conn.commit()

    identity_map = IdentityMap()
    a = identity_map.load(conn, 1)
    b = identity_map.load(conn, 1)
    a.name = "Ada Renamed"  # mutates the ONE shared object -- b sees it too, because a IS b
    print(a is b, a.name, b.name)
```

<details>
<summary>Model solution</summary>

**Root cause**: without a cache checked BEFORE constructing a new object, every `load()` call is
independent -- there is no mechanism connecting the second call to the first, so Python has no reason
to return anything but a brand-new `Customer`. An identity map keyed by primary key, checked first and
populated before returning, guarantees the SECOND load of the same key returns the object the FIRST
load already built -- `a is b` becomes true, and mutating one mutates the only object that exists.

**Run**: `python3 kata.py`

**Output**:

```text
True Ada Renamed Ada Renamed
```

</details>

### Kata 4 -- taking the dirty-tracking snapshot after the mutation means nothing is ever detected as dirty

_relates to co-17, Example 50_

**Task.** After loading a customer and changing its `email`, the unit of work's `dirty_objects()`
should report that customer as dirty. The version below is broken: `track_clean()` -- which takes the
snapshot -- is called AFTER the mutation already happened, so the "before" snapshot is actually the
already-changed state.

**Before** (`drilling/code/kata-04-dirty-snapshot-after-mutation/before/kata.py`)

```python
# pyright: strict
"""Kata 4 (before): taking the dirty-tracking snapshot AFTER the caller already mutated
the object means the snapshot matches the live state from the start -- nothing is EVER
detected as dirty, no matter what actually changed (co-17)."""

import dataclasses
from typing import Any


@dataclasses.dataclass
class Customer:
    id: int
    name: str
    email: str


class UnitOfWork:
    def __init__(self) -> None:
        self._snapshots: dict[int, dict[str, Any]] = {}
        self._tracked: dict[int, Customer] = {}

    def track_clean(self, customer: Customer) -> None:
        # BUG: this is called AFTER the mutation below already happened, so the "snapshot"
        # captures the ALREADY-changed state -- there is nothing left to compare against.
        self._tracked[customer.id] = customer
        self._snapshots[customer.id] = dataclasses.asdict(customer)

    def dirty_objects(self) -> list[Customer]:
        return [c for pk, c in self._tracked.items() if dataclasses.asdict(c) != self._snapshots[pk]]


uow = UnitOfWork()
customer = Customer(id=1, name="Ada", email="ada@example.com")
customer.email = "ada@newmail.com"  # mutated BEFORE track_clean() ever ran
uow.track_clean(customer)  # the snapshot now matches the ALREADY-mutated state
print(uow.dirty_objects())
```

**Observed (buggy) output** (captured by actually running `python3 kata.py` -- an empty list, even
though the customer's `email` genuinely changed from what it was loaded with):

```text
[]
```

**After** (`drilling/code/kata-04-dirty-snapshot-after-mutation/after/kata.py`)

```python
# pyright: strict
"""Kata 4 (after): track_clean() runs immediately at LOAD time, before the caller ever
gets a chance to mutate the object -- so the snapshot is a genuine "before" state (co-17)."""

import dataclasses
from typing import Any


@dataclasses.dataclass
class Customer:
    id: int
    name: str
    email: str


class UnitOfWork:
    def __init__(self) -> None:
        self._snapshots: dict[int, dict[str, Any]] = {}
        self._tracked: dict[int, Customer] = {}

    def track_clean(self, customer: Customer) -> None:
        self._tracked[customer.id] = customer
        self._snapshots[customer.id] = dataclasses.asdict(customer)

    def dirty_objects(self) -> list[Customer]:
        return [c for pk, c in self._tracked.items() if dataclasses.asdict(c) != self._snapshots[pk]]


def load(pk: int, name: str, email: str) -> Customer:  # simulates a real load -- returns a FRESH object
    return Customer(id=pk, name=name, email=email)


uow = UnitOfWork()
customer = load(1, "Ada", "ada@example.com")
uow.track_clean(customer)  # THE FIX: snapshot taken IMMEDIATELY at load time, before any mutation
customer.email = "ada@newmail.com"  # mutated AFTER the snapshot -- now genuinely detectable
print(uow.dirty_objects())
```

<details>
<summary>Model solution</summary>

**Root cause**: dirty detection is nothing more than "does the object's current state differ from a
saved snapshot" -- so the ENTIRE mechanism depends on that snapshot being taken before any mutation is
allowed to happen. Calling `track_clean()` after the mutation captures the post-mutation state as the
"baseline," making the comparison always equal (never dirty) regardless of what actually changed.
Taking the snapshot at genuine load time -- before the caller has had any chance to touch the object --
restores a real "before" to compare against.

**Run**: `python3 kata.py`

**Output**:

```text
[Customer(id=1, name='Ada', email='ada@newmail.com')]
```

</details>

### Kata 5 -- flushing a child row before its parent violates the FK constraint the flush order exists to satisfy

_relates to co-19, Example 62_

**Task.** A new customer and a new order referencing that customer should both flush successfully in
one transaction, with the order's `customer_id` resolved to the customer's real (post-insert) id. The
version below is broken: the unit of work flushes orders FIRST, so `customer.id` is still `None` and
the order's `customer_id` stays at its `-1` placeholder.

**Before** (`drilling/code/kata-05-flush-order-child-before-parent/before/kata.py`)

```python
# pyright: strict
"""Kata 5 (before): flushing orders BEFORE their parent customer is inserted means the
FK column is still the -1 placeholder when the INSERT runs, violating the FK constraint
the database itself enforces -- a real, observable IntegrityError, not a silent wrong value (co-19)."""

import contextlib
import dataclasses
import sqlite3


@dataclasses.dataclass
class Customer:
    id: int | None
    name: str


@dataclasses.dataclass
class Order:
    id: int | None
    customer_id: int  # -1 until the parent's real id is known
    item: str


class UnitOfWork:
    def __init__(self, conn: sqlite3.Connection) -> None:
        self._conn = conn
        self._new_customers: list[Customer] = []
        self._new_orders: list[tuple[Order, Customer]] = []

    def register_new_customer(self, customer: Customer) -> None:
        self._new_customers.append(customer)

    def register_new_order(self, order: Order, customer: Customer) -> None:
        self._new_orders.append((order, customer))

    def flush(self) -> None:
        # BUG: orders are inserted FIRST -- customer.id is still None, so order.customer_id
        # stays at its -1 placeholder instead of ever being resolved to a real value.
        for order, customer in self._new_orders:
            order.customer_id = customer.id if customer.id is not None else -1
            cur = self._conn.execute("INSERT INTO orders(customer_id, item) VALUES (?, ?)", (order.customer_id, order.item))
            order.id = cur.lastrowid
        for customer in self._new_customers:
            cur = self._conn.execute("INSERT INTO customers(name) VALUES (?)", (customer.name,))
            customer.id = cur.lastrowid
        self._conn.commit()


with contextlib.closing(sqlite3.connect(":memory:")) as conn:
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("CREATE TABLE customers(id INTEGER PRIMARY KEY, name TEXT)")
    conn.execute("CREATE TABLE orders(id INTEGER PRIMARY KEY, customer_id INTEGER REFERENCES customers(id), item TEXT)")
    conn.commit()
    uow = UnitOfWork(conn)
    ada = Customer(id=None, name="Ada")
    order = Order(id=None, customer_id=-1, item="Keyboard")
    uow.register_new_customer(ada)
    uow.register_new_order(order, ada)
    try:
        uow.flush()
    except sqlite3.IntegrityError as exc:
        print(f"IntegrityError: {exc}")
```

**Observed (buggy) output** (captured by actually running `python3 kata.py` -- the order's INSERT
runs against a `customer_id` of `-1`, which references no existing row, and SQLite's own FK constraint
rejects it):

```text
IntegrityError: FOREIGN KEY constraint failed
```

**After** (`drilling/code/kata-05-flush-order-child-before-parent/after/kata.py`)

```python
# pyright: strict
"""Kata 5 (after): customers flush FIRST, so every order's FK is resolved to a REAL id
before its own INSERT ever runs -- the FK constraint is satisfied by construction (co-19)."""

import contextlib
import dataclasses
import sqlite3


@dataclasses.dataclass
class Customer:
    id: int | None
    name: str


@dataclasses.dataclass
class Order:
    id: int | None
    customer_id: int
    item: str


class UnitOfWork:
    def __init__(self, conn: sqlite3.Connection) -> None:
        self._conn = conn
        self._new_customers: list[Customer] = []
        self._new_orders: list[tuple[Order, Customer]] = []

    def register_new_customer(self, customer: Customer) -> None:
        self._new_customers.append(customer)

    def register_new_order(self, order: Order, customer: Customer) -> None:
        self._new_orders.append((order, customer))

    def flush(self) -> None:
        # THE FIX: customers flush FIRST -- every order's parent has a real id before step 2 runs.
        for customer in self._new_customers:
            cur = self._conn.execute("INSERT INTO customers(name) VALUES (?)", (customer.name,))
            customer.id = cur.lastrowid
        for order, customer in self._new_orders:
            assert customer.id is not None  # guaranteed real -- the loop above already ran
            order.customer_id = customer.id
            cur = self._conn.execute("INSERT INTO orders(customer_id, item) VALUES (?, ?)", (order.customer_id, order.item))
            order.id = cur.lastrowid
        self._conn.commit()


with contextlib.closing(sqlite3.connect(":memory:")) as conn:
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("CREATE TABLE customers(id INTEGER PRIMARY KEY, name TEXT)")
    conn.execute("CREATE TABLE orders(id INTEGER PRIMARY KEY, customer_id INTEGER REFERENCES customers(id), item TEXT)")
    conn.commit()
    uow = UnitOfWork(conn)
    ada = Customer(id=None, name="Ada")
    order = Order(id=None, customer_id=-1, item="Keyboard")
    uow.register_new_customer(ada)
    uow.register_new_order(order, ada)
    uow.flush()
    stored = conn.execute("SELECT customer_id FROM orders WHERE id = ?", (order.id,)).fetchone()
    print(stored[0], ada.id, stored[0] == ada.id)
```

<details>
<summary>Model solution</summary>

**Root cause**: a flush that processes tracked writes in an arbitrary order (here, orders before
customers) has no way to know a foreign key it's about to write hasn't been resolved to a real value
yet -- the database's own FK constraint is what actually catches the mistake, as an `IntegrityError`
rather than a silently wrong value. Ordering the flush so every parent's INSERT runs before its
FK-dependent children's guarantees `customer.id` is always real by the time an order needs it.

**Run**: `python3 kata.py`

**Output**:

```text
1 1 True
```

</details>

### Kata 6 -- touching a lazy relationship inside a naive per-parent loop reproduces the N+1, one query at a time

_relates to co-21, co-22, Example 70_

**Task.** Reading each of 3 customers' orders should not cost more queries than necessary. The version
below is broken: `customer.orders` runs a fresh, uncached query on every access, and the loop below
touches it once per customer -- 1 query for the customers, plus 1 more per customer for their orders.

**Before** (`drilling/code/kata-06-naive-lazy-loop-n-plus-1/before/kata.py`)

```python
# pyright: strict
"""Kata 6 (before): touching a lazy relationship inside a naive per-parent loop issues
one SEPARATE query per parent -- the N+1 pattern, reproduced and counted (co-21, co-22)."""

import contextlib
import dataclasses
import sqlite3

QUERY_LOG: list[str] = []


@dataclasses.dataclass
class Customer:
    id: int
    name: str
    conn: sqlite3.Connection

    @property
    def orders(self) -> list[tuple[int, str]]:
        # BUG: no caching AND called from inside a loop below -- one query PER customer.
        QUERY_LOG.append(f"SELECT * FROM orders WHERE customer_id = {self.id}")
        return self.conn.execute("SELECT id, item FROM orders WHERE customer_id = ?", (self.id,)).fetchall()


with contextlib.closing(sqlite3.connect(":memory:")) as conn:
    conn.execute("CREATE TABLE customers(id INTEGER PRIMARY KEY, name TEXT)")
    conn.execute("CREATE TABLE orders(id INTEGER PRIMARY KEY, customer_id INTEGER, item TEXT)")
    conn.executemany("INSERT INTO customers VALUES (?, ?)", [(1, "Ada"), (2, "Bob"), (3, "Carol")])
    conn.executemany("INSERT INTO orders(customer_id, item) VALUES (?, ?)", [(1, "Keyboard"), (2, "Mouse"), (3, "Monitor")])
    conn.commit()

    QUERY_LOG.clear()
    rows = conn.execute("SELECT id, name FROM customers").fetchall()
    QUERY_LOG.append("SELECT * FROM customers")
    customers = [Customer(id=r[0], name=r[1], conn=conn) for r in rows]
    for customer in customers:  # intent: just read each customer's orders -- looks harmless
        customer.orders
    print(len(QUERY_LOG))
```

**Observed (buggy) output** (captured by actually running `python3 kata.py` -- 1 query for the
customers, plus 3 more, one per customer's `orders` access, for 4 total, N+1 with N=3):

```text
4
```

**After** (`drilling/code/kata-06-naive-lazy-loop-n-plus-1/after/kata.py`)

```python
# pyright: strict
"""Kata 6 (after): one batched IN (...) query fetches every customer's orders together --
exactly 2 queries total, regardless of how many customers exist (co-21, co-22)."""

import contextlib
import sqlite3

QUERY_LOG: list[str] = []


def load_all_with_orders(conn: sqlite3.Connection) -> dict[int, list[tuple[int, str]]]:
    QUERY_LOG.append("SELECT * FROM customers")
    customer_rows = conn.execute("SELECT id, name FROM customers").fetchall()
    ids = [row[0] for row in customer_rows]
    placeholders = ",".join("?" for _ in ids)  # THE FIX: ONE batched query, not one per customer
    QUERY_LOG.append("SELECT * FROM orders WHERE customer_id IN (...)")
    order_rows = conn.execute(f"SELECT customer_id, id, item FROM orders WHERE customer_id IN ({placeholders})", ids).fetchall()
    grouped: dict[int, list[tuple[int, str]]] = {cid: [] for cid in ids}
    for customer_id, order_id, item in order_rows:
        grouped[customer_id].append((order_id, item))
    return grouped


with contextlib.closing(sqlite3.connect(":memory:")) as conn:
    conn.execute("CREATE TABLE customers(id INTEGER PRIMARY KEY, name TEXT)")
    conn.execute("CREATE TABLE orders(id INTEGER PRIMARY KEY, customer_id INTEGER, item TEXT)")
    conn.executemany("INSERT INTO customers VALUES (?, ?)", [(1, "Ada"), (2, "Bob"), (3, "Carol")])
    conn.executemany("INSERT INTO orders(customer_id, item) VALUES (?, ?)", [(1, "Keyboard"), (2, "Mouse"), (3, "Monitor")])
    conn.commit()

    QUERY_LOG.clear()
    grouped = load_all_with_orders(conn)
    print(len(QUERY_LOG))
```

<details>
<summary>Model solution</summary>

**Root cause**: the naive `orders` property has no cache and is called once per customer inside a
loop -- the number of queries scales linearly with N, the number of parents, exactly the N+1 pattern
co-22 names. Replacing "one query per parent, triggered lazily inside the loop" with "one query for
the whole batch of children up front" (a single `WHERE customer_id IN (...)`) collapses the query count
from N+1 down to a constant 2, no matter how many customers exist.

**Run**: `python3 kata.py`

**Output**:

```text
2
```

</details>

### Kata 7 -- a migration runner with no schema_version table crashes on its own second run

_relates to co-24, Example 73_

**Task.** Calling a migration runner a second time (e.g. on an app restart) against an
already-migrated database should be a safe no-op. The version below is broken: it has no bookkeeping
at all -- every call re-runs the same `CREATE TABLE`, and SQLite rejects the second attempt outright.

**Before** (`drilling/code/kata-07-migration-rerun-no-version-check/before/kata.py`)

```python
# pyright: strict
"""Kata 7 (before): a migration runner with NO schema_version bookkeeping re-applies
every migration on every run -- a second run against an already-migrated database
crashes instead of being a safe no-op (co-24)."""

import contextlib
import sqlite3


def migrate(conn: sqlite3.Connection) -> None:
    # BUG: no tracking table, no "already applied" check -- this DDL runs EVERY call.
    conn.execute("CREATE TABLE customer(id INTEGER PRIMARY KEY, name TEXT NOT NULL)")
    conn.commit()


with contextlib.closing(sqlite3.connect(":memory:")) as conn:
    migrate(conn)  # first run: creates the table -- fine so far
    try:
        migrate(conn)  # intent: a second run (e.g. on app restart) should be a safe no-op
    except sqlite3.OperationalError as exc:
        print(f"OperationalError: {exc}")
```

**Observed (buggy) output** (captured by actually running `python3 kata.py` -- the second call
re-issues the same `CREATE TABLE`, and SQLite rejects it because the table already exists):

```text
OperationalError: table customer already exists
```

**After** (`drilling/code/kata-07-migration-rerun-no-version-check/after/kata.py`)

```python
# pyright: strict
"""Kata 7 (after): a schema_version tracking table records what already ran, so a second
call against an already-migrated database skips the DDL entirely -- a genuine no-op (co-24)."""

import contextlib
import sqlite3


def migrate(conn: sqlite3.Connection) -> list[int]:
    conn.execute("CREATE TABLE IF NOT EXISTS schema_version(version INTEGER PRIMARY KEY)")  # THE FIX
    applied = {row[0] for row in conn.execute("SELECT version FROM schema_version").fetchall()}
    newly_applied: list[int] = []
    if 1 not in applied:  # THE FIX: only runs the DDL if version 1 hasn't been recorded yet
        conn.execute("CREATE TABLE customer(id INTEGER PRIMARY KEY, name TEXT NOT NULL)")
        conn.execute("INSERT INTO schema_version VALUES (1)")
        newly_applied.append(1)
    conn.commit()
    return newly_applied


with contextlib.closing(sqlite3.connect(":memory:")) as conn:
    first = migrate(conn)
    second = migrate(conn)  # a genuine no-op -- no OperationalError, nothing re-applied
    print(first, second)
```

<details>
<summary>Model solution</summary>

**Root cause**: without a record of which migrations already ran, `migrate()` has no way to tell "the
schema is already at version 1" from "the schema needs version 1 applied" -- it just re-executes the
same DDL every call, and `CREATE TABLE` (unlike `CREATE TABLE IF NOT EXISTS`) fails outright against an
existing table. A `schema_version` tracking table gives the runner exactly the bookkeeping it needs:
check what's already applied, apply only what's missing, record it, and a re-run against an
already-migrated database becomes a genuine no-op.

**Run**: `python3 kata.py`

**Output**:

```text
[1] []
```

</details>

### Kata 8 -- an uncoerced 0/1 integer silently fails an `is True` identity check

_relates to co-12, Example 36_

**Task.** Ada is genuinely active in the database (`active = 1`), so `customer.active is True` should
be `True`. The version below is broken: the mapper assigns SQLite's raw `0`/`1` integer directly to
the `active` attribute, never coercing it to a real `bool`.

**Before** (`drilling/code/kata-08-missing-bool-coercion/before/kata.py`)

```python
# pyright: strict
"""Kata 8 (before): SQLite has no native boolean type -- it stores 0/1 integers. Mapping a
row WITHOUT coercing that integer to a real bool means `is True` (identity, not equality)
silently fails even for a row that is genuinely "active" (co-12)."""

import contextlib
import dataclasses
import sqlite3


@dataclasses.dataclass
class Customer:
    id: int
    name: str
    active: bool


def load(row: tuple[int, str, int]) -> Customer:
    # BUG: row[2] is SQLite's raw 0/1 INTEGER, assigned directly -- never coerced to bool.
    return Customer(id=row[0], name=row[1], active=row[2])  # type: ignore[arg-type]


with contextlib.closing(sqlite3.connect(":memory:")) as conn:
    conn.execute("CREATE TABLE customer(id INTEGER PRIMARY KEY, name TEXT, active INTEGER)")
    conn.execute("INSERT INTO customer VALUES (1, 'Ada', 1)")  # 1 means "active" in this schema
    conn.commit()
    row = conn.execute("SELECT id, name, active FROM customer WHERE id = 1").fetchone()
    customer = load(row)
    # intent: Ada IS active -- this check should pass.
    print(type(customer.active).__name__, customer.active is True)
```

**Observed (buggy) output** (captured by actually running `python3 kata.py` -- the attribute is
genuinely an `int`, not a `bool`, so `is True` (identity, not equality) is `False` even though `1` is
truthy):

```text
int False
```

**After** (`drilling/code/kata-08-missing-bool-coercion/after/kata.py`)

```python
# pyright: strict
"""Kata 8 (after): coerce the raw 0/1 INTEGER to a real bool with `bool(row[2])` at load
time -- `is True` now works because the mapped attribute is genuinely a bool object (co-12)."""

import contextlib
import dataclasses
import sqlite3


@dataclasses.dataclass
class Customer:
    id: int
    name: str
    active: bool


def load(row: tuple[int, str, int]) -> Customer:
    return Customer(id=row[0], name=row[1], active=bool(row[2]))  # THE FIX: bool() coercion


with contextlib.closing(sqlite3.connect(":memory:")) as conn:
    conn.execute("CREATE TABLE customer(id INTEGER PRIMARY KEY, name TEXT, active INTEGER)")
    conn.execute("INSERT INTO customer VALUES (1, 'Ada', 1)")
    conn.commit()
    row = conn.execute("SELECT id, name, active FROM customer WHERE id = 1").fetchone()
    customer = load(row)
    print(type(customer.active).__name__, customer.active is True)
```

<details>
<summary>Model solution</summary>

**Root cause**: SQLite has no native boolean storage type -- `active` is genuinely stored (and
fetched) as a plain `INTEGER`, `0` or `1`. Assigning that raw integer directly to a `bool`-typed
attribute leaves the RUNTIME type mismatched with the DECLARED type: `1 == True` is `True` (equality),
but `1 is True` is `False` (identity), because `1` and `True` are different objects. Calling `bool()`
on the raw value at load time produces a genuine `bool` object, so the mapped attribute's runtime type
finally matches what the dataclass field declares.

**Run**: `python3 kata.py`

**Output**:

```text
bool True
```

</details>

## Self-check checklist

Work through this list without looking anything up. Every item should be something you can do from
memory, not something you'd need to search for.

**Query builder core**

- [ ] I can represent a single query fragment as a data node and explain why nothing about it is SQL
      text until something explicitly renders it (co-01).
- [ ] I can bind a hostile string as a parameter and explain why the table it targets survives
      (co-02).
- [ ] I can write a builder method that returns a brand-new instance and explain why a mutable default
      argument would break that guarantee (co-03).
- [ ] I can compose a SELECT from independent `.select()`/`.from_()`/`.join()` fragments (co-04).
- [ ] I can compile a nested `And`/`Or` boolean tree and explain how it stays correctly parenthesized
      (co-05).
- [ ] I can parameterize `LIMIT`/`OFFSET` instead of inlining them as literals, and explain why
      (co-06).
- [ ] I can write parameterized `insert()`, `update()`, and `delete()` builders that reuse the same
      `Predicate` machinery SELECT's WHERE uses (co-07).
- [ ] I can explain why `compile()` must be pure, and prove calling it twice never mutates the builder
      (co-08).

**Table metadata and row/object mapping**

- [ ] I can register a table's columns and primary key in a central metadata registry and explain why
      two separate registries would drift (co-09).
- [ ] I can map a `fetchall()` result to a list of typed objects, by both tuple order and dict key
      (co-10).
- [ ] I can map an object's attributes back into an INSERT-ready dict AND an UPDATE SET dict that
      excludes the primary key (co-11).
- [ ] I can coerce SQLite's raw `0`/`1` to `bool` and an ISO string to `date` on load, and coerce both
      back on store (co-12).

**Identity map and session**

- [ ] I can implement a `{pk: object}` identity map and prove `a is b` for two loads of the same
      primary key (co-13).
- [ ] I can back an identity map with a `WeakValueDictionary` and explain why that matters for a
      long-running session (co-14).
- [ ] I can explain why the session must be the ONLY thing that calls `commit()`/`rollback()` on its
      connection (co-15).

**Unit of work and flush**

- [ ] I can implement `session.add(obj)` recording an object in a "new" set without writing anything
      until flush (co-16).
- [ ] I can take a load-time attribute snapshot and detect a dirty object by comparing live state
      against it (co-17).
- [ ] I can implement `session.delete(obj)` as a distinct tracked action, separate from dropping a
      Python reference (co-18).
- [ ] I can order a flush so parent INSERTs precede dependent child INSERTs, and child DELETEs precede
      parent DELETEs (co-19).
- [ ] I can wrap a mixed new/dirty/deleted flush in one transaction and prove a mid-flush error rolls
      back the ENTIRE batch, not just the failing write (co-20).

**Lazy load, wiring, migrations, and typed API**

- [ ] I can implement a lazy-loading descriptor using `__set_name__` and `__get__`, and prove a second
      access issues no additional query (co-21).
- [ ] I can reproduce a real N+1 in a query log by looping over parents and touching a lazy
      relationship, then collapse it to 2 queries with a batched `IN (...)` (co-22).
- [ ] I can feed a compiled `(sql, params)` tuple straight into a real PEP 249 cursor and walk the full
      connect/cursor/execute/fetch/close lifecycle (co-23).
- [ ] I can write a migration runner that records applied versions in a `schema_version` table and
      proves a re-run is a safe no-op (co-24).
- [ ] I can write a generic `session.get[T](pk) -> T` and confirm the whole stack is `pyright --strict`
      clean, including every deliberate `# type: ignore[override]` (co-25).

## Elaborative interrogation & self-explanation

Seven why/why-not prompts. Answer in your own words before checking -- the goal is explaining the
reasoning, not reciting a definition.

**W1.** Why does this topic hand-build a query builder, identity map, and lazy loader from scratch,
instead of just recommending SQLAlchemy or peewee from the start, given topic 27 already used a
real ORM as a black box?

<details>
<summary>Answer</summary>

Ties to `abstraction-and-its-cost` -- this topic's whole purpose is making a real ORM's abstraction
cost CONCRETE and visible, not replacing a mature ORM in production. You feel exactly what an immutable
fluent builder buys (co-03) and what it costs to allocate a new instance per call; you feel exactly
what lazy loading buys (co-21) and exactly what it charges when it fans out into an N+1 you triggered
yourself and can watch in a query log (co-22) -- neither is visible while treating an ORM as a black
box.

</details>

**W2.** Why is `compile()` (co-08) required to be pure -- no I/O, no mutation -- when it would be
marginally more convenient to have it just execute the query it built directly?

<details>
<summary>Answer</summary>

Separating "build" (pure data and pure functions) from "run" (real I/O against a database) is what
lets the entire builder be tested with no database required at all, and lets a compiled `(sql, params)`
tuple be logged, cached, or replayed exactly and deterministically. Mixing the two would make every
builder test also a database test, and would make "did compiling this query have a side effect"
something you'd have to check instead of something structurally impossible.

</details>

**W3.** Why does the unit of work track new/dirty/deleted objects as SETS and defer every write to an
explicit `flush()`, instead of writing to the database the moment `.add()` or `.delete()` is called?

<details>
<summary>Answer</summary>

Deferring every write is what lets the unit of work order writes correctly (co-19's flush ordering) and
wrap the whole batch in one atomic transaction (co-20) -- writing immediately, one call at a time,
would make "insert this parent before this child" or "roll back the WHOLE batch on any single failure"
impossible to guarantee, because some writes would already be committed independently before the
failure was even discovered.

</details>

**W4.** Why does the identity map (co-13) matter MORE once a unit of work exists, compared to a stack
that only ever reads data and never tracks changes?

<details>
<summary>Answer</summary>

The identity map's guarantee -- `a is b` for two loads of the same primary key -- is a PRECONDITION
for dirty tracking (co-17) to mean anything at all. If the same row could load as two independent
objects, mutating one wouldn't reliably get flushed, because the unit of work might be tracking the
OTHER copy, or both, with only one snapshot ever matching reality -- a read-only stack never has this
problem because nothing downstream depends on object identity being stable.

</details>

**W5.** Why does lazy loading (co-21) get taught as genuinely valuable, right next to the N+1 it
directly enables (co-22), instead of the topic just recommending eager loading everywhere and skipping
lazy loading altogether?

<details>
<summary>Answer</summary>

Ties to `abstraction-and-its-cost` from its other side -- lazy loading's entire benefit (skip work for
a relationship you'll never touch) is the mirror image of its entire cost (that same deferral,
multiplied by N the moment you touch it inside a loop). Teaching both together, and rebuilding the
mechanism yourself, is what turns "my ORM feels randomly slow sometimes" into a predictable
multiplication you can see in a query log and fix deliberately, by batching, whenever you already know
you'll touch every relationship.

</details>

**W6.** Why does a migration runner need a `schema_version` tracking table at all (co-24), when the
DDL script itself could just use `CREATE TABLE IF NOT EXISTS` everywhere to make re-running always
safe?

<details>
<summary>Answer</summary>

`IF NOT EXISTS` only protects a single `CREATE TABLE` statement; a real migration sequence also needs
`ALTER TABLE`, data backfills, and multi-statement changes with no equivalent "already done" guard of
their own. Kata 7 shows the `CREATE`-only case breaking outright on a second run; a `schema_version`
table generalizes "already applied" to the WHOLE migration as a unit, independent of what kind of DDL
or data change it contains.

</details>

**W7.** Why does this topic insist the fully typed API (co-25) matters as its OWN concept, given every
earlier mechanism -- builder, mapper, identity map, unit of work -- already works correctly at runtime
without it?

<details>
<summary>Answer</summary>

Ties to `abstraction-and-its-cost` from the type-safety angle -- a mechanism that WORKS is not the same
as a mechanism whose MISUSE gets caught before the query ever runs. An ORM's entire selling point is
hiding raw rows behind typed objects, and an untyped (or `Any`-leaking) API throws that benefit away
even when every individual method happens to behave correctly today -- the cost of skipping co-25 is
invisible until a caller passes the wrong type into a boundary that should have caught it and didn't.

</details>

---

← Previous: [Capstone](../learning/capstone/overview.md) &middot; Next: [Advanced Networking](../../advanced-networking/learning/overview.md) →
