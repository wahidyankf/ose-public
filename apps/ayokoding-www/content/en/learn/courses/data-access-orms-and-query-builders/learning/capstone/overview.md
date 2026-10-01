---
title: "Overview"
date: 2026-07-18T00:00:00+07:00
draft: false
weight: 1
---

## Goal

Take one seeded PostgreSQL database -- a small team-task tracker: 2 teams, 5 members, 5 tasks, and 6
`assignment` rows linking members to tasks (an association object carrying its own `hours_logged`
column, co-09) -- and build a coherent, four-script project on top of it: answer the SAME aggregate
report through all three tiers of Example 1's spectrum (co-01) and prove they agree; walk the ORM's own
relationship, identity-map, and unit-of-work machinery against that same data, reproduce the N+1 problem
and fix it, then clean up with two DIFFERENT cascade-delete mechanisms (co-22); and finish with a real
reversible Alembic migration (co-19, co-21) followed by two set-based bulk writes (co-23) that never
load a single row into a Python object. Every mechanism this capstone combines was already taught,
individually, somewhere in this topic's Beginner, Intermediate, or Advanced tiers -- Example 78
("Capstone Preview, Three Tier") previewed this exact three-tier-plus-N+1-plus-migration shape first.
Example 78's own `Customer`/`Order` tables are a single one-to-many pair with no association object and
no lasting migration, so they cannot host this capstone's own additions on top of that preview: a
many-to-many association object (co-09, which needs a real composite-key link table), two contrasting
cascade-delete mechanisms side by side (co-22), and a migration that runs against PERSISTENT shared data
rather than a throwaway scratch schema. This capstone therefore builds a small, freestanding
team/member/task/assignment schema sized to host all of that cleanly, rather than force-fitting it onto
Example 78's narrower preview tables.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC -- color-blind friendly, WCAG AA
flowchart LR
    accTitle: Goal
    accDescr: Flowchart with 4 nodes and 3 connections. Nodes: seed.py 2 teams, 5 members, 5 tasks, 6 assignments, report_three_tiers. py raw SQL + PyPika + ORM agree, relationships_and_n_ plus_1.py identity map, N+1 fix, 2 cascade flavors, migration_and_bulk. py Alembic round trip + bulk insert/update. Connections: seed.py 2 teams, 5 members, 5 tasks, 6 assignments to report_three_tiers. py raw SQL + PyPika + ORM agree, seed.py 2 teams, 5 members, 5 tasks, 6 assignments to relationships_and_n_ plus_1.py identity map, N+1 fix, 2 cascade flavors, seed.py 2 teams, 5 members, 5 tasks, 6 assignments to migration_and_bulk. py Alembic round trip + bulk insert/update.
    A["seed.py<br/>2 teams, 5 members,<br/>5 tasks, 6<br/>assignments"]:::blue
    B["report_three_tiers.<br/>py<br/>raw SQL + PyPika +<br/>ORM agree"]:::orange
    C["relationships_and_n_<br/>plus_1.py<br/>identity map, N+1<br/>fix, 2 cascade<br/>flavors"]:::teal
    D["migration_and_bulk.<br/>py<br/>Alembic round trip +<br/>bulk insert/update"]:::purple
    A --> B
    A --> C
    A --> D

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

## Concepts exercised

- [x] the raw-SQL to query-builder to ORM spectrum (co-01) -- `report_three_tiers.py` answers the SAME
      "total hours logged per team" report three times and asserts all three agree exactly (Example 1's
      spectrum, Example 78's own three-tier preview, applied here at capstone scale)
- [x] the PEP 249 DB-API (co-02) + parameterized queries (co-05) -- `seed.py` builds the whole schema
      and seeds every row through plain psycopg calls, values passed as `%s` placeholders, never
      string-interpolated
- [x] a query builder (co-03, co-04) -- `report_three_tiers.py`'s tier 2 composes the SAME JOIN, LEFT
      JOIN, GROUP BY, and `COALESCE`/`SUM` aggregate as PyPika VALUES, not concatenated text
- [x] declarative ORM mapping (co-06), one-to-many relationships (co-08), and a many-to-many association
      object (co-09) -- `relationships_and_n_plus_1.py` maps `Team`/`Member`/`Task`/`Assignment` onto the
      SAME tables `seed.py` created, `Assignment` carrying its own `hours_logged` column
- [x] the identity map (co-10) -- the SAME `Member` fetched by a query and then by `session.get()` comes
      back as the literal SAME Python object, not merely an equal one
- [x] session object states (co-11) and the unit of work's dirty tracking (co-12) -- a throwaway
      "Scratch Team" walked through transient, pending, persistent, and detached, with `session.dirty`
      inspected before a commit flushes a mid-session rename
- [x] lazy loading, the N+1 problem, and its fix (co-13, co-14, co-15) -- the SAME "every member's
      assignments" access pattern measured at 6 queries by default, then 2 queries with `selectinload`
      (Example 42's `query_counter` pattern, reused here against this capstone's own data)
- [x] the `raiseload()` guard (co-16) -- a fresh query with `raiseload(Member.assignments)` turns the
      EXACT access pattern the N+1 measurement above just reproduced into a loud `InvalidRequestError`
      instead of a silent extra round trip
- [x] an ORM transaction rollback (co-17) -- a mid-session rename of a real seeded row (`Ada`) is
      discarded by `session.rollback()`, and the object's own EXPIRY forces a fresh read confirming
      nothing reached the database
- [x] two DIFFERENT cascade-delete mechanisms, side by side (co-22) -- deleting the scratch team relies
      on the ORM's OWN `cascade="all, delete-orphan"` relationship option; deleting the scratch task
      relies on nothing but the DATABASE's plain `ON DELETE CASCADE` FK `seed.py`'s schema already
      declared -- both paths clean up completely, by two structurally different routes
- [x] a real reversible Alembic migration (co-19, co-21) -- `migration_and_bulk.py` adds
      `member.active`, backfills all 5 existing rows to `TRUE`, then a `downgrade()` drops the column
      again, restoring `member`'s EXACT original shape
- [x] set-based bulk operations (co-23) -- a 50-row bulk `insert()` and a set-based `update()` each issue
      exactly ONE statement, re-triaging 53 rows total without ever loading a single one into a Python
      object

All colocated code lives under `learning/capstone/code/`: `seed.py` (schema + seed data), `report_three_tiers.py` (the three-tier report), `relationships_and_n_plus_1.py` (the ORM object-lifecycle
walkthrough), and `migration_and_bulk.py` (the migration + bulk writes). Every listing below is the
complete, verbatim file -- nothing on this page is truncated or paraphrased. Every printed value on this
page is a genuine, captured transcript from a real PostgreSQL 18.4 server (Docker,
`postgres:18.4-alpine`), run in the exact order the four "Step" headings below present them -- never a
fabricated one.

## Step 1: `seed.py` -- a small team-task schema, seeded over the raw DB-API

_exercises co-02, co-05, co-09_

Four tables: `team` (2 rows), `member` (5 rows, one -- Barbara -- deliberately left with ZERO
assignments), `task` (5 rows, one -- "Plan Q3 roadmap" -- deliberately left with ZERO assignments too),
and `assignment` (6 rows, the association object linking members to tasks with its own `hours_logged`
column, co-09). `team --< member` carries a PLAIN foreign key with no database-level cascade; `member`/
`task --< assignment` both carry `ON DELETE CASCADE` -- Step 3 contrasts both shapes directly.

**`learning/capstone/code/seed.py`** (complete file)

```python
# pyright: strict
"""Capstone Step 1: seed.py -- schema + seed data over the raw PEP 249 DB-API (co-02, co-05).

Unlike every ex-NN example (each resets and seeds its OWN tables), this capstone's four scripts
share ONE persistent schema: seed.py runs first, the other three build on what it leaves behind.
"""

from __future__ import annotations

import os  # => reads connection settings from the environment (co-01)

import psycopg  # => co-02: the raw PEP 249 DB-API -- no builder, no ORM involved in seeding
# => this file never imports SQLAlchemy, PyPika, or peewee -- pure raw DB-API only, co-01's floor tier

PG_DSN: str = os.environ.get("PG_DSN", "postgresql://postgres:postgres@localhost:5432/orm_by_example")  # => a plain DB-API DSN
# => override PG_DSN in the environment to point every capstone script at a different Postgres instance
# => a DB-API DSN, distinct from the SQLAlchemy-dialect URL the other three capstone scripts each build


def seed() -> None:
    # => reset + load, in ONE function -- every other capstone script assumes this exact starting state
    # => called once by __main__ below, and importable directly by anything that wants a fresh dataset
    with psycopg.connect(PG_DSN, autocommit=True) as conn:  # => autocommit: DDL needs no explicit commit
        # => the DROP+CREATE pair below is the entire "reset" half of this function's contract
        conn.execute("DROP SCHEMA public CASCADE")  # => wipes EVERY table -- a clean slate for the whole capstone
        conn.execute("CREATE SCHEMA public")  # => a blank public schema, shared by all four capstone scripts
        # => everything from here down is the "load" half -- four CREATE TABLEs, then four INSERTs

        # => team --< member: a plain FK, NO "ON DELETE CASCADE" at the database level -- deleting a team
        # => with members still attached fails at the DATABASE unless the caller removes them first, OR the
        # => ORM's own cascade="all, delete-orphan" relationship option does it for you (co-22, Step 3).
        # => four tables total: team (1), member (many), task (many), assignment (the M2M link, co-09)
        conn.execute("CREATE TABLE team(id SERIAL PRIMARY KEY, name TEXT NOT NULL)")  # => the "one" side of team-member
        conn.execute(
            "CREATE TABLE member(id SERIAL PRIMARY KEY, name TEXT NOT NULL, team_id INT NOT NULL REFERENCES team(id))"  # => NO ON DELETE CASCADE here
        )
        conn.execute("CREATE TABLE task(id SERIAL PRIMARY KEY, title TEXT NOT NULL, status TEXT NOT NULL)")  # => no FK of its own
        # => member >--< task via assignment: co-09's association OBJECT shape -- a composite primary key
        # => PLUS an extra hours_logged column a plain two-column link table has no natural place for. This
        # => FK pair DOES carry "ON DELETE CASCADE" -- the opposite contrast to team/member's plain FK above:
        # => deleting a member or a task cleans up its assignment rows at the DATABASE level, no ORM cascade
        # => configuration required at all (co-22, Step 3 contrasts both flavors side by side).
        conn.execute(
            "CREATE TABLE assignment(member_id INT NOT NULL REFERENCES member(id) ON DELETE CASCADE, task_id INT NOT NULL REFERENCES task(id) ON DELETE CASCADE, hours_logged NUMERIC(6,2) NOT NULL, PRIMARY KEY (member_id, task_id))"  # => co-09: composite PK (member_id, task_id) IS the association object's own identity
        )

        # => 2 teams -- Platform (3 members) and Growth (2 members), an intentionally uneven split
        conn.execute("INSERT INTO team(name) VALUES (%s), (%s)", ("Platform", "Growth"))  # => team.id 1=Platform, 2=Growth
        # => 5 members: Barbara (id 5) deliberately gets ZERO assignments below -- exercises the LEFT JOIN /
        # => outer-join edge case every tier's report (Step 2) and the N+1 measurement (Step 3) must both handle
        conn.execute(
            "INSERT INTO member(name, team_id) VALUES (%s, %s), (%s, %s), (%s, %s), (%s, %s), (%s, %s)",  # => 5 (name, team_id) pairs -- member.id auto-assigned 1-5
            (
                "Ada",  # => member.id 1
                1,  # => team_id 1 = Platform
                "Grace",  # => member.id 2
                1,  # => team_id 1 = Platform
                "Linus",  # => member.id 3
                2,  # => team_id 2 = Growth
                "Margaret",  # => member.id 4
                2,  # => team_id 2 = Growth
                "Barbara",  # => member.id 5 -- the ZERO-assignment member (co-15 edge case)
                1,  # => team_id 1 = Platform
            ),
        )
        # => 5 tasks: "Plan Q3 roadmap" (id 5) deliberately gets ZERO assignments -- the task-side mirror
        # => of Barbara's zero-assignment member row, exercising the SAME edge case from the other direction
        conn.execute(
            "INSERT INTO task(title, status) VALUES (%s, %s), (%s, %s), (%s, %s), (%s, %s), (%s, %s)",  # => 5 (title, status) pairs -- task.id auto-assigned 1-5
            (
                "Set up CI pipeline",  # => task.id 1
                "done",  # => already completed before this capstone even starts
                "Design onboarding flow",  # => task.id 2
                "open",  # => still in progress
                "Write API docs",  # => task.id 3
                "open",  # => still in progress
                "Fix login bug",  # => task.id 4
                "done",  # => already completed
                "Plan Q3 roadmap",  # => task.id 5 -- gets ZERO assignments below (co-15 edge case, task side)
                "open",  # => the outer-join edge case this task exists to exercise
            ),
        )
        # => 6 assignment rows linking 4 of the 5 members to 4 of the 5 tasks, each carrying its own
        # => hours_logged (co-09's extra column) -- Ada and Linus each touch 2 tasks, Grace and Margaret 1 each
        conn.execute(
            "INSERT INTO assignment(member_id, task_id, hours_logged) VALUES "  # => 6 (member_id, task_id, hours_logged) triples
            "(%s, %s, %s), (%s, %s, %s), (%s, %s, %s), (%s, %s, %s), (%s, %s, %s), (%s, %s, %s)",  # => 18 placeholders total, 3 per row
            (
                1,  # => member_id 1 = Ada
                1,  # => task_id 1 = "Set up CI pipeline"
                8.5,  # => Ada on "Set up CI pipeline"
                1,  # => member_id 1 = Ada again -- a SECOND assignment for this member
                4,  # => task_id 4 = "Fix login bug"
                3.0,  # => Ada on "Fix login bug"
                2,  # => member_id 2 = Grace
                2,  # => task_id 2 = "Design onboarding flow"
                5.0,  # => Grace on "Design onboarding flow"
                3,  # => member_id 3 = Linus
                3,  # => task_id 3 = "Write API docs"
                4.5,  # => Linus on "Write API docs"
                3,  # => member_id 3 = Linus again -- a SECOND assignment for this member
                4,  # => task_id 4 = "Fix login bug"
                2.0,  # => Linus on "Fix login bug"
                4,  # => member_id 4 = Margaret
                2,  # => task_id 2 = "Design onboarding flow"
                6.0,  # => Margaret on "Design onboarding flow"
            ),
        )


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    seed()  # => builds the schema and loads the dataset every later capstone script reads
    # => a fresh connection here, separate from the one seed() used, just to print a verification count
    with psycopg.connect(PG_DSN) as conn:  # => a fresh connection, just to print a verification count
        # => one query, four scalar subqueries -- co-02: plain PEP 249 DB-API, no builder or ORM needed
        counts = conn.execute(
            "SELECT (SELECT count(*) FROM team), (SELECT count(*) FROM member), (SELECT count(*) FROM task), (SELECT count(*) FROM assignment)"  # => 4 counts in one round trip
        ).fetchone()
    assert counts is not None  # => narrows Optional for pyright --strict -- the query above always returns exactly 1 row
    teams, members, tasks, assignments = counts  # => unpacks the 4-column verification row
    print(f"teams={teams} members={members} tasks={tasks} assignments={assignments}")  # => Output: teams=2 members=5 tasks=5 assignments=6
    assert (teams, members, tasks, assignments) == (2, 5, 5, 6)  # => co-02: confirms every row landed exactly as seeded
    # => (2, 5, 5, 6) is the fixed baseline every other capstone script (Steps 2-4) assumes is present
    print("seed.py OK")  # => Output: seed.py OK
```

**Verify**

```text
$ python3 seed.py
teams=2 members=5 tasks=5 assignments=6
seed.py OK
```

Row counts match the seed exactly: 2 teams, 5 members, 5 tasks, 6 assignments -- the dataset every
later step in this capstone reads.

## Step 2: `report_three_tiers.py` -- the SAME report, three ways

_exercises co-01, co-03, co-04, co-25, co-26_

"Total hours logged per team": `team` JOINed through `member` down to `assignment`, summed and
`COALESCE`d to `0` for a member (or a whole team) with none. Computed three times -- raw SQL, PyPika,
and the SQLAlchemy ORM -- and asserted to agree exactly, extending Example 1's and Example 78's own
three-tier comparisons to this capstone's own data.

**`learning/capstone/code/report_three_tiers.py`** (complete file)

```python
# pyright: strict
"""Capstone Step 2: report_three_tiers.py -- "total hours per team," answered 3 ways (co-01).

Assumes seed.py already ran. Computed once per tier of Example 1's spectrum, then asserted to agree.
"""

from __future__ import annotations  # => enables modern type-hint syntax across this file

import os  # => reads connection settings from the environment
from decimal import Decimal  # => money-shaped totals are Decimal, never float -- exact, no rounding drift
from typing import LiteralString, cast  # => acknowledges a runtime-built string is safe to execute (see tier2)

import psycopg  # => co-02: tier 1 -- the raw PEP 249 DB-API, also how tier 2's PyPika-built SQL actually runs
from pypika import Query, Table  # => co-03: tier 2 -- PyPika composes the query as data, not concatenated text
from pypika import functions as fn  # => co-04: PyPika's own Sum/Coalesce aggregate functions
from sqlalchemy import ForeignKey, create_engine, func, select  # => co-01: tier 3 -- SQLAlchemy's own select() + func namespace
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship  # => co-06: typed declarative mapping

PG_DSN: str = os.environ.get("PG_DSN", "postgresql://postgres:postgres@localhost:5432/orm_by_example")  # => plain DB-API DSN
SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL",
    "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example",  # => the fallback default
)  # => override SQLA_URL in the environment to point at a different Postgres instance


def tier1_raw_sql() -> list[tuple[str, Decimal]]:  # => co-01: tier 1 of 3 -- the raw-SQL floor
    # => hand-written SQL over the PEP 249 DB-API (co-02) -- every join and column typed by hand
    with psycopg.connect(PG_DSN) as conn:  # => a fresh connection -- no builder, no ORM in between
        rows = conn.execute(  # => a plain string-literal double-JOIN, COALESCE for teams/members with zero hours
            "SELECT t.name, COALESCE(SUM(a.hours_logged), 0) FROM team t JOIN member m ON m.team_id = t.id LEFT JOIN assignment a ON a.member_id = m.id GROUP BY t.id, t.name ORDER BY t.name"  # => COALESCE handles zero-hour teams
        ).fetchall()  # => co-01: this list of raw tuples is what tiers 2 and 3 below must reproduce exactly
    return [(str(r[0]), Decimal(r[1])) for r in rows]  # => casts each column so all 3 tiers compare equal


def tier2_query_builder() -> list[tuple[str, Decimal]]:  # => co-01: tier 2 of 3 -- the query-builder middle
    # => the SAME report, composed as data via PyPika (co-03, co-04) -- no string concatenation
    team_t, member_t, assignment_t = Table("team"), Table("member"), Table("assignment")  # => 3 Table VALUES, not strings
    query = (  # => the builder tree is built up one method call at a time, below
        Query.from_(team_t)  # => start the builder tree from team
        .join(member_t)  # => .join() (INNER) takes another Table value -- every team has at least 1 member here
        .on(member_t.team_id == team_t.id)  # => .on() takes a PyPika expression object, not raw text
        .left_join(assignment_t)  # => .left_join(): a member with zero assignments still contributes a row
        .on(assignment_t.member_id == member_t.id)  # => the outer-join condition, also composed, not interpolated
        .groupby(team_t.id, team_t.name)  # => GROUP BY composed onto the SAME tree, one method at a time
        .orderby(team_t.name)  # => matches tier 1's ORDER BY, so the two result lists compare equal
        .select(team_t.name, fn.Coalesce(fn.Sum(assignment_t.hours_logged), 0))  # => co-04: PyPika's own aggregate functions
    )  # => the tree only becomes SQL text when you ask for it -- nothing has run yet
    with psycopg.connect(PG_DSN) as conn:  # => co-01: PyPika BUILT the query, but a plain DB-API cursor still RUNS it
        sql_text = cast(LiteralString, str(query))  # => str(query) renders the tree; cast() vouches it is safe to run
        rows = conn.execute(sql_text).fetchall()  # => the DB-API executes PyPika's OUTPUT exactly like tier 1's own SQL
    return [(str(r[0]), Decimal(r[1])) for r in rows]  # => identical shape to tier 1's return value


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase (tier 3)
    pass  # => carries no columns -- purely a registry root


class Team(Base):  # => co-06: maps onto the table seed.py already created -- mapping is decoupled from creation
    __tablename__ = "team"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column
    members: Mapped[list["Member"]] = relationship(back_populates="team")  # => co-08: the one-to-many side


class Member(Base):  # => co-06 + co-08: the "many" side of team --< member
    __tablename__ = "member"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column
    team_id: Mapped[int] = mapped_column(ForeignKey("team.id"))  # => co-08: the FK column the JOIN below walks
    team: Mapped[Team] = relationship(back_populates="members")  # => the reverse, many-to-one navigation


class ReportAssignment(Base):  # => co-06 + co-09: maps onto the SAME assignment table seed.py created
    __tablename__ = "assignment"  # => the physical association-object table (co-09) seed.py created
    member_id: Mapped[int] = mapped_column(primary_key=True)  # => half of the composite PK
    task_id: Mapped[int] = mapped_column(primary_key=True)  # => the other half of the composite PK
    hours_logged: Mapped[Decimal]  # => the extra column this report sums, identical to tiers 1 and 2


def tier3_orm() -> list[tuple[str, Decimal]]:  # => co-01: tier 3 of 3 -- the full ORM, aggregation still server-side
    # => the SAME report through SQLAlchemy's select() (co-06) -- entities in, rows out
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine
    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        stmt = (  # => the SAME shape as tier 1/2: JOIN, LEFT JOIN, GROUP BY, ORDER BY -- expressed via mapped entities
            select(Team.name, func.coalesce(func.sum(ReportAssignment.hours_logged), 0))  # => co-01: aggregate columns
            .select_from(Team)  # => anchors the query on the mapped Team entity, not a bare table name
            .join(Member, Member.team_id == Team.id)  # => co-08: the mapped relationship's own join condition, reused
            .outerjoin(ReportAssignment, ReportAssignment.member_id == Member.id)  # => co-01: LEFT JOIN, same as tiers 1 and 2
            .group_by(Team.id, Team.name)  # => matches tier 1/2's GROUP BY exactly
            .order_by(Team.name)  # => matches tier 1/2's ORDER BY, so all 3 result lists compare equal
        )
        rows = session.execute(stmt).all()  # => co-25: aggregation computed server-side, identical to tiers 1 and 2
    return [(str(r[0]), Decimal(r[1])) for r in rows]  # => identical shape to tiers 1 and 2's return values


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    sql_result = tier1_raw_sql()  # => co-01: tier 1 -- raw SQL
    builder_result = tier2_query_builder()  # => co-01: tier 2 -- query builder
    orm_result = tier3_orm()  # => co-01: tier 3 -- full ORM
    print(f"sql_result={sql_result}")  # => Output: sql_result=[('Growth', Decimal('12.50')), ('Platform', Decimal('16.50'))]
    print(f"builder_result={builder_result}")  # => Output: identical to sql_result
    print(f"orm_result={orm_result}")  # => Output: identical to sql_result
    assert sql_result == builder_result == orm_result  # => co-01 + co-25 + co-26: all three tiers agree on ONE correct answer
    # => co-25 + co-26: raw SQL (tier 1) and the query builder (tier 2) express this GROUP BY report about as
    # => directly as the ORM (tier 3) does here -- a REPORT like this is exactly the shape where a query
    # => builder or raw SQL usually stays the simpler choice in practice (co-27), while the ORM tier earns its
    # => keep on CRUD and object-graph navigation instead (Step 3 below exercises exactly that side of the tradeoff)
    print("report_three_tiers.py OK")  # => Output: report_three_tiers.py OK
```

**Verify**

```text
$ python3 report_three_tiers.py
sql_result=[('Growth', Decimal('12.50')), ('Platform', Decimal('16.50'))]
builder_result=[('Growth', Decimal('12.50')), ('Platform', Decimal('16.50'))]
orm_result=[('Growth', Decimal('12.50')), ('Platform', Decimal('16.50'))]
report_three_tiers.py OK
```

Hand-computed check: Platform's 3 members (Ada, Grace, Barbara) log `8.5 + 3.0 + 5.0 + 0 = 16.50` hours;
Growth's 2 members (Linus, Margaret) log `4.5 + 2.0 + 6.0 = 12.50` hours -- both totals match every tier's
output exactly, and Barbara's zero-assignment row correctly contributes `0`, not a dropped team row.

## Step 3: `relationships_and_n_plus_1.py` -- object graph, identity map, N+1, two cascades

_exercises co-06, co-08, co-09, co-10, co-11, co-12, co-13, co-14, co-15, co-16, co-17, co-22_

The ORM machinery Step 2's report tier never needed: the identity map, the N+1 problem reproduced then
fixed, the `raiseload()` guard, a transaction rollback, and -- on a throwaway "Scratch Team" this script
creates and deletes entirely on its own -- the session's four object states, the unit of work's dirty
tracking, and two structurally different cascade-delete mechanisms side by side.

**`learning/capstone/code/relationships_and_n_plus_1.py`** (complete file)

```python
# pyright: strict
"""Capstone Step 3: relationships_and_n_plus_1.py -- object graph, identity map, unit of work, N+1.

Assumes seed.py already ran. Walks relationships, the identity map, N+1, and a transaction rollback
against the SHARED seeded data (read-only), then a throwaway "Scratch Team" walks session states, the
unit of work, and both cascade-delete mechanisms (co-22) -- restoring the dataset to seed.py's exact
original counts so migration_and_bulk.py (Step 4) can assume that same baseline.
"""

from __future__ import annotations  # => enables modern type-hint syntax across this file

import os  # => reads connection settings from the environment
from collections.abc import Generator  # => the modern return-type annotation @contextmanager expects, not Iterator
from contextlib import contextmanager  # => co-15: a reusable "count queries in this block" helper, same shape as Example 42
from decimal import Decimal  # => money-shaped totals are Decimal, never float -- exact, no rounding drift
from typing import Any  # => types SQLAlchemy's own untyped event-hook callback arguments

from sqlalchemy import Engine, ForeignKey, create_engine, event, inspect, select  # => co-11: inspect() reads InstanceState
from sqlalchemy.exc import InvalidRequestError  # => co-16: the exact exception a raiseload()-guarded access raises
from sqlalchemy.orm import (  # => co-06: every ORM name this file needs, imported from one place
    DeclarativeBase,  # => co-06: the shared mapper registry root every mapped class below inherits from
    InstanceState,  # => co-11: the live per-object state inspect() returns
    Mapped,  # => co-06: the typed-attribute wrapper every mapped column and relationship uses
    Session,  # => co-11 + co-12: the unit-of-work handle every function below opens at least once
    mapped_column,  # => co-06: declares a column backing a Mapped[] attribute
    raiseload,  # => co-16: the loud-failure guard
    relationship,  # => co-08: declares a navigable link between two mapped classes
    selectinload,  # => co-14: the eager-loading fix for co-15's N+1
)

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL",
    "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example",  # => the fallback default
)  # => override SQLA_URL in the environment to point at a different Postgres instance


class Base(DeclarativeBase):  # => co-06: every mapped class in this program shares ONE DeclarativeBase
    pass  # => carries no columns -- purely a registry root


class Team(Base):  # => co-06: maps onto the table seed.py already created -- mapping is decoupled from creation
    __tablename__ = "team"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column
    members: Mapped[list["Member"]] = relationship(  # => co-08: the one-to-many side
        back_populates="team",  # => keeps Team.members and Member.team in sync in memory
        cascade="all, delete-orphan",  # => co-22: the ORM's OWN cascade -- deleting a Team also deletes its Members,
        # => even though the plain team_id FK below carries no "ON DELETE CASCADE" at the database level at all
    )  # => end of Team.members' relationship() call


class Member(Base):  # => co-06 + co-08: the "many" side of team --< member
    __tablename__ = "member"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    name: Mapped[str]  # => a required TEXT column
    team_id: Mapped[int] = mapped_column(ForeignKey("team.id"))  # => the FK column every JOIN below walks
    team: Mapped[Team] = relationship(back_populates="members")  # => the reverse, many-to-one navigation
    assignments: Mapped[list["Assignment"]] = relationship(  # => co-13: default lazy loading
        back_populates="member",  # => keeps Member.assignments and Assignment.member in sync in memory
        passive_deletes=True,  # => co-22: tells the ORM NOT to null out assignment.member_id before a delete -- the
        # => database's own "ON DELETE CASCADE" (seed.py's schema) removes those rows instead, so the ORM should
        # => step out of the way rather than trying to manage a column that is part of assignment's composite PK
    )  # => end of Member.assignments' relationship() call


class Task(Base):  # => co-06: the other side of the member <-> task many-to-many link
    __tablename__ = "task"  # => the physical table name
    id: Mapped[int] = mapped_column(primary_key=True)  # => auto-assigned by Postgres
    title: Mapped[str]  # => a required TEXT column
    status: Mapped[str]  # => 'open' or 'done' -- Step 4's bulk update targets this column
    assignments: Mapped[list["Assignment"]] = relationship(  # => co-09: navigates VIA the association object
        back_populates="task",  # => keeps Task.assignments and Assignment.task in sync in memory
        passive_deletes=True,  # => co-22: same reasoning as Member.assignments above -- let the DATABASE's own
        # => "ON DELETE CASCADE" clean up assignment rows when a Task is deleted (Step 3g exercises this directly)
    )  # => end of Task.assignments' relationship() call


class Assignment(Base):  # => co-09: the ASSOCIATION OBJECT -- a real mapped class, not a bare link table
    __tablename__ = "assignment"  # => the physical M:N link table seed.py created, modeled as a full class
    member_id: Mapped[int] = mapped_column(ForeignKey("member.id"), primary_key=True)  # => half of the composite PK
    task_id: Mapped[int] = mapped_column(ForeignKey("task.id"), primary_key=True)  # => the other half of the composite PK
    hours_logged: Mapped[Decimal]  # => co-09: the EXTRA column a plain two-column link table has no natural place for
    member: Mapped[Member] = relationship(back_populates="assignments")  # => navigates back to the Member side
    task: Mapped[Task] = relationship(back_populates="assignments")  # => navigates back to the Task side


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
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine, reused across every step below

    # --- Step 3a: the identity map (co-10) -- read-only, against the shared seeded data ---
    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12), and owns ONE identity map
        by_query = session.execute(select(Member).where(Member.name == "Ada")).scalar_one()  # => query #1: fetches Ada
        by_get = session.get(Member, by_query.id)  # => co-10: same primary key, same session -- served from the IDENTITY
        # => MAP, no second SELECT at all, and it is the exact SAME Python object, not merely an equal one
        print(f"identity_map_same_object={by_query is by_get}")  # => Output: identity_map_same_object=True
        assert by_query is by_get  # => co-10: `is`, not `==` -- one Python object per primary key within this session

    # --- Step 3b: reproduce the N+1 (co-13, co-15) -- default lazy loading, read-only ---
    with query_counter(engine) as before:  # => co-15: measures the UNFIXED, lazy-default access pattern
        with Session(engine) as session:  # => a FRESH session -- nothing cached
            members = session.execute(select(Member)).scalars().all()  # => query #1: all 5 members, Barbara included
            for member in members:  # => this loop is the N+1 itself -- ONE lazy SELECT per member, even Barbara's empty one
                _ = [a.hours_logged for a in member.assignments]  # => co-13: each access fires its OWN round trip
    print(f"n_plus_1_before={before[0]} queries")  # => Output: n_plus_1_before=6 queries
    assert before[0] == 6  # => co-15: 1 parent query + 5 members, INCLUDING Barbara's -- lazy loading fires regardless
    # => of whether the relationship turns out empty; the round trip itself is the cost, not the row count it returns

    # --- Step 3c: the eager-loading fix (co-14) -- same access pattern, read-only ---
    with query_counter(engine) as after:  # => co-14: the SAME access pattern, now eager-loaded up front
        with Session(engine) as session:  # => a FRESH session -- nothing cached
            stmt = select(Member).options(selectinload(Member.assignments))  # => co-14: batches ALL 5 members' children
            members = session.execute(stmt).scalars().all()  # => query #1 (parents) + query #2 (batched children)
            for member in members:  # => identical loop to Step 3b -- but `.assignments` is already loaded in memory
                _ = [a.hours_logged for a in member.assignments]  # => reads from memory, contributes zero new SELECTs
    print(f"n_plus_1_after={after[0]} queries")  # => Output: n_plus_1_after=2 queries
    assert after[0] == 2  # => co-15: the fix collapses N+1 down to a CONSTANT 2, regardless of how many members exist

    # --- Step 3d: the raiseload guard (co-16) -- read-only, catches the exact failure Step 3b just reproduced ---
    with Session(engine) as session:  # => a FRESH session -- the guard below applies to THIS query only
        stmt = select(Member).options(raiseload(Member.assignments))  # => co-16: forbids `.assignments` from lazy-loading
        guarded = session.execute(stmt).scalars().all()  # => fetches ONLY the 5 member rows -- exactly like the default
        try:  # => the access below is EXACTLY what Step 3b's loop did on purpose, forbidden here on purpose
            _ = guarded[0].assignments  # => co-16: touching a raiseload()-guarded relationship never silently queries
            raise AssertionError("expected InvalidRequestError")  # => fails loudly if SQLAlchemy's behavior ever changes
        except InvalidRequestError as exc:  # => co-16: a LOUD, immediate error instead of a silent extra round trip
            print(f"raiseload_guard_raised={type(exc).__name__}")  # => Output: raiseload_guard_raised=InvalidRequestError

    # --- Step 3e: an ORM transaction rollback (co-17) -- mutates, then reverts, the shared seeded data ---
    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        ada = session.execute(select(Member).where(Member.name == "Ada")).scalar_one()  # => loads the SAME Ada as Step 3a
        ada.name = "Ada (uncommitted rename)"  # => co-12: the unit of work marks `ada` DIRTY -- no SQL sent yet
        session.rollback()  # => co-17: discards the uncommitted UPDATE AND expires every object this session tracked
        print(f"after_rollback_name={ada.name}")  # => Output: after_rollback_name=Ada -- expiry forces a fresh SELECT
        assert ada.name == "Ada"  # => co-17: the rename never reached the database -- rollback restored the ORIGINAL row

    # --- Step 3f: session states (co-11) + unit of work dirty tracking (co-12), on a THROWAWAY scratch team ---
    with Session(engine) as session:  # => a Session is the ORM's unit-of-work handle (co-12)
        scratch_team = Team(name="Scratch Team", members=[Member(name="Scratch A"), Member(name="Scratch B")])
        state: InstanceState[Team] = inspect(scratch_team)  # => a handle onto the object's own InstanceState (co-11)
        print(f"transient={state.transient}")  # => Output: transient=True -- STATE 1: constructed, no Session has added it
        assert state.transient  # => co-11: exactly one phase flag is ever True at a time

        session.add(scratch_team)  # => co-11: STATE 2 -- PENDING. cascades: the 2 scratch members are pending too
        print(f"pending={state.pending}")  # => Output: pending=True
        assert state.pending and not state.transient  # => moved out of transient the instant the session saw it

        session.flush()  # => co-12: the unit of work issues the INSERTs now -- team FIRST, members SECOND (FK order)
        print(f"new_before_commit={len(session.new)} objects still new")  # => Output: new_before_commit=0 objects still new
        assert len(session.new) == 0  # => co-12: flush() cleared the "new" set -- every pending object now has a real PK
        scratch_a = scratch_team.members[0]  # => reads the flushed Member back through the relationship, PK now assigned
        scratch_a.name = "Scratch A (renamed)"  # => co-12: marks scratch_a DIRTY -- the unit of work tracks this too
        print(f"dirty_before_commit={scratch_a in session.dirty}")  # => Output: dirty_before_commit=True
        assert scratch_a in session.dirty  # => co-12: session.dirty is exactly the set flush() will UPDATE next

        session.commit()  # => co-11 + co-12: STATE 3 -- PERSISTENT. flushes the pending rename, then commits everything
        print(f"persistent={state.persistent}")  # => Output: persistent=True
        assert state.persistent and not state.pending  # => co-11: the object graph is now fully durable
        scratch_team_id = scratch_team.id  # => reads `id` INSIDE the still-open session -- avoids a DetachedInstanceError

    print(f"detached={state.detached}")  # => Output: detached=True
    assert state.detached  # => co-11: STATE 4 -- the `with` block closed the session; scratch_team still exists in
    # => Python memory, still has its `id`, but is no longer tracked by ANY session's identity map or unit of work

    # --- Step 3g: two cascade DELETE flavors (co-22), cleaning the scratch team fully back out ---
    with Session(engine) as session:  # => co-09: attaches ONE scratch assignment, linking the scratch team's own member
        scratch_team_reloaded = session.get(Team, scratch_team_id)  # => reloads the persistent-but-detached scratch team
        assert scratch_team_reloaded is not None  # => narrows Optional for pyright --strict
        scratch_member = scratch_team_reloaded.members[0]  # => co-08: navigates the relationship to grab a real Member
        scratch_task = Task(title="Scratch Task", status="open")  # => co-06: a throwaway task, deleted later this step
        session.add(Assignment(member=scratch_member, task=scratch_task, hours_logged=Decimal("1.00")))  # => co-09
        session.commit()  # => flushes the scratch task AND the scratch assignment linking it to the scratch member
        scratch_task_id = scratch_task.id  # => reads `id` INSIDE the still-open session

    with Session(engine) as session:  # => co-22 flavor 1: the DATABASE's own "ON DELETE CASCADE" (seed.py's schema)
        scratch_task_reloaded = session.get(Task, scratch_task_id)  # => reloads the scratch task by its real PK
        assert scratch_task_reloaded is not None  # => narrows Optional for pyright --strict
        session.delete(scratch_task_reloaded)  # => the ORM issues a plain DELETE FROM task WHERE id = ... -- no ORM
        # => cascade config on Task.assignments at all; the scratch assignment row still vanishes, because seed.py's
        # => own "task_id INT ... REFERENCES task(id) ON DELETE CASCADE" is a DATABASE constraint, not an ORM one --
        # => it fires for ANY delete that reaches the database, regardless of which tier (raw SQL, builder, or ORM) issued it
        session.commit()  # => the scratch task, AND its scratch assignment row, are both gone after this single commit

    with Session(engine) as session:  # => co-22 flavor 2: the ORM's OWN "cascade=all, delete-orphan" (Team.members above)
        scratch_team_reloaded = session.get(Team, scratch_team_id)  # => reloads the scratch team one final time
        assert scratch_team_reloaded is not None  # => narrows Optional for pyright --strict
        session.delete(scratch_team_reloaded)  # => co-22: the ORM sees cascade="all, delete-orphan" on Team.members and
        # => issues DELETE FROM member WHERE team_id = ... BEFORE DELETE FROM team -- entirely in Python-side relationship
        # => config, since team_id itself carries NO "ON DELETE CASCADE" at the database level (contrast seed.py's plain FK)
        session.commit()  # => both scratch members AND the scratch team are now gone

        remaining_teams = session.execute(select(Team)).scalars().all()  # => a final count, back to seed.py's baseline
        remaining_members = session.execute(select(Member)).scalars().all()  # => co-22: confirms the cascade left no orphans
        remaining_tasks = session.execute(select(Task)).scalars().all()  # => confirms Step 3g's own scratch task is gone
        remaining_assignments = session.execute(select(Assignment)).scalars().all()  # => confirms the scratch link is gone
    counts = (len(remaining_teams), len(remaining_members), len(remaining_tasks), len(remaining_assignments))
    print(f"final_counts_teams_members_tasks_assignments={counts}")  # => Output: final_counts_teams_members_tasks_assignments=(2, 5, 5, 6)
    assert counts == (2, 5, 5, 6)  # => co-22: BOTH cascade-delete flavors cleaned up completely -- exactly seed.py's baseline
    print("relationships_and_n_plus_1.py OK")  # => Output: relationships_and_n_plus_1.py OK
```

**Verify**

```text
$ python3 relationships_and_n_plus_1.py
identity_map_same_object=True
n_plus_1_before=6 queries
n_plus_1_after=2 queries
raiseload_guard_raised=InvalidRequestError
after_rollback_name=Ada
transient=True
pending=True
new_before_commit=0 objects still new
dirty_before_commit=True
persistent=True
detached=True
final_counts_teams_members_tasks_assignments=(2, 5, 5, 6)
relationships_and_n_plus_1.py OK
```

The N+1 collapses from 6 queries to a constant 2 with `selectinload` -- a 3x reduction on this small
dataset that would widen linearly with every additional member under the unfixed default. The final
count line confirms both cascade-delete flavors -- the ORM's own `cascade="all, delete-orphan"` and the
database's plain `ON DELETE CASCADE` -- cleaned up completely, leaving the dataset at exactly seed.py's
original `(2, 5, 5, 6)` baseline for Step 4 to build on.

## Step 4: `migration_and_bulk.py` -- a reversible migration, then two bulk writes

_exercises co-19, co-21, co-23_

A real Alembic migration against the LIVE shared schema -- no `DROP SCHEMA`, unlike every other script
in this topic -- adding `member.active`, backfilling it, then rolling all the way back. Followed by two
set-based writes that never construct a single ORM object: a 50-row bulk insert, and a bulk `UPDATE`
that re-triages 53 rows in one statement.

**`learning/capstone/code/migration_and_bulk.py`** (complete file)

```python
# pyright: strict
"""Capstone Step 4: migration_and_bulk.py -- a reversible Alembic migration, then two bulk operations.

Assumes seed.py and relationships_and_n_plus_1.py already ran. Adds a real column to the LIVE shared
schema with a full upgrade/downgrade round trip (co-19, co-21), then closes with two set-based writes
(co-23): a 50-row bulk insert of new backlog tasks, and a bulk UPDATE that re-triages every 'open' task.
"""

from __future__ import annotations  # => enables modern type-hint syntax across this file

import contextlib  # => co-19: swallows alembic's own non-deterministic scaffolding chatter, same reason as Example 48
import io  # => the throwaway buffer redirect_stdout writes that chatter INTO
import os  # => reads connection settings, and builds/removes the scratch migration-project directory
import shutil  # => co-19: cleanup -- removes the scaffolded project directory once this step is done
import tempfile  # => co-19: a fresh, self-contained directory for the scaffolded migration project
from typing import Any  # => types SQLAlchemy's own untyped event-hook callback arguments

from alembic import command  # => co-19: init/revision/upgrade/downgrade -- the same API the alembic CLI itself calls
from alembic.config import Config  # => co-19: every alembic.command function needs one of these as its first argument
from sqlalchemy import MetaData, Table, create_engine, event, insert, text, update  # => co-23: insert()/update() build ONE bulk statement

SQLA_URL: str = os.environ.get(  # => the SQLAlchemy dialect+driver URL, distinct from a plain DB-API DSN
    "SQLA_URL",
    "postgresql+psycopg://postgres:postgres@localhost:5432/orm_by_example",  # => the fallback default
)  # => override SQLA_URL in the environment to point at a different Postgres instance

ENV_PY = (  # => co-19: the SAME minimal env.py pattern this topic's Alembic examples (48-54) all share
    "from alembic import context\n"  # => co-19: `context` is alembic's OWN migration-runtime handle
    "from sqlalchemy import engine_from_config, pool\n\n"  # => builds a real Engine straight from alembic.ini's own section
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
)  # => the fully assembled env.py source text, ready to be written out by bootstrap() below


def bootstrap(url: str, project_dir: str) -> Config:  # => co-19: init + env.py rewrite, shared setup for this step
    script_dir = os.path.join(project_dir, "migrations")  # => alembic's convention -- a "migrations" subfolder
    cfg = Config(os.path.join(project_dir, "alembic.ini"))  # => co-19: the Config object every command function needs
    cfg.set_main_option("script_location", script_dir)  # => tells Config where the scaffolded files live
    cfg.set_main_option("sqlalchemy.url", url)  # => co-19: the ONE connection string this migration runs against
    with contextlib.redirect_stdout(io.StringIO()):  # => swallows "Creating directory ... done" -- path varies per run
        command.init(cfg, script_dir)  # => co-19: scaffolds env.py, script.py.mako, README, versions/ (Example 48)
    with open(os.path.join(script_dir, "env.py"), "w") as f:  # => co-19: OVERWRITES the scaffolded env.py with our own
        f.write(ENV_PY)  # => a hand-edit step, exactly like a real project's post-init setup
    return cfg  # => ready for command.revision()/upgrade()/downgrade() calls


if __name__ == "__main__":  # => module entry point -- only runs when executed directly, not on import
    engine = create_engine(SQLA_URL)  # => an ORM-capable engine -- NOTE: no schema reset here, unlike every ex-NN example --
    # => this step deliberately runs against the LIVE team/member/task/assignment data seed.py and Step 3 already built

    # --- Step 4a: a reversible migration adding member.active (co-19, co-21) ---
    project_dir = tempfile.mkdtemp(prefix="alembic_capstone_")  # => a fresh, throwaway migration project for this step
    cfg = bootstrap(SQLA_URL, project_dir)  # => scaffolds + rewires env.py, matching Examples 48-54's own setup

    with contextlib.redirect_stdout(io.StringIO()):  # => swallows "Generating .../0001_add_member_active.py ... done"
        rev = command.revision(cfg, message="add member active flag", rev_id="0001")  # => co-19: an EMPTY skeleton, filled in below
    assert rev is not None and not isinstance(rev, list)  # => narrows the Union return type for pyright --strict below
    with open(rev.path, "w") as f:  # => co-19 + co-21: add-nullable, backfill, then tighten -- a REAL reversible round trip
        f.write(  # => overwrites the empty skeleton command.revision() scaffolded with real upgrade/downgrade logic
            '"""add member active flag"""\n'  # => the migration's own docstring
            "from typing import Sequence, Union\n"  # => typed to match what command.revision()'s own skeleton generates
            "from alembic import op\n"  # => co-19: `op.add_column`/`op.alter_column`/`op.drop_column` -- the schema edits
            "import sqlalchemy as sa\n\n"  # => the column TYPE for the new active column
            'revision: str = "0001"\n'  # => co-19: THIS revision's own id -- matches the rev_id passed to command.revision()
            "down_revision: Union[str, Sequence[str], None] = None\n"  # => None -- the first (and only) revision this step adds
            "branch_labels: Union[str, Sequence[str], None] = None\n"  # => unused here -- relevant only for branching histories
            "depends_on: Union[str, Sequence[str], None] = None\n\n"  # => unused here -- cross-branch dependency declarations
            "def upgrade() -> None:\n"  # => co-19: FORWARD -- adds active, backfills every EXISTING member to True, then tightens
            '    op.add_column("member", sa.Column("active", sa.Boolean(), nullable=True))\n'  # => nullable UNTIL backfilled
            "    conn = op.get_bind()\n"  # => co-19: op.get_bind() -- the LIVE connection this migration runs on
            '    conn.execute(sa.text("UPDATE member SET active = TRUE"))\n'  # => co-19: backfills every one of the 5 EXISTING rows
            '    op.alter_column("member", "active", nullable=False)\n\n'  # => co-19: NOW safe to require -- every row is backfilled
            "def downgrade() -> None:\n"  # => co-21: REVERSE -- drops the column, restoring the EXACT original member shape
            '    op.drop_column("member", "active")\n'  # => co-21: a true reversal -- no other column touched
        )  # => end of the revision file's full source text

    with contextlib.redirect_stdout(io.StringIO()):  # => swallows alembic's own noisy status lines
        command.upgrade(cfg, "head")  # => co-19: STEP 1 -- adds + backfills active for the 5 existing members
    with engine.begin() as conn:  # => a fresh connection to verify the UPGRADED state
        active_count = conn.execute(text("SELECT count(*) FROM member WHERE active = TRUE")).scalar_one()  # => reads the backfill
    print(f"after_upgrade_active_count={active_count}")  # => Output: after_upgrade_active_count=5
    assert active_count == 5  # => co-19: every one of the 5 pre-existing members was backfilled to active=TRUE, none skipped

    with contextlib.redirect_stdout(io.StringIO()):  # => swallows alembic's own noisy status lines
        command.downgrade(cfg, "base")  # => co-21: STEP 2 -- drops the column, undoing Step 1 completely
    with engine.begin() as conn:  # => a fresh connection to verify the column is truly GONE
        columns = conn.execute(  # => reads member's REAL columns straight from Postgres' own information_schema
            text("SELECT column_name FROM information_schema.columns WHERE table_name = 'member'")
        ).all()  # => a list of (column_name,) rows -- checked below for "active"'s absence
    has_active_after_down = "active" in {row[0] for row in columns}  # => co-21: confirms the rollback actually removed it
    print(f"has_active_after_downgrade={has_active_after_down}")  # => Output: has_active_after_downgrade=False
    assert has_active_after_down is False  # => co-21: member is back to its EXACT original shape -- id, name, team_id only
    shutil.rmtree(project_dir)  # => cleanup -- this step's own throwaway migration project, not a real repository

    # --- Step 4b: a 50-row bulk insert (co-23) -- ONE statement, not 50 round trips ---
    insert_statements: list[str] = []  # => every INSERT this step emits, captured for verification
    update_statements: list[str] = []  # => every UPDATE this step emits, captured for verification

    def on_execute(conn: Any, cursor: Any, statement: str, *rest: Any) -> None:  # => untyped hook params (SQLAlchemy's own)
        upper = statement.strip().upper()  # => normalizes once, checked against below
        if upper.startswith("INSERT INTO TASK"):  # => this hook only cares about task-table write traffic
            insert_statements.append(statement)  # => Step 4b's bulk insert should append exactly ONE entry here
        elif upper.startswith("UPDATE TASK"):  # => same table, the OTHER bulk write Step 4c below issues
            update_statements.append(statement)  # => Step 4c's bulk update should append exactly ONE entry here

    event.listens_for(engine, "before_cursor_execute")(on_execute)  # => attaches the hook to every statement on `engine`

    with engine.begin() as conn:  # => a plain Core connection -- no Session, no ORM objects involved at all
        backlog_rows = [{"title": f"Backlog Task {i}", "status": "open"} for i in range(1, 51)]  # => 50 plain dicts
        # => co-23: PyPika could build this same statement (co-03), but SQLAlchemy Core's own insert() is used here --
        # => the CHOICE between them is style, not capability; either tier avoids loading rows into Python objects
        metadata = MetaData()  # => co-23: a fresh, empty registry -- reflection below fills it in from the LIVE database,
        # => no declarative model needed just to bulk-write into a table that already exists on disk
        task_tbl = Table("task", metadata, autoload_with=conn)  # => co-23: reads task's REAL columns straight from Postgres
        conn.execute(insert(task_tbl), backlog_rows)  # => co-23: ONE Core insert(), executed with a LIST of 50 parameter sets
    with engine.begin() as conn:  # => a fresh connection, just to read back the final task count
        total_tasks = conn.execute(text("SELECT count(*) FROM task")).scalar_one()  # => confirms every row actually landed
    print(f"total_tasks_after_bulk_insert={total_tasks}")  # => Output: total_tasks_after_bulk_insert=55
    print(f"INSERT statements emitted: {len(insert_statements)}")  # => Output: INSERT statements emitted: 1
    assert total_tasks == 55  # => co-23: seed.py's original 5 tasks, plus all 50 backlog rows -- none dropped, none duplicated
    assert len(insert_statements) == 1  # => co-23: ONE statement, not 50 separate round trips

    # --- Step 4c: a set-based bulk UPDATE (co-23) -- re-triages EVERY 'open' task in one statement ---
    with engine.begin() as conn:  # => reuses the SAME reflected task_tbl -- no re-reflection needed for a second statement
        stmt = update(task_tbl).where(task_tbl.c.status == "open").values(status="triaged")  # => co-23: a SET-BASED expression
        # => matches BOTH seed.py's original open tasks (3 of the 5 non-done ones -- "Design onboarding flow" and
        # => "Write API docs" and "Plan Q3 roadmap") AND all 50 freshly bulk-inserted backlog rows, in ONE pass
        result = conn.execute(stmt)  # => co-23: Postgres reads AND writes every matching row server-side, in a single statement
        rows_matched = result.rowcount  # => the DRIVER's own count of rows this ONE statement actually touched
    with engine.begin() as conn:  # => a fresh connection, just to read back the final status breakdown
        triaged_count = conn.execute(text("SELECT count(*) FROM task WHERE status = 'triaged'")).scalar_one()  # => cross-check against rows_matched
    print(f"rows_matched_by_update={rows_matched} triaged_count={triaged_count}")  # => Output: rows_matched_by_update=53 triaged_count=53
    print(f"UPDATE statements emitted: {len(update_statements)}")  # => Output: UPDATE statements emitted: 1
    assert rows_matched == 53 and triaged_count == 53  # => co-23: 3 original open tasks + 50 backlog tasks, ALL re-triaged
    assert len(update_statements) == 1  # => co-23: ONE statement, not 53 separate per-row round trips
    # => co-23: a per-object ORM loop equivalent to Step 4b + 4c would have issued 50 INSERTs plus 53 UPDATEs -- 103
    # => round trips total, versus the 2 set-based statements this step actually sent; this is exactly the tradeoff
    # => co-25 names -- the ORM's per-object machinery (identity map, change tracking, cascades) earns its keep on
    # => CRUD and object-graph navigation (Step 3's whole point), and gets out of the way entirely for bulk writes like this
    print("migration_and_bulk.py OK")  # => Output: migration_and_bulk.py OK
```

**Verify**

```text
$ python3 migration_and_bulk.py
after_upgrade_active_count=5
has_active_after_downgrade=False
total_tasks_after_bulk_insert=55
INSERT statements emitted: 1
rows_matched_by_update=53 triaged_count=53
UPDATE statements emitted: 1
migration_and_bulk.py OK
```

The migration round-trips cleanly: all 5 existing members are backfilled to `active=TRUE`, then
`downgrade()` removes the column entirely, restoring `member`'s exact original three-column shape. The
two bulk writes that follow move 55 total tasks and re-triage 53 of them without a single per-row
`INSERT`/`UPDATE` -- 2 statements total, versus the 103 round trips a per-object ORM loop over the same
data would have issued.

## Acceptance criteria

- `report_three_tiers.py`'s three tiers return byte-for-byte identical results: `sql_result ==
builder_result == orm_result`, and the hand-computed totals (`Platform: 16.50`, `Growth: 12.50`) match
  every tier's output exactly, including Barbara's zero-assignment row contributing `0`, not a dropped row.
- `relationships_and_n_plus_1.py`'s N+1 measurement is exact, not approximate: 6 queries before the fix
  (1 parent + 5 members, Barbara's empty one included), a constant 2 after `selectinload` -- and the
  script's OWN final counts (`(2, 5, 5, 6)`) confirm both cascade-delete mechanisms fully restored the
  dataset to seed.py's original baseline, leaving no orphaned scratch rows behind.
- `raiseload(Member.assignments)` converts the EXACT access pattern the N+1 measurement reproduced into
  an immediate `InvalidRequestError`, caught and reported, never a silent extra round trip.
- The rollback demonstration proves the uncommitted rename never reached the database: `ada.name == "Ada"`
  after `session.rollback()`, read from the SAME session, via the object's own automatic expiry.
- `migration_and_bulk.py`'s migration is a TRUE round trip: `active=TRUE` for all 5 members after
  `upgrade()`, and the `active` column is completely gone from `information_schema.columns` after
  `downgrade()` -- not merely emptied or set NULL.
- Both bulk writes in `migration_and_bulk.py` are genuinely set-based: exactly 1 `INSERT` statement moves
  50 rows, and exactly 1 `UPDATE` statement re-triages 53 rows -- never one statement per row.
- No query anywhere across all four scripts uses string interpolation to build SQL where a value varies
  -- every raw-SQL value is a `%s` placeholder (co-05) or an ORM/Core bound parameter.
- `pyright` (this topic's own `pyrightconfig.json`, strict mode) reports `0 errors, 0 warnings, 0
informations` across all four capstone scripts, and `ruff format --check` is clean.
- Every listing on this page (`seed.py`, `report_three_tiers.py`, `relationships_and_n_plus_1.py`,
  `migration_and_bulk.py`) is the complete, verbatim file, runnable exactly as shown, in the order the
  four "Step" headings present them -- nothing here is a fragment depending on code the page does not
  also show.

---

← Previous: [Advanced Examples](../advanced.md) &middot; Next: [Drilling](../../drilling/overview.md) →
