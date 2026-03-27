---
title: "Overview"
date: 2026-03-27T00:00:00+07:00
draft: false
weight: 10000000
description: "Learn Python Alembic through 30 annotated code examples covering 95% of migration patterns - ideal for experienced developers managing database schema evolution"
tags:
  [
    "python-alembic",
    "tutorial",
    "by-example",
    "examples",
    "code-first",
    "alembic",
    "database",
    "migrations",
    "sqlalchemy",
  ]
---

## What is Python Alembic By Example?

**Python Alembic By Example** is a code-first tutorial series teaching experienced developers how to manage database schema evolution using Alembic, the industry-standard migration tool for SQLAlchemy-based Python applications. Through 30 heavily annotated, self-contained examples, you will achieve 95% coverage of Alembic patterns—from basic initialization and revision creation to autogenerate, advanced column types, and data migrations.

This tutorial assumes you are an experienced developer familiar with Python, SQLAlchemy, and relational databases. If you are new to SQLAlchemy, study that first before working through these examples.

## Why By Example?

**Philosophy**: Show the code first, run it second, understand through direct interaction.

Traditional tutorials explain concepts then show code. By-example tutorials reverse this: every example is a working, runnable code snippet with inline annotations showing exactly what happens at each step—migration file structure, SQL statements emitted, version table state, and common pitfalls.

**Target Audience**: Experienced developers who:

- Already know Python fundamentals and SQLAlchemy models
- Understand relational databases and SQL DDL statements
- Prefer learning through working code rather than narrative explanations
- Want comprehensive reference material covering 95% of production migration patterns

**Not For**: Developers new to Python or databases. This tutorial moves quickly and assumes foundational knowledge.

## What Does 95% Coverage Mean?

**95% coverage** means the depth and breadth of Alembic features needed for production work, not toy examples.

### Included in 95% Coverage

- **Initialization**: `alembic init`, alembic.ini configuration, env.py structure
- **Revision Management**: Creating revisions, upgrade/downgrade functions, revision messages, dependencies
- **Table Operations**: create_table, drop_table with full column definitions
- **Column Operations**: add_column, drop_column, alter_column with nullable/default changes
- **Constraint Operations**: create_index, drop_index, create_unique_constraint, create_check_constraint, create_foreign_key
- **CLI Commands**: upgrade head, downgrade -1, current, history, show
- **Autogenerate**: SQLAlchemy metadata integration, `--autogenerate` flag, detecting schema drift
- **Advanced Column Types**: UUID, timestamp with defaults, Enum, Numeric
- **Data Migrations**: op.bulk_insert, op.execute for seed data
- **Complex Migrations**: Multiple operations per revision, composite indexes, junction tables
- **Version Tracking**: alembic_version table structure, base and head concepts

### Excluded from 95% (the remaining 5%)

- **Adapter Internals**: Alembic autogenerate comparator plugin development
- **Rare Edge Cases**: Multi-database setups with branch merging
- **Legacy Patterns**: Alembic 0.x API differences
- **Non-PostgreSQL Specifics**: MySQL/SQLite dialect edge cases not applicable to PostgreSQL

## Tutorial Structure

### 30 Examples Across One Level

**Distribution**:

- **Beginner** (Examples 1-30): 0-100% coverage — initialization, CLI commands, revision structure, all core operations, autogenerate, advanced types, data migrations

**Rationale**: Alembic is a focused tool with a well-defined surface area. 30 examples provide complete coverage without artificial distribution across multiple files.

## Four-Part Example Format

Every example follows a **mandatory five-part structure**:

### Part 1: Brief Explanation (2-3 sentences)

**Answers**:

- What is this concept/pattern?
- Why does it matter in production migrations?
- When should you use it?

### Part 2: Mermaid Diagram (when appropriate)

**Included when** (~30% of examples):

- The relationship between files or concepts is non-obvious
- Migration execution flow has multiple stages
- Version chain structure requires visualization

**Skipped when**:

- Simple single-operation migrations with clear linear flow
- CLI commands with obvious outputs
- Isolated column operations

**Diagram requirements**:

- Use color-blind friendly palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
- Vertical orientation (mobile-first)
- Clear labels on all nodes and edges
- Comment syntax: `%%` (NOT `%%{ }%%`)

### Part 3: Heavily Annotated Code

**Core requirement**: Every significant line must have an inline comment.

**Comment annotations use `# =>` notation for Python and `-- =>` for SQL**:

```python
revision: str = "abc123"           # => revision ID; unique identifier for this migration
down_revision: str | None = None   # => parent revision; None means this is the first migration
                                   # => forms a linked list: current -> parent -> ... -> None
```

**Required annotations**:

- **Variable states**: Show values and what they represent
- **SQL executed**: Document what DDL statement Alembic emits
- **Side effects**: Document database mutations and version table changes
- **Expected outputs**: Show CLI output with `# => Output:` prefix
- **Error cases**: Document when errors occur and how to handle them

### Part 4: Key Takeaway (1-2 sentences)

**Purpose**: Distill the core insight to its essence.

**Must highlight**:

- The most important pattern or concept
- When to apply this in production
- Common pitfalls to avoid

### Part 5: Why It Matters (50-100 words)

**Purpose**: Production context explaining real consequences of understanding or misunderstanding this example.

## Self-Containment Rules

**Critical requirement**: Examples must be copy-paste-runnable within their scope.

**Requirements**:

- Full file content shown (not snippets)
- All necessary imports included
- No references to previous examples for required context
- CLI commands shown in full with expected output

## How to Use This Tutorial

### Prerequisites

Before starting, ensure you have:

- Python 3.11+ installed
- PostgreSQL (or another supported database) running
- Basic Python knowledge (modules, functions, type hints)
- Basic SQLAlchemy knowledge (declarative models, Column types)
- Basic database knowledge (SQL DDL, relational concepts)

### Running Examples

All migration examples assume a standard Alembic project structure:

```bash
# Install Alembic and SQLAlchemy
pip install alembic sqlalchemy psycopg2-binary

# Initialize a new project (Example 1)
alembic init alembic

# Run migrations
alembic upgrade head

# Check current version
alembic current
```

### Learning Path

**For Python developers new to Alembic**:

1. Work through Examples 1-15 to understand initialization, revision structure, and basic CLI commands
2. Study Examples 16-25 to master SQLAlchemy integration and advanced column types
3. Complete Examples 26-30 for data migrations and complex real-world patterns

**For developers migrating from another tool** (Flyway, Liquibase, Django migrations):

1. Read Example 1-3 to understand Alembic's file layout
2. Jump to Example 11-14 for CLI command equivalents
3. Study Example 17 for the autogenerate workflow unique to Alembic

**For quick reference**:

- Use example numbers as reference (e.g., "See Example 22 for UUID columns")
- Search for specific patterns (Ctrl+F for "autogenerate", "create_foreign_key", etc.)
- Copy-paste examples as starting points for your revision files

### Coverage Progression

As you progress through examples, you will achieve cumulative coverage:

- **After Example 15**: 50% — Can initialize Alembic, create revisions, run basic DDL operations, and use the CLI
- **After Example 25**: 80% — Can handle autogenerate, advanced column types, constraints, and real-world schemas
- **After Example 30**: 95% — Expert-level Alembic mastery for production use

## Code Annotation Philosophy

Every example uses **educational annotations** to show exactly what happens:

```python
# Migration header
revision: str = "001"              # => this revision's unique ID
down_revision: str | None = None   # => no parent: this is the base migration

def upgrade() -> None:
    op.create_table(               # => emits CREATE TABLE DDL
        "users",                   # => table name in database
        sa.Column("id", sa.Integer, primary_key=True),
        # => id INTEGER PRIMARY KEY
        sa.Column("name", sa.String(100), nullable=False),
        # => name VARCHAR(100) NOT NULL
    )
    # => alembic_version row updated: rev = "001"
```

Annotations show:

- **Variable states** after operations
- **SQL statements** emitted by Alembic
- **Version table changes** after upgrade/downgrade
- **Return values** and their types
- **Common gotchas** and edge cases

## Quality Standards

Every example in this tutorial meets these standards:

- **Self-contained**: Copy-paste-runnable within chapter scope
- **Annotated**: Every significant line has an inline comment
- **Production-relevant**: Real-world patterns, not toy examples
- **Accessible**: Color-blind friendly diagrams, clear structure

## Next Steps

Ready to start? Begin with [Beginner Examples (1-30)](/en/learn/software-engineering/data/tools/python-alembic/by-example/beginner) to build complete Alembic mastery.
