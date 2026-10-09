# 003 — Code Harness and Determinism

Every code block a reader sees in these courses must run, print what the lesson says it prints, and
print the same thing every time. Plan 05 built the tool that proves this, `ayokoding-cli`. This page
explains how the accounting courses use it. The contract itself (plan 05's `run.yaml` contract,
version `ayokoding.run/v1`) is restated here only as far as this plan needs it.

## The Code Medium

- **Language.** Python 3, at the version the harness catalog pins (3.14.8 on 2026-10-09; plan 05's
  version policy may move it to a newer final release, and the courses follow the catalog). Python is
  the language the series assumes through `just-enough-python`, it has an exact decimal type in the
  standard library, and the accounting audience reads it easily.
- **Standard library only**, except in the three database courses (below). No third-party package is
  needed to teach ledgers, schedules, matching, or reports.
- **PostgreSQL 18** in three courses: `chart-of-accounts-and-data-modeling`,
  `general-ledger-system-architecture`, and `sharia-ledger-system-architecture`. These courses teach
  what a database enforces (constraints, transactions, locks, isolation), so the database must run for
  real (series decision 32).
- **Tests.** A unit that has tests runs them with `python3 -m unittest -q` from the standard library,
  as a second run of `kind: test`.

## Money, Dates, and Output Rules

These rules apply to every Python file in the 24 courses. A course brief may add rules; it never
removes one.

| Rule                                                                                                                                                   | Why                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Money is `decimal.Decimal`, built from strings (`Decimal("10.05")`), never from `float`                                                                | Binary floats cannot hold most cents exactly; ledgers must balance to the cent |
| Every rounding names its mode and step: `amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)` (or the mode the lesson teaches)                    | Hidden rounding is the most common cause of a ledger that is off by one cent   |
| The only `float` money in any course is `accounting-foundations` kata 01 (`float-money-drift`), whose `before/` shows the bug on purpose               | A deliberate bug is allowed when the kata's `run.yaml` expects it              |
| Dates are `datetime.date` values written in the code or read from a data file; never `date.today()`, `datetime.now()`, or `time.time()`                | Output must not depend on the day the harness runs                             |
| Exchange rates, gold prices, tax rates, and other market or legal values come from a data file in the unit with a comment naming the source and date   | The value is visible, dated, and replaceable, and the run stays offline        |
| Output never iterates a `set`, and iterates a `dict` only in insertion order or after `sorted()`                                                       | Order must not change between runs                                             |
| Randomness only through `random.Random(seed)` with the seed in the code                                                                                | Series decision 31                                                             |
| No threads, processes, sockets, or `asyncio` timers in course code; concurrency is shown with the simulation convention or with real database sessions | Thread order is not reproducible                                               |
| Files are written only under the unit folder or `/tmp`                                                                                                 | The harness root filesystem is read-only                                       |

## One Unit per Example, Kata, and Capstone

Paths are relative to the course folder `apps/ayokoding-www/content/en/learn/courses/<slug>/`.

| Unit kind | Folder                          | Files                                                                                                  |
| --------- | ------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Example   | `learning/code/ex-NN-<slug>/`   | `main.py` (or `main.sql`), `run.yaml`, `expected/main.stdout.txt`, optional `test_main.py`, data files |
| Kata      | `drilling/code/kata-NN-<slug>/` | `before/` and `after/`, each with its code file, and one `run.yaml` with a `before` and an `after` run |
| Capstone  | `learning/capstone/code/`       | The capstone program, its data, its tests, and `run.yaml` with one run per stage plus `tests`          |

A course opts in when its first `run.yaml` exists. From then on, every unit must have one, every lesson
code fence must be anchored or marked, and every run must pass (plan 05 rule: all or nothing). So the
maker writes the units for the whole course before the gates run.

### An Example Unit

`learning/code/ex-07-post-balanced-entry/run.yaml`:

```yaml
schema: ayokoding.run/v1
toolchain: python
runs:
  - name: main
    command: [python3, main.py]
    timeout: 30s
    expect:
      exit: 0
      stdout: expected/main.stdout.txt
  - name: tests
    kind: test
    command: [python3, -m, unittest, -q]
    expect:
      exit: 0
      stdout: ignore
```

### A Kata Unit

`drilling/code/kata-02-unbalanced-entry-accepted/run.yaml`. The broken `before/` run is expected to
print the wrong result and exit 0 (the bug is silent); the fixed `after/` run refuses the entry.

```yaml
schema: ayokoding.run/v1
toolchain: python
runs:
  - name: before
    command: [python3, kata.py]
    workdir: before
    expect:
      exit: 0
      stdout: expected/before.stdout.txt
  - name: after
    command: [python3, kata.py]
    workdir: after
    expect:
      exit: 0
      stdout: expected/after.stdout.txt
```

`expected/` sits in the kata folder; a `workdir` changes only where the command starts, and expected
paths stay unit-relative.

### A Capstone Unit

```yaml
schema: ayokoding.run/v1
toolchain: python
runs:
  - name: stage-1-load-ledger
    command: [python3, capstone.py, stage1]
    expect:
      exit: 0
      stdout: expected/stage-1.stdout.txt
  - name: stage-2-close-period
    command: [python3, capstone.py, stage2]
    expect:
      exit: 0
      stdout: expected/stage-2.stdout.txt
  - name: tests
    kind: test
    command: [python3, -m, unittest, -q]
    expect:
      exit: 0
      stdout: ignore
```

Each stage starts from the data files in the unit, never from what an earlier stage wrote, so a stage
can be run and replayed alone.

## Database Units

Plan 05's catalog has a `python` language toolchain (the slim Python image, which has no PostgreSQL
client) and a `postgres` service (the official PostgreSQL 18.6 image, trust authentication, reachable
as host `postgres` with `PGHOST=postgres`, `PGUSER=postgres`, `PGDATABASE=postgres`). It has no
toolchain that can run a `.sql` file. Decision D14 in [008](./008-decision-records.md) settles how
this plan fills the gap.

### SQL Units: the New `psql` Toolchain

This plan adds one catalog entry through plan 05's "Adding a Toolchain" procedure:

```yaml
- id: psql
  kind: language
  version: "18.6"
  image: docker.io/library/postgres:18.6@sha256:<the same digest as the postgres service>
```

It reuses the service image, which already contains the `psql` client, so there is no new image to
trust and the client always matches the server. A SQL unit:

```yaml
schema: ayokoding.run/v1
toolchain: psql
services: [postgres]
runs:
  - name: main
    command: [psql, -X, -v, ON_ERROR_STOP=1, -f, main.sql]
    expect:
      exit: 0
      stdout: expected/main.stdout.txt
```

- `-X` skips any `psqlrc` file, and `ON_ERROR_STOP=1` makes the first error stop the script.
- An example that shows the database refusing a bad row expects that refusal: psql exits **3** when
  `ON_ERROR_STOP` stops a script, so the run has `expect.exit: 3` and
  `expect.stderr: expected/main.stderr.txt`, which holds the `ERROR:` line.
- Course `.sql` files under `code/` are not reformatted by the commit hook (`.prettierignore` excludes
  `apps/ayokoding-www/content/**/code/**/*.sql`), so psql meta-commands such as `\echo` are safe.

### Python Units That Use the Database

```yaml
schema: ayokoding.run/v1
toolchain: python
services: [postgres]
dependencies:
  lockfile: learning/code/requirements.lock
runs:
  - name: main
    command: [python3, main.py]
    expect:
      exit: 0
      stdout: expected/main.stdout.txt
```

- The driver is **pg8000**, a pure-Python DB-API 2.0 driver. Being pure Python, it installs from
  wheels that work on every platform, and it needs no system library.
- `learning/code/requirements.in` lists `pg8000`. `learning/code/requirements.lock` pins pg8000 and
  every package it depends on, each with `--hash`. Generate it with
  `uv pip compile --generate-hashes learning/code/requirements.in -o learning/code/requirements.lock`
  (uv is the Python tool this repository already uses in `apps/ferret-cli`). Katas and the capstone
  name the same lockfile, so each course has exactly one.
- The harness installs the lockfile into an environment image before any run; the build is the only
  step with network access. Runs stay offline.
- Code reads the connection from the environment: `pg8000.dbapi.connect(host=os.environ["PGHOST"],
user=os.environ["PGUSER"], database=os.environ["PGDATABASE"])`.

### Rules for Every Database Unit

1. **Own schema.** Each unit starts with `DROP SCHEMA IF EXISTS <unit_schema> CASCADE; CREATE SCHEMA
<unit_schema>; SET search_path TO <unit_schema>;`. The harness runs everything twice, and plan
   05's contract does not promise a fresh database for the second execution, so a unit must not rely
   on an empty database.
2. **Quiet notices.** The first `DROP SCHEMA IF EXISTS` prints a NOTICE on the first execution only,
   which would make the two executions differ. Every SQL script starts with
   `SET client_min_messages TO warning;` (Python units send the same statement first).
3. **Ordered output.** Every query whose rows reach the output has an `ORDER BY` on a unique key.
4. **No clock.** No `now()`, `current_timestamp`, or `clock_timestamp()` in output or in logic; times
   are passed in. Sequences and identity columns are fine, because each run starts from a new schema.
5. **No planner-dependent output.** An example about indexes asserts a property (for example "the plan
   contains an Index Scan" with `enable_seqscan` off for the session) instead of printing a full
   `EXPLAIN`, whose costs depend on statistics.

### Two Sessions in One Run

Lost updates, lock waits, isolation anomalies, and deadlocks need two database sessions. Threads are
forbidden, so the course uses one of two deterministic patterns:

- **Preferred: `dblink` from one psql script.** The `dblink` extension (part of the official image's
  contrib modules) opens a second session from inside the first. The script sends session B's
  statement with `dblink_send_query`, waits until `pg_stat_activity` shows B waiting on a lock (a
  polling `DO` block, never `pg_sleep` as a timing guess), acts in session A, then reads B's result
  with `dblink_get_result`. The `psql` toolchain phase of [../delivery.md](../delivery.md) (Phase 1) proves
  `CREATE EXTENSION dblink` works in the pinned image before any course is written.
- **Fallback: two pg8000 connections stepped in a fixed order.** pg8000 is synchronous, so a
  statement that waits for a lock would stop the whole program. The fallback therefore orders the
  steps so that no statement ever waits: a conflicting write runs only after the other transaction
  has committed (this still shows lost updates and `could not serialize access` errors), and a lock
  conflict is shown with `FOR UPDATE NOWAIT`, which fails at once instead of waiting. A real
  deadlock needs one session to wait, so if that probe finds `dblink` unusable, the deadlock examples
  and kata show the lock-order conflict with `NOWAIT`, and the course brief's wording is adjusted in
  the same commit.

For a deadlock example, the session meant to lose sets a short `deadlock_timeout` (for example
`SET deadlock_timeout = '100ms'`) and only requests its second lock after `pg_stat_activity` shows the
other session waiting; the other session keeps the default. The same session is then always the
victim, and the printed error is the same every run.

## Simulation Units

`journal-entries-and-posting-mechanics` and `general-ledger-system-architecture` teach what goes wrong
when posting requests are retried, duplicated, or reordered. Those examples follow plan 05's
simulation convention, restated briefly:

| Id  | Obligation                                                                                                                  |
| --- | --------------------------------------------------------------------------------------------------------------------------- |
| S1  | One process, one thread; concurrency is interleaved events                                                                  |
| S2  | A virtual clock advanced by the event queue                                                                                 |
| S3  | One seeded generator (written in the example, such as SplitMix64) drives every choice                                       |
| S4  | Logic as pure state machines; the simulated network and clock are the only I/O                                              |
| S5  | Invariants checked after every step (for example "the ledger balances" and "no request posts twice")                        |
| S6  | A fixed seed set in the code, at least 32 seeds                                                                             |
| S7  | One `failing seed: <n> (<invariant>)` line per failure, then exactly `seeds: <passed> passed, <failed> failed (of <total>)` |
| S8  | `AYOKODING_SEED=<n>` replays one seed with a step trace                                                                     |
| S9  | A broken design may be shown; its `run.yaml` expects exit 1 and an output file listing the failing seeds                    |

Such runs carry `simulation: true` in `run.yaml`.

## Lessons and Files Stay in Sync

- A code fence that shows a unit file is preceded by its anchor, for example
  ``**`learning/code/ex-07-post-balanced-entry/main.py`**``, and its body is byte-identical to the
  file.
- Output is shown as ``**Output** (`learning/code/ex-07-post-balanced-entry/expected/main.stdout.txt`):``
  followed by a fence.
- A fragment that is not meant to run as shown (a partial snippet, pseudo-code, a broken line being
  discussed) is preceded by the line `<!-- harness: illustration -->`. It is never used to hide a
  program that should run.
- Tables, T-accounts, statements, and diagrams in Annotated-Concept examples use Markdown tables or
  fences tagged `text` or `mermaid`, which the sync check ignores.
- Author workflow, in this order: edit the code file; format it (`ruff format --no-cache <files>`, the
  same formatter the commit hook runs on `.py` files); run `ayokoding-cli examples sync --write --course
<slug>`; record missing expected files with `examples run --course <slug> --record`; **read every
  recorded file** and confirm it shows what the lesson claims; commit.

## How Plan 05's Migration Contract Applies

| Plan 05 step        | In this plan                                                                                                                                  |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| M1 Baseline         | Each course has no code today, so the baseline is "no units"; the executor records `examples validate --course <slug>` output once per course |
| M2 Layout           | Units are created in canonical folders from the start                                                                                         |
| M3 Toolchain        | `python` everywhere; `psql` added in the harness phase of [../delivery.md](../delivery.md) before any database course                         |
| M4 Dependencies     | Only the three database courses have a lockfile (pg8000 and its dependencies)                                                                 |
| M5 Run specs        | One `run.yaml` per unit; expected files recorded, then read                                                                                   |
| M6 Lessons          | Every fence anchored or marked; `examples sync --course <slug>` exits 0                                                                       |
| M7 Determinism      | The rules on this page; the double run passes                                                                                                 |
| M8 Static mode      | Not used: everything runs for real                                                                                                            |
| M9 Green            | `examples check --course <slug>` exits 0, after the two quality gates; at most 2 repair cycles, then BLOCKED                                  |
| M10 Coverage        | `examples coverage --output json` shows `covered: true` for all 24 courses at the end gate                                                    |
| M11 Harness defects | Fixed at the root in `apps/ayokoding-cli` with a regression test, in this PR; never by weakening a course check                               |
