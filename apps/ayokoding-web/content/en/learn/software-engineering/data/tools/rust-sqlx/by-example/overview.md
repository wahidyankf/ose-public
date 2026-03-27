---
title: "Overview"
date: 2026-03-27T00:00:00+07:00
draft: false
weight: 10000000
description: "Learn Rust SQLx migrations through 30 annotated code examples covering 95% of migration patterns - ideal for experienced developers managing database schema evolution"
tags: ["rust-sqlx", "tutorial", "by-example", "migrations", "code-first", "sqlx", "database", "postgresql", "sqlite"]
---

## What is Rust SQLx Migrations By Example?

**Rust SQLx Migrations By Example** is a code-first tutorial series teaching experienced Rust developers how to manage database schema evolution using SQLx's migrate feature. Through 30 heavily annotated, self-contained examples, you will achieve 95% coverage of SQLx migration patterns—from writing your first SQL migration file to embedded migrations, programmatic execution, and advanced constraint patterns.

This tutorial focuses specifically on the migrate feature of SQLx. It assumes familiarity with Rust, async/await, and basic SQL. If you are new to Rust async programming, start with foundational Rust tutorials first.

## Why By Example?

**Philosophy**: Show the code first, run it second, understand through direct interaction.

Traditional tutorials explain concepts then show code. By-example tutorials reverse this: every example is a working, runnable code snippet with inline annotations showing exactly what happens at each step—migration file contents, SQL executed, schema states produced, and common pitfalls.

**Target Audience**: Experienced developers who:

- Already know Rust fundamentals including async/await and error handling
- Understand relational databases and SQL
- Prefer learning through working code rather than narrative explanations
- Want comprehensive reference material covering 95% of production migration patterns

**Not For**: Developers new to Rust or SQL. This tutorial moves quickly and assumes foundational knowledge.

## What Does 95% Coverage Mean?

**95% coverage** means depth and breadth of SQLx migration features needed for production work, not toy examples.

### Included in 95% Coverage

- **Migration Files**: SQL file structure, naming conventions, sequential numbering
- **CLI Commands**: `sqlx migrate add`, `sqlx migrate run`, `sqlx migrate info`, `sqlx migrate revert`
- **Embedded Migrations**: `migrate!()` macro, `include_str!()`, compile-time SQL embedding
- **Connection Pools**: `PgPool`, `SqlitePool`, `AnyPool` setup and configuration
- **Table Operations**: CREATE TABLE, ALTER TABLE, DROP TABLE with safety guards
- **Column Constraints**: NOT NULL, DEFAULT values, UNIQUE, CHECK constraints
- **Data Types**: UUIDs, timestamps, enums (PostgreSQL), numeric types
- **Indexes**: Single-column, composite, conditional indexes
- **Foreign Keys**: REFERENCES, ON DELETE CASCADE, ON UPDATE behaviors
- **Junction Tables**: Many-to-many relationship schemas
- **Data Migrations**: Seed data, backfill scripts embedded in migrations
- **Reversibility**: Up/down migration pairs for rollback capability
- **\_sqlx_migrations Table**: How SQLx tracks applied migrations internally

### Excluded from 95% (the remaining 5%)

- **SQLx Internals**: Connection pool mechanics, driver implementation details
- **Rare Constraints**: Partial indexes, expression indexes, exclusion constraints
- **Database-Specific**: Exotic PostgreSQL features outside standard migration use cases
- **Custom Migrators**: Writing custom MigratorTrait implementations
- **Advanced DDL**: Materialized views, stored procedures, triggers

## Tutorial Structure

### 30 Examples Across One Level

**Sequential numbering**: Examples 1-30 (beginner level)

**Distribution**:

- **Beginner** (Examples 1-30): 0-40% coverage - Migration files, CLI commands, embedded migrations, connection setup, common constraint patterns

**Rationale**: 30 examples provide thorough coverage of the migrate feature specifically, giving you everything needed to manage schema evolution in production Rust applications.

## Five-Part Example Format

Every example follows a **mandatory five-part structure**:

### Part 1: Brief Explanation (2-3 sentences)

**Answers**:

- What is this concept or pattern?
- Why does it matter in production code?
- When should you use it?

**Example**:

> ### Example 12: Embedded Migrations with migrate!() Macro
>
> The `migrate!()` macro embeds SQL migration files directly into the compiled binary at build time, eliminating the need to ship separate migration files with your application. This is the recommended approach for production deployments where you want a self-contained executable.

### Part 2: Mermaid Diagram (when appropriate)

**Included when** (roughly 40% of examples):

- Migration execution flow has non-obvious steps
- Schema relationships between tables require illustration
- The `_sqlx_migrations` tracking mechanism needs visualization
- CLI command flow involves multiple stages

**Skipped when**:

- Simple SQL DDL statements with clear linear semantics
- Single-constraint examples
- Trivial file structure examples

**Diagram requirements**:

- Use color-blind friendly palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
- Vertical orientation (mobile-first)
- Clear labels on all nodes and edges
- Comment syntax: `%%` (NOT `%%{ }%%`)

### Part 3: Heavily Annotated Code

**Core requirement**: Every significant line must have an inline comment

**Comment annotations use `-- =>` for SQL and `// =>` for Rust**:

```sql
-- Create the users table with a UUID primary key
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- => UUID auto-generated by PostgreSQL
    username TEXT NOT NULL UNIQUE,                 -- => username must be present and unique
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()  -- => timestamp set automatically on insert
);
-- => SQL executed: CREATE TABLE users (...)
-- => _sqlx_migrations updated: version recorded as applied
```

```rust
// Embed all migrations from the migrations/ directory at compile time
let migrator = sqlx::migrate!("./migrations"); // => Scans ./migrations/ at compile time
                                               // => Embeds SQL files into binary
migrator.run(&pool).await?;                    // => Applies any unapplied migrations in order
                                               // => Updates _sqlx_migrations table
```

**Required annotations**:

- **SQL semantics**: Show what each constraint or column definition enforces
- **Migration state**: Document what the \_sqlx_migrations table records
- **Side effects**: Document schema changes produced
- **Expected outputs**: Show CLI output with `-- =>` prefix
- **Error cases**: Document when migrations fail and why

### Part 4: Key Takeaway (1-2 sentences)

**Purpose**: Distill the core insight to its essence

**Must highlight**:

- The most important pattern or concept
- When to apply this in production
- Common pitfalls to avoid

### Part 5: Why It Matters (50-100 words)

**Purpose**: Connect the example to real-world production scenarios

**Must cover**:

- Production relevance of the pattern
- Consequences of not following the pattern
- How it fits into a larger migration strategy

## Self-Containment Rules

**Critical requirement**: Examples must be copy-paste-runnable within their chapter scope.

**Beginner Level Self-Containment**

Each example is completely standalone:

- Full SQL file contents shown
- All necessary Rust code included
- No references to previous examples
- Runnable with `cargo run` or `sqlx` CLI given a database URL

**Example structure**:

```sql
-- migrations/0001_create_users.sql
CREATE TABLE IF NOT EXISTS users (    -- => Creates users table if absent
    id BIGSERIAL PRIMARY KEY,         -- => Auto-incrementing integer primary key
    username TEXT NOT NULL            -- => Required text column
);
```

```rust
// src/main.rs
use sqlx::PgPool;

#[tokio::main]
async fn main() -> Result<(), sqlx::Error> {
    let pool = PgPool::connect("postgres://user:pass@localhost/mydb").await?;
    // => Connects to PostgreSQL, returns connection pool
    sqlx::migrate!("./migrations").run(&pool).await?;
    // => Applies all unapplied migrations in version order
    Ok(())
}
```

## How to Use This Tutorial

### Prerequisites

Before starting, ensure you have:

- Rust 1.75+ with Cargo installed
- PostgreSQL or SQLite running (examples note which database applies)
- Basic Rust knowledge (structs, enums, async/await, error handling)
- Basic SQL knowledge (CREATE TABLE, ALTER TABLE, INSERT)
- SQLx CLI installed: `cargo install sqlx-cli`

### Running Examples

SQL migration examples run directly with the SQLx CLI:

```bash
# Apply migrations
sqlx migrate run --database-url postgres://user:pass@localhost/mydb

# Check status
sqlx migrate info --database-url postgres://user:pass@localhost/mydb

# Revert last migration
sqlx migrate revert --database-url postgres://user:pass@localhost/mydb
```

Rust code examples run with Cargo:

```bash
DATABASE_URL=postgres://user:pass@localhost/mydb cargo run
```

### Learning Path

**For Rust developers new to SQLx migrations**:

1. Work through examples 1-10 for CLI and file fundamentals
2. Study examples 11-20 for programmatic migration and connection setup
3. Apply examples 21-30 for advanced constraint and schema patterns

**For developers migrating from other tools**:

1. Read the overview to understand SQLx migration philosophy
2. Jump to Example 12 for embedded migrations (key differentiator from other tools)
3. Reference beginner examples for SQL pattern specifics

**For quick reference**:

- Use example numbers as reference (for example, "See Example 12 for embedded migrations")
- Search for specific patterns using Ctrl+F for terms like "UUID", "CASCADE", "index"
- Copy-paste examples as starting points for your migration files

### Coverage Progression

As you progress through examples, you achieve cumulative coverage:

- **After Example 10**: Can create and run basic migrations with the CLI
- **After Example 20**: Can embed migrations in Rust binaries with multiple pool types
- **After Example 30**: Expert-level SQLx migration mastery covering 95% of production patterns

## Example Numbering System

**Sequential numbering**: Examples 1-30 in the beginner tutorial

**Why sequential?**

- Creates a unified reference system ("See Example 12")
- Clear progression from CLI fundamentals to advanced schema patterns
- Easy to track coverage percentage

**Beginner**: Examples 1-30 (0-40% coverage)

## Code Annotation Philosophy

Every example uses **educational annotations** to show exactly what happens:

```sql
-- Variable annotation (SQL column definition)
username VARCHAR(50) NOT NULL UNIQUE, -- => text, required, must be unique across table
                                      -- => violation raises unique_violation (SQLSTATE 23505)

-- Migration tracking
-- => After migration runs: _sqlx_migrations row inserted
-- => version: 20240101120000, checksum: sha384(...), applied_at: now()
```

```rust
// Pool creation
let pool = PgPool::connect(database_url).await?; // => Returns PgPool (connection pool)
                                                  // => Establishes initial connections to PostgreSQL
sqlx::migrate!("./migrations").run(&pool).await?; // => Scans ./migrations/ at build time
                                                   // => Applies unapplied migrations in version order
```

Annotations show:

- **SQL semantics** enforced by each constraint
- **Migration tracking** via \_sqlx_migrations
- **Return types** and their meanings
- **Common gotchas** such as version ordering and checksum validation

## Quality Standards

Every example in this tutorial meets these standards:

- **Self-contained**: Copy-paste-runnable within chapter scope
- **Annotated**: Every significant line has an inline comment
- **Production-relevant**: Real-world patterns, not toy examples
- **Accessible**: Color-blind friendly diagrams, clear structure
- **Database-accurate**: SQL examples tested against PostgreSQL and SQLite behavior

## Next Steps

Ready to start? Begin with [Beginner Examples (1-30)](/en/learn/software-engineering/data/tools/rust-sqlx/by-example/beginner) to build a complete foundation in SQLx migrations.

## Feedback and Contributions

Found an issue? Have a suggestion? This tutorial is part of the ayokoding-web learning platform. Check the repository for contribution guidelines.
