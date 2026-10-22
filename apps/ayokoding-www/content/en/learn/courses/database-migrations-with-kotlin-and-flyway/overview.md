---
title: Overview
date: 2026-10-22T00:00:00+07:00
draft: false
weight: 1
---

Flyway turns a schema change into a reviewable, orderable, reversible artifact, and Kotlin drives it against a real PostgreSQL database. Across seventy-eight small, independently runnable programs you will write migrations that create, alter, and safely reverse schema changes; order them so parallel teams never collide; run them against pinned PostgreSQL 18 through the course harness; and diagnose failed, edited, or drifted histories with Flyway's own tooling.

## Why this exists -- the big idea

**The problem before the solution**: object-relational mapping courses teach generic persistence concepts, but nobody teaches Flyway's own migration-ordering, rollback, and team-workflow model in Kotlin at production depth. Developers hand-run SQL, edit applied files, and discover conflicts on release day.

**Keep this if you forget everything else**: A migration that cannot be rolled back safely is a migration that will eventually be run in production by accident.

## What you will be able to do

After this course you can write a Flyway migration that creates, alters, and safely rolls back a schema change; order migrations so a team working in parallel does not create a conflicting history; run migrations against a real PostgreSQL database inside the course harness and verify the resulting schema; use Flyway's own tooling to inspect migration history and diagnose a failed or partially applied migration; and decide when a migration needs a data backfill step versus a schema-only change.

## How this course is organized

[Learning](/en/learn/courses/database-migrations-with-kotlin-and-flyway/learning/overview) holds seventy-eight worked examples in three levels: Beginner (Examples 1–25) covers first migrations, history and ordering, and rollback basics; Intermediate (Examples 26–53) covers backfills, zero-downtime splitting, and baselining existing databases; Advanced (Examples 54–78) covers conflict resolution across branches, locking migrations, and diagnosing failed or partial migrations. The [capstone](/en/learn/courses/database-migrations-with-kotlin-and-flyway/learning/capstone/overview) evolves a small order-management schema through eight realistic migrations, and [drilling](/en/learn/courses/database-migrations-with-kotlin-and-flyway/drilling/overview) turns the sixteen concepts into recall questions, applied problems, katas, and checklists.

## Prerequisites

Prior courses: [just-enough-kotlin](/en/learn/courses/just-enough-kotlin/learning/overview) for Kotlin basics and [sql-essentials](/en/learn/courses/sql-essentials/learning/overview) for DDL. Every example is Kotlin driving Flyway against PostgreSQL 18, so both prerequisites earn their place from the first page.

## About the examples

Every example is a real Kotlin program executed by the course harness against the pinned Kotlin toolchain with its hash-locked Flyway jars and a real, pinned PostgreSQL 18 service container -- never a mock. Each example ships its own folder with the program, its SQL migration files, a run specification, and the recorded golden output; the lesson embeds every file byte-identically. No example reads the live system or the clock; the double-run determinism check applies to the final schema state, not to wall-clock timing.

## References

Provenance for the facts this course teaches, re-verified at writing time since migration-tool behavior changes between versions. The pinned toolchain versions in `apps/ayokoding-cli` and the pinned PostgreSQL 18 service image are the source of truth for any version-specific behavior.

- Flyway documentation (Redgate), command syntax and version-specific behavior for `migrate`, `validate`, `info`, `baseline`, and `repair`. Accessed 2026-10-22. [Flyway documentation](https://documentation.red-gate.com/flyway)
- PostgreSQL 18 documentation, DDL reference and transactional DDL behavior relied upon by the rollback examples. Accessed 2026-10-22. [PostgreSQL documentation](https://www.postgresql.org/docs/)
- The pinned Kotlin toolchain entry plus the course `learning/code/jars.lock` (Flyway 13.10.0, PostgreSQL JDBC 42.7.14) are the source of truth for any version-specific migration-tool behavior.
