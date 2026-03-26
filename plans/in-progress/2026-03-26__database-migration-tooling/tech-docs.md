# Technical Documentation: Database Migration Tooling

## Licensing Requirement

All NEW migration tools must use an OSI-approved open-source license (MIT, Apache 2.0, BSD, etc.)
and be free for all use. Liquibase (FSL-1.1-ALv2) is retained for Java apps — see
[Licensing Decision](./README.md#licensing-decision) for rationale.

See [Requirements — Licensing Audit](./requirements.md#licensing-audit) for the full audit table.

## Tool Selection: Rationale and Alternatives

Each tool was selected based on community consensus, ecosystem integration, and active maintenance
status as of March 2026. Web research verified GitHub stars, download stats, framework
documentation recommendations, and community discussions.

### 1. demo-be-java-vertx: **Liquibase** (programmatic API)

**Why**: Consistency with the sibling `demo-be-java-springboot` which already uses Liquibase.
Liquibase provides a first-class
[programmatic Java API](https://contribute.liquibase.com/extensions-integrations/integration-guides/embedding-liquibase/)
for embedding outside Spring Boot — instantiate `Liquibase` or use `CommandScope("update")` with a
`ClassLoaderResourceAccessor` and JDBC `DataSource`. The same changelog format (SQL with
`-- liquibase formatted sql` headers) can be shared or kept consistent across both Java apps.

**Licensing note**: Liquibase v5+ uses FSL-1.1-ALv2 (not OSI-approved). The FSL non-compete clause
prohibits building a competing migration tool — it does NOT restrict end-user usage for schema
migrations. This project is an enterprise platform, not a migration tool. This decision is
documented in governance docs. See [Licensing Decision](./README.md#licensing-decision).

**Alternatives considered:**

| Tool               | Stars | License    | Pros                                     | Cons                                                              |
| ------------------ | ----- | ---------- | ---------------------------------------- | ----------------------------------------------------------------- |
| **Flyway**         | ~8k   | Apache 2.0 | OSI-approved; SQL-first (`V1__name.sql`) | Undo requires paid edition; inconsistent with Spring Boot sibling |
| **Manual scripts** | —     | —          | No dependencies                          | No tracking, no rollback, no audit trail                          |

### 2. demo-be-python-fastapi: **Alembic**

**Why**: Undisputed standard for SQLAlchemy projects (MIT license). Written by Mike Bayer, the
author of SQLAlchemy itself. The only migration tool that can auto-generate migrations by diffing
SQLAlchemy model metadata against the live database.

**Alternatives considered:**

| Tool                | Stars    | License    | Pros                                     | Cons                                             |
| ------------------- | -------- | ---------- | ---------------------------------------- | ------------------------------------------------ |
| **Yoyo-migrations** | Niche    | MIT        | SQL-file-based, lightweight              | No ORM integration; lose SQLAlchemy autogenerate |
| **Atlas** (Ariga)   | Emerging | Apache 2.0 | Declarative; can parse SQLAlchemy models | Not yet community standard; lower adoption       |

### 3. demo-be-golang-gin: **goose** (pressly/goose)

**Why**: ~10.4k GitHub stars, MIT license, actively maintained. SQL + Go function migrations,
transaction-safe by default. No "dirty state" problem — golang-migrate enters a dirty state on any
migration failure and requires manual `migrate force VERSION`; goose handles failures gracefully.

**Alternatives considered:**

| Tool                 | Stars    | License    | Pros                                                | Cons                                                   |
| -------------------- | -------- | ---------- | --------------------------------------------------- | ------------------------------------------------------ |
| **golang-migrate**   | ~17.8k   | MIT        | Highest adoption; broad driver support (S3, GitHub) | Dirty-state on failure requires `force` to recover     |
| **Atlas**            | ~6k      | Apache 2.0 | Graph-based diffing; official GORM integration      | Heavier dependency; vendor-backed (Ariga)              |
| **GORM AutoMigrate** | Built-in | MIT        | Zero setup                                          | Only adds, never alters/drops; no versioning; dev-only |

### 4. demo-be-kotlin-ktor: **Flyway**

**Why**: De-facto standard for the Ktor ecosystem (Apache 2.0). The Ktor community has coalesced
around Flyway — there is a dedicated
[ktor-flyway-feature](https://github.com/viartemev/ktor-flyway-feature) community plugin, and
virtually every Ktor + Exposed tutorial uses Flyway. JetBrains' Exposed documentation
[acknowledges](https://www.jetbrains.com/help/exposed/migrations.html) that `SchemaUtils.create()`
is insufficient for production. One-line integration:
`Flyway.configure().dataSource(ds).load().migrate()`.

**Alternatives considered:**

| Tool                    | Stars    | License      | Pros                                       | Cons                                                   |
| ----------------------- | -------- | ------------ | ------------------------------------------ | ------------------------------------------------------ |
| **Liquibase**           | ~11k     | FSL-1.1-ALv2 | Richer rollback; consistent with Java apps | Ktor community does not use it; adds XML/YAML overhead |
| **Exposed SchemaUtils** | Built-in | Apache 2.0   | Zero setup                                 | Only creates; cannot add/rename/alter/drop columns     |

### 5. demo-be-fsharp-giraffe: **DbUp**

**Why**: SQL-first migration runner (~2.6k GitHub stars, MIT license). Works identically in F# and
C#. Critically, FluentMigrator has a
[known issue (#883)](https://github.com/fluentmigrator/fluentmigrator/issues/883) where migrations
defined in F# fail to be discovered. DbUp uses plain SQL scripts — no assembly scanning needed.

**Alternatives considered:**

| Tool                   | Stars    | License    | Pros                             | Cons                                                  |
| ---------------------- | -------- | ---------- | -------------------------------- | ----------------------------------------------------- |
| **FluentMigrator**     | ~3.5k    | Apache 2.0 | Higher adoption; rich fluent API | Documented F# incompatibility (issue #883)            |
| **EF Core Migrations** | Built-in | MIT        | Already using EF Core            | `EnsureCreated` is not versioned; code-first coupling |
| **Evolve**             | ~900     | MIT        | Flyway-inspired, SQL-based       | Lower community support                               |

### 6. demo-be-clojure-pedestal: **Migratus**

**Why**: De-facto standard for Clojure database migrations (~679 GitHub stars, Apache 2.0, v1.6.5
released 2025). [Luminus](https://luminusweb.com/docs/migrations.html) — the most popular Clojure
web framework — defaults to Migratus. Git-friendly: handles branch-based workflows. Supports both
`.up.sql`/`.down.sql` files and Clojure code migrations. Compatible with next.jdbc via JDBC.

**Alternatives considered:**

| Tool        | Stars | License | Pros                                           | Cons                                              |
| ----------- | ----- | ------- | ---------------------------------------------- | ------------------------------------------------- |
| **Ragtime** | ~638  | EPL-1.0 | By James Reeves (Ring, Compojure); EDN support | Less active (0.8.1); confused by branch workflows |
| **Drift**   | —     | —       | —                                              | Unmaintained                                      |

### 7. demo-be-ts-effect: **@effect/sql Migrator** (built-in)

**Why**: The `@effect/sql` package (MIT license) includes a built-in Migrator (`PgMigrator`,
`SqliteMigrator`). Migrations are defined as `Effect<void, SqlError, SqlClient>` programs — fully
type-safe, participating in Effect's error handling and transaction management. Zero additional
dependencies.

**Alternatives considered:**

| Tool                | Stars | License    | Pros                                    | Cons                                              |
| ------------------- | ----- | ---------- | --------------------------------------- | ------------------------------------------------- |
| **dbmate**          | ~6.8k | MIT        | Language-agnostic CLI; pure SQL         | External binary; separate DB connection config    |
| **node-pg-migrate** | ~1.4k | MIT        | PostgreSQL-specific; TypeScript support | Adds dependency when Effect provides built-in     |
| **Drizzle/Prisma**  | —     | Apache/MIT | Popular ORM migration tools             | Tied to their ORMs; incompatible with @effect/sql |

### 8. demo-be-csharp-aspnetcore: **EF Core Migrations** (upgrade)

**Why**: Already uses EF Core (MIT license) for data access. `EnsureCreated` is not a migration
tool — it cannot handle incremental changes. Switching to proper EF Core migrations
(`dotnet ef migrations add`, `Database.MigrateAsync()`) requires no new dependencies.

**Alternatives considered:**

| Tool               | Stars | License    | Pros                   | Cons                                          |
| ------------------ | ----- | ---------- | ---------------------- | --------------------------------------------- |
| **DbUp**           | ~2.6k | MIT        | SQL-first, lightweight | Redundant when EF Core already has migrations |
| **FluentMigrator** | ~3.5k | Apache 2.0 | Rich C# fluent API     | Extra dependency when EF Core suffices        |

## Implementation Approach

### Shared Principles

> **Migration file naming**: Each tool uses its own naming convention — these are not
> repository-wide standards. Flyway requires `V{n}__{name}.sql`; goose uses `{n}_{name}.sql`;
> Alembic uses `{n}_{name}.py`; all other tools use `{n}-{name}.sql`. Follow the convention
> mandated by each tool.

1. **SQL-first where possible**: Migration files should be plain SQL (or the language's idiomatic
   equivalent) rather than ORM-generated DDL, so the schema is readable and auditable.
2. **Consistent schema**: All apps share the same 5-table domain model. Migration SQL should
   produce equivalent schemas (allowing for language-specific type differences like TEXT vs UUID).
3. **Migrations run on startup**: Each app runs pending migrations during application startup (dev
   and production). No separate `migrate` Nx target needed — migrations run during application
   startup (see `demo-be-java-springboot` `Main.java` as reference).
4. **Docker-compose compatibility**: Integration tests use ephemeral PostgreSQL. Migrations must
   run before tests (via application startup or test setup).
5. **Migration files versioned in git**: All migration SQL files are committed to the repository
   alongside the application code.
6. **All NEW migration tools must use an OSI-approved license** (MIT, Apache 2.0, BSD). Liquibase
   (FSL-1.1-ALv2) is retained for existing Java apps — see
   [Licensing Decision](./README.md#licensing-decision).

### Per-App Implementation Details

#### demo-be-java-vertx (Liquibase)

**Files to create:**

- `src/main/resources/db/changelog/db.changelog-master.yaml` — Master changelog referencing change
  files
- `src/main/resources/db/changelog/changes/001-create-users.sql` through
  `006-create-attachments.sql` — SQL changelogs matching Spring Boot's format

**Files to modify:**

- `pom.xml` — Add `liquibase-core` dependency
- `SchemaInitializer.java` → Replace inline DDL with Liquibase programmatic API call
  (`CommandScope("update")` with `ClassLoaderResourceAccessor`)
- `README.md` — Document migration approach

**Docker/CI impact:**

- `Dockerfile.integration` — No change (Liquibase runs inside the JVM)
- `docker-compose.integration.yml` — No change
- `.github/workflows/test-demo-be-java-vertx.yml` — No change

#### demo-be-python-fastapi (Alembic)

**Files to create:**

- `alembic.ini` — Alembic configuration
- `alembic/env.py` — Migration environment with SQLAlchemy model import
- `alembic/versions/001_create_users.py` through `006_create_attachments.py` — Migration scripts

**Files to modify:**

- `pyproject.toml` or `requirements.txt` — Add `alembic` dependency
- `main.py` — Replace `Base.metadata.create_all()` with Alembic `upgrade("head")` on startup
- `README.md` — Document migration approach

**Docker/CI impact:**

- `Dockerfile.integration` — May need `pip install alembic` if not in requirements
- `docker-compose.integration.yml` — No change
- `.github/workflows/test-demo-be-python-fastapi.yml` — No change

#### demo-be-golang-gin (goose)

**Files to create:**

- `db/migrations/001_create_users.sql` through `006_create_attachments.sql` — SQL migration files
  with `-- +goose Up` / `-- +goose Down` markers

**Files to modify:**

- `go.mod` — Add `github.com/pressly/goose/v3` dependency
- `internal/store/store.go` (or equivalent) — Replace GORM `AutoMigrate()` with goose embedded
  migrations (`goose.Up(db, migrationsDir)`)
- `README.md` — Document migration approach

**Docker/CI impact:**

- `Dockerfile` — No change (goose is a Go library, compiled into the binary)
- `Dockerfile.integration` — No change
- `docker-compose.integration.yml` — No change
- `.github/workflows/test-demo-be-golang-gin.yml` — No change

#### demo-be-kotlin-ktor (Flyway)

**Files to create:**

- `src/main/resources/db/migration/V1__create_users.sql` through
  `V6__create_attachments.sql` — Flyway-convention SQL files

**Files to modify:**

- `build.gradle.kts` — Add `org.flywaydb:flyway-core` and
  `org.flywaydb:flyway-database-postgresql` dependencies
- Application startup code — Add `Flyway.configure().dataSource(ds).load().migrate()` before
  Exposed table registration
- `README.md` — Document migration approach

**Docker/CI impact:**

- `Dockerfile.integration` — No change (Flyway is a JVM library)
- `docker-compose.integration.yml` — No change
- `.github/workflows/test-demo-be-kotlin-ktor.yml` — No change

#### demo-be-fsharp-giraffe (DbUp)

**Files to create:**

- `db/migrations/001-create-users.sql` through `006-create-attachments.sql` — Embedded SQL
  resources

**Files to modify:**

- `.fsproj` — Add `DbUp-Core` and `DbUp-PostgreSQL` NuGet packages; embed migration SQL files as
  `EmbeddedResource`
- `Program.fs` — Replace `EnsureCreatedAsync()` with DbUp
  `DeployChanges.To.PostgresqlDatabase(connStr).WithScriptsEmbeddedInAssembly(assembly).Build().PerformUpgrade()`
- `README.md` — Document migration approach

**Docker/CI impact:**

- `Dockerfile.integration` — No change (DbUp is a NuGet package, compiled into the binary)
- `docker-compose.integration.yml` — No change
- `.github/workflows/test-demo-be-fsharp-giraffe.yml` — No change

#### demo-be-clojure-pedestal (Migratus)

**Files to create:**

- `resources/migrations/001-create-users.up.sql` / `.down.sql` through
  `006-create-attachments.up.sql` / `.down.sql` — Migratus SQL migration pairs

**Files to modify:**

- `deps.edn` — Add `migratus` dependency
- `src/demo_be_cjpd/db/schema.clj` — Replace `create-schema!` with Migratus
  `(migratus/migrate config)` call
- `README.md` — Document migration approach

**Docker/CI impact:**

- `Dockerfile.integration` — No change (Migratus is a Clojure library on classpath)
- `docker-compose.integration.yml` — No change
- `.github/workflows/test-demo-be-clojure-pedestal.yml` — No change

#### demo-be-ts-effect (@effect/sql Migrator)

**Files to create:**

- `src/infrastructure/db/migrations/001_create_users.ts` through
  `006_create_attachments.ts` — Effect migration modules

**Files to modify:**

- `src/infrastructure/db/schema.ts` — Extract DDL into migration files; keep type definitions
- Application startup — Add `PgMigrator.run` (or `SqliteMigrator.run`) to the Effect layer
- `README.md` — Document migration approach

**Docker/CI impact:**

- `Dockerfile.integration` — No change (migrations are TypeScript modules compiled with the app)
- `docker-compose.integration.yml` — No change
- `.github/workflows/test-demo-be-ts-effect.yml` — No change

#### demo-be-csharp-aspnetcore (EF Core Migrations upgrade)

**Files to create:**

- `Migrations/` directory — Generated by `dotnet ef migrations add InitialCreate`

**Files to modify:**

- `Program.cs` — Replace `Database.EnsureCreatedAsync()` with `Database.MigrateAsync()`
- `README.md` — Document migration approach

**Docker/CI impact:**

- `Dockerfile.integration` — No change (EF Core migrations run inside the app)
- `docker-compose.integration.yml` — No change
- `.github/workflows/test-demo-be-csharp-aspnetcore.yml` — No change

## Documentation Updates

### Governance Documents

| File                                                               | Change                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `governance/development/pattern/database-audit-trail.md`           | Generalize to language-agnostic pattern. Add "Migration Tool by Language" table. Keep Liquibase/JPA section as Java-specific guidance. Add sections for other languages.                                                                                                                                                            |
| `governance/development/pattern/README.md`                         | Update the Database Audit Trail entry description to reflect multi-language scope                                                                                                                                                                                                                                                   |
| `governance/development/README.md`                                 | Update the Database Audit Trail entry in Pattern Documentation section to reflect multi-language scope                                                                                                                                                                                                                              |
| `docs/explanation/software-engineering/licensing/` (new directory) | Create directory with two files: `README.md` (index) and `ex-soen-lc__licensing-decisions.md` (see naming note below) documenting: Liquibase FSL-1.1-ALv2 decision (why kept, non-compete does not apply), LGPL justifications (Hibernate, sharp-libvips), dual-license elections (Logback → EPL-1.0), and quarterly audit schedule |
| `docs/explanation/software-engineering/README.md`                  | Add "Licensing" section entry linking to the new `licensing/` subdirectory                                                                                                                                                                                                                                                          |
| `docs/explanation/README.md`                                       | Review and update if it references subdirectories of `software-engineering/`                                                                                                                                                                                                                                                        |

> **Naming note**: The licensing decisions file must follow the hierarchical prefix convention used
> in `docs/explanation/software-engineering/` (e.g., `ex-soen-lc__licensing-decisions.md` where
> `ex` = explanation, `soen` = software-engineering, `lc` = licensing). Confirm the exact prefix
> token by consulting the naming convention before Phase 5 execution. `README.md` files in new
> directories are exempt from this naming convention.

### App READMEs

| File                                       | Change                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------ |
| `apps/demo-be-java-vertx/README.md`        | Add "Database Migrations" section documenting Liquibase setup            |
| `apps/demo-be-python-fastapi/README.md`    | Add "Database Migrations" section documenting Alembic setup              |
| `apps/demo-be-golang-gin/README.md`        | Add "Database Migrations" section documenting goose setup                |
| `apps/demo-be-kotlin-ktor/README.md`       | Add "Database Migrations" section documenting Flyway setup               |
| `apps/demo-be-fsharp-giraffe/README.md`    | Add "Database Migrations" section documenting DbUp setup                 |
| `apps/demo-be-clojure-pedestal/README.md`  | Add "Database Migrations" section documenting Migratus setup             |
| `apps/demo-be-ts-effect/README.md`         | Add "Database Migrations" section documenting @effect/sql Migrator setup |
| `apps/demo-be-csharp-aspnetcore/README.md` | Update to document EF Core Migrations (replace EnsureCreated reference)  |

### Specs

| File                                 | Change                                                                               |
| ------------------------------------ | ------------------------------------------------------------------------------------ |
| `specs/apps/demo/c4/component-be.md` | Add migration tool as a component in the C4 component diagram if not already present |

## References

- [Database Audit Trail Pattern](../../../governance/development/pattern/database-audit-trail.md)
- [Three-Level Testing Standard](../../../governance/development/quality/three-level-testing-standard.md)
- [Nx Target Standards](../../../governance/development/infra/nx-targets.md)
- [Liquibase Embedding Guide](https://contribute.liquibase.com/extensions-integrations/integration-guides/embedding-liquibase/)
- [Flyway Documentation](https://documentation.red-gate.com/flyway)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [goose (pressly/goose)](https://github.com/pressly/goose)
- [DbUp Documentation](https://dbup.readthedocs.io/)
- [Migratus Documentation](https://github.com/yogthos/migratus)
- [Effect SQL Migrations](https://effect.website/docs/sql/)
- [EF Core Migrations](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/)
- [Liquibase FSL Licensing Change](https://www.liquibase.com/blog/liquibase-community-for-the-future-fsl)
- [ASF LEGAL-721 (Liquibase FSL incompatibility)](https://issues.apache.org/jira/browse/LEGAL-721)
- [FluentMigrator F# Issue #883](https://github.com/fluentmigrator/fluentmigrator/issues/883)
- [Luminus Migrations (Migratus)](https://luminusweb.com/docs/migrations.html)
- [JetBrains Exposed Migrations](https://www.jetbrains.com/help/exposed/migrations.html)
