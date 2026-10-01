---
title: "Beginner Examples"
date: 2026-07-18T00:00:00+07:00
draft: false
weight: 10
---

Examples 1-28 cover the raw PEP 249 DB-API (connect, cursor, parameterized queries, typed row mapping,
`executemany`, transactions), PyPika as a standalone query builder, SQLAlchemy Core's own builder,
declarative ORM mapping, the ORM's CRUD arc, the Active Record vs. Data Mapper contrast, one-to-many and
many-to-many relationships, the identity map, and the session lifecycle. Every example is fully
self-contained: it resets and seeds its own tables against a local PostgreSQL instance, so none of them
depend on state left behind by an earlier example. Run each example with `python3 example.py` from a
shell where this topic's `.venv` is active and a Postgres container is listening on `localhost:5432`
(see [Overview](./overview.md#confirm-your-toolchain)).

---

### Example 1: Spectrum: Same Query, Three Ways

_ex-01 &middot; exercises co-01_

The same "orders with customer name" query, run three ways -- hand-written SQL over the raw DB-API,
composed via the PyPika query builder, and expressed as an ORM object graph -- returns identical rows
every time. The three tiers differ in how much SQL they let you stop writing by hand, not in what they
can ultimately produce.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73 -- color-blind friendly, WCAG AA
flowchart LR
    accTitle: Example 1: Spectrum: Same Query, Three Ways
    accDescr: Flowchart with 4 nodes and 3 connections. Nodes: Tier 1: raw SQL string literal + DB-API, Tier 2: query builder composed Table/Field values, Tier 3: ORM object graph + Session, same rows. Connections: Tier 1: raw SQL string literal + DB-API to same rows, Tier 2: query builder composed Table/Field values to same rows, Tier 3: ORM object graph + Session to same rows.
    A["Tier 1: raw SQL<br/>string literal +<br/>DB-API"]:::blue
    B["Tier 2: query<br/>builder<br/>composed Table/Field<br/>values"]:::orange
    C["Tier 3: ORM<br/>object graph +<br/>Session"]:::teal
    A --> D["same rows"]
    B --> D
    C --> D

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-01-spectrum-same-query-three-ways/example.py`**

```python
# pyright: strict
"""Example 1: Spectrum -- Same Query, Three Ways."""

from __future__ import annotations  # => lets `"CustomerOrder"` below resolve as a forward-referenced type

import os  # => stdlib: reads connection settings from the environment (co-01)
from decimal import Decimal  # => money is Decimal, never float -- exact cents, no rounding drift
from typing import LiteralString, cast  # => acknowledges a runtime-built string is safe to execute (see tier2)

import psycopg  # => Tier 1 + Tier 2 both execute through the raw PEP 249 DB-API (co-02)
from pypika import Order as SortDir  # => PyPika's ASC/DESC enum -- renamed to avoid our own `Order` name
from pypika import Query, Table  # => Tier 2: PyPika builds the query as composable Python values (co-03)
from sqlalchemy import ForeignKey, create_engine, select  # => Tier 3: the SQLAlchemy ORM (co-06)
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship  # => the ORM's typed mapping toolkit

PG_HOST: str = os.environ.get("PG_HOST", "localhost")  # => override for CI / non-default hosts
PG_PORT: str = os.environ.get("PG_PORT", "5432")  # => Postgres' conventional default port
PG_DB: str = os.environ.get("PG_DB", "orm_by_example")  # => one shared database, every example resets its own tables
PG_USER: str = os.environ.get("PG_USER", "postgres")  # => local trust-auth Postgres convention
PG_PASSWORD: str = os.environ.get("PG_PASSWORD", "postgres")  # => matches PG_USER for local dev
PG_DSN: str = f"postgresql://{PG_USER}:{PG_PASSWORD}@{PG_HOST}:{PG_PORT}/{PG_DB}"  # => plain DB-API DSN (Tiers 1-2)
SQLA_URL: str = f"postgresql+psycopg://{PG_USER}:{PG_PASSWORD}@{PG_HOST}:{PG_PORT}/{PG_DB}"  # => SQLAlchemy dialect+driver URL (Tier 3)


def seed_schema() -> None:
    """Reset and seed the shared `customer`/`customer_order` tables (raw SQL -- co-02)."""
    # => every example in this topic owns and resets its own tables -- self-contained, run-in-any-order
    with psycopg.connect(PG_DSN, autocommit=True) as conn:  # => autocommit: DDL needs no explicit commit
        conn.execute("DROP SCHEMA public CASCADE")  # => wipes EVERY table, including any left behind by a DIFFERENT example
        conn.execute("CREATE SCHEMA public")  # => a blank public schema -- fully isolated, run-in-any-order (self-contained)
        conn.execute("CREATE TABLE customer(id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL)")  # => the "one" side of the relationship
        conn.execute("CREATE TABLE customer_order(id SERIAL PRIMARY KEY, customer_id INT NOT NULL REFERENCES customer(id), total NUMERIC(10,2) NOT NULL)")  # => FK ties every order to one customer
        # => customer_order deliberately avoids the bare word "order" -- a reserved SQL keyword every tier would have to quote
        conn.execute("INSERT INTO customer(name, email) VALUES ('Ada', 'ada@example.com'), ('Grace', 'grace@example.com')")  # => two customers, ids 1 and 2
        conn.execute("INSERT INTO customer_order(customer_id, total) VALUES (1, 19.99), (1, 42.50), (2, 8.00)")  # => two orders for Ada, one for Grace


def tier1_raw_sql() -> list[tuple[int, str, Decimal]]:  # => co-01: tier 1 of 3 -- the raw-SQL floor
    """Tier 1: hand-written SQL over the PEP 249 DB-API (co-02) -- the floor of the spectrum."""
    with psycopg.connect(PG_DSN) as conn:  # => a fresh connection -- no builder, no ORM in between
        rows = conn.execute(  # => a plain string-literal JOIN -- nothing composes it for you
            "SELECT o.id, c.name, o.total FROM customer_order o JOIN customer c ON c.id = o.customer_id ORDER BY o.id"
            # => every table name, join condition, and column is typed out by hand as literal text
        ).fetchall()  # => fetchall() materializes every row as a list of tuples right now
    # => psycopg's default row type is a plain, untyped tuple -- Example 4 upgrades this to a typed dataclass
    return [(int(r[0]), str(r[1]), Decimal(r[2])) for r in rows]  # => cast each column so all 3 tiers compare equal


def tier2_query_builder() -> list[tuple[int, str, Decimal]]:  # => co-01: tier 2 of 3 -- the query-builder middle
    """Tier 2: the SAME join, composed as data via PyPika (co-03) -- no string concatenation."""
    order_tbl = Table("customer_order", alias="o")  # => a Table VALUE, not a string -- co-03's core idea
    cust_tbl = Table("customer", alias="c")  # => composable, so it can be reused across multiple queries
    # => co-04: PyPika is a standalone builder library -- Example 12 contrasts it with SQLAlchemy Core's own builder
    query = (
        Query.from_(order_tbl)  # => start the builder tree from customer_order
        .join(cust_tbl)  # => .join() takes another Table value, not a raw "JOIN ..." string
        .on(cust_tbl.id == order_tbl.customer_id)  # => .on() takes a PyPika expression object, not text
        .select(order_tbl.id, cust_tbl.name, order_tbl.total)  # => column list is also composed, not interpolated
        .orderby(order_tbl.id, order=SortDir.asc)  # => ORDER BY is composed the same way as every other clause
    )  # => the tree only becomes SQL text when you ask for it -- nothing has run yet
    with psycopg.connect(PG_DSN) as conn:  # => the SAME DB-API tier executes PyPika's rendered output
        sql_text = cast(LiteralString, str(query))  # => str(query) renders the tree; cast() vouches it is safe to run
        rows = conn.execute(sql_text).fetchall()  # => the DB-API executes PyPika's OUTPUT exactly like Tier 1's own SQL
    # => same DB-API, same tuple rows -- only HOW the SQL text got built differs from Tier 1
    return [(int(r[0]), str(r[1]), Decimal(r[2])) for r in rows]  # => same normalization as Tier 1, for comparison


class Base(DeclarativeBase):  # => co-06: the shared declarative base every mapped class inherits from
    pass  # => carries no columns itself -- purely a registry root for Tier 3's classes below
    # => every DeclarativeBase subclass shares ONE registry -- relationship() lookups (co-08) resolve through it


class Customer(Base):  # => Tier 3's "one" side, mapped from the SAME customer table Tiers 1-2 read
    __tablename__ = "customer"  # => must match the physical table name exactly
    id: Mapped[int] = mapped_column(primary_key=True)  # => Mapped[int] -- co-06's typed column mapping
    name: Mapped[str]  # => column type inferred from the Python type alone -- no mapped_column() needed here
    orders: Mapped[list["CustomerOrder"]] = relationship(back_populates="customer")  # => co-08: one customer, many orders


class CustomerOrder(Base):  # => Tier 3's "many" side, mapped from customer_order
    __tablename__ = "customer_order"  # => again, must match the physical table name exactly
    id: Mapped[int] = mapped_column(primary_key=True)  # => same shape as Customer.id -- every mapped class needs a PK
    customer_id: Mapped[int] = mapped_column(ForeignKey("customer.id"))  # => co-08: the physical FK column
    total: Mapped[Decimal]  # => Mapped[Decimal] round-trips Postgres NUMERIC without precision loss
    customer: Mapped[Customer] = relationship(back_populates="orders")  # => co-08: the reverse navigation, order -> customer


def tier3_orm() -> list[tuple[int, str, Decimal]]:  # => co-01: tier 3 of 3 -- the full ORM ceiling
    """Tier 3: the SAME join, expressed as an object graph via the SQLAlchemy ORM (co-06)."""
    engine = create_engine(SQLA_URL)  # => the engine still emits SQL underneath -- the ORM never bypasses it
    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12) -- opened per request
        stmt = select(CustomerOrder).join(Customer).order_by(CustomerOrder.id)  # => join() infers the FK -- no raw ON clause written
        # => `stmt` is itself a builder tree, much like Tier 2's `query` -- the ORM layers ON TOP of Core, not around it
        results = session.execute(stmt).scalars().all()  # => .scalars() unwraps Row -> CustomerOrder objects directly
        # => `results` is a list of live CustomerOrder objects, not tuples -- this is what "object graph" means
        return [(o.id, o.customer.name, o.total) for o in results]  # => .customer navigates the object graph (co-13, lazy, session still open)


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    seed_schema()  # => one shared dataset every tier below reads -- proves they agree on the SAME rows
    r1 = tier1_raw_sql()  # => run Tier 1
    r2 = tier2_query_builder()  # => run Tier 2
    r3 = tier3_orm()  # => run Tier 3
    print(f"tier1_raw_sql:       {r1}")  # => Output: tier1_raw_sql:       [(1, 'Ada', Decimal('19.99')), (2, 'Ada', Decimal('42.50')), (3, 'Grace', Decimal('8.00'))]
    print(f"tier2_query_builder: {r2}")  # => Output: tier2_query_builder: [(1, 'Ada', Decimal('19.99')), (2, 'Ada', Decimal('42.50')), (3, 'Grace', Decimal('8.00'))]
    print(f"tier3_orm:           {r3}")  # => Output: tier3_orm:           [(1, 'Ada', Decimal('19.99')), (2, 'Ada', Decimal('42.50')), (3, 'Grace', Decimal('8.00'))]
    assert r1 == r2 == r3  # => co-01's whole point: three tiers, one set of rows -- style differs, the answer doesn't
    # => the rest of this topic picks ONE tier per concept -- keep this comparison in mind as the throughline
    print("ex-01 OK")  # => Output: ex-01 OK
```

**Run**: `python3 example.py`

**Output**:

```text
tier1_raw_sql:       [(1, 'Ada', Decimal('19.99')), (2, 'Ada', Decimal('42.50')), (3, 'Grace', Decimal('8.00'))]
tier2_query_builder: [(1, 'Ada', Decimal('19.99')), (2, 'Ada', Decimal('42.50')), (3, 'Grace', Decimal('8.00'))]
tier3_orm:           [(1, 'Ada', Decimal('19.99')), (2, 'Ada', Decimal('42.50')), (3, 'Grace', Decimal('8.00'))]
ex-01 OK
```

**Key takeaway**: raw SQL, a query builder, and an ORM are three points on one spectrum, not three
unrelated technologies -- each one buys more leverage in exchange for hiding more SQL from you.

**Why it matters**: every concept in this topic lives at exactly one of these three tiers, and the rest
of the curriculum will ask you to recognize which tier a piece of code is standing on. Knowing that all
three tiers can express the same query -- and agree on the same answer -- is what makes it possible to
later choose deliberately (co-27) instead of reaching for whichever tier is habitual.

---

### Example 2: DB-API Connect And Cursor

_ex-02 &middot; exercises co-02_

`connect()`, `cursor()`, `execute()`, and `fetchall()` are the entire PEP 249 contract every higher tier
in this topic sits on top of. `connect()` opens one connection; a `Cursor` executes statements against
it and hands back plain tuples.

**`learning/code/ex-02-dbapi-connect-cursor/example.py`**

```python
# pyright: strict
"""Example 2: DB-API Connect + Cursor."""

from __future__ import annotations

import os  # => reads connection settings from the environment (co-02)

import psycopg  # => the PEP 249 DB-API driver for Postgres

PG_DSN: str = os.environ.get(  # => a single DSN string -- host, port, db, user, password all in one place
    "PG_DSN", "postgresql://postgres:postgres@localhost:5432/orm_by_example"
)  # => override PG_DSN in the environment to point at a different Postgres instance


def connect_and_query() -> list[tuple[int, str]]:  # => returns raw (id, name) tuples -- the DB-API's native shape
    # => connect() (co-02) opens a Connection -- one TCP round-trip to the server, nothing queried yet
    with psycopg.connect(PG_DSN, autocommit=True) as conn:  # => autocommit: no transaction to manage for this DDL+query
        cur: psycopg.Cursor[tuple[int, str]] = conn.cursor()  # => a Cursor executes statements against conn
        cur.execute("DROP SCHEMA public CASCADE")  # => wipes EVERY table, including any left behind by a DIFFERENT example
        cur.execute("CREATE SCHEMA public")  # => a blank public schema -- fully isolated, run-in-any-order (self-contained)
        cur.execute("CREATE TABLE greeting(id SERIAL PRIMARY KEY, text TEXT NOT NULL)")  # => a minimal one-column table
        cur.execute("INSERT INTO greeting(text) VALUES ('hello'), ('world')")  # => two rows, ids auto-assigned 1 and 2
        cur.execute("SELECT id, text FROM greeting ORDER BY id")  # => sends the SQL text -- nothing fetched into Python yet
        rows: list[tuple[int, str]] = cur.fetchall()  # => fetchall() pulls every remaining row as a list of tuples
        return rows  # => hands the fully materialized list back to the caller


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    rows = connect_and_query()  # => runs the full connect -> cursor -> execute -> fetchall cycle once
    # => everything above is the PEP 249 DB-API contract (co-02) -- every higher tier in this topic sits on top of it
    for row in rows:  # => iterates the (id, text) tuples one at a time
        print(row)  # => Output: (1, 'hello') then (2, 'world')
    assert rows == [(1, "hello"), (2, "world")]  # => confirms both rows round-tripped in insertion order
    # => no query builder, no ORM -- just connect(), cursor(), execute(), fetchall(): the DB-API's whole surface
    print("ex-02 OK")  # => Output: ex-02 OK
```

**Run**: `python3 example.py`

**Output**:

```text
(1, 'hello')
(2, 'world')
ex-02 OK
```

**Key takeaway**: `connect()` + `cursor()` + `execute()` + `fetchall()` is the whole PEP 249 DB-API --
every query builder and ORM in this topic ultimately calls something like this underneath.

**Why it matters**: this four-call cycle is the lowest common denominator every Python database driver
implements, which is why swapping drivers (SQLite, Postgres, MySQL) rarely requires rewriting
application logic. Understanding it makes every abstraction built on top -- a query builder's rendered
SQL, an ORM's emitted statements -- legible instead of magical, because you can always trace it back to
these four calls.

---

### Example 3: DB-API Parameterized Query

_ex-03 &middot; exercises co-02, co-05_

`%s` placeholders bind values as data, sent to Postgres separately from the SQL text -- a value
containing a stray quote (`O'Brien`) round-trips correctly instead of breaking the statement's syntax.

**`learning/code/ex-03-dbapi-parameterized/example.py`**

```python
# pyright: strict
"""Example 3: DB-API Parameterized Query."""

from __future__ import annotations

import os  # => reads connection settings from the environment (co-02)

import psycopg  # => the PEP 249 DB-API driver for Postgres

PG_DSN: str = os.environ.get(  # => a single DSN string -- host, port, db, user, password all in one place
    "PG_DSN", "postgresql://postgres:postgres@localhost:5432/orm_by_example"
)  # => override PG_DSN in the environment to point at a different Postgres instance


def find_by_name(name: str) -> list[tuple[int, str]]:  # => `name` is untrusted input -- treat it as data, not code
    with psycopg.connect(PG_DSN, autocommit=True) as conn:  # => autocommit: no transaction to manage for this DDL+query
        conn.execute("DROP SCHEMA public CASCADE")  # => wipes EVERY table, including any left behind by a DIFFERENT example
        conn.execute("CREATE SCHEMA public")  # => a blank public schema -- fully isolated, run-in-any-order (self-contained)
        conn.execute("CREATE TABLE greeting(id SERIAL PRIMARY KEY, name TEXT NOT NULL)")  # => a minimal one-column table
        conn.execute("INSERT INTO greeting(name) VALUES (%s), (%s), (%s)", ["Ada", "Grace", "O'Brien"])  # => 3 placeholders, 3 bound values
        # => %s is psycopg's placeholder (co-05) -- the driver sends VALUES separately from the SQL text
        # => "O'Brien" contains a single quote; a naive f-string would have broken the SQL syntax right here
        cur = conn.execute(  # => the SAME %s placeholder style, this time in a WHERE clause
            "SELECT id, name FROM greeting WHERE name = %s ORDER BY id", (name,)
        )  # => `(name,)` -- a one-element tuple; the driver binds it to the single %s above
        rows: list[tuple[int, str]] = cur.fetchall()  # => materializes the matching rows as tuples
        return rows  # => hands the fully materialized list back to the caller


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    rows = find_by_name("O'Brien")  # => the exact value that would break naive string interpolation
    print(rows)  # => Output: [(3, "O'Brien")]
    assert rows == [(3, "O'Brien")]  # => the apostrophe round-tripped correctly -- no syntax error, no injection
    # => co-05: the SQL TEXT never changes between calls -- only the BOUND VALUE changes, which is the whole point
    # => psycopg sends the SQL and the parameters as SEPARATE messages -- the server never re-parses text with data spliced in
    print("ex-03 OK")  # => Output: ex-03 OK
```

**Run**: `python3 example.py`

**Output**:

```text
[(3, "O'Brien")]
ex-03 OK
```

**Key takeaway**: a placeholder (`%s`) keeps the SQL text fixed and sends the value as data on a
separate channel -- correctness for tricky values (`O'Brien`) is a side effect of the same mechanism
that keeps you safe from injection.

**Why it matters**: this is the single habit that separates safe database code from a security incident.
Every raw-SQL example in this topic (Examples 2-6) uses `%s` placeholders, never f-string interpolation,
and Example 11 makes the contrast with unsafe string concatenation explicit. The pattern generalizes
directly to the query builder and ORM tiers, which bind parameters the same way underneath.

---

### Example 4: DB-API Row To Typed Dataclass

_ex-04 &middot; exercises co-02_

A `row_factory` swaps psycopg's default tuple-per-row shape for a typed, frozen dataclass -- the same
raw DB-API, but every fetched row now has named, typed attributes instead of positional indices.

**`learning/code/ex-04-dbapi-row-to-dataclass/example.py`**

```python
# pyright: strict
"""Example 4: DB-API Row -> Typed Dataclass."""

from __future__ import annotations

import os  # => reads connection settings from the environment (co-02)
from dataclasses import dataclass  # => a typed, immutable shape for each row -- better than a bare tuple

import psycopg
from psycopg.rows import class_row  # => a psycopg row_factory that builds a chosen class from each row

PG_DSN: str = os.environ.get(  # => a single DSN string -- host, port, db, user, password all in one place
    "PG_DSN", "postgresql://postgres:postgres@localhost:5432/orm_by_example"
)  # => override PG_DSN in the environment to point at a different Postgres instance


@dataclass(frozen=True)  # => frozen: a fetched row should not silently mutate after the fact
class Greeting:  # => co-02: the typed shape raw DB-API rows get promoted into
    id: int  # => matches the `id` column's SQL type (SERIAL -> Python int)
    text: str  # => matches the `text` column's SQL type (TEXT -> Python str)


def fetch_greetings() -> list[Greeting]:  # => the return type IS the dataclass -- no bare tuples leak out
    with psycopg.connect(PG_DSN, autocommit=True) as conn:  # => autocommit: no transaction to manage for this DDL+query
        conn.execute("DROP SCHEMA public CASCADE")  # => wipes EVERY table, including any left behind by a DIFFERENT example
        conn.execute("CREATE SCHEMA public")  # => a blank public schema -- fully isolated, run-in-any-order (self-contained)
        conn.execute("CREATE TABLE greeting(id SERIAL PRIMARY KEY, text TEXT NOT NULL)")  # => matches Greeting's fields
        conn.execute("INSERT INTO greeting(text) VALUES ('hello'), ('world')")  # => two rows, ids 1 and 2
        # => class_row() is a row_factory: it swaps the DEFAULT tuple-per-row behavior for one typed instance per row
        with conn.cursor(row_factory=class_row(Greeting)) as cur:  # => every fetched row becomes a Greeting, not a tuple
            cur.execute("SELECT id, text FROM greeting ORDER BY id")  # => column NAMES must match Greeting's field names
            return cur.fetchall()  # => already typed as list[Greeting] -- no manual unpacking needed
            # => this promotion is opt-in per cursor -- Example 2's default cursor still returns plain tuples


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    greetings = fetch_greetings()  # => runs the full connect -> class_row -> fetchall cycle once
    for g in greetings:  # => iterates typed Greeting objects, not raw tuples
        print(f"{g.id}: {g.text}")  # => Output: 1: hello then 2: world
        # => `g.id`/`g.text` are named, typed attribute accesses -- not `g[0]`/`g[1]` index lookups
    assert greetings == [Greeting(1, "hello"), Greeting(2, "world")]  # => dataclass equality compares field-by-field
    assert isinstance(greetings[0], Greeting)  # => confirms the row_factory built the CLASS, not a plain tuple
    # => this is the seam co-02's PEP 249 rows and every later tier's typed objects (co-06) both grow from
    print("ex-04 OK")  # => Output: ex-04 OK
```

**Run**: `python3 example.py`

**Output**:

```text
1: hello
2: world
ex-04 OK
```

**Key takeaway**: `row_factory=class_row(SomeDataclass)` turns the DB-API's default untyped tuples into
named, typed objects, with no ORM required.

**Why it matters**: this is the seam between raw SQL and an ORM's typed mapping -- a `row_factory` is a
lightweight, one-cursor-at-a-time version of the same promise `Mapped[]` columns make at the class level
in Example 14. Seeing the small version first makes the ORM's version feel like a natural extension
rather than a separate concept to memorize.

---

### Example 5: DB-API Executemany Batch Insert

_ex-05 &middot; exercises co-02_

`executemany()` runs the same parameterized statement once per row in a sequence of parameter tuples --
one Python call, N bound executions -- and `rowcount` is driver-dependent enough that a portable
verification re-queries the table directly instead.

**`learning/code/ex-05-dbapi-executemany/example.py`**

```python
# pyright: strict
"""Example 5: DB-API executemany -- Batch Insert."""

from __future__ import annotations

import os  # => reads connection settings from the environment (co-02)

import psycopg  # => the PEP 249 DB-API driver for Postgres

PG_DSN: str = os.environ.get(  # => a single DSN string -- host, port, db, user, password all in one place
    "PG_DSN", "postgresql://postgres:postgres@localhost:5432/orm_by_example"
)  # => override PG_DSN in the environment to point at a different Postgres instance


def batch_insert(names: list[str]) -> int:  # => returns the row COUNT actually inserted, for verification
    with psycopg.connect(PG_DSN, autocommit=True) as conn:  # => autocommit: no transaction to manage for this DDL+bulk-write
        conn.execute("DROP SCHEMA public CASCADE")  # => wipes EVERY table, including any left behind by a DIFFERENT example
        conn.execute("CREATE SCHEMA public")  # => a blank public schema -- fully isolated, run-in-any-order (self-contained)
        conn.execute("CREATE TABLE greeting(id SERIAL PRIMARY KEY, name TEXT NOT NULL)")  # => a minimal one-column table
        params_seq: list[tuple[str]] = [(name,) for name in names]  # => one 1-tuple of bound params PER row to insert
        # => executemany() (co-02) runs the SAME parameterized statement once per tuple in params_seq
        with conn.cursor() as cur:  # => a fresh cursor scoped to this batch write
            cur.executemany("INSERT INTO greeting(name) VALUES (%s)", params_seq)  # => one round-trip PLAN, many bound executions
            return cur.rowcount  # => rowcount after executemany() reports the LAST statement's count under psycopg,
            # => so verification below re-queries COUNT(*) instead of trusting this value across drivers


def count_rows() -> int:  # => re-queries the table directly -- the portable way to verify a bulk write landed
    with psycopg.connect(PG_DSN, autocommit=True) as conn:
        row = conn.execute("SELECT COUNT(*) FROM greeting").fetchone()  # => a single aggregate row: (count,)
        assert row is not None  # => the table exists (created above) -- COUNT(*) always returns exactly one row
        return int(row[0])  # => unwraps the single integer count from that one-column row


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    names = ["Ada", "Grace", "Alan", "Katherine"]  # => 4 names -- the batch this example inserts in one call
    batch_insert(names)  # => sends 4 bound executions of the SAME INSERT statement in one executemany() call
    total = count_rows()  # => independently confirms how many rows actually landed
    print(f"total={total}")  # => Output: total=4
    assert total == len(names)  # => every name in the batch produced exactly one row -- none silently dropped
    # => contrast with 4 separate execute() calls: same end result here, but 4 round-trips instead of 1
    # => co-02: executemany() is still the raw DB-API -- no query builder, no ORM batching machinery involved
    print("ex-05 OK")  # => Output: ex-05 OK
```

**Run**: `python3 example.py`

**Output**:

```text
total=4
ex-05 OK
```

**Key takeaway**: `executemany()` is one Python call that drives N bound executions of the same
statement -- fewer round trips than a loop of individual `execute()` calls, with the same placeholder
safety.

**Why it matters**: batch writes are common (data imports, seed scripts, backfills), and `executemany()`
is the DB-API's own answer to "insert many rows without writing a loop by hand." Example 57 revisits
this exact trade-off at the ORM tier, contrasting a per-object `session.add()` loop against a single
Core `insert()` call with a list of parameter dicts -- the same batching idea, one tier up.

---

### Example 6: DB-API Transaction Commit And Rollback

_ex-06 &middot; exercises co-02, co-17_

`commit()` makes every write since the transaction began durable and visible to other connections;
`rollback()` discards all of them. The DB-API opens an implicit transaction on the first write, and
exactly one of `commit()`/`rollback()` always applies before the connection closes.

**`learning/code/ex-06-dbapi-transaction-commit/example.py`**

```python
# pyright: strict
"""Example 6: DB-API Transaction Commit + Rollback."""

from __future__ import annotations

import os  # => reads connection settings from the environment (co-02)

import psycopg  # => the PEP 249 DB-API driver for Postgres

PG_DSN: str = os.environ.get(  # => a single DSN string -- host, port, db, user, password all in one place
    "PG_DSN", "postgresql://postgres:postgres@localhost:5432/orm_by_example"
)  # => override PG_DSN in the environment to point at a different Postgres instance


def setup_table() -> None:  # => resets the shared table once, outside any of the transactions below
    with psycopg.connect(PG_DSN, autocommit=True) as conn:  # => autocommit: DDL needs no explicit commit
        conn.execute("DROP SCHEMA public CASCADE")  # => wipes EVERY table, including any left behind by a DIFFERENT example
        conn.execute("CREATE SCHEMA public")  # => a blank public schema -- fully isolated, run-in-any-order (self-contained)
        conn.execute("CREATE TABLE greeting(id SERIAL PRIMARY KEY, name TEXT NOT NULL)")  # => a minimal one-column table


def count_rows(conn: psycopg.Connection[tuple[int]]) -> int:  # => shared helper: how many rows exist right now
    row = conn.execute("SELECT COUNT(*) FROM greeting").fetchone()  # => a single aggregate row: (count,)
    assert row is not None  # => COUNT(*) always returns exactly one row
    return row[0]  # => unwraps the single integer count


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    setup_table()  # => empty `greeting` table to start
    # => two scenarios follow: one committed write, one rolled-back write -- only the FIRST should persist

    with psycopg.connect(PG_DSN) as conn:  # => NOT autocommit -- psycopg opens an implicit transaction (co-17) on first write
        conn.execute("INSERT INTO greeting(name) VALUES ('Ada')")  # => write happens INSIDE the open transaction
        conn.commit()  # => commit() (co-17) makes the write durable and visible to other connections
    with psycopg.connect(PG_DSN) as conn:  # => a fresh connection, to prove the commit is visible elsewhere
        after_commit = count_rows(conn)  # => reads the count from a DIFFERENT connection than the one that wrote
    print(f"after_commit={after_commit}")  # => Output: after_commit=1
    assert after_commit == 1  # => the committed row is durably visible

    with psycopg.connect(PG_DSN) as conn:  # => a second transaction, this one gets abandoned
        conn.execute("INSERT INTO greeting(name) VALUES ('Grace')")  # => write happens INSIDE this transaction too
        conn.rollback()  # => rollback() (co-17) discards every write since the transaction began
    with psycopg.connect(PG_DSN) as conn:  # => yet another fresh connection, to prove the rollback is durable
        after_rollback = count_rows(conn)  # => should still be 1 -- 'Grace' never actually landed
    print(f"after_rollback={after_rollback}")  # => Output: after_rollback=1
    assert after_rollback == 1  # => rollback() undid the second INSERT -- count did NOT become 2
    # => had we forgotten to call commit() or rollback() at all, closing the connection rolls back by default
    # => co-17: commit() and rollback() are the DB-API's two ways to end a transaction -- exactly one always applies
    print("ex-06 OK")  # => Output: ex-06 OK
```

**Run**: `python3 example.py`

**Output**:

```text
after_commit=1
after_rollback=1
ex-06 OK
```

**Key takeaway**: a write is not durable until `commit()` runs, and `rollback()` discards every write
since the transaction opened -- the greeting count proves both outcomes directly, rather than trusting
the API's own claims.

**Why it matters**: forgetting to commit (or accidentally rolling back) is a classic source of "my
write disappeared" bugs. Every later transaction example in this topic -- ORM `session.begin()`
(Example 43), nested savepoints (Example 44) -- builds on this exact commit/rollback contract; seeing it
at the raw DB-API level first makes the ORM's version legible instead of magical.

---

### Example 7: Query Builder Select

_ex-07 &middot; exercises co-03, co-05_

PyPika builds a `SELECT` from composable Python values -- a `Table`, a list of column names or `Field`
objects -- and only renders SQL text when you explicitly ask for it with `str()`.

**`learning/code/ex-07-querybuilder-select/example.py`**

```python
# pyright: strict
"""Example 7: Query Builder -- SELECT."""

from __future__ import annotations

from pypika import Query, Table  # => co-03: PyPika builds queries as composable Python values, not strings

customer = Table("customer")  # => a Table VALUE -- can be inspected, reused, and combined like any object


def build_select_all() -> str:  # => returns the RENDERED SQL text -- nothing executes here, only builds
    query = Query.from_(customer).select("id", "name", "email")  # => co-03: SELECT list composed from column names
    return str(query)  # => PyPika only renders the builder tree to SQL text when you ask for it


def build_select_columns() -> str:  # => the same table, a NARROWER column list -- same builder API either way
    query = Query.from_(customer).select(customer.id, customer.name)  # => `customer.id` is a Field VALUE, not a string
    return str(query)  # => rendering is always the same final step, regardless of how the tree was built


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    sql_all = build_select_all()  # => builds then renders a SELECT of 3 named columns
    print(sql_all)  # => Output: SELECT "id","name","email" FROM "customer"
    assert sql_all == 'SELECT "id","name","email" FROM "customer"'  # => PyPika double-quotes identifiers by default
    # => co-05: no values are being bound here -- SELECT with a fixed column list has nothing to parameterize

    sql_cols = build_select_columns()  # => builds then renders a SELECT of 2 named columns via Field objects
    print(sql_cols)  # => Output: SELECT "id","name" FROM "customer"
    assert sql_cols == 'SELECT "id","name" FROM "customer"'  # => `customer.id`/`customer.name` render identically to strings
    # => co-03: `customer.id` and the string "id" produced the SAME output -- Field objects are just a typed spelling
    print("ex-07 OK")  # => Output: ex-07 OK
```

**Run**: `python3 example.py`

**Output**:

```text
SELECT "id","name","email" FROM "customer"
SELECT "id","name" FROM "customer"
ex-07 OK
```

**Key takeaway**: `Query.from_(table).select(...)` builds a tree of Python values first and renders SQL
text only when you call `str()` on it -- nothing runs against a database at any point in this example.

**Why it matters**: separating "build the query" from "run the query" is the query builder's core
contribution over string concatenation. It means the SAME builder tree can be inspected, logged, unit
tested, or handed to a different executor without ever touching a database connection -- exactly what
Example 10 does next, feeding this rendered text into the DB-API.

---

### Example 8: Query Builder Where Compose

_ex-08 &middot; exercises co-03, co-05_

Two separate `.where()` calls compose into one `AND`-joined clause -- the filter is built from ordinary
Python values passed as function arguments, never from string surgery on a template.

**`learning/code/ex-08-querybuilder-where-compose/example.py`**

```python
# pyright: strict
"""Example 8: Query Builder -- Composed WHERE."""

from __future__ import annotations

from pypika import Field, Query, Table  # => co-03: WHERE predicates are composed as Field expressions

customer = Table("customer")  # => the table every predicate below is built against


def build_active_in_country(country: str, min_age: int) -> str:  # => co-03: two conditions, composed programmatically
    # => `country` and `min_age` are plain Python values -- the CALLER decides the filter, not string surgery
    query = (
        Query.from_(customer)  # => start the builder tree from the customer table
        .select(customer.id, customer.name)  # => the column list, same as Example 7
        .where(Field("country") == country)  # => first predicate -- a Field compared with `==`, not a string
        .where(Field("age") >= min_age)  # => a SECOND .where() call ANDs onto the first -- no manual "AND" text
    )  # => the tree only becomes SQL text when rendered below -- nothing runs yet
    return str(query)  # => renders the whole composed tree to SQL text on demand


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    sql = build_active_in_country("US", 18)  # => country and min_age are ordinary Python arguments, not string parts
    print(sql)  # => Output: SELECT "id","name" FROM "customer" WHERE "country"='US' AND "age">=18
    assert sql == 'SELECT "id","name" FROM "customer" WHERE "country"=\'US\' AND "age">=18'
    # => co-03: two SEPARATE .where() calls composed into one AND-joined clause -- built from values, not concatenation
    # => swapping "US" for another country string requires no string surgery -- just a different function argument
    # => Example 11 shows why this matters: the SAME composition style keeps user input out of the SQL text entirely
    print("ex-08 OK")  # => Output: ex-08 OK
```

**Run**: `python3 example.py`

**Output**:

```text
SELECT "id","name" FROM "customer" WHERE "country"='US' AND "age">=18
ex-08 OK
```

**Key takeaway**: chaining `.where()` calls composes predicates the same way every other clause in a
query builder composes -- as data, never as concatenated text.

**Why it matters**: dynamic filtering (an admin search form, an API's optional query parameters) is
exactly where hand-written SQL tends to grow fragile string-concatenation logic. Example 66 (Advanced
tier) revisits this same composition pattern at scale, looping over an arbitrary number of filters --
this example is the two-predicate version of that same idea.

---

### Example 9: Query Builder Join

_ex-09 &middot; exercises co-03_

A two-table `JOIN` composes from `Table` and `Field` values -- `.join()`/`.on()` -- and PyPika
automatically qualifies every column with its own table name in the rendered SQL, with no hand-typed
`JOIN ... ON ...` text anywhere.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05 -- color-blind friendly, WCAG AA
flowchart LR
    accTitle: Example 9: Query Builder Join
    accDescr: Flowchart with 3 nodes and 2 connections. Nodes: Query.from_ (customer_order), B, rendered SQL text SELECT ... JOIN ... ON .... Connections: Query.from_ (customer_order) to B, B to rendered SQL text SELECT ... JOIN ... ON ....
    A["Query.from_<br/>(customer_order)"]:::blue
    A --> B[".join(customer,<br/>INNER)<br/>.on(customer.id ==<br/>order.customer_id)"]:::orange
    B --> C["rendered SQL text<br/>SELECT ... JOIN ...<br/>ON ..."]:::blue

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-09-querybuilder-join/example.py`**

```python
# pyright: strict
"""Example 9: Query Builder -- Two-Table JOIN."""

from __future__ import annotations

from pypika import JoinType, Query, Table  # => co-03: JoinType picks INNER/LEFT/etc as a typed enum, not a keyword string

customer = Table("customer")  # => the "one" side of the join
customer_order = Table("customer_order")  # => the "many" side -- named to avoid the reserved word "order"
# => module-level Table values, reused by every function below -- a builder Table is just a plain Python object


def build_orders_with_customer() -> str:  # => co-03: a two-table join, entirely composed from Table/Field values
    query = (
        Query.from_(customer_order)  # => start the builder tree from the "many" side
        .join(customer, JoinType.inner)  # => explicit INNER join -- PyPika defaults to inner if omitted, this spells it out
        .on(customer.id == customer_order.customer_id)  # => .on() takes an expression object comparing two Fields
        .select(customer_order.id, customer.name, customer_order.total)  # => columns pulled from BOTH tables
    )  # => the tree only becomes SQL text when rendered below -- nothing runs yet
    return str(query)  # => renders the whole composed tree to SQL text on demand


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    sql = build_orders_with_customer()  # => builds then renders the join -- no execution, no connection needed
    print(sql)  # => Output: SELECT "customer_order"."id","customer"."name","customer_order"."total" FROM "customer_order" JOIN "customer" ON "customer"."id"="customer_order"."customer_id"
    expected = 'SELECT "customer_order"."id","customer"."name","customer_order"."total" FROM "customer_order" JOIN "customer" ON "customer"."id"="customer_order"."customer_id"'  # => the fully rendered join, one line
    assert sql == expected  # => confirms PyPika qualified every column with its OWN table name automatically
    # => co-03: the JOIN's shape came entirely from Table/Field VALUES -- never a hand-typed "JOIN ... ON ..." string
    # => .join()/.on() compose the SAME way .where() did in Example 8 -- one consistent builder API for every clause
    print("ex-09 OK")  # => Output: ex-09 OK
```

**Run**: `python3 example.py`

**Output**:

```text
SELECT "customer_order"."id","customer"."name","customer_order"."total" FROM "customer_order" JOIN "customer" ON "customer"."id"="customer_order"."customer_id"
ex-09 OK
```

**Key takeaway**: `.join(table).on(condition)` composes a JOIN from the same `Table`/`Field` values as
every other clause -- one consistent builder API, whether you are filtering, joining, or ordering.

**Why it matters**: joins are where hand-written SQL string concatenation gets error-prone fastest --
missing a table qualifier, mistyping a column name across two tables. A builder catches many of these
mistakes as Python errors (wrong attribute name on a `Table`) before the SQL is ever sent, and Example
13 shows the same shape expressed through SQLAlchemy Core's own builder for comparison.

---

### Example 10: Query Builder Execute

_ex-10 &middot; exercises co-03_

A built query only becomes rows once its rendered SQL text is handed to the DB-API's `execute()` --
the builder's whole job is producing correct text; running it is still the driver's job, same as every
raw-SQL example.

**`learning/code/ex-10-querybuilder-execute/example.py`**

```python
# pyright: strict
"""Example 10: Query Builder -- Execute a Built Query."""

from __future__ import annotations

import os  # => reads connection settings from the environment (co-02)
from typing import LiteralString, cast  # => acknowledges a builder-rendered string is safe to execute

import psycopg  # => co-03: the builder only BUILDS -- the DB-API still does the actual talking to Postgres
from pypika import Query, Table

PG_DSN: str = os.environ.get(  # => a single DSN string -- host, port, db, user, password all in one place
    "PG_DSN", "postgresql://postgres:postgres@localhost:5432/orm_by_example"
)  # => override PG_DSN in the environment to point at a different Postgres instance
product = Table("product")  # => the table this example builds a query against


def seed() -> None:  # => resets and seeds the `product` table this example reads from
    with psycopg.connect(PG_DSN, autocommit=True) as conn:  # => autocommit: no transaction to manage for this DDL+write
        conn.execute("DROP SCHEMA public CASCADE")  # => wipes EVERY table, including any left behind by a DIFFERENT example
        conn.execute("CREATE SCHEMA public")  # => a blank public schema -- fully isolated, run-in-any-order (self-contained)
        conn.execute("CREATE TABLE product(id SERIAL PRIMARY KEY, name TEXT NOT NULL, price NUMERIC(10,2) NOT NULL)")  # => NUMERIC for money
        conn.execute("INSERT INTO product(name, price) VALUES ('Widget', 9.99), ('Gadget', 19.99)")  # => two seed rows
        # => Widget is cheap, Gadget is not -- deliberately straddling the $10 filter the query below applies


def run_built_query() -> list[tuple[int, str]]:  # => returns raw tuples -- the DB-API's native shape, same as Tier 1
    query = Query.from_(product).select(product.id, product.name).where(product.price > 10)  # => co-03: built, not typed
    # => `product.price > 10` is a Field COMPARISON object -- PyPika renders it, it does not run it
    sql_text = cast(LiteralString, str(query))  # => render the tree, then vouch it is safe to run
    with psycopg.connect(PG_DSN) as conn:  # => the SAME connect/execute/fetchall cycle Example 2 used directly
        return conn.execute(sql_text).fetchall()  # => the DB-API executes PyPika's rendered output, unchanged
        # => this is co-03's whole shape: BUILD with PyPika, then EXECUTE with the DB-API -- two separate concerns


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    seed()  # => two products: Widget ($9.99) and Gadget ($19.99)
    rows = run_built_query()  # => builds a "price > 10" filter, then actually runs it against Postgres
    print(rows)  # => Output: [(2, 'Gadget')]
    assert rows == [(2, "Gadget")]  # => only Gadget clears the $10 threshold -- Widget was correctly filtered out
    # => co-03's whole point made concrete: the builder produces TEXT, and the DB-API is what actually runs it
    print("ex-10 OK")  # => Output: ex-10 OK
```

**Run**: `python3 example.py`

**Output**:

```text
[(2, 'Gadget')]
ex-10 OK
```

**Key takeaway**: the builder's job stops at producing correct SQL text; executing it is the DB-API's
job, unchanged from Example 2's raw connect/execute/fetchall cycle.

**Why it matters**: separating "compose the query" from "run the query" is what lets a query builder
plug into any DB-API driver without its own execution layer -- the same rendered text this example
produces could run against SQLite, MySQL, or Postgres unchanged (modulo dialect differences), because
the builder never assumed how its output would be executed.

---

### Example 11: Query Builder vs String Safety

_ex-11 &middot; exercises co-05_

The identical SQL-injection payload run through PyPika's builder and through an f-string produces two
different results: the builder escapes the value and keeps it as inert data, while the f-string lets
the payload become executable SQL syntax.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73 -- color-blind friendly, WCAG AA
flowchart TD
    accTitle: Example 11: Query Builder vs String Safety
    accDescr: Flowchart with 7 nodes and 6 connections. Nodes: hostile value x OR 1=1, B, x, f-string f...x... value becomes SQL TEXT, D, inert, E. Connections: hostile value x OR 1=1 to B, B to x, hostile value x OR 1=1 to f-string f...x... value becomes SQL TEXT, B to D, D to inert, f-string f...x... value becomes SQL TEXT to E.
    A["hostile value<br/>x' OR '1'='1"]:::orange
    A --> B["builder .where(name<br/>== x)<br/>value stays DATA"]:::blue
    A --> C["f-string<br/>f'...{x}...'<br/>value becomes SQL<br/>TEXT"]:::orange
    B --> D["0 rows -- inert"]:::teal
    C --> E["every row --<br/>injected"]:::orange

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-11-querybuilder-vs-string-safety/example.py`**

```python
# pyright: strict
"""Example 11: Query Builder vs f-string -- Injection Safety."""

from __future__ import annotations  # => enables modern type-hint syntax across this file

from pypika import Field, Query, Table  # => co-05: comparing a Field to a Python value, not splicing text

customer = Table("customer")  # => the table both approaches below query against
ATTACK_INPUT: str = "x' OR '1'='1"  # => a classic SQL-injection payload -- a single quote breaks naive interpolation


def build_with_pypika(name: str) -> str:  # => co-03 + co-05: the builder approach
    query = Query.from_(customer).select(customer.id).where(Field("name") == name)  # => `name` is a bound VALUE, not text
    return str(query)  # => renders the tree -- PyPika escapes the value while rendering the literal


def build_with_fstring(name: str) -> str:  # => the naive, UNSAFE approach -- shown only to contrast, never to use
    return f'SELECT "id" FROM "customer" WHERE "name"=\'{name}\''  # => splices `name` directly into the SQL text


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    safe_sql = build_with_pypika(ATTACK_INPUT)  # => the SAME attack string, run through the builder
    print(safe_sql)  # => Output: SELECT "id" FROM "customer" WHERE "name"='x'' OR ''1''=''1'
    assert safe_sql == "SELECT \"id\" FROM \"customer\" WHERE \"name\"='x'' OR ''1''=''1'"  # => the attack stayed DATA
    # => PyPika DOUBLED every single quote ('' instead of ') -- the payload became one harmless string literal

    unsafe_sql = build_with_fstring(ATTACK_INPUT)  # => the SAME attack string, spliced with an f-string instead
    print(unsafe_sql)  # => Output: SELECT "id" FROM "customer" WHERE "name"='x' OR '1'='1'
    assert unsafe_sql == "SELECT \"id\" FROM \"customer\" WHERE \"name\"='x' OR '1'='1'"  # => the attack became SQL syntax
    # => the quote in ATTACK_INPUT closed the string EARLY -- "OR '1'='1'" now reads as executable SQL, not data
    # => co-05: this is why every raw-SQL example in this topic (Examples 2-6) used %s placeholders, never f-strings
    assert safe_sql != unsafe_sql  # => co-05: identical input, different SQL -- the builder neutralized it, text didn't
    print("ex-11 OK")  # => Output: ex-11 OK
```

**Run**: `python3 example.py`

**Output**:

```text
SELECT "id" FROM "customer" WHERE "name"='x'' OR ''1''=''1'
SELECT "id" FROM "customer" WHERE "name"='x' OR '1'='1'
ex-11 OK
```

**Key takeaway**: identical attacker-controlled input produces safe SQL through the builder and
exploitable SQL through f-string interpolation -- the difference is entirely in how the value reaches
the SQL text, not in the value itself.

**Why it matters**: SQL injection remains a top real-world vulnerability class precisely because string
interpolation looks convenient right up until it is exploited. This example makes the failure mode
visible rather than theoretical: the exact same `ATTACK_INPUT` string produces two measurably different
SQL statements, one inert and one dangerous, from the SAME Python value.

---

### Example 12: SQLAlchemy Core Table

_ex-12 &middot; exercises co-04, co-03_

SQLAlchemy Core has its own query-builder `Table`, distinct from PyPika's -- a `MetaData` registry plus
typed `Column` objects describe a schema, and `metadata.create_all()` issues the `CREATE TABLE` DDL from
that description.

**`learning/code/ex-12-sqlalchemy-core-table/example.py`**

```python
# pyright: strict
"""Example 12: SQLAlchemy Core -- Table + MetaData."""

from __future__ import annotations

import os  # => reads connection settings from the environment

from sqlalchemy import Column, Integer, MetaData, String, Table, create_engine, inspect, text  # => co-04: Core's own builder

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance

metadata = MetaData()  # => co-04: a MetaData registry -- every Core Table below registers itself here
# => a Core Table describes a schema; it is not itself a query -- co-03's "compose, don't concatenate" idea extends here
customer = Table(  # => co-03 + co-04: SQLAlchemy Core's OWN query-builder Table, not PyPika's
    "customer",  # => the physical table name
    metadata,  # => registers this Table under `metadata` -- required as Core's second positional argument
    Column("id", Integer, primary_key=True),  # => a Core Column, typed via SQLAlchemy's own type objects
    Column("name", String, nullable=False),  # => String maps to Postgres TEXT/VARCHAR; nullable=False -> NOT NULL
)


def create_and_inspect() -> list[str]:  # => returns the column names Postgres actually stored, for verification
    engine = create_engine(SQLA_URL)  # => a Core engine -- no ORM classes involved anywhere in this example
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table, not just this example's own
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema -- fully isolated from other examples
    metadata.create_all(engine)  # => co-04: Core ISSUES the CREATE TABLE DDL from the Table object above
    inspector = inspect(engine)  # => Inspector reads the database's OWN catalog, independent of our Table object
    return [col["name"] for col in inspector.get_columns("customer")]  # => what Postgres actually has, not what we assumed
    # => Inspector.get_columns() round-trips through Postgres' information_schema -- it cannot be fooled by a stale Table


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    columns = create_and_inspect()  # => creates the table, then reads its columns back from Postgres itself
    print(columns)  # => Output: ['id', 'name']
    assert columns == ["id", "name"]  # => confirms the physical schema matches the Core Table definition exactly
    # => co-04: this Table is METADATA -- a Python description of a schema -- not a query by itself
    # => Example 14 reuses this SAME idea, but attaches Python behavior to the mapped class -- that's the ORM's addition
    print("ex-12 OK")  # => Output: ex-12 OK
```

**Run**: `python3 example.py`

**Output**:

```text
['id', 'name']
ex-12 OK
```

**Key takeaway**: SQLAlchemy Core's `Table` + `MetaData` is a SECOND, distinct query-builder library from
PyPika -- both compose queries as data, but Core's `Table` doubles as schema metadata `create_all()` can
turn into real DDL.

**Why it matters**: understanding that "SQLAlchemy" is really two layers -- Core (a query builder) and
the ORM (built on top of Core) -- prevents a common confusion where "the ORM" gets blamed for behavior
that actually comes from Core underneath. Every ORM `select()` in this topic compiles down through
exactly this same Core layer.

---

### Example 13: SQLAlchemy Core Select

_ex-13 &middot; exercises co-03, co-05_

A Core `select()` construct builds a filtered query from `Table.c` column accessors; `compile()` renders
the SQL for display, while `execute()` still binds the filter value as a real parameter, not literal
text.

**`learning/code/ex-13-sqlalchemy-core-select/example.py`**

```python
# pyright: strict
"""Example 13: SQLAlchemy Core -- select()."""

from __future__ import annotations

import os  # => reads connection settings from the environment

from sqlalchemy import Column, Integer, MetaData, String, Table, create_engine, select, text  # => co-03: Core's builder

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance

metadata = MetaData()  # => co-04: registers every Core Table defined against it
product = Table(  # => the Core Table this example's select() statement queries
    "product",
    metadata,
    Column("id", Integer, primary_key=True),  # => auto-incrementing primary key
    Column("name", String, nullable=False),  # => product name -- required
    Column("price_cents", Integer, nullable=False),  # => cents, not a float, to avoid rounding drift (co-05 spirit)
)


def build_and_run() -> tuple[str, list[tuple[int, str]]]:  # => returns BOTH the emitted SQL text and the fetched rows
    engine = create_engine(SQLA_URL)  # => a Core engine -- manages the connection pool for every statement below
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build the fresh Table into
    metadata.create_all(engine)  # => issues CREATE TABLE product from the Table object above
    stmt = select(product.c.id, product.c.name).where(product.c.price_cents > 1000)  # => co-03: a Core select() construct
    # => `product.c.id` accesses a Column by name -- `.c` is Core's column collection on every Table
    # => `stmt` is still just a builder tree here -- nothing has executed against Postgres yet
    compiled = stmt.compile(engine, compile_kwargs={"literal_binds": True})  # => renders WITH bound values inlined, for display
    # => literal_binds=True is a DISPLAY-ONLY convenience -- the actual execute() below still binds parameters (co-05)
    with engine.begin() as conn:  # => a second transaction: seed 2 rows, then run the select from above
        conn.execute(product.insert().values(name="Widget", price_cents=999))  # => below the $10.00 threshold
        conn.execute(product.insert().values(name="Gadget", price_cents=1999))  # => above the $10.00 threshold
        result = conn.execute(stmt)  # => co-05: the DRIVER binds price_cents=1000 as a real parameter, not literal text
        rows = [(int(r[0]), str(r[1])) for r in result.fetchall()]  # => normalize Row objects to plain tuples
    return str(compiled), rows  # => the display-only SQL text, plus the actually-fetched rows


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    sql_text, rows = build_and_run()  # => builds, creates schema, seeds 2 rows, and runs the filtered select once
    print(sql_text)  # => Output: SELECT product.id, product.name  FROM product  WHERE product.price_cents > 1000
    # => compile() prints on 3 lines (SELECT / FROM / WHERE) -- SQLAlchemy's default multi-line pretty-printing
    print(rows)  # => Output: [(2, 'Gadget')]
    assert "product.price_cents > 1000" in sql_text  # => confirms the WHERE clause compiled as expected
    assert rows == [(2, "Gadget")]  # => only Gadget clears the threshold -- Widget was correctly filtered out
    # => co-03 + co-05: Core BUILDS the statement tree; the engine still binds parameters when it actually executes
    # => co-04: this IS SQLAlchemy's own builder, contrasted with PyPika (Example 7-11) -- both compose queries as data
    print("ex-13 OK")  # => Output: ex-13 OK
```

**Run**: `python3 example.py`

**Output**:

```text
SELECT product.id, product.name  FROM product  WHERE product.price_cents > 1000
[(2, 'Gadget')]
ex-13 OK
```

**Key takeaway**: `compile(compile_kwargs={"literal_binds": True})` is a display-only convenience --
`execute()` still binds `price_cents > 1000` as a real driver parameter, never as literal SQL text.

**Why it matters**: mixing up "what compile() prints for humans to read" with "what actually gets sent
to the database" is a common source of confusion once teams start logging SQL for debugging. This
example keeps the two paths visibly separate: one call renders for display, a different call executes
with real parameter binding.

---

### Example 14: Declarative Model Basic

_ex-14 &middot; exercises co-06_

A `DeclarativeBase` subclass with `Mapped[]`-typed class attributes is simultaneously a Python class and
a table description -- `Base.metadata.create_all()` still issues plain `CREATE TABLE` DDL underneath,
exactly like Core's `Table` did in Example 12.

**`learning/code/ex-14-declarative-model-basic/example.py`**

```python
# pyright: strict
"""Example 14: Declarative ORM Mapping -- DeclarativeBase + Mapped[]."""

from __future__ import annotations

import os  # => reads connection settings from the environment

from sqlalchemy import create_engine, inspect, text  # => inspect(): reads back what Postgres actually stored
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column  # => co-06: the ORM's typed mapping toolkit

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in a program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root that Customer below attaches to
    # => Base.metadata (used below) is the SAME concept as Core's MetaData object from Example 12


class Customer(Base):  # => co-06: a Python CLASS that is ALSO a mapped database table
    __tablename__ = "customer"  # => the physical table name this class maps to
    id: Mapped[int] = mapped_column(primary_key=True)  # => Mapped[int] -- the type hint IS the column's Python type
    name: Mapped[str]  # => Mapped[str] alone (no mapped_column()) still infers a NOT NULL TEXT column


def create_and_inspect() -> list[str]:  # => returns the column names Postgres actually stored, for verification
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine -- same engine type Core used in Examples 12-13
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build Customer's table into
    Base.metadata.create_all(engine)  # => co-06: the ORM still issues plain CREATE TABLE DDL underneath
    inspector = inspect(engine)  # => Inspector reads the database's OWN catalog, independent of the Customer class
    return [col["name"] for col in inspector.get_columns("customer")]  # => what Postgres actually has, not what we assumed


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    columns = create_and_inspect()  # => creates Customer's table, then reads its columns back from Postgres itself
    print(columns)  # => Output: ['id', 'name']
    assert columns == ["id", "name"]  # => confirms the physical schema matches Customer's Mapped[] fields exactly
    # => co-06: Customer is BOTH a Python class AND a table description -- Core's Table (Example 12) was only the latter
    # => `Customer(id=1, name="Ada")` builds a normal Python object -- Example 16 shows persisting it
    print("ex-14 OK")  # => Output: ex-14 OK
```

**Run**: `python3 example.py`

**Output**:

```text
['id', 'name']
ex-14 OK
```

**Key takeaway**: `DeclarativeBase` + `Mapped[]` fuses a Core `Table` description and a Python class
into one declaration -- the class IS the table, not a separate object holding a reference to one.

**Why it matters**: this fusion is the ORM's actual contribution over Core -- Example 12's `Table` is
purely schema metadata, with no way to build a `Customer(name="Ada")` instance from it. Every relationship
(co-08), lazy load (co-13), and unit-of-work behavior (co-12) in this topic depends on this fused
class-is-table shape existing first, so getting it right here pays off in every later example.

---

### Example 15: Declarative Typed Columns

_ex-15 &middot; exercises co-06_

`Mapped[bool]`, `Mapped[str | None]`, and `Mapped[datetime]` each infer a matching Postgres column type
from the Python annotation alone, and every value round-trips as the correct native Python type on
reload -- a bool comes back as `bool`, not Postgres' underlying `0`/`1`.

**`learning/code/ex-15-declarative-typed-columns/example.py`**

```python
# pyright: strict
"""Example 15: Declarative ORM Mapping -- More Mapped[] Types."""

from __future__ import annotations

import os  # => reads connection settings from the environment
from datetime import datetime  # => co-06: Mapped[datetime] maps to a Postgres TIMESTAMP

from sqlalchemy import create_engine, select, text
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column  # => co-06: the ORM's typed mapping toolkit

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Product(Base):  # => co-06: a class deliberately spanning several distinct Python types
    __tablename__ = "product"  # => the physical table name this class maps to
    id: Mapped[int] = mapped_column(primary_key=True)  # => int -> INTEGER
    name: Mapped[str]  # => str -> TEXT NOT NULL
    in_stock: Mapped[bool]  # => bool -> BOOLEAN -- SQLAlchemy infers this from the Python type alone
    notes: Mapped[str | None]  # => str | None -> a NULLABLE TEXT column, using PEP 604's union syntax
    created_at: Mapped[datetime]  # => datetime -> TIMESTAMP -- round-trips as a real Python datetime, not a string


def roundtrip() -> Product:  # => returns the SAME row, reloaded fresh from Postgres in a SEPARATE session
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine, shared by both sessions below
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build Product's table into
    Base.metadata.create_all(engine)  # => issues CREATE TABLE product from the Mapped[] fields above
    now = datetime(2026, 1, 1, 12, 0, 0)  # => a fixed timestamp -- keeps this example's output deterministic
    # => using datetime.now() here would make the printed Output different on every run
    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        session.add(Product(name="Widget", in_stock=True, notes=None, created_at=now))  # => notes deliberately left NULL
        session.commit()  # => flushes and commits the INSERT in one call
        # => Product(...) here is ordinary Python object construction -- keyword args exactly match the Mapped[] fields
    with Session(engine) as session:  # => a FRESH session -- proves the values came from Postgres, not Python memory
        # => scalar_one() returns the single mapped OBJECT directly -- not a Row wrapping it, and not a list
        return session.execute(select(Product)).scalar_one()  # => scalar_one(): exactly one row, or it raises


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    product = roundtrip()  # => runs the full create -> insert -> commit -> reload cycle once
    print(f"{product.name!r} in_stock={product.in_stock} notes={product.notes!r} created_at={product.created_at}")
    # => Output: 'Widget' in_stock=True notes=None created_at=2026-01-01 12:00:00
    assert isinstance(product.in_stock, bool)  # => co-06: reloaded as a real Python bool, not the integer 0/1 Postgres stores it as
    assert product.notes is None  # => the NULL column round-tripped as Python None, not the string "None" or ""
    assert isinstance(product.created_at, datetime)  # => reloaded as a real datetime object, not an ISO-format string
    # => every Mapped[] hint above matched its RELOADED Python type -- co-06's promise made concrete, one field at a time
    print("ex-15 OK")  # => Output: ex-15 OK
```

**Run**: `python3 example.py`

**Output**:

```text
'Widget' in_stock=True notes=None created_at=2026-01-01 12:00:00
ex-15 OK
```

**Key takeaway**: `Mapped[bool]`, `Mapped[str | None]`, and `Mapped[datetime]` each reload as the exact
Python type the annotation names -- the typed mapping is not just for `pyright`'s benefit, it governs
what comes back at runtime too.

**Why it matters**: this is what makes `pyright --strict` a meaningful check on ORM code rather than
decoration -- a `Mapped[str]` field genuinely cannot be `None` at runtime once this mapping is in place,
so the typechecker's promise and the database's actual behavior stay in sync, catching a whole class of
"forgot to check for NULL" bugs before the code ever runs.

---

### Example 16: ORM Insert Object

_ex-16 &middot; exercises co-06, co-17_

`Customer(name="Ada")` is a plain, transient Python object with no primary key yet; `session.add()`
registers it as pending, and `session.commit()` flushes the `INSERT` and populates `ada.id` on the SAME
object as a side effect.

**`learning/code/ex-16-orm-insert-object/example.py`**

```python
# pyright: strict
"""Example 16: ORM Insert -- Add an Object, Commit."""

from __future__ import annotations

import os  # => reads connection settings from the environment

from sqlalchemy import Engine, create_engine, text  # => Engine: the typed handle every helper below takes
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column  # => co-06 + co-17: object graph + session

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Customer(Base):  # => co-06: the mapped class this example inserts an instance of
    __tablename__ = "customer"  # => the physical table name this class maps to
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres -- never set by hand below
    name: Mapped[str]  # => a required TEXT column


def reset_schema(engine: Engine) -> None:  # => shared reset helper, same "wipe the whole schema" pattern as before
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build Customer's table into
    Base.metadata.create_all(engine)  # => issues CREATE TABLE customer from Customer's Mapped[] fields


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine
    reset_schema(engine)  # => fresh, empty customer table

    ada = Customer(name="Ada")  # => co-06: an ordinary Python object -- NOT yet a row in Postgres
    print(f"before commit: id={ada.id}")  # => Output: before commit: id=None
    # => co-17: `ada` is TRANSIENT -- it exists only in Python memory, with no primary key assigned yet
    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        session.add(ada)  # => registers `ada` as PENDING -- still no INSERT has run yet
        session.commit()  # => co-17: flushes the pending INSERT, then commits the transaction in one call
        print(f"after commit: id={ada.id}")  # => Output: after commit: id=1
    # => co-17: Postgres assigned the primary key DURING flush -- commit() populated `ada.id` as a side effect
    assert ada.id == 1  # => confirms the SAME Python object now carries the database-assigned id
    # => co-06 + co-17: `session.add()` plus `session.commit()` is the ORM's entire "persist this" vocabulary
    print("ex-16 OK")  # => Output: ex-16 OK
```

**Run**: `python3 example.py`

**Output**:

```text
before commit: id=None
after commit: id=1
ex-16 OK
```

**Key takeaway**: `session.add()` + `session.commit()` is the ORM's entire "persist this object"
vocabulary -- the same Python object gains its database-assigned primary key as a side effect of commit.

**Why it matters**: seeing `ada.id` change from `None` to `1` on the SAME object, rather than a new
object being returned, is the first concrete evidence that the ORM tracks identity by object reference,
not by copying data back and forth -- the foundation Example 27's identity map and Example 32's dirty
tracking both build on directly.

---

### Example 17: ORM Query Select

_ex-17 &middot; exercises co-06_

`session.execute(select(Model))` returns live mapped OBJECTS, not tuples -- `.scalars().all()` unwraps
each result row into a `Customer` instance you can access by attribute, exactly like the object you
constructed in Example 16.

**`learning/code/ex-17-orm-query-select/example.py`**

```python
# pyright: strict
"""Example 17: ORM Query -- session.execute(select(Model))."""

from __future__ import annotations

import os  # => reads connection settings from the environment

from sqlalchemy import Engine, create_engine, select, text  # => co-06: select() drives the ORM, exactly like Core
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column


SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Customer(Base):  # => co-06: the mapped class this example queries
    __tablename__ = "customer"  # => the physical table name this class maps to
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
    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        session.add_all([Customer(name="Ada"), Customer(name="Grace")])  # => two pending objects, one call
        session.commit()  # => flushes both INSERTs and commits in one call
        # => this seeding session is fully closed before the query session below even opens

    with Session(engine) as session:  # => a FRESH session -- proves the query below re-reads from Postgres
        stmt = select(Customer).order_by(Customer.id)  # => co-06: select() targets the MAPPED CLASS, not a Core Table
        # => `stmt` composes exactly like Core's select() (Example 13) -- the ORM layers ON TOP of Core, not around it
        customers = session.execute(stmt).scalars().all()  # => .scalars(): unwraps Row -> Customer objects directly
    names = [c.name for c in customers]  # => each `c` is a live Customer OBJECT -- attribute access, not row indexing
    print(names)  # => Output: ['Ada', 'Grace']
    assert names == ["Ada", "Grace"]  # => confirms both rows returned, in id order, as typed objects
    assert all(isinstance(c, Customer) for c in customers)  # => co-06: session.execute(select(Model)) yields Model instances
    # => `customers[0].name` works right away -- no dictionary lookups, no positional tuple indexing
    # => contrast with Tier 1/2 (Examples 2, 10): those returned plain tuples -- this returns the mapped CLASS itself
    print("ex-17 OK")  # => Output: ex-17 OK
```

**Run**: `python3 example.py`

**Output**:

```text
['Ada', 'Grace']
ex-17 OK
```

**Key takeaway**: `.scalars().all()` unwraps a `select(Model)` result into a list of the mapped class's
own instances -- `.name` attribute access, never `row[1]` positional indexing.

**Why it matters**: this is the concrete payoff of Example 14's declarative mapping -- once a class is
mapped, every query against it returns objects of that same class, with IDE autocomplete and
`pyright --strict` checking every attribute access. Contrast directly with Examples 2 and 10, which
returned the same shape of data as untyped tuples.

---

### Example 18: ORM Update Object

_ex-18 &middot; exercises co-06, co-12_

Mutating a loaded object's attribute (`loaded.name = "Ada Lovelace"`) and calling `session.commit()`
produces exactly one `UPDATE` statement -- no explicit SQL was written for the write itself, only for
the read that loaded the object.

**`learning/code/ex-18-orm-update-object/example.py`**

```python
# pyright: strict
"""Example 18: ORM Update -- Mutate + Commit."""

from __future__ import annotations

import os  # => reads connection settings from the environment
from typing import Any  # => the event hook's callback signature is untyped by SQLAlchemy's own stubs

from sqlalchemy import Engine, create_engine, event, select, text  # => event: hooks into the engine's own SQL emission
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Customer(Base):  # => co-06 + co-12: the mapped class this example mutates in place
    __tablename__ = "customer"
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => the column this example changes


def reset_schema(engine: Engine) -> None:  # => shared reset helper -- wipes the whole schema, self-contained
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build Customer's table into
    Base.metadata.create_all(engine)  # => issues CREATE TABLE customer from Customer's Mapped[] fields


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine
    reset_schema(engine)  # => fresh, empty customer table
    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        ada = Customer(name="Ada")  # => the object this example will load, mutate, and re-save
        session.add(ada)  # => registers `ada` as pending
        session.commit()  # => flushes the INSERT, assigns ada.id
        ada_id = ada.id  # => reads `id` INSIDE the still-open session -- avoids a DetachedInstanceError below

    statements: list[str] = []  # => co-12: every SQL statement the ORM emits, captured for verification below

    def on_execute(conn: Any, cursor: Any, statement: str, *rest: Any) -> None:  # => untyped hook params (co-12's plumbing)
        statements.append(statement)  # => records the RAW SQL text SQLAlchemy is about to send to Postgres
        # => this same "before_cursor_execute" hook is how Example 42 later counts N+1 queries too

    event.listens_for(engine, "before_cursor_execute")(on_execute)  # => attaches the hook to every statement on `engine`
    # => from here on, EVERY statement this engine runs gets appended to `statements`, seed writes included

    with Session(engine) as session:  # => a FRESH session -- loads Ada, mutates her, and commits the change
        loaded = session.execute(select(Customer).where(Customer.id == ada_id)).scalar_one()  # => reload by PK
        loaded.name = "Ada Lovelace"  # => co-12: mutating a PERSISTENT object -- no explicit UPDATE statement written
        session.commit()  # => co-12: the Session detects the change and flushes exactly one UPDATE

    update_statements = [s for s in statements if s.strip().upper().startswith("UPDATE")]  # => filters the captured SQL
    print(update_statements)  # => Output: ['UPDATE customer SET name=%(name)s::VARCHAR WHERE customer.id = %(customer_id)s::INTEGER']
    assert len(update_statements) == 1  # => confirms exactly one UPDATE was emitted -- the mutation, and only that
    # => not two, not zero -- the Session batches the single change into a single statement (foreshadows co-12's dirty tracking)
    assert "customer" in update_statements[0].lower()  # => confirms it targeted the customer table
    assert "name" in update_statements[0]  # => confirms the SET clause targeted exactly the column that changed
    # => co-12: this is the Session's unit-of-work in action -- Python attribute assignment BECOMES a SQL UPDATE
    # => contrast with Core (Example 13): there, you write conn.execute(table.update()...) explicitly -- here, you don't
    print("ex-18 OK")  # => Output: ex-18 OK
```

**Run**: `python3 example.py`

**Output**:

```text
['UPDATE customer SET name=%(name)s::VARCHAR WHERE customer.id = %(customer_id)s::INTEGER']
ex-18 OK
```

**Key takeaway**: plain Python attribute assignment on a persistent object becomes a SQL `UPDATE` at
commit time -- no explicit `conn.execute(table.update()...)` call is written anywhere.

**Why it matters**: this is the first concrete evidence of unit-of-work bookkeeping (co-12) in action --
the Session noticed exactly one attribute changed and emitted exactly one targeted `UPDATE`. Example 32
returns to this same capture technique to prove the UPDATE only mentions the COLUMN that actually
changed, not every column on the row.

---

### Example 19: ORM Delete Object

_ex-19 &middot; exercises co-06_

`session.delete(loaded)` marks an object for removal; the actual `DELETE FROM customer WHERE customer.id
= ...` statement waits for `session.commit()`, symmetrical with `add()` + `commit()` from Example 16.

**`learning/code/ex-19-orm-delete-object/example.py`**

```python
# pyright: strict
"""Example 19: ORM Delete -- session.delete() + Commit."""

from __future__ import annotations

import os  # => reads connection settings from the environment
from typing import Any  # => the event hook's callback signature is untyped by SQLAlchemy's own stubs

from sqlalchemy import Engine, create_engine, event, select, text  # => event: hooks into the engine's own SQL emission
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Customer(Base):  # => co-06: the mapped class this example deletes an instance of
    __tablename__ = "customer"
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
    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        ada = Customer(name="Ada")  # => the object this example will load, then delete
        session.add(ada)  # => registers `ada` as pending
        session.commit()  # => flushes the INSERT, assigns ada.id
        ada_id = ada.id  # => reads `id` INSIDE the still-open session -- avoids a DetachedInstanceError below

    statements: list[str] = []  # => every SQL statement the ORM emits, captured for verification below

    def on_execute(conn: Any, cursor: Any, statement: str, *rest: Any) -> None:  # => untyped hook params (SQLAlchemy's own)
        statements.append(statement)  # => records the RAW SQL text SQLAlchemy is about to send to Postgres

    event.listens_for(engine, "before_cursor_execute")(on_execute)  # => attaches the hook to every statement on `engine`
    # => from here on, EVERY statement this engine runs gets appended to `statements`
    # => same capture technique as Example 18 -- reused here to verify DELETE instead of UPDATE

    with Session(engine) as session:  # => a FRESH session -- loads Ada, then deletes her
        loaded = session.execute(select(Customer).where(Customer.id == ada_id)).scalar_one()  # => reload by PK
        session.delete(loaded)  # => co-06: marks `loaded` for deletion -- no DELETE statement written yet
        session.commit()  # => flushes the pending delete as one DELETE statement, then commits
        # => co-12: same unit-of-work pattern as the UPDATE in Example 18 -- the change waits for flush, not for the call site

    delete_statements = [s for s in statements if s.strip().upper().startswith("DELETE")]  # => filters the captured SQL
    print(delete_statements)  # => Output: ['DELETE FROM customer WHERE customer.id = %(id)s::INTEGER']
    assert len(delete_statements) == 1  # => confirms exactly one DELETE was emitted for the one deleted object
    # => not a `DROP TABLE`, not a bulk `DELETE FROM customer` -- one row, targeted by its primary key

    with Session(engine) as session:  # => a THIRD session -- confirms the row is actually gone from Postgres
        remaining = session.execute(select(Customer)).scalars().all()  # => everything left in the customer table
    print(remaining)  # => Output: []
    assert remaining == []  # => co-06: the row is gone -- session.delete() + commit() is symmetrical with add() + commit()
    # => co-06's full CRUD arc across Examples 16-19: add() -> INSERT, mutate -> UPDATE, delete() -> DELETE
    print("ex-19 OK")  # => Output: ex-19 OK
```

**Run**: `python3 example.py`

**Output**:

```text
['DELETE FROM customer WHERE customer.id = %(id)s::INTEGER']
[]
ex-19 OK
```

**Key takeaway**: `session.delete()` + `commit()` closes the CRUD arc symmetrically with `add()` +
`commit()` -- both wait for flush, and both target exactly one row by primary key.

**Why it matters**: Examples 16-19 together demonstrate the ORM's complete CRUD vocabulary: `add()`,
`select()`, mutate-then-`commit()`, and `delete()`. Every one of these produces exactly the SQL you would
expect, captured and verified rather than assumed -- the ORM is not hiding extra writes or silently
batching unrelated changes, a property every later, more complex example in this topic still relies on.

---

### Example 20: Active Record Peewee Model

_ex-20 &middot; exercises co-07_

In peewee, the object persists itself: `ada.save()` is a method call on `ada`, with no separate session
object involved -- contrast this with Example 16, where a `Session` did the persisting on SQLAlchemy's
behalf.

**`learning/code/ex-20-activerecord-peewee-model/example.py`**

```python
# pyright: strict
"""Example 20: Active Record -- peewee Model.create()/.save()."""

from __future__ import annotations

import os  # => reads connection settings from the environment

import peewee  # => co-07: peewee is this topic's Active Record library

PG_HOST: str = os.environ.get("PG_HOST", "localhost")  # => override for CI / non-default hosts
PG_PORT: int = int(os.environ.get("PG_PORT", "5432"))  # => Postgres' conventional default port
PG_DB: str = os.environ.get("PG_DB", "orm_by_example")  # => one shared database, every example resets its own tables
PG_USER: str = os.environ.get("PG_USER", "postgres")  # => local trust-auth Postgres convention
PG_PASSWORD: str = os.environ.get("PG_PASSWORD", "postgres")  # => matches PG_USER for local dev
db = peewee.PostgresqlDatabase(PG_DB, host=PG_HOST, port=PG_PORT, user=PG_USER, password=PG_PASSWORD)  # => co-07's connection


class BaseModel(peewee.Model):  # => a shared base so every peewee Model in this file uses the SAME database
    class Meta:  # => peewee's own configuration mechanism -- a nested Meta class, not a constructor argument
        database = db  # => every subclass of BaseModel persists through `db`


class Customer(BaseModel):  # => co-07: the object itself knows how to save -- Active Record's defining trait
    id = peewee.AutoField()  # => explicit primary key -- peewee auto-adds this at RUNTIME even if you omit it
    name = peewee.CharField()  # => a required TEXT-like column, peewee's CharField


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    db.connect()  # => co-07: peewee manages its OWN connection, not a separate Session object
    db.drop_tables([Customer], safe=True, cascade=True)  # pyright: ignore[reportUnknownMemberType]  # => idempotent reset
    db.create_tables([Customer])  # pyright: ignore[reportUnknownMemberType]  # => issues CREATE TABLE from Customer's fields

    ada = Customer(name="Ada")  # => constructs an in-memory instance -- not yet a row in Postgres
    ada.save()  # pyright: ignore[reportUnknownMemberType]  # => co-07: THE OBJECT persists ITSELF -- no separate session.add()
    print(f"after save: id={ada.id}")  # => Output: after save: id=1
    # => contrast with Example 16 (SQLAlchemy): there, a SEPARATE Session object called session.add()/session.commit()

    grace = Customer.create(name="Grace")  # pyright: ignore[reportUnknownMemberType]  # => .create(): construct + save in one call
    print(f"after create: id={grace.id}")  # => Output: after create: id=2

    count = Customer.select().count()  # pyright: ignore[reportUnknownMemberType]  # => Customer itself exposes the query API too
    print(f"count={count}")  # => Output: count=2
    assert count == 2  # => both Ada (via .save()) and Grace (via .create()) persisted
    db.close()  # => releases the connection -- peewee has no context-manager Session to do this automatically
    # => co-07: peewee's dynamic Active-Record API is a genuine typing trade-off -- the `pyright: ignore` comments above
    # => document a REAL upstream gap in peewee's own stubs, contrasted with SQLAlchemy's fully static Mapped[] typing
    print("ex-20 OK")  # => Output: ex-20 OK
```

**Run**: `python3 example.py`

**Output**:

```text
after save: id=1
after create: id=2
count=2
ex-20 OK
```

**Key takeaway**: an Active Record object (`ada.save()`) persists itself directly, with no separate
session or mapper object involved -- the object and the persistence mechanism are the same thing.

**Why it matters**: the `# pyright: ignore[reportUnknownMemberType]` comments throughout this example
document a genuine gap in peewee's own type stubs, not a mistake in this code -- Active Record's dynamic
class-attribute style (`peewee.CharField()` assigned to a class body attribute) is harder for a
typechecker to model than SQLAlchemy's fully static `Mapped[]` annotations, a real trade-off worth
knowing when choosing between the two patterns.

---

### Example 21: Active Record vs Data Mapper

_ex-21 &middot; exercises co-07_

Writing the identical `Customer(name="Ada")` row through peewee (Active Record) and SQLAlchemy (Data
Mapper) makes Fowler's distinction concrete: one object saves itself, the other is saved by a separate
`Session` object that never becomes part of the mapped class itself.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05 -- color-blind friendly, WCAG AA
flowchart LR
    accTitle: Example 21: Active Record vs Data Mapper
    accDescr: Flowchart with 5 nodes and 3 connections. Nodes: ada = Customer(name=Ada), ada.save(), ada = Dm Customer(name=Ada), session.add(ada), session.commit(). Connections: ada = Customer(name=Ada) to ada.save(), ada = Dm Customer(name=Ada) to session.add(ada), session.add(ada) to session.commit().
    subgraph AR["Active Record<br/>(peewee)"]
        A1["ada =<br/>Customer(name='Ada')"]:::blue
        A2["ada.save()"]:::blue
        A1 --> A2
    end
    subgraph DM["Data Mapper<br/>(SQLAlchemy)"]
        B1["ada = Dm<br/>Customer(name='Ada')"]:::orange
        B2["session.add(ada)"]:::orange
        B3["session.commit()"]:::orange
        B1 --> B2 --> B3
    end

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-21-activerecord-vs-datamapper/example.py`**

```python
# pyright: strict
"""Example 21: Active Record (peewee) vs Data Mapper (SQLAlchemy) -- the Same Write."""

from __future__ import annotations

import os  # => reads connection settings from the environment

import peewee  # => co-07: the Active Record library
from sqlalchemy import create_engine, text  # => co-07: the Data Mapper library
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

PG_HOST: str = os.environ.get("PG_HOST", "localhost")  # => override for CI / non-default hosts
PG_PORT: int = int(os.environ.get("PG_PORT", "5432"))  # => Postgres' conventional default port
PG_DB: str = os.environ.get("PG_DB", "orm_by_example")  # => one shared database, every example resets its own tables
PG_USER: str = os.environ.get("PG_USER", "postgres")  # => local trust-auth Postgres convention
PG_PASSWORD: str = os.environ.get("PG_PASSWORD", "postgres")  # => matches PG_USER for local dev
SQLA_URL: str = f"postgresql+psycopg://{PG_USER}:{PG_PASSWORD}@{PG_HOST}:{PG_PORT}/{PG_DB}"  # => the ORM's own URL form


def write_active_record() -> int:  # => co-07: Active Record -- returns the id peewee assigned
    db = peewee.PostgresqlDatabase(PG_DB, host=PG_HOST, port=PG_PORT, user=PG_USER, password=PG_PASSWORD)
    # => a fresh peewee database handle, scoped inside this function -- keeps the two tiers fully independent

    class BaseModel(peewee.Model):  # => a fresh Model registry, scoped inside this function
        class Meta:  # => peewee's own configuration mechanism -- a nested Meta class, not a constructor argument
            database = db  # => every subclass of BaseModel persists through `db`

    class Customer(BaseModel):  # => co-07: THE OBJECT persists itself -- no separate mapper/session object exists
        id = peewee.AutoField()  # => explicit primary key -- peewee auto-adds this at runtime even if omitted
        name = peewee.CharField()

    db.connect()  # => co-07: peewee's OWN connection -- there is no separate "session" concept
    db.drop_tables([Customer], safe=True, cascade=True)  # pyright: ignore[reportUnknownMemberType]  # => idempotent reset
    db.create_tables([Customer])  # pyright: ignore[reportUnknownMemberType]  # => issues CREATE TABLE

    ada = Customer(name="Ada")  # => build the object
    ada.save()  # pyright: ignore[reportUnknownMemberType]  # => THE OBJECT calls .save() on ITSELF -- Active Record's defining trait
    db.close()  # => peewee has no context-manager Session -- closing is a manual, separate step
    return ada.id  # => the assigned primary key


class Base(DeclarativeBase):  # => co-06 + co-07: Data Mapper -- the mapped class itself carries no persistence behavior
    pass  # => carries no columns -- purely a registry root


class DmCustomer(Base):  # => co-07: renamed to avoid colliding with peewee's own Customer class above
    __tablename__ = "customer"  # => the physical table name -- same shape as the Active Record example, different class
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column


def write_data_mapper() -> int:  # => co-07: Data Mapper -- returns the id the ORM assigned
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine, entirely separate from the mapped DmCustomer class
    # => the engine, not DmCustomer, owns the connection -- the mapped class stays a plain data-holding object
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema, shared with the peewee run above
    Base.metadata.create_all(engine)  # => issues CREATE TABLE customer from DmCustomer's Mapped[] fields

    with Session(engine) as session:  # => co-07: a SEPARATE Session object does the persisting -- the mapper's job
        ada = DmCustomer(name="Ada")  # => build the object -- DmCustomer itself has NO .save() method at all
        session.add(ada)  # => the SESSION registers the object, not the object registering itself
        session.commit()  # => the SESSION flushes and commits -- DmCustomer never talks to Postgres directly
        return ada.id  # => reads `id` INSIDE the still-open session -- avoids a DetachedInstanceError


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    ar_id = write_active_record()  # => runs the peewee (Active Record) path
    dm_id = write_data_mapper()  # => runs the SQLAlchemy (Data Mapper) path
    # => both paths write the SAME logical row ("Ada") to the SAME physical customer table, one tier at a time
    print(f"active_record id={ar_id}, data_mapper id={dm_id}")  # => Output: active_record id=1, data_mapper id=1
    assert ar_id == 1 and dm_id == 1  # => both tiers persisted their FIRST row as id=1 -- same outcome, different API shape
    # => co-07: peewee's object called .save() on ITSELF; SQLAlchemy's SESSION called .add()/.commit() on the object
    # => Fowler's PoEAA names this exact split: Active Record couples persistence to the object; Data Mapper separates them
    print("ex-21 OK")  # => Output: ex-21 OK
```

**Run**: `python3 example.py`

**Output**:

```text
active_record id=1, data_mapper id=1
ex-21 OK
```

**Key takeaway**: both patterns persist the identical logical row, but Active Record couples persistence
to the object (`ada.save()`), while Data Mapper keeps them separate (`session.add(ada)`).

**Why it matters**: this split -- named by Fowler's PoEAA and used throughout this topic's remaining
examples -- explains a common framework choice: Rails and Django default to Active Record for its
brevity, while SQLAlchemy's Data Mapper trades a little ceremony for decoupling domain objects entirely
from how they get saved, which matters more as an application's persistence logic grows more complex.

---

### Example 22: Relationship One To Many

_ex-22 &middot; exercises co-08_

`relationship(back_populates="customer")` turns `ada.orders` into a live, appendable Python collection
-- appending a `CustomerOrder` registers it for insertion, and the Session orders the parent-then-child
writes by foreign-key dependency automatically.

```mermaid
%% Color Palette: Blue #0173B2, Teal #029E73 -- color-blind friendly, WCAG AA
erDiagram
    accTitle: Example 22: Relationship One To Many
    accDescr: Entity-relationship diagram with 2 items: CUSTOMER, CUSTOMER_ORDER. Relationships: CUSTOMER to CUSTOMER_ORDER: orders.
    CUSTOMER ||--o{ CUSTOMER_ORDER : "orders"
    CUSTOMER {
        int id PK
        string name
    }
    CUSTOMER_ORDER {
        int id PK
        int customer_id FK
        decimal total
    }
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-22-relationship-one-to-many/example.py`**

```python
# pyright: strict
"""Example 22: One-to-Many relationship() -- Customer -> Orders."""

from __future__ import annotations

import os  # => reads connection settings from the environment
from decimal import Decimal  # => money is Decimal, never float -- exact cents, no rounding drift

from sqlalchemy import Engine, ForeignKey, create_engine, text  # => co-08: relationship() ties two mapped classes
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Customer(Base):  # => co-08: the "one" side of this one-to-many relationship
    __tablename__ = "customer"
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column
    orders: Mapped[list["CustomerOrder"]] = relationship(back_populates="customer")  # => co-08: one customer, MANY orders
    # => the STRING "CustomerOrder" forward-references a class defined LATER in this file -- resolved at mapper config time


class CustomerOrder(Base):  # => co-08: the "many" side, named to avoid the reserved word "order"
    __tablename__ = "customer_order"
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    customer_id: Mapped[int] = mapped_column(ForeignKey("customer.id"))  # => the physical FK column relationship() reads
    total: Mapped[Decimal]  # => the order's total, as an exact Decimal
    customer: Mapped[Customer] = relationship(back_populates="orders")  # => co-08: the reverse, many-to-one navigation
    # => back_populates names the OTHER side's attribute -- SQLAlchemy keeps both directions in sync in Python memory


def reset_schema(engine: Engine) -> None:  # => shared reset helper -- wipes the whole schema, self-contained
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build both tables into
    Base.metadata.create_all(engine)  # => issues CREATE TABLE for both customer and customer_order


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine
    reset_schema(engine)  # => fresh, empty customer and customer_order tables
    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        ada = Customer(name="Ada")  # => the parent object this example navigates children from
        # => `ada.orders` starts as an empty list -- relationship() manages it as a live Python collection
        ada.orders.append(CustomerOrder(total=Decimal("19.99")))  # => co-08: append() to the COLLECTION, not a raw INSERT
        ada.orders.append(CustomerOrder(total=Decimal("42.50")))  # => a second order, same collection
        session.add(ada)  # => cascades: adding the parent also registers both children -- one call, three pending rows
        session.commit()  # => flushes all three INSERTs (customer, then both customer_order rows) in dependency order
        # => co-12: the Session ordered these writes itself -- the parent's id must exist before any child's FK can

        totals = [order.total for order in ada.orders]  # => co-08: `.orders` navigates the object graph, no manual JOIN
    print(totals)  # => Output: [Decimal('19.99'), Decimal('42.50')]
    assert totals == [Decimal("19.99"), Decimal("42.50")]  # => both children came back, in insertion order
    assert all(order.customer_id == ada.id for order in ada.orders)  # => every child's FK points back at the SAME parent
    # => co-08: relationship() lets you write `ada.orders`, not `session.execute(select(CustomerOrder).where(...))`
    # => Example 34 (Intermediate tier) revisits this exact `.orders` access to show it fires a LAZY query by default
    print("ex-22 OK")  # => Output: ex-22 OK
```

**Run**: `python3 example.py`

**Output**:

```text
[Decimal('19.99'), Decimal('42.50')]
ex-22 OK
```

**Key takeaway**: `relationship()` turns a foreign key into a navigable Python collection --
`ada.orders.append(...)` reads like ordinary list mutation, but registers the child for insertion under
the hood.

**Why it matters**: relationships are the ORM's core value proposition over Core's flat tables --
`ada.orders` replaces a hand-written `SELECT ... WHERE customer_id = ?` with plain attribute navigation.
This same `.orders` collection is exactly what Example 34 revisits to show its LAZY default, and Example
36 revisits to demonstrate the N+1 problem it can cause if accessed carelessly in a loop.

---

### Example 23: Relationship Back Populates

_ex-23 &middot; exercises co-08_

Setting `order.customer = ada` on one side of a bidirectional `back_populates` pair automatically
appends `order` into `ada.orders` on the other side, in Python memory, before any database round trip
happens.

**`learning/code/ex-23-relationship-back-populates/example.py`**

```python
# pyright: strict
"""Example 23: Bidirectional back_populates -- Both Sides Stay Linked."""

from __future__ import annotations

import os  # => reads connection settings from the environment
from decimal import Decimal  # => money is Decimal, never float -- exact cents, no rounding drift

from sqlalchemy import Engine, ForeignKey, create_engine, text  # => co-08: back_populates keeps two sides in sync
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Customer(Base):  # => co-08: the "one" side of this relationship
    __tablename__ = "customer"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column
    orders: Mapped[list["CustomerOrder"]] = relationship(back_populates="customer")  # => names CustomerOrder.customer below
    # => this string MUST exactly match the attribute name relationship() reads on the OTHER class -- a typo here fails at
    # => mapper-configuration time, not silently at runtime


class CustomerOrder(Base):  # => co-08: the "many" side
    __tablename__ = "customer_order"  # => named to avoid the reserved SQL word "order"
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    customer_id: Mapped[int] = mapped_column(ForeignKey("customer.id"))  # => the physical FK column
    total: Mapped[Decimal]  # => the order's total, as an exact Decimal
    customer: Mapped[Customer] = relationship(back_populates="orders")  # => names Customer.orders above -- the OTHER half
    # => co-08: two relationship() calls, each pointing at the OTHER side's attribute name -- this pairing is what
    # => "bidirectional" means: SQLAlchemy keeps `.orders` and `.customer` mutually consistent in Python memory


def reset_schema(engine: Engine) -> None:  # => shared reset helper -- wipes the whole schema, self-contained
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build both tables into
    Base.metadata.create_all(engine)  # => issues CREATE TABLE for both customer and customer_order


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine
    reset_schema(engine)  # => fresh, empty customer and customer_order tables

    ada = Customer(name="Ada")  # => the parent side of this bidirectional pair
    order = CustomerOrder(total=Decimal("19.99"))  # => the child side -- note it has NO customer set yet
    order.customer = ada  # => co-08: setting ONE side of back_populates -- watch the OTHER side below
    print(f"ada.orders contains order: {order in ada.orders}")  # => Output: ada.orders contains order: True
    # => co-08: setting `order.customer = ada` automatically appended `order` into `ada.orders` too -- IN PYTHON MEMORY,
    # => before ANY database round-trip happened -- back_populates keeps both collections mutually consistent

    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        session.add(ada)  # => cascades: adding the parent registers the linked child too
        session.commit()  # => flushes both rows, in dependency order
        order_id = order.id  # => reads `id` INSIDE the still-open session -- avoids a DetachedInstanceError below
        customer_id = ada.id  # => same reason -- read now, while the session is still open

    with Session(engine) as session:  # => a FRESH session -- reloads from Postgres, proving the FK actually persisted
        reloaded = session.get(CustomerOrder, order_id)  # => session.get(): a single-PK lookup, no explicit select() needed
        assert reloaded is not None  # => the row exists -- session.get() returns None only for a missing PK
        print(f"reloaded.customer_id={reloaded.customer_id}")  # => Output: reloaded.customer_id=1
        assert reloaded.customer_id == customer_id  # => the FK column on disk matches the in-memory link from earlier
    print("ex-23 OK")  # => Output: ex-23 OK
```

**Run**: `python3 example.py`

**Output**:

```text
ada.orders contains order: True
reloaded.customer_id=1
ex-23 OK
```

**Key takeaway**: `back_populates` keeps both sides of a relationship mutually consistent purely in
Python memory -- setting one side updates the other automatically, before any write reaches Postgres.

**Why it matters**: without `back_populates`, `ada.orders` and `order.customer` could silently drift out
of sync in application code -- appending to one collection without the other side noticing. Naming both
sides explicitly (each pointing at the other's attribute name) is what SQLAlchemy uses to keep the
in-memory object graph honest before it ever becomes SQL.

---

### Example 24: Foreign Key Mapping

_ex-24 &middot; exercises co-08_

`ForeignKey("customer.id")` compiles into a real Postgres `FOREIGN KEY` constraint at `CREATE TABLE`
time -- attempting to insert an order referencing a nonexistent customer id is rejected by the database
itself, not merely discouraged by Python conventions.

**`learning/code/ex-24-foreign-key-mapping/example.py`**

```python
# pyright: strict
"""Example 24: ForeignKey Mapping -- the Database Enforces the Link, Not Just Python."""

from __future__ import annotations

import os  # => reads connection settings from the environment

from sqlalchemy import Engine, ForeignKey, create_engine, text  # => co-08: ForeignKey names the referenced column
from sqlalchemy.exc import IntegrityError  # => raised when Postgres rejects a constraint violation
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Customer(Base):  # => co-08: the referenced ("parent") table
    __tablename__ = "customer"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => the column ForeignKey("customer.id") points at
    name: Mapped[str]  # => a required TEXT column


class CustomerOrder(Base):  # => co-08: the referencing ("child") table
    __tablename__ = "customer_order"  # => named to avoid the reserved SQL word "order"
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    customer_id: Mapped[int] = mapped_column(ForeignKey("customer.id"))  # => co-08: "table.column" string, resolved at
    # => CREATE TABLE time into a real Postgres FOREIGN KEY constraint -- this is NOT just Python bookkeeping
    # => a plain `int` column with no ForeignKey() would compile and run fine, but silently allow orphaned references
    total: Mapped[int] = mapped_column()  # => the order's total in cents, kept as a plain int for this example


def reset_schema(engine: Engine) -> None:  # => shared reset helper -- wipes the whole schema, self-contained
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build both tables into
    Base.metadata.create_all(engine)  # => issues CREATE TABLE, including the FOREIGN KEY constraint on customer_order


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine
    reset_schema(engine)  # => fresh, empty customer and customer_order tables, WITH the FK constraint in place

    with engine.begin() as conn:  # => inspects Postgres' own catalog -- proves the constraint is REAL, not just Python
        row = conn.execute(  # => queries information_schema for the constraint SQLAlchemy generated
            # => a raw SQL string against Postgres' system catalog -- there is no ORM class for this metadata
            text("SELECT constraint_type FROM information_schema.table_constraints WHERE table_name = 'customer_order' AND constraint_type = 'FOREIGN KEY'")
        ).fetchone()  # => None if no such constraint exists, else a one-column row
    print(f"fk constraint present: {row is not None}")  # => Output: fk constraint present: True

    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        bad_order = CustomerOrder(customer_id=999, total=100)  # => 999 does NOT exist in customer -- an orphaned reference
        session.add(bad_order)  # => registers the pending insert -- no SQL sent yet
        try:  # => co-08: attempting to commit a dangling FK must fail -- Postgres enforces it, not our Python code
            session.commit()  # => flushes the INSERT -- Postgres rejects it at the database level
            raise AssertionError("expected IntegrityError")  # => this line must never run -- the commit above should raise
        except IntegrityError:  # => the expected outcome: Postgres refused the orphaned FK reference
            session.rollback()  # => co-17: undoes the failed transaction so the session is usable again
            print("insert rejected: FK constraint violated")  # => Output: insert rejected: FK constraint violated

    with Session(engine) as session:  # => a FRESH session -- confirms the customer_order table is STILL empty
        count = session.execute(text("SELECT COUNT(*) FROM customer_order")).scalar_one()  # => a raw count, no ORM class needed
        # => scalar_one(): expects exactly one row, one column -- COUNT(*) always satisfies both
    print(f"count={count}")  # => Output: count=0
    assert count == 0  # => co-08: the rejected insert left NO trace -- the FK constraint protected data integrity
    # => contrast this with a plain integer column that merely LOOKS like a foreign key in application code: without a
    # => real FOREIGN KEY constraint, Postgres would have silently accepted customer_id=999
    print("ex-24 OK")  # => Output: ex-24 OK
```

**Run**: `python3 example.py`

**Output**:

```text
fk constraint present: True
insert rejected: FK constraint violated
count=0
ex-24 OK
```

**Key takeaway**: `ForeignKey("table.column")` compiles into a real database constraint -- integrity is
enforced by Postgres itself, not merely implied by naming convention or Python code.

**Why it matters**: a plain `int` column that merely looks like a foreign key would compile and run
fine while silently allowing orphaned references -- a real `FOREIGN KEY` constraint is what turns
"customer_id=999 doesn't exist" from a possible bug into an impossible state, enforced no matter which
code path attempts the write, ORM or otherwise (Example 56 revisits this same distinction for cascades).

---

### Example 25: Many To Many Association Table

_ex-25 &middot; exercises co-09_

A plain `Table` (not a mapped class) with a composite primary key models a many-to-many link between
`Student` and `Course` -- `relationship(secondary=student_course, ...)` routes navigation through it,
and `ada.courses.append(...)` writes the link row for you.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73 -- color-blind friendly, WCAG AA
erDiagram
    accTitle: Example 25: Many To Many Association Table
    accDescr: Entity-relationship diagram with 3 items: STUDENT, STUDENT_COURSE, COURSE. Relationships: STUDENT to STUDENT_COURSE: links; COURSE to STUDENT_COURSE: links.
    STUDENT ||--o{ STUDENT_COURSE : links
    COURSE ||--o{ STUDENT_COURSE : links
    STUDENT {
        int id PK
        string name
    }
    COURSE {
        int id PK
        string title
    }
    STUDENT_COURSE {
        int student_id FK
        int course_id FK
    }
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-25-many-to-many-assoc-table/example.py`**

```python
# pyright: strict
"""Example 25: Many-to-Many -- a Plain Association Table."""

from __future__ import annotations

import os  # => reads connection settings from the environment

from sqlalchemy import Column, Engine, ForeignKey, Integer, Table, create_engine, text  # => co-09: Table builds a link table
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


student_course = Table(  # => co-09: a plain Core Table, NOT a mapped class -- it carries no extra columns of its own
    "student_course",  # => the link table's physical name -- convention: both parent names, singular, joined
    Base.metadata,  # => registers this Table alongside the mapped classes below, so create_all() builds it too
    Column[int]("student_id", Integer, ForeignKey("student.id"), primary_key=True),  # => half of the composite PK
    Column[int]("course_id", Integer, ForeignKey("course.id"), primary_key=True),  # => the other half -- one row per pairing
    # => Column[int] pins the generic explicitly -- Table/Column's own constructor overloads can't fully infer it alone
)  # => co-09: the composite primary key prevents the SAME student/course pair from being linked twice


class Student(Base):  # => co-09: one side of the many-to-many
    __tablename__ = "student"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column
    courses: Mapped[list["Course"]] = relationship(secondary=student_course, back_populates="students")  # => co-09: secondary=
    # => tells relationship() to route THROUGH student_course rather than through a direct FK on Student itself


class Course(Base):  # => co-09: the other side of the many-to-many
    __tablename__ = "course"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    title: Mapped[str]  # => a required TEXT column
    students: Mapped[list[Student]] = relationship(secondary=student_course, back_populates="courses")  # => the reverse side


def reset_schema(engine: Engine) -> None:  # => shared reset helper -- wipes the whole schema, self-contained
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build all three tables into
    Base.metadata.create_all(engine)  # => issues CREATE TABLE for student, course, AND student_course


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine
    reset_schema(engine)  # => fresh, empty student, course, and student_course tables

    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        ada = Student(name="Ada")  # => a student who will take TWO courses
        algebra = Course(title="Algebra")  # => the first course
        physics = Course(title="Physics")  # => the second course
        ada.courses.append(algebra)  # => co-09: append() to a collection -- relationship() writes the link row for us
        ada.courses.append(physics)  # => a second link row, same student
        session.add(ada)  # => cascades: adding the student registers both courses AND both link rows
        session.commit()  # => flushes student, both course rows, then both student_course link rows, in dependency order

    with engine.begin() as conn:  # => a raw connection -- confirms the physical link table actually holds two rows
        link_count = conn.execute(text("SELECT COUNT(*) FROM student_course")).scalar_one()  # => bypasses the ORM entirely
    print(f"link_count={link_count}")  # => Output: link_count=2
    assert link_count == 2  # => co-09: one physical row per (student, course) pairing -- the association table IS the M:N
    # => contrast this with Examples 22-24's one-to-many: there, the FK lived directly on the "many" side's own table;
    # => here, NEITHER Student nor Course carries the other's id -- a third table holds the relationship itself
    print("ex-25 OK")  # => Output: ex-25 OK
```

**Run**: `python3 example.py`

**Output**:

```text
link_count=2
ex-25 OK
```

**Key takeaway**: `relationship(secondary=table)` routes navigation through a third, plain link table
instead of a direct foreign key on either side -- neither `Student` nor `Course` carries the other's id.

**Why it matters**: many-to-many is the shape most likely to trip up someone reaching for a one-to-many
mental model -- a student takes many courses AND a course has many students, so the FK cannot live on
either side alone. Example 75 (Advanced tier) extends this exact pattern with an association OBJECT for
the case where the link itself needs extra columns, like a grade.

---

### Example 26: Many To Many Navigate

_ex-26 &middot; exercises co-09_

Both directions of the same many-to-many link are real, independently navigable Python collections --
`student.courses` and `course.students` both resolve through the same physical `student_course` rows,
just read from opposite ends.

**`learning/code/ex-26-many-to-many-navigate/example.py`**

```python
# pyright: strict
"""Example 26: Many-to-Many -- Navigating Both Sides of the Same Link."""

from __future__ import annotations

import os  # => reads connection settings from the environment

from sqlalchemy import Column, Engine, ForeignKey, Integer, Table, create_engine, text  # => co-09: Table builds a link table
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


student_course = Table(  # => co-09: the same plain association table shape as Example 25
    "student_course",  # => the link table's physical name
    Base.metadata,  # => registers this Table alongside the mapped classes below
    Column[int]("student_id", Integer, ForeignKey("student.id"), primary_key=True),  # => half of the composite PK
    Column[int]("course_id", Integer, ForeignKey("course.id"), primary_key=True),  # => the other half of the composite PK
)  # => this example's FOCUS is navigation, not construction -- the shape is intentionally the same as Example 25


class Student(Base):  # => co-09: one side of the many-to-many
    __tablename__ = "student"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column
    courses: Mapped[list["Course"]] = relationship(secondary=student_course, back_populates="students")  # => forward nav


class Course(Base):  # => co-09: the other side of the many-to-many
    __tablename__ = "course"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    title: Mapped[str]  # => a required TEXT column
    students: Mapped[list[Student]] = relationship(secondary=student_course, back_populates="courses")  # => reverse nav


def reset_schema(engine: Engine) -> None:  # => shared reset helper -- wipes the whole schema, self-contained
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build all three tables into
    Base.metadata.create_all(engine)  # => issues CREATE TABLE for student, course, AND student_course


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine
    reset_schema(engine)  # => fresh, empty student, course, and student_course tables

    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        ada = Student(name="Ada")  # => one student
        # => this example wires up a SHARED course on purpose -- it is what makes the reverse navigation below interesting
        grace = Student(name="Grace")  # => a second student, sharing one of Ada's courses
        algebra = Course(title="Algebra")  # => a course BOTH students take
        physics = Course(title="Physics")  # => a course only Ada takes -- proves the forward list below isn't hardcoded
        ada.courses.extend([algebra, physics])  # => co-09: extend() on the collection -- two link rows for Ada
        grace.courses.append(algebra)  # => co-09: Grace shares Algebra with Ada -- a THIRD link row, same course_id
        # => THREE distinct student_course rows total: (ada, algebra), (ada, physics), (grace, algebra)
        session.add_all([ada, grace])  # => cascades: both students, both courses, and all three link rows in one call
        session.commit()  # => flushes everything, in dependency order
        ada_id, algebra_id = ada.id, algebra.id  # => read INSIDE the session -- avoids DetachedInstanceError below

    with Session(engine) as session:  # => a FRESH session -- reloads from Postgres to prove BOTH directions persisted
        reloaded_ada = session.get(Student, ada_id)  # => session.get(): a single-PK lookup
        assert reloaded_ada is not None  # => the row exists
        forward = sorted(course.title for course in reloaded_ada.courses)  # => co-09: Student -> courses, forward direction
        print(f"ada's courses: {forward}")  # => Output: ada's courses: ['Algebra', 'Physics']

        reloaded_algebra = session.get(Course, algebra_id)  # => same lookup, from the OTHER side
        assert reloaded_algebra is not None  # => the row exists
        backward = sorted(student.name for student in reloaded_algebra.students)  # => co-09: Course -> students, REVERSE
        # => co-09: `.students` navigates AWAY from Course, back toward Student -- through the exact same student_course rows
        print(f"algebra's students: {backward}")  # => Output: algebra's students: ['Ada', 'Grace']

    assert forward == ["Algebra", "Physics"] and backward == ["Ada", "Grace"]  # => co-09: ONE link table, TWO navigable
    # => directions -- `.courses` and `.students` are both real Python collections, backed by the same physical rows
    print("ex-26 OK")  # => Output: ex-26 OK
```

**Run**: `python3 example.py`

**Output**:

```text
ada's courses: ['Algebra', 'Physics']
algebra's students: ['Ada', 'Grace']
ex-26 OK
```

**Key takeaway**: `.courses` and `.students` navigate the SAME association-table rows from opposite
ends -- ONE link table, TWO independently readable directions.

**Why it matters**: many real domains need both directions ("what does this student take?" and "who
takes this course?"), and confirming both work from the SAME seeded rows (not two separately-tested
halves) proves `secondary=` genuinely produces one consistent graph, not two loosely related query
paths that happen to agree by coincidence -- a distinction that matters once the dataset grows.

---

### Example 27: Identity Map Same Object

_ex-27 &middot; exercises co-10_

Three separate query calls for the same primary key, within the same session, return the identical
Python object every time -- `first is second is third` -- but the SAME lookup from a fresh session
returns a genuinely different object.

```mermaid
%% Color Palette: Blue #0173B2, Teal #029E73 -- color-blind friendly, WCAG AA
flowchart TB
    accTitle: Example 27: Identity Map Same Object
    accDescr: Flowchart with 6 nodes and 6 connections. Nodes: A, 1, Session identity map (Customer, 1) -> ada, session. get(Customer, 1), C, ONE Python object. Connections: A to 1, 1 to Session identity map (Customer, 1) -> ada, session. get(Customer, 1) to Session identity map (Customer, 1) -> ada, C to 1, 1 to Session identity map (Customer, 1) -> ada, Session identity map (Customer, 1) -> ada to ONE Python object.
    A["select(Customer).<br/>where(id==1)"]:::blue --> M["Session identity map<br/>(Customer, 1) -> ada"]
    B["session.<br/>get(Customer, 1)"]:::blue --> M
    C["select(Customer).<br/>where(id==1)"]:::blue --> M
    M --> D["ONE Python object"]:::teal

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-27-identity-map-same-object/example.py`**

```python
# pyright: strict
"""Example 27: Identity Map -- Two Queries, One Python Object."""

from __future__ import annotations

import os  # => reads connection settings from the environment

from sqlalchemy import Engine, create_engine, select, text  # => co-10: select() is how the identity map gets exercised
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Customer(Base):  # => co-10: the mapped class whose identity this example tracks
    __tablename__ = "customer"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => the primary key the identity map keys ITSELF by
    name: Mapped[str]  # => a required TEXT column


def reset_schema(engine: Engine) -> None:  # => shared reset helper -- wipes the whole schema, self-contained
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build Customer's table into
    Base.metadata.create_all(engine)  # => issues CREATE TABLE customer from Customer's Mapped[] fields


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine
    reset_schema(engine)  # => fresh, empty customer table
    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        ada = Customer(name="Ada")  # => the one row this example queries twice
        session.add(ada)  # => registers `ada` as pending
        session.commit()  # => flushes the INSERT, assigns ada.id
        ada_id = ada.id  # => reads `id` INSIDE the still-open session -- avoids a DetachedInstanceError below

        first = session.execute(select(Customer).where(Customer.id == ada_id)).scalar_one()  # => query #1, by PK
        # => co-10: SQLAlchemy DID send a SELECT to Postgres here -- the identity map does not skip round-trips
        second = session.get(Customer, ada_id)  # => query #2, a DIFFERENT API (session.get) for the SAME PK, SAME session
        third = session.execute(select(Customer).where(Customer.id == ada_id)).scalar_one()  # => query #3, back to select()

        print(f"first is second: {first is second}")  # => Output: first is second: True
        print(f"second is third: {second is third}")  # => Output: second is third: True
        assert first is second is third  # => co-10: three DIFFERENT query calls, but ONE Python object came back every time
        # => co-10: the Session's identity map maps (class, primary key) -> the ONE Python object it already built for that
        # => row -- later lookups by the SAME PK, in the SAME session, return the SAME object instead of a fresh copy
        # => this matters for mutation: changing `first.name` also changes what `second` and `third` see -- they ARE it

    with Session(engine) as session:  # => a FRESH session -- the identity map is scoped PER session, not global
        outside = session.get(Customer, ada_id)  # => a brand-new object, because this is a brand-new session's own map
    print(f"outside is first: {outside is first}")  # => Output: outside is first: False
    assert outside is not first  # => co-10: crossing a session boundary breaks object identity -- a NEW map, a NEW object
    print("ex-27 OK")  # => Output: ex-27 OK
```

**Run**: `python3 example.py`

**Output**:

```text
first is second: True
second is third: True
outside is first: False
ex-27 OK
```

**Key takeaway**: the identity map maps `(class, primary key)` to the ONE tracked Python object per
session -- three lookups return the same object; a new session's lookup returns a genuinely different
one.

**Why it matters**: identity-map deduplication is what makes mutation safe within a session -- there is
never more than one in-memory copy of a given row to go stale relative to another. Example 72 (Advanced
tier) proves the SAME identity holds even across two structurally different query SHAPES (a direct
select vs. a relationship navigation), not just repeated identical calls.

---

### Example 28: Session Lifecycle Begin

_ex-28 &middot; exercises co-11, co-17_

A Session moves through open, add, commit, and close -- `session.new` shows `ada` as pending before
commit and no longer pending after, making the unit of work's own bookkeeping directly observable.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC -- color-blind friendly, WCAG AA
flowchart LR
    accTitle: Example 28: Session Lifecycle Begin
    accDescr: Flowchart with 4 nodes and 3 connections. Nodes: Session(engine) open, session.add(ada) ada in session.new, session.commit() ada gets a real id, session.close() connection released. Connections: Session(engine) open to session.add(ada) ada in session.new, session.add(ada) ada in session.new to session.commit() ada gets a real id, session.commit() ada gets a real id to session.close() connection released.
    A["Session(engine)<br/>open"]:::blue
    A --> B["session.add(ada)<br/>ada in session.new"]:::orange
    B --> C["session.commit()<br/>ada gets a real id"]:::teal
    C --> D["session.close()<br/>connection released"]:::purple

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

**`learning/code/ex-28-session-lifecycle-begin/example.py`**

```python
# pyright: strict
"""Example 28: Session Lifecycle -- Open, Add, Commit, Close."""

from __future__ import annotations

import os  # => reads connection settings from the environment

from sqlalchemy import Engine, create_engine, text  # => co-11: the engine a Session opens connections FROM
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example"
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Customer(Base):  # => co-11: the mapped class this example walks through a full session lifecycle with
    __tablename__ = "customer"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column


def reset_schema(engine: Engine) -> None:  # => shared reset helper -- wipes the whole schema, self-contained
    with engine.begin() as conn:  # => begin(): auto-commits on a clean exit, auto-rolls-back on an exception
        conn.execute(text("DROP SCHEMA public CASCADE"))  # => wipes EVERY table -- fully isolated from other examples
        conn.execute(text("CREATE SCHEMA public"))  # => a blank public schema to build Customer's table into
    Base.metadata.create_all(engine)  # => issues CREATE TABLE customer from Customer's Mapped[] fields


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => co-11: a connection FACTORY -- a Session borrows a connection from it as needed
    reset_schema(engine)  # => fresh, empty customer table

    session = Session(engine)  # => co-11: STAGE 1 -- OPEN. no connection is actually borrowed yet, this is lazy
    print(f"is_active before any work: {session.is_active}")  # => Output: is_active before any work: True
    # => co-11: `is_active` is True the whole time the session is NOT inside a failed transaction -- it does not mean
    # => "has a live database connection" -- SQLAlchemy borrows/returns the underlying connection lazily, per statement

    ada = Customer(name="Ada")  # => co-11: STAGE 2 -- ADD. constructs a transient object, not yet known to the session
    session.add(ada)  # => co-11: registers `ada` as PENDING -- still no SQL sent to Postgres
    print(f"ada in session.new: {ada in session.new}")  # => Output: ada in session.new: True
    # => co-11: `session.new` is the set of pending-insert objects -- this is the session's own bookkeeping, visible
    # => before any flush happens

    session.commit()  # => co-11 + co-17: STAGE 3 -- COMMIT. flushes the pending INSERT, then commits the transaction
    print(f"ada in session.new after commit: {ada in session.new}")  # => Output: ada in session.new after commit: False
    # => co-17: after commit(), `ada` is no longer pending -- it is now a PERSISTENT object, tracked in the identity map
    assigned_id = ada.id  # => reads `id` INSIDE the still-open session -- avoids a DetachedInstanceError below

    session.close()  # => co-11: STAGE 4 -- CLOSE. releases the borrowed connection back to the engine's pool
    print(f"is_active after close: {session.is_active}")  # => Output: is_active after close: True
    # => co-11: `is_active` still reads True -- close() ends the session's transactional scope and expires its objects,
    # => but does not itself flip is_active to False; a NEW session must be opened to do any further work with `ada`
    print(f"assigned_id={assigned_id}")  # => Output: assigned_id=1
    assert assigned_id == 1  # => co-11: the full open -> add -> commit -> close arc produced exactly one persisted row
    print("ex-28 OK")  # => Output: ex-28 OK
```

**Run**: `python3 example.py`

**Output**:

```text
is_active before any work: True
ada in session.new: True
ada in session.new after commit: False
is_active after close: True
assigned_id=1
ex-28 OK
```

**Key takeaway**: `session.new` directly exposes the unit of work's own pending-object bookkeeping --
watching it flip from containing `ada` to not containing her makes commit's effect observable, not just
assumed.

**Why it matters**: `is_active` staying `True` across `close()` is a common source of confusion -- it
tracks transactional health, not connection liveness or object usability. Example 29 (Intermediate tier)
picks this exact lifecycle apart further with `inspect()`, naming all four states explicitly: transient,
pending, persistent, and detached, each with its own rules about what is safe to read or write.

---

← Previous: [Overview](./overview.md) &middot; Next: [Intermediate Examples](./intermediate.md) →
