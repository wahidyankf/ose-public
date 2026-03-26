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
- [ ] Create SQL changelogs `001-create-users.sql` through `006-create-attachments.sql` in
      `src/main/resources/db/changelog/changes/` (match Spring Boot format)
- [ ] Replace `SchemaInitializer.java` inline DDL with Liquibase programmatic API:
      `CommandScope("update")` with `ClassLoaderResourceAccessor` and JDBC `DataSource`
- [ ] Update `README.md` with "Database Migrations" section
- [ ] Verify: `Dockerfile.integration` — no changes needed
- [ ] Verify: `docker-compose.integration.yml` — no changes needed
- [ ] Verify: `.github/workflows/test-demo-be-java-vertx.yml` — no changes needed
- [ ] Run `nx run demo-be-java-vertx:test:quick` — verify pass
- [ ] Run `nx run demo-be-java-vertx:test:integration` — verify schema matches previous approach
- [ ] Commit: `feat(demo-be-java-vertx): add Liquibase database migrations`

#### Phase 1b: demo-be-kotlin-ktor — Flyway

- [ ] Add `org.flywaydb:flyway-core` and `org.flywaydb:flyway-database-postgresql` to
      `build.gradle.kts`
- [ ] Create Flyway SQL files `V1__create_users.sql` through `V6__create_attachments.sql` in
      `src/main/resources/db/migration/`
- [ ] Wire `Flyway.configure().dataSource(ds).load().migrate()` in application startup, before
      Exposed table registration
- [ ] Remove `SchemaUtils.create()` calls (if any explicit calls exist)
- [ ] Update `README.md` with "Database Migrations" section
- [ ] Verify: `Dockerfile.integration` — no changes needed
- [ ] Verify: `docker-compose.integration.yml` — no changes needed
- [ ] Verify: `.github/workflows/test-demo-be-kotlin-ktor.yml` — no changes needed
- [ ] Run `nx run demo-be-kotlin-ktor:test:quick` — verify pass
- [ ] Run `nx run demo-be-kotlin-ktor:test:integration` — verify schema matches previous approach
- [ ] Commit: `feat(demo-be-kotlin-ktor): add Flyway database migrations`

### Phase 2: .NET Apps (F# / C#)

#### Phase 2a: demo-be-fsharp-giraffe — DbUp

- [ ] Add `DbUp-Core` and `DbUp-PostgreSQL` NuGet packages to `.fsproj`
- [ ] Create SQL migration files `001-create-users.sql` through `006-create-attachments.sql` in
      `db/migrations/`
- [ ] Configure `.fsproj` to embed migration files as `EmbeddedResource`
- [ ] Replace `Database.EnsureCreatedAsync()` in `Program.fs` with DbUp:
      `DeployChanges.To.PostgresqlDatabase(connStr).WithScriptsEmbeddedInAssembly(assembly).Build().PerformUpgrade()`
- [ ] Search entire codebase for `EnsureCreated` — confirm all occurrences are removed
- [ ] Confirm `AppDbContext.fs` is retained for data access (not removed)
- [ ] Verify project compiles: `dotnet build` before running tests
- [ ] Update `README.md` with "Database Migrations" section
- [ ] Verify: `Dockerfile.integration` — no changes needed
- [ ] Verify: `docker-compose.integration.yml` — no changes needed
- [ ] Verify: `.github/workflows/test-demo-be-fsharp-giraffe.yml` — no changes needed
- [ ] Run `nx run demo-be-fsharp-giraffe:test:quick` — verify pass
- [ ] Run `nx run demo-be-fsharp-giraffe:test:integration` — verify schema matches previous
      approach
- [ ] Commit: `feat(demo-be-fsharp-giraffe): add DbUp database migrations`

#### Phase 2b: demo-be-csharp-aspnetcore — EF Core Migrations

- [ ] Run `dotnet ef migrations add InitialCreate` to generate `Migrations/` directory
- [ ] Replace `Database.EnsureCreatedAsync()` with `Database.MigrateAsync()` in `Program.cs`
- [ ] Update `README.md` with "Database Migrations" section
- [ ] Verify: `Dockerfile.integration` — no changes needed
- [ ] Verify: `docker-compose.integration.yml` — no changes needed
- [ ] Verify: `.github/workflows/test-demo-be-csharp-aspnetcore.yml` — no changes needed
- [ ] Run `nx run demo-be-csharp-aspnetcore:test:quick` — verify pass
- [ ] Run `nx run demo-be-csharp-aspnetcore:test:integration` — verify schema matches previous
      approach
- [ ] Commit: `feat(demo-be-csharp-aspnetcore): upgrade to EF Core Migrations`

### Phase 3: Scripting Languages (Python / Clojure)

#### Phase 3a: demo-be-python-fastapi — Alembic

- [ ] Add `alembic` dependency to `pyproject.toml` or `requirements.txt`
- [ ] Create `alembic.ini` configuration file
- [ ] Create `alembic/env.py` with SQLAlchemy model import for autogenerate support
- [ ] Create migration scripts `001_create_users.py` through `006_create_attachments.py` in
      `alembic/versions/`
- [ ] Replace `Base.metadata.create_all()` in `main.py` with Alembic `upgrade("head")` on startup
- [ ] Update `README.md` with "Database Migrations" section
- [ ] Add `alembic` to `requirements.txt` (ensures it is present in Docker image builds)
- [ ] Verify `Dockerfile.integration` installs `requirements.txt` (confirm; no change expected if already the case)
- [ ] Verify: `docker-compose.integration.yml` — no changes needed
- [ ] Verify: `.github/workflows/test-demo-be-python-fastapi.yml` — no changes needed
- [ ] Run `nx run demo-be-python-fastapi:test:quick` — verify pass
- [ ] Run `nx run demo-be-python-fastapi:test:integration` — verify schema matches previous
      approach
- [ ] Commit: `feat(demo-be-python-fastapi): add Alembic database migrations`

#### Phase 3b: demo-be-clojure-pedestal — Migratus

- [ ] Add `migratus` dependency to `deps.edn`
- [ ] Create SQL migration pairs `001-create-users.up.sql` / `.down.sql` through
      `006-create-attachments.up.sql` / `.down.sql` in `resources/migrations/`
- [ ] Replace `create-schema!` in `src/demo_be_cjpd/db/schema.clj` with Migratus
      `(migratus/migrate config)` call
- [ ] Update `README.md` with "Database Migrations" section
- [ ] Verify: `Dockerfile.integration` — no changes needed
- [ ] Verify: `docker-compose.integration.yml` — no changes needed
- [ ] Verify: `.github/workflows/test-demo-be-clojure-pedestal.yml` — no changes needed
- [ ] Run `nx run demo-be-clojure-pedestal:test:quick` — verify pass
- [ ] Run `nx run demo-be-clojure-pedestal:test:integration` — verify schema matches previous
      approach
- [ ] Commit: `feat(demo-be-clojure-pedestal): add Migratus database migrations`

### Phase 4: Go and TypeScript

#### Phase 4a: demo-be-golang-gin — goose

- [ ] Add `github.com/pressly/goose/v3` dependency to `go.mod`
- [ ] Create SQL migration files `001_create_users.sql` through `006_create_attachments.sql` in
      `db/migrations/` with `-- +goose Up` / `-- +goose Down` markers
- [ ] Replace GORM `AutoMigrate()` in `internal/store/store.go` (or equivalent) with goose
      embedded migrations (`goose.Up(db, migrationsDir)`)
- [ ] Update `README.md` with "Database Migrations" section
- [ ] Verify: `Dockerfile` — no changes needed (goose compiles into Go binary)
- [ ] Verify: `Dockerfile.integration` — no changes needed
- [ ] Verify: `docker-compose.integration.yml` — no changes needed
- [ ] Verify: `.github/workflows/test-demo-be-golang-gin.yml` — no changes needed
- [ ] Run `nx run demo-be-golang-gin:test:quick` — verify pass
- [ ] Run `nx run demo-be-golang-gin:test:integration` — verify schema matches previous approach
- [ ] Commit: `feat(demo-be-golang-gin): add goose database migrations`

#### Phase 4b: demo-be-ts-effect — @effect/sql Migrator

- [ ] Create Effect migration modules `001_create_users.ts` through `006_create_attachments.ts` in
      `src/infrastructure/db/migrations/`
- [ ] Extract DDL from `src/infrastructure/db/schema.ts` into migration files; keep type definitions
- [ ] Wire `PgMigrator.run` (or `SqliteMigrator.run`) into the Effect application layer startup
- [ ] Update `README.md` with "Database Migrations" section
- [ ] Verify `@effect/sql` version in `package.json` is pinned (not a range); document the tested
      version in the README "Database Migrations" section
- [ ] Verify: `Dockerfile.integration` — no changes needed
- [ ] Verify: `docker-compose.integration.yml` — no changes needed
- [ ] Verify: `.github/workflows/test-demo-be-ts-effect.yml` — no changes needed
- [ ] Run `nx run demo-be-ts-effect:test:quick` — verify pass
- [ ] Run `nx run demo-be-ts-effect:test:integration` — verify schema matches previous approach
- [ ] Commit: `feat(demo-be-ts-effect): add Effect SQL Migrator database migrations`

### Phase 5: Documentation, Governance, and Licensing

- [ ] Update `governance/development/pattern/database-audit-trail.md`:
  - Add a "Migration Tool by Language" table listing all 12 demo apps and their migration tools
  - Generalize the migration section to be language-agnostic
  - Keep Liquibase/JPA-specific guidance as a "Java / Spring Boot" subsection
  - Add brief examples for other ecosystems
- [ ] Update `governance/development/pattern/README.md`:
  - Change Database Audit Trail entry description to reflect multi-language migration support
- [ ] Update `governance/development/README.md`:
  - Change Database Audit Trail entry in Pattern Documentation section to reflect multi-language
    scope
- [ ] Create `docs/explanation/software-engineering/licensing/` directory with:
  - `README.md` — Index for licensing documentation
  - `ex-soen-lc__licensing-decisions.md` — Document all non-OSI and copyleft licensing decisions
    (filename follows hierarchical prefix convention; confirm exact token before creating):
    - **Liquibase FSL-1.1-ALv2**: Why kept (non-compete does not apply to this project; we are an
      enterprise platform, not a competing migration tool). Lists affected apps
      (`demo-be-java-springboot`, `demo-be-java-vertx`). Notes that FSL converts to Apache 2.0
      after 2 years.
    - **Hibernate LGPL-2.1**: Dynamic linking via JPA SPI justification
    - **sharp-libvips LGPL-3.0**: Dynamic native addon justification
    - **Logback EPL-1.0/LGPL-2.1**: EPL-1.0 elected
    - **Audit schedule**: Quarterly or on major dependency upgrades
  - Verify `ex-soen-lc__licensing-decisions.md` has complete frontmatter (title, description,
    category, subcategory, tags, created, updated) matching the existing governance doc pattern
- [ ] Update `docs/explanation/software-engineering/README.md`:
  - Add "Licensing" section entry linking to the new `licensing/` subdirectory
- [ ] Review `docs/explanation/README.md`:
  - Update if it references subdirectories of `software-engineering/`
- [ ] Review `specs/apps/demo/c4/component-be.md`:
  - Add migration tool as a component in C4 diagram if not already present
- [ ] Commit: `docs(governance): generalize database audit trail pattern, add licensing decisions`
  - Note: consider a separate commit for the C4 specs update (`chore(specs): add migration tool
component to C4 backend diagram`) if the change is substantial enough to warrant it.

### Phase 6: Local Validation

- [ ] `nx affected -t test:quick` passes for all modified apps
- [ ] `nx affected -t test:integration` passes for all modified apps with docker-compose
- [ ] Each app's migration produces the same schema as the current programmatic approach
- [ ] Verify idempotency: running each app twice does not fail on already-applied migrations
- [ ] Verify all 8 app READMEs have a "Database Migrations" section
- [ ] Verify `database-audit-trail.md` includes the "Migration Tool by Language" table
- [ ] Verify `ex-soen-lc__licensing-decisions.md` documents Liquibase FSL-1.1-ALv2 decision with rationale
- [ ] Verify no remaining `AutoMigrate()`, `create_all()`, `EnsureCreated()`, `create-schema!`, or
      inline DDL `CREATE TABLE` calls in modified apps (except within migration files themselves).
      Use the following to check:
      `bash
grep -r "AutoMigrate\|create_all\|EnsureCreated\|create-schema!" \
  apps/demo-be-* \
  --include="*.go" --include="*.py" --include="*.fs" --include="*.clj" --include="*.ts"
`
- [ ] Verify all Dockerfiles, docker-compose files, and GitHub Actions workflows still work

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
