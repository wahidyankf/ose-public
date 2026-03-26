# Delivery Plan: Database Migration Tooling

## Overview

**Delivery Type**: Direct commits to `main` (small, independent changes)

**Git Workflow**: Trunk Based Development — each phase is one or more commits

**Phase Independence**: Phases 1–4 (per-app migration implementations) are independent and can be
delivered in any order. Phase 5 (documentation + licensing) depends on at least one app being done
for reference. Phase 6 (validation) runs after all phases complete.

## Implementation Phases

### Phase 1: JVM Apps (Java Vert.x / Kotlin Ktor)

#### Phase 1a: demo-be-java-vertx — Liquibase

- [ ] Add `liquibase-core` dependency to `pom.xml`
- [ ] Create `src/main/resources/db/changelog/db.changelog-master.yaml` referencing change files
- [ ] Create SQL changelogs in `src/main/resources/db/changelog/changes/` — must produce 5 tables
      (users, refresh_tokens, revoked_tokens, expenses, attachments). The current
      `SchemaInitializer.java` only creates 4 tables (no `refresh_tokens`), so the changelogs
      must add `refresh_tokens` as a new file (e.g., `004-create-refresh-tokens.sql`) — match
      Spring Boot format for all 6 files (`001-create-users.sql` through `006-create-attachments.sql`).
      **Note**: the existing `SchemaInitializer.java` users table has only `created_at` and
      `updated_at` audit columns. The SQL changelogs must define the full 6 audit columns
      (`created_at`, `created_by`, `updated_at`, `updated_by`, `deleted_at`, `deleted_by`) to
      align with Goal 3 and the acceptance criteria — the 4 missing columns (`created_by`,
      `updated_by`, `deleted_at`, `deleted_by`) are net-new additions beyond the current schema.
- [ ] Replace `SchemaInitializer.java` inline DDL with Liquibase programmatic API:
      `CommandScope("update")` with `ClassLoaderResourceAccessor` and JDBC `DataSource`
- [ ] Update `README.md` with "Database Migrations" section
- [ ] Verify: `Dockerfile.integration` — open file and confirm no changes needed
- [ ] Verify: `docker-compose.integration.yml` — open file and confirm no changes needed
- [ ] Verify: `.github/workflows/test-demo-be-java-vertx.yml` — open file and confirm no changes needed
- [ ] Run `nx run demo-be-java-vertx:test:quick` — verify pass
- [ ] Run `nx run demo-be-java-vertx:test:integration` — verify integration tests pass and the
      database schema matches the acceptance criteria (5 tables: users, refresh_tokens,
      revoked_tokens, expenses, attachments)
- [ ] Commit: `feat(demo-be-java-vertx): add Liquibase database migrations`

#### Phase 1b: demo-be-kotlin-ktor — Flyway

- [ ] **Schema decision (required before writing migrations)**: Inspect `TokensTable.kt` and decide
      which option to implement (Option A or Option B — they are mutually exclusive; choose exactly
      one):
  - Option A (recommended): Keep single `tokens` table with `token_type` column. Write Flyway
    migration for `tokens` table. Note schema divergence from 5-table standard in README and commit
    message.
  - Option B: Split into `refresh_tokens` + `revoked_tokens` tables. Update `TokensTable.kt` and
    all repository code that queries by `token_type` before writing Flyway migrations.
- [ ] Document the chosen option (A or B) in the commit message
- [ ] Add `org.flywaydb:flyway-core` and `org.flywaydb:flyway-database-postgresql` to
      `build.gradle.kts`
- [ ] Create Flyway SQL files in `src/main/resources/db/migration/` — content depends on option
      chosen: Option A creates `users`, `tokens`, `expenses`, `attachments` tables; Option B
      creates `users`, `refresh_tokens`, `revoked_tokens`, `expenses`, `attachments` tables
- [ ] Wire `Flyway.configure().dataSource(ds).load().migrate()` in application startup, before
      Exposed table registration
- [ ] Remove `SchemaUtils.create(UsersTable, TokensTable, ExpensesTable, AttachmentsTable)` call
      from `DatabaseFactory.kt`
- [ ] Update `README.md` with "Database Migrations" section (document schema divergence if Option A)
- [ ] Verify: `Dockerfile.integration` — open file and confirm no changes needed
- [ ] Verify: `docker-compose.integration.yml` — open file and confirm no changes needed
- [ ] Verify: `.github/workflows/test-demo-be-kotlin-ktor.yml` — open file and confirm no changes needed
- [ ] Run `nx run demo-be-kotlin-ktor:test:quick` — verify pass
- [ ] Run `nx run demo-be-kotlin-ktor:test:integration` — verify integration tests pass and the
      database schema matches the option chosen in Phase 1b (Option A: users, tokens, expenses,
      attachments; Option B: users, refresh_tokens, revoked_tokens, expenses, attachments)
- [ ] Commit: `feat(demo-be-kotlin-ktor): add Flyway database migrations`

### Phase 2: .NET Apps (F# / C#)

#### Phase 2a: demo-be-fsharp-giraffe — DbUp

- [ ] Add `DbUp-Core` and `DbUp-PostgreSQL` NuGet packages to `.fsproj`
- [ ] Create SQL migration files `001-create-users.sql` through `006-create-attachments.sql` in
      `db/migrations/`
- [ ] Configure `.fsproj` to embed migration files as `EmbeddedResource`
- [ ] Replace `Database.EnsureCreated()` in `Program.fs` with DbUp:
      `DeployChanges.To.PostgresqlDatabase(connStr).WithScriptsEmbeddedInAssembly(assembly).Build().PerformUpgrade()`
- [ ] Search entire codebase for `EnsureCreated` — confirm all occurrences are removed
- [ ] Confirm `AppDbContext.fs` is retained for data access (not removed)
- [ ] Verify project compiles: `dotnet build` before running tests
- [ ] Update `README.md` with "Database Migrations" section
- [ ] Verify: `Dockerfile.integration` — open file and confirm no changes needed
- [ ] Verify: `docker-compose.integration.yml` — open file and confirm no changes needed
- [ ] Verify: `.github/workflows/test-demo-be-fsharp-giraffe.yml` — open file and confirm no changes needed
- [ ] Run `nx run demo-be-fsharp-giraffe:test:quick` — verify pass
- [ ] Run `nx run demo-be-fsharp-giraffe:test:integration` — verify schema matches previous
      approach (same tables as existing EnsureCreated schema; users table has 2 audit
      columns: created_at, updated_at; does NOT include created_by, updated_by, deleted_at,
      deleted_by)
- [ ] Commit: `feat(demo-be-fsharp-giraffe): add DbUp database migrations`

#### Phase 2b: demo-be-csharp-aspnetcore — EF Core Migrations

- [ ] Add `Microsoft.EntityFrameworkCore.Design` to `DemoBeCsas.csproj` (required by `dotnet ef`
      CLI tools; use `PrivateAssets="all"` since it is build-time only):
      `dotnet add apps/demo-be-csharp-aspnetcore/src/DemoBeCsas/DemoBeCsas.csproj package Microsoft.EntityFrameworkCore.Design`
- [ ] Run `dotnet ef migrations add InitialCreate` to generate `Migrations/` directory
- [ ] Replace `Database.EnsureCreatedAsync()` with `Database.MigrateAsync()` in `Program.cs`
- [ ] Search codebase for `EnsureCreated` — confirm all occurrences are removed:
      `grep -r "EnsureCreated" apps/demo-be-csharp-aspnetcore/`
- [ ] Verify project compiles: `dotnet build` or `nx run demo-be-csharp-aspnetcore:build` before
      running tests
- [ ] Update `README.md` with "Database Migrations" section
- [ ] Verify: `Dockerfile.integration` — open file and confirm no changes needed
- [ ] Verify: `docker-compose.integration.yml` — open file and confirm no changes needed
- [ ] Verify: `.github/workflows/test-demo-be-csharp-aspnetcore.yml` — open file and confirm no changes needed
- [ ] Run `nx run demo-be-csharp-aspnetcore:test:quick` — verify pass
- [ ] Run `nx run demo-be-csharp-aspnetcore:test:integration` — verify schema matches previous
      approach (same tables as existing EF Core EnsureCreated schema; users table has 2 audit
      columns: created_at, updated_at; does NOT include created_by, updated_by, deleted_at,
      deleted_by)
- [ ] Commit: `feat(demo-be-csharp-aspnetcore): upgrade to EF Core Migrations`

### Phase 3: Scripting Languages (Python / Clojure)

#### Phase 3a: demo-be-python-fastapi — Alembic

- [ ] Add `alembic` to `pyproject.toml` `[project.dependencies]` and run `uv lock` to update
      `uv.lock` (the project uses `uv` — there is no `requirements.txt`)
- [ ] Create `alembic.ini` configuration file
- [ ] Create `alembic/env.py` with SQLAlchemy model import for autogenerate support
- [ ] Create migration scripts in `alembic/versions/` — must produce 5 tables (users,
      refresh_tokens, revoked_tokens, expenses, attachments). The current `models.py` defines only
      4 models (no `RefreshToken` or `refresh_tokens` table), so the migration scripts must add
      `refresh_tokens` (e.g., `004_create_refresh_tokens.py`). Total: 6 migration scripts
      (`001_create_users.py` through `006_create_attachments.py`)
- [ ] Replace `Base.metadata.create_all()` in `main.py` with Alembic programmatic API on startup:
      `alembic.command.upgrade(alembic_cfg, "head")` where `alembic_cfg` is an
      `alembic.config.Config` object initialized with `Config("alembic.ini")`
- [ ] Update `README.md` with "Database Migrations" section
- [ ] Inspect `tests/integration/` setup files — update any `create_all()` references there to use
      Alembic instead (equivalent of the `hooks.ts` update step in Phase 4b)
- [ ] Verify `Dockerfile.integration` uses `uv sync --frozen` (confirm; no change expected)
- [ ] Verify: `docker-compose.integration.yml` — open file and confirm no changes needed
- [ ] Verify: `.github/workflows/test-demo-be-python-fastapi.yml` — open file and confirm no changes needed
- [ ] Run `nx run demo-be-python-fastapi:test:quick` — verify pass
- [ ] Run `nx run demo-be-python-fastapi:test:integration` — verify integration tests pass and the
      database schema matches the acceptance criteria (5 tables: users, refresh_tokens,
      revoked_tokens, expenses, attachments)
- [ ] Commit: `feat(demo-be-python-fastapi): add Alembic database migrations`

#### Phase 3b: demo-be-clojure-pedestal — Migratus

- [ ] Add `migratus` dependency to `deps.edn`
- [ ] Create SQL migration pairs in `resources/migrations/` — must produce 5 tables (users,
      refresh_tokens, revoked_tokens, expenses, attachments). The current `schema.clj` defines DDL
      for only 4 tables (no `refresh_tokens`), so the migration pairs must add `refresh_tokens`
      (e.g., `004-create-refresh-tokens.up.sql` / `004-create-refresh-tokens.down.sql`). Total:
      6 pairs (`001-create-users.up.sql` / `.down.sql` through `006-create-attachments.up.sql` /
      `.down.sql`)
- [ ] Replace `create-schema!` in `src/demo_be_cjpd/db/schema.clj` with Migratus
      `(migratus/migrate config)` call
- [ ] Update `README.md` with "Database Migrations" section
- [ ] Verify: `Dockerfile.integration` — open file and confirm no changes needed
- [ ] Verify: `docker-compose.integration.yml` — open file and confirm no changes needed
- [ ] Verify: `.github/workflows/test-demo-be-clojure-pedestal.yml` — open file and confirm no changes needed
- [ ] Run `nx run demo-be-clojure-pedestal:test:quick` — verify pass
- [ ] Run `nx run demo-be-clojure-pedestal:test:integration` — verify integration tests pass and
      the database schema matches the acceptance criteria (5 tables: users, refresh_tokens,
      revoked_tokens, expenses, attachments)
- [ ] Commit: `feat(demo-be-clojure-pedestal): add Migratus database migrations`

### Phase 4: Go and TypeScript

#### Phase 4a: demo-be-golang-gin — goose

- [ ] **Naming conflict decision (required before writing migrations)**: Inspect `gorm_store.go` and
      decide which option to implement (Option A or Option B — they are mutually exclusive; choose
      exactly one):
  - Option A (recommended): Rename `BlacklistedToken` to `RevokedToken`, add
    `func (RevokedToken) TableName() string { return "revoked_tokens" }`, and update all usages
    (queries, type assertions, constructors). Goose migrations use `revoked_tokens`.
  - Option B: Keep `blacklisted_tokens`. Goose migrations use `blacklisted_tokens`. Note this
    app's schema divergence from the acceptance criteria `revoked_tokens` requirement in commit
    message and README.
- [ ] Document the chosen option (A or B) in the commit message
- [ ] Add `github.com/pressly/goose/v3` dependency to `go.mod`
- [ ] Create SQL migration files `001_create_users.sql` through `006_create_attachments.sql` in
      `db/migrations/` with `-- +goose Up` / `-- +goose Down` markers (revoked/blacklisted tokens
      table name depends on option chosen above)
- [ ] Add `//go:embed db/migrations/*.sql` directive and declare `var embedMigrations embed.FS`
      in `internal/store/store.go` (or a dedicated migrations file)
- [ ] Remove GORM `AutoMigrate()` call from application initialization code (must not coexist
      with goose — remove it before or in the same commit that adds goose initialization)
- [ ] Replace GORM `AutoMigrate()` with goose embedded migrations using
      `goose.SetBaseFS(embedMigrations)` + `goose.Up(db, "db/migrations")`, or use
      `goose.NewProvider(goose.DialectPostgres, db, embedMigrations)` — do NOT use the
      path-based `goose.Up(db, migrationsDir)` form, which requires a real filesystem directory
      rather than an embedded FS
- [ ] Update `README.md` with "Database Migrations" section
- [ ] Verify: `Dockerfile` — open file and confirm no changes needed (goose compiles into Go binary)
- [ ] Verify: `Dockerfile.integration` — open file and confirm no changes needed
- [ ] Verify: `docker-compose.integration.yml` — open file and confirm no changes needed
- [ ] Verify: `.github/workflows/test-demo-be-golang-gin.yml` — open file and confirm no changes needed
- [ ] Run `nx run demo-be-golang-gin:test:quick` — verify pass
- [ ] Run `nx run demo-be-golang-gin:test:integration` — verify integration tests pass and the
      database schema matches the option chosen in Phase 4a (Option A: users, refresh_tokens,
      revoked_tokens, expenses, attachments; Option B: users, refresh_tokens, blacklisted_tokens,
      expenses, attachments)
- [ ] Commit: `feat(demo-be-golang-gin): add goose database migrations`

#### Phase 4b: demo-be-ts-effect — @effect/sql Migrator

- [ ] Verify `PgMigrator` is exported from the installed `@effect/sql-pg` package before writing
      any migration files:
      `node -e "const x = require('@effect/sql-pg'); console.log(Object.keys(x))"`
      — confirm `PgMigrator` appears in the output. Also confirm `SqliteMigrator` from
      `@effect/sql-sqlite-node` if used in the SQLite test environment.
- [ ] Create Effect migration modules `001_create_users.ts` through `006_create_attachments.ts` in
      `src/infrastructure/db/migrations/`
- [ ] Extract DDL for the 4 existing tables (users, expenses, attachments, revoked_tokens) from
      `src/infrastructure/db/schema.ts` into migration files (do not remove type definitions from
      `schema.ts`). **Note**: `refresh_tokens` does NOT exist in `schema.ts` — create
      `005_create_refresh_tokens.ts` from scratch based on the standard `refresh_tokens` schema
      (same columns as other apps: id, user_id, token, expires_at, created_at, etc.).
- [ ] Wire `PgMigrator.layer(...)` into the Effect application startup Layer for PostgreSQL
      (production and Docker integration environments) — see tech-docs.md for the Layer composition
      pattern. **Note**: provide `NodeFileSystem.layer` from `@effect/platform-node` in the Layer
      stack — `PgMigrator.fromFileSystem(...)` requires the `FileSystem` service or the app will
      fail at startup with a "service not provided" error (`@effect/platform-node` should already be
      in `package.json` — verify with `npm ls @effect/platform-node` and install if missing).
- [ ] Wire `SqliteMigrator.layer(...)` into the Effect application startup Layer for the SQLite
      `test:integration` environment — condition on database type so each environment
      uses the appropriate migrator
- [ ] Update `README.md` with "Database Migrations" section
- [ ] Document the `@effect/sql` version in the README "Database Migrations" section (the
      caret-range `^` in `package.json` is acceptable since `package-lock.json` pins the effective
      version; no need to remove `^` from `package.json`)
- [ ] Verify: `Dockerfile.integration` — open file and confirm no changes needed
- [ ] Verify: `docker-compose.integration.yml` — open file and confirm no changes needed
- [ ] Verify: `.github/workflows/test-demo-be-ts-effect.yml` — open file and confirm no changes needed
- [ ] Update `tests/unit/bdd/hooks.ts` to use the migrator instead of importing DDL constants from
      `schema.ts`
- [ ] Update `tests/integration/hooks.ts` to use the migrator instead of importing DDL constants
      from `schema.ts`; remove imports of `CREATE_TABLE_STATEMENTS` and `CREATE_TABLES_SQL_PG`
- [ ] Run `nx run demo-be-ts-effect:test:quick` — verify pass
- [ ] Run `nx run demo-be-ts-effect:test:integration` — verify integration tests pass and the
      database schema matches the acceptance criteria (5 tables: users, refresh_tokens,
      revoked_tokens, expenses, attachments)
- [ ] Commit: `feat(demo-be-ts-effect): add @effect/sql Migrator database migrations`

### Phase 5: Documentation, Governance, and Licensing

- [ ] Update `governance/development/pattern/database-audit-trail.md`:
  - [ ] Add a "Migration Tool by Language" table listing all 12 demo apps and their migration tools
  - [ ] Generalize the migration section to be language-agnostic
  - [ ] Keep Liquibase/JPA-specific guidance as a "Java / Spring Boot" subsection
  - [ ] Add brief examples for other ecosystems
- [ ] Update `governance/development/pattern/README.md`:
  - [ ] Change Database Audit Trail entry description to reflect multi-language migration support
- [ ] Update `governance/development/README.md`:
  - [ ] Search for "Database Audit Trail" to locate the entry in the Pattern Documentation section,
        then change its description to reflect multi-language migration scope
- [ ] Create `docs/explanation/software-engineering/licensing/README.md` — index file
      linking to the licensing decisions document
- [ ] Create `docs/explanation/software-engineering/licensing/ex-soen-lc__licensing-decisions.md`
      (confirm exact prefix token before creating):
  - [ ] Document Liquibase FSL-1.1-ALv2 decision: non-compete does not apply; lists affected apps
        `demo-be-java-springboot`, `demo-be-java-vertx`; FSL converts to Apache 2.0 after 2 years.
        Use confirmed year: "Liquibase 5.0 (September 2025)"
  - [ ] Document Hibernate LGPL-2.1 dynamic linking via JPA SPI justification
  - [ ] Document sharp-libvips LGPL-3.0 dynamic native addon justification
  - [ ] Document Logback EPL-1.0/LGPL-2.1 dual-license: EPL-1.0 elected
  - [ ] Include quarterly audit schedule section
- [ ] Verify `ex-soen-lc__licensing-decisions.md` has complete frontmatter (title, description,
      category, subcategory, tags, created, updated) matching the existing governance doc pattern
- [ ] Update `docs/explanation/software-engineering/README.md`:
  - [ ] Add "Licensing" section entry linking to the new `licensing/` subdirectory
- [ ] Review `docs/explanation/README.md`:
  - [ ] Update if it references subdirectories of `software-engineering/`
- [ ] Review `specs/apps/demo/c4/component-be.md`:
  - [ ] Add migration tool as a component in C4 diagram if not already present
- [ ] Commit governance changes — use separate commits per concern:
  - `docs(governance): generalize database audit trail pattern to multi-language`
    (covers `database-audit-trail.md`, `governance/development/pattern/README.md`,
    `governance/development/README.md`)
  - `docs(governance): add licensing decisions document`
    (covers `docs/explanation/software-engineering/licensing/` new directory,
    `docs/explanation/software-engineering/README.md`, `docs/explanation/README.md`)
  - If the C4 specs change is non-trivial (adds or modifies diagram nodes), add a third commit:
    `chore(specs): add migration tool component to C4 backend diagram`
    Non-trivial means: if you added or removed a box or arrow in the diagram.
  - If the C4 specs review results in no change, include a "no change needed" note in the
    audit trail commit message only (no separate commit).

### Phase 6: Local Validation

- [ ] `nx affected -t test:quick` passes for all modified apps
- [ ] `nx affected -t test:integration` passes for all modified apps with docker-compose
- [ ] Each app's migration produces the required schema per acceptance criteria:
  - [ ] Apps adding `refresh_tokens` (java-vertx, python-fastapi, clojure-pedestal, ts-effect,
        golang-gin Option A): 5 tables (users, refresh_tokens, revoked_tokens, expenses, attachments)
  - [ ] Apps with equivalent schema (fsharp-giraffe, csharp-aspnetcore, kotlin-ktor): schema matches
        the previous programmatic approach (same tables, same columns). For fsharp-giraffe and
        csharp-aspnetcore, the users table has only 2 audit columns (created_at, updated_at) — this
        is correct. Adding the remaining 4 audit columns is deferred to a follow-on plan.
- [ ] Verify idempotency for the 8 modified apps: run `nx run [app]:test:integration` twice
      consecutively (without dropping the DB between runs) and verify the second run exits 0.
      Apps to verify: demo-be-java-vertx, demo-be-python-fastapi, demo-be-golang-gin,
      demo-be-kotlin-ktor, demo-be-fsharp-giraffe, demo-be-clojure-pedestal, demo-be-ts-effect,
      demo-be-csharp-aspnetcore
- [ ] Verify idempotency regression for the 4 pre-existing apps: confirm existing tooling remains
      correct and unaffected (demo-be-java-springboot, demo-be-elixir-phoenix, demo-fs-ts-nextjs,
      demo-be-rust-axum)
- [ ] Verify all 8 app READMEs have a "Database Migrations" section
- [ ] Verify `database-audit-trail.md` includes the "Migration Tool by Language" table
- [ ] Verify `ex-soen-lc__licensing-decisions.md` documents Liquibase FSL-1.1-ALv2 decision with rationale
- [ ] Verify no remaining `AutoMigrate()`, `create_all()`, `EnsureCreated()`, `create-schema!`, or
      inline DDL `CREATE TABLE` calls in modified apps (except within migration files themselves).
      Use the following to check:

  ```bash
  grep -r "AutoMigrate\|create_all\|EnsureCreated\|create-schema!\|SchemaUtils\.create\|SchemaInitializer" \
    apps/demo-be-* \
    --include="*.go" --include="*.py" --include="*.fs" --include="*.clj" --include="*.ts" \
    --include="*.cs" --include="*.kt" --include="*.java"
  # Note: *.sql files are intentionally excluded — migration files themselves contain CREATE TABLE
  # statements and would produce false positives. Inspect any non-migration SQL files (e.g., seed
  # scripts) manually if they exist.
  ```

- [ ] Verify 5-table schema for apps adding `refresh_tokens` (java-vertx, python-fastapi,
      clojure-pedestal, ts-effect, golang-gin Option A): use `psql \dt` or equivalent after
      running integration tests to confirm all 5 tables are present:
      `docker exec <db_container> psql -U postgres -c "\dt" | grep -E "refresh_tokens|revoked_tokens"`
- [ ] Confirm all per-phase Dockerfile verifications are complete and no Docker-affecting changes
      were made
- [ ] Confirm all per-phase docker-compose verifications are complete and no compose-affecting
      changes were made
- [ ] Confirm all per-phase GitHub Actions workflow verifications are complete and no CI-affecting
      changes were made

### Phase 7: CI Verification

Push all changes and verify all related GitHub Actions workflows pass. Trigger manually via
`gh workflow run` if needed (all workflows below support `workflow_dispatch`).

#### Main CI

- [ ] `main-ci.yml` — passes on push to `main`

#### Demo Backend E2E Workflows (all must pass)

- [ ] `test-demo-be-java-springboot.yml` — Test - Demo BE (Java/Spring Boot)
- [ ] `test-demo-be-java-vertx.yml` — Test - Demo BE (Java/Vert.x)
- [ ] `test-demo-be-python-fastapi.yml` — Test - Demo BE (Python/FastAPI)
- [ ] `test-demo-be-golang-gin.yml` — Test - Demo BE (Go/Gin)
- [ ] `test-demo-be-kotlin-ktor.yml` — Test - Demo BE (Kotlin/Ktor)
- [ ] `test-demo-be-fsharp-giraffe.yml` — Test - Demo BE (F#/Giraffe)
- [ ] `test-demo-be-csharp-aspnetcore.yml` — Test - Demo BE (C#/ASP.NET Core)
- [ ] `test-demo-be-clojure-pedestal.yml` — Test - Demo BE (Clojure/Pedestal)
- [ ] `test-demo-be-ts-effect.yml` — Test - Demo BE (TypeScript/Effect)
- [ ] `test-demo-be-rust-axum.yml` — Test - Demo BE (Rust/Axum)
- [ ] `test-demo-be-elixir-phoenix.yml` — Test - Demo BE (Elixir/Phoenix)

#### Demo Fullstack E2E Workflows (must pass)

- [ ] `test-demo-fs-ts-nextjs.yml` — Test - Demo FS (TypeScript/Next.js)

#### Pre-Existing Failures (document, do not block)

If a workflow was already failing before this plan's changes (e.g., `test-demo-be-ts-effect` has
been failing due to a Docker `npm ci` issue since 2026-03-24), document the pre-existing failure
and do not block the plan on it. Verify the failure is unrelated to migration changes by checking
the failure predates the plan's commits.

#### Trigger Commands

```bash
# Trigger all 12 demo workflows manually
gh workflow run test-demo-be-java-springboot.yml --ref main
gh workflow run test-demo-be-java-vertx.yml --ref main
gh workflow run test-demo-be-python-fastapi.yml --ref main
gh workflow run test-demo-be-golang-gin.yml --ref main
gh workflow run test-demo-be-kotlin-ktor.yml --ref main
gh workflow run test-demo-be-fsharp-giraffe.yml --ref main
gh workflow run test-demo-be-csharp-aspnetcore.yml --ref main
gh workflow run test-demo-be-clojure-pedestal.yml --ref main
gh workflow run test-demo-be-ts-effect.yml --ref main
gh workflow run test-demo-be-rust-axum.yml --ref main
gh workflow run test-demo-be-elixir-phoenix.yml --ref main
gh workflow run test-demo-fs-ts-nextjs.yml --ref main
```
