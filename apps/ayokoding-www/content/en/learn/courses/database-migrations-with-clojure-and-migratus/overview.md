---
title: "Overview"
date: 2026-10-23T00:00:00+07:00
draft: false
weight: 1
---

Every production database outlives its first schema: columns get added, renamed, and dropped while the application keeps serving traffic and the data inside must survive each step. Across seventy-eight small, independently runnable programs you will learn the tool that turns those scary steps into routine ones — Migratus, the migration runner for Clojure — driving a real PostgreSQL 18 database from Clojure in the course harness: writing versioned file pairs with forward steps, ordering them into one linear history, running them up, rolling them back, backfilling data, splitting breaking changes into zero-downtime steps, baselining legacy databases, resolving branch conflicts, and diagnosing failures from the migration journal.

## Why this exists -- the big idea

**The problem before the solution**: `data-access-orms-and-query-builders` teaches ORM and query-builder concepts generically, but nobody teaches Migratus's own migration-ordering, journaling, and team-workflow model in Clojure at this depth. Teams without a migration discipline share schema changes as chat messages and ad-hoc SQL scripts: nobody knows which changes ran where, rollbacks are improvised under pressure, and two developers' changes collide in production. Migratus replaces folklore with artifacts — every change is a versioned file pair applied in order, and the database itself records which migrations already ran.

**Keep this if you forget everything else**: A migration that cannot be rolled back safely is a migration that will eventually be run in production by accident.

## What you will be able to

After this course you can write a Migratus migration that creates, alters, and safely rolls back a schema change; order migrations so a team working in parallel never creates a conflicting history; run migrations against a real PostgreSQL database and verify the resulting schema; read the migration journal to diagnose a failed or partially applied migration; and decide when a migration needs a data backfill step versus a schema-only change.

## How this course is organized

[Learning](/en/learn/courses/database-migrations-with-clojure-and-migratus/learning/overview) holds seventy-eight worked examples in three levels: Beginner (Examples 1–25) writes first migrations and rolls them back with down files; Intermediate (Examples 26–53) backfills data, splits breaking changes into zero-downtime steps, and baselines existing databases; Advanced (Examples 54–78) resolves branch conflicts, shrinks locking blast radius, and diagnoses failures. The [capstone](/en/learn/courses/database-migrations-with-clojure-and-migratus/learning/capstone/overview) evolves an order-management schema through eight realistic migrations with a golden verification query, and [drilling](/en/learn/courses/database-migrations-with-clojure-and-migratus/drilling/overview) turns the sixteen concepts into recall questions, applied problems, katas, and checklists.

## Prerequisites

Prior courses: [clojure-essentials](/en/learn/courses/clojure-essentials/learning/overview) for basic syntax, projects, and tooling, and [sql-essentials](/en/learn/courses/sql-essentials/learning/overview) for CREATE and ALTER TABLE. Assumed knowledge: basic SQL DDL. Every example is Clojure driving Migratus migrations against PostgreSQL 18, so the primer earns its place from the first page and the SQL course earns its place wherever a statement's meaning matters.

## About the examples

Every example is a real Clojure program executed by the course harness against a real, pinned PostgreSQL 18 container — never a mock. Each unit runs `clojure main.clj` with its hash-locked `jars.lock` (Migratus 1.6.8 with `next.jdbc` 1.3.1118, PostgreSQL JDBC 42.7.14, and `slf4j-simple` 2.0.20) and applies its migrations through Migratus's own engine. Each example owns its tables (named `mNN_...`) and its history table (`mNN_migrations`), drops leftovers before running, and cleans up after itself, so reruns are byte-stable: programs print labels, names, and row values — never timings, paths, or revision noise. Migratus journals every applied migration by id and skips journaled ids on rerun, which is the idempotence the double run verifies. Standard output is the asserted golden transcript; standard error is ignored.

## References

- Migratus project repository (migration commands, journaling, transaction options). Accessed 2026-10-23. [Migratus on GitHub](https://github.com/yogthos/migratus)
- PostgreSQL 18 documentation (DDL, locking, CONCURRENTLY). Accessed 2026-10-23. [PostgreSQL docs](https://www.postgresql.org/docs/)
- Clojure documentation (sequences, JDBC interop via next.jdbc). Accessed 2026-10-23. [Clojure docs](https://clojure.org)
- The pinned Clojure toolchain and PostgreSQL 18 versions in `apps/ayokoding-cli` are the source of truth for any version-specific behavior.
