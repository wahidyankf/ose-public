# Plan: Add Dedicated Database Migration Tooling to All Demo Apps

**Status**: In Progress
**Created**: 2026-03-26

## Overview

All demo backend (`demo-be-*`) and fullstack (`demo-fs-*`) apps share the same domain schema
(users, refresh_tokens, revoked_tokens, expenses, attachments) defined by the OpenAPI contract in
`specs/apps/demo/contracts/`. Currently, only 4 apps use dedicated migration tooling without
changes (`demo-be-java-springboot`, `demo-be-elixir-phoenix`, `demo-fs-ts-nextjs`,
`demo-be-rust-axum`). One app (`demo-be-csharp-aspnetcore`) uses EF Core but requires an upgrade
from `EnsureCreated`. The remaining 7 rely on programmatic DDL (`CREATE TABLE IF NOT EXISTS`, ORM
auto-migrate, or `EnsureCreated`) which is not production-ready.

All NEW migration tools must be fully open-source (OSI-approved license) and free for all use.
Liquibase (FSL-1.1-ALv2) is retained for existing Java apps with a documented licensing note — see
[Licensing Decision](#licensing-decision).

**Git Workflow**: Commit to `main` (Trunk Based Development)

## Goals

1. Add dedicated, community-blessed migration tooling to all 7 demo apps that currently lack it
2. Upgrade `demo-be-csharp-aspnetcore` from `EnsureCreated` to proper EF Core Migrations
3. Ensure all migration tools produce the same 5-table schema with 6 audit columns
4. Generalize the [Database Audit Trail Pattern](../../../governance/development/pattern/database-audit-trail.md)
   from Liquibase/JPA-only to a language-agnostic standard
5. Document migration setup in each app's README
6. Document the Liquibase FSL-1.1-ALv2 licensing decision (and other LGPL/EPL decisions) in a new
   `docs/explanation/software-engineering/licensing/` governance document

## Quick Links

- [Requirements](./requirements.md) - Current state, gaps, licensing audit, and acceptance criteria
- [Technical Documentation](./tech-docs.md) - Tool selection rationale, alternatives, and
  implementation details per app
- [Delivery Plan](./delivery.md) - Phased checklist and validation

## Tool Assignments

### New Migration Tooling (7 apps)

| App                      | Tool                     | License      | Ecosystem Rationale                                    |
| ------------------------ | ------------------------ | ------------ | ------------------------------------------------------ |
| demo-be-java-vertx       | **Liquibase**            | FSL-1.1-ALv2 | Consistency with Spring Boot sibling; programmatic API |
| demo-be-python-fastapi   | **Alembic**              | MIT          | Same author as SQLAlchemy; undisputed standard         |
| demo-be-golang-gin       | **goose**                | MIT          | Transaction-safe; no dirty-state problem               |
| demo-be-kotlin-ktor      | **Flyway**               | Apache 2.0   | Ktor ecosystem consensus; JetBrains-endorsed           |
| demo-be-fsharp-giraffe   | **DbUp**                 | MIT          | SQL-first; no F# compatibility issues                  |
| demo-be-clojure-pedestal | **Migratus**             | Apache 2.0   | Luminus default; git-friendly                          |
| demo-be-ts-effect        | **@effect/sql Migrator** | MIT          | Built-in; type-safe Effect migrations                  |

### Upgrade (1 app)

| App                       | Tool                   | License | Change                                           |
| ------------------------- | ---------------------- | ------- | ------------------------------------------------ |
| demo-be-csharp-aspnetcore | **EF Core Migrations** | MIT     | Upgrade from `EnsureCreated` to versioned system |

### Already Done (4 apps — no changes needed)

| App                     | Tool      | License          | Status   |
| ----------------------- | --------- | ---------------- | -------- |
| demo-be-java-springboot | Liquibase | FSL-1.1-ALv2     | **Done** |
| demo-be-elixir-phoenix  | Ecto      | Apache 2.0       | **Done** |
| demo-fs-ts-nextjs       | Drizzle   | Apache 2.0       | **Done** |
| demo-be-rust-axum       | SQLx      | MIT / Apache 2.0 | **Done** |

See [Technical Documentation](./tech-docs.md) for full rationale, alternatives considered, and
licensing audit for each tool.

## Context

### Why Programmatic DDL Is Not Production-Ready

- No versioning — impossible to tell which schema version is running
- No rollback — failed migrations leave the database in an unknown state
- No auditability — no record of which migrations have been applied
- No incremental changes — cannot add a column without recreating the table
- Violates the [Database Audit Trail Pattern](../../../governance/development/pattern/database-audit-trail.md)
  which mandates versioned schema migrations

### Licensing Decision

**Liquibase** switched from Apache 2.0 to the Functional Source License (FSL-1.1-ALv2) in version
5.0. FSL is **not** an OSI-approved open-source license — it prohibits using Liquibase to build a
**competing commercial migration tool** for 2 years after each release, then converts to
Apache 2.0.

**Decision: Keep Liquibase for Java apps.** Rationale:

- This project is an enterprise platform, not a competing migration tool. The FSL non-compete
  clause does not restrict our usage.
- FSL permits all end-user usage (development, testing, production deployments) without limitation.
- Liquibase is already in production for `demo-be-java-springboot` with 6 proven changelogs.
- Consistency: both Java apps (`demo-be-java-springboot` and `demo-be-java-vertx`) use the same
  migration tool and changelog format.

**This decision MUST be documented** in
`docs/explanation/software-engineering/licensing/lgpl-justifications.md` (or a new licensing
decisions doc) so future contributors understand why a non-OSI tool is accepted.
