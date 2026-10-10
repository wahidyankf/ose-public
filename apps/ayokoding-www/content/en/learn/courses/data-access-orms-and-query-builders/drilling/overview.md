---
title: "Overview"
date: 2026-07-18T00:00:00+07:00
draft: false
weight: 1
---

This page is the spaced-repetition companion to the Data Access: ORMs & Query Builders topic: three
fixed drills that force active recall instead of passive re-reading. Work through them in order --
short-answer recall first, then scenario judgment, then hands-on repetition against a real PostgreSQL
18.4 database -- not just execute the syntax. Every answer is hidden in a `<details>` block; try each
item yourself before opening it. Together, the three drills below touch every one of this topic's 27
concepts and cite specific examples spanning all 78 worked examples in the Beginner, Intermediate, and
Advanced tiers, plus the capstone.

## Recall Q&A

Twenty-seven short-answer questions, one per concept. Answer from memory before opening each answer.

**Q1 (co-01 -- The data-access spectrum).** Name the three tiers this topic organizes itself around,
and state what each tier buys and hides relative to the one below it.

<details>
<summary>Answer</summary>

Raw SQL over the PEP 249 DB-API is the floor -- full control, zero abstraction, every join and column
typed by hand. A query builder (PyPika, or SQLAlchemy Core) composes the SAME SQL as data structures
instead of concatenated text, buying safety and reuse while still emitting SQL you can read directly.
A full ORM (SQLAlchemy's declarative mapping, or peewee) maps rows to objects with identity, relationship
navigation, and change tracking, buying real productivity on CRUD at the cost of hiding the SQL it emits
-- hidden SQL that leaks back out as the N+1 problem the moment you stop paying attention (Example 1
answers the SAME query all three ways; Example 78 and the capstone's `report_three_tiers.py` both prove
the three tiers agree on one correct answer).

</details>

**Q2 (co-02 -- The raw PEP 249 DB-API).** Name the four core DB-API operations this topic's raw-SQL
tier is built from, and what changes between `.fetchone()` and `.fetchall()`.

<details>
<summary>Answer</summary>

Connect (opens a connection), cursor (a handle for issuing statements against that connection), execute
(sends one SQL statement, optionally with bound parameters), and fetch (reads the result rows back).
`.fetchone()` reads exactly one row (or `None` if there are no more), while `.fetchall()` materializes
every remaining row into a list at once -- the right choice depends on whether the result set is small
enough to hold entirely in memory (Example 2's connect+cursor; Example 4's manual row-to-dataclass
mapping, which is exactly the boilerplate an ORM automates away).

</details>

**Q3 (co-03 -- Query-builder core).** What does "building a query as a composable data structure" mean
concretely, and what specific class of bug does it eliminate that string concatenation cannot?

<details>
<summary>Answer</summary>

Each clause -- `.select()`, `.join()`, `.on()`, `.where()`, `.groupby()` -- returns a Query VALUE that
the next method call extends, so the whole statement is a tree of Python objects until you finally ask
for its rendered SQL text. Because every value composed into that tree passes through the builder's own
escaping/parameter machinery rather than raw string interpolation, a builder-composed query is immune to
SQL injection by construction, the same way a parameterized raw query is (Example 7's `SELECT`; Example
8's composed `WHERE`; Example 11 directly contrasts builder composition against string-concatenated SQL).

</details>

**Q4 (co-04 -- Query-builder library contrast).** How do PyPika (a standalone builder) and SQLAlchemy
Core's own builder differ in scope, and why does that matter when choosing between them?

<details>
<summary>Answer</summary>

PyPika is a lightweight, standalone query-composition library with no ORM, no engine, and no connection
management of its own -- it renders SQL text and something else (plain DB-API, in this topic) executes
it. SQLAlchemy Core's builder is one layer of the SAME library that also ships the ORM -- it shares
`Table`/`MetaData`/`Engine` objects with SQLAlchemy's declarative mapping, so a codebase that also uses
the SQLAlchemy ORM elsewhere gets tighter integration for free, while a codebase with no ORM at all
carries a smaller dependency with PyPika (Example 9's PyPika `JOIN`; Example 12's SQLAlchemy Core
`Table`; Example 13's SQLAlchemy Core `select()`).

</details>

**Q5 (co-05 -- Parameterized queries and emitted SQL).** Why does a `%s` placeholder defeat SQL
injection where an f-string interpolation cannot, at the mechanism level, not just "because it's safer"?

<details>
<summary>Answer</summary>

A placeholder sends the SQL TEXT and the VALUES as two separate pieces of data over the wire -- the
database parses the SQL text once, into a fixed structure, and only then binds the values into that
already-parsed structure, so a value containing a quote or a keyword can never be interpreted as SQL
syntax. String interpolation instead builds ONE combined text blob before the database ever sees it, so
a crafted value can break out of its intended position and add real SQL the query never intended
(Example 3's parameterized query; Drilling Kata 3 reproduces the exact injection a `%s` placeholder
prevents).

</details>

**Q6 (co-06 -- Declarative ORM mapping).** What does `Mapped[...]` add over a bare Python type
annotation on a SQLAlchemy 2.0 model, and what is `DeclarativeBase` for?

<details>
<summary>Answer</summary>

`Mapped[int]`/`Mapped[str]`/etc. tells SQLAlchemy's own mapper machinery "this attribute is a real
mapped column, backed by a database column with this Python type" -- a bare `int`/`str` annotation is
just a type hint with no persistence meaning at all. `DeclarativeBase` is the shared registry every
mapped class in a program inherits from; it is what lets `relationship()` calls on DIFFERENT classes
resolve each other by name, and what `Base.metadata.create_all()` reads to know which tables exist at
all (Example 14's basic model; Example 15's fully typed columns).

</details>

**Q7 (co-07 -- Active Record vs. Data Mapper).** Contrast where persistence logic LIVES in peewee's
Active Record style versus SQLAlchemy's Data Mapper style.

<details>
<summary>Answer</summary>

In Active Record (peewee), the model class itself knows how to save and delete -- calling `.save()`
directly on an instance is the API. In Data Mapper (SQLAlchemy), the model class carries no persistence
methods of its own at all -- a separate `Session` object (the mapper) is what tracks, flushes, and
commits changes, keeping the domain object itself free of any database-specific method (Example 20's
peewee `.save()`; Example 21 contrasts the same CRUD operation written both ways side by side).

</details>

**Q8 (co-08 -- Relationship mapping).** What does `back_populates` keep synchronized that a
one-directional `relationship()` alone would not?

<details>
<summary>Answer</summary>

`back_populates` tells SQLAlchemy that two `relationship()` declarations -- one on each side of a
foreign key -- are the SAME logical link, viewed from opposite directions. Appending to the "many" side's
collection (or setting the "one" side's reference) then automatically updates the OTHER side's in-memory
attribute too, in the SAME Python process, before any flush -- without it, each side would only reflect
changes made directly to itself until the object is reloaded from the database (Example 22's one-to-many
FK; Example 23 names `back_populates` directly and shows both directions staying in sync).

</details>

**Q9 (co-09 -- Many-to-many association).** What can an association OBJECT carry that a plain
association TABLE cannot, and what price does that extra capability cost in how you query it?

<details>
<summary>Answer</summary>

A plain association table (just two foreign keys) has no natural place for a per-link attribute -- an
enrollment grade, an assignment's logged hours, an approval date. An association OBJECT is a full mapped
class sitting on that SAME link table, so it can carry arbitrary extra columns and be queried, updated,
and navigated like any other entity. The cost is one extra hop when navigating: `student.courses` (a
plain M:N) reads the OTHER side directly, while `student.enrollments[i].course` (an association object)
reads through the link object first (Example 25's plain association table; Example 75's association
object with a `grade` column; the capstone's `Assignment` carries `hours_logged` the same way).

</details>

**Q10 (co-10 -- The identity map).** What guarantee does the identity map make, and what is the exact
scope that guarantee is limited to?

<details>
<summary>Answer</summary>

Within ONE session, fetching the same primary key twice -- by any query shape -- returns the literal
SAME Python object both times, `is`, not merely `==`. That guarantee is scoped strictly to a single
session's own identity map; two DIFFERENT sessions each fetching the same row get two DIFFERENT Python
objects with equal but independently-tracked data (Example 27 proves the SAME-session guarantee directly;
Drilling Kata 6 reproduces the cross-session case where the assumption breaks).

</details>

**Q11 (co-11 -- Session object states).** Name the four session object states in order, and what event
moves an object from each one to the next.

<details>
<summary>Answer</summary>

Transient (constructed, no session has ever seen it) becomes pending the moment `session.add()` (or a
cascading add) registers it. Pending becomes persistent the moment a flush actually sends its `INSERT`
and it gets a real primary key. Persistent becomes detached the moment its owning session closes (or
`expunge()`s it) -- the object still exists in Python memory, still has its id, but no session's
identity map or unit of work tracks it anymore (Example 28's session lifecycle; Example 29 walks all
four states in order with `inspect()`; the capstone's Step 3f repeats this walk on a throwaway team).

</details>

**Q12 (co-12 -- The unit of work).** What does "the session batches, orders, and flushes changes as one
coordinated write" mean concretely, in terms of statement ORDER?

<details>
<summary>Answer</summary>

Rather than sending each `add()`/attribute-mutation as its own immediate statement, the session
accumulates pending inserts, updates, and deletes and only sends them at `flush()` (explicit, or
implicit before a query/commit) -- and it orders the sent statements to respect foreign-key
dependencies automatically: a parent's `INSERT` before its children's, a child's `DELETE` before its
parent's. `session.new`/`session.dirty` expose exactly what a pending flush will send, before it sends
it (Example 31's flush ordering; Example 32's dirty tracking; Example 33's autoflush; Drilling Kata 5
reproduces what happens when autoflush is disabled).

</details>

**Q13 (co-13 -- Lazy loading).** What does "fetched on first access" mean for the DEFAULT relationship
loading strategy, and what specific exception can that default raise later?

<details>
<summary>Answer</summary>

By default, a relationship attribute (`customer.orders`) issues NO query when the parent object is
first loaded -- the SELECT fires the FIRST time code actually touches `.orders`, not before. If that
first touch happens AFTER the owning session has already closed, there is no open session left to run
that lazy query against, and SQLAlchemy raises `DetachedInstanceError` instead of silently failing
(Example 34's default lazy load; Example 35 reproduces the detached error directly; Drilling Kata 2
reproduces the exact same failure and fixes it by eager-loading before the session closes).

</details>

**Q14 (co-14 -- Eager-loading strategies).** Contrast `selectinload`, `joinedload`, and `subqueryload`
in terms of HOW MANY additional queries each one issues and what SQL shape each one uses.

<details>
<summary>Answer</summary>

`selectinload` issues a SECOND, separate `SELECT ... WHERE parent_id IN (...)` batching every parent's
children into one additional round trip -- the strategy this topic recommends by default. `joinedload`
issues ONE combined query with a `LEFT OUTER JOIN`, fetching parents and children together at the cost
of a wider, potentially duplicated result set. `subqueryload` also issues a second query, but shaped as
a correlated subquery rather than an `IN` list -- SQLAlchemy's own docs now describe it as "mostly
legacy," superseded by `selectinload` for most cases (Example 37's `selectinload`; Example 38's
`joinedload`; Example 39's `subqueryload`; Example 40 contrasts all three directly).

</details>

**Q15 (co-15 -- The N+1 problem).** Define the N+1 pattern precisely -- in terms of QUERY COUNT, not
just "it's slow" -- and state the ONE thing that changes when you fix it with eager loading.

<details>
<summary>Answer</summary>

N+1 is issuing ONE query to fetch N parent rows, then, inside application code, one ADDITIONAL query PER
PARENT to fetch that parent's related rows -- N+1 total round trips, growing linearly with N. Fixing it
with eager loading changes ONLY the query count, never the returned data -- the SAME rows come back
either way, just fetched in a constant 2 queries instead of N+1 (Example 36 reproduces N+1 with real
query counting; Example 42 asserts the exact before/after counts; the capstone's Step 3 measures the
identical pattern at 6 queries before, 2 after, on its own team/member/assignment data).

</details>

**Q16 (co-16 -- The raiseload() guard).** What does `raiseload()` change about touching a guarded
relationship, and why is a LOUD failure preferable to the silent extra query it replaces?

<details>
<summary>Answer</summary>

`raiseload()` marks a relationship so that touching it NEVER silently issues a lazy query -- instead it
raises `InvalidRequestError` immediately, at the exact call site that would otherwise have fired an
accidental N+1. A silent extra query is invisible in a code review and often invisible in a quick manual
test too, surfacing only under real production load; a loud, immediate exception is caught by ANY test
that exercises the guarded code path, turning "forgot to eager-load" from a runtime performance bug into
a development-time crash (Example 41's `raiseload()` guard; the capstone's Step 3d re-guards the EXACT
access pattern Step 3b's N+1 measurement reproduced, on the same data).

</details>

**Q17 (co-17 -- ORM transactions).** What does `session.rollback()` actually do to objects still held IN
MEMORY by that session, beyond undoing the database-side transaction?

<details>
<summary>Answer</summary>

`session.rollback()` both rolls back the underlying database transaction AND expires every object the
session was tracking -- their in-memory attribute values are marked stale, so the NEXT access to any
attribute on any of them triggers a fresh `SELECT` reflecting the database's true, rolled-back state.
This is why reading an attribute right after a rollback shows the ORIGINAL value, not the uncommitted
change that was just discarded (Example 43's commit/rollback; Example 44's nested savepoint; the
capstone's Step 3e renames `Ada`, rolls back, and reads `ada.name` again in the SAME session, confirming
the expiry-triggered reload shows the original value).

</details>

**Q18 (co-18 -- Connection pooling).** What do `pool_size` and `max_overflow` each control, and what
does `pool_pre_ping` protect against?

<details>
<summary>Answer</summary>

`pool_size` sets how many connections the pool keeps OPEN and ready for reuse; `max_overflow` sets how
many EXTRA connections the pool may open temporarily above `pool_size` under a burst of concurrent
demand, before new requests start waiting. `pool_pre_ping` issues a cheap validation query on a pooled
connection before handing it out, so a connection the DATABASE silently closed (an idle timeout, a
network blip) gets discarded and replaced automatically instead of surfacing as a confusing error on the
caller's real query (Example 45's pool basics; Example 46's exhaustion under load; Example 47's
`pool_pre_ping` recovery; Example 77's tuning against a concurrency target).

</details>

**Q19 (co-19 -- The Alembic migration workflow).** Name the three core Alembic commands this topic's
migration examples use, and what each one does.

<details>
<summary>Answer</summary>

`alembic init` scaffolds a fresh migration project (`env.py`, `script.py.mako`, a `versions/` folder).
`alembic revision` creates a new, timestamped migration file with empty `upgrade()`/`downgrade()`
functions to fill in by hand (or via autogenerate). `alembic upgrade`/`downgrade` actually RUN a
migration's `upgrade()` or `downgrade()` function against a live database connection, moving the schema
forward or backward one (or more) revisions (Example 48's `init`; Example 49's hand-written revision;
Example 50's `upgrade`/`downgrade`; the capstone's Step 4 runs all three against its own live shared
schema, not a throwaway one).

</details>

**Q20 (co-20 -- Autogenerate migrations).** What does `alembic revision --autogenerate` actually DO
mechanically, and why does the topic insist a human still reviews its output?

<details>
<summary>Answer</summary>

Autogenerate connects to the LIVE database, reflects its actual current schema, compares that reflection
against what the SQLAlchemy models currently declare, and writes a migration file containing the DDL
operations it computes would reconcile the difference. It is a PROPOSAL, not a guarantee -- it can miss
changes it cannot detect (a column rename it sees as a drop-plus-add, a check constraint, certain index
changes) or propose noisy false-positive diffs, so every autogenerated migration still needs a human
read-through before it ships (Example 51's autogenerate against a genuinely new table; Example 52 shows
a case autogenerate gets subtly wrong).

</details>

**Q21 (co-21 -- Migration reversibility).** What must a `downgrade()` restore, beyond just the SCHEMA
shape, for a DATA migration to count as truly reversible?

<details>
<summary>Answer</summary>

A schema-only migration (add a column, drop a column) is reversible if `downgrade()` undoes the exact
structural change. A DATA migration -- one that also TRANSFORMS row values, like splitting a
`full_name` column into `first_name`/`last_name` -- is only truly reversible if `downgrade()` merges the
values back together too, not just drops the new columns; dropping without merging silently LOSES real
data the split had preserved. The expand-contract pattern (add-nullable, backfill, THEN tighten to
NOT NULL) is what keeps both directions of that round trip safe (Example 53's real data-migration round
trip; Example 54's explicitly-irreversible guard; Example 76's zero-downtime expand-contract; the
capstone's Step 4a backfills `member.active` before tightening, then reverses cleanly).

</details>

**Q22 (co-22 -- ORM cascade delete vs. database `ON DELETE CASCADE`).** Contrast where each cascade
mechanism is CONFIGURED, and what happens to child rows if NEITHER is set up.

<details>
<summary>Answer</summary>

`cascade="all, delete-orphan"` is Python-side relationship configuration -- the ORM itself computes and
issues the extra `DELETE` statements for child rows BEFORE deleting the parent, entirely independent of
whatever the database schema itself declares. `ON DELETE CASCADE` is a database-level FOREIGN KEY
constraint option -- it fires for ANY delete that reaches the database, regardless of which tier (raw
SQL, a query builder, or the ORM) issued it. With NEITHER configured, deleting a parent with a required
(NOT NULL) child FK still pointing at it fails with an `IntegrityError`, because the ORM's own default
behavior (try to null out the child FK) collides with the column's own NOT NULL constraint (Example 55's
ORM cascade; Example 56 contrasts it against the database's own `ON DELETE CASCADE`; the capstone's Step
3g exercises BOTH mechanisms on two different relationships in the same script; Drilling Kata 4
reproduces the `IntegrityError` neither mechanism being configured produces).

</details>

**Q23 (co-23 -- Bulk operations).** Why does `session.add()` called N times in a loop cost MORE round
trips than a single Core `insert()` call with a list of N dicts, even though both eventually write the
SAME N rows?

<details>
<summary>Answer</summary>

A per-object `session.add()` loop constructs N tracked Python objects, each participating in the
identity map and change tracking, and flush() issues (up to) N separate `INSERT` statements for them --
useful overhead when the code ALSO needs each object's identity, relationships, or further mutation, but
pure cost when it does not. A single Core `insert(table)` executed with a LIST of plain dicts never
constructs any ORM object at all -- the driver batches the whole list into ONE statement's worth of
network traffic, at the cost of skipping the ORM's own per-object machinery entirely (Example 57's bulk
insert; Example 58's set-based `update()`; Example 59 measures the throughput gap directly; the
capstone's Step 4b/4c bulk-inserts 50 rows and re-triages 53 in exactly 2 statements total).

</details>

**Q24 (co-24 -- The async ORM session).** Why is lazy loading specifically FORBIDDEN under
`AsyncSession`, rather than merely discouraged the way it is under a sync `Session`?

<details>
<summary>Answer</summary>

A lazy load is, underneath, a synchronous, blocking network call -- under `asyncio`, that would block
the entire event loop, defeating the whole point of using async in the first place. `AsyncSession`
therefore forbids implicit lazy loading structurally: touching an unloaded relationship raises an error
rather than silently blocking the event loop, forcing every relationship access to be either eager-loaded
up front or awaited explicitly via the `AsyncAttrs` mixin's `awaitable_attrs` escape hatch (Example 60's
async engine/session; Example 61's async eager loading; Example 62 reproduces the forbidden lazy access;
Example 63's concurrent sessions via `asyncio.gather`).

</details>

**Q25 (co-25 -- ORM vs. raw-SQL tradeoff).** Name one concrete workload where the ORM's own machinery
earns its keep, and one where raw SQL (or a query builder) usually wins, and say WHY for each.

<details>
<summary>Answer</summary>

CRUD and object-graph navigation are where the ORM earns its keep -- the identity map, change tracking,
and relationship navigation directly replace real boilerplate (manual row-to-object mapping, manual
dirty-checking) that raw SQL would otherwise require by hand. A reporting query or a bulk job usually
favors raw SQL or a query builder instead -- the ORM's per-object machinery adds overhead the query never
needed, and a hand-written `GROUP BY` or a set-based `UPDATE` is often SHORTER, not longer, than the
equivalent expressed through mapped entities (Example 64's ORM-vs-raw CRUD; Example 65's ORM-vs-raw
reporting; the capstone's `report_three_tiers.py` shows all three tiers expressing the SAME report at
roughly equal complexity, while Step 4's bulk writes show raw Core clearly winning on throughput).

</details>

**Q26 (co-26 -- Query-builder vs. ORM tradeoff).** What does a query builder buy over the ORM
specifically, when the query's SHAPE is decided at RUNTIME rather than known upfront?

<details>
<summary>Answer</summary>

A query builder composes clauses as VALUES that can be conditionally added based on runtime input (an
optional filter, a dynamic sort column) without string concatenation, while carrying none of the ORM's
identity-map/change-tracking machinery -- machinery that a purely dynamic, read-only filter query never
needed in the first place. The ORM's `select()` can ALSO be built dynamically (it is Core underneath),
but a query builder used standalone (PyPika, with no ORM involved at all) stays a leaner dependency for
a codebase that never needs object identity or persistence (Example 66's dynamic filter built with a
query builder; Example 67 contrasts the same dynamic filter against the ORM's own `select()`).

</details>

**Q27 (co-27 -- Choosing the tier per workload).** State the three-workload rubric this topic closes
on -- CRUD, analytics, and a hot path -- and which tier each one tends to favor.

<details>
<summary>Answer</summary>

CRUD (create/read/update/delete on individual records, with real object-graph navigation) tends to favor
the full ORM -- the identity map and relationship machinery directly pay for themselves. Analytics
(wide aggregations, reporting, joins across many rows with no need for object identity) tends to favor
raw SQL or a query builder -- the ORM's per-object overhead buys nothing a `GROUP BY` doesn't already
express directly. A latency-sensitive hot path (a request handled thousands of times per second, where
every microsecond of ORM overhead compounds) tends to favor raw SQL or a query builder too, for the SAME
reason analytics does -- minimal overhead between the code and the wire (Example 68's CRUD scenario;
Example 69's analytics scenario; Example 70's hot-path scenario; Example 71's hybrid app using the ORM
for CRUD and a raw-SQL escape hatch on the SAME session).

</details>

## Applied problems

Ten scenarios. Each describes a symptom without naming the concept -- decide which one applies, then
check.

**AP1.** A dashboard lists every customer, then for each one separately queries that customer's most
recent order -- the page loads noticeably slower every time the customer list grows, even though nobody
changed the query's logic.

<details>
<summary>Answer</summary>

This is the N+1 problem (co-13, co-15) -- one query lists the customers, then one ADDITIONAL query per
customer fetches that customer's most recent order, so total round trips grow linearly with the customer
count. `selectinload` (or a batched `IN (...)`) collapses this to a constant 2 queries regardless of how
many customers exist (Example 36; Example 37; the capstone's Step 3 measures the identical shape).

</details>

**AP2.** A "remove this team" admin action deletes the team's row and, without any extra code, its
members' rows silently vanish too -- but a colleague reviewing the relationship config cannot find any
database-level `ON DELETE CASCADE` on the member table's foreign key at all.

<details>
<summary>Answer</summary>

This is the ORM's OWN cascade (co-22) -- `cascade="all, delete-orphan"` on the `Team.members`
relationship is entirely Python-side configuration; SQLAlchemy computes and issues the child `DELETE`
statements itself, before the parent's, regardless of whatever (or however little) the database schema
itself declares (Example 55; the capstone's Step 3g deletes its own scratch team this exact way).

</details>

**AP3.** A search box lets a user type a customer name, and the query behind it is built with an
f-string interpolating that typed value directly into the SQL text -- a security review flags it before
it ever reaches production.

<details>
<summary>Answer</summary>

This is the string-interpolation injection risk parameterized queries exist to prevent (co-02, co-05) --
a crafted input containing a quote can break out of its intended string literal and add arbitrary SQL the
query never intended. A `%s` placeholder sends the value on a separate channel from the SQL text, so it
can never be interpreted as SQL syntax regardless of its contents (Example 3; Example 11; Drilling Kata 3
reproduces the exact injection and its fix).

</details>

**AP4.** A migration's `downgrade()` simply runs `DROP COLUMN first_name` and `DROP COLUMN last_name` --
a rollback in production genuinely undoes the SCHEMA change, but every customer's name is permanently
gone afterward, because the original `full_name` column was already dropped by `upgrade()`.

<details>
<summary>Answer</summary>

This is a migration that reverses the SCHEMA but not the DATA (co-21) -- true reversibility for a data
migration means `downgrade()` must MERGE the split values back into the original column before dropping
the new ones, not just discard them. A naive drop-only `downgrade()` looks reversible (the schema shape
does round-trip) while silently destroying real user data (Example 53 shows the correct merge-back
pattern; Example 54 shows a migration the topic explicitly marks irreversible rather than pretending
otherwise).

</details>

**AP5.** A nightly batch job inserts 50,000 new rows by constructing 50,000 ORM objects and calling
`session.add()` on each one in a loop -- it works correctly, but a colleague rewrites it using Core's
`insert()` with a list of dicts and the job's runtime drops by more than half.

<details>
<summary>Answer</summary>

This is the bulk-operations tradeoff (co-23) -- the per-object ORM loop constructs 50,000 tracked
Python objects and issues up to 50,000 individual `INSERT`s at flush, machinery that pure bulk
throughput never needed. Core's `insert()` executed with a list of dicts never constructs an ORM object
at all, batching the whole write into far fewer statements (Example 57; Example 59 measures the gap
directly; the capstone's Step 4b bulk-inserts 50 rows in exactly 1 statement).

</details>

**AP6.** A connection pool sized for normal daytime traffic starts rejecting new requests during a
traffic spike, even though the database server itself still has plenty of spare capacity and CPU.

<details>
<summary>Answer</summary>

This is pool exhaustion (co-18) -- `pool_size` plus `max_overflow` caps how many connections the
application's OWN pool will hand out at once, independent of whatever capacity the database server
itself has left; once every pooled (and overflow) connection is checked out, the NEXT request waits
(or fails) regardless of server headroom. Raising `pool_size`/`max_overflow` (or shortening how long
requests hold a connection) relieves this, without touching the database server at all (Example 45;
Example 46 reproduces exhaustion directly; Example 77 tunes against a concurrency target).

</details>

**AP7.** An async request handler awaits a query for a list of orders, then (forgetting the codebase is
async) accesses `order.customer.name` on one of them directly -- the app crashes instead of just running
a bit slower the way the SAME mistake would under a synchronous handler.

<details>
<summary>Answer</summary>

This is the forbidden implicit lazy load under `AsyncSession` (co-24) -- a lazy load is a blocking
network call underneath, and blocking calls are structurally disallowed inside `asyncio`'s event loop, so
SQLAlchemy raises an error immediately rather than silently blocking everything else the event loop is
doing. The fix is eager-loading the relationship up front, or awaiting it explicitly through the
`AsyncAttrs` mixin's `awaitable_attrs` escape hatch (Example 61; Example 62 reproduces the exact crash).

</details>

**AP8.** A report needs a wide, multi-table aggregation with a dynamically chosen set of filter columns
decided at request time -- the team debates writing it as ORM `select()` calls versus a standalone query
builder, and ships whichever version is genuinely shorter to read.

<details>
<summary>Answer</summary>

This is the query-builder-vs-ORM style choice for a dynamic query (co-26) -- both a standalone builder
and the ORM's own `select()` (itself Core underneath) can compose clauses conditionally at runtime
without string concatenation; the choice between them is about which one already integrates with the
REST of the codebase (an ORM-heavy codebase likely already imports SQLAlchemy; a codebase with no ORM
at all keeps a leaner footprint with a standalone builder) rather than a hard capability difference
(Example 66; Example 67 contrasts both directly on the SAME dynamic filter).

</details>

**AP9.** `alembic revision --autogenerate` proposes dropping an index nobody on the team remembers
adding through a migration at all -- it turns out a DBA created it directly in production months ago,
and autogenerate is simply reporting the real difference between the live schema and what the models
currently declare.

<details>
<summary>Answer</summary>

This is exactly why autogenerate's output needs a human review before it ships (co-20) -- it is
correctly reporting a real DIFFERENCE between the live database and the models, but "the model doesn't
mention this index" does not automatically mean "drop the index" is the right migration; it might
instead mean the MODEL should be updated to declare an index that already exists and is doing real work
in production. Autogenerate proposes; a human decides which side of the diff is actually wrong (Example
51; Example 52 shows a different case autogenerate gets subtly wrong for a related reason).

</details>

**AP10.** A team chooses to write their entire analytics dashboard's queries through the SAME
SQLAlchemy ORM models their CRUD API already uses, reasoning "one less library to learn" -- six months
later, several of the heaviest reports are the slowest, hardest-to-optimize code in the whole codebase.

<details>
<summary>Answer</summary>

This is choosing the WRONG tier for the workload (co-27) -- CRUD (the API) and analytics (the
dashboard) are different workload shapes with different needs: CRUD benefits from the ORM's identity map
and relationship navigation, while analytics benefits from raw SQL or a query builder's minimal overhead
over a wide aggregation. Using ONE tier everywhere for consistency's sake trades away exactly the tradeoff
this topic's rubric exists to make deliberately (Example 68's CRUD scenario; Example 69's analytics
scenario; Example 70's hot-path scenario, the SAME lesson applied a third way).

</details>

## Code katas

Six hands-on repetition drills against a real PostgreSQL 18.4 database. Each is a before/after `.py`
file colocated under `drilling/code/`. Every "before" script is real and runnable and misapplies the
concept being drilled -- run it yourself, diagnose the bug from the observed output, fix it from memory,
then compare your fix against the "after" script and the model solution before checking your work
against the actually-executed output shown. Every kata script is fully type-annotated and
`pyright --strict` clean (via the `# pyright: strict` file-level directive this topic's own examples
already use).

### Kata 1 -- a "clean" property still hides an N+1 inside it

_relates to co-13, co-15, Example 36_

**Task.** `customer.order_total` looks like a plain, self-contained computation from every call site --
but it reads `self.orders` internally, and that relationship is still lazy-loaded by default. Summing
`order_total` across 5 customers should cost 2 queries with the right fix, not 6.

**Before** (`drilling/code/kata-01-n-plus-1-hidden-in-property/before/kata.py`)

```python
# pyright: strict
"""Kata 1 (before): a "clean" loop still hides an N+1 -- the lazy load is inside a property."""

from __future__ import annotations

import os
from collections.abc import Generator
from contextlib import contextmanager
from decimal import Decimal
from typing import Any

from sqlalchemy import Engine, ForeignKey, create_engine, event, select, text
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship

SQLA_URL: str = os.environ.get("SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example")


class Base(DeclarativeBase):
    pass


class Customer(Base):  # => the "clean" property below hides its own lazy load from every call site
    __tablename__ = "customer"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    orders: Mapped[list["CustomerOrder"]] = relationship(back_populates="customer")  # => co-13: default lazy

    @property
    def order_total(self) -> Decimal:  # => LOOKS like a plain in-memory computation from any call site
        return sum((o.total for o in self.orders), Decimal("0"))  # => BUG: `.orders` fires its OWN lazy SELECT


class CustomerOrder(Base):
    __tablename__ = "customer_order"
    id: Mapped[int] = mapped_column(primary_key=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customer.id"))
    total: Mapped[Decimal]
    customer: Mapped[Customer] = relationship(back_populates="orders")


@contextmanager
def query_counter(engine: Engine) -> Generator[list[int]]:
    box = [0]

    def on_execute(conn: Any, cursor: Any, statement: str, *rest: Any) -> None:
        if statement.strip().upper().startswith("SELECT"):
            box[0] += 1

    listener = event.listens_for(engine, "before_cursor_execute")(on_execute)
    try:
        yield box
    finally:
        event.remove(engine, "before_cursor_execute", listener)


if __name__ == "__main__":
    engine = create_engine(SQLA_URL)
    with engine.begin() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        for i in range(5):  # => 5 customers, one order each
            session.add(Customer(name=f"Customer{i}", orders=[CustomerOrder(total=Decimal("9.99"))]))
        session.commit()

    with query_counter(engine) as counter:
        with Session(engine) as session:
            customers = session.execute(select(Customer)).scalars().all()  # => query #1: the 5 parents
            grand_total = sum((c.order_total for c in customers), Decimal("0"))  # => intent: ONE clean sum expression
            # BUG: `c.order_total` is a property, but internally it still touches `.orders` -- one lazy
            # SELECT fires PER customer inside this "clean" one-liner, exactly like Example 36's raw loop
    print(f"grand_total={grand_total} queries={counter[0]}")  # => Output: grand_total=49.95 queries=6
```

**Observed (buggy) output** (captured by actually running `python3 kata.py` -- 6 queries: 1 parent + 5
lazy loads, one per customer, even though the code reads like a single clean sum):

```text
grand_total=49.95 queries=6
```

**After** (`drilling/code/kata-01-n-plus-1-hidden-in-property/after/kata.py`)

```python
# pyright: strict
"""Kata 1 (after): selectinload() up front -- the property's own logic never changes."""

from __future__ import annotations

import os
from collections.abc import Generator
from contextlib import contextmanager
from decimal import Decimal
from typing import Any

from sqlalchemy import Engine, ForeignKey, create_engine, event, select, text
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship, selectinload

SQLA_URL: str = os.environ.get("SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example")


class Base(DeclarativeBase):
    pass


class Customer(Base):
    __tablename__ = "customer"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    orders: Mapped[list["CustomerOrder"]] = relationship(back_populates="customer")

    @property
    def order_total(self) -> Decimal:  # => UNCHANGED -- the property itself was never the bug
        return sum((o.total for o in self.orders), Decimal("0"))


class CustomerOrder(Base):
    __tablename__ = "customer_order"
    id: Mapped[int] = mapped_column(primary_key=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customer.id"))
    total: Mapped[Decimal]
    customer: Mapped[Customer] = relationship(back_populates="orders")


@contextmanager
def query_counter(engine: Engine) -> Generator[list[int]]:
    box = [0]

    def on_execute(conn: Any, cursor: Any, statement: str, *rest: Any) -> None:
        if statement.strip().upper().startswith("SELECT"):
            box[0] += 1

    listener = event.listens_for(engine, "before_cursor_execute")(on_execute)
    try:
        yield box
    finally:
        event.remove(engine, "before_cursor_execute", listener)


if __name__ == "__main__":
    engine = create_engine(SQLA_URL)
    with engine.begin() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        for i in range(5):
            session.add(Customer(name=f"Customer{i}", orders=[CustomerOrder(total=Decimal("9.99"))]))
        session.commit()

    with query_counter(engine) as counter:
        with Session(engine) as session:
            stmt = select(Customer).options(selectinload(Customer.orders))  # => THE FIX: eager-load BEFORE the loop
            customers = session.execute(stmt).scalars().all()  # => query #1 (parents) + query #2 (batched children)
            grand_total = sum((c.order_total for c in customers), Decimal("0"))  # => the property call site NEVER changed
    print(f"grand_total={grand_total} queries={counter[0]}")  # => Output: grand_total=49.95 queries=2
```

<details>
<summary>Model solution</summary>

**Root cause**: a `@property` LOOKS like a self-contained, pure computation from every call site, but it
still executes the SAME `self.orders` attribute access underneath -- and a lazy relationship fires its
own `SELECT` the first time it is touched, regardless of whether that touch happens directly or through
a property. The fix never changes the property's own code at all -- it eager-loads `.orders` for every
customer in the SAME initial query, so by the time the property runs, the data is already in memory.

**Run**: `python3 kata.py`

**Output**:

```text
grand_total=49.95 queries=2
```

</details>

### Kata 2 -- reading a relationship after the session closed

_relates to co-11, co-13, Example 35_

**Task.** A customer is fetched, the session that fetched it closes, and later code reads
`customer.orders` -- accessing an unloaded relationship on a DETACHED object has no open session left to
run the lazy query against.

**Before** (`drilling/code/kata-02-detached-instance-error/before/kata.py`)

```python
# pyright: strict
"""Kata 2 (before): reading a relationship AFTER the session closed raises DetachedInstanceError."""

from __future__ import annotations

import os

from sqlalchemy import ForeignKey, create_engine, select, text
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship
from sqlalchemy.orm.exc import DetachedInstanceError

SQLA_URL: str = os.environ.get("SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example")


class Base(DeclarativeBase):
    pass


class Customer(Base):
    __tablename__ = "customer"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    orders: Mapped[list["CustomerOrder"]] = relationship(back_populates="customer")  # => co-13: default lazy


class CustomerOrder(Base):
    __tablename__ = "customer_order"
    id: Mapped[int] = mapped_column(primary_key=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customer.id"))
    customer: Mapped[Customer] = relationship(back_populates="orders")


if __name__ == "__main__":
    engine = create_engine(SQLA_URL)
    with engine.begin() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        session.add(Customer(name="Ada", orders=[]))
        session.commit()

    with Session(engine) as session:  # => intent: fetch Ada, then read her orders once the query itself is done
        ada = session.execute(select(Customer)).scalars().one()
    # BUG: the `with` block above already closed -- `ada` is now DETACHED. `.orders` was never touched
    # INSIDE the session, so nothing loaded it yet -- the attempt below fires a lazy load with NO session
    try:
        _ = ada.orders  # => BUG: no open session left to run the lazy SELECT against
        print("no error raised")  # => never reached if the bug is real
    except DetachedInstanceError as exc:
        print(f"raised={type(exc).__name__}")  # => Output: raised=DetachedInstanceError
```

**Observed (buggy) output** (captured by actually running `python3 kata.py`):

```text
raised=DetachedInstanceError
```

**After** (`drilling/code/kata-02-detached-instance-error/after/kata.py`)

```python
# pyright: strict
"""Kata 2 (after): eager-load INSIDE the session, before it closes -- no lazy load needed afterward."""

from __future__ import annotations

import os

from sqlalchemy import ForeignKey, create_engine, select, text
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship, selectinload

SQLA_URL: str = os.environ.get("SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example")


class Base(DeclarativeBase):
    pass


class Customer(Base):
    __tablename__ = "customer"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    orders: Mapped[list["CustomerOrder"]] = relationship(back_populates="customer")


class CustomerOrder(Base):
    __tablename__ = "customer_order"
    id: Mapped[int] = mapped_column(primary_key=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customer.id"))
    customer: Mapped[Customer] = relationship(back_populates="orders")


if __name__ == "__main__":
    engine = create_engine(SQLA_URL)
    with engine.begin() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        session.add(Customer(name="Ada", orders=[]))
        session.commit()

    with Session(engine) as session:  # => THE FIX: eager-load `.orders` BEFORE the session closes
        stmt = select(Customer).options(selectinload(Customer.orders))  # => co-14: loaded up front, not on first touch
        ada = session.execute(stmt).scalars().one()
        order_count = len(ada.orders)  # => still reads it INSIDE the session, but ALREADY in memory -- no new SELECT
    # the `with` block closed here too -- `ada` is detached -- but `.orders` was already populated above
    print(f"order_count={order_count}")  # => Output: order_count=0 -- reading the SAME (empty) relationship, no error
    _ = ada.orders  # => safe: already loaded, reading a detached-but-populated collection raises nothing
    print("no error raised")  # => Output: no error raised
```

<details>
<summary>Model solution</summary>

**Root cause**: a relationship's default (lazy) loading strategy defers its `SELECT` until first touch,
and a `DETACHED` object has no session left to run that deferred query against. The fix does not avoid
detachment -- `ada` is still detached at the exact same point -- it instead ensures `.orders` is already
LOADED before detachment happens, via `selectinload`, so nothing needs to query anything afterward.

**Run**: `python3 kata.py`

**Output**:

```text
order_count=0
no error raised
```

</details>

### Kata 3 -- an f-string builds a SQL injection a `%s` placeholder prevents

_relates to co-02, co-05, Example 3_

**Task.** A "find customer by name" lookup should return zero rows for a crafted, nonexistent name. The
version below is broken: it interpolates the untrusted value directly into the SQL text with an
f-string, and a crafted `"Ada' OR '1'='1"` input returns EVERY row instead of none.

**Before** (`drilling/code/kata-03-string-interpolation-injection/before/kata.py`)

```python
# pyright: strict
"""Kata 3 (before): an f-string-interpolated WHERE clause lets a crafted name return every row."""

from __future__ import annotations

import os

import psycopg

PG_DSN: str = os.environ.get("PG_DSN", "postgresql://postgres:postgres@localhost:5432/orm_by_example")


if __name__ == "__main__":
    with psycopg.connect(PG_DSN, autocommit=True) as conn:
        conn.execute("DROP SCHEMA public CASCADE")
        conn.execute("CREATE SCHEMA public")
        conn.execute("CREATE TABLE customer(id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL)")
        conn.execute(
            "INSERT INTO customer(name, email) VALUES (%s, %s), (%s, %s)",
            ("Ada", "ada@example.com", "Grace", "secret@example.com"),
        )

    # intent: look up ONE customer by a name typed into a search box
    untrusted_input = "Ada' OR '1'='1"  # => a name that was never actually seeded -- crafted to always be true
    with psycopg.connect(PG_DSN) as conn:
        # BUG: the untrusted value is spliced directly into the SQL TEXT via an f-string -- pyright still
        # accepts this as a LiteralString (every PIECE of the f-string is itself a literal), which is
        # EXACTLY why the type checker cannot catch this bug: the type system only proves "not built from
        # unknown runtime data," never "safe to interpolate untrusted VALUES into," a narrower guarantee
        sql_text = f"SELECT id, name, email FROM customer WHERE name = '{untrusted_input}'"
        rows = conn.execute(sql_text).fetchall()  # => the crafted quote breaks OUT of the intended string literal
    print(f"rows_returned={len(rows)}")  # => Output: rows_returned=2 -- BOTH customers, including Grace's secret email
    print(f"emails={[r[2] for r in rows]}")  # => Output: emails=['ada@example.com', 'secret@example.com']
```

**Observed (buggy) output** (captured by actually running `python3 kata.py` -- the crafted input matches
BOTH rows, leaking Grace's email even though nobody searched for "Grace"):

```text
rows_returned=2
emails=['ada@example.com', 'secret@example.com']
```

**After** (`drilling/code/kata-03-string-interpolation-injection/after/kata.py`)

```python
# pyright: strict
"""Kata 3 (after): a %s placeholder keeps the untrusted value OUT of the SQL text entirely."""

from __future__ import annotations

import os

import psycopg

PG_DSN: str = os.environ.get("PG_DSN", "postgresql://postgres:postgres@localhost:5432/orm_by_example")


if __name__ == "__main__":
    with psycopg.connect(PG_DSN, autocommit=True) as conn:
        conn.execute("DROP SCHEMA public CASCADE")
        conn.execute("CREATE SCHEMA public")
        conn.execute("CREATE TABLE customer(id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL)")
        conn.execute(
            "INSERT INTO customer(name, email) VALUES (%s, %s), (%s, %s)",
            ("Ada", "ada@example.com", "Grace", "secret@example.com"),
        )

    untrusted_input = "Ada' OR '1'='1"  # => the SAME crafted string -- the fix does not depend on cleaning the input
    with psycopg.connect(PG_DSN) as conn:
        # THE FIX: %s is a placeholder -- the driver sends the value as DATA, on a separate wire from the SQL text,
        # so the quote inside untrusted_input can never be interpreted as SQL syntax at all
        rows = conn.execute("SELECT id, name, email FROM customer WHERE name = %s", (untrusted_input,)).fetchall()
    print(f"rows_returned={len(rows)}")  # => Output: rows_returned=0 -- no customer is literally named "Ada' OR '1'='1"
    print(f"emails={[r[2] for r in rows]}")  # => Output: emails=[] -- Grace's email was never at risk
```

<details>
<summary>Model solution</summary>

**Root cause**: `f"... = '{value}'"` builds ONE combined SQL text before the database ever sees it -- a
quote inside `value` breaks out of the intended string literal and adds real SQL. A `%s` placeholder
sends the SQL text and the value as two SEPARATE pieces of data; the database parses the text once into
a fixed structure and only then binds the value into it, so a quote inside the value can never change
the query's structure.

**Run**: `python3 kata.py`

**Output**:

```text
rows_returned=0
emails=[]
```

</details>

### Kata 4 -- deleting a parent with no cascade configured fails with IntegrityError

_relates to co-22, Example 55_

**Task.** Deleting a customer should remove the customer and their orders together. The version below is
broken: the relationship carries NO `cascade=` option at all, so the ORM tries (and fails) to leave the
order rows behind with their required, `NOT NULL` `customer_id` pointing at a row about to vanish.

**Before** (`drilling/code/kata-04-missing-cascade-orphan/before/kata.py`)

```python
# pyright: strict
"""Kata 4 (before): deleting a parent WITHOUT cascade="all, delete-orphan" fails with an IntegrityError."""

from __future__ import annotations

import os

from sqlalchemy import ForeignKey, create_engine, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship

SQLA_URL: str = os.environ.get("SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example")


class Base(DeclarativeBase):
    pass


class Customer(Base):
    __tablename__ = "customer"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    # BUG: no cascade= option at all -- the ORM's default relationship config neither cascades the
    # delete to orders NOR nulls out their FK, so it just leaves them referencing a row about to vanish
    orders: Mapped[list["CustomerOrder"]] = relationship(back_populates="customer")


class CustomerOrder(Base):
    __tablename__ = "customer_order"
    id: Mapped[int] = mapped_column(primary_key=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customer.id"), nullable=False)  # => required -- can't be nulled
    customer: Mapped[Customer] = relationship(back_populates="orders")


if __name__ == "__main__":
    engine = create_engine(SQLA_URL)
    with engine.begin() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        session.add(Customer(name="Ada", orders=[CustomerOrder()]))
        session.commit()

    with Session(engine) as session:  # => intent: Ada is being removed entirely, orders and all
        ada = session.execute(select(Customer)).scalars().one()
        session.delete(ada)
        try:
            session.commit()  # => BUG: no cascade config -- the database's own NOT NULL FK rejects the orphan
            print("delete succeeded")  # => never reached if the bug is real
        except IntegrityError as exc:
            print(f"raised={type(exc).__name__}")  # => Output: raised=IntegrityError
            session.rollback()  # => leaves the session usable for anything that comes after this kata
```

**Observed (buggy) output** (captured by actually running `python3 kata.py`):

```text
raised=IntegrityError
```

**After** (`drilling/code/kata-04-missing-cascade-orphan/after/kata.py`)

```python
# pyright: strict
"""Kata 4 (after): cascade="all, delete-orphan" -- deleting the parent deletes its orders too."""

from __future__ import annotations

import os

from sqlalchemy import ForeignKey, create_engine, select, text
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship

SQLA_URL: str = os.environ.get("SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example")


class Base(DeclarativeBase):
    pass


class Customer(Base):
    __tablename__ = "customer"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    # THE FIX: cascade="all, delete-orphan" -- the ORM now issues DELETE FROM customer_order BEFORE
    # DELETE FROM customer, instead of trying (and failing) to null out a NOT NULL FK column
    orders: Mapped[list["CustomerOrder"]] = relationship(back_populates="customer", cascade="all, delete-orphan")


class CustomerOrder(Base):
    __tablename__ = "customer_order"
    id: Mapped[int] = mapped_column(primary_key=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customer.id"), nullable=False)
    customer: Mapped[Customer] = relationship(back_populates="orders")


if __name__ == "__main__":
    engine = create_engine(SQLA_URL)
    with engine.begin() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        session.add(Customer(name="Ada", orders=[CustomerOrder()]))
        session.commit()

    with Session(engine) as session:
        ada = session.execute(select(Customer)).scalars().one()
        session.delete(ada)
        session.commit()  # => THE FIX: succeeds -- the ORM deletes the order row first, then the customer row

    with Session(engine) as session:
        remaining_customers = session.execute(select(Customer)).scalars().all()
        remaining_orders = session.execute(select(CustomerOrder)).scalars().all()
    print(f"remaining_customers={len(remaining_customers)} remaining_orders={len(remaining_orders)}")  # => Output: remaining_customers=0 remaining_orders=0
```

<details>
<summary>Model solution</summary>

**Root cause**: with no `cascade=` option, SQLAlchemy's default relationship behavior tries to detach
the child from the parent by setting its foreign key to `NULL` before deleting the parent -- a strategy
that only works when the FK column is nullable. Because `customer_id` is `NOT NULL`, that attempted
`UPDATE` collides with the column's own constraint, and the database rejects it as an `IntegrityError`.
`cascade="all, delete-orphan"` tells the ORM to delete the child rows outright instead of trying to
detach them, which respects the `NOT NULL` constraint by removing the row entirely rather than nulling
one of its required columns.

**Run**: `python3 kata.py`

**Output**:

```text
remaining_customers=0 remaining_orders=0
```

</details>

### Kata 5 -- disabling autoflush produces a stale read inside the same session

_relates to co-12, Example 33_

**Task.** A row just added via `session.add()` should be visible to a query run in the SAME session
right after. The version below is broken: it constructs the session with `autoflush=False`, so the
pending `INSERT` never reaches the database before the count query runs.

**Before** (`drilling/code/kata-05-autoflush-disabled-stale-read/before/kata.py`)

```python
# pyright: strict
"""Kata 5 (before): autoflush=False -- a query right after add() misses the pending row entirely."""

from __future__ import annotations

import os

from sqlalchemy import create_engine, func, select, text
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

SQLA_URL: str = os.environ.get("SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example")


class Base(DeclarativeBase):
    pass


class Customer(Base):
    __tablename__ = "customer"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]


if __name__ == "__main__":
    engine = create_engine(SQLA_URL)
    with engine.begin() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
    Base.metadata.create_all(engine)

    # BUG: autoflush=False -- disables the unit of work's normal "flush pending changes before every
    # query" behavior (co-12), usually turned off ONLY for a narrow performance reason, rarely globally
    with Session(engine, autoflush=False) as session:
        session.add(Customer(name="Ada"))  # => PENDING -- no INSERT sent to Postgres yet
        count = session.execute(select(func.count()).select_from(Customer)).scalar_one()  # => intent: count includes Ada
        print(f"count_before_manual_flush={count}")  # => Output: count_before_manual_flush=0 -- Ada is invisible to THIS query
        session.rollback()  # => the pending INSERT is discarded -- Ada was never durably added at all
```

**Observed (buggy) output** (captured by actually running `python3 kata.py`):

```text
count_before_manual_flush=0
```

**After** (`drilling/code/kata-05-autoflush-disabled-stale-read/after/kata.py`)

```python
# pyright: strict
"""Kata 5 (after): the default autoflush=True flushes the pending INSERT before the SELECT runs."""

from __future__ import annotations

import os

from sqlalchemy import create_engine, func, select, text
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

SQLA_URL: str = os.environ.get("SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example")


class Base(DeclarativeBase):
    pass


class Customer(Base):
    __tablename__ = "customer"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]


if __name__ == "__main__":
    engine = create_engine(SQLA_URL)
    with engine.begin() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
    Base.metadata.create_all(engine)

    # THE FIX: plain Session(engine) -- autoflush defaults to True, so the unit of work (co-12) flushes
    # every pending change BEFORE any query runs in the same session, keeping reads self-consistent
    with Session(engine) as session:
        session.add(Customer(name="Ada"))  # => still PENDING at this exact line -- same starting point as "before"
        count = session.execute(select(func.count()).select_from(Customer)).scalar_one()  # => autoflush fires FIRST
        print(f"count_with_default_autoflush={count}")  # => Output: count_with_default_autoflush=1 -- Ada is visible
        session.commit()
```

<details>
<summary>Model solution</summary>

**Root cause**: the unit of work normally flushes every pending change BEFORE running a new query,
specifically so a read inside the SAME session never misses its own uncommitted writes.
`autoflush=False` disables exactly that safeguard, so the count query runs against whatever the database
already durably contained, ignoring the still-pending `INSERT`. The default (`autoflush=True`, no
argument needed) is almost always the right choice; disabling it is a narrow, deliberate performance
optimization, not a safe default.

**Run**: `python3 kata.py`

**Output**:

```text
count_with_default_autoflush=1
```

</details>

### Kata 6 -- the identity map does not hold ACROSS separate sessions

_relates to co-10, Example 27_

**Task.** Two DIFFERENT sessions each fetch the SAME customer by primary key. The version below
demonstrates the common misconception that identity holds globally: it fetches through two separate
sessions and observes two DIFFERENT Python objects, even though both carry the same data.

**Before** (`drilling/code/kata-06-identity-map-scoped-to-session/before/kata.py`)

```python
# pyright: strict
"""Kata 6 (before): assuming identity holds ACROSS sessions -- the identity map is per-Session, not global."""

from __future__ import annotations

import os

from sqlalchemy import create_engine, select, text
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

SQLA_URL: str = os.environ.get("SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example")


class Base(DeclarativeBase):
    pass


class Customer(Base):
    __tablename__ = "customer"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]


if __name__ == "__main__":
    engine = create_engine(SQLA_URL)
    with engine.begin() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        session.add(Customer(name="Ada"))
        session.commit()

    # BUG: two SEPARATE sessions, each fetching the SAME row by primary key -- co-10's identity map is
    # scoped to ONE session's own identity map, never shared or synchronized across different sessions
    with Session(engine) as session_a:
        ada_a = session_a.execute(select(Customer)).scalars().one()
    with Session(engine) as session_b:
        ada_b = session_b.execute(select(Customer)).scalars().one()
    print(f"same_object_across_sessions={ada_a is ada_b}")  # => Output: same_object_across_sessions=False
    print(f"same_data={ada_a.name == ada_b.name}")  # => Output: same_data=True -- equal VALUES, different OBJECTS
```

**Observed output** (captured by actually running `python3 kata.py` -- not a crash, but a common
misconception laid bare: identity does NOT hold across two separate sessions):

```text
same_object_across_sessions=False
same_data=True
```

**After** (`drilling/code/kata-06-identity-map-scoped-to-session/after/kata.py`)

```python
# pyright: strict
"""Kata 6 (after): fetch through ONE shared session -- identity holds WITHIN its own identity map."""

from __future__ import annotations

import os

from sqlalchemy import create_engine, select, text
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

SQLA_URL: str = os.environ.get("SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example")


class Base(DeclarativeBase):
    pass


class Customer(Base):
    __tablename__ = "customer"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]


if __name__ == "__main__":
    engine = create_engine(SQLA_URL)
    with engine.begin() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        session.add(Customer(name="Ada"))
        session.commit()

    # THE FIX: fetch BOTH references through the SAME session -- co-10's identity map guarantees ONE
    # Python object per primary key WITHIN this one session, which is the guarantee it actually makes
    with Session(engine) as session:
        ada_a = session.execute(select(Customer)).scalars().one()  # => query #1
        ada_b = session.get(Customer, ada_a.id)  # => served from the identity map -- no second SELECT
    print(f"same_object_within_one_session={ada_a is ada_b}")  # => Output: same_object_within_one_session=True
    assert ada_a is ada_b  # => co-10: the guarantee holds -- scoped correctly to ONE session, as designed
```

<details>
<summary>Model solution</summary>

**Root cause**: the identity map is an attribute of ONE `Session` object's own internal state -- it was
never designed to be a cross-session or process-wide cache, and two independently constructed sessions
have two independently empty identity maps to start with. The "fix" is really a correction of
expectation, not a code change to the identity map itself: fetch through the SAME session whenever code
depends on object identity holding, and treat cross-session equality as VALUE equality only.

**Run**: `python3 kata.py`

**Output**:

```text
same_object_within_one_session=True
```

</details>

## Why it matters

Every drill above traces back to this topic's two cross-cutting big ideas. `abstraction-and-its-cost`
(Kata 1, Kata 2, AP1, AP7) -- each tier hides more SQL for more leverage, and the hidden SQL leaks back
out as an N+1, a `DetachedInstanceError`, or a forbidden async lazy load the moment nobody is watching
for it. `coupling-vs-cohesion` (Kata 4, Kata 5, AP2, AP10) -- a Data-Mapper/Session layer keeps
persistence concerns cohesive and decoupled from domain logic, but that cohesion only holds as long as
cascade config, autoflush behavior, and tier choice are set DELIBERATELY, not left to whatever the
framework happens to default to. Knowing which tier a piece of code is standing on, and what that tier
hides in exchange for its leverage, is this topic's own "keep-this-if-you-forget-everything" claim --
these drills exist to make that knowledge automatic, not just recognized when pointed out.

---

← Previous: [Capstone](../learning/capstone/overview.md) &middot; Next: [Build Your Own ORM & Query Builder](../../build-your-own-orm-and-query-builder/learning/overview.md) →
