---
title: Overview
date: 2026-10-22T00:00:00+07:00
draft: false
weight: 1
---

Liquibase turns a schema change into a reviewable, orderable, reversible artifact; this course teaches it end to end in Java. Across seventy-eight small, independently runnable programs you will write migrations that create, alter, and safely roll back schema changes; order them so parallel teams never collide; run them against a real PostgreSQL database; and diagnose failed, partial, and drifted histories with Liquibase's own tooling.

## Why this exists -- the big idea

**The problem before the solution**: `data-access-orms-and-query-builders` teaches ORM and query-builder concepts generically, but nobody teaches Liquibase's own migration-ordering, rollback, and team-workflow model in Java at production depth. Teams share SQL scripts by chat, apply them by hand, and discover in production that two developers created the same table differently. Untracked schema changes are invisible until they break a deploy.

**Keep this if you forget everything else**: A migration that cannot be rolled back safely is a migration that will eventually be run in production by accident.

## What you will be able to do

After this course you can write a Liquibase migration that creates, alters, and safely rolls back a schema change; order migrations so a team working in parallel does not create a conflicting history; run migrations against a real PostgreSQL database inside the course's harness and verify the resulting schema; use Liquibase's own tooling to inspect migration history and diagnose a failed or partially applied migration; and decide when a migration needs a data backfill step versus a schema-only change.

## How this course is organized

[Learning](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/overview) holds seventy-eight worked examples in three levels: Beginner (Examples 1-25) covers first migrations, migration history and ordering, and rollback basics; Intermediate (Examples 26-53) covers backfills and data migrations, zero-downtime migration splitting, and baselining an existing database; Advanced (Examples 54-78) covers conflict resolution across branches, locking migrations and their blast radius, and diagnosing a failed or partial migration. The [capstone](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/capstone/overview) evolves a small order-management schema through eight realistic Liquibase migrations including one zero-downtime column rename and one backfill, and [drilling](/en/learn/courses/database-migrations-with-java-and-liquibase/drilling/overview) turns the sixteen concepts into recall questions, applied problems, katas, and checklists.

## Prerequisites

Prior courses: [just-enough-java](/en/learn/courses/just-enough-java/learning/overview) for Java's basic syntax, and [sql-essentials](/en/learn/courses/sql-essentials/learning/overview) for basic SQL DDL. Assumed knowledge: comfort creating and altering tables in SQL. Every example here is Java driving Liquibase against PostgreSQL 18, so both primers earn their place from the first page.

## About the examples

Every example is a real Java program executed by the course harness against the pinned Java toolchain with the pinned PostgreSQL 18 service container; no migration step is mocked. Each example ships its own folder with the program, its changelog files, a run specification, and the recorded golden output; the lesson embeds every file byte-identically. Standard output is the asserted transcript. The transcript holds only the program's own verification prints: Liquibase runs under its LOGGER UI service with logging silenced, because its console narration differs between a first run and a rerun and the harness executes every unit twice.

## References

- Liquibase documentation, read and dated at writing time (2026-10-22), for command syntax and version-specific behaviour.
- The pinned PostgreSQL 18 service-container image and the pinned toolchain version are the source of truth for any version-specific SQL or migration-tool behaviour.
