---
title: "Overview"
date: 2026-10-23T00:00:00+07:00
draft: false
weight: 1
---

Prerequisites for this course: [clojure-essentials](/en/learn/courses/clojure-essentials/learning/overview) for Clojure syntax, projects, and tooling, and [sql-essentials](/en/learn/courses/sql-essentials/learning/overview) for CREATE and ALTER TABLE. Comfort editing and running Clojure programs from a terminal is assumed throughout, and every example builds only on the primers plus earlier examples in this course.

## Why this exists -- the big idea

**The problem before the solution**: `data-access-orms-and-query-builders` teaches ORM and query-builder concepts generically, but nobody teaches Migratus's own migration-ordering, journaling, and team-workflow model in Clojure at this depth. Teams without a migration discipline share schema changes as chat messages and ad-hoc SQL scripts: nobody knows which changes ran where, rollbacks are improvised under pressure, and two developers' changes collide in production. Migratus replaces folklore with artifacts: every change is a versioned file pair applied in order, and the database itself records which migrations already ran.

**Keep this if you forget everything else**: A migration that cannot be rolled back safely is a migration that will eventually be run in production by accident.

## Tensions and trade-offs -- when NOT to reach for this

- **Small versus strict**: nullable columns land without disturbing traffic; checks, defaults, and constraints land later once data complies. Each example names which side it takes and what the other side would cost, and Examples 31 and 34 collect the default-then-constrain shape for going strict safely.
- **One file versus many**: single-change scripts minimize lock windows and stay reviewable but multiply files; multi-statement scripts read as one story but hold locks longer and fail messier. The course defaults to small scripts and merges steps only when the steps genuinely share a deploy window.
- **When NOT**: throwaway exploration against a scratch database needs no versioning — create, poke, drop, done. Migrations earn their place when the database outlives the session: shared development databases, staging, and anything resembling production.

## Lineage -- where this tool sits

Migratus is the migration companion to the Clojure data-access ecosystem, and this course assumes both the Clojure primer and basic SQL DDL as background. The data-access course teaches data access; this course teaches schema evolution — the versioned history that lets the schema change while the data and the traffic survive. Later data courses assume migrations exist and build pipelines, analytics, and services on top of versioned schemas.

## How this course is organized

[Beginner](/en/learn/courses/database-migrations-with-clojure-and-migratus/learning/beginner) (Examples 1–25) writes first migrations and rolls them back with down files: file pairs, chain ordering, history reads, and rollback basics. [Intermediate](/en/learn/courses/database-migrations-with-clojure-and-migratus/learning/intermediate) (Examples 26–53) backfills data, splits breaking changes into zero-downtime steps, and adopts legacy databases with baselines and drift checks. [Advanced](/en/learn/courses/database-migrations-with-clojure-and-migratus/learning/advanced) (Examples 54–78) resolves branch conflicts, shrinks locking blast radius, and diagnoses failures from the journal. The [capstone](/en/learn/courses/database-migrations-with-clojure-and-migratus/learning/capstone/overview) evolves an order-management schema through eight realistic migrations with a golden verification query, and [drilling](/en/learn/courses/database-migrations-with-clojure-and-migratus/drilling/overview) turns the sixteen concepts into recall, katas, and checklists.

## About the runtime

Every learning example is a self-contained Clojure program: it stages its migration files into a relative `mig/` directory at runtime, builds its Migratus config against the harness database address (`PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, defaulting to a local PostgreSQL), and verifies every migration by reading the database back with `next.jdbc`. The per-example history table (`mNN_migrations`) isolates reruns, so units never interfere even when a shared server runs them back to back. Migration files carry fixed fourteen-digit ids (`20260101NNNNNN`) so transcripts are byte-stable across runs and machines; the `create` helper's clock stamps are stripped wherever they would leak into output. Outputs print `migrate:` (nil when everything applied), `completed:` (applied names in id order), and the verification reads — the same three beats in every example, so skimming seventy-eight transcripts teaches the rhythm before the details.
