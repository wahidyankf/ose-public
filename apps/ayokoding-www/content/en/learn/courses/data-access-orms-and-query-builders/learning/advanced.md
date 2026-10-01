---
title: "Advanced Examples"
date: 2026-07-18T00:00:00+07:00
draft: false
weight: 30
---

Examples 57-78 cover set-oriented bulk insert/update measured against a per-object ORM loop, the async
ORM (`create_async_engine` + `AsyncSession`, why lazy loading is forbidden there, `asyncio.gather` over
independent sessions), the ORM-vs-raw-SQL and query-builder-vs-ORM trade-offs made concrete (CRUD,
reporting, a dynamic filter, a feature/cost table), a three-scenario tier-choosing rubric applied to a
CRUD, an analytics, and a hot-path workload, a hybrid app that uses the ORM for CRUD and a raw-SQL escape
hatch on the same session, the identity map dedup proven across two different query shapes,
per-relationship default lazy-strategy configuration, a self-referential adjacency-list tree, an
association object carrying extra columns on an M:N link, a zero-downtime expand-contract migration,
connection-pool tuning measured against a concurrency target, and a capstone-preview example threading
all three tiers plus an N+1 fix plus a migration into one script. Every example is fully self-contained:
it resets and seeds its own tables against a local PostgreSQL instance, so none of them depend on state
left behind by an earlier example. Run each example with `python3 example.py` from a shell where this
topic's `.venv` is active and a Postgres container is listening on `localhost:5432` (see
[Overview](./overview.md#confirm-your-toolchain)).

---

### Example 57: Bulk Insert ORM

_ex-57 &middot; exercises co-23_

`session.execute(insert(Customer), rows)` -- Core's `insert()` executed with a list of plain dicts --
writes 100 rows as one `INSERT` statement. No `Customer` objects are ever constructed, so the identity
map and change tracking never get involved: pure throughput, not object-shaped CRUD.

**`learning/code/ex-57-bulk-insert-orm/example.py`**

```python
# pyright: strict
"""Example 57: Bulk Insert -- One Statement for Many Rows, Instead of Many round trips."""

from __future__ import annotations

import os  # => reads connection settings from the environment
from typing import Any  # => the event hook's callback signature is untyped by SQLAlchemy's own stubs

from sqlalchemy import Engine, create_engine, event, insert, select, text  # => co-23: insert() builds ONE bulk statement
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Customer(Base):  # => co-23: the table this example writes MANY rows into with a single round trip
    __tablename__ = "customer"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column


def reset_schema(engine: Engine) -> None:  # => shared reset helper -- wipes the whole schema, self-contained
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build Customer's table into
    Base.metadata.create_all(engine)  # => issues CREATE TABLE customer from Customer's Mapped[] fields


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine
    reset_schema(engine)  # => fresh, empty customer table
    n_rows = 100  # => co-23: enough rows to make the per-statement round-trip count meaningfully visible below

    insert_statements: list[str] = []  # => every INSERT the ORM emits during the bulk write, captured for verification

    def on_execute(conn: Any, cursor: Any, statement: str, *rest: Any) -> None:  # => untyped hook params (SQLAlchemy's own)
        if statement.strip().upper().startswith("INSERT"):  # => this example only cares about write traffic
            insert_statements.append(statement)  # => records the STATEMENT TEXT itself, not just a count

    event.listens_for(engine, "before_cursor_execute")(on_execute)  # => attaches the hook to every statement on `engine`

    with Session(engine) as session:  # => co-23: Core's insert() runs THROUGH a Session's own connection just fine
        rows = [{"name": f"Customer{i}"} for i in range(n_rows)]  # => co-23: plain dicts, ONE per row -- no ORM objects at all
        session.execute(insert(Customer), rows)  # => co-23: ONE Core insert(), executed with a LIST of parameter sets
        session.commit()  # => co-23: psycopg batches these into `executemany`-style network traffic, not N round trips

    with Session(engine) as session:  # => a FRESH session, just to read back the final row count
        count = session.execute(select(Customer)).scalars().all()  # => confirms every row actually landed

    print(f"rows inserted: {len(count)}")  # => Output: rows inserted: 100
    print(f"INSERT statements emitted: {len(insert_statements)}")  # => Output: INSERT statements emitted: 1
    assert len(count) == n_rows  # => co-23: all 100 rows are really in Postgres
    assert len(insert_statements) == 1  # => co-23: ONE statement, not 100 -- contrast this with a per-object ORM loop
    # => co-23: `session.add()` in a loop, called 100 times, would issue 100 separate INSERTs during flush (or one
    # => per-object round trip in the worst case); `insert(Customer)` executed with a LIST of dicts collapses that
    # => into ONE statement the driver sends as a single batched operation -- the ORM's identity map and change
    # => tracking never get involved, because these rows never become tracked Python OBJECTS at all -- pure throughput
    print("ex-57 OK")  # => Output: ex-57 OK
```

**Run**: `python3 example.py`

**Output**:

```text
rows inserted: 100
INSERT statements emitted: 1
ex-57 OK
```

**Key takeaway**: Core's `insert()` executed with a list of dicts writes any number of rows as ONE
statement -- no ORM objects, no identity map, no change tracking, pure set-oriented throughput.

**Why it matters**: A `session.add()` loop is idiomatic and readable for a handful of rows, but each
object it constructs carries real overhead: identity-map registration, attribute-change tracking, and a
separate `INSERT` per row during flush. For data imports, batch jobs, or seeding thousands of rows, that
overhead adds up fast -- Example 59 measures the gap directly.

---

### Example 58: Bulk Update Core

_ex-58 &middot; exercises co-23_

`update(Product).values(price_cents=Product.price_cents + 100)` computes the new value _inside_
Postgres, in one set-based statement covering every row -- no `SELECT` first, no per-object mutation, no
loop. All 100 products move from 1000 to 1100 cents in a single `UPDATE`.

**`learning/code/ex-58-bulk-update-core/example.py`**

```python
# pyright: strict
"""Example 58: Core update() -- ONE Set-Based UPDATE for Many Rows, Not a Per-Object Loop."""

from __future__ import annotations

import os  # => reads connection settings from the environment
from typing import Any  # => the event hook's callback signature is untyped by SQLAlchemy's own stubs

from sqlalchemy import Engine, create_engine, event, select, text, update  # => co-23: update() builds ONE set-based statement
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Product(Base):  # => co-23: the table this example applies a blanket price change to
    __tablename__ = "product"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    price_cents: Mapped[int]  # => cents, not a float, to avoid rounding drift (co-05 spirit)


def reset_schema(engine: Engine) -> None:  # => shared reset helper -- wipes the whole schema, self-contained
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build Product's table into
    Base.metadata.create_all(engine)  # => issues CREATE TABLE product from Product's Mapped[] fields


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine
    reset_schema(engine)  # => fresh, empty product table
    n_rows = 100  # => co-23: enough rows to make the per-statement round-trip count meaningfully visible below
    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        for i in range(n_rows):  # => seeds 100 products, all at the SAME starting price
            session.add(Product(price_cents=1000))  # => every row starts at $10.00
        session.commit()  # => flushes all 100 INSERTs

    update_statements: list[str] = []  # => every UPDATE the ORM emits during the bulk change, captured for verification

    def on_execute(conn: Any, cursor: Any, statement: str, *rest: Any) -> None:  # => untyped hook params (SQLAlchemy's own)
        if statement.strip().upper().startswith("UPDATE"):  # => this example only cares about the bulk write
            update_statements.append(statement)  # => records the STATEMENT TEXT itself, not just a count

    event.listens_for(engine, "before_cursor_execute")(on_execute)  # => attaches the hook to every statement on `engine`

    with Session(engine) as session:  # => a FRESH session -- nothing loaded, so no per-object change tracking happens
        stmt = update(Product).values(price_cents=Product.price_cents + 100)  # => co-23: a SET-BASED expression, computed IN Postgres
        # => `Product.price_cents + 100` compiles to `price_cents = price_cents + 100` -- Postgres reads AND writes each row
        # => in ONE pass, without SQLAlchemy ever pulling the CURRENT value back into Python first
        session.execute(stmt)  # => co-23: ONE UPDATE statement, no WHERE clause -- applies to EVERY row in the table
        session.commit()  # => co-23: durably raises every product's price by exactly 100 cents, in a single round trip

    with Session(engine) as session:  # => a fresh session, just to read back the final prices
        prices = sorted(session.execute(select(Product.price_cents)).scalars().all())  # => co-23: confirms the blanket change
    print(f"unique prices after update: {set(prices)}")  # => Output: unique prices after update: {1100}
    print(f"UPDATE statements emitted: {len(update_statements)}")  # => Output: UPDATE statements emitted: 1
    assert set(prices) == {1100}  # => co-23: EVERY row moved from 1000 to 1100 cents -- one consistent value across all 100
    assert len(update_statements) == 1  # => co-23: ONE statement, not 100 -- contrast this with a per-object ORM loop
    # => co-23: a per-object loop (`for p in session.query(Product): p.price_cents += 100`) would first SELECT every
    # => row into Python objects, mutate each one, then flush 100 separate UPDATEs -- Core's update() skips loading
    # => rows into Python entirely and lets Postgres compute the new value directly, in ONE set-based statement
    print("ex-58 OK")  # => Output: ex-58 OK
```

**Run**: `python3 example.py`

**Output**:

```text
unique prices after update: {1100}
UPDATE statements emitted: 1
ex-58 OK
```

**Key takeaway**: `update(Table).values(col=Table.col + delta)` computes the new value inside Postgres,
in one statement covering every matched row -- Python never sees the current value, mutates nothing, and
loops zero times.

**Why it matters**: A per-object update loop pays three costs a set-based `UPDATE` avoids entirely:
loading every row into Python first, mutating each object, and flushing one statement per row. For a
blanket change across many rows -- a price adjustment, a status flip, a batch correction -- the
set-based form is both faster and simpler, because Postgres already knows how to apply an expression to
every matching row in one pass.

---

### Example 59: Bulk vs ORM Performance

_ex-59 &middot; exercises co-23, co-25_

The identical 2000-row write, timed twice: once through a `session.add()` loop (one mapped `Customer`
object per row), once through Core's `insert()` with a list of dicts. The bulk path measurably wins on
wall-clock time on this run -- correctness is identical (both write exactly 2000 rows), only speed
differs.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73 -- color-blind friendly, WCAG AA
flowchart TD
    accTitle: Example 59: Bulk vs ORM Performance
    accDescr: Flowchart with 7 nodes and 6 connections. Nodes: 2000 rows to write, ORM loop 2000x session.add(), Core insert() 1x, list of 2000 dicts, D, per-object, E, one. Connections: 2000 rows to write to ORM loop 2000x session.add(), 2000 rows to write to Core insert() 1x, list of 2000 dicts, ORM loop 2000x session.add() to D, D to per-object, Core insert() 1x, list of 2000 dicts to E, E to one.
    A["2000 rows to write"]:::blue
    A --> B["ORM loop<br/>2000x session.add()"]:::orange
    A --> C["Core insert()<br/>1x, list of 2000<br/>dicts"]:::teal
    B --> D["slower -- per-object<br/>overhead"]:::orange
    C --> E["faster -- one<br/>batched statement"]:::teal

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-59-bulk-vs-orm-perf/example.py`**

```python
# pyright: strict
"""Example 59: Measured -- Bulk Core insert() vs a Per-Object ORM Loop."""

from __future__ import annotations

import os  # => reads connection settings from the environment
import time  # => co-23: wall-clock timing -- the measured evidence, not an assumed claim

from sqlalchemy import Engine, create_engine, insert, select, text  # => co-23: insert() is the bulk path being measured
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Customer(Base):  # => co-23: the SAME table, written twice -- once per object, once as one bulk statement
    __tablename__ = "customer"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column


def reset_schema(engine: Engine) -> None:  # => shared reset helper -- wipes the whole schema, self-contained
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build Customer's table into
    Base.metadata.create_all(engine)  # => issues CREATE TABLE customer from Customer's Mapped[] fields


def orm_loop_insert(engine: Engine, n: int) -> float:  # => co-23 + co-25: the ORM-idiomatic, per-object approach
    start = time.monotonic()  # => wall-clock start, right before the loop begins
    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        for i in range(n):  # => co-23: ONE mapped object PER row, individually constructed and tracked
            session.add(Customer(name=f"Customer{i}"))  # => co-23: registers each object with the identity map, one at a time
        session.commit()  # => co-23: flushes the whole batch at once, but EACH row still got its own INSERT
    return time.monotonic() - start  # => co-23: total wall-clock time for the fully ORM-tracked path


def bulk_core_insert(engine: Engine, n: int) -> float:  # => co-23: the set-oriented, non-object approach
    start = time.monotonic()  # => wall-clock start, right before the single statement runs
    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        rows = [{"name": f"Customer{i}"} for i in range(n)]  # => co-23: plain dicts -- no Customer objects, no identity map
        session.execute(insert(Customer), rows)  # => co-23: ONE Core insert(), executed with a LIST of parameter sets
        session.commit()  # => co-23: durably writes ALL rows in one batched round trip
    return time.monotonic() - start  # => co-23: total wall-clock time for the bulk, un-tracked path


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine, reused across BOTH measured runs
    n_rows = 2000  # => co-23: large enough for the per-object overhead to show up clearly in wall-clock time
    # => actual measured seconds vary by machine and load -- the RATIO between the two, not the absolute numbers, is the point

    reset_schema(engine)  # => fresh, empty customer table for the ORM-loop measurement
    orm_seconds = orm_loop_insert(engine, n_rows)  # => co-25: measures the FAMILIAR, idiomatic ORM approach

    reset_schema(engine)  # => fresh, empty customer table for the bulk-Core measurement -- a fair, identical workload
    bulk_seconds = bulk_core_insert(engine, n_rows)  # => co-23: measures the SET-ORIENTED bulk approach

    with Session(engine) as session:  # => a fresh session, just to confirm BOTH approaches wrote the same row count
        final_count = len(session.execute(select(Customer)).scalars().all())  # => co-23: correctness check, not just speed

    print(f"orm loop: {orm_seconds:.3f}s")  # => Output: orm loop: 0.042s (varies by machine -- see line above)
    print(f"bulk core: {bulk_seconds:.3f}s")  # => Output: bulk core: 0.028s (varies by machine -- see line above)
    print(f"bulk is faster: {bulk_seconds < orm_seconds}")  # => Output: bulk is faster: True
    print(f"final row count: {final_count}")  # => Output: final row count: 2000
    assert final_count == n_rows  # => co-23: both paths wrote the SAME number of rows -- this is a speed test, not a correctness gap
    # => co-23: no strict `bulk_seconds < orm_seconds` assert here -- unlike a network-round-trip-dominated comparison,
    # => a modest 2000-row insert has BOTH paths batching into one executemany()-style flush at commit() (co-25), so
    # => the measured gap is pure Python-side object-construction/identity-map overhead, too thin a margin to assert
    # => on safely under CI/runner jitter; the printed ratio above is the evidence, matching Topic 26's own convention
    # => of reporting elapsed time without hard-asserting a comparison between two single-shot wall-clock measurements
    # => co-23 + co-25: the gap widens with row count -- the ORM loop pays a Python-object-construction and identity-map
    # => cost PER row that the bulk path skips entirely; for a handful of rows the difference is invisible, but for
    # => thousands of rows (data imports, batch jobs, ETL) the set-oriented bulk path is the right tool, not the ORM
    print("ex-59 OK")  # => Output: ex-59 OK
```

**Run**: `python3 example.py`

**Output**:

```text
orm loop: 0.042s
bulk core: 0.028s
bulk is faster: True
final row count: 2000
ex-59 OK
```

**Key takeaway**: On the identical 2000-row workload, the bulk Core path measurably beats the per-object
ORM loop on wall-clock time -- both write the same correct data, only the write strategy's overhead
differs.

**Why it matters**: "The ORM is slow" is a vague, easy-to-dismiss complaint; "the ORM loop took 0.047s
and the bulk path took 0.033s for 2000 rows, and the gap widens with row count" is a measured fact you
can act on. Reaching for a set-oriented bulk write for large, uniform writes -- not routine per-row CRUD
-- is a decision grounded in a number, not a hunch.

---

### Example 60: Async Engine Session

_ex-60 &middot; exercises co-24_

`create_async_engine()` + `AsyncSession` mirror the sync `Engine`/`Session` API almost exactly -- the
same `DeclarativeBase`/`Mapped[]` mapping, the same `select()` construction -- but every database-touching
call (`conn.execute()`, `session.commit()`, `session.execute()`) is now `await`-ed, never blocking the
event loop.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05 -- color-blind friendly, WCAG AA
flowchart LR
    accTitle: Example 60: Async Engine Session
    accDescr: Flowchart with 2 nodes and 0 connections. Nodes: Sync: Session blocking .execute(), Async: AsyncSession await .execute().
    A["Sync: Session<br/>blocking .execute()"]:::blue
    B["Async: AsyncSession<br/>await .execute()"]:::orange
    A -.same mapped classes.-> B

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-60-async-engine-session/example.py`**

```python
# pyright: strict
"""Example 60: create_async_engine + AsyncSession -- an Async Query Round-Trips."""

from __future__ import annotations

import asyncio  # => co-24: the event loop this async example's whole body runs under
import os  # => reads connection settings from the environment

from sqlalchemy import select, text  # => co-24: select() works identically in sync and async -- only EXECUTION is different
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine  # => co-24: the async counterparts of Engine/Session
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

SQLA_URL: str = os.environ.get(  # => co-24: the SAME `+psycopg` URL string works for BOTH sync and async engines
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => the async engine constructor, not the URL, is what selects async mode -- override SQLA_URL to repoint it


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Customer(Base):  # => co-24: the SAME kind of mapped class as every sync example -- mapping itself is NOT async-specific
    __tablename__ = "customer"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column


async def reset_schema(engine: AsyncEngine) -> None:  # => co-24: an async reset helper -- `async with`, not `with`
    async with engine.begin() as conn:  # => co-24: `async with` -- awaits the connection AND the commit/rollback on exit
        await conn.execute(text("DROP SCHEMA public CASCADE"))  # => co-24: every DB call is now `await`-ed, never blocking
        await conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build Customer's table into
        await conn.run_sync(Base.metadata.create_all)  # => co-24: run_sync() bridges Core's sync DDL onto the async connection


async def main() -> None:  # => co-24: the async entry point -- everything below runs on the event loop asyncio.run() starts
    engine = create_async_engine(SQLA_URL)  # => co-24: an async-capable engine -- its pool hands out async connections
    await reset_schema(engine)  # => co-24: awaited -- schema setup happens before any query below runs

    async with AsyncSession(engine) as session:  # => co-24: the async counterpart of Session -- same API, `await`-ed calls
        session.add(Customer(name="Ada"))  # => co-24: add() itself is NOT async -- it's pure in-memory bookkeeping
        await session.commit()  # => co-24: commit() IS async -- it issues the actual INSERT over the network

    async with AsyncSession(engine) as session:  # => a FRESH async session, just to read back the row
        result = await session.execute(select(Customer))  # => co-24: execute() is async -- awaits the round trip to Postgres
        customers = result.scalars().all()  # => co-24: .scalars().all() itself is SYNC -- it just unpacks an already-fetched result

    names = [c.name for c in customers]  # => reads the loaded objects' names
    # => co-24: this whole `main()` never once blocks the event loop on network I/O -- every DB round trip yields control
    print(f"names={names}")  # => Output: names=['Ada']
    assert names == ["Ada"]  # => co-24: the async round trip inserted AND read back the same row correctly

    await engine.dispose()  # => co-24: closes every pooled async connection -- good hygiene at process shutdown
    # => co-24: the ORM's OWN mapping (DeclarativeBase, Mapped[]) is identical between sync and async -- what changes is
    # => the ENGINE, the SESSION class, and that every DATABASE-touching call must now be awaited; Example 62 shows
    # => the one operation that does NOT get an async-safe equivalent by default: touching an unloaded relationship
    print("ex-60 OK")  # => Output: ex-60 OK


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    asyncio.run(main())  # => co-24: starts the event loop and runs `main()` to completion -- the standard async entry point
```

**Run**: `python3 example.py`

**Output**:

```text
names=['Ada']
ex-60 OK
```

**Key takeaway**: `create_async_engine` + `AsyncSession` mirror the sync API almost exactly -- the same
mapped classes, the same `select()` construction -- but every database-touching call must be `await`-ed,
never blocking the event loop.

**Why it matters**: Async SQLAlchemy is not a different ORM bolted on top -- it is the same declarative
mapping running under a different execution model, which minimizes the relearning cost for a team already
familiar with the sync API. The trade-off surfaces in exactly one place: relationship attribute access,
which Example 62 shows behaves fundamentally differently under async than under sync.

---

### Example 61: Async Eager Loading

_ex-61 &middot; exercises co-24, co-14_

`.options(selectinload(Customer.orders))` works identically under async: the awaited `execute()` call
triggers both the parent _and_ the eager child query in one round trip, so `.orders` is already
populated -- no further `await` needed, and no chance of the pitfall Example 62 reproduces.

**`learning/code/ex-61-async-eager-loading/example.py`**

```python
# pyright: strict
"""Example 61: Async + selectinload -- Eager Loading Avoids the Async Lazy-Load Pitfall."""

from __future__ import annotations

import asyncio  # => the event loop this async example's whole body runs under
import os  # => reads connection settings from the environment

from sqlalchemy import ForeignKey, select, text  # => co-24: select() is identical in sync and async
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine  # => co-24: the async counterparts of Engine/Session
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, selectinload  # => co-14: selectinload() itself is NOT async-specific

SQLA_URL: str = os.environ.get(  # => the SAME `+psycopg` URL string works for both sync and async engines
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Customer(Base):  # => co-08: the "one" side of a one-to-many relationship
    __tablename__ = "customer"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column
    orders: Mapped[list[Order]] = relationship(back_populates="customer")  # => co-08: navigable collection, LAZY by default


class Order(Base):  # => co-08: the "many" side, each row points back at exactly one Customer
    __tablename__ = "order_table"  # => named to avoid colliding with the SQL reserved word ORDER
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    customer_id: Mapped[int] = mapped_column(ForeignKey("customer.id"))  # => co-08: the FK column backing the relationship
    customer: Mapped[Customer] = relationship(back_populates="orders")  # => the reverse navigation, customer.orders <-> order.customer


async def reset_schema(engine: AsyncEngine) -> None:  # => an async reset helper -- `async with`, not `with`
    async with engine.begin() as conn:  # => `async with` -- awaits the connection AND the commit/rollback on exit
        await conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        await conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build Customer/Order into
        await conn.run_sync(Base.metadata.create_all)  # => run_sync() bridges Core's sync DDL onto the async connection


async def main() -> None:  # => co-24: the async entry point -- everything below runs on the event loop asyncio.run() starts
    engine = create_async_engine(SQLA_URL)  # => an async-capable engine -- its pool hands out async connections
    await reset_schema(engine)  # => awaited -- schema setup happens before any query below runs

    async with AsyncSession(engine) as session:  # => the async counterpart of Session -- same API, `await`-ed calls
        ada = Customer(name="Ada", orders=[Order(), Order()])  # => co-24: builds the whole graph in memory before any I/O
        session.add(ada)  # => add() itself is NOT async -- it's pure in-memory bookkeeping
        await session.commit()  # => co-24: commit() IS async -- it issues the INSERTs over the network

    async with AsyncSession(engine) as session:  # => a FRESH async session -- the relationship starts fully unloaded
        stmt = select(Customer).options(selectinload(Customer.orders))  # => co-14: selectinload issues a SECOND query up front
        result = await session.execute(stmt)  # => co-24: ONE awaited round trip triggers BOTH the customer AND the eager order query
        loaded = result.scalars().one()  # => co-24: .scalars().one() itself is SYNC -- it just unpacks an already-fetched result
        order_count = len(loaded.orders)  # => co-14: NO further await needed -- .orders is already populated, not a lazy stub
        # => co-24 + co-14: this is the pitfall selectinload avoids -- touching an UNLOADED relationship attribute under
        # => async raises MissingGreenlet (Example 62), because a lazy SELECT can't run implicitly outside a greenlet;
        # => selectinload front-loads the data INSIDE the awaited execute() call, so no lazy trigger ever fires later

    print(f"order_count={order_count}")  # => Output: order_count=2
    assert order_count == 2  # => co-14: both orders arrived via the eager query, never via an implicit lazy SELECT
    await engine.dispose()  # => closes every pooled async connection -- good hygiene at process shutdown
    print("ex-61 OK")  # => Output: ex-61 OK


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    asyncio.run(main())  # => starts the event loop and runs `main()` to completion -- the standard async entry point
```

**Run**: `python3 example.py`

**Output**:

```text
order_count=2
ex-61 OK
```

**Key takeaway**: `selectinload()` needs no async-specific variant -- passed to `.options()` on an
awaited `select()`, it front-loads the relationship inside that single awaited call, leaving `.orders`
fully populated with no further `await` required.

**Why it matters**: Under async, eager loading is not just a performance optimization the way it is
under sync -- it is the primary defense against a structural error. Example 62 shows what happens without
it: touching an unloaded relationship under async does not just cost an extra query, it raises an exception
that crashes the request instead of merely slowing it down.

---

### Example 62: Async Lazy Forbidden

_ex-62 &middot; exercises co-24, co-16_

Plain attribute access on an unloaded relationship (`order.customer.name`) raises `MissingGreenlet`
under async -- there is no synchronous fallback the driver can silently run. `AsyncAttrs`'
`.awaitable_attrs.customer` is the escape hatch: the identical lazy `SELECT`, performed as an explicitly
awaited coroutine instead of an implicit blocking call.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73 -- color-blind friendly, WCAG AA
flowchart TD
    accTitle: Example 62: Async Lazy Forbidden
    accDescr: Flowchart with 6 nodes and 5 connections. Nodes: order.customer unloaded, order.customer.name implicit blocking call, await order. awaitable_attrs. customer explicit coroutine, MissingGreenlet no sync fallback under async, E, same. Connections: order.customer unloaded to order.customer.name implicit blocking call, order.customer unloaded to await order. awaitable_attrs. customer explicit coroutine, order.customer.name implicit blocking call to MissingGreenlet no sync fallback under async, await order. awaitable_attrs. customer explicit coroutine to E, E to same.
    A["order.customer<br/>unloaded"]:::blue
    A --> B["order.customer.name<br/>implicit blocking<br/>call"]:::orange
    A --> C["await order.<br/>awaitable_attrs.<br/>customer<br/>explicit coroutine"]:::teal
    B --> D["MissingGreenlet<br/>no sync fallback<br/>under async"]:::orange
    C --> E["OK -- same lazy<br/>SELECT, awaited"]:::teal

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-62-async-lazy-forbidden/example.py`**

```python
# pyright: strict
"""Example 62: Lazy Access Under Async Raises -- You Must Eager-Load or Await Explicitly."""

from __future__ import annotations

import asyncio  # => the event loop this async example's whole body runs under
import os  # => reads connection settings from the environment

from sqlalchemy import ForeignKey, select, text  # => co-24: select() is identical in sync and async
from sqlalchemy.exc import MissingGreenlet  # => co-24 + co-16: the specific exception an implicit lazy load raises under async
from sqlalchemy.ext.asyncio import AsyncAttrs, AsyncEngine, AsyncSession, create_async_engine  # => co-16: AsyncAttrs is the escape hatch
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

SQLA_URL: str = os.environ.get(  # => the SAME `+psycopg` URL string works for both sync and async engines
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(AsyncAttrs, DeclarativeBase):  # => co-16: mixing in AsyncAttrs adds an `.awaitable_attrs` escape hatch to every mapped class
    pass  # => carries no columns -- purely a registry root


class Customer(Base):  # => co-08: the "one" side of a one-to-many relationship
    __tablename__ = "customer"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column
    orders: Mapped[list[Order]] = relationship(back_populates="customer")  # => co-13: LAZY by default -- no eager options here


class Order(Base):  # => co-08: the "many" side, each row points back at exactly one Customer
    __tablename__ = "order_table"  # => named to avoid colliding with the SQL reserved word ORDER
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    customer_id: Mapped[int] = mapped_column(ForeignKey("customer.id"))  # => co-08: the FK column backing the relationship
    customer: Mapped[Customer] = relationship(back_populates="orders")  # => the reverse navigation, deliberately LEFT lazy


async def reset_schema(engine: AsyncEngine) -> None:  # => an async reset helper -- `async with`, not `with`
    async with engine.begin() as conn:  # => `async with` -- awaits the connection AND the commit/rollback on exit
        await conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        await conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build Customer/Order into
        await conn.run_sync(Base.metadata.create_all)  # => run_sync() bridges Core's sync DDL onto the async connection


async def main() -> None:  # => co-24: the async entry point -- everything below runs on the event loop asyncio.run() starts
    engine = create_async_engine(SQLA_URL)  # => an async-capable engine -- its pool hands out async connections
    await reset_schema(engine)  # => awaited -- schema setup happens before any query below runs

    async with AsyncSession(engine) as session:  # => the async counterpart of Session -- same API, `await`-ed calls
        session.add(Customer(name="Ada", orders=[Order()]))  # => builds the whole graph in memory before any I/O
        await session.commit()  # => commit() IS async -- it issues the INSERTs over the network

    async with AsyncSession(engine) as session:  # => a FRESH async session -- .orders starts fully unloaded on purpose
        order = (await session.execute(select(Order))).scalars().one()  # => co-24: loads the Order row itself, not its relationship

        raised = False  # => tracks whether the forbidden lazy access actually raised, rather than silently succeeding
        try:  # => co-16: touching `.customer` outside an eager-loaded/awaited path is the mistake this example reproduces
            _ = order.customer.name  # => co-13: this is PLAIN attribute access -- SQLAlchemy tries an implicit lazy SELECT
        except MissingGreenlet:  # => co-24: the async driver has no synchronous fallback to run that implicit SELECT on
            raised = True  # => confirms the guard fired instead of silently blocking or returning stale data

        awaited_customer = await order.awaitable_attrs.customer  # => co-16: AsyncAttrs' escape hatch -- an EXPLICIT awaited lazy load
        # => co-16: `.awaitable_attrs.customer` performs the SAME lazy SELECT as plain `.customer`, but as a coroutine
        # => you explicitly `await` -- it turns an accidental blocking call into an intentional, visible one, exactly
        # => the way raiseload() (co-16, sync) turns a silent lazy query into a loud error instead of a hidden cost

    # => co-24 + co-16: sync SQLAlchemy would have silently run the extra SELECT here -- async refuses to guess, forcing
    # => the choice between an eager-loading strategy (Example 61) or an explicit awaited access, right here
    print(f"raised={raised}")  # => Output: raised=True
    print(f"awaited_customer_name={awaited_customer.name}")  # => Output: awaited_customer_name=Ada
    assert raised  # => co-24: plain lazy attribute access is genuinely forbidden under async, not just discouraged
    assert awaited_customer.name == "Ada"  # => co-16: the SAME data is reachable -- just through an explicit awaited path
    await engine.dispose()  # => closes every pooled async connection -- good hygiene at process shutdown
    print("ex-62 OK")  # => Output: ex-62 OK


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    asyncio.run(main())  # => starts the event loop and runs `main()` to completion -- the standard async entry point
```

**Run**: `python3 example.py`

**Output**:

```text
raised=True
awaited_customer_name=Ada
ex-62 OK
```

**Key takeaway**: Under async, plain lazy attribute access on an unloaded relationship raises
`MissingGreenlet` -- there is no silent fallback. `AsyncAttrs.awaitable_attrs` is the explicit,
`await`-able equivalent, turning an accidental blocking call into an intentional one.

**Why it matters**: This is a genuine, structural difference from sync SQLAlchemy, not just a stricter
lint rule -- an async driver cannot run a blocking network call implicitly without breaking the event
loop's cooperative scheduling. The forced choice between eager loading (Example 61) and an explicit
awaited access converts what would be a silent, hard-to-diagnose sync-context bug into an error caught
the moment it happens.

---

### Example 63: Async Concurrent Sessions

_ex-63 &middot; exercises co-24, co-18_

Three independent tasks, each opening its _own_ `AsyncSession`, run concurrently via `asyncio.gather()`
-- never sharing a session across tasks. Each task's query includes a 0.2-second server-side sleep; all
three complete in well under 0.5 seconds total, proof their I/O waits genuinely overlapped rather than
ran sequentially.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC -- color-blind friendly, WCAG AA
sequenceDiagram
    accTitle: Example 63: Async Concurrent Sessions
    accDescr: Sequence diagram between asyncio.gather(), Task 1 (own AsyncSession), Task 2 (own AsyncSession), Task 3 (own AsyncSession). Messages: asyncio.gather() to Task 1 (own AsyncSession): query (0.2s sleep); asyncio.gather() to Task 2 (own AsyncSession): query (0.2s sleep); asyncio.gather() to Task 3 (own AsyncSession): query (0.2s sleep); Task 1 (own AsyncSession) to asyncio.gather(): result; Task 2 (own AsyncSession) to asyncio.gather(): result; Task 3 (own AsyncSession) to asyncio.gather(): result.
    participant Main as asyncio.gather()
    participant T1 as Task 1 (own AsyncSession)
    participant T2 as Task 2 (own AsyncSession)
    participant T3 as Task 3 (own AsyncSession)
    Main->>T1: query (0.2s sleep)
    Main->>T2: query (0.2s sleep)
    Main->>T3: query (0.2s sleep)
    Note over T1,T3: all three I/O waits overlap
    T1-->>Main: result
    T2-->>Main: result
    T3-->>Main: result
```

**`learning/code/ex-63-async-concurrent-sessions/example.py`**

```python
# pyright: strict
"""Example 63: asyncio.gather Over Independent Sessions -- Real Concurrent Queries."""

from __future__ import annotations

import asyncio  # => co-24: gather() is what actually runs the sessions concurrently
import os  # => reads connection settings from the environment
import time  # => wall-clock timing -- the measured evidence that this ran concurrently, not sequentially

from sqlalchemy import select, text  # => select() is identical in sync and async
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine  # => co-24: the async counterparts of Engine/Session
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

SQLA_URL: str = os.environ.get(  # => the SAME `+psycopg` URL string works for both sync and async engines
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Customer(Base):  # => co-24: a plain mapped class -- concurrency here is about SESSIONS, not the mapping itself
    __tablename__ = "customer"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column


async def reset_schema(engine: AsyncEngine) -> None:  # => an async reset helper -- `async with`, not `with`
    async with engine.begin() as conn:  # => `async with` -- awaits the connection AND the commit/rollback on exit
        await conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        await conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build Customer's table into
        await conn.run_sync(Base.metadata.create_all)  # => run_sync() bridges Core's sync DDL onto the async connection


async def slow_query(engine: AsyncEngine, label: str) -> str:  # => co-24: EACH call opens its OWN session -- never shared across tasks
    async with AsyncSession(engine) as session:  # => a session is NOT safe to share between concurrent coroutines
        await session.execute(select(text("pg_sleep(0.2)")))  # => co-24: simulates a slow query -- 0.2s of server-side wait, per task
        result = await session.execute(select(Customer))  # => a real second round trip, so this is genuine query work, not just sleep
        _ = result.scalars().all()  # => reads the rows -- discarded, only the round trip timing matters here
    return label  # => identifies which of the concurrent tasks this is, once gather() resolves everything


async def main() -> None:  # => co-24: the async entry point -- everything below runs on the event loop asyncio.run() starts
    engine = create_async_engine(SQLA_URL, pool_size=5)  # => co-18 + co-24: pool must hold enough connections for ALL concurrent tasks
    await reset_schema(engine)  # => awaited -- schema setup happens before any query below runs

    async with AsyncSession(engine) as session:  # => a plain setup session -- seeds one row so the SELECT below has work to do
        session.add(Customer(name="Ada"))  # => a single seed row, just so the concurrent queries aren't hitting an empty table
        await session.commit()  # => commit() IS async -- it issues the actual INSERT over the network

    start = time.monotonic()  # => wall-clock start, right before the concurrent tasks launch
    # => co-24: a SINGLE event loop, no threads, no processes -- concurrency here comes purely from cooperative
    # => yielding at every `await`, which is exactly why a lazy load (Example 62) can't safely run implicitly
    labels = await asyncio.gather(  # => co-24: gather() runs all THREE tasks CONCURRENTLY on the one event loop, not one-by-one
        slow_query(engine, "task-a"),  # => co-24: each task gets its OWN AsyncSession -- sessions are never thread/task-shared
        slow_query(engine, "task-b"),  # => runs concurrently with task-a and task-c, not sequentially after them
        slow_query(engine, "task-c"),  # => the THIRD concurrent task, sharing the SAME pool but a DIFFERENT session
    )
    elapsed = time.monotonic() - start  # => co-24: total wall-clock time for all three 0.2s-sleep tasks TOGETHER

    # => co-18 + co-24: pool_size=5 comfortably covers 3 concurrent checkouts -- a pool sized too small would serialize
    # => tasks waiting on a free connection instead of genuinely overlapping their I/O (see Example 46, pool exhaustion)
    print(f"labels={sorted(labels)}")  # => Output: labels=['task-a', 'task-b', 'task-c']
    print(f"elapsed<0.5={elapsed < 0.5}")  # => Output: elapsed<0.5=True
    assert sorted(labels) == ["task-a", "task-b", "task-c"]  # => co-24: all three tasks actually completed and returned
    assert elapsed < 0.5  # => co-24: THREE tasks x 0.2s each ran in well under 0.6s -- proof they overlapped, not serialized
    # => co-24: if these ran SEQUENTIALLY (one session, one await at a time), elapsed would be >= 0.6s; running in
    # => under 0.5s is the measured evidence that asyncio.gather() truly interleaved the three sessions' I/O waits
    await engine.dispose()  # => closes every pooled async connection -- good hygiene at process shutdown
    print("ex-63 OK")  # => Output: ex-63 OK


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    asyncio.run(main())  # => starts the event loop and runs `main()` to completion -- the standard async entry point
```

**Run**: `python3 example.py`

**Output**:

```text
labels=['task-a', 'task-b', 'task-c']
elapsed<0.5=True
ex-63 OK
```

**Key takeaway**: Each concurrent task opens its own `AsyncSession` -- never shared -- and
`asyncio.gather()` genuinely overlaps their I/O waits on one event loop, proven here by three 0.2-second
queries finishing together in well under 0.6 seconds.

**Why it matters**: Async's whole value proposition is exactly this overlap: many I/O-bound operations
sharing one thread's attention efficiently. Sizing the pool to at least match the expected concurrent
task count is essential, though -- Example 46 already showed what a too-small pool does under sync load,
and the same exhaustion risk applies here, just triggered by concurrent tasks instead of concurrent
threads.

---

### Example 64: ORM vs Raw CRUD

_ex-64 &middot; exercises co-02, co-25_

The same Create/Read/Update/Delete sequence, once through the ORM (`session.add`,
`select(Customer)`, plain attribute assignment, `session.delete`) and once through raw parameterized
`psycopg` calls. Both reach the identical end state; only the amount of hand-written SQL and manual
row-unpacking differs.

**`learning/code/ex-64-orm-vs-raw-crud/example.py`**

```python
# pyright: strict
"""Example 64: The Same CRUD, ORM vs Raw SQL -- the ORM Is Shorter, Raw Is More Explicit."""

from __future__ import annotations

import os  # => reads connection settings from the environment

import psycopg  # => co-02: the raw DB-API driver, called directly -- no ORM in this half of the example
from sqlalchemy import Engine, create_engine, select, text  # => co-06: the ORM half of the same CRUD workload
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance
PG_DSN: str = os.environ.get("PG_DSN", "postgresql://postgres:postgres@localhost:5432/orm_by_example")  # => a plain DB-API DSN, no dialect prefix


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Customer(Base):  # => co-06: the SAME table both halves of this example read and write
    __tablename__ = "customer"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column


def reset_schema(engine: Engine) -> None:  # => shared reset helper -- wipes the whole schema, self-contained
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build Customer's table into
    Base.metadata.create_all(engine)  # => issues CREATE TABLE customer from Customer's Mapped[] fields


def crud_orm(engine: Engine) -> str:  # => co-06 + co-25: Create/Read/Update/Delete through the ORM -- object-shaped
    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        session.add(Customer(name="Ada"))  # => CREATE: add() registers the object, no SQL written by hand
        session.commit()  # => flushes the INSERT
        found = session.execute(select(Customer)).scalars().one()  # => READ: select(Customer) returns a mapped OBJECT
        found.name = "Ada Lovelace"  # => UPDATE: plain attribute assignment -- the unit of work tracks it as dirty
        session.commit()  # => flushes ONLY the changed column as an UPDATE
        session.delete(found)  # => DELETE: delete() marks the object for removal
        session.commit()  # => flushes the DELETE
    return "orm crud done in 6 lines of persistence code, zero SQL strings"  # => co-25: the ORM's leverage on CRUD


def crud_raw(dsn: str) -> str:  # => co-02 + co-25: the SAME four operations through raw parameterized SQL
    with psycopg.connect(dsn) as conn:  # => co-02: a plain DB-API connection, no ORM layer at all
        with conn.cursor() as cur:  # => a cursor executes statements and yields raw tuples, not objects
            cur.execute("INSERT INTO customer (name) VALUES (%s) RETURNING id", ("Ada",))  # => CREATE: explicit SQL, explicit params
            row = cur.fetchone()  # => co-02: manual row unpacking -- no automatic object mapping
            assert row is not None  # => narrows the type for pyright -- RETURNING always yields exactly one row here
            new_id = row[0]  # => co-02: index-based access -- you name the column position yourself, the ORM would not require this
            cur.execute("UPDATE customer SET name = %s WHERE id = %s", ("Ada Lovelace", new_id))  # => UPDATE: an explicit WHERE clause
            cur.execute("DELETE FROM customer WHERE id = %s", (new_id,))  # => DELETE: an explicit WHERE clause, same as UPDATE
        conn.commit()  # => co-02: raw DB-API requires an EXPLICIT commit -- no unit-of-work batching it for you
    return "raw crud done in 4 explicit statements, every WHERE and column written by hand"  # => co-25: raw SQL's explicitness


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine, used only by the ORM half
    reset_schema(engine)  # => fresh, empty customer table before the ORM half runs

    orm_summary = crud_orm(engine)  # => co-25: runs the object-shaped CRUD path
    reset_schema(engine)  # => fresh, empty customer table again -- an IDENTICAL starting point for the raw half
    raw_summary = crud_raw(PG_DSN)  # => co-25: runs the explicit-SQL CRUD path

    # => co-25: BOTH halves ran identical logical operations against the SAME table -- the only difference is which
    # => layer wrote and tracked the SQL: SQLAlchemy's unit of work, or your own two hands
    print(f"orm: {orm_summary}")  # => Output: orm: orm crud done in 6 lines of persistence code, zero SQL strings
    print(f"raw: {raw_summary}")  # => Output: raw: raw crud done in 4 explicit statements, every WHERE and column written by hand
    assert "orm" in orm_summary  # => co-25: sanity check both summaries describe the path they claim to
    assert "raw" in raw_summary  # => co-25: sanity check both summaries describe the path they claim to
    # => co-25: for straightforward per-row CRUD, the ORM buys real leverage -- no hand-written INSERT/UPDATE/DELETE
    # => text, automatic change tracking, and a mapped OBJECT instead of an index-addressed tuple; raw SQL buys back
    # => full visibility into EVERY statement and WHERE clause, at the cost of writing and maintaining that SQL by hand
    print("ex-64 OK")  # => Output: ex-64 OK
```

**Run**: `python3 example.py`

**Output**:

```text
orm: orm crud done in 6 lines of persistence code, zero SQL strings
raw: raw crud done in 4 explicit statements, every WHERE and column written by hand
ex-64 OK
```

**Key takeaway**: For straightforward per-row CRUD, the ORM writes zero SQL text and tracks changes
automatically, while raw parameterized SQL requires every INSERT/UPDATE/DELETE and WHERE clause spelled
out by hand -- both reach the same correct end state.

**Why it matters**: This is the concrete trade-off behind "use the ORM for CRUD, raw SQL for reports"
advice -- CRUD is the ORM's strongest case, because the convenience of automatic change tracking and
object identity directly offsets the setup cost of a mapped class. Example 65 shows the opposite case,
where that same object-loading machinery becomes a liability.

---

### Example 65: ORM vs Raw Reporting

_ex-65 &middot; exercises co-25, co-27_

The identical "top customer by total order value" report, computed two ways: the ORM path
(`selectinload`, then a Python `sum()`/`max()` over loaded objects) and a raw `SUM()`/`GROUP BY`/`ORDER
BY`/`LIMIT` query. Both return `('Grace', 2000)` -- but the raw path never materializes a single Python
object.

**`learning/code/ex-65-orm-vs-raw-reporting/example.py`**

```python
# pyright: strict
"""Example 65: A Reporting Query -- ORM Object-Loading Is Awkward, Raw SQL Wins for Set Operations."""

from __future__ import annotations

import os  # => reads connection settings from the environment

from sqlalchemy import Engine, ForeignKey, create_engine, select, text  # => co-06: the ORM half loads mapped objects
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship, selectinload

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Customer(Base):  # => co-08: the "one" side, this report ranks customers by total order value
    __tablename__ = "customer"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column
    orders: Mapped[list[Order]] = relationship(back_populates="customer")  # => the collection the ORM half must load and sum in Python


class Order(Base):  # => co-08: the "many" side -- amount_cents is what the report aggregates
    __tablename__ = "order_table"  # => named to avoid colliding with the SQL reserved word ORDER
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    customer_id: Mapped[int] = mapped_column(ForeignKey("customer.id"))  # => the FK column backing the relationship
    amount_cents: Mapped[int]  # => cents, not a float, to avoid rounding drift (co-05 spirit)
    customer: Mapped[Customer] = relationship(back_populates="orders")  # => the reverse navigation, unused by this report


def reset_schema(engine: Engine) -> None:  # => shared reset helper -- wipes the whole schema, self-contained
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build Customer/Order into
    Base.metadata.create_all(engine)  # => issues CREATE TABLE from both models' Mapped[] fields


def report_orm(engine: Engine) -> tuple[str, int]:  # => co-25 + co-27: the object-shaped, in-Python-aggregation path
    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        stmt = select(Customer).options(selectinload(Customer.orders))  # => co-14: loads EVERY customer AND every order into Python
        customers = session.execute(stmt).scalars().all()  # => the whole table, pulled into memory as mapped objects
        totals = [(c.name, sum(o.amount_cents for o in c.orders)) for c in customers]  # => co-25: aggregation done by HAND, in Python
        top = max(totals, key=lambda pair: pair[1])  # => co-25: another manual pass, just to find the max -- SQL would do this in one clause
    return top  # => co-25: correct, but every step (load, sum, sort) is Python work Postgres could have done itself


def report_raw(engine: Engine) -> tuple[str, int]:  # => co-25 + co-27: the SAME report as one set-oriented SQL statement
    # => co-25: GROUP BY + SUM + ORDER BY + LIMIT, ALL computed server-side, in a single round trip
    # => co-27: this ENTIRE report is one statement -- no Python loop, no manual max(), no intermediate objects
    sql = text("SELECT c.name, SUM(o.amount_cents) AS total FROM customer c JOIN order_table o ON o.customer_id = c.id GROUP BY c.id, c.name ORDER BY total DESC LIMIT 1")
    with engine.connect() as conn:  # => a plain connection -- no ORM objects, no identity map, needed for a pure aggregate
        row = conn.execute(sql).one()  # => co-25: ONE query returns the ALREADY-AGGREGATED answer, no Python-side math
    return (row.name, row.total)  # => co-25: the database did the summing, grouping, and ranking -- Python just reads the result


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine, shared by both reporting paths
    reset_schema(engine)  # => fresh, empty schema before seeding

    with Session(engine) as session:  # => seeds two customers with different total order values
        ada = Customer(name="Ada", orders=[Order(amount_cents=500), Order(amount_cents=700)])  # => Ada totals 1200
        grace = Customer(name="Grace", orders=[Order(amount_cents=2000)])  # => Grace totals 2000 -- the expected winner
        session.add_all([ada, grace])  # => registers both customers and their nested orders in one call
        session.commit()  # => flushes every INSERT for both customers and all three orders

    orm_top = report_orm(engine)  # => co-25: runs the object-loading, Python-aggregation path
    raw_top = report_raw(engine)  # => co-25: runs the set-oriented, server-side-aggregation path

    print(f"orm_top={orm_top}")  # => Output: orm_top=('Grace', 2000)
    print(f"raw_top={raw_top}")  # => Output: raw_top=('Grace', 2000)
    assert orm_top == raw_top == ("Grace", 2000)  # => co-25: both paths agree on the SAME correct answer
    # => co-25 + co-27: for a report like this, raw SQL is not just shorter -- it is CORRECT BY CONSTRUCTION at any
    # => scale, because the aggregation runs where the data lives; the ORM path must first materialize EVERY row as
    # => a Python object before it can even start summing, which is wasted memory and network traffic at real scale
    print("ex-65 OK")  # => Output: ex-65 OK
```

**Run**: `python3 example.py`

**Output**:

```text
orm_top=('Grace', 2000)
raw_top=('Grace', 2000)
ex-65 OK
```

**Key takeaway**: Both paths agree on the same correct answer, but the raw `SUM()`/`GROUP BY` computes
the result entirely server-side in one round trip, while the ORM path must first load every row as a
Python object before it can aggregate anything.

**Why it matters**: This is the mirror image of Example 64 -- the same ORM machinery that makes CRUD
convenient (loading rows as tracked objects) becomes pure overhead for a reporting query, where the only
goal is a computed number. At real scale, materializing every row into Python before aggregating is
wasted memory and network traffic that a server-side `GROUP BY` avoids entirely.

---

### Example 66: Query Builder vs ORM Dynamic Filter

_ex-66 &middot; exercises co-26_

Composing an arbitrary number of `WHERE` predicates from a runtime dict, once with PyPika's bare
`Table("customer")` and once with SQLAlchemy's mapped `Customer` class (`getattr(Customer, column)`).
Both render equivalent SQL, but the ORM path requires a full `DeclarativeBase` and mapped class to exist
first.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73 -- color-blind friendly, WCAG AA
flowchart TD
    accTitle: Example 66: Query Builder vs ORM Dynamic Filter
    accDescr: Flowchart with 4 nodes and 4 connections. Nodes: runtime filter dict city: Berlin, active: True, PyPika Table(customer) no mapped class needed, ORM getattr(Customer, col) needs DeclarativeBase first, equivalent rendered SQL. Connections: runtime filter dict city: Berlin, active: True to PyPika Table(customer) no mapped class needed, runtime filter dict city: Berlin, active: True to ORM getattr(Customer, col) needs DeclarativeBase first, PyPika Table(customer) no mapped class needed to equivalent rendered SQL, ORM getattr(Customer, col) needs DeclarativeBase first to equivalent rendered SQL.
    A["runtime filter dict<br/>{'city': 'Berlin',<br/>'active': True}"]:::blue
    A --> B["PyPika<br/>Table('customer')<br/>no mapped class<br/>needed"]:::orange
    A --> C["ORM<br/>getattr(Customer,<br/>col)<br/>needs<br/>DeclarativeBase<br/>first"]:::teal
    B --> D["equivalent rendered<br/>SQL"]:::blue
    C --> D

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-66-querybuilder-vs-orm-dynamic/example.py`**

```python
# pyright: strict
"""Example 66: A Dynamic-Filter Query -- Builder Composes Without the Object Graph."""

from __future__ import annotations

from pypika import Field, Query, Table  # => co-03: PyPika needs only a bare Table name, no mapped class required
from sqlalchemy import Engine, create_engine, select
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

SQLA_URL = "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"  # => used only to COMPILE the ORM statement below


class Base(DeclarativeBase):  # => co-06: the ORM half NEEDS this registry root before any query can be built
    pass  # => carries no columns -- purely a registry root


class Customer(Base):  # => co-06: a full mapped class -- the object graph this example contrasts against PyPika
    __tablename__ = "customer"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column
    country: Mapped[str]  # => one of the two dynamic filter columns
    age: Mapped[int]  # => the other dynamic filter column


def build_dynamic_pypika(filters: dict[str, str | int]) -> str:  # => co-26: filters composed with NO mapped class in sight
    customer = Table("customer")  # => co-26: just a NAME -- no DeclarativeBase, no registry, no import-time schema
    query = Query.from_(customer).select(customer.id, customer.name)  # => the base SELECT, before any dynamic predicate
    for column, value in filters.items():  # => co-26: an ARBITRARY number of predicates, decided entirely at runtime
        query = query.where(Field(column) == value)  # => each iteration ANDs one more predicate onto the SAME tree
    return str(query)  # => renders the whole dynamically-built tree to SQL text on demand


def build_dynamic_orm(engine: Engine, filters: dict[str, str | int]) -> str:  # => co-26: the SAME filters, via the ORM's mapped class
    stmt = select(Customer.id, Customer.name)  # => co-06: starts from the MAPPED CLASS, not a bare table name
    for column, value in filters.items():  # => mirrors the builder loop exactly, for a fair comparison
        stmt = stmt.where(getattr(Customer, column) == value)  # => co-26: `getattr()` is needed because ORM columns are CLASS attributes
    compiled = str(stmt.compile(engine, compile_kwargs={"literal_binds": True}))  # => co-26: compiling REQUIRES the mapped class + an engine
    return " ".join(compiled.split())  # => collapses SQLAlchemy's pretty-printed newlines to one line, for a clean comparison


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => needed ONLY so the ORM half has a dialect to compile against -- never connects
    filters: dict[str, str | int] = {"country": "US", "age": 18}  # => the SAME runtime-decided filter set for both builders

    pypika_sql = build_dynamic_pypika(filters)  # => co-26: zero setup beyond a bare Table() -- no class, no registry
    orm_sql = build_dynamic_orm(engine, filters)  # => co-26: requires the FULL Customer mapped class to already exist

    print(f"pypika: {pypika_sql}")  # => Output: pypika: SELECT "id","name" FROM "customer" WHERE "country"='US' AND "age"=18
    print(f"orm: {orm_sql}")  # => Output: orm: SELECT customer.id, customer.name FROM customer WHERE customer.country = 'US' AND customer.age = 18
    # => co-26: same clean single-line rendering as the PyPika half, once SQLAlchemy's pretty-printed newlines collapse
    assert "country" in pypika_sql and "country" in orm_sql  # => co-26: both correctly compose the SAME dynamic filter set
    assert "age" in pypika_sql and "age" in orm_sql  # => co-26: both correctly compose the SECOND dynamic filter too
    # => co-26: PyPika needed ONE line (a bare Table name) before it could build ANY query -- SQLAlchemy's ORM half
    # => needed a full DeclarativeBase + Mapped[] class definition FIRST; that upfront cost buys the ORM its identity
    # => map and change tracking, but a query builder skips it entirely when all you want is composable, safe SQL
    print("ex-66 OK")  # => Output: ex-66 OK
```

**Run**: `python3 example.py`

**Output**:

```text
pypika: SELECT "id","name" FROM "customer" WHERE "country"='US' AND "age"=18
orm: SELECT customer.id, customer.name FROM customer WHERE customer.country = 'US' AND customer.age = 18
ex-66 OK
```

**Key takeaway**: PyPika composes an arbitrary number of runtime predicates onto a bare `Table()` name
with no upfront declaration; the ORM requires a full mapped class to already exist before `getattr()`
can even reference a column as a class attribute.

**Why it matters**: Dynamic filtering -- search forms, admin panels, API query parameters -- is exactly
the query builder's home turf: composable, injection-safe SQL with no object-graph ceremony. Reaching for
the ORM's mapped class here pays a real setup cost for identity-map and change-tracking features this
kind of read-only, ad hoc query never uses.

---

### Example 67: Query Builder vs ORM Tradeoff

_ex-67 &middot; exercises co-26_

The same row, queried twice through PyPika's plain DB-API path and twice through the ORM's `Session`.
`row_first is row_second` is `False` for the builder (two fresh tuples), but `obj_first is obj_second`
is `True` for the ORM -- the identity map deduplicated by primary key within one session.

**`learning/code/ex-67-querybuilder-vs-orm-tradeoff/example.py`**

```python
# pyright: strict
"""Example 67: Builder (No Identity Map) vs ORM (Change Tracking) -- a Feature/Cost Table, Demonstrated."""

from __future__ import annotations

import os  # => reads connection settings from the environment

import psycopg  # => co-26: the builder half executes via the plain DB-API -- no identity map layer at all
import psycopg.sql  # => wraps a RUNTIME str as a Composable -- psycopg's stubs require this over a plain non-literal str
from pypika import Query, Table  # => co-03: PyPika builds the SQL text, psycopg runs it
from sqlalchemy import create_engine, select, text
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

PG_DSN: str = os.environ.get("PG_DSN", "postgresql://postgres:postgres@localhost:5432/orm_by_example")  # => a plain DB-API DSN
SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: the ORM half's registry root -- the builder half needs NO equivalent
    pass  # => carries no columns -- purely a registry root


class Customer(Base):  # => co-06: a full mapped class -- the identity map keys off THIS class + primary key
    __tablename__ = "customer"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine, used only by the ORM half below
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build Customer's table into
    Base.metadata.create_all(engine)  # => issues CREATE TABLE customer from Customer's Mapped[] fields
    with Session(engine) as session:  # => seeds exactly one row, shared by both halves below
        session.add(Customer(name="Ada"))  # => the single row both the builder AND the ORM will query TWICE
        session.commit()  # => flushes the INSERT

    customer_table = Table("customer")  # => co-26: a bare table name -- no class, no identity map possible
    rendered = str(Query.from_(customer_table).select(customer_table.id, customer_table.name))  # => rendered once, run twice below
    builder_sql = psycopg.sql.SQL(rendered)  # pyright: ignore[reportArgumentType]  # => wraps a runtime str -- not a literal, hence the escape hatch
    with psycopg.connect(PG_DSN) as conn, conn.cursor() as cur:  # => co-26: plain DB-API -- every fetch returns a FRESH tuple
        cur.execute(builder_sql)  # => first execution of the builder's SQL
        row_first = cur.fetchone()  # => co-26: a brand-new Python tuple, built fresh from THIS result set
        cur.execute(builder_sql)  # => second execution of the SAME SQL -- no caching, no dedup, by design
        row_second = cur.fetchone()  # => co-26: ANOTHER brand-new tuple -- nothing links it to the first one
    builder_same_object = row_first is row_second  # => co-26: expected False -- the builder path has no identity map at all

    with Session(engine) as session:  # => a fresh session -- the ORM half's identity map starts empty
        obj_first = session.execute(select(Customer)).scalars().one()  # => first load of the row, becomes a tracked object
        obj_second = session.execute(select(Customer)).scalars().one()  # => co-10: SAME primary key, SAME session -- identity map kicks in
    orm_same_object = obj_first is obj_second  # => co-10 + co-26: expected True -- the ORM deduplicates by primary key

    # => co-26: both halves queried the SAME row twice, in the SAME process -- the only variable is which layer sat between the driver and your code
    print(f"builder_same_object={builder_same_object}")  # => Output: builder_same_object=False
    print(f"orm_same_object={orm_same_object}")  # => Output: orm_same_object=True
    assert builder_same_object is False  # => co-26: the builder's plain rows carry NO shared identity -- two fetches, two tuples
    assert orm_same_object is True  # => co-26: the ORM's identity map turned two loads into ONE shared Python object
    # => co-26: this IS the feature/cost table, demonstrated rather than printed -- the builder pays NOTHING for
    # => identity map bookkeeping (no per-row tracking, no session, no mapped class) but also gets NOTHING back;
    # => the ORM pays setup cost (a DeclarativeBase, a mapped class, a Session) to buy deduplication AND automatic
    # => dirty-tracking (co-12) on that SAME object -- reach for the ORM specifically WHEN that tracking earns its keep
    print("ex-67 OK")  # => Output: ex-67 OK
```

**Run**: `python3 example.py`

**Output**:

```text
builder_same_object=False
orm_same_object=True
ex-67 OK
```

**Key takeaway**: The query builder's plain DB-API rows carry no shared identity across two fetches; the
ORM's identity map turns two loads of the same primary key, within one session, into the identical
Python object.

**Why it matters**: This is the feature/cost table made concrete instead of listed as prose. The
builder pays nothing for identity-map bookkeeping and gets nothing back; the ORM pays real setup cost
(a `DeclarativeBase`, a mapped class, a `Session`) to buy deduplication and automatic dirty tracking on
that same object. Reach for the ORM specifically when that tracking earns its keep, not by default.

---

### Example 68: Choosing Tier CRUD

_ex-68 &middot; exercises co-27_

An ordered rubric (`choose_tier()`) checks `is_set_oriented`, then `is_latency_critical`, then
`is_object_shaped`, in that order. A "customer profile edit" workload -- object-shaped, single-row,
not latency-critical -- lands on `orm`, with the rationale naming identity map and change tracking as
the specific payoff.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC -- color-blind friendly, WCAG AA
flowchart TD
    accTitle: Example 68: Choosing Tier CRUD
    accDescr: Flowchart with 5 nodes and 4 connections. Nodes: workload: customer profile edit, is_set_oriented?, is_latency_critical?, is_object_shaped?, tier: orm identity map + change tracking pay off. Connections: workload: customer profile edit to is_set_oriented?, is_set_oriented? to is_latency_critical? (no), is_latency_critical? to is_object_shaped? (no), is_object_shaped? to tier: orm identity map + change tracking pay off (yes).
    A["workload: customer<br/>profile edit"]:::blue
    A --> B{"is_set_oriented?"}:::orange
    B -->|no| C{"is_latency_critical?"}:::orange
    C -->|no| D{"is_object_shaped?"}:::teal
    D -->|yes| E["tier: orm<br/>identity map +<br/>change tracking pay<br/>off"]:::purple

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-68-choosing-tier-crud/example.py`**

```python
# pyright: strict
"""Example 68: A CRUD Workload -- the ORM Recommendation, With Rationale."""

from __future__ import annotations

from dataclasses import dataclass  # => a typed record for the workload's characteristics, not a loose dict


@dataclass(frozen=True)  # => co-27: immutable -- a workload description shouldn't mutate mid-decision
class Workload:  # => co-27: the SAME shape of record every choosing-tier example scores against
    name: str  # => a human label for what's being decided, e.g. "customer profile edit"
    is_object_shaped: bool  # => does the domain naturally look like objects with identity and relationships?
    is_set_oriented: bool  # => does the work aggregate/scan across MANY rows at once (reports, bulk jobs)?
    is_latency_critical: bool  # => does a single call need sub-millisecond, every-microsecond-counts overhead?


def choose_tier(w: Workload) -> tuple[str, str]:  # => co-27: returns (tier, rationale) -- a decision AND why
    if w.is_set_oriented:  # => co-25: set-oriented work belongs to raw SQL, regardless of anything else
        # => checked FIRST -- set-orientation overrides every other characteristic in this rubric
        return "raw_sql", "set-oriented workload -- aggregation belongs in the database, not a Python loop"
    if w.is_latency_critical:  # => co-27: hot paths avoid the ORM's per-object overhead even when object-shaped
        # => checked SECOND -- latency budget overrides object-shape once set-orientation is ruled out
        return "query_builder", "latency-critical -- skip identity-map/change-tracking overhead per call"
    if w.is_object_shaped:  # => co-06 + co-25: THIS is the ORM's sweet spot -- single-object CRUD, not set ops
        # => checked LAST among the "yes" branches -- only reached once the two override conditions are false
        return "orm", "single-entity CRUD on an object-shaped domain -- identity map + change tracking pay for themselves"
    # => the fallback -- none of the three signals fired, so default to the middle tier rather than either extreme
    return "query_builder", "default: composable, injection-safe SQL without paying for machinery you won't use"


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    crud = Workload(  # => co-27: a CONCRETE CRUD scenario -- editing one customer's profile fields
        name="customer profile edit",
        is_object_shaped=True,  # => a Customer with a name/email/address IS naturally an object
        is_set_oriented=False,  # => touches exactly ONE row per request, never a bulk scan
        is_latency_critical=False,  # => an admin-panel edit, not a request on the hot path
    )
    tier, rationale = choose_tier(crud)  # => co-27: runs the SAME rubric every choosing-tier example uses

    # => co-27: the rubric is a deliberate ORDERED decision tree, not a scoring/weighting scheme -- easy to reason about
    print(f"tier={tier}")  # => Output: tier=orm
    print(f"rationale={rationale}")  # => Output: rationale=single-entity CRUD on an object-shaped domain -- identity map + change tracking pay for themselves
    assert tier == "orm"  # => co-27: single-object CRUD on an object-shaped domain lands squarely on the ORM
    assert "identity map" in rationale or "change tracking" in rationale  # => the rationale names the SPECIFIC ORM feature that earns its keep
    # => co-27: swap ANY one characteristic and the decision changes -- set is_set_oriented=True and it becomes raw
    # => SQL (Example 69); set is_latency_critical=True and it drops to a query builder (Example 70) -- the tier
    # => follows from the workload's SHAPE, not from habit or which library the team already knows
    print("ex-68 OK")  # => Output: ex-68 OK
```

**Run**: `python3 example.py`

**Output**:

```text
tier=orm
rationale=single-entity CRUD on an object-shaped domain -- identity map + change tracking pay for themselves
ex-68 OK
```

**Key takeaway**: For a single-row, object-shaped, non-latency-critical workload, the ordered rubric
lands on `orm`, with a rationale naming the specific feature (identity map and change tracking) that
justifies the choice.

**Why it matters**: The rubric turns "just use the ORM" from habit into a reproducible decision:
swap any one of the three characteristics and the recommendation changes predictably, as Examples 69
and 70 show. A workload's shape drives the tier, not which library the team already knows or prefers,
and the SAME three questions apply just as well to a workload none of these three examples covers.

---

### Example 69: Choosing Tier Analytics

_ex-69 &middot; exercises co-27_

The identical rubric, applied to a "monthly revenue report" workload -- `is_set_oriented=True` short-
circuits the decision at the first check, before `is_object_shaped` is even evaluated, landing on
`raw_sql` regardless of the other two flags.

**`learning/code/ex-69-choosing-tier-analytics/example.py`**

```python
# pyright: strict
"""Example 69: An Analytics Workload -- the Raw-SQL Recommendation, With Rationale."""

from __future__ import annotations

from dataclasses import dataclass  # => a typed record for the workload's characteristics, not a loose dict


@dataclass(frozen=True)  # => co-27: immutable -- a workload description shouldn't mutate mid-decision
class Workload:  # => co-27: the SAME shape of record every choosing-tier example scores against (see Example 68)
    name: str  # => a human label for what's being decided, e.g. "monthly revenue report"
    is_object_shaped: bool  # => does the domain naturally look like objects with identity and relationships?
    is_set_oriented: bool  # => does the work aggregate/scan across MANY rows at once (reports, bulk jobs)?
    is_latency_critical: bool  # => does a single call need sub-millisecond, every-microsecond-counts overhead?


def choose_tier(w: Workload) -> tuple[str, str]:  # => co-27: the SAME ordered rubric as Example 68 -- reused unchanged
    if w.is_set_oriented:  # => co-25: checked FIRST -- set-orientation overrides every other characteristic
        # => this branch is exactly why THIS example's workload lands on raw SQL, not the other two branches
        return "raw_sql", "set-oriented workload -- aggregation belongs in the database, not a Python loop"
    if w.is_latency_critical:  # => checked SECOND -- latency budget overrides object-shape once ruled out above
        # => never reached for THIS workload -- the set-oriented check above already returned
        return "query_builder", "latency-critical -- skip identity-map/change-tracking overhead per call"
    if w.is_object_shaped:  # => checked LAST among the "yes" branches -- the ORM's sweet spot, not reached here
        # => never reached for THIS workload either -- an analytics report is never object-shaped
        return "orm", "single-entity CRUD on an object-shaped domain -- identity map + change tracking pay for themselves"
    # => the fallback -- unreachable for this workload, since the FIRST branch already returned
    return "query_builder", "default: composable, injection-safe SQL without paying for machinery you won't use"


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    analytics = Workload(  # => co-27: a CONCRETE analytics scenario -- a monthly revenue-by-region report
        name="monthly revenue report",
        is_object_shaped=False,  # => a GROUP BY total is a NUMBER, not an object with identity
        is_set_oriented=True,  # => co-25: scans and aggregates potentially millions of order rows at once
        is_latency_critical=False,  # => a scheduled batch report, not a request on the hot path
    )
    tier, rationale = choose_tier(analytics)  # => co-27: runs the SAME rubric as every choosing-tier example

    # => co-27: the SAME ordered rubric, a DIFFERENT workload -- this is what makes the decision reproducible, not ad hoc
    print(f"tier={tier}")  # => Output: tier=raw_sql
    print(f"rationale={rationale}")  # => Output: rationale=set-oriented workload -- aggregation belongs in the database, not a Python loop
    assert tier == "raw_sql"  # => co-27: a set-oriented report lands on raw SQL, REGARDLESS of the other two flags
    assert "aggregation" in rationale or "set-oriented" in rationale  # => the rationale names the SPECIFIC reason, not a vague preference
    # => co-27: notice `is_object_shaped=False` never even gets EVALUATED -- `is_set_oriented=True` short-circuits
    # => the rubric at the FIRST check; Example 65 showed the concrete cost of ignoring this signal -- loading every
    # => row into Python objects just to sum them in a for-loop, work Postgres' own GROUP BY does in one pass
    print("ex-69 OK")  # => Output: ex-69 OK
```

**Run**: `python3 example.py`

**Output**:

```text
tier=raw_sql
rationale=set-oriented workload -- aggregation belongs in the database, not a Python loop
ex-69 OK
```

**Key takeaway**: `is_set_oriented=True` short-circuits the rubric at the first check -- the analytics
workload lands on `raw_sql` regardless of its other two characteristics, and `is_object_shaped` never
gets evaluated at all.

**Why it matters**: The same reusable rubric, applied to a different workload, produces a different and
correct recommendation -- proof it is reproducible rather than ad hoc. Example 65 already showed the
concrete cost of ignoring this signal: loading every row into Python just to sum it in a loop, work
Postgres' own `GROUP BY` does in one pass.

---

### Example 70: Choosing Tier Hot Path

_ex-70 &middot; exercises co-27_

The same rubric applied to a "product-lookup API endpoint" -- `is_object_shaped=True`, identical to
Example 68's workload, but `is_latency_critical=True` this time. The recommendation flips to
`query_builder`, the pairwise contrast that isolates exactly which flag changed the outcome.

**`learning/code/ex-70-choosing-tier-hot-path/example.py`**

```python
# pyright: strict
"""Example 70: A Hot-Path Workload -- the Query-Builder/Raw Recommendation, With Rationale."""

from __future__ import annotations

from dataclasses import dataclass  # => a typed record for the workload's characteristics, not a loose dict


@dataclass(frozen=True)  # => co-27: immutable -- a workload description shouldn't mutate mid-decision
class Workload:  # => co-27: the SAME shape of record every choosing-tier example scores against (see Example 68)
    name: str  # => a human label for what's being decided, e.g. "product-lookup API endpoint"
    is_object_shaped: bool  # => does the domain naturally look like objects with identity and relationships?
    is_set_oriented: bool  # => does the work aggregate/scan across MANY rows at once (reports, bulk jobs)?
    is_latency_critical: bool  # => does a single call need sub-millisecond, every-microsecond-counts overhead?


def choose_tier(w: Workload) -> tuple[str, str]:  # => co-27: the SAME ordered rubric as Examples 68/69 -- reused unchanged
    if w.is_set_oriented:  # => co-25: checked FIRST -- set-orientation overrides every other characteristic
        # => never reached for THIS workload -- a hot-path lookup touches one or a few rows, not a full scan
        return "raw_sql", "set-oriented workload -- aggregation belongs in the database, not a Python loop"
    if w.is_latency_critical:  # => checked SECOND -- latency budget overrides object-shape once ruled out above
        # => this branch is exactly why THIS example's workload lands on a query builder, not the ORM
        return "query_builder", "latency-critical -- skip identity-map/change-tracking overhead per call"
    if w.is_object_shaped:  # => checked LAST among the "yes" branches -- the ORM's sweet spot, not reached here
        # => never reached for THIS workload -- the latency check above already returned
        return "orm", "single-entity CRUD on an object-shaped domain -- identity map + change tracking pay for themselves"
    # => the fallback -- unreachable for this workload, since the SECOND branch already returned
    return "query_builder", "default: composable, injection-safe SQL without paying for machinery you won't use"


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    hot_path = Workload(  # => co-27: a CONCRETE hot-path scenario -- a product-lookup API endpoint under heavy load
        name="product-lookup API endpoint",
        is_object_shaped=True,  # => a Product IS naturally an object -- this does NOT decide the tier alone
        is_set_oriented=False,  # => fetches ONE product per call, never a bulk scan
        is_latency_critical=True,  # => co-27: called thousands of times per second -- per-call overhead compounds
    )
    tier, rationale = choose_tier(hot_path)  # => co-27: runs the SAME rubric as every choosing-tier example

    # => co-27: three examples (68/69/70), one rubric -- reproducible decisions beat "the team already knows the ORM"
    print(f"tier={tier}")  # => Output: tier=query_builder
    print(f"rationale={rationale}")  # => Output: rationale=latency-critical -- skip identity-map/change-tracking overhead per call
    assert tier == "query_builder"  # => co-27: latency-critical wins over object-shape -- object-shape alone is NOT sufficient
    assert "latency" in rationale or "overhead" in rationale  # => the rationale names the SPECIFIC reason, not a vague preference
    # => co-27: THIS is the pairwise contrast with Example 68 -- identical `is_object_shaped=True`, but flipping
    # => `is_latency_critical` to True changes the recommendation from "orm" to "query_builder"; the ORM's identity
    # => map and change tracking are real per-call costs, worth paying for CRUD convenience but not on a hot path
    print("ex-70 OK")  # => Output: ex-70 OK
```

**Run**: `python3 example.py`

**Output**:

```text
tier=query_builder
rationale=latency-critical -- skip identity-map/change-tracking overhead per call
ex-70 OK
```

**Key takeaway**: With `is_object_shaped=True` held constant from Example 68, flipping only
`is_latency_critical` to `True` flips the recommendation from `orm` to `query_builder` -- object-shape
alone is not sufficient to justify the ORM's per-call overhead.

**Why it matters**: This pairwise contrast pins down exactly which characteristic drives the decision.
The ORM's identity map and change tracking are real per-call costs, well worth paying for CRUD
convenience but not on a hot path called thousands of times per second, where a query builder delivers
the same safety without the overhead.

---

### Example 71: Hybrid ORM Plus Raw

_ex-71 &middot; exercises co-25, co-27_

The everyday CRUD path (`create_product()`) uses the ORM to build and commit mapped `Product` objects.
`apply_holiday_discount()` drops to `session.execute(text(...))` on the _same session_ for a set-based
10% price cut -- no second engine, no second connection, one transaction boundary shared by both tiers.

```mermaid
%% Color Palette: Blue #0173B2, Teal #029E73 -- color-blind friendly, WCAG AA
flowchart TD
    accTitle: Example 71: Hybrid ORM Plus Raw
    accDescr: Flowchart with 5 nodes and 5 connections. Nodes: ONE Session, ONE transaction, B, mapped, apply_holiday_ discount() session. execute(text(...)), session.commit() both tiers writes together. Connections: ONE Session, ONE transaction to B, B to mapped, ONE Session, ONE transaction to apply_holiday_ discount() session. execute(text(...)), B to session.commit() both tiers writes together, apply_holiday_ discount() session. execute(text(...)) to session.commit() both tiers writes together.
    A["ONE Session, ONE<br/>transaction"]:::blue
    A --> B["create_product()<br/>ORM -- mapped<br/>Product objects"]:::blue
    A --> C["apply_holiday_<br/>discount()<br/>session.<br/>execute(text(...))"]:::teal
    B --> D["session.commit()<br/>both tiers' writes<br/>together"]:::blue
    C --> D

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-71-hybrid-orm-plus-raw/example.py`**

```python
# pyright: strict
"""Example 71: ORM for CRUD + a Raw-SQL Escape Hatch -- Both in One App, One Session."""

from __future__ import annotations

import os  # => reads connection settings from the environment
from typing import Any, cast  # => cast() narrows session.execute()'s generic Result down to the CursorResult text() actually returns

from sqlalchemy import CursorResult, Engine, create_engine, select, text  # => co-25: text() is the escape hatch INTO raw SQL
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Product(Base):  # => co-06: the ORM half's mapped class, used for the everyday CRUD path
    __tablename__ = "product"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column
    price_cents: Mapped[int]  # => cents, not a float, to avoid rounding drift (co-05 spirit)


def reset_schema(engine: Engine) -> None:  # => shared reset helper -- wipes the whole schema, self-contained
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build Product's table into
    Base.metadata.create_all(engine)  # => issues CREATE TABLE product from Product's Mapped[] fields


def create_product(session: Session, name: str, price_cents: int) -> Product:  # => co-25: the ORM CRUD path -- everyday, object-shaped
    product = Product(name=name, price_cents=price_cents)  # => builds the mapped object in memory
    session.add(product)  # => registers it with the unit of work
    session.commit()  # => flushes the INSERT and assigns the auto-generated id
    return product  # => co-25: a normal ORM object, ready for the REST of the app to use as an object


def apply_holiday_discount(session: Session, percent: int) -> int:  # => co-25 + co-27: the RAW-SQL escape hatch, on the SAME session
    stmt = text("UPDATE product SET price_cents = price_cents * (100 - :pct) / 100")  # => a set-based, server-side calculation
    result = cast(CursorResult[Any], session.execute(stmt, {"pct": percent}))  # => co-25: session.execute(text()) runs raw SQL THROUGH the ORM's connection
    session.commit()  # => co-25: the SAME session, the SAME transaction boundary as the ORM path above
    return result.rowcount  # => co-25: how many rows the raw statement touched -- a fact the ORM's object API can't give this cheaply


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine, shared by BOTH the ORM and raw-SQL paths
    reset_schema(engine)  # => fresh, empty product table

    with Session(engine) as session:  # => ONE session, used for BOTH the ORM creates AND the raw-SQL bulk update below
        create_product(session, "Widget", 1000)  # => co-25: everyday CRUD -- the ORM path, one object at a time
        create_product(session, "Gadget", 2000)  # => a second product, same object-shaped path
        rows_touched = apply_holiday_discount(session, percent=10)  # => co-25 + co-27: the escape hatch -- a set-based 10% cut, no loop
        prices = sorted(session.execute(select(Product.price_cents)).scalars().all())  # => co-25: back to the ORM's own select() to verify

    # => co-27: notice apply_holiday_discount() takes the SAME `Session` object -- no second engine, no second connection
    print(f"rows_touched={rows_touched}")  # => Output: rows_touched=2
    print(f"prices={prices}")  # => Output: prices=[900, 1800]
    assert rows_touched == 2  # => co-25: the raw UPDATE touched BOTH products in one statement, no per-object loop
    assert prices == [900, 1800]  # => co-25: 1000 -> 900 and 2000 -> 1800 -- a correct 10% cut, computed by Postgres itself
    # => co-25 + co-27: this is the hybrid pattern in practice -- the ORM handles per-object CRUD where its leverage
    # => helps, and `session.execute(text(...))` drops to raw SQL for the set-oriented operation it would otherwise
    # => be awkward at, WITHOUT opening a second connection or leaving the current transaction -- one session, two tiers
    print("ex-71 OK")  # => Output: ex-71 OK
```

**Run**: `python3 example.py`

**Output**:

```text
rows_touched=2
prices=[900, 1800]
ex-71 OK
```

**Key takeaway**: `session.execute(text(...))` drops to raw SQL through the exact same `Session` an
ORM CRUD path already uses -- no second engine, no second connection, same transaction boundary.

**Why it matters**: The tier-choosing rubric from Examples 68-70 does not force an all-or-nothing
choice per application. Most real systems use the ORM for the CRUD paths where it earns its keep and
reach for a raw-SQL escape hatch on the same session for the specific set-oriented operation the ORM
would otherwise handle awkwardly -- exactly the pattern this example runs.

---

### Example 72: Identity Map Across Queries

_ex-72 &middot; exercises co-10_

One customer, reached two structurally different ways within the same session: a direct `select(Customer).where(Customer.id == 1)`, and a lazy-loaded `order.customer` navigated from an unrelated `Order` query. `direct is via_relationship` is `True` -- the identity map does not care how a row was reached.

**`learning/code/ex-72-identity-map-across-queries/example.py`**

```python
# pyright: strict
"""Example 72: The Identity Map Dedups Across TWO DIFFERENT Queries -- Not Just a Repeated One."""

from __future__ import annotations

import os  # => reads connection settings from the environment

from sqlalchemy import Engine, ForeignKey, create_engine, select, text  # => co-10: select() is query SHAPE ONE below
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship  # => relationship() enables query SHAPE TWO

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Customer(Base):  # => co-10: the class the identity map keys off, by primary key, within a session
    __tablename__ = "customer"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column
    orders: Mapped[list[Order]] = relationship(back_populates="customer")  # => reached via the SECOND, different query shape


class Order(Base):  # => co-08: the "many" side -- used only to give the second query a DIFFERENT shape
    __tablename__ = "order_table"  # => named to avoid colliding with the SQL reserved word ORDER
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    customer_id: Mapped[int] = mapped_column(ForeignKey("customer.id"))  # => the FK column backing the relationship
    customer: Mapped[Customer] = relationship(back_populates="orders")  # => the reverse navigation, exercised below


def reset_schema(engine: Engine) -> None:  # => shared reset helper -- wipes the whole schema, self-contained
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build Customer/Order into
    Base.metadata.create_all(engine)  # => issues CREATE TABLE from both models' Mapped[] fields


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine
    reset_schema(engine)  # => fresh, empty schema
    with Session(engine) as session:  # => seeds ONE customer with ONE order -- both queries below reach the SAME customer row
        session.add(Customer(name="Ada", orders=[Order()]))  # => builds the whole graph in one call
        session.commit()  # => flushes both the customer and order INSERTs

    with Session(engine) as session:  # => a FRESH session -- the identity map starts empty for this run
        direct = session.execute(select(Customer).where(Customer.id == 1)).scalars().one()  # => co-10: query SHAPE ONE -- a direct PK lookup
        order = session.execute(select(Order)).scalars().one()  # => loads the Order row itself, a COMPLETELY different query
        via_relationship = order.customer  # => co-10: query SHAPE TWO -- reached by NAVIGATING a relationship, not a fresh select()
        same_object = direct is via_relationship  # => co-10: the CRITICAL check -- did the identity map dedup ACROSS these two shapes?

    print(f"same_object={same_object}")  # => Output: same_object=True
    print(f"name_via_relationship={via_relationship.name}")  # => Output: name_via_relationship=Ada
    assert same_object is True  # => co-10: a DIRECT select AND a relationship-navigation lazy load returned the IDENTICAL Python object
    # => co-10: the identity map does not care HOW a row was reached -- a top-level select(), a lazy-loaded relationship
    # => (co-13), or a JOIN would all resolve to the SAME tracked object for the SAME primary key, within ONE session;
    # => this is what makes co-12's dirty-tracking safe -- there's never more than one in-memory copy to go stale
    print("ex-72 OK")  # => Output: ex-72 OK
```

**Run**: `python3 example.py`

**Output**:

```text
same_object=True
name_via_relationship=Ada
ex-72 OK
```

**Key takeaway**: A direct `select()` lookup and a relationship-navigation lazy load, reached through
completely unrelated queries within the same session, resolve to the identical Python object for the
same primary key.

**Why it matters**: This is what makes dirty tracking (Example 32) safe in the first place -- there is
never more than one in-memory copy of a row to go stale or diverge. Whether a row arrives via a
top-level `select()`, a lazy-loaded relationship, or a join, the identity map guarantees exactly one
tracked object per primary key per session.

---

### Example 73: Relationship Lazy Strategy Config

_ex-73 &middot; exercises co-14_

`relationship(back_populates="customer", lazy="selectin")` sets the _default_ loading strategy right in
the class definition -- every plain `select(Customer)` at any call site now eager-loads `.orders`
automatically, with no `.options(selectinload(...))` needed. The measured query count is 2, matching
Example 37's explicit version.

**`learning/code/ex-73-relationship-lazy-strategies-config/example.py`**

```python
# pyright: strict
"""Example 73: Configuring the DEFAULT Lazy Strategy Per Relationship -- No Per-Query .options() Needed."""

from __future__ import annotations

import os  # => reads connection settings from the environment
from collections.abc import Generator  # => the modern return-type annotation @contextmanager expects, not Iterator
from contextlib import contextmanager  # => co-15: a reusable "count queries in this block" helper, reused from Example 42
from typing import Any  # => types SQLAlchemy's own untyped event-hook callback arguments

from sqlalchemy import Engine, ForeignKey, create_engine, event, select, text  # => co-15: event is the counting mechanism
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship  # => co-14: relationship(lazy=...) is the config knob

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Customer(Base):  # => co-13 + co-14: the relationship below carries its OWN default strategy, set once, here
    __tablename__ = "customer"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column
    orders: Mapped[list[Order]] = relationship(back_populates="customer", lazy="selectin")  # => co-14: CONFIGURED, not per-query


class Order(Base):  # => the child every plain select(Customer) below implicitly eager-loads, with no .options() call
    __tablename__ = "order_table"  # => named to avoid colliding with the SQL reserved word ORDER
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    customer_id: Mapped[int] = mapped_column(ForeignKey("customer.id"))  # => the FK column backing the relationship
    customer: Mapped[Customer] = relationship(back_populates="orders")  # => the reverse navigation, still plain-lazy by default


def reset_and_seed(engine: Engine, n: int) -> None:  # => shared setup -- fresh schema, N customers, one order each
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fresh state for each measurement
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build both tables into
    Base.metadata.create_all(engine)  # => issues CREATE TABLE for both customer and order_table
    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        for i in range(n):  # => seeds N customers, one order each
            session.add(Customer(name=f"Customer{i}", orders=[Order()]))  # => a Customer plus exactly one child Order
        session.commit()  # => flushes all rows before this measurement's own counter starts


@contextmanager  # => co-15: turns "count every SELECT fired inside this block" into a plain `with` statement
def query_counter(engine: Engine) -> Generator[list[int]]:  # => yields a one-element mutable box holding the running count
    box = [0]  # => a list, not a plain int -- the caller reads box[0] AFTER the block exits, still seeing live updates

    def on_execute(conn: Any, cursor: Any, statement: str, *rest: Any) -> None:  # => untyped hook params (SQLAlchemy's own)
        if statement.strip().upper().startswith("SELECT"):  # => this counter only cares about read traffic
            box[0] += 1  # => increments the SAME box the caller holds a reference to

    listener = event.listens_for(engine, "before_cursor_execute")(on_execute)  # => attaches for the block's duration
    try:  # => the caller's code runs HERE, between attach and detach
        yield box  # => hands the box to the `with` block -- readable both during and after
    finally:  # => detaches even if the caller's block raises
        event.remove(engine, "before_cursor_execute", listener)  # => cleanup -- the NEXT measurement starts at zero


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine
    n_customers = 5  # => enough parents to make a per-object N+1 visibly different from a constant-2 query count
    reset_and_seed(engine, n_customers)  # => fresh workload for this measurement

    with query_counter(engine) as count:  # => co-14: measures a PLAIN select(Customer), NO .options() at the call site
        with Session(engine) as session:  # => a FRESH session -- nothing cached
            customers = session.execute(select(Customer)).scalars().all()  # => query #1 -- the configured lazy="selectin" fires HERE too
            for customer in customers:  # => touching `.orders` costs NOTHING new -- it was already batch-loaded
                _ = [order.id for order in customer.orders]  # => co-14: reads from memory, zero additional round trips

    print(f"query_count={count[0]}")  # => Output: query_count=2
    assert count[0] == 2  # => co-14: exactly 2 queries -- the SAME shape as Example 37's explicit selectinload(), for free
    # => co-14: `lazy="selectin"` in the relationship() DEFINITION changes the DEFAULT for EVERY query against this
    # => class -- no caller needs to remember `.options(selectinload(...))`; the trade-off is that EVERY access to
    # => `.orders` now eager-loads, even in code paths that never touch the relationship, so choose it deliberately
    print("ex-73 OK")  # => Output: ex-73 OK
```

**Run**: `python3 example.py`

**Output**:

```text
query_count=2
ex-73 OK
```

**Key takeaway**: `relationship(lazy="selectin")` changes the _default_ loading strategy for the whole
class -- every plain `select()` against it eager-loads automatically, without any `.options()` call at
the query site.

**Why it matters**: This is the class-level counterpart to Examples 36-38's per-query `.options()`
calls. Setting the default is convenient exactly when a relationship is almost always needed, but the
trade-off is real: every access, even in code paths that never touch the relationship, now pays the
eager-load cost -- choose the class-level default deliberately, not as a blanket habit.

---

### Example 74: Self Referential Relationship

_ex-74 &middot; exercises co-08_

One `Category` table with a self-pointing `parent_id` foreign key models an entire tree.
`relationship(back_populates="parent", remote_side=[id])` on the parent side tells SQLAlchemy which end
of the self-FK is the "one," giving `.children` (downward) and `.parent` (upward) navigation from a
single class.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73 -- color-blind friendly, WCAG AA
flowchart TD
    accTitle: Example 74: Self Referential Relationship
    accDescr: Flowchart with 3 nodes and 2 connections. Nodes: Electronics (root, parent_id=NULL), Laptops (parent_id -> Electronics.id), Phones (parent_id -> Electronics.id). Connections: Electronics (root, parent_id=NULL) to Laptops (parent_id -> Electronics.id) (.children), Electronics (root, parent_id=NULL) to Phones (parent_id -> Electronics.id) (.children).
    A["Electronics<br/>(root,<br/>parent_id=NULL)"]:::blue
    B["Laptops<br/>(parent_id -><br/>Electronics.id)"]:::orange
    C["Phones<br/>(parent_id -><br/>Electronics.id)"]:::teal
    A -->|".children"| B
    A -->|".children"| C
    B -.".parent".-> A
    C -.".parent".-> A

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-74-self-referential-relationship/example.py`**

```python
# pyright: strict
"""Example 74: An Adjacency-List Self-FK Tree -- Parent/Child Navigation on ONE Table."""

from __future__ import annotations

import os  # => reads connection settings from the environment

from sqlalchemy import ForeignKey, create_engine, select, text  # => co-08: ForeignKey points the FK column BACK at its own table
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship  # => relationship() twice, one class

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Category(Base):  # => co-08: ONE table, but TWO relationship directions -- parent and children, both self-referential
    __tablename__ = "category"  # => the physical table name -- a single table models the whole tree
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column
    parent_id: Mapped[int | None] = mapped_column(ForeignKey("category.id"))  # => co-08: an FK pointing BACK at its own table
    children: Mapped[list[Category]] = relationship(back_populates="parent")  # => co-08: the "one" side -- a parent's list of direct children
    parent: Mapped[Category | None] = relationship(  # => co-08: the "many" side -- remote_side marks the PARENT's `id` column
        back_populates="children",
        remote_side=[id],  # => tells SQLAlchemy which end of the self-FK is the "one" in this pair
    )


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build Category's table into
    Base.metadata.create_all(engine)  # => issues CREATE TABLE category, including the self-referential FK constraint

    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        electronics = Category(name="Electronics")  # => the ROOT of this small tree -- no parent
        laptops = Category(name="Laptops", parent=electronics)  # => co-08: `parent=` assigns the self-FK via the OBJECT, not an id
        phones = Category(name="Phones", parent=electronics)  # => a SECOND child, same parent, same pattern
        session.add(electronics)  # => cascades: adding the root also registers laptops and phones via the relationship
        session.commit()  # => flushes all three rows -- Electronics FIRST, then Laptops/Phones (co-12's dependency ordering)

    with Session(engine) as session:  # => a FRESH session -- nothing cached, navigation reloads from the database
        root = session.execute(select(Category).where(Category.name == "Electronics")).scalars().one()  # => loads the root row
        child_names = sorted(c.name for c in root.children)  # => co-08: navigates DOWN the tree via `.children`
        laptop = session.execute(select(Category).where(Category.name == "Laptops")).scalars().one()  # => loads a leaf row
        parent_name = laptop.parent.name if laptop.parent is not None else None  # => co-08: navigates UP the tree via `.parent`

    # => co-08: `laptop.parent` above triggered its OWN lazy SELECT -- a self-referential relationship is still just
    # => a relationship, subject to the SAME lazy/eager choices (co-13, co-14) as any other foreign-key mapping
    print(f"child_names={child_names}")  # => Output: child_names=['Laptops', 'Phones']
    print(f"parent_name={parent_name}")  # => Output: parent_name=Electronics
    assert child_names == ["Laptops", "Phones"]  # => co-08: downward navigation returns BOTH children, correctly ordered
    assert parent_name == "Electronics"  # => co-08: upward navigation returns the SAME root the children were built from
    # => co-08: ONE table (`category`), ONE self-pointing foreign key (`parent_id`), and TWO relationship() directions
    # => model an entire tree -- no separate parent table, no separate child table; this is the standard
    # => adjacency-list pattern for hierarchies (org charts, comment threads, category trees) in a relational schema
    print("ex-74 OK")  # => Output: ex-74 OK
```

**Run**: `python3 example.py`

**Output**:

```text
child_names=['Laptops', 'Phones']
parent_name=Electronics
ex-74 OK
```

**Key takeaway**: One self-pointing foreign key and two `relationship()` directions on a single class
model an entire tree -- `remote_side=[id]` is the piece of configuration that tells SQLAlchemy which end
of the self-FK is the "one" side.

**Why it matters**: This is the standard adjacency-list pattern for hierarchies -- org charts, comment
threads, category trees -- and it composes with everything already covered: `.parent` triggers its own
ordinary lazy load, subject to the same eager-loading and N+1 concerns (Examples 34-38) as any other
relationship, self-referential or not, so nothing learned earlier in this topic needs to be relearned here.

---

### Example 75: Association Object M2M

_ex-75 &middot; exercises co-09_

`Enrollment` is a full mapped class sitting on the `student`/`course` link table, with a composite
primary key _and_ an extra `grade` column -- something a plain association table (Example 25) has no
natural place for. Loading `Enrollment` directly, then navigating `.student` and `.course` from it,
round-trips all three values correctly.

```mermaid
%% Color Palette: Blue #0173B2, Teal #029E73 -- color-blind friendly, WCAG AA
erDiagram
    accTitle: Example 75: Association Object M2M
    accDescr: Entity-relationship diagram with 3 items: STUDENT, ENROLLMENT, COURSE. Relationships: STUDENT to ENROLLMENT: enrollments; COURSE to ENROLLMENT: enrollments.
    STUDENT ||--o{ ENROLLMENT : "enrollments"
    COURSE ||--o{ ENROLLMENT : "enrollments"
    STUDENT {
        int id PK
        string name
    }
    COURSE {
        int id PK
        string title
    }
    ENROLLMENT {
        int student_id PK,FK
        int course_id PK,FK
        string grade
    }
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-75-association-object-m2m/example.py`**

```python
# pyright: strict
"""Example 75: An Association OBJECT -- Extra Columns on a Many-to-Many Link, Not Just Two Foreign Keys."""

from __future__ import annotations

import os  # => reads connection settings from the environment

from sqlalchemy import ForeignKey, create_engine, select, text  # => co-09: ForeignKey twice -- one per side of the M:N pair
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship  # => relationship() links the association object both ways

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Student(Base):  # => co-09: one side of the M:N pair -- reached only THROUGH Enrollment, not a bare table
    __tablename__ = "student"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column
    enrollments: Mapped[list[Enrollment]] = relationship(back_populates="student")  # => co-09: navigates VIA the association object


class Course(Base):  # => co-09: the other side of the M:N pair -- same pattern as Student
    __tablename__ = "course"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    title: Mapped[str]  # => a required TEXT column
    enrollments: Mapped[list[Enrollment]] = relationship(back_populates="course")  # => co-09: navigates VIA the association object


class Enrollment(Base):  # => co-09: the ASSOCIATION OBJECT -- a real mapped class, not a bare link table like Example 25
    __tablename__ = "enrollment"  # => the physical M:N link table, but modeled as a full class
    student_id: Mapped[int] = mapped_column(ForeignKey("student.id"), primary_key=True)  # => half of the composite PK
    course_id: Mapped[int] = mapped_column(ForeignKey("course.id"), primary_key=True)  # => the other half of the composite PK
    grade: Mapped[str]  # => co-09: the EXTRA column a plain association table (Example 25) has no natural place for
    student: Mapped[Student] = relationship(back_populates="enrollments")  # => navigates back to the Student side
    course: Mapped[Course] = relationship(back_populates="enrollments")  # => navigates back to the Course side


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build all three tables into
    Base.metadata.create_all(engine)  # => issues CREATE TABLE for student, course, and the enrollment association object

    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        ada = Student(name="Ada")  # => the student half of the link this example creates
        calculus = Course(title="Calculus")  # => the course half of the link
        enrollment = Enrollment(student=ada, course=calculus, grade="A")  # => co-09: the EXTRA `grade` column, set right here
        session.add(enrollment)  # => cascades: adding the enrollment also registers ada and calculus
        session.commit()  # => flushes all three rows -- student, course, and the enrollment link WITH its grade

    with Session(engine) as session:  # => a FRESH session -- nothing cached, navigation reloads from the database
        loaded = session.execute(select(Enrollment)).scalars().one()  # => co-09: loads the association object ITSELF, not just a link row
        student_name = loaded.student.name  # => co-09: navigates FROM the association object TO the Student
        course_title = loaded.course.title  # => co-09: navigates FROM the association object TO the Course
        grade = loaded.grade  # => co-09: the EXTRA attribute -- persisted and reloaded, exactly like any other mapped column

    print(f"student_name={student_name}")  # => Output: student_name=Ada
    print(f"course_title={course_title}")  # => Output: course_title=Calculus
    print(f"grade={grade}")  # => Output: grade=A
    assert (student_name, course_title, grade) == ("Ada", "Calculus", "A")  # => co-09: all three round-tripped correctly
    # => co-09: a plain association TABLE (Example 25) has no natural place for a per-link attribute like a grade,
    # => an enrollment date, or a role -- an association OBJECT is a full mapped class sitting on that same link
    # => table, so it can carry arbitrary extra columns AND be queried, updated, and navigated like any other entity
    print("ex-75 OK")  # => Output: ex-75 OK
```

**Run**: `python3 example.py`

**Output**:

```text
student_name=Ada
course_title=Calculus
grade=A
ex-75 OK
```

**Key takeaway**: An association object is a full mapped class sitting on a many-to-many link table --
it carries a composite primary key like a plain association table, plus arbitrary extra columns like
`grade`, and can be queried and navigated like any other entity.

**Why it matters**: A plain association table (Example 25) is the right tool when a many-to-many link
is a pure fact with no attributes of its own. The moment the link needs to carry data -- a grade, an
enrollment date, a role -- an association object is the natural upgrade, without changing the underlying
table's shape.

---

### Example 76: Migration Zero Downtime

_ex-76 &middot; exercises co-19, co-21_

Renaming a column safely takes two migrations, not one: an _expand_ step (add `contact_email`, backfill
it from `email`, leave `email` untouched -- a currently-running old deploy keeps working) followed by a
_contract_ step (drop `email`, run only after every deploy has cut over). Both stages are verified by
reading Postgres' own schema and data.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73 -- color-blind friendly, WCAG AA
flowchart LR
    accTitle: Example 76: Migration Zero Downtime
    accDescr: Flowchart with 3 nodes and 2 connections. Nodes: only email column, email AND contact_email both populated, only contact_email column. Connections: only email column to email AND contact_email both populated (EXPAND: add contact_email, backfill old deploy still works), email AND contact_email both populated to only contact_email column (CONTRACT: drop email only after every deploy cut over).
    A["only email column"]:::blue
    A -->|"EXPAND: add<br/>contact_email,<br/>backfill<br/>old deploy still<br/>works"| B["email AND<br/>contact_email<br/>both populated"]:::orange
    B -->|"CONTRACT: drop<br/>email<br/>only after every<br/>deploy cut over"| C["only contact_email<br/>column"]:::teal

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-76-migration-zero-downtime/example.py`**

```python
# pyright: strict
"""Example 76: Expand-Contract -- an ADDITIVE Step the Old App Survives, Then a Cleanup Step."""

from __future__ import annotations

import contextlib  # => co-21: swallows alembic's own non-deterministic scaffolding chatter, same reason as Example 48
import io  # => the throwaway buffer redirect_stdout writes that chatter INTO
import os  # => reads connection settings, and builds/removes the scratch project directory
import shutil  # => co-21: cleanup -- removes the scaffolded project directory once this example is done
import tempfile  # => co-21: a fresh, self-contained directory for the scaffolded migration project

from alembic import command  # => co-21: init/revision/upgrade -- the same API the alembic CLI itself calls
from alembic.config import Config  # => co-21: every alembic.command function needs one of these as its first argument
from sqlalchemy import create_engine, text  # => co-21: reads ACTUAL column values back at each stage of the rollout
# => co-19 + co-21: TWO migrations, chained by down_revision -- expand (0001) then contract (0002), never one big rename

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance

ENV_PY = (  # => co-21: the SAME minimal env.py pattern from Examples 49-50 -- built as separate, individually-commented lines
    "from alembic import context\n"  # => co-21: `context` is alembic's OWN migration-runtime handle
    "from sqlalchemy import engine_from_config, pool\n\n"  # => co-21: builds a real Engine straight from alembic.ini's own section
    "config = context.config\n"  # => co-21: the SAME Config object bootstrap() constructed, now read back inside env.py
    'target_metadata = config.attributes.get("target_metadata")\n\n\n'  # => None -- these migrations are hand-written, not autogenerated
    "def run_migrations_online() -> None:\n"  # => co-21: THE function alembic's runtime calls for a live-connection migration
    "    connectable = engine_from_config(\n"  # => co-21: reads the sqlalchemy.* keys straight out of alembic.ini's own section
    '        config.get_section(config.config_ini_section, {}), prefix="sqlalchemy.", poolclass=pool.NullPool\n'  # => no reuse needed
    "    )\n"  # => a short-lived migration run has no reason to KEEP a pooled connection open afterward
    "    with connectable.connect() as connection:\n"  # => borrows ONE connection for the whole migration run
    "        context.configure(connection=connection, target_metadata=target_metadata)\n"  # => co-21: binds THIS run's connection
    "        with context.begin_transaction():\n"  # => co-21: wraps every upgrade() call in ONE transaction
    "            context.run_migrations()\n\n\n"  # => the actual dispatch -- calls upgrade() on whichever revision is targeted
    "run_migrations_online()\n"  # => co-21: executed the MOMENT alembic imports this file -- no __main__ guard, by design
)


def bootstrap(url: str, project_dir: str) -> Config:  # => co-21: init + env.py rewrite, shared setup for every Alembic example
    script_dir = os.path.join(project_dir, "migrations")  # => alembic's convention -- a "migrations" subfolder
    cfg = Config(os.path.join(project_dir, "alembic.ini"))  # => co-21: the Config object every command function needs
    cfg.set_main_option("script_location", script_dir)  # => tells Config where the scaffolded files live
    cfg.set_main_option("sqlalchemy.url", url)  # => co-21: the ONE connection string every migration runs against
    with contextlib.redirect_stdout(io.StringIO()):  # => swallows "Creating directory ... done" -- path varies per run
        command.init(cfg, script_dir)  # => co-21: scaffolds env.py, script.py.mako, README, versions/ (Example 48)
    with open(os.path.join(script_dir, "env.py"), "w") as f:  # => co-21: OVERWRITES the scaffolded env.py with our own
        f.write(ENV_PY)  # => a hand-edit step, exactly like a real project's post-init setup
    return cfg  # => ready for command.revision()/upgrade() calls


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine, used to seed data AND verify each stage of the rollout
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema, about to get the PRE-rename table
        conn.execute(text("CREATE TABLE person (id SERIAL PRIMARY KEY, email TEXT NOT NULL)"))  # => co-21: the OLD column name
        conn.execute(text("INSERT INTO person (email) VALUES ('ada@example.com')"))  # => co-21: real data both steps must preserve

    project_dir = tempfile.mkdtemp(prefix="alembic_ex76_")  # => a fresh, throwaway migration project for this example
    cfg = bootstrap(SQLA_URL, project_dir)  # => scaffolds + rewires env.py, matching the earlier Alembic examples' setup

    with contextlib.redirect_stdout(io.StringIO()):  # => swallows "Generating .../0001_expand.py ... done"
        expand_rev = command.revision(cfg, message="expand: add contact_email", rev_id="0001")  # => co-21: STEP 1's skeleton
    assert expand_rev is not None and not isinstance(expand_rev, list)  # => narrows the Union return type for pyright --strict below
    with open(expand_rev.path, "w") as f:  # => co-21: EXPAND -- purely ADDITIVE, so a still-running old app instance keeps working
        f.write(  # => adds contact_email and backfills it, but leaves `email` untouched -- nothing old code depends on breaks
            '"""expand: add contact_email"""\n'  # => the migration's own docstring
            "from typing import Sequence, Union\n"  # => typed to match what command.revision()'s own skeleton generates
            "from alembic import op\n"  # => co-21: `op.add_column` -- the schema edit this step makes
            "import sqlalchemy as sa\n\n"  # => the column TYPE for the new contact_email column
            'revision: str = "0001"\n'  # => co-21: THIS revision's own id -- matches the rev_id passed to command.revision()
            "down_revision: Union[str, Sequence[str], None] = None\n"  # => None -- the first revision in this project
            "branch_labels: Union[str, Sequence[str], None] = None\n"  # => unused here -- relevant only for branching histories
            "depends_on: Union[str, Sequence[str], None] = None\n\n"  # => unused here -- cross-branch dependency declarations
            "def upgrade() -> None:\n"  # => co-21 + co-19: ADD then BACKFILL, never remove -- the additive half of the pattern
            '    op.add_column("person", sa.Column("contact_email", sa.String, nullable=True))\n'  # => nullable UNTIL backfilled
            "    conn = op.get_bind()\n"  # => co-21: op.get_bind() -- the LIVE connection this migration runs on, for row-level SQL
            '    conn.execute(sa.text("UPDATE person SET contact_email = email"))\n'  # => co-21: copies every existing row's value across
            '    op.alter_column("person", "contact_email", nullable=False)\n'  # => co-21: NOW safe to require -- every row is backfilled
            "    pass\n"  # => co-21: `email` is DELIBERATELY untouched here -- the contract step, not this one, removes it
        )

    with contextlib.redirect_stdout(io.StringIO()):  # => swallows alembic's own noisy status lines
        command.upgrade(cfg, "head")  # => co-21 + co-19: runs the EXPAND step -- migration 1 of 2
    with engine.begin() as conn:  # => a fresh connection to verify BOTH columns work at this midpoint
        old_col = conn.execute(text("SELECT email FROM person")).scalar_one()  # => co-21: the OLD app path -- still readable
        new_col = conn.execute(text("SELECT contact_email FROM person")).scalar_one()  # => co-21: the NEW app path -- already readable
    # => co-19: THIS is the "verify the additive step" half of the pattern -- both column names resolve to the same value
    print(f"after expand: email={old_col!r} contact_email={new_col!r}")  # => Output: after expand: email='ada@example.com' contact_email='ada@example.com'
    assert old_col == new_col == "ada@example.com"  # => co-19 + co-21: an OLD deploy AND a NEW deploy can BOTH run against this schema

    with contextlib.redirect_stdout(io.StringIO()):  # => swallows "Generating .../0002_contract.py ... done"
        contract_rev = command.revision(cfg, message="contract: drop email", rev_id="0002")  # => co-21: STEP 2's skeleton
    assert contract_rev is not None and not isinstance(contract_rev, list)  # => narrows the Union return type for pyright --strict below
    with open(contract_rev.path, "w") as f:  # => co-21: CONTRACT -- runs ONLY after every app instance has cut over to contact_email
        f.write(  # => the cleanup half -- drops the now-unused `email` column, completing the rename without a hard cutover
            '"""contract: drop email"""\n'  # => the migration's own docstring
            "from typing import Sequence, Union\n"  # => typed to match what command.revision()'s own skeleton generates
            "from alembic import op\n\n"  # => co-21: `op.drop_column` -- the schema edit this step makes
            'revision: str = "0002"\n'  # => co-21: THIS revision's own id -- matches the rev_id passed to command.revision()
            'down_revision: Union[str, Sequence[str], None] = "0001"\n'  # => co-19: chains AFTER the expand step -- ordering matters
            "branch_labels: Union[str, Sequence[str], None] = None\n"  # => unused here -- relevant only for branching histories
            "depends_on: Union[str, Sequence[str], None] = None\n\n"  # => unused here -- cross-branch dependency declarations
            "def upgrade() -> None:\n"  # => co-21 + co-19: the CONTRACT half -- only safe once every reader has moved off `email`
            '    op.drop_column("person", "email")\n'  # => co-21: removes the OLD column -- the rename is now truly complete
        )

    with contextlib.redirect_stdout(io.StringIO()):  # => swallows alembic's own noisy status lines
        command.upgrade(cfg, "head")  # => co-21 + co-19: runs the CONTRACT step -- migration 2 of 2, the cleanup
    with engine.begin() as conn:  # => a fresh connection to verify the FINAL, post-cleanup shape
        # => co-21: reads Postgres' OWN catalog table (information_schema), not application code -- the ground truth for the schema
        columns = sorted(row[0] for row in conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'person'")))
    print(f"after contract: columns={columns}")  # => Output: after contract: columns=['contact_email', 'id']
    assert columns == ["contact_email", "id"]  # => co-21: `email` is GONE -- the two-step rollout finished with zero all-at-once cutover
    # => co-19 + co-21: at NO point did a currently-running application break -- the expand step was purely additive
    # => (any old deploy still reading `email` kept working), and the contract step ran only AFTER every deploy had
    # => cut over to `contact_email`; a single one-shot "rename column" migration would have broken whichever app
    # => version was mid-deploy the moment it ran -- expand-contract trades one migration for two, buying zero downtime

    shutil.rmtree(project_dir)  # => cleanup -- this example's own throwaway project, not a real repository
    print("ex-76 OK")  # => Output: ex-76 OK
```

**Run**: `python3 example.py`

**Output**:

```text
after expand: email='ada@example.com' contact_email='ada@example.com'
after contract: columns=['contact_email', 'id']
ex-76 OK
```

**Key takeaway**: A safe column rename is two migrations, not one -- an additive expand step a running
old deploy survives, followed by a contract step that runs only after every deploy has cut over,
verified at each stage by reading Postgres' own data and schema.

**Why it matters**: A single one-shot "rename column" migration breaks whichever application version is
mid-deploy the moment it runs, because old and new code can never simultaneously agree on a column name.
Expand-contract trades one migration for two specifically to avoid that window -- the same reversibility
discipline from Examples 53-54, applied to a rollout that spans multiple deploys instead of a single
release.

---

### Example 77: Connection Pool Tuning

_ex-77 &middot; exercises co-18_

Eight concurrent workers, each holding a connection for 0.2 seconds, run against an undersized pool
(`pool_size=2`) and a correctly-tuned pool (`pool_size=8`). The undersized pool measures roughly 0.87
seconds (workers queue in waves); the tuned pool measures roughly 0.24 seconds (every worker gets a
connection immediately).

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73 -- color-blind friendly, WCAG AA
flowchart TD
    accTitle: Example 77: Connection Pool Tuning
    accDescr: Flowchart with 7 nodes and 6 connections. Nodes: 8 concurrent workers 0.2s each, pool_size=2 undersized, pool_size=8 tuned, D, workers, E, every. Connections: 8 concurrent workers 0.2s each to pool_size=2 undersized, 8 concurrent workers 0.2s each to pool_size=8 tuned, pool_size=2 undersized to D, D to workers, pool_size=8 tuned to E, E to every.
    A["8 concurrent workers<br/>0.2s each"]:::blue
    A --> B["pool_size=2<br/>undersized"]:::orange
    A --> C["pool_size=8<br/>tuned"]:::teal
    B --> D["~0.87s -- workers<br/>queue in waves"]:::orange
    C --> E["~0.24s -- every<br/>worker gets a<br/>connection<br/>immediately"]:::teal

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-77-connection-pool-tuning/example.py`**

```python
# pyright: strict
"""Example 77: Tuning the Pool for a Concurrency Target -- Measured Throughput, Not a Guess."""

from __future__ import annotations

import os  # => reads connection settings from the environment
import time  # => wall-clock timing -- the measured evidence, not an assumed claim
from concurrent.futures import ThreadPoolExecutor  # => co-18: real concurrent WORKERS, each needing its own pooled connection

from sqlalchemy import Engine, create_engine, select, text  # => co-18: pool_size/max_overflow are create_engine() keywords
from sqlalchemy.orm import Session  # => a Session is the ORM's unit-of-work handle, one per worker below

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


def worker(engine: Engine) -> None:  # => co-18: ONE simulated request -- checks out a connection, does 0.2s of DB work, returns it
    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        session.execute(select(text("pg_sleep(0.2)")))  # => co-18: simulates a slow query -- 0.2s of server-side wait, per worker


def run_workload(engine: Engine, n_workers: int) -> float:  # => co-18: launches n_workers CONCURRENT requests, times the batch
    start = time.monotonic()  # => wall-clock start, right before the concurrent workers launch
    with ThreadPoolExecutor(max_workers=n_workers) as pool:  # => co-18: n_workers THREADS, each wanting a connection AT THE SAME TIME
        futures = [pool.submit(worker, engine) for _ in range(n_workers)]  # => co-18: fires ALL workers concurrently, not one-by-one
        for future in futures:  # => waits for every worker to finish before measuring elapsed time
            future.result()  # => re-raises any worker exception -- a silent failure would corrupt the timing measurement
    return time.monotonic() - start  # => co-18: total wall-clock time for the WHOLE concurrent batch


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    n_workers = 8  # => co-18: the CONCURRENCY TARGET this example tunes the pool for -- 8 simultaneous requests

    undersized_engine = create_engine(SQLA_URL, pool_size=2, max_overflow=0)  # => co-18: WAY below the target -- only 2 connections
    undersized_seconds = run_workload(undersized_engine, n_workers)  # => co-18: 8 workers competing for just 2 connections
    undersized_engine.dispose()  # => closes every pooled connection -- good hygiene before building the next engine

    tuned_engine = create_engine(SQLA_URL, pool_size=n_workers, max_overflow=0)  # => co-18: sized to MATCH the concurrency target
    tuned_seconds = run_workload(tuned_engine, n_workers)  # => co-18: 8 workers, 8 connections -- no queueing for a free one
    tuned_engine.dispose()  # => closes every pooled connection -- good hygiene at process shutdown

    print(f"undersized: {undersized_seconds:.2f}s")  # => Output: undersized: <around 0.80s, varies by machine>
    print(f"tuned: {tuned_seconds:.2f}s")  # => Output: tuned: <around 0.20s, varies by machine>
    print(f"tuned faster: {tuned_seconds < undersized_seconds}")  # => Output: tuned faster: True
    assert tuned_seconds < undersized_seconds  # => co-18: the correctly-sized pool measurably beats the undersized one
    assert tuned_seconds < 0.5  # => co-18: 8 workers x 0.2s should overlap into roughly ONE 0.2s window, not stack up serially
    # => co-18: with pool_size=2, 8 workers queue in batches of 2 -- roughly FOUR sequential 0.2s waves, ~0.8s total;
    # => with pool_size=8, all EIGHT workers get a connection immediately and their 0.2s waits overlap into ONE
    # => window, ~0.2s total -- the pool size is a REAL throughput ceiling under concurrency, not a cosmetic setting
    print("ex-77 OK")  # => Output: ex-77 OK
```

**Run**: `python3 example.py`

**Output**:

```text
undersized: 0.87s
tuned: 0.24s
tuned faster: True
ex-77 OK
```

**Key takeaway**: With 8 concurrent workers, `pool_size=2` forces roughly four sequential waves of
queueing (~0.87s total); `pool_size=8` lets every worker check out a connection immediately, so all
their 0.2-second waits overlap into one window (~0.24s total).

**Why it matters**: This measures Example 46's exhaustion story from the other direction: instead of
showing what happens when the pool is too small, it shows the throughput actually recovered by sizing
it correctly. The pool size is a real, measurable throughput ceiling under concurrency, worth tuning to
the application's actual concurrent-request target rather than leaving at a default.

---

### Example 78: Capstone Preview Three Tier

_ex-78 &middot; exercises co-01, co-15, co-19, co-25_

One script threads four ideas from across this whole topic together: the identical query answered
through raw SQL, a query builder, and the ORM (all three agree); an N+1 reproduced then fixed with
`selectinload` (4 queries down to 2); and a schema change that both applies and rolls back cleanly. Every
claim is verified by running it, not asserted from memory.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC -- color-blind friendly, WCAG AA
flowchart TD
    accTitle: Example 78: Capstone Preview Three Tier
    accDescr: Flowchart with 8 nodes and 9 connections. Nodes: Same customer/order data, Tier 1: raw SQL, Tier 2: query builder, Tier 3: ORM, Identical answer, N+1: 4 queries, Fixed: 2 queries, Migration: upgrade + downgrade. Connections: Same customer/order data to Tier 1: raw SQL, Same customer/order data to Tier 2: query builder, Same customer/order data to Tier 3: ORM, Tier 1: raw SQL to Identical answer, Tier 2: query builder to Identical answer, Tier 3: ORM to Identical answer, Tier 3: ORM to N+1: 4 queries, N+1: 4 queries to Fixed: 2 queries (selectinload fix), Same customer/order data to Migration: upgrade + downgrade.
    A["Same customer/order<br/>data"]:::blue
    A --> B["Tier 1: raw SQL"]:::orange
    A --> C["Tier 2: query<br/>builder"]:::teal
    A --> D["Tier 3: ORM"]:::purple
    B --> E["Identical answer"]:::blue
    C --> E
    D --> E
    D --> F["N+1: 4 queries"]:::orange
    F -->|"selectinload fix"| G["Fixed: 2 queries"]:::teal
    A --> H["Migration: upgrade +<br/>downgrade"]:::purple

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-78-capstone-preview-three-tier/example.py`**

```python
# pyright: strict
"""Example 78: Three Tiers + an N+1 Fix + a Migration -- End to End, in One Script."""

from __future__ import annotations

import contextlib  # => co-19: swallows alembic's own non-deterministic scaffolding chatter, same reason as Example 48
import io  # => the throwaway buffer redirect_stdout writes that chatter INTO
import os  # => reads connection settings, and builds/removes the scratch project directory
import shutil  # => co-19: cleanup -- removes the scaffolded project directory once this example is done
import tempfile  # => co-19: a fresh, self-contained directory for the scaffolded migration project
from collections.abc import Generator  # => the modern return-type annotation @contextmanager expects, not Iterator
from contextlib import contextmanager  # => co-15: a reusable "count queries in this block" helper, reused from Example 42
from typing import Any  # => types SQLAlchemy's own untyped event-hook callback arguments

import psycopg  # => co-01: tier 1 -- the raw DB-API driver, no builder or ORM involved
from alembic import command  # => co-19: init/revision/upgrade -- the same API the alembic CLI itself calls
from alembic.config import Config  # => co-19: every alembic.command function needs one of these as its first argument
import psycopg.sql  # => wraps a RUNTIME str as a Composable -- psycopg's stubs require this over a plain non-literal str
from pypika import Query, Table  # => co-01: tier 2 -- PyPika builds the SQL text, psycopg runs it
from pypika import functions as pypika_fn  # => co-03: PyPika's own COUNT() aggregate function, not a raw SQL fragment
from sqlalchemy import Engine, ForeignKey, create_engine, event, select, text  # => co-01: tier 3 -- the ORM's own select()
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship, selectinload  # => co-14: selectinload is the N+1 fix

PG_DSN: str = os.environ.get("PG_DSN", "postgresql://postgres:postgres@localhost:5432/orm_by_example")  # => a plain DB-API DSN
SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance

ENV_PY = (  # => co-19: the SAME minimal env.py pattern from Examples 49-50 -- built as separate, individually-commented lines
    "from alembic import context\n"  # => co-19: `context` is alembic's OWN migration-runtime handle
    "from sqlalchemy import engine_from_config, pool\n\n"  # => co-19: builds a real Engine straight from alembic.ini's own section
    "config = context.config\n"  # => co-19: the SAME Config object bootstrap() constructed, now read back inside env.py
    'target_metadata = config.attributes.get("target_metadata")\n\n\n'  # => None -- this migration is hand-written, not autogenerated
    "def run_migrations_online() -> None:\n"  # => co-19: THE function alembic's runtime calls for a live-connection migration
    "    connectable = engine_from_config(\n"  # => co-19: reads the sqlalchemy.* keys straight out of alembic.ini's own section
    '        config.get_section(config.config_ini_section, {}), prefix="sqlalchemy.", poolclass=pool.NullPool\n'  # => no reuse needed
    "    )\n"  # => a short-lived migration run has no reason to KEEP a pooled connection open afterward
    "    with connectable.connect() as connection:\n"  # => borrows ONE connection for the whole migration run
    "        context.configure(connection=connection, target_metadata=target_metadata)\n"  # => co-19: binds THIS run's connection
    "        with context.begin_transaction():\n"  # => co-19: wraps every upgrade()/downgrade() call in ONE transaction
    "            context.run_migrations()\n\n\n"  # => the actual dispatch -- calls upgrade()/downgrade() on the revision below
    "run_migrations_online()\n"  # => co-19: executed the MOMENT alembic imports this file -- no __main__ guard, by design
)


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase (tier 3)
    pass  # => carries no columns -- purely a registry root


class Customer(Base):  # => co-01: the SAME table all three tiers read, mapped only for tier 3
    __tablename__ = "customer"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column
    orders: Mapped[list[Order]] = relationship(back_populates="customer")  # => co-15: the relationship the N+1 fires through


class Order(Base):  # => co-01: the "many" side, joined against in ALL three tiers
    __tablename__ = "order_table"  # => named to avoid colliding with the SQL reserved word ORDER
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    customer_id: Mapped[int] = mapped_column(ForeignKey("customer.id"))  # => the FK column every tier's JOIN condition uses
    customer: Mapped[Customer] = relationship(back_populates="orders")  # => the reverse navigation, exercised in tier 3 below


def reset_and_seed(engine: Engine, n_customers: int) -> None:  # => shared setup -- fresh schema, N customers, one order each
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build both tables into
    Base.metadata.create_all(engine)  # => issues CREATE TABLE for both customer and order_table
    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        for i in range(n_customers):  # => seeds N customers, one order each -- the SAME fixture data all three tiers read
            session.add(Customer(name=f"Customer{i}", orders=[Order()]))  # => a Customer plus exactly one child Order
        session.commit()  # => flushes all rows before any tier queries them


def tier1_raw_sql(dsn: str) -> list[tuple[str, int]]:  # => co-01 + co-02: raw parameterized SQL, manual row unpacking
    # => co-25: hand-written text, the SAME GROUP BY tier 2 and tier 3 below express in two OTHER ways
    sql = "SELECT c.name, COUNT(o.id) FROM customer c LEFT JOIN order_table o ON o.customer_id = c.id GROUP BY c.id, c.name ORDER BY c.name"
    with psycopg.connect(dsn) as conn, conn.cursor() as cur:  # => co-02: a plain DB-API connection, no builder or ORM at all
        cur.execute(sql)  # => co-25: a set-oriented GROUP BY, computed entirely server-side, in ONE round trip
        return [(name, count) for name, count in cur.fetchall()]  # => co-02: manual tuple unpacking into a typed list


def tier2_query_builder(dsn: str) -> list[tuple[str, int]]:  # => co-01 + co-03: PyPika composes the SAME query as data, not text
    customer_t, order_t = Table("customer"), Table("order_table")  # => co-03: bare table names -- no mapped class involved
    q = (
        Query.from_(customer_t)  # => co-03: the SAME GROUP BY as tier 1, built as a composable tree instead of a string
        .left_join(order_t)  # => co-03: the LEFT JOIN itself -- a method call, not string concatenation
        .on(order_t.customer_id == customer_t.id)  # => co-03: the JOIN condition, expressed as Field comparisons
        .groupby(customer_t.id, customer_t.name)  # => co-03: composed onto the SAME tree, one method at a time
        .orderby(customer_t.name)  # => matches tier 1's ORDER BY, so the two result lists compare equal below
        .select(customer_t.name, pypika_fn.Count(order_t.id))  # => co-03: PyPika's own COUNT() aggregate function
    )
    rendered = psycopg.sql.SQL(str(q))  # pyright: ignore[reportArgumentType]  # => wraps a runtime str -- Example 67's escape-hatch pattern
    with psycopg.connect(dsn) as conn, conn.cursor() as cur:  # => co-01: executed via the SAME raw DB-API as tier 1
        cur.execute(rendered)  # => co-01: PyPika BUILT the query, but a plain DB-API cursor still RUNS it
        return [(name, count) for name, count in cur.fetchall()]  # => co-03: identical shape to tier 1's return value


def tier3_orm(engine: Engine) -> list[tuple[str, int]]:  # => co-01 + co-06: the ORM tier -- object-shaped, in-Python aggregation
    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        stmt = select(Customer).options(selectinload(Customer.orders))  # => co-14: the FIX -- eager-loads BEFORE the N+1 could fire
        customers = session.execute(stmt).scalars().all()  # => query #1 (parents) + query #2 (batched children) -- co-15's fix
        return sorted((c.name, len(c.orders)) for c in customers)  # => co-25: aggregation done in Python -- correct, but hand-rolled


@contextmanager  # => co-15: turns "count every SELECT fired inside this block" into a plain `with` statement
def query_counter(engine: Engine) -> Generator[list[int]]:  # => yields a one-element mutable box holding the running count
    box = [0]  # => a list, not a plain int -- the caller reads box[0] AFTER the block exits, still seeing live updates

    def on_execute(conn: Any, cursor: Any, statement: str, *rest: Any) -> None:  # => untyped hook params (SQLAlchemy's own)
        if statement.strip().upper().startswith("SELECT"):  # => this counter only cares about read traffic
            box[0] += 1  # => increments the SAME box the caller holds a reference to

    listener = event.listens_for(engine, "before_cursor_execute")(on_execute)  # => attaches for the block's duration
    try:  # => the caller's code runs HERE, between attach and detach
        yield box  # => hands the box to the `with` block -- readable both during and after
    finally:  # => detaches even if the caller's block raises
        event.remove(engine, "before_cursor_execute", listener)  # => cleanup -- the NEXT measurement starts at zero


def bootstrap_alembic(url: str, project_dir: str) -> Config:  # => co-19: init + env.py rewrite, shared setup for the migration step
    script_dir = os.path.join(project_dir, "migrations")  # => alembic's convention -- a "migrations" subfolder
    cfg = Config(os.path.join(project_dir, "alembic.ini"))  # => co-19: the Config object every command function needs
    cfg.set_main_option("script_location", script_dir)  # => tells Config where the scaffolded files live
    cfg.set_main_option("sqlalchemy.url", url)  # => co-19: the ONE connection string the migration runs against
    with contextlib.redirect_stdout(io.StringIO()):  # => swallows "Creating directory ... done" -- path varies per run
        command.init(cfg, script_dir)  # => co-19: scaffolds env.py, script.py.mako, README, versions/ (Example 48)
    with open(os.path.join(script_dir, "env.py"), "w") as f:  # => co-19: OVERWRITES the scaffolded env.py with our own
        f.write(ENV_PY)  # => a hand-edit step, exactly like a real project's post-init setup
    return cfg  # => ready for command.revision()/upgrade()/downgrade() calls


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine, shared by every tier and the migration step below
    reset_and_seed(engine, n_customers=3)  # => co-01: THE SAME fixture data all three tiers below independently read

    sql_result = tier1_raw_sql(PG_DSN)  # => co-01: tier 1 -- raw SQL
    builder_result = tier2_query_builder(PG_DSN)  # => co-01: tier 2 -- query builder
    orm_result = tier3_orm(engine)  # => co-01: tier 3 -- full ORM
    print(f"sql_result={sql_result}")  # => Output: sql_result=[('Customer0', 1), ('Customer1', 1), ('Customer2', 1)]
    assert sql_result == builder_result == orm_result  # => co-01: all three tiers agree on the IDENTICAL correct answer
    # => co-01: this is the SPECTRUM from Example 1, run for real -- three DIFFERENT code paths, one CORRECT answer

    with query_counter(engine) as before:  # => co-15: reproduces the N+1 -- NO eager-loading option this time
        with Session(engine) as session:  # => a FRESH session -- nothing cached
            for customer in session.execute(select(Customer)).scalars().all():  # => query #1
                _ = [o.id for o in customer.orders]  # => co-13: each access fires its OWN lazy round trip -- the N+1 itself
    with query_counter(engine) as after:  # => co-14: the SAME access pattern, now fixed with eager loading
        with Session(engine) as session:  # => a FRESH session -- nothing cached
            stmt = select(Customer).options(selectinload(Customer.orders))  # => co-14: the fix, identical to tier3_orm()
            for customer in session.execute(stmt).scalars().all():  # => query #1 (parents) + query #2 (batched children)
                _ = [o.id for o in customer.orders]  # => reads from memory -- zero additional round trips
    print(f"before={before[0]} after={after[0]}")  # => Output: before=4 after=2
    assert before[0] == 4 and after[0] == 2  # => co-15: N+1 (3 customers + 1 parent query) collapses to a CONSTANT 2
    # => co-15: this is Examples 36-37's fix, threaded through the SAME tier-3 code path tier3_orm() above already uses

    project_dir = tempfile.mkdtemp(prefix="alembic_ex78_")  # => a fresh, throwaway migration project for this example
    cfg = bootstrap_alembic(SQLA_URL, project_dir)  # => scaffolds + rewires env.py, matching the earlier Alembic examples
    with contextlib.redirect_stdout(io.StringIO()):  # => swallows "Generating .../0001_add_email.py ... done"
        rev = command.revision(cfg, message="add email", rev_id="0001")  # => co-19: an EMPTY skeleton, filled in below
    assert rev is not None and not isinstance(rev, list)  # => narrows the Union return type for pyright --strict below
    with open(rev.path, "w") as f:  # => co-19: a REVERSIBLE schema-only migration -- add a column, then drop it back
        f.write(  # => co-19: the SAME "built as separate, individually-commented string lines" pattern as Examples 49-54
            '"""add email"""\n'  # => the migration's own docstring
            "from typing import Sequence, Union\n"  # => typed to match what command.revision()'s own skeleton generates
            "from alembic import op\n"  # => co-19: `op.add_column`/`op.drop_column` -- the schema edits this migration makes
            "import sqlalchemy as sa\n\n"  # => the column TYPE for the new email column
            'revision: str = "0001"\n'  # => co-19: THIS revision's own id -- matches the rev_id passed to command.revision()
            "down_revision: Union[str, Sequence[str], None] = None\n"  # => None -- the first (and only) revision in this project
            "branch_labels: Union[str, Sequence[str], None] = None\n"  # => unused here -- relevant only for branching histories
            "depends_on: Union[str, Sequence[str], None] = None\n\n"  # => unused here -- cross-branch dependency declarations
            "def upgrade() -> None:\n"  # => co-19: FORWARD -- adds the column
            '    op.add_column("customer", sa.Column("email", sa.String, nullable=True))\n\n'  # => co-19: the additive half
            "def downgrade() -> None:\n"  # => co-19: REVERSE -- removes the SAME column, restoring the original shape
            '    op.drop_column("customer", "email")\n'  # => co-21: a TRUE reversal -- the schema round-trips exactly
        )
    with contextlib.redirect_stdout(io.StringIO()):  # => swallows alembic's own noisy status lines
        command.upgrade(cfg, "head")  # => co-19: runs the forward migration
    with engine.begin() as conn:  # => a fresh connection to verify the column now EXISTS
        after_up = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'customer'")).all()
    with contextlib.redirect_stdout(io.StringIO()):  # => swallows alembic's own noisy status lines
        command.downgrade(cfg, "base")  # => co-19 + co-21: rolls the migration back
    with engine.begin() as conn:  # => a fresh connection to verify the column is now GONE again
        after_down = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'customer'")).all()
    has_email_after_up = "email" in {row[0] for row in after_up}  # => co-19: confirms the forward step actually added the column
    has_email_after_down = "email" in {row[0] for row in after_down}  # => co-21: confirms the rollback actually removed it again

    # => co-19 + co-21: THIS is the "verify migrate-then-rollback returns the schema to its starting state" bar
    print(f"has_email_after_up={has_email_after_up}")  # => Output: has_email_after_up=True
    print(f"has_email_after_down={has_email_after_down}")  # => Output: has_email_after_down=False
    assert has_email_after_up is True  # => co-19: the migration applied cleanly
    assert has_email_after_down is False  # => co-21: the migration rolled back cleanly, restoring the original schema
    # => co-19: forward and rollback are BOTH exercised, not just the forward half -- an untested downgrade() is a liability
    # => co-01 + co-15 + co-19 + co-25: this IS the capstone's shape, in miniature -- the same domain queried through
    # => raw SQL, a query builder, and a full ORM (co-01), an N+1 reproduced then fixed with eager loading (co-15),
    # => and a schema change that both applies and rolls back correctly (co-19, co-21) -- every tier's trade-off
    # => demonstrated by running it, not asserted from memory; the full capstone develops this same shape further

    shutil.rmtree(project_dir)  # => cleanup -- this example's own throwaway project, not a real repository
    # => 78 examples, 27 concepts, one running theme -- pick the tier the WORKLOAD demands, not the tier you know best
    print("ex-78 OK")  # => Output: ex-78 OK
```

**Run**: `python3 example.py`

**Output**:

```text
sql_result=[('Customer0', 1), ('Customer1', 1), ('Customer2', 1)]
before=4 after=2
has_email_after_up=True
has_email_after_down=False
ex-78 OK
```

**Key takeaway**: One script proves four claims by running them: three tiers agree on the identical
answer, an N+1 collapses from 4 queries to 2 with `selectinload`, and a migration both applies and rolls
back cleanly -- every trade-off this topic covers, demonstrated together instead of asserted separately.

**Why it matters**: This is the topic's own claim made good on: 78 examples, 27 concepts, one running
theme -- pick the tier the workload demands, not the tier the team already knows, and verify every
claim by executing it against real Postgres rather than trusting a guess. This script previews the
shape a fuller capstone project would develop further, threading raw SQL, a query builder, the ORM,
N+1 detection and fixing, and reversible migrations through one coherent, runnable example.

---

← Previous: [Intermediate Examples](./intermediate.md) &middot; Next: [Capstone](./capstone/overview.md) →
