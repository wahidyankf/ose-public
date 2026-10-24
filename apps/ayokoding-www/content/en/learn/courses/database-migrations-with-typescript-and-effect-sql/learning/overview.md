---
title: Overview
date: 2026-10-23T00:00:00+07:00
draft: false
weight: 1
---

Seventy-eight worked examples in three levels, each a complete TypeScript program against real PostgreSQL. Beginner builds the core loop: files, order, history, rollback. Intermediate handles live data and live traffic: backfills, zero-downtime splits, baselines. Advanced handles teams and failures: conflicts, locking, diagnosis.

## How to read these pages

Each entry follows one shape: two short paragraphs, the concept refs, an optional diagram, the complete unit files as anchored fences, the golden output, and the concept line. Run any example with the command in its `run.yaml`; the harness compares stdout to the golden file.

## Course map

- Beginner (Examples 1–25): versioned files that create and alter tables (1–8), the history table and ordering rules (9–17), rollback as compensations and forward fixes (18–25).
- Intermediate (Examples 26–53): backfills that preserve rows (26–34), zero-downtime splits without maintenance windows (35–44), baselines that import legacy databases (45–53).
- Advanced (Examples 54–78): version conflicts across branches (54–61), locking under concurrency (62–70), diagnosis of failed, edited, and drifted histories (71–78).

## Examples by Level

### Beginner (Examples 1–25)

- [Example 1: Create Your First Table](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/beginner#example-1-create-your-first-table)
- [Example 2: Migration Files Run in Order](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/beginner#example-2-migration-files-run-in-order)
- [Example 3: One Migration, One Change](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/beginner#example-3-one-migration-one-change)
- [Example 4: Alter Safely Keeps Data](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/beginner#example-4-alter-safely-keeps-data)
- [Example 5: Migrations Run Once](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/beginner#example-5-migrations-run-once)
- [Example 6: Version Numbers Order Execution](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/beginner#example-6-version-numbers-order-execution)
- [Example 7: Descriptions Document Intent](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/beginner#example-7-descriptions-document-intent)
- [Example 8: Create an Index Alongside the Table](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/beginner#example-8-create-an-index-alongside-the-table)
- [Example 9: The History Table Is the Source of Truth](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/beginner#example-9-the-history-table-is-the-source-of-truth)
- [Example 10: Linear History Stays Mergeable](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/beginner#example-10-linear-history-stays-mergeable)
- [Example 11: Read the Latest Migration](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/beginner#example-11-read-the-latest-migration)
- [Example 12: Out-of-Order Keys Still Sort](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/beginner#example-12-out-of-order-keys-still-sort)
- [Example 13: Gaps Are Allowed](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/beginner#example-13-gaps-are-allowed)
- [Example 14: History Records Names, Not Hashes](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/beginner#example-14-history-records-names-not-hashes)
- [Example 15: Applied Equals Assembled](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/beginner#example-15-applied-equals-assembled)
- [Example 16: The Table Option Isolates Histories](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/beginner#example-16-the-table-option-isolates-histories)
- [Example 17: Two Loaders, One Table](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/beginner#example-17-two-loaders-one-table)
- [Example 18: Rollback Is a Migration Too](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/beginner#example-18-rollback-is-a-migration-too)
- [Example 19: Reverse by Re-Adding, Not by Undo](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/beginner#example-19-reverse-by-re-adding-not-by-undo)
- [Example 20: Manual Reversal Leaves History Behind](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/beginner#example-20-manual-reversal-leaves-history-behind)
- [Example 21: Rollback Keeps Unrelated Data](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/beginner#example-21-rollback-keeps-unrelated-data)
- [Example 22: Forward Fix Beats Rewrite](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/beginner#example-22-forward-fix-beats-rewrite)
- [Example 23: Rollback One of Many](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/beginner#example-23-rollback-one-of-many)
- [Example 24: Compensations Run in Reverse](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/beginner#example-24-compensations-run-in-reverse)
- [Example 25: Check Before You Reverse](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/beginner#example-25-check-before-you-reverse)

### Intermediate (Examples 26–53)

- [Example 26: Schema First, Data Second](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/intermediate#example-26-schema-first-data-second)
- [Example 27: Backfill Computes from Existing Rows](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/intermediate#example-27-backfill-computes-from-existing-rows)
- [Example 28: Backfill in Batches](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/intermediate#example-28-backfill-in-batches)
- [Example 29: Guarded Backfill Touches Nothing Twice](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/intermediate#example-29-guarded-backfill-touches-nothing-twice)
- [Example 30: Verify After Backfill](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/intermediate#example-30-verify-after-backfill)
- [Example 31: Non-Null After Backfill](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/intermediate#example-31-non-null-after-backfill)
- [Example 32: Backfill Default for New Rows](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/intermediate#example-32-backfill-default-for-new-rows)
- [Example 33: Data-Only Migration Adds Seed Rows](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/intermediate#example-33-data-only-migration-adds-seed-rows)
- [Example 34: Backfill Rollback Restores Nulls](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/intermediate#example-34-backfill-rollback-restores-nulls)
- [Example 35: Expand First, Contract Later](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/intermediate#example-35-expand-first-contract-later)
- [Example 36: Dual-Write Window](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/intermediate#example-36-dual-write-window)
- [Example 37: Read from Either Column](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/intermediate#example-37-read-from-either-column)
- [Example 38: Contract Drops the Old Column](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/intermediate#example-38-contract-drops-the-old-column)
- [Example 39: Zero-Downtime Rename, Full Loop](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/intermediate#example-39-zero-downtime-rename-full-loop)
- [Example 40: Add a Table Without Touching Old](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/intermediate#example-40-add-a-table-without-touching-old)
- [Example 41: Add the Check as Not Valid](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/intermediate#example-41-add-the-check-as-not-valid)
- [Example 42: Validate the Check Later](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/intermediate#example-42-validate-the-check-later)
- [Example 43: Default Without Rewrite](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/intermediate#example-43-default-without-rewrite)
- [Example 44: Split a Breaking Change into Three](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/intermediate#example-44-split-a-breaking-change-into-three)
- [Example 45: Baseline Marks the Starting Point](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/intermediate#example-45-baseline-marks-the-starting-point)
- [Example 46: Baseline Skips Ancient History](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/intermediate#example-46-baseline-skips-ancient-history)
- [Example 47: Baseline with Real DDL First](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/intermediate#example-47-baseline-with-real-ddl-first)
- [Example 48: Baseline Never Replays](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/intermediate#example-48-baseline-never-replays)
- [Example 49: Baseline Names the Snapshot](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/intermediate#example-49-baseline-names-the-snapshot)
- [Example 50: Two Tables, One Baseline](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/intermediate#example-50-two-tables-one-baseline)
- [Example 51: Baseline, Then Backfill](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/intermediate#example-51-baseline-then-backfill)
- [Example 52: Baseline a View](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/intermediate#example-52-baseline-a-view)
- [Example 53: Baseline Checklist](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/intermediate#example-53-baseline-checklist)

### Advanced (Examples 54–78)

- [Example 54: Branches Add Migrations in Parallel](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/advanced#example-54-branches-add-migrations-in-parallel)
- [Example 55: Renumber Forward, Never Rewrite](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/advanced#example-55-renumber-forward-never-rewrite)
- [Example 56: Merge Applies Both Branches](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/advanced#example-56-merge-applies-both-branches)
- [Example 57: Same Id, Different Content Is a Conflict](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/advanced#example-57-same-id-different-content-is-a-conflict)
- [Example 58: Late Arrivals Still Apply in Order](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/advanced#example-58-late-arrivals-still-apply-in-order)
- [Example 59: History Is the Merge Result](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/advanced#example-59-history-is-the-merge-result)
- [Example 60: Never Edit Applied Migrations](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/advanced#example-60-never-edit-applied-migrations)
- [Example 61: Promote the Same Set Across Environments](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/advanced#example-61-promote-the-same-set-across-environments)
- [Example 62: DDL Takes a Lock](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/advanced#example-62-ddl-takes-a-lock)
- [Example 63: Second Migrator Stands Down](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/advanced#example-63-second-migrator-stands-down)
- [Example 64: Keep Migrations Small](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/advanced#example-64-keep-migrations-small)
- [Example 65: Read Your Writes in One Transaction](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/advanced#example-65-read-your-writes-in-one-transaction)
- [Example 66: Two Statements Share One Transaction](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/advanced#example-66-two-statements-share-one-transaction)
- [Example 67: Blast Radius Is What You Change](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/advanced#example-67-blast-radius-is-what-you-change)
- [Example 68: Locks Release on Commit](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/advanced#example-68-locks-release-on-commit)
- [Example 69: Failure Releases Its Locks](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/advanced#example-69-failure-releases-its-locks)
- [Example 70: Promote Dev, Then Prod](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/advanced#example-70-promote-dev-then-prod)
- [Example 71: Failing Migration Dies Loud](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/advanced#example-71-failing-migration-dies-loud)
- [Example 72: Duplicate Ids Are Rejected](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/advanced#example-72-duplicate-ids-are-rejected)
- [Example 73: Read the History First](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/advanced#example-73-read-the-history-first)
- [Example 74: Compare History to the Catalog](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/advanced#example-74-compare-history-to-the-catalog)
- [Example 75: Missing Table Means Drift](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/advanced#example-75-missing-table-means-drift)
- [Example 76: Diagnose a Partial Migration from History](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/advanced#example-76-diagnose-a-partial-migration-from-history)
- [Example 77: Checksum Guard You Build Yourself](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/advanced#example-77-checksum-guard-you-build-yourself)
- [Example 78: Final Review: Full Loop to Production](/en/learn/courses/database-migrations-with-typescript-and-effect-sql/learning/advanced#example-78-final-review-full-loop-to-production)
