---
title: "Intermediate"
date: 2026-03-27T00:00:00+07:00
draft: false
weight: 10000002
description: "Python Alembic intermediate tutorial with 30 annotated examples covering autogenerate, batch operations, branching, offline mode, data migrations, and testing patterns (40-75% coverage)"
tags:
  [
    "python-alembic",
    "tutorial",
    "by-example",
    "intermediate",
    "autogenerate",
    "batch-operations",
    "branching",
    "testing",
  ]
---

## Intermediate Examples (31-60)

**Coverage**: 40-75% of Alembic functionality

**Focus**: Autogenerate, batch operations, branching strategies, offline SQL generation, environment-specific config, custom templates, advanced column types, database objects (views, triggers, procedures), and testing patterns.

These examples assume you understand beginner concepts (initialization, basic DDL, revision structure, CLI commands). All examples are self-contained and show exact file content or CLI invocations you would use.

---

### Example 31: Autogenerate with --autogenerate

`alembic revision --autogenerate` compares your SQLAlchemy `Base.metadata` against the live database schema and generates a migration that reconciles the differences. It is the most productive workflow for schema-first development.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
%% Autogenerate diff flow
graph LR
    A[SQLAlchemy Models] -->|Base.metadata| B[Autogenerate Differ]
    C[Live Database] -->|INFORMATION_SCHEMA| B
    B -->|computes diff| D[Generated upgrade/downgrade]

    style A fill:#0173B2,stroke:#000000,color:#ffffff,stroke-width:2px
    style C fill:#DE8F05,stroke:#000000,color:#ffffff,stroke-width:2px
    style B fill:#029E73,stroke:#000000,color:#ffffff,stroke-width:2px
    style D fill:#CC78BC,stroke:#000000,color:#ffffff,stroke-width:2px
```

**env.py prerequisite — wire target_metadata**:

```python
# alembic/env.py (relevant excerpt)

from myapp.models import Base          # => import your declarative Base
# => Base.metadata contains every Table object created by @mapped_class or Table()

target_metadata = Base.metadata
# => assign to module-level variable; Alembic reads this in configure()
# => if left as None, autogenerate cannot detect model changes
```

**Run autogenerate**:

```bash
# Run from project root; DATABASE_URL must point to the target database
alembic revision --autogenerate -m "add_products_table"
# => connects to the database specified by sqlalchemy.url / DATABASE_URL
# => loads Base.metadata from env.py
# => diffs metadata vs database; finds new "products" table in models
# => generates alembic/versions/<rev>_add_products_table.py
# => upgrade() contains op.create_table("products", ...)
# => downgrade() contains op.drop_table("products")
# => you MUST review and edit the generated file before applying it
```

**Key Takeaway**: Always set `target_metadata = Base.metadata` in `env.py` and review generated migrations before running `alembic upgrade head`; autogenerate misses some constructs (see Example 32).

**Why It Matters**: Manually writing `op.create_table` for large schemas is error-prone and slow. Autogenerate eliminates 80% of the boilerplate by detecting added tables, dropped columns, and type changes automatically. The review step is not optional — autogenerate can produce destructive operations (e.g., dropping a column that was renamed instead of altered) that look correct but lose data.

---

### Example 32: Autogenerate Limitations and Manual Fixes

Autogenerate detects tables, columns, and indexes but cannot detect views, stored procedures, triggers, or certain constraint changes. Understanding the gaps prevents silent schema drift.

**What autogenerate CAN detect automatically**:

```python
# alembic/versions/<rev>_autogenerate_can_detect.py (upgrade excerpt)

# => Alembic detects: new table added to Base.metadata
op.create_table(
    "orders",
    sa.Column("id", sa.Integer, primary_key=True),  # => new table: fully generated
    sa.Column("total", sa.Numeric(10, 2), nullable=False),  # => new column: generated
)

# => Alembic detects: column added to existing table
op.add_column("users", sa.Column("phone", sa.String(20), nullable=True))
# => nullable=True is required for adding a column to a table with existing rows

# => Alembic detects: unique index added via UniqueConstraint or index=True
op.create_index(op.f("ix_orders_ref"), "orders", ["ref_number"], unique=True)
# => op.f() renders the correct dialect-specific index name
```

**What autogenerate CANNOT detect — add manually**:

```python
# alembic/versions/<rev>_manual_additions.py (upgrade excerpt)

# => NOT detected: database views
# => Alembic sees no View in metadata; you must write op.execute() yourself
op.execute("""
    CREATE OR REPLACE VIEW active_users AS
    SELECT id, username, email
    FROM users
    WHERE status = 'ACTIVE'
""")
# => SQL is executed verbatim against the database

# => NOT detected: stored procedures, triggers, custom types (non-Enum)
# => NOT detected: check constraints using server-side expressions
# => NOT detected: sequence changes or server_default text changes
# => NOT detected: column server_default changes (Alembic ignores them)

# => MISDETECTED: table renames — autogenerate sees DROP old + CREATE new
# => Fix: delete the generated drop/create pair and write op.rename_table() instead
op.rename_table("old_products", "products")
# => op.rename_table is safe; a drop/create pair destroys data
```

**Key Takeaway**: Use autogenerate as a starting point, then audit the diff for renames and missing objects; never run `alembic upgrade head` on a generated file you have not read.

**Why It Matters**: Teams that blindly apply autogenerate output in production CI/CD pipelines have dropped entire tables because a rename was misdetected as a drop-and-recreate. The two-minute review step saves hours of data recovery. Building a checklist of "things autogenerate misses" specific to your project prevents repeated surprises.

---

### Example 33: Batch Operations for SQLite (op.batch_alter_table)

SQLite does not support `ALTER TABLE ... DROP COLUMN` or `ALTER TABLE ... ADD CONSTRAINT`. Alembic's batch mode rewrites the entire table as a workaround, and it is the only supported way to alter SQLite schemas.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
%% Batch operation internal steps
graph TD
    A[op.batch_alter_table] -->|1 CREATE new_table| B[New table with desired schema]
    B -->|2 INSERT INTO new_table SELECT ...| C[Copy existing rows]
    C -->|3 DROP TABLE old_table| D[Remove original]
    D -->|4 RENAME new_table TO old_table| E[Restore original name]

    style A fill:#0173B2,stroke:#000000,color:#ffffff,stroke-width:2px
    style B fill:#DE8F05,stroke:#000000,color:#ffffff,stroke-width:2px
    style C fill:#029E73,stroke:#000000,color:#ffffff,stroke-width:2px
    style D fill:#CC78BC,stroke:#000000,color:#ffffff,stroke-width:2px
    style E fill:#CA9161,stroke:#000000,color:#ffffff,stroke-width:2px
```

```python
# alembic/versions/<rev>_batch_alter_users.py

from alembic import op
import sqlalchemy as sa


def upgrade() -> None:
    # op.batch_alter_table is a context manager that wraps batch mode
    # => "users" is the table to alter; recreate="auto" means use batch if needed
    with op.batch_alter_table("users", recreate="auto") as batch_op:
        # => "auto": Alembic decides whether to use batch (always True on SQLite)
        # => "always": force batch even on PostgreSQL (useful for testing)
        # => "never": disable batch (fails on SQLite for unsupported operations)

        batch_op.add_column(sa.Column("nickname", sa.String(50), nullable=True))
        # => add_column inside batch context adds the column in the new table schema

        batch_op.drop_column("legacy_field")
        # => drop_column removes the column during the table rewrite
        # => on PostgreSQL this executes ALTER TABLE ... DROP COLUMN directly

        batch_op.alter_column(
            "email",
            existing_type=sa.String(100),  # => must specify existing type
            type_=sa.String(255),          # => new type
            nullable=False,                # => enforce NOT NULL in new schema
        )
        # => on SQLite: rewrites table; on PostgreSQL: ALTER COLUMN ... TYPE ...

    # => after the context manager exits, DDL is executed atomically


def downgrade() -> None:
    with op.batch_alter_table("users", recreate="auto") as batch_op:
        batch_op.drop_column("nickname")
        # => reverses the add; safe on all dialects
        batch_op.add_column(sa.Column("legacy_field", sa.Text, nullable=True))
        # => restore dropped column; data is lost (was dropped in upgrade)
        batch_op.alter_column(
            "email",
            existing_type=sa.String(255),
            type_=sa.String(100),
            nullable=True,
        )
```

**Key Takeaway**: Use `op.batch_alter_table` whenever you need to drop columns, alter types, or modify constraints on SQLite; on PostgreSQL it degrades gracefully to native `ALTER TABLE`.

**Why It Matters**: Developers who write plain `op.drop_column` or `op.alter_column` calls without batch mode get cryptic "OperationalError: Cannot add a NOT NULL column with default value NULL" errors on SQLite in local development. Using batch mode consistently means your migration files work identically across all environments — local SQLite, CI PostgreSQL, and production PostgreSQL — without branching logic.

---

### Example 34: Data Migration with op.execute

DDL migrations change schema structure; data migrations change row content. Alembic supports both in the same revision file using `op.execute()` for raw SQL or the bulk helpers.

```python
# alembic/versions/<rev>_backfill_display_name.py

from alembic import op
import sqlalchemy as sa


def upgrade() -> None:
    # Step 1: add the new column as nullable (existing rows need a default)
    op.add_column("users", sa.Column("display_name", sa.String(255), nullable=True))
    # => ALTER TABLE users ADD COLUMN display_name VARCHAR(255)
    # => nullable=True is required; existing rows would violate NOT NULL otherwise

    # Step 2: backfill data using a SQL UPDATE
    op.execute("""
        UPDATE users
        SET display_name = COALESCE(full_name, username)
        WHERE display_name IS NULL
    """)
    # => op.execute() runs arbitrary SQL against the current connection
    # => COALESCE returns the first non-NULL value: full_name if set, else username
    # => every existing row now has a display_name value

    # Step 3: tighten the constraint now that all rows are populated
    op.alter_column("users", "display_name", nullable=False)
    # => ALTER TABLE users ALTER COLUMN display_name SET NOT NULL
    # => safe because all rows now have a non-NULL value


def downgrade() -> None:
    # Reverse: make nullable again, clear backfilled data, drop column
    op.alter_column("users", "display_name", nullable=True)
    # => loosen constraint before clearing data

    op.execute("UPDATE users SET display_name = NULL")
    # => optional: clear backfilled values to restore original state

    op.drop_column("users", "display_name")
    # => ALTER TABLE users DROP COLUMN display_name
```

**Key Takeaway**: The pattern is always add-nullable then backfill then tighten-constraint; reversing it (add NOT NULL first) causes migration failures on tables with existing rows.

**Why It Matters**: The add-nullable-then-backfill-then-tighten sequence is one of the most common production migration patterns. Getting it wrong by adding a NOT NULL column without a default causes migrations to fail on production tables that have millions of rows, requiring emergency rollbacks during deployment windows. The three-step pattern shown here is universally safe.

---

### Example 35: Bulk Insert (op.bulk_insert)

`op.bulk_insert` inserts multiple rows using SQLAlchemy's `table()` construct without requiring ORM models. It is ideal for seeding reference data (lookup tables, enum values, initial configuration rows).

```python
# alembic/versions/<rev>_seed_categories.py

from alembic import op
import sqlalchemy as sa


def upgrade() -> None:
    # Define a lightweight table object — no ORM model needed
    categories_table = sa.table(
        "categories",
        # => sa.table() creates a lightweight construct; NOT a mapped ORM class
        # => only needs the columns you are inserting into
        sa.column("id", sa.Integer),
        # => sa.column() (lowercase) is the lightweight version of sa.Column
        sa.column("name", sa.String),
        sa.column("slug", sa.String),
        sa.column("sort_order", sa.Integer),
    )

    op.bulk_insert(
        categories_table,
        # => first arg: the table construct defined above
        [
            {"id": 1, "name": "Food",        "slug": "food",        "sort_order": 10},
            {"id": 2, "name": "Transport",   "slug": "transport",   "sort_order": 20},
            {"id": 3, "name": "Housing",     "slug": "housing",     "sort_order": 30},
            {"id": 4, "name": "Healthcare",  "slug": "healthcare",  "sort_order": 40},
            {"id": 5, "name": "Education",   "slug": "education",   "sort_order": 50},
        ],
        # => list of dicts; each dict is one row
        # => Alembic generates a single multi-row INSERT statement
    )
    # => SQL: INSERT INTO categories (id, name, slug, sort_order) VALUES (1,...),(2,...),(3,...),(4,...),(5,...)


def downgrade() -> None:
    # Remove the seeded rows by ID range
    op.execute("DELETE FROM categories WHERE id IN (1, 2, 3, 4, 5)")
    # => op.execute() for targeted DELETE is the standard downgrade pattern for seed data
    # => avoid DELETE FROM categories (no WHERE) — would delete any user-added rows too
```

**Key Takeaway**: `op.bulk_insert` with `sa.table()` / `sa.column()` inserts seed data without importing ORM models, keeping migrations self-contained even after models are refactored.

**Why It Matters**: Migrations that import ORM models directly (`from myapp.models import Category`) break when the model changes and the old migration runs against a fresh database. Using `sa.table()` / `sa.column()` inside the migration file decouples the migration from the live codebase, which is essential for maintaining a reliable migration history that can replay from scratch months or years later.

---

### Example 36: Branching Revisions

Alembic supports multiple independent revision lines (branches). Branches are created intentionally for feature development or occur accidentally when two developers generate revisions from the same head simultaneously.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
%% Branch topology
graph TD
    A[base] --> B[001_initial_schema]
    B --> C[002_add_users]
    C --> D[003_feature_a_branch]
    C --> E[003_feature_b_branch]
    D --> F[merge point]
    E --> F

    style A fill:#0173B2,stroke:#000000,color:#ffffff,stroke-width:2px
    style B fill:#0173B2,stroke:#000000,color:#ffffff,stroke-width:2px
    style C fill:#0173B2,stroke:#000000,color:#ffffff,stroke-width:2px
    style D fill:#DE8F05,stroke:#000000,color:#ffffff,stroke-width:2px
    style E fill:#029E73,stroke:#000000,color:#ffffff,stroke-width:2px
    style F fill:#CC78BC,stroke:#000000,color:#ffffff,stroke-width:2px
```

**Create a named branch explicitly**:

```bash
# Create a revision on a new branch named "feature_payments"
alembic revision --branch-label feature_payments --head base -m "add_payments_table"
# => --branch-label names the branch (stored in branch_labels field)
# => --head base starts the branch from the root (no parent revision)
# => --head <rev_id> starts from a specific revision instead of the current head
# => generates a revision file with branch_labels = ("feature_payments",)
# => this branch can be upgraded/downgraded independently

# Upgrade only the feature_payments branch
alembic upgrade feature_payments@head
# => applies only revisions on the feature_payments branch
# => other branches remain at their current head

# Check current heads
alembic heads
# => Output: abc123de (head), ef456789 (head) [feature_payments]
# => multiple heads shown with their branch labels
```

**Revision file produced**:

```python
# alembic/versions/<rev>_add_payments_table.py (generated header)

revision = "ef456789"
down_revision = None          # => None means branch starts from base (no parent)
# => down_revision = "abc123de" would mean branch starts from revision abc123de
branch_labels = ("feature_payments",)
# => branch_labels tuple identifies this revision as the start of the branch
depends_on = None
# => depends_on allows declaring cross-branch dependencies without merging

def upgrade() -> None:
    op.create_table(
        "payments",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
    )

def downgrade() -> None:
    op.drop_table("payments")
```

**Key Takeaway**: Name branches via `--branch-label` and use `alembic upgrade <label>@head` to apply a single branch; unnamed multi-head situations (accidental branches) should be merged immediately (see Example 38).

**Why It Matters**: Branching allows parallel migration development across feature teams without blocking each other. Without branch labels, multi-head situations cause `alembic upgrade head` to fail with "Multiple head revisions are present" — a common CI/CD breaking change that halts all deployments until resolved.

---

### Example 37: Multiple Heads Detection

When two developers independently create revisions from the same head, Alembic detects a multi-head situation and refuses to run `alembic upgrade head`. Detecting and understanding this state is the first step to resolution.

```bash
# Check if multiple heads exist
alembic heads
# => Output when healthy (single head):
#    abc123de (head)

# => Output when branched (multiple heads):
#    abc123de (head)
#    def456gh (head)
# => Two heads means "alembic upgrade head" is ambiguous and will fail

# Check current database revision
alembic current
# => Output: abc123de (head)
# => shows the revision the database is currently at
# => "(head)" suffix means the database is at the latest revision on that branch

# Show the full revision history as a tree
alembic history --verbose
# => Output (abbreviated):
#    Rev: def456gh (head)
#    Parent: abc123de
#    Branch point: abc123de
#    Path: alembic/versions/def456gh_add_orders_table.py
#
#    Rev: abc123de (effective head, branch point)
#    Parent: <base>
#    Path: alembic/versions/abc123de_initial.py

# Attempt to upgrade when multiple heads exist
alembic upgrade head
# => ERROR: Multiple head revisions are present for given argument 'head';
# =>        please specify a specific target revision

# Upgrade to a specific head explicitly
alembic upgrade def456gh
# => applies def456gh even with multiple heads; database now has two revisions applied
```

**Key Takeaway**: `alembic heads` reveals multi-head situations; the fix is `alembic merge` (Example 38), not deleting revision files.

**Why It Matters**: Multi-head states block all automated deployments that call `alembic upgrade head`. Teams that encounter this in production at deployment time have zero downtime windows to fix it. Running `alembic heads` in the pre-deploy smoke-test catches this early and gives the team time to create a merge revision before the deployment window.

---

### Example 38: Merging Branches (alembic merge)

`alembic merge` creates a new revision that makes two (or more) branch heads converge into a single head. The merge revision itself contains no DDL; it just declares two parents.

```bash
# Given two heads: abc123de and def456gh
alembic heads
# => abc123de (head)
# => def456gh (head)

# Create a merge revision
alembic merge -m "merge_orders_and_payments_branches" abc123de def456gh
# => -m: commit message slug for the generated filename
# => abc123de def456gh: the two head revision IDs to merge
# => generates alembic/versions/<new_rev>_merge_orders_and_payments_branches.py
# => the new file has down_revision = ("abc123de", "def456gh") — a tuple of two parents

# Check heads after merge
alembic heads
# => <new_rev> (head)
# => single head restored; "alembic upgrade head" now works
```

**Generated merge revision**:

```python
# alembic/versions/<new_rev>_merge_orders_and_payments_branches.py

revision = "ff001122"
down_revision = ("abc123de", "def456gh")
# => tuple of two strings: the two heads being merged
# => Alembic uses this to construct the correct upgrade/downgrade path
branch_labels = None
# => merge revisions have no branch label; they close all open branches
depends_on = None


def upgrade() -> None:
    pass
    # => no DDL; merge revision only fixes the revision graph topology
    # => upgrade() and downgrade() are intentionally empty


def downgrade() -> None:
    pass
    # => downgrading a merge revision splits the graph back into two branches
    # => "alembic downgrade -1" from the merge point restores both branch heads
```

**Key Takeaway**: `alembic merge <rev1> <rev2>` creates a topology-only revision that restores a single head; the merge revision itself contains no schema changes.

**Why It Matters**: The alternative to merging — manually editing `down_revision` in one of the files — risks corrupting the revision graph in ways that cause subtle upgrade failures on fresh database installs. The `alembic merge` command generates the merge revision correctly, handles three-way merges, and preserves the full history needed for downgrade support.

---

### Example 39: Offline Mode (--sql)

Offline mode generates SQL scripts without connecting to a database. DBAs reviewing migrations, regulated environments requiring pre-approved SQL, and air-gapped systems all benefit from offline SQL generation.

```bash
# Generate SQL for upgrading from current revision to head
alembic upgrade head --sql
# => does NOT connect to the database
# => emits SQL to stdout instead of executing it
# => output includes:
#    BEGIN;
#    CREATE TABLE ...;
#    UPDATE alembic_version SET version_num='<rev>';
#    COMMIT;

# Redirect to a file for DBA review
alembic upgrade head --sql > migrations_up.sql
# => migrations_up.sql contains all pending migration SQL
# => DBA can review, annotate, and apply manually via psql

# Generate SQL for a specific range
alembic upgrade abc123de:def456gh --sql
# => generates SQL for revisions between abc123de (exclusive) and def456gh (inclusive)
# => "abc123de:" means "from abc123de"; ":" before means "up to"

# Generate downgrade SQL
alembic downgrade -1 --sql > rollback.sql
# => generates SQL to downgrade one revision
# => useful for preparing a tested rollback script before applying the upgrade
```

**env.py requirement for offline mode**:

```python
# alembic/env.py — run_migrations_offline() must be properly configured

def run_migrations_offline() -> None:
    """Emit SQL without a live connection."""
    url = config.get_main_option("sqlalchemy.url")
    # => reads sqlalchemy.url from alembic.ini or the override in env.py
    # => must be set even in offline mode (needed for dialect-specific SQL generation)

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        # => literal_binds=True: renders Python values as SQL literals, not bind params
        # => without this, offline SQL has %(param_1)s placeholders instead of values
        dialect_opts={"paramstyle": "named"},
        # => dialect_opts: passed to the dialect constructor
        # => "named" paramstyle matches psycopg2's default
    )
    with context.begin_transaction():
        context.run_migrations()
        # => writes SQL to stdout (or configured output stream)
```

**Key Takeaway**: Always redirect `--sql` output to a file for review; the generated SQL includes `alembic_version` table updates that must be present for Alembic's history tracking to remain consistent.

**Why It Matters**: In regulated industries (finance, healthcare), database changes require DBA sign-off before execution. Offline mode decouples migration authoring (developer responsibility) from migration execution (DBA responsibility). Without it, developers must manually translate Alembic operations to SQL — an error-prone process that routinely misses index names, constraint naming conventions, or PostgreSQL-specific syntax.

---

### Example 40: Environment-Specific Configuration

Production, staging, and development databases often have different URLs, schemas, or pooling requirements. `env.py` is the right place to implement environment-specific logic because it executes at migration runtime.

```python
# alembic/env.py — environment-specific configuration example

import os
from alembic import context
from sqlalchemy import engine_from_config, pool, text


config = context.config
# => context.config wraps alembic.ini

# --- Strategy 1: DATABASE_URL environment variable (most common) ---
_db_url = os.environ.get("DATABASE_URL")
# => DATABASE_URL set by the deployment platform (Heroku, Railway, Render, etc.)
# => format: postgresql+psycopg2://user:password@host:port/dbname
if _db_url:
    config.set_main_option("sqlalchemy.url", _db_url)
    # => overrides sqlalchemy.url in alembic.ini at runtime
    # => credentials never touch the filesystem

# --- Strategy 2: Per-environment ini sections ---
_env = os.environ.get("APP_ENV", "development")
# => APP_ENV: "development", "staging", or "production"
# => defaults to "development" for safety

_env_sections = {
    "development":  "alembic_dev",
    "staging":      "alembic_staging",
    "production":   "alembic_prod",
}
_section = _env_sections.get(_env, "alembic")
# => maps APP_ENV to the corresponding [alembic_dev] / [alembic_prod] ini section
# => each section can have its own sqlalchemy.url, pool_size, etc.

# --- Strategy 3: Schema-per-tenant (PostgreSQL search_path) ---
_tenant_schema = os.environ.get("DB_SCHEMA", "public")
# => multi-tenant apps isolate tenants in separate schemas


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        # => NullPool: no connection pooling; each migration run gets a fresh connection
        # => critical for migration scripts: long-lived pools cause "too many connections"
    )
    with connectable.connect() as connection:
        if _tenant_schema != "public":
            connection.execute(text(f"SET search_path TO {_tenant_schema}"))
            # => sets PostgreSQL search_path so DDL targets the tenant's schema
            # => must run before context.configure()
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()
```

**Key Takeaway**: Read credentials from environment variables in `env.py` at runtime; never use separate `alembic.ini` files per environment (they diverge and cause drift).

**Why It Matters**: Projects with multiple `alembic.ini` files per environment inevitably develop divergent configurations — logging disabled in production, wrong file templates, mismatched `prepend_sys_path`. A single `env.py` that reads `DATABASE_URL` is the only configuration that stays consistent across all environments and satisfies security policies that prohibit credentials in version-controlled files.

---

### Example 41: Custom Migration Templates (script.py.mako)

`script.py.mako` is a Mako template that controls the content of every generated revision file. Customizing it enforces team conventions like required docstring sections, import ordering, and header metadata.

```python
# alembic/script.py.mako — customized template with enforced conventions
# => Mako template syntax: ${variable} for interpolation, <%...%> for code blocks

"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}

Ticket: PROJ-XXXX
Reviewer: <github_username>
"""
# => ${message}: the -m argument value from "alembic revision -m ..."
# => ${up_revision}: the generated revision hash
# => ${down_revision | comma,n}: parent revision(s); Mako filter joins tuples with comma
# => ${create_date}: ISO timestamp of when "alembic revision" was run

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
${imports if imports else ""}
# => ${imports}: populated by autogenerate for custom types (e.g., postgresql.JSONB)
# => the "if imports else" guard prevents a blank line when imports is empty

# revision identifiers, used by Alembic.
revision: str = ${repr(up_revision)}
down_revision: Union[str, None] = ${repr(down_revision)}
branch_labels: Union[str, Sequence[str], None] = ${repr(branch_labels)}
depends_on: Union[str, Sequence[str], None] = ${repr(depends_on)}


def upgrade() -> None:
    # TODO: implement upgrade
    ${upgrades if upgrades else "pass"}
    # => ${upgrades}: populated by autogenerate; "pass" for empty manual revisions


def downgrade() -> None:
    # TODO: implement downgrade
    ${downgrades if downgrades else "pass"}
    # => ${downgrades}: populated by autogenerate
```

**Key Takeaway**: Modify `script.py.mako` to enforce team conventions (required ticket numbers, import order, standard comments) before the project grows beyond a few developers.

**Why It Matters**: A migration without a ticket number or reviewer cannot be traced back to a requirement during an audit. Teams that add these fields to the template early establish accountability patterns that become valuable during compliance reviews. The template is also the only place to enforce that `downgrade()` is never left as `pass` in production — a check that prevents irreversible migration accumulation.

---

### Example 42: Enum Type Creation and Alteration

PostgreSQL native `ENUM` types require explicit creation before use in column definitions. Alembic's `sa.Enum` with `create_type=True` / `create_type=False` controls this lifecycle.

```python
# alembic/versions/<rev>_add_order_status_enum.py

from alembic import op
import sqlalchemy as sa


# Define the enum at module level so upgrade and downgrade share the same object
order_status = sa.Enum(
    "pending", "confirmed", "shipped", "delivered", "cancelled",
    # => positional args are the enum values in creation order
    name="order_status",
    # => name: the PostgreSQL TYPE name; must be unique within the schema
    create_type=False,
    # => create_type=False: do NOT auto-create in Column constructor
    # => we control creation explicitly via .create() and .drop()
)


def upgrade() -> None:
    # Step 1: create the PostgreSQL ENUM type
    order_status.create(op.get_bind(), checkfirst=True)
    # => op.get_bind() returns the current connection
    # => checkfirst=True: skip if type already exists (idempotent)
    # => SQL: CREATE TYPE order_status AS ENUM ('pending','confirmed',...)

    # Step 2: add the column using the enum type
    op.add_column(
        "orders",
        sa.Column("status", order_status, nullable=False, server_default="pending"),
        # => server_default must be a valid enum value
    )
    # => SQL: ALTER TABLE orders ADD COLUMN status order_status NOT NULL DEFAULT 'pending'


def downgrade() -> None:
    op.drop_column("orders", "status")
    # => drop column before dropping the type; type cannot be dropped while in use

    order_status.drop(op.get_bind(), checkfirst=True)
    # => SQL: DROP TYPE IF EXISTS order_status
    # => checkfirst=True prevents error if type was already dropped by another migration
```

**Adding a new value to an existing enum** (PostgreSQL 10+):

```python
def upgrade() -> None:
    op.execute("ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'returned'")
    # => IF NOT EXISTS: idempotent; safe to run multiple times
    # => note: adding an enum value cannot be done inside a transaction on PostgreSQL < 12
    # => for PG < 12: call op.get_bind().execution_options(isolation_level="AUTOCOMMIT")
    # => before the ALTER TYPE to run it outside a transaction
```

**Key Takeaway**: Create enum types explicitly with `.create(op.get_bind())` before the column, and drop the column before `.drop()` to avoid "type is still in use" errors.

**Why It Matters**: Alembic's default behavior with `sa.Enum` creates the type automatically when it sees it in a column definition, but this implicit behavior breaks on `--sql` offline mode and causes duplicate type errors when multiple migrations reference the same enum. Explicit control of the type lifecycle via `create_type=False` and `.create()` / `.drop()` is the only approach that works reliably across all Alembic modes.

---

### Example 43: JSON/JSONB Columns

PostgreSQL `JSONB` stores semi-structured data with indexing support. Alembic uses `postgresql.JSONB` from `sqlalchemy.dialects.postgresql` for JSONB-specific behavior.

```python
# alembic/versions/<rev>_add_metadata_jsonb.py

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


def upgrade() -> None:
    op.add_column(
        "products",
        sa.Column(
            "attributes",
            postgresql.JSONB(astext_type=sa.Text()),
            # => JSONB: binary JSON with indexing, operators, and containment checks
            # => astext_type=sa.Text(): return type when using ->> operator in queries
            # => JSON (not JSONB) stores text as-is; JSONB decompresses and re-serializes
            nullable=True,
            server_default=sa.text("'{}'::jsonb"),
            # => server_default: DB-side default; '{}' is an empty JSON object cast to jsonb
            # => sa.text() wraps raw SQL expressions to avoid SQLAlchemy escaping
        ),
    )
    # => SQL: ALTER TABLE products ADD COLUMN attributes JSONB DEFAULT '{}'::jsonb

    # Add a GIN index on the JSONB column for containment queries (@> operator)
    op.create_index(
        "ix_products_attributes_gin",
        "products",
        ["attributes"],
        postgresql_using="gin",
        # => postgresql_using: specifies the index method (gin, gist, brin, btree)
        # => GIN is required for jsonb_path_ops and @> / <@ containment operators
    )
    # => SQL: CREATE INDEX ix_products_attributes_gin ON products USING GIN (attributes)


def downgrade() -> None:
    op.drop_index("ix_products_attributes_gin", table_name="products")
    op.drop_column("products", "attributes")
```

**Key Takeaway**: Use `postgresql.JSONB` (not `sa.JSON`) for PostgreSQL-specific JSONB behavior; always pair JSONB columns with a GIN index if you query by containment or key existence.

**Why It Matters**: Using `sa.JSON` instead of `postgresql.JSONB` creates a plain `JSON` column that lacks the binary storage format, indexing support, and containment operators that make JSONB worth using. The GIN index omission is the most common JSONB performance mistake — without it, `WHERE attributes @> '{"role": "admin"}'` becomes a full table scan on a column that could have sub-millisecond lookups.

---

### Example 44: Array Columns (PostgreSQL)

PostgreSQL supports native array columns. Alembic uses `postgresql.ARRAY` to define them, enabling storage of multiple values in a single column without a junction table.

```python
# alembic/versions/<rev>_add_tags_array.py

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


def upgrade() -> None:
    op.add_column(
        "articles",
        sa.Column(
            "tags",
            postgresql.ARRAY(sa.Text),
            # => ARRAY(sa.Text): PostgreSQL TEXT[] column type
            # => ARRAY(sa.Integer) for integer arrays, ARRAY(sa.Float) for float arrays
            # => arrays are zero-indexed in Python but one-indexed in SQL expressions
            nullable=True,
            server_default=sa.text("ARRAY[]::text[]"),
            # => empty array as default; must cast to text[] for PostgreSQL type inference
        ),
    )
    # => SQL: ALTER TABLE articles ADD COLUMN tags TEXT[] DEFAULT ARRAY[]::text[]

    # GIN index enables @>, <@, && (overlap), ANY() operators on array columns
    op.create_index(
        "ix_articles_tags_gin",
        "articles",
        ["tags"],
        postgresql_using="gin",
        # => GIN index on array column enables: WHERE 'python' = ANY(tags)
        # => also enables: WHERE tags @> ARRAY['python','alembic'] (contains all)
    )
    # => SQL: CREATE INDEX ix_articles_tags_gin ON articles USING GIN (tags)

    # Partial index: GIN on non-null tags only (avoids indexing NULL rows)
    op.create_index(
        "ix_articles_tags_gin_notnull",
        "articles",
        ["tags"],
        postgresql_using="gin",
        postgresql_where=sa.text("tags IS NOT NULL"),
        # => postgresql_where: adds a WHERE clause to create a partial index
        # => partial indexes are smaller and faster than full indexes for sparse columns
    )


def downgrade() -> None:
    op.drop_index("ix_articles_tags_gin_notnull", table_name="articles")
    op.drop_index("ix_articles_tags_gin", table_name="articles")
    op.drop_column("articles", "tags")
```

**Key Takeaway**: Use `postgresql.ARRAY(sa.Text)` for text arrays and always add a GIN index when you query by element membership or containment.

**Why It Matters**: Array columns eliminate the need for junction tables in cases where ordering does not matter and the array is not the target of foreign key constraints (e.g., tags, permissions lists, feature flags). Without the GIN index, array containment queries degrade to full-table scans the moment the table grows beyond a few thousand rows.

---

### Example 45: Partial Indexes

Partial indexes index only rows that satisfy a WHERE condition. They are smaller, faster to build, and can enforce uniqueness constraints over a subset of rows.

```python
# alembic/versions/<rev>_add_partial_indexes.py

from alembic import op
import sqlalchemy as sa


def upgrade() -> None:
    # Partial unique index: enforce unique email among active users only
    op.create_index(
        "uix_users_email_active",
        "users",
        ["email"],
        unique=True,
        # => unique=True: enforce uniqueness within the indexed subset
        postgresql_where=sa.text("deleted_at IS NULL"),
        # => postgresql_where: only index rows where deleted_at IS NULL
        # => soft-deleted users (deleted_at IS NOT NULL) are excluded
        # => two deleted users can share an email; only active users must be unique
    )
    # => SQL: CREATE UNIQUE INDEX uix_users_email_active ON users (email)
    #          WHERE deleted_at IS NULL

    # Partial index: speed up queries for active sessions only
    op.create_index(
        "ix_sessions_active",
        "sessions",
        ["user_id", "created_at"],
        postgresql_where=sa.text("expires_at > NOW() AND revoked = false"),
        # => only indexes non-expired, non-revoked sessions
        # => most queries on sessions WHERE revoked = false AND expires_at > NOW()
        # => benefit: index stays small even as revoked/expired rows accumulate
    )
    # => SQL: CREATE INDEX ix_sessions_active ON sessions (user_id, created_at)
    #          WHERE expires_at > NOW() AND revoked = false


def downgrade() -> None:
    op.drop_index("ix_sessions_active", table_name="sessions")
    op.drop_index("uix_users_email_active", table_name="users")
```

**Key Takeaway**: Use partial indexes for soft-delete patterns (`WHERE deleted_at IS NULL`) and hot-path queries on status columns; they enforce constraints that full unique indexes cannot express.

**Why It Matters**: Soft-delete patterns (setting `deleted_at` instead of deleting rows) break standard unique indexes because multiple deleted rows with the same value violate the constraint. Partial unique indexes on `WHERE deleted_at IS NULL` are the correct solution. Teams that skip this pattern end up with either disabling uniqueness entirely or running cleanup jobs to enforce business rules that the database should enforce automatically.

---

### Example 46: Full-Text Search Indexes

PostgreSQL full-text search uses `tsvector` computed columns and GIN indexes. Alembic can create these with `op.execute()` for the index and a generated column for the `tsvector`.

```python
# alembic/versions/<rev>_add_fts_index.py

from alembic import op
import sqlalchemy as sa


def upgrade() -> None:
    # Add a generated tsvector column (PostgreSQL 12+)
    op.execute("""
        ALTER TABLE articles
        ADD COLUMN search_vector tsvector
        GENERATED ALWAYS AS (
            setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
            setweight(to_tsvector('english', coalesce(body, '')), 'B')
        ) STORED
    """)
    # => GENERATED ALWAYS AS ... STORED: computed column persisted to disk
    # => setweight('A'): title words rank higher than body words in search results
    # => setweight('B'): body words rank lower
    # => to_tsvector('english', ...): tokenizes and stems text with English rules
    # => coalesce(..., ''): avoids NULL tsvector from NULL columns
    # => || : concatenates two tsvectors into one searchable document

    # GIN index on the generated column enables fast full-text searches
    op.create_index(
        "ix_articles_search_gin",
        "articles",
        ["search_vector"],
        postgresql_using="gin",
        # => GIN required for tsvector; BTREE does not support @@ operator
    )
    # => SQL: CREATE INDEX ix_articles_search_gin ON articles USING GIN (search_vector)


def downgrade() -> None:
    op.drop_index("ix_articles_search_gin", table_name="articles")
    op.execute("ALTER TABLE articles DROP COLUMN search_vector")
    # => must drop index before dropping the column it indexes
```

**Key Takeaway**: Use a `GENERATED ALWAYS AS ... STORED` tsvector column with `setweight` for multi-field ranked full-text search; the GIN index makes `@@` queries fast.

**Why It Matters**: Applications that add full-text search after launch without a tsvector column are forced to do expensive runtime `to_tsvector()` calls or maintain a separate search service. Adding the computed column and GIN index in a migration at schema definition time costs nothing — the column updates automatically on INSERT and UPDATE, and the GIN index provides millisecond search latency even on tables with millions of rows.

---

### Example 47: Creating Views

Database views encapsulate complex queries as virtual tables. Alembic creates and drops views using `op.execute()` since SQLAlchemy's metadata does not track views natively.

```python
# alembic/versions/<rev>_create_expense_summary_view.py

from alembic import op


def upgrade() -> None:
    # Create an updatable view that simplifies common query patterns
    op.execute("""
        CREATE OR REPLACE VIEW v_expense_summary AS
        SELECT
            u.id          AS user_id,
            u.username,
            e.category,
            DATE_TRUNC('month', e.date) AS month,
            SUM(e.amount) AS total_amount,
            COUNT(*)      AS transaction_count,
            AVG(e.amount) AS avg_amount
        FROM expenses e
        JOIN users u ON u.id = e.user_id
        WHERE e.deleted_at IS NULL
        GROUP BY u.id, u.username, e.category, DATE_TRUNC('month', e.date)
    """)
    # => CREATE OR REPLACE VIEW: idempotent; replaces existing view if it exists
    # => DATE_TRUNC truncates to the first day of the month (e.g., 2026-03-01)
    # => SUM aggregated per user + category + month group
    # => filtered view: soft-deleted expenses excluded automatically
    # => view name prefixed with v_ to distinguish from tables in schema explorers


def downgrade() -> None:
    op.execute("DROP VIEW IF EXISTS v_expense_summary")
    # => IF EXISTS: idempotent; no error if view was already removed
    # => use DROP VIEW, not DROP TABLE; views are not tables
```

**Key Takeaway**: Use `CREATE OR REPLACE VIEW` and `DROP VIEW IF EXISTS` for idempotent view management; prefix view names with `v_` to distinguish them from tables.

**Why It Matters**: Views are the most common SQL construct that autogenerate misses. Teams that don't version-control views in Alembic migrations end up with undocumented views created directly in production that disappear during schema rebuilds, causing application errors that are traced back to "someone ran a query in production months ago." Migrations are the authoritative record of what the database contains.

---

### Example 48: Creating Materialized Views

Materialized views store query results on disk and require explicit refresh. They trade staleness for performance on expensive aggregate queries.

```python
# alembic/versions/<rev>_create_user_stats_matview.py

from alembic import op


def upgrade() -> None:
    # Create the materialized view with precomputed statistics
    op.execute("""
        CREATE MATERIALIZED VIEW mv_user_stats AS
        SELECT
            u.id                                    AS user_id,
            u.username,
            COUNT(e.id)                             AS expense_count,
            COALESCE(SUM(e.amount), 0)              AS total_spent,
            COALESCE(AVG(e.amount), 0)              AS avg_expense,
            MAX(e.date)                             AS last_expense_date,
            COUNT(DISTINCT e.category)              AS category_count
        FROM users u
        LEFT JOIN expenses e ON e.user_id = u.id AND e.deleted_at IS NULL
        WHERE u.deleted_at IS NULL
        GROUP BY u.id, u.username
        WITH DATA
    """)
    # => CREATE MATERIALIZED VIEW: creates a physical snapshot of query results
    # => COALESCE(SUM(...), 0): handles users with no expenses (SUM returns NULL)
    # => LEFT JOIN: includes users with zero expenses in the result
    # => WITH DATA: populate the view immediately; WITHOUT DATA creates empty view
    # => data is stale until REFRESH MATERIALIZED VIEW is called

    # Create a unique index on the materialized view (required for concurrent refresh)
    op.execute("""
        CREATE UNIQUE INDEX uix_mv_user_stats_user_id
        ON mv_user_stats (user_id)
    """)
    # => unique index required for REFRESH MATERIALIZED VIEW CONCURRENTLY
    # => CONCURRENTLY allows reads during refresh (no AccessExclusiveLock)
    # => without CONCURRENTLY, refresh blocks all reads until complete


def downgrade() -> None:
    op.execute("DROP MATERIALIZED VIEW IF EXISTS mv_user_stats")
    # => DROP MATERIALIZED VIEW also drops all indexes on the view automatically
```

**Key Takeaway**: Always create a unique index on materialized views to enable `REFRESH MATERIALIZED VIEW CONCURRENTLY`, which avoids blocking reads during refresh.

**Why It Matters**: Materialized views without a unique index force the use of blocking refresh (no `CONCURRENTLY`), which takes an exclusive lock on the view and blocks all reads for the duration of the refresh. On large views this can mean minutes of downtime. The unique index costs disk space but enables zero-downtime refreshes, which is non-negotiable in production.

---

### Example 49: Trigger Functions

PostgreSQL triggers run PL/pgSQL functions automatically on INSERT, UPDATE, or DELETE. Alembic creates trigger functions and trigger bindings with `op.execute()`.

```python
# alembic/versions/<rev>_add_updated_at_trigger.py

from alembic import op


def upgrade() -> None:
    # Create a reusable PL/pgSQL function that updates the updated_at column
    op.execute("""
        CREATE OR REPLACE FUNCTION fn_set_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
    """)
    # => CREATE OR REPLACE: idempotent; safe to re-run if function already exists
    # => RETURNS TRIGGER: required signature for trigger functions
    # => NEW: the row being inserted or updated
    # => NEW.updated_at = NOW(): sets updated_at to the current transaction timestamp
    # => RETURN NEW: pass the modified row to the actual table operation
    # => $$ ... $$: dollar-quoted string; avoids escaping single quotes in function body

    # Bind the trigger function to the expenses table
    op.execute("""
        CREATE TRIGGER trg_expenses_set_updated_at
        BEFORE UPDATE ON expenses
        FOR EACH ROW
        EXECUTE FUNCTION fn_set_updated_at()
    """)
    # => BEFORE UPDATE: fires before the row is written (so we can modify NEW)
    # => FOR EACH ROW: trigger fires once per affected row (not once per statement)
    # => EXECUTE FUNCTION: calls our PL/pgSQL function for each row


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_expenses_set_updated_at ON expenses")
    # => drop the trigger binding first; function may be used by other triggers
    op.execute("DROP FUNCTION IF EXISTS fn_set_updated_at()")
    # => drop the function after all triggers using it are removed
    # => IF EXISTS: idempotent; safe if already removed
```

**Key Takeaway**: Create trigger functions as `CREATE OR REPLACE` for idempotency; always drop triggers before dropping the functions they reference.

**Why It Matters**: Application-layer `updated_at` management (setting `updated_at = datetime.utcnow()` in ORM `before_flush` hooks) is unreliable — raw SQL updates bypass the ORM entirely. A database trigger guarantees `updated_at` is set correctly for every write regardless of which client or tool performs the update. This is especially important for migrations that include data updates via `op.execute()`.

---

### Example 50: Stored Procedures

PostgreSQL stored procedures (introduced in PG 11) support transaction control inside the procedure body, unlike functions. Alembic creates them with `op.execute()`.

```python
# alembic/versions/<rev>_create_archive_expenses_proc.py

from alembic import op


def upgrade() -> None:
    # Create a stored procedure that archives old expenses in batches
    op.execute("""
        CREATE OR REPLACE PROCEDURE proc_archive_expenses(
            p_cutoff_date DATE,
            p_batch_size  INTEGER DEFAULT 1000
        )
        LANGUAGE plpgsql
        AS $$
        DECLARE
            v_rows_moved INTEGER;
        BEGIN
            LOOP
                WITH moved AS (
                    DELETE FROM expenses
                    WHERE date < p_cutoff_date
                      AND deleted_at IS NOT NULL
                    LIMIT p_batch_size
                    RETURNING *
                )
                INSERT INTO expenses_archive SELECT * FROM moved;
                -- RETURNING *: captures the deleted rows for INSERT
                -- WITH moved: CTE that deletes and captures rows in one statement

                GET DIAGNOSTICS v_rows_moved = ROW_COUNT;
                -- GET DIAGNOSTICS: captures number of rows affected by last DML
                EXIT WHEN v_rows_moved = 0;
                -- EXIT WHEN: stops loop when no more rows match

                COMMIT;
                -- COMMIT inside procedure: saves each batch independently
                -- procedures support COMMIT/ROLLBACK; functions do not
            END LOOP;
        END;
        $$
    """)
    # => CALL proc_archive_expenses('2025-01-01', 5000); to invoke
    # => procedures run in their own transaction context when called with CALL


def downgrade() -> None:
    op.execute("DROP PROCEDURE IF EXISTS proc_archive_expenses(DATE, INTEGER)")
    # => must include parameter types to identify the correct overload
    # => IF EXISTS: idempotent; no error if already dropped
```

**Key Takeaway**: Use stored procedures (not functions) when the operation requires intermediate `COMMIT` or `ROLLBACK` statements inside the body; include parameter type signatures in `DROP PROCEDURE`.

**Why It Matters**: Archiving millions of rows in a single transaction acquires long-lived locks and can cause the transaction log to grow unbounded on busy systems. Batched procedures with intermediate COMMITs keep lock duration bounded and enable progress tracking. Functions cannot commit, making procedures the only correct tool for large-batch maintenance operations that must be interruptible.

---

### Example 51: Conditional Migration Logic

Some migrations need to check database state before applying DDL — for example, skipping column creation if a previous migration already added it, or applying different SQL based on PostgreSQL version.

```python
# alembic/versions/<rev>_conditional_migration.py

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text, inspect


def upgrade() -> None:
    conn = op.get_bind()
    # => op.get_bind() returns the current SQLAlchemy Connection object
    inspector = inspect(conn)
    # => inspect() gives introspection tools: get_columns(), get_indexes(), etc.

    # Check if column exists before adding it (idempotency guard)
    existing_cols = {col["name"] for col in inspector.get_columns("users")}
    # => returns list of dicts: [{"name": "id", "type": ..., "nullable": ...}, ...]
    # => set comprehension gives O(1) lookup

    if "phone_number" not in existing_cols:
        op.add_column("users", sa.Column("phone_number", sa.String(20), nullable=True))
        # => only add if missing; safe to run multiple times without error
        # => useful when the same migration runs against environments that diverged

    # Check PostgreSQL version for version-specific DDL
    pg_version = conn.execute(text("SHOW server_version_num")).scalar()
    # => SHOW server_version_num: returns integer like "140009" (PG 14.9)
    pg_major = int(pg_version) // 10000
    # => integer division: 140009 // 10000 = 14 (major version number)

    if pg_major >= 12:
        op.execute("""
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS username_lower TEXT
            GENERATED ALWAYS AS (lower(username)) STORED
        """)
        # => IF NOT EXISTS: additional idempotency guard at SQL level
        # => GENERATED ALWAYS AS ... STORED: computed column (PG 12+ only)
    else:
        if "username_lower" not in existing_cols:
            op.add_column("users", sa.Column("username_lower", sa.Text, nullable=True))
            # => plain column for PG < 12; must be maintained by application or trigger


def downgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    existing_cols = {col["name"] for col in inspector.get_columns("users")}

    if "username_lower" in existing_cols:
        op.drop_column("users", "username_lower")
        # => safe drop: only runs if column exists
    if "phone_number" in existing_cols:
        op.drop_column("users", "phone_number")
        # => safe drop: only runs if column exists
```

**Key Takeaway**: Use `inspect(op.get_bind())` to query live schema state inside migrations; apply conditional DDL for idempotency and version-specific feature detection.

**Why It Matters**: Migrations run multiple times in testing pipelines (fresh DB on every CI run) and sometimes need re-running after failed partial applies. Without idempotency guards, re-running a migration fails with "column already exists" errors. Inspector-based checks make migrations safe to apply to both fresh and partially-migrated databases, which is essential for blue/green deployments and canary releases.

---

### Example 52: Batch Data Migration Pattern

Large data migrations (millions of rows) must process records in batches to avoid long-running transactions, lock contention, and memory exhaustion.

```python
# alembic/versions/<rev>_backfill_expense_slugs.py

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


BATCH_SIZE = 5000
# => process 5000 rows per iteration; tune based on row size and available memory
# => smaller batches: lower lock contention; larger batches: fewer round trips


def upgrade() -> None:
    conn = op.get_bind()
    # => op.get_bind(): current connection; shared with the migration transaction

    # Add the new column
    op.add_column("expenses", sa.Column("slug", sa.String(100), nullable=True))
    # => nullable=True required before backfill; NOT NULL applied after

    # Batch backfill using keyset pagination
    last_id = None
    # => keyset pagination: cursor-based; does not skip rows on concurrent inserts

    while True:
        if last_id is None:
            rows = conn.execute(
                text("""
                    SELECT id, category, date
                    FROM expenses
                    WHERE slug IS NULL
                    ORDER BY id
                    LIMIT :batch_size
                """),
                {"batch_size": BATCH_SIZE},
                # => named bind parameters prevent SQL injection and allow reuse
            ).fetchall()
            # => first iteration: no cursor; start from the beginning
        else:
            rows = conn.execute(
                text("""
                    SELECT id, category, date
                    FROM expenses
                    WHERE slug IS NULL AND id > :last_id
                    ORDER BY id
                    LIMIT :batch_size
                """),
                {"last_id": last_id, "batch_size": BATCH_SIZE},
                # => cursor-based: WHERE id > last_id avoids re-scanning processed rows
            ).fetchall()

        if not rows:
            break
            # => no more rows to process; backfill complete

        for row in rows:
            slug = f"{row.category.lower().replace(' ', '-')}-{row.date}"
            # => deterministic slug: "food-2026-03-01"
            conn.execute(
                text("UPDATE expenses SET slug = :slug WHERE id = :id"),
                {"slug": slug, "id": row.id},
            )
            # => update one row at a time; for bulk updates consider batch UPDATE

        last_id = rows[-1].id
        # => advance cursor to the last processed id

    op.alter_column("expenses", "slug", nullable=False)
    # => safe because every row now has a non-NULL slug


def downgrade() -> None:
    op.drop_column("expenses", "slug")
    # => drop column and all associated data
```

**Key Takeaway**: Use keyset pagination (`WHERE id > :last_id ORDER BY id LIMIT :n`) for batch data migrations; avoid `OFFSET`-based pagination which becomes slower with each page.

**Why It Matters**: OFFSET-based pagination (`LIMIT 5000 OFFSET 50000`) requires the database to scan and discard all preceding rows on each query. On a table with 10 million rows, the 2000th batch requires scanning 10 million rows before returning 5000. Keyset pagination always scans from the cursor position, keeping each batch at constant cost regardless of table size.

---

### Example 53: Migration Testing with pytest

Testing migrations verifies that `upgrade()` and `downgrade()` apply cleanly to a test database. The `alembic.command` module exposes `upgrade` and `downgrade` as Python functions callable from test code.

```python
# tests/test_migrations.py

import pytest
from alembic.config import Config
from alembic import command


@pytest.fixture(scope="session")
def alembic_config(test_database_url: str) -> Config:
    """Provide an Alembic Config pointed at the test database."""
    cfg = Config("alembic.ini")
    # => loads alembic.ini from project root; script_location must be correct
    cfg.set_main_option("sqlalchemy.url", test_database_url)
    # => override database URL to point at test DB, not development/production DB
    return cfg
    # => scope="session": created once per pytest session; reused across all tests


def test_upgrade_head(alembic_config: Config) -> None:
    """Verify all migrations apply without error from a fresh database."""
    command.upgrade(alembic_config, "head")
    # => runs alembic upgrade head against test_database_url
    # => raises exception if any migration fails; pytest marks test as FAILED


def test_downgrade_base(alembic_config: Config) -> None:
    """Verify all migrations roll back without error to the initial state."""
    command.upgrade(alembic_config, "head")
    # => must upgrade first; cannot downgrade a fresh database
    command.downgrade(alembic_config, "base")
    # => "base" means downgrade all the way to before the first migration
    # => raises exception if any downgrade() implementation fails or is missing


def test_upgrade_downgrade_cycle(alembic_config: Config) -> None:
    """Verify each migration can be applied and reversed individually."""
    command.upgrade(alembic_config, "head")
    command.downgrade(alembic_config, "-1")
    # => downgrade one step; tests the most recent migration's downgrade()
    command.upgrade(alembic_config, "head")
    # => re-apply; tests that re-running after downgrade produces the same schema
    # => a failing re-apply reveals non-idempotent upgrade logic
```

**Key Takeaway**: Run `upgrade head` + `downgrade base` + `upgrade head` in CI to verify every migration's round-trip; use a separate test database URL to avoid touching development data.

**Why It Matters**: Many teams discover broken `downgrade()` implementations for the first time during a production rollback, when it is too late to iterate safely. Running the full upgrade-downgrade-upgrade cycle in CI catches these bugs before any code reaches production. The double-upgrade also catches non-idempotent migrations that fail on a second run — a pattern common in conditional migrations without `IF NOT EXISTS` guards.

---

### Example 54: Test Database Setup with testcontainers

`testcontainers-python` starts a real PostgreSQL instance inside Docker for each test session. Migrations run against this ephemeral container, eliminating environment-specific test failures.

```python
# tests/conftest.py

import pytest
from testcontainers.postgres import PostgresContainer
# => pip install testcontainers[postgres]
# => requires Docker running on the test machine or in CI


@pytest.fixture(scope="session")
def postgres_container():
    """Start a PostgreSQL container for the test session."""
    with PostgresContainer("postgres:16-alpine") as container:
        # => PostgresContainer: wraps docker-py; starts postgres:16-alpine image
        # => "16-alpine": small Alpine-based image; matches common production version
        # => context manager: starts container on enter, stops and removes on exit
        yield container
        # => yield: container stays running for the duration of the session
        # => all session-scoped fixtures that depend on this share the same container


@pytest.fixture(scope="session")
def test_database_url(postgres_container: PostgresContainer) -> str:
    """Return the connection URL for the test PostgreSQL container."""
    url = postgres_container.get_connection_url()
    # => returns: postgresql+psycopg2://test:test@localhost:<random_port>/test
    # => random_port: assigned by Docker to avoid conflicts with local PostgreSQL
    return url
    # => session-scoped: same URL reused by all tests in the session


@pytest.fixture(scope="function")
def clean_db(alembic_config, test_database_url):
    """Reset database to clean state before each test function."""
    from alembic import command
    from sqlalchemy import create_engine, text

    engine = create_engine(test_database_url)
    # => create engine once per test function; used for schema teardown

    command.upgrade(alembic_config, "head")
    # => apply all migrations; database now has full production schema

    yield
    # => test runs here; database contains test-inserted data

    with engine.connect() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE"))
        # => DROP SCHEMA CASCADE: removes all tables, views, types, indexes
        conn.execute(text("CREATE SCHEMA public"))
        # => recreate empty schema; ready for next test's upgrade
        conn.commit()
        # => commit the schema reset
```

**Key Takeaway**: Use `testcontainers-python` with `scope="session"` for the container and `scope="function"` for schema reset to get isolation without container startup cost per test.

**Why It Matters**: SQLite-based migration tests frequently pass while PostgreSQL-specific tests fail in CI because SQLite silently accepts PostgreSQL-specific syntax like `JSONB`, `GIN` indexes, and `RETURNING` clauses. Testing against a real PostgreSQL container in Docker eliminates this entire class of false-positive test results and is the only way to verify PostgreSQL-specific features like enum types, array columns, and full-text search indexes.

---

### Example 55: Table Partitioning

PostgreSQL declarative partitioning splits a large table into smaller physical partitions based on a partition key. The parent table is accessed transparently in queries.

```python
# alembic/versions/<rev>_partition_expenses_by_month.py

from alembic import op


def upgrade() -> None:
    # Create the partitioned parent table
    op.execute("""
        CREATE TABLE expenses_partitioned (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id     UUID NOT NULL REFERENCES users(id),
            amount      NUMERIC(19, 4) NOT NULL,
            category    VARCHAR(100) NOT NULL,
            date        DATE NOT NULL,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        ) PARTITION BY RANGE (date)
    """)
    # => PARTITION BY RANGE: each partition covers a date range
    # => other strategies: PARTITION BY LIST (discrete values), PARTITION BY HASH
    # => partitioned tables cannot be inserted into directly; must use child partitions
    # => PRIMARY KEY must include the partition key column (date) for constraint routing

    # Create monthly partitions for the first quarter of 2026
    op.execute("""
        CREATE TABLE expenses_partitioned_2026_01
        PARTITION OF expenses_partitioned
        FOR VALUES FROM ('2026-01-01') TO ('2026-02-01')
    """)
    # => PARTITION OF: creates a child partition of the parent table
    # => FOR VALUES FROM ... TO ...: the date range this partition holds
    # => upper bound is exclusive: TO '2026-02-01' means up to Jan 31 inclusive

    op.execute("""
        CREATE TABLE expenses_partitioned_2026_02
        PARTITION OF expenses_partitioned
        FOR VALUES FROM ('2026-02-01') TO ('2026-03-01')
    """)
    # => child partitions inherit the parent's column definitions and constraints

    op.execute("""
        CREATE TABLE expenses_partitioned_2026_03
        PARTITION OF expenses_partitioned
        FOR VALUES FROM ('2026-03-01') TO ('2026-04-01')
    """)
    # => additional partitions created the same way; automate with a loop in practice


def downgrade() -> None:
    # Drop child partitions first
    op.execute("DROP TABLE IF EXISTS expenses_partitioned_2026_03")
    op.execute("DROP TABLE IF EXISTS expenses_partitioned_2026_02")
    op.execute("DROP TABLE IF EXISTS expenses_partitioned_2026_01")
    # => child partitions are regular tables; use DROP TABLE to remove
    op.execute("DROP TABLE IF EXISTS expenses_partitioned")
    # => drop parent table after all children are removed
```

**Key Takeaway**: Create partitions as child tables using `PARTITION OF`; always drop child partitions before the parent.

**Why It Matters**: Partitioning is the standard PostgreSQL solution for tables that grow beyond tens of millions of rows. Without partitioning, `DELETE FROM expenses WHERE date < '2024-01-01'` locks the entire table while deleting millions of rows. With range partitioning by month, old partitions can be detached and dropped in milliseconds without affecting ongoing queries — the most operationally safe approach to data retention at scale.

---

### Example 56: Generated/Computed Columns

PostgreSQL 12+ supports `GENERATED ALWAYS AS ... STORED` columns whose values are computed automatically from other columns and stored on disk.

```python
# alembic/versions/<rev>_add_computed_columns.py

from alembic import op
import sqlalchemy as sa


def upgrade() -> None:
    # Add a computed full_name column derived from first_name and last_name
    op.execute("""
        ALTER TABLE users
        ADD COLUMN full_name TEXT
        GENERATED ALWAYS AS (
            trim(coalesce(first_name, '') || ' ' || coalesce(last_name, ''))
        ) STORED
    """)
    # => GENERATED ALWAYS AS ... STORED: computed value persisted to disk
    # => trim: removes leading/trailing spaces when first or last name is NULL
    # => coalesce(..., ''): treats NULL as empty string to avoid NULL propagation
    # => cannot manually INSERT or UPDATE generated columns; they are read-only
    # => STORED: value is computed on INSERT/UPDATE and saved; SELECT reads from disk

    # Add a computed total_with_tax column
    op.execute("""
        ALTER TABLE order_items
        ADD COLUMN total_price NUMERIC(10, 2)
        GENERATED ALWAYS AS (
            ROUND(quantity * unit_price * (1 + tax_rate / 100.0), 2)
        ) STORED
    """)
    # => quantity * unit_price * (1 + tax_rate/100): computes price including tax
    # => ROUND(..., 2): rounds to 2 decimal places for monetary values
    # => VIRTUAL (not STORED) would compute on every SELECT but is not yet supported in PG

    # Create an index on the generated column (indexed like any regular column)
    op.create_index("ix_users_full_name", "users", ["full_name"])
    # => index on generated column enables fast WHERE full_name = 'Alice Smith' queries


def downgrade() -> None:
    op.drop_index("ix_users_full_name", table_name="users")
    op.execute("ALTER TABLE users DROP COLUMN full_name")
    op.execute("ALTER TABLE order_items DROP COLUMN total_price")
```

**Key Takeaway**: Generated columns are computed automatically on INSERT/UPDATE, cannot be manually set, and can be indexed like regular columns; always use `STORED` (PostgreSQL does not yet support `VIRTUAL`).

**Why It Matters**: Computing derived values in application code before INSERT means every insertion path (ORM, raw SQL, migrations, external tools) must independently compute the same formula, leading to divergence. A generated column moves the computation into the database where it is guaranteed to be consistent, removing a whole class of data quality bugs from the application layer.

---

### Example 57: GIN Index for JSONB

GIN (Generalized Inverted Index) on JSONB columns enables fast containment, key-existence, and path-expression queries that would otherwise require full-table scans.

```python
# alembic/versions/<rev>_gin_index_for_jsonb.py

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


def upgrade() -> None:
    # Full GIN index with default operator class (jsonb_ops)
    op.create_index(
        "ix_products_metadata_gin",
        "products",
        ["metadata"],
        postgresql_using="gin",
        # => default operator class: jsonb_ops
        # => supports: @>, <@, ?, ?|, ?& operators (key existence + containment)
    )
    # => SQL: CREATE INDEX ix_products_metadata_gin ON products USING GIN (metadata)

    # GIN index with jsonb_path_ops operator class (faster containment, less storage)
    op.execute("""
        CREATE INDEX ix_products_metadata_path_gin
        ON products
        USING GIN (metadata jsonb_path_ops)
    """)
    # => jsonb_path_ops: optimized for @> (contains) and jsonpath (@@) operators only
    # => does NOT support ?, ?|, ?& key-existence operators
    # => ~30-50% smaller than default jsonb_ops for typical JSONB documents
    # => stores only path hashes, not key names

    # Functional GIN index on a specific JSON key (expression index)
    op.execute("""
        CREATE INDEX ix_products_metadata_category
        ON products
        USING GIN ((metadata -> 'categories'))
    """)
    # => (metadata -> 'categories'): extracts the "categories" key as a JSONB value
    # => parentheses required around expression in CREATE INDEX
    # => only indexes rows where the "categories" key exists
    # => supports: WHERE metadata -> 'categories' @> '["electronics"]'


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_products_metadata_category")
    op.execute("DROP INDEX IF EXISTS ix_products_metadata_path_gin")
    op.drop_index("ix_products_metadata_gin", table_name="products")
```

**Key Takeaway**: Use `jsonb_path_ops` for pure containment queries (smaller, faster) and the default `jsonb_ops` when you also need key-existence operators (`?`, `?|`, `?&`).

**Why It Matters**: Applications that add JSONB columns for flexibility routinely forget to add GIN indexes, then discover performance problems only after data grows. A JSONB column without a GIN index is effectively a text blob — all operators require full-table scans. The `jsonb_path_ops` vs `jsonb_ops` choice affects index size by 30-50%, which matters when JSONB documents are large and the table has millions of rows.

---

### Example 58: Composite Primary Keys

Some tables model relationships where the natural primary key is a combination of two or more columns. Alembic creates these via `sa.PrimaryKeyConstraint` or by passing `primary_key=True` to multiple columns.

```python
# alembic/versions/<rev>_create_user_roles_composite_pk.py

from alembic import op
import sqlalchemy as sa


def upgrade() -> None:
    op.create_table(
        "user_roles",
        sa.Column("user_id", sa.Integer, nullable=False),
        # => user_id: foreign key part of composite PK; no primary_key=True here
        sa.Column("role_id", sa.Integer, nullable=False),
        # => role_id: second foreign key part of composite PK
        sa.Column(
            "granted_at", sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"), nullable=False,
        ),
        # => metadata column: when the role was granted; not part of the PK

        sa.PrimaryKeyConstraint("user_id", "role_id", name="pk_user_roles"),
        # => PrimaryKeyConstraint: explicitly names the composite primary key
        # => name="pk_user_roles": naming constraints aids debugging and schema docs
        # => equivalent to: PRIMARY KEY (user_id, role_id) in SQL

        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"],
            name="fk_user_roles_user_id",
            ondelete="CASCADE",
            # => CASCADE: deleting a user automatically removes all their role entries
        ),
        sa.ForeignKeyConstraint(
            ["role_id"], ["roles.id"],
            name="fk_user_roles_role_id",
            ondelete="CASCADE",
            # => CASCADE: deleting a role automatically removes all user-role associations
        ),
    )
    # => SQL: CREATE TABLE user_roles (
    #           user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    #           role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    #           granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    #           CONSTRAINT pk_user_roles PRIMARY KEY (user_id, role_id)
    #         )

    # Additional index on role_id for reverse lookups (who has this role?)
    op.create_index("ix_user_roles_role_id", "user_roles", ["role_id"])
    # => composite PK already indexes (user_id, role_id) for user -> roles lookups
    # => this extra index supports role -> users lookups without full-table scan


def downgrade() -> None:
    op.drop_index("ix_user_roles_role_id", table_name="user_roles")
    op.drop_table("user_roles")
    # => dropping table automatically drops the PK constraint and FK constraints
```

**Key Takeaway**: Use `sa.PrimaryKeyConstraint` to create named composite primary keys; always name foreign keys to simplify debugging and schema documentation.

**Why It Matters**: Unnamed constraints get auto-generated names that differ between PostgreSQL versions and database instances, making them untraceable in error messages and migration scripts. A constraint named `fk_user_roles_user_id` identifies itself immediately in a `ForeignKeyViolation` error. Composite primary keys on junction tables also prevent duplicate entries at the database level without requiring application-layer duplicate checks.

---

### Example 59: Migration Dependencies and Ordering

`depends_on` declares explicit cross-branch or cross-revision dependencies that are not expressed through `down_revision`. This ensures migrations apply in the correct order even when they are on different branches.

```python
# alembic/versions/<rev>_add_audit_columns.py
# This migration MUST run after both the "users" and "expenses" tables exist,
# but it is on an independent "audit" branch.

revision = "cc778899"
down_revision = None
# => None: this revision has no parent in the revision graph
branch_labels = ("audit",)
# => lives on a separate "audit" branch

depends_on = ("abc123de", "def456gh")
# => depends_on: tuple of revision IDs that MUST be applied before this one
# => abc123de: the revision that created the "users" table
# => def456gh: the revision that created the "expenses" table
# => Alembic upgrade applies abc123de and def456gh before cc778899
# => even though cc778899 is on a different branch with no parent
# => depends_on does NOT chain downgrade paths; only controls upgrade ordering
```

**Declaring a cross-schema dependency**:

```python
# alembic/versions/<rev>_analytics_schema.py
# Analytics schema migration that depends on the main schema being complete.

revision = "dd990011"
down_revision = "cc778899"
# => chains within the audit branch

depends_on = "ff001122"
# => single string (not tuple) for a single dependency
# => ff001122: the merge revision from Example 38
# => ensures the entire main migration tree is applied before analytics schema
# => use depends_on for cross-team migrations where branch merging is impractical

import sqlalchemy as sa
from alembic import op


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS analytics")
    # => CREATE SCHEMA: creates a separate PostgreSQL schema namespace
    # => IF NOT EXISTS: idempotent; safe on re-run
    op.create_table(
        "expense_daily_agg",
        sa.Column("date", sa.Date, primary_key=True),
        sa.Column("category", sa.String(100), primary_key=True),
        sa.Column("total", sa.Numeric(19, 4)),
        schema="analytics",
        # => schema="analytics": creates table in the analytics schema
    )
    # => SQL: CREATE TABLE analytics.expense_daily_agg (...)


def downgrade() -> None:
    op.drop_table("expense_daily_agg", schema="analytics")
    op.execute("DROP SCHEMA IF EXISTS analytics")
    # => DROP SCHEMA removes the namespace; IF NOT EXISTS avoids errors on re-run
```

**Key Takeaway**: Use `depends_on` to express execution-order requirements across branches without merging them; `down_revision` controls graph topology while `depends_on` controls application order.

**Why It Matters**: Multi-team projects where different teams own separate migration branches (core schema, analytics, audit) need a way to express "my migration requires your table to exist" without forcing a branch merge. `depends_on` is the only Alembic mechanism for this. Without it, teams resort to numbering migration files by convention and hoping the filesystem ordering matches the required execution order — an approach that breaks the moment branches diverge.

---

### Example 60: Alembic Stamps (alembic stamp)

`alembic stamp` marks the database as being at a specific revision without running any migration SQL. It is used to declare an existing schema as Alembic-managed or to recover from a failed migration.

```bash
# Scenario 1: Existing database — mark as already at head
# Database schema matches migrations but alembic_version table is missing
alembic stamp head
# => inserts the current head revision ID into the alembic_version table
# => does NOT run any migration SQL; only writes to alembic_version
# => after stamp: "alembic current" shows the head revision
# => after stamp: "alembic upgrade head" reports "No revisions to apply"

# Scenario 2: Mark as being at a specific revision
alembic stamp abc123de
# => marks database as at revision abc123de specifically
# => "alembic upgrade head" will now apply all revisions after abc123de
# => useful when importing a snapshot taken at abc123de

# Scenario 3: Mark as empty (before all migrations)
alembic stamp base
# => deletes all rows from alembic_version
# => "alembic upgrade head" will apply ALL migrations from the start
# => WARNING: only use if the schema is truly empty; running migrations on an
# =>          existing schema causes "table already exists" errors

# Scenario 4: Recovery from a failed partial migration
alembic stamp --purge
# => removes ALL rows from alembic_version (same as stamp base)
# => use as a recovery step before manually fixing the database and re-applying

# Check current stamp
alembic current
# => abc123de (head)  — database claims to be at abc123de
# => "(head)" suffix: abc123de is currently the latest revision
# => run after stamp to verify the expected revision is recorded

# Check if stamp is accurate (compare to actual schema)
alembic check
# => Alembic compares Base.metadata against the database schema
# => Output: "No new upgrade operations detected." — stamp matches actual schema
# => Output: "New upgrade operations detected: ..." — stamp does not match schema
```

**Key Takeaway**: Use `alembic stamp head` when adopting Alembic on an existing database; use `alembic stamp <rev>` for recovery after manual schema changes that match a specific revision.

**Why It Matters**: Teams inheriting existing databases without Alembic history cannot run `alembic upgrade head` on the live database because the first migration will fail with "table already exists." Stamping the database at the revision that matches the current schema tells Alembic "we are already here" without applying any SQL, enabling the team to start managing future changes with Alembic immediately. This is one of the first commands needed in any Alembic adoption project.
