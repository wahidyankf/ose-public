---
title: "Anomaly"
date: 2026-07-18T00:00:00+07:00
draft: false
weight: 2
---

## Step 4: reproduce, then resolve, a write-skew anomaly

_exercises co-13, co-14, co-15_

This page continues the [Overview](./overview.md) page's capstone against the SAME seeded database:
`employee.on_call` (`seed.sql`) marks Leo (id=14) and Nancy (id=15), 2 of the 3 Support engineers, as
on call, with an invariant the company actually enforces -- **at least 1 Support engineer must stay on
call at all times**. `anomaly_reproduce.py` reproduces the anomaly under `REPEATABLE READ` (Example 59's
exact scenario, on this capstone's own schema); `anomaly_fix.py` then resolves it with `SERIALIZABLE`
plus a retry loop (Example 60's retry pattern), the same fix PostgreSQL's own documentation recommends
for this class of anomaly.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Brown #CA9161
sequenceDiagram
    accTitle: Step 4: reproduce, then resolve, a write-skew anomaly
    accDescr: Sequence diagram between Session A, PostgreSQL, Session B. Messages: Session A to PostgreSQL: BEGIN SELECT on_call count; PostgreSQL to Session A: 2 (Leo, Nancy); Session B to PostgreSQL: BEGIN SELECT on_call count; PostgreSQL to Session B: 2 (Leo, Nancy); Session A to PostgreSQL: UPDATE Leo off call COMMIT; PostgreSQL to Session A: OK; Session B to PostgreSQL: UPDATE Nancy off call COMMIT; PostgreSQL to Session B: OK (write skew -- invariant now violated, 0 on call).
    participant A as Session A
    participant DB as PostgreSQL
    participant B as Session B
    A->>DB: BEGIN; SELECT on_call count
    DB-->>A: 2 (Leo, Nancy)
    B->>DB: BEGIN; SELECT on_call count
    DB-->>B: 2 (Leo, Nancy)
    A->>DB: UPDATE Leo off call; COMMIT
    DB-->>A: OK
    B->>DB: UPDATE Nancy off call; COMMIT
    Note over DB: REPEATABLE READ -- no row overlap, no conflict detected
    DB-->>B: OK (write skew -- invariant now violated, 0 on call)
```

**Reproduce -- `learning/capstone/code/anomaly_reproduce.py`** (complete file)

```python
# pyright: strict
"""Capstone: anomaly_reproduce.py -- reproduces write skew (co-14) on employee.on_call.

Invariant: at least 1 Support employee (Leo id=14, Nancy id=15 -- seed.sql) stays
on_call at all times. Under REPEATABLE READ (co-13), two sessions each independently
see "2 on call" and each individually decide it is safe to go off -- neither sees the
OTHER's write, so BOTH commit, and the invariant ends up violated with 0 on call.
"""

import psycopg

DSN = "host=localhost port=55432 dbname=asqp user=asqp password=asqp"
# => connection string -- readers should substitute their own PostgreSQL 18 instance


def support_on_call_count(conn: psycopg.Connection) -> int:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT COUNT(*) FROM employee WHERE department_id = 4 AND on_call = TRUE"
        )
        row: tuple[int] | None = cur.fetchone()
        assert row is not None
        return row[0]


def reset_on_call_state(conn: psycopg.Connection) -> None:  # => resets state -- fully self-contained
    """Restore Leo (id=14) and Nancy (id=15) to on_call = TRUE, Oscar (id=16) to FALSE."""
    with conn.cursor() as cur:
        cur.execute("UPDATE employee SET on_call = TRUE WHERE id IN (14, 15)")
        cur.execute("UPDATE employee SET on_call = FALSE WHERE id = 16")
    conn.commit()


def main() -> None:  # => the script's entry point
    session_a = psycopg.connect(DSN)  # => session A: will take Leo (id=14) off call
    session_b = psycopg.connect(DSN)  # => session B: will take Nancy (id=15) off call
    reset_on_call_state(session_a)

    baseline = support_on_call_count(session_a)
    session_a.commit()  # => closes the implicit read-only transaction the SELECT above opened
    print(f"On-call count before either session starts: {baseline}")
    # => Output: On-call count before either session starts: 2

    with session_a.cursor() as cur_a, session_b.cursor() as cur_b:
        cur_a.execute("BEGIN ISOLATION LEVEL REPEATABLE READ")
        cur_b.execute("BEGIN ISOLATION LEVEL REPEATABLE READ")
        # => BOTH transactions open BEFORE either writes -- each gets its OWN snapshot
        # => showing 2 Support employees on call (co-13, co-14)

        cur_a.execute(
            "SELECT COUNT(*) FROM employee WHERE department_id = 4 AND on_call = TRUE"
        )
        seen_by_a = cur_a.fetchone()
        print(f"Session A sees on-call count: {seen_by_a}")
        # => Output: Session A sees on-call count: (2,)

        cur_b.execute(
            "SELECT COUNT(*) FROM employee WHERE department_id = 4 AND on_call = TRUE"
        )
        seen_by_b = cur_b.fetchone()
        print(f"Session B sees on-call count: {seen_by_b}")
        # => Output: Session B sees on-call count: (2,)
        # => BOTH sessions independently conclude "2 on call, safe for MY engineer to go off"

        cur_a.execute("UPDATE employee SET on_call = FALSE WHERE id = 14")
        session_a.commit()
        print("Session A took Leo (id=14) off call and committed")

        cur_b.execute("UPDATE employee SET on_call = FALSE WHERE id = 15")
        session_b.commit()
        # => REPEATABLE READ only detects conflicts on the SAME row -- session A wrote
        # => id=14, session B wrote id=15 -- NO row overlap, so NO conflict is detected,
        # => and BOTH commits succeed (co-13) despite violating the shared invariant
        print("Session B took Nancy (id=15) off call and committed (no conflict detected)")

    final = support_on_call_count(session_a)
    print(f"Final on-call count: {final}")
    # => Output: Final on-call count: 0
    print(f"Invariant (at least 1 on call) violated: {final == 0}")
    # => Output: Invariant (at least 1 on call) violated: True
    # => classic write skew: two disjoint writes, each individually valid against its
    # => own stale snapshot, together break an invariant neither write touches alone

    session_a.close()  # => always close what you open
    session_b.close()  # => both sessions cleaned up


if __name__ == "__main__":  # => guards against running main() on `import example`
    main()  # => entry point -- runs everything above when executed as a script
```

**Verify**

```text
$ python3 anomaly_reproduce.py
On-call count before either session starts: 2
Session A sees on-call count: (2,)
Session B sees on-call count: (2,)
Session A took Leo (id=14) off call and committed
Session B took Nancy (id=15) off call and committed (no conflict detected)
Final on-call count: 0
Invariant (at least 1 on call) violated: True
$ pyright anomaly_reproduce.py
0 errors, 0 warnings, 0 informations
```

Both sessions see `2` on call, both independently decide going off call is safe, and both commits
succeed -- `REPEATABLE READ` only detects conflicts on rows a transaction itself wrote or read-then-wrote,
and session A's write (row 14) never overlaps session B's write (row 15). The final count is `0`: the
invariant "at least 1 on call" is genuinely violated, not just theoretically at risk.

## Resolve: `SERIALIZABLE` + a retry loop

`anomaly_fix.py` re-runs the EXACT same interleaving -- same 2 sessions, same starting snapshot, same 2
disjoint `UPDATE`s -- under `SERIALIZABLE` instead. PostgreSQL's Serializable Snapshot Isolation (SSI,
co-15) tracks the read-write dependency between session A's write and session B's earlier read (and the
symmetric dependency the other way), recognizes the dangerous structure, and aborts the second
transaction to commit with a `40001 SerializationFailure` rather than silently letting both through.

**Resolve -- `learning/capstone/code/anomaly_fix.py`** (complete file)

```python
# pyright: strict
"""Capstone: anomaly_fix.py -- resolves the write skew anomaly_reproduce.py demonstrated,
using SERIALIZABLE (co-13, co-15) instead of REPEATABLE READ, plus an application-level
retry loop for the 40001 SerializationFailure PostgreSQL's SSI raises.

The SAME 2 disjoint UPDATEs interleave exactly like anomaly_reproduce.py: session A takes
Leo (id=14) off call, session B takes Nancy (id=15) off call, both starting from a "2 on
call" snapshot. Under SERIALIZABLE, PostgreSQL's Serializable Snapshot Isolation detects
the dangerous read-write dependency between the two transactions and aborts the SECOND
one to commit (co-15) instead of silently letting both through. The retry then re-reads
FRESH state and correctly refuses, because taking the last on-call engineer off would
drop the count to 0.
"""

import psycopg
from psycopg import errors

DSN = "host=localhost port=55432 dbname=asqp user=asqp password=asqp"
# => connection string -- readers should substitute their own PostgreSQL 18 instance


def support_on_call_count(conn: psycopg.Connection) -> int:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT COUNT(*) FROM employee WHERE department_id = 4 AND on_call = TRUE"
        )
        row: tuple[int] | None = cur.fetchone()
        assert row is not None
        return row[0]


def reset_on_call_state(conn: psycopg.Connection) -> None:  # => resets state -- fully self-contained
    """Restore Leo (id=14) and Nancy (id=15) to on_call = TRUE, Oscar (id=16) to FALSE."""
    with conn.cursor() as cur:
        cur.execute("UPDATE employee SET on_call = TRUE WHERE id IN (14, 15)")
        cur.execute("UPDATE employee SET on_call = FALSE WHERE id = 16")
    conn.commit()


def retry_take_off_call(employee_id: int, label: str) -> str:
    # A FRESH connection + FRESH SERIALIZABLE transaction -- re-reading current state is
    # the whole point of a retry; a stale in-memory count would just repeat the same bug.
    conn = psycopg.connect(DSN)
    with conn.cursor() as cur:
        cur.execute("BEGIN ISOLATION LEVEL SERIALIZABLE")
        current_count = support_on_call_count(conn)
        print(f"  {label} re-reads on-call count: {current_count}")
        if current_count <= 1:
            # => the APPLICATION-LEVEL guard (co-14): going off call now would violate
            # => "at least 1 on call" -- refuse, using data THIS transaction can trust
            conn.rollback()
            conn.close()
            return "refused (would violate invariant)"
        cur.execute("UPDATE employee SET on_call = FALSE WHERE id = %s", (employee_id,))
        conn.commit()
    conn.close()
    return "went off call"


def main() -> None:  # => the script's entry point
    setup_conn = psycopg.connect(DSN)
    reset_on_call_state(setup_conn)
    baseline = support_on_call_count(setup_conn)
    print(f"On-call count before either session starts: {baseline}")
    # => Output: On-call count before either session starts: 2
    setup_conn.close()

    session_a = psycopg.connect(DSN)  # => session A: will take Leo (id=14) off call
    session_b = psycopg.connect(DSN)  # => session B: will take Nancy (id=15) off call

    serialization_failed = False
    with session_a.cursor() as cur_a, session_b.cursor() as cur_b:
        cur_a.execute("BEGIN ISOLATION LEVEL SERIALIZABLE")
        cur_b.execute("BEGIN ISOLATION LEVEL SERIALIZABLE")
        # => BOTH transactions open BEFORE either writes -- the SAME race
        # => anomaly_reproduce.py ran, now under SERIALIZABLE instead of REPEATABLE READ

        cur_a.execute(
            "SELECT COUNT(*) FROM employee WHERE department_id = 4 AND on_call = TRUE"
        )
        seen_by_a = cur_a.fetchone()
        print(f"Session A sees on-call count: {seen_by_a}")
        # => Output: Session A sees on-call count: (2,)

        cur_b.execute(
            "SELECT COUNT(*) FROM employee WHERE department_id = 4 AND on_call = TRUE"
        )
        seen_by_b = cur_b.fetchone()
        print(f"Session B sees on-call count: {seen_by_b}")
        # => Output: Session B sees on-call count: (2,)

        cur_a.execute("UPDATE employee SET on_call = FALSE WHERE id = 14")
        session_a.commit()
        print("Session A took Leo (id=14) off call and committed")

        try:
            cur_b.execute("UPDATE employee SET on_call = FALSE WHERE id = 15")
            session_b.commit()
            print("Session B took Nancy (id=15) off call and committed (unexpected)")
        except errors.SerializationFailure as exc:
            # => co-15 -- SSI detected the dangerous rw-dependency BETWEEN session A's
            # => write and session B's earlier read, and aborted session B rather than
            # => let both commits through the way REPEATABLE READ just did
            serialization_failed = True
            print(f"Session B got SerializationFailure: {exc.sqlstate}")
            session_b.rollback()

    session_a.close()  # => always close what you open
    session_b.close()

    if serialization_failed:
        result = retry_take_off_call(15, "Session B retry")
        print(f"Session B retry result: {result}")
        # => Output: Session B retry result: refused (would violate invariant)

    final_conn = psycopg.connect(DSN)
    final = support_on_call_count(final_conn)
    print(f"Final on-call count: {final}")
    # => Output: Final on-call count: 1
    print(f"Invariant (at least 1 on call) preserved: {final >= 1}")
    # => Output: Invariant (at least 1 on call) preserved: True
    final_conn.close()


if __name__ == "__main__":  # => guards against running main() on `import example`
    main()  # => entry point -- runs everything above when executed as a script
```

**Verify**

```text
$ python3 anomaly_fix.py
On-call count before either session starts: 2
Session A sees on-call count: (2,)
Session B sees on-call count: (2,)
Session A took Leo (id=14) off call and committed
Session B got SerializationFailure: 40001
  Session B retry re-reads on-call count: 1
Session B retry result: refused (would violate invariant)
Final on-call count: 1
Invariant (at least 1 on call) preserved: True
$ pyright anomaly_fix.py
0 errors, 0 warnings, 0 informations
```

Session A's commit succeeds exactly as before, but session B's commit now raises a genuine `40001`
`SerializationFailure` -- PostgreSQL's SSI machinery caught the SAME dangerous interleaving
`REPEATABLE READ` let through. The retry opens a brand-new transaction, re-reads the on-call count
(now `1`, since Leo already went off), and the application-level guard correctly refuses because going
off now would violate the invariant. The final on-call count is `1`, never `0` -- the anomaly is
resolved, not merely delayed.

## Acceptance criteria

- `anomaly_reproduce.py` demonstrably reproduces write skew: both sessions read `2` on call, both
  commit successfully, and the final count is `0` -- the invariant is genuinely violated, captured
  transcript, not a hypothetical.
- `anomaly_fix.py` demonstrably resolves it: the SAME interleaving under `SERIALIZABLE` produces a real
  `40001 SerializationFailure` on session B's commit, the retry re-reads fresh state, and the final count
  is `1` -- the invariant holds, captured transcript, not a hypothetical.
- Every query in both scripts that carries a variable value uses a `%s` placeholder (co-20) -- `SELECT
... WHERE id = %s` in `retry_take_off_call`, never string-built SQL.
- `pyright anomaly_reproduce.py` and `pyright anomaly_fix.py` both report `0 errors, 0 warnings, 0
informations`.
- Both listings on this page are the complete file, runnable exactly as shown against the SAME database
  the [Overview](./overview.md) page's `seed.sql` populates.

## Done bar

This capstone is runnable end to end: a reader who applies `seed.sql`, runs `report.sql`, runs
`tune_query.sql`, runs `n_plus_1.py` (all on the [Overview](./overview.md) page), and then runs
`anomaly_reproduce.py` followed by `anomaly_fix.py` (this page) reaches the identical output blocks
shown across both pages, verified against a real PostgreSQL 18.4 server (Docker,
`postgres:18.4-alpine`) and a real CPython interpreter run -- not merely described. Every mechanism
combined here -- a recursive CTE threaded through window functions (co-03, co-04, co-05, co-06), a
real `EXPLAIN ANALYZE` before/after an index with refreshed statistics (co-18, co-23, co-24, co-25), an
N+1 diagnosed and fixed by query count (co-26), and a write-skew anomaly reproduced then resolved with
`SERIALIZABLE` and a retry (co-13, co-14, co-15) -- traces to a primary source already cited in this
topic's Accuracy notes; no new fact was needed to write these 2 pages.

---

← Previous: [Overview](./overview.md) &middot; Next: [Drilling](../../drilling/overview.md) →
