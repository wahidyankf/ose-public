---
description: Required 6-column audit trail for every database table in open-sharia-enterprise
when_to_use: "Use when creating a database table or migration."
---

# Database Audit Trail Pattern

Every database table in open-sharia-enterprise MUST include six audit trail columns recording who created,
updated, and soft-deleted each row, and when.

Hard deletion of audited rows is forbidden. Removal must update both `deleted_at` and `deleted_by`;
ordinary queries must exclude rows whose `deleted_at` is non-null.

**Enforcement disposition:** Unenforced by decision. Schema and persistence reviewers must verify
the live database catalog and every language-specific write/query path because static prose checks
cannot prove runtime migrations, indirect cascades, or generated SQL behaviour.

## Contents

- [Principles and Conventions](./database-audit-trail/principles-and-conventions.md) — The core principles and conventions this pattern implements - explicit metadata, automated migrations, reproducibility, and documentation-first. Use when you need to trace this pattern's audit-column requirement back to the principles and conventions it implements.
- [Required Audit Columns](./database-audit-trail/required-audit-columns.md) — The six required audit columns - created_at/by, updated_at/by, deleted_at/by - with their types, nullability, and defaults. Use when creating a new database table and need the exact column names, types, and defaults to add.
- [Why This Pattern Exists](./database-audit-trail/why-this-pattern-exists.md) — The auditability, soft-delete, compliance, and production-debugging rationale behind the required audit columns. Use when justifying to a reviewer or teammate why a table must include the audit columns.
- [Migration Tool by Language](./database-audit-trail/migration-tool-by-language.md) — Which migration tool each backend app uses to apply the audit columns, and where to find polyglot patterns. Use when you need to know which migration tool a given backend app uses before writing a migration.
- [Schema Migration](./database-audit-trail/schema-migration.md) — Requirements every migration must satisfy, plus the F#/DbUp versioned-SQL-script pattern for applying audit columns. Use when writing a DbUp migration script that must include the six audit columns correctly.
- [F# Entity Implementation](./database-audit-trail/fsharp-entity-implementation.md) — How to map an audited table to an F# EF Core entity, run DbUp migrations at startup, and implement soft-delete in the repository layer. Use when implementing the F# entity type, startup migration wiring, or repository soft-delete logic for an audited table.
- [Soft-Delete Query Discipline](./database-audit-trail/soft-delete-query-discipline.md) — All queries against audited tables must filter out soft-deleted rows unless the endpoint is an explicit admin/audit endpoint. Use when writing a query against an audited table and deciding whether to filter deleted_at.
- [F# Nullability Convention](./database-audit-trail/fsharp-nullability-convention.md) — How F# option types map the six audit columns to nullable versus non-null fields. Use when declaring the F# type for an audit column and deciding whether it should be an option type.
- [Compliance Checklist](./database-audit-trail/compliance-checklist.md) — A checklist covering schema, entity type, repository layer, and query requirements for a compliant audited table. Use when adding a new table or reviewing an existing one for compliance with this pattern.
- [Related Documentation and References](./database-audit-trail/related-documentation-and-references.md) — Links to related conventions and external documentation for migration tools covered by this pattern. Use when you need a link to a related convention or an external migration-tool reference.
- [Migration Tooling Pitfalls](./database-audit-trail/migration-tooling-pitfalls.md) — Lessons learned from adding migration tooling across eight language ecosystems, covering schema fidelity, coverage tooling, embedded filesystems, locale, and Docker environment differences. Use when adding or debugging migration tooling for a new language ecosystem and want to avoid known pitfalls.
