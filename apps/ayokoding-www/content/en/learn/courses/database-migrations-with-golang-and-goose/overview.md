---
title: "Overview"
date: 2026-10-22T00:00:00+07:00
draft: false
weight: 1
---

Every production database outlives its first schema: columns get added, renamed, and dropped while the application keeps serving traffic and the data inside must survive each step. Across seventy-eight small, independently runnable programs you will learn the tool that turns those scary steps into routine ones — Goose, the migration companion to Go — driving a real PostgreSQL 18 database in the course harness: writing goose files with forward and reverse sections, ordering them into one linear history, running them up and back down, backfilling data, splitting breaking changes into zero-downtime steps, baselining legacy databases, resolving branch conflicts, and diagnosing failures from the migration history table.

## Why this exists -- the big idea

**The problem before the solution**: `data-access-orms-and-query-builders` teaches ORM and query-builder concepts generically, but nobody teaches Goose's own migration-ordering, rollback, and team-workflow model in Go at this depth. Teams without a migration discipline share schema changes as chat messages and ad-hoc SQL scripts: nobody knows which changes ran where, rollbacks are improvised under pressure, and two developers' changes collide in production. Goose replaces folklore with artifacts — every change is a versioned SQL file with a forward and a reverse step, and the database itself records which files already ran.

**Keep this if you forget everything else**: A migration that cannot be rolled back safely is a migration that will eventually be run in production by accident.

## What you will be able to do

After this course you can write a goose migration that creates, alters, and safely rolls back a schema change; order migrations so a team working in parallel never creates a conflicting history; run migrations against a real PostgreSQL database and verify the resulting schema; read the migration history table to diagnose a failed or partially applied migration; and decide when a change needs a data backfill step versus a schema-only change.

## How this course is organized

[Learning](/en/learn/courses/database-migrations-with-golang-and-goose/learning/overview) holds seventy-eight worked examples in three levels: Beginner (Examples 1–25) writes first migrations and rolls them back; Intermediate (Examples 26–53) backfills data, splits breaking changes into zero-downtime steps, and baselines existing databases; Advanced (Examples 54–78) resolves branch conflicts, shrinks locking blast radius, and diagnoses failures. The [capstone](/en/learn/courses/database-migrations-with-golang-and-goose/learning/capstone/overview) evolves an order-management schema through eight realistic migrations with a golden verification query, and [drilling](/en/learn/courses/database-migrations-with-golang-and-goose/drilling/overview) turns the sixteen concepts into recall questions, applied problems, katas, and checklists.

## Prerequisites

Prior courses: [just-enough-go](/en/learn/courses/just-enough-go/learning/overview) for basic syntax, modules, and tooling, and [sql-essentials](/en/learn/courses/sql-essentials/learning/overview) for CREATE and ALTER TABLE. Assumed knowledge: basic SQL DDL. Every example is Go driving goose-format migrations against PostgreSQL 18, so the primer earns its place from the first page and the SQL course earns its place wherever a statement's meaning matters.

## About the examples

Every example is a real Go program executed by the course harness against a real, pinned PostgreSQL 18 container — never a mock. The harness network is closed and the Go toolchain carries no install recipe, so every unit is standard-library only: each program carries a small driver that speaks the PostgreSQL wire protocol and applies the same goose SQL files `goose up` would apply. Each example owns its tables (named `exNN_...`), drops leftovers before running, and cleans up after itself, so reruns are byte-stable: programs print labels, counts, and row values — never timings, paths, or revision noise. Goose files shown in a lesson are written by the program itself into a scratch migrations directory at runtime and executed for real with the driver's transaction-per-file discipline against the service database. Standard output is the asserted golden transcript; standard error is ignored. Where the lesson shows a goose file, the program writes that exact file into the scratch directory and runs it for real.

## References

- Goose documentation (commands, SQL file format, `goose_db_version` history). Accessed 2026-10-22. [Goose docs](https://pressly.github.io/goose/)
- PostgreSQL 18 documentation (DDL, locking, CONCURRENTLY). Accessed 2026-10-22. [PostgreSQL docs](https://www.postgresql.org/docs/)
- Go standard library documentation (net, encoding/binary, database/sql driver model). Accessed 2026-10-22. [Go docs](https://pkg.go.dev/std)
- The pinned Go and PostgreSQL 18 versions in `apps/ayokoding-cli` are the source of truth for any version-specific behavior.
