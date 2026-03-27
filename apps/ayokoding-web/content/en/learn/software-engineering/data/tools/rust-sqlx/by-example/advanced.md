---
title: "Advanced"
date: 2026-03-27T00:00:00+07:00
draft: false
weight: 10000003
description: "Rust SQLx advanced tutorial with 25 annotated examples covering programmatic migration, zero-downtime patterns, CI/CD integration, and production best practices (75-95% coverage)"
tags: ["rust-sqlx", "tutorial", "by-example", "advanced", "zero-downtime", "ci-cd", "production", "monitoring"]
---

## Advanced Examples (61-85)

**Coverage**: 75-95% of SQLx migration functionality

**Focus**: Programmatic migration control, zero-downtime schema changes, CI/CD integration, production safety patterns, monitoring, and multi-tenant deployments.

These examples assume you understand beginner and intermediate concepts. All examples are self-contained and demonstrate production-grade patterns ready for high-stakes deployments.

---

### Example 61: Programmatic Migration with Migrator

The `Migrator` struct gives you fine-grained control over which migrations run and when. Rather than applying every unapplied migration at startup, you can inspect pending migrations, apply them selectively, and respond to results in code.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
%% Migrator API: inspect, filter, and apply migrations programmatically
graph TD
    A["sqlx::migrate! macro"] -->|"embeds files at compile time"| B["Migrator struct"]
    B -->|"migrations()"| C["List of Migration objects"]
    C -->|"inspect version/description"| D["Filtered subset"]
    D -->|"run_direct on pool"| E["Apply to database"]
    E -->|"success"| F["_sqlx_migrations updated"]
    E -->|"failure"| G["Error returned to caller"]

    style A fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style B fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style C fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style D fill:#CA9161,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style E fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style F fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style G fill:#CC78BC,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

```rust
use sqlx::migrate::Migrator;
use sqlx::AnyPool;

// => Migrator loaded at compile time from the migrations directory
// => All migration files are embedded into the binary as byte slices
static MIGRATOR: Migrator = sqlx::migrate!("./migrations");

async fn list_pending_migrations(pool: &AnyPool) -> Result<(), sqlx::Error> {
    // => migrations() returns a slice of all known migrations
    let all = MIGRATOR.migrations.iter();
    // => Iterate over compiled-in migrations to inspect them before running

    for migration in all {
        println!(
            "Version: {:>8}  Description: {}",
            migration.version,
            // => migration.version is i64 (parsed from filename prefix)
            migration.description
            // => migration.description is the filename suffix after the version
        );
    }
    // => Output: structured list of all migrations regardless of applied status

    // => run() applies all unapplied migrations in version order
    MIGRATOR.run(pool).await?;
    // => Acquires an advisory lock, applies pending migrations, releases lock
    // => Returns Err if any migration fails; already-applied migrations are skipped

    Ok(())
    // => All pending migrations applied; caller can proceed with application startup
}
```

**Key Takeaway**: Use the `Migrator` struct directly for programmatic control. `migrations` lets you inspect embedded migrations before running, while `run()` applies all pending ones atomically.

**Why It Matters**: The `sqlx::migrate!` macro compiles migration files into the binary, making the application self-contained with no dependency on the migrations directory at runtime. The `Migrator` API exposes version numbers and descriptions so pre-flight checks can verify the expected migrations are present before touching the database. Production deployments can log every applied migration to observability pipelines for auditing, and CI can assert the exact set of migrations in a binary before promoting it to production.

---

### Example 62: Custom Migration Source

Implement `MigrationSource` to load migrations from a source other than the filesystem—a database table, an HTTP endpoint, an encrypted bundle, or an in-memory collection generated at runtime.

```rust
use sqlx::migrate::{Migration, MigrationSource, MigrationType};
use std::borrow::Cow;

// => Custom source that reads migration SQL from an in-memory Vec
// => In production you might fetch from a configuration database or secret store
struct InMemorySource {
    migrations: Vec<(i64, &'static str, &'static str)>,
    // => Tuple: (version, description, sql)
}

impl<'s> MigrationSource<'s> for InMemorySource {
    // => MigrationSource: trait that SQLx calls to resolve migration list
    fn resolve(
        self,
    ) -> futures::future::BoxFuture<
        's,
        Result<Vec<Migration>, Box<dyn std::error::Error + Send + Sync>>,
    > {
        Box::pin(async move {
            // => Box::pin wraps the async block into a BoxFuture (heap-allocated)
            self.migrations
                .into_iter()
                .map(|(version, description, sql)| {
                    // => Convert each tuple into a Migration struct
                    Ok(Migration::new(
                        version,
                        // => Version number determines execution order
                        Cow::Borrowed(description),
                        // => Cow::Borrowed avoids allocation when using static strs
                        MigrationType::Simple,
                        // => Simple: single SQL string (no separate down migration)
                        Cow::Borrowed(sql),
                        // => The SQL content to execute for this migration
                        false,
                        // => no_tx: false means wrap in transaction (recommended)
                    ))
                })
                .collect()
            // => Collects Ok(Migration) items into Result<Vec<Migration>>
        })
    }
}

async fn run_custom_source(pool: &sqlx::PgPool) -> Result<(), Box<dyn std::error::Error>> {
    let source = InMemorySource {
        migrations: vec![
            (
                1,
                "create_tenants",
                "CREATE TABLE IF NOT EXISTS tenants (id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL);",
                // => IF NOT EXISTS: idempotent DDL safe to run multiple times
            ),
            (
                2,
                "create_tenant_settings",
                "CREATE TABLE IF NOT EXISTS tenant_settings (tenant_id BIGINT PRIMARY KEY REFERENCES tenants(id), plan TEXT NOT NULL DEFAULT 'free');",
                // => Separate settings table follows single-responsibility principle
            ),
        ],
    };

    sqlx::migrate::Migrator::new(source)
        .await?
        // => Migrator::new resolves the source and sorts migrations by version
        .run(pool)
        .await?;
        // => Apply resolved migrations to the pool; records in _sqlx_migrations

    Ok(())
}
```

**Key Takeaway**: Implement `MigrationSource` to decouple migration content from the filesystem. Any async source—database rows, S3 objects, or generated SQL—can feed the SQLx migration engine.

**Why It Matters**: Some production environments prohibit file system access at runtime (read-only container images, sandboxed runtimes) or need migrations managed as data rather than code (multi-tenant SaaS where different tenants get different schema sets). Custom migration sources keep the SQLx migration machinery—atomic application, checksum tracking, advisory locking—while replacing the default file resolver. This is also useful for testing: generate migration SQL from structs in test setup code without creating temporary files.

---

### Example 63: Zero-Downtime Column Addition

Adding a nullable column with a default requires only an `ALTER TABLE` that takes a brief metadata lock. The table remains fully readable and writable during the migration because PostgreSQL does not rewrite existing rows.

```sql
-- File: migrations/20240201000000_add_nullable_column.sql
-- => Phase 1 of zero-downtime column addition: add nullable column
-- => PostgreSQL adds nullable columns without rewriting the table

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS preferences JSONB;
-- => ADD COLUMN IF NOT EXISTS: idempotent; safe to run on already-migrated databases
-- => JSONB: binary JSON; no DEFAULT here means existing rows have NULL preferences
-- => This ALTER takes only an AccessExclusiveLock for milliseconds (metadata only)
-- => No table rewrite: existing rows are not touched

-- => Phase 2 (separate migration or background job): backfill the default value
-- => Do NOT add DEFAULT with UPDATE here; that rewrites the entire table
-- => Instead: set server-side default for new rows, backfill old rows separately
ALTER TABLE users
    ALTER COLUMN preferences SET DEFAULT '{}';
-- => Future INSERT statements will use '{}' when preferences is omitted
-- => Existing NULL rows are NOT updated by this statement
-- => Table is still online; no rows were rewritten
```

**Key Takeaway**: Add columns as nullable first, then set a DEFAULT for future rows in a separate statement. Backfill existing rows in a separate batched job to avoid locking the table.

**Why It Matters**: Adding a column with a non-null DEFAULT in PostgreSQL before version 11 caused a full table rewrite, locking the table for minutes on large tables. Even on PostgreSQL 11+, where the rewrite is avoided by storing the default in catalog, combining `ADD COLUMN` with an `UPDATE` to backfill all rows in a single migration locks the table for the duration of the update. Zero-downtime deployments require keeping each DDL statement fast and lock-duration short. The pattern is: add column nullable → set default for new rows → backfill old rows in batches → add NOT NULL constraint only after backfill is complete.

---

### Example 64: Zero-Downtime Column Removal (3-Phase)

Removing a column safely requires three deployment cycles to avoid errors when old application code tries to reference a column that no longer exists.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
%% 3-phase zero-downtime column removal
graph LR
    A["Deploy 1:<br/>App ignores column"] -->|"no reads/writes"| B["Deploy 2:<br/>Migration drops column"]
    B -->|"column gone"| C["Deploy 3:<br/>Cleanup code"]

    style A fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style B fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style C fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

**Phase 1 migration: mark column as deprecated in a comment (no SQL change yet)**

```sql
-- File: migrations/20240201010000_deprecate_legacy_column.sql
-- => Phase 1: No DDL change. Application code updated in this deploy to
-- => stop reading and writing the legacy_notes column.
-- => The column still exists so old pods (during rolling deploy) do not error.
-- => Add a comment to the column documenting removal intent and timeline.

COMMENT ON COLUMN users.legacy_notes IS 'DEPRECATED: removed in migration 20240201020000. Do not reference in new code.';
-- => COMMENT is metadata only; takes no lock on table data
-- => Documents intent in the database catalog for any future schema inspectors
```

**Phase 2 migration: drop the column after all application instances are updated**

```sql
-- File: migrations/20240201020000_drop_legacy_column.sql
-- => Phase 2: All application instances no longer reference legacy_notes.
-- => Safe to drop the column now.

ALTER TABLE users
    DROP COLUMN IF EXISTS legacy_notes;
-- => DROP COLUMN IF EXISTS: idempotent; no error if already removed
-- => Takes AccessExclusiveLock briefly for catalog update
-- => Column data is reclaimed by VACUUM; not immediately freed on disk
-- => After this migration: any old code referencing legacy_notes would error on SELECT
```

**Key Takeaway**: Remove columns in three phases: (1) stop using the column in code, (2) drop the column after all instances are updated, (3) remove any remaining references from dead code or indexes.

**Why It Matters**: Dropping a column while the old application version is still serving requests (during a rolling deployment) causes immediate query failures. The three-phase approach ensures the database schema is always a superset of what all running application versions need. Phase 1 makes old and new code compatible. Phase 2 runs only after the entire fleet has deployed the new code. This same pattern—application compatibility first, schema change second—applies to renaming columns, changing column types, and splitting tables.

---

### Example 65: Zero-Downtime Table Rename

Renaming a table while the application is running breaks queries in the old code. The safe approach uses a view as an alias during the transition window.

```sql
-- File: migrations/20240201030000_rename_table_phase1.sql
-- => Phase 1: Create new table with the target name; keep old table alive
-- => Application still writes to old table name in this deploy

CREATE TABLE user_profiles (
    -- => New canonical table name
    LIKE users INCLUDING ALL
    -- => LIKE ... INCLUDING ALL: copies columns, constraints, indexes, defaults
    -- => Does NOT copy data; creates empty table with identical structure
);
-- => user_profiles table now exists; old users table unchanged

-- => Create view so new-name references resolve during transition
CREATE OR REPLACE VIEW users_v2 AS SELECT * FROM user_profiles;
-- => Applications reading users_v2 see user_profiles data
-- => This view is the bridge for any new code referencing the new name before rename completes
```

```sql
-- File: migrations/20240201040000_rename_table_phase2.sql
-- => Phase 2: All code uses new name; drop old table and any transition views

DROP VIEW IF EXISTS users_v2;
-- => Transition view no longer needed; new code reads user_profiles directly

-- => If old table had data and you migrated it in between deploys:
-- => DROP TABLE users; (only after confirming data migration complete)
-- => For a true rename with data: use ALTER TABLE ... RENAME TO
ALTER TABLE users RENAME TO user_profiles;
-- => Atomic rename: takes AccessExclusiveLock for milliseconds
-- => All indexes and constraints on users are automatically renamed too
-- => Sequences (from SERIAL/BIGSERIAL) retain their names; rename manually if needed
```

**Key Takeaway**: Use a view as an alias during table rename transitions. The view keeps old queries working while new code adopts the new name. Complete the rename only after all instances use the new name.

**Why It Matters**: `ALTER TABLE ... RENAME TO` is fast and atomic, but it breaks any active query that references the old name by string—including stored procedures, other views, and any application code still running on old pods during a rolling deploy. Views bridge the gap by making both names resolve to the same data. The three-phase approach (create view alias → migrate application code → rename and drop view) ensures no query ever references a name that does not exist in the catalog.

---

### Example 66: Large Table Migration with Batched Updates

Updating every row in a large table in a single transaction holds a row-level lock on every affected row for the entire operation duration, blocking concurrent writes.

```sql
-- File: migrations/20240201050000_backfill_status_column.sql
-- => Backfill a new column in batches to avoid long-held row locks
-- => Run this as a background job, not in a startup migration

DO $$
DECLARE
    batch_size INTEGER := 1000;
    -- => Process 1000 rows per batch; tune based on table size and write traffic
    last_id BIGINT := 0;
    -- => Cursor position: start from the beginning
    rows_updated INTEGER;
    -- => Track rows updated in each batch to detect completion
BEGIN
    LOOP
        UPDATE orders
        SET status_normalized = LOWER(TRIM(status))
        -- => Normalize status: lowercase and strip whitespace
        -- => Written to new column; old column unchanged (backward compatible)
        WHERE id > last_id
          AND id <= last_id + batch_size
          AND status_normalized IS NULL;
        -- => Only update rows not yet backfilled; WHERE IS NULL makes idempotent
        -- => Range scan uses primary key index; efficient even on large tables

        GET DIAGNOSTICS rows_updated = ROW_COUNT;
        -- => ROW_COUNT: number of rows affected by the last UPDATE statement
        EXIT WHEN rows_updated = 0;
        -- => No rows updated means we have passed all NULL rows; stop

        last_id := last_id + batch_size;
        -- => Advance cursor to next batch

        PERFORM pg_sleep(0.01);
        -- => 10ms pause between batches: yields to concurrent writers
        -- => Prevents this backfill from monopolizing I/O bandwidth
    END LOOP;
END $$;
-- => After this: all pre-existing rows have status_normalized set
-- => New rows get status_normalized set by application code or trigger
```

**Key Takeaway**: Backfill large tables in batches with a short sleep between iterations. Use a cursor condition (`WHERE id > last_id`) and an idempotency guard (`WHERE column IS NULL`) so the job is safe to restart.

**Why It Matters**: A single `UPDATE orders SET ...` with no WHERE clause on a 100-million-row table runs for hours, holds row locks that block concurrent writes, and fills the WAL (write-ahead log) with a single enormous transaction. Batched updates bound each transaction to milliseconds, release row locks frequently, and allow the WAL to checkpoint between batches. The `pg_sleep` pause gives concurrent writes breathing room. If the job crashes midway, the `WHERE status_normalized IS NULL` guard restarts it from where it left off without re-processing already-updated rows.

---

### Example 67: Online Index Creation (CONCURRENTLY)

`CREATE INDEX CONCURRENTLY` builds an index without holding a lock that blocks writes. The database performs multiple passes over the table while other transactions continue reading and writing.

```sql
-- File: migrations/20240201060000_add_concurrent_index.sql
-- => CREATE INDEX CONCURRENTLY: does not block reads or writes
-- => Takes longer than regular CREATE INDEX but safe for production tables

-- IMPORTANT: CONCURRENTLY cannot run inside an explicit transaction block
-- => SQLx wraps migrations in transactions by default
-- => Use the no_tx annotation or run this migration outside transaction context

-- no_tx
-- => This comment instructs SQLx to NOT wrap this migration in a transaction
-- => Required for CONCURRENTLY statements; PostgreSQL enforces this restriction

CREATE INDEX CONCURRENTLY IF NOT EXISTS
    idx_orders_customer_id_status
ON orders (customer_id, status);
-- => Composite index on (customer_id, status): optimizes queries filtering both
-- => IF NOT EXISTS: idempotent; safe to run if index was partially created before
-- => CONCURRENTLY: scans table multiple times while accepting concurrent writes
-- => Index is marked INVALID during build; becomes VALID when complete
-- => If CONCURRENTLY fails: index left in INVALID state; drop and recreate

-- => Verify index after creation:
-- => SELECT indexname, indisvalid FROM pg_indexes JOIN pg_index ON ...
-- => WHERE indexname = 'idx_orders_customer_id_status';
```

**Key Takeaway**: Use `CREATE INDEX CONCURRENTLY` for production tables to avoid write locks during index creation. Mark the migration `no_tx` because PostgreSQL does not allow `CONCURRENTLY` inside a transaction block.

**Why It Matters**: A regular `CREATE INDEX` takes an `ShareLock` that blocks all writes for the duration of the build—potentially minutes on a large table. `CONCURRENTLY` trades build time (roughly 2-3x longer) for zero write downtime. The tradeoff is that a failed concurrent index build leaves an invalid index that must be manually dropped and recreated. Production teams should monitor `pg_indexes` after deployment to verify no `INVALID` indexes remain. The `no_tx` annotation in SQLx tells the migration runner to skip the surrounding transaction, which is the only way to run `CONCURRENTLY` inside a migration file.

---

### Example 68: Data Backfill Migration Pattern

A data backfill migration transforms existing data to satisfy a new schema constraint. The pattern separates the DDL change from the data transformation to keep each step fast and independently rollbackable.

```sql
-- File: migrations/20240201070000_backfill_user_slugs.sql
-- => Add a slug column and backfill from username; add unique constraint after

-- Step 1: Add column as nullable; no table rewrite
ALTER TABLE users ADD COLUMN IF NOT EXISTS slug TEXT;
-- => Nullable: existing rows have NULL slug; no DEFAULT avoids table rewrite

-- Step 2: Backfill slugs from usernames using SQL string functions
UPDATE users
SET slug = LOWER(REGEXP_REPLACE(username, '[^a-zA-Z0-9]+', '-', 'g'))
-- => REGEXP_REPLACE: replace sequences of non-alphanumeric chars with hyphen
-- => LOWER: normalize to lowercase for consistent URL-safe slugs
WHERE slug IS NULL;
-- => Idempotency guard: only update rows without a slug
-- => For large tables: replace with a batched DO $$ loop (see Example 66)

-- Step 3: Add NOT NULL constraint after backfill
ALTER TABLE users ALTER COLUMN slug SET NOT NULL;
-- => Safe now because all rows have a non-null slug
-- => PostgreSQL validates constraint without rewriting the table (catalog change)

-- Step 4: Add unique index on the populated column
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_slug_unique ON users (slug);
-- => Unique index created after data is clean; fails if duplicates exist
-- => If duplicates: de-duplicate in Step 2 before adding this constraint
```

**Key Takeaway**: Separate DDL (column addition) from DML (backfill UPDATE) from constraint addition. Each step is independently verifiable and the sequence is safe to resume after partial failure.

**Why It Matters**: Combining column addition, data migration, and constraint enforcement in a single transaction creates a migration that takes as long as the slowest step and holds locks for the entire duration. Breaking it into steps means each lock is brief: the ALTER adds a nullable column (milliseconds), the UPDATE backfills data (seconds to minutes but row-level locks), and the final ALTER adds a constraint (milliseconds after verification). If the backfill UPDATE fails midway, the idempotency guard (`WHERE slug IS NULL`) allows the migration to be re-run without corrupting already-processed rows.

---

### Example 69: Migration in CI/CD Pipeline

Run migrations as a dedicated step in your CI/CD pipeline before deploying new application code. The migration step connects to the target database, applies pending migrations, and fails the pipeline if any migration errors.

```rust
// => ci_migrate/main.rs: standalone binary for CI migration step
// => Build with: cargo build --bin ci_migrate
// => Run with: ./ci_migrate in your pipeline before deploying the main binary

use sqlx::postgres::PgPoolOptions;
use std::process;

#[tokio::main]
async fn main() {
    // => Structured logging: use tracing in production for JSON log output
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set for migration step");
    // => DATABASE_URL: connection string from CI environment; never hardcode

    let pool = PgPoolOptions::new()
        .max_connections(1)
        // => Single connection sufficient for sequential migration execution
        .connect(&database_url)
        .await
        .unwrap_or_else(|e| {
            eprintln!("ERROR: Cannot connect to database: {e}");
            // => Print error to stderr so CI captures it in failure logs
            process::exit(1);
            // => Non-zero exit code fails the CI step; pipeline halts
        });

    let result = sqlx::migrate!("./migrations")
        .run(&pool)
        .await;
    // => sqlx::migrate! embeds files at compile time; no filesystem access at runtime

    match result {
        Ok(()) => {
            println!("Migrations applied successfully");
            // => Print to stdout; CI captures this in success logs
            process::exit(0);
            // => Zero exit code: CI step passes; next step (deploy) proceeds
        }
        Err(e) => {
            eprintln!("ERROR: Migration failed: {e}");
            // => Detailed error to stderr for debugging
            process::exit(1);
            // => Non-zero exit: pipeline halts; existing deployment untouched
        }
    }
}
```

**Key Takeaway**: Build a dedicated `ci_migrate` binary that applies migrations and exits with a non-zero code on failure. Run it as a pipeline step before deploying application code.

**Why It Matters**: Running migrations at application startup means a failed migration crashes the new application pod but leaves the old pods running against a partially-migrated database. Separating migration into its own CI step means the pipeline fails before any application code is deployed, leaving the existing deployment untouched and the database in its pre-migration state. The CI migration binary should be built from the same commit as the application binary to guarantee the embedded migrations match the application code that depends on them.

---

### Example 70: Compile-Time Verification (sqlx prepare)

`sqlx prepare` generates a `sqlx-data.json` query cache that enables compile-time SQL verification without a live database connection. The cached metadata is committed to the repository so CI can verify queries without connecting to a database.

```bash
# Run against a live database to generate the cache
# => DATABASE_URL must point to a database with all migrations applied
DATABASE_URL=postgres://user:pass@localhost/mydb sqlx prepare
# => Connects to DATABASE_URL and validates all sqlx::query! macros
# => Generates: .sqlx/ directory with one JSON file per unique query
# => JSON files contain: column names, types, nullability, parameter types
# => Commit .sqlx/ to the repository

# Verify the cache is up to date (run in CI without a live database)
cargo sqlx prepare --check
# => Reads .sqlx/ JSON files instead of connecting to a database
# => Fails if any query! macro no longer matches the cached metadata
# => Catches: renamed columns, changed return types, added NOT NULL constraints
# => Returns exit code 1 if cache is stale; CI step fails

# Regenerate after schema changes
DATABASE_URL=postgres://user:pass@localhost/mydb cargo sqlx prepare
# => Re-run whenever migrations change column names, types, or add/remove columns
# => Commit the updated .sqlx/ files alongside the migration that caused the change
```

```rust
// => In src/db/users.rs: query! macro verified at compile time against .sqlx/
use sqlx::PgPool;

async fn fetch_user_by_id(pool: &PgPool, user_id: i64) -> Result<Option<String>, sqlx::Error> {
    let row = sqlx::query!(
        // => query! macro: SQL verified against .sqlx/query-*.json at compile time
        "SELECT username FROM users WHERE id = $1",
        user_id
        // => $1: PostgreSQL positional parameter; type inferred as i64 from Rust type
    )
    .fetch_optional(pool)
    .await?;
    // => fetch_optional: returns None if no row matches; avoids RowNotFound error

    Ok(row.map(|r| r.username))
    // => r.username: compile-time guaranteed field; type inferred as String from schema
}
```

**Key Takeaway**: Run `sqlx prepare` after every migration to update `.sqlx/` query cache. Commit the cache to the repository so `cargo sqlx prepare --check` in CI verifies SQL without a live database.

**Why It Matters**: The `query!` macro without offline mode requires a live database at compile time, making CI builds fragile and slow. The `sqlx prepare` workflow splits the verification: a developer with a live database regenerates the cache, commits it, and CI simply checks that the cache matches the current SQL without connecting to anything. If a migration renames a column but the application query still references the old name, `prepare --check` fails the CI build before any code reaches production. This is one of SQLx's most powerful safety properties: the compiler becomes a database schema linter.

---

### Example 71: Migration Rollback Testing

Write rollback tests that apply migrations forward, verify the schema is correct, roll back the last migration, and verify the schema returns to its previous state.

```rust
use sqlx::sqlite::SqlitePoolOptions;
use sqlx::migrate::Migrator;

// => rollback_test: apply migrations up to N, verify, roll back, verify again
async fn test_migration_rollback() -> Result<(), sqlx::Error> {
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await?;
    // => In-memory SQLite: fast, isolated, destroyed when pool drops

    let migrator = sqlx::migrate!("./migrations");
    // => Load all migrations at compile time

    migrator.run(&pool).await?;
    // => Apply all migrations; schema is at latest version

    // => Verify a column added by the latest migration exists
    let result = sqlx::query("SELECT slug FROM users LIMIT 0")
        .execute(&pool)
        .await;
    assert!(result.is_ok(), "slug column should exist after migration");
    // => LIMIT 0: validates column exists without fetching data

    migrator.undo(&pool, 1).await?;
    // => undo(pool, count): rolls back `count` migrations from the current version
    // => Requires .down.sql reversible migration files for each undone migration
    // => Removes the migration record from _sqlx_migrations

    // => Verify the column no longer exists after rollback
    let result_after = sqlx::query("SELECT slug FROM users LIMIT 0")
        .execute(&pool)
        .await;
    assert!(result_after.is_err(), "slug column should be gone after rollback");
    // => Query fails with database error: column does not exist

    Ok(())
    // => Test verifies both apply and rollback paths are working correctly
}
```

**Key Takeaway**: Use `migrator.undo(pool, 1)` in tests to verify rollback SQL in `.down.sql` files. Automated rollback tests prevent deploying migrations that cannot be reversed in emergencies.

**Why It Matters**: Migration rollback is the last line of defense when a production deployment goes wrong. Teams that never test rollbacks discover too late that their `.down.sql` files have syntax errors or leave the database in an inconsistent state. Automated rollback tests catch these failures during development. The test pattern—apply all migrations, assert new schema, roll back one, assert old schema—runs in under a second on SQLite and can be part of the standard unit test suite. Every reversible migration should have a corresponding rollback test.

---

### Example 72: Blue-Green Deployment Migrations

Blue-green deployments run two identical production environments (blue and green). The migration must leave the database schema compatible with both the old (blue) and new (green) application versions simultaneously during the traffic switch.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
%% Blue-green migration: schema must be compatible with both versions simultaneously
graph TD
    A["Blue env: old app code"] -->|"reads/writes"| DB["Shared database"]
    B["Green env: new app code"] -->|"reads/writes"| DB
    C["Migration applied to DB"] -->|"before traffic switch"| DB
    D["Load balancer"] -->|"switch traffic"| B

    style A fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style B fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style C fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style D fill:#CA9161,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style DB fill:#CC78BC,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

```sql
-- File: migrations/20240201100000_blue_green_compatible_add_column.sql
-- => This migration must be forward-compatible: blue app ignores new column
-- => Green app reads and writes the new column
-- => Both versions must operate correctly on this schema simultaneously

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS fulfillment_method TEXT;
-- => Nullable column: blue app never sets it (rows have NULL); that is acceptable
-- => Green app writes fulfillment_method on new orders
-- => Blue app queries omit this column from SELECT; PostgreSQL ignores it
-- => If traffic switch fails: blue app runs against schema with extra nullable column
-- => Extra nullable column with no NOT NULL constraint never breaks old queries

-- => What NOT to do in a blue-green migration:
-- => DO NOT: DROP COLUMN (breaks blue app immediately)
-- => DO NOT: ADD COLUMN ... NOT NULL without DEFAULT (breaks blue INSERT)
-- => DO NOT: RENAME COLUMN (breaks both apps)
-- => DO NOT: change column type (breaks both apps)
```

**Key Takeaway**: Blue-green compatible migrations must be purely additive. Add nullable columns, new tables, and new indexes. Never drop, rename, or change column types during the migration that precedes a blue-green traffic switch.

**Why It Matters**: Blue-green deployment reduces risk by keeping the old environment live until the new one is verified. But both environments share the same database, so any schema change must be backward-compatible with the old application code. A migration that drops a column or renames a table will cause the old (blue) application to fail immediately on its next query, eliminating the safety net the blue-green pattern is meant to provide. Teams that practice blue-green deployments need a strict additive-only policy for any migration deployed during the traffic-switch window.

---

### Example 73: Feature Flag Migration Pattern

Feature flag migrations add schema behind a feature flag that gates access in application code. The schema exists in the database before the feature is enabled, making it easy to roll back the flag without a schema rollback.

```sql
-- File: migrations/20240201110000_add_ai_recommendations_schema.sql
-- => Schema for AI recommendation feature; deployed before feature flag is enabled
-- => Application code checks feature_flags table before using these tables

CREATE TABLE IF NOT EXISTS ai_recommendations (
    id BIGSERIAL PRIMARY KEY,
    -- => Surrogate key for the recommendation record
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- => User this recommendation targets; cascade delete cleans up on user removal
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    -- => Product recommended; cascade delete removes stale recommendations
    score DOUBLE PRECISION NOT NULL,
    -- => Recommendation confidence score; DOUBLE PRECISION is IEEE 754 64-bit float
    generated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    -- => When the recommendation was computed; enables cache expiry logic
);
-- => Table exists but no application code writes to it yet; feature flag is off

CREATE TABLE IF NOT EXISTS feature_flags (
    name TEXT PRIMARY KEY,
    -- => Flag name is the primary key; direct lookup by name is O(1)
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    -- => Master switch; application checks this before using flagged features
    enabled_for_user_ids BIGINT[] DEFAULT '{}',
    -- => Optional: array of user IDs for gradual rollout; empty means all or none
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- => Feature flags table; insert rows here to control feature availability

INSERT INTO feature_flags (name, enabled) VALUES ('ai_recommendations', FALSE)
ON CONFLICT (name) DO NOTHING;
-- => Insert flag with enabled=FALSE; ON CONFLICT DO NOTHING makes this idempotent
-- => Enable the feature in production by: UPDATE feature_flags SET enabled = TRUE WHERE name = 'ai_recommendations';
```

**Key Takeaway**: Deploy schema before enabling the feature flag. The schema exists in the database ahead of the code that uses it, making the flag toggle a data change with no schema risk.

**Why It Matters**: Tying feature rollout to schema deployments couples two risky operations together. If a new feature causes problems, rolling it back requires both a schema rollback (risky, potentially destructive) and a code rollback. Feature flag migrations decouple these concerns: the schema is deployed safely in advance, the feature is enabled by flipping a flag in the database, and disabling the feature is a single-row UPDATE with no schema change. The `enabled_for_user_ids` array enables percentage rollouts for canary testing before full enablement.

---

### Example 74: Multi-Tenant Schema Migration

Multi-tenant applications use one of three isolation strategies: shared tables with a `tenant_id` column, separate schemas per tenant, or separate databases per tenant. Migrations must handle whichever strategy is in use.

```rust
use sqlx::PgPool;

// => Multi-tenant migration: apply schema changes to all tenant schemas
// => Strategy: separate PostgreSQL schema per tenant (search_path isolation)
async fn migrate_all_tenants(pool: &PgPool) -> Result<(), sqlx::Error> {
    // => Fetch all tenant schema names from the registry table
    let tenants = sqlx::query_scalar::<_, String>(
        "SELECT schema_name FROM tenant_registry WHERE status = 'active'"
        // => Only migrate active tenants; skip suspended or deleted tenants
    )
    .fetch_all(pool)
    .await?;
    // => Returns Vec<String> of schema names like ["tenant_acme", "tenant_beta"]

    for tenant_schema in &tenants {
        // => Validate schema name before interpolation: prevent SQL injection
        // => In production: use a whitelist or stricter regex
        if !tenant_schema.chars().all(|c| c.is_alphanumeric() || c == '_') {
            return Err(sqlx::Error::Protocol(
                format!("Invalid schema name: {tenant_schema}")
            ));
            // => Reject schema names with unexpected characters; never interpolate untrusted input
        }

        sqlx::query(&format!(
            "ALTER TABLE {tenant_schema}.orders
             ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ"
            // => schema-qualified table name: {schema}.{table}
            // => IF NOT EXISTS: idempotent; safe if tenant was partially migrated
        ))
        .execute(pool)
        .await?;
        // => Apply DDL to this tenant's schema; error halts the loop

        println!("Migrated tenant: {tenant_schema}");
        // => Log progress; useful for diagnosing partial failures in large tenant sets
    }

    Ok(())
    // => All active tenant schemas have the new column
}
```

**Key Takeaway**: For schema-per-tenant setups, fetch tenant schema names from a registry table, validate each name against an allowlist, then apply DDL using schema-qualified table names. Log progress to identify which tenant a failure belongs to.

**Why It Matters**: Multi-tenant migrations at scale (hundreds or thousands of tenants) can take a long time and are prone to partial failure if one tenant's schema is in an unexpected state. The loop-and-log pattern makes it easy to resume a failed migration by checking which tenants were already processed. Schema name validation prevents injection attacks if tenant names come from user input. In practice, the migration runner should also record per-tenant migration state in a central table so the operator can see which tenants are at which version—the `_sqlx_migrations` table in each schema provides this per-tenant, but a central view across all tenants is essential for operational visibility.

---

### Example 75: Migration with pgcrypto Encryption

Use PostgreSQL's `pgcrypto` extension to encrypt sensitive columns at rest. The migration enables the extension and adds an encrypted column with helper functions.

```sql
-- File: migrations/20240201130000_add_encrypted_pii.sql
-- => Encrypt sensitive PII columns using pgcrypto symmetric encryption
-- => Requires PostgreSQL with pgcrypto extension available

CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- => Enables pgcrypto functions: pgp_sym_encrypt, pgp_sym_decrypt, gen_random_bytes
-- => IF NOT EXISTS: idempotent; safe on databases where pgcrypto is already enabled

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS ssn_encrypted BYTEA;
-- => BYTEA: binary column; stores the pgcrypto ciphertext as raw bytes
-- => NULL means SSN not collected for this user; nullable allows gradual migration

-- => Application code encrypts before INSERT/UPDATE:
-- => ssn_encrypted = pgp_sym_encrypt('123-45-6789', current_setting('app.encryption_key'))
-- => application.encryption_key must be set per connection or in postgresql.conf

-- => Verify encryption is working (test with a known value):
DO $$
DECLARE
    test_key TEXT := 'test-key-never-use-in-production';
    -- => Never hardcode real keys; this is a migration smoke test only
    test_value TEXT := '000-00-0000';
    -- => Synthetic test SSN; never use real SSNs in migration scripts
    encrypted BYTEA;
    decrypted TEXT;
BEGIN
    encrypted := pgp_sym_encrypt(test_value, test_key);
    -- => pgp_sym_encrypt: AES-128 by default; produces OpenPGP-format ciphertext
    decrypted := pgp_sym_decrypt(encrypted, test_key);
    -- => pgp_sym_decrypt: reverses encryption with the same key
    ASSERT decrypted = test_value, 'pgcrypto round-trip test failed';
    -- => ASSERT: raises an error if decrypted value does not match original
    -- => If this fails: pgcrypto extension is not functioning correctly
END $$;
-- => DO block runs and succeeds; migration proceeds only if pgcrypto works
```

**Key Takeaway**: Enable `pgcrypto` with `CREATE EXTENSION IF NOT EXISTS` and store encrypted data as `BYTEA`. Verify the extension works with a round-trip test in the migration's `DO` block before the schema change.

**Why It Matters**: Column-level encryption with pgcrypto protects data at the storage layer independently of filesystem or disk encryption. Even if a database backup is leaked, encrypted columns are unreadable without the encryption key. The migration smoke test catches environments where pgcrypto is listed but not functioning (library missing, permission issue) before any real data is encrypted. The `current_setting('app.encryption_key')` pattern allows the key to be injected per connection from application code without it appearing in the SQL schema or migration files.

---

### Example 76: Audit Trail Table Migration

An audit trail table captures every change to a target table with the old and new values, the operation type, the actor, and the timestamp. The migration creates the audit table and a trigger function that populates it automatically.

```sql
-- File: migrations/20240201140000_create_audit_trail.sql
-- => Audit trail: automatic change tracking via trigger
-- => Every INSERT/UPDATE/DELETE on orders is recorded in orders_audit

CREATE TABLE IF NOT EXISTS orders_audit (
    audit_id BIGSERIAL PRIMARY KEY,
    -- => Surrogate key for the audit record itself
    order_id BIGINT NOT NULL,
    -- => The order that was changed; NOT a foreign key (audit must survive order deletion)
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    -- => Operation type; CHECK constraint rejects invalid values
    changed_by TEXT NOT NULL DEFAULT current_user,
    -- => PostgreSQL role that performed the change; current_user is session role
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- => Wall-clock time of the change; always stored in UTC
    old_values JSONB,
    -- => JSONB snapshot of the row before the change; NULL for INSERTs
    new_values JSONB
    -- => JSONB snapshot of the row after the change; NULL for DELETEs
);
-- => Audit table created; no data yet

CREATE OR REPLACE FUNCTION audit_orders_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO orders_audit (order_id, operation, old_values, new_values)
    VALUES (
        COALESCE(NEW.id, OLD.id),
        -- => COALESCE: NEW.id for INSERT/UPDATE, OLD.id for DELETE
        TG_OP,
        -- => TG_OP: trigger operation string ('INSERT', 'UPDATE', or 'DELETE')
        CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN row_to_json(OLD)::JSONB ELSE NULL END,
        -- => OLD row as JSONB; NULL for INSERT (no previous state exists)
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW)::JSONB ELSE NULL END
        -- => NEW row as JSONB; NULL for DELETE (row no longer exists)
    );
    RETURN NEW;
    -- => Trigger must return NEW for AFTER triggers; ignored for AFTER but required
END;
$$ LANGUAGE plpgsql;
-- => PL/pgSQL function: runs inside the database engine; zero network roundtrips

CREATE OR REPLACE TRIGGER orders_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON orders
FOR EACH ROW EXECUTE FUNCTION audit_orders_changes();
-- => AFTER: fires after the row change is committed; OLD and NEW are both visible
-- => FOR EACH ROW: fires once per modified row (not once per statement)
```

**Key Takeaway**: Create an audit trigger that fires `AFTER INSERT OR UPDATE OR DELETE` and records `row_to_json(OLD)` and `row_to_json(NEW)` as JSONB. The `TG_OP` special variable identifies the operation.

**Why It Matters**: Application-level audit logging is fragile because it requires every code path to remember to call the logging function—direct SQL, background jobs, and admin tools all bypass application code. Database triggers audit every write regardless of source, making the audit trail tamper-resistant. Storing changes as JSONB snapshots captures the exact column values at the time of change, supporting point-in-time reconstruction of a row's history. The audit table avoids a foreign key to the orders table so audit records survive the deletion of the source row.

---

### Example 77: Soft Delete Schema Pattern

Soft delete marks rows as deleted without removing them from the database. The migration adds a `deleted_at` nullable timestamp column and a partial index to exclude deleted rows from normal queries efficiently.

```sql
-- File: migrations/20240201150000_add_soft_delete.sql
-- => Soft delete: mark rows as deleted instead of removing them
-- => Supports audit trails, recovery, and referential integrity with archived rows

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
-- => NULL means active (not deleted); timestamp means deleted at that moment
-- => TIMESTAMPTZ: timezone-aware; records the exact deletion moment in UTC

-- => Partial index on active rows only: queries filtering WHERE deleted_at IS NULL
-- => scan only this index, not the full table including soft-deleted rows
CREATE INDEX IF NOT EXISTS idx_products_active
ON products (id)
WHERE deleted_at IS NULL;
-- => Partial index: includes only rows where deleted_at IS NULL
-- => Size: proportional to active rows only; does not grow with deleted rows
-- => Query: SELECT * FROM products WHERE deleted_at IS NULL AND id = $1
-- => => Uses this index; skips deleted rows at index scan time

-- => Unique constraint on active rows only (allow same SKU for deleted products)
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_active_sku
ON products (sku)
WHERE deleted_at IS NULL;
-- => Partial unique index: two rows can have the same sku if one is deleted
-- => Allows re-using SKUs after soft-deleting a product
-- => INSERT with duplicate sku fails only when deleted_at IS NULL on both rows
```

**Key Takeaway**: Add a nullable `deleted_at TIMESTAMPTZ` column and create partial indexes filtered on `WHERE deleted_at IS NULL`. Partial indexes keep query performance high by excluding deleted rows from the index structure entirely.

**Why It Matters**: Hard deletes make data recovery after accidental deletion expensive (restore from backup, find the deleted rows, re-insert them). Soft deletes preserve the data while making it invisible to normal application queries. The key performance challenge is that indexes on soft-delete tables include all rows—active and deleted—bloating index size and slowing queries. Partial indexes solve this by including only active rows, keeping index size proportional to active data regardless of how many soft-deleted rows accumulate. The partial unique index on `sku` enables safe re-use of identifiers after archiving without violating uniqueness for active records.

---

### Example 78: Migration Performance Benchmarking

Benchmark migration execution time in a test database that mirrors production data volume. Slow migrations discovered in development cost minutes; slow migrations discovered in production cost hours of downtime.

```rust
use sqlx::postgres::PgPoolOptions;
use std::time::Instant;

// => Benchmark a specific migration against a test database with production-scale data
async fn benchmark_migration(database_url: &str) -> Result<(), sqlx::Error> {
    let pool = PgPoolOptions::new()
        .max_connections(2)
        // => Two connections: one for timing queries, one for migration
        .connect(database_url)
        .await?;

    // => Count rows before migration; determines scale of the operation
    let row_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM orders")
        .fetch_one(&pool)
        .await?;
    println!("Table size before migration: {row_count} rows");
    // => Output: Table size before migration: 15000000 rows

    let start = Instant::now();
    // => Instant::now(): monotonic clock; measures wall time, not CPU time
    // => Monotonic: immune to NTP adjustments and clock skew between calls

    // => Apply only the migration being benchmarked; use a dedicated test database
    sqlx::query(
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS region_code TEXT"
        // => The DDL statement from the migration file being tested
    )
    .execute(&pool)
    .await?;

    let elapsed = start.elapsed();
    // => Duration since start; accurate to nanoseconds on modern OSes

    println!("Migration completed in {:.3}s on {row_count} rows", elapsed.as_secs_f64());
    // => Output: Migration completed in 0.004s on 15000000 rows
    // => ADD COLUMN nullable: fast regardless of row count (metadata-only in PostgreSQL 11+)

    // => Threshold check: fail benchmark if migration exceeds acceptable duration
    let max_acceptable = std::time::Duration::from_secs(30);
    // => 30 seconds: conservative threshold for migrations during maintenance windows
    assert!(
        elapsed < max_acceptable,
        "Migration too slow: {:.1}s exceeds {:.1}s threshold",
        elapsed.as_secs_f64(),
        max_acceptable.as_secs_f64()
    );
    // => Assertion fails the benchmark test; investigate and optimize before production

    Ok(())
}
```

**Key Takeaway**: Time migrations against a clone of production data volume before deploying. Assertions on maximum duration make performance regressions visible in CI before they cause production outages.

**Why It Matters**: The execution time of `ADD COLUMN`, `CREATE INDEX`, and `UPDATE` statements scales with table size in ways that are not visible in a development database with a few hundred rows. A migration that takes 2ms on a 10,000-row development table might take 45 minutes on a 500-million-row production table. Benchmarking against production-scale data catches these surprises before deployment. Adding a `Duration` assertion converts the benchmark into a performance test that fails CI if a migration exceeds an acceptable threshold, preventing regressions as tables grow over time.

---

### Example 79: Schema Drift Detection

Schema drift occurs when a production database's schema diverges from what the migration files describe. Detect drift by comparing the live schema against the expected schema derived from migrations.

```rust
use sqlx::PgPool;
use std::collections::HashSet;

// => Detect schema drift: compare live columns against expected columns
async fn detect_schema_drift(
    pool: &PgPool,
    table: &str,
    // => Table to inspect; caller provides the table name to check
    expected_columns: &[&str],
    // => Column names as defined in migration files; source of truth
) -> Result<(), String> {
    let actual_columns: Vec<String> = sqlx::query_scalar(
        "SELECT column_name
         FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = $1
         ORDER BY ordinal_position"
        // => information_schema.columns: ANSI-standard catalog view; works on PostgreSQL and MySQL
    )
    .bind(table)
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Query failed: {e}"))?;
    // => map_err: convert sqlx::Error to String for simple reporting

    let expected: HashSet<&str> = expected_columns.iter().copied().collect();
    // => HashSet for O(1) lookup; order does not matter for drift detection
    let actual: HashSet<&str> = actual_columns.iter().map(String::as_str).collect();
    // => Convert Vec<String> to HashSet<&str> for comparison

    let missing: Vec<&&str> = expected.difference(&actual).collect();
    // => Columns in migrations but not in live database: someone dropped them manually
    let extra: Vec<&&str> = actual.difference(&expected).collect();
    // => Columns in live database but not in migrations: manually added outside migrations

    if !missing.is_empty() || !extra.is_empty() {
        return Err(format!(
            "Schema drift detected on table '{table}':\n  Missing: {missing:?}\n  Extra: {extra:?}"
            // => Detailed drift report: tells operator exactly which columns diverged
        ));
    }

    Ok(())
    // => No drift: live schema matches migration-defined schema exactly
}
```

**Key Takeaway**: Compare `information_schema.columns` against your expected column list to detect drift. Report missing columns (dropped outside migrations) and extra columns (added outside migrations) separately.

**Why It Matters**: Production databases drift from their declared schema when developers apply hotfixes directly with `psql`, when DBAs tune indexes and forget to update migration files, or when automated tooling modifies the schema outside the migration pipeline. Drift causes the next migration to fail in unexpected ways—for example, `ADD COLUMN IF NOT EXISTS` silently passes even if the column has a different type. Regular drift detection alerts the team before the divergence compounds. The `information_schema.columns` approach works on PostgreSQL, MySQL, and other ANSI-compatible databases, making drift detection portable across backends.

---

### Example 80: Migration Dependency Graph

Some migrations have logical dependencies: migration B adds a foreign key to a table created by migration A. Documenting these dependencies in code prevents out-of-order execution.

```rust
use std::collections::{HashMap, HashSet, VecDeque};

// => MigrationNode: represents one migration and its dependencies
#[derive(Debug, Clone)]
struct MigrationNode {
    version: i64,
    // => Version number from the migration filename
    description: String,
    // => Human-readable description of what this migration does
    depends_on: Vec<i64>,
    // => Version numbers this migration depends on being applied first
}

// => Topological sort: returns migrations in dependency-safe execution order
fn topological_sort(migrations: &[MigrationNode]) -> Result<Vec<i64>, String> {
    let mut in_degree: HashMap<i64, usize> = HashMap::new();
    // => in_degree: number of unresolved dependencies for each migration
    let mut dependents: HashMap<i64, Vec<i64>> = HashMap::new();
    // => dependents: which migrations become unblocked when this one completes

    for m in migrations {
        in_degree.entry(m.version).or_insert(0);
        // => Initialize every migration with zero unresolved dependencies
        for &dep in &m.depends_on {
            *in_degree.entry(m.version).or_insert(0) += 1;
            // => Each dependency increments the in-degree count
            dependents.entry(dep).or_default().push(m.version);
            // => Record that m.version is unblocked when dep completes
        }
    }

    let mut queue: VecDeque<i64> = in_degree
        .iter()
        .filter(|(_, &deg)| deg == 0)
        .map(|(&v, _)| v)
        .collect();
    // => Start with migrations that have no unresolved dependencies

    let mut order = Vec::new();
    while let Some(v) = queue.pop_front() {
        order.push(v);
        // => Add to execution order; this migration is safe to run now
        for &dependent in dependents.get(&v).unwrap_or(&vec![]) {
            let deg = in_degree.get_mut(&dependent).unwrap();
            *deg -= 1;
            // => Decrement dependency count: one dependency resolved
            if *deg == 0 {
                queue.push_back(dependent);
                // => All dependencies resolved: enqueue this migration
            }
        }
    }

    if order.len() != migrations.len() {
        return Err("Circular dependency detected in migrations".to_string());
        // => Topological sort incomplete: some nodes never reached in-degree 0
    }

    Ok(order)
    // => Returns versions in dependency-safe order: dependencies always before dependents
}
```

**Key Takeaway**: Model migrations as a directed acyclic graph with `depends_on` version lists. Use topological sort to validate that no circular dependencies exist and to determine a safe execution order.

**Why It Matters**: SQLx applies migrations by version number order, which usually implies the correct dependency order. But when migrations from multiple developers are merged, or when a migration file is renumbered, version order can diverge from dependency order. Explicit dependency tracking makes the intended order machine-verifiable. The topological sort also detects circular dependencies—migration A depending on B and B depending on A—that would deadlock any sequential execution strategy. This pattern is especially important for multi-tenant deployments where different tenant databases may be at different versions and need to catch up in the correct order.

---

### Example 81: Axum Integration Pattern (Startup Migrations)

Run migrations at Axum application startup before binding the HTTP server. If migrations fail, the application exits with a non-zero code before accepting any traffic.

```rust
use axum::{Router, routing::get};
use sqlx::postgres::PgPoolOptions;
use std::net::SocketAddr;

// => Application state shared across all Axum route handlers
#[derive(Clone)]
struct AppState {
    pool: sqlx::PgPool,
    // => Connection pool: cloned cheaply (Arc internally); shared across threads
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let database_url = std::env::var("DATABASE_URL")?;
    // => Fail immediately if DATABASE_URL is not set; no sensible default

    let pool = PgPoolOptions::new()
        .max_connections(10)
        // => Pool size: tune based on expected concurrent requests and DB capacity
        .connect(&database_url)
        .await?;
    // => Panic if database is unreachable; no point starting without DB

    // => Run migrations BEFORE starting the HTTP server
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Database migration failed; halting startup");
    // => expect: panics with message if migrations fail; process exits non-zero
    // => Container orchestrators (Kubernetes) see non-zero exit and restart/alert
    // => HTTP server never starts; no traffic accepted against stale schema

    tracing::info!("Migrations applied; starting HTTP server");
    // => Log after migrations: confirms schema is ready before accepting requests

    let state = AppState { pool };
    let app = Router::new()
        .route("/health", get(|| async { "ok" }))
        // => Health check: returns 200 OK; load balancer polls this
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    let listener = tokio::net::TcpListener::bind(addr).await?;
    // => Bind after migrations: first request hits a fully migrated database

    axum::serve(listener, app).await?;
    // => Block until shutdown signal; all routes have access to pool via state

    Ok(())
}
```

**Key Takeaway**: Run `sqlx::migrate!().run(&pool).await` before `axum::serve(listener, app).await`. The server never starts if migrations fail, ensuring no request is served against an unmigrated schema.

**Why It Matters**: An Axum application that starts accepting requests before migrations complete may serve requests with the old schema during the migration window, or crash when application code expects a column that does not yet exist. Running migrations synchronously at startup serializes the process: migrate first, serve second. Container orchestration systems treat a non-zero exit from the startup process as a deployment failure and will not route traffic to the new pod, preserving the old running pod until the new one is healthy. This startup pattern is the simplest correct approach for single-instance deployments; CI/CD-step migrations (Example 69) are preferred for high-traffic multi-instance deployments.

---

### Example 82: Connection Pool Tuning for Migrations

Migration execution uses a single database connection. Application query load uses many connections. Tuning the pool separately for migration and application workloads prevents migrations from consuming all available database connections.

```rust
use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
use std::str::FromStr;
use std::time::Duration;

// => Create a dedicated single-connection pool for migrations only
async fn migration_pool(database_url: &str) -> Result<sqlx::PgPool, sqlx::Error> {
    let options = PgConnectOptions::from_str(database_url)?
        // => Parse DATABASE_URL into typed options; validates URL format
        .application_name("myapp-migrations")
        // => application_name: visible in pg_stat_activity; helps DBA identify migration connections
        .statement_cache_capacity(0);
        // => Disable statement cache for the migration pool
        // => Migrations run DDL statements (not worth caching) and each runs once

    PgPoolOptions::new()
        .max_connections(1)
        // => Single connection: migrations are sequential; more connections waste resources
        .min_connections(0)
        // => min 0: release connection after migrations complete; no idle connection held
        .acquire_timeout(Duration::from_secs(30))
        // => 30s timeout: fail fast if DB is unavailable at startup
        .connect_with(options)
        .await
    // => Returns single-connection pool; caller runs migrations then drops the pool
}

// => Create a separate larger pool for application queries
async fn application_pool(database_url: &str) -> Result<sqlx::PgPool, sqlx::Error> {
    PgPoolOptions::new()
        .max_connections(20)
        // => 20 connections: sized for concurrent HTTP request handling
        // => Rule of thumb: (2 * CPU cores) + disk spindles; tune with pg_stat_activity
        .min_connections(2)
        // => Keep 2 idle connections warm; reduces first-request latency after idle periods
        .idle_timeout(Duration::from_secs(600))
        // => Release idle connections after 10 minutes; reclaims DB resources during low traffic
        .max_lifetime(Duration::from_secs(1800))
        // => Replace connections every 30 minutes; picks up parameter changes and avoids stale state
        .connect(database_url)
        .await
}
```

**Key Takeaway**: Create separate pools for migrations (1 connection, 0 min, short lifetime) and application queries (20+ connections, warm idle, long lifetime). Drop the migration pool after use to return the connection to PostgreSQL.

**Why It Matters**: Using the same pool for migrations and application queries creates contention: a long-running migration blocks application queries waiting to acquire a connection from the pool. Separate pools isolate the workloads. The migration pool's `min_connections(0)` setting ensures the connection is returned to PostgreSQL once migrations finish rather than sitting idle for the lifetime of the application. PostgreSQL has a hard limit on total connections (`max_connections`); every idle connection in a pool consumes one of those slots even when not in use.

---

### Example 83: Migration with Custom Error Types

Define a rich error type for migration failures that carries enough context for the caller to log structured errors, trigger alerts, and decide whether to retry or halt.

```rust
use std::fmt;

// => Rich migration error: structured enough for alerting and recovery decisions
#[derive(Debug)]
pub enum MigrationStartupError {
    // => Error variants correspond to different operational responses
    PoolConnection {
        url_host: String,
        // => Redacted host from DATABASE_URL; never log the password
        source: sqlx::Error,
        // => Original sqlx error for detailed diagnostics
    },
    // => PoolConnection: retry with backoff; database may still be starting
    MigrationChecksum {
        migration_version: i64,
        // => Which migration has the mismatched checksum
        source: sqlx::Error,
    },
    // => MigrationChecksum: halt and alert; migration file was modified after application
    MigrationExecution {
        migration_version: Option<i64>,
        // => Which migration failed; None if error occurred before version was known
        source: sqlx::Error,
    },
    // => MigrationExecution: halt and alert; SQL in migration file is invalid
}

impl fmt::Display for MigrationStartupError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::PoolConnection { url_host, source } => {
                write!(f, "Cannot connect to database at {url_host}: {source}")
                // => Includes host (not password) for diagnosing network/DNS issues
            }
            Self::MigrationChecksum { migration_version, source } => {
                write!(f, "Checksum mismatch on migration version {migration_version}: {source}")
                // => Checksum mismatch: critical integrity violation; include version
            }
            Self::MigrationExecution { migration_version, source } => {
                let v = migration_version.map_or("unknown".to_string(), |v| v.to_string());
                write!(f, "Migration {v} failed to execute: {source}")
                // => Execution error: include version for rapid identification in logs
            }
        }
    }
}

impl std::error::Error for MigrationStartupError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            Self::PoolConnection { source, .. }
            | Self::MigrationChecksum { source, .. }
            | Self::MigrationExecution { source, .. } => Some(source),
            // => source(): exposes the underlying sqlx::Error for error chain traversal
        }
    }
}
```

**Key Takeaway**: Define a migration error enum with variants for each failure category (connection, checksum mismatch, SQL execution). Include the migration version and a redacted connection host in error messages to enable targeted incident response.

**Why It Matters**: `sqlx::Error` is a general-purpose error type that does not distinguish between "cannot connect to database" (retry) and "checksum mismatch" (halt and alert). Wrapping it in a domain-specific error type makes the recovery strategy machine-executable: the caller pattern-matches on the variant and routes to retry logic, alerting pipelines, or graceful shutdown. Including the migration version in execution errors lets the on-call engineer find the failing migration file in the repository within seconds. Redacting the database password from error messages (logging only the host) prevents credential leakage in error logs, which are often shipped to centralized log aggregation services.

---

### Example 84: Production Migration Checklist Pattern

Encode production migration safety requirements as a checked list that runs before the migration binary executes. Assertions that fail early prevent the migration from running at all.

```rust
use sqlx::PgPool;

// => Pre-migration safety checks: fail fast with clear messages before touching schema
async fn preflight_checks(pool: &PgPool) -> Result<(), String> {
    // => Check 1: ensure PostgreSQL version meets minimum requirements
    let pg_version: String = sqlx::query_scalar("SHOW server_version")
        .fetch_one(pool)
        .await
        .map_err(|e| format!("Cannot read server_version: {e}"))?;
    // => SHOW server_version: returns "16.1" style string; parse major version
    let major: u32 = pg_version.split('.').next()
        .and_then(|s| s.parse().ok())
        .ok_or_else(|| format!("Unparseable server_version: {pg_version}"))?;
    if major < 14 {
        return Err(format!("PostgreSQL {major} is below minimum required version 14"));
        // => Migrations may use PostgreSQL 14+ features; fail before applying
    }

    // => Check 2: ensure no other migration process holds the advisory lock
    let lock_available: bool = sqlx::query_scalar(
        "SELECT pg_try_advisory_lock(HASHTEXT('sqlx_migration_lock'))"
        // => pg_try_advisory_lock: returns TRUE if lock acquired, FALSE if held by another session
        // => Advisory lock key must match the key SQLx uses internally
    )
    .fetch_one(pool)
    .await
    .map_err(|e| format!("Cannot check advisory lock: {e}"))?;
    if !lock_available {
        return Err("Another migration process is running; aborting to prevent concurrent execution".to_string());
        // => Prevents two migration processes from racing on the same database
    }
    // => Release the advisory lock; SQLx will re-acquire it during migration
    sqlx::query("SELECT pg_advisory_unlock(HASHTEXT('sqlx_migration_lock'))")
        .execute(pool)
        .await
        .map_err(|e| format!("Cannot release advisory lock: {e}"))?;

    // => Check 3: verify disk space on the database server is sufficient
    let free_bytes: i64 = sqlx::query_scalar(
        "SELECT pg_database_size(current_database())"
        // => Returns current database size in bytes; not free space
        // => For free space: requires pg_df extension or system-level check
    )
    .fetch_one(pool)
    .await
    .map_err(|e| format!("Cannot read database size: {e}"))?;
    println!("Current database size: {:.1} GB", free_bytes as f64 / 1e9);
    // => Log size for operator awareness; alert if unexpectedly large

    println!("All pre-flight checks passed");
    Ok(())
    // => All checks passed; migration may proceed
}
```

**Key Takeaway**: Run pre-flight checks before every production migration: verify PostgreSQL version, check for concurrent migration processes via advisory locks, and log database size. Fail fast with actionable error messages.

**Why It Matters**: A migration that fails midway through a 2-hour backfill because the database server ran out of disk space is far more damaging than a migration that fails immediately during pre-flight. Pre-flight checks move failure detection from the middle of destructive operations to before anything is touched. The advisory lock check prevents two CI/CD deployments from racing to apply the same migration simultaneously—a race that can cause duplicate migration execution errors or, worse, schema corruption. The PostgreSQL version check prevents migrations that use newer syntax from silently failing with cryptic errors on older database versions.

---

### Example 85: Migration Monitoring and Alerting

Emit structured telemetry during migration execution so observability pipelines (Prometheus, Datadog, OpenTelemetry) capture migration duration, success/failure rate, and applied version for dashboards and alerts.

```rust
use sqlx::AnyPool;
use std::time::Instant;

// => MigrationMetrics: telemetry emitted during migration execution
#[derive(Debug)]
struct MigrationMetrics {
    total_applied: usize,
    // => Number of migrations applied in this run; 0 means schema was already current
    total_duration_ms: u128,
    // => Wall time for all migrations in this run; high value may indicate slow DDL
    failed_version: Option<i64>,
    // => Version number of the failed migration; None means all succeeded
}

async fn run_migrations_with_telemetry(pool: &AnyPool) -> Result<MigrationMetrics, sqlx::Error> {
    let migrator = sqlx::migrate!("./migrations");
    // => Load migrations at compile time; version list is deterministic

    let pending_count = migrator.migrations.len();
    // => Total known migrations; compare to applied count to find pending count
    // => In production: query _sqlx_migrations to get exact pending count before running

    let start = Instant::now();
    let result = migrator.run(pool).await;
    // => Apply all pending migrations; result is Ok(()) or Err(sqlx::Error)
    let duration_ms = start.elapsed().as_millis();
    // => Total wall time for all migrations; includes advisory lock acquisition

    match result {
        Ok(()) => {
            let metrics = MigrationMetrics {
                total_applied: pending_count,
                // => In practice: query _sqlx_migrations WHERE applied_at > run_start
                total_duration_ms: duration_ms,
                failed_version: None,
                // => None: all migrations succeeded
            };

            // => Emit to observability pipeline (replace with your metrics client)
            println!(
                "{{\"event\":\"migration_success\",\"applied\":{},\"duration_ms\":{}}}",
                metrics.total_applied, metrics.total_duration_ms
                // => JSON format: parseable by log aggregators; Datadog, Splunk, CloudWatch
            );

            Ok(metrics)
        }
        Err(ref e) => {
            // => Extract failed migration version from the error message if available
            let failed_version = e.to_string()
                .split("version ")
                .nth(1)
                .and_then(|s| s.split_whitespace().next())
                .and_then(|s| s.parse::<i64>().ok());
            // => Heuristic parse; in production use a structured error type (see Example 83)

            println!(
                "{{\"event\":\"migration_failure\",\"version\":{:?},\"error\":\"{}\",\"duration_ms\":{}}}",
                failed_version, e, duration_ms
                // => Structured failure log: alert pipeline pattern-matches on "migration_failure"
            );

            Err(result.unwrap_err())
            // => Re-raise the original error; caller decides whether to retry or halt
        }
    }
}
```

**Key Takeaway**: Wrap migration execution in timing and structured logging. Emit JSON events for both success and failure so your observability pipeline can alert on migration duration anomalies and failures without log scraping.

**Why It Matters**: Without migration telemetry, the only signal a migration failed is a pod crash or a deployment rollback. Structured events allow your observability pipeline to create dashboards showing migration duration trends over time (a gradual slowdown signals table growth reaching a DDL threshold), alert on migration failures before the deployment pipeline marks the deploy as failed, and correlate migration timing with application error rate spikes. The `failed_version` field in the failure event reduces mean time to resolution from "check all migration files" to "open the file for version X". Production teams operating databases at scale treat migration observability with the same priority as application performance monitoring.

---
