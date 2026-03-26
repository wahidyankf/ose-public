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
(2025 — verify exact version and year against the
[Liquibase FSL blog post](https://www.liquibase.com/blog/liquibase-community-for-the-future-fsl)
before finalizing `ex-soen-lc__licensing-decisions.md` in Phase 5). FSL is **not** an OSI-approved
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

### Gap 2: EnsureCreated Is Not a Migration System (1 app)

`demo-be-csharp-aspnetcore` uses EF Core but calls `Database.EnsureCreatedAsync()` instead of
`Database.MigrateAsync()`. `EnsureCreated` creates the full schema idempotently but cannot handle
incremental changes — if a column is added to a model, `EnsureCreated` does nothing because the
table already exists.

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

  Scenario Outline: Migrations produce correct schema
    Given the demo app "<app>" with an empty database
    When the app starts and runs migrations
    Then the database contains tables: users, refresh_tokens, revoked_tokens, expenses, attachments
    And the users table includes all 6 audit columns (created_at, created_by, updated_at, updated_by, deleted_at, deleted_by)

    Examples:
      | app                        |
      | demo-be-java-vertx         |
      | demo-be-python-fastapi     |
      | demo-be-golang-gin         |
      | demo-be-kotlin-ktor        |
      | demo-be-fsharp-giraffe     |
      | demo-be-clojure-pedestal   |
      | demo-be-ts-effect          |
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

  # Note on demo-be-kotlin-ktor schema: The current implementation uses a single `tokens` table
  # (via Exposed `TokensTable`) that combines refresh and revoked token semantics via a `token_type`
  # column. This does not produce separate `refresh_tokens` and `revoked_tokens` tables. Phase 1b
  # MUST resolve this divergence explicitly:
  #   Option A (recommended): Keep the single `tokens` table with `token_type` column, and update
  #     the acceptance criteria Examples table to note this app's schema divergence (the "Migrations
  #     produce correct schema" scenario should exclude demo-be-kotlin-ktor or add a separate
  #     scenario for it). Flyway migration V1 creates the `tokens` table; no `refresh_tokens` or
  #     `revoked_tokens` tables are created.
  #   Option B: Split into `refresh_tokens` + `revoked_tokens` tables — requires updating
  #     `TokensTable.kt` and all repository code that queries by `token_type`.
  # The executor must document the chosen option in the Phase 1b commit message.

  # Note on demo-be-golang-gin schema: The current implementation uses a GORM struct
  # `BlacklistedToken` without a `TableName()` override. GORM's snake_case pluralization creates a
  # `blacklisted_tokens` table, NOT `revoked_tokens`. The acceptance criteria require `revoked_tokens`.
  # Phase 4a MUST resolve this naming conflict explicitly before writing goose migrations:
  #   Option A (recommended): Rename struct to `RevokedToken` and add `TableName() string { return
  #     "revoked_tokens" }` method; update all repository code that references `BlacklistedToken`.
  #     Goose migrations then use `revoked_tokens` consistently.
  #   Option B: Keep `blacklisted_tokens` and update the acceptance criteria Examples table to note
  #     this app uses `blacklisted_tokens` instead of `revoked_tokens`. Goose migrations use
  #     `blacklisted_tokens`.
  # The executor must document the chosen option in the Phase 4a commit message.

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

## Risk Assessment

| Risk                                                                 | Likelihood | Impact | Mitigation                                                                          |
| -------------------------------------------------------------------- | ---------- | ------ | ----------------------------------------------------------------------------------- |
| Migration tool breaks existing integration tests                     | Medium     | High   | Run `test:integration` per app after migration tool swap. Schema must be identical. |
| Dual init path (old programmatic + new migrations) during transition | Low        | Medium | Remove old programmatic DDL in the same commit. No dual-init period.                |
| FluentMigrator F# issue resurfaces with DbUp                         | Very Low   | Low    | DbUp is SQL-only; no assembly scanning for F# types needed.                         |
| goose dirty-state edge case                                          | Very Low   | Low    | goose uses transactions; dirty state is a golang-migrate problem, not goose.        |
| @effect/sql Migrator API changes                                     | Low        | Medium | Pin @effect/sql version. Migrator is stable API.                                    |
| Flyway Community drops Apache 2.0 license                            | Very Low   | High   | Monitor Flyway releases; Red Gate has maintained Apache 2.0 since acquisition.      |
