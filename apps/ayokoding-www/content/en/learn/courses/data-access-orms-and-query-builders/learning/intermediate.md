---
title: "Intermediate Examples"
date: 2026-07-18T00:00:00+07:00
draft: false
weight: 20
---

Examples 29-56 cover the four session object states and expire/refresh, the unit of work's flush
ordering, dirty tracking, and autoflush, lazy loading and the `DetachedInstanceError`, the N+1 problem
reproduced and measured, the three eager-loading strategies (`selectinload`, `joinedload`,
`subqueryload`) contrasted, `raiseload()` as a guard, ORM transactions and nested savepoints, connection
pooling (sizing, exhaustion, `pool_pre_ping`), the full Alembic workflow (init, hand-written migrations,
upgrade/downgrade, autogenerate and its blind spots, reversible vs. explicitly-irreversible data
migrations), and ORM cascade vs. database `ON DELETE CASCADE`. Every example is fully self-contained: it
resets and seeds its own tables against a local PostgreSQL instance, so none of them depend on state
left behind by an earlier example. Run each example with `python3 example.py` from a shell where this
topic's `.venv` is active and a Postgres container is listening on `localhost:5432` (see
[Overview](./overview.md#confirm-your-toolchain)).

---

### Example 29: Session States Transient Pending

_ex-29 &middot; exercises co-11_

`inspect()` returns an object's live `InstanceState`, and this example reads it at every step of one
`Customer` object's life: constructed but unknown to any session (transient), registered via `add()` but
not yet flushed (pending), flushed and committed (persistent), and left behind once its session closes
(detached). Exactly one of the four flags is `True` at any moment.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC -- color-blind friendly, WCAG AA
flowchart LR
    accTitle: Example 29: Session States Transient Pending
    accDescr: Flowchart with 4 nodes and 3 connections. Nodes: Transient constructed, no session, Pending session.add(ada), Persistent flushed + committed, Detached session closed. Connections: Transient constructed, no session to Pending session.add(ada), Pending session.add(ada) to Persistent flushed + committed, Persistent flushed + committed to Detached session closed.
    A["Transient<br/>constructed, no<br/>session"]:::blue
    B["Pending<br/>session.add(ada)"]:::orange
    C["Persistent<br/>flushed + committed"]:::teal
    D["Detached<br/>session closed"]:::purple
    A --> B --> C --> D

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-29-session-states-transient-pending/example.py`**

```python
# pyright: strict
"""Example 29: Session Object States -- Transient, Pending, Persistent, Detached."""

from __future__ import annotations

import os  # => reads connection settings from the environment

from sqlalchemy import Engine, create_engine, inspect, text  # => co-11: inspect() exposes an object's InstanceState
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column
from sqlalchemy.orm import InstanceState  # => the type inspect() returns for a mapped instance -- carries the phase flags


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Customer(Base):  # => co-11: the mapped class this example tracks across all four states
    __tablename__ = "customer"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres, None before a flush
    name: Mapped[str]  # => a required TEXT column


def reset_schema(engine: Engine) -> None:  # => shared reset helper -- wipes the whole schema, self-contained
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build Customer's table into
    Base.metadata.create_all(engine)  # => issues CREATE TABLE customer from Customer's Mapped[] fields


SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance

if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine
    reset_schema(engine)  # => fresh, empty customer table

    ada = Customer(name="Ada")  # => co-11: STATE 1 -- TRANSIENT. constructed but no Session has ever seen it
    state: InstanceState[Customer] = inspect(ada)  # => a handle onto the object's own InstanceState -- reads phase flags
    print(f"transient: {state.transient}")  # => Output: transient: True
    assert state.transient and not state.pending and not state.persistent and not state.detached  # => exactly one flag set

    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        session.add(ada)  # => co-11: STATE 2 -- PENDING. the session knows about `ada`, but no INSERT has been sent yet
        print(f"pending: {state.pending}")  # => Output: pending: True
        assert state.pending and not state.transient and not state.persistent  # => the state object updates itself in place

        session.commit()  # => co-11 + co-12: STATE 3 -- PERSISTENT. flushes the INSERT, then commits -- now tracked in the
        # => Session's identity map, with a real primary key backing it
        print(f"persistent: {state.persistent}")  # => Output: persistent: True
        assert state.persistent and not state.pending  # => moved out of "pending" the moment the flush succeeded
        ada_id = ada.id  # => reads `id` INSIDE the still-open session -- avoids a DetachedInstanceError below

    print(f"detached: {state.detached}")  # => Output: detached: True
    # => co-11: STATE 4 -- DETACHED. the `with` block above closed the session -- `ada` still exists in Python memory,
    # => still has its `id`, but is no longer tracked by ANY session's identity map or unit of work
    assert state.detached and not state.persistent  # => co-11: the full transient -> pending -> persistent -> detached arc
    print(f"final id={ada_id}")  # => Output: final id=1
    # => co-11: these four states are exactly the four SQLAlchemy uses to describe an object's persistence lifecycle
    print("ex-29 OK")  # => Output: ex-29 OK
```

**Run**: `python3 example.py`

**Output**:

```text
transient: True
pending: True
persistent: True
detached: True
final id=1
ex-29 OK
```

**Key takeaway**: `inspect(obj).transient/.pending/.persistent/.detached` are not documentation trivia --
they are live flags you can read in running code to confirm exactly which of the four lifecycle states an
object occupies right now.

**Why it matters**: Nearly every "why did this attribute access fail" or "why is this object stale" bug
traces back to one of these four states. Recognizing transient (no session), pending (added, not
flushed), persistent (flushed and tracked), and detached (session closed) turns confusing runtime
behavior into a predictable state machine instead of a mystery. Example 35 shows the concrete failure
mode -- touching an unloaded relationship on a detached object -- that this state model explains.

---

### Example 30: Session Expire Refresh

_ex-30 &middot; exercises co-11_

A raw connection updates a customer's name behind the session's back; the session has no way to know, so
it keeps serving its stale in-memory copy until `expire()` discards that copy and `refresh()` forces a
real reload from Postgres.

**`learning/code/ex-30-session-expire-refresh/example.py`**

```python
# pyright: strict
"""Example 30: session.expire() + refresh() -- Forcing a Reload From Postgres."""

from __future__ import annotations

import os  # => reads connection settings from the environment

from sqlalchemy import Engine, create_engine, text  # => co-11: the engine a Session opens connections FROM
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Customer(Base):  # => co-11: the mapped class this example expires and refreshes
    __tablename__ = "customer"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column, mutated OUTSIDE the ORM later in this example


def reset_schema(engine: Engine) -> None:  # => shared reset helper -- wipes the whole schema, self-contained
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build Customer's table into
    Base.metadata.create_all(engine)  # => issues CREATE TABLE customer from Customer's Mapped[] fields


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine
    reset_schema(engine)  # => fresh, empty customer table
    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        ada = Customer(name="Ada")  # => the row this example mutates OUTSIDE the ORM's own knowledge
        session.add(ada)  # => registers `ada` as pending
        session.commit()  # => flushes the INSERT, assigns ada.id
        ada_id = ada.id  # => reads `id` INSIDE the still-open session -- avoids a DetachedInstanceError below

        with engine.begin() as raw_conn:  # => co-11: a SEPARATE raw connection -- bypasses this session's ORM entirely
            raw_conn.execute(text("UPDATE customer SET name = 'Ada Lovelace' WHERE id = :id"), {"id": ada_id})
            # => this UPDATE happens BEHIND the session's back -- `ada.name` in Python memory is now stale

        print(f"before refresh: {ada.name}")  # => Output: before refresh: Ada
        # => co-11: the session has NO reason to know the row changed -- it still trusts its own in-memory copy

        session.expire(ada)  # => co-11: marks `ada`'s attributes as stale -- does NOT reload them yet, just discards them
        # => expire() alone is lazy: the NEXT attribute access would trigger a reload -- refresh() below makes it eager
        session.refresh(ada)  # => co-11: forces an immediate reload -- issues a fresh SELECT for this object's PK
        print(f"after refresh: {ada.name}")  # => Output: after refresh: Ada Lovelace
        assert ada.name == "Ada Lovelace"  # => co-11: expire() + refresh() is the ORM's explicit "trust the database now"
        # => escape hatch -- without it, an object silently diverges from a row another process (or connection) changed
        # => Example 33 shows the OTHER trigger for a reload: querying, not calling refresh() by hand
    print("ex-30 OK")  # => Output: ex-30 OK
```

**Run**: `python3 example.py`

**Output**:

```text
before refresh: Ada
after refresh: Ada Lovelace
ex-30 OK
```

**Key takeaway**: `expire()` marks attributes stale without querying; `refresh()` is the eager version
that immediately re-fetches from the database -- together they are the ORM's explicit "trust the
database now" escape hatch.

**Why it matters**: Real applications share a database across multiple connections, background jobs, or
services -- a session's in-memory copy can silently diverge from a row another writer just changed.
Without `expire()`/`refresh()`, an object simply keeps returning whatever it last loaded, no matter how
stale. Reaching for this pair deliberately, rather than assuming an ORM object is always current, is
what keeps long-lived sessions honest about what they actually know.

---

### Example 31: Unit Of Work Flush Order

_ex-31 &middot; exercises co-12_

A child `CustomerOrder` is constructed and `add()`-ed to the session _before_ its parent `Customer`,
deliberately reversing code order. An `event` hook records the actual `INSERT` order the flush emits,
proving the unit of work computes dependency order from the foreign key, not from the order calls
happened in.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05 -- color-blind friendly, WCAG AA
sequenceDiagram
    accTitle: Example 31: Unit Of Work Flush Order
    accDescr: Sequence diagram between application code, unit of work, PostgreSQL. Messages: application code to unit of work: add(order) -- child, added FIRST; application code to unit of work: add(customer) -- parent, added SECOND; application code to unit of work: commit(); unit of work to PostgreSQL: INSERT INTO customer (parent first, by FK dependency); unit of work to PostgreSQL: INSERT INTO customer_order (child second).
    participant Code as application code
    participant UoW as unit of work
    participant DB as PostgreSQL
    Code->>UoW: add(order) -- child, added FIRST
    Code->>UoW: add(customer) -- parent, added SECOND
    Code->>UoW: commit()
    UoW->>DB: INSERT INTO customer (parent first, by FK dependency)
    UoW->>DB: INSERT INTO customer_order (child second)
```

**`learning/code/ex-31-unit-of-work-flush-order/example.py`**

```python
# pyright: strict
"""Example 31: Unit of Work -- the Session Orders INSERTs by Dependency, Not by Code Order."""

from __future__ import annotations

import os  # => reads connection settings from the environment
from typing import Any  # => the event hook's callback signature is untyped by SQLAlchemy's own stubs

from sqlalchemy import Engine, ForeignKey, create_engine, event, text  # => co-12: event captures the ACTUAL flush order
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Customer(Base):  # => co-12: the PARENT -- its row must exist before any child's FK can reference it
    __tablename__ = "customer"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => the PK the child FK depends on
    name: Mapped[str]  # => a required TEXT column
    orders: Mapped[list["CustomerOrder"]] = relationship(back_populates="customer")  # => the parent-to-child collection


class CustomerOrder(Base):  # => co-12: the CHILD -- its FK depends on the parent's PK already existing
    __tablename__ = "customer_order"  # => named to avoid the reserved SQL word "order"
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    customer_id: Mapped[int] = mapped_column(ForeignKey("customer.id"))  # => the dependency the unit of work must respect
    total: Mapped[int] = mapped_column()  # => the order's total in cents, kept as a plain int for this example
    customer: Mapped[Customer] = relationship(back_populates="orders")  # => the child-to-parent reverse link


def reset_schema(engine: Engine) -> None:  # => shared reset helper -- wipes the whole schema, self-contained
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build both tables into
    Base.metadata.create_all(engine)  # => issues CREATE TABLE for both customer and customer_order


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine
    reset_schema(engine)  # => fresh, empty customer and customer_order tables

    statements: list[str] = []  # => every SQL statement the ORM emits, captured for verification below

    def on_execute(conn: Any, cursor: Any, statement: str, *rest: Any) -> None:  # => untyped hook params (SQLAlchemy's own)
        statements.append(" ".join(statement.split()[:3]).upper())  # => records "INSERT INTO <table>" -- verb AND target

    event.listens_for(engine, "before_cursor_execute")(on_execute)  # => attaches the hook to every statement on `engine`

    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        order = CustomerOrder(total=1999)  # => co-12: the CHILD object is constructed and added FIRST, out of dependency order
        # => deliberately backwards -- proves the unit of work computes dependency order itself, not just source order
        ada = Customer(name="Ada")  # => the PARENT object, constructed SECOND -- code order says child, then parent
        order.customer = ada  # => links them -- back_populates keeps ada.orders in sync too
        session.add(order)  # => registers the child FIRST, matching the CODE order above
        session.add(ada)  # => registers the parent SECOND, again matching the CODE order above
        session.commit()  # => co-12: flushes both -- but NOT in the order they were added

    insert_statements = [s for s in statements if s.startswith("INSERT")]  # => filters to the two INSERTs this example expects
    print(insert_statements)  # => Output: ['INSERT INTO CUSTOMER', 'INSERT INTO CUSTOMER_ORDER']
    assert insert_statements == ["INSERT INTO CUSTOMER", "INSERT INTO CUSTOMER_ORDER"]  # => customer landed FIRST
    # => co-12: the unit of work reordered these writes ITSELF -- it inspected the FK dependency (order.customer_id ->
    # => customer.id) and inserted customer BEFORE customer_order, even though `order` was added to the session first
    # => this is the defining trait of Unit of Work: the caller declares WHAT changed, the pattern decides WHEN to write it
    print("ex-31 OK")  # => Output: ex-31 OK
```

**Run**: `python3 example.py`

**Output**:

```text
['INSERT INTO CUSTOMER', 'INSERT INTO CUSTOMER_ORDER']
ex-31 OK
```

**Key takeaway**: The unit of work computes `INSERT` order from the foreign-key dependency graph, not
from the order `session.add()` was called -- the caller declares _what_ changed, the pattern decides
_when_ to write it.

**Why it matters**: If SQLAlchemy simply flushed objects in `add()` order, code that happened to build a
child before its parent would crash with a foreign-key violation, and every caller would need to
remember to `add()` parents first. Delegating ordering to the unit of work removes an entire class of
"insert order" bugs and lets application code focus on describing the object graph, not sequencing
writes to satisfy the database's own constraints.

---

### Example 32: Unit Of Work Dirty Tracking

_ex-32 &middot; exercises co-12_

A `Customer` is loaded fresh, then only its `name` is mutated -- `email` and `country` stay untouched.
An `event` hook captures the exact `UPDATE` SQL the flush emits, proving the unit of work snapshots every
attribute at load time and writes only the columns that actually changed.

**`learning/code/ex-32-unit-of-work-dirty-tracking/example.py`**

```python
# pyright: strict
"""Example 32: Unit of Work -- Dirty Tracking Writes Only Changed Columns."""

from __future__ import annotations

import os  # => reads connection settings from the environment
from typing import Any  # => the event hook's callback signature is untyped by SQLAlchemy's own stubs

from sqlalchemy import Engine, create_engine, event, select, text  # => co-12: event captures the emitted UPDATE's own SQL
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Customer(Base):  # => co-12: three columns, only ONE of which this example mutates
    __tablename__ = "customer"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column -- this one gets mutated below
    email: Mapped[str]  # => a required TEXT column -- this one is NEVER touched after the insert
    country: Mapped[str]  # => a required TEXT column -- this one is NEVER touched after the insert either


def reset_schema(engine: Engine) -> None:  # => shared reset helper -- wipes the whole schema, self-contained
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build Customer's table into
    Base.metadata.create_all(engine)  # => issues CREATE TABLE customer from Customer's Mapped[] fields


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine
    reset_schema(engine)  # => fresh, empty customer table
    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        ada = Customer(name="Ada", email="ada@example.com", country="UK")  # => three columns, all set at insert time
        session.add(ada)  # => registers `ada` as pending
        session.commit()  # => flushes the INSERT, assigns ada.id
        ada_id = ada.id  # => reads `id` INSIDE the still-open session -- avoids a DetachedInstanceError below

    statements: list[str] = []  # => captures the RAW SQL of every statement, for inspecting exactly which columns appear

    def on_execute(conn: Any, cursor: Any, statement: str, *rest: Any) -> None:  # => untyped hook params (SQLAlchemy's own)
        statements.append(statement)  # => records the RAW SQL text SQLAlchemy is about to send to Postgres

    event.listens_for(engine, "before_cursor_execute")(on_execute)  # => attaches the hook to every statement on `engine`

    with Session(engine) as session:  # => a FRESH session -- reloads Ada, then mutates ONLY her name
        loaded = session.execute(select(Customer).where(Customer.id == ada_id)).scalar_one()  # => reload by PK
        loaded.name = "Ada Lovelace"  # => co-12: mutating ONE attribute -- the session's dirty-tracking notices THIS one
        # => `loaded.email` and `loaded.country` are untouched -- the unit of work knows the difference between "loaded"
        # => and "changed", because it snapshots every attribute at load time and diffs against that snapshot on flush
        session.commit()  # => flushes ONLY the dirty column(s), then commits

    update_statements = [s for s in statements if s.strip().upper().startswith("UPDATE")]  # => filters to the one UPDATE
    print(update_statements)  # => Output: ['UPDATE customer SET name=%(name)s::VARCHAR WHERE customer.id = %(customer_id)s::INTEGER']
    assert len(update_statements) == 1  # => exactly one UPDATE was emitted
    assert "email" not in update_statements[0] and "country" not in update_statements[0]  # => co-12: the UNCHANGED columns
    # => never appear in the SET clause at all -- SQLAlchemy does not blindly re-write every column on every save
    # => contrast with a hand-rolled "UPDATE customer SET name=%s, email=%s, country=%s" -- Active Record libraries that
    # => lack dirty tracking often do exactly that, re-sending every column whether it changed or not
    print("ex-32 OK")  # => Output: ex-32 OK
```

**Run**: `python3 example.py`

**Output**:

```text
['UPDATE customer SET name=%(name)s::VARCHAR WHERE customer.id = %(customer_id)s::INTEGER']
ex-32 OK
```

**Key takeaway**: The unit of work snapshots every attribute at load time and diffs against that snapshot
on flush, so a mutated `UPDATE` includes only the columns that actually changed -- never a blind
rewrite of every column.

**Why it matters**: A naive Active Record implementation without dirty tracking often re-sends every
column on every save, which wastes bandwidth, can clobber a concurrent writer's change to an untouched
column, and makes audit logs noisy with false "changed" entries. Dirty tracking turns "what did this
save actually change" into a question the ORM can answer precisely, from its own bookkeeping, without
you writing a manual diff.

---

### Example 33: Unit Of Work Autoflush

_ex-33 &middot; exercises co-12, co-17_

A `Customer` is added to the session but never committed; a plain `select()` against the same session
runs anyway -- and the new customer shows up in the results. Autoflush, the session's default behavior,
silently flushed the pending `INSERT` _before_ running the `SELECT`, so the query never misses the
session's own uncommitted writes.

**`learning/code/ex-33-unit-of-work-autoflush/example.py`**

```python
# pyright: strict
"""Example 33: Unit of Work -- Autoflush Runs the Pending INSERT Before Your SELECT."""

from __future__ import annotations

import os  # => reads connection settings from the environment

from sqlalchemy import Engine, create_engine, select, text  # => co-12: select() is what TRIGGERS autoflush below
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Customer(Base):  # => co-12: the mapped class this example queries WHILE another instance is still pending
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
    with Session(engine) as session:  # => co-12: `autoflush=True` is the Session's DEFAULT -- not set explicitly here
        ada = Customer(name="Ada")  # => a transient object, about to become pending
        session.add(ada)  # => co-12: PENDING -- no INSERT sent yet, no commit() called either
        print(f"autoflush enabled: {session.autoflush}")  # => Output: autoflush enabled: True

        rows = session.execute(select(Customer)).scalars().all()  # => co-12: a plain SELECT, no commit() came before it
        # => this is the crux of autoflush: BEFORE running the SELECT against Postgres, the session flushed its own
        # => pending INSERT first -- otherwise the query would miss Ada entirely, contradicting the app's own in-memory
        # => view of the world (ada is clearly "there", the session just hadn't told Postgres about it yet)
        names = [row.name for row in rows]  # => reads the query's own result set
        print(f"names={names}")  # => Output: names=['Ada']
        assert names == ["Ada"]  # => co-12: the pending Ada WAS visible to the query -- autoflush ran first, automatically
        assert ada not in session.new  # => co-12: ada is no longer "new"/pending -- autoflush already promoted it to persistent

        session.commit()  # => co-17: commits the transaction the autoflush opened -- makes the write durable
    # => co-12: turning autoflush off (Session(engine, autoflush=False)) is rare and usually a mistake -- queries would
    # => then silently miss your own uncommitted writes, an easy source of "why doesn't my object show up" bugs
    print("ex-33 OK")  # => Output: ex-33 OK
```

**Run**: `python3 example.py`

**Output**:

```text
autoflush enabled: True
names=['Ada']
ex-33 OK
```

**Key takeaway**: Autoflush, the session's default, flushes pending writes _before_ running any query --
so a `select()` never misses an object the session already knows about, even before `commit()`.

**Why it matters**: Without autoflush, a `select()` issued while a write is still pending would run
against the database's last-committed state, silently missing an object your own code just constructed
and `add()`-ed. That mismatch between "what the app believes exists" and "what the query returns" is
exactly the kind of subtle bug autoflush prevents by default -- which is why disabling it is rare and
usually a deliberate, carefully-considered choice.

---

### Example 34: Lazy Loading Default

_ex-34 &middot; exercises co-13_

A `Customer` is fetched with `session.get()`, costing exactly one `SELECT`; only when `.orders` is
touched for the first time does a second, lazy `SELECT` fire. An `event` hook counts queries before and
after that first access to make the deferred cost visible instead of assumed.

**`learning/code/ex-34-lazy-loading-default/example.py`**

```python
# pyright: strict
"""Example 34: Lazy Loading -- Accessing a Relationship Fires an EXTRA SELECT."""

from __future__ import annotations

import os  # => reads connection settings from the environment
from decimal import Decimal  # => money is Decimal, never float -- exact cents, no rounding drift
from typing import Any  # => the event hook's callback signature is untyped by SQLAlchemy's own stubs

from sqlalchemy import Engine, ForeignKey, create_engine, event, text  # => co-13: event captures the LAZY query firing
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Customer(Base):  # => co-13: the parent whose relationship this example accesses LAZILY
    __tablename__ = "customer"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column
    orders: Mapped[list["CustomerOrder"]] = relationship(back_populates="customer")  # => co-13: default lazy="select"
    # => "select" IS the default -- no lazy=... kwarg above means SQLAlchemy picks this strategy for you


class CustomerOrder(Base):  # => co-13: the child, only fetched on FIRST access of `.orders`
    __tablename__ = "customer_order"  # => named to avoid the reserved SQL word "order"
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    customer_id: Mapped[int] = mapped_column(ForeignKey("customer.id"))  # => the FK the lazy query filters by
    total: Mapped[Decimal]  # => the order's total, as an exact Decimal
    customer: Mapped[Customer] = relationship(back_populates="orders")  # => the reverse, many-to-one navigation


def reset_schema(engine: Engine) -> None:  # => shared reset helper -- wipes the whole schema, self-contained
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build both tables into
    Base.metadata.create_all(engine)  # => issues CREATE TABLE for both customer and customer_order


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine
    reset_schema(engine)  # => fresh, empty customer and customer_order tables
    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        ada = Customer(name="Ada", orders=[CustomerOrder(total=Decimal("19.99"))])  # => one parent, one child, seeded
        session.add(ada)  # => cascades: registers both the parent and the child as pending
        session.commit()  # => flushes both INSERTs
        ada_id = ada.id  # => reads `id` INSIDE the still-open session -- avoids a DetachedInstanceError below

    statements: list[str] = []  # => every SELECT the ORM emits from here on, captured for verification below

    def on_execute(conn: Any, cursor: Any, statement: str, *rest: Any) -> None:  # => untyped hook params (SQLAlchemy's own)
        if statement.strip().upper().startswith("SELECT"):  # => this example only cares about read traffic
            statements.append(" ".join(statement.split()[:2]).upper())  # => records "SELECT ..." -- just enough to count

    event.listens_for(engine, "before_cursor_execute")(on_execute)  # => attaches the hook to every statement on `engine`

    with Session(engine) as session:  # => a FRESH session -- nothing cached, so the parent fetch below is a real round trip
        fetched = session.get(Customer, ada_id)  # => query #1: fetches ONLY the customer row, no orders yet
        assert fetched is not None  # => narrows Optional[Customer] for pyright --strict below
        print(f"selects after get(): {len(statements)}")  # => Output: selects after get(): 1
        # => co-13: `.orders` has NOT been touched yet -- the parent alone cost exactly one SELECT

        totals = [order.total for order in fetched.orders]  # => co-13: FIRST access of `.orders` -- fires the lazy query NOW
        print(f"selects after .orders access: {len(statements)}")  # => Output: selects after .orders access: 2
        assert len(statements) == 2  # => co-13: accessing the relationship added EXACTLY one more SELECT, on demand
        print(totals)  # => Output: [Decimal('19.99')]
        assert totals == [Decimal("19.99")]  # => the lazily-fetched child data is correct, just fetched LATE
        # => co-13: "lazy" means DEFERRED, not "free" -- the query still happens, just at first-touch instead of up front
        # => Example 37 shows the alternative: eager loading pulls this same data during the ORIGINAL query instead
    print("ex-34 OK")  # => Output: ex-34 OK
```

**Run**: `python3 example.py`

**Output**:

```text
selects after get(): 1
selects after .orders access: 2
[Decimal('19.99')]
ex-34 OK
```

**Key takeaway**: "Lazy" means deferred, not free -- accessing an unloaded relationship attribute fires a
real `SELECT` at first touch, exactly one query per relationship per object, on demand.

**Why it matters**: Lazy loading reads like plain attribute access, which is precisely what makes it easy
to reach for without noticing the round trip hiding underneath. For a single object, that hidden query is
harmless; Example 36 shows what happens when the same pattern runs inside a loop over many parents instead,
turning one invisible query into many invisible queries that quietly add up.

---

### Example 35: Lazy Loading Detached Error

_ex-35 &middot; exercises co-13, co-11_

`Customer.name` is safe to read even after the session closes, because it was already loaded. But
`.orders`, never touched before `close()`, raises `DetachedInstanceError` the moment code tries to access
it -- there is no live session left to run the lazy query through.

```mermaid
%% Color Palette: Blue #0173B2, Teal #029E73, Orange #DE8F05 -- color-blind friendly, WCAG AA
flowchart TD
    accTitle: Example 35: Lazy Loading Detached Error
    accDescr: Flowchart with 6 nodes and 5 connections. Nodes: session.close() ada is now DETACHED, read ada.name already loaded, read ada.orders never touched before close, D, no, DetachedInstance Error no session left to query. Connections: session.close() ada is now DETACHED to read ada.name already loaded, session.close() ada is now DETACHED to read ada.orders never touched before close, read ada.name already loaded to D, D to no, read ada.orders never touched before close to DetachedInstance Error no session left to query.
    A["session.close()<br/>ada is now DETACHED"]:::blue
    A --> B["read ada.name<br/>already loaded"]:::teal
    A --> C["read ada.orders<br/>never touched before<br/>close"]:::orange
    B --> D["OK -- no query<br/>needed"]:::teal
    C --> E["DetachedInstance<br/>Error<br/>no session left to<br/>query"]:::orange

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-35-lazy-loading-detached-error/example.py`**

```python
# pyright: strict
"""Example 35: Lazy Loading After Session Close -- DetachedInstanceError."""

from __future__ import annotations

import os  # => reads connection settings from the environment
from decimal import Decimal  # => money is Decimal, never float -- exact cents, no rounding drift

from sqlalchemy import Engine, ForeignKey, create_engine, text  # => co-13: relationship() is what needs the LIVE session
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship
from sqlalchemy.orm.exc import DetachedInstanceError  # => co-13/co-11: the exact exception a detached lazy access raises

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Customer(Base):  # => co-11: the object this example detaches by closing its owning session
    __tablename__ = "customer"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column, safe to read even after detach -- it was already loaded
    orders: Mapped[list["CustomerOrder"]] = relationship(back_populates="customer")  # => co-13: NOT loaded yet, on purpose


class CustomerOrder(Base):  # => the child, deliberately left un-accessed until AFTER the session closes
    __tablename__ = "customer_order"  # => named to avoid the reserved SQL word "order"
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    customer_id: Mapped[int] = mapped_column(ForeignKey("customer.id"))  # => the FK the lazy query would filter by
    total: Mapped[Decimal]  # => the order's total, as an exact Decimal
    customer: Mapped[Customer] = relationship(back_populates="orders")  # => the reverse, many-to-one navigation


def reset_schema(engine: Engine) -> None:  # => shared reset helper -- wipes the whole schema, self-contained
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build both tables into
    Base.metadata.create_all(engine)  # => issues CREATE TABLE for both customer and customer_order


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine
    reset_schema(engine)  # => fresh, empty customer and customer_order tables
    session = Session(engine)  # => opened WITHOUT a `with` block -- this example controls the close() moment explicitly
    ada = Customer(name="Ada", orders=[CustomerOrder(total=Decimal("19.99"))])  # => one parent, one child, seeded
    session.add(ada)  # => cascades: registers both the parent and the child as pending
    session.commit()  # => flushes both INSERTs -- ada is now PERSISTENT, still attached to `session`

    print(f"name while attached: {ada.name}")  # => Output: name while attached: Ada
    # => co-13: `.name` is safe -- it was already loaded into `ada.__dict__` by the commit's own refresh, no query needed

    session.close()  # => co-11: STAGE 4 -- CLOSE. ada is now DETACHED -- no session backs it anymore
    print(f"name after close: {ada.name}")  # => Output: name after close: Ada
    # => co-11: still safe -- `name` was ALREADY loaded, so reading it needs no round trip to Postgres at all

    try:  # => the access below NEEDS a live session, because `.orders` was never touched before close()
        _ = ada.orders  # => co-13: first access of an UNLOADED relationship on a DETACHED object -- no session to query with
        raise AssertionError("expected DetachedInstanceError")  # => co-13: fails loudly if SQLAlchemy's behavior ever changes
    except DetachedInstanceError as exc:  # => co-13 + co-11: the ORM refuses to silently return an empty/wrong list
        print(f"raised: {type(exc).__name__}")  # => Output: raised: DetachedInstanceError
        # => co-13: this is EXACTLY the failure mode eager loading (Example 37) or `AsyncAttrs` (co-16/co-24) sidesteps --
        # => a lazy attribute is a promise to query LATER, and "later" must still be inside a session that is still open
    print("ex-35 OK")  # => Output: ex-35 OK
```

**Run**: `python3 example.py`

**Output**:

```text
name while attached: Ada
name after close: Ada
raised: DetachedInstanceError
ex-35 OK
```

**Key takeaway**: An attribute that was already loaded is safe to read after detach; an attribute that
was never touched before `close()` raises `DetachedInstanceError`, because there is no live session
left to run its lazy query.

**Why it matters**: This is a common surprise in web frameworks where a session closes at the end of a
request but a template or serializer touches an unloaded relationship afterward. Understanding that
detachment is per-attribute, not per-object, clarifies why one field on a detached object works fine
while its neighbor crashes -- and points straight at the fix: eager-load what you'll need before the
session closes.

---

### Example 36: N Plus 1 Reproduce

_ex-36 &middot; exercises co-15_

Five customers, each with one order, are fetched with a single parent query -- then a loop touches
`.orders` on each one. An `event` hook counts every `SELECT`: one for the parents, plus one _more_ per
customer inside the loop, for six total. This is the N+1 problem, reproduced and measured, not just
described.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05 -- color-blind friendly, WCAG AA
flowchart TD
    accTitle: Example 36: N Plus 1 Reproduce
    accDescr: Flowchart with 5 nodes and 4 connections. Nodes: 1 parent query SELECT * FROM customer, child query 1 customer_id=1, child query 2 customer_id=2, child query 3 customer_id=3, ...N child queries total. Connections: 1 parent query SELECT * FROM customer to child query 1 customer_id=1, 1 parent query SELECT * FROM customer to child query 2 customer_id=2, 1 parent query SELECT * FROM customer to child query 3 customer_id=3, 1 parent query SELECT * FROM customer to ...N child queries total.
    A["1 parent query<br/>SELECT * FROM<br/>customer"]:::blue
    A --> B1["child query 1<br/>customer_id=1"]:::orange
    A --> B2["child query 2<br/>customer_id=2"]:::orange
    A --> B3["child query 3<br/>customer_id=3"]:::orange
    A --> B4["...N child queries<br/>total"]:::orange

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-36-n-plus-1-reproduce/example.py`**

```python
# pyright: strict
"""Example 36: The N+1 Problem -- One Parent Query Fans Out Into N Child Queries."""

from __future__ import annotations

import os  # => reads connection settings from the environment
from decimal import Decimal  # => money is Decimal, never float -- exact cents, no rounding drift
from typing import Any  # => the event hook's callback signature is untyped by SQLAlchemy's own stubs

from sqlalchemy import Engine, ForeignKey, create_engine, event, select, text  # => co-15: event captures EVERY query fired
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Customer(Base):  # => co-15: the N parents this example loops over
    __tablename__ = "customer"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column
    orders: Mapped[list["CustomerOrder"]] = relationship(back_populates="customer")  # => co-13: default lazy="select"


class CustomerOrder(Base):  # => co-15: one child fetched PER PARENT the loop below touches
    __tablename__ = "customer_order"  # => named to avoid the reserved SQL word "order"
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    customer_id: Mapped[int] = mapped_column(ForeignKey("customer.id"))  # => the FK each lazy query filters by
    total: Mapped[Decimal]  # => the order's total, as an exact Decimal
    customer: Mapped[Customer] = relationship(back_populates="orders")  # => the reverse, many-to-one navigation


def reset_schema(engine: Engine) -> None:  # => shared reset helper -- wipes the whole schema, self-contained
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build both tables into
    Base.metadata.create_all(engine)  # => issues CREATE TABLE for both customer and customer_order


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine
    reset_schema(engine)  # => fresh, empty customer and customer_order tables
    n_customers = 5  # => co-15: the "N" in "N+1" -- five parents, each with exactly one child order
    # => small ON PURPOSE: even N=5 is enough to show the pattern, and it scales linearly to real production sizes
    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        for i in range(n_customers):  # => seeds five customers, one order each
            session.add(Customer(name=f"Customer{i}", orders=[CustomerOrder(total=Decimal("9.99"))]))
            # => cascades: adding the parent also registers its one child, same as Examples 22 and 34
        session.commit()  # => flushes all ten rows (5 customer + 5 customer_order) in one batched transaction

    select_statements: list[str] = []  # => every SELECT the ORM emits during the loop below, captured for verification

    def on_execute(conn: Any, cursor: Any, statement: str, *rest: Any) -> None:  # => untyped hook params (SQLAlchemy's own)
        if statement.strip().upper().startswith("SELECT"):  # => this example only cares about read traffic
            select_statements.append(statement)  # => keeps the FULL text -- needed to tell parent SELECTs from child ones

    event.listens_for(engine, "before_cursor_execute")(on_execute)  # => attaches the hook to every statement on `engine`

    with Session(engine) as session:  # => a FRESH session -- nothing cached, so the count below reflects THIS loop only
        customers = session.execute(select(Customer)).scalars().all()  # => query #1: the ONE parent query
        for customer in customers:  # => co-15: THIS loop is where the N+1 actually happens
            _ = [order.total for order in customer.orders]  # => co-13 + co-15: EACH iteration fires its OWN lazy SELECT

    print(f"customers fetched: {len(customers)}")  # => Output: customers fetched: 5
    print(f"total SELECTs: {len(select_statements)}")  # => Output: total SELECTs: 6
    assert len(customers) == n_customers  # => confirms the parent query itself returned all 5 rows correctly
    assert len(select_statements) == n_customers + 1  # => co-15: 1 parent query + 5 child queries = the "N+1" pattern
    # => co-15: the loop LOOKS innocent -- `customer.orders` reads like plain attribute access, not a database call --
    # => but each access is a full round trip to Postgres, and this scales LINEARLY with the number of parents fetched
    # => Example 37 fixes this exact loop with `selectinload()`, dropping the query count from N+1 down to a constant 2
    print("ex-36 OK")  # => Output: ex-36 OK
```

**Run**: `python3 example.py`

**Output**:

```text
customers fetched: 5
total SELECTs: 6
ex-36 OK
```

**Key takeaway**: A loop that reads like plain attribute access (`customer.orders`) can hide N extra
round trips to the database -- one per parent -- scaling linearly with however many rows the parent
query returned.

**Why it matters**: N+1 is one of the most common ORM performance bugs precisely because it is invisible
in the code itself -- nothing about `for c in customers: c.orders` signals "this fires 5 more queries."
Measuring the query count directly, as this example does, turns a vague "the ORM feels slow" complaint
into a concrete, fixable number. Example 37 fixes this exact loop.

---

### Example 37: Eager Selectinload

_ex-37 &middot; exercises co-14_

The identical N-customers, one-order-each workload from Example 36, now loaded with
`.options(selectinload(Customer.orders))`. The query count drops from N+1 to a constant 2: one for the
parents, one batched `SELECT ... WHERE customer_id IN (...)` that fetches every parent's children in a
single round trip.

**`learning/code/ex-37-eager-selectinload/example.py`**

```python
# pyright: strict
"""Example 37: selectinload() -- Fixing N+1 With a SECOND, BATCHED Query."""

from __future__ import annotations

import os  # => reads connection settings from the environment
from decimal import Decimal  # => money is Decimal, never float -- exact cents, no rounding drift
from typing import Any  # => the event hook's callback signature is untyped by SQLAlchemy's own stubs

from sqlalchemy import Engine, ForeignKey, create_engine, event, select, text  # => co-14: event captures the query COUNT
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship, selectinload  # => co-14's strategy

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Customer(Base):  # => co-14: the SAME N parents Example 36 fetched, now loaded eagerly instead
    __tablename__ = "customer"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column
    orders: Mapped[list["CustomerOrder"]] = relationship(back_populates="customer")  # => co-13: default lazy, OVERRIDDEN below


class CustomerOrder(Base):  # => co-14: fetched in ONE batched query for ALL parents, not one query PER parent
    __tablename__ = "customer_order"  # => named to avoid the reserved SQL word "order"
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    customer_id: Mapped[int] = mapped_column(ForeignKey("customer.id"))  # => the FK the batched IN-query filters by
    total: Mapped[Decimal]  # => the order's total, as an exact Decimal
    customer: Mapped[Customer] = relationship(back_populates="orders")  # => the reverse, many-to-one navigation


def reset_schema(engine: Engine) -> None:  # => shared reset helper -- wipes the whole schema, self-contained
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build both tables into
    Base.metadata.create_all(engine)  # => issues CREATE TABLE for both customer and customer_order


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine
    reset_schema(engine)  # => fresh, empty customer and customer_order tables
    n_customers = 5  # => the same N as Example 36 -- the fix, not the workload, is what changes here
    # => watch the query COUNT below stay flat at 2 no matter how large n_customers grows -- that constancy is the fix
    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        for i in range(n_customers):  # => seeds five customers, one order each -- identical setup to Example 36
            session.add(Customer(name=f"Customer{i}", orders=[CustomerOrder(total=Decimal("9.99"))]))
        session.commit()  # => flushes all ten rows in one batched transaction

    select_statements: list[str] = []  # => every SELECT the ORM emits during the loop below, captured for verification

    def on_execute(conn: Any, cursor: Any, statement: str, *rest: Any) -> None:  # => untyped hook params (SQLAlchemy's own)
        if statement.strip().upper().startswith("SELECT"):  # => this example only cares about read traffic
            select_statements.append(statement)  # => keeps the FULL text for the IN-clause check below

    event.listens_for(engine, "before_cursor_execute")(on_execute)  # => attaches the hook to every statement on `engine`

    with Session(engine) as session:  # => a FRESH session -- nothing cached, so the count reflects THIS query alone
        stmt = select(Customer).options(selectinload(Customer.orders))  # => co-14: ONE extra, TARGETED batch-load query
        customers = session.execute(stmt).scalars().all()  # => query #1 (parents) -- selectinload fires query #2 RIGHT HERE
        for customer in customers:  # => co-14: `.orders` is ALREADY loaded -- this loop touches NO new database traffic
            _ = [order.total for order in customer.orders]  # => reads from memory, not a lazy SELECT (contrast Example 36)

    print(f"customers fetched: {len(customers)}")  # => Output: customers fetched: 5
    print(f"total SELECTs: {len(select_statements)}")  # => Output: total SELECTs: 2
    assert len(select_statements) == 2  # => co-14 + co-15: ONE query for parents, ONE batched query for ALL children
    assert "customer_order.customer_id IN" in select_statements[1]  # => co-14: the SECOND query uses a single IN (...) list
    # => this IN-clause is the batching mechanism itself -- it names every parent PK collected from query #1, at once
    # => co-14: selectinload() issues `SELECT ... FROM customer_order WHERE customer_id IN (1, 2, 3, 4, 5)` -- ONE round
    # => trip covers every parent's children at once, instead of Example 36's five separate per-parent SELECTs
    print("ex-37 OK")  # => Output: ex-37 OK
```

**Run**: `python3 example.py`

**Output**:

```text
customers fetched: 5
total SELECTs: 2
ex-37 OK
```

**Key takeaway**: `selectinload()` fixes N+1 with exactly one extra query -- a single `IN (...)` batch
load that fetches every parent's children at once, regardless of how many parents there are.

**Why it matters**: A query count that stays constant at 2 no matter how large N grows is the whole
point: `selectinload()` scales the same way at 5 rows and at 5,000. It is SQLAlchemy's recommended
default eager-loading strategy for exactly this reason -- predictable, narrow result sets and a query
count that does not grow with the workload.

---

### Example 38: Eager Joinedload

_ex-38 &middot; exercises co-14_

The same workload again, this time with `.options(joinedload(Customer.orders))`: one `LEFT OUTER JOIN`
query does the whole job, dropping the count to 1. The trade-off is `.unique()` becomes mandatory --
a customer with multiple orders would otherwise appear once per matching row.

**`learning/code/ex-38-eager-joinedload/example.py`**

```python
# pyright: strict
"""Example 38: joinedload() -- Fixing N+1 With ONE Single JOIN Query."""

from __future__ import annotations

import os  # => reads connection settings from the environment
from decimal import Decimal  # => money is Decimal, never float -- exact cents, no rounding drift
from typing import Any  # => the event hook's callback signature is untyped by SQLAlchemy's own stubs

from sqlalchemy import Engine, ForeignKey, create_engine, event, select, text  # => co-14: event captures the query COUNT
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, joinedload, mapped_column, relationship  # => co-14's strategy

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Customer(Base):  # => co-14: the SAME N parents Examples 36-37 fetched, now via a single JOIN
    __tablename__ = "customer"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column
    orders: Mapped[list["CustomerOrder"]] = relationship(back_populates="customer")  # => co-13: default lazy, OVERRIDDEN below


class CustomerOrder(Base):  # => co-14: fetched IN THE SAME ROW SET as its parent -- no second query at all
    __tablename__ = "customer_order"  # => named to avoid the reserved SQL word "order"
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    customer_id: Mapped[int] = mapped_column(ForeignKey("customer.id"))  # => the FK the JOIN's ON clause matches on
    total: Mapped[Decimal]  # => the order's total, as an exact Decimal
    customer: Mapped[Customer] = relationship(back_populates="orders")  # => the reverse, many-to-one navigation


def reset_schema(engine: Engine) -> None:  # => shared reset helper -- wipes the whole schema, self-contained
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build both tables into
    Base.metadata.create_all(engine)  # => issues CREATE TABLE for both customer and customer_order


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine
    reset_schema(engine)  # => fresh, empty customer and customer_order tables
    n_customers = 5  # => the same N as Examples 36-37 -- only the loading STRATEGY changes here
    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        for i in range(n_customers):  # => seeds five customers, one order each -- identical setup to Examples 36-37
            session.add(Customer(name=f"Customer{i}", orders=[CustomerOrder(total=Decimal("9.99"))]))
        session.commit()  # => flushes all ten rows in one batched transaction

    select_statements: list[str] = []  # => every SELECT the ORM emits during the query below, captured for verification

    def on_execute(conn: Any, cursor: Any, statement: str, *rest: Any) -> None:  # => untyped hook params (SQLAlchemy's own)
        if statement.strip().upper().startswith("SELECT"):  # => this example only cares about read traffic
            select_statements.append(statement)  # => keeps the FULL text for the JOIN check below

    event.listens_for(engine, "before_cursor_execute")(on_execute)  # => attaches the hook to every statement on `engine`

    with Session(engine) as session:  # => a FRESH session -- nothing cached, so the count reflects THIS query alone
        stmt = select(Customer).options(joinedload(Customer.orders))  # => co-14: an OUTER JOIN pulls both tables at once
        customers = session.execute(stmt).unique().scalars().all()  # => .unique() dedupes parents repeated by the JOIN
        # => co-14: without .unique(), a customer with 2+ orders would appear TWICE -- one row per JOINed match
        for customer in customers:  # => co-14: `.orders` is ALREADY loaded -- this loop touches NO new database traffic
            _ = [order.total for order in customer.orders]  # => reads from memory, populated by the single JOIN above

    print(f"customers fetched: {len(customers)}")  # => Output: customers fetched: 5
    print(f"total SELECTs: {len(select_statements)}")  # => Output: total SELECTs: 1
    assert len(select_statements) == 1  # => co-14 + co-15: ONE query total -- parents AND children in the SAME result set
    assert "LEFT OUTER JOIN customer_order" in select_statements[0]  # => co-14: the ONE query IS a JOIN, not two SELECTs
    # => co-14: joinedload() trades query COUNT for row-set SIZE -- one round trip, but a wider, sometimes-duplicated
    # => result set that needs .unique() to dedupe; selectinload() (Example 37) trades the other way: two queries, but
    # => each one stays narrow -- which strategy wins depends on how many children each parent typically has (co-14)
    print("ex-38 OK")  # => Output: ex-38 OK
```

**Run**: `python3 example.py`

**Output**:

```text
customers fetched: 5
total SELECTs: 1
ex-38 OK
```

**Key takeaway**: `joinedload()` trades query count for row-set size -- one `LEFT OUTER JOIN` round trip
instead of two, but a wider, potentially duplicated result set that requires `.unique()` to dedupe
parents correctly.

**Why it matters**: One query is not automatically better than two -- a JOIN that duplicates every parent
column once per child row can transfer far more data over the wire than two narrow queries would, once a
parent has many children. `joinedload()` genuinely shines for true 1:1 relationships, where the
duplication concern disappears. Example 40 measures all three strategies side by side on the same
workload.

---

### Example 39: Eager Subqueryload

_ex-39 &middot; exercises co-14_

The same workload a third time, with `.options(subqueryload(Customer.orders))`: also 2 queries, like
`selectinload()`, but the second one re-embeds the _entire original query_ as a correlated subquery
instead of a simple `IN (...)` list. SQLAlchemy's own docs now call this strategy "mostly legacy."

**`learning/code/ex-39-eager-subqueryload/example.py`**

```python
# pyright: strict
"""Example 39: subqueryload() -- a LEGACY Batched Strategy, Superseded by selectinload()."""

from __future__ import annotations

import os  # => reads connection settings from the environment
from decimal import Decimal  # => money is Decimal, never float -- exact cents, no rounding drift
from typing import Any  # => the event hook's callback signature is untyped by SQLAlchemy's own stubs

from sqlalchemy import Engine, ForeignKey, create_engine, event, select, text  # => co-14: event captures the query COUNT
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship, subqueryload  # => co-14's LEGACY strategy

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Customer(Base):  # => co-14: the SAME N parents Examples 36-38 fetched, now via subqueryload
    __tablename__ = "customer"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column
    orders: Mapped[list["CustomerOrder"]] = relationship(back_populates="customer")  # => co-13: default lazy, OVERRIDDEN below


class CustomerOrder(Base):  # => co-14: fetched via a SEPARATE query that RE-RUNS the original SELECT as a subquery
    __tablename__ = "customer_order"  # => named to avoid the reserved SQL word "order"
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    customer_id: Mapped[int] = mapped_column(ForeignKey("customer.id"))  # => the FK the batched subquery filters by
    total: Mapped[Decimal]  # => the order's total, as an exact Decimal
    customer: Mapped[Customer] = relationship(back_populates="orders")  # => the reverse, many-to-one navigation


def reset_schema(engine: Engine) -> None:  # => shared reset helper -- wipes the whole schema, self-contained
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build both tables into
    Base.metadata.create_all(engine)  # => issues CREATE TABLE for both customer and customer_order


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine
    reset_schema(engine)  # => fresh, empty customer and customer_order tables
    n_customers = 5  # => the same N as Examples 36-38 -- only the loading STRATEGY changes here
    # => keeping the workload identical across Examples 36-39 is what makes the query-count contrast in Example 40 fair
    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        for i in range(n_customers):  # => seeds five customers, one order each -- identical setup to Examples 36-38
            session.add(Customer(name=f"Customer{i}", orders=[CustomerOrder(total=Decimal("9.99"))]))
        session.commit()  # => flushes all ten rows in one batched transaction

    select_statements: list[str] = []  # => every SELECT the ORM emits during the query below, captured for verification

    def on_execute(conn: Any, cursor: Any, statement: str, *rest: Any) -> None:  # => untyped hook params (SQLAlchemy's own)
        if statement.strip().upper().startswith("SELECT"):  # => this example only cares about read traffic
            select_statements.append(statement)  # => keeps the FULL text for the subquery check below

    event.listens_for(engine, "before_cursor_execute")(on_execute)  # => attaches the hook to every statement on `engine`

    with Session(engine) as session:  # => a FRESH session -- nothing cached, so the count reflects THIS query alone
        stmt = select(Customer).options(subqueryload(Customer.orders))  # => co-14: LEGACY -- re-embeds the ORIGINAL query
        customers = session.execute(stmt).scalars().all()  # => query #1 (parents); subqueryload fires query #2 RIGHT HERE
        for customer in customers:  # => co-14: `.orders` is ALREADY loaded -- this loop touches NO new database traffic
            _ = [order.total for order in customer.orders]  # => reads from memory, populated by the second query above

    print(f"customers fetched: {len(customers)}")  # => Output: customers fetched: 5
    print(f"total SELECTs: {len(select_statements)}")  # => Output: total SELECTs: 2
    assert len(select_statements) == 2  # => co-14: also 2 queries, like selectinload -- the difference is HOW #2 filters
    assert "FROM (SELECT customer.id AS customer_id" in select_statements[1]  # => co-14: an embedded subquery re-derives the parents
    # => co-14: SQLAlchemy's own docs now call subqueryload() "mostly legacy" -- selectinload() (Example 37) does the
    # => SAME job with a simpler, more predictable IN (...) list instead of re-running the parent query as a correlated
    # => subquery; prefer selectinload() in new code -- subqueryload() mainly still matters for reading OLDER codebases
    print("ex-39 OK")  # => Output: ex-39 OK
```

**Run**: `python3 example.py`

**Output**:

```text
customers fetched: 5
total SELECTs: 2
ex-39 OK
```

**Key takeaway**: `subqueryload()` reaches the same 2-query count as `selectinload()`, but by re-embedding
the original parent query as a correlated subquery instead of a simple `IN (...)` list -- SQLAlchemy's
own docs now call it mostly legacy.

**Why it matters**: You will not choose `subqueryload()` for new code, but recognizing it matters when
reading an older SQLAlchemy codebase written before `selectinload()` existed. Knowing the two strategies
produce the same query count through different SQL shapes prevents mistaking a legacy pattern for a bug,
and clarifies why a migration to `selectinload()` is usually a safe, behavior-preserving cleanup.

---

### Example 40: Eager Strategy Contrast

_ex-40 &middot; exercises co-14_

The identical fixture is reset and re-queried three times, once per strategy, with a shared
`count_selects()` helper measuring each run in isolation. The result: `selectinload` and `subqueryload`
both cost 2 queries, `joinedload` costs 1 -- confirming the trade-offs Examples 37-39 described, side by
side on one page.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73 -- color-blind friendly, WCAG AA
flowchart LR
    accTitle: Example 40: Eager Strategy Contrast
    accDescr: Flowchart with 3 nodes and 0 connections. Nodes: selectinload() 2 queries, narrow IN list, joinedload() 1 query, wider JOIN, subqueryload() 2 queries, legacy subquery.
    A["selectinload()<br/>2 queries, narrow IN<br/>list"]:::blue
    B["joinedload()<br/>1 query, wider JOIN"]:::orange
    C["subqueryload()<br/>2 queries, legacy<br/>subquery"]:::teal

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-40-eager-strategy-contrast/example.py`**

```python
# pyright: strict
"""Example 40: Eager-Loading Strategy Contrast -- selectinload vs joinedload vs subqueryload."""

from __future__ import annotations

import os  # => reads connection settings from the environment
from decimal import Decimal  # => money is Decimal, never float -- exact cents, no rounding drift
from typing import Any  # => the event hook's callback signature is untyped by SQLAlchemy's own stubs

from sqlalchemy import Engine, ForeignKey, create_engine, event, select, text  # => co-14: event captures each STRATEGY's shape
from sqlalchemy.orm import (  # => co-14: all three loading strategies compared side by side
    DeclarativeBase,  # => the shared mapper registry base for Customer/CustomerOrder below
    Mapped,  # => typed column annotation (DD-39) -- pyright --strict enforces every field
    Session,  # => the unit-of-work handle each strategy's query runs through (co-12)
    joinedload,  # => strategy #2: a single-query LEFT OUTER JOIN
    mapped_column,  # => the runtime column constructor Mapped[] pairs with
    relationship,  # => declares the one-to-many Customer.orders collection
    selectinload,  # => strategy #1: a batched, second IN-clause query
    subqueryload,  # => strategy #3: a legacy, embedded-subquery second query
)

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Customer(Base):  # => co-14: the SAME schema Examples 36-39 used -- only the OPTIONS below change per run
    __tablename__ = "customer"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column
    orders: Mapped[list["CustomerOrder"]] = relationship(back_populates="customer")  # => co-13: default lazy, OVERRIDDEN per run


class CustomerOrder(Base):  # => the child whose loading strategy this example varies across three runs
    __tablename__ = "customer_order"  # => named to avoid the reserved SQL word "order"
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    customer_id: Mapped[int] = mapped_column(ForeignKey("customer.id"))  # => the FK every strategy below joins/filters on
    total: Mapped[Decimal]  # => the order's total, as an exact Decimal
    customer: Mapped[Customer] = relationship(back_populates="orders")  # => the reverse, many-to-one navigation


def reset_and_seed(engine: Engine, n_customers: int) -> None:  # => shared setup -- fresh schema, N customers, one order each
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fresh state for each strategy's run
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build both tables into
    Base.metadata.create_all(engine)  # => issues CREATE TABLE for both customer and customer_order
    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        for i in range(n_customers):  # => seeds N customers, one order each -- IDENTICAL workload for every strategy
            session.add(Customer(name=f"Customer{i}", orders=[CustomerOrder(total=Decimal("9.99"))]))
        session.commit()  # => flushes all rows before this strategy's own query count starts being measured


def count_selects(engine: Engine, option: Any) -> int:  # => co-14: `option` is a loader-option object -- SQLAlchemy's stubs
    # => leave its precise type broad, so this ONE helper works for selectinload/joinedload/subqueryload interchangeably
    statements: list[str] = []  # => every SELECT this ONE strategy's query fires, reset per call

    def on_execute(conn: Any, cursor: Any, statement: str, *rest: Any) -> None:  # => untyped hook params (SQLAlchemy's own)
        if statement.strip().upper().startswith("SELECT"):  # => this helper only cares about read traffic
            statements.append(statement)  # => records every SELECT text for this strategy's single query round

    listener = event.listens_for(engine, "before_cursor_execute")(on_execute)  # => attaches for the duration of this call
    with Session(engine) as session:  # => a FRESH session -- nothing cached, so the count reflects THIS strategy alone
        stmt = select(Customer).options(option)  # => co-14: the ONLY thing that differs between the three calls below
        customers = session.execute(stmt).unique().scalars().all()  # => .unique() is a harmless no-op for the non-JOIN strategies
        for customer in customers:  # => touches every child so a LAZY fallback would also show up in the count
            _ = [order.total for order in customer.orders]  # => reads from memory if eager-loaded, or fires a lazy SELECT if not
    event.remove(engine, "before_cursor_execute", listener)  # => detaches so the NEXT strategy's call starts from zero
    return len(statements)  # => the total SELECT count this ONE strategy needed for the whole workload


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine, reused across all three strategy runs
    n_customers = 5  # => the same N used in Examples 36-39, so the counts below are directly comparable
    reset_and_seed(engine, n_customers)  # => fresh, identical workload before the FIRST strategy's measurement
    selectin_count = count_selects(engine, selectinload(Customer.orders))  # => co-14: batched IN-clause strategy

    reset_and_seed(engine, n_customers)  # => re-seed -- each strategy measures against its OWN clean baseline
    joined_count = count_selects(engine, joinedload(Customer.orders))  # => co-14: single-query JOIN strategy

    reset_and_seed(engine, n_customers)  # => re-seed once more for the third and final strategy
    subquery_count = count_selects(engine, subqueryload(Customer.orders))  # => co-14: legacy embedded-subquery strategy

    print(f"selectinload: {selectin_count} queries")  # => Output: selectinload: 2 queries
    print(f"joinedload: {joined_count} queries")  # => Output: joinedload: 1 queries
    print(f"subqueryload: {subquery_count} queries")  # => Output: subqueryload: 2 queries
    assert (selectin_count, joined_count, subquery_count) == (2, 1, 2)  # => co-14: joinedload wins on COUNT, always 1
    # => co-14: joinedload's single query can still be the SLOWER choice once a parent has many children -- the JOIN's
    # => row set repeats every parent column once per child row, while selectinload/subqueryload keep two narrow,
    # => non-duplicated result sets; prefer selectinload() as the default modern choice, joinedload() for TRUE 1:1s,
    # => and treat subqueryload() as legacy -- present here only to recognize it when reading an older codebase
    print("ex-40 OK")  # => Output: ex-40 OK
```

**Run**: `python3 example.py`

**Output**:

```text
selectinload: 2 queries
joinedload: 1 queries
subqueryload: 2 queries
ex-40 OK
```

**Key takeaway**: Measured side by side on the identical workload, `joinedload` always wins on raw query
count (1), while `selectinload` and `subqueryload` both cost 2 -- but query count alone does not decide
the winner, row-set size does.

**Why it matters**: Query count is easy to measure and easy to over-optimize for. A single `joinedload()`
query that repeats every parent column once per child row can transfer more total data, and run slower
end to end, than two narrow `selectinload()` queries would. Choosing a strategy means asking how many
children a typical parent has, not just counting round trips.

---

### Example 41: Raiseload Guard

_ex-41 &middot; exercises co-16_

`.options(raiseload(Customer.orders))` turns an accidental lazy load into an immediate
`InvalidRequestError` instead of a silent extra query. Fields the `SELECT` already covers (`id`, `name`)
remain perfectly readable -- only the guarded relationship refuses to load implicitly.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73 -- color-blind friendly, WCAG AA
flowchart LR
    accTitle: Example 41: Raiseload Guard
    accDescr: Flowchart with 5 nodes and 4 connections. Nodes: select(Customer) .options(raiseload(Customer. orders)), read ada.name covered by SELECT, read ada.orders guarded relationship, OK, InvalidRequestError loud, immediate, catchable by tests. Connections: select(Customer) .options(raiseload(Customer. orders)) to read ada.name covered by SELECT, select(Customer) .options(raiseload(Customer. orders)) to read ada.orders guarded relationship, read ada.name covered by SELECT to OK, read ada.orders guarded relationship to InvalidRequestError loud, immediate, catchable by tests.
    A["select(Customer)<br/>.options(<br/>raiseload(Customer.<br/>orders))"]:::blue
    A --> B["read ada.name<br/>covered by SELECT"]:::teal
    A --> C["read ada.orders<br/>guarded relationship"]:::orange
    B --> D["OK"]:::teal
    C --> E["InvalidRequestError<br/>loud, immediate,<br/>catchable by tests"]:::orange

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-41-raiseload-guard/example.py`**

```python
# pyright: strict
"""Example 41: raiseload() -- Turning an Accidental Lazy Load Into a Loud Error."""

from __future__ import annotations

import os  # => reads connection settings from the environment
from decimal import Decimal  # => money is Decimal, never float -- exact cents, no rounding drift

from sqlalchemy import Engine, ForeignKey, create_engine, select, text  # => co-16: select() is the query raiseload guards
from sqlalchemy.exc import InvalidRequestError  # => co-16: the exact exception a guarded lazy access raises
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, raiseload, relationship  # => co-16's guard

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Customer(Base):  # => co-16: the parent this example queries WITH the raiseload guard applied
    __tablename__ = "customer"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column
    orders: Mapped[list["CustomerOrder"]] = relationship(back_populates="customer")  # => co-13: default lazy, GUARDED below


class CustomerOrder(Base):  # => co-16: the relationship this example forbids touching by accident
    __tablename__ = "customer_order"  # => named to avoid the reserved SQL word "order"
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    customer_id: Mapped[int] = mapped_column(ForeignKey("customer.id"))  # => the FK a lazy query would have filtered by
    total: Mapped[Decimal]  # => the order's total, as an exact Decimal
    customer: Mapped[Customer] = relationship(back_populates="orders")  # => the reverse, many-to-one navigation


def reset_schema(engine: Engine) -> None:  # => shared reset helper -- wipes the whole schema, self-contained
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build both tables into
    Base.metadata.create_all(engine)  # => issues CREATE TABLE for both customer and customer_order


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine
    reset_schema(engine)  # => fresh, empty customer and customer_order tables
    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        ada = Customer(name="Ada", orders=[CustomerOrder(total=Decimal("19.99"))])  # => one parent, one child, seeded
        session.add(ada)  # => cascades: registers both the parent and the child as pending
        session.commit()  # => flushes both INSERTs
        ada_id = ada.id  # => reads `id` INSIDE the still-open session -- avoids a DetachedInstanceError below

    with Session(engine) as session:  # => a FRESH session -- the guard below applies to THIS query only
        stmt = select(Customer).options(raiseload(Customer.orders))  # => co-16: forbids `.orders` from ever lazy-loading
        fetched = session.execute(stmt).scalar_one()  # => fetches ONLY the customer row -- exactly like the default
        print(f"name: {fetched.name}")  # => Output: name: Ada
        # => co-16: fields already covered by the SELECT (id, name) are still perfectly readable -- only the RELATIONSHIP is guarded

        try:  # => the access below is EXACTLY what Example 36's N+1 loop did by accident, forbidden here on purpose
            _ = fetched.orders  # => co-16: touching a raiseload()-guarded relationship never silently queries
            raise AssertionError("expected InvalidRequestError")  # => fails loudly if SQLAlchemy's behavior ever changes
        except InvalidRequestError as exc:  # => co-16: a LOUD, immediate error instead of a silent extra round trip
            print(f"raised: {type(exc).__name__}")  # => Output: raised: InvalidRequestError
            # => co-16: raiseload() converts "forgot to eager-load" from a silent performance bug into a crash you catch
            # => in code review or a test run -- the SAME safety idea AsyncAttrs (co-24) applies for async sessions, where
            # => an accidental lazy load is not just slow but structurally FORBIDDEN by the driver itself (see Example 62)
    print("ex-41 OK")  # => Output: ex-41 OK
```

**Run**: `python3 example.py`

**Output**:

```text
name: Ada
raised: InvalidRequestError
ex-41 OK
```

**Key takeaway**: `raiseload()` converts an accidental lazy load from a silent, slow extra query into a
loud, immediate `InvalidRequestError` -- while leaving every column already covered by the `SELECT`
perfectly readable.

**Why it matters**: N+1 (Example 36) is dangerous precisely because it fails silently -- code that
touches an unloaded relationship "just works," only slower. `raiseload()` turns that same mistake into
something a test suite or code review catches immediately, before it ships. Reaching for it on
performance-sensitive relationships converts a class of production incident into a local, fixable test
failure.

---

### Example 42: N Plus 1 Count Assert

_ex-42 &middot; exercises co-15, co-14_

A reusable `query_counter()` context manager measures the exact same N+1 pattern before and after the
`selectinload()` fix, in one script: 6 queries unfixed, 2 queries fixed. This is the shape a real CI
regression test would take -- a hard-coded query-count ceiling that catches a reintroduced N+1 the
moment someone removes an eager-load option.

**`learning/code/ex-42-n-plus-1-count-assert/example.py`**

```python
# pyright: strict
"""Example 42: Asserting the Query Count -- Before and After an N+1 Fix, in One Script."""

from __future__ import annotations

import os  # => reads connection settings from the environment
from collections.abc import Generator  # => the modern return-type annotation @contextmanager expects, not Iterator
from contextlib import contextmanager  # => co-15: a reusable "count queries in this block" helper
from decimal import Decimal  # => money is Decimal, never float -- exact cents, no rounding drift
from typing import Any  # => types SQLAlchemy's own untyped event-hook callback arguments

from sqlalchemy import Engine, ForeignKey, create_engine, event, select, text  # => co-15: event is the counting mechanism itself
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship, selectinload  # => co-14's fix

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Customer(Base):  # => co-15: the parents this example's assertion counts queries against
    __tablename__ = "customer"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column
    orders: Mapped[list["CustomerOrder"]] = relationship(back_populates="customer")  # => co-13: default lazy, OVERRIDDEN below


class CustomerOrder(Base):  # => the child whose access pattern this example counts, before and after the fix
    __tablename__ = "customer_order"  # => named to avoid the reserved SQL word "order"
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    customer_id: Mapped[int] = mapped_column(ForeignKey("customer.id"))  # => the FK every counted query touches
    total: Mapped[Decimal]  # => the order's total, as an exact Decimal
    customer: Mapped[Customer] = relationship(back_populates="orders")  # => the reverse, many-to-one navigation


def reset_and_seed(engine: Engine, n: int) -> None:  # => shared setup -- fresh schema, N customers, one order each
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fresh state for each measurement
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build both tables into
    Base.metadata.create_all(engine)  # => issues CREATE TABLE for both customer and customer_order
    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        for i in range(n):  # => seeds N customers, one order each
            session.add(Customer(name=f"Customer{i}", orders=[CustomerOrder(total=Decimal("9.99"))]))
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
        event.remove(engine, "before_cursor_execute", listener)  # => co-15: cleanup -- the NEXT measurement starts at zero


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine, reused across BEFORE and AFTER measurements
    n_customers = 5  # => the same N as Examples 36-40, so this assertion is directly comparable to those results
    # => a REAL regression test would parameterize this and assert `after_count == 2` regardless of N, catching drift

    reset_and_seed(engine, n_customers)  # => fresh workload for the BEFORE measurement
    with query_counter(engine) as before_count:  # => co-15: measures the UNFIXED, lazy-default access pattern
        with Session(engine) as session:  # => a FRESH session -- nothing cached
            customers = session.execute(select(Customer)).scalars().all()  # => query #1, the one parent query
            for customer in customers:  # => this loop is the N+1 itself -- ONE lazy SELECT per parent
                _ = [order.total for order in customer.orders]  # => co-13: each access fires its own round trip
    print(f"before fix: {before_count[0]} queries")  # => Output: before fix: 6 queries
    assert before_count[0] == n_customers + 1  # => co-15: asserts the UNFIXED count is exactly N+1, not an estimate

    reset_and_seed(engine, n_customers)  # => fresh workload for the AFTER measurement -- same shape, same size
    with query_counter(engine) as after_count:  # => co-15: measures the SAME access pattern, now eager-loaded
        with Session(engine) as session:  # => a FRESH session -- nothing cached
            stmt = select(Customer).options(selectinload(Customer.orders))  # => co-14: the fix from Example 37
            customers = session.execute(stmt).scalars().all()  # => query #1 (parents) + query #2 (batched children)
            for customer in customers:  # => identical loop, but `.orders` is now already loaded -- no new traffic
                _ = [order.total for order in customer.orders]  # => reads from memory, contributes zero new SELECTs
    print(f"after fix: {after_count[0]} queries")  # => Output: after fix: 2 queries
    assert after_count[0] == 2  # => co-15: the fix collapses N+1 down to a CONSTANT 2, regardless of how large N grows
    # => try raising n_customers to 50 or 500 and re-running -- before_count grows linearly, after_count stays at 2
    # => co-15: this is the pattern a CI regression test should assert directly -- a hard-coded query-count ceiling
    # => catches a reintroduced N+1 the moment someone accidentally removes an eager-load option, before it ships
    print("ex-42 OK")  # => Output: ex-42 OK
```

**Run**: `python3 example.py`

**Output**:

```text
before fix: 6 queries
after fix: 2 queries
ex-42 OK
```

**Key takeaway**: A reusable query-counting context manager turns "the fix worked" from an eyeballed
impression into a hard-coded number an assertion can enforce -- 6 queries unfixed, 2 fixed, on the
identical workload.

**Why it matters**: N+1 fixes regress silently -- a later refactor can drop an eager-load option and
nothing visibly breaks, it just gets slower under load. A CI test that asserts a query-count ceiling
turns that class of regression into an immediate, loud test failure at the moment it is introduced,
instead of a production incident discovered under real traffic weeks later.

---

### Example 43: ORM Transaction Commit Rollback

_ex-43 &middot; exercises co-17_

`with session.begin():` commits automatically when its block exits cleanly and rolls back automatically
on any exception. A `UNIQUE` constraint violation on the second write proves the rollback is real: only
the first, successful `Ada` survives.

**`learning/code/ex-43-orm-transaction-commit-rollback/example.py`**

```python
# pyright: strict
"""Example 43: session.begin() -- Commit on Success, Rollback on Error."""

from __future__ import annotations

import os  # => reads connection settings from the environment

from sqlalchemy import Engine, create_engine, select, text  # => co-17: select() confirms what actually survived
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Customer(Base):  # => co-17: the table this example writes to, once successfully and once NOT
    __tablename__ = "customer"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column, UNIQUE below to force the second attempt to fail


def reset_schema(engine: Engine) -> None:  # => shared reset helper -- wipes the whole schema, self-contained
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build Customer's table into
        conn.execute(text("CREATE TABLE customer (id SERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL)"))  # => raw DDL, adds UNIQUE
    # => Base.metadata.create_all() is skipped here on purpose -- the UNIQUE constraint above needs raw DDL, since
    # => Customer's own Mapped[str] doesn't declare uniqueness, and this example wants a REAL constraint violation


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine
    reset_schema(engine)  # => fresh, empty customer table with a UNIQUE name constraint

    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        with session.begin():  # => co-17: an EXPLICIT transaction scope -- commits automatically on a clean exit
            session.add(Customer(name="Ada"))  # => the FIRST, successful write
        # => co-17: `session.begin()`'s own `with` block already committed here -- no separate session.commit() needed

        try:  # => the block below deliberately violates the UNIQUE constraint on `name`
            with session.begin():  # => co-17: a SECOND transaction scope -- rolls back automatically on any exception
                session.add(Customer(name="Ada"))  # => the SAME name -- Postgres will reject this at flush/commit time
        except Exception as exc:  # => co-17: the UNIQUE violation propagates as a real exception, not a silent no-op
            print(f"raised: {type(exc).__name__}")  # => Output: raised: IntegrityError
            # => co-17: `session.begin()`'s `with` block caught the exception, rolled back, and RE-RAISED it here --
            # => the failed second Ada was never durably written, even though `session.add()` itself never complained

    with Session(engine) as session:  # => a FRESH session, just to read back the final state
        names = session.execute(select(Customer.name)).scalars().all()  # => co-17: confirms what actually persisted
        print(f"names={names}")  # => Output: names=['Ada']
        assert names == ["Ada"]  # => co-17: exactly ONE Ada survived -- the committed write, not the rolled-back one
    # => co-17: `with session.begin():` is the idiomatic pattern -- commit on success, rollback on ANY exception,
    # => with no manual try/except/commit/rollback bookkeeping required at the call site itself
    print("ex-43 OK")  # => Output: ex-43 OK
```

**Run**: `python3 example.py`

**Output**:

```text
raised: IntegrityError
names=['Ada']
ex-43 OK
```

**Key takeaway**: `with session.begin():` commits automatically on a clean exit and rolls back
automatically on any exception -- no manual try/except/commit/rollback bookkeeping required at the call
site.

**Why it matters**: Hand-rolled commit/rollback bookkeeping is a common source of bugs -- a forgotten
`rollback()` in an exception handler leaves a transaction half-open, and a forgotten `commit()` silently
discards a write. Delegating that bookkeeping to `session.begin()`'s own context-manager protocol removes
an entire category of "did that actually save" uncertainty from application code.

---

### Example 44: ORM Nested Savepoint

_ex-44 &middot; exercises co-17_

`session.begin_nested()` opens a Postgres `SAVEPOINT` inside an already-open outer transaction. When the
nested write violates a `UNIQUE` constraint, only that inner attempt rolls back -- the two writes made
_outside_ the savepoint, before and after it, both survive.

**`learning/code/ex-44-orm-nested-savepoint/example.py`**

```python
# pyright: strict
"""Example 44: begin_nested() -- a Savepoint That Rolls Back PART of a Transaction."""

from __future__ import annotations

import os  # => reads connection settings from the environment

from sqlalchemy import Engine, create_engine, select, text  # => co-17: select() confirms exactly which rows survived
from sqlalchemy.exc import IntegrityError  # => co-17: the exact exception the inner savepoint's violation raises
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Customer(Base):  # => co-17: the table this example writes to across an outer transaction and an inner savepoint
    __tablename__ = "customer"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column, UNIQUE below to force the savepoint's own write to fail


def reset_schema(engine: Engine) -> None:  # => shared reset helper -- wipes the whole schema, self-contained
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build Customer's table into
        conn.execute(text("CREATE TABLE customer (id SERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL)"))  # => raw DDL, adds UNIQUE


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine
    reset_schema(engine)  # => fresh, empty customer table with a UNIQUE name constraint

    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        with session.begin():  # => co-17: the OUTER transaction -- this one commits at the very end, wrapping everything
            session.add(Customer(name="Ada"))  # => write #1, part of the OUTER transaction, survives regardless
            session.add(Customer(name="Grace"))  # => write #2, ALSO part of the OUTER transaction, survives regardless

            try:  # => an INNER savepoint, nested inside the still-open outer transaction
                with session.begin_nested():  # => co-17: begin_nested() opens a Postgres SAVEPOINT, not a whole new transaction
                    session.add(Customer(name="Ada"))  # => a DUPLICATE name -- violates UNIQUE, but only WITHIN this savepoint
            except IntegrityError:  # => co-17: begin_nested()'s `with` block rolls back to the SAVEPOINT, not the whole transaction
                print("inner savepoint rolled back")  # => Output: inner savepoint rolled back
                # => co-17: Ada and Grace from OUTSIDE the savepoint are untouched -- only the failed duplicate write is undone

    with Session(engine) as session:  # => a FRESH session, just to read back the final state
        names = sorted(session.execute(select(Customer.name)).scalars().all())  # => co-17: confirms exactly what survived
        print(f"names={names}")  # => Output: names=['Ada', 'Grace']
        assert names == ["Ada", "Grace"]  # => co-17: BOTH outer writes committed -- the inner savepoint's failure was ISOLATED
    # => co-17: this is the key difference from Example 43 -- there, the WHOLE transaction rolled back on failure;
    # => here, begin_nested() lets a caller attempt a risky write, catch its failure, and keep the surrounding
    # => transaction alive -- useful for "try this insert, fall back to something else" without losing prior work
    print("ex-44 OK")  # => Output: ex-44 OK
```

**Run**: `python3 example.py`

**Output**:

```text
inner savepoint rolled back
names=['Ada', 'Grace']
ex-44 OK
```

**Key takeaway**: `begin_nested()` opens a database `SAVEPOINT`, not a whole new transaction -- a failure
inside it rolls back only that nested attempt, leaving every write made outside it, before or after,
intact.

**Why it matters**: Without savepoints, one failed write anywhere inside a transaction forces rolling
back everything -- including work you would rather keep. `begin_nested()` lets code attempt a risky
operation, catch its specific failure, and continue the surrounding transaction, which is the pattern
behind "try this insert, fall back to an update" or "attempt an optional step, continue if it fails"
without discarding prior, unrelated work.

---

### Example 45: Connection Pool Basics

_ex-45 &middot; exercises co-18_

`engine.pool.checkedout()` reads the pool's live connection count as connections are opened and closed.
Two connections open simultaneously (two real Postgres backend processes); once both close, a third
`connect()` reuses one of the same two physical connections instead of opening a new one.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73 -- color-blind friendly, WCAG AA
flowchart LR
    accTitle: Example 45: Connection Pool Basics
    accDescr: Flowchart with 4 nodes and 3 connections. Nodes: pool: idle checkedout=0, conn1, conn2 open checkedout=2, conn1, conn2 close returned to pool, conn3 requested REUSES a pooled connection. Connections: pool: idle checkedout=0 to conn1, conn2 open checkedout=2, conn1, conn2 open checkedout=2 to conn1, conn2 close returned to pool, conn1, conn2 close returned to pool to conn3 requested REUSES a pooled connection.
    A["pool: idle<br/>checkedout=0"]:::blue
    A --> B["conn1, conn2 open<br/>checkedout=2"]:::orange
    B --> C["conn1, conn2 close<br/>returned to pool"]:::teal
    C --> D["conn3 requested<br/>REUSES a pooled<br/>connection"]:::blue

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-45-connection-pool-basics/example.py`**

```python
# pyright: strict
"""Example 45: pool_size and max_overflow -- Connections Reused, Not Reopened Per Query."""

from __future__ import annotations

import os  # => reads connection settings from the environment

from sqlalchemy import create_engine, text  # => co-18: the engine owns the pool every connection borrows from
from sqlalchemy.pool import QueuePool  # => co-18: the default pool implementation this example inspects directly

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance

if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL, pool_size=2, max_overflow=1)  # => co-18: at most 2 PERSISTENT + 1 overflow connection
    pool = engine.pool  # => co-18: the actual QueuePool object -- inspectable at runtime, not just a config knob
    assert isinstance(pool, QueuePool)  # => confirms the DEFAULT pool class -- narrows the type for pyright --strict below

    print(f"checked out before use: {pool.checkedout()}")  # => Output: checked out before use: 0
    # => co-18: create_engine() does NOT open any connections up front -- the pool starts completely empty

    with engine.connect() as conn1:  # => co-18: borrows connection #1 FROM the pool -- opens a NEW physical connection
        pid1 = conn1.execute(text("SELECT pg_backend_pid()")).scalar_one()  # => Postgres' own process id for THIS connection
        print(f"checked out with 1 open: {pool.checkedout()}")  # => Output: checked out with 1 open: 1

        with engine.connect() as conn2:  # => borrows connection #2 -- ALSO a new physical connection, still within pool_size
            pid2 = conn2.execute(text("SELECT pg_backend_pid()")).scalar_one()  # => a DIFFERENT backend pid than conn1's
            print(f"checked out with 2 open: {pool.checkedout()}")  # => Output: checked out with 2 open: 2
            assert pid1 != pid2  # => co-18: two SIMULTANEOUS connections are genuinely two separate Postgres backends

    print(f"checked out after both closed: {pool.checkedout()}")  # => Output: checked out after both closed: 0
    # => co-18: closing a connection RETURNS it to the pool -- the underlying TCP socket to Postgres often stays open

    with engine.connect() as conn3:  # => co-18: borrows a connection AGAIN, after both prior ones were returned
        pid3 = conn3.execute(text("SELECT pg_backend_pid()")).scalar_one()  # => this connection's backend pid
    print(f"pid3 reused an existing pid: {pid3 in (pid1, pid2)}")  # => Output: pid3 reused an existing pid: True
    assert pid3 in (pid1, pid2)  # => co-18: the pool handed back an EXISTING physical connection, not a freshly-opened one
    # => co-18: which of the two it picked depends on FIFO queue order, an implementation detail -- what matters is
    # => that NO third Postgres backend process was ever spawned; opening a NEW connection costs a TCP handshake
    # => plus authentication on every request, so a pool amortizes that cost across many borrow/return cycles instead
    engine.dispose()  # => co-18: closes every pooled connection -- good hygiene at process shutdown, used here for cleanliness
    print("ex-45 OK")  # => Output: ex-45 OK
```

**Run**: `python3 example.py`

**Output**:

```text
checked out before use: 0
checked out with 1 open: 1
checked out with 2 open: 2
checked out after both closed: 0
pid3 reused an existing pid: True
ex-45 OK
```

**Key takeaway**: `create_engine()` opens zero connections up front; the pool lends out real physical
connections as they're requested and reuses returned ones on the next checkout, instead of opening a
fresh connection per request.

**Why it matters**: Opening a new database connection costs a TCP handshake plus authentication --
significant overhead if paid on every single query. A connection pool amortizes that cost across many
borrow/return cycles, which is why every production ORM setup runs through a pool rather than calling
`connect()` fresh each time. Reading `pool.checkedout()` directly, as this example does, makes that
reuse observable instead of assumed.

---

### Example 46: Pool Exhaustion

_ex-46 &middot; exercises co-18_

A pool sized to exactly one connection, with `max_overflow=0`, is deliberately exhausted: the first
connection is held open and never returned, and a second checkout attempt blocks for `pool_timeout`
seconds before raising `TimeoutError`. Once the held connection is released, the pool recovers instantly.

**`learning/code/ex-46-pool-exhaustion/example.py`**

```python
# pyright: strict
"""Example 46: Pool Exhaustion -- QueuePool Times Out When Every Connection Is Held."""

from __future__ import annotations

import os  # => reads connection settings from the environment

from sqlalchemy import create_engine, text  # => co-18: the engine whose small pool this example deliberately exhausts
from sqlalchemy.exc import TimeoutError as SATimeoutError  # => co-18: renamed to avoid shadowing the builtin TimeoutError

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance

if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(  # => co-18: a DELIBERATELY tiny pool -- easy to exhaust for this demonstration
        SQLA_URL,
        pool_size=1,  # => at most ONE persistent connection
        max_overflow=0,  # => co-18: zero overflow -- no temporary extra connections allowed beyond pool_size
        pool_timeout=1,  # => co-18: how long a checkout WAITS for a free connection before giving up, in seconds
    )

    held_conn = engine.connect()  # => co-18: checks out the pool's ONLY connection and does NOT return it -- held open
    # => this simulates a real hazard: a request that forgets to close its connection, or one that runs unusually long
    try:  # => the checkout below has nowhere to come from -- pool_size=1 is already fully checked out
        try:  # => attempts a SECOND checkout while the first is still held
            engine.connect()  # => co-18: blocks up to pool_timeout seconds, then raises -- there is no connection to give
            raise AssertionError("expected TimeoutError")  # => fails loudly if the pool unexpectedly had room
        except SATimeoutError as exc:  # => co-18: the exact exception QueuePool raises once pool_timeout elapses
            print(f"raised: {type(exc).__name__}")  # => Output: raised: TimeoutError
            # => co-18: the message names QueuePool explicitly -- "QueuePool limit of size 1 overflow 0 reached"
    finally:  # => always releases the held connection, even if the assertion above somehow fired
        held_conn.close()  # => co-18: returns the connection to the pool -- the NEXT checkout would now succeed instantly

    with engine.connect() as conn_after:  # => co-18: proves the pool RECOVERS once a connection is returned
        result = conn_after.execute(text("SELECT 1")).scalar_one()  # => a trivial round trip, just to prove the pool works
        print(f"result after recovery: {result}")  # => Output: result after recovery: 1
        assert result == 1  # => co-18: exhaustion is TEMPORARY -- the pool is healthy again as soon as a slot frees up
    # => co-18: pool_timeout is a deliberate design choice, not a bug -- it turns "every connection is busy" into a
    # => bounded, catchable wait instead of an indefinitely hanging request; a real service sizes pool_size + max_overflow
    # => to its expected concurrent load, and treats a TimeoutError here as a signal to scale the pool or the database
    engine.dispose()  # => closes every pooled connection -- good hygiene at process shutdown, used here for cleanliness
    print("ex-46 OK")  # => Output: ex-46 OK
```

**Run**: `python3 example.py`

**Output**:

```text
raised: TimeoutError
result after recovery: 1
ex-46 OK
```

**Key takeaway**: A pool that runs out of connections doesn't hang indefinitely -- `pool_timeout` bounds
the wait, and the pool recovers instantly the moment a held connection is returned.

**Why it matters**: An indefinitely hanging request under load is one of the harder incidents to
diagnose; a bounded `TimeoutError` is not. Sizing `pool_size` and `max_overflow` to expected concurrent
load, and treating a `TimeoutError` as a signal to scale rather than a mystery, turns pool exhaustion
from a production fire into a clear, actionable capacity signal.

---

### Example 47: Pool Pre Ping

_ex-47 &middot; exercises co-18_

A pooled connection is silently killed from outside the pool (simulating a network blip or database
failover); without `pool_pre_ping`, reusing it raises `OperationalError` on the caller's own query. With
`pool_pre_ping=True`, a lightweight health check runs before every checkout, transparently opening a
fresh connection instead.

**`learning/code/ex-47-pool-pre-ping/example.py`**

```python
# pyright: strict
"""Example 47: pool_pre_ping -- Transparently Recovering a Stale Pooled Connection."""

from __future__ import annotations

import os  # => reads connection settings from the environment

import psycopg  # => co-18: a RAW driver connection for the killer -- must be a DIFFERENT physical backend than the pool's
from sqlalchemy import Engine, create_engine, text  # => co-18: pool_pre_ping is a create_engine() keyword, not a pool method
from sqlalchemy.exc import OperationalError  # => co-18: what a STALE connection raises WITHOUT pre-ping's protection

PG_DSN: str = os.environ.get("PG_DSN", "postgresql://postgres:postgres@localhost:5432/orm_by_example")  # => a plain DB-API DSN
SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


def make_stale(engine: Engine) -> None:  # => borrows the pool's connection, notes its pid, then kills it FROM OUTSIDE the pool
    with engine.connect() as conn:  # => co-18: checks out the pool's connection -- this becomes the STALE one once returned
        pid = conn.execute(text("SELECT pg_backend_pid()")).scalar_one()  # => Postgres' own process id for THIS connection
    with psycopg.connect(PG_DSN, autocommit=True) as killer:  # => a connection OUTSIDE the pool -- can't kill itself by accident
        killer.execute("SELECT pg_terminate_backend(%s)", (pid,))  # => forcibly kills the pool's connection, not this one
    # => co-18: the pool does NOT know yet -- `conn`'s connection object is back in the pool, looking perfectly healthy


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    no_ping_engine = create_engine(SQLA_URL, pool_size=1, max_overflow=0)  # => co-18: pool_pre_ping DEFAULTS to False
    make_stale(no_ping_engine)  # => kills the pool's one connection behind its back
    try:  # => the pool hands back the connection it THINKS is fine -- it never verified
        with no_ping_engine.connect() as conn:  # => co-18: reuses the now-DEAD connection, no health check first
            conn.execute(text("SELECT 1"))  # => this round trip fails -- Postgres already closed the socket
        raise AssertionError("expected OperationalError")  # => fails loudly if the connection was somehow still alive
    except OperationalError as exc:  # => co-18: without pre-ping, staleness surfaces as a hard failure on the CALLER's query
        print(f"no pre_ping raised: {type(exc).__name__}")  # => Output: no pre_ping raised: OperationalError
    no_ping_engine.dispose()  # => closes every pooled connection -- good hygiene before building the next engine

    ping_engine = create_engine(SQLA_URL, pool_size=1, max_overflow=0, pool_pre_ping=True)  # => co-18: the protection ENABLED
    make_stale(ping_engine)  # => kills THIS pool's one connection behind its back, identically to the run above
    with ping_engine.connect() as conn:  # => co-18: pre_ping runs a lightweight "SELECT 1" BEFORE handing this out
        result = conn.execute(text("SELECT 1")).scalar_one()  # => co-18: succeeds -- pre-ping silently opened a FRESH connection
        print(f"with pre_ping result: {result}")  # => Output: with pre_ping result: 1
        assert result == 1  # => co-18: the caller never even sees the staleness -- pre-ping absorbed it transparently
    # => co-18: pool_pre_ping adds one extra round trip PER checkout, a small, worthwhile cost for connections that
    # => might have gone stale behind a load balancer, a database failover, or a long idle period -- exactly the
    # => class of production incident ("connection reset" errors after a quiet night) this setting quietly prevents
    ping_engine.dispose()  # => closes every pooled connection -- good hygiene at process shutdown, used here for cleanliness
    print("ex-47 OK")  # => Output: ex-47 OK
```

**Run**: `python3 example.py`

**Output**:

```text
no pre_ping raised: OperationalError
with pre_ping result: 1
ex-47 OK
```

**Key takeaway**: `pool_pre_ping=True` adds a lightweight health check before every checkout, silently
replacing a stale connection with a fresh one before the caller's own query ever sees the failure.

**Why it matters**: Connections go stale behind load balancers, database failovers, or long idle periods
-- exactly the "connection reset" errors that show up after a quiet night with no obvious cause.
`pool_pre_ping` trades one small round trip per checkout for eliminating an entire class of intermittent,
hard-to-reproduce connection errors, which is why it is a common production default despite the modest
overhead.

---

### Example 48: Alembic Init

_ex-48 &middot; exercises co-19_

`alembic.command.init()` -- the same Python API the `alembic init` CLI command calls internally --
scaffolds a fresh migration environment into a throwaway directory: `env.py`, `script.py.mako`,
`README`, and an empty `versions/` folder. This is the environment every later migration in this topic
builds on.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73 -- color-blind friendly, WCAG AA
flowchart LR
    accTitle: Example 48: Alembic Init
    accDescr: Flowchart with 3 nodes and 2 connections. Nodes: alembic init scaffold env.py + versions/, alembic revision write upgrade()/ downgrade(), alembic upgrade head apply to the database. Connections: alembic init scaffold env.py + versions/ to alembic revision write upgrade()/ downgrade(), alembic revision write upgrade()/ downgrade() to alembic upgrade head apply to the database.
    A["alembic init<br/>scaffold env.py +<br/>versions/"]:::blue
    B["alembic revision<br/>write upgrade()/<br/>downgrade()"]:::orange
    C["alembic upgrade head<br/>apply to the<br/>database"]:::teal
    A --> B --> C

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-48-alembic-init/example.py`**

```python
# pyright: strict
"""Example 48: alembic init -- Scaffolding a Migration Environment."""

from __future__ import annotations

import contextlib  # => co-19: redirects alembic's own console chatter, which embeds a NON-DETERMINISTIC temp path
import io  # => the throwaway buffer contextlib.redirect_stdout writes alembic's chatter INTO, instead of the real terminal
import os  # => reads connection settings, and builds/removes the scratch project directory
import shutil  # => co-19: cleanup -- removes the scaffolded project directory once this example is done
import tempfile  # => co-19: a fresh, self-contained directory for the scaffolded migration project

from alembic import command  # => co-19: the SAME Python API `alembic` init/revision/upgrade CLI commands call internally
from alembic.config import Config  # => co-19: a Config object is what EVERY alembic.command function needs as its first arg

if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    project_dir = tempfile.mkdtemp(prefix="alembic_ex48_")  # => co-19: a throwaway directory -- this example's own "repo root"
    script_dir = os.path.join(project_dir, "migrations")  # => co-19: alembic's convention -- a "migrations" subfolder
    ini_path = os.path.join(project_dir, "alembic.ini")  # => co-19: alembic.ini -- the CLI's own config file, generated below

    cfg = Config(ini_path)  # => co-19: this Config object IS what `alembic init` would populate from a real alembic.ini
    cfg.set_main_option("script_location", script_dir)  # => co-19: tells Config where the scaffolded files should land
    with contextlib.redirect_stdout(io.StringIO()):  # => swallows "Creating directory /tmp/xyz... done" -- path varies per run
        command.init(cfg, script_dir)  # => co-19: THE scaffolding step -- identical to running `alembic init migrations`

    created_files = sorted(os.listdir(script_dir))  # => co-19: what `alembic init` actually wrote to disk, read back fresh
    print(f"created files: {created_files}")  # => Output: created files: ['README', 'env.py', 'script.py.mako', 'versions']
    assert created_files == ["README", "env.py", "script.py.mako", "versions"]  # => co-19: the exact scaffold, every time
    # => co-19: env.py wires alembic to a real database connection and your models; script.py.mako is the TEMPLATE every
    # => new revision file is generated from; versions/ is where individual migration scripts accumulate over time

    versions_dir = os.path.join(script_dir, "versions")  # => co-19: the directory EVERY future migration script lands in
    print(f"versions is a directory: {os.path.isdir(versions_dir)}")  # => Output: versions is a directory: True
    print(f"versions starts empty: {os.listdir(versions_dir) == []}")  # => Output: versions starts empty: True
    assert os.path.isdir(versions_dir) and os.listdir(versions_dir) == []  # => co-19: a fresh project has NO migrations yet
    # => co-19: `alembic init` only scaffolds the ENVIRONMENT -- it writes no migration of its own; Example 49 writes
    # => the FIRST real migration into this exact versions/ directory, using the same Config + command API shown here

    shutil.rmtree(project_dir)  # => co-19: cleanup -- this example's own throwaway project, not a real repository
    print("ex-48 OK")  # => Output: ex-48 OK
```

**Run**: `python3 example.py`

**Output**:

```text
created files: ['README', 'env.py', 'script.py.mako', 'versions']
versions is a directory: True
versions starts empty: True
ex-48 OK
```

**Key takeaway**: `alembic.command.init()` is the SAME Python API the `alembic init` CLI wraps -- calling
it directly scaffolds the identical `env.py`/`script.py.mako`/`README`/`versions/` structure, with no
subprocess required.

**Why it matters**: Every Alembic-managed project starts from this exact scaffold, and every later
migration example in this topic writes into the `versions/` directory this step creates. Knowing that
`command.init()` is callable directly, not just through the CLI, is what makes it possible to script and
test migration workflows programmatically, exactly as every remaining Alembic example here does.

---

### Example 49: Alembic First Migration

_ex-49 &middot; exercises co-19_

A hand-written migration -- `op.create_table("widget", ...)` in `upgrade()`, `op.drop_table("widget")`
in `downgrade()` -- is generated as an empty skeleton, filled in by hand, then applied with
`command.upgrade(cfg, "head")`. `inspect(engine).get_table_names()` confirms Postgres' own catalog now
has the real table, plus Alembic's own `alembic_version` bookkeeping table.

**`learning/code/ex-49-alembic-first-migration/example.py`**

```python
# pyright: strict
"""Example 49: A Hand-Written create-table Migration -- upgrade() Actually Creates the Table."""

from __future__ import annotations

import contextlib  # => co-19: swallows alembic's own non-deterministic scaffolding chatter, same reason as Example 48
import io  # => the throwaway buffer redirect_stdout writes that chatter INTO
import os  # => reads connection settings, and builds/removes the scratch project directory
import shutil  # => co-19: cleanup -- removes the scaffolded project directory once this example is done
import tempfile  # => co-19: a fresh, self-contained directory for the scaffolded migration project

from alembic import command  # => co-19: init/revision/upgrade -- the same API the alembic CLI itself calls
from alembic.config import Config  # => co-19: every alembic.command function needs one of these as its first argument
from sqlalchemy import create_engine, inspect, text  # => co-19: inspect() reads back what the migration ACTUALLY built

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance

# => co-19: a MINIMAL, deterministic env.py this example WRITES to disk below -- no fileConfig(), no logging noise,
# => just the online-migration path; real projects commonly hand-edit env.py exactly like this, right after
# => `alembic init` scaffolds a generic template, to wire it to their own database URL and model metadata
ENV_PY = (  # => co-19: built as SEPARATE joined string lines, not one big block, so each line can carry its own comment
    "from alembic import context\n"  # => co-19: `context` is alembic's OWN migration-runtime handle, not SQLAlchemy's
    "from sqlalchemy import engine_from_config, pool\n\n"  # => co-19: builds a real Engine straight from alembic.ini's own section
    "config = context.config\n"  # => co-19: the SAME Config object bootstrap() constructed, now read back inside env.py
    'target_metadata = config.attributes.get("target_metadata")\n\n\n'  # => None here; Examples 51-52 set this for autogenerate
    "def run_migrations_online() -> None:\n"  # => co-19: THE function alembic's runtime calls for a live-connection migration
    "    connectable = engine_from_config(\n"  # => co-19: reads the sqlalchemy.* keys straight out of alembic.ini's own section
    '        config.get_section(config.config_ini_section, {}), prefix="sqlalchemy.", poolclass=pool.NullPool\n'  # => co-19: no pool reuse needed
    "    )\n"  # => a short-lived migration run has no reason to KEEP a pooled connection open afterward
    "    with connectable.connect() as connection:\n"  # => borrows ONE connection for the whole migration run
    "        context.configure(connection=connection, target_metadata=target_metadata)\n"  # => co-19: binds THIS run's connection
    "        with context.begin_transaction():\n"  # => co-19: wraps every upgrade()/downgrade() call in ONE transaction
    "            context.run_migrations()\n\n\n"  # => co-19: the actual dispatch -- calls upgrade()/downgrade() on each revision
    "run_migrations_online()\n"  # => co-19: executed the MOMENT alembic imports this file -- no __main__ guard, by alembic's own design
)


def bootstrap(url: str, project_dir: str) -> Config:  # => co-19: init + env.py rewrite, shared setup for every Alembic example
    script_dir = os.path.join(project_dir, "migrations")  # => alembic's convention -- a "migrations" subfolder
    cfg = Config(os.path.join(project_dir, "alembic.ini"))  # => co-19: the Config object every command function needs
    cfg.set_main_option("script_location", script_dir)  # => tells Config where the scaffolded files live
    cfg.set_main_option("sqlalchemy.url", url)  # => co-19: the ONE connection string every migration runs against
    with contextlib.redirect_stdout(io.StringIO()):  # => swallows "Creating directory ... done" -- path varies per run
        command.init(cfg, script_dir)  # => co-19: scaffolds env.py, script.py.mako, README, versions/ (Example 48)
    with open(os.path.join(script_dir, "env.py"), "w") as f:  # => co-19: OVERWRITES the scaffolded env.py with our own
        f.write(ENV_PY)  # => a hand-edit step, exactly like a real project's post-init setup
    return cfg  # => ready for command.revision()/upgrade()/downgrade() calls


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine, used both to reset the schema and to inspect it later
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema -- alembic's migration builds INTO this

    project_dir = tempfile.mkdtemp(prefix="alembic_ex49_")  # => a fresh, throwaway migration project for this example
    cfg = bootstrap(SQLA_URL, project_dir)  # => scaffolds + rewires env.py, matching Example 48's own setup

    with contextlib.redirect_stdout(io.StringIO()):  # => swallows "Generating .../0001_create_widget.py ... done"
        rev = command.revision(cfg, message="create widget table", rev_id="0001")  # => co-19: an EMPTY skeleton, upgrade/downgrade both `pass`
    assert rev is not None and not isinstance(rev, list)  # => narrows the Union return type for pyright --strict below
    with open(rev.path, "w") as f:  # => co-19: HAND-WRITES the real migration body -- this is what "first migration" means
        f.write(  # => co-19: a real create-table upgrade, paired with its own drop-table downgrade
            '"""create widget table"""\n'  # => the migration's own docstring -- what `alembic history` displays per revision
            "from typing import Sequence, Union\n"  # => typed to match what command.revision()'s own skeleton generates
            "from alembic import op\n"  # => co-19: `op` is alembic's schema-editing API -- create_table, drop_table, add_column, etc.
            "import sqlalchemy as sa\n\n"  # => column TYPES (sa.Integer, sa.String) for the create_table() call below
            'revision: str = "0001"\n'  # => co-19: THIS revision's own id -- matches the rev_id passed to command.revision()
            "down_revision: Union[str, Sequence[str], None] = None\n"  # => co-19: None -- this is the FIRST revision, nothing before it
            "branch_labels: Union[str, Sequence[str], None] = None\n"  # => unused here -- relevant only for branching migration histories
            "depends_on: Union[str, Sequence[str], None] = None\n\n"  # => unused here -- cross-branch dependency declarations
            "def upgrade() -> None:\n"  # => co-19: the FORWARD direction -- what `alembic upgrade head` runs
            '    op.create_table("widget", sa.Column("id", sa.Integer, primary_key=True), sa.Column("name", sa.String, nullable=False))\n\n'  # => the actual DDL
            "def downgrade() -> None:\n"  # => co-19: the REVERSE direction -- what `alembic downgrade -1` runs
            '    op.drop_table("widget")\n'  # => co-19: a TRUE inverse of upgrade() -- Example 50 exercises this exact downgrade
        )

    with contextlib.redirect_stdout(io.StringIO()):  # => swallows alembic's own logging-free but still noisy status lines
        command.upgrade(cfg, "head")  # => co-19: runs upgrade() from EVERY unapplied revision, in order -- just one here

    tables = inspect(engine).get_table_names()  # => co-19: reads Postgres' OWN catalog, not the migration file's claims
    print(f"tables after upgrade: {sorted(tables)}")  # => Output: tables after upgrade: ['alembic_version', 'widget']
    assert sorted(tables) == ["alembic_version", "widget"]  # => co-19: `widget` is REAL, plus alembic's own bookkeeping table
    # => co-19: `alembic_version` is alembic's own tracking table -- it stores exactly ONE row, the current revision id,
    # => so the NEXT `alembic upgrade`/`alembic downgrade` on this database knows precisely where it left off

    shutil.rmtree(project_dir)  # => cleanup -- this example's own throwaway project, not a real repository
    print("ex-49 OK")  # => Output: ex-49 OK
```

**Run**: `python3 example.py`

**Output**:

```text
tables after upgrade: ['alembic_version', 'widget']
ex-49 OK
```

**Key takeaway**: A migration's `upgrade()` function is ordinary Python that calls `op.create_table()`
and friends -- running `command.upgrade(cfg, "head")` executes it for real, verifiable by reading
Postgres' own catalog afterward, not by trusting the migration file's claims.

**Why it matters**: `alembic_version` is what lets a team run `alembic upgrade head` on any machine and
land at the exact same schema state, regardless of who wrote which migration or when. Understanding that
this bookkeeping table stores exactly one row -- the current revision id -- demystifies how Alembic knows
"where a database is" in its own migration history without scanning every migration file every time.

---

### Example 50: Alembic Upgrade Downgrade

_ex-50 &middot; exercises co-19, co-21_

The same `create_table`/`drop_table` migration from Example 49 is run forward with `command.upgrade()`,
verified, then run backward with `command.downgrade(cfg, "base")`. The schema round-trips exactly back
to empty -- only `alembic_version` remains, proving `downgrade()` is a genuine inverse, not an
untested guess.

```mermaid
%% Color Palette: Blue #0173B2, Teal #029E73 -- color-blind friendly, WCAG AA
flowchart LR
    accTitle: Example 50: Alembic Upgrade Downgrade
    accDescr: Flowchart with 2 nodes and 2 connections. Nodes: empty schema base, widget table exists. Connections: empty schema base to widget table exists (command. upgrade(head)), widget table exists to empty schema base (command. downgrade(base)).
    A["empty schema<br/>base"]:::blue
    A -->|"command.<br/>upgrade(head)"| B["widget table exists"]:::teal
    B -->|"command.<br/>downgrade(base)"| A

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-50-alembic-upgrade-downgrade/example.py`**

```python
# pyright: strict
"""Example 50: upgrade() Then downgrade() -- the Schema Round-Trips Back to Empty."""

from __future__ import annotations

import contextlib  # => co-19: swallows alembic's own non-deterministic scaffolding chatter, same reason as Example 48
import io  # => the throwaway buffer redirect_stdout writes that chatter INTO
import os  # => reads connection settings, and builds/removes the scratch project directory
import shutil  # => co-19: cleanup -- removes the scaffolded project directory once this example is done
import tempfile  # => co-19: a fresh, self-contained directory for the scaffolded migration project

from alembic import command  # => co-19: init/revision/upgrade/downgrade -- the same API the alembic CLI itself calls
from alembic.config import Config  # => co-19: every alembic.command function needs one of these as its first argument
from sqlalchemy import create_engine, inspect, text  # => co-21: inspect() confirms the schema at EACH point in the round trip

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance

# => co-19: the SAME minimal, deterministic env.py pattern Example 49 established -- no fileConfig(), no logging noise
ENV_PY = (  # => co-19: built as SEPARATE joined string lines, so each line can carry its own comment
    "from alembic import context\n"  # => co-19: `context` is alembic's OWN migration-runtime handle, not SQLAlchemy's
    "from sqlalchemy import engine_from_config, pool\n\n"  # => co-19: builds a real Engine straight from alembic.ini's own section
    "config = context.config\n"  # => co-19: the SAME Config object bootstrap() constructed, now read back inside env.py
    'target_metadata = config.attributes.get("target_metadata")\n\n\n'  # => None here -- this example writes migrations by hand
    "def run_migrations_online() -> None:\n"  # => co-19: THE function alembic's runtime calls for a live-connection migration
    "    connectable = engine_from_config(\n"  # => co-19: reads the sqlalchemy.* keys straight out of alembic.ini's own section
    '        config.get_section(config.config_ini_section, {}), prefix="sqlalchemy.", poolclass=pool.NullPool\n'  # => no reuse needed
    "    )\n"  # => a short-lived migration run has no reason to KEEP a pooled connection open afterward
    "    with connectable.connect() as connection:\n"  # => borrows ONE connection for the whole migration run
    "        context.configure(connection=connection, target_metadata=target_metadata)\n"  # => co-19: binds THIS run's connection
    "        with context.begin_transaction():\n"  # => co-19: wraps every upgrade()/downgrade() call in ONE transaction
    "            context.run_migrations()\n\n\n"  # => co-19: the actual dispatch -- calls upgrade()/downgrade() on each revision
    "run_migrations_online()\n"  # => co-19: executed the MOMENT alembic imports this file -- no __main__ guard, by design
)


def bootstrap(url: str, project_dir: str) -> Config:  # => co-19: init + env.py rewrite, shared setup for every Alembic example
    script_dir = os.path.join(project_dir, "migrations")  # => alembic's convention -- a "migrations" subfolder
    cfg = Config(os.path.join(project_dir, "alembic.ini"))  # => co-19: the Config object every command function needs
    cfg.set_main_option("script_location", script_dir)  # => tells Config where the scaffolded files live
    cfg.set_main_option("sqlalchemy.url", url)  # => co-19: the ONE connection string every migration runs against
    with contextlib.redirect_stdout(io.StringIO()):  # => swallows "Creating directory ... done" -- path varies per run
        command.init(cfg, script_dir)  # => co-19: scaffolds env.py, script.py.mako, README, versions/ (Example 48)
    with open(os.path.join(script_dir, "env.py"), "w") as f:  # => co-19: OVERWRITES the scaffolded env.py with our own
        f.write(ENV_PY)  # => a hand-edit step, exactly like a real project's post-init setup
    return cfg  # => ready for command.revision()/upgrade()/downgrade() calls


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine, used both to reset the schema and to inspect it later
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema -- alembic's migration builds INTO this

    project_dir = tempfile.mkdtemp(prefix="alembic_ex50_")  # => a fresh, throwaway migration project for this example
    # => the round trip below is exactly what a CI job or a local `alembic upgrade head && alembic downgrade base` proves
    cfg = bootstrap(SQLA_URL, project_dir)  # => scaffolds + rewires env.py, matching Examples 48-49's own setup

    with contextlib.redirect_stdout(io.StringIO()):  # => swallows "Generating .../0001_create_widget.py ... done"
        rev = command.revision(cfg, message="create widget table", rev_id="0001")  # => co-19: an EMPTY skeleton
    assert rev is not None and not isinstance(rev, list)  # => narrows the Union return type for pyright --strict below
    with open(rev.path, "w") as f:  # => co-21: a REAL, REVERSIBLE migration -- upgrade() and downgrade() are TRUE inverses
        f.write(  # => the same create-table/drop-table pair from Example 49, reused here for the round-trip
            '"""create widget table"""\n'  # => the migration's own docstring -- what `alembic history` displays per revision
            "from typing import Sequence, Union\n"  # => typed to match what command.revision()'s own skeleton generates
            "from alembic import op\n"  # => co-19: `op` is alembic's schema-editing API
            "import sqlalchemy as sa\n\n"  # => column TYPES (sa.Integer, sa.String) for the create_table() call below
            'revision: str = "0001"\n'  # => co-19: THIS revision's own id -- matches the rev_id passed to command.revision()
            "down_revision: Union[str, Sequence[str], None] = None\n"  # => None -- this is the FIRST revision, nothing before it
            "branch_labels: Union[str, Sequence[str], None] = None\n"  # => unused here -- relevant only for branching histories
            "depends_on: Union[str, Sequence[str], None] = None\n\n"  # => unused here -- cross-branch dependency declarations
            "def upgrade() -> None:\n"  # => co-19: the FORWARD direction -- what `alembic upgrade head` runs
            '    op.create_table("widget", sa.Column("id", sa.Integer, primary_key=True), sa.Column("name", sa.String, nullable=False))\n\n'  # => DDL
            "def downgrade() -> None:\n"  # => co-21: the REVERSE direction -- what THIS example proves actually undoes the upgrade
            '    op.drop_table("widget")\n'  # => co-21: a TRUE inverse -- no data or structure survives that upgrade() didn't add
        )

    with contextlib.redirect_stdout(io.StringIO()):  # => swallows alembic's own noisy status lines
        command.upgrade(cfg, "head")  # => co-19: STEP 1 of the round trip -- runs upgrade(), the schema now has `widget`
    tables_up = sorted(inspect(engine).get_table_names())  # => co-21: reads Postgres' OWN catalog right after upgrading
    print(f"tables after upgrade: {tables_up}")  # => Output: tables after upgrade: ['alembic_version', 'widget']
    assert tables_up == ["alembic_version", "widget"]  # => co-19: the forward direction landed correctly

    with contextlib.redirect_stdout(io.StringIO()):  # => swallows alembic's own noisy status lines
        command.downgrade(cfg, "base")  # => co-21: STEP 2 of the round trip -- runs downgrade(), back to the START
    tables_down = sorted(inspect(create_engine(SQLA_URL)).get_table_names())  # => co-21: a FRESH inspector, no stale cache
    print(f"tables after downgrade: {tables_down}")  # => Output: tables after downgrade: ['alembic_version']
    assert tables_down == ["alembic_version"]  # => co-21: `widget` is GONE -- only alembic's own tracking table remains
    # => a migration that DOESN'T survive this round trip is a common source of "works on my machine" schema drift
    # => co-21: "base" means "no migrations applied" -- the schema is now back to where it started, MINUS alembic_version
    # => itself, which alembic keeps around even at base to remember it once managed this database at all

    shutil.rmtree(project_dir)  # => cleanup -- this example's own throwaway project, not a real repository
    print("ex-50 OK")  # => Output: ex-50 OK
```

**Run**: `python3 example.py`

**Output**:

```text
tables after upgrade: ['alembic_version', 'widget']
tables after downgrade: ['alembic_version']
ex-50 OK
```

**Key takeaway**: `command.upgrade(cfg, "head")` then `command.downgrade(cfg, "base")` round-trips the
schema exactly back to its starting point -- proof that `downgrade()` is a genuine inverse, verified by
reading the catalog, not just assumed from reading the migration file.

**Why it matters**: A migration whose `downgrade()` was never actually exercised is a common source of
"works on my machine" schema drift -- the first time it runs for real is often during an incident
rollback, the worst possible moment to discover it is broken. Testing the full upgrade-then-downgrade
round trip, the way a CI job would, catches that failure mode before it ever reaches production.

---

### Example 51: Alembic Autogenerate

_ex-51 &middot; exercises co-20_

`command.revision(cfg, autogenerate=True)` diffs a live (empty) database against a `Widget` mapped
class's `Mapped[]` columns and writes the proposed `op.create_table(...)` DDL automatically -- no
hand-written `upgrade()` body required for this straightforward, brand-new-table case.

**`learning/code/ex-51-alembic-autogenerate/example.py`**

```python
# pyright: strict
"""Example 51: Autogenerate -- Deriving a Migration From a Model<->Schema Diff."""

from __future__ import annotations

import contextlib  # => co-20: swallows alembic's own non-deterministic scaffolding chatter, same reason as Example 48
import io  # => the throwaway buffer redirect_stdout writes that chatter INTO
import os  # => reads connection settings, and builds/removes the scratch project directory
import shutil  # => co-20: cleanup -- removes the scaffolded project directory once this example is done
import tempfile  # => co-20: a fresh, self-contained directory for the scaffolded migration project

from alembic import command  # => co-20: revision(autogenerate=True) is what DIFFS the models against the live schema
from alembic.config import Config  # => co-20: every alembic.command function needs one of these as its first argument
from sqlalchemy import create_engine, text  # => co-20: the live database autogenerate compares the models AGAINST
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column  # => co-20: the SAME Mapped[] models Examples 14-15 taught

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Widget(Base):  # => co-20: exists ONLY in Python -- the database starts with NO widget table at all
    __tablename__ = "widget"  # => the physical table name autogenerate will propose creating
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column


# => co-20: the SAME minimal env.py pattern from Examples 49-50, but `target_metadata` now reads a REAL MetaData
# => object -- autogenerate needs this to know what your models SAY the schema should look like
ENV_PY = (  # => co-20: built as SEPARATE joined string lines, so each line can carry its own comment
    "from alembic import context\n"  # => co-20: `context` is alembic's OWN migration-runtime handle
    "from sqlalchemy import engine_from_config, pool\n\n"  # => co-20: builds a real Engine straight from alembic.ini's own section
    "config = context.config\n"  # => co-20: the SAME Config object bootstrap() constructed, now read back inside env.py
    'target_metadata = config.attributes.get("target_metadata")\n\n\n'  # => co-20: THIS run sets it to Widget's own Base.metadata
    "def run_migrations_online() -> None:\n"  # => co-20: THE function alembic's runtime calls for a live-connection migration
    "    connectable = engine_from_config(\n"  # => co-20: reads the sqlalchemy.* keys straight out of alembic.ini's own section
    '        config.get_section(config.config_ini_section, {}), prefix="sqlalchemy.", poolclass=pool.NullPool\n'  # => no reuse needed
    "    )\n"  # => a short-lived migration run has no reason to KEEP a pooled connection open afterward
    "    with connectable.connect() as connection:\n"  # => borrows ONE connection -- autogenerate reflects THROUGH it
    "        context.configure(connection=connection, target_metadata=target_metadata)\n"  # => co-20: what autogenerate DIFFS against
    "        with context.begin_transaction():\n"  # => co-20: wraps every upgrade()/downgrade() call in ONE transaction
    "            context.run_migrations()\n\n\n"  # => the actual dispatch -- also used by autogenerate's own reflection pass
    "run_migrations_online()\n"  # => co-20: executed the MOMENT alembic imports this file -- no __main__ guard, by design
)


def bootstrap(url: str, project_dir: str, metadata: object) -> Config:  # => co-20: metadata drives WHAT autogenerate compares to
    script_dir = os.path.join(project_dir, "migrations")  # => alembic's convention -- a "migrations" subfolder
    cfg = Config(os.path.join(project_dir, "alembic.ini"))  # => co-20: the Config object every command function needs
    cfg.set_main_option("script_location", script_dir)  # => tells Config where the scaffolded files live
    cfg.set_main_option("sqlalchemy.url", url)  # => co-20: the ONE connection string every migration runs against
    with contextlib.redirect_stdout(io.StringIO()):  # => swallows "Creating directory ... done" -- path varies per run
        command.init(cfg, script_dir)  # => co-20: scaffolds env.py, script.py.mako, README, versions/ (Example 48)
    with open(os.path.join(script_dir, "env.py"), "w") as f:  # => co-20: OVERWRITES the scaffolded env.py with our own
        f.write(ENV_PY)  # => a hand-edit step, exactly like a real project's post-init setup
    cfg.attributes["target_metadata"] = metadata  # => co-20: passed to env.py via `config.attributes`, alembic's own escape hatch
    return cfg  # => ready for command.revision(autogenerate=True)


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine, used both to reset the schema and inspect the migration
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- the database starts EMPTY, no widget yet
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema -- autogenerate compares Widget AGAINST this

    project_dir = tempfile.mkdtemp(prefix="alembic_ex51_")  # => a fresh, throwaway migration project for this example
    cfg = bootstrap(SQLA_URL, project_dir, Base.metadata)  # => co-20: Widget's OWN metadata is what gets diffed below

    with contextlib.redirect_stdout(io.StringIO()) as buf:  # => captures the "Generating ..." AND any diff summary text
        rev = command.revision(cfg, message="add widget", autogenerate=True, rev_id="0001")  # => co-20: THE diff step itself
    assert rev is not None and not isinstance(rev, list)  # => narrows the Union return type for pyright --strict below
    generated_body = open(rev.path).read()  # => co-20: reads back the FILE autogenerate actually wrote, not a guess
    print(f"contains create_table widget: {'create_table' in generated_body and 'widget' in generated_body}")
    assert "op.create_table(" in generated_body and "'widget'" in generated_body  # => Output: contains create_table widget: True
    assert "commands auto generated by Alembic" in generated_body  # => co-20: alembic's own marker, warning "please adjust!"
    _ = buf.getvalue()  # => discarded -- captured only to keep the demonstrated stdout deterministic, not for its own content
    # => co-20: autogenerate DIFFED the live (empty) database against Widget's Mapped[] columns and proposed the exact
    # => DDL needed to reconcile them -- but it is a PROPOSAL, not a guarantee: Example 52 shows a case autogenerate
    # => gets subtly wrong, which is why every autogenerated migration still needs a human review before it ships

    shutil.rmtree(project_dir)  # => cleanup -- this example's own throwaway project, not a real repository
    print("ex-51 OK")  # => Output: ex-51 OK
```

**Run**: `python3 example.py`

**Output**:

```text
contains create_table widget: True
ex-51 OK
```

**Key takeaway**: `revision(autogenerate=True)` diffs a live database against your mapped classes'
`Mapped[]` columns and writes a proposed migration for you -- verified here by reading the generated
file back from disk, not by trusting the CLI's own success message.

**Why it matters**: Autogenerate turns "what changed in my models since the last migration" from a manual
comparison into an automated diff, which is a real productivity win for straightforward additive changes
like a brand-new table. But "proposed" is the operative word -- Example 52 shows a case where the diff is
structurally correct but semantically wrong, which is exactly why the generated file always needs a
human review before it ships.

---

### Example 52: Alembic Autogen Review

_ex-52 &middot; exercises co-20_

A live table's `old_name` column was renamed to `name` in the mapped class. Autogenerate sees only
column _names_ -- it proposes `drop_column("old_name")` + `add_column("name")`, which would silently
delete every row's existing value. A hand-corrected `op.alter_column(..., new_column_name=...)` performs
a true rename instead, preserving the data.

**`learning/code/ex-52-alembic-autogen-review/example.py`**

```python
# pyright: strict
"""Example 52: Reviewing an Autogenerated Migration -- a Rename Autogenerate Gets WRONG."""

from __future__ import annotations

import contextlib  # => co-20: swallows alembic's own non-deterministic scaffolding chatter, same reason as Example 48
import io  # => the throwaway buffer redirect_stdout writes that chatter INTO
import os  # => reads connection settings, and builds/removes the scratch project directory
import shutil  # => co-20: cleanup -- removes the scaffolded project directory once this example is done
import tempfile  # => co-20: a fresh, self-contained directory for the scaffolded migration project

from alembic import command  # => co-20: revision(autogenerate=True) is what DIFFS the models against the live schema
from alembic.config import Config  # => co-20: every alembic.command function needs one of these as its first argument
from sqlalchemy import create_engine, text  # => co-20: the live database autogenerate compares the models AGAINST
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column  # => co-20: the model this example's rename targets

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Widget(Base):  # => co-20: the model's OWN column is `name` -- the live table below still calls it `old_name`
    __tablename__ = "widget"  # => the physical table name -- ALREADY exists, seeded with one row, before this runs
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => co-20: this is a RENAME from the live schema's `old_name`, not a brand-new column


ENV_PY = (  # => co-20: the SAME minimal env.py pattern from Example 51 -- built as separate, individually-commented lines
    "from alembic import context\n"  # => co-20: `context` is alembic's OWN migration-runtime handle
    "from sqlalchemy import engine_from_config, pool\n\n"  # => co-20: builds a real Engine straight from alembic.ini's own section
    "config = context.config\n"  # => co-20: the SAME Config object bootstrap() constructed, now read back inside env.py
    'target_metadata = config.attributes.get("target_metadata")\n\n\n'  # => co-20: set to Widget's own Base.metadata below
    "def run_migrations_online() -> None:\n"  # => co-20: THE function alembic's runtime calls for a live-connection migration
    "    connectable = engine_from_config(\n"  # => co-20: reads the sqlalchemy.* keys straight out of alembic.ini's own section
    '        config.get_section(config.config_ini_section, {}), prefix="sqlalchemy.", poolclass=pool.NullPool\n'  # => no reuse needed
    "    )\n"  # => a short-lived migration run has no reason to KEEP a pooled connection open afterward
    "    with connectable.connect() as connection:\n"  # => borrows ONE connection -- autogenerate reflects THROUGH it
    "        context.configure(connection=connection, target_metadata=target_metadata)\n"  # => co-20: what autogenerate DIFFS against
    "        with context.begin_transaction():\n"  # => co-20: wraps every upgrade()/downgrade() call in ONE transaction
    "            context.run_migrations()\n\n\n"  # => the actual dispatch -- also used by autogenerate's own reflection pass
    "run_migrations_online()\n"  # => co-20: executed the MOMENT alembic imports this file -- no __main__ guard, by design
)


def bootstrap(url: str, project_dir: str, metadata: object) -> Config:  # => co-20: metadata drives WHAT autogenerate compares to
    script_dir = os.path.join(project_dir, "migrations")  # => alembic's convention -- a "migrations" subfolder
    cfg = Config(os.path.join(project_dir, "alembic.ini"))  # => co-20: the Config object every command function needs
    cfg.set_main_option("script_location", script_dir)  # => tells Config where the scaffolded files live
    cfg.set_main_option("sqlalchemy.url", url)  # => co-20: the ONE connection string every migration runs against
    with contextlib.redirect_stdout(io.StringIO()):  # => swallows "Creating directory ... done" -- path varies per run
        command.init(cfg, script_dir)  # => co-20: scaffolds env.py, script.py.mako, README, versions/ (Example 48)
    with open(os.path.join(script_dir, "env.py"), "w") as f:  # => co-20: OVERWRITES the scaffolded env.py with our own
        f.write(ENV_PY)  # => a hand-edit step, exactly like a real project's post-init setup
    cfg.attributes["target_metadata"] = metadata  # => co-20: passed to env.py via `config.attributes`, alembic's own escape hatch
    return cfg  # => ready for command.revision(autogenerate=True)


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine, used to seed data AND verify the final corrected result
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema, about to get the PRE-rename table
        conn.execute(text("CREATE TABLE widget (id SERIAL PRIMARY KEY, old_name TEXT NOT NULL)"))  # => co-20: the OLD column name
        conn.execute(text("INSERT INTO widget (old_name) VALUES ('Widget1')"))  # => co-20: real data autogenerate must NOT lose

    project_dir = tempfile.mkdtemp(prefix="alembic_ex52_")  # => a fresh, throwaway migration project for this example
    cfg = bootstrap(SQLA_URL, project_dir, Base.metadata)  # => co-20: Widget's `name` column is what gets diffed against `old_name`

    with contextlib.redirect_stdout(io.StringIO()):  # => swallows "Generating ..." console chatter
        rev = command.revision(cfg, message="rename old_name to name", autogenerate=True, rev_id="0001")  # => co-20: THE naive diff
    assert rev is not None and not isinstance(rev, list)  # => narrows the Union return type for pyright --strict below
    naive_body = open(rev.path).read()  # => co-20: what autogenerate ACTUALLY proposed, read back from disk
    adds_name_column = "add_column" in naive_body and "'name'" in naive_body  # => co-20: proposes a brand-new `name` column
    print(f"naive diff drops old_name: {'drop_column' in naive_body and 'old_name' in naive_body}")
    print(f"naive diff adds name: {adds_name_column}")
    assert "drop_column" in naive_body and "add_column" in naive_body  # => Output: naive diff drops old_name: True
    # => Output: naive diff adds name: True
    # => co-20: autogenerate sees ONLY column names -- it has no idea `old_name` and `name` are the SAME data renamed;
    # => it proposes DROPPING `old_name` and ADDING a brand-new, nullable-then-NOT-NULL `name` -- applied as-is, this
    # => would SILENTLY DELETE every existing widget's value, which is exactly why "please adjust!" is not optional

    with open(rev.path, "w") as f:  # => co-20: THE HUMAN REVIEW STEP -- replaces the naive drop+add with a true rename
        f.write(  # => a hand-corrected migration that preserves the data autogenerate's proposal would have destroyed
            '"""rename old_name to name"""\n'  # => the migration's own docstring, unchanged from the autogenerated original
            "from typing import Sequence, Union\n"  # => typed to match what command.revision()'s own skeleton generates
            "from alembic import op\n\n"  # => co-20: `op.alter_column(..., new_column_name=...)` -- a TRUE rename, no data loss
            'revision: str = "0001"\n'  # => co-20: THIS revision's own id -- unchanged, still matches rev_id="0001"
            "down_revision: Union[str, Sequence[str], None] = None\n"  # => None -- this is the first revision in this project
            "branch_labels: Union[str, Sequence[str], None] = None\n"  # => unused here -- relevant only for branching histories
            "depends_on: Union[str, Sequence[str], None] = None\n\n"  # => unused here -- cross-branch dependency declarations
            "def upgrade() -> None:\n"  # => co-20: the CORRECTED forward direction -- rename in place, not drop-then-add
            '    op.alter_column("widget", "old_name", new_column_name="name")\n\n'  # => co-20: Postgres RENAMEs the column, keeps every value
            "def downgrade() -> None:\n"  # => the true inverse of the corrected rename above
            '    op.alter_column("widget", "name", new_column_name="old_name")\n'  # => renames back, again with no data loss
        )

    with contextlib.redirect_stdout(io.StringIO()):  # => swallows alembic's own noisy status lines
        command.upgrade(cfg, "head")  # => co-20: runs the CORRECTED migration, not the naive one
    with engine.begin() as conn:  # => a fresh connection to verify the FINAL, post-migration state
        names = conn.execute(text("SELECT name FROM widget")).scalars().all()  # => co-20: reads through the NEW column name
    print(f"names={names}")  # => Output: names=['Widget1']
    assert names == ["Widget1"]  # => co-20: the ORIGINAL value survived the rename -- the naive autogenerated version would have lost it
    # => this is a documented, permanent limitation of autogenerate, not a bug that a future alembic release will fix
    # => co-20: this is exactly why every autogenerated migration ships as a DRAFT for a human to review, never as a
    # => final answer -- autogenerate is excellent at spotting THAT something changed, unreliable at inferring WHY

    shutil.rmtree(project_dir)  # => cleanup -- this example's own throwaway project, not a real repository
    print("ex-52 OK")  # => Output: ex-52 OK
```

**Run**: `python3 example.py`

**Output**:

```text
naive diff drops old_name: True
naive diff adds name: True
names=['Widget1']
ex-52 OK
```

**Key takeaway**: Autogenerate diffs column _names_, not their history -- a rename shows up as a drop
plus an add, which would silently destroy existing data unless a human replaces it with a true
`alter_column(..., new_column_name=...)`.

**Why it matters**: This is a documented, permanent limitation of schema-diffing tools in general, not a
bug a future Alembic release will fix -- the diff engine has no way to know that `old_name` and `name`
are the same data under a new label. Treating every autogenerated migration as a draft, and reviewing it
against the actual intent of the change, is the only reliable defense against exactly this kind of
silent data loss.

---

### Example 53: Migration Reversible Data

_ex-53 &middot; exercises co-21_

`upgrade()` splits `person.full_name` into `first_name`/`last_name` with a real `UPDATE ... split_part`;
`downgrade()` merges them back into `full_name` with `first_name || ' ' || last_name`. The original value
`'Ada Lovelace'` survives a full split-then-merge round trip exactly -- a data migration that is
genuinely reversible, not just schema-reversible.

**`learning/code/ex-53-migration-reversible-data/example.py`**

```python
# pyright: strict
"""Example 53: A Data Migration With a REAL downgrade() -- Split, Then Merge Back."""

from __future__ import annotations

import contextlib  # => co-21: swallows alembic's own non-deterministic scaffolding chatter, same reason as Example 48
import io  # => the throwaway buffer redirect_stdout writes that chatter INTO
import os  # => reads connection settings, and builds/removes the scratch project directory
import shutil  # => co-21: cleanup -- removes the scaffolded project directory once this example is done
import tempfile  # => co-21: a fresh, self-contained directory for the scaffolded migration project

from alembic import command  # => co-21: init/revision/upgrade/downgrade -- the same API the alembic CLI itself calls
from alembic.config import Config  # => co-21: every alembic.command function needs one of these as its first argument
from sqlalchemy import create_engine, text  # => co-21: reads the ACTUAL row values back at each stage of the round trip

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance

ENV_PY = (  # => co-21: the SAME minimal env.py pattern from Examples 49-50 -- built as separate, individually-commented lines
    "from alembic import context\n"  # => co-21: `context` is alembic's OWN migration-runtime handle
    "from sqlalchemy import engine_from_config, pool\n\n"  # => co-21: builds a real Engine straight from alembic.ini's own section
    "config = context.config\n"  # => co-21: the SAME Config object bootstrap() constructed, now read back inside env.py
    'target_metadata = config.attributes.get("target_metadata")\n\n\n'  # => None -- this migration is hand-written, not autogenerated
    "def run_migrations_online() -> None:\n"  # => co-21: THE function alembic's runtime calls for a live-connection migration
    "    connectable = engine_from_config(\n"  # => co-21: reads the sqlalchemy.* keys straight out of alembic.ini's own section
    '        config.get_section(config.config_ini_section, {}), prefix="sqlalchemy.", poolclass=pool.NullPool\n'  # => no reuse needed
    "    )\n"  # => a short-lived migration run has no reason to KEEP a pooled connection open afterward
    "    with connectable.connect() as connection:\n"  # => borrows ONE connection for the whole migration run
    "        context.configure(connection=connection, target_metadata=target_metadata)\n"  # => co-21: binds THIS run's connection
    "        with context.begin_transaction():\n"  # => co-21: wraps every upgrade()/downgrade() call in ONE transaction
    "            context.run_migrations()\n\n\n"  # => the actual dispatch -- calls upgrade()/downgrade() on the revision below
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
    return cfg  # => ready for command.revision()/upgrade()/downgrade() calls


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine, used to seed data AND verify each stage of the round trip
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema, about to get the PRE-split table
        conn.execute(text("CREATE TABLE person (id SERIAL PRIMARY KEY, full_name TEXT NOT NULL)"))  # => co-21: the OLD shape
        conn.execute(text("INSERT INTO person (full_name) VALUES ('Ada Lovelace')"))  # => co-21: real data the round trip preserves

    project_dir = tempfile.mkdtemp(prefix="alembic_ex53_")  # => a fresh, throwaway migration project for this example
    # => co-21: contrast this with Example 54 -- SOME data migrations genuinely cannot be undone, and must say so
    cfg = bootstrap(SQLA_URL, project_dir)  # => scaffolds + rewires env.py, matching the earlier Alembic examples' setup

    with contextlib.redirect_stdout(io.StringIO()):  # => swallows "Generating .../0001_split_full_name.py ... done"
        rev = command.revision(cfg, message="split full_name", rev_id="0001")  # => co-21: an EMPTY skeleton, filled in below
    assert rev is not None and not isinstance(rev, list)  # => narrows the Union return type for pyright --strict below
    with open(rev.path, "w") as f:  # => co-21: a data migration -- SCHEMA change AND row-value transformation, both ways
        f.write(  # => upgrade() splits full_name; downgrade() merges first_name/last_name BACK into full_name
            '"""split full_name into first_name and last_name"""\n'  # => the migration's own docstring
            "from typing import Sequence, Union\n"  # => typed to match what command.revision()'s own skeleton generates
            "from alembic import op\n"  # => co-21: `op.add_column`/`op.drop_column` -- schema edits
            "import sqlalchemy as sa\n\n"  # => column TYPES for the new first_name/last_name columns
            'revision: str = "0001"\n'  # => co-21: THIS revision's own id -- matches the rev_id passed to command.revision()
            "down_revision: Union[str, Sequence[str], None] = None\n"  # => None -- the first revision in this project
            "branch_labels: Union[str, Sequence[str], None] = None\n"  # => unused here -- relevant only for branching histories
            "depends_on: Union[str, Sequence[str], None] = None\n\n"  # => unused here -- cross-branch dependency declarations
            "def upgrade() -> None:\n"  # => co-21: FORWARD -- split full_name into two columns, then drop full_name
            '    op.add_column("person", sa.Column("first_name", sa.String, nullable=True))\n'  # => co-21: nullable UNTIL backfilled
            '    op.add_column("person", sa.Column("last_name", sa.String, nullable=True))\n'  # => co-21: same -- populated next
            # => nullable=True on BOTH new columns is deliberate -- existing rows briefly have NULLs until the UPDATE below runs
            "    conn = op.get_bind()\n"  # => co-21: op.get_bind() -- the LIVE connection this migration runs on, for row-level SQL
            "    conn.execute(sa.text(\"UPDATE person SET first_name = split_part(full_name, ' ', 1), "
            "last_name = split_part(full_name, ' ', 2)\"))\n"  # => co-21: THE actual data transformation, one UPDATE
            '    op.alter_column("person", "first_name", nullable=False)\n'  # => co-21: NOW safe to require -- every row is backfilled
            '    op.alter_column("person", "last_name", nullable=False)\n'  # => same tightening for last_name
            '    op.drop_column("person", "full_name")\n\n'  # => co-21: the OLD column is gone -- upgrade() is now complete
            "def downgrade() -> None:\n"  # => co-21: REVERSE -- rebuild full_name from first_name + last_name, then drop both
            '    op.add_column("person", sa.Column("full_name", sa.String, nullable=True))\n'  # => nullable UNTIL backfilled
            # => the SAME add-then-backfill-then-tighten shape as upgrade() above, just mirrored for the opposite direction
            "    conn = op.get_bind()\n"  # => co-21: the same live-connection escape hatch, used in reverse
            "    conn.execute(sa.text(\"UPDATE person SET full_name = first_name || ' ' || last_name\"))\n"  # => co-21: MERGES back
            '    op.alter_column("person", "full_name", nullable=False)\n'  # => tightens once every row is backfilled
            '    op.drop_column("person", "first_name")\n'  # => co-21: removes the split columns -- back to the ORIGINAL shape
            '    op.drop_column("person", "last_name")\n'  # => the round trip is now complete, symmetrically
        )

    with contextlib.redirect_stdout(io.StringIO()):  # => swallows alembic's own noisy status lines
        command.upgrade(cfg, "head")  # => co-21: STEP 1 -- runs the split
    with engine.begin() as conn:  # => a fresh connection to verify the SPLIT state
        first, last = conn.execute(text("SELECT first_name, last_name FROM person")).one()  # => reads the two new columns
    print(f"after upgrade: first={first!r} last={last!r}")  # => Output: after upgrade: first='Ada' last='Lovelace'
    assert (first, last) == ("Ada", "Lovelace")  # => co-21: the UPDATE correctly split the original 'Ada Lovelace'

    with contextlib.redirect_stdout(io.StringIO()):  # => swallows alembic's own noisy status lines
        command.downgrade(cfg, "base")  # => co-21: STEP 2 -- runs the merge, undoing the split
    with engine.begin() as conn:  # => a fresh connection to verify the MERGED-back state
        (full_name,) = conn.execute(text("SELECT full_name FROM person")).one()  # => reads the restored single column
    print(f"after downgrade: full_name={full_name!r}")  # => Output: after downgrade: full_name='Ada Lovelace'
    assert full_name == "Ada Lovelace"  # => co-21: the EXACT original value survived a full split-then-merge round trip
    # => a naive downgrade that just DROPPED first_name/last_name without merging them back would have lost this row's data entirely
    # => co-21: this is what "reversible" means for a DATA migration, not just a schema one -- downgrade() must undo
    # => both the STRUCTURE change and the VALUE transformation, or a rollback silently corrupts real user data

    shutil.rmtree(project_dir)  # => cleanup -- this example's own throwaway project, not a real repository
    print("ex-53 OK")  # => Output: ex-53 OK
```

**Run**: `python3 example.py`

**Output**:

```text
after upgrade: first='Ada' last='Lovelace'
after downgrade: full_name='Ada Lovelace'
ex-53 OK
```

**Key takeaway**: A reversible _data_ migration must undo both the structural change and the value
transformation -- `downgrade()` here re-derives `full_name` from the split columns, not just drops them,
so the original row's value round-trips exactly.

**Why it matters**: Schema-only reversibility (Example 50) is not the same guarantee as data
reversibility -- a `downgrade()` that drops `first_name`/`last_name` without merging them back would
restore the _shape_ of the old schema while permanently losing every row's actual name. Distinguishing
these two levels of "reversible" is essential before trusting any rollback plan involving a data
migration.

---

### Example 54: Migration Irreversible Guard

_ex-54 &middot; exercises co-21_

`upgrade()` drops `person.notes` outright -- its data is genuinely, permanently gone. Rather than a
`downgrade()` that silently `pass`es (lying that a rollback succeeded), this migration's `downgrade()`
explicitly `raise`s `RuntimeError` with a message telling an operator exactly what to do: restore from a
backup, not retry the rollback.

**`learning/code/ex-54-migration-irreversible-guard/example.py`**

```python
# pyright: strict
"""Example 54: A drop-column Migration Whose downgrade() Explicitly REFUSES to Pretend."""

from __future__ import annotations

import contextlib  # => co-21: swallows alembic's own non-deterministic scaffolding chatter, same reason as Example 48
import io  # => the throwaway buffer redirect_stdout writes that chatter INTO
import os  # => reads connection settings, and builds/removes the scratch project directory
import shutil  # => co-21: cleanup -- removes the scaffolded project directory once this example is done
import tempfile  # => co-21: a fresh, self-contained directory for the scaffolded migration project

from alembic import command  # => co-21: init/revision/upgrade/downgrade -- the same API the alembic CLI itself calls
from alembic.config import Config  # => co-21: every alembic.command function needs one of these as its first argument
from alembic.script import ScriptDirectory  # => co-21: used to invoke downgrade() DIRECTLY, so this example can catch its error
from sqlalchemy import create_engine, text  # => co-21: confirms the dropped column's data is GONE after upgrade()

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance

ENV_PY = (  # => co-21: the SAME minimal env.py pattern from Examples 49-53 -- built as separate, individually-commented lines
    "from alembic import context\n"  # => co-21: `context` is alembic's OWN migration-runtime handle
    "from sqlalchemy import engine_from_config, pool\n\n"  # => co-21: builds a real Engine straight from alembic.ini's own section
    "config = context.config\n"  # => co-21: the SAME Config object bootstrap() constructed, now read back inside env.py
    'target_metadata = config.attributes.get("target_metadata")\n\n\n'  # => None -- this migration is hand-written, not autogenerated
    "def run_migrations_online() -> None:\n"  # => co-21: THE function alembic's runtime calls for a live-connection migration
    "    connectable = engine_from_config(\n"  # => co-21: reads the sqlalchemy.* keys straight out of alembic.ini's own section
    '        config.get_section(config.config_ini_section, {}), prefix="sqlalchemy.", poolclass=pool.NullPool\n'  # => no reuse needed
    "    )\n"  # => a short-lived migration run has no reason to KEEP a pooled connection open afterward
    "    with connectable.connect() as connection:\n"  # => borrows ONE connection for the whole migration run
    "        context.configure(connection=connection, target_metadata=target_metadata)\n"  # => co-21: binds THIS run's connection
    "        with context.begin_transaction():\n"  # => co-21: wraps every upgrade()/downgrade() call in ONE transaction
    "            context.run_migrations()\n\n\n"  # => the actual dispatch -- calls upgrade()/downgrade() on the revision below
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
    return cfg  # => ready for command.revision()/upgrade()/downgrade() calls


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine, used to seed data AND verify the post-upgrade state
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema, about to get the SOON-to-be-dropped column
        conn.execute(text("CREATE TABLE person (id SERIAL PRIMARY KEY, notes TEXT)"))  # => co-21: `notes` is what upgrade() drops
        conn.execute(text("INSERT INTO person (notes) VALUES ('irreplaceable free-text notes')"))  # => real data, about to be LOST

    project_dir = tempfile.mkdtemp(prefix="alembic_ex54_")  # => a fresh, throwaway migration project for this example
    # => contrast this with Example 53, where the data change WAS genuinely reversible and downgrade() proved it
    cfg = bootstrap(SQLA_URL, project_dir)  # => scaffolds + rewires env.py, matching the earlier Alembic examples' setup

    with contextlib.redirect_stdout(io.StringIO()):  # => swallows "Generating .../0001_drop_notes.py ... done"
        rev = command.revision(cfg, message="drop notes column", rev_id="0001")  # => co-21: an EMPTY skeleton, filled in below
    assert rev is not None and not isinstance(rev, list)  # => narrows the Union return type for pyright --strict below
    with open(rev.path, "w") as f:  # => co-21: upgrade() DROPS a column outright -- downgrade() cannot honestly restore it
        f.write(  # => the drop is real -- Postgres discards the column's data, no trace remains to reconstruct from
            '"""drop notes column, irreversibly"""\n'  # => the migration's own docstring, naming the trade-off up front
            "from typing import Sequence, Union\n"  # => typed to match what command.revision()'s own skeleton generates
            "from alembic import op\n\n"  # => co-21: `op.drop_column` -- the one-way schema edit this migration performs
            'revision: str = "0001"\n'  # => co-21: THIS revision's own id -- matches the rev_id passed to command.revision()
            "down_revision: Union[str, Sequence[str], None] = None\n"  # => None -- the first revision in this project
            "branch_labels: Union[str, Sequence[str], None] = None\n"  # => unused here -- relevant only for branching histories
            "depends_on: Union[str, Sequence[str], None] = None\n\n"  # => unused here -- cross-branch dependency declarations
            "def upgrade() -> None:\n"  # => co-21: FORWARD -- drops the column; its data is gone the moment this commits
            '    op.drop_column("person", "notes")\n\n'  # => co-21: Postgres discards `notes` for EVERY row, permanently
            "def downgrade() -> None:\n"  # => co-21: REVERSE -- explicitly REFUSES instead of silently pretending to undo it
            "    raise RuntimeError(\n"  # => co-21: a loud, immediate failure -- the honest alternative to a lying no-op downgrade
            '        "irreversible: dropped `person.notes` data cannot be reconstructed -- restore from a backup instead"\n'
            "    )\n"  # => co-21: this message is what an operator SEES if they ever try `alembic downgrade -1` on this revision
        )

    with contextlib.redirect_stdout(io.StringIO()):  # => swallows alembic's own noisy status lines
        command.upgrade(cfg, "head")  # => co-21: runs upgrade() -- `notes` and its data are now genuinely gone
    with engine.begin() as conn:  # => a fresh connection to confirm the column is gone at the DATABASE level, not just in the file
        columns = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'person'"))
        column_names = sorted(row[0] for row in columns)  # => co-21: reads Postgres' OWN catalog, not the migration's own claim
    print(f"columns after upgrade: {column_names}")  # => Output: columns after upgrade: ['id']
    assert column_names == ["id"]  # => co-21: `notes` is truly gone -- there is nothing left for a downgrade to restore
    # => no UPDATE ever copied `notes` anywhere first -- this is what makes the drop genuinely irreversible, not a choice

    script = ScriptDirectory.from_config(cfg)  # => co-21: reads the revision GRAPH so this example can call downgrade() directly
    revision_obj = script.get_revision("0001")  # => co-21: the loaded revision object -- its module holds the downgrade() function
    # => a real `alembic downgrade -1` invocation would load and call this SAME module function, the identical guard fires
    assert revision_obj is not None and revision_obj.module is not None  # => narrows Optional[...] for pyright --strict below
    try:  # => co-21: calling downgrade() directly -- exactly what alembic's own runtime would invoke on a real rollback attempt
        revision_obj.module.downgrade()  # => co-21: THE guard -- raises instead of returning silently
        raise AssertionError("expected RuntimeError")  # => fails loudly if the guard was ever accidentally removed
    except RuntimeError as exc:  # => co-21: the exact, deliberate failure this migration's author wrote
        print(f"downgrade raised: {exc}")  # => Output: downgrade raised: irreversible: dropped `person.notes` data cannot be reconstructed -- restore from a backup instead
        # => an operator reading this message knows EXACTLY what to do next -- a bare `pass` would have told them nothing
    # => co-21: a downgrade() that just `pass`es for an unrecoverable change is WORSE than no downgrade at all -- it tells
    # => an operator "rollback succeeded" while quietly leaving the schema wrong; raising here converts a silent lie
    # => into a loud, honest signal that says exactly what to do instead (restore from backup, not retry the rollback)

    shutil.rmtree(project_dir)  # => cleanup -- this example's own throwaway project, not a real repository
    print("ex-54 OK")  # => Output: ex-54 OK
```

**Run**: `python3 example.py`

**Output**:

```text
columns after upgrade: ['id']
downgrade raised: irreversible: dropped `person.notes` data cannot be reconstructed -- restore from a backup instead
ex-54 OK
```

**Key takeaway**: A `downgrade()` that cannot honestly undo its `upgrade()` should `raise`, not `pass` --
a silent no-op tells an operator "rollback succeeded" while leaving the schema wrong; a loud error tells
them exactly what to do instead.

**Why it matters**: An irreversible migration is a legitimate, common outcome -- dropping a column is
one-way the instant Postgres commits it. The choice that matters is how the migration _communicates_
that fact. A `RuntimeError` with a clear message, raised the moment someone attempts the rollback, is
strictly safer than a `downgrade()` that appears to succeed while doing nothing, because the former fails
fast and the latter fails silently, often much later.

---

### Example 55: Cascade Delete ORM

_ex-55 &middot; exercises co-22_

`relationship(cascade="all, delete-orphan")` propagates `session.delete(parent)` to every loaded child
automatically. Deleting a `Customer` with two `CustomerOrder` children issues three `DELETE` statements
in one transaction, and a fresh read confirms both the children and the parent are gone.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05 -- color-blind friendly, WCAG AA
flowchart TD
    accTitle: Example 55: Cascade Delete ORM
    accDescr: Flowchart with 4 nodes and 3 connections. Nodes: session. delete(customer) cascade=all, delete-orphan, DELETE customer_order child 1, DELETE customer_order child 2, DELETE customer parent, last. Connections: session. delete(customer) cascade=all, delete-orphan to DELETE customer_order child 1, session. delete(customer) cascade=all, delete-orphan to DELETE customer_order child 2, session. delete(customer) cascade=all, delete-orphan to DELETE customer parent, last.
    A["session.<br/>delete(customer)<br/>cascade=all,<br/>delete-orphan"]:::blue
    A --> B["DELETE<br/>customer_order<br/>child 1"]:::orange
    A --> C["DELETE<br/>customer_order<br/>child 2"]:::orange
    A --> D["DELETE customer<br/>parent, last"]:::blue

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-55-cascade-delete-orm/example.py`**

```python
# pyright: strict
"""Example 55: cascade="all, delete-orphan" -- Deleting the Parent Deletes Its Children Too."""

from __future__ import annotations

import os  # => reads connection settings from the environment
from decimal import Decimal  # => money is Decimal, never float -- exact cents, no rounding drift

from sqlalchemy import Engine, ForeignKey, create_engine, select, text  # => co-22: select() confirms the children are GONE
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Customer(Base):  # => co-22: the parent this example deletes, taking its children along
    __tablename__ = "customer"  # => the physical table name -- NO database-level ON DELETE CASCADE here (contrast Example 56)
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column
    orders: Mapped[list["CustomerOrder"]] = relationship(  # => co-22: cascade= is an ORM-level, Session-mediated policy
        back_populates="customer", cascade="all, delete-orphan"
    )  # => co-22: "all" propagates every session operation; "delete-orphan" also deletes a child removed from the list


class CustomerOrder(Base):  # => co-22: the child this example expects to vanish WHEN its parent is deleted through the ORM
    __tablename__ = "customer_order"  # => named to avoid the reserved SQL word "order"
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    customer_id: Mapped[int] = mapped_column(ForeignKey("customer.id"))  # => a PLAIN FK -- no ON DELETE clause of its own
    total: Mapped[Decimal]  # => the order's total, as an exact Decimal
    customer: Mapped[Customer] = relationship(back_populates="orders")  # => the reverse, many-to-one navigation


def reset_schema(engine: Engine) -> None:  # => shared reset helper -- wipes the whole schema, self-contained
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build both tables into
    Base.metadata.create_all(engine)  # => issues CREATE TABLE for both customer and customer_order


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine
    reset_schema(engine)  # => fresh, empty customer and customer_order tables
    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        # => cascade only fires for children the ORM has actually LOADED into this relationship collection already
        ada = Customer(  # => one parent, two children -- both should disappear once ada itself is deleted below
            name="Ada",  # => the parent this example's cascade acts on
            orders=[CustomerOrder(total=Decimal("19.99")), CustomerOrder(total=Decimal("42.50"))],  # => two children, seeded together
        )
        session.add(ada)  # => cascades: registers the parent AND both children as pending
        session.commit()  # => flushes all three INSERTs, so the delete below has real rows to remove

        session.delete(ada)  # => co-22: deletes the PARENT through the Session -- cascade="all" propagates to its children
        session.commit()  # => co-22: flushes BOTH the child DELETEs (from cascade) AND the parent's own DELETE
        # => three DELETE statements total, all inside ONE transaction -- the unit of work (co-12) orders them itself

    with Session(engine) as session:  # => a FRESH session, just to confirm the final state
        remaining_orders = session.execute(select(CustomerOrder)).scalars().all()  # => co-22: checks the CHILD table directly
        remaining_customers = session.execute(select(Customer)).scalars().all()  # => and the PARENT table too
        print(f"orders remaining: {len(remaining_orders)}")  # => Output: orders remaining: 0
        print(f"customers remaining: {len(remaining_customers)}")  # => Output: customers remaining: 0
        assert remaining_orders == [] and remaining_customers == []  # => co-22: BOTH children AND the parent are gone
    # => "delete-orphan" additionally deletes a child REMOVED from ada.orders without deleting ada itself -- "all" alone would not
    # => co-22: cascade="all, delete-orphan" makes `session.delete(ada)` propagate to every loaded child automatically --
    # => this happens entirely IN the ORM's own unit of work, issuing explicit DELETE statements for each child row,
    # => not because Postgres itself has any ON DELETE CASCADE constraint (Example 56 contrasts that alternative)
    print("ex-55 OK")  # => Output: ex-55 OK
```

**Run**: `python3 example.py`

**Output**:

```text
orders remaining: 0
customers remaining: 0
ex-55 OK
```

**Key takeaway**: `cascade="all, delete-orphan"` is a Session-level policy, not a database constraint --
`session.delete(parent)` propagates to every loaded child through the ORM's own unit of work, issuing
explicit `DELETE` statements for each one.

**Why it matters**: Because ORM cascade lives entirely in application code, it only fires when a delete
actually goes through the Session -- a fact Example 56 makes concrete by showing what happens when a
delete bypasses the ORM entirely. Understanding that distinction up front avoids assuming cascade
protection exists where it doesn't.

---

### Example 56: Cascade vs DB Foreign Key

_ex-56 &middot; exercises co-22_

Two parallel table pairs: one relies on ORM `cascade=`, the other on a real Postgres `ON DELETE CASCADE`
foreign key. A raw SQL `DELETE` that bypasses the ORM entirely is blocked outright on the ORM-only pair
(Postgres' default `RESTRICT` behavior) but cascades correctly on the DB-FK pair, regardless of which
code path performed the delete.

**`learning/code/ex-56-cascade-vs-db-fk/example.py`**

```python
# pyright: strict
"""Example 56: ORM cascade vs Database ON DELETE CASCADE -- Only ONE Handles a Raw SQL Bypass."""

from __future__ import annotations

import os  # => reads connection settings from the environment

from sqlalchemy import Engine, ForeignKey, create_engine, text  # => co-22: text() runs the RAW SQL that bypasses the ORM
from sqlalchemy.exc import IntegrityError  # => co-22: what Postgres' OWN foreign-key constraint raises when a raw delete is blocked
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class CustomerOrmOnly(Base):  # => co-22: ORM-level cascade ONLY -- Postgres itself has NO ON DELETE CASCADE on the FK
    __tablename__ = "customer_orm_only"  # => a distinct table so this half of the contrast doesn't collide with the other
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    orders: Mapped[list["OrderOrmOnly"]] = relationship(cascade="all, delete-orphan")  # => co-22: an application-level POLICY


class OrderOrmOnly(Base):  # => the child whose survival depends entirely on going THROUGH the ORM's own Session
    __tablename__ = "order_orm_only"  # => a distinct table for the ORM-only half of the contrast
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    customer_id: Mapped[int] = mapped_column(ForeignKey("customer_orm_only.id"))  # => a PLAIN FK -- no ON DELETE clause


def reset_schema(engine: Engine) -> None:  # => shared reset helper -- wipes the whole schema, self-contained
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema, rebuilt below with BOTH halves of the contrast
    Base.metadata.create_all(engine)  # => builds the ORM-managed half from the mapped classes above
    with engine.begin() as conn:  # => a second connection -- builds the RAW-SQL half with a real ON DELETE CASCADE clause
        conn.execute(text("CREATE TABLE customer_db_fk (id SERIAL PRIMARY KEY)"))  # => co-22: the DB-level parent table
        conn.execute(  # => co-22: the FK constraint ITSELF carries the cascade -- Postgres enforces it, not any Python code
            text("CREATE TABLE order_db_fk (id SERIAL PRIMARY KEY, customer_id INTEGER REFERENCES customer_db_fk(id) ON DELETE CASCADE)")
        )


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine, shared by both halves of this contrast
    reset_schema(engine)  # => builds BOTH the ORM-cascade table pair and the DB-FK-cascade table pair, fresh

    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        session.add(CustomerOrmOnly(id=1, orders=[OrderOrmOnly(id=1, customer_id=1)]))  # => seeds the ORM-cascade half
        session.commit()  # => flushes both rows -- explicit ids so both halves of the contrast line up for the read-back below
    with engine.begin() as conn:  # => seeds the DB-FK-cascade half with a RAW insert -- no ORM classes map to these tables
        conn.execute(text("INSERT INTO customer_db_fk (id) VALUES (1)"))  # => the DB-FK parent row
        conn.execute(text("INSERT INTO order_db_fk (id, customer_id) VALUES (1, 1)"))  # => the DB-FK child row

    orm_only_blocked = False  # => co-22: tracks whether Postgres itself refused the ORM-cascade-only bypass attempt
    try:  # => co-22: BYPASSES the ORM entirely -- a raw DELETE, no Session involved, so cascade="all, delete-orphan" NEVER runs
        with engine.begin() as conn:  # => this whole transaction rolls back automatically the moment the DELETE raises
            conn.execute(text("DELETE FROM customer_orm_only WHERE id = 1"))  # => co-22: skips the ORM's cascade policy entirely
    except IntegrityError:  # => co-22: Postgres' DEFAULT foreign-key behavior (RESTRICT) blocks a delete with live references
        orm_only_blocked = True  # => co-22: no orphan was created -- the delete was refused outright, not silently allowed

    with engine.begin() as conn:  # => co-22: the SAME raw-SQL bypass, now against the table with a REAL ON DELETE CASCADE
        conn.execute(text("DELETE FROM customer_db_fk WHERE id = 1"))  # => co-22: Postgres' own constraint handles it transparently

    with engine.begin() as conn:  # => a fresh connection to read back BOTH halves' final state
        remaining_orm_orders = conn.execute(text("SELECT * FROM order_orm_only")).fetchall()  # => co-22: still there -- the delete failed
        remaining_orm_customers = conn.execute(text("SELECT * FROM customer_orm_only")).fetchall()  # => the parent ALSO still there
        remaining_db_orders = conn.execute(text("SELECT * FROM order_db_fk")).fetchall()  # => co-22: gone -- ON DELETE CASCADE fired

    print(f"raw delete blocked without ON DELETE CASCADE: {orm_only_blocked}")  # => Output: raw delete blocked without ON DELETE CASCADE: True
    print(f"orm-only rows surviving (parent+child): {len(remaining_orm_customers) + len(remaining_orm_orders)}")  # => Output: 2
    print(f"db-fk child rows remaining: {len(remaining_db_orders)}")  # => Output: db-fk child rows remaining: 0
    assert orm_only_blocked and len(remaining_orm_customers) == 1 and len(remaining_orm_orders) == 1  # => co-22: NOTHING was deleted
    assert len(remaining_db_orders) == 0  # => co-22: Postgres' own ON DELETE CASCADE fired regardless of HOW the parent was deleted
    # => co-22: ORM cascade is a Session-level POLICY -- it only runs when a delete goes through session.delete(); a raw
    # => SQL DELETE that bypasses the Session gets NEITHER the ORM's cascade NOR any orphaning -- Postgres' own default
    # => foreign-key behavior (RESTRICT) simply refuses the delete outright, which is safer than silently orphaning rows
    # => but still surprising if you expected `cascade="all, delete-orphan"` to protect every deletion path. A real
    # => ON DELETE CASCADE constraint is enforced by Postgres ITSELF, for every deletion path, with no exceptions --
    # => reach for it whenever data integrity must hold regardless of which code path performs the delete
    print("ex-56 OK")  # => Output: ex-56 OK
```

**Run**: `python3 example.py`

**Output**:

```text
raw delete blocked without ON DELETE CASCADE: True
orm-only rows surviving (parent+child): 2
db-fk child rows remaining: 0
ex-56 OK
```

**Key takeaway**: A raw SQL delete that bypasses the ORM gets neither cascade nor orphaning from
`cascade="all, delete-orphan"` -- Postgres' own default `RESTRICT` behavior just blocks it. Only a real
`ON DELETE CASCADE` foreign-key constraint is enforced by the database itself, for every deletion path.

**Why it matters**: Any code path that writes SQL directly -- a migration, an admin script, a different
service sharing the same database -- bypasses ORM-level cascade entirely, because that policy lives in
Python, not in the schema. Whenever data integrity must hold regardless of which code path performs a
delete, a genuine `ON DELETE CASCADE` constraint is the only guarantee that survives every access path,
not just the ORM's own.

---

← Previous: [Beginner Examples](./beginner.md) &middot; Next: [Advanced Examples](./advanced.md) →
