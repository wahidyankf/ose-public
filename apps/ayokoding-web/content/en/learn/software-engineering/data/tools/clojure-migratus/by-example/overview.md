---
title: "Overview"
date: 2026-03-27T00:00:00+07:00
draft: false
weight: 10000000
description: "Learn Clojure Migratus through annotated code examples covering database migration patterns - ideal for experienced developers building production Clojure applications"
tags: ["clojure-migratus", "tutorial", "by-example", "examples", "code-first", "migratus", "database", "migrations"]
---

## What is Clojure Migratus By Example?

**Clojure Migratus By Example** is a code-first tutorial series teaching experienced Clojure developers how to manage database schema evolution using Migratus. Through heavily annotated, self-contained examples, you will achieve 40% coverage of Migratus patterns at the beginner level—from configuration and SQL migration files to running, rolling back, and inspecting pending migrations.

This tutorial assumes you are an experienced developer familiar with Clojure, deps.edn, next.jdbc, and relational databases. If you are new to Clojure, start with foundational Clojure tutorials first.

## Why By Example?

**Philosophy**: Show the code first, run it second, understand through direct interaction.

Traditional tutorials explain concepts then show code. By-example tutorials reverse this: every example is a working, runnable code snippet with inline annotations showing exactly what happens at each step—config maps, SQL file contents, migration states, and REPL output.

**Target Audience**: Experienced developers who:

- Already know Clojure fundamentals (namespaces, maps, deps.edn)
- Understand relational databases and SQL DDL
- Prefer learning through working code rather than narrative explanations
- Want comprehensive reference material covering production migration patterns

**Not For**: Developers new to Clojure or SQL. This tutorial moves quickly and assumes foundational knowledge.

## What Does Coverage Mean?

**Coverage** means the depth and breadth of Migratus features needed for production work, not toy examples.

### Included in Beginner Coverage (0-40%)

- **Configuration**: Config map structure, :store :database, :migration-dir, JDBC URIs
- **Migration Files**: Naming conventions, up/down SQL pairs, file placement
- **Core Operations**: migrate, up, down, create, pending-list
- **Common DDL Patterns**: CREATE TABLE, ADD COLUMN, ADD INDEX, foreign keys, constraints
- **Schema Tracking**: schema_migrations table structure and behavior
- **Data Seeding**: INSERT statements in migration files
- **Safety Guards**: IF NOT EXISTS, IF EXISTS, cascade behavior
- **deps.edn Integration**: Declaring the Migratus dependency

### Excluded from Beginner Coverage

- **Multiple Stores**: In-memory, filesystem stores (rarely used in production)
- **Custom Reporters**: Progress callbacks and custom logging hooks
- **Advanced Transactions**: Per-migration transaction control flags
- **Migration Scripting**: Clojure-based (non-SQL) migration files
- **Programmatic Discovery**: Dynamic migration directory resolution

## Tutorial Structure

### Examples Across One Level

**Beginner** (Examples 1-30): 0-40% coverage

- Configuration and file naming (Examples 1-5)
- Core API operations (Examples 6-10)
- Table and column DDL (Examples 11-16)
- Connection and type patterns (Examples 17-23)
- Structural patterns and safety (Examples 24-30)

## Five-Part Example Format

Every example follows a **mandatory five-part structure**:

### Part 1: Brief Explanation (2-3 sentences)

Answers what the concept is, why it matters in production code, and when to use it.

### Part 2: Mermaid Diagram (when appropriate)

Included when data flow or relationships are non-obvious. Uses the color-blind-friendly palette:

- Blue `#0173B2`, Orange `#DE8F05`, Teal `#029E73`, Purple `#CC78BC`, Brown `#CA9161`

### Part 3: Heavily Annotated Code

Every significant line has an inline comment. Clojure annotations use `; =>` notation. SQL annotations use `-- =>` notation.

```clojure
(def config
  {:store         :database         ; => Use the database store (SQL-based)
   :migration-dir "migrations"      ; => Relative to classpath root (resources/)
   :db            {:connection-uri uri}}) ; => next.jdbc-compatible JDBC URI map
```

### Part 4: Key Takeaway (1-2 sentences)

Distills the core insight and when to apply it in production.

### Part 5: Why It Matters (50-100 words)

Explains the production relevance, common pitfalls, and consequences of ignoring the pattern.

## Self-Containment Rules

Each example must be copy-paste-runnable within its chapter scope:

- Full config map or SQL file content shown
- No references to code outside the example
- Clojure REPL snippets include all required `require` calls
- SQL files shown in full (no ellipsis)

## Code Annotation Philosophy

Every example uses educational annotations to show exactly what happens:

```clojure
(migratus/migrate config)  ; => Runs all pending migrations in order
                           ; => Reads files from resources/migrations/
                           ; => SQL: SELECT id FROM schema_migrations
                           ; => Output: Migrating 001-create-users
```

Annotations show:

- **Config values** and what each key controls
- **File system effects** (which files are read/created)
- **SQL executed** by Migratus internally
- **Return values** and REPL output
- **Common gotchas** and sequencing constraints

## Quality Standards

Every example in this tutorial meets these standards:

- **Self-contained**: Copy-paste-runnable within chapter scope
- **Annotated**: Every significant line has an inline comment (1.0-2.25 ratio per example)
- **Production-relevant**: Real-world patterns based on actual Clojure project usage
- **Accessible**: Color-blind-friendly diagrams, clear structure

## Next Steps

Ready to start? Begin with [Beginner Examples (1-30)](/en/learn/software-engineering/data/tools/clojure-migratus/by-example/beginner) to learn Migratus from configuration through advanced DDL patterns.
