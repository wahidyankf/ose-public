---
title: "Beginner"
date: 2026-03-27T00:00:00+07:00
draft: false
weight: 10000001
description: "TypeScript Effect SQL beginner tutorial with 30 annotated examples covering migration structure, table creation, indexes, constraints, and client setup (0-40% coverage)"
tags: ["typescript", "effect", "effect-sql", "tutorial", "by-example", "beginner", "migrations", "pg", "sqlite", "sql"]
---

## Beginner Examples (1-30)

**Coverage**: 0-40% of Effect SQL migration functionality

**Focus**: Migration structure, table creation, column types, indexes, constraints, client setup, and the migration registry.

These examples cover fundamentals needed to write complete production migration files. Each example is self-contained and based on real patterns from the `@effect/sql` ecosystem.

---

### Example 1: First Effect SQL Migration

Every Effect SQL migration is a TypeScript module that exports a default `Effect.gen` computation. The computation receives a `SqlClient` service from the Effect context and executes SQL template literals against the database. This pattern integrates database migrations directly into the Effect runtime without any separate CLI tooling.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
%% Effect SQL Migration Lifecycle
graph TD
    A[Migration Module] -->|exports default| B[Effect.gen computation]
    B -->|yield* SqlClient| C[SqlClient Service]
    C -->|sql template literal| D[Database Execution]

    style A fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style B fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style C fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style D fill:#CC78BC,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

```typescript
// File: src/infrastructure/db/migrations/001_create_products.ts
import { SqlClient } from "@effect/sql"; // => Import SqlClient service tag
import { Effect } from "effect"; // => Import Effect runtime

// => Migration is exported as the default export
// => The migrator discovers and runs it by filename
export default Effect.gen(function* () {
  // => yield* resolves SqlClient from the Effect dependency graph
  // => If SqlClient is not provided, Effect fails with a missing dependency error
  const sql = yield* SqlClient.SqlClient;

  // => sql is a tagged template literal function
  // => Calling sql`...` executes the SQL string against the connected database
  yield* sql`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY
    )
  `;
  // => If the SQL executes successfully, Effect returns void
  // => If the SQL fails, Effect propagates a SqlError in the error channel
});
```

**Key Takeaway**: Every Effect SQL migration exports a default `Effect.gen` computation that resolves `SqlClient.SqlClient` from the context and executes SQL via tagged template literals.

**Why It Matters**: Embedding migrations in the Effect runtime means you get the full Effect dependency injection, error handling, and observability stack for free. Unlike Flyway or Liquibase which require separate JVM processes, or Knex migrations which use callbacks, Effect SQL migrations are first-class Effect programs. This enables composing migrations with application startup, testing migrations with in-memory SQLite, and observing migration runs through Effect's structured concurrency primitives.

---

### Example 2: @effect/sql and @effect/sql-pg Packages

The `@effect/sql` package provides the database-agnostic `SqlClient` service and migration infrastructure. The `@effect/sql-pg` package provides the PostgreSQL-specific `PgClient` and `PgMigrator` implementations. Keeping the migration code in `@effect/sql` and the driver in `@effect/sql-pg` lets you swap databases (e.g., use SQLite for tests) without changing migration files.

```typescript
// package.json dependencies for a PostgreSQL Effect SQL project
// {
//   "@effect/sql": "^0.28.0",      // => Core service tags and migration runner
//   "@effect/sql-pg": "^0.28.0",   // => PostgreSQL client (PgClient, PgMigrator)
//   "effect": "^3.12.0"            // => Effect runtime (required peer dependency)
// }

// In migration files: only import from @effect/sql
import { SqlClient } from "@effect/sql"; // => SqlClient.SqlClient service tag
import { Effect } from "effect"; // => Effect.gen, Effect.fail, etc.

// In main.ts / app entry point: import driver-specific packages
import { PgClient } from "@effect/sql-pg"; // => PgClient.layer factory
import { PgMigrator } from "@effect/sql-pg"; // => PgMigrator.layer factory
// => Migration files themselves never import @effect/sql-pg
// => This preserves database-agnosticism in migration definitions

// For SQLite (tests or embedded):
import { SqliteClient } from "@effect/sql-sqlite-node"; // => SqliteClient.layer factory
import { SqliteMigrator } from "@effect/sql-sqlite-node"; // => SqliteMigrator.layer
// => Same migration files run on both PostgreSQL and SQLite unchanged
```

**Key Takeaway**: Write migrations against `@effect/sql` only; provide the database driver (`PgClient` or `SqliteClient`) at the application layer boundary to keep migration files database-agnostic.

**Why It Matters**: Database portability is critical for testing. Integration tests that spin up a real PostgreSQL container are slow; unit tests using SQLite in-memory run in milliseconds. Because Effect SQL separates the `SqlClient` interface from the driver implementation, the same 30-line migration file runs identically on both. This separation also makes switching databases in production a single-file change rather than a full migration rewrite.

---

### Example 3: SqlClient Service

`SqlClient.SqlClient` is an Effect service tag representing a live database connection. It provides the tagged template literal function (`sql`) for executing parameterized queries, as well as helper methods for transactions and cursors. Yielding from it inside `Effect.gen` resolves the service from the current Layer context.

```typescript
import { SqlClient } from "@effect/sql"; // => Namespace containing the SqlClient tag
import { Effect } from "effect";

const demonstrateSqlClient = Effect.gen(function* () {
  // => yield* SqlClient.SqlClient resolves the live client from the Layer context
  // => Type: SqlClient.SqlClient (the interface, not the tag)
  // => Fails with "Service not found" if no database layer was provided
  const sql = yield* SqlClient.SqlClient;

  // => sql is callable as a tagged template literal
  // => sql`SELECT 1` is equivalent to sql.unsafe("SELECT 1")
  // => Template interpolations are automatically parameterized to prevent SQL injection
  const rows = yield* sql`SELECT 1 AS value`;
  // => rows is ReadonlyArray<{ value: number }>
  // => Effect SQL infers row types from the query when possible

  // => sql also exposes sql.safe, sql.unsafe, sql.and, sql.or for composing queries
  // => For migrations we almost always use the template literal form
  console.log(rows);
  // => Output: [ { value: 1 } ]
});
```

**Key Takeaway**: `yield* SqlClient.SqlClient` inside `Effect.gen` resolves the database client; the returned `sql` function is the primary API for executing SQL in migrations.

**Why It Matters**: The service tag pattern is how Effect implements dependency injection. By depending on `SqlClient.SqlClient` (an abstract interface) rather than a concrete `PgClient` instance, migrations are decoupled from the database driver. The Layer system wires the concrete implementation at application startup. This is functionally similar to injecting a `DataSource` bean in Spring, but with compile-time type safety for the dependency graph.

---

### Example 4: Effect.gen Migration Pattern

`Effect.gen` is a generator-based syntax for writing Effect programs imperatively. The `yield*` keyword suspends the generator, runs the Effect, and resumes with the unwrapped result. For migrations, this means you write sequential SQL statements that look like imperative code while still operating inside the Effect runtime.

```typescript
import { SqlClient } from "@effect/sql";
import { Effect } from "effect";

// => Effect.gen takes a generator function and returns an Effect value
// => The function* syntax declares a generator; function* () {} is required (not arrow function)
export default Effect.gen(function* () {
  // => Step 1: resolve the database client
  const sql = yield* SqlClient.SqlClient; // => sql: SqlClient.SqlClient interface

  // => Step 2: execute first SQL statement
  // => yield* sql`...` suspends the generator until the query completes
  yield* sql`CREATE TABLE IF NOT EXISTS orders (id SERIAL PRIMARY KEY)`;
  // => Resumes here after CREATE TABLE succeeds
  // => If CREATE TABLE fails, the generator does NOT resume — Effect propagates the error

  // => Step 3: execute second SQL statement sequentially
  // => Effect.gen guarantees these run in order, not concurrently
  yield* sql`CREATE INDEX IF NOT EXISTS idx_orders_id ON orders(id)`;
  // => Both statements are now complete

  // => Effect.gen automatically returns Effect<void, SqlError, SqlClient>
  // => The migrator wraps this in a transaction before running it
});
```

**Key Takeaway**: `Effect.gen` provides sequential, error-propagating execution of SQL statements; if any `yield*` fails, subsequent statements do not run and the error flows to the migrator's error handler.

**Why It Matters**: The generator pattern eliminates callback nesting and Promise chaining that plague Node.js database code. In contrast to `async/await`, `Effect.gen` preserves typed error channels — a `SqlError` is distinct from a domain error and can be handled specifically. For migrations, sequential execution with automatic rollback on failure is the correct default; `Effect.gen` provides this without explicit try/catch blocks.

---

### Example 5: SQL Template Literals

The `sql` tagged template literal is the primary API for executing SQL in Effect SQL. Interpolated values are automatically parameterized, preventing SQL injection. For migrations, you typically use static SQL strings, but understanding parameterization matters when writing seed data migrations.

```typescript
import { SqlClient } from "@effect/sql";
import { Effect } from "effect";

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  // => Static SQL: no interpolations, executes as-is
  yield* sql`
    CREATE TABLE IF NOT EXISTS categories (
      id   SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL
    )
  `;
  // => SQL sent to database: CREATE TABLE IF NOT EXISTS categories (...)

  // => Dynamic value: interpolated as a bound parameter
  const defaultName = "Uncategorized";
  // => The value is parameterized — sent as $1 with value "Uncategorized"
  // => This prevents SQL injection even with user-supplied strings
  yield* sql`INSERT INTO categories (name) VALUES (${defaultName})`;
  // => SQL sent: INSERT INTO categories (name) VALUES ($1)
  // => Parameters: ["Uncategorized"]

  // => For DDL (CREATE, ALTER, DROP), use static strings only
  // => Dynamic identifiers (table names, column names) require sql.unsafe() or Identifier
  // => sql`CREATE TABLE ${tableName}` would parameterize the name, which is invalid DDL
});
```

**Key Takeaway**: Template literal interpolations are always parameterized for safety; use static SQL strings for DDL and reserve interpolation for data values in seed migrations.

**Why It Matters**: SQL injection in migration files is rare but possible when migration scripts are generated dynamically. The automatic parameterization in `@effect/sql` means even seed data migrations with user-generated content are safe by default. Other migration tools (raw `psql` scripts, Flyway SQL files) provide no injection protection; Effect SQL's tagged template approach is safer and composable.

---

### Example 6: Migration Registry (index.ts exports)

The migration registry is an `index.ts` file that exports a `Record<string, Effect>` mapping migration keys to migration functions. The key format must match `\d+_<name>` (digits underscore name). The migrator uses this record to discover, order, and run migrations.

```typescript
// File: src/infrastructure/db/migrations/index.ts

// => Import each migration module's default export
import m001 from "./001_create_users.js"; // => Effect.gen computation for migration 1
import m002 from "./002_create_tokens.js"; // => Effect.gen computation for migration 2
import m003 from "./003_create_products.js"; // => Effect.gen computation for migration 3

// => Export a record mapping migration keys to migration Effects
// => Key format: "\d+_<name>" — leading digits determine execution order
export const migrations = {
  "0001_create_users": m001, // => Runs first; key "0001" sorts before "0002"
  "0002_create_tokens": m002, // => Runs second
  "0003_create_products": m003, // => Runs third
  // => Keys are sorted lexicographically by the migrator
  // => Use zero-padded numbers (0001, 0002) to ensure correct sort order
  // => Non-padded numbers would sort "10" before "2" lexicographically
};

// => The migrations object is passed to PgMigrator.fromRecord() or SqliteMigrator.fromRecord()
// => The migrator checks the effect_sql_migrations table to skip already-applied migrations
// => Only new keys (not yet in the migrations table) are executed
```

**Key Takeaway**: The migration registry is a simple TypeScript record; use zero-padded numeric prefixes to guarantee execution order, since the migrator sorts keys lexicographically.

**Why It Matters**: The registry pattern works in both Node.js and browser-like environments (Cloudflare Workers, Bun) where filesystem access is unavailable. It also makes migration testing trivial — you can pass a subset of migrations to the registry for isolated testing. Contrast with Flyway's classpath scanning or Liquibase's XML changelogs; the TypeScript record is simpler, type-safe, and environment-agnostic.

---

### Example 7: Migration Layer Setup

The migrator runs as an Effect `Layer`. `PgMigrator.layer` (or `SqliteMigrator.layer`) returns a `Layer` that, when built, applies all pending migrations. You build the layer with `Layer.build(migratorLayer).pipe(Effect.scoped)` to run migrations once at application startup.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
%% Migration Layer Build Flow
graph TD
    A[migrations record] -->|fromRecord loader| B[PgMigrator.layer]
    C[PgClient.layer] -->|Layer.provide| B
    B -->|Layer.build| D[Run pending migrations]
    D -->|Effect.scoped| E[Migrator layer released]

    style A fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style B fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style C fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style D fill:#CC78BC,stroke:#000000,color:#FFFFFF,stroke-width:2px
    style E fill:#CA9161,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

```typescript
import { PgClient, PgMigrator } from "@effect/sql-pg";
import { Layer, Effect, Redacted } from "effect";
import { migrations } from "./migrations/index.js"; // => Migration registry

// => Step 1: Create the database client layer
// => PgClient.layer accepts a config object with connection details
const dbLayer = PgClient.layer({
  url: Redacted.make("postgresql://user:pass@localhost:5432/mydb"),
  // => Redacted.make wraps the URL to prevent accidental logging
});

// => Step 2: Create the migrator layer
// => PgMigrator.layer wraps the migration registry into a runnable Layer
const migratorLayer = PgMigrator.layer({
  loader: PgMigrator.fromRecord(migrations), // => Load migrations from the registry record
  table: "effect_sql_migrations", // => Table name for tracking applied migrations
}).pipe(
  Layer.provide(dbLayer), // => Provide the database connection to the migrator
);

// => Step 3: Build the layer to actually run migrations
// => Layer.build executes the layer's acquisition (runs migrations)
// => Effect.scoped ensures the layer's resources are released after migrations complete
const runMigrations = Layer.build(migratorLayer).pipe(Effect.scoped);

// => runMigrations is an Effect<void, MigrationError, never>
// => Awaiting it with yield* or runPromise applies all pending migrations
```

**Key Takeaway**: Compose `PgMigrator.layer` with `Layer.provide(dbLayer)` to inject the database connection, then execute with `Layer.build(...).pipe(Effect.scoped)` to run migrations at startup.

**Why It Matters**: Running migrations as a Layer integrates naturally with Effect application startup. The `Effect.scoped` wrapper guarantees connection cleanup even if a migration fails midway. Compare this to manual migration runners that require separate scripts, process management, and connection cleanup code. Effect SQL's Layer-based approach means migrations are just another composable piece of the application dependency graph.

---

### Example 8: Creating Tables

The most fundamental migration operation creates a table with its column definitions. Effect SQL passes the SQL template directly to the database driver; syntax is standard PostgreSQL or SQLite DDL. Use `CREATE TABLE IF NOT EXISTS` to make the migration idempotent.

```typescript
import { SqlClient } from "@effect/sql";
import { Effect } from "effect";

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient; // => Resolve database client

  // => CREATE TABLE IF NOT EXISTS is idempotent — safe to run multiple times
  // => Without IF NOT EXISTS, re-running the migration would throw "table already exists"
  yield* sql`
    CREATE TABLE IF NOT EXISTS customers (
      id           SERIAL PRIMARY KEY,
      -- => SERIAL is PostgreSQL shorthand for INTEGER + sequence + DEFAULT nextval(...)
      -- => Equivalent to: id INTEGER NOT NULL DEFAULT nextval('customers_id_seq')
      name         VARCHAR(255) NOT NULL,
      -- => VARCHAR(255): variable-length string, maximum 255 characters
      -- => NOT NULL: database rejects INSERT/UPDATE with NULL in this column
      email        VARCHAR(255) NOT NULL,
      created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      -- => TIMESTAMPTZ: timestamp with timezone (stores in UTC, displays in session TZ)
      -- => DEFAULT NOW(): database fills this automatically on INSERT
    )
  `;
  // => Table "customers" is now created (or already existed — IF NOT EXISTS guards it)
});
```

**Key Takeaway**: Always use `CREATE TABLE IF NOT EXISTS` in migrations to make them idempotent; the `effect_sql_migrations` table prevents re-running, but idempotency protects against manual reruns and test environments.

**Why It Matters**: Idempotent migrations are critical for development workflows. Developers frequently drop and recreate their local databases; non-idempotent migrations that throw on the second run break `make reset-db` workflows. In production, `effect_sql_migrations` prevents re-runs, but CI pipelines often run against fresh databases where all migrations must succeed sequentially. `IF NOT EXISTS` guards are the convention across all major migration tools for this reason.

---

### Example 9: Adding Columns

Adding a column to an existing table uses `ALTER TABLE ... ADD COLUMN`. Like table creation, use `IF NOT EXISTS` to make the migration idempotent. This is a common migration pattern when extending a domain model with new attributes.

```typescript
import { SqlClient } from "@effect/sql";
import { Effect } from "effect";

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  // => ALTER TABLE adds a column to an existing table
  // => IF NOT EXISTS (PostgreSQL 9.6+) makes this idempotent
  // => Without IF NOT EXISTS, running this migration twice throws "column already exists"
  yield* sql`
    ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS phone VARCHAR(20)
  `;
  // => phone column added: nullable VARCHAR(20)
  // => Nullable by default — existing rows get NULL for the new column

  // => Add a second column with a default value
  // => New columns with NOT NULL must have a DEFAULT or the migration will fail
  // => (unless the table is empty, which is never safe to assume in production)
  yield* sql`
    ALTER TABLE customers
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE
  `;
  // => is_active column added: NOT NULL BOOLEAN, existing rows get TRUE
  // => The DEFAULT ensures no constraint violation on existing rows
});
```

**Key Takeaway**: When adding `NOT NULL` columns to existing tables, always specify a `DEFAULT` value; without it the database rejects the statement if any rows exist.

**Why It Matters**: Missing defaults on `NOT NULL` column additions are one of the most common migration failures in production databases. An empty development database accepts the statement, but a production table with millions of rows fails immediately. Effect SQL does not validate this for you — the `SqlError` will propagate up the Effect chain, and the migration transaction will roll back. Always test migrations against a snapshot of production data before deploying.

---

### Example 10: Adding Indexes

Indexes improve query performance but impose write overhead. Create indexes in migrations after the table definition. PostgreSQL's `CREATE INDEX CONCURRENTLY` builds indexes without locking the table, which is important for large production tables.

```typescript
import { SqlClient } from "@effect/sql";
import { Effect } from "effect";

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  // => Create the table first
  yield* sql`
    CREATE TABLE IF NOT EXISTS orders (
      id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id    UUID        NOT NULL,
      status     VARCHAR(20) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // => Single-column index on user_id for fast user order lookups
  // => IF NOT EXISTS prevents "index already exists" errors on re-runs
  yield* sql`
    CREATE INDEX IF NOT EXISTS idx_orders_user_id
    ON orders(user_id)
  `;
  // => Index created: B-tree on orders.user_id

  // => Single-column index on status for fast status filtering
  yield* sql`
    CREATE INDEX IF NOT EXISTS idx_orders_status
    ON orders(status)
  `;
  // => Index created: B-tree on orders.status
  // => Both indexes are built within the same migration transaction
});
```

**Key Takeaway**: Create indexes in the same migration as the table, or in a dedicated follow-up migration; always use `IF NOT EXISTS` and consider `CONCURRENTLY` for adding indexes to large production tables.

**Why It Matters**: Indexes added during migrations block concurrent writes in standard `CREATE INDEX` mode. For new tables with no data this is fine, but for `ALTER TABLE ... ADD INDEX` on existing production tables, locking can cause downtime. PostgreSQL's `CREATE INDEX CONCURRENTLY` avoids the lock but cannot run inside a transaction — you would need to handle this in a separate migration. Understanding this trade-off is essential for zero-downtime deployments.

---

### Example 11: Adding Foreign Keys

Foreign keys enforce referential integrity by ensuring every value in a child column exists in the parent column. Effect SQL migrations define foreign keys inline during table creation or via `ALTER TABLE`. The constraint name enables targeted error messages and future constraint drops.

```typescript
import { SqlClient } from "@effect/sql";
import { Effect } from "effect";

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  // => Create the parent table first (referenced table must exist before the FK)
  yield* sql`
    CREATE TABLE IF NOT EXISTS departments (
      id   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL
    )
  `;

  // => Create child table with inline foreign key definition
  yield* sql`
    CREATE TABLE IF NOT EXISTS employees (
      id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      department_id UUID        NOT NULL REFERENCES departments(id),
      -- => REFERENCES departments(id) creates an unnamed foreign key constraint
      -- => The database auto-generates a constraint name like "employees_department_id_fkey"
      name          VARCHAR(255) NOT NULL
    )
  `;
  // => employees.department_id must always match a valid departments.id
  // => INSERT/UPDATE on employees with non-existent department_id will fail

  // => Alternatively, use a named constraint for better error messages:
  // => CONSTRAINT fk_employees_department FOREIGN KEY (department_id) REFERENCES departments(id)
  // => Named constraints are easier to DROP later if you need to restructure
});
```

**Key Takeaway**: Define foreign keys with named `CONSTRAINT` clauses for clarity; ensure the parent table exists before the child table in migration ordering.

**Why It Matters**: Foreign key constraints are the database's last line of defense against referential integrity violations — application bugs that bypass validation layers cannot corrupt relational data if FK constraints are in place. However, FKs impose a performance cost on writes (each insert/update requires an index lookup in the parent table). Production systems sometimes disable FKs for bulk loading and re-enable them afterward; understanding this trade-off is essential for migration design.

---

### Example 12: Adding Unique Constraints

Unique constraints prevent duplicate values in a column or combination of columns. They are stricter than application-level validation because the database enforces them atomically, even under concurrent writes. Use named constraints for better error handling in application code.

```typescript
import { SqlClient } from "@effect/sql";
import { Effect } from "effect";

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  yield* sql`
    CREATE TABLE IF NOT EXISTS users (
      id       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(50) NOT NULL,
      email    VARCHAR(255) NOT NULL,

      -- => Named UNIQUE constraint on username
      -- => Name "uq_users_username" is used in error messages and can be dropped explicitly
      CONSTRAINT uq_users_username UNIQUE (username),

      -- => Named UNIQUE constraint on email
      -- => PostgreSQL creates a B-tree index for each UNIQUE constraint automatically
      CONSTRAINT uq_users_email UNIQUE (email)
    )
  `;
  // => Both username and email are enforced unique at the database level
  // => Concurrent inserts with the same username/email: one succeeds, one fails with
  // => ERROR: duplicate key value violates unique constraint "uq_users_username"

  // => To add a unique constraint to an existing table:
  // => ALTER TABLE users ADD CONSTRAINT uq_users_username UNIQUE (username);
  // => This also creates the backing B-tree index
});
```

**Key Takeaway**: Name unique constraints with a predictable prefix (`uq_`) so application code can catch and handle them specifically by constraint name rather than parsing error messages.

**Why It Matters**: Unnamed constraints generate random system names like `users_username_key`, making it impossible to write reliable application-level error handling for specific violations. Named constraints let you catch "uq_users_email violated" and return a specific "email already taken" error to the user. The `@effect/sql` error channel carries the raw `SqlError` from the driver; your repository layer can pattern-match on the constraint name to produce typed domain errors.

---

### Example 13: Running Migrations (Layer.build)

`Layer.build(migratorLayer).pipe(Effect.scoped)` is the canonical way to execute migrations at application startup. This builds the migrator layer (triggering migration execution), then scopes the result so all resources (database connections) are released when the Effect completes.

```typescript
import { PgClient, PgMigrator } from "@effect/sql-pg";
import { NodeContext } from "@effect/platform-node";
import { Layer, Effect, Redacted } from "effect";
import { migrations } from "./migrations/index.js";

// => Database connection layer — provides SqlClient to all layers above it
const dbLayer = PgClient.layer({
  url: Redacted.make(process.env["DATABASE_URL"] ?? "postgresql://localhost:5432/mydb"),
});

// => Migrator layer — depends on SqlClient and NodeContext (for filesystem loader)
// => PgMigrator.fromRecord does not need NodeContext; only fromFileSystem does
const migratorLayer = PgMigrator.layer({
  loader: PgMigrator.fromRecord(migrations), // => Load from in-memory record (no filesystem)
  table: "effect_sql_migrations", // => Tracking table name
}).pipe(
  Layer.provide(dbLayer), // => Wire database connection into the migrator
  Layer.provide(NodeContext.layer), // => NodeContext needed for some internal Effect APIs
);

// => Build the layer: acquisition runs all pending migrations
// => Effect.scoped: releases the scoped resources (connection) when done
const runMigrations = Effect.gen(function* () {
  yield* Layer.build(migratorLayer).pipe(Effect.scoped);
  // => All pending migrations have now been applied
  // => effect_sql_migrations table updated with new entries
  console.log("Migrations complete");
});

// => Run migrations as part of application startup
Effect.runPromise(runMigrations).catch(console.error);
// => If any migration fails, the Promise rejects with the SqlError
```

**Key Takeaway**: `Layer.build(migratorLayer).pipe(Effect.scoped)` is the idiomatic pattern for running migrations once; the `scoped` ensures connection cleanup even on failure.

**Why It Matters**: The `Effect.scoped` wrapper is essential — without it, database connections would leak if a migration throws. Unlike `async/await` code where `finally` blocks can be forgotten, Effect's `scoped` resource management is composable and enforced by the type system. The migrator also wraps each migration in a transaction automatically, so a partial migration failure leaves the database in the pre-migration state.

---

### Example 14: effect_sql_migrations Table

The `effect_sql_migrations` table is the migration tracking mechanism. The migrator creates this table automatically on first run, then inserts a row for each applied migration. On subsequent runs, it skips migrations already recorded in this table.

```sql
-- => The effect_sql_migrations table is created automatically by PgMigrator
-- => Its structure (conceptually) is:
CREATE TABLE IF NOT EXISTS effect_sql_migrations (
  migration_id   TEXT        NOT NULL PRIMARY KEY,
  -- => Stores the migration key from the registry (e.g., "0001_create_users")
  -- => PRIMARY KEY prevents the same migration from being recorded twice
  applied_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- => Timestamp of when the migration was applied
  -- => Useful for auditing and debugging
);

-- => On each application startup, the migrator:
-- => 1. Creates effect_sql_migrations if it does not exist
-- => 2. Reads all migration_id values from the table
-- => 3. Compares against the registry keys
-- => 4. Runs only the keys NOT yet in the table
-- => 5. Inserts a new row for each successfully applied migration
```

```typescript
// => You can configure a custom table name in PgMigrator.layer:
import { PgMigrator } from "@effect/sql-pg";
import { Layer } from "effect";

const migratorLayer = PgMigrator.layer({
  loader: PgMigrator.fromRecord({}), // => Empty registry for illustration
  table: "my_schema_migrations", // => Custom table name (default: "effect_sql_migrations")
  // => Useful when multiple migrators share the same database schema
  // => or when integrating with other migration tools in the same database
});
// => migratorLayer will use "my_schema_migrations" instead of "effect_sql_migrations"
```

**Key Takeaway**: The `table` option in `PgMigrator.layer` (default: `"effect_sql_migrations"`) controls where migration state is stored; customize it when multiple migration registries coexist in the same database.

**Why It Matters**: Understanding the tracking table prevents confusion when migrations appear to skip or re-run unexpectedly. The most common cause: deleting a migration file after it ran leaves an orphaned row in `effect_sql_migrations`. The migrator does not clean up orphaned rows, so the deleted migration's key remains recorded. Conversely, manually deleting rows from `effect_sql_migrations` forces those migrations to re-run on the next startup — useful for resetting state in development.

---

### Example 15: NOT NULL Constraints with Defaults

`NOT NULL` constraints enforce that a column always has a value. Combining `NOT NULL` with a `DEFAULT` expression ensures existing rows are populated when the column is added, and new rows automatically receive the default when the column is omitted from `INSERT` statements.

```typescript
import { SqlClient } from "@effect/sql";
import { Effect } from "effect";

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  yield* sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      -- => gen_random_uuid() generates a UUID v4; available in PostgreSQL 13+ and with pgcrypto

      action     VARCHAR(100) NOT NULL,
      -- => NOT NULL with no DEFAULT: caller MUST provide this value
      -- => INSERT without action column fails: "null value in column action"

      performed_by VARCHAR(255) NOT NULL DEFAULT 'system',
      -- => NOT NULL + DEFAULT 'system': existing rows get 'system', INSERT can omit this field
      -- => Useful for audit fields when migrating pre-audit tables

      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      -- => NOT NULL + DEFAULT NOW(): always has a value, auto-populated on INSERT
      -- => NOW() is evaluated at statement execution time, not at DDL time

      metadata   TEXT NOT NULL DEFAULT ''
      -- => Empty string default: avoids NULL in string columns
      -- => Some applications prefer '' over NULL for "no value" semantics
    )
  `;
});
```

**Key Takeaway**: `NOT NULL DEFAULT <expr>` is the pattern for required columns with automatic values; omitting `DEFAULT` on a `NOT NULL` column means the application layer must always supply the value.

**Why It Matters**: The distinction between `NULL` and an empty/zero value carries semantic meaning: `NULL` means "unknown or not applicable," while `''` or `0` means "explicitly empty or zero." Design `NOT NULL DEFAULT` carefully — a default of `''` says "the absence of a string is empty string," while `NULL` says "the absence means we don't know." Effect SQL propagates the raw database type to your repository layer; mismatched nullability between the TypeScript type and the database column is a common source of runtime errors.

---

### Example 16: UUID Primary Keys

UUID primary keys use `gen_random_uuid()` to generate a universally unique identifier at the database level. UUIDs are preferable to sequential integers for distributed systems, external exposure in URLs, and security-sensitive identifiers.

```typescript
import { SqlClient } from "@effect/sql";
import { Effect } from "effect";

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  // => UUID primary key pattern used throughout the demo-be-ts-effect codebase
  yield* sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      -- => UUID: 128-bit identifier, stored as 16 bytes in PostgreSQL
      -- => gen_random_uuid(): PostgreSQL 13+ built-in; earlier versions need pgcrypto
      -- => DEFAULT gen_random_uuid(): database generates UUID if not provided in INSERT
      -- => Application can also generate UUID client-side: crypto.randomUUID()

      user_id   UUID        NOT NULL,
      -- => UUID foreign key (no REFERENCES here — added separately for clarity)
      -- => Type consistency: UUID-to-UUID references never have type mismatch errors

      token     VARCHAR(512) NOT NULL,
      -- => Session token stored as a string (typically a signed JWT or opaque token)

      expires_at TIMESTAMPTZ NOT NULL,
      -- => Expiry stored in the database for server-side session validation

      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  // => "id UUID PRIMARY KEY DEFAULT gen_random_uuid()" is the canonical Effect SQL pattern
  // => Seen in 001_create_users.ts, 002_create_refresh_tokens.ts, etc. in demo-be-ts-effect
});
```

**Key Takeaway**: Use `UUID PRIMARY KEY DEFAULT gen_random_uuid()` for primary keys in modern PostgreSQL tables; this pattern avoids sequential ID exposure, supports distributed generation, and matches the `@effect/sql` ecosystem conventions.

**Why It Matters**: Sequential integer IDs expose business information (number of users, order volume) and enable enumeration attacks. UUID primary keys eliminate these issues. The `DEFAULT gen_random_uuid()` approach generates IDs at the database level, ensuring uniqueness even when multiple application servers insert concurrently without coordination. The trade-off is slightly larger storage (16 bytes vs 4-8 bytes for integers) and random index fragmentation; for most production workloads these costs are negligible.

---

### Example 17: Timestamp Columns with Defaults

Timestamp columns record when records are created and updated. The `TIMESTAMPTZ` type stores the timestamp with timezone information (always in UTC internally). `DEFAULT NOW()` auto-populates on insert; update timestamps require a trigger or application-level tracking.

```typescript
import { SqlClient } from "@effect/sql";
import { Effect } from "effect";

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  yield* sql`
    CREATE TABLE IF NOT EXISTS articles (
      id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      title      VARCHAR(500) NOT NULL,
      body       TEXT         NOT NULL,

      created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      -- => TIMESTAMPTZ vs TIMESTAMP: TIMESTAMPTZ stores UTC and converts on retrieval
      -- => TIMESTAMP has no timezone awareness — avoid it for distributed/multi-region apps
      -- => DEFAULT NOW(): database fills created_at on INSERT if not specified
      -- => Application should NOT provide this value; let the database manage it

      created_by VARCHAR(255) NOT NULL DEFAULT 'system',
      -- => Audit field: who created the record
      -- => 'system' default covers programmatic inserts without an actor

      updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      -- => Does NOT auto-update on UPDATE — this is a creation timestamp with wrong semantics
      -- => To auto-update on UPDATE, use a PostgreSQL trigger or set it in the repository layer
      -- => The demo-be-ts-effect repos update this column explicitly in UPDATE statements

      updated_by VARCHAR(255) NOT NULL DEFAULT 'system'
      -- => Audit field: who last updated the record
    )
  `;
});
```

**Key Takeaway**: `TIMESTAMPTZ NOT NULL DEFAULT NOW()` is the correct pattern for creation timestamps; update timestamps require explicit application-level assignment because `DEFAULT NOW()` only fires on `INSERT`.

**Why It Matters**: The difference between `TIMESTAMPTZ` and `TIMESTAMP` is critical in multi-timezone deployments. `TIMESTAMP` stores the wall clock time with no timezone metadata; if your database server and application server are in different timezones, queries return incorrect times. `TIMESTAMPTZ` always stores UTC and PostgreSQL handles conversion. The `@effect/sql-pg` driver maps `TIMESTAMPTZ` columns to JavaScript `Date` objects automatically.

---

### Example 18: Multiple Statements in One Migration

A single migration file can contain multiple SQL statements. All statements in an Effect SQL migration execute within the same database transaction. If any statement fails, the entire migration rolls back and the `effect_sql_migrations` table is not updated.

```typescript
import { SqlClient } from "@effect/sql";
import { Effect } from "effect";

// => This migration creates multiple tables in a single transaction
// => If any CREATE TABLE fails, all changes are rolled back atomically
export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  // => Statement 1: Create tags table
  yield* sql`
    CREATE TABLE IF NOT EXISTS tags (
      id   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(50) NOT NULL,
      CONSTRAINT uq_tags_name UNIQUE (name)
    )
  `;
  // => tags table created (or already exists)

  // => Statement 2: Create article_tags junction table
  yield* sql`
    CREATE TABLE IF NOT EXISTS article_tags (
      article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
      tag_id     UUID NOT NULL REFERENCES tags(id)     ON DELETE CASCADE,
      PRIMARY KEY (article_id, tag_id)
      -- => Composite primary key: no separate id column needed
      -- => Prevents duplicate (article, tag) pairs
    )
  `;
  // => article_tags table created (or already exists)

  // => Statement 3: Create index for reverse lookup (find articles by tag)
  yield* sql`
    CREATE INDEX IF NOT EXISTS idx_article_tags_tag_id
    ON article_tags(tag_id)
  `;
  // => All three statements succeed or all three roll back together
});
```

**Key Takeaway**: Group logically related DDL statements in the same migration file; the implicit transaction ensures atomicity — either all changes apply or none do.

**Why It Matters**: Transactional DDL is a PostgreSQL feature not available in MySQL or SQLite (SQLite supports transactional DDL but with limitations). It means a failed migration leaves the database in a consistent state rather than partially migrated. Effect SQL wraps each migration in a transaction automatically; you do not need explicit `BEGIN/COMMIT` statements. This is one of PostgreSQL's strongest operational advantages for migration safety.

---

### Example 19: PgClient Setup

`PgClient.layer` creates the PostgreSQL database connection layer. It accepts a connection URL (or individual connection parameters) wrapped in `Redacted` to prevent the connection string from appearing in logs or error messages.

```typescript
import { PgClient } from "@effect/sql-pg"; // => PostgreSQL-specific client
import { Layer, Redacted } from "effect";

// => Option 1: Connection URL (most common)
const pgLayerFromUrl = PgClient.layer({
  url: Redacted.make("postgresql://user:password@localhost:5432/mydb"),
  // => Redacted.make wraps the value so it prints as "<redacted>" in logs
  // => Without Redacted, the password would appear in Effect traces and error messages
});

// => Option 2: Individual connection parameters
const pgLayerFromParams = PgClient.layer({
  host: "localhost", // => Hostname of the PostgreSQL server
  port: 5432, // => Default PostgreSQL port
  database: "mydb", // => Database name
  username: "user", // => Database user
  password: Redacted.make("password"), // => Password wrapped in Redacted
  // => ssl: { rejectUnauthorized: false } — for development with self-signed certs
  // => maxConnections: 10 — connection pool size (default: 10)
});

// => Both produce a Layer<SqlClient, SqlError, never>
// => Provide this layer to migrations, repositories, and all SQL-dependent services
const appLayer = Layer.mergeAll(
  pgLayerFromUrl,
  // => other service layers...
);

// => The PgClient layer manages a connection pool internally
// => Connections are acquired per-Effect and released after each Effect completes
```

**Key Takeaway**: Wrap connection URLs and passwords in `Redacted.make()` before passing to `PgClient.layer`; this prevents credential leakage in logs, traces, and error messages.

**Why It Matters**: Database credentials in logs are a common security incident trigger. The `Redacted` wrapper in Effect is analogous to Spring's `PasswordEncoder` or Node's masking for sensitive fields — except it is type-level, making it impossible to accidentally log the raw value. When Effect prints a `Redacted` value in a stack trace, it shows `<redacted>` regardless of log level or context. This is particularly important in containerized environments where logs are collected centrally.

---

### Example 20: SqliteClient Setup (@effect/sql-sqlite-node)

`SqliteClient.layer` from `@effect/sql-sqlite-node` provides an in-process SQLite database connection. Use `:memory:` for tests (no files on disk) or a file path for embedded SQLite databases.

```typescript
import { SqliteClient, SqliteMigrator } from "@effect/sql-sqlite-node";
// => @effect/sql-sqlite-node wraps better-sqlite3, a synchronous SQLite driver
// => Despite better-sqlite3 being synchronous, Effect SQL wraps it in the async Effect runtime
import { Layer } from "effect";
import { migrations } from "./migrations/index.js";

// => In-memory SQLite: fastest option for unit/integration tests
// => :memory: database is created fresh for each Layer instance
const sqliteLayerInMemory = SqliteClient.layer({
  filename: ":memory:", // => SQLite special value for in-memory database
  // => In-memory database: no disk I/O, automatically destroyed when connection closes
  // => Perfect for tests: each test suite gets a fresh, isolated database
});

// => File-based SQLite: for development or embedded applications
const sqliteLayerFile = SqliteClient.layer({
  filename: "./local.db", // => Creates or opens SQLite file at this path
  // => File-based SQLite persists across process restarts
  // => Useful for CLI tools, desktop apps, or development without PostgreSQL
});

// => SQLite migrator: same API as PgMigrator but for SQLite
// => No NodeContext required (no filesystem loader needed with fromRecord)
const sqliteMigratorLayer = SqliteMigrator.layer({
  loader: SqliteMigrator.fromRecord(migrations), // => Same migrations record
  table: "effect_sql_migrations", // => Same table name
}).pipe(Layer.provide(sqliteLayerInMemory));

// => The same migration files (001_create_users.ts, etc.) run on SQLite unchanged
// => SQLite does not support all PostgreSQL types (e.g., UUID is stored as TEXT)
// => Stick to portable SQL: VARCHAR, INTEGER, BOOLEAN, TEXT, REAL
```

**Key Takeaway**: Use `SqliteClient.layer({ filename: ":memory:" })` with `SqliteMigrator` for fast, isolated test environments; the same migration files run against both SQLite and PostgreSQL without modification.

**Why It Matters**: Test isolation is the primary motivation for SQLite in testing. Spinning up a PostgreSQL container for every test run adds seconds to CI pipelines; in-memory SQLite is instantaneous. The `@effect/sql` abstraction makes this practical — your migrations, repositories, and services are all written against `SqlClient.SqlClient`, so swapping the underlying database is a single Layer substitution in test setup. The main caveat is SQLite's limited DDL support: no `ADD COLUMN IF NOT EXISTS`, no `TIMESTAMPTZ`, limited constraint syntax.

---

### Example 21: Enum Types via SQL

PostgreSQL supports custom enum types via `CREATE TYPE ... AS ENUM`. Alternatively, you can use `VARCHAR` with a `CHECK` constraint for portability. The enum approach provides stronger type safety at the database level; the VARCHAR approach works on both PostgreSQL and SQLite.

**PostgreSQL native enum approach:**

```typescript
import { SqlClient } from "@effect/sql";
import { Effect } from "effect";

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  // => Create a PostgreSQL custom enum type
  // => IF NOT EXISTS guard: PostgreSQL 9.6+ (prevents duplicate type errors)
  yield* sql`
    CREATE TYPE IF NOT EXISTS user_role AS ENUM ('USER', 'ADMIN', 'MODERATOR')
  `;
  // => user_role is now a valid column type in this database

  // => Use the custom enum as a column type
  yield* sql`
    CREATE TABLE IF NOT EXISTS user_roles_demo (
      id   UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
      role user_role NOT NULL DEFAULT 'USER'
      -- => role is strongly typed: only 'USER', 'ADMIN', 'MODERATOR' are valid
      -- => INSERT with role = 'SUPERUSER' fails: "invalid input value for enum user_role"
    )
  `;
});
```

**VARCHAR with CHECK constraint approach (portable):**

```typescript
import { SqlClient } from "@effect/sql";
import { Effect } from "effect";

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  // => VARCHAR + CHECK: works on PostgreSQL, SQLite, and MySQL
  // => Less type-safe than enum: database validates at write time, not at DDL definition time
  yield* sql`
    CREATE TABLE IF NOT EXISTS accounts (
      id     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DELETED'))
      -- => CHECK constraint validates status on every INSERT and UPDATE
      -- => Violation: "check constraint accounts_status_check violated"
    )
  `;
  // => The demo-be-ts-effect codebase uses this VARCHAR pattern for portability
  // => (enables SQLite test runs alongside PostgreSQL production runs)
});
```

**Key Takeaway**: Use PostgreSQL native `ENUM` types for maximum type safety in PostgreSQL-only deployments; use `VARCHAR` with a `CHECK` constraint for portability across databases including SQLite for testing.

**Why It Matters**: The demo-be-ts-effect codebase uses `VARCHAR` with documented valid values rather than PostgreSQL enums precisely because migrations run on both PostgreSQL (production) and SQLite (tests). PostgreSQL enums have operational costs too: adding a new enum value with `ALTER TYPE ... ADD VALUE` cannot run inside a transaction in some PostgreSQL versions, complicating zero-downtime deployments. `VARCHAR + CHECK` avoids these issues at the cost of slightly weaker type enforcement.

---

### Example 22: CHECK Constraints

`CHECK` constraints validate column values against a predicate expression. They run on every `INSERT` and `UPDATE`, catching invalid values at the database level before they reach application code. Name constraints for meaningful error messages.

```typescript
import { SqlClient } from "@effect/sql";
import { Effect } from "effect";

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  yield* sql`
    CREATE TABLE IF NOT EXISTS products (
      id       UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
      name     VARCHAR(255)   NOT NULL,

      price    DECIMAL(10, 2) NOT NULL,
      -- => DECIMAL(10, 2): 10 total digits, 2 after decimal point
      -- => Supports values from -99999999.99 to 99999999.99

      quantity INTEGER NOT NULL DEFAULT 0,
      -- => quantity starts at 0, must be non-negative

      CONSTRAINT chk_products_price_positive
        CHECK (price > 0),
      -- => Named CHECK: price must be strictly positive
      -- => Violation message: "check constraint chk_products_price_positive violated"

      CONSTRAINT chk_products_quantity_non_negative
        CHECK (quantity >= 0),
      -- => Separate named constraint for quantity
      -- => Naming each constraint separately allows targeted application error handling

      CONSTRAINT chk_products_name_not_empty
        CHECK (length(trim(name)) > 0)
      -- => CHECK can use PostgreSQL functions like length(), trim(), lower()
      -- => Prevents inserting a name that is purely whitespace
    )
  `;
});
```

**Key Takeaway**: Name `CHECK` constraints with descriptive names so application code can catch and handle specific violations; group related checks but keep unrelated constraints separate for granular error handling.

**Why It Matters**: Application-level validation can be bypassed by direct database access, bulk imports, or bugs. `CHECK` constraints are the database's guarantee that business rules hold regardless of how data enters. In the Effect SQL pattern, a `CHECK` violation surfaces as a `SqlError` with the constraint name in the message; your repository layer can `mapError` this into a typed domain error that propagates through the Effect error channel.

---

### Example 23: Composite Indexes

Composite indexes cover multiple columns and dramatically improve queries that filter on multiple conditions. Column order in a composite index matters: the index supports queries on the leading column(s) but not on trailing columns alone.

```typescript
import { SqlClient } from "@effect/sql";
import { Effect } from "effect";

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  yield* sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id    UUID        NOT NULL,
      account_id UUID        NOT NULL,
      type       VARCHAR(20) NOT NULL,
      amount     DECIMAL(19,4) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // => Single-column index: fast for queries filtering on user_id alone
  yield* sql`
    CREATE INDEX IF NOT EXISTS idx_transactions_user_id
    ON transactions(user_id)
  `;

  // => Composite index: fast for queries filtering on (user_id, type) together
  // => Column order: user_id first (higher cardinality / more selective)
  // => This index also supports queries filtering on user_id alone
  // => But NOT queries filtering on type alone (no leading user_id)
  yield* sql`
    CREATE INDEX IF NOT EXISTS idx_transactions_user_id_type
    ON transactions(user_id, type)
  `;
  // => Query "WHERE user_id = ? AND type = ?" benefits from this composite index
  // => Query "WHERE type = ?" does NOT benefit (type is not the leading column)

  // => Composite index with different column order for a different access pattern
  yield* sql`
    CREATE INDEX IF NOT EXISTS idx_transactions_account_id_created_at
    ON transactions(account_id, created_at DESC)
  `;
  // => Supports queries: "WHERE account_id = ? ORDER BY created_at DESC"
  // => DESC in index avoids sort operation for descending queries
});
```

**Key Takeaway**: Design composite indexes to match your most frequent query patterns; the leading column(s) determine which queries benefit, and include `DESC` in the index when queries sort descending.

**Why It Matters**: Indexes are the single most impactful performance optimization available at the schema level. A missing index on a `WHERE` clause column turns a millisecond query into a full table scan that takes seconds on large tables. Composite index design requires understanding your query access patterns before writing migrations — the `EXPLAIN ANALYZE` output from PostgreSQL is the authoritative guide. Migrations that add indexes to production tables with `CREATE INDEX CONCURRENTLY` avoid table locks; standard `CREATE INDEX` (used in Effect SQL migrations by default) blocks writes for the index build duration.

---

### Example 24: Junction Tables (Many-to-Many)

Junction tables (also called join tables or association tables) implement many-to-many relationships. They contain foreign keys to both parent tables and typically use a composite primary key to prevent duplicate associations.

```typescript
import { SqlClient } from "@effect/sql";
import { Effect } from "effect";

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  // => Parent table 1: students
  yield* sql`
    CREATE TABLE IF NOT EXISTS students (
      id   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL
    )
  `;

  // => Parent table 2: courses
  yield* sql`
    CREATE TABLE IF NOT EXISTS courses (
      id    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL
    )
  `;

  // => Junction table: student_courses (many-to-many)
  // => A student can enroll in many courses; a course can have many students
  yield* sql`
    CREATE TABLE IF NOT EXISTS student_courses (
      student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      -- => ON DELETE CASCADE: if a student is deleted, their enrollments are deleted too
      course_id  UUID NOT NULL REFERENCES courses(id)  ON DELETE CASCADE,
      -- => ON DELETE CASCADE: if a course is deleted, all enrollments for it are deleted
      enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      -- => Additional columns are fine in junction tables
      -- => This one records when the student enrolled

      PRIMARY KEY (student_id, course_id)
      -- => Composite PK: prevents duplicate enrollments
      -- => Same student cannot enroll in the same course twice
    )
  `;

  // => Index for reverse lookup: find all students in a course
  yield* sql`
    CREATE INDEX IF NOT EXISTS idx_student_courses_course_id
    ON student_courses(course_id)
  `;
  // => Without this index, "SELECT * FROM student_courses WHERE course_id = ?" is a full scan
});
```

**Key Takeaway**: Use composite primary keys `(a_id, b_id)` in junction tables to prevent duplicate associations; add a reverse index on the second FK column for efficient lookups in both directions.

**Why It Matters**: The junction table pattern is foundational to relational data modeling. Without the composite primary key, application bugs can insert duplicate enrollments; with it, the database enforces uniqueness atomically. The reverse index on `course_id` is frequently forgotten, leading to slow queries when fetching all students in a course. In the Effect SQL world, your repository layer executes JOIN queries against these tables; the migration must create the correct indexes for those JOINs to be fast.

---

### Example 25: Seed Data in Migrations

Seed data migrations insert initial rows required for the application to function. These are typically lookup values, default configuration, or test fixtures. Seed migrations use `INSERT ... ON CONFLICT DO NOTHING` for idempotency.

```typescript
import { SqlClient } from "@effect/sql";
import { Effect } from "effect";

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  // => Create the lookup table first
  yield* sql`
    CREATE TABLE IF NOT EXISTS currencies (
      code   VARCHAR(3)   PRIMARY KEY,
      -- => ISO 4217 currency code (USD, EUR, IDR) as the primary key
      name   VARCHAR(100) NOT NULL,
      symbol VARCHAR(10)  NOT NULL
    )
  `;

  // => Seed common currencies
  // => ON CONFLICT DO NOTHING: if a row with the same code already exists, skip it
  // => This makes the seed migration idempotent — safe to re-run
  yield* sql`
    INSERT INTO currencies (code, name, symbol) VALUES
      ('USD', 'US Dollar',         '$'),
      ('EUR', 'Euro',              '€'),
      ('IDR', 'Indonesian Rupiah', 'Rp'),
      ('GBP', 'British Pound',     '£')
    ON CONFLICT (code) DO NOTHING
  `;
  // => If currencies table already has these rows (from a previous run), no error is thrown
  // => If the table is empty, all four rows are inserted

  // => For seed data that should update on re-run, use ON CONFLICT DO UPDATE:
  // => ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, symbol = EXCLUDED.symbol
  // => EXCLUDED refers to the row that was not inserted due to the conflict
});
```

**Key Takeaway**: Use `INSERT ... ON CONFLICT DO NOTHING` for seed data to maintain idempotency; use `ON CONFLICT DO UPDATE SET ...` when seed data should be refreshed on every migration run.

**Why It Matters**: Seed migrations that use plain `INSERT` without conflict handling fail on the second run with "duplicate key violation". In development where developers frequently reset and re-migrate their databases, this is a constant friction point. `ON CONFLICT DO NOTHING` is the minimal fix. The `ON CONFLICT DO UPDATE` pattern (upsert) is appropriate for configuration that may change between releases — the migration both creates the table and keeps configuration values up-to-date.

---

### Example 26: IF NOT EXISTS Guards

`IF NOT EXISTS` clauses make DDL statements idempotent. While the `effect_sql_migrations` tracking table prevents re-running migrations in normal operation, idempotent DDL protects against edge cases: manual re-runs, fresh test databases, and partial migration failures.

```typescript
import { SqlClient } from "@effect/sql";
import { Effect } from "effect";

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  // => CREATE TABLE IF NOT EXISTS: table creation is idempotent
  yield* sql`CREATE TABLE IF NOT EXISTS feature_flags (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(100) NOT NULL)`;

  // => CREATE INDEX IF NOT EXISTS: index creation is idempotent (PostgreSQL 9.5+)
  yield* sql`CREATE INDEX IF NOT EXISTS idx_feature_flags_name ON feature_flags(name)`;

  // => CREATE UNIQUE INDEX IF NOT EXISTS: unique index creation is idempotent
  yield* sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_feature_flags_name ON feature_flags(name)`;

  // => CREATE TYPE IF NOT EXISTS: enum type creation is idempotent (PostgreSQL 9.6+)
  // => Note: some older PostgreSQL versions do not support IF NOT EXISTS for CREATE TYPE
  yield* sql`CREATE TYPE IF NOT EXISTS flag_status AS ENUM ('enabled', 'disabled', 'rollout')`;

  // => ALTER TABLE ADD COLUMN IF NOT EXISTS: column addition is idempotent (PostgreSQL 9.6+)
  yield* sql`ALTER TABLE feature_flags ADD COLUMN IF NOT EXISTS status flag_status NOT NULL DEFAULT 'disabled'`;

  // => DROP TABLE IF EXISTS: table removal is idempotent
  // => Used in cleanup migrations when removing obsolete tables
  yield* sql`DROP TABLE IF EXISTS obsolete_legacy_table`;

  // => DROP INDEX IF EXISTS: index removal is idempotent
  yield* sql`DROP INDEX IF EXISTS obsolete_index_name`;
});
```

**Key Takeaway**: Apply `IF NOT EXISTS` / `IF EXISTS` guards to all DDL statements; this makes individual statements safe to re-execute independently of the `effect_sql_migrations` tracking mechanism.

**Why It Matters**: Defense in depth: the `effect_sql_migrations` table prevents normal re-runs, but `IF NOT EXISTS` guards protect against accidents. When a migration transaction partially succeeds before failing (rare with PostgreSQL's transactional DDL, but possible with non-transactional operations like `CREATE INDEX CONCURRENTLY`), idempotent DDL allows the migration to be re-run after fixing the root cause without manual cleanup.

---

### Example 27: Dropping Tables/Columns Safely

Removing tables or columns from a database schema requires care — dropped data cannot be recovered from the schema alone (only from backups). Effect SQL migrations for destructive changes follow the same pattern as constructive ones but with extra caution.

```typescript
import { SqlClient } from "@effect/sql";
import { Effect } from "effect";

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  // => DROP TABLE IF EXISTS: removes the table and all its data
  // => IF EXISTS prevents errors if the table does not exist
  // => CASCADE: also drops dependent objects (views, foreign key constraints referencing this table)
  // => RESTRICT (default): refuses to drop if any dependent objects exist
  yield* sql`DROP TABLE IF EXISTS deprecated_sessions CASCADE`;
  // => Use CASCADE only when you are certain dropping dependents is intentional
  // => Use RESTRICT (or omit the keyword) to fail safely if dependents exist

  // => DROP COLUMN: removes a column and all its data
  // => IF EXISTS: prevents errors if the column does not exist
  yield* sql`ALTER TABLE users DROP COLUMN IF EXISTS legacy_avatar_url`;
  // => legacy_avatar_url column removed from users table
  // => Data in that column is permanently gone

  // => Best practice: add a migration to mark column as deprecated (rename, set to NULL)
  // => before the migration that drops it
  // => This gives time to update application code before the schema change
  // => Two-phase migration: phase 1 (nullify/rename), phase 2 (drop after deployment)
});
```

**Key Takeaway**: Prefix destructive migrations with careful review; use `IF EXISTS` for idempotency and `CASCADE` only when intentionally removing dependents; prefer two-phase migrations for columns that are still referenced by running application code.

**Why It Matters**: Schema drops are irreversible without backups. A common production incident pattern: developer drops a column in a migration, deploys the migration, but forgets that the previous application version (still running on some servers during rolling deploys) still reads that column. The result is runtime errors across the fleet until the old version is fully replaced. Two-phase migrations (deprecate, then drop) add an extra deployment cycle but eliminate this risk. Effect SQL does not prevent destructive drops; discipline in migration design is the only safeguard.

---

### Example 28: Cascade Delete Foreign Keys

`ON DELETE CASCADE` automatically deletes child rows when a parent row is deleted. `ON DELETE RESTRICT` (the default) prevents deletion of a parent if children exist. `ON DELETE SET NULL` nullifies the foreign key in children. Choosing the right behavior is a domain decision.

```typescript
import { SqlClient } from "@effect/sql";
import { Effect } from "effect";

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  yield* sql`
    CREATE TABLE IF NOT EXISTS projects (
      id   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL
    )
  `;

  // => ON DELETE CASCADE: deleting a project deletes all its tasks
  // => Appropriate when tasks have no meaning without their project
  yield* sql`
    CREATE TABLE IF NOT EXISTS tasks (
      id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID        NOT NULL
        REFERENCES projects(id) ON DELETE CASCADE,
      -- => If projects row is deleted, all tasks with that project_id are deleted
      -- => No manual cleanup needed; database handles it atomically
      title      VARCHAR(255) NOT NULL
    )
  `;

  // => ON DELETE SET NULL: deleting a project NULLs the project_id on tasks
  // => Appropriate when tasks should persist but become "unassigned"
  // => (column must be nullable for this to work)
  yield* sql`
    CREATE TABLE IF NOT EXISTS archived_tasks (
      id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID
        REFERENCES projects(id) ON DELETE SET NULL,
      -- => project_id is nullable (no NOT NULL constraint)
      -- => If projects row is deleted, archived_tasks.project_id becomes NULL
      title      VARCHAR(255) NOT NULL
    )
  `;
  // => See 005_create_attachments.ts in demo-be-ts-effect:
  // => expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE
  // => Attachments are meaningless without their expense — CASCADE is correct there
});
```

**Key Takeaway**: Choose `ON DELETE CASCADE` when child rows are semantically owned by the parent (no meaning without it); choose `ON DELETE SET NULL` when child rows persist independently with a nullable reference.

**Why It Matters**: Incorrect cascade behavior is one of the hardest bugs to diagnose: `CASCADE` can silently delete thousands of rows, while `RESTRICT` can block deletion with cryptic foreign key violation errors. The correct choice depends on the domain invariant. In the demo-be-ts-effect codebase, attachments `ON DELETE CASCADE` to expenses because an attachment without an expense is meaningless data. Users `ON DELETE RESTRICT` refresh tokens because you might want to audit who had tokens before deleting the user. These decisions belong in the migration, not the application code.

---

### Example 29: Migration Ordering Convention

Migration file naming conventions ensure deterministic execution order. The `effect_sql_migrations` table uses migration keys for tracking; the key format `\d+_<name>` determines sort order. Zero-padded numbers guarantee lexicographic sorting matches numeric intent.

```typescript
// => Migration file naming convention (from demo-be-ts-effect):
//
// 001_create_users.ts         => key: "0001_create_users"
// 002_create_refresh_tokens.ts => key: "0002_create_refresh_tokens"
// 003_create_revoked_tokens.ts => key: "0003_create_revoked_tokens"
// 004_create_expenses.ts       => key: "0004_create_expenses"
// 005_create_attachments.ts    => key: "0005_create_attachments"
//
// => File name uses 3-digit padding (001, 002)
// => Registry key uses 4-digit padding (0001, 0002) for future-proofing
// => Either is fine as long as you are consistent; lexicographic sort must match intent

// => Correct registry — sorted by zero-padded key:
import m001 from "./001_create_users.js";
import m002 from "./002_create_refresh_tokens.js";

export const migrations = {
  "0001_create_users": m001, // => Runs first
  "0002_create_refresh_tokens": m002, // => Runs second (depends on users table)
};

// => WRONG — non-padded numbers break sort order at 10+:
// export const wrongMigrations = {
//   "1_create_users": m001,      // => "10_..." would sort before "2_..." lexicographically
//   "2_create_tokens": m002,
// };
// => Use zero-padded numbers to avoid this class of bug

// => Naming convention for the description part:
// => Use snake_case, starting with a verb describing the operation:
// => create_users, add_phone_to_customers, drop_legacy_sessions, add_idx_orders_user_id
```

**Key Takeaway**: Use zero-padded numeric prefixes in migration keys to guarantee lexicographic sort order matches execution intent; use descriptive snake_case names for the suffix.

**Why It Matters**: Migration ordering is a correctness constraint. If migration `0002` creates a foreign key to a table created by migration `0001`, but `0002` runs first due to incorrect sort order, the migration fails with "table does not exist." Zero-padded numbers are a simple, universal solution. The naming convention also serves documentation: reading the migration registry tells the schema history of the database, which is invaluable for onboarding new developers and debugging schema-related bugs.

---

### Example 30: Migration with Effect Error Handling

Effect SQL migrations participate in the Effect error channel. You can use `Effect.catchAll`, `Effect.mapError`, and `Effect.tap` to add logging, custom error handling, or fallback behavior. However, most migrations should let errors propagate to the migrator's built-in error handler.

```typescript
import { SqlClient } from "@effect/sql";
import { Effect } from "effect";

// => Standard migration: errors propagate automatically
// => The PgMigrator catches SqlError and rolls back the transaction
export const standardMigration = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;
  yield* sql`CREATE TABLE IF NOT EXISTS widgets (id UUID PRIMARY KEY DEFAULT gen_random_uuid())`;
  // => If CREATE TABLE fails, SqlError propagates up to the migrator
  // => Migrator rolls back the transaction and does not update effect_sql_migrations
});

// => Migration with diagnostic logging (Effect.tap does not change the Effect's return type)
export const migrationWithLogging = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  // => Effect.tap: runs a side effect, then continues with the original value
  // => Use for logging without affecting the Effect's result
  yield* Effect.tap(sql`CREATE TABLE IF NOT EXISTS widgets (id UUID PRIMARY KEY DEFAULT gen_random_uuid())`, () =>
    Effect.sync(() => console.log("widgets table created successfully")),
  );
  // => Console logs "widgets table created successfully" on success
  // => On SqlError, the tap's inner Effect does not run; error propagates

  // => Effect.catchAll: handle specific errors, re-throw others
  // => Use sparingly in migrations — most errors should abort and roll back
  yield* sql`CREATE INDEX IF NOT EXISTS idx_widgets_id ON widgets(id)`.pipe(
    Effect.catchAll((error) =>
      // => Log the error but continue the migration (not recommended for most cases)
      Effect.sync(() => console.warn("Index creation failed (non-fatal):", String(error))),
    ),
  );
}).pipe(
  // => Effect.mapError at the migration level: transform SqlError to a domain error
  // => Useful when the migrator needs to distinguish schema errors from connection errors
  Effect.mapError((e) => new Error(`Migration failed: ${String(e)}`)),
);

export default standardMigration;
// => For most migrations, export the standard form without manual error handling
```

**Key Takeaway**: Let most migration errors propagate naturally to the migrator's built-in handler; use `Effect.tap` for non-intrusive logging and `Effect.catchAll` only for genuinely recoverable migration steps.

**Why It Matters**: Over-engineering error handling in migrations introduces complexity without benefit. The migrator's built-in transaction rollback is the correct failure recovery mechanism for most DDL. `Effect.tap` for logging is the one exception worth adding: knowing which statement in a multi-statement migration failed is valuable for debugging. The typed error channel means you can distinguish `SqlError` (database error) from other errors programmatically in the migrator, enabling targeted alerting in production monitoring systems.

---

## What's Next

These 30 examples cover the fundamentals of Effect SQL migrations: the `Effect.gen` pattern, `SqlClient` service, template literals, table creation, indexes, constraints, client setup, and migration registry.

Intermediate examples (31-60) cover `ALTER TABLE` patterns, complex multi-table migrations, migration testing strategies, and advanced constraint combinations used in production systems.
