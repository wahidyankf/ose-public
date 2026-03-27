---
title: "Overview"
date: 2026-03-27T00:00:00+07:00
draft: false
weight: 10000000
description: "Learn Go Goose through 85 annotated code examples covering 95% of the migration tool - ideal for experienced developers building production database migration pipelines"
tags: ["golang", "goose", "tutorial", "by-example", "database", "migrations", "code-first", "sql", "postgresql"]
---

## What is Go Goose By Example?

**Go Goose By Example** is a code-first tutorial series teaching experienced Go developers how to build production-ready database migration pipelines using the Goose migration tool. Through 85 heavily annotated, self-contained examples, you'll achieve 95% coverage of Goose patterns—from basic SQL migration files to advanced embedded migrations, programmatic execution, and version management.

This tutorial assumes you're an experienced developer familiar with Go, SQL, and relational databases. If you're new to Go, start with foundational Go tutorials first.

## Why By Example?

**Philosophy**: Show the code first, run it second, understand through direct interaction.

Traditional tutorials explain concepts then show code. By-example tutorials reverse this: every example is a working, runnable code snippet with inline annotations showing exactly what happens at each step—SQL executed, migration states, file structures, and common pitfalls.

**Target Audience**: Experienced developers who:

- Already know Go fundamentals and SQL
- Understand relational databases and schema design
- Prefer learning through working code rather than narrative explanations
- Want comprehensive reference material covering 95% of production migration patterns

**Not For**: Developers new to Go or databases. This tutorial moves quickly and assumes foundational knowledge.

## What Does 95% Coverage Mean?

**95% coverage** means depth and breadth of Goose features needed for production work, not toy examples.

### Included in 95% Coverage

- **SQL Migration Files**: Up/Down directives, naming conventions, sequential versioning
- **CLI Usage**: goose up, goose down, goose status, goose redo, goose version
- **Schema Operations**: CREATE TABLE, ALTER TABLE, DROP TABLE, indexes, constraints
- **Data Types**: UUID primary keys, TIMESTAMPTZ columns, DECIMAL fields, BOOLEAN flags
- **Constraints**: NOT NULL, UNIQUE, CHECK, FOREIGN KEY, ON DELETE CASCADE
- **Indexes**: Single-column, composite, partial, and unique indexes
- **Embedded Migrations**: Go embed.FS, goose.NewProvider(), programmatic execution
- **Context-Aware Execution**: Context-aware Up, UpByOne, UpTo, Down, Reset operations
- **Version Management**: goose_db_version table, version tracking, selective rollback
- **Data Migrations**: Seed data, bulk inserts, transformations within migrations
- **Guard Patterns**: IF NOT EXISTS, IF EXISTS for idempotent migrations
- **PostgreSQL Patterns**: ENUM types, gen_random_uuid(), composite indexes, sequences
- **Transaction Handling**: goose No-Transaction annotation for DDL outside transactions
- **Migration Composition**: Multi-statement migrations, conditional logic

### Excluded from 95% (the remaining 5%)

- **Goose Internals**: Migration engine implementation details, lock mechanics
- **Rare Dialects**: MySQL/MariaDB-specific syntax beyond standard SQL
- **Legacy Features**: Goose v1/v2 API patterns
- **Custom Migration Sources**: Implementing custom goose.MigrationSource
- **Extreme Edge Cases**: Race conditions, concurrent migration scenarios

## Tutorial Structure

### 85 Examples Across Three Levels

**Sequential numbering**: Examples 1-85 (unified reference system)

**Distribution**:

- **Beginner** (Examples 1-30): 0-40% coverage - SQL migration files, CLI usage, basic schema operations, embedded migrations, programmatic execution
- **Intermediate** (Examples 31-60): 40-75% coverage - Advanced schema patterns, version management, transactions, data migrations, multi-environment strategies
- **Advanced** (Examples 61-85): 75-95% coverage - Custom providers, integration patterns, testing migrations, performance optimization, complex rollback strategies

**Rationale**: 85 examples provide granular progression from basic SQL files to expert mastery without overwhelming maintenance burden.

## Five-Part Example Format

Every example follows a **mandatory five-part structure**:

### Part 1: Brief Explanation (2-3 sentences)

**Answers**:

- What is this concept/pattern?
- Why does it matter in production code?
- When should you use it?

**Example**:

> ### Example 18: Embedding Migrations with Go embed.FS
>
> Go's embed package allows you to bundle SQL migration files directly into your binary at compile time, eliminating deployment dependencies on external migration directories. Combined with goose.NewProvider(), embedded migrations enable hermetic deployments where the binary contains everything needed to bring the database to the correct schema version.

### Part 2: Mermaid Diagram (when appropriate)

**Included when** (~40% of examples):

- Migration execution flow involves multiple stages
- Schema relationships between tables are non-obvious
- Embed.FS file system hierarchy needs visualization
- Version table state transitions require illustration
- Rollback sequences need step-by-step depiction

**Skipped when**:

- Simple single-file SQL migrations
- Basic CLI commands with clear linear flow
- Trivial ALTER TABLE statements

**Diagram requirements**:

- Use color-blind friendly palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
- Vertical orientation (mobile-first)
- Clear labels on all nodes and edges
- Comment syntax: `%%` (NOT `%%{ }%%`)

### Part 3: Heavily Annotated Code

**Core requirement**: Every significant line must have an inline comment

**Comment annotations use `-- =>` notation for SQL and `// =>` for Go**:

```sql
-- +goose Up
CREATE TABLE users (                        -- => Begin table definition
    id UUID NOT NULL PRIMARY KEY            -- => UUID primary key, non-null
        DEFAULT gen_random_uuid(),          -- => PostgreSQL generates UUID automatically
    username VARCHAR(50) NOT NULL UNIQUE    -- => Max 50 chars, enforces uniqueness
);                                          -- => Table created with constraints

-- +goose Down
DROP TABLE IF EXISTS users;                 -- => Safely removes table; IF EXISTS prevents errors
```

```go
provider, err := goose.NewProvider(         // => Constructs migration provider
    goose.DialectPostgres,                  // => Targets PostgreSQL dialect
    sqlDB,                                  // => *sql.DB handle from database/sql
    migrationsFS,                           // => embed.FS containing .sql files
    goose.WithVerbose(false),               // => Suppresses migration log output
)                                           // => Returns *goose.Provider, error
_, err = provider.Up(context.Background())  // => Executes all pending migrations
                                            // => Returns []MigrationResult, error
```

**Required annotations**:

- **SQL statements**: Show what each clause does and why
- **Go setup code**: Show types, method signatures, return values
- **Migration states**: Document what version the database reaches
- **Side effects**: Document schema changes, index creation, data inserts
- **Expected outputs**: Show goose CLI output with `-- => Output:` prefix
- **Error cases**: Document when errors occur and how to handle them

### Part 4: Key Takeaway (1-2 sentences)

**Purpose**: Distill the core insight to its essence

**Must highlight**:

- The most important pattern or concept
- When to apply this in production
- Common pitfalls to avoid

**Example**:

> **Key Takeaway**: Always use `goose.WithVerbose(false)` in production programmatic migrations and handle the returned `[]MigrationResult` to log which migrations ran, enabling observability without cluttering logs.

### Part 5: Why It Matters (50-100 words)

**Purpose**: Connect the example to production impact

**Example**:

> **Why It Matters**: In production deployments, embedded migrations eliminate the need to ship migration files alongside your binary or manage file paths across environments. When combined with `provider.Up(ctx)`, your application can self-migrate on startup with full context cancellation support. This pattern is used in `apps/demo-be-golang-gin` and ensures every deployed instance of the binary can bring its database schema to the correct version without external tooling or deployment scripts.

## Self-Containment Rules

**Critical requirement**: Examples must be copy-paste-runnable within their chapter scope.

### Beginner Level Self-Containment

**Rule**: Each example is completely standalone

**Requirements**:

- Full SQL migration file or complete Go function
- All necessary imports shown
- Helper code defined in-place
- No references to previous examples
- Runnable with `goose` CLI or standard `go run`

### Intermediate Level Self-Containment

**Rule**: Examples assume beginner concepts but include all necessary code

**Allowed assumptions**:

- Reader knows basic SQL migration syntax
- Reader understands goose Up/Down directives
- Reader can run goose CLI commands

### Advanced Level Self-Containment

**Rule**: Examples assume beginner + intermediate knowledge but remain runnable

**Allowed assumptions**:

- Reader knows embedded migrations and goose.NewProvider()
- Reader understands goose_db_version table
- Reader can navigate Goose documentation for context

## How to Use This Tutorial

### Prerequisites

Before starting, ensure you have:

- Go 1.21+ installed
- PostgreSQL running (or SQLite for local development)
- Goose CLI installed (`go install github.com/pressly/goose/v3/cmd/goose@latest`)
- Basic SQL knowledge (CREATE TABLE, ALTER TABLE, indexes)

### Running SQL Examples

All SQL migration files follow this pattern:

```bash
# Apply migrations from a directory
goose -dir ./db/migrations postgres "host=localhost user=postgres dbname=myapp" up

# Check status
goose -dir ./db/migrations postgres "host=localhost user=postgres dbname=myapp" status

# Roll back one migration
goose -dir ./db/migrations postgres "host=localhost user=postgres dbname=myapp" down
```

### Learning Path

**For experienced Go developers new to Goose**:

1. Skim beginner examples (1-30) - Review migration fundamentals quickly
2. Deep dive intermediate (31-60) - Master production patterns
3. Reference advanced (61-85) - Learn complex strategies and edge cases

**For developers switching from Flyway/Liquibase**:

1. Read overview to understand Goose philosophy
2. Jump to Examples 18-20 (embedded migrations) - See Go-idiomatic approach
3. Reference beginner for SQL syntax as needed
4. Use advanced for provider customization

**For quick reference**:

- Use example numbers as reference (e.g., "See Example 18 for embed.FS setup")
- Search for specific patterns (Ctrl+F for "foreign key", "UUID", etc.)
- Copy-paste examples as starting points for your migrations

### Coverage Progression

As you progress through examples, you'll achieve cumulative coverage:

- **After Beginner** (Example 30): 40% - Can write and run basic SQL migrations programmatically
- **After Intermediate** (Example 60): 75% - Can handle most production migration scenarios
- **After Advanced** (Example 85): 95% - Expert-level Goose mastery

## Example Numbering System

**Sequential numbering**: Examples 1-85 across all three levels

**Why sequential?**

- Creates unified reference system ("See Example 18")
- Clear progression from fundamentals to mastery
- Easy to track coverage percentage

**Beginner**: Examples 1-30 (0-40% coverage)
**Intermediate**: Examples 31-60 (40-75% coverage)
**Advanced**: Examples 61-85 (75-95% coverage)

## Code Annotation Philosophy

Every example uses **educational annotations** to show exactly what happens:

```sql
-- +goose Up
-- => Goose reads this directive to find the "apply" block
CREATE TABLE products (
    id          UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    -- => UUID primary key; gen_random_uuid() requires pgcrypto or PostgreSQL 13+
    name        VARCHAR(255) NOT NULL,
    -- => Required product name; VARCHAR(255) allows up to 255 characters
    price       DECIMAL(10,2) NOT NULL,
    -- => Monetary value; DECIMAL(10,2) = up to 8 digits before decimal, 2 after
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    -- => Timezone-aware timestamp; DEFAULT NOW() auto-populated on INSERT
);
-- => Creates products table with 4 columns and 1 auto-generated primary key

-- +goose Down
DROP TABLE IF EXISTS products;
-- => Removes products table; IF EXISTS prevents error if already dropped
```

Annotations show:

- **SQL clause meanings** and their production implications
- **Type choices** (why UUID vs SERIAL, why TIMESTAMPTZ vs TIMESTAMP)
- **Constraint effects** on insert/update behavior
- **Goose directives** and their roles in migration execution
- **Go setup patterns** and their types/return values

## Quality Standards

Every example in this tutorial meets these standards:

- **Self-contained**: Copy-paste-runnable within chapter scope
- **Annotated**: Every significant line has inline comment
- **Tested**: All code examples verified working
- **Production-relevant**: Real-world patterns, not toy examples
- **Accessible**: Color-blind friendly diagrams, clear structure

## Next Steps

Ready to start? Choose your path:

- **New to Goose**: Start with [Beginner Examples (1-30)](/en/learn/software-engineering/data/tools/golang-goose/by-example/beginner)
- **Know Goose CLI, want programmatic**: Jump to Example 18 in [Beginner Examples (1-30)](/en/learn/software-engineering/data/tools/golang-goose/by-example/beginner)

## Feedback and Contributions

Found an issue? Have a suggestion? This tutorial is part of the ayokoding-web learning platform. Check the repository for contribution guidelines.
