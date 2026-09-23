---
description: "Links to related conventions and external documentation for migration tools covered by this pattern."
when_to_use: "Use when you need a link to a related convention or an external migration-tool reference."
---

# Related Documentation and References

## Related Documentation

- [Acceptance Criteria Convention](../../infra/acceptance-criteria.md) - Writing testable criteria for features involving audited entities
- [Functional Programming Practices](../functional-programming.md) - Pure functions for business logic separate from audit side effects
- [Reproducible Environments Convention](../../workflow/reproducible-environments.md) - Why consistent PostgreSQL environments across dev/staging/prod matter for test reliability
- [Licensing Decisions](../../../../docs/explanation/software-engineering/licensing/licensing-decisions.md) - License analysis for migration tools (Liquibase FSL-1.1-ALv2 and others)

## References

**Project Plans:**

- Auth Register/Login Tech Docs - Reference implementation of the `users` table applying this pattern

**External (F# / DbUp / EF Core):**

- [DbUp migrations (F#/.NET)](https://dbup.readthedocs.io/)
- [EF Core — `IEntityTypeConfiguration`](https://learn.microsoft.com/en-us/ef/core/modeling/)
- [EF Core Migrations (C#/.NET)](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/)

**External (Other Active Ecosystems):**

- [goose migrations (Go)](https://github.com/pressly/goose)
- [@effect/sql Migrator (TypeScript)](https://effect.website/docs/sql/sql-migrator)
- [Drizzle migrations (TypeScript)](https://orm.drizzle.team/docs/migrations)
