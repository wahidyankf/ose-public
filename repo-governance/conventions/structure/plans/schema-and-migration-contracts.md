---
description: Defines the data-model, compatibility, migration, recovery, and proof required for schema-changing plans.
when_to_use: Use when a formal plan adds, removes, renames, retypes, or reinterprets persisted data.
---

# Schema and Migration Contracts

## Purpose

Schema names and DDL types do not explain data ownership, meaning, transition behaviour, or recovery.
A schema-changing plan must make the resulting contract and safe migration executable.

## Standards

- Include a relational ERD or storage-appropriate data-model diagram showing affected entities,
  keys, and relationships.
- State the exact old and new contracts. Add a field-by-field guide covering purpose, owner,
  type/constraints, default and nullability, sensitivity, readers/writers, lifecycle and retention,
  clearing behaviour, and recovery implications where applicable.
- Define compatibility boundaries for mixed-version readers, writers, APIs, jobs, and deployments.
- Use `expand → migrate → verify → contract`, or explain why a step is inapplicable without
  weakening compatibility or data safety.
- Specify rollback triggers and procedure, migration observability, reconciliation checks, and
  evidence that proves no loss, duplication, or unintended reinterpretation.

## Migration Numbers Are Hints

A plan, brief, or other document that names a migration number must call that number a hint. A number in a document
reserves no number and authorizes no migration to take it, because the plan cannot know which number will be free when
the work merges. The migration takes the next free number when its work executes, as
[Migrations Take the Next Free Number](../../../development/pattern/database-audit-trail/schema-migration.md#migrations-take-the-next-free-number)
requires. Followed: the document calls the number a hint, or names none. Violated: the document says a number is
reserved, claimed, or fixed, or a migration takes a number because a document named it.

Enforcement: unenforced by decision. Whether a wording reserves a number is a judgement a reader makes, and no check in
this repository reads plan prose for it.

Adopted by explicit copy from [ose-rules](https://github.com/wahidyankf/ose-rules) at catalog head
`81982e20c798d8af6dbb85ae446d39d0432b6362`, from its
[Migration Numbers Are Hints](https://github.com/wahidyankf/ose-rules/blob/81982e20c798d8af6dbb85ae446d39d0432b6362/repo-governance/conventions/structure/plan-migrations/001-source-inventory-and-contracts.md#migration-numbers-are-hints)
section.

## Examples

A column rename identifies the dual-read/dual-write interval, backfill batching and retry behaviour,
old/new API fields, row-count and value reconciliation, rollback trigger, and the evidence required
before dropping the old column.

## Validation

Semantic plan review fails a schema-changing plan when implementation must infer field meaning,
transition order, compatibility, verification, or recovery.
