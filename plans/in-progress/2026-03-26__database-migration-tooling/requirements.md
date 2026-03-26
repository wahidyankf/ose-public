# Requirements: Database Migration Tooling for All Demo Apps

## Current State

| App                       | Language/Framework   | Current Approach                    | Migration Tool        | License          | Status      |
| ------------------------- | -------------------- | ----------------------------------- | --------------------- | ---------------- | ----------- |
| demo-be-java-springboot   | Java / Spring Boot   | Liquibase SQL changelogs            | Liquibase             | FSL-1.1-ALv2     | **Done**    |
| demo-be-elixir-phoenix    | Elixir / Phoenix     | Ecto migrations                     | Ecto                  | Apache 2.0       | **Done**    |
| demo-fs-ts-nextjs         | TypeScript / Next.js | Drizzle ORM migrations              | Drizzle               | Apache 2.0       | **Done**    |
| demo-be-rust-axum         | Rust / Axum          | SQLx migrate feature                | SQLx                  | MIT / Apache 2.0 | **Done**    |
| demo-be-csharp-aspnetcore | C# / ASP.NET Core    | EF Core `EnsureCreated`             | Needs migration files | MIT              | **Partial** |
| demo-be-java-vertx        | Java / Vert.x        | `SchemaInitializer.java` inline DDL | None                  | —                | **Todo**    |
| demo-be-python-fastapi    | Python / FastAPI     | SQLAlchemy `create_all()`           | None                  | —                | **Todo**    |
| demo-be-golang-gin        | Go / Gin             | GORM `AutoMigrate()`                | None                  | —                | **Todo**    |
| demo-be-kotlin-ktor       | Kotlin / Ktor        | Exposed `SchemaUtils.create()`      | None                  | —                | **Todo**    |
| demo-be-fsharp-giraffe    | F# / Giraffe         | EF Core `EnsureCreated`             | None                  | —                | **Todo**    |
| demo-be-clojure-pedestal  | Clojure / Pedestal   | `create-schema!` inline SQL         | None                  | —                | **Todo**    |
| demo-be-ts-effect         | TypeScript / Effect  | `@effect/sql` inline DDL            | None                  | —                | **Todo**    |

## Licensing Audit

All NEW migration tools must use an OSI-approved open-source license and be free for all use.
Liquibase (FSL-1.1-ALv2) is retained for Java apps — see [Liquibase Licensing Detail](#liquibase-licensing-detail).

| Tool                   | License          | OSI Approved | Free for Us                  | Verdict                                                       |
| ---------------------- | ---------------- | ------------ | ---------------------------- | ------------------------------------------------------------- |
| **Liquibase** (v5+)    | FSL-1.1-ALv2     | **No**       | Yes (we're not a competitor) | **KEEP** — document FSL licensing decision in governance docs |
| **Flyway** Community   | Apache 2.0       | Yes          | Yes                          | **ACCEPT** — undo is paid but manual rollback scripts work    |
| **Alembic**            | MIT              | Yes          | Yes                          | **ACCEPT**                                                    |
| **goose**              | MIT              | Yes          | Yes                          | **ACCEPT**                                                    |
| **DbUp**               | MIT              | Yes          | Yes                          | **ACCEPT**                                                    |
| **Migratus**           | Apache 2.0       | Yes          | Yes                          | **ACCEPT**                                                    |
| **@effect/sql**        | MIT              | Yes          | Yes                          | **ACCEPT**                                                    |
| **EF Core**            | MIT              | Yes          | Yes                          | **ACCEPT**                                                    |
| **Ecto** (existing)    | Apache 2.0       | Yes          | Yes                          | **COMPLIANT**                                                 |
| **Drizzle** (existing) | Apache 2.0       | Yes          | Yes                          | **COMPLIANT**                                                 |
| **SQLx** (existing)    | MIT / Apache 2.0 | Yes          | Yes                          | **COMPLIANT**                                                 |

### Liquibase Licensing Detail

Liquibase switched from Apache 2.0 to the Functional Source License (FSL-1.1-ALv2) in version 5.0
(September 30, 2025 — confirmed against the
[Liquibase FSL blog post](https://www.liquibase.com/blog/liquibase-community-for-the-future-fsl)).
FSL is **not** an OSI-approved
open-source license — it prohibits competing commercial use for 2 years after each release, then
converts to Apache 2.0. The Apache Software Foundation
([LEGAL-721](https://issues.apache.org/jira/browse/LEGAL-721)) and Keycloak
([#43391](https://github.com/keycloak/keycloak/issues/43391)) have both flagged this as
problematic.

### Flyway Undo Note

Flyway Community Edition (Apache 2.0) does not include the `flyway undo` command — that is a
paid Teams/Enterprise feature. However, manual rollback is achievable by writing down-migration SQL
scripts (e.g., `V2.1__undo_add_column.sql`). This project does not require automated undo; manual
rollback scripts are sufficient and already the pattern used by DbUp, goose, and Migratus.

## Identified Gaps

### Gap 1: No Versioned Migrations (7 apps)

Seven apps use programmatic DDL for schema creation: `demo-be-java-vertx`,
`demo-be-python-fastapi`, `demo-be-golang-gin`, `demo-be-kotlin-ktor`, `demo-be-fsharp-giraffe`,
`demo-be-clojure-pedestal`, `demo-be-ts-effect`.

**Impact**: Cannot track which schema version is running, cannot roll back failed migrations,
cannot incrementally alter schema without dropping and recreating tables.

### Gap 2: EnsureCreated Is Not a Migration System (2 apps)

`demo-be-csharp-aspnetcore` uses EF Core but calls `Database.EnsureCreatedAsync()` instead of
`Database.MigrateAsync()`. `demo-be-fsharp-giraffe` also uses EF Core `EnsureCreated()` in
`Program.fs`. Both apps use `EnsureCreated` which creates the full schema idempotently but cannot
handle incremental changes — if a column is added to a model, `EnsureCreated` does nothing because
the table already exists. Note that the two apps take different solutions: the C# app upgrades EF
Core to use `MigrateAsync()`, while the F# app switches to DbUp because EF Core migrations are
code-first and couple to C# class structure.

**Impact**: Schema evolution requires manual database drops. Not production-safe.

### Gap 3: Liquibase FSL-1.1-ALv2 Licensing Undocumented

`demo-be-java-springboot` and (after this plan) `demo-be-java-vertx` use Liquibase, which switched
to the non-OSI Functional Source License (FSL-1.1-ALv2) in v5.0. While the FSL non-compete clause does
not restrict this project (we are not building a competing migration tool), this licensing decision
must be documented for future contributors.

**Impact**: Without documentation, future contributors may not understand why a non-OSI tool is
accepted in the repository.

### Gap 4: Governance Doc Is Spring Boot/Liquibase-Specific

The [Database Audit Trail Pattern](../../../governance/development/pattern/database-audit-trail.md)
mandates 6 audit columns for every table but only documents the implementation via Liquibase SQL
changelogs and Spring Data JPA Auditing. Other language ecosystems have no guidance. The doc should
be generalized to multi-language while keeping Liquibase as the Java-specific example.

**Impact**: Non-Java apps have no reference implementation for the audit trail pattern.

### Gap 5: App READMEs Lack Migration Documentation

None of the 8 affected apps document how database migrations work, how to create a new migration,
or how migrations run during startup.

**Impact**: Developers unfamiliar with the app have no guidance for schema changes.

## User Stories

```gherkin
Scenario: Developer inspects migration tooling for any demo app
  Given I need to understand the migration setup for a demo backend app
  When I inspect the app's dependencies and source code
  Then I find a dedicated migration tool (not inline DDL)
  And I find versioned migration files alongside the application code
  And I find a "Database Migrations" section in the app's README

Scenario: Developer adds a new column to the demo schema
  Given a demo backend app with established migration tooling
  When I need to add a new column to an existing table
  Then I create a new numbered migration file following the tool's convention
  And the migration runs automatically on the next application startup
  And the previous migration state is preserved in the migration tracking table

Scenario: Developer operator verifies licensing compliance
  Given the repository governance documentation
  When I review which migration tools are used
  Then I find all new tools use OSI-approved licenses
  And I find a licensing decisions document explaining why Liquibase (FSL-1.1-ALv2) is retained
```

## Acceptance Criteria

```gherkin
Feature: Database migration tooling for all demo apps

  Scenario Outline: App uses dedicated migration tool
    Given the demo app "<app>"
    When I inspect the project dependencies
    Then it includes the migration tool "<tool>"
    And the project contains versioned migration files
    And the app does NOT use programmatic DDL for schema creation

    Examples:
      | app                        | tool                   |
      | demo-be-java-vertx         | Liquibase              |
      | demo-be-python-fastapi     | Alembic                |
      | demo-be-golang-gin         | goose                  |
      | demo-be-kotlin-ktor        | Flyway                 |
      | demo-be-fsharp-giraffe     | DbUp                   |
      | demo-be-clojure-pedestal   | Migratus               |
      | demo-be-ts-effect          | @effect/sql Migrator   |
      | demo-be-csharp-aspnetcore  | EF Core Migrations     |

  Scenario: Liquibase FSL-1.1-ALv2 licensing decision is documented
    Given the repository governance documentation
    When I look for a licensing decisions document
    Then it explains why Liquibase (FSL-1.1-ALv2, non-OSI) is accepted
    And it states that the FSL non-compete clause does not restrict this project
    And it lists the affected apps (demo-be-java-springboot, demo-be-java-vertx)

  Scenario Outline: Migrations produce correct schema (standard 5-table apps)
    Given the demo app "<app>" with an empty database
    When the app starts and runs migrations
    Then the database contains tables: users, refresh_tokens, revoked_tokens, expenses, attachments
    And the users table includes all 6 audit columns (created_at, created_by, updated_at, updated_by, deleted_at, deleted_by)

    Examples:
      | app                        |
      | demo-be-java-vertx         |
      | demo-be-python-fastapi     |
      | demo-be-clojure-pedestal   |
      | demo-be-ts-effect          |

  # Note: demo-be-golang-gin also targets the 5-table standard (6 audit columns) but has a
  # table naming conflict requiring a choice between Option A (revoked_tokens) and Option B
  # (blacklisted_tokens). Its schema scenarios are covered by the conditional scenarios below.

  Scenario Outline: Migrations preserve existing 2-column audit schema
    Given the demo app "<app>" with an empty database
    When the app starts and runs migrations
    Then the users table includes created_at and updated_at columns
    And the users table does NOT include created_by, updated_by, deleted_at, or deleted_by columns
    # Note: These apps currently have only 2 audit columns (created_at, updated_at) in their
    # existing schema. This plan is about migration TOOLING — it preserves the existing schema.
    # Adding the remaining 4 audit columns to align with the Database Audit Trail Pattern is
    # deferred to a follow-on plan.

    Examples:
      | app                        |
      | demo-be-fsharp-giraffe     |
      | demo-be-csharp-aspnetcore  |

  # Note on demo-be-ts-effect schema: The current `src/infrastructure/db/schema.ts` contains only 4
  # tables (users, expenses, attachments, revoked_tokens) — there is no separate `refresh_tokens`
  # table. Phase 4b migration files must include a `refresh_tokens` migration to align with the
  # 5-table standard shared by all other demo apps. The `revoked_tokens` table (token blacklist)
  # and `refresh_tokens` table (active token storage) serve different purposes and must both exist.

  # Note on demo-be-java-vertx schema: The current `SchemaInitializer.java` creates only 4 tables
  # (users, expenses, attachments, revoked_tokens) — there is no `refresh_tokens` table. Phase 1a
  # SQL changelogs must include a `refresh_tokens` migration (e.g., `004-create-refresh-tokens.sql`)
  # to align with the 5-table standard. The revoked_tokens and refresh_tokens tables serve distinct
  # purposes and must both exist.

  # Note on demo-be-python-fastapi schema: The current `models.py` defines only 4 models (users,
  # expenses, attachments, and a revoked/blacklisted tokens model) — there is no `RefreshToken`
  # model or `refresh_tokens` table. Phase 3a Alembic migration scripts must include a
  # `refresh_tokens` migration to align with the 5-table standard.

  # Note on demo-be-clojure-pedestal schema: The current `schema.clj` defines DDL for only 4
  # tables (users, expenses, attachments, revoked_tokens) — there is no `refresh_tokens` table.
  # Phase 3b Migratus migration pairs must include a `refresh_tokens` migration to align with
  # the 5-table standard.

  # demo-be-kotlin-ktor: Schema option unresolved — two conditional scenarios below.
  # Phase 1b MUST choose Option A or B and document it in the commit message.
  # Option A (recommended): Keep single `tokens` table with `token_type` column (schema divergence).
  # Option B: Split into `refresh_tokens` + `revoked_tokens` tables (standard 5-table schema).

  Scenario: demo-be-kotlin-ktor migrations produce tokens table (Option A — schema divergence)
    Given the demo app "demo-be-kotlin-ktor" with an empty database
    When the app starts and runs migrations (Option A chosen in Phase 1b)
    Then the database contains tables: users, tokens, expenses, attachments
    And the users table includes all 6 audit columns
    # Note: tokens table uses token_type column; no separate refresh_tokens or revoked_tokens tables.
    # This scenario applies only if Option A is chosen. If Option B is chosen, use the standard
    # "Migrations produce correct schema" scenario above (add demo-be-kotlin-ktor to Examples).

  # demo-be-golang-gin: Table naming conflict unresolved — two conditional scenarios below.
  # Phase 4a MUST choose Option A or B and document it in the commit message.
  # Option A (recommended): Rename BlacklistedToken to RevokedToken; goose uses revoked_tokens.
  # Option B: Keep blacklisted_tokens; goose uses blacklisted_tokens (schema divergence).

  Scenario: demo-be-golang-gin migrations produce revoked_tokens table (Option A — standard naming)
    Given the demo app "demo-be-golang-gin" with an empty database
    When the app starts and runs migrations (Option A chosen in Phase 4a)
    Then the database contains tables: users, refresh_tokens, revoked_tokens, expenses, attachments
    And the users table includes all 6 audit columns
    # This scenario applies only if Option A is chosen. If Option B is chosen, replace
    # revoked_tokens with blacklisted_tokens in the Then clause above.

  Scenario: demo-be-golang-gin migrations produce blacklisted_tokens table (Option B — divergence)
    Given the demo app "demo-be-golang-gin" with an empty database
    When the app starts and runs migrations (Option B chosen in Phase 4a)
    Then the database contains tables: users, refresh_tokens, blacklisted_tokens, expenses, attachments
    And the users table includes all 6 audit columns
    # This scenario applies only if Option B is chosen. The executor must document this divergence
    # in the Phase 4a commit message and README.

  Scenario Outline: Migrations are idempotent
    Given the demo app "<app>" with a fully migrated database
    When the app restarts
    Then no migration errors occur
    And no duplicate tables or columns are created

    Examples:
      | app                        |
      | demo-be-java-springboot    |
      | demo-be-elixir-phoenix     |
      | demo-fs-ts-nextjs          |
      | demo-be-rust-axum          |
      | demo-be-java-vertx         |
      | demo-be-python-fastapi     |
      | demo-be-golang-gin         |
      | demo-be-kotlin-ktor        |
      | demo-be-fsharp-giraffe     |
      | demo-be-clojure-pedestal   |
      | demo-be-ts-effect          |
      | demo-be-csharp-aspnetcore  |
  # Note: For demo-be-kotlin-ktor and demo-be-golang-gin, idempotency applies to whichever schema
  # option was chosen in their respective phases (Option A or Option B). The idempotency guarantee
  # is tool-level and does not depend on which schema option is in use.

  Scenario: Governance documentation is language-agnostic
    Given the file "governance/development/pattern/database-audit-trail.md"
    When I read the document
    Then it includes a "Migration Tool by Language" table listing all 12 demo apps
    And it generalizes the migration pattern beyond Liquibase-only
    And it retains the JPA/Liquibase section as Java-specific guidance (not a universal requirement)

  Scenario: All app READMEs document migration setup
    Given a demo app README
    When I read the "Database Migrations" section
    Then it names the migration tool used
    And it describes how to create a new migration
    And it describes how migrations run (startup vs CLI)

  Scenario: All related CI workflows pass
    Given all changes are pushed to main
    When the following GitHub Actions workflows run
    Then "main-ci.yml" passes
    And all 11 "test-demo-be-*.yml" workflows pass (or pre-existing failures are documented)
    And "test-demo-fs-ts-nextjs.yml" passes
```

## Non-Functional Requirements

- **Idempotency**: Running migrations on an already-migrated database must not fail or create
  duplicates. All selected tools (Liquibase, Flyway, goose, Alembic, DbUp, Migratus, @effect/sql,
  EF Core) maintain a migration tracking table to ensure this.
- **Startup integration**: Migrations run automatically during application startup without a
  separate Nx target. No migration-specific `nx run` commands are needed.
- **Test isolation**: Integration tests run against a freshly-migrated PostgreSQL instance via
  docker-compose. Each test run starts from an empty database and applies migrations on startup.
- **License compliance**: All NEW migration tools must use an OSI-approved license (MIT, Apache 2.0,
  BSD). Liquibase (FSL-1.1-ALv2) is retained for Java apps — see Licensing Audit above.
- **No dual initialization**: The old programmatic DDL (AutoMigrate, create_all, EnsureCreated,
  create-schema!) must be removed in the same commit that adds the migration tool. No coexistence
  period.

## Risk Assessment

| Risk                                                                 | Likelihood | Impact | Mitigation                                                                          |
| -------------------------------------------------------------------- | ---------- | ------ | ----------------------------------------------------------------------------------- |
| Migration tool breaks existing integration tests                     | Medium     | High   | Run `test:integration` per app after migration tool swap. Schema must be identical. |
| Dual init path (old programmatic + new migrations) during transition | Low        | Medium | Remove old programmatic DDL in the same commit. No dual-init period.                |
| FluentMigrator F# issue resurfaces with DbUp                         | Very Low   | Low    | DbUp is SQL-only; no assembly scanning for F# types needed.                         |
| goose dirty-state edge case                                          | Very Low   | Low    | goose uses transactions; dirty state is a golang-migrate problem, not goose.        |
| @effect/sql Migrator API changes                                     | Low        | Medium | Pin @effect/sql version. Migrator is stable API.                                    |
| Flyway Community drops Apache 2.0 license                            | Very Low   | High   | Monitor Flyway releases; Red Gate has maintained Apache 2.0 since acquisition.      |
