---
title: "Intermediate"
date: 2026-03-27T00:00:00+07:00
draft: false
weight: 10000002
description: "Rust SQLx intermediate tutorial with 30 annotated examples covering transactions, multi-database support, custom types, compile-time verification, and migration testing (40-75% coverage)"
tags: ["rust-sqlx", "tutorial", "by-example", "intermediate", "transactions", "compile-time", "testing", "custom-types"]
---

## Intermediate Examples (31-60)

**Coverage**: 40-75% of SQLx migration functionality

**Focus**: Transactions in migrations, multi-database support, custom types, compile-time query verification, advanced schema patterns, and migration testing.

These examples assume you understand beginner concepts (migration files, CLI commands, embedded migrations, connection pool setup). All examples are self-contained and demonstrate production-grade patterns.

---

### Example 31: Transactions in Migrations

A migration that modifies multiple tables should wrap all statements in a single transaction. If any statement fails, the transaction rolls back and the database returns to its pre-migration state—neither partially applied nor corrupted.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
%% Transaction migration: all-or-nothing execution
graph TD
    A["BEGIN"] -->|"Execute statements"| B["CREATE TABLE orders"]
    B -->|"Continue"| C["CREATE TABLE order_items"]
    C -->|"All succeed"| D["COMMIT"]
    C -->|"Any fail"| E["ROLLBACK"]
    D -->|"Migration recorded"| F["_sqlx_migrations updated"]
    E -->|"Schema unchanged"| G["Migration not recorded"]

    style A fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style B fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style C fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style D fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style E fill:#CC78BC,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style F fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style G fill:#CC78BC,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

```sql
-- File: migrations/20240110100000_create_orders.sql
-- => Wrapping in BEGIN/COMMIT ensures atomicity
-- => SQLx itself wraps migrations in transactions by default for PostgreSQL
-- => Explicit transaction here for clarity and for databases that need it

BEGIN;
-- => Start transaction; all subsequent statements are part of this unit

CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    -- => Auto-incrementing primary key
    customer_id BIGINT NOT NULL,
    -- => Foreign key to customers table (not shown here)
    status TEXT NOT NULL DEFAULT 'pending',
    -- => Order lifecycle state; default is pending on creation
    total_cents BIGINT NOT NULL DEFAULT 0,
    -- => Total stored in cents; avoids floating-point rounding
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    -- => Timestamp with timezone; records creation moment
);
-- => orders table created inside transaction

CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    -- => Each line item has its own surrogate key
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    -- => Foreign key: deleting an order cascades to remove its items
    product_sku TEXT NOT NULL,
    -- => Product identifier; TEXT allows alphanumeric SKUs
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    -- => Quantity must be positive; CHECK enforced by database
    unit_price_cents BIGINT NOT NULL
    -- => Per-unit price in cents at time of order
);
-- => order_items table created inside same transaction

COMMIT;
-- => Both tables created atomically; if any statement failed, neither exists
-- => _sqlx_migrations records this version only after COMMIT succeeds
```

**Key Takeaway**: Wrap multi-statement migrations in explicit transactions. If the migration partially fails, the database rolls back to its state before the migration started.

**Why It Matters**: A migration that creates two related tables but fails halfway leaves your schema in an inconsistent state—one table exists, the other does not. Any code deploying against that database will fail in unpredictable ways. Transaction-wrapped migrations guarantee atomic application: either the entire migration succeeds and is recorded, or nothing changes. This property is especially critical in production deployments where a failed migration must leave the database in a known-good state for rollback.

---

### Example 32: Multi-Database Migrations (Postgres + SQLite)

SQLx supports PostgreSQL, SQLite, MySQL, and MSSQL through a common interface. When your application must run against multiple database backends—for example, PostgreSQL in production and SQLite in tests—you maintain separate migration directories or write compatible SQL.

```sql
-- File: migrations/postgres/20240110110000_create_events.sql
-- => PostgreSQL-specific migration using native types
-- => Use when running against PostgreSQL only

CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    -- => BIGSERIAL: PostgreSQL-specific auto-increment type
    -- => Equivalent to BIGINT with a sequence attached
    event_type TEXT NOT NULL,
    -- => TEXT: PostgreSQL's preferred variable-length string type
    payload JSONB NOT NULL DEFAULT '{}',
    -- => JSONB: binary JSON storage, indexed and queryable
    -- => Not available in SQLite; requires database-specific handling
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    -- => TIMESTAMPTZ: timezone-aware timestamp (PostgreSQL-specific name)
);
-- => This migration only applies when DATABASE_URL points to PostgreSQL
```

```sql
-- File: migrations/sqlite/20240110110000_create_events.sql
-- => SQLite-compatible migration using portable types
-- => Use when running against SQLite (e.g., in-memory tests)

CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    -- => INTEGER PRIMARY KEY: SQLite's equivalent to BIGSERIAL
    -- => AUTOINCREMENT prevents reuse of deleted row IDs
    event_type TEXT NOT NULL,
    -- => TEXT: SQLite stores all strings as TEXT
    payload TEXT NOT NULL DEFAULT '{}',
    -- => TEXT: SQLite has no native JSON type; store as text
    -- => Application code must serialize/deserialize JSON manually
    occurred_at TEXT NOT NULL DEFAULT (datetime('now'))
    -- => TEXT: SQLite stores dates as ISO 8601 strings
    -- => datetime('now') produces UTC timestamp string
);
-- => Compatible with sqlite::memory: used in test pools
```

**Key Takeaway**: Maintain separate migration files per database backend when using SQLite for tests and PostgreSQL for production. The SQL dialects differ enough that portable SQL is often more complex than two targeted files.

**Why It Matters**: Running integration tests against SQLite in-memory databases eliminates Docker dependencies from the unit test suite, making CI faster and local development easier. The tradeoff is maintaining two sets of migration files. This is the pattern used by the demo-be-rust-axum project: one connection pool for production PostgreSQL and one for SQLite in tests. The migration logic must be aware of which backend is active, which the next example demonstrates.

---

### Example 33: Database-Specific SQL Branching

When a single Rust codebase must run migrations against multiple databases, use runtime branching on the database kind to execute the appropriate SQL. SQLx's `AnyPool` hides connection differences but SQL syntax still varies.

```rust
use sqlx::AnyPool;

// => Runtime detection of which database backend the pool is connected to
// => Called at application startup before running migrations
async fn run_compatible_migration(pool: &AnyPool) -> Result<(), sqlx::Error> {
    let db_kind = pool.any_kind();
    // => AnyKind enum: Postgres, Sqlite, MySql, or Mssql
    // => Determined from the DATABASE_URL scheme at pool creation time

    let create_events_sql = match db_kind {
        // => Pattern match on the database kind; each arm returns SQL string
        sqlx::any::AnyKind::Postgres => {
            // => PostgreSQL branch: use native types
            "CREATE TABLE IF NOT EXISTS events (
                id BIGSERIAL PRIMARY KEY,
                payload JSONB NOT NULL DEFAULT '{}'
             )"
            // => BIGSERIAL and JSONB are PostgreSQL-only
        }
        sqlx::any::AnyKind::Sqlite => {
            // => SQLite branch: use compatible types
            "CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                payload TEXT NOT NULL DEFAULT '{}'
             )"
            // => INTEGER AUTOINCREMENT and TEXT are SQLite idioms
        }
        _ => {
            // => Catch-all for MySQL/MSSQL; return error instead of wrong SQL
            return Err(sqlx::Error::Configuration(
                "Unsupported database backend".into(),
            ));
            // => Fail fast with a clear message rather than execute wrong SQL
        }
    };

    sqlx::query(create_events_sql).execute(pool).await?;
    // => Execute the backend-specific CREATE TABLE statement
    // => ? propagates sqlx::Error to the caller
    Ok(())
    // => Migration applied successfully for the detected backend
}
```

**Key Takeaway**: Use `pool.any_kind()` to detect the database backend at runtime and branch on it to execute database-specific SQL within a single Rust codebase.

**Why It Matters**: Multi-backend support is a deliberate architectural choice that trades portability for developer convenience. The demo-be-rust-axum project uses this pattern to run the same application binary against PostgreSQL in production and SQLite in fast unit tests, avoiding Docker in the test suite while still testing real SQL logic. The branching pattern keeps the application self-contained while accommodating both backends cleanly.

---

### Example 34: Custom Enum Types with FromRow

SQLx's `FromRow` derive macro maps database rows to Rust structs automatically. When a column contains a string-represented enum, you implement `TryFrom<String>` on your Rust enum to integrate with the mapping.

```rust
use sqlx::{FromRow, AnyPool};

// => Custom enum representing user roles
// => Database stores these as TEXT values
#[derive(Debug, PartialEq)]
enum UserRole {
    Admin,
    // => Maps from "ADMIN" string in database
    User,
    // => Maps from "USER" string in database
    ReadOnly,
    // => Maps from "READ_ONLY" string in database
}

impl TryFrom<String> for UserRole {
    // => TryFrom: fallible conversion from String to UserRole
    type Error = String;
    // => Error type is String; carries the unrecognized value for debugging

    fn try_from(s: String) -> Result<Self, Self::Error> {
        // => Called during FromRow deserialization
        match s.as_str() {
            "ADMIN" => Ok(UserRole::Admin),
            // => Exact match on database string value
            "USER" => Ok(UserRole::User),
            // => Maps "USER" string to Rust enum variant
            "READ_ONLY" => Ok(UserRole::ReadOnly),
            // => Maps "READ_ONLY" string to Rust enum variant
            unknown => Err(format!("Unknown role: {}", unknown)),
            // => Unknown values produce error, not silent default
        }
    }
}

// => Raw database row mapped directly; role is String from DB
#[derive(Debug, FromRow)]
struct UserRow {
    id: i64,
    // => Maps from BIGINT or INTEGER PRIMARY KEY column
    username: String,
    // => Maps from TEXT or VARCHAR column
    role: String,
    // => Raw role string from database; converted separately
}

async fn fetch_user_role(
    pool: &AnyPool,
    user_id: i64,
) -> Result<UserRole, Box<dyn std::error::Error>> {
    let row = sqlx::query_as::<_, UserRow>(
        "SELECT id, username, role FROM users WHERE id = $1"
        // => $1: positional parameter placeholder (PostgreSQL style)
    )
    .bind(user_id)
    // => Bind user_id as the first parameter; SQLx handles type conversion
    .fetch_one(pool)
    // => fetch_one: expects exactly one row; errors on zero or multiple
    .await?;
    // => ? propagates sqlx::Error if query fails

    let role = UserRole::try_from(row.role)?;
    // => Convert String to enum; propagates error if unknown value
    // => role is now a strongly-typed UserRole variant
    Ok(role)
    // => Return the typed role to the caller
}
```

**Key Takeaway**: Map string database columns to Rust enums using `TryFrom<String>`. This approach keeps the database schema simple (TEXT columns) while giving Rust code type-safe enum access.

**Why It Matters**: Storing role and status values as plain strings in the database avoids database-specific enum types, which are harder to alter and vary across PostgreSQL, SQLite, and MySQL. The `TryFrom` conversion boundary ensures that any value not recognized by the current Rust code surfaces as an error immediately on read, rather than silently becoming an incorrect default. This protects against database rows that contain stale or misspelled values.

---

### Example 35: JSON/JSONB Columns

PostgreSQL's `JSONB` type stores structured data as binary JSON with indexing support. SQLx maps JSONB columns to Rust types using the `serde_json::Value` type from the `serde_json` crate.

```sql
-- File: migrations/20240110140000_add_metadata_column.sql
-- => Adds a JSONB column to an existing table for flexible structured data

ALTER TABLE products
    ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}';
-- => JSONB: binary JSON, validated on insert, indexable via GIN
-- => NOT NULL: every product must have a metadata object (even if empty)
-- => DEFAULT '{}': new products get an empty JSON object automatically
-- => Existing rows receive the default value on migration apply
```

```rust
use sqlx::{FromRow, AnyPool};
use serde_json::Value as JsonValue;

// => FromRow struct with JSONB column mapped to serde_json::Value
#[derive(Debug, FromRow)]
struct Product {
    id: i64,
    // => Maps from BIGINT PRIMARY KEY
    name: String,
    // => Maps from TEXT NOT NULL
    metadata: JsonValue,
    // => Maps from JSONB column; requires serde_json feature in sqlx
    // => Cargo.toml: sqlx = { features = ["runtime-tokio", "postgres", "json"] }
}

async fn insert_product_with_metadata(pool: &AnyPool) -> Result<(), sqlx::Error> {
    let metadata = serde_json::json!({
        // => serde_json::json! macro creates a JsonValue at compile time
        "weight_kg": 0.5,
        // => Numeric field in JSON object
        "tags": ["electronics", "portable"],
        // => Array field; JSONB stores arrays natively
        "supplier": { "country": "JP", "lead_days": 14 }
        // => Nested object; JSONB handles arbitrary depth
    });
    // => metadata is serde_json::Value::Object at this point

    sqlx::query(
        "INSERT INTO products (name, metadata) VALUES ($1, $2)"
        // => $2 binds a JsonValue; SQLx serializes to JSONB on insert
    )
    .bind("USB Hub")
    // => Binds the product name as TEXT
    .bind(&metadata)
    // => Binds the JSON value; requires the "json" feature in sqlx
    .execute(pool)
    .await?;
    // => Row inserted with JSONB metadata stored in binary format
    Ok(())
}
```

**Key Takeaway**: Use `serde_json::Value` with the `json` feature flag in SQLx to bind and retrieve JSONB columns. Enable `features = ["json"]` in `Cargo.toml`.

**Why It Matters**: JSONB columns provide an escape hatch for attributes that vary per record—product metadata, configuration settings, event payloads—without requiring additional tables or schema migrations every time a new attribute appears. Unlike plain TEXT, JSONB validates JSON structure on insert and supports indexing operators (`@>`, `?`) for efficient querying. The combination of JSONB storage and Rust's serde ecosystem gives you flexible schema with type-safe deserialization into concrete structs when needed.

---

### Example 36: Array Columns (PostgreSQL)

PostgreSQL supports native array columns that store multiple values of the same type in a single field. SQLx maps these to Rust `Vec<T>` using the `postgres` feature and appropriate type parameters.

```sql
-- File: migrations/20240110150000_add_tags_column.sql
-- => Adds a native PostgreSQL array column for product tags

ALTER TABLE products
    ADD COLUMN tags TEXT[] NOT NULL DEFAULT '{}';
-- => TEXT[]: array of text values; PostgreSQL-native type
-- => NOT NULL: every product has a tags array (empty array is valid)
-- => DEFAULT '{}': new rows get an empty array; PostgreSQL array literal
-- => Not portable to SQLite; SQLite has no native array type
```

```rust
use sqlx::{FromRow, PgPool};

// => PgPool instead of AnyPool; arrays require PostgreSQL-specific driver
// => AnyPool does not support Vec<String> for array columns
#[derive(Debug, FromRow)]
struct ProductWithTags {
    id: i64,
    // => Maps from BIGINT PRIMARY KEY
    name: String,
    // => Maps from TEXT NOT NULL
    tags: Vec<String>,
    // => Maps from TEXT[] column; SQLx decodes PostgreSQL array to Vec<String>
    // => Requires: sqlx = { features = ["runtime-tokio-native-tls", "postgres"] }
}

async fn query_products_by_tag(
    pool: &PgPool,
    tag: &str,
) -> Result<Vec<ProductWithTags>, sqlx::Error> {
    let products = sqlx::query_as::<_, ProductWithTags>(
        "SELECT id, name, tags FROM products WHERE $1 = ANY(tags)"
        // => ANY(tags): PostgreSQL operator checks if $1 is in the array column
        // => Equivalent to: tag IN (SELECT unnest(tags))
    )
    .bind(tag)
    // => Binds the tag string as TEXT for the ANY comparison
    .fetch_all(pool)
    // => fetch_all: returns all matching rows as Vec<ProductWithTags>
    .await?;
    // => Each row's tags column decoded to Vec<String> automatically

    Ok(products)
    // => Returns products whose tags array contains the given tag
}
```

**Key Takeaway**: Use `Vec<T>` to map PostgreSQL array columns in SQLx. This requires `PgPool` (not `AnyPool`) and the `postgres` feature flag.

**Why It Matters**: Native PostgreSQL arrays eliminate the need for a separate join table when you need to store a variable-length list of scalar values per record—tags, permissions, allowed IP ranges. The `ANY()` operator provides efficient membership testing without unnesting. The main limitation is that arrays work only on PostgreSQL; if your application needs to run on SQLite (for tests), you must handle this column differently or store tags as a comma-separated text column.

---

### Example 37: Foreign Keys with ON UPDATE CASCADE

Foreign key constraints enforce referential integrity between tables. The `ON UPDATE CASCADE` clause automatically propagates a primary key change to all referencing rows, removing the need for manual cascading updates in application code.

```sql
-- File: migrations/20240110160000_create_categories.sql
-- => Creates a category hierarchy with cascading foreign keys

CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    -- => Surrogate primary key
    code TEXT NOT NULL UNIQUE,
    -- => Business identifier; UNIQUE ensures no duplicate codes
    -- => ON UPDATE CASCADE will propagate changes to this column
    name TEXT NOT NULL
    -- => Display name for the category
);
-- => categories table created; code column is the cascading target

ALTER TABLE products
    ADD COLUMN category_code TEXT REFERENCES categories(code)
        ON UPDATE CASCADE
        ON DELETE SET NULL;
-- => Foreign key references categories.code (not categories.id)
-- => ON UPDATE CASCADE: if categories.code changes, products.category_code updates automatically
-- => ON DELETE SET NULL: if category is deleted, products.category_code becomes NULL
-- => Without CASCADE, updating categories.code would fail if products reference it
```

**Key Takeaway**: Use `ON UPDATE CASCADE` on foreign keys that reference mutable business identifiers. Use `ON DELETE SET NULL` when child records should be preserved but disassociated when the parent is removed.

**Why It Matters**: Foreign keys enforce referential integrity at the database level, independent of application code. A products row with a `category_code` that does not exist in categories is rejected by the database before reaching any Rust code. `ON UPDATE CASCADE` allows the business to rename category codes without requiring a coordinated multi-table update query. Production schemas that skip foreign key constraints typically accumulate orphaned rows over time that cause subtle bugs years later when those rows appear in query results.

---

### Example 38: Composite Primary Keys

A composite primary key uses two or more columns together to uniquely identify a row. This is the natural choice for junction tables representing many-to-many relationships.

```sql
-- File: migrations/20240110170000_create_product_warehouse.sql
-- => Junction table for many-to-many: products <-> warehouses
-- => Composite primary key prevents duplicate warehouse-product combinations

CREATE TABLE product_warehouse (
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    -- => One half of the composite key; references products table
    -- => ON DELETE CASCADE: removing a product removes its warehouse entries
    warehouse_id BIGINT NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    -- => Other half of the composite key; references warehouses table
    -- => ON DELETE CASCADE: removing a warehouse removes its product entries
    quantity INTEGER NOT NULL DEFAULT 0,
    -- => Stock quantity for this product at this warehouse
    last_restocked_at TIMESTAMPTZ,
    -- => Nullable: NULL means never restocked since record creation

    PRIMARY KEY (product_id, warehouse_id)
    -- => Composite primary key: (product_id, warehouse_id) pair must be unique
    -- => Prevents inserting the same product-warehouse combination twice
    -- => Automatically creates a composite index on both columns
);
-- => Junction table ready; each row represents one product's presence in one warehouse
```

```rust
use sqlx::AnyPool;

// => Insert or update stock quantity using composite key
async fn upsert_stock(
    pool: &AnyPool,
    product_id: i64,
    // => First component of composite key
    warehouse_id: i64,
    // => Second component of composite key
    quantity: i32,
    // => New stock quantity to record
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO product_warehouse (product_id, warehouse_id, quantity)
         VALUES ($1, $2, $3)
         ON CONFLICT (product_id, warehouse_id)
         DO UPDATE SET quantity = EXCLUDED.quantity"
        // => ON CONFLICT targets the composite primary key
        // => EXCLUDED.quantity: the value that was rejected by the conflict
        // => DO UPDATE: upsert pattern (insert or update, never error)
    )
    .bind(product_id)
    // => Binds first key component
    .bind(warehouse_id)
    // => Binds second key component
    .bind(quantity)
    // => Binds the quantity to insert or update
    .execute(pool)
    .await?;
    // => Row inserted or updated atomically; no race condition
    Ok(())
}
```

**Key Takeaway**: Use composite primary keys for junction tables. The `ON CONFLICT (col1, col2) DO UPDATE` clause implements upsert semantics targeting a composite key.

**Why It Matters**: Composite primary keys express the domain model directly in the schema: a product can appear in a warehouse only once. An auto-increment surrogate key on the junction table would allow duplicate product-warehouse combinations unless you add a separate `UNIQUE` constraint. Using the composite primary key as the conflict target in upserts also eliminates application-level check-then-insert race conditions common in concurrent stock management systems.

---

### Example 39: Partial Indexes

A partial index covers only rows that satisfy a condition. This creates a smaller, faster index than a full-table index and enforces conditional uniqueness—for example, ensuring email uniqueness only among active users.

```sql
-- File: migrations/20240110180000_add_partial_indexes.sql
-- => Partial indexes reduce index size and enforce conditional constraints

-- Index: only active users, for fast login lookups
CREATE INDEX idx_users_email_active
    ON users (email)
    WHERE status = 'ACTIVE';
-- => Index covers only rows where status = 'ACTIVE'
-- => Fast for: SELECT * FROM users WHERE email = $1 AND status = 'ACTIVE'
-- => Smaller than full index: inactive/deleted users excluded
-- => Query planner uses this index when WHERE clause matches the index predicate

-- Unique partial index: email must be unique among active users only
CREATE UNIQUE INDEX idx_users_email_unique_active
    ON users (email)
    WHERE status = 'ACTIVE';
-- => UNIQUE: enforces uniqueness constraint scoped to active users
-- => A deleted user's email can be reused by a new active user
-- => Without UNIQUE here, a separate UNIQUE column constraint would block reuse
-- => PostgreSQL enforces this at INSERT/UPDATE time for matching rows
```

**Key Takeaway**: Partial indexes combine a condition with an index to cover only the rows you actually query. A `UNIQUE` partial index enforces uniqueness scoped to a subset of rows.

**Why It Matters**: Applications that soft-delete records frequently need conditional uniqueness: an email address must be unique among active users but should be reusable after an account is closed. A full-table `UNIQUE` constraint prevents this reuse. A `UNIQUE` partial index scoped to `status = 'ACTIVE'` enforces the business rule precisely. Additionally, partial indexes on common filter columns (active status, unprocessed jobs, unread messages) are orders of magnitude smaller and faster than full-table indexes on large tables with many infrequently-queried rows.

---

### Example 40: Full-Text Search Indexes

PostgreSQL's `tsvector` type stores preprocessed text for full-text search. A `GIN` index on a `tsvector` column enables fast full-text queries using the `@@` operator.

```sql
-- File: migrations/20240110190000_add_fulltext_search.sql
-- => Adds full-text search capability to the products table

ALTER TABLE products
    ADD COLUMN search_vector tsvector
        GENERATED ALWAYS AS (
            to_tsvector('english', name || ' ' || COALESCE(description, ''))
        ) STORED;
-- => tsvector: preprocessed lexeme list for full-text search
-- => GENERATED ALWAYS AS ... STORED: computed column, auto-updated on changes
-- => to_tsvector('english', ...): tokenize and stem using English dictionary
-- => Concatenates name and description into one searchable document
-- => COALESCE handles NULL description by substituting empty string

CREATE INDEX idx_products_search
    ON products USING GIN (search_vector);
-- => USING GIN: specifies GIN index type; required for tsvector containment queries
-- => Required for @@ full-text search operator to use index scan
-- => Without this index, full-text queries fall back to sequential scan
```

```rust
use sqlx::{FromRow, PgPool};

#[derive(Debug, FromRow)]
struct ProductSearchResult {
    id: i64,
    name: String,
    // => Returned columns; search_vector not fetched (not needed in result)
}

async fn search_products(
    pool: &PgPool,
    query: &str,
) -> Result<Vec<ProductSearchResult>, sqlx::Error> {
    let results = sqlx::query_as::<_, ProductSearchResult>(
        "SELECT id, name FROM products
         WHERE search_vector @@ plainto_tsquery('english', $1)
         ORDER BY ts_rank(search_vector, plainto_tsquery('english', $1)) DESC"
        // => @@: full-text match operator; uses GIN index
        // => plainto_tsquery: converts plain text query to tsquery type
        // => ts_rank: ranks results by relevance; higher rank = closer match
        // => ORDER BY rank DESC: most relevant results first
    )
    .bind(query)
    // => Bind the user's search string; plainto_tsquery handles escaping
    .fetch_all(pool)
    .await?;
    // => Returns only products matching the full-text query

    Ok(results)
}
```

**Key Takeaway**: Use a `GENERATED ALWAYS AS` tsvector column with a GIN index for full-text search. The computed column keeps the search index synchronized automatically on every `INSERT` or `UPDATE`.

**Why It Matters**: Full-text search requires preprocessing text into lexemes (stemmed, normalized word forms) to match "run", "runs", and "running" to the same query. The `GENERATED ALWAYS AS STORED` pattern eliminates the need for application code to update the `tsvector` column—the database handles it on every write. The GIN index then makes text searches fast enough for production use. This approach avoids the complexity and cost of a dedicated search service for simple text search requirements.

---

### Example 41: Conditional Column Addition (IF NOT EXISTS Pattern)

The `IF NOT EXISTS` pattern prevents migration errors when re-running a migration against a database where the change was already partially applied. PostgreSQL 9.6+ supports `ADD COLUMN IF NOT EXISTS` for idempotent column additions.

```sql
-- File: migrations/20240110200000_add_optional_columns.sql
-- => Uses IF NOT EXISTS to make column additions safe to re-run

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS phone_number TEXT;
-- => IF NOT EXISTS: no error if phone_number already exists
-- => Without IF NOT EXISTS: migration fails if column was added manually
-- => Useful for: recovery after partially-applied migrations
-- => PostgreSQL 9.6+; not available in older versions or SQLite

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
-- => IF NOT EXISTS applies to each ADD COLUMN independently
-- => email_verified added only if not already present
-- => DEFAULT FALSE: existing rows get FALSE for this new column

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
-- => Nullable column: no DEFAULT needed (existing rows get NULL)
-- => NULL represents "never logged in" which is semantically correct
```

**Key Takeaway**: Use `ADD COLUMN IF NOT EXISTS` when you need idempotent column additions. The clause prevents errors when a column was added manually or by a previously interrupted migration.

**Why It Matters**: In continuous deployment environments, migrations sometimes get applied partially—a deployment starts, a migration partially runs, then the deployment is rolled back. On the next deployment attempt, the migration must run again but some DDL may have already executed. `IF NOT EXISTS` makes column additions safe to retry without manual intervention. This pattern is especially valuable in on-call situations where a failed deployment needs quick recovery and re-running migrations should never require manual database surgery.

---

### Example 42: Seed Data with INSERT...ON CONFLICT

The `INSERT ... ON CONFLICT DO NOTHING` pattern inserts seed data only when the row does not already exist, making the migration idempotent. This is the standard way to add reference data (lookup tables, default configurations) in migrations.

```sql
-- File: migrations/20240110210000_seed_categories.sql
-- => Inserts reference data idempotently; safe to re-run

INSERT INTO categories (code, name) VALUES
    ('ELECTRONICS', 'Electronics'),
    -- => Insert electronics category; conflict on code column skips row
    ('CLOTHING', 'Clothing'),
    -- => Insert clothing category
    ('FOOD', 'Food & Beverages'),
    -- => Insert food category
    ('BOOKS', 'Books & Media')
    -- => Insert books category
ON CONFLICT (code) DO NOTHING;
-- => ON CONFLICT (code): triggers when a row with the same code exists
-- => DO NOTHING: skip the insert without error; existing row unchanged
-- => Allows this migration to run multiple times without duplicating rows
-- => Alternative: ON CONFLICT DO UPDATE SET name = EXCLUDED.name
-- =>   (use UPDATE if you want to refresh names on re-run)
```

**Key Takeaway**: Use `INSERT ... ON CONFLICT (unique_column) DO NOTHING` for seed data. This makes the migration idempotent—safe to run on databases that already contain the reference data.

**Why It Matters**: Reference tables (currencies, country codes, product categories, permission types) need initial data populated before the application can function. The `ON CONFLICT DO NOTHING` pattern allows this data seeding to happen in a migration file that the application applies automatically on startup, rather than requiring a separate manual step. The idempotent property means running `sqlx migrate run` in CI or on a fresh staging environment always produces the same database state without manual coordination.

---

### Example 43: Migration Ordering and Dependencies

SQLx applies migrations in lexicographic order by filename. When a migration creates a table that another migration references, the creating migration must have a lower version number (earlier lexicographic position).

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
%% Migration dependency order: lower version must run before higher version
graph LR
    A["001_create_users.sql"] -->|"Must exist before"| B["002_create_posts.sql"]
    B -->|"Must exist before"| C["003_add_post_stats.sql"]
    A -->|"Must exist before"| D["004_create_sessions.sql"]

    style A fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style B fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style C fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style D fill:#CC78BC,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

```sql
-- File: migrations/20240101000001_create_users.sql
-- => Version 20240101000001: runs first (earliest timestamp)

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    -- => users table must exist before posts can reference it
    username TEXT NOT NULL UNIQUE
    -- => Unique username; referenced by post author display
);
-- => Migration 1 complete; users table available for foreign keys

-- File: migrations/20240101000002_create_posts.sql
-- => Version 20240101000002: runs second (after users exists)

CREATE TABLE posts (
    id BIGSERIAL PRIMARY KEY,
    -- => Surrogate primary key for each post
    author_id BIGINT NOT NULL REFERENCES users(id),
    -- => Foreign key to users.id; would fail if 20240101000001 hadn't run first
    -- => SQLx guarantees order: 20240101000001 always applied before 20240101000002
    title TEXT NOT NULL
    -- => Post title; required
);
-- => Migration 2 complete; posts table with valid foreign key to users

-- File: migrations/20240101000003_add_post_stats.sql
-- => Version 20240101000003: runs third (after posts exists)

ALTER TABLE posts
    ADD COLUMN view_count BIGINT NOT NULL DEFAULT 0;
-- => Modifies posts table; requires 20240101000002 to have run first
-- => SQLx's ordered execution guarantees this
```

**Key Takeaway**: SQLx applies migrations in ascending lexicographic order by filename. Encode dependencies by assigning lower version numbers to migrations that must run first.

**Why It Matters**: Migration dependencies are implicit through foreign keys and ALTER TABLE statements. SQLx enforces ordering automatically—you cannot apply migration 3 before migration 2 because migration 3 would fail. The critical discipline is naming: timestamp-based prefixes from `sqlx migrate add` guarantee order reflects creation time, which naturally encodes dependencies (you create the referenced table before the referencing table). Teams that rename or renumber migrations after the fact frequently break this ordering, causing foreign key errors on fresh database setups.

---

### Example 44: sqlx-cli Commands Reference

The `sqlx-cli` tool provides all commands needed to manage migrations from the command line. These commands wrap the same functionality available programmatically in Rust code.

```bash
# Install sqlx-cli (run once)
cargo install sqlx-cli --no-default-features --features postgres,sqlite
# => Installs sqlx binary into ~/.cargo/bin/
# => --no-default-features: skip MySQL/MSSQL to reduce compile time
# => --features postgres,sqlite: enable only the backends you use

# Create a new migration file
sqlx migrate add create_products
# => Creates: migrations/<timestamp>_create_products.sql
# => Timestamp format: YYYYMMDDHHmmss (UTC)

# Create a reversible migration pair
sqlx migrate add --reversible create_products
# => Creates: migrations/<timestamp>_create_products.up.sql
# => Creates: migrations/<timestamp>_create_products.down.sql

# Apply all pending migrations
sqlx migrate run
# => Reads DATABASE_URL from environment or --database-url flag
# => Applies unapplied migrations in version order
# => Idempotent: safe to run when already up-to-date

# Revert the most recent migration
sqlx migrate revert
# => Applies the .down.sql file for the most recently applied version
# => Only works for reversible migrations; errors if no .down.sql exists
# => Removes the version from _sqlx_migrations

# Check migration status
sqlx migrate info
# => Lists all migrations and their applied/pending status
# => Shows version, description, applied_at, and checksum

# Prepare offline mode (compile-time verification without live DB)
sqlx prepare
# => Connects to database and runs EXPLAIN on all sqlx::query! macros
# => Writes query metadata to .sqlx/ directory
# => Required before building with SQLX_OFFLINE=true

# Verify database schema matches current migrations
sqlx database reset
# => Drops and recreates the database, then applies all migrations
# => Use in development only; DESTRUCTIVE in production
```

**Key Takeaway**: Use `sqlx migrate run` in deployment pipelines, `sqlx migrate info` to audit migration status, and `sqlx prepare` before commits to update compile-time query metadata.

**Why It Matters**: A clear mental model of the CLI commands prevents operational errors. `sqlx migrate revert` requires pre-existing `.down.sql` files, so teams that write only `.up.sql` files cannot use it. `sqlx prepare` must be run before every commit that changes query text—CI fails with compile errors otherwise when `SQLX_OFFLINE=true`. Running `sqlx database reset` in production destroys all data. Knowing which commands are safe in production and which are destructive is essential operational knowledge.

---

### Example 45: Offline Mode (sqlx prepare)

SQLx's compile-time query verification (`sqlx::query!`) normally requires a live database connection at compile time. Offline mode caches query metadata in `.sqlx/` files, allowing CI to compile without a database.

```bash
# Step 1: Ensure DATABASE_URL points to a live database
export DATABASE_URL=postgres://user:pass@localhost/mydb
# => Must be set and accessible before running sqlx prepare

# Step 2: Apply all migrations to bring DB schema up to date
sqlx migrate run
# => Database schema must match what the code expects
# => query! macros will be validated against this schema

# Step 3: Generate offline query metadata
sqlx prepare
# => Connects to database and introspects each sqlx::query! call
# => Generates .sqlx/query-<hash>.json for each unique query
# => These JSON files contain column names, types, and nullability

# Step 4: Commit the .sqlx/ directory
git add .sqlx/
git commit -m "chore: update sqlx offline query metadata"
# => .sqlx/ files must be checked in; CI reads them during offline build
# => Without these files, CI compile fails with: set SQLX_OFFLINE=true to...
```

```bash
# Step 5: CI builds with offline mode enabled (no database available)
export SQLX_OFFLINE=true
cargo build
# => Reads .sqlx/ JSON files instead of connecting to database
# => Compile-time type checking still works from cached metadata
# => Build succeeds without DATABASE_URL set in CI environment
```

**Key Takeaway**: Run `sqlx prepare` after any query change, commit the `.sqlx/` directory, and set `SQLX_OFFLINE=true` in CI to compile without a live database connection.

**Why It Matters**: The compile-time query verification that makes SQLx type-safe would otherwise require every developer and every CI build to have a running database. Offline mode preserves the type safety benefit while eliminating the database dependency from the compile step. The `.sqlx/` cache files are the contract between the developer's local database and CI—when a developer changes a query, they must regenerate and commit these files or CI will reject the build. This workflow enforces that schema and queries always stay in sync.

---

### Example 46: SQLX_OFFLINE Environment Variable

The `SQLX_OFFLINE` environment variable controls whether SQLx uses cached query metadata or a live database connection for compile-time verification. Setting it correctly is essential for CI/CD pipelines.

```toml
# Cargo.toml excerpt
# => Configure SQLx features; offline mode requires specific features

[dependencies]
sqlx = { version = "0.7", features = [
    "runtime-tokio-native-tls",
    # => Async runtime; use runtime-tokio-rustls to avoid OpenSSL dependency
    "postgres",
    # => PostgreSQL driver; include sqlite if needed for tests
    "macros",
    # => Required for query!, query_as!, and sqlx::test attribute
    "migrate",
    # => Required for sqlx::migrate! and Migrator
] }
```

```bash
# Development: SQLX_OFFLINE not set (default behavior)
# => SQLx connects to DATABASE_URL at compile time
# => query! macros validated against live schema
cargo build
# => Requires DATABASE_URL set and database running

# CI: SQLX_OFFLINE=true (no database available in CI)
export SQLX_OFFLINE=true
cargo build
# => SQLx reads .sqlx/*.json files instead of connecting
# => No DATABASE_URL needed; no database process needed
# => Fails if .sqlx/ files are missing or outdated

# Verify: check if .sqlx/ is up to date (use as CI gate)
SQLX_OFFLINE=false sqlx prepare --check
# => Re-runs prepare and compares output to existing .sqlx/ files
# => Exit code 0: .sqlx/ is up to date
# => Exit code 1: .sqlx/ is outdated; run sqlx prepare to update
# => Add this check to CI to catch forgotten prepare runs before merge
```

**Key Takeaway**: Set `SQLX_OFFLINE=true` in CI where no database is available. Use `sqlx prepare --check` as a CI gate to detect outdated query metadata before the build.

**Why It Matters**: Forgetting to run `sqlx prepare` after a query change is one of the most common SQLx workflow mistakes. Adding `sqlx prepare --check` as a CI step catches this immediately and requires the developer to regenerate `.sqlx/` before the PR merges. Without this gate, a PR that changes a query but omits the updated `.sqlx/` files will compile locally (live database) but fail in CI (offline). The check step closes this gap by making the offline cache staleness visible in CI before merge.

---

### Example 47: Migration Testing with sqlx::test

The `#[sqlx::test]` attribute macro creates an isolated test database, applies migrations, and tears down the database after the test. It enables integration-style tests that run real SQL against a real schema.

```rust
// => Cargo.toml: sqlx = { features = ["runtime-tokio-native-tls", "postgres", "migrate", "macros"] }
// => DATABASE_URL must point to a PostgreSQL server; sqlx::test creates a temp database

#[cfg(test)]
mod tests {
    use sqlx::PgPool;

    // => #[sqlx::test]: creates a fresh database, applies migrations, passes pool to test
    // => Migrations applied from path specified by sqlx(migrations = "path") or default ./migrations
    // => Database is automatically dropped after the test function returns
    #[sqlx::test]
    async fn test_insert_user(pool: PgPool) {
        // => pool: connection to a fresh database with all migrations applied
        // => PgPool type; test database backend is PostgreSQL

        let result = sqlx::query(
            "INSERT INTO users (username, email, role)
             VALUES ($1, $2, $3)
             RETURNING id"
            // => RETURNING id: retrieve the auto-generated primary key
        )
        .bind("alice")
        // => Bind username; must satisfy NOT NULL constraint
        .bind("alice@example.com")
        // => Bind email; must satisfy NOT NULL and UNIQUE constraints
        .bind("USER")
        // => Bind role; matches the expected string values in the role column
        .fetch_one(&pool)
        // => fetch_one: expect exactly one returned row
        .await
        .expect("Insert should succeed");
        // => Test fails here if INSERT raises a database error

        let id: i64 = result.get("id");
        // => Extract the returned id column as i64
        assert!(id > 0);
        // => Auto-generated IDs start from 1; a positive value confirms insertion
    }
    // => After test: pool closed, temporary database dropped automatically
}
```

**Key Takeaway**: Use `#[sqlx::test]` for database integration tests. Each test gets an isolated fresh database with migrations applied, and the database is dropped after the test completes.

**Why It Matters**: Testing database logic against a real schema prevents false positives from mocked repositories. The `#[sqlx::test]` macro handles database lifecycle automatically—creating, migrating, and dropping—so each test starts from a known-clean state. This eliminates test interdependency (one test's inserts affecting another test's assertions) without requiring manual cleanup code. The tradeoff is that `sqlx::test` requires a running PostgreSQL server, making it an integration test rather than a unit test. The demo-be-rust-axum project uses SQLite in-memory pools for unit tests and reserves PostgreSQL for `test:integration`.

---

### Example 48: Test Database Setup Pattern

For unit tests that must run without a live PostgreSQL server, SQLx's SQLite in-memory database provides a fast, isolated alternative. The test pool setup pattern mirrors the production pool setup.

```rust
use sqlx::AnyPool;

// => Shared test pool setup function; called at the start of each test
// => Returns a pool with all migrations applied against SQLite in-memory
pub async fn create_test_pool() -> Result<AnyPool, sqlx::Error> {
    sqlx::any::install_default_drivers();
    // => Register both PostgreSQL and SQLite drivers into the AnyPool registry
    // => Required before creating any AnyPool; called once per process

    let pool = sqlx::pool::PoolOptions::new()
        .max_connections(1)
        // => SQLite in-memory: max 1 connection to avoid multiple-writer corruption
        // => In-memory databases are connection-scoped; multiple connections = separate DBs
        .connect("sqlite::memory:")
        // => sqlite::memory: creates a fresh in-memory database
        // => Each call creates a completely isolated database instance
        .await?;
    // => Pool established; no migrations applied yet

    run_migrations(&pool).await?;
    // => Apply all migrations; same function used in production pool setup
    // => After this: schema is identical to what production would have

    Ok(pool)
    // => Return the ready-to-use test pool; caller owns it
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_user_insert_and_fetch() {
        let pool = create_test_pool().await.expect("Test pool setup failed");
        // => Fresh SQLite in-memory database with all migrations applied

        sqlx::query(
            "INSERT INTO users (id, username, email, created_at, updated_at)
             VALUES ('test-id-1', 'alice', 'alice@test.com', '2024-01-01', '2024-01-01')"
        )
        .execute(&pool)
        .await
        .expect("Insert failed");
        // => Insert test data; runs against in-memory SQLite

        let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM users")
            .fetch_one(&pool)
            .await
            .expect("Count query failed");
        // => query_scalar: fetch a single scalar value; COUNT(*) returns i64

        assert_eq!(count, 1);
        // => Exactly one user inserted; pool is fresh so no pre-existing rows
    }
    // => Pool dropped here; in-memory database destroyed automatically
}
```

**Key Takeaway**: Use `sqlite::memory:` with `max_connections(1)` for unit test pools. Call the same migration function as production to ensure test schema matches production schema.

**Why It Matters**: Fast unit tests that run without Docker or a PostgreSQL server make the test loop tight enough for test-driven development. The key discipline is applying the exact same migration code path in tests as in production—using a separate hand-crafted test schema is dangerous because it can diverge from production and miss schema-related bugs. The demo-be-rust-axum project uses this pattern: the `create_test_pool()` function is shared between production and test code, ensuring the test schema is always the current production schema.

---

### Example 49: Creating Views in Migrations

A SQL view defines a named query that behaves like a table in SELECT statements. Views encapsulate complex joins or filtered queries, giving application code a simpler surface to query.

```sql
-- File: migrations/20240110230000_create_active_users_view.sql
-- => Creates a view that filters soft-deleted users
-- => Views are computed on every query; no data stored separately

CREATE VIEW active_users AS
    SELECT
        id,
        -- => Include primary key for joins and lookups
        username,
        -- => Display name fields included
        email,
        -- => Email exposed; only active users appear
        role,
        -- => Role included for permission checks
        created_at
        -- => Timestamp for reporting
    FROM users
    WHERE deleted_at IS NULL;
    -- => Predicate filters out soft-deleted rows
    -- => Application code queries active_users instead of users directly
    -- => Adding new columns to users requires recreating the view
```

```rust
use sqlx::{FromRow, AnyPool};

// => Struct maps to the view's column set
// => FromRow reads columns by name; view columns must match struct fields
#[derive(Debug, FromRow)]
struct ActiveUser {
    id: String,
    // => Maps from VARCHAR(36) id column
    username: String,
    // => Maps from VARCHAR(50) username column
    email: String,
    // => Maps from VARCHAR(255) email column
}

async fn list_active_users(pool: &AnyPool) -> Result<Vec<ActiveUser>, sqlx::Error> {
    let users = sqlx::query_as::<_, ActiveUser>(
        "SELECT id, username, email FROM active_users"
        // => Queries the view; database engine executes the view's WHERE clause
        // => No application-level NULL check needed; view handles filtering
    )
    .fetch_all(pool)
    .await?;
    // => Only returns users where deleted_at IS NULL

    Ok(users)
}
```

**Key Takeaway**: Create views in migrations like any other DDL. Views centralize query logic in the database, ensuring all application paths see the same filtered or joined data.

**Why It Matters**: Views prevent the soft-delete `WHERE deleted_at IS NULL` predicate from being scattered across dozens of queries in application code. If the soft-delete logic changes, you update the view definition once rather than hunting for every query that needs the filter. Views also enforce consistent data access patterns across multiple services or programming languages that share the same database, since they all query the same view definition enforced by the database engine.

---

### Example 50: Creating Materialized Views

A materialized view stores the result of a query on disk and refreshes it on demand. Unlike regular views, materialized views trade staleness for query performance when the underlying query is expensive.

```sql
-- File: migrations/20240110240000_create_sales_summary_view.sql
-- => Creates a materialized view for expensive aggregation query

CREATE MATERIALIZED VIEW daily_sales_summary AS
    SELECT
        DATE_TRUNC('day', created_at) AS sale_date,
        -- => DATE_TRUNC: truncate timestamp to day boundary for grouping
        -- => PostgreSQL function; not available in SQLite
        category,
        -- => Group by product category
        COUNT(*) AS order_count,
        -- => Total number of orders per day per category
        SUM(total_cents) AS total_revenue_cents
        -- => Sum of all order totals in cents
    FROM orders
    GROUP BY DATE_TRUNC('day', created_at), category;
-- => Result stored on disk; aggregation query runs once at creation
-- => Subsequent queries against daily_sales_summary read cached result
-- => Data becomes stale after new orders; requires explicit REFRESH

-- Create index on materialized view for fast date lookups
CREATE INDEX idx_daily_sales_sale_date
    ON daily_sales_summary (sale_date);
-- => Indexes work on materialized views just like regular tables
-- => Supports fast range queries: WHERE sale_date BETWEEN ... AND ...
```

**Key Takeaway**: Materialized views store precomputed query results for expensive aggregations. Create them in migrations like regular tables; refresh them via scheduled jobs in application code.

**Why It Matters**: Reporting queries that aggregate millions of orders per category are too slow to run on every dashboard request. A materialized view precomputes the result once and stores it, turning a multi-second aggregation into a millisecond index scan. The tradeoff is data staleness: the view shows results as of the last `REFRESH MATERIALIZED VIEW`. For daily sales reports, overnight refresh is acceptable. For real-time dashboards, a different approach (event streaming, pre-aggregated OLAP tables) is more appropriate. Materialized views are the right tool for reports where slight staleness is acceptable and raw query performance is unacceptable.

---

### Example 51: Trigger Functions (PostgreSQL)

A trigger function is a special PostgreSQL function that executes automatically before or after a DML event (`INSERT`, `UPDATE`, `DELETE`). Triggers enforce business rules and audit logging at the database level.

```sql
-- File: migrations/20240110250000_create_updated_at_trigger.sql
-- => Creates a reusable trigger function that sets updated_at on every UPDATE

CREATE OR REPLACE FUNCTION set_updated_at()
-- => CREATE OR REPLACE: idempotent; safe to re-run migration
-- => Function name: set_updated_at; will be referenced by triggers
RETURNS TRIGGER AS $$
-- => RETURNS TRIGGER: required return type for trigger functions
-- => $$ ... $$: dollar-quoting; avoids escaping issues in SQL strings
BEGIN
    NEW.updated_at = NOW();
    -- => NEW: the row being inserted/updated; modify it before write
    -- => updated_at set to current timestamp on every update
    RETURN NEW;
    -- => Return modified row; trigger uses this as the actual updated row
END;
$$ LANGUAGE plpgsql;
-- => plpgsql: PostgreSQL's procedural language for triggers and functions

-- Attach trigger to users table
CREATE TRIGGER users_set_updated_at
    BEFORE UPDATE ON users
    -- => BEFORE UPDATE: fires before the update reaches the table
    -- => Allows modifying NEW before it is written
    FOR EACH ROW
    -- => FOR EACH ROW: fires once per updated row (vs FOR EACH STATEMENT)
    EXECUTE FUNCTION set_updated_at();
-- => Any UPDATE on users now automatically sets updated_at = NOW()
-- => Application code does not need to set updated_at manually

-- Attach same trigger function to orders table
CREATE TRIGGER orders_set_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
-- => Same function reused; DRY principle applied at database level
```

**Key Takeaway**: Use `CREATE OR REPLACE FUNCTION` with `RETURNS TRIGGER` to define reusable trigger logic. Attach the function to multiple tables with separate `CREATE TRIGGER` statements.

**Why It Matters**: Application code that forgets to set `updated_at` on an update silently produces incorrect audit timestamps. A database-level trigger makes `updated_at` maintenance automatic and universal—every update path, including direct SQL queries, scripts, and other languages accessing the same database, sets the timestamp correctly. The `RETURNS TRIGGER` + `BEFORE UPDATE` pattern is idiomatic PostgreSQL for audit fields. Note that triggers are PostgreSQL-specific and do not work in SQLite, so tests using SQLite in-memory databases must handle `updated_at` in application code.

---

### Example 52: Stored Procedures

Stored procedures encapsulate multi-step business logic in the database. In PostgreSQL, they are created with `CREATE PROCEDURE` and called with `CALL`. Unlike functions, procedures can manage transactions internally.

```sql
-- File: migrations/20240110260000_create_transfer_procedure.sql
-- => Stored procedure for atomic balance transfer between accounts

CREATE OR REPLACE PROCEDURE transfer_funds(
    from_account_id BIGINT,
    -- => Source account; balance will be reduced
    to_account_id BIGINT,
    -- => Destination account; balance will be increased
    amount_cents BIGINT
    -- => Transfer amount in cents; must be positive
)
LANGUAGE plpgsql AS $$
-- => plpgsql block starts; procedure body between $$ delimiters
BEGIN
    IF amount_cents <= 0 THEN
        RAISE EXCEPTION 'Transfer amount must be positive: %', amount_cents;
        -- => RAISE EXCEPTION: throws error; aborts the procedure
        -- => % interpolates the amount_cents value into the message
    END IF;
    -- => Validation complete; proceed with transfer

    UPDATE accounts
        SET balance_cents = balance_cents - amount_cents
        WHERE id = from_account_id;
    -- => Debit source account

    UPDATE accounts
        SET balance_cents = balance_cents + amount_cents
        WHERE id = to_account_id;
    -- => Credit destination account in same transaction

    COMMIT;
    -- => COMMIT inside procedure: procedures can manage their own transactions
    -- => Both UPDATEs committed atomically; no partial transfer possible
END;
$$;
```

```rust
use sqlx::PgPool;

async fn execute_transfer(
    pool: &PgPool,
    from_id: i64,
    to_id: i64,
    amount_cents: i64,
) -> Result<(), sqlx::Error> {
    sqlx::query("CALL transfer_funds($1, $2, $3)")
    // => CALL: invokes a stored procedure; different from SELECT used for functions
    .bind(from_id)
    // => Bind source account id
    .bind(to_id)
    // => Bind destination account id
    .bind(amount_cents)
    // => Bind transfer amount in cents
    .execute(pool)
    .await?;
    // => Procedure runs atomically; returns Ok(()) on success
    Ok(())
}
```

**Key Takeaway**: Use `CREATE PROCEDURE` with `CALL` for multi-step operations that need transaction control inside the database. Use `RAISE EXCEPTION` for input validation within the procedure.

**Why It Matters**: Moving transactional business logic like fund transfers into a stored procedure ensures atomicity even when called from multiple application paths. Application code that performs debit and credit as two separate queries risks leaving accounts in an inconsistent state if the process crashes between the two updates. A stored procedure that commits both operations together eliminates this window. The main downside is that stored procedure logic is harder to version-control, test, and debug than application code—use them selectively for operations where atomicity is the primary concern.

---

### Example 53: Table Partitioning

PostgreSQL range partitioning divides a large table into smaller physical partitions based on a column range. Queries that filter on the partition key automatically scan only the relevant partitions, improving performance on large time-series tables.

```sql
-- File: migrations/20240110270000_create_events_partitioned.sql
-- => Range-partitioned events table; each partition covers one month

CREATE TABLE events_partitioned (
    id BIGSERIAL NOT NULL,
    -- => NOT NULL on id; BIGSERIAL doesn't auto-add PRIMARY KEY to partitioned tables
    event_type TEXT NOT NULL,
    -- => Event category for filtering
    payload JSONB NOT NULL DEFAULT '{}',
    -- => Event data stored as binary JSON
    occurred_at TIMESTAMPTZ NOT NULL
    -- => Partition key: must be in partition range for INSERT to succeed
) PARTITION BY RANGE (occurred_at);
-- => PARTITION BY RANGE: declarative partitioning on occurred_at column
-- => Physical partitions defined below; this is the parent table only

-- Create partition for January 2024
CREATE TABLE events_2024_01 PARTITION OF events_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
-- => Covers: occurred_at >= '2024-01-01' AND occurred_at < '2024-02-01'
-- => INSERTs with January timestamps route to this partition automatically
-- => SELECTs with January date range scan only this partition

-- Create partition for February 2024
CREATE TABLE events_2024_02 PARTITION OF events_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
-- => Covers February; new partitions added monthly via migration or cron job

-- Default partition catches out-of-range inserts
CREATE TABLE events_default PARTITION OF events_partitioned DEFAULT;
-- => DEFAULT partition: receives rows that don't fit any range partition
-- => Prevents INSERT errors for unexpected timestamp values
```

**Key Takeaway**: Use `PARTITION BY RANGE` on the timestamp column for time-series tables. Create one partition per time period and a DEFAULT partition to catch out-of-range rows.

**Why It Matters**: A single events table with billions of rows becomes slow to query, index, and maintain. Range partitioning allows PostgreSQL to prune irrelevant partitions from query plans—a query for January 2024 events scans only the January partition, not the entire table. Old partitions can be detached and archived without deleting individual rows. New partitions can be created as migration files on a schedule. This pattern is essential for audit logs, IoT sensor data, financial transactions, and any table where records accumulate continuously over months and years.

---

### Example 54: Generated/Computed Columns

Generated columns compute their value automatically from other columns in the same row. PostgreSQL 12+ and SQLite 3.31+ support stored generated columns that persist the computed value on disk.

```sql
-- File: migrations/20240110280000_add_computed_columns.sql
-- => Adds generated columns to orders table

ALTER TABLE orders
    ADD COLUMN total_with_tax_cents BIGINT
        GENERATED ALWAYS AS (total_cents + (total_cents / 10))
        STORED;
-- => GENERATED ALWAYS AS: computed from expression; cannot be set by INSERT/UPDATE
-- => Expression: adds 10% tax (integer division; no fractional cents)
-- => STORED: computed value saved on disk; fast to read, slight write overhead
-- => Updates to total_cents automatically recompute total_with_tax_cents

ALTER TABLE orders
    ADD COLUMN is_large_order BOOLEAN
        GENERATED ALWAYS AS (total_cents > 100000)
        STORED;
-- => Boolean flag: TRUE when order exceeds 1000.00 (stored as cents)
-- => Useful for filtering large orders without application-level threshold logic
-- => Threshold change requires migration to update the expression
```

**Key Takeaway**: Use `GENERATED ALWAYS AS ... STORED` for columns whose value is always derivable from other columns. The database keeps them consistent automatically on every write.

**Why It Matters**: Application code that computes derived values (tax totals, discount amounts, boolean flags based on thresholds) must remember to update those derived values on every write path. Generated columns eliminate this synchronization burden—the database always computes them correctly regardless of which code path wrote the row. The `STORED` variant also allows indexing generated columns, enabling fast filtered queries like `WHERE is_large_order = TRUE` without full-table scans. The tradeoff is that changing the generation expression requires a migration, making the expression part of the schema contract.

---

### Example 55: GIN Index for JSONB

A GIN (Generalized Inverted Index) on a JSONB column enables fast containment queries using the `@>` operator. Without a GIN index, JSONB containment queries require a full sequential scan.

```sql
-- File: migrations/20240110290000_add_jsonb_gin_index.sql
-- => Creates a GIN index on the metadata JSONB column for fast containment queries

CREATE INDEX idx_products_metadata_gin
    ON products USING GIN (metadata);
-- => USING GIN: specifies GIN index type; required for JSONB @> operator
-- => Indexes the entire JSONB document; supports all containment queries
-- => Index size: larger than B-tree but covers arbitrary key paths

-- Alternative: GIN index with jsonb_path_ops operator class
CREATE INDEX idx_products_metadata_path_gin
    ON products USING GIN (metadata jsonb_path_ops);
-- => jsonb_path_ops: smaller index, faster for @> queries, only supports @>
-- => Default GIN (without operator class) also supports ?, ?|, ?& operators
-- => Choose jsonb_path_ops when you only need @> containment queries
```

```rust
use sqlx::{FromRow, PgPool};

#[derive(Debug, FromRow)]
struct ProductId {
    id: i64,
    // => Maps from BIGINT PRIMARY KEY column
}

async fn find_products_by_metadata(
    pool: &PgPool,
    key: &str,
    value: &str,
) -> Result<Vec<i64>, sqlx::Error> {
    let filter = serde_json::json!({ key: value });
    // => Build JSONB containment filter dynamically
    // => Example: {"supplier": "JP"} matches all products with that key-value

    let rows = sqlx::query_as::<_, ProductId>(
        "SELECT id FROM products WHERE metadata @> $1"
        // => @>: containment operator; left side contains right side
        // => Uses GIN index; fast even on tables with millions of rows
        // => Without GIN index: sequential scan through all JSONB documents
    )
    .bind(serde_json::to_value(&filter).unwrap())
    // => Bind the JSON filter; SQLx serializes to JSONB on the wire
    .fetch_all(pool)
    .await?;

    Ok(rows.into_iter().map(|r| r.id).collect())
    // => Return list of matching product IDs
}
```

**Key Takeaway**: Create a GIN index on JSONB columns when using the `@>` containment operator in queries. Use `jsonb_path_ops` for smaller indexes when only `@>` queries are needed.

**Why It Matters**: JSONB columns are tempting for flexible schemas but become query performance bottlenecks without proper indexing. A `@>` containment query on an unindexed JSONB column performs a sequential scan, reading every row and deserializing every document. A GIN index builds an inverted index over all keys and values in the JSONB documents, making containment queries logarithmic. For product metadata, event payloads, or user preferences stored as JSONB, the GIN index is essential to prevent degraded query performance as the table grows.

---

### Example 56: Expression Indexes

An expression index indexes the result of an expression rather than a raw column value. This enables efficient querying on computed or transformed values without storing the computed column.

```sql
-- File: migrations/20240110300000_add_expression_indexes.sql
-- => Expression indexes for case-insensitive search and computed predicates

-- Case-insensitive email lookup with uniqueness
CREATE UNIQUE INDEX idx_users_email_lower
    ON users (LOWER(email));
-- => Indexes LOWER(email) expression result
-- => Enables fast: SELECT * FROM users WHERE LOWER(email) = LOWER($1)
-- => UNIQUE: prevents duplicate emails differing only in case
-- => Without this index, case-insensitive lookup requires sequential scan

-- Index on extracted JSONB field
CREATE INDEX idx_products_supplier_country
    ON products ((metadata->>'supplier'));
-- => metadata->>'supplier': extracts supplier field as TEXT from JSONB
-- => ->>: JSONB operator; extracts value as text (not JSONB sub-document)
-- => Parentheses required around expression in index definition
-- => Much smaller than full GIN index; targets one specific field only

-- Partial expression index for active recent orders
CREATE INDEX idx_orders_active_recent
    ON orders (created_at DESC)
    WHERE status = 'pending';
-- => Partial expression index: covers only pending orders sorted by date
-- => Fast for: SELECT * FROM orders WHERE status = 'pending' ORDER BY created_at DESC
-- => Index is small: only pending orders stored, not all orders
```

**Key Takeaway**: Use expression indexes to speed up queries that filter or sort on computed values. Combine with partial index conditions for maximum selectivity.

**Why It Matters**: Case-insensitive user lookups that use `LOWER(email) = LOWER($1)` will perform sequential scans unless there is an index on `LOWER(email)`. Expression indexes solve this at the database level without requiring the application to normalize values before storing them. The single-field JSONB expression index (`metadata->>'supplier'`) targets one frequently-queried field with a small B-tree index rather than the large GIN index that covers all fields. Choosing the right index type for each access pattern is a critical production performance skill.

---

### Example 57: Batch Data Migration Pattern

A batch migration updates or transforms large tables in chunks to avoid holding long-lived locks and causing replication lag. It is the safe pattern for backfilling computed columns or transforming existing data.

```sql
-- File: migrations/20240110310000_backfill_normalized_email.sql
-- => Step 1: Add nullable column (fast; no data written yet)

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS normalized_email TEXT;
-- => Add column as nullable first; avoids table rewrite with DEFAULT
-- => NULL means "not yet backfilled" for this column
-- => IF NOT EXISTS: safe to re-run if migration was interrupted
```

```rust
use sqlx::AnyPool;

// => Batch backfill function; call in a loop until rows_updated returns 0
// => Each call updates up to 1000 rows and commits; minimizes lock hold time
async fn backfill_normalized_email_batch(
    pool: &AnyPool,
) -> Result<u64, sqlx::Error> {
    let result = sqlx::query(
        "UPDATE users SET normalized_email = LOWER(email)
         WHERE normalized_email IS NULL
         LIMIT 1000"
        // => WHERE normalized_email IS NULL: only unprocessed rows
        // => LIMIT 1000: process 1000 rows per call; adjust as needed
        // => Each call acquires and releases lock; other queries can proceed between calls
    )
    .execute(pool)
    .await?;

    Ok(result.rows_affected())
    // => Return count; caller loops until this returns 0 (backfill complete)
}

// => Caller: run until backfill is complete
async fn run_full_backfill(pool: &AnyPool) -> Result<(), sqlx::Error> {
    loop {
        let updated = backfill_normalized_email_batch(pool).await?;
        // => Process one batch; updated is rows changed this iteration
        if updated == 0 {
            break;
            // => No more rows to update; backfill complete
        }
    }
    Ok(())
    // => All rows now have non-NULL normalized_email; safe to add NOT NULL constraint
}
```

**Key Takeaway**: Add columns as nullable first, backfill in batches from application code, then add the NOT NULL constraint after all rows are populated. Never backfill millions of rows in a single migration.

**Why It Matters**: A single `UPDATE` statement on a 100-million-row table holds an exclusive lock for minutes, blocking all reads and writes and creating replication lag. Batch updates of 1000–10000 rows per transaction hold the lock for milliseconds each, allowing other queries to proceed between batches. The three-step pattern (add nullable, backfill, add NOT NULL) is the standard zero-downtime migration technique for adding required columns to large tables. Skipping batch processing and running a direct large UPDATE is one of the most common causes of production database incidents.

---

### Example 58: Migration with Environment-Specific Logic

Some migrations should behave differently in development versus production—for example, seeding test fixtures in development only. Environment-specific logic in migrations is driven by environment variables checked in Rust code before running SQL.

```rust
use sqlx::AnyPool;

// => Environment-aware setup: seeds fixtures in non-production environments
// => Called after standard migrations have been applied
pub async fn maybe_seed_fixtures(pool: &AnyPool) -> Result<(), sqlx::Error> {
    let env = std::env::var("APP_ENV").unwrap_or_else(|_| "development".to_string());
    // => Read APP_ENV; default to "development" if not set
    // => Expected values: "development", "staging", "production"

    if env == "production" {
        return Ok(());
        // => Skip fixture seeding entirely in production
        // => Production databases only receive schema changes via migrations
    }
    // => Non-production environments proceed with fixture seeding

    sqlx::query(
        "INSERT INTO categories (code, name) VALUES
             ('TEST_CAT', 'Test Category'),
             ('DEMO_CAT', 'Demo Category')
         ON CONFLICT (code) DO NOTHING"
        // => ON CONFLICT DO NOTHING: idempotent; safe to call multiple times
        // => Runs on every app restart in development without duplicating rows
    )
    .execute(pool)
    .await?;
    // => Test fixtures inserted for development and staging environments

    sqlx::query(
        "INSERT INTO users
             (id, username, email, password_hash, created_at, updated_at)
         VALUES
             ('dev-user-001', 'devuser', 'dev@example.com', 'hashed', '2024-01-01', '2024-01-01')
         ON CONFLICT (id) DO NOTHING"
        // => Seed development user with known credentials for local testing
    )
    .execute(pool)
    .await?;
    // => Development fixtures ready; return success to caller

    Ok(())
}
```

**Key Takeaway**: Gate environment-specific migration logic behind `APP_ENV` environment variable checks in Rust code. Use `ON CONFLICT DO NOTHING` to make seed operations idempotent.

**Why It Matters**: Development and staging environments need realistic seed data for testing and demos, but production should never receive synthetic test data. Placing environment checks in Rust code (rather than SQL comments) makes the guard machine-executable and reliably enforced. The `ON CONFLICT DO NOTHING` pattern ensures the seeding function is safe to call repeatedly—on every application restart in development—without duplicating data. This approach keeps fixture management close to the migration code that defines the schema those fixtures depend on.

---

### Example 59: Error Handling in Programmatic Migrations

When running migrations programmatically, distinguishing between error types allows the application to take appropriate action: retry transient network errors, alert on schema mismatches, and fail fast on permanent errors.

```rust
use sqlx::{AnyPool, Error as SqlxError};

// => Categorized migration error: determines how the caller responds
#[derive(Debug)]
enum MigrationError {
    Connection(String),
    // => Transient: network issue or database not yet ready; retry
    SchemaMismatch(String),
    // => Permanent: migration checksum mismatch; alert and halt
    SqlExecution(String),
    // => Permanent: bad SQL in migration file; fix and redeploy
}

impl From<SqlxError> for MigrationError {
    fn from(err: SqlxError) -> Self {
        // => Map sqlx::Error variants to MigrationError variants
        match &err {
            SqlxError::Io(_) | SqlxError::PoolTimedOut => {
                // => IO and pool timeout are transient; worth retrying
                MigrationError::Connection(err.to_string())
            }
            SqlxError::Database(db_err) => {
                let msg = db_err.message().to_string();
                // => Extract database error message for categorization
                if msg.contains("checksum") {
                    // => SQLx rejects migrations with changed checksums
                    MigrationError::SchemaMismatch(msg)
                } else {
                    MigrationError::SqlExecution(msg)
                    // => Other database errors treated as SQL execution failures
                }
            }
            _ => MigrationError::SqlExecution(err.to_string()),
            // => Catch-all: treat unknown errors as SQL execution failures
        }
    }
}

async fn run_migrations_with_handling(pool: &AnyPool) -> Result<(), MigrationError> {
    sqlx::migrate!("./migrations")
    // => sqlx::migrate! macro: reads migrations directory at compile time
    // => Embeds migration file contents into the binary
    .run(pool)
    .await
    .map_err(MigrationError::from)
    // => Convert sqlx::Error to MigrationError using From impl above
    // => Caller can match on MigrationError variant to decide recovery action
}
```

**Key Takeaway**: Implement `From<sqlx::Error>` to categorize migration errors. Distinguish transient errors (connection, timeout) from permanent errors (checksum mismatch, bad SQL) to enable appropriate recovery strategies.

**Why It Matters**: A migration that fails with a connection error at startup should cause the application to retry with backoff—the database might still be starting up. A migration that fails with a checksum mismatch must halt the application and alert the team—a migration file was modified after being applied to this database, which is a critical integrity violation. Treating all errors the same (panic immediately or log and continue) causes either false alarms (retrying permanent errors forever) or silent data integrity violations (continuing after a checksum mismatch). Proper error categorization is essential for robust production deployments.

---

### Example 60: Migration Logging and Observability

Adding structured logging around migration execution provides visibility into how long each migration takes, which migrations were applied on a given deployment, and where failures occur.

```rust
use sqlx::AnyPool;

// => Wraps migration execution with timing and structured logging
// => Assumes a logging framework like tracing is configured
pub async fn run_migrations_with_logging(pool: &AnyPool) -> Result<(), sqlx::Error> {
    let migration_start = std::time::Instant::now();
    // => Record wall-clock time before migrations start
    // => Used to compute total migration duration for the deployment

    tracing::info!("Starting database migrations");
    // => Structured log: marks migration phase start in the log stream
    // => Deployment tooling can search for this line to detect migration phase

    let migrator = sqlx::migrate!("./migrations");
    // => sqlx::migrate! embeds migration files at compile time
    // => migrator: a Migrator struct containing all embedded migrations

    for migration in migrator.migrations.iter() {
        tracing::debug!(
            version = migration.version,
            description = %migration.description,
            "Found migration"
        );
        // => Log each discovered migration; confirms expected set is loaded
        // => version: i64 timestamp; description: human-readable name
    }
    // => All migrations listed; operator can verify correct set before run

    match migrator.run(pool).await {
        Ok(()) => {
            let duration_ms = migration_start.elapsed().as_millis();
            // => Compute how long all migrations took in total
            tracing::info!(
                duration_ms = duration_ms,
                "Database migrations completed successfully"
            );
            // => Structured log: duration visible in log aggregation systems
            // => Alert if duration_ms exceeds threshold for your deployment budget
            Ok(())
        }
        Err(e) => {
            tracing::error!(error = %e, "Database migration failed");
            // => Log the error with full context before propagating
            // => Structured error field enables log-based alerting rules
            Err(e)
            // => Propagate error to caller; application startup should abort
        }
    }
}
```

**Key Takeaway**: Wrap `migrator.run()` with timing measurements and structured log entries at info, debug, and error levels. Log before and after each migration phase to make deployments observable.

**Why It Matters**: Migrations that run during application startup are often invisible in production logs unless explicitly instrumented. Structured logging around migration execution enables deployment tracking (which version deployed at what time), performance monitoring (migrations taking longer over time as tables grow), and rapid incident diagnosis (which migration failed and why). The structured `duration_ms` field allows log aggregation tools (Datadog, Loki, CloudWatch) to alert when migrations exceed a threshold, providing early warning of table locks or growing schema complexity before they cause deployment timeouts.
