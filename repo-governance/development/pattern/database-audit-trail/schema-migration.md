---
description: "Requirements every migration must satisfy, plus the F#/DbUp versioned-SQL-script pattern for applying audit columns."
when_to_use: "Use when writing a DbUp migration script that must include the six audit columns correctly."
---

# Schema Migration

Every backend applies the six audit columns through its migration tool. The canonical column definitions are identical regardless of tool — only the migration file format differs.

Regardless of the tool used, migrations must satisfy:

- All six audit columns present in every table, in the order listed above
- `created_at` and `updated_at` use timezone-aware timestamps (`TIMESTAMPTZ` for PostgreSQL, equivalent for other databases)
- `created_by` and `updated_by` default to `'system'` so raw migrations and background jobs produce a traceable actor
- `deleted_at` and `deleted_by` are nullable with no default — `NULL` is the active-row state
- Each migration is reversible (rollback support where the tool provides it)

## Migrations Take the Next Free Number

A new migration takes the next free number on current main. Read the app's migration directory after fetching main, and
take one above the highest number there. Followed: the number is one above the highest number on main. Violated: the
number is already used on main, or is more than one above that highest.

Enforcement: unenforced by decision. A check would compare the change with main and read the migration directory. This
repository declares no such gate and ships no executor for it, and a declared gate without an executor would fail or
never run.

Adopted by explicit copy from [ose-rules](https://github.com/wahidyankf/ose-rules) at catalog head
`81982e20c798d8af6dbb85ae446d39d0432b6362`, from its
[Migration Numbers Are Taken at Use](https://github.com/wahidyankf/ose-rules/blob/81982e20c798d8af6dbb85ae446d39d0432b6362/repo-governance/development/quality/delivery/live-service-continuity/002-release-cutover.md#migration-numbers-are-taken-at-use)
section, obligation 1.

## A Taken or Gapped Number Is Replaced

A migration whose documented number is taken on main, or would leave a gap, takes the next free number, and every stale
reference to the old number is updated in the same change. Followed: the migration takes the next free number, and no
reference in the change names the old one. Violated: the migration keeps a taken number or leaves a gap, or a reference
still names the old number.

Enforcement: unenforced by decision, for the same reason as the rule above: no declared gate or executor compares a
migration number with main.

Adopted by explicit copy from [ose-rules](https://github.com/wahidyankf/ose-rules) at catalog head
`81982e20c798d8af6dbb85ae446d39d0432b6362`, from its
[Migration Numbers Are Taken at Use](https://github.com/wahidyankf/ose-rules/blob/81982e20c798d8af6dbb85ae446d39d0432b6362/repo-governance/development/quality/delivery/live-service-continuity/002-release-cutover.md#migration-numbers-are-taken-at-use)
section, obligation 2.

## Applied Migrations Are Never Renamed

An applied or merged migration's file name is never changed, and it is never renumbered. The file name is the migration's
identity in the journal, so renaming an applied script makes the journal treat it as new and run it again.

Followed: the file name of an applied or merged migration is unchanged in the change. Violated: a change renames or
renumbers such a script.

Enforcement: unenforced by decision. A check would compare the change with the main branch and read the migration
directory. This repository declares no such gate and ships no executor for it, and a declared gate without an executor
would fail or never run.

Adopted by explicit copy from [ose-rules](https://github.com/wahidyankf/ose-rules) at catalog head
`81982e20c798d8af6dbb85ae446d39d0432b6362`, from its
[Migration Numbers Are Taken at Use](https://github.com/wahidyankf/ose-rules/blob/81982e20c798d8af6dbb85ae446d39d0432b6362/repo-governance/development/quality/delivery/live-service-continuity/002-release-cutover.md#migration-numbers-are-taken-at-use)
section, obligation 3.

## F# / DbUp: versioned SQL scripts

Use plain `.sql` files under `Migrations/`. DbUp discovers and applies them in filename order at startup — no compilation step required.

The following example shows the `members` table as the reference implementation. Apply the same pattern to every new table.

```sql
-- Migrations/003-create-members.sql
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  name TEXT NOT NULL,
  -- audit columns
  created_at TIMESTAMPTZ NOT NULL DEFAULT now (),
  created_by VARCHAR(255) NOT NULL DEFAULT 'system',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now (),
  updated_by VARCHAR(255) NOT NULL DEFAULT 'system',
  deleted_at TIMESTAMPTZ,
  deleted_by VARCHAR(255)
);
```

Key points:

- Migration files are named `{NNN}-{description}.sql`, where `NNN` is a zero-padded number taken as in
  [Migrations Take the Next Free Number](#migrations-take-the-next-free-number), so DbUp applies them in deterministic order.
- `DEFAULT now()` provides a safe fallback for raw SQL inserts (migrations, seeds, background jobs).
- `created_by` and `updated_by` default to `'system'` so background jobs produce a traceable actor without caller intervention.
- `deleted_at` and `deleted_by` are nullable with no default — `NULL` is the active-row state.
- DbUp does not support rollback scripts; design migrations to be additive and forward-only.
