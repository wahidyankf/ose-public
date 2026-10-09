# 004 — Code, Runtime, and `run.yaml`

How the ERP examples run. Plan 05 owns the `run.yaml` contract (`ayokoding.run/v1`), the toolchain catalog,
and the CLI. Plan 06 adopted that contract for the accounting courses and fixed the database conventions
(driver, lockfile, `psql` toolchain, schema rules, two-session patterns). This file does not restate the
contract and does not invent a second set of database conventions: it says how the 30 ERP courses use plan 05
and plan 06, lists the determinism rules for ERP code, and defines the Phase 0 probes that prove the
assumptions before any course is written. Where plan 06's merged text differs from this page, Phase 0 records
the difference and the merged text wins (see [D5](./009-decision-records.md#d5--postgresql-example-shape)).

## Runtime Policy

- **Python 3.14, standard library only** is the default toolchain (`toolchain: python`, catalog version
  3.14.8 on 2026-10-09; plan 05's version policy may move it to a newer final release and the courses follow
  the catalog). A Python-only unit has no lockfile and installs nothing.
- **PostgreSQL 18** (`services: [postgres]`, catalog version 18.6) backs the 14 courses in the table below.
  A unit uses the database in one of two shapes, chosen per example by what the lesson teaches:
  - a **`psql` SQL unit** (`toolchain: psql`, a `main.sql` script) when the subject is the SQL itself: a
    schema, a constraint, a query, a lock, an isolation level, a sequence;
  - a **Python unit with `pg8000`** (`toolchain: python`, a hash-locked pure-Python driver) when application
    code drives the database: a posting engine, a retry loop, an allocation service, a `Decimal` calculation
    around queries.
    PostgreSQL is the only SQL engine in these courses; `sqlite3` is not used, so a reader never learns a dialect
    that the production database does not speak.
- **Simulation** (`simulation: true`) is used by two courses, for the examples whose subject is interleaving or
  message delivery.
- **No other toolchain.** No ERP example needs Node, Java, Go, or a cloud service. Series decision 32 allows
  `mode: static` only for cloud, cluster, iOS, Android, and Windows code, so the expected count of `static`
  units in these 30 courses is zero. A `static` unit would be a finding.
- **No network, no clock, no randomness.** The harness gives no network and a fixed environment. The
  determinism rules below cover the rest.

## Which Courses Use PostgreSQL and Simulation

| Pos | Course                                       | PostgreSQL examples | Of total | Simulation examples |
| --- | -------------------------------------------- | ------------------- | -------- | ------------------- |
| 2   | `erp-conceptual-data-model`                  | 6                   | 48       | 0                   |
| 4   | `erp-document-lifecycle-and-state-machines`  | 6                   | 48       | 0                   |
| 6   | `erp-subledger-to-gl-architecture`           | 16                  | 78       | 0                   |
| 8   | `erp-numbering-sequences-and-uom-conversion` | 16                  | 48       | 0                   |
| 9   | `erp-audit-trail-and-change-tracking`        | 17                  | 48       | 0                   |
| 13  | `record-to-report-systems`                   | 8                   | 78       | 0                   |
| 14  | `inventory-and-warehouse-management`         | 8                   | 78       | 0                   |
| 15  | `erp-inventory-costing-methods`              | 9                   | 78       | 0                   |
| 16  | `erp-inventory-integrity-and-concurrency`    | 70                  | 78       | 8                   |
| 17  | `erp-bom-and-routing-architecture`           | 17                  | 78       | 0                   |
| 20  | `erp-availability-and-reservations`          | 8                   | 78       | 0                   |
| 22  | `erp-extension-and-customization`            | 17                  | 78       | 0                   |
| 23  | `erp-integration-patterns`                   | 9                   | 78       | 10                  |
| 27  | `erp-analytics-and-reporting`                | 78                  | 78       | 0                   |

Counts are planning estimates at cluster level. Slice S0 of each course confirms them when it expands the
example list and marks each PostgreSQL example `sql` (a `psql` unit) or `py` (a Python unit). The totals are 285
PostgreSQL examples in 14 courses and 18 simulation examples in two courses.

## Unit Layout

Paths are relative to the course folder. "Code root" is the folder the harness copies into the run
(plan 05 [Runtime View](../../ayokoding-learn-revamp-05-code-harness/tech-docs/003-run-yaml-contract.md#runtime-view)).

| Kind     | Folder                          | Code root        | Shared files in the code root                                                                         |
| -------- | ------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------- |
| Example  | `learning/code/ex-NN-<slug>/`   | `learning/code/` | `README.md`; in a course with a Python PostgreSQL unit also `requirements.in` and `requirements.lock` |
| Kata     | `drilling/code/kata-NN-<slug>/` | `drilling/code/` | `README.md` only; the lockfile is named by path, not copied in                                        |
| Capstone | `learning/capstone/code/`       | itself           | its own files                                                                                         |

- An example unit holds the program (`example.py` or `main.sql`, plus helper modules inside the unit when the
  example needs more than one file), `run.yaml`, and `expected/<run>.stdout.txt`. **Every unit is
  self-contained: there is no helper shared between units.** The gates read each example on its own, and a
  reader copies one folder. A few repeated lines of connection and schema setup are the price, and each lesson
  annotates them.
- A kata unit holds `before/` and `after/`, each with its code file (`kata.py` or `kata.sql`), `run.yaml`,
  and `expected/before.stdout.txt` and `expected/after.stdout.txt`. The two runs use `workdir: before` and
  `workdir: after`.
- Every `ex-NN` number matches the lesson heading number: `### Example 17: ...` is `ex-17-<slug>/`.
  Annotated-Concept units are numbered by their worked-example number, so gaps are expected for the
  diagram- and table-only worked examples that have no unit.
- Expected files are `.txt`, as the contract requires. The maker records them with `EX-RECORD` right after
  writing each unit; the command only writes missing files and never overwrites one. The maker then
  **reads every recorded file** and confirms it shows what the lesson claims. A recorded file nobody read
  is not evidence.

## `run.yaml` Templates

Every template below starts with `schema: ayokoding.run/v1`. Replace the angle-bracket values. The `timeout`
values are starting points; Phase 0 probe P8 confirms them.

### Python-only example

```yaml
schema: ayokoding.run/v1
toolchain: python
runs:
  - name: main
    command: [python3, example.py]
    timeout: 30s
    expect:
      exit: 0
      stdout: expected/main.stdout.txt
```

### PostgreSQL example, SQL unit

```yaml
schema: ayokoding.run/v1
toolchain: psql
services: [postgres]
runs:
  - name: main
    command: [psql, -X, -v, ON_ERROR_STOP=1, -f, main.sql]
    timeout: 60s
    expect:
      exit: 0
      stdout: expected/main.stdout.txt
```

The command is plan 06's. An example whose last statement is a refusal expects `exit: 3` and adds
`stderr: expected/main.stderr.txt`, which holds the `ERROR:` line (psql exits 3 when `ON_ERROR_STOP` stops a
script). An example that must show a refusal and then continue catches it in a `DO` block and records the
SQLSTATE in a small table, so the script never stops.

### PostgreSQL example, Python unit

```yaml
schema: ayokoding.run/v1
toolchain: python
services: [postgres]
dependencies:
  lockfile: learning/code/requirements.lock
runs:
  - name: main
    command: [python3, example.py]
    timeout: 60s
    expect:
      exit: 0
      stdout: expected/main.stdout.txt
```

- The toolchain sets `PYTHONPATH=/deps/python`, where the lockfile's packages are installed, so a run needs
  no `env` entry. Probe P3 confirms it.
- The lockfile path is course-relative and identical in every unit of the course, katas and capstone
  included, so a course has exactly one environment image.

### Test run (capstone and selected examples)

```yaml
- name: tests
  kind: test
  command: [python3, -m, unittest, -q]
  timeout: 60s
  expect:
    exit: 0
    stdout: ignore
    stderr: ignore
```

`unittest` prints its timing line on standard error, so the run ignores both streams and relies on the exit
status, which the contract defines as "the runner exits 0 only when every check passes" for `kind: test`.
(Plan 06's template for the same run omits `stderr: ignore`; Phase 0 probe P1 shows which form passes, and the
passing form is used.) pytest is not used: it would add a dependency to every course.

### Simulation example

```yaml
schema: ayokoding.run/v1
toolchain: python
runs:
  - name: simulate
    command: [python3, simulate.py]
    simulation: true
    timeout: 120s
    expect:
      exit: 0
      stdout: expected/simulate.stdout.txt
```

The program follows the plan 05 simulation convention (S1 to S9): one seeded generator, a virtual clock,
invariants after every step, the fixed seed set `range(1, 65)` (64 seeds, above the 32 minimum), one
`failing seed: <n> (<invariant>)` line per failing seed, and a last line
`seeds: <passed> passed, <failed> failed (of <total>)`. A bug demonstration expects `exit: 1` and an expected
file that lists the failing seeds. A reader replays one seed with
`AYOKODING_SEED=17 python3 simulate.py`.

### Kata

```yaml
schema: ayokoding.run/v1
toolchain: python
runs:
  - name: before
    command: [python3, kata.py]
    workdir: before
    timeout: 30s
    expect:
      exit: 1
      stdout: expected/before.stdout.txt
  - name: after
    command: [python3, kata.py]
    workdir: after
    timeout: 30s
    expect:
      exit: 0
      stdout: expected/after.stdout.txt
```

The `before` run exits 1 on purpose: its program checks an invariant and fails with a one-line reason on
standard output (not a traceback, which carries paths). A bug that is silent in the `before` program instead
expects `exit: 0` and the wrong result in its expected file, as plan 06's kata template does. A PostgreSQL kata
adds `services` and, for a Python kata, `dependencies`; a SQL kata uses `toolchain: psql` and the `psql`
command above. The `expected/` folder sits in the kata folder and expected paths stay unit-relative.

### Capstone

```yaml
schema: ayokoding.run/v1
toolchain: python
runs:
  - name: stage-1
    command: [python3, main.py, stage-1]
    timeout: 60s
    expect:
      exit: 0
      stdout: expected/stage-1.stdout.txt
  - name: stage-2
    command: [python3, main.py, stage-2]
    timeout: 60s
    expect:
      exit: 0
      stdout: expected/stage-2.stdout.txt
  - name: tests
    kind: test
    command: [python3, -m, unittest, -q]
    timeout: 60s
    expect:
      exit: 0
      stdout: ignore
      stderr: ignore
```

A capstone has one run per stage of its brief, plus `tests`. The stages are the ones named in the course
specification's capstone brief. Each stage starts from the data files in the unit, never from what an earlier
stage wrote, so a stage can be run and replayed alone. Probe P3 confirms the working directory of a capstone
unit.

## Determinism Rules for ERP Code

These extend the plan 05 rules ([Rules for Every Example](../../ayokoding-learn-revamp-05-code-harness/tech-docs/006-determinism-and-simulation.md#rules-for-every-example))
and the plan 06 money, date, and database rules with ERP-specific ones. The harness's double run catches many
violations; the rest the makers and the gates must catch. A reviewer reads every example against this list.

| #   | Rule                                                                                                                                                                                                                                                                                                                                                                                                |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E1  | **No wall clock.** No `datetime.now()`, `date.today()`, `time.time()`, `now()`, `CURRENT_DATE`, `clock_timestamp()`. "Today" is a parameter named `as_of`; dates are literals such as `date(2026, 1, 31)`.                                                                                                                                                                                          |
| E2  | **No randomness** except the seeded generator of a simulation. Identifiers are counters or fixed strings (`INV-0001`). No `uuid4`, `gen_random_uuid()`, `uuidv7()`, `random()`.                                                                                                                                                                                                                     |
| E3  | **Money is `Decimal`** built from strings (`Decimal("10.50")`) and `numeric(18,2)` in SQL. Never `float`. Each rounding names its mode and step (`ROUND_HALF_EVEN` unless the lesson teaches another). In SQL, `round(numeric, 2)` rounds half away from zero, and a lesson that teaches banker's rounding does it in Python.                                                                       |
| E4  | **Fixed order.** Sort before printing any set, dict listing, or file listing. Every printed SQL query has an `ORDER BY` on a unique key, and text keys use `COLLATE "C"` so the server's locale never decides the order.                                                                                                                                                                            |
| E5  | **No object identity in output:** no `id()`, `hash()` of a string, default `repr` with an address, or `set` iteration.                                                                                                                                                                                                                                                                              |
| E6  | **No threads; scripted concurrency.** Two database sessions run by `dblink` from one `psql` script, or by two `pg8000` connections stepped in a fixed order in which no statement waits (see [Two Sessions in One Run](#two-sessions-in-one-run)). No sleep stands in for synchronization.                                                                                                          |
| E7  | **No server-side nondeterminism in output:** no `ctid`, `xmin`, `oid`, backend `pid`, `pg_stat_*` counters, `EXPLAIN ANALYZE`. A Python unit prints the SQLSTATE and a fixed label instead of server text; a SQL unit shows the server's `ERROR:` line only as the expected `stderr` of an exit-3 refusal.                                                                                          |
| E8  | **Clean streams.** Results go to standard output; standard error stays empty (the contract default) except the exit-3 refusal above. Tracebacks never appear in expected files.                                                                                                                                                                                                                     |
| E9  | **No network and no writes** outside `/tmp`. Temporary names are fixed.                                                                                                                                                                                                                                                                                                                             |
| E10 | **Own schema, quiet notices.** Every PostgreSQL unit begins with `SET client_min_messages TO warning;`, then `DROP SCHEMA IF EXISTS <unit_schema> CASCADE; CREATE SCHEMA <unit_schema>; SET search_path TO <unit_schema>;`, where `<unit_schema>` is the unit folder name with `-` replaced by `_`. The harness runs each run twice and does not promise a fresh database for the second execution. |
| E11 | **Small synthetic data.** At most 20 rows per table, invented company and person names, no real account or tax numbers.                                                                                                                                                                                                                                                                             |
| E12 | **Time zone fixed.** Sessions run `SET TIME ZONE 'UTC'`; the harness already sets `TZ=UTC`.                                                                                                                                                                                                                                                                                                         |
| E13 | **Calendars are lookups.** A Hijri-to-Gregorian conversion in a Sharia course is a hard-coded table for the example's fixed years; the lesson says a real system uses a maintained calendar service.                                                                                                                                                                                                |
| E14 | **Illustration is rare.** A fence marked `<!-- harness: illustration -->` is for a fragment, pseudo-code, a deliberately broken snippet, or a shell command that launches tools. Everything else is anchored to a file that runs.                                                                                                                                                                   |
| E15 | **No planner-dependent output.** An index example asserts a property (for example "the plan contains an Index Scan" with `enable_seqscan` off for the session) instead of printing a full `EXPLAIN`, whose costs depend on statistics.                                                                                                                                                              |

## PostgreSQL Example Shape

This follows plan 06's conventions ([plan 06 code harness and determinism](../../ayokoding-learn-revamp-06-accounting-courses/tech-docs/003-code-harness-and-determinism.md))
so the 24 accounting courses and these 30 ERP courses teach the same database habits. Phase 0 probes P3, P4,
P5, P6, and P9 prove each part again against the merged text, and
[D5](./009-decision-records.md#d5--postgresql-example-shape) records why this plan adopts them instead of
building its own.

### Parts

| Part              | Decision                                                                                                                                                                                                                                                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SQL toolchain     | `psql` (catalog entry `id: psql`, version 18.6, the same image digest as the `postgres` service) with `psql -X -v ON_ERROR_STOP=1 -f main.sql`. Plan 06 adds it; Phase 0 confirms the merged catalog has it, and adds the identical entry through plan 05's "Adding a Toolchain" procedure only if it is missing.                                      |
| Python driver     | `pg8000`, a pure-Python DB-API 2.0 driver, so it installs from wheels on every platform and needs no system library.                                                                                                                                                                                                                                   |
| Lockfile          | `learning/code/requirements.in` lists `pg8000`; `learning/code/requirements.lock` pins it and every package it needs, each with `--hash`. A course holds one, named by every Python PostgreSQL unit of the course (katas and capstone too). A course whose PostgreSQL units are all SQL units has none, and a lockfile no `run.yaml` names is deleted. |
| Lockfile source   | Phase 0 reads the lock that plan 06 merged in `general-ledger-system-architecture/learning/code/requirements.lock` and records its `sha256`. Every ERP course copies those bytes (`cmp` proves it). Only if plan 06 shipped none does Phase 0 build one with the recipe below. One lock text means one pin of `pg8000` across the site.                |
| Connection        | `pg8000.dbapi.connect(host=os.environ["PGHOST"], user=os.environ["PGUSER"], database=os.environ["PGDATABASE"])`; the harness sets the three variables from the catalog (`postgres`, `postgres`, `postgres`, trust authentication, no password).                                                                                                        |
| Helper            | None. Each unit carries its own few lines of connection and setup code.                                                                                                                                                                                                                                                                                |
| Isolation of runs | The unit's own schema, dropped and recreated at the start (rule E10).                                                                                                                                                                                                                                                                                  |
| Two sessions      | `dblink` inside one `psql` script (preferred), or two `pg8000` connections in a fixed step order (below).                                                                                                                                                                                                                                              |
| Printed output    | A SQL unit prints through psql's aligned output. A Python unit prints with a few lines of `print` and `str.ljust`, and prints SQLSTATE lines for errors.                                                                                                                                                                                               |

The lockfile recipe, run in Phase 0 only if plan 06 shipped no lock:

```bash
rtk ./hippo run --class ephemeral --resource-tier light --disk-path . -- uv pip compile --generate-hashes local-tmp/ayokoding-learn/probe-content/learning/code/requirements.in -o local-tmp/ayokoding-learn/probe-content/learning/code/requirements.lock
```

### A Python Unit, in Outline

The shape of every Python PostgreSQL unit (Phase 0 probe P3 validates it and corrects any defect it finds):

```python
"""Template of a Python unit that drives PostgreSQL. The schema name is the unit folder name."""

import os

import pg8000.dbapi

SCHEMA = "ex_17_reserve_stock"

conn = pg8000.dbapi.connect(
    host=os.environ["PGHOST"], user=os.environ["PGUSER"], database=os.environ["PGDATABASE"]
)
conn.autocommit = True
cur = conn.cursor()
cur.execute("SET client_min_messages TO warning")
cur.execute(f"DROP SCHEMA IF EXISTS {SCHEMA} CASCADE")
cur.execute(f"CREATE SCHEMA {SCHEMA}")
cur.execute(f"SET search_path TO {SCHEMA}")
cur.execute("SET TIME ZONE 'UTC'")

# ... the example's statements, then one printed result per check ...
try:
    cur.execute("INSERT INTO stock (sku, on_hand) VALUES (%s, %s)", ("A-100", -1))
except pg8000.dbapi.DatabaseError as exc:
    print("rejected: SQLSTATE", exc.args[0]["C"])
```

### A SQL Unit, in Outline

```sql
SET
  client_min_messages TO warning;

DROP SCHEMA IF EXISTS ex_18_check_nonnegative CASCADE;

CREATE SCHEMA ex_18_check_nonnegative;

SET
  search_path TO ex_18_check_nonnegative;

CREATE TABLE stock (
  sku text PRIMARY KEY,
  on_hand integer NOT NULL CHECK (on_hand >= 0)
);

INSERT INTO
  stock
VALUES
  ('A-100', 5);

SELECT
  sku,
  on_hand
FROM
  stock
ORDER BY
  sku COLLATE "C";

-- The refusal is the last statement: psql stops with exit 3 and the ERROR line is the expected stderr.
UPDATE stock
SET
  on_hand = on_hand - 6
WHERE
  sku = 'A-100';
```

### Two Sessions in One Run

Lost updates, lock waits, isolation anomalies, and deadlocks need two database sessions. Threads are
forbidden, so a course uses one of two deterministic patterns (plan 06's):

- **Preferred: `dblink` from one `psql` script.** The `dblink` extension is part of the official image's
  contrib modules. The script creates it inside the unit schema (`CREATE EXTENSION dblink SCHEMA <unit_schema>`),
  so the schema drop at the start of the next execution removes it. It opens session `b` with
  `dblink_connect('b', 'dbname=' || current_database() || ' application_name=b')`, sends `b`'s statement with
  `dblink_send_query`, waits in a bounded polling `DO` block until `pg_stat_activity` shows `b` waiting on a
  lock (the loop checks state and pauses between checks; it never assumes a delay is long enough, and it
  raises after a fixed number of checks), acts in session `a`, then reads `b`'s result with `dblink_get_result`.
- **Fallback: two `pg8000` connections stepped in a fixed order.** pg8000 is synchronous, so a statement that
  waits for a lock would stop the whole program. The Python unit therefore orders the steps so that no
  statement ever waits: a conflicting write runs only after the other transaction has committed (this shows
  lost updates and `could not serialize access` errors, SQLSTATE `40001`), and a lock conflict is shown with
  `FOR UPDATE NOWAIT` (`55P03`) or `SKIP LOCKED`, which fail or skip at once. If probe P5 finds `dblink`
  unusable, the real-wait and deadlock examples of `erp-inventory-integrity-and-concurrency` and
  `erp-numbering-sequences-and-uom-conversion` show the lock-order conflict with `NOWAIT`, and the course
  spec's wording is adjusted in the same commit.

For a deadlock example, the session meant to lose sets a short `deadlock_timeout` (for example
`SET deadlock_timeout = '100ms'`) and requests its second lock only after `pg_stat_activity` shows the other
session waiting; the other session keeps the default. The same session is then always the victim (SQLSTATE
`40P01`), and the printed output is the same every run.

#### A Lock-Wait Example, in Outline

A worked example on row locks follows this order, which the course text numbers as steps:

1. Create the schema and the extension; create `stock(sku, on_hand)` and insert two rows; open session `b`.
2. Session `a` begins and updates SKU `A-100`.
3. Session `b` (through `dblink_exec`) runs `SELECT ... FOR UPDATE NOWAIT` on `A-100`; the example prints the
   SQLSTATE `55P03`.
4. Session `b` starts `UPDATE ... WHERE sku = 'A-100'` with `dblink_send_query`; the polling block waits until
   `pg_stat_activity` shows `b` waiting on a lock.
5. Session `a` commits; `dblink_get_result` collects `b`'s result; the example prints the final table with
   `ORDER BY sku COLLATE "C"`.

Nothing in these five steps depends on timing: step 3 fails immediately, step 4 waits for a state the database
reports, and step 5 is ordered by the `commit` and the result read.

## Simulation Examples

Two courses use the simulation convention for part of their examples:

- `erp-inventory-integrity-and-concurrency` (8 examples): interleavings of reservation and receipt that no
  fixed step order can show, such as lost updates and oversold stock, under a seeded scheduler that picks which
  transaction steps next.
- `erp-integration-patterns` (10 examples): message delivery with duplicates, reordering, and retries against
  an idempotent consumer, under a seeded network.

Each simulation program follows the plan 05 obligations S1 to S9 and prints the S7 summary line. The shape,
written in the example so that no library version can change the sequence, is a SplitMix64 generator:

```python
MASK = (1 << 64) - 1


class SplitMix64:
    """A small, library-free generator; the same seed always gives the same sequence."""

    def __init__(self, seed):
        self.state = seed & MASK

    def next(self):
        self.state = (self.state + 0x9E3779B97F4A7C15) & MASK
        z = self.state
        z = ((z ^ (z >> 30)) * 0xBF58476D1CE4E5B9) & MASK
        z = ((z ^ (z >> 27)) * 0x94D049BB133111EB) & MASK
        return z ^ (z >> 31)

    def below(self, bound):
        return self.next() % bound
```

The simulation units are Python-only: the state machines are pure Python models, and they use no PostgreSQL.
The SQL-level concurrency of the same course is shown by the scripted PostgreSQL examples, so a reader sees both
the real database behaviour and the exhaustive model.

## CI Cost and Shard Budget

Plan 05 runs `examples check` in the PR gate with shards `[1]` (affected mode and at most 8 courses) or
`[1,2,3,4]`, each with a 60-minute timeout. This plan's final PR touches all 30 courses, so it uses four shards.

The estimate below is a planning figure. Phase 0 probe P8 replaces each per-unit time with a measured one.

| Work                                                                        | Units    | Seconds per unit (estimate)               | Minutes                   |
| --------------------------------------------------------------------------- | -------- | ----------------------------------------- | ------------------------- |
| Python-only and simulation example units                                    | 1,520    | 2.5 (two container starts)                | 63                        |
| PostgreSQL example units                                                    | 270      | 10 (service start, ready poll, two runs)  | 45                        |
| Kata units (before and after, doubled)                                      | 204      | 6                                         | 20                        |
| Capstone units (three runs, doubled)                                        | 30       | 15                                        | 8                         |
| Image pulls and one lockfile image per course with a Python PostgreSQL unit | up to 14 | about 15 seconds each, plus 3 base images | about 5                   |
| **Total, sequential**                                                       |          |                                           | **about 141 (2.3 hours)** |

The unit counts come from the plan's targets: 18 By Example courses with 78 runnable examples (1,404), plus 12
Annotated-Concept courses with at least 32 code-bearing examples (384), gives 1,788 example units; about 270 of
them are planned as PostgreSQL units; the katas are 18 × 8 + 12 × 5 = 204.

At four shards the courses are split by slug (every N-th course), so each shard takes roughly 36 minutes if
the load is balanced (141 / 4) and up to about 45 minutes if the PostgreSQL-heavy courses fall in one shard. If probe P8
projects more than about 45 minutes for any shard, execution pauses at a `[HUMAN]` checkpoint in Phase 0 to
decide between a longer job timeout, more shards, or a workflow change in plan 05's reusable workflow. That
decision belongs to the user because it changes shared CI cost.

## Phase 0 Probes

The probes run against a scratch content folder, `local-tmp/ayokoding-learn/probe-content/` (passed as
`--content`), so they never touch course content. Each result goes into
`<plan>/evidence/phase-0-probes.md`.

| #   | Probe                                                                                                                                                                                                                                                                                                                                                                                         | Pass condition                                                                                                                               | If it fails                                                                                                                           |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | Build the CLI (`CLI-BUILD`); run `EX-VALIDATE` and `EX-RUN` on a one-unit Python probe course that has a `tests` run in both forms (with and without `stderr: ignore`)                                                                                                                                                                                                                        | Exit 0; the unit is green under the double run; the passing `tests` form is recorded                                                         | Stop if the CLI is unusable and report to the user; otherwise use the passing form                                                    |
| P2  | Print a `Decimal` table, a sorted set, and a fixed date from a unit; run it with the double run                                                                                                                                                                                                                                                                                               | Byte-identical output                                                                                                                        | Fix the rule that was missed; update the rules table                                                                                  |
| P3  | A Python PostgreSQL probe unit with `services: [postgres]`, the lockfile from P9, and the outline above, plus a kata (`before` and `after`) and a capstone unit using the same lockfile path                                                                                                                                                                                                  | Connects, prints a fixed table, green under the double run; `PYTHONPATH` needs no `env`; the working directories behave as the templates say | Fix the outline; if the lock path rule fails for katas or the capstone, record the deviation and use the form that works              |
| P4  | A `psql` SQL probe unit: a table, an ordered `SELECT`, a `DO` block that records a caught SQLSTATE, and a final refusal with `exit: 3` and `stderr: expected/main.stderr.txt`                                                                                                                                                                                                                 | Green under the double run; the second execution prints nothing extra (no NOTICE)                                                            | Fix the unit shape; if the `psql` toolchain is missing from the merged catalog, add it (see Parts) and re-run                         |
| P5  | The scripted behaviours: `dblink` created in the unit schema (and removed by the schema drop), a row-lock wait with the polling block, a deadlock with the short `deadlock_timeout` (`40P01`, the same victim), `NOWAIT` (`55P03`), `SKIP LOCKED`, and a serialization failure (`40001`) from two `pg8000` connections. Run each 20 times with `--single-run`, then once under the double run | All 20 outputs identical and the double run green                                                                                            | Change the script design for the failing behaviour; if a behaviour cannot be made deterministic, drop that example idea and record it |
| P6  | `SHOW lc_collate`, `SHOW TimeZone`, and an `ORDER BY name COLLATE "C"` on mixed-case text                                                                                                                                                                                                                                                                                                     | `COLLATE "C"` gives the Python byte order; the time zone is UTC after `SET TIME ZONE`                                                        | Keep `COLLATE "C"` as the rule; record the server defaults                                                                            |
| P7  | A SplitMix64 simulation with seeds `range(1, 65)`, `simulation: true`, and `EX-RUN --seed 17`                                                                                                                                                                                                                                                                                                 | The S7 summary line is accepted; the replay prints a trace and exits 0                                                                       | Fix against the plan 05 convention; if the convention is unusable, stop and report                                                    |
| P8  | Time one Python unit, one `psql` unit, one Python PostgreSQL unit, one kata, and one capstone; project the per-shard time with the table above                                                                                                                                                                                                                                                | Projected shard time at most about 45 minutes                                                                                                | `[HUMAN]` checkpoint on the shard or workflow change                                                                                  |
| P9  | Obtain the lockfile (plan 06's merged lock, or the recipe above); install it with `--require-hashes --no-deps` in the `python:3.14.8-slim` image; check that every entry has a hash and that wheels exist for `x86_64` and `aarch64`                                                                                                                                                          | The install succeeds on the local architecture; the lockfile text and its `sha256` are saved in evidence                                     | Re-run the recipe with a newer final release of `pg8000`; if none installs, stop and report                                           |

The amd64 install cannot be proven on an arm64 laptop with certainty. The first checkpoint push (after wave 3)
runs the harness on the CI runner, and a lockfile or driver problem there is a wave-3 gate failure that the
executor fixes in the lock text and copies to every PostgreSQL course already written (`cmp` proves the copies).
