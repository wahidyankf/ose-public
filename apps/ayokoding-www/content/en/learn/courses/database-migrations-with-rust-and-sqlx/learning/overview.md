---
title: Overview
date: 2026-10-22T00:00:00+07:00
draft: false
weight: 1
---

Seventy-eight worked examples in three levels, each a complete Rust program against real PostgreSQL. Beginner builds the core loop: files, order, history, rollback. Intermediate handles live data and live traffic: backfills, zero-downtime splits, baselines. Advanced handles teams and failures: conflicts, locking, diagnosis.

## How to read these pages

Each entry follows one shape: a brief, a short explanation, the concept refs, an optional diagram, the complete unit files as anchored fences, the golden output, a takeaway, and a why-it-matters note. Run any example with the command in its `run.yaml`; the harness compares stdout to the golden file.

## Course map

- Beginner (Examples 1–25): versioned files that create and alter tables (1–8), the history table and ordering rules (9–17), rollback as reversible pairs and forward fixes (18–25).
- Intermediate (Examples 26–53): backfills that preserve rows (26–34), zero-downtime splits without maintenance windows (35–44), baselines that import legacy databases (45–53).
- Advanced (Examples 54–78): version conflicts across branches (54–61), locking under concurrency (62–70), diagnosis of failed, edited, and drifted histories (71–78).

## Examples by Level

### Beginner (Examples 1–25)

- [Example 1: Create Your First Table](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/beginner#example-1-create-your-first-table)
- [Example 2: Add a Column with Alter](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/beginner#example-2-add-a-column-with-alter)
- [Example 3: Migrations Run Once](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/beginner#example-3-migrations-run-once)
- [Example 4: History Table Records Every Run](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/beginner#example-4-history-table-records-every-run)
- [Example 5: Version Numbers Order Execution](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/beginner#example-5-version-numbers-order-execution)
- [Example 6: Descriptions Document Intent](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/beginner#example-6-descriptions-document-intent)
- [Example 7: Alter Safely Keeps Data](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/beginner#example-7-alter-safely-keeps-data)
- [Example 8: One Migration One Change](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/beginner#example-8-one-migration-one-change)
- [Example 9: History Table Is the Source of Truth](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/beginner#example-9-history-table-is-the-source-of-truth)
- [Example 10: Linear History Stays Mergeable](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/beginner#example-10-linear-history-stays-mergeable)
- [Example 11: Late File Joins the Line](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/beginner#example-11-late-file-joins-the-line)
- [Example 12: Gaps in Versions Still Apply](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/beginner#example-12-gaps-in-versions-still-apply)
- [Example 13: Edited Migration Fails Validation](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/beginner#example-13-edited-migration-fails-validation)
- [Example 14: Checksums Guard Every Row](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/beginner#example-14-checksums-guard-every-row)
- [Example 15: Validate After Migrate Seals the Pipeline](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/beginner#example-15-validate-after-migrate-seals-the-pipeline)
- [Example 16: Pending Work Shows Before It Runs](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/beginner#example-16-pending-work-shows-before-it-runs)
- [Example 17: Success Flag Marks Each Entry](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/beginner#example-17-success-flag-marks-each-entry)
- [Example 18: Reverse with a Down Migration](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/beginner#example-18-reverse-with-a-down-migration)
- [Example 19: Rollback Means a Forward Fix](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/beginner#example-19-rollback-means-a-forward-fix)
- [Example 20: Failed Migration Leaves Earlier Work Intact](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/beginner#example-20-failed-migration-leaves-earlier-work-intact)
- [Example 21: Partial Statements Roll Back Together](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/beginner#example-21-partial-statements-roll-back-together)
- [Example 22: Two Tables or None](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/beginner#example-22-two-tables-or-none)
- [Example 23: Undo Forgets the History Row](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/beginner#example-23-undo-forgets-the-history-row)
- [Example 24: Rollback Plan for a Bad Deploy](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/beginner#example-24-rollback-plan-for-a-bad-deploy)
- [Example 25: Beginner Review: Order, History, Rollback](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/beginner#example-25-beginner-review-order-history-rollback)

### Intermediate (Examples 26–53)

- [Example 26: Separate Data from Schema](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/intermediate#example-26-separate-data-from-schema)
- [Example 27: Backfill Fills a New Column](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/intermediate#example-27-backfill-fills-a-new-column)
- [Example 28: Backfill in Batches](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/intermediate#example-28-backfill-in-batches)
- [Example 29: Backfill with a CASE Expression](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/intermediate#example-29-backfill-with-a-case-expression)
- [Example 30: Backfill Before Adding NOT NULL](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/intermediate#example-30-backfill-before-adding-not-null)
- [Example 31: Defaults Beat Null Backfills](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/intermediate#example-31-defaults-beat-null-backfills)
- [Example 32: Idempotent Backfill Uses WHERE](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/intermediate#example-32-idempotent-backfill-uses-where)
- [Example 33: Backfill a Lookup Table](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/intermediate#example-33-backfill-a-lookup-table)
- [Example 34: Verify Backfill with a Check Query](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/intermediate#example-34-verify-backfill-with-a-check-query)
- [Example 35: Expand Before You Contract](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/intermediate#example-35-expand-before-you-contract)
- [Example 36: Readers Move to the New Column](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/intermediate#example-36-readers-move-to-the-new-column)
- [Example 37: Rename Without Downtime in Three Steps](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/intermediate#example-37-rename-without-downtime-in-three-steps)
- [Example 38: Drop the Old Column Last](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/intermediate#example-38-drop-the-old-column-last)
- [Example 39: Index New Columns Before Cutover](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/intermediate#example-39-index-new-columns-before-cutover)
- [Example 40: NOT NULL Arrives in a Later Release](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/intermediate#example-40-not-null-arrives-in-a-later-release)
- [Example 41: Split a Table Without Downtime](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/intermediate#example-41-split-a-table-without-downtime)
- [Example 42: Compatibility Views Bridge Old Code](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/intermediate#example-42-compatibility-views-bridge-old-code)
- [Example 43: Feature Flag Column Guards Rollout](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/intermediate#example-43-feature-flag-column-guards-rollout)
- [Example 44: Contract Only After Readers Move](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/intermediate#example-44-contract-only-after-readers-move)
- [Example 45: Baseline an Existing Database](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/intermediate#example-45-baseline-an-existing-database)
- [Example 46: Baseline Version Marks the Floor](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/intermediate#example-46-baseline-version-marks-the-floor)
- [Example 47: Baseline for Fresh Clones](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/intermediate#example-47-baseline-for-fresh-clones)
- [Example 48: Baseline Description Documents Import](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/intermediate#example-48-baseline-description-documents-import)
- [Example 49: Baselining Twice Stays Safe](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/intermediate#example-49-baselining-twice-stays-safe)
- [Example 50: Baseline Then Validate](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/intermediate#example-50-baseline-then-validate)
- [Example 51: Existing Data Survives Baselining](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/intermediate#example-51-existing-data-survives-baselining)
- [Example 52: Baseline a Multi-Table Database](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/intermediate#example-52-baseline-a-multi-table-database)
- [Example 53: From Baseline to Green Pipeline](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/intermediate#example-53-from-baseline-to-green-pipeline)

### Advanced (Examples 54–78)

- [Example 54: Two Branches, One Version Number](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/advanced#example-54-two-branches-one-version-number)
- [Example 55: Merge by Renumbering Forward](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/advanced#example-55-merge-by-renumbering-forward)
- [Example 56: Hotfix Arrives After the Release](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/advanced#example-56-hotfix-arrives-after-the-release)
- [Example 57: Checksum Stability Across Runs](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/advanced#example-57-checksum-stability-across-runs)
- [Example 58: Pending Review Gate](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/advanced#example-58-pending-review-gate)
- [Example 59: Seed Outside the Migrator](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/advanced#example-59-seed-outside-the-migrator)
- [Example 60: Resolve a Failed Branch Migration](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/advanced#example-60-resolve-a-failed-branch-migration)
- [Example 61: Team Workflow: Validate Then Migrate](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/advanced#example-61-team-workflow-validate-then-migrate)
- [Example 62: One Lock Serializes Two Migrators](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/advanced#example-62-one-lock-serializes-two-migrators)
- [Example 63: Three Racers Still Apply Once](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/advanced#example-63-three-racers-still-apply-once)
- [Example 64: Failed Migration Releases the Lock](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/advanced#example-64-failed-migration-releases-the-lock)
- [Example 65: Row Locks Stay Narrow](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/advanced#example-65-row-locks-stay-narrow)
- [Example 66: Small Migrations Shrink the Blast Radius](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/advanced#example-66-small-migrations-shrink-the-blast-radius)
- [Example 67: Lock Frees After Migrate](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/advanced#example-67-lock-frees-after-migrate)
- [Example 68: History Table Is the Lock Ledger](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/advanced#example-68-history-table-is-the-lock-ledger)
- [Example 69: Backfill Under the Lock](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/advanced#example-69-backfill-under-the-lock)
- [Example 70: Locking Review: Race, Repair, Record](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/advanced#example-70-locking-review-race-repair-record)
- [Example 71: Read the History Table First](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/advanced#example-71-read-the-history-table-first)
- [Example 72: Spot a Failed Migration](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/advanced#example-72-spot-a-failed-migration)
- [Example 73: Drift: Table Changed Outside sqlx](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/advanced#example-73-drift-table-changed-outside-sqlx)
- [Example 74: Detect Drift with a Check Query](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/advanced#example-74-detect-drift-with-a-check-query)
- [Example 75: Partial Migration Leaves a Marker](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/advanced#example-75-partial-migration-leaves-a-marker)
- [Example 76: Repair After Fixing the Cause](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/advanced#example-76-repair-after-fixing-the-cause)
- [Example 77: Missing Files Escape Validation](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/advanced#example-77-missing-files-escape-validation)
- [Example 78: Diagnose Like a Checklist](/en/learn/courses/database-migrations-with-rust-and-sqlx/learning/advanced#example-78-diagnose-like-a-checklist)
