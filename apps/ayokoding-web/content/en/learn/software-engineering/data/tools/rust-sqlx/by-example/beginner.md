---
title: "Beginner"
date: 2026-03-27T00:00:00+07:00
draft: false
weight: 10000001
description: "Rust SQLx migrations beginner tutorial with 30 annotated examples covering migration files, CLI commands, embedded migrations, connection pools, and common schema patterns (0-40% coverage)"
tags: ["rust-sqlx", "tutorial", "by-example", "beginner", "migrations", "sqlx", "postgresql", "sqlite", "database"]
---

## Beginner Examples (1-30)

**Coverage**: 0-40% of SQLx migration functionality

**Focus**: Migration file structure, CLI commands, embedded migrations, connection pool setup, and common SQL constraint patterns.

These examples cover fundamentals needed to manage database schema evolution in production Rust applications. Each example is completely self-contained.

---

### Example 1: First SQL Migration File

A SQLx migration file is a plain `.sql` file placed in a `migrations/` directory. SQLx reads these files in version order and applies each one exactly once, tracking applied migrations in the `_sqlx_migrations` table. The file name encodes the version number that determines execution order.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
%% Migration file lifecycle: file on disk -> SQLx reads -> database changes
graph TD
    A["migrations/ directory"] -->|"SQLx scans at startup"| B["Version-ordered file list"]
    B -->|"For each unapplied file"| C["Execute SQL statements"]
    C -->|"On success"| D["Record in _sqlx_migrations"]

    style A fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style B fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style C fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style D fill:#CC78BC,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

```sql
-- File: migrations/0001_create_users.sql
-- => File name format: <version>_<description>.sql
-- => Version prefix determines execution order (lexicographic sort)
-- => SQLx applies this file if no row exists in _sqlx_migrations for version 0001

CREATE TABLE users (               -- => DDL statement: creates the users table
    id BIGSERIAL PRIMARY KEY,      -- => Auto-incrementing 64-bit integer primary key
    username TEXT NOT NULL,        -- => Text column, NULL values rejected by database
    email TEXT NOT NULL            -- => Second required text column
);
-- => After execution: users table exists in the database schema
-- => _sqlx_migrations row inserted: version=1, description="create_users", applied_at=now()
```

**Key Takeaway**: Migration files are plain SQL named with a version prefix. SQLx applies them once in version order and records each application in `_sqlx_migrations`.

**Why It Matters**: Every production application needs a systematic way to evolve its database schema alongside the code. Without versioned migration files, teams apply schema changes manually and inconsistently across environments, leading to drift between development, staging, and production databases. SQLx migration files make schema changes reproducible, auditable, and reversible—the same properties you expect from version control for source code.

---

### Example 2: sqlx migrate add Command

The `sqlx migrate add` command generates a new migration file with the correct version timestamp prefix. Running it ensures your file name follows the naming convention SQLx requires and avoids version conflicts when multiple developers add migrations simultaneously.

```bash
# Run this command in your project root
sqlx migrate add create_users
# => Creates: migrations/20240101120000_create_users.sql
# => Timestamp format: YYYYMMDDHHmmss (UTC)
# => Empty file with correct name; you fill in the SQL

# For reversible migrations (generates .up.sql and .down.sql pair)
sqlx migrate add --reversible create_users
# => Creates: migrations/20240101120000_create_users.up.sql
# => Creates: migrations/20240101120000_create_users.down.sql
# => Both files are empty; you fill in the SQL for each direction

# Verify the files were created
ls migrations/
# => 20240101120000_create_users.sql
```

**Key Takeaway**: Always use `sqlx migrate add` to create migration files rather than creating them manually. The command guarantees correct timestamp-based versioning and avoids ordering conflicts.

**Why It Matters**: Timestamp-based version prefixes allow multiple developers to create migrations independently without coordinating version numbers. If two developers both create migration `0005`, the last one to push wins and causes confusion. Timestamps generated at creation time are unique enough for most team workflows, and the `sqlx migrate add` command handles formatting so you never introduce a typo in the prefix.

---

### Example 3: Migration File Structure (.up.sql / .down.sql)

Reversible migrations consist of two paired files: a `.up.sql` file containing the forward change and a `.down.sql` file containing the reversal. SQLx applies `.up.sql` files when running migrations and `.down.sql` files when reverting them, enabling controlled rollback.

```sql
-- File: migrations/20240101120000_create_products.up.sql
-- => Forward migration: applied by `sqlx migrate run`
-- => Purpose: introduce the products table into the schema

CREATE TABLE products (                    -- => Creates new products table
    id BIGSERIAL PRIMARY KEY,              -- => Auto-incrementing primary key
    name TEXT NOT NULL,                    -- => Product name, required
    price_cents INTEGER NOT NULL,          -- => Price stored as integer cents (no float rounding)
    created_at TIMESTAMPTZ NOT NULL        -- => Timezone-aware timestamp column
        DEFAULT CURRENT_TIMESTAMP          -- => Defaults to now() on INSERT
);
-- => After .up.sql runs: products table exists in schema
```

```sql
-- File: migrations/20240101120000_create_products.down.sql
-- => Reversal migration: applied by `sqlx migrate revert`
-- => Purpose: undo exactly what the .up.sql file did

DROP TABLE IF EXISTS products;
-- => Removes products table from schema
-- => IF EXISTS prevents error if table was already removed manually
-- => After .down.sql runs: products table no longer exists
-- => _sqlx_migrations row for this version is deleted
```

**Key Takeaway**: Write `.down.sql` migrations as the exact inverse of the corresponding `.up.sql`. A `.down.sql` that does not cleanly undo the `.up.sql` leaves the schema in an inconsistent state on rollback.

**Why It Matters**: Reversible migrations enable emergency rollbacks when a deployment introduces a defect. Without a tested `.down.sql`, rolling back code leaves the database in a state incompatible with the previous code version. Teams that skip `.down.sql` files discover this limitation at the worst possible moment—during an outage. Writing the reversal at the same time as the forward migration ensures it is tested and correct before you need it.

---

### Example 4: Running Migrations (sqlx migrate run)

The `sqlx migrate run` command connects to the database, checks which migrations have already been applied by querying `_sqlx_migrations`, and applies any unapplied migrations in version order. It is idempotent: running it multiple times against the same database applies each migration exactly once.

```bash
# Apply all unapplied migrations
sqlx migrate run --database-url postgres://user:pass@localhost/mydb
# => Connects to PostgreSQL at localhost
# => Queries _sqlx_migrations for already-applied versions
# => Applies each unapplied migration file in ascending version order
# => Prints: Applied 20240101120000/create_users (2.456ms)
# => Prints: Applied 20240101130000/create_products (1.123ms)
# => Returns exit code 0 on success, non-zero on failure

# Run again (idempotent - no changes applied)
sqlx migrate run --database-url postgres://user:pass@localhost/mydb
# => Queries _sqlx_migrations: all versions already present
# => Prints: Applied 0 migrations.
# => No SQL executed; safe to run on every deployment

# Using DATABASE_URL environment variable (recommended for CI)
export DATABASE_URL=postgres://user:pass@localhost/mydb
sqlx migrate run
# => Uses DATABASE_URL from environment, no --database-url flag needed
```

**Key Takeaway**: Run `sqlx migrate run` on every deployment. Its idempotent design means running it against a fully up-to-date database is safe and applies only what is needed.

**Why It Matters**: Embedding `sqlx migrate run` in your deployment pipeline guarantees that the database schema is always synchronized with the deployed code version. Teams that apply migrations manually as a separate step frequently forget, causing application errors immediately after deployment. Automated migration execution during deployment is a fundamental practice for zero-downtime deployments with schema changes.

---

### Example 5: Creating Tables

A `CREATE TABLE` statement defines a new table with its columns, data types, and constraints. In SQLx migrations, table creation is the most common operation and forms the baseline from which all other schema changes build.

```sql
-- File: migrations/20240101120000_create_accounts.sql
-- => Creates the accounts table with essential financial columns

CREATE TABLE accounts (
    id BIGSERIAL PRIMARY KEY,
    -- => BIGSERIAL: 64-bit auto-incrementing integer (PostgreSQL)
    -- => PRIMARY KEY: unique, NOT NULL, indexed automatically

    owner_name TEXT NOT NULL,
    -- => TEXT: variable-length string with no length limit
    -- => NOT NULL: INSERT rejected if this column is omitted or NULL

    balance_cents BIGINT NOT NULL DEFAULT 0,
    -- => BIGINT: 64-bit integer for large monetary values
    -- => DEFAULT 0: value used when column is omitted in INSERT

    currency CHAR(3) NOT NULL DEFAULT 'USD',
    -- => CHAR(3): fixed 3-character string for ISO 4217 currency codes
    -- => DEFAULT 'USD': fallback currency when not specified

    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    -- => BOOLEAN: true/false value
    -- => DEFAULT TRUE: new accounts start active

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    -- => TIMESTAMPTZ: timestamp with time zone (PostgreSQL)
    -- => DEFAULT CURRENT_TIMESTAMP: auto-set to now() on INSERT
);
-- => After execution: accounts table exists with 6 columns
-- => Indexes created automatically: accounts_pkey on id
```

**Key Takeaway**: Design columns with the strictest constraints appropriate for the data from the start. Adding `NOT NULL` later requires a table rewrite on large tables and a default value to backfill existing rows.

**Why It Matters**: Column constraints defined at table creation time enforce data integrity at the database level, independent of application code. Application bugs, direct SQL access, scripts, and other services all still respect database-level constraints. A column defined as `NOT NULL` will never contain a NULL regardless of how it is written. Retrofitting constraints onto populated tables is operationally expensive and requires careful coordination, so getting the schema right initially saves significant production work.

---

### Example 6: Adding Columns

`ALTER TABLE ... ADD COLUMN` adds a new column to an existing table without affecting existing rows. SQLx applies this in a migration file the same way as any other SQL statement. Adding a column with a DEFAULT value or allowing NULLs is instant on PostgreSQL; adding a `NOT NULL` column without a default requires a table rewrite.

```sql
-- File: migrations/20240102090000_add_phone_to_accounts.sql
-- => Adds optional phone_number column to accounts table
-- => Existing rows receive NULL for the new column

ALTER TABLE accounts
    ADD COLUMN phone_number TEXT;
-- => Adds phone_number column with no constraint (nullable)
-- => Existing rows: phone_number = NULL
-- => New rows: phone_number defaults to NULL if not provided
-- => Table rewrite: NOT required (nullable column addition is metadata-only)

-- Add a non-nullable column with a default (safe pattern)
ALTER TABLE accounts
    ADD COLUMN notification_email TEXT NOT NULL DEFAULT '';
-- => Adds column, backfills all existing rows with '' (empty string)
-- => Table rewrite: required to backfill existing rows
-- => On large tables: can take minutes and lock the table in older PostgreSQL
-- => PostgreSQL 11+: instant for volatile defaults; non-instant for constant defaults
```

**Key Takeaway**: Adding a nullable column or a `NOT NULL` column with a constant default is safe on any table size. Adding a `NOT NULL` column without a default or with an expensive default expression locks the table during backfill on older PostgreSQL versions.

**Why It Matters**: Schema changes on large production tables can cause outages if they lock the table for minutes. Understanding when `ADD COLUMN` requires a table rewrite lets you plan migrations appropriately—either accepting brief downtime for small tables, or using zero-downtime techniques (adding nullable first, backfilling, then adding the constraint) for large tables. SQLx does not handle this complexity for you; the SQL you write determines the operational impact.

---

### Example 7: Adding Indexes

An index speeds up queries that filter or sort on indexed columns by creating an auxiliary data structure the database engine can scan instead of the full table. Indexes are added with `CREATE INDEX` and are defined in migration files just like table definitions.

```sql
-- File: migrations/20240103100000_add_indexes_to_accounts.sql
-- => Adds indexes to support common query patterns on accounts table

-- Single-column index for equality lookups
CREATE INDEX idx_accounts_owner_name
    ON accounts (owner_name);
-- => Creates B-tree index on owner_name column
-- => Speeds up: WHERE owner_name = 'Alice' queries
-- => Cost: additional disk space + write overhead on INSERT/UPDATE/DELETE

-- Index for filtering by active status (partial index)
CREATE INDEX idx_accounts_active
    ON accounts (is_active)
    WHERE is_active = TRUE;
-- => Partial index: only indexes rows where is_active = TRUE
-- => Smaller than full index; faster for queries that only look at active accounts
-- => WHERE is_active = TRUE queries benefit; WHERE is_active = FALSE does not

-- Unique index enforces uniqueness while also enabling fast lookups
CREATE UNIQUE INDEX idx_accounts_phone_unique
    ON accounts (phone_number)
    WHERE phone_number IS NOT NULL;
-- => Unique index: prevents duplicate non-NULL phone numbers
-- => Partial (WHERE IS NOT NULL): multiple NULLs allowed (only non-NULL values must be unique)
-- => Both uniqueness constraint + fast lookup for phone_number queries
```

**Key Takeaway**: Create indexes for columns that appear in `WHERE` clauses and join conditions in your most frequent queries. Use partial indexes to reduce index size when only a subset of rows is typically queried.

**Why It Matters**: Without indexes, the database performs full table scans for every filtered query. On a table with millions of rows, a missing index can turn a millisecond query into a seconds-long one, and sequential scans on large tables can block writes due to lock contention. Adding indexes in migration files ensures every environment—development, staging, production—has identical index coverage, preventing performance surprises when code that works in development hits production scale.

---

### Example 8: Adding Foreign Keys

A foreign key constraint enforces referential integrity between two tables: every value in the foreign key column must match an existing primary key value in the referenced table. SQLx migration files define foreign keys as part of `CREATE TABLE` or via `ALTER TABLE`.

```sql
-- File: migrations/20240104110000_create_transactions.sql
-- => Creates transactions table with a foreign key to accounts

CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,
    -- => Auto-incrementing primary key for transactions

    account_id BIGINT NOT NULL,
    -- => References accounts.id; NOT NULL means every transaction belongs to an account

    CONSTRAINT fk_transactions_account
        FOREIGN KEY (account_id)
        REFERENCES accounts (id),
    -- => Named constraint: fk_transactions_account (named constraints are easier to drop later)
    -- => FOREIGN KEY (account_id): this column is the referencing side
    -- => REFERENCES accounts (id): account_id must match a value in accounts.id
    -- => Default behavior: RESTRICT - prevents DELETE of account if transactions exist

    amount_cents BIGINT NOT NULL,
    -- => Transaction amount in integer cents

    transaction_type TEXT NOT NULL,
    -- => 'debit' or 'credit'; consider CHECK constraint (see Example 22)

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    -- => Timestamp when transaction was created
);
-- => After execution: transactions table created with foreign key constraint
-- => Attempting INSERT with non-existent account_id raises: ERROR 23503 foreign_key_violation
```

**Key Takeaway**: Name your foreign key constraints explicitly (using `CONSTRAINT fk_name FOREIGN KEY ...`) so they are easy to identify in error messages and easy to drop by name in future migrations.

**Why It Matters**: Foreign key constraints prevent orphaned records—transactions pointing to accounts that no longer exist. Without them, deleting an account can leave thousands of transaction rows with a dangling reference, causing application errors when those rows are later queried. The database enforces referential integrity at the insert/update/delete level, independent of application logic, providing a safety net that catches bugs across all code paths that touch the database.

---

### Example 9: Adding Unique Constraints

A unique constraint ensures that no two rows in a table have the same value in the constrained column or combination of columns. It is weaker than a primary key (allows NULL unless NOT NULL is also specified) but enforces business rules like "one email per user" at the database level.

```sql
-- File: migrations/20240105120000_add_unique_constraints.sql
-- => Adds unique constraints to prevent duplicate business-key values

-- Single-column unique constraint
ALTER TABLE accounts
    ADD CONSTRAINT uq_accounts_email UNIQUE (notification_email);
-- => Named unique constraint: uq_accounts_email
-- => Prevents two accounts with the same notification_email value
-- => NULL values are NOT checked for uniqueness (multiple NULLs allowed)
-- => Violation raises: ERROR 23505 unique_violation

-- Multi-column unique constraint (composite unique)
ALTER TABLE transactions
    ADD CONSTRAINT uq_transactions_idempotency
    UNIQUE (account_id, transaction_type, created_at);
-- => Composite unique: combination of all three columns must be unique
-- => Prevents duplicate transaction submissions at the same instant
-- => Individual columns CAN have duplicates; only the combination is constrained
-- => Automatically creates an index supporting this constraint
```

**Key Takeaway**: Name unique constraints with a consistent prefix (such as `uq_`) to distinguish them from primary key and foreign key constraints. Use composite unique constraints when the business rule involves a combination of columns.

**Why It Matters**: Unique constraints prevent duplicate data that application-level validation can miss under concurrent load. Two simultaneous account registrations with the same email can both pass application-level checks before either is inserted. The unique constraint ensures the database rejects one, making the application's uniqueness guarantee reliable regardless of concurrency. Naming constraints makes error messages actionable—when a `unique_violation` occurs, the constraint name tells you exactly which business rule was violated.

---

### Example 10: Checking Migration Status (sqlx migrate info)

The `sqlx migrate info` command queries the `_sqlx_migrations` table and the migrations directory to show which migrations have been applied and which are pending. It is useful for auditing the state of any environment without making changes.

```bash
# Show migration status for all known migrations
sqlx migrate info --database-url postgres://user:pass@localhost/mydb
# => Queries _sqlx_migrations table in the target database
# => Compares applied versions against files in ./migrations/
# => Output format:
#
# Version             Description                             Installed On
# 20240101120000      create_accounts                         2024-01-01 12:00:05 UTC
# 20240102090000      add_phone_to_accounts                   2024-01-02 09:01:10 UTC
# 20240103100000      add_indexes_to_accounts                 2024-01-03 10:02:15 UTC
# 20240104110000      create_transactions               *pending*
#
# => Lines with dates: already applied
# => Lines with *pending*: present in migrations/ but not yet applied to this database

# Pipe through grep to find only pending migrations
sqlx migrate info --database-url postgres://user:pass@localhost/mydb | grep pending
# => 20240104110000      create_transactions               *pending*
# => Shows only unapplied migrations
```

**Key Takeaway**: Run `sqlx migrate info` to audit migration state in any environment without risk. It reads only—no schema changes occur.

**Why It Matters**: Before running migrations in production, confirming the exact set of pending migrations prevents surprises. An environment that has been manually patched or restored from a backup may have an unexpected migration state. `sqlx migrate info` gives you a full picture so you can verify that `sqlx migrate run` will apply exactly what you expect. In incident response, it also confirms whether a migration did or did not apply when the deployment log is ambiguous.

---

### Example 11: Reversible Migrations

A reversible migration pair consists of a `.up.sql` file (forward change) and a `.down.sql` file (reversal). The `.down.sql` must undo exactly what the `.up.sql` did. SQLx applies `.up.sql` files during `sqlx migrate run` and `.down.sql` files during `sqlx migrate revert`.

```sql
-- File: migrations/20240106090000_add_account_tier.up.sql
-- => Forward migration: adds account_tier column to accounts

ALTER TABLE accounts
    ADD COLUMN account_tier TEXT NOT NULL DEFAULT 'standard';
-- => Adds account_tier column with default 'standard'
-- => Existing rows: account_tier = 'standard' (backfilled by DEFAULT)
-- => New rows without explicit tier: account_tier = 'standard'
-- => After .up.sql: accounts table has account_tier column
```

```sql
-- File: migrations/20240106090000_add_account_tier.down.sql
-- => Reversal migration: removes account_tier column added by .up.sql
-- => Must be the exact inverse of .up.sql

ALTER TABLE accounts
    DROP COLUMN account_tier;
-- => Removes account_tier column and all its data
-- => CAUTION: DROP COLUMN destroys data permanently
-- => After .down.sql: accounts.account_tier no longer exists
-- => _sqlx_migrations row for version 20240106090000 is deleted

-- To revert:
-- sqlx migrate revert --database-url postgres://user:pass@localhost/mydb
-- => Applies the most recent .down.sql file
-- => Decrements the migration state by one version
```

**Key Takeaway**: Write `.down.sql` at the same time as `.up.sql` while the intended reversal is fresh in your mind. A `.down.sql` written months later from memory is often wrong.

**Why It Matters**: Reversible migrations are emergency tooling. You build them when things are calm so they are available when things go wrong. A deployment that introduces a data-corrupting bug needs to be rolled back quickly. If the migration that accompanied the deployment has no `.down.sql`, rolling back the code does not roll back the schema, leaving the reverted code running against a schema it does not understand. The few minutes spent writing `.down.sql` now can save hours of manual recovery during an incident.

---

### Example 12: Embedded Migrations with migrate!() Macro

The `migrate!()` macro reads migration files from a directory at Rust compile time and embeds their contents directly into the binary. The resulting binary carries its own migrations and applies them at runtime without reading files from disk—essential for containerized or serverless deployments where file system access is restricted.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
%% migrate!() macro compile-time embedding vs runtime application
graph TD
    A["migrations/ directory<br/>SQL files on disk"] -->|"cargo build compile time"| B["Rust binary<br/>SQL embedded in binary"]
    B -->|"runtime: migrate.run#40;&pool#41;"| C["Database _sqlx_migrations check"]
    C -->|"pending versions found"| D["Execute SQL statements"]
    D -->|"success"| E["Record applied version"]

    style A fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style B fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style C fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style D fill:#CC78BC,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style E fill:#CA9161,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

```rust
// Cargo.toml dependency
// sqlx = { version = "0.8", features = ["postgres", "runtime-tokio", "migrate"] }
// => "migrate" feature enables sqlx::migrate!() macro and Migrator type

use sqlx::PgPool;

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");
    // => Reads database URL from environment variable
    // => Panics at startup if DATABASE_URL is not set (fail-fast)

    let pool = PgPool::connect(&database_url).await?;
    // => Creates PostgreSQL connection pool
    // => Returns PgPool on success, sqlx::Error on failure

    sqlx::migrate!("./migrations")
    // => Macro scanned ./migrations/ at compile time
    // => Embedded all .sql file contents into the binary
    // => At runtime: returns a Migrator struct with embedded migration data
        .run(&pool)
        .await?;
    // => Migrator.run(&pool): queries _sqlx_migrations for applied versions
    // => Applies each unapplied migration in ascending version order
    // => Wraps each migration in a transaction (automatic rollback on failure)
    // => Returns Ok(()) when all migrations applied, Err(sqlx::Error) on failure

    println!("Migrations applied successfully");
    // => Output: Migrations applied successfully
    Ok(())
}
```

**Key Takeaway**: Use `sqlx::migrate!("./migrations")` for production deployments. The path argument is relative to `Cargo.toml`, resolved at compile time, so changing the path requires recompilation.

**Why It Matters**: Embedded migrations eliminate an entire category of deployment failure: "migrations directory not found." In containerized environments, the migrations directory is often missing from the image, causing the application to start but fail on the first database operation. With `migrate!()`, the binary is self-contained—deploy one file and migrations run automatically. This is the canonical SQLx pattern for production Rust services and the approach used in the `demo-be-rust-axum` reference implementation.

---

### Example 13: AnyPool Setup for Multi-Database

`AnyPool` is a SQLx connection pool that abstracts over multiple database backends (PostgreSQL, SQLite, MySQL). Using `AnyPool` lets you write code that runs against different databases by changing only the connection URL. This is useful for applications that support multiple databases or that use SQLite in tests and PostgreSQL in production.

```rust
// Cargo.toml
// sqlx = { version = "0.8", features = ["any", "postgres", "sqlite", "runtime-tokio", "migrate"] }
// => "any" feature enables AnyPool and install_default_drivers()
// => "postgres" and "sqlite" features enable the respective drivers

use sqlx::any::AnyPoolOptions;
use sqlx::AnyPool;

pub async fn create_pool(database_url: &str) -> Result<AnyPool, sqlx::Error> {
    sqlx::any::install_default_drivers();
    // => Registers PostgreSQL and SQLite drivers with the Any abstraction layer
    // => MUST be called before any AnyPool::connect() call
    // => Calling this multiple times is safe (idempotent)

    let max_connections = if database_url.starts_with("sqlite") {
        1   // => SQLite supports only one writer at a time; pool of 1 prevents contention
    } else {
        10  // => PostgreSQL: larger pool for concurrent access
    };
    // => max_connections: 1 for SQLite, 10 for PostgreSQL

    let pool = AnyPoolOptions::new()
        .max_connections(max_connections)
        // => Sets the upper bound on simultaneous database connections
        .connect(database_url)
        .await?;
    // => Establishes the connection pool using the driver detected from the URL prefix
    // => URL prefix determines driver: "postgres://" -> PostgreSQL, "sqlite:" -> SQLite

    Ok(pool)
    // => Returns AnyPool ready for use with sqlx::query() and migrations
}

// Usage: SQLite in-memory for tests
pub async fn create_test_pool() -> Result<AnyPool, sqlx::Error> {
    create_pool("sqlite::memory:").await
    // => "sqlite::memory:" URL: in-memory SQLite database
    // => Each call to create_test_pool() returns a fresh, isolated database
    // => Database is destroyed when the pool is dropped (end of test)
}
```

**Key Takeaway**: Call `sqlx::any::install_default_drivers()` before creating an `AnyPool`. Forgetting this call causes a runtime panic with a confusing error about no driver being registered.

**Why It Matters**: `AnyPool` enables the database-agnostic architecture pattern used in the `demo-be-rust-axum` reference implementation: SQLite in-memory for fast unit tests, PostgreSQL in integration tests and production. Tests run without a running database server, reducing CI infrastructure requirements and test execution time. The same application code, migration files, and query logic work against both databases, with only the connection URL changing between environments.

---

### Example 14: PgPool Connection Setup

`PgPool` is a PostgreSQL-specific connection pool that provides full access to PostgreSQL-specific types and features. When your application only targets PostgreSQL, `PgPool` is preferred over `AnyPool` because it provides compile-time query verification via `sqlx::query!()` macros and supports PostgreSQL-specific types.

```rust
// Cargo.toml
// sqlx = { version = "0.8", features = ["postgres", "runtime-tokio", "migrate", "uuid", "chrono"] }
// => "postgres": PostgreSQL driver
// => "uuid": maps PostgreSQL UUID type to Rust uuid::Uuid
// => "chrono": maps PostgreSQL TIMESTAMPTZ to chrono::DateTime<Utc>

use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;

pub async fn create_pg_pool(database_url: &str) -> Result<PgPool, sqlx::Error> {
    PgPoolOptions::new()
        .max_connections(20)
        // => Allow up to 20 simultaneous connections to PostgreSQL
        // => PostgreSQL default max_connections is 100; leave headroom for other clients

        .acquire_timeout(std::time::Duration::from_secs(3))
        // => Return error after 3 seconds if no connection becomes available
        // => Prevents indefinite hangs under high load

        .connect(database_url)
        .await
    // => Returns PgPool on success
    // => Returns sqlx::Error::PoolTimedOut if all connections are busy for 3+ seconds
    // => Returns sqlx::Error::Database if the connection string is invalid
}

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    let database_url = "postgres://user:password@localhost:5432/mydb";
    // => Standard PostgreSQL connection URL format
    // => postgres://<user>:<password>@<host>:<port>/<database>

    let pool = create_pg_pool(database_url).await?;
    // => pool: PgPool ready for queries and migrations

    sqlx::migrate!("./migrations").run(&pool).await?;
    // => Applies unapplied migrations using the PgPool
    // => PgPool-specific: migrations can use PostgreSQL-only DDL (UUID, JSONB, arrays)

    println!("PostgreSQL pool created and migrations applied");
    Ok(())
}
```

**Key Takeaway**: Use `PgPool` when targeting PostgreSQL exclusively. It unlocks compile-time query verification with `sqlx::query!()` macros and supports PostgreSQL-specific types that `AnyPool` cannot represent.

**Why It Matters**: `PgPool` with `sqlx::query!()` macros provides a rare feature: compile-time SQL verification. The macro connects to the database during `cargo build`, verifies the query syntax and column types, and fails compilation if the query is invalid. This catches SQL typos, missing columns, and type mismatches before the code ships. For PostgreSQL-only services, this compile-time safety net is a significant advantage over runtime-only error detection.

---

### Example 15: SqlitePool Connection Setup

`SqlitePool` is a SQLite-specific connection pool used primarily for testing and lightweight deployments. SQLite databases are single files (or in-memory), require no server, and start instantly—making them ideal for unit tests that need a real database but cannot afford the overhead of PostgreSQL.

```rust
// Cargo.toml
// sqlx = { version = "0.8", features = ["sqlite", "runtime-tokio", "migrate"] }
// => "sqlite": SQLite driver (links against bundled libsqlite3 by default)

use sqlx::sqlite::SqlitePoolOptions;
use sqlx::SqlitePool;

// File-based SQLite database
pub async fn create_sqlite_pool(db_path: &str) -> Result<SqlitePool, sqlx::Error> {
    SqlitePoolOptions::new()
        .max_connections(1)
        // => SQLite has file-level write locking; pool of 1 prevents write contention
        // => Multiple readers are safe; only one writer at a time

        .connect(db_path)
        .await
    // => db_path format: "sqlite:./data/app.db" (file path)
    //                 or "sqlite::memory:"         (in-memory)
    // => File databases persist across application restarts
    // => In-memory databases are destroyed when the pool is dropped
}

// In-memory SQLite for isolated tests
pub async fn create_test_pool() -> Result<SqlitePool, sqlx::Error> {
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await?;
    // => Creates fresh in-memory SQLite database
    // => No file created on disk; database exists only in memory

    sqlx::migrate!("./migrations").run(&pool).await?;
    // => Applies all migrations to the fresh in-memory database
    // => After this: schema matches production, ready for test queries

    Ok(pool)
    // => Returns SqlitePool with fully migrated schema, no pre-existing data
}
```

**Key Takeaway**: Use `SqlitePool` with `"sqlite::memory:"` for unit tests that need a real database. Each test creates its own pool and gets a fresh, isolated schema with no shared state.

**Why It Matters**: In-memory SQLite tests run in milliseconds, require no database server, and produce no side effects outside the test process. They let you test repository logic—including migrations—without mocking. The `create_test_pool()` pattern shown here is the standard approach in the `demo-be-rust-axum` implementation: every test gets its own migrated in-memory database, making tests fast, isolated, and reproducible in any environment including CI.

---

### Example 16: include_str!() for Embedding SQL

The `include_str!()` macro reads a file at compile time and produces its contents as a `&'static str`. In SQLx projects that execute SQL directly rather than using the `migrate!()` macro, `include_str!()` embeds SQL files into the binary so no file system access is needed at runtime.

```rust
// File structure:
// src/
//   db/
//     pool.rs         <- This file
//     migrations/
//       001_users.sql
//       002_tokens.sql

// Embed migration files at compile time
const MIGRATION_001: &str = include_str!("migrations/001_users.sql");
// => include_str! reads src/db/migrations/001_users.sql at compile time
// => MIGRATION_001: &'static str containing the full SQL file contents
// => Path is relative to this source file (src/db/pool.rs)
// => Compile error if the file does not exist at the specified path

const MIGRATION_002: &str = include_str!("migrations/002_tokens.sql");
// => Same as above for the second migration file

async fn run_migrations(pool: &sqlx::AnyPool) -> Result<(), sqlx::Error> {
    for sql in [MIGRATION_001, MIGRATION_002] {
        // => Iterate over embedded SQL strings in order
        for statement in sql.split(';').filter(|s| !s.trim().is_empty()) {
            // => Split on semicolons to get individual SQL statements
            // => filter: discard empty strings from trailing semicolons
            sqlx::query(statement).execute(pool).await?;
            // => Execute each statement against the database pool
            // => Returns error on first failure (no further statements execute)
        }
    }
    Ok(())
    // => All statements executed successfully
}
```

**Key Takeaway**: `include_str!()` provides compile-time file embedding but does not give you migration tracking (no `_sqlx_migrations` table). Use `sqlx::migrate!()` when you need proper migration management; use `include_str!()` for simpler cases where you manage execution yourself.

**Why It Matters**: The `demo-be-rust-axum` implementation uses `include_str!()` with a custom `run_migrations` function to maintain compatibility with `AnyPool` across both PostgreSQL and SQLite. The `migrate!()` macro's transaction wrapping behavior and `_sqlx_migrations` tracking are not used in this implementation, making `include_str!()` the right choice. Understanding both approaches helps you choose the right tool for your deployment model.

---

### Example 17: Sequential Migration Numbering

Sequential integer prefixes (001, 002, 003) provide a simpler alternative to timestamp-based versioning. They are easier to read and reason about in small teams but require coordination when multiple developers create migrations simultaneously to avoid version conflicts.

```sql
-- File: migrations/001_users.sql
-- => Version 001: first migration, applied first
-- => Simple integer prefix, zero-padded to 3 digits for consistent sorting
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,        -- => UUID stored as string (compatible with AnyPool)
    username VARCHAR(50) NOT NULL UNIQUE, -- => 50-char limit; UNIQUE enforced by database
    email VARCHAR(255) NOT NULL UNIQUE,   -- => Email unique constraint
    created_at VARCHAR(50) NOT NULL       -- => ISO 8601 timestamp as string (AnyPool compatible)
);
-- => After 001: users table exists
```

```sql
-- File: migrations/002_tokens.sql
-- => Version 002: applied after 001 (lexicographic sort: "002" > "001")
-- => Can reference users table because 001 already created it

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id),
    -- => Foreign key to users.id; version ordering guarantees users table exists first
    token_hash VARCHAR(512) NOT NULL UNIQUE,
    expires_at VARCHAR(50) NOT NULL,
    created_at VARCHAR(50) NOT NULL
);
-- => After 002: refresh_tokens table exists with foreign key to users
```

**Key Takeaway**: Zero-pad sequential numbers to at least 3 digits (`001` not `1`) to ensure correct lexicographic sort order beyond 9 migrations.

**Why It Matters**: SQLx sorts migration files lexicographically by filename. Without zero-padding, `10_...` sorts before `2_...` because `'1' < '2'` lexicographically, causing migrations to apply in wrong order. The `demo-be-rust-axum` implementation uses `001`, `002` through `005` with this convention. For teams larger than 2-3 developers, timestamp-based names from `sqlx migrate add` are safer because each developer's timestamp is unique, eliminating merge conflicts in migration version numbering.

---

### Example 18: NOT NULL Constraints with Defaults

`NOT NULL` ensures a column always has a value. When combined with `DEFAULT`, existing rows receive the default value automatically during the migration, making it safe to add the constraint to an existing table. Without a default, adding `NOT NULL` to a populated table fails unless all existing rows have a value.

```sql
-- File: migrations/20240110090000_add_status_to_users.sql
-- => Adds status column with NOT NULL + DEFAULT to existing users table

ALTER TABLE users
    ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
-- => Adds status column
-- => NOT NULL: future inserts must provide a value (or rely on DEFAULT)
-- => DEFAULT 'active': existing rows receive 'active'; new rows default to 'active'
-- => Safe on populated tables because the DEFAULT satisfies NOT NULL for existing rows

-- Add a column with NOT NULL but no DEFAULT (fails if table has rows)
-- ALTER TABLE users ADD COLUMN display_name TEXT NOT NULL;
-- => ERROR: column "display_name" of relation "users" contains null values
-- => This would fail if any rows exist because existing rows have NULL

-- Correct approach for NOT NULL without DEFAULT on populated table:
ALTER TABLE users ADD COLUMN display_name TEXT;
-- => Step 1: Add as nullable first (always succeeds regardless of row count)

UPDATE users SET display_name = username WHERE display_name IS NULL;
-- => Step 2: Backfill existing rows with a meaningful value

ALTER TABLE users ALTER COLUMN display_name SET NOT NULL;
-- => Step 3: Add NOT NULL constraint after backfill (now safe, all rows have values)
```

**Key Takeaway**: Always provide a `DEFAULT` when adding a `NOT NULL` column, or use the three-step pattern: add nullable, backfill, then constrain. Skipping this causes the migration to fail on any non-empty table.

**Why It Matters**: Production tables have rows. A migration that fails because it violates `NOT NULL` on existing rows causes a partial deployment: the code has been deployed expecting the new column, but the migration did not complete. Rolling back the code while the migration is partially applied creates further inconsistency. The three-step pattern is the standard safe approach for schema evolution on live databases and applies to any production-grade system, not just SQLx.

---

### Example 19: UUID Primary Keys

UUIDs (Universally Unique Identifiers) as primary keys allow clients to generate IDs before insert, enable distributed ID generation without coordination, and prevent sequential ID enumeration in APIs. SQLx supports UUIDs through the `uuid` feature flag.

```sql
-- File: migrations/20240111100000_create_orders.sql
-- => Creates orders table with UUID primary key

-- PostgreSQL: native UUID type with auto-generation
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- => UUID type: 128-bit identifier stored as 16 bytes (compact in PostgreSQL)
    -- => DEFAULT gen_random_uuid(): PostgreSQL generates a random UUID v4 on INSERT
    -- => No sequence needed; UUIDs are globally unique without a central counter

    customer_email TEXT NOT NULL,
    total_cents BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- => After execution: orders table with UUID primary key

-- SQLite compatible variant: UUID stored as TEXT (used with AnyPool)
-- CREATE TABLE orders (
--     id VARCHAR(36) PRIMARY KEY,
--     -- => VARCHAR(36): stores UUID as string "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
--     -- => Application (not database) generates the UUID before INSERT
--     -- => Use uuid::Uuid::new_v4().to_string() in Rust to generate
--     customer_email TEXT NOT NULL,
--     total_cents INTEGER NOT NULL,
--     created_at TEXT NOT NULL
-- );
-- => Compatible with both PostgreSQL and SQLite when using AnyPool
```

**Key Takeaway**: PostgreSQL natively supports the `UUID` type with `gen_random_uuid()`. When using `AnyPool` for SQLite compatibility, store UUIDs as `VARCHAR(36)` and generate them in Rust with `uuid::Uuid::new_v4()`.

**Why It Matters**: Auto-incrementing integer keys expose row counts and allow enumeration attacks (try IDs 1, 2, 3...). UUID primary keys prevent this without requiring application changes. Client-generated UUIDs also enable optimistic record creation: the client knows the ID before the insert completes, simplifying distributed systems where the response might be lost but the insert succeeded. The `demo-be-rust-axum` implementation uses `VARCHAR(36)` UUIDs throughout for AnyPool compatibility.

---

### Example 20: Timestamp Columns with Defaults

Timestamp columns track when records were created or modified. `created_at` records the insert time and should never change; `updated_at` records the last modification and should be updated on every write. Setting these as `NOT NULL DEFAULT CURRENT_TIMESTAMP` automates creation time without application code.

```sql
-- File: migrations/20240112110000_create_events.sql
-- => Creates events table with standard audit timestamp columns

CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    event_type TEXT NOT NULL,
    payload JSONB,                        -- => Optional JSON payload (PostgreSQL)

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- => TIMESTAMPTZ: timestamp with time zone (recommended over TIMESTAMP)
    -- => NOT NULL: every row must have a creation time
    -- => DEFAULT CURRENT_TIMESTAMP: set automatically by database on INSERT
    -- => Application does not need to provide this value

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    -- => updated_at: same default as created_at on INSERT
    -- => Must be updated by application code on UPDATE (no automatic trigger in standard SQL)
    -- => PostgreSQL: create a trigger for automatic update (see Example 20 extended below)
);

-- Optional: trigger to auto-update updated_at on every UPDATE (PostgreSQL)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;   -- => Set updated_at to now() on every UPDATE
    RETURN NEW;
END;
$$ language 'plpgsql';
-- => Creates a PL/pgSQL trigger function

CREATE TRIGGER trigger_events_updated_at
    BEFORE UPDATE ON events               -- => Fire before each UPDATE on events table
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
-- => Trigger auto-updates updated_at without application code
-- => After this: every UPDATE on events automatically sets updated_at = now()
```

**Key Takeaway**: Use `TIMESTAMPTZ` (not `TIMESTAMP`) for all timestamp columns. `TIMESTAMPTZ` stores UTC internally and converts on display, preventing timezone confusion in global applications.

**Why It Matters**: Missing `created_at` and `updated_at` columns are among the most common schema regrets. Without them, debugging data issues requires log correlation, which is slow and unreliable. With them, you can answer "when was this record created?" and "when was it last changed?" directly in SQL. The `TIMESTAMPTZ` vs `TIMESTAMP` distinction matters in global systems: `TIMESTAMP` stores wall-clock time without timezone context, leading to ambiguous data when servers or clients are in different timezones.

---

### Example 21: Enum Types (PostgreSQL CREATE TYPE)

PostgreSQL supports custom ENUM types that restrict a column to a predefined set of values at the database level. This provides stronger typing than `TEXT` with a CHECK constraint and produces clearer error messages. SQLx maps PostgreSQL ENUM types to Rust enums with the `#[sqlx(type_name = "...")]` attribute.

```sql
-- File: migrations/20240113120000_create_order_status_enum.sql
-- => Creates PostgreSQL enum type for order status values

CREATE TYPE order_status AS ENUM (
    'pending',      -- => Order received but not yet processed
    'processing',   -- => Payment confirmed, items being prepared
    'shipped',      -- => Items dispatched to carrier
    'delivered',    -- => Items received by customer
    'cancelled'     -- => Order cancelled before delivery
);
-- => Creates a named enum type in the database schema
-- => Values are case-sensitive: 'pending' != 'Pending'
-- => Only listed values accepted; others raise ERROR 22P02 invalid_text_representation

CREATE TABLE orders_v2 (
    id BIGSERIAL PRIMARY KEY,
    customer_email TEXT NOT NULL,
    status order_status NOT NULL DEFAULT 'pending',
    -- => Uses the enum type we just created
    -- => DEFAULT 'pending': new orders start as pending
    -- => Violation: INSERT with status='unknown' raises type error immediately
    total_cents BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- => After execution: orders_v2 table with status restricted to enum values

-- CAUTION: Adding values to an enum requires ALTER TYPE
-- ALTER TYPE order_status ADD VALUE 'refunded' AFTER 'delivered';
-- => Safe to add values; removing values requires recreating the type
```

**Key Takeaway**: PostgreSQL enum types enforce value constraints at the type level, producing clearer error messages than CHECK constraints. However, adding new values is easy while removing values requires recreating the type—plan your enum values carefully.

**Why It Matters**: Database-level enum types prevent invalid status values even when data is inserted from tools, scripts, or services outside your Rust application. A `TEXT` column with no constraint can receive any string; an ENUM column rejects invalid values at the database level. The tradeoff is migration complexity when the enum values need to change: adding is safe, but removing requires `DROP TYPE` and recreation, which locks the table. For stable, well-known value sets, enum types are cleaner than CHECK constraints.

---

### Example 22: CHECK Constraints

CHECK constraints enforce that a column value satisfies a boolean expression at the database level. They are more flexible than ENUM types (any SQL expression) but produce less descriptive error messages. CHECK constraints are ideal for range validation, pattern matching, and cross-column rules.

```sql
-- File: migrations/20240114090000_add_check_constraints.sql
-- => Adds CHECK constraints for business rule enforcement

ALTER TABLE accounts
    ADD CONSTRAINT chk_accounts_balance_non_negative
    CHECK (balance_cents >= 0);
-- => Named constraint: chk_accounts_balance_non_negative
-- => Enforces: balance_cents cannot be negative
-- => Violation: ERROR 23514 check_violation with constraint name in message
-- => INSERT/UPDATE rejected if balance_cents < 0

ALTER TABLE transactions
    ADD CONSTRAINT chk_transactions_amount_positive
    CHECK (amount_cents > 0);
-- => All transactions must have a positive amount
-- => Signed direction (debit vs credit) stored in transaction_type column instead

ALTER TABLE accounts
    ADD CONSTRAINT chk_accounts_currency_format
    CHECK (char_length(currency) = 3 AND currency = upper(currency));
-- => Multi-condition CHECK: currency must be exactly 3 characters AND uppercase
-- => Enforces ISO 4217 format at database level: 'USD' valid, 'us' invalid
-- => AND operator: both conditions must be true
```

**Key Takeaway**: Name CHECK constraints with a consistent prefix (such as `chk_`) and a descriptive suffix describing the rule. Named constraints appear in error messages and can be dropped by name in later migrations.

**Why It Matters**: CHECK constraints prevent physically impossible data states such as negative account balances or zero-amount transactions. Application code can have bugs, be bypassed, or be replaced. Database constraints are the last line of defense. A negative balance in the accounts table can cascade into incorrect reports, incorrect billing, and security vulnerabilities. By enforcing the constraint at the database level, you guarantee the invariant holds regardless of what code path writes to the table.

---

### Example 23: Composite Indexes

A composite index covers multiple columns and can speed up queries that filter or sort on a combination of those columns. The column order in the index definition matters: the index supports queries that use a left-prefix of the indexed columns but not arbitrary subsets.

```sql
-- File: migrations/20240115100000_add_composite_indexes.sql
-- => Adds composite indexes to support multi-column query patterns

-- Composite index on (account_id, created_at) for time-range queries within an account
CREATE INDEX idx_transactions_account_time
    ON transactions (account_id, created_at DESC);
-- => B-tree index on two columns; rows sorted by account_id ASC, then created_at DESC
-- => Supports: WHERE account_id = 42 ORDER BY created_at DESC  (left-prefix: account_id)
-- => Supports: WHERE account_id = 42 AND created_at > '2024-01-01'  (both columns)
-- => Does NOT support efficiently: WHERE created_at > '2024-01-01'  (no left-prefix)

-- Composite unique index for idempotency key pattern
CREATE UNIQUE INDEX idx_transactions_idempotency
    ON transactions (account_id, transaction_type, created_at);
-- => Unique composite: prevents exact duplicate transactions (same account, type, time)
-- => UNIQUE enforces no two rows have same (account_id, transaction_type, created_at) combination
-- => Supports deduplication during bulk imports or retried operations

-- Covering index: include additional columns to avoid table lookups
CREATE INDEX idx_accounts_lookup
    ON accounts (owner_name)
    INCLUDE (balance_cents, currency);
-- => Index on owner_name; INCLUDE adds balance_cents and currency to index leaf pages
-- => Queries: SELECT balance_cents, currency FROM accounts WHERE owner_name = 'Alice'
-- => Covered by index: no table heap access needed (index-only scan)
-- => PostgreSQL 11+: INCLUDE clause supported
```

**Key Takeaway**: Design composite indexes to match your most frequent query patterns. The leftmost column in the index must appear in the query's `WHERE` clause or `ORDER BY` for the index to be used effectively.

**Why It Matters**: Composite indexes are often more efficient than multiple single-column indexes for queries that filter on multiple columns simultaneously. A query with `WHERE account_id = 42 AND created_at > '2024-01-01'` can use a single composite index scan rather than two separate index scans combined with a bitmap AND. Getting composite index design right in the migration phase avoids costly index additions later when the table has millions of rows and adding indexes takes hours.

---

### Example 24: Junction Tables (Many-to-Many)

A junction table (also called a join table or associative table) implements a many-to-many relationship between two entities. Each row in the junction table represents one association. The table contains foreign keys to both entities and often a composite primary key on those foreign keys.

```sql
-- File: migrations/20240116110000_create_account_tags.sql
-- => Implements many-to-many: accounts <-> tags

CREATE TABLE tags (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,       -- => Tag names must be unique ('premium', 'verified', etc.)
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- => Tags table: one row per distinct tag

CREATE TABLE account_tags (
    account_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    -- => Foreign key to accounts.id
    -- => ON DELETE CASCADE: when account is deleted, all its tags are removed automatically

    tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    -- => Foreign key to tags.id
    -- => ON DELETE CASCADE: when tag is deleted, all associations are removed automatically

    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- => When this association was created

    PRIMARY KEY (account_id, tag_id)
    -- => Composite primary key: each (account, tag) pair is unique
    -- => Prevents the same tag from being assigned to the same account twice
    -- => Also creates a B-tree index on (account_id, tag_id)
);
-- => After execution: many accounts can have many tags; each association is one row

-- Query: get all tags for a specific account
-- SELECT t.name FROM tags t
-- JOIN account_tags at ON t.id = at.tag_id
-- WHERE at.account_id = 42;
-- => Returns all tag names associated with account 42
```

**Key Takeaway**: Use a composite primary key on the two foreign key columns in a junction table. This enforces uniqueness of associations and creates an index that speeds up lookups by either foreign key.

**Why It Matters**: Junction tables are the standard relational pattern for many-to-many relationships. Without the composite primary key, duplicate associations can be inserted (same account tagged twice with the same tag). The `ON DELETE CASCADE` on both foreign keys is critical: forgetting it leaves orphaned rows in the junction table when either referenced entity is deleted, causing foreign key violations when those orphaned rows are later encountered.

---

### Example 25: Seed Data in Migrations

Migration files can contain `INSERT` statements as well as DDL. This pattern populates reference data (lookup tables, enum values, initial configuration) as part of the migration, ensuring every environment has the same baseline data. Seed data migrations run exactly once per database, just like structural migrations.

```sql
-- File: migrations/20240117090000_seed_account_tiers.sql
-- => Inserts reference data for account tiers
-- => This data is required for the application to function

CREATE TABLE account_tiers (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,          -- => 'standard', 'premium', 'enterprise'
    monthly_fee_cents INTEGER NOT NULL, -- => Monthly fee in cents
    max_transactions INTEGER NOT NULL,  -- => Maximum transactions per month
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- => Creates account_tiers lookup table

INSERT INTO account_tiers (name, monthly_fee_cents, max_transactions) VALUES
    ('standard',   0,     1000),
-- => Standard tier: free, 1000 transactions/month
    ('premium',    999,   10000),
-- => Premium tier: $9.99/month, 10000 transactions/month
    ('enterprise', 4999,  NULL);
-- => NULL for max_transactions means unlimited (no constraint)
-- => NULL only valid here because max_transactions column allows NULL
-- => After INSERT: 3 rows in account_tiers

-- IMPORTANT: seed data in migrations is immutable after deployment
-- => Do NOT modify seed data in the same migration after it has been applied
-- => Instead: write a new migration to UPDATE or INSERT additional rows
-- => Changing applied migrations is a checksum violation in sqlx migrate!()
```

**Key Takeaway**: Put seed data in dedicated migrations separate from structural changes. Mixing `CREATE TABLE` and `INSERT` in one migration is valid but harder to revert cleanly.

**Why It Matters**: Seed data in migrations guarantees that every environment has identical reference data from the first deployment. Teams that populate reference data manually via scripts frequently create drift: staging has 3 tiers, production has 4, and development has 2 with slightly different names. When application code assumes specific tier names or IDs, this drift causes bugs that appear only in some environments. Migration-embedded seed data eliminates this entire class of environment inconsistency.

---

### Example 26: Multiple Statements in One Migration

A single migration file can contain multiple SQL statements separated by semicolons. SQLx executes them sequentially within the same transaction (when using `migrate!()`), so a failure in any statement rolls back the entire migration, leaving the schema unchanged.

```sql
-- File: migrations/20240118100000_create_audit_system.sql
-- => Creates multiple related tables and indexes in one migration
-- => All executed atomically: all succeed or all roll back

CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,        -- => Which table was affected
    operation TEXT NOT NULL,         -- => 'INSERT', 'UPDATE', or 'DELETE'
    row_id TEXT NOT NULL,            -- => Primary key of affected row (as text)
    old_data JSONB,                  -- => Previous row data (NULL for INSERT)
    new_data JSONB,                  -- => New row data (NULL for DELETE)
    performed_by TEXT NOT NULL,      -- => Username or service that made the change
    performed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- => First statement: audit_log table created

CREATE INDEX idx_audit_log_table_time
    ON audit_log (table_name, performed_at DESC);
-- => Second statement: index for querying audit log by table and time

CREATE INDEX idx_audit_log_row
    ON audit_log (table_name, row_id);
-- => Third statement: index for querying audit history of a specific row

-- All three statements run in the same transaction
-- => If CREATE INDEX fails: audit_log table is also rolled back
-- => Database sees either all three changes or none
-- => _sqlx_migrations records the migration only on full success
```

**Key Takeaway**: Group logically related DDL statements in one migration file. The atomic transaction behavior means all statements succeed together or none take effect, maintaining schema consistency.

**Why It Matters**: Atomic migration execution prevents partially-applied schema states that are hard to diagnose and recover from. If `CREATE TABLE` succeeds but `CREATE INDEX` fails halfway through, the table exists without its expected indexes—a schema state that exists in no migration version and must be fixed manually. SQLx's transaction wrapping eliminates this problem automatically. Grouping related statements also makes migration history more meaningful: one migration file represents one coherent schema change.

---

### Example 27: IF NOT EXISTS Guards

`IF NOT EXISTS` clauses in DDL statements make migrations idempotent: they succeed whether the object already exists or not. This is useful when migrations must be re-applied (for example, after a failed deployment that partially applied), when running against databases with hand-applied schemas, or when migrations are embedded using `include_str!()` without `_sqlx_migrations` tracking.

```sql
-- File: migrations/001_users.sql
-- => Uses IF NOT EXISTS guards for all DDL statements
-- => Safe to run multiple times against the same database

CREATE TABLE IF NOT EXISTS users (
    -- => IF NOT EXISTS: skip CREATE if users table already exists
    -- => Without IF NOT EXISTS: ERROR 42P07 duplicate_table if table exists
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at VARCHAR(50) NOT NULL
);
-- => If users table exists: no error, no change
-- => If users table absent: table created with all columns

CREATE INDEX IF NOT EXISTS idx_users_username
    ON users (username);
-- => IF NOT EXISTS: skip index creation if idx_users_username already exists
-- => Without IF NOT EXISTS: ERROR 42P07 if index exists

-- For ALTER TABLE, use DO blocks (PostgreSQL) or accept the error in application code
-- DO $$
-- BEGIN
--     IF NOT EXISTS (SELECT 1 FROM information_schema.columns
--                    WHERE table_name='users' AND column_name='display_name') THEN
--         ALTER TABLE users ADD COLUMN display_name TEXT;
--     END IF;
-- END $$;
-- => Check before ALTER TABLE ADD COLUMN (no native IF NOT EXISTS for ADD COLUMN)
```

**Key Takeaway**: Use `IF NOT EXISTS` when you manage migration execution yourself (as with `include_str!()` and a custom runner). When using `sqlx::migrate!()` with `_sqlx_migrations` tracking, `IF NOT EXISTS` is optional since SQLx guarantees each migration runs exactly once.

**Why It Matters**: The `demo-be-rust-axum` migration files use `IF NOT EXISTS` throughout because they are executed via a custom `run_migrations` function rather than through `sqlx::migrate!()` with its built-in tracking. This makes the migrations safe to re-execute after a crash mid-migration or after restoring a database to an earlier state. In general, `IF NOT EXISTS` guards are a good defensive practice even with migration tracking, since they make the SQL idempotent at the statement level.

---

### Example 28: Dropping Tables/Columns Safely

`DROP TABLE IF EXISTS` and `ALTER TABLE DROP COLUMN IF EXISTS` remove database objects. The `IF EXISTS` clause prevents errors when the object has already been removed. Dropping objects is irreversible and destroys data, so always verify the drop is intentional and the data is either migrated or no longer needed.

```sql
-- File: migrations/20240120110000_remove_legacy_sessions.sql
-- => Removes the legacy sessions table replaced by refresh_tokens

-- Safe drop: succeeds whether table exists or not
DROP TABLE IF EXISTS legacy_sessions;
-- => IF EXISTS: returns success even if legacy_sessions does not exist
-- => Without IF EXISTS: ERROR 42P01 undefined_table if table absent
-- => IRREVERSIBLE: all data in legacy_sessions is permanently deleted
-- => Write a .down.sql to re-create the table if rollback is needed

-- Drop a column from an existing table
ALTER TABLE users
    DROP COLUMN IF EXISTS legacy_session_token;
-- => IF EXISTS: no error if column already absent
-- => Removes legacy_session_token column and all its data
-- => IRREVERSIBLE: column data is permanently lost

-- CAUTION: check for dependent objects before dropping
-- DROP TABLE accounts;
-- => ERROR 2BP01 dependent_objects_still_exist if transactions.account_id references accounts
-- => Must drop dependent tables first, or use CASCADE

-- Drop with CASCADE (drops all dependent objects too)
-- DROP TABLE IF EXISTS accounts CASCADE;
-- => Drops accounts AND drops transactions.fk_transactions_account foreign key
-- => DANGEROUS: cascades can remove more than intended; prefer explicit ordering
```

**Key Takeaway**: Always use `IF EXISTS` when dropping objects in migration files. Verify foreign key dependencies before dropping tables; use explicit ordering (drop dependent tables first) rather than `CASCADE` to avoid unintended data loss.

**Why It Matters**: A `DROP TABLE` without `IF EXISTS` fails on a fresh database where the migration has never been applied—a common occurrence when setting up new developer environments from scratch. `IF EXISTS` makes the migration idempotent. More critically, drops are the one migration operation with no built-in safety net: the data is gone. The discipline of writing explicit `.down.sql` files that recreate dropped objects is the only protection against accidentally losing production data during a botched rollback.

---

### Example 29: Cascade Delete Foreign Keys

`ON DELETE CASCADE` on a foreign key automatically deletes child rows when the parent row is deleted. This maintains referential integrity without requiring the application to manually delete child records before the parent. The cascade behavior is defined in the migration and runs at the database level.

```sql
-- File: migrations/20240121090000_create_documents_with_cascade.sql
-- => Creates a documents system with cascade delete behavior

CREATE TABLE documents (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    owner_id BIGINT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    -- => ON DELETE CASCADE: deleting an account automatically deletes all its documents
    -- => Prevents orphaned documents with no owner
    -- => Alternative: ON DELETE RESTRICT (default) prevents account deletion if documents exist
    -- => Alternative: ON DELETE SET NULL (sets owner_id to NULL on account deletion)
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE document_sections (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    -- => Cascade from documents: deleting a document deletes all its sections
    -- => Combined with the documents cascade: deleting an account cascades through
    -- => accounts -> documents -> document_sections (two levels of cascade)
    section_order INTEGER NOT NULL,
    content TEXT NOT NULL
);
-- => After execution: three-level cascade chain
-- => DELETE FROM accounts WHERE id = 42;
-- => => Deletes: account row 42
-- => => Cascade level 1: deletes all documents where owner_id = 42
-- => => Cascade level 2: deletes all document_sections where document_id IN (deleted docs)
```

**Key Takeaway**: Define cascade behavior explicitly in the foreign key declaration. The default (`RESTRICT`) prevents deletes that would create orphaned rows, which is safer but requires the application to delete child records in the correct order.

**Why It Matters**: Cascade deletes simplify application logic for user account deletion: one `DELETE FROM accounts WHERE id = ?` statement removes all associated data without requiring the application to know the full dependency tree. The tradeoff is that cascades can delete more data than intended if the dependency tree is larger than expected. Always test cascade behavior in development before deploying. For GDPR compliance (right to erasure), cascade deletes are often the correct design: deleting a user should delete all their personal data atomically.

---

### Example 30: \_sqlx_migrations Table Structure

SQLx automatically creates and manages the `_sqlx_migrations` table in every database where migrations are applied. This table is the source of truth for migration state and is what `sqlx migrate info` reads to determine which migrations are pending. Understanding its structure helps you debug migration issues.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
%% _sqlx_migrations table structure and how SQLx uses it
graph TD
    A["sqlx migrate run"] -->|"1. Connect to database"| B["Check _sqlx_migrations<br/>table exists"]
    B -->|"table absent: create it"| C["CREATE TABLE _sqlx_migrations"]
    B -->|"table present: query applied versions"| D["SELECT version FROM<br/>_sqlx_migrations"]
    D --> E["Compare with migration files<br/>on disk or embedded"]
    E -->|"pending versions found"| F["Execute migration SQL<br/>in transaction"]
    F -->|"success"| G["INSERT INTO _sqlx_migrations<br/>version, checksum, applied_at"]
    G -->|"next pending migration"| F

    style A fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style B fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style C fill:#CA9161,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style D fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style E fill:#CC78BC,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style F fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style G fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

```sql
-- The _sqlx_migrations table (created automatically by SQLx)
-- Inspect it with:
-- SELECT * FROM _sqlx_migrations ORDER BY version;

-- Table structure (approximate):
-- CREATE TABLE _sqlx_migrations (
--     version BIGINT PRIMARY KEY,
--     -- => version: the numeric prefix from the migration file name
--     -- => 20240101120000 for timestamp-based; 1 for "001_..." after stripping prefix
--
--     description TEXT NOT NULL,
--     -- => description: text after the version prefix in the file name
--     -- => "20240101120000_create_users.sql" -> description = "create_users"
--
--     installed_on TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     -- => installed_on: when this migration was applied to THIS database
--
--     success BOOLEAN NOT NULL,
--     -- => success: TRUE if migration completed; FALSE if it failed partway through
--
--     checksum BLOB NOT NULL,
--     -- => checksum: SHA-384 hash of the migration file contents
--     -- => SQLx verifies this on every run: if file changes after being applied, error raised
--
--     execution_time BIGINT NOT NULL
--     -- => execution_time: nanoseconds the migration took to execute
-- );

-- Query to see all applied migrations and their checksums:
-- SELECT version, description, installed_on, success, execution_time
-- FROM _sqlx_migrations
-- ORDER BY version;
-- => version | description       | installed_on        | success | execution_time
-- => 1       | create_users      | 2024-01-01 12:00:05 | true    | 2456000
-- => 2       | create_products   | 2024-01-01 12:00:06 | true    | 1123000
```

**Key Takeaway**: Never modify migration files after they have been applied to any database. SQLx stores a checksum of each applied migration and raises an error if the file contents change, preventing silent schema drift.

**Why It Matters**: The checksum verification in `_sqlx_migrations` is the mechanism that prevents a common mistake: editing a migration file after it has been deployed to fix a typo or add a missing column, which would leave the database in a different state than what the migration file describes. SQLx detects this mismatch and refuses to proceed, forcing you to write a new migration instead. This protects the invariant that migration history is immutable: once applied, a migration is a permanent record of a schema change at a point in time.

---

## What is Next?

You have completed the beginner examples covering SQLx migration fundamentals. At this point you can:

- Write SQL migration files following SQLx naming conventions
- Use `sqlx migrate add`, `sqlx migrate run`, `sqlx migrate info`, and `sqlx migrate revert`
- Embed migrations in Rust binaries using `migrate!()` and `include_str!()`
- Set up `PgPool`, `SqlitePool`, and `AnyPool` for different environments
- Apply common schema patterns: tables, indexes, foreign keys, constraints, enums, junction tables, and seed data
- Understand how `_sqlx_migrations` tracks applied migrations and enforces checksums

These 30 examples cover the migrate feature of SQLx comprehensively for production use.
