---
title: "Overview"
date: 2026-07-27T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [10 &middot; SQL Essentials](../sql-essentials/learning/overview.md) and
  [26 &middot; Advanced SQL & Query Performance](../advanced-sql-and-query-performance/learning/overview.md)
  give the warehouse target this topic writes into -- joins, aggregation, window functions,
  `EXPLAIN` -- and [4 &middot; Just Enough Python](../just-enough-python/learning/overview.md) gives
  the functions-and-files fluency every worked example's Python assumes.
- **Tools & environment**: a macOS/Linux terminal; **Python 3.13**; `duckdb` (a local, in-process
  analytical engine standing in for a cloud warehouse) and `pandas` as the dataframe library;
  `pytest` for this topic's own tooling parity; no external database server, no cloud account, and
  no network access -- every dataset is small, invented, and generated inside the example that uses
  it.
- **Assumed knowledge**: SQL `JOIN`/`GROUP BY`/aggregation (topic 10); window functions and reading
  an `EXPLAIN` plan (topic 26); writing a Python function, reading/writing a file, and using a
  `dataclass` (topic 4).

## Why this exists -- the big idea

**The problem before the solution**: data pipelines fail in ways application code doesn't -- a
re-run double-counts a total nobody meant to double-count, a late-arriving batch silently corrupts
yesterday's already-reported numbers, and one bad upstream row poisons every downstream report
before anyone notices. An application bug usually announces itself with a stack trace; a pipeline
bug usually announces itself as a wrong number in next week's board deck.

**Keep-this-if-you-forget-everything**: make every transform idempotent and layered -- raw data
kept immutable (bronze), cleaned and conformed (silver), served in consumption-ready form (gold) --
so a re-run is always safe and a bad batch gets caught at a gate before it ever reaches anyone.

**Big ideas touched**: `layering-and-leaks` -- the medallion bronze/silver/gold split isolates raw
data from what gets served, so a cleaning mistake in silver never has to be reconciled against a
raw bronze row that has already been overwritten; `taming-state` -- idempotent, backfill-safe
transforms are what make "just re-run it" a safe instruction instead of a destructive one.

> **Scope guard -- moving and shaping data at rest, not search or the AI data path.** This course
> teaches batch vs. streaming, ETL/ELT, the medallion layering, dimensional modeling (star schema,
> SCDs), Kafka-style streaming semantics, data quality, and DAG orchestration, all as runnable
> Python against local files and DuckDB. It does **not** teach:
>
> - **Inverted indexes and ranking** -- ad hoc, unstructured search over document collections
>   belongs to `search-and-information-retrieval`. `[Unverified]` -- this course is not yet present
>   in the AyoKoding course library on disk, so no link is given here.
> - **Operational SQL depth** -- query plans, indexing strategy, and tuning a slow query are owned
>   by [26 &middot; Advanced SQL & Query Performance](../advanced-sql-and-query-performance/learning/overview.md),
>   which this course assumes as a prerequisite rather than re-teaching.
> - **The AI/RAG data path** -- chunking, embeddings, and vector retrieval for LLM applications
>   belong to `creating-ai-powered-apps`. `[Unverified]` -- this course is not yet present in the
>   AyoKoding course library on disk, so no link is given here.
>
> If a technique's job is "get this bounded or unbounded dataset from a source, through a
> warehouse-shaped set of layers, to something a dashboard or a model can consume, safely and
> repeatably" -- it belongs here.

## How this topic is organized

- **[Learning](./learning/overview.md)** -- 52 runnable, heavily annotated worked examples, grouped
  into this topic's own Beginner/Intermediate/Advanced bands (the spec's own tri-band structure,
  not a re-clustered theme grouping):
  - **[Beginner](./learning/beginner.md)** (ex-01 through ex-18) -- batch vs. streaming, ETL vs.
    ELT, the modern data stack's shape, the medallion bronze/silver/gold layers, idempotent and
    incremental loads, Hive-style partitioning, and the fact/dimension/grain/additivity foundations
    of dimensional modeling.
  - **[Intermediate](./learning/intermediate.md)** (ex-19 through ex-38) -- all four Slowly
    Changing Dimension types, Kafka's partition/offset/consumer-group model, ordering and delivery
    semantics, the three stream-window shapes, event-time vs. processing-time with watermarks and
    late data, and five of the six data-quality dimensions.
  - **[Advanced](./learning/advanced.md)** (ex-39 through ex-52) -- data contracts, DAG
    orchestration (dependencies, retries, schedule/catchup, quality gates, backfill), table- and
    column-level lineage, both flavors of Change Data Capture, and why exactly-once inside an
    engine still needs an idempotent sink.
  - **[Capstone](./learning/capstone/overview.md)** -- a complete local pipeline for a small
    invented retailer, "Aurora Retail": idempotent bronze ingest, a silver clean/conform step, a
    star schema, gold-served region totals, and a small orchestrated DAG with retries and a
    data-quality gate that blocks a deliberately bad batch before it reaches gold.

Every worked example is a complete, self-contained, runnable Python file colocated under
`learning/code/` (or, where a relationship or flow is genuinely clearer as a picture, a captioned,
WCAG-accessible Mermaid diagram inline on its page), actually executed to capture its documented
output -- every printed value in this topic's pages is a genuine, captured transcript, never a
fabricated one. Every worked example is independently runnable with no cross-example imports; the
capstone's four files are the sole exception, importing from one another as one small project.

- **[Drilling](./drilling/overview.md)** -- the spaced-repetition companion: recall Q&A across all
  21 concepts, applied problems, self-contained code katas, a self-check checklist, and
  elaborative-interrogation prompts.

## The 21 concepts this topic covers

- **co-01 &middot; batch-vs-streaming** -- batch processes a bounded dataset in one pass; streaming
  processes an unbounded feed record-by-record; the same aggregate can be computed either way.
- **co-02 &middot; etl-vs-elt** -- the difference is _when_ transformation happens: ETL transforms
  before loading, ELT loads raw then transforms in-warehouse (which cloud elastic compute made
  cheap).
- **co-03 &middot; modern-data-stack-shape** -- the canonical pipeline is source &rarr; ingest (EL)
  &rarr; transform (T) &rarr; serve (BI/ML).
- **co-04 &middot; medallion-bronze-silver-gold** -- bronze keeps raw source data as-is plus load
  metadata, silver cleans/conforms, gold serves consumption-ready aggregates; layering isolates raw
  from served.
- **co-05 &middot; idempotent-transforms** -- a transform that produces the same result on re-run
  (via merge/upsert on a natural key), so re-processing is safe.
- **co-06 &middot; incremental-and-backfill** -- process only new rows since a watermark for
  efficiency, and reprocess an explicit past range (backfill) safely because transforms are
  idempotent.
- **co-07 &middot; partitioning** -- Hive-style partitioning encodes column values in the directory
  path (`key=value/`) so a query can prune partitions it can't match.
- **co-08 &middot; dimensional-modeling-facts-dims** -- facts are numeric measurements with foreign
  keys to context; dimensions are the descriptive attributes around them.
- **co-09 &middot; star-schema-and-grain** -- a star schema links a fact table to dimension tables;
  the grain is the business definition of one fact row (declare it, keep to it).
- **co-10 &middot; additive-semi-non-additive** -- additive facts sum across all dimensions,
  semi-additive across all but time (e.g. balances), non-additive not at all (ratios -- store the
  components, divide at query time).
- **co-11 &middot; slowly-changing-dimensions** -- SCD types manage attribute change: Type 1
  overwrite (no history), Type 2 new row + effective dates + current flag, Type 3 add-a-column,
  Type 6 = 1+2+3 hybrid.
- **co-12 &middot; log-based-streaming** -- a broker (Kafka) models a topic as partitions of an
  append-only log; each record gets a per-partition monotonic offset; a consumer group assigns each
  partition to exactly one member.
- **co-13 &middot; ordering-and-delivery-semantics** -- ordering is guaranteed only within a
  partition, not across; at-least-once is the default (retries can duplicate); exactly-once needs an
  idempotent and transactional producer.
- **co-14 &middot; stream-windows** -- bounded aggregation over an unbounded stream: tumbling
  (fixed, non-overlapping), hopping (overlapping, advance &lt; size), session (activity gap).
- **co-15 &middot; event-time-vs-processing-time** -- window by when an event occurred (event-time)
  vs. when it arrived (processing-time); a watermark tracks event-time progress and controls how
  long a window waits for late data.
- **co-16 &middot; data-quality-dimensions** -- completeness, validity, uniqueness, timeliness,
  consistency, accuracy -- each a checkable assertion that can fail a batch.
- **co-17 &middot; data-contracts** -- a producer-side, enforceable schema guarantee
  (columns/types/constraints) that fails the build on drift instead of silently corrupting
  downstream.
- **co-18 &middot; orchestration-dag** -- a DAG wires tasks (operators) with dependencies, a
  schedule, retries, and backfill; the scheduler runs a task once its dependencies are met.
- **co-19 &middot; data-lineage** -- table-level lineage records that dataset X feeds Y;
  column-level records which input column produced which output column, for impact analysis.
- **co-20 &middot; change-data-capture** -- CDC surfaces source-database changes: log-based reads
  the transaction log and captures inserts/updates/deletes; query-based polling misses deletes and
  between-poll changes.
- **co-21 &middot; exactly-once-sink-idempotent-write** -- exactly-once _inside_ an engine does not
  make an external write exactly-once; the sink write must itself be idempotent (merge on a dedup
  key).

## Tensions & trade-offs -- when NOT to reach for this

- **Idempotency vs. simplicity**: checking a natural key before every insert (or using `MERGE`)
  adds a real cost to every load. For a genuinely append-only, never-rerun feed with no retry risk,
  a plain `INSERT` is simpler and faster -- reach for idempotent loads once reruns, retries, or
  backfills are a real possibility, not by default on every table.
- **Medallion layering vs. a one-table pipeline**: bronze/silver/gold adds real storage and
  operational overhead. A small, single-source, rarely-changing dataset may not need three physical
  layers -- the layering pays for itself once multiple consumers, multiple sources, or genuine
  reprocessing needs appear.
- **Star schema vs. a single flat table**: dimensional modeling is a deliberate trade -- normalizing
  descriptive attributes into dimensions makes a rename a one-row update, at the cost of joins every
  serving query must now perform. A small, single-purpose report over a flat table can be the
  simpler, correct choice.
- **Exactly-once vs. at-least-once**: exactly-once (idempotent + transactional producer, plus an
  idempotent sink) costs real throughput and complexity. At-least-once with an idempotent
  _consumer-side_ dedup is often the simpler, cheaper choice when the sink can absorb it.
- **When NOT to reach for this course's machinery at all**: a one-off script that reads a file once,
  transforms it, and is never rerun does not need idempotency, partitioning, or orchestration --
  those techniques exist to make _repeated, evolving_ pipelines safe, and add ceremony without
  benefit to something genuinely run-once.

## Accuracy notes

> Dated per this topic's own accuracy-note discipline: every volatile, version-pinned, or
> market-dependent fact below is flagged or dated here rather than stated unqualified in the stable
> spine above. Carried forward from the pre-authoring `web-researcher` sweep (DD-28) and the DD-35
> no-hallucination primary-source pass (2026-07-12), re-verified 2026-07-27 with no material drift.

- 2026-07-12 (DD-35) -- **durable spine**: medallion architecture (bronze/silver/gold), ETL vs.
  ELT, Kimball-style dimensional modeling (star schema, SCDs), and DAG-based orchestration are
  evergreen data-engineering vocabulary, unchanged in current usage. (source: What is Medallion Architecture? -- https://www.databricks.com/blog/what-is-medallion-architecture ; accessed 2026-07-27) --
  Databricks' own docs do not self-attribute _coining_ the "medallion" term; this course frames it
  as "the bronze/silver/gold pattern popularized by Databricks," never "coined in [year]."
- 2026-07-12 (DD-35) -- **SCD types** (source: Design Tip #152 Slowly Changing Dimension Types 0, 4, 5, 6 and 7 -- https://www.kimballgroup.com/2013/02/design-tip-152-slowly-changing-dimension-types-0-4-5-6-7/ ; accessed 2026-07-27 + _The Data Warehouse Toolkit_, 3rd ed. 2013): Type 0 retain-original, Type 1 overwrite, **Type 2 = new row +
  effective-date range + current flag + surrogate key**, Type 3 add-a-column, **Type 6 = 1+2+3
  hybrid**. This course does not renumber these.
- 2026-07-12 (DD-35) -- **Kafka** (source: Delivery Semantics -- https://docs.confluent.io/kafka/design/delivery-semantics.html ; accessed 2026-07-27): ordering is guaranteed only
  within a partition, never across partitions. **At-least-once is the default**; exactly-once
  (since 0.11) needs the idempotent producer (producer-id + sequence dedup) plus transactions.
- 2026-07-12 (DD-35) -- **stream-window naming collision**: **Flink** calls time-advancing
  overlapping windows "sliding"; **Kafka Streams** calls the same shape "hopping" and reserves
  "sliding" for a _record-triggered_ join window. This course uses the vendor-neutral trio
  **tumbling / hopping / session** throughout and flags the Kafka Streams "sliding" meaning here
  rather than in the spine.
- 2026-07-12 (DD-35) -- **exactly-once &ne; idempotent sink** (source: Exactly-once in Dataflow -- https://docs.cloud.google.com/dataflow/docs/concepts/exactly-once ; accessed 2026-07-27):
  exactly-once _inside_ an engine does not make an external write exactly-once; the sink write must
  itself be idempotent. This course teaches "idempotent upsert," never "the engine guarantees it
  end to end."
- 2026-07-12 (DD-35) -- **data contracts** are a practitioner-coined pattern (Chad Sanderson /
  Andrew Jones, roughly 2022-2024), not a formal standard. dbt "model contracts" enforce
  columns/types/constraints by **failing the build** on drift.
- 2026-07-12 (DD-35) -- **CDC** (Debezium): log-based CDC reads the database transaction log and
  captures inserts, updates, **and deletes**; query-based polling misses deletes and between-poll
  changes. `[Needs Verification]` -- `debezium.io` returned HTTP 403 on direct fetch as of the
  DD-35 pass; the CDC facts are corroborated via a Red Hat mirror plus consistent independent
  search, but this course keeps `[Unverified]` on a Debezium-primary source.
- 2026-07-12 (DD-35) -- **modern data stack** (source: Emerging Architectures for Modern Data Infrastructure -- https://a16z.com/emerging-architectures-for-modern-data-infrastructure/ ; accessed 2026-07-27, Bornstein/Li/Casado): source &rarr; ingest (EL,
  e.g. Fivetran) &rarr; transform (dbt) &rarr; serve (BI); core = replication + cloud warehouse +
  SQL modeling. The a16z page is a living document; this course cites the URL, not a fixed publication year.
- 2026-07-12 (DD-35) / 2026-07-27 (UPDATED) -- Jay Kreps, "The Log" (2013), is cited from the canonical LinkedIn
  Engineering URL via the Wayback Machine archive (original LinkedIn URL returned HTTP 404 as of 2026-07-27):
  (source: The Log: What every software engineer should know about real-time data's unifying abstraction -- https://web.archive.org/web/20190914012941/https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying ; accessed 2026-07-27)
- 2026-07-27 -- **version-pinned, this course's own toolchain**: worked-example transcripts were
  captured against `duckdb==1.5.5` (MIT), `pandas==3.0.5` (BSD-3-Clause, no unpatched CVEs at
  capture time), and `pytest==9.1.1` (MIT), on **Python 3.13**. `polars` (MIT) is a faster
  alternative dataframe library worth knowing about, but this course does not use it -- every
  worked example's data volume is small enough that `pandas` plus DuckDB's own native execution is
  simpler and sufficient.
- 2026-07-27 -- **Airflow scheduling kwargs, volatile**: `schedule_interval` was deprecated in favor
  of the unified `schedule` kwarg back in Airflow **2.4.0** (2022-09-19), not Airflow 3
  (source: Apache Airflow 2.4.0 Release Notes -- https://airflow.apache.org/docs/apache-airflow/2.4.0/release_notes.html ; accessed 2026-07-27);
  Airflow **3.0** then removed the legacy `schedule_interval` (and `timetable`) parameters entirely,
  making `schedule` the only option
  (source: Apache Airflow RELEASE_NOTES.rst, "Unified Scheduling Field" -- https://raw.githubusercontent.com/apache/airflow/main/RELEASE_NOTES.rst ; accessed 2026-07-27).
  Airflow 3.0 separately flipped `catchup`'s default from `True` to `False`
  (source: Apache Airflow -- Upgrading to Airflow 3 -- https://airflow.apache.org/docs/apache-airflow/stable/installation/upgrading_to_airflow3.html ; accessed 2026-07-27).
  This course's orchestration worked examples (ex-41 through ex-45) simulate a DAG's
  dependency/retry/schedule/catchup/backfill semantics in pure Python -- no live Airflow install,
  matching this course's no-network, no-live-service discipline -- so no example cites a specific
  Airflow kwarg name; this note exists only so a reader connecting these examples to a real Airflow
  DAG does not carry over the pre-2.4 `schedule_interval` name or assume `catchup` still defaults to
  `True`.

---

Next: [Learning Overview](./learning/overview.md) &rarr;
