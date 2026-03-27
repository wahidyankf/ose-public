---
title: "Overview"
date: 2026-03-27T00:00:00+07:00
draft: false
weight: 10000000
description: "Learn Java Liquibase through 30+ annotated code examples covering database schema migration patterns - ideal for experienced developers shipping reliable schema changes to production"
tags:
  ["java-liquibase", "tutorial", "by-example", "examples", "code-first", "database-migration", "changelog", "changeset"]
---

## What is Java Liquibase By Example?

**Java Liquibase By Example** is a code-first tutorial series teaching experienced Java developers how to manage database schema migrations reliably using Liquibase. Through 30 heavily annotated, self-contained examples, you will achieve deep coverage of Liquibase patterns—from writing your first changeset to managing rollbacks, Spring Boot auto-configuration, Maven/Gradle plugin integration, and understanding internal tracking tables.

This tutorial assumes you are an experienced developer familiar with Java, relational databases, and SQL. If you are new to relational databases or SQL, start with foundational database tutorials first.

## Why By Example?

**Philosophy**: Show the migration first, run it second, understand through direct interaction.

Traditional tutorials explain concepts then show code. By-example tutorials reverse this: every example is a working, runnable snippet with inline annotations showing exactly what happens at each step—changeset execution order, SQL generated, rollback behavior, and tracking table updates.

**Target Audience**: Experienced developers who:

- Already know Java and SQL fundamentals
- Understand relational databases and schema design
- Prefer learning through working code rather than narrative explanations
- Want comprehensive reference material covering production-grade migration patterns

**Not For**: Developers new to databases or SQL. This tutorial moves quickly and assumes foundational knowledge.

## What Does This Tutorial Cover?

**Beginner (Examples 1-30)** covers database migration fundamentals needed for production work with real teams and CI/CD pipelines.

### Included in Beginner Coverage

- **Changelog Formats**: YAML, XML, and SQL-formatted changelogs; master changelog with include/includeAll
- **Core Change Types**: createTable, addColumn, dropColumn, createIndex, addForeignKeyConstraint
- **Constraint Management**: addNotNullConstraint, addUniqueConstraint, addDefaultValue
- **Schema Evolution**: modifyDataType, renameColumn, renameTable
- **Rollbacks**: rollbackCount, rollbackToTag, SQL rollback blocks, tag command
- **Operational Commands**: update, status, tag, generateChangeLog
- **Build Integration**: Spring Boot auto-configuration, Maven plugin, Gradle plugin
- **Internal Tables**: DATABASECHANGELOG and DATABASECHANGELOGLOCK structure and behavior

### Excluded from Beginner Coverage

- **Advanced Diffing**: generateChangeLog from existing schema, diff between databases
- **Custom Extensions**: Writing custom Change and Precondition classes
- **Complex Contexts and Labels**: Multi-environment conditional execution
- **Liquibase Hub and Pro Features**: Remote change tracking, drift detection
- **Database-Specific Change Types**: Vendor extensions beyond standard SQL

## Tutorial Structure

### 30 Examples in One Level

**Sequential numbering**: Examples 1-30 (unified reference system)

**Distribution**:

- **Changelog Basics** (Examples 1-5): Master changelog, SQL formatted changeset, author/ID conventions, createTable, addColumn
- **Schema Changes** (Examples 6-13): dropColumn, createIndex, addForeignKeyConstraint, running update, rollbackCount, rollbackToTag, tag command, status command
- **Changelog Formats** (Examples 14-17): XML, YAML, SQL formatted, include/includeAll
- **Constraint and Type Changes** (Examples 18-23): addNotNullConstraint, addUniqueConstraint, modifyDataType, renameColumn, renameTable, addDefaultValue
- **Build Tool Integration** (Examples 24-26): Spring Boot auto-config, Maven plugin, Gradle plugin
- **Structural Patterns** (Examples 27-30): Multiple changesets per file, rollback SQL blocks, DATABASECHANGELOG table, DATABASECHANGELOGLOCK table

## Five-Part Example Format

Every example follows a **mandatory five-part structure**:

### Part 1: Brief Explanation (2-3 sentences)

Answers what this concept is, why it matters in production, and when to use it.

### Part 2: Mermaid Diagram (when appropriate)

Included for examples where execution flow, table relationships, or command sequences benefit from visualization. Skipped for straightforward single-operation examples.

**Diagram requirements**:

- Color-blind friendly palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
- Vertical orientation (mobile-first)
- Clear labels on all nodes and edges
- Comment syntax: `%%` (NOT `%%{ }%%`)

### Part 3: Heavily Annotated Code

**Core requirement**: Every significant line has an inline comment showing what happens.

**Comment annotation notation**:

- `-- =>` for SQL files
- `# =>` for YAML files
- `<!-- => -->` for XML files (inline comment approximation shown as `<!-- ... -->`)

```sql
-- liquibase formatted sql
-- changeset author:001-create-products dbms:postgresql
-- => Header declares this file as Liquibase-managed SQL
-- => changeset id "001-create-products" with author "author" runs exactly once
-- => dbms:postgresql restricts execution to PostgreSQL only

CREATE TABLE products (
    id   UUID NOT NULL DEFAULT gen_random_uuid(),
    -- => gen_random_uuid() generates a v4 UUID; requires pgcrypto or PostgreSQL 13+
    name VARCHAR(255) NOT NULL
    -- => NOT NULL enforced at database level; Liquibase does not add application-level validation
);
-- rollback DROP TABLE products;
-- => rollback block tells Liquibase how to undo this changeset
-- => executed when running liquibase rollback or rollbackCount
```

### Part 4: Key Takeaway (1-2 sentences)

Distills the core insight—the most important pattern and when to apply it in production.

### Part 5: Why It Matters (50-100 words)

Explains production relevance, common pitfalls, and real-world impact of the concept.

## Self-Containment Rules

Every example is self-contained and runnable given a Liquibase installation and a running PostgreSQL database. Examples reference only standard Liquibase change types and core SQL. Examples do not depend on code from other examples.

## Code Annotation Philosophy

Every example uses **educational annotations** to show exactly what happens:

```yaml
databaseChangeLog: # => Root key for YAML changelog format
  - includeAll: # => Scans a directory and includes all changelog files found
      path: db/changelog/changes/
      # => path is relative to the classpath root (src/main/resources/)
      # => files are sorted alphabetically and executed in order
      # => use numeric prefixes (001-, 002-) to control execution order
```

Annotations show:

- **Command execution semantics**: What Liquibase does at each step
- **Database side effects**: Tables created, columns added, constraints applied
- **SQL generated**: What DDL Liquibase executes behind the scenes
- **Tracking table updates**: When DATABASECHANGELOG rows are inserted
- **Rollback behavior**: What happens on undo
- **Common gotchas**: Idempotency, ordering, lock contention

## Quality Standards

Every example in this tutorial meets these standards:

- **Self-contained**: Runnable with a Liquibase installation and PostgreSQL
- **Annotated**: Every significant line has an inline comment
- **Production-relevant**: Real-world migration patterns matching actual project usage
- **Accessible**: Color-blind friendly diagrams, clear structure

## Next Steps

Ready to start?

- **New to Liquibase**: Start with [Beginner Examples (1-30)](/en/learn/software-engineering/data/tools/java-liquibase/by-example/beginner)
