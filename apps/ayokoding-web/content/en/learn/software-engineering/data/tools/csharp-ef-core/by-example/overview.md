---
title: "Overview"
date: 2026-03-27T00:00:00+07:00
draft: false
weight: 10000000
description: "Learn C# EF Core Migrations through 30 annotated code examples covering 95% of migration patterns - ideal for experienced developers building production database schemas"
tags: ["csharp", "ef-core", "entity-framework", "migrations", "tutorial", "by-example", "database", "code-first"]
---

## What is C# EF Core Migrations By Example?

**C# EF Core Migrations By Example** is a code-first tutorial series teaching experienced .NET developers how to manage database schema evolution using Entity Framework Core Migrations. Through 30 heavily annotated, self-contained examples, you will achieve 95% coverage of EF Core migration patterns—from basic DbContext setup to idempotent script generation and production startup migrations.

This tutorial assumes you are an experienced developer familiar with C#, .NET, and relational databases. If you are new to C# or EF Core, start with foundational .NET tutorials first.

## Why By Example?

**Philosophy**: Show the code first, run it second, understand through direct interaction.

Traditional tutorials explain concepts then show code. By-example tutorials reverse this: every example is a working, runnable code snippet with inline annotations showing exactly what happens at each step—migration class structure, generated SQL, CLI command output, and common pitfalls.

**Target Audience**: Experienced developers who:

- Already know C# and .NET fundamentals
- Understand relational databases and SQL
- Prefer learning through working code rather than narrative explanations
- Want comprehensive reference material covering 95% of production migration patterns

**Not For**: Developers new to C# or databases. This tutorial moves quickly and assumes foundational knowledge.

## What Does 95% Coverage Mean?

**95% coverage** means the depth and breadth of EF Core migration features needed for production work, not toy examples.

### Included in 95% Coverage

- **DbContext Setup**: DbContext class, DbSet properties, OnModelCreating configuration
- **Migration Lifecycle**: Creating, applying, reverting, and removing migrations
- **MigrationBuilder Operations**: CreateTable, AddColumn, DropColumn, CreateIndex, AddForeignKey
- **CLI Tooling**: `dotnet ef migrations add`, `dotnet ef database update`, `dotnet ef migrations list`
- **History Tracking**: `__EFMigrationsHistory` table, migration snapshot, Designer.cs metadata
- **Schema Constraints**: Unique constraints, NOT NULL with defaults, CHECK constraints
- **Column Types**: UUID primary keys, timestamp columns, enum storage, precision types
- **Relationships**: Foreign keys, cascade delete, composite indexes, junction tables
- **Seed Data**: HasData seeding, idempotent data setup
- **Advanced Operations**: Column rename patterns, multiple tables per migration, SQL scripts
- **Production Patterns**: Idempotent scripts, ASP.NET Core startup migration application

### Excluded from 95% (the remaining 5%)

- **EF Core Internals**: Provider adapter implementation, connection pool mechanics
- **Rare Edge Cases**: Obscure feature combinations not used in typical production code
- **Database-Specific**: Vendor-specific SQL fragments outside standard EF Core patterns
- **Legacy Features**: Deprecated APIs from EF Core 1.x or 2.x
- **Custom Migration Operations**: Writing custom IMigrationsSqlGenerator implementations

## Tutorial Structure

### 30 Examples in One Beginner Level

**Sequential numbering**: Examples 1-30 (unified reference system)

**Distribution**:

- **Beginner** (Examples 1-30): 0-40% coverage — DbContext setup, migration basics, schema operations, CLI tooling, production patterns

**Rationale**: EF Core Migrations is a focused tool. Thirty examples provide granular progression from initial setup to production-ready SQL generation without overwhelming maintenance burden.

## Five-Part Example Format

Every example follows a **mandatory five-part structure**:

### Part 1: Brief Explanation (2-3 sentences)

**Answers**:

- What is this concept or pattern?
- Why does it matter in production code?
- When should you use it?

### Part 2: Mermaid Diagram (when appropriate)

**Included when** (~40% of examples):

- Migration lifecycle has multiple stages
- Relationships between files need visualization
- CLI command flow is non-obvious
- Database schema relationships require illustration

**Skipped when**:

- Simple single-operation commands
- Straightforward column type changes
- Trivial additive migrations

**Diagram requirements**:

- Use color-blind friendly palette: Blue `#0173B2`, Orange `#DE8F05`, Teal `#029E73`, Purple `#CC78BC`, Brown `#CA9161`
- Vertical orientation (mobile-first)
- Clear labels on all nodes and edges
- Comment syntax: `%%` (NOT `%%{ }%%`)

### Part 3: Heavily Annotated Code

**Core requirement**: Every significant line must have an inline comment.

**Comment annotations use `// =>` notation for C# and `-- =>` for SQL**:

```csharp
migrationBuilder.CreateTable(        // => Generates CREATE TABLE SQL statement
    name: "users",                   // => Table name in the database
    columns: table => new            // => Lambda defines column set
    {
        id = table.Column<Guid>(     // => Column named "id" of type uuid
            type: "uuid",            // => => Maps to PostgreSQL UUID type
            nullable: false),        // => => NOT NULL constraint applied
    },
    constraints: table =>            // => Lambda defines table-level constraints
    {
        table.PrimaryKey(            // => Adds PRIMARY KEY constraint
            "pk_users", x => x.id); // => => Constraint name and key column
    });
```

**Required annotations**:

- **Migration builder calls**: Document what SQL each method generates
- **Column configurations**: Show resulting SQL column definitions
- **CLI commands**: Show expected terminal output
- **File paths**: Note where generated files appear on disk
- **Side effects**: Document database changes, snapshot updates

### Part 4: Key Takeaway (1-2 sentences)

**Purpose**: Distill the core insight to its essence.

### Part 5: Why It Matters (50-100 words)

**Purpose**: Connect the pattern to real production consequences.

## Self-Containment Rules

**Critical requirement**: Examples must be copy-paste-runnable within their chapter scope.

### Beginner Level Self-Containment

**Rule**: Each example is completely standalone.

**Requirements**:

- Full class definitions with namespaces
- All necessary using statements
- Helper types defined in-place when needed
- No references to previous examples
- Runnable with `dotnet ef` CLI

**Golden rule**: If you delete all other examples, this example should still execute.

## How to Use This Tutorial

### Prerequisites

Before starting, ensure you have:

- .NET 8+ SDK installed
- `dotnet-ef` global tool installed (`dotnet tool install --global dotnet-ef`)
- PostgreSQL (or your preferred database) running
- Basic C# and .NET knowledge
- Basic SQL and relational database knowledge

### Running Examples

All CLI examples assume a project with EF Core configured:

```bash
# Install EF Core global tool
dotnet tool install --global dotnet-ef

# Create a migration
dotnet ef migrations add InitialCreate

# Apply migrations to database
dotnet ef database update

# Generate SQL script
dotnet ef migrations script --output migration.sql
```

### Learning Path

**For experienced .NET developers new to EF Core Migrations**:

1. Work through all 30 examples sequentially
2. Run each CLI command in a test project
3. Inspect generated migration files alongside examples

**For quick reference**:

- Use example numbers as reference (e.g., "See Example 9 for applying migrations")
- Search for specific patterns (Ctrl+F for "cascade", "unique", "HasData")
- Copy-paste examples as starting points for your migrations

### Coverage Progression

- **After Example 15** (40% coverage): Can create and apply basic migrations
- **After Example 25** (70% coverage): Can handle most production schema operations
- **After Example 30** (95% coverage): Expert-level EF Core migration mastery

## Code Annotation Philosophy

Every example uses **educational annotations** to show exactly what happens:

```csharp
// Migration class declaration
public partial class InitialCreate : Migration  // => Partial class allows Designer.cs metadata
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {                                           // => Up() runs on dotnet ef database update
        migrationBuilder.CreateTable(           // => Generates CREATE TABLE statement
            name: "products",                   // => => Table name: products
            columns: table => new               // => => Column definitions
            {
                id = table.Column<int>(         // => Column: id INTEGER
                    nullable: false),            // => => NOT NULL constraint
            });
    }
}
```

Annotations show:

- **Generated SQL** for each MigrationBuilder call
- **CLI output** from `dotnet ef` commands
- **File system effects** (files created, modified, or deleted)
- **Database side effects** (schema changes, constraint creation)
- **Common pitfalls** and edge cases

## Quality Standards

Every example in this tutorial meets these standards:

- **Self-contained**: Copy-paste-runnable within chapter scope
- **Annotated**: Every significant line has an inline comment
- **Tested**: All code examples verified against real EF Core behavior
- **Production-relevant**: Real-world patterns, not toy examples
- **Accessible**: Color-blind friendly diagrams, clear structure

## Next Steps

Ready to start? Begin with [Beginner Examples (1-30)](/en/learn/software-engineering/data/tools/csharp-ef-core/by-example/beginner).

## Feedback and Contributions

Found an issue? Have a suggestion? This tutorial is part of the ayokoding-web learning platform. Check the repository for contribution guidelines.
