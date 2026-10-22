---
title: Overview
date: 2026-10-22T00:00:00+07:00
draft: false
weight: 1
---

Prerequisites for this course: [just-enough-java](/en/learn/courses/just-enough-java/learning/overview) for Java's basic syntax, which every example here assumes you can already read; and [sql-essentials](/en/learn/courses/sql-essentials/learning/overview) for basic SQL DDL (CREATE and ALTER TABLE), which every migration here builds on. Assumed knowledge: comfort creating and altering tables in SQL.

## Why this exists -- the big idea

**The problem before the solution**: `data-access-orms-and-query-builders` teaches ORM and query-builder concepts generically; nobody teaches Liquibase's own migration-ordering, rollback, and team-workflow model in Java at the depth production databases demand. Shared SQL scripts applied by hand drift, collide, and resist rollback.

**Keep this if you forget everything else**: A migration that cannot be rolled back safely is a migration that will eventually be run in production by accident.

## How this course is organized

Beginner (Examples 1–25) writes first migrations, reads the history tables Liquibase keeps, and practices rollback until it is boring. Intermediate (Examples 26–53) moves data as well as schema, splits breaking changes into zero-downtime steps, and adopts databases that predate Liquibase. Advanced (Examples 54–78) resolves the conflicts parallel teams create, contains locking migrations, and diagnoses failed or partial runs from the history tables. Every example runs for real: Java driving Liquibase against the pinned PostgreSQL 18 service container, with the golden output recorded beside the program.

## Examples by Level

### Beginner (Examples 1–25)

- [Example 1: Run Your First Changelog](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/beginner#example-1-run-your-first-changelog)
- [Example 2: A Master Changelog Includes the Rest](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/beginner#example-2-a-master-changelog-includes-the-rest)
- [Example 3: Author and ID Name Every Changeset](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/beginner#example-3-author-and-id-name-every-changeset)
- [Example 4: createTable Declares Tables in YAML](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/beginner#example-4-createtable-declares-tables-in-yaml)
- [Example 5: addColumn Extends a Live Table](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/beginner#example-5-addcolumn-extends-a-live-table)
- [Example 6: Constraints Guard New Columns](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/beginner#example-6-constraints-guard-new-columns)
- [Example 7: Indexes Speed the New Query Path](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/beginner#example-7-indexes-speed-the-new-query-path)
- [Example 8: Foreign Keys Link Two Tables](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/beginner#example-8-foreign-keys-link-two-tables)
- [Example 9: DATABASECHANGELOG Records Every Run](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/beginner#example-9-databasechangelog-records-every-run)
- [Example 10: Reruns Are No-Ops](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/beginner#example-10-reruns-are-no-ops)
- [Example 11: Checksums Catch Edited History](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/beginner#example-11-checksums-catch-edited-history)
- [Example 12: Numeric Prefixes Order Changelogs](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/beginner#example-12-numeric-prefixes-order-changelogs)
- [Example 13: Contexts Gate Environment Changes](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/beginner#example-13-contexts-gate-environment-changes)
- [Example 14: Labels Select Change Subsets](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/beginner#example-14-labels-select-change-subsets)
- [Example 15: Preconditions Guard the Starting State](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/beginner#example-15-preconditions-guard-the-starting-state)
- [Example 16: Parameters Parametrize One Changelog](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/beginner#example-16-parameters-parametrize-one-changelog)
- [Example 17: Status Previews Pending Changes](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/beginner#example-17-status-previews-pending-changes)
- [Example 18: Roll Back One Changeset](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/beginner#example-18-roll-back-one-changeset)
- [Example 19: Roll Back to a Tag](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/beginner#example-19-roll-back-to-a-tag)
- [Example 20: Tags Mark Release Points](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/beginner#example-20-tags-mark-release-points)
- [Example 21: Rollback Blocks Undo Raw SQL](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/beginner#example-21-rollback-blocks-undo-raw-sql)
- [Example 22: Data Rollbacks Restore Rows](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/beginner#example-22-data-rollbacks-restore-rows)
- [Example 23: Rollbacks Without a Plan Fail Loudly](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/beginner#example-23-rollbacks-without-a-plan-fail-loudly)
- [Example 24: Count-Based Rollbacks Span Files](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/beginner#example-24-count-based-rollbacks-span-files)
- [Example 25: Validate Catches Errors Before Update](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/beginner#example-25-validate-catches-errors-before-update)

### Intermediate (Examples 26–53)

- [Example 26: Inserts Seed Reference Data](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/intermediate#example-26-inserts-seed-reference-data)
- [Example 27: Updates Backfill a New Column](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/intermediate#example-27-updates-backfill-a-new-column)
- [Example 28: loadData Imports a CSV Fixture](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/intermediate#example-28-loaddata-imports-a-csv-fixture)
- [Example 29: Batched Updates Migrate Large Tables](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/intermediate#example-29-batched-updates-migrate-large-tables)
- [Example 30: Schema First, Backfill Second](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/intermediate#example-30-schema-first-backfill-second)
- [Example 31: Deletes Remove Retired Rows](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/intermediate#example-31-deletes-remove-retired-rows)
- [Example 32: Default Values Fill Old Rows](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/intermediate#example-32-default-values-fill-old-rows)
- [Example 33: Data Rollback Strategies Compared](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/intermediate#example-33-data-rollback-strategies-compared)
- [Example 34: Verification Queries Prove Backfills](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/intermediate#example-34-verification-queries-prove-backfills)
- [Example 35: Expand First by Adding the Column](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/intermediate#example-35-expand-first-by-adding-the-column)
- [Example 36: Dual Writes Bridge Old and New](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/intermediate#example-36-dual-writes-bridge-old-and-new)
- [Example 37: Contract Last by Dropping the Column](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/intermediate#example-37-contract-last-by-dropping-the-column)
- [Example 38: Rename Columns Across Three Releases](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/intermediate#example-38-rename-columns-across-three-releases)
- [Example 39: Rename Tables Without Breaking Reads](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/intermediate#example-39-rename-tables-without-breaking-reads)
- [Example 40: Validate Constraints Without Locking Writes](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/intermediate#example-40-validate-constraints-without-locking-writes)
- [Example 41: Create Indexes Concurrently](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/intermediate#example-41-create-indexes-concurrently)
- [Example 42: Split a Table Across Deploys](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/intermediate#example-42-split-a-table-across-deploys)
- [Example 43: Feature Flags Gate the New Path](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/intermediate#example-43-feature-flags-gate-the-new-path)
- [Example 44: Blue-Green Needs Compatible Migrations](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/intermediate#example-44-blue-green-needs-compatible-migrations)
- [Example 45: changeLogSync Baselines Without Running](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/intermediate#example-45-changelogsync-baselines-without-running)
- [Example 46: generateChangeLog Captures the Real Schema](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/intermediate#example-46-generatechangelog-captures-the-real-schema)
- [Example 47: Diffs Find Drift from the Changelog](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/intermediate#example-47-diffs-find-drift-from-the-changelog)
- [Example 48: diffChangeLog Turns Drift into Changesets](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/intermediate#example-48-diffchangelog-turns-drift-into-changesets)
- [Example 49: Reconcile Drift Before the Next Release](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/intermediate#example-49-reconcile-drift-before-the-next-release)
- [Example 50: Separate Schemas Isolate Tenants](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/intermediate#example-50-separate-schemas-isolate-tenants)
- [Example 51: JSONB Columns Evolve Flexible Data](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/intermediate#example-51-jsonb-columns-evolve-flexible-data)
- [Example 52: Views Version the Read Contract](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/intermediate#example-52-views-version-the-read-contract)
- [Example 53: Squash Old Migrations into One Baseline](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/intermediate#example-53-squash-old-migrations-into-one-baseline)

### Advanced (Examples 54–78)

- [Example 54: Two Branches Add Conflicting Changesets](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/advanced#example-54-two-branches-add-conflicting-changesets)
- [Example 55: Merged Histories Keep One Order](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/advanced#example-55-merged-histories-keep-one-order)
- [Example 56: Checksum Conflicts Expose Edited Migrations](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/advanced#example-56-checksum-conflicts-expose-edited-migrations)
- [Example 57: Reorder by Adding, Never by Editing](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/advanced#example-57-reorder-by-adding-never-by-editing)
- [Example 58: Parallel Teams Prefix Their IDs](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/advanced#example-58-parallel-teams-prefix-their-ids)
- [Example 59: Resolve a Duplicate Table Across Branches](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/advanced#example-59-resolve-a-duplicate-table-across-branches)
- [Example 60: Promotion Runs the Same Order Everywhere](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/advanced#example-60-promotion-runs-the-same-order-everywhere)
- [Example 61: Review Diffs Before Merging Migrations](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/advanced#example-61-review-diffs-before-merging-migrations)
- [Example 62: DATABASECHANGELOGLOCK Serializes Runners](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/advanced#example-62-databasechangeloglock-serializes-runners)
- [Example 63: Stuck Locks Release Safely](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/advanced#example-63-stuck-locks-release-safely)
- [Example 64: Short Migrations Shrink the Lock Window](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/advanced#example-64-short-migrations-shrink-the-lock-window)
- [Example 65: Transactions Wrap Migrations That Allow It](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/advanced#example-65-transactions-wrap-migrations-that-allow-it)
- [Example 66: Some Changes Commit Step by Step](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/advanced#example-66-some-changes-commit-step-by-step)
- [Example 67: Lock Timeouts Fail Fast in CI](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/advanced#example-67-lock-timeouts-fail-fast-in-ci)
- [Example 68: Audit Tables Record Who Migrated What](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/advanced#example-68-audit-tables-record-who-migrated-what)
- [Example 69: Time Each Changeset to Find Slow Ones](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/advanced#example-69-time-each-changeset-to-find-slow-ones)
- [Example 70: Pipelines Run Update Then Test](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/advanced#example-70-pipelines-run-update-then-test)
- [Example 71: Read the History After a Failure](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/advanced#example-71-read-the-history-after-a-failure)
- [Example 72: Checksums Name the Edited Migration](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/advanced#example-72-checksums-name-the-edited-migration)
- [Example 73: Clear Checksums After a Deliberate Rewrite](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/advanced#example-73-clear-checksums-after-a-deliberate-rewrite)
- [Example 74: Mark a Hand-Applied Fix as Ran](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/advanced#example-74-mark-a-hand-applied-fix-as-ran)
- [Example 75: Test Rollbacks in a Scratch Database](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/advanced#example-75-test-rollbacks-in-a-scratch-database)
- [Example 76: History Lists the Applied Order](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/advanced#example-76-history-lists-the-applied-order)
- [Example 77: Drop All Resets a Dev Database](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/advanced#example-77-drop-all-resets-a-dev-database)
- [Example 78: Checklist Before a Production Update](/en/learn/courses/database-migrations-with-java-and-liquibase/learning/advanced#example-78-checklist-before-a-production-update)

---
