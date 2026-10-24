---
title: Overview
date: 2026-10-23T00:00:00+07:00
draft: false
weight: 1
---

Prerequisites for this course: [enterprise-java-and-the-jvm](/en/learn/courses/enterprise-java-and-the-jvm/learning/overview) for Spring and the JVM fundamentals, which every example here assumes you can already read; and [sql-essentials](/en/learn/courses/sql-essentials/learning/overview) for basic SQL DDL (CREATE and ALTER TABLE), which every migration here builds on. Assumed knowledge: comfort creating and altering tables in SQL.

## Why this exists -- the big idea

**The problem before the solution**: `data-access-orms-and-query-builders` teaches ORM and query-builder concepts generically; nobody teaches Spring Data JPA's own migration-ordering, rollback, and team-workflow model in Java at the depth production databases demand. Shared SQL scripts applied by hand drift, collide, and resist rollback.

**Keep this if you forget everything else**: A migration that cannot be rolled back safely is a migration that will eventually be run in production by accident.

## How this course is organized

Beginner (Examples 1–25) writes first migrations, reads the history tables Spring Data JPA repositories keep, and practices rollback until it is boring. Intermediate (Examples 26–53) moves data as well as schema, splits breaking changes into zero-downtime steps, and adopts databases that predate migrations. Advanced (Examples 54–78) resolves the conflicts parallel teams create, contains locking migrations, and diagnoses failed or partial runs from the history tables. Every example runs for real: Java driving Spring Data JPA against the pinned PostgreSQL 18 service container, with the golden output recorded beside the program.

## The sixteen concepts

- co-01 migration-file: a versioned, ordered description of one schema change.
- co-02 up-and-down: the forward change and its reverse.
- co-03 migration-history-table: the database's own record of what has already run.
- co-04 linear-vs-branching-history: whether migrations form one line or can conflict across branches.
- co-05 idempotent-migration: a migration safe to attempt twice.
- co-06 backfill: a data-only step separate from the schema change.
- co-07 zero-downtime-migration: splitting a breaking change into safe, deployable steps.
- co-08 rollback: reversing an applied migration without losing unrelated data.
- co-09 schema-drift: the database's real schema diverging from the migration history.
- co-10 baseline: marking an existing database as the migration starting point.
- co-11 checksum-validation: Spring Data JPA's own protection against an edited, already-applied migration.
- co-12 transaction-wrapped-migration: running a migration inside a transaction where the database supports it.
- co-13 environment-promotion: running the same migrations across dev, test, and production in order.
- co-14 conflict-resolution: merging two developers' migrations without breaking order.
- co-15 locking-migration: a migration that needs an exclusive lock, and how to minimize its blast radius.
- co-16 migration-testing: verifying a migration's effect with an automated check.

## Examples by Level

### Beginner (Examples 1–25)

- [Example 1: Run Your First Migration](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/beginner#example-1-run-your-first-migration)
- [Example 2: Versioned Files Order Themselves](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/beginner#example-2-versioned-files-order-themselves)
- [Example 3: Up Migrations Declare Intent](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/beginner#example-3-up-migrations-declare-intent)
- [Example 4: Create Tables with V001](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/beginner#example-4-create-tables-with-v001)
- [Example 5: Alter a Live Table with V002](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/beginner#example-5-alter-a-live-table-with-v002)
- [Example 6: Constraints Guard New Columns](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/beginner#example-6-constraints-guard-new-columns)
- [Example 7: Indexes Speed the New Query Path](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/beginner#example-7-indexes-speed-the-new-query-path)
- [Example 8: Foreign Keys Link Two Tables](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/beginner#example-8-foreign-keys-link-two-tables)
- [Example 9: The History Table Records Every Run](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/beginner#example-9-the-history-table-records-every-run)
- [Example 10: Reruns Are Safe No-Ops](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/beginner#example-10-reruns-are-safe-no-ops)
- [Example 11: Checksums Catch Edited History](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/beginner#example-11-checksums-catch-edited-history)
- [Example 12: Idempotent Migrations Survive Retries](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/beginner#example-12-idempotent-migrations-survive-retries)
- [Example 13: Numeric Prefixes Order Migrations](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/beginner#example-13-numeric-prefixes-order-migrations)
- [Example 14: Linear History Beats Branches](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/beginner#example-14-linear-history-beats-branches)
- [Example 15: The Repository Reads History as Data](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/beginner#example-15-the-repository-reads-history-as-data)
- [Example 16: Pending Migrations Preview Before Apply](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/beginner#example-16-pending-migrations-preview-before-apply)
- [Example 17: Descriptions Make History Readable](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/beginner#example-17-descriptions-make-history-readable)
- [Example 18: Down Migrations Reverse Up](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/beginner#example-18-down-migrations-reverse-up)
- [Example 19: Roll Back One Migration](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/beginner#example-19-roll-back-one-migration)
- [Example 20: Roll Back to a Version](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/beginner#example-20-roll-back-to-a-version)
- [Example 21: Rollback Deletes Its History Row](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/beginner#example-21-rollback-deletes-its-history-row)
- [Example 22: Data Rollbacks Restore Rows](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/beginner#example-22-data-rollbacks-restore-rows)
- [Example 23: Rollbacks Without a Plan Fail Loudly](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/beginner#example-23-rollbacks-without-a-plan-fail-loudly)
- [Example 24: Forward Fixes Beat Rollbacks Sometimes](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/beginner#example-24-forward-fixes-beat-rollbacks-sometimes)
- [Example 25: Validate Catches Errors Before Apply](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/beginner#example-25-validate-catches-errors-before-apply)

### Intermediate (Examples 26–53)

- [Example 26: Seed Reference Data with a Migration](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/intermediate#example-26-seed-reference-data-with-a-migration)
- [Example 27: Updates Backfill a New Column](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/intermediate#example-27-updates-backfill-a-new-column)
- [Example 28: Schema First, Backfill Second](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/intermediate#example-28-schema-first-backfill-second)
- [Example 29: Batched Updates Migrate Large Tables](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/intermediate#example-29-batched-updates-migrate-large-tables)
- [Example 30: Default Values Fill Old Rows](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/intermediate#example-30-default-values-fill-old-rows)
- [Example 31: Deletes Remove Retired Rows](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/intermediate#example-31-deletes-remove-retired-rows)
- [Example 32: Data-Only Migrations Carry No DDL](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/intermediate#example-32-data-only-migrations-carry-no-ddl)
- [Example 33: Verification Queries Prove Backfills](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/intermediate#example-33-verification-queries-prove-backfills)
- [Example 34: When a Backfill Needs Its Own Release](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/intermediate#example-34-when-a-backfill-needs-its-own-release)
- [Example 35: Expand: Add Without Breaking](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/intermediate#example-35-expand-add-without-breaking)
- [Example 36: Migrate: Move Reads Gradually](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/intermediate#example-36-migrate-move-reads-gradually)
- [Example 37: Contract: Drop the Old Column](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/intermediate#example-37-contract-drop-the-old-column)
- [Example 38: Rename Columns in Three Steps](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/intermediate#example-38-rename-columns-in-three-steps)
- [Example 39: Add a Not-Null Column Safely](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/intermediate#example-39-add-a-not-null-column-safely)
- [Example 40: Split Table Changes Across Releases](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/intermediate#example-40-split-table-changes-across-releases)
- [Example 41: Backfill Under a Read Load](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/intermediate#example-41-backfill-under-a-read-load)
- [Example 42: Guard Each Phase with Checks](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/intermediate#example-42-guard-each-phase-with-checks)
- [Example 43: Zero-Downtime Needs Compatible Defaults](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/intermediate#example-43-zero-downtime-needs-compatible-defaults)
- [Example 44: Roll Forward, Never Back, Mid-Split](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/intermediate#example-44-roll-forward-never-back-mid-split)
- [Example 45: Adopt a Database That Predates Migrations](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/intermediate#example-45-adopt-a-database-that-predates-migrations)
- [Example 46: Baseline Marks History Without Rerunning](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/intermediate#example-46-baseline-marks-history-without-rerunning)
- [Example 47: Baseline Never Replays Old DDL](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/intermediate#example-47-baseline-never-replays-old-ddl)
- [Example 48: Drift: Find Tables History Forgot](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/intermediate#example-48-drift-find-tables-history-forgot)
- [Example 49: Drift: Find History Rows Without Tables](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/intermediate#example-49-drift-find-history-rows-without-tables)
- [Example 50: Reconcile Drift Before Migrating](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/intermediate#example-50-reconcile-drift-before-migrating)
- [Example 51: Baseline with Seed Data Intact](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/intermediate#example-51-baseline-with-seed-data-intact)
- [Example 52: Promote the Same Migrations to Test](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/intermediate#example-52-promote-the-same-migrations-to-test)
- [Example 53: Promote Dev to Test to Production Order](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/intermediate#example-53-promote-dev-to-test-to-production-order)

### Advanced (Examples 54–78)

- [Example 54: Two Branches, One Version](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/advanced#example-54-two-branches-one-version)
- [Example 55: Checksums Tell Edits from Moves](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/advanced#example-55-checksums-tell-edits-from-moves)
- [Example 56: Renumber to Restore Linear Order](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/advanced#example-56-renumber-to-restore-linear-order)
- [Example 57: Merge Histories Without Rewriting](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/advanced#example-57-merge-histories-without-rewriting)
- [Example 58: The Loser Rebases, Not the Ledger](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/advanced#example-58-the-loser-rebases-not-the-ledger)
- [Example 59: Resolve at the File Table, Not in Production](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/advanced#example-59-resolve-at-the-file-table-not-in-production)
- [Example 60: Order Conflicts Fail Before DDL Runs](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/advanced#example-60-order-conflicts-fail-before-ddl-runs)
- [Example 61: Team Protocol: Claim Versions Early](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/advanced#example-61-team-protocol-claim-versions-early)
- [Example 62: Exclusive Locks Guard DDL](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/advanced#example-62-exclusive-locks-guard-ddl)
- [Example 63: Advisory Locks Serialize Migrations](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/advanced#example-63-advisory-locks-serialize-migrations)
- [Example 64: Lock Only the Table You Change](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/advanced#example-64-lock-only-the-table-you-change)
- [Example 65: Concurrent Index Builds Skip Locks](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/advanced#example-65-concurrent-index-builds-skip-locks)
- [Example 66: Lock Timeouts Fail Fast](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/advanced#example-66-lock-timeouts-fail-fast)
- [Example 67: Short Migrations Shrink the Lock Window](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/advanced#example-67-short-migrations-shrink-the-lock-window)
- [Example 68: Reads Continue Under Shared Locks](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/advanced#example-68-reads-continue-under-shared-locks)
- [Example 69: One Migration, One Lock, One Transaction](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/advanced#example-69-one-migration-one-lock-one-transaction)
- [Example 70: Audit Locks from pg_locks](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/advanced#example-70-audit-locks-from-pg_locks)
- [Example 71: A Failed Migration Rolls Back Whole](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/advanced#example-71-a-failed-migration-rolls-back-whole)
- [Example 72: Partial Migrations Without Transactions](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/advanced#example-72-partial-migrations-without-transactions)
- [Example 73: Repair Completes a Partial Run](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/advanced#example-73-repair-completes-a-partial-run)
- [Example 74: Read the History Table First](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/advanced#example-74-read-the-history-table-first)
- [Example 75: Missing Files Break Validation](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/advanced#example-75-missing-files-break-validation)
- [Example 76: Diagnose from SQLSTATE, Not Hunches](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/advanced#example-76-diagnose-from-sqlstate-not-hunches)
- [Example 77: Test Every Migration with a Check](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/advanced#example-77-test-every-migration-with-a-check)
- [Example 78: The Final Ledger: Order, Verify, Trust](/en/learn/courses/database-migrations-with-java-and-spring-data-jpa/learning/advanced#example-78-the-final-ledger-order-verify-trust)
