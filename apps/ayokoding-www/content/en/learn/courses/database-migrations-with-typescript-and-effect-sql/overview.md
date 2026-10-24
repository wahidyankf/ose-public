---
title: Overview
date: 2026-10-23T00:00:00+07:00
draft: false
weight: 1
---

Every team eventually faces the same question: how does a schema change reach production without breaking the running system? Effect SQL answers with ordered migration Effects, a history table that records every run, an exclusive lock that serializes competing migrators, and compensation migrations that make rollback rehearsed instead of improvised. This course teaches that answer end to end in TypeScript, against real PostgreSQL, across seventy-eight runnable examples.

## Why this exists -- the big idea

**The problem before the solution**: Schema changes start as hand-run SQL in a console: fast, invisible, and unrepeatable. The second environment drifts from the first, the third from the second, and nobody can reconstruct what actually ran where. Deploys become folklore, rollbacks become improvisation, and every incident starts with the question nobody can answer: what is the schema right now?

**Keep this if you forget everything else**: A migration that cannot be rolled back safely is a migration that will eventually be run in production by accident.

Versioned migrations fix the invisibility: each change is a reviewed artifact with a number, a description, and a history row. The migrator applies them in order, locks the history while it works, and records each success. Rollback stops being a panic and becomes a procedure: compensating migrations reverse the top, forward fixes repair one-way work, and the history stays truthful throughout.

## What you will be able to do

- Write Effect SQL migrations that create, alter, and index tables safely.
- Order migrations so parallel branches converge on one linear history.
- Run migrations against a real PostgreSQL database and verify the schema.
- Inspect the history table to diagnose failed or partially applied migrations.
- Split breaking changes into zero-downtime expand, backfill, and contract steps.
- Backfill live data with guarded, batched, and verified data migrations.
- Baseline legacy databases so old systems join the managed line.
- Resolve branch conflicts by renumbering forward instead of rewriting history.
- Decide when a migration needs a backfill versus a schema-only change.

## How this course is organized

- Beginner (Examples 1–25): migration files, ordering, the history table, and rollback basics.
- Intermediate (Examples 26–53): backfills, zero-downtime splits, and legacy baselines.
- Advanced (Examples 54–78): branch conflicts, locking under concurrency, and failure diagnosis.
- [Capstone](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/capstone): evolve a shop schema through eight migrations and prove it with a golden join.
- [Drilling](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/drilling): recall questions, applied incidents, eight katas, and the habits checklist.

## Prerequisites

Prior courses: [just-enough-typescript](/en/learn/courses/just-enough-typescript/learning/overview) for TypeScript basics and [sql-essentials](/en/learn/courses/sql-essentials/learning/overview) for DDL. Readers should already write TypeScript functions, read Effect's `Effect.gen` without help, and read `CREATE TABLE` without help.

## About the examples

Every example is a complete TypeScript program built on Effect 4 with `@effect/sql-pg` and a pinned lockfile, run against a real PostgreSQL 18 container. Small examples describe their migrations inline with `Migrator.fromRecord`; file-based examples keep numbered `migrations/*.ts` modules and load them with `Migrator.fromFileSystem`. Each program applies its migrations, proves one behavior with queries, cleans up its tables, and prints a fixed transcript. Outputs are golden-tested and deterministic: no clocks, no timings, no network.

Effect SQL migrations move in one direction only: there is no down step. Rollback means writing a compensating migration, and the history records both. Effect also records no content checksum, so one advanced example builds the checksum guard the tool leaves out. Both facts are verified against the migrator's own source and taught as design, not as gaps.

The course uses one shared lockfile across all units, so a single environment image serves the whole course. Every unit reads the database address from the standard `PGHOST`, `PGPORT`, `PGDATABASE`, and `PGUSER` variables, so each example connects to its own fresh database.

## References

- [Effect SQL PgMigrator documentation](https://effect.website/docs/sql-pg/migrator). Accessed 2026-10-23.
- [Effect documentation](https://effect.website/docs). Accessed 2026-10-23.
- [PostgreSQL documentation](https://www.postgresql.org/docs/). Accessed 2026-10-23.
- [just-enough-typescript](/en/learn/courses/just-enough-typescript/learning/overview). Accessed 2026-10-23.
- [sql-essentials](/en/learn/courses/sql-essentials/learning/overview). Accessed 2026-10-23.
