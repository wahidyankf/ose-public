---
name: evolving-database-schemas
description: >-
  Guides changing a stored schema without breaking a running version: expand, migrate, verify, then contract, each step
  shipped and proven before the next, with migrations explicit and reversible until the contract.
when_to_use: >-
  Use when designing or writing a change that adds, renames, splits, or removes a column, table, index, or constraint,
  or that backfills stored data.
compatibility: Requires read access to the schema, its migrations, and the code that reads and writes the store.
---

# Evolving Database Schemas

The standards own the rules.
[Release Cutover](https://github.com/wahidyankf/ose-rules/blob/18760a44f7ae4d88e89c0aa79349297f55bb9d9c/repo-governance/development/quality/delivery/live-service-continuity/002-release-cutover.md)
requires migrations to be explicit, never run at startup, and a release that carries one to wait for an expand, migrate,
and verify sequence that keeps the previous version able to read.
[Test-Driven Development](../../../repo-governance/development/workflow/test-driven-development.md) governs the
tests each step adds. This skill covers the judgement of sequencing a schema change so that both the old and the new
version of the code keep working at every moment.

## Two Versions Run at Once

During any rollout the previous version and the new one read and write the same store, and a rollback brings the
previous version back. A schema change is safe only when every version that can be running at that moment understands
the store. Renaming a column in one step breaks whichever version expects the other name.

## Expand, Migrate, Verify, Contract

1. **Expand.** Add the new shape beside the old: a new nullable column, a new table, a new index built without blocking
   writes. Nothing reads it yet, and the previous version ignores it. This release is safe to roll back.
2. **Migrate.** Ship code that writes both shapes, then backfill existing rows in bounded, idempotent batches that can
   stop and resume. Reads still come from the old shape.
3. **Verify.** Prove the shapes agree with a deterministic check, such as matching counts or a query that finds no row
   where they differ, then switch reads to the new shape in its own release.
4. **Contract.** Only once no running or rollback-eligible version reads the old shape, remove it in a later release.
   This is the one step that cannot be rolled back, so it waits until the verification has held through a release.

Each step is its own release, and each is proven before the next begins. Collapsing two steps into one release removes
the point at which the previous version could still run.

## Make Each Migration Explicit and Testable

A migration is a named, ordered, checked-in artifact the release declares, run by a deliberate command, never as a side
effect of a process starting. Test it test-first against a copy of the schema at the version it starts from: the
migration fails before it exists and passes after, and a second run changes nothing. A data backfill also gets a test
that its result matches the verification query.

## Constraints Come Last

A new not-null, unique, or foreign-key constraint is added only after the data already satisfies it, and is validated
separately from being declared where the store allows, so adding it does not lock the table while it scans.

## Before Calling It Ready

- the change is split into expand, migrate, verify, and contract releases, each named;
- every running and rollback-eligible version understands the store at each step;
- every migration is explicit, ordered, tested from its starting schema, and safe to run twice;
- the verification is a command with an expected result, not an inspection; and
- the contract step waits until no version that reads the old shape can run again.
