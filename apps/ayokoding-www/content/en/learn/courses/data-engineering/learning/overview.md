---
title: "Overview"
date: 2026-07-27T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [10 &middot; SQL Essentials](../../sql-essentials/learning/overview.md) for
  joins and aggregation; [26 &middot; Advanced SQL & Query Performance](../../advanced-sql-and-query-performance/learning/overview.md)
  for window functions and reading an `EXPLAIN` plan -- ex-13's partition-pruning check reads a raw
  `EXPLAIN` plan directly; [4 &middot; Just Enough Python](../../just-enough-python/learning/overview.md)
  for functions, files, and `dataclass`, all used throughout this topic's pure-Python worked
  examples (ex-23 through ex-33, ex-41 through ex-52).
- **Tools & environment**: a macOS/Linux terminal; **Python 3.13**; `duckdb==1.5.5` as the local,
  in-process analytical engine every SQL-medium example writes into; `pandas==3.0.5` as the
  dataframe library; `pytest==9.1.1` for tooling parity with the rest of this course library. No
  external database server, no cloud account, and no network access anywhere in this topic --
  Kafka's partition/offset/consumer-group model and Airflow's DAG/schedule/retry model are both
  simulated as pure, dependency-free Python rather than run against a live broker or scheduler.
- **Assumed knowledge**: SQL `JOIN`/`GROUP BY`/aggregation; window functions and `EXPLAIN`; writing
  a Python function, reading/writing a file, and using a `dataclass`.

## Why this exists

**The problem before the solution**: skip idempotency and layering, and a pipeline's every rerun,
retry, or backfill becomes a fresh risk of a duplicated row, a corrupted total, or a silently
poisoned downstream report. **The one idea worth keeping if you forget everything else**: make
every transform idempotent (safe to rerun) and layered (raw kept immutable, cleaned separately,
served separately), so "just rerun it" is always the safe instruction.

**Cross-cutting big ideas, taught here**: `layering-and-leaks` -- the medallion bronze/silver/gold
split isolates raw data from what gets served, so a cleaning mistake in silver is never tangled up
with an already-overwritten bronze row; `taming-state` -- idempotent, backfill-safe transforms are
what make reprocessing state a controlled decision instead of an accident.

## Confirm your toolchain

Every code-bearing worked example in this topic runs against `duckdb`, `pandas`, and `pytest`,
pinned in `learning/code/requirements.txt`:

```text
$ python3 --version
Python 3.13.12
$ python3 -c "import duckdb; print('duckdb', duckdb.__version__)"
duckdb 1.5.5
$ python3 -c "import pandas; print('pandas', pandas.__version__)"
pandas 3.0.5
$ python3 -m pytest --version
pytest 9.1.1
```

_Captured 2026-07-27 -- these are point-in-time patch/pin versions, not a durable claim; see this
topic's [References](../overview.md#references) if you are reading this after a later
release has shipped._

Every worked example is a complete, self-contained, runnable file colocated under
`learning/code/ex-NN-<slug>/`, actually executed to capture its documented output -- every printed
value on this topic's pages is a genuine, captured transcript, never a fabricated one. Every
code-bearing worked example is independently runnable with no cross-example imports; the
capstone's four files are the sole exception, importing from one another as one small project. A
handful of concepts (co-12, co-13, co-18) are pure Python with no `duckdb`/`pandas` import at all --
they model Kafka's or Airflow's semantics directly, in-memory, with no live broker or scheduler
required.

## How this topic's examples are organized

This topic follows its own syllabus's tri-band structure -- Beginner, Intermediate, Advanced --
rather than a re-clustered theme grouping, since the source spec enumerates every example's exact
name, slug, and `co-NN` mapping band by band. This is a deliberate choice, not an oversight: it
preserves the syllabus spec's own band-by-band structure and matches the same tri-band
`beginner.md`/`intermediate.md`/`advanced.md` shape already shipped by this course library's
`computer-science-foundations`, `agentic-coding`, and `project-management` courses. The three bands
break down as follows:

- **[Beginner](./beginner.md)** (ex-01 through ex-18) -- batch-vs-streaming-contrast,
  etl-order, elt-order, modern-stack-shape, bronze-land-raw, silver-clean-conform,
  gold-serve-aggregate, idempotent-rerun, upsert-merge-key, incremental-filter,
  full-refresh-backfill, hive-style-partition-write, partition-pruning-read, fact-vs-dimension,
  star-schema-grain, additive-measure-sum, semi-additive-balance, and non-additive-ratio. Includes
  an inline Mermaid diagram of the medallion bronze/silver/gold flow (after ex-07) and of a star
  schema's shape (after ex-15).
- **[Intermediate](./intermediate.md)** (ex-19 through ex-38) -- all four SCD types
  (scd-type1-overwrite, scd-type2-new-row, scd-type3-alt-field, scd-type6-hybrid),
  kafka-topic-partition-offset, consumer-group-assignment, per-partition-ordering,
  at-least-once-redelivery, exactly-once-idempotent-producer, all three stream-window shapes
  (tumbling, hopping, session), event-time-vs-processing-time, watermark-progress,
  late-data-side-output, and all five data-quality worked checks (completeness, uniqueness,
  validity, timeliness, consistency). Includes an inline Mermaid diagram of the three stream-window
  shapes side by side (after session-window).
- **[Advanced](./advanced.md)** (ex-39 through ex-52) -- data-contract-schema-enforce,
  contract-close-to-producer, all five DAG orchestration examples (task-dependencies,
  retry-on-failure, schedule-and-catchup, quality-gate-blocks, backfill-range), table-level and
  column-level lineage, both CDC examples (query-based-poll, log-based-capture), and the
  exactly-once-vs-idempotent-sink pair plus log-as-source-of-truth. Includes an inline Mermaid
  diagram of the DAG dependency graph the orchestration examples build toward (after
  dag-task-dependencies).
- **[Capstone](./capstone/overview.md)** -- "Aurora Retail," a complete four-step local pipeline
  (`ingest.py` &rarr; `transform.py` &rarr; `serve.sql`/`serve.py` &rarr; `pipeline.py`) tying
  idempotent ingest, a star schema, gold serving, and a DAG with a data-quality gate into one
  runnable project.

## Read more

- **Designing Data-Intensive Applications** -- Martin Kleppmann (2017). Core reference for the
  batch/stream processing and replication foundations this course's batch-vs-streaming and
  log-based-streaming worked examples build on.
- **Fundamentals of Data Engineering** -- Joe Reis & Matt Housley (2022). The modern standard
  introductory text organizing the data engineering lifecycle end to end, matching this course's
  source &rarr; ingest &rarr; transform &rarr; serve framing.
- **The Data Warehouse Toolkit** -- Ralph Kimball & Margy Ross (1996; 3rd ed. 2013). The classic
  reference for dimensional modeling and warehouse design -- the source for every SCD-type worked
  example's exact numbering.
- **The Log: What Every Software Engineer Should Know About Real-Time Data's Unifying
  Abstraction** -- Jay Kreps (2013). Canonical article framing the append-only log as the unifying
  abstraction behind Kafka, replication, and stream processing -- the direct inspiration for
  ex-52's log-as-source-of-truth worked example.
  <https://web.archive.org/web/20190914012941/https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying>

---

&larr; Previous: [Overview](../overview.md) &middot; Next: [Beginner](./beginner.md) &rarr;
