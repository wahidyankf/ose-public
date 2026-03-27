---
title: "Overview"
date: 2026-03-27T00:00:00+07:00
draft: false
weight: 10000000
description: "Learn F# DbUp through 75+ annotated examples covering 95% of database migration patterns - ideal for experienced developers managing PostgreSQL schema evolution with SQL scripts"
tags:
  ["fsharp", "dbup", "tutorial", "by-example", "database", "migrations", "postgresql", "sql", "schema", "code-first"]
---

## What is F# DbUp By Example?

**F# DbUp By Example** is a code-first tutorial series teaching experienced developers how to manage PostgreSQL schema evolution using DbUp from F#. Through 75+ heavily annotated, self-contained examples, you achieve 95% coverage of DbUp patterns—from writing your first SQL migration script to advanced deployment strategies, idempotency guards, and assembly-embedded script discovery.

This tutorial assumes you are an experienced developer familiar with F#, PostgreSQL, and relational database concepts. If you are new to F#, start with foundational F# tutorials first.

## Why By Example?

**Philosophy**: Show the code first, run it second, understand through direct interaction.

Traditional tutorials explain concepts then show code. By-example tutorials reverse this: every example is a working, runnable code snippet with inline annotations showing exactly what happens at each step—SQL executed, DbUp journal state, migration results, and common pitfalls.

**Target Audience**: Experienced developers who:

- Already know F# fundamentals (modules, pipelines, computation expressions)
- Understand relational databases and SQL DDL
- Prefer learning through working code rather than narrative explanations
- Want comprehensive reference material covering 95% of production migration patterns

**Not For**: Developers new to F# or databases. This tutorial moves quickly and assumes foundational knowledge.

## What Does 95% Coverage Mean?

**95% coverage** means the depth and breadth of DbUp features needed for production work, not toy examples.

### Included in 95% Coverage

- **Script Authoring**: SQL DDL conventions, naming patterns, sequential numbering, IF NOT EXISTS guards
- **DeployChanges Builder**: PostgresqlDatabase, WithScriptsEmbeddedInAssembly, LogToConsole, Build, PerformUpgrade
- **Journal Table**: SchemaVersions tracking, idempotency guarantees, migration history queries
- **Connection Setup**: NpgsqlConnection in F#, connection string patterns, PostgreSQL-specific types
- **Schema Operations**: CREATE TABLE, ALTER TABLE, DROP with safety guards, column types, constraints
- **Indexes**: Single-column, composite, unique, partial indexes
- **Constraints**: Foreign keys, CHECK constraints, UNIQUE constraints, NOT NULL with defaults
- **Data Types**: UUID primary keys, TIMESTAMPTZ defaults, DECIMAL precision, BYTEA, BOOLEAN, ENUM via CHECK
- **Relationships**: One-to-many, many-to-many junction tables, cascade behavior
- **Data Migrations**: Seed data scripts, backfill patterns, safe column renames
- **Assembly Integration**: Script discovery from embedded resources, ordering guarantees
- **Error Handling**: Checking Successful property, ErrorScript details, rollback patterns
- **Advanced Patterns**: Multiple script sources, filtered scripts, pre-deployment scripts

### Excluded from 95% (the remaining 5%)

- **Rare Adapters**: MySQL, SQLite, SQL Server specific behaviors outside core patterns
- **Custom Journal**: Implementing ISchemaVersionJournal from scratch
- **Internal Mechanics**: DbUp source connection pooling, adapter internals
- **Legacy API**: Deprecated pre-4.x DbUp builder patterns

## Tutorial Structure

### 75+ Examples Across Three Levels

**Sequential numbering**: Examples 1-75+ (unified reference system)

**Distribution**:

- **Beginner** (Examples 1-30): 0-40% coverage — Script authoring, DeployChanges builder, PostgreSQL setup, basic DDL patterns, schema operations
- **Intermediate** (Examples 31-60): 40-75% coverage — Advanced DDL, data migrations, multiple script sources, error handling, deployment strategies
- **Advanced** (Examples 61-75+): 75-95% coverage — Custom filters, journal queries, CI/CD integration, idempotency patterns, multi-schema deployments

**Rationale**: This distribution mirrors real production adoption: most teams need beginner and intermediate patterns daily; advanced patterns arise for complex multi-tenant or CI/CD scenarios.

## Five-Part Example Format

Every example follows a mandatory five-part structure:

### Part 1: Brief Explanation (2-3 sentences)

Answers:

- What is this concept or pattern?
- Why does it matter in production migrations?
- When should you use it?

**Example**:

> ### Example 7: Console Logging with WithConsoleLogger
>
> WithConsoleLogger attaches a console sink to the DbUp upgrade engine, printing each script name and execution status during migration runs. Visibility into which scripts executed—and in what order—is essential for debugging migration failures in CI/CD pipelines and local development.

### Part 2: Mermaid Diagram (when appropriate)

**Included when** (~35% of examples):

- DbUp execution flow involves multiple stages
- Relationships between SQL files and the journal table are non-obvious
- Assembly embedding and script discovery need illustration
- Error handling branches require visualization

**Skipped when**:

- Simple single-file SQL DDL operations
- Linear ALTER TABLE statements
- Trivial index additions

**Diagram requirements**:

- Use color-blind friendly palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
- Vertical orientation (mobile-first)
- Clear labels on all nodes and edges
- Comment syntax: `%%` (NOT `%%{ }%%`)

### Part 3: Heavily Annotated Code

**Core requirement**: Every significant line must have an inline comment.

**Comment annotations use `-- =>` for SQL and `// =>` for F#**:

```fsharp
let result =
    DeployChanges.To                        // => Entry point for the fluent builder
        .PostgresqlDatabase(connStr)        // => Targets PostgreSQL with Npgsql driver
        .WithScriptsEmbeddedInAssembly(asm) // => Discovers *.sql embedded resources
        .LogToConsole()                     // => Prints script names and results to stdout
        .Build()                            // => Returns UpgradeEngine instance
        .PerformUpgrade()                   // => Executes pending scripts; returns DatabaseUpgradeResult
// => result.Successful is true when all scripts ran without error
// => result.Scripts contains list of ScriptName strings that were executed
```

**Required annotations**:

- **Builder steps**: Show what each fluent call configures
- **SQL results**: Document which columns, constraints, or indexes the statement creates
- **DbUp state**: Show journal table changes after execution
- **Error cases**: Document Successful/ErrorScript properties and when they occur
- **Expected outputs**: Show console output with `-- =>` prefix in SQL examples

### Part 4: Key Takeaway (1-2 sentences)

**Purpose**: Distill the core insight to its essence.

**Must highlight**:

- The most important pattern or concept
- When to apply this in production
- Common pitfalls to avoid

**Example**:

> **Key Takeaway**: Always check `result.Successful` before proceeding with application startup; on failure, `result.Error.Message` gives the exact SQL error and `result.ErrorScript` identifies the offending script.

### Part 5: Why It Matters (50-100 words)

**Purpose**: Contextualize the example within production concerns.

Covers:

- Production impact of ignoring this pattern
- How it prevents common migration failures
- Relationship to broader database reliability practices

## Self-Containment Rules

**Critical requirement**: Examples must be copy-paste-runnable within their chapter scope.

### Beginner Level Self-Containment

**Rule**: Each SQL example is completely standalone; each F# snippet is runnable with the stated dependencies.

**Requirements**:

- Complete SQL DDL statements with no external table references (or explicit dependency noted)
- Full F# snippets including open statements and let bindings
- No references to previous examples
- Runnable against a live PostgreSQL instance with DbUp 4.x NuGet packages

### Intermediate and Advanced Level Self-Containment

**Rule**: Examples assume beginner concepts but include all necessary code.

**Allowed assumptions**:

- Reader understands DeployChanges builder and PerformUpgrade from beginner examples
- Reader can create a PostgreSQL connection string from environment variables
- Reader knows F# module syntax and basic pattern matching

## How to Use This Tutorial

### Prerequisites

Before starting, ensure you have:

- .NET 8+ SDK installed
- PostgreSQL 14+ running (local or Docker)
- Basic F# knowledge (modules, functions, pipelines)
- Basic SQL knowledge (DDL: CREATE, ALTER, DROP)
- DbUp NuGet package: `dbup-postgresql` (4.x or 5.x)

### Running Examples

SQL examples run directly against PostgreSQL:

```bash
psql $DATABASE_URL -f 001-create-users.sql
```

F# examples run as part of your application startup or test setup:

```fsharp
// Add to project file: <PackageReference Include="dbup-postgresql" Version="5.*" />
open DbUp

let connStr = System.Environment.GetEnvironmentVariable("DATABASE_URL")
let result =
    DeployChanges.To
        .PostgresqlDatabase(connStr)
        .WithScriptsEmbeddedInAssembly(System.Reflection.Assembly.GetExecutingAssembly())
        .LogToConsole()
        .Build()
        .PerformUpgrade()
```

### Learning Path

**For F# developers adopting DbUp**:

1. Work through beginner examples (1-30) — learn script authoring and builder setup
2. Deep dive intermediate (31-60) — master complex DDL and data migration patterns
3. Reference advanced (61-75+) — learn CI/CD integration and deployment strategies

**For developers migrating from Flyway or Liquibase**:

1. Read this overview to understand DbUp philosophy (SQL-first, no XML/YAML)
2. Jump to intermediate examples (31-60) to see how DbUp handles common scenarios
3. Use beginner examples as syntax reference for PostgreSQL-specific DDL

### Coverage Progression

As you progress through examples, you achieve cumulative coverage:

- **After Beginner** (Example 30): 40% — Can manage basic schema evolution for production tables
- **After Intermediate** (Example 60): 75% — Can handle most production migration scenarios
- **After Advanced** (Example 75+): 95% — Expert-level DbUp mastery for complex deployments

## Code Annotation Philosophy

Every example uses **educational annotations** to show exactly what happens:

```sql
-- Example 1: Creates the users table with UUID primary key
CREATE TABLE users (
    -- => UUID type requires the pgcrypto extension or PostgreSQL 13+ gen_random_uuid()
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- => VARCHAR without length limit stores up to 1 GB; add CHECK constraint for practical limits
    username VARCHAR NOT NULL,
    -- => TIMESTAMPTZ stores timezone-aware instants; prefer over TIMESTAMP for distributed systems
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- => After execution: users table exists in schemaversions journal as 001-create-users.sql
```

Annotations show:

- **Column type choices** and their tradeoffs
- **Default value behavior** and when defaults apply
- **Constraint enforcement** and what violations look like
- **DbUp journal state** after script execution
- **Common gotchas** and safe alternatives

## Quality Standards

Every example in this tutorial meets these standards:

- **Self-contained**: Copy-paste-runnable within chapter scope
- **Annotated**: Every significant line has an inline comment using `-- =>` (SQL) or `// =>` (F#)
- **Production-relevant**: Real-world patterns drawn from actual F#/PostgreSQL projects
- **Accessible**: Color-blind friendly diagrams, clear structure

## Next Steps

Ready to start? Begin with:

- [Beginner Examples (1-30)](/en/learn/software-engineering/data/tools/fsharp-dbup/by-example/beginner) — Script authoring and DeployChanges builder fundamentals
