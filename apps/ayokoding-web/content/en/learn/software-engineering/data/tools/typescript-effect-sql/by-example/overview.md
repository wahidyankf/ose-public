---
title: "Overview"
date: 2026-03-27T00:00:00+07:00
draft: false
weight: 10000000
description: "Learn TypeScript Effect SQL through 80 annotated code examples covering 95% of the library - ideal for experienced developers building production database migration layers"
tags:
  [
    "typescript",
    "effect",
    "effect-sql",
    "tutorial",
    "by-example",
    "database",
    "migrations",
    "pg",
    "sqlite",
    "code-first",
  ]
---

## What is TypeScript Effect SQL By Example?

**TypeScript Effect SQL By Example** is a code-first tutorial series teaching experienced TypeScript developers how to write database migrations using `@effect/sql`, `@effect/sql-pg`, and `@effect/sql-sqlite-node`. Through 80 heavily annotated, self-contained examples, you will achieve 95% coverage of Effect SQL migration patterns—from basic table creation to advanced constraint design, multi-statement migrations, and effect-aware error handling.

This tutorial assumes you are an experienced developer familiar with TypeScript, the Effect library's `Effect.gen` pattern, and relational databases. If you are new to Effect, start with the Effect fundamentals tutorials first.

## Why By Example?

**Philosophy**: Show the code first, run it second, understand through direct interaction.

Traditional tutorials explain concepts then show code. By-example tutorials reverse this: every example is a working, annotated code snippet with inline comments showing exactly what happens at each step—SQL executed, Effect service resolution, migration registry patterns, and common pitfalls.

**Target Audience**: Experienced developers who:

- Already know TypeScript and the Effect ecosystem
- Understand relational databases and SQL DDL
- Prefer learning through working code rather than narrative explanations
- Want comprehensive reference material covering 95% of production migration patterns

**Not For**: Developers new to TypeScript or the Effect library. This tutorial moves quickly and assumes foundational knowledge of both.

## What Does 95% Coverage Mean?

**95% coverage** means depth and breadth of Effect SQL migration features needed for production work, not toy examples.

### Included in 95% Coverage

- **Migration Structure**: `Effect.gen` pattern, `SqlClient` service, SQL template literals
- **Registry Patterns**: `index.ts` exports, `fromRecord`, `fromFileSystem` loaders
- **Migration Runner**: `PgMigrator`, `SqliteMigrator`, `Layer.build`, `effect_sql_migrations` table
- **Table DDL**: CREATE TABLE, ALTER TABLE, DROP TABLE, IF NOT EXISTS guards
- **Column Types**: UUID, VARCHAR, INTEGER, DECIMAL, BOOLEAN, DATE, TIMESTAMPTZ, BYTEA, TEXT
- **Constraints**: PRIMARY KEY, NOT NULL, DEFAULT, UNIQUE, CHECK, FOREIGN KEY, CASCADE
- **Indexes**: Single-column, composite, partial, covering indexes
- **Associations**: Foreign keys, junction tables, many-to-many relationships
- **Client Setup**: `PgClient.layer`, `SqliteClient.layer`, connection configuration
- **Error Handling**: Effect error channels, `catchAll`, `mapError`, migration failure recovery
- **Advanced Patterns**: Enum types via SQL, seed data, conditional DDL, idempotent migrations

### Excluded from 95% (the remaining 5%)

- **Adapter Internals**: Connection pool mechanics, prepared statement caching internals
- **Rare Edge Cases**: Obscure PostgreSQL-specific feature combinations not used in typical production code
- **Legacy Patterns**: Deprecated Effect v2 migration approaches
- **Advanced Database**: Exotic PostgreSQL extensions (PostGIS, TimescaleDB-specific DDL)

## Tutorial Structure

### 80 Examples Across Three Levels

**Sequential numbering**: Examples 1-80 (unified reference system)

**Distribution**:

- **Beginner** (Examples 1-30): 0-40% coverage - Basic migrations, table creation, indexes, constraints, client setup
- **Intermediate** (Examples 31-60): 40-75% coverage - ALTER TABLE, complex constraints, transactions, multi-statement migrations
- **Advanced** (Examples 61-80): 75-95% coverage - Dynamic migrations, custom error handling, testing patterns, performance

## Five-Part Example Format

Every example follows a **mandatory five-part structure**:

### Part 1: Brief Explanation (2-3 sentences)

Answers what this concept or pattern is, why it matters in production code, and when you should use it.

### Part 2: Mermaid Diagram (when appropriate)

Included when data flow between the migrator and database is non-obvious, or when the migration lifecycle has multiple stages worth visualizing.

**Diagram requirements**:

- Use color-blind friendly palette: Blue `#0173B2`, Orange `#DE8F05`, Teal `#029E73`, Purple `#CC78BC`, Brown `#CA9161`
- Vertical orientation (mobile-first)
- Comment syntax: `%%` (NOT `%%{ }%%`)

### Part 3: Heavily Annotated Code

**Core requirement**: Every significant line must have an inline comment using `// =>` notation for TypeScript and `-- =>` for SQL.

```typescript
// => Resolves SqlClient from the Effect context
const sql = yield * SqlClient.SqlClient;

// => Executes the SQL template literal as a single statement
yield *
  sql`
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid()
    -- => UUID column; gen_random_uuid() requires pgcrypto or PostgreSQL 13+
  )
`;
```

### Part 4: Key Takeaway (1-2 sentences)

Distills the core insight to its essence and highlights when to apply this in production.

### Part 5: Why It Matters (50-100 words)

Explains the production context: what breaks without this pattern, what alternatives exist, and why Effect SQL's approach differs from other migration tools.

## Self-Containment Rules

**Critical requirement**: Examples must be copy-paste-runnable within their chapter scope.

Every beginner example is completely standalone with full imports, complete migration functions, and no references to previous examples.

## How to Use This Tutorial

### Prerequisites

Before starting, ensure you have:

- Node.js 20+ with TypeScript 5+
- `@effect/sql`, `@effect/sql-pg` or `@effect/sql-sqlite-node` installed
- PostgreSQL 15+ or SQLite running
- Basic Effect library knowledge (`Effect.gen`, `Layer`, service pattern)
- Basic SQL knowledge (DDL statements, relational concepts)

### Learning Path

**For experienced TypeScript developers new to Effect SQL**:

1. Skim beginner examples (1-30) — review fundamentals quickly
2. Deep dive intermediate (31-60) — master production patterns
3. Reference advanced (61-80) — learn optimization and edge cases

**For developers switching from other migration tools** (Flyway, Liquibase, Knex, Drizzle):

1. Read overview to understand Effect SQL philosophy
2. Jump to Example 13 — see how `Layer.build` differs from CLI-driven migrations
3. Reference beginner for Effect SQL-specific syntax as needed

**For quick reference**:

- Use example numbers as reference (e.g., "See Example 13 for Layer.build")
- Search for specific patterns (Ctrl+F for "CASCADE", "composite index", etc.)
- Copy-paste examples as starting points for your own migrations

### Coverage Progression

As you progress through examples, you achieve cumulative coverage:

- **After Beginner** (Example 30): 40% — Can write all standard table creation migrations
- **After Intermediate** (Example 60): 75% — Can handle most production migration scenarios
- **After Advanced** (Example 80): 95% — Expert-level Effect SQL migration mastery

## Next Steps

Ready to start? Choose your path:

- **New to Effect SQL**: Start with [Beginner Examples (1-30)](/en/learn/software-engineering/data/tools/typescript-effect-sql/by-example/beginner)
