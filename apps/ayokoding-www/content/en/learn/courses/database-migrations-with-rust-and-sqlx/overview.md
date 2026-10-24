---
title: Overview
date: 2026-10-22T00:00:00+07:00
draft: false
weight: 1
---

Every team eventually faces the same question: how does a schema change reach production without breaking the running system? `sqlx` answers with versioned migration files, a history table that records every run, checksums that catch tampering, and reversible pairs that make rollback rehearsed instead of improvised. This course teaches that answer end to end in Rust, against real PostgreSQL, across seventy-eight runnable examples.

## Why this exists -- the big idea

**The problem before the solution**: Schema changes start as hand-run SQL in a console: fast, invisible, and unrepeatable. The second environment drifts from the first, the third from the second, and nobody can reconstruct what actually ran where. Deploys become folklore, rollbacks become improvisation, and every incident starts with the question nobody can answer: what is the schema right now?

**Keep this if you forget everything else**: A migration that cannot be rolled back safely is a migration that will eventually be run in production by accident.

Versioned files fix the invisibility: each change is a reviewed artifact with a number, a description, and a checksum. The migrator applies them in order, records each in `_sqlx_migrations`, and refuses to proceed when files stop matching history. Rollback stops being a panic and becomes a procedure: tested down files reverse the top, forward fixes repair one-way work, and the history stays truthful throughout.

## What you will be able to do

- Write versioned sqlx migrations that create, alter, and index tables safely.
- Rely on the history table, checksums, and validation to prove what ran.
- Backfill live data with batched, guarded, and verified data migrations.
- Split breaking changes into zero-downtime expand and contract sequences.
- Baseline legacy databases so old systems join the managed chain.
- Resolve branch conflicts by renumbering forward instead of rewriting history.
- Trust the advisory lock to serialize concurrent migrators across fleets.
- Diagnose failed, edited, drifted, and partial histories with a checklist.

## How this course is organized

- Beginner (Examples 1–25): migration files, ordering, the history table, and rollback basics.
- Intermediate (Examples 26–53): backfills, zero-downtime splits, and legacy baselines.
- Advanced (Examples 54–78): branch conflicts, locking under concurrency, and failure diagnosis.
- [Capstone](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/capstone): evolve a shop schema through eight migrations and prove it with a golden join.
- [Drilling](/en/learn/courses/database-migrations-with-rust-and-sqlx/drilling): recall questions, applied incidents, eight katas, and the habits checklist.

## Prerequisites

Prior courses: [just-enough-rust](/en/learn/courses/just-enough-rust/learning/overview) for Rust basics and [sql-essentials](/en/learn/courses/sql-essentials/learning/overview) for DDL. Readers should already write Rust functions, handle `Result`, and read `CREATE TABLE` without help.

## About the examples

Every example is a complete Rust program compiled against sqlx 0.8 with a pinned lockfile and run against a real PostgreSQL 18 container. Each program embeds its migrations at compile time with `migrate!`, applies them, then proves one behavior with queries. Outputs are golden-tested and deterministic: no clocks, no timings, no network. The `db_url` helper in every program reads the standard service variables, so each example connects to its own fresh database.

The course uses one shared package name and one shared lockfile across all units, so a single environment image serves the whole course. Same-version files stay byte-identical wherever they repeat, because checksums cover whole files.

## References

- [sqlx documentation](https://docs.rs/sqlx). Accessed 2026-10-22.
- [PostgreSQL documentation](https://www.postgresql.org/docs/). Accessed 2026-10-22.
- [just-enough-rust](/en/learn/courses/just-enough-rust/learning/overview). Accessed 2026-10-22.
- [sql-essentials](/en/learn/courses/sql-essentials/learning/overview). Accessed 2026-10-22.
