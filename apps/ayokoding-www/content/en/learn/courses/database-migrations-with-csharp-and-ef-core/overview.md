---
title: "Overview"
date: 2026-10-22T00:00:00+07:00
draft: false
weight: 1
---

Every production database outlives its first schema: columns get added, renamed, and dropped while the application keeps serving traffic and the data inside must survive each step. Across seventy-eight small, independently runnable programs you will learn the tool that turns those scary steps into routine ones — Entity Framework Core migrations in C# — driving a real PostgreSQL 18 database in the course harness: writing versioned migration classes with Up and Down, ordering them into one linear history, running them up and back down, backfilling data, splitting breaking changes into zero-downtime steps, baselining legacy databases, resolving branch conflicts, and diagnosing failures from the migration history table.

## Why this exists -- the big idea

**The problem before the solution**: `data-access-orms-and-query-builders` teaches ORM and query-builder concepts generically, but nobody teaches EF Core's own migration-ordering, rollback, and team-workflow model in C# at this depth. Teams without a migration discipline share schema changes as chat messages and ad-hoc SQL scripts: nobody knows which changes ran where, rollbacks are improvised under pressure, and two developers' changes collide in production. EF Core replaces folklore with artifacts — every change is a versioned C# class with a forward and a reverse step, and the database itself records which classes already ran.

**Keep this if you forget everything else**: A migration that cannot be rolled back safely is a migration that will eventually be run in production by accident.

## What you will be able to do

After this course you can write a EF Core migration that creates, alters, and safely rolls back a schema change; order migrations so a team working in parallel never creates a conflicting history; run migrations against a real PostgreSQL database and verify the resulting schema; read the migration history table to diagnose a failed or partially applied migration; and decide when a change needs a data backfill step versus a schema-only change.

## How this course is organized

[Learning](/en/learn/courses/database-migrations-with-csharp-and-ef-core/learning/overview) holds seventy-eight worked examples in three levels: Beginner (Examples 1–25) writes first migrations and rolls them back; Intermediate (Examples 26–53) backfills data, splits breaking changes into zero-downtime steps, and baselines existing databases; Advanced (Examples 54–78) resolves branch conflicts, shrinks locking blast radius, and diagnoses failures. The [capstone](/en/learn/courses/database-migrations-with-csharp-and-ef-core/learning/capstone/overview) evolves an order-management schema through eight realistic migrations with a golden verification query, and [drilling](/en/learn/courses/database-migrations-with-csharp-and-ef-core/drilling/overview) turns the sixteen concepts into recall questions, applied problems, katas, and checklists.

## Prerequisites

Prior courses: [just-enough-csharp](/en/learn/courses/just-enough-csharp/learning/overview) for basic syntax, projects, and tooling, and [sql-essentials](/en/learn/courses/sql-essentials/learning/overview) for CREATE and ALTER TABLE. Assumed knowledge: basic SQL DDL. Every example is C# driving EF Core migrations against PostgreSQL 18, so the primer earns its place from the first page and the SQL course earns its place wherever a statement's meaning matters.

## About the examples

Every example is a real C# program executed by the course harness against a real, pinned PostgreSQL 18 container — never a mock. The harness network is closed; NuGet restores from the course-local locked feed, so every unit builds against byte-identical packages (Entity Framework Core 10.0.4 with the Npgsql PostgreSQL provider, recorded in each unit's `packages.lock.json`). Each program migrates with `Database.Migrate()`, which applies the same versioned C# classes a developer reviews — the history shape, the ordering rules, and the `__EFMigrationsHistory` table are EF Core's own. Each example owns its tables (named per example), resets leftovers before running, and cleans up after itself, so reruns are byte-stable: programs print labels, counts, and row values — never timings, paths, or revision noise. Standard output is the asserted golden transcript; standard error is ignored.

## References

- Entity Framework Core documentation (migrations, `Database.Migrate()`, `__EFMigrationsHistory`). Accessed 2026-10-22. [EF Core docs](https://learn.microsoft.com/en-us/ef/core/)
- Npgsql Entity Framework Core provider documentation (PostgreSQL mapping, value generation). Accessed 2026-10-22. [Npgsql docs](https://www.npgsql.org/efcore/)
- PostgreSQL 18 documentation (DDL, locking, MVCC). Accessed 2026-10-22. [PostgreSQL docs](https://www.postgresql.org/docs/)
- The pinned .NET and PostgreSQL 18 versions in `apps/ayokoding-cli` are the source of truth for any version-specific behavior.
