---
title: "Overview"
date: 2026-03-27T00:00:00+07:00
draft: false
weight: 10000000
description: "Learn Kotlin Flyway through 80 annotated code examples covering 95% of the library - ideal for experienced developers managing database schema migrations in production"
tags: ["kotlin-flyway", "tutorial", "by-example", "flyway", "database", "migrations", "sql", "gradle"]
---

## What is Kotlin Flyway By Example?

**Kotlin Flyway By Example** is a code-first tutorial series teaching experienced Kotlin developers how to manage database schema migrations reliably using Flyway. Through 80 heavily annotated, self-contained examples, you will achieve 95% coverage of Flyway patterns—from versioned SQL migrations and naming conventions to Gradle plugin configuration, repeatable migrations, and full Ktor integration.

This tutorial assumes you are an experienced developer familiar with Kotlin, Gradle, SQL, and relational databases. If you are new to SQL migrations in general, review SQL fundamentals before proceeding.

## Why By Example?

**Philosophy**: Show the migration file or Kotlin configuration first, execute it second, understand through direct interaction.

Traditional tutorials explain concepts then show code. By-example tutorials reverse this: every example is a working, runnable SQL migration or Kotlin snippet with inline annotations showing exactly what happens at each step—what SQL Flyway executes, what the `flyway_schema_history` table records, what errors occur and why, and how to avoid common pitfalls.

**Target Audience**: Experienced developers who:

- Already know Kotlin and Gradle fundamentals
- Understand relational databases and SQL DDL
- Prefer learning through working code rather than narrative explanations
- Want comprehensive reference material covering 95% of production migration patterns

**Not For**: Developers new to databases or SQL. This tutorial moves quickly and assumes foundational knowledge.

## What Does 95% Coverage Mean?

**95% coverage** means depth and breadth of Flyway features needed for production work, not toy examples.

### Included in 95% Coverage

- **Versioned Migrations**: V-numbered SQL files, naming convention, version ordering
- **Repeatable Migrations**: R-prefixed files, checksum-based re-execution
- **Naming Conventions**: Version, separator, description, suffix rules
- **Core API**: `Flyway.configure()`, `dataSource()`, `load()`, `migrate()`, `validate()`, `info()`, `clean()`, `baseline()`
- **Schema History**: `flyway_schema_history` table, checksum tracking, execution state
- **SQL DDL Patterns**: Tables, columns, indexes, foreign keys, constraints, enums, UUIDs
- **Data Migrations**: Seed data, reference data insertion within SQL migrations
- **Schema Evolution**: Adding columns, dropping columns safely, renaming, type changes
- **Guard Patterns**: `IF NOT EXISTS`, `IF EXISTS`, safe drops
- **Build Tool Integration**: Gradle plugin configuration, Maven plugin configuration
- **Framework Integration**: Ktor integration pattern, Spring Boot auto-configuration
- **Flyway Configuration**: Locations, schemas, baseline, encoding, placeholders
- **Error Handling**: Checksum mismatch, migration failures, out-of-order detection
- **Advanced Patterns**: Multi-statement migrations, transaction control, large data sets

### Excluded from 95% (the remaining 5%)

- **Flyway Teams/Enterprise**: Commercial features (undo migrations, dry runs, drift detection)
- **Exotic Databases**: Oracle-specific, SQL Server-specific edge cases
- **Java Migrations**: Flyway Java-based migration files (`JavaMigration` interface)
- **Script Migrations**: Python/shell-based migration scripts
- **Advanced Clustering**: Multi-node deployment coordination edge cases

## Tutorial Structure

### 80 Examples Across Three Levels

**Sequential numbering**: Examples 1-80 (unified reference system)

**Distribution**:

- **Beginner** (Examples 1-30): 0-40% coverage - Naming conventions, core API, basic DDL patterns, schema history, common SQL constructs
- **Intermediate** (Examples 31-55): 40-75% coverage - Schema evolution, repeatable migrations, error handling, build tool plugins, configuration options
- **Advanced** (Examples 56-80): 75-95% coverage - Complex DDL patterns, data migrations, performance, framework integration, production hardening

## Five-Part Example Format

Every example follows a **mandatory five-part structure**:

### Part 1: Brief Explanation (2-3 sentences)

**Answers**:

- What is this concept/pattern?
- Why does it matter in production migrations?
- When should you use it?

**Example**:

> ### Example 5: Creating Tables
>
> Versioned migrations create database tables through standard SQL DDL executed exactly once by Flyway in version order. The `CREATE TABLE` statement defines column names, types, constraints, and defaults that become permanent schema artifacts tracked in `flyway_schema_history`.

### Part 2: Mermaid Diagram (when appropriate)

**Included when** (~35% of examples):

- Flyway execution flow is non-obvious
- Migration ordering or dependency relationships need visualization
- Schema relationships involve multiple tables
- Error handling or branching behavior requires illustration

**Skipped when**:

- Simple single-file SQL examples with clear linear flow
- Trivial configuration options
- Self-explanatory DDL statements

**Diagram requirements**:

- Use color-blind friendly palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
- Vertical orientation (mobile-first)
- Clear labels on all nodes and edges
- Comment syntax: `%%` (NOT `%%{ }%%`)

### Part 3: Heavily Annotated Code

**Core requirement**: Every significant line must have an inline comment

**Comment annotations use `-- =>` for SQL and `// =>` for Kotlin**:

```sql
-- V1__create_users.sql
CREATE TABLE users (          -- => DDL statement: creates "users" table in database
  id   UUID NOT NULL,         -- => UUID column: primary key (non-nullable)
  name VARCHAR(100) NOT NULL  -- => VARCHAR column: max 100 chars, required
);                            -- => Flyway records this file in flyway_schema_history on success
```

```kotlin
Flyway.configure()            // => Creates FlywayConfiguration builder
  .dataSource(url, user, pw)  // => Sets JDBC connection (url, username, password)
  .load()                     // => Builds Flyway instance, validates config
  .migrate()                  // => Scans classpath, runs pending migrations in order
```

**Required annotations**:

- **SQL statements**: Document what each DDL clause does
- **Flyway API calls**: Show what each method configures or triggers
- **Schema history effects**: Document what Flyway records on success
- **Error cases**: Document when errors occur and what triggers them
- **Expected outputs**: Show flyway_schema_history state or console output where relevant

### Part 4: Key Takeaway (1-2 sentences)

**Purpose**: Distill the core insight to its essence

**Must highlight**:

- The most important pattern or concept
- When to apply this in production
- Common pitfalls to avoid

**Example**:

```markdown
**Key Takeaway**: Version numbers must be unique integers or dotted integers; Flyway rejects duplicate versions and out-of-order migrations by default, so always increment versions monotonically.
```

### Part 5: Why It Matters (50-100 words)

**Purpose**: Connect the example to real production consequences

**Must explain**:

- What breaks in production without this pattern
- How this pattern prevents data loss, downtime, or inconsistency
- Why experienced developers must understand this deeply

## Self-Containment Rules

**Critical requirement**: Examples must be copy-paste-runnable or clearly executable without external context.

### SQL Migration Self-Containment

**Rule**: Each SQL migration file is completely standalone

**Requirements**:

- Complete SQL statements (no partial DDL)
- All referenced tables either created in this file or explicitly noted as prerequisites
- Runnable against a fresh PostgreSQL database

### Kotlin Configuration Self-Containment

**Rule**: Each Kotlin snippet includes all necessary imports and context

**Requirements**:

- Full import statements shown
- All referenced variables declared in the example
- Runnable as a Kotlin main function or object method

## How to Use This Tutorial

### Prerequisites

Before starting, ensure you have:

- Kotlin 1.9+ or 2.x installed (via Gradle)
- PostgreSQL 14+ running locally or via Docker
- Basic Kotlin knowledge (functions, objects, coroutines)
- Basic SQL knowledge (DDL: CREATE TABLE, ALTER TABLE, DROP TABLE)
- Flyway dependency in `build.gradle.kts` (`org.flywaydb:flyway-core` and `org.flywaydb:flyway-database-postgresql`)

### Running Examples

SQL migration files go in:

```
src/main/resources/db/migration/
```

Kotlin Flyway initialization runs at application startup:

```kotlin
Flyway.configure()
  .dataSource("jdbc:postgresql://localhost:5432/mydb", "user", "password")
  .load()
  .migrate()
```

### Learning Path

**For Kotlin developers new to Flyway**:

1. Work through beginner examples (1-30) - Master naming conventions and core DDL
2. Deep dive intermediate (31-55) - Handle schema evolution and build tool integration
3. Reference advanced (56-80) - Learn production hardening and advanced patterns

**For developers migrating from Liquibase or raw SQL scripts**:

1. Read the overview to understand Flyway philosophy
2. Jump to intermediate examples (31-55) - See how Flyway differs from alternatives
3. Reference beginner for Flyway-specific naming and configuration as needed
4. Use advanced for production deployment patterns

**For quick reference**:

- Use example numbers as reference (e.g., "See Example 10 for schema history")
- Search for specific patterns (Ctrl+F for "uuid", "cascade", "repeatable", etc.)
- Copy-paste SQL migration files as starting points

### Coverage Progression

As you progress through examples, you will achieve cumulative coverage:

- **After Beginner** (Example 30): 40% - Can manage basic schema with versioned migrations
- **After Intermediate** (Example 55): 75% - Can handle most production migration scenarios
- **After Advanced** (Example 80): 95% - Expert-level Flyway mastery for production systems

## Code Annotation Philosophy

Every example uses **educational annotations** to show exactly what happens:

```sql
-- V3__add_index.sql
CREATE INDEX idx_users_email   -- => Creates B-tree index on users.email
  ON users (email);            -- => Flyway runs this once; records in flyway_schema_history
                               -- => Speeds up: WHERE email = '...' queries
```

```kotlin
val flyway = Flyway.configure()          // => FlywayConfiguration builder (fluent API)
  .dataSource(jdbcUrl, user, password)   // => Configures JDBC DataSource connection pool
  .locations("classpath:db/migration")   // => Scans this classpath path for migration files
  .load()                                // => Validates config, creates Flyway instance
flyway.migrate()                         // => Executes all pending versioned migrations
                                         // => Returns MigrateResult with count of applied migrations
```

Annotations show:

- **SQL DDL effects** - what the statement creates, alters, or drops
- **Flyway API semantics** - what each method call configures or triggers
- **Schema history records** - what Flyway writes to `flyway_schema_history`
- **Error conditions** - when and why Flyway throws exceptions
- **Production implications** - performance, locking, rollback behavior

## Quality Standards

Every example in this tutorial meets these standards:

- **Self-contained**: Copy-paste-runnable within its context
- **Annotated**: Every significant line has an inline comment
- **Accurate**: All SQL tested against PostgreSQL 16; all Flyway API calls verified against Flyway 11.x
- **Production-relevant**: Real-world patterns from actual Ktor applications
- **Accessible**: Color-blind friendly diagrams, clear structure

## Next Steps

Ready to start? Choose your path:

- **New to Flyway**: Start with [Beginner Examples (1-30)](/en/learn/software-engineering/data/tools/kotlin-flyway/by-example/beginner)
