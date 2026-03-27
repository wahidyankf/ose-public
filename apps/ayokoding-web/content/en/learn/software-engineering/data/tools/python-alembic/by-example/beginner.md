---
title: "Beginner"
date: 2026-03-27T00:00:00+07:00
draft: false
weight: 10000001
description: "Python Alembic beginner tutorial with 30 annotated examples covering initialization, revision management, DDL operations, CLI commands, autogenerate, and data migrations (0-100% coverage)"
tags: ["python-alembic", "tutorial", "by-example", "beginner", "migrations", "alembic", "sqlalchemy", "ddl"]
---

## Beginner Examples (1-30)

**Coverage**: 0-100% of Alembic functionality

**Focus**: Initialization, revision structure, CLI commands, DDL operations, SQLAlchemy integration, autogenerate, advanced column types, and data migrations.

These examples cover the fundamentals needed to manage production database schemas with Alembic. Each example is self-contained and shows the actual file content or CLI invocation you would use.

---

### Example 1: Initializing Alembic

`alembic init` bootstraps a migration environment by generating the standard directory layout and configuration files. This is always the first command you run in a new project before writing any migrations.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
%% Alembic init output structure
graph TD
    A[alembic init alembic] -->|creates| B[alembic.ini]
    A -->|creates| C[alembic/]
    C -->|contains| D[env.py]
    C -->|contains| E[script.py.mako]
    C -->|contains| F[versions/]

    style A fill:#0173B2,stroke:#000000,color:#ffffff,stroke-width:2px
    style B fill:#DE8F05,stroke:#000000,color:#ffffff,stroke-width:2px
    style C fill:#029E73,stroke:#000000,color:#ffffff,stroke-width:2px
    style D fill:#CC78BC,stroke:#000000,color:#ffffff,stroke-width:2px
    style E fill:#CC78BC,stroke:#000000,color:#ffffff,stroke-width:2px
    style F fill:#CC78BC,stroke:#000000,color:#ffffff,stroke-width:2px
```

```bash
# Run from the project root directory
alembic init alembic
# => creates alembic.ini in the current directory (project config file)
# => creates alembic/ subdirectory (migration environment)
# => creates alembic/env.py (Python script that runs during migrations)
# => creates alembic/script.py.mako (Mako template for new revision files)
# => creates alembic/versions/ (empty directory; revision files go here)

# Output printed to terminal:
# => Creating directory /path/to/project/alembic ...  done
# => Generating /path/to/project/alembic.ini ...  done
# => Generating /path/to/project/alembic/env.py ...  done
# => Generating /path/to/project/alembic/script.py.mako ...  done
# => Generating /path/to/project/alembic/versions/.keep ...  done
# => Please edit configuration/connection/logging settings
# =>   in '/path/to/project/alembic.ini' before proceeding.

# The argument "alembic" is the name of the generated directory.
# Convention: use "alembic" as the directory name; some teams use "migrations".
# After init, edit alembic.ini to set sqlalchemy.url before running any migration.
```

**Key Takeaway**: `alembic init <directory>` creates the entire migration environment in one command; always edit `alembic.ini` to configure the database URL before running `alembic upgrade head`.

**Why It Matters**: Without proper initialization the version tracking table never gets created, and Alembic cannot determine which migrations have run. The generated `env.py` is the bridge between your SQLAlchemy models and Alembic's migration runner. Missing or misconfigured files here cause cryptic import errors that waste debugging time in production deployments.

---

### Example 2: alembic.ini Configuration

`alembic.ini` is the project-level configuration file that controls script location, file naming, logging, and the database connection URL. Every Alembic command reads this file first.

```ini
# alembic.ini — project root configuration file

[alembic]
# script_location: path to the alembic directory (from project root)
script_location = alembic
# => tells Alembic where to find env.py, versions/, and script.py.mako
# => use relative path from project root; "alembic" is the conventional name

# file_template: naming pattern for generated revision files
file_template = %%(rev)s_%%(slug)s
# => %%(rev)s  => revision ID hash (e.g., "abc123de")
# => %%(slug)s => slugified version of the -m message (e.g., "create_users_table")
# => result: "abc123de_create_users_table.py"
# => alternative: %%(year)d%%(month).2d%%(day).2d_%%(rev)s_%%(slug)s (date prefix)

# prepend_sys_path: directories to add to sys.path when env.py runs
prepend_sys_path = .
# => "." means project root is on sys.path
# => enables "from myapp.models import Base" in env.py without install

# version_path_separator: OS-appropriate separator for version_locations
version_path_separator = os
# => "os" uses os.pathsep (: on Unix, ; on Windows)
# => only relevant for multi-directory version setups

# sqlalchemy.url: database connection string
# sqlalchemy.url = postgresql+psycopg2://user:pass@localhost/dbname
# => LEFT BLANK HERE: set programmatically in env.py from DATABASE_URL env var
# => never hard-code credentials in ini files; use environment variables

[loggers]
keys = root,sqlalchemy,alembic
# => three logger namespaces: root (all), sqlalchemy.engine, alembic

[handlers]
keys = console
# => single handler: writes to stderr

[formatters]
keys = generic

[logger_root]
level = WARN
# => suppress INFO and DEBUG from all libraries
handlers = console
qualname =

[logger_sqlalchemy]
level = WARN
# => set to INFO to log all SQL statements during migrations (useful for debugging)
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
# => INFO shows migration progress; set to DEBUG for verbose output
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
# => writes to stderr, not stdout; keeps migration output separate from app output
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
# => example output: "INFO  [alembic.runtime.migration] Running upgrade  -> abc123, create users"
```

**Key Takeaway**: Set `sqlalchemy.url` via environment variable in `env.py` rather than hard-coding it in `alembic.ini`; the `file_template` controls how revision files are named and should include `%%(slug)s` for readable filenames.

**Why It Matters**: Misconfiguring `script_location` causes "Can't locate revision identifier" errors that are confusing without this context. Hard-coding the database URL in `alembic.ini` is a common security mistake that leaks credentials into version control. The logging configuration controls whether you see SQL output during CI/CD pipeline migrations, which is essential for diagnosing production migration failures.

---

### Example 3: env.py Structure and Purpose

`env.py` is the Python script Alembic executes when running any migration command. It connects Alembic to your SQLAlchemy models and database, supporting both online mode (live connection) and offline mode (SQL script generation).

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
%% env.py execution flow
graph TD
    A[alembic upgrade head] -->|loads| B[env.py]
    B -->|reads DATABASE_URL| C[config.set_main_option]
    B -->|imports| D[Base.metadata]
    B -->|offline?| E{is_offline_mode}
    E -->|Yes| F[run_migrations_offline]
    E -->|No| G[run_migrations_online]
    F -->|emits SQL| H[stdout / file]
    G -->|connects| I[PostgreSQL]
    I -->|runs DDL| J[alembic_version updated]

    style A fill:#0173B2,stroke:#000000,color:#ffffff,stroke-width:2px
    style B fill:#DE8F05,stroke:#000000,color:#ffffff,stroke-width:2px
    style C fill:#029E73,stroke:#000000,color:#ffffff,stroke-width:2px
    style D fill:#029E73,stroke:#000000,color:#ffffff,stroke-width:2px
    style E fill:#CA9161,stroke:#000000,color:#ffffff,stroke-width:2px
    style F fill:#CC78BC,stroke:#000000,color:#ffffff,stroke-width:2px
    style G fill:#CC78BC,stroke:#000000,color:#ffffff,stroke-width:2px
    style H fill:#808080,stroke:#000000,color:#ffffff,stroke-width:2px
    style I fill:#808080,stroke:#000000,color:#ffffff,stroke-width:2px
    style J fill:#029E73,stroke:#000000,color:#ffffff,stroke-width:2px
```

```python
# alembic/env.py — full file content

"""Alembic environment configuration."""

import os
import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import engine_from_config, pool

# --- sys.path setup ---
# Add the src directory so "from myapp.models import Base" works.
_src_path = Path(__file__).parents[2] / "src"
# => Path(__file__) is the path to this env.py file
# => .parents[2] goes two levels up: alembic/ -> project_root/
# => / "src" appends the src directory
if str(_src_path) not in sys.path:
    sys.path.insert(0, str(_src_path))
    # => prepend so project models take precedence over installed packages

# --- Import SQLAlchemy metadata ---
from myapp.infrastructure.models import Base  # noqa: E402
# => Base.metadata holds all Table definitions from SQLAlchemy ORM models
# => used by autogenerate to detect schema differences
# => noqa: E402 suppresses "module level import not at top of file" lint warning

# --- Alembic config object ---
config = context.config
# => context.config wraps alembic.ini; provides get_main_option(), set_main_option()

# --- Logging setup ---
if config.config_file_name is not None:
    fileConfig(config.config_file_name)
    # => applies [loggers] / [handlers] / [formatters] from alembic.ini

# --- Autogenerate target ---
target_metadata = Base.metadata
# => must be set for --autogenerate to work
# => None here means autogenerate cannot detect model changes

# --- Database URL from environment ---
_database_url = os.environ.get("DATABASE_URL") or config.get_main_option("sqlalchemy.url")
# => prefer DATABASE_URL env var; fall back to alembic.ini value
# => this keeps credentials out of version control
if _database_url:
    config.set_main_option("sqlalchemy.url", _database_url)
    # => overrides whatever was in alembic.ini


def run_migrations_offline() -> None:
    """Run migrations in offline mode (emit SQL without a live connection)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,                          # => pass URL string directly (no engine)
        target_metadata=target_metadata,  # => needed for autogenerate in offline mode
        literal_binds=True,               # => render bind parameters as literals in SQL
        dialect_opts={"paramstyle": "named"},
        # => "named" uses :param notation; "qmark" uses ? notation
    )
    with context.begin_transaction():
        context.run_migrations()
        # => writes SQL to stdout or a file; no actual DB connection made


def run_migrations_online() -> None:
    """Run migrations in online mode (with a live database connection)."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        # => reads [alembic] section from alembic.ini for sqlalchemy.* keys
        prefix="sqlalchemy.",             # => strips "sqlalchemy." prefix when passing to create_engine
        poolclass=pool.NullPool,          # => NullPool: no connection reuse; safe for migration scripts
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,        # => live connection object
            target_metadata=target_metadata,
        )
        with context.begin_transaction():
            context.run_migrations()
            # => executes upgrade() or downgrade() from each revision file
            # => updates alembic_version table after each revision


if context.is_offline_mode():
    run_migrations_offline()
    # => triggered by: alembic upgrade head --sql
else:
    run_migrations_online()
    # => triggered by: alembic upgrade head (no --sql flag)
```

**Key Takeaway**: `env.py` is the single integration point between Alembic and your application; always read the database URL from an environment variable here and always set `target_metadata` to enable autogenerate.

**Why It Matters**: A missing or wrong `target_metadata` silently disables autogenerate, causing Alembic to generate empty revision files. Using `pool.NullPool` prevents connection pool exhaustion in migration scripts. The offline mode (`--sql`) is essential for audit trails in regulated environments where a DBA must review SQL before execution.

---

### Example 4: Creating a First Revision

`alembic revision` generates a new migration file in the `versions/` directory with boilerplate `upgrade()` and `downgrade()` functions. The file gets a unique revision ID and links back to its parent revision.

```bash
# Create a revision with no auto-generated content (blank template)
alembic revision -m "create users table"
# => -m "create users table": sets the human-readable message; becomes the slug in the filename
# => generates: alembic/versions/abc123de_create_users_table.py
# => revision ID "abc123de" is a random 8-character hex string
# => the file contains empty upgrade() and downgrade() functions to fill in

# Output:
# => Generating /path/to/project/alembic/versions/abc123de_create_users_table.py ...  done

# Without -m flag the file is still created but has an empty slug:
alembic revision
# => generates: alembic/versions/def456gh_.py
# => avoid this; always use -m for readable filenames
```

The generated file looks like this:

```python
# alembic/versions/abc123de_create_users_table.py

"""create users table

Revision ID: abc123de
Revises:
Create Date: 2026-03-27 10:00:00.000000

"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "abc123de"
# => this revision's unique identifier; referenced by other revisions as down_revision

down_revision: str | None = None
# => None means this is the FIRST migration (no parent)
# => for subsequent revisions this will be the parent's revision ID (e.g., "abc123de")

branch_labels: str | Sequence[str] | None = None
# => used for named branch management (advanced); None for linear history

depends_on: str | Sequence[str] | None = None
# => used for cross-branch dependencies (advanced); None for standard use


def upgrade() -> None:
    # => called by: alembic upgrade head (or alembic upgrade abc123de)
    # => fill in DDL operations here using op.*
    pass


def downgrade() -> None:
    # => called by: alembic downgrade -1 (or alembic downgrade base)
    # => fill in REVERSE operations here; must exactly undo upgrade()
    pass
```

**Key Takeaway**: Always pass `-m` with a descriptive message to create readable filenames; the `down_revision` field is how Alembic builds the migration chain, so never edit it manually after the file is created.

**Why It Matters**: Missing or duplicate revision IDs corrupt the migration chain and cause "Can't locate revision identifier" errors that require manual intervention. The `-m` message becomes the filename slug and also appears in `alembic history` output, making it the primary way team members understand what each migration does without opening the file.

---

### Example 5: upgrade() and downgrade() Functions

Every revision file has exactly two functions: `upgrade()` applies the schema change forward and `downgrade()` reverses it exactly. Both functions must be implemented as a pair for safe rollback capability.

```python
# alembic/versions/abc123de_create_users_table.py

"""create users table

Revision ID: abc123de
Revises:
Create Date: 2026-03-27 10:00:00.000000

"""

from alembic import op
import sqlalchemy as sa

revision: str = "abc123de"
down_revision: str | None = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # => upgrade() is called when running: alembic upgrade head (or upgrade abc123de)
    # => must contain all DDL to move the database FORWARD to this revision
    # => Alembic wraps this in a transaction; if it raises, the transaction rolls back

    op.create_table(                          # => emits: CREATE TABLE users (...)
        "users",
        sa.Column("id", sa.Integer, primary_key=True),
        # => id INTEGER PRIMARY KEY
        sa.Column("username", sa.String(50), nullable=False),
        # => username VARCHAR(50) NOT NULL
        sa.Column("email", sa.String(255), nullable=False),
        # => email VARCHAR(255) NOT NULL
    )
    # => after upgrade() returns: alembic_version table is updated to "abc123de"


def downgrade() -> None:
    # => downgrade() is called when running: alembic downgrade -1 (or downgrade base)
    # => must EXACTLY reverse everything in upgrade()
    # => order matters: reverse the upgrade() operations in reverse order

    op.drop_table("users")
    # => emits: DROP TABLE users
    # => after downgrade() returns: alembic_version row for "abc123de" is deleted
    # => the database is now at the previous revision (or no revision if base)
```

**Key Takeaway**: `upgrade()` and `downgrade()` must be exact inverses; if `upgrade()` creates a table, `downgrade()` must drop it in the correct reverse order, especially when multiple operations are involved.

**Why It Matters**: A `downgrade()` that does not perfectly reverse `upgrade()` makes rollbacks dangerous in production incidents. Teams that skip implementing `downgrade()` with `pass` lose the ability to roll back quickly during outages, forcing manual database surgery. Both functions run inside a transaction by default, so partial failures roll back cleanly—but only if the operations themselves are reversible.

---

### Example 6: op.create_table

`op.create_table` emits a `CREATE TABLE` DDL statement with all column definitions. It is the most common operation in `upgrade()` functions and accepts the same column arguments as SQLAlchemy's `Table` constructor.

```python
# Inside upgrade() of a revision file

from alembic import op
import sqlalchemy as sa

def upgrade() -> None:
    op.create_table(
        "products",
        # => first positional argument: table name string
        # => remaining arguments: Column objects defining the schema

        sa.Column("id", sa.Integer, primary_key=True),
        # => id INTEGER PRIMARY KEY
        # => primary_key=True: Alembic adds PRIMARY KEY constraint
        # => for PostgreSQL with SERIAL, use autoincrement=True (default for Integer PK)

        sa.Column("name", sa.String(200), nullable=False),
        # => name VARCHAR(200) NOT NULL

        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        # => price NUMERIC(10,2) NOT NULL
        # => Numeric(precision, scale): 10 total digits, 2 after decimal

        sa.Column("description", sa.Text, nullable=True),
        # => description TEXT (nullable, so no NOT NULL constraint)
        # => nullable=True is the default; shown here explicitly for clarity

        sa.Column("stock", sa.Integer, nullable=False, server_default="0"),
        # => stock INTEGER NOT NULL DEFAULT 0
        # => server_default="0": the database applies this default, not Python
        # => use server_default for column defaults in CREATE TABLE

        sa.Column("active", sa.Boolean, nullable=False, server_default=sa.true()),
        # => active BOOLEAN NOT NULL DEFAULT TRUE
        # => sa.true() is the dialect-correct way to specify TRUE literal

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        # => created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        # => sa.text("NOW()") wraps a raw SQL expression as the default
        # => timezone=True: TIMESTAMPTZ (with time zone) in PostgreSQL
    )
    # => emits the full CREATE TABLE products (...) statement
    # => the table is created in the current schema (usually "public" in PostgreSQL)
```

**Key Takeaway**: Use `server_default` for column defaults in `op.create_table`; use `sa.text("SQL_EXPRESSION")` for database function defaults like `NOW()` and `gen_random_uuid()`.

**Why It Matters**: Confusing `default` (Python-side) with `server_default` (database-side) is a frequent mistake: `default` values set in Python are never persisted unless the ORM inserts the row, but `server_default` values are applied by the database for every insert including raw SQL. In production data migrations and bulk inserts, `server_default` ensures correctness even when bypassing the ORM.

---

### Example 7: op.add_column

`op.add_column` adds a new column to an existing table after it has been created. It maps to `ALTER TABLE ... ADD COLUMN` and is the standard way to extend a table schema in a subsequent revision.

```python
# Inside upgrade() — adding a column to an existing "products" table

from alembic import op
import sqlalchemy as sa

def upgrade() -> None:
    op.add_column(
        "products",
        # => first argument: table name
        sa.Column("sku", sa.String(50), nullable=True),
        # => second argument: Column object defining the new column
        # => sku VARCHAR(50) (nullable because existing rows have no value yet)
        # => nullable=True is necessary for adding a column to a populated table
        # => if nullable=False without a server_default, PostgreSQL raises an error
        # => for NOT NULL columns on existing tables, see Example 21
    )
    # => emits: ALTER TABLE products ADD COLUMN sku VARCHAR(50)


def downgrade() -> None:
    op.drop_column("products", "sku")
    # => emits: ALTER TABLE products DROP COLUMN sku
    # => reverses the add_column exactly
    # => WARNING: this permanently deletes the column and all its data
```

**Key Takeaway**: When adding a column to a populated table, always set `nullable=True` first (or provide a `server_default`); then in a later revision update it to `nullable=False` after backfilling data.

**Why It Matters**: Attempting to add a `NOT NULL` column without a `server_default` to a table with existing rows causes PostgreSQL to raise an error because it cannot assign a value to existing rows. A two-step migration (add nullable, backfill, then alter to NOT NULL) is the production-safe pattern that avoids locking issues and failed deployments.

---

### Example 8: op.drop_column

`op.drop_column` removes a column from an existing table, emitting `ALTER TABLE ... DROP COLUMN`. It is irreversible in terms of data: the column and all its values are permanently deleted.

```python
# Inside upgrade() — removing a deprecated column from "products"

from alembic import op
import sqlalchemy as sa

def upgrade() -> None:
    op.drop_column("products", "legacy_code")
    # => first argument: table name
    # => second argument: column name to drop
    # => emits: ALTER TABLE products DROP COLUMN legacy_code
    # => all data in legacy_code is permanently deleted
    # => PostgreSQL also drops any indexes or constraints on this column


def downgrade() -> None:
    op.add_column(
        "products",
        sa.Column("legacy_code", sa.String(20), nullable=True),
        # => re-create the column on rollback
        # => data is LOST — downgrade re-creates the column structure but not the values
        # => nullable=True: on rollback, existing rows will have NULL in this column
    )
    # => emits: ALTER TABLE products ADD COLUMN legacy_code VARCHAR(20)
    # => WARNING: data is not restored; downgrade only restores schema structure
```

**Key Takeaway**: `op.drop_column` is permanently destructive: the `downgrade()` function can recreate the column structure but cannot restore the data, so always take a database backup before running a migration that drops columns.

**Why It Matters**: Column drops are irreversible data loss events. Production teams often use a two-step process: first mark the column as deprecated in code (stop reading/writing it), then after a release cycle, create the drop migration. This ensures no application code is still using the column when it is removed, preventing runtime errors from the rollout sequence.

---

### Example 9: op.create_index

`op.create_index` creates a database index on one or more columns, emitting `CREATE INDEX`. Indexes are critical for query performance on large tables and are standard additions in migrations that introduce new filter or join columns.

```python
# Inside upgrade() — adding indexes to the "products" table

from alembic import op

def upgrade() -> None:
    # Simple single-column index
    op.create_index(
        "ix_products_sku",     # => index name: convention is "ix_{table}_{column}"
        "products",            # => table name
        ["sku"],               # => list of column names to index
        unique=False,          # => non-unique index; allows duplicate SKU values
    )
    # => emits: CREATE INDEX ix_products_sku ON products (sku)

    # Unique index enforces uniqueness at the database level
    op.create_index(
        "ix_products_sku_unique",
        "products",
        ["sku"],
        unique=True,           # => unique=True: adds UNIQUE constraint via index
    )
    # => emits: CREATE UNIQUE INDEX ix_products_sku_unique ON products (sku)
    # => uniqueness is enforced by the database; duplicate inserts raise IntegrityError


def downgrade() -> None:
    op.drop_index("ix_products_sku_unique", table_name="products")
    # => emits: DROP INDEX ix_products_sku_unique
    # => table_name is required so Alembic knows the schema context
    op.drop_index("ix_products_sku", table_name="products")
    # => reverse order: drop unique index first, then non-unique
```

**Key Takeaway**: Always name indexes explicitly with the `ix_{table}_{column}` convention so `downgrade()` can reference them by name; use `unique=True` to enforce column uniqueness at the database level rather than only in application code.

**Why It Matters**: Unnamed indexes (auto-named by PostgreSQL) make `downgrade()` brittle because the generated name is unpredictable. Consistent naming conventions (`ix_`, `uq_`, `ck_`, `fk_`) make the database schema self-documenting. Forgetting indexes on foreign key columns causes full table scans on every JOIN query, which becomes a severe performance problem at scale.

---

### Example 10: op.create_foreign_key

`op.create_foreign_key` adds a foreign key constraint between two tables, enforcing referential integrity at the database level. It maps to `ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY`.

```python
# Inside upgrade() — adding a foreign key from "orders" to "users"

from alembic import op

def upgrade() -> None:
    op.create_foreign_key(
        "fk_orders_user_id",   # => constraint name: convention is "fk_{table}_{column}"
        "orders",              # => source table (child) — the table with the FK column
        "users",               # => referent table (parent) — the table being referenced
        ["user_id"],           # => source columns: the FK column(s) in "orders"
        ["id"],                # => referent columns: the PK column(s) in "users"
        ondelete="RESTRICT",   # => RESTRICT: prevent deleting a user who has orders
        # => other options: "CASCADE" (delete orders when user deleted)
        # =>                "SET NULL" (set user_id to NULL when user deleted)
        # =>                "SET DEFAULT" (set to column default)
        # =>                "NO ACTION" (default; deferred check, similar to RESTRICT)
    )
    # => emits: ALTER TABLE orders ADD CONSTRAINT fk_orders_user_id
    # =>        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT


def downgrade() -> None:
    op.drop_constraint("fk_orders_user_id", "orders", type_="foreignkey")
    # => first argument: constraint name
    # => second argument: table name where the constraint lives
    # => type_="foreignkey": required to identify constraint type
    # => emits: ALTER TABLE orders DROP CONSTRAINT fk_orders_user_id
```

**Key Takeaway**: Always name foreign key constraints explicitly so `downgrade()` can reference them; choose the `ondelete` behavior deliberately—`RESTRICT` is safest for data integrity, `CASCADE` is convenient but dangerous if misapplied.

**Why It Matters**: Unnamed foreign keys get database-generated names that differ between environments, making `downgrade()` fail in production when it was written for the development-generated name. The `ondelete` behavior directly impacts data integrity in production: `CASCADE` can silently delete thousands of child rows when a parent is deleted, while `RESTRICT` surfaces the issue immediately as a constraint violation.

---

### Example 11: Running Migrations

`alembic upgrade head` executes all pending migrations up to the latest revision. It is the primary command used in application deployment pipelines to bring the database schema up to date.

```bash
# Apply all pending migrations up to the latest (head) revision
alembic upgrade head
# => reads alembic.ini to find script_location and database URL
# => connects to the database
# => checks alembic_version table for the current revision
# => runs upgrade() for each unapplied revision in order
# => updates alembic_version after each successful revision
# => Output example:
# => INFO  [alembic.runtime.migration] Context impl PostgreSQLImpl.
# => INFO  [alembic.runtime.migration] Will assume transactional DDL.
# => INFO  [alembic.runtime.migration] Running upgrade  -> abc123de, create users table
# => INFO  [alembic.runtime.migration] Running upgrade abc123de -> def456gh, add email index

# Apply up to a specific revision (partial upgrade)
alembic upgrade def456gh
# => applies only up to revision "def456gh"
# => stops there even if newer revisions exist
# => useful for staged deployments or testing specific revisions

# Apply a relative number of revisions forward
alembic upgrade +2
# => applies the next 2 pending revisions from current position
# => useful for incremental testing

# Preview SQL without executing (offline / dry-run mode)
alembic upgrade head --sql
# => prints all SQL statements to stdout without connecting to the database
# => used for DBA review before execution in regulated environments
# => output can be redirected: alembic upgrade head --sql > migration.sql
```

**Key Takeaway**: `alembic upgrade head` is the standard deployment command; use `--sql` to preview all DDL statements before applying them in sensitive production environments.

**Why It Matters**: Running `alembic upgrade head` without first reviewing the SQL in production is a common cause of unexpected schema changes during deployments. The `--sql` flag enables a review workflow where a DBA approves the generated SQL file before it is executed, which is required in many compliance frameworks. Always verify `alembic current` before upgrading to confirm the starting point.

---

### Example 12: Downgrading

`alembic downgrade` reverses one or more migrations by running their `downgrade()` functions. It is the rollback command used when a deployment needs to be reverted.

```bash
# Roll back exactly one revision (most recent)
alembic downgrade -1
# => finds the current revision in alembic_version
# => calls downgrade() for that one revision
# => updates alembic_version to the previous revision
# => Output example:
# => INFO  [alembic.runtime.migration] Running downgrade def456gh -> abc123de, add email index

# Roll back two revisions at once
alembic downgrade -2
# => calls downgrade() for the two most recent revisions, in reverse order
# => useful when two related revisions need to be rolled back together

# Downgrade to a specific revision
alembic downgrade abc123de
# => rolls back all revisions AFTER "abc123de" until current is "abc123de"
# => calls each downgrade() in reverse order

# Downgrade all the way to before the first migration
alembic downgrade base
# => "base" is a special alias meaning "no revisions applied"
# => calls downgrade() for every applied revision in reverse order
# => alembic_version table row is deleted (or set to NULL)
# => WARNING: this destroys all tables created by migrations

# Preview downgrade SQL without executing
alembic downgrade -1 --sql
# => prints the downgrade SQL to stdout; does not execute
```

**Key Takeaway**: `alembic downgrade -1` rolls back the most recent migration; test both `upgrade()` and `downgrade()` functions in your CI pipeline to ensure rollbacks work before a production incident.

**Why It Matters**: Teams that never test `downgrade()` discover broken rollbacks during production incidents when the pressure is highest. A `downgrade()` that raises an exception leaves the database in a half-reverted state, requiring manual DDL to fix. Running `alembic downgrade -1 --sql` in CI as part of the migration test suite catches these issues before production deployment.

---

### Example 13: Checking Current Version

`alembic current` queries the `alembic_version` table and prints the revision ID and description of the currently applied migration. It is the primary tool for checking database migration state.

```bash
# Show the current revision of the default database
alembic current
# => connects to the database configured in alembic.ini / env.py
# => reads alembic_version table
# => Output when at a specific revision:
# => INFO  [alembic.runtime.migration] Context impl PostgreSQLImpl.
# => INFO  [alembic.runtime.migration] Will assume transactional DDL.
# => def456gh (head)
# => "(head)" suffix: this revision IS the latest; database is fully up to date

# Output when behind the latest revision:
# => abc123de
# => (no "(head)" suffix): revisions exist that have not been applied yet

# Output when no migrations have been applied:
# => (no output after INFO lines)
# => or: INFO  [alembic.runtime.migration] No current version.

# Verbose output showing full revision details
alembic current --verbose
# => def456gh (head)
# => Rev: def456gh (head)
# => Parent: abc123de
# => Path: alembic/versions/def456gh_add_email_index.py
# => 2026-03-27 10:15:00.000000
# => add email index
```

**Key Takeaway**: Check `alembic current` before every `alembic upgrade head` to confirm the starting state; the `(head)` suffix tells you the database is fully up to date.

**Why It Matters**: Running `alembic upgrade head` on a database that is already at head is harmless (no-op), but understanding the starting state is essential for diagnosing migration failures. In containerized environments where multiple application instances share a database, `alembic current` helps identify which instances have run migrations and which are waiting.

---

### Example 14: Viewing History

`alembic history` lists all revisions in the migration chain with their IDs, descriptions, and parent relationships. It is the primary tool for understanding the revision graph.

```bash
# Show all revisions (oldest first by default)
alembic history
# => abc123de -> def456gh (head), add email index
# => <base> -> abc123de, create users table
# => "(head)" marks the latest revision
# => "<base>" marks the starting point (no parent)
# => arrows show direction: parent -> child

# Show history in reverse order (newest first)
alembic history --rev-range head:base
# => def456gh -> <head>, add email index
# => abc123de -> def456gh, create users table
# => reading from top to bottom shows newest to oldest

# Show a specific range of revisions
alembic history -r abc123de:def456gh
# => shows only revisions between abc123de and def456gh (inclusive)

# Verbose history with full details
alembic history --verbose
# => Rev: def456gh (head)
# => Parent: abc123de
# => Path: alembic/versions/def456gh_add_email_index.py
# => 2026-03-27 10:15:00.000000
# => add email index
# =>
# => Rev: abc123de
# => Parent: <base>
# => Path: alembic/versions/abc123de_create_users_table.py
# => 2026-03-27 10:00:00.000000
# => create users table

# Show history indicating which revisions have been applied
alembic history --indicate-current
# => def456gh (head), add email index  (current)
# => abc123de, create users table
# => "(current)" marks the revision present in alembic_version
```

**Key Takeaway**: Use `alembic history --indicate-current` to see both the full revision chain and which revision is currently applied in the database; use `--verbose` when debugging revision file paths.

**Why It Matters**: `alembic history` is essential for onboarding new developers and auditing migration chains in production. In long-running projects with dozens of migrations, `--indicate-current` immediately shows how far behind a database is, without requiring manual comparison of revision IDs. The verbose output with file paths helps when diagnosing "revision not found" errors caused by missing files in the versions directory.

---

### Example 15: Revision with Message

The `-m` flag on `alembic revision` sets a descriptive message that becomes both the docstring in the generated file and the slug component of the filename. Descriptive messages make `alembic history` output self-documenting.

```bash
# Create a revision with a descriptive message
alembic revision -m "add status column to orders"
# => -m "add status column to orders": the migration description
# => generates: alembic/versions/abc789xy_add_status_column_to_orders.py
# => slug is derived from the message: spaces -> underscores, lowercase

# Good message patterns (imperative mood, specific):
alembic revision -m "create products table"
alembic revision -m "add price index to products"
alembic revision -m "alter users email to varchar 255"
alembic revision -m "drop legacy_code column from products"
alembic revision -m "add foreign key orders to users"
# => each message clearly states the DDL operation being performed

# Bad message patterns (vague, non-descriptive):
alembic revision -m "update"
alembic revision -m "fix"
alembic revision -m "migration 3"
# => these show up in alembic history as meaningless entries
# => make debugging and auditing much harder

# Viewing the message in history
alembic history
# => abc789xy (head), add status column to orders
# => abc123de, create users table
# => messages appear directly in history output
```

The generated file docstring uses the message:

```python
# alembic/versions/abc789xy_add_status_column_to_orders.py

"""add status column to orders

Revision ID: abc789xy
Revises: abc123de
Create Date: 2026-03-27 11:00:00.000000

"""

from alembic import op
import sqlalchemy as sa

revision: str = "abc789xy"
down_revision: str | None = "abc123de"
# => down_revision is set automatically to the current head at the time of creation
# => this links this revision to its parent; NEVER change this manually

branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "orders",
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        # => status VARCHAR(20) NOT NULL DEFAULT 'pending'
    )


def downgrade() -> None:
    op.drop_column("orders", "status")
    # => reverses the add_column
```

**Key Takeaway**: Use imperative mood (`create`, `add`, `drop`, `alter`) in `-m` messages and be specific about the table and column affected; the message is the primary documentation for anyone reading `alembic history`.

**Why It Matters**: Vague migration messages like "fix" or "update" force developers to open each file to understand what changed, multiplying the time spent during incident debugging. In production audits, the migration history serves as a schema changelog; descriptive messages make it possible to answer "when did the `status` column get added to `orders`?" in seconds rather than minutes.

---

### Example 16: SQLAlchemy Metadata Integration

Integrating SQLAlchemy `MetaData` (via `Base.metadata`) into `env.py` enables autogenerate to compare the current database schema against your ORM model definitions and detect differences.

```python
# src/myapp/infrastructure/models.py — SQLAlchemy ORM models

from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    # => DeclarativeBase: SQLAlchemy 2.0 base class for all ORM models
    # => Base.metadata: MetaData object that tracks all mapped Table objects
    pass


class User(Base):
    __tablename__ = "users"
    # => tells SQLAlchemy the corresponding table name

    id = Column(Integer, primary_key=True, autoincrement=True)
    # => id INTEGER PRIMARY KEY AUTOINCREMENT (SERIAL in PostgreSQL)

    username = Column(String(50), nullable=False, unique=True)
    # => username VARCHAR(50) NOT NULL UNIQUE

    email = Column(String(255), nullable=False, unique=True)
    # => email VARCHAR(255) NOT NULL UNIQUE

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # => created_at TIMESTAMPTZ DEFAULT NOW()
    # => func.now() is the SQLAlchemy-level representation of the NOW() SQL function
```

```python
# alembic/env.py — relevant section connecting metadata

import sys
from pathlib import Path

# Add src/ to sys.path so the import below works without installing the package
_src_path = Path(__file__).parents[2] / "src"
if str(_src_path) not in sys.path:
    sys.path.insert(0, str(_src_path))

from myapp.infrastructure.models import Base  # noqa: E402
# => import the Base class that holds all table metadata

target_metadata = Base.metadata
# => assign to target_metadata so Alembic knows what to compare against
# => all models that inherit from Base are automatically included
# => if you forget this, --autogenerate produces empty revision files

# Autogenerate will now detect:
# => tables that exist in models but not in the database (need CREATE TABLE)
# => tables that exist in the database but not in models (need DROP TABLE — be careful)
# => column additions, removals, and type changes
# => index additions and removals
# => constraint additions and removals (some limitations apply)
```

**Key Takeaway**: `target_metadata = Base.metadata` is the single line that enables autogenerate; import all models before this line to ensure every table is registered in the metadata object.

**Why It Matters**: A common mistake is importing `Base` but not importing the model classes, leaving `Base.metadata` empty (because models self-register only when their class is imported). This causes autogenerate to see every existing table as "to be dropped" and every model table as "to be created," generating a catastrophic reverse migration instead of the incremental one you wanted.

---

### Example 17: Autogenerate Basics

`alembic revision --autogenerate` compares your SQLAlchemy metadata against the current database schema and generates migration code for all detected differences. This is the most productive way to create revision files for schema changes driven by model updates.

```bash
# Generate a revision by comparing models to the database
alembic revision --autogenerate -m "add products table"
# => connects to the database (must be running and accessible)
# => reads target_metadata from env.py (must be set correctly)
# => compares database schema to SQLAlchemy models
# => generates a revision file with detected differences
# => Output:
# => INFO  [alembic.autogenerate.compare] Detected added table 'products'
# => INFO  [alembic.autogenerate.compare] Detected added index 'ix_products_sku' on 'products.sku'
# => Generating alembic/versions/xyz789ab_add_products_table.py ...  done
```

The generated revision file:

```python
# alembic/versions/xyz789ab_add_products_table.py

"""add products table

Revision ID: xyz789ab
Revises: def456gh
Create Date: 2026-03-27 12:00:00.000000

"""

from alembic import op
import sqlalchemy as sa

revision: str = "xyz789ab"
down_revision: str | None = "def456gh"
# => automatically set to the current head; links this revision to the chain
branch_labels = None
depends_on = None


def upgrade() -> None:
    # => AUTOGENERATED: do not edit manually unless you understand the consequences
    op.create_table(
        "products",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("price", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        # => autogenerate translates primary_key=True to an explicit PrimaryKeyConstraint
    )
    op.create_index(op.f("ix_products_sku"), "products", ["sku"], unique=False)
    # => op.f("ix_products_sku"): uses Alembic's naming convention from MetaData if configured


def downgrade() -> None:
    # => AUTOGENERATED: drop in reverse order of creation
    op.drop_index(op.f("ix_products_sku"), table_name="products")
    op.drop_table("products")
    # => reverse order: drop index before dropping table
```

**Key Takeaway**: Always review autogenerated migration files before committing them; autogenerate produces accurate code for simple changes but misses some patterns (server-side defaults, custom types, stored procedures) and may incorrectly flag unchanged columns as modified.

**Why It Matters**: Blindly running autogenerate without review is a common source of data loss. Autogenerate may detect a renamed column as "drop old column + add new column" instead of "rename column," destroying the data. It also does not detect changes in Python-side `default=` values (only `server_default`), leading to subtle data inconsistencies when the ORM and database disagree on defaults.

---

### Example 18: op.alter_column

`op.alter_column` modifies an existing column's properties—type, nullability, server default, or name. It maps to `ALTER TABLE ... ALTER COLUMN` and is used to evolve column definitions after initial creation.

```python
# Inside upgrade() — modifying an existing "users.email" column

from alembic import op
import sqlalchemy as sa

def upgrade() -> None:
    # Change nullability: make email NOT NULL
    op.alter_column(
        "users",           # => table name
        "email",           # => column name
        nullable=False,    # => change from nullable to NOT NULL
        # => emits: ALTER TABLE users ALTER COLUMN email SET NOT NULL
        # => WARNING: this fails if any existing rows have NULL in email
        # => backfill NULLs before running this migration
    )

    # Change server_default
    op.alter_column(
        "users",
        "status",
        server_default="active",
        # => emits: ALTER TABLE users ALTER COLUMN status SET DEFAULT 'active'
        # => existing rows are unaffected; only new inserts use this default
    )

    # Remove server_default
    op.alter_column(
        "users",
        "status",
        server_default=None,
        # => None removes the existing default
        # => emits: ALTER TABLE users ALTER COLUMN status DROP DEFAULT
    )

    # Change column type (PostgreSQL-specific; use carefully)
    op.alter_column(
        "products",
        "price",
        type_=sa.Numeric(19, 4),
        # => changes from NUMERIC(10,2) to NUMERIC(19,4)
        # => emits: ALTER TABLE products ALTER COLUMN price TYPE NUMERIC(19,4)
        # => safe if new type is wider; dangerous if narrowing (data truncation)
        postgresql_using="price::numeric(19,4)",
        # => postgresql_using: USING clause for explicit type cast (PostgreSQL-specific)
    )


def downgrade() -> None:
    op.alter_column("users", "email", nullable=True)
    # => emits: ALTER TABLE users ALTER COLUMN email DROP NOT NULL
    op.alter_column("users", "status", server_default=None)
    # => removes the default we added
    op.alter_column(
        "products",
        "price",
        type_=sa.Numeric(10, 2),
        postgresql_using="price::numeric(10,2)",
    )
    # => reverts type change; may lose precision for values with >2 decimal places
```

**Key Takeaway**: Before setting `nullable=False`, always run a data migration to backfill NULL values; use `postgresql_using` when changing column types in PostgreSQL to provide an explicit CAST expression.

**Why It Matters**: Attempting `ALTER COLUMN ... SET NOT NULL` on a table with existing NULL rows raises a constraint violation and fails the migration mid-execution. Without a `USING` clause, PostgreSQL may refuse to cast between incompatible types automatically (e.g., `VARCHAR` to `INTEGER`), leaving the column unchanged and the migration in an error state.

---

### Example 19: op.create_unique_constraint

`op.create_unique_constraint` adds a `UNIQUE` constraint to one or more columns on an existing table. It differs from `op.create_index(..., unique=True)` in that it creates a named constraint rather than just an index.

```python
# Inside upgrade() — adding unique constraints to "users"

from alembic import op

def upgrade() -> None:
    # Single-column unique constraint
    op.create_unique_constraint(
        "uq_users_email",   # => constraint name: convention is "uq_{table}_{column}"
        "users",            # => table name
        ["email"],          # => list of columns; must all be part of the constraint
    )
    # => emits: ALTER TABLE users ADD CONSTRAINT uq_users_email UNIQUE (email)
    # => this fails if duplicate email values already exist in the table
    # => check and clean duplicates before running this migration

    # Multi-column unique constraint (composite uniqueness)
    op.create_unique_constraint(
        "uq_users_username_tenant",
        "users",
        ["username", "tenant_id"],
        # => uniqueness is defined on the COMBINATION of (username, tenant_id)
        # => two rows can have the same username if they have different tenant_id values
    )
    # => emits: ALTER TABLE users ADD CONSTRAINT uq_users_username_tenant
    # =>        UNIQUE (username, tenant_id)


def downgrade() -> None:
    op.drop_constraint("uq_users_username_tenant", "users", type_="unique")
    # => emits: ALTER TABLE users DROP CONSTRAINT uq_users_username_tenant
    op.drop_constraint("uq_users_email", "users", type_="unique")
    # => reverse order: drop most recently added first
```

**Key Takeaway**: Name unique constraints explicitly with the `uq_{table}_{column}` convention; composite unique constraints enforce uniqueness on the combination of columns, not each column independently.

**Why It Matters**: Unnamed constraints get database-generated names that differ between environments, making `downgrade()` reference the wrong constraint name. Multi-tenant applications frequently use composite unique constraints on `(username, tenant_id)` rather than just `(username)` to allow the same username across tenants; misunderstanding this leads to false uniqueness violations that block legitimate registrations.

---

### Example 20: op.create_check_constraint

`op.create_check_constraint` adds a `CHECK` constraint that validates column values against a SQL condition. It maps to `ALTER TABLE ... ADD CONSTRAINT ... CHECK (condition)` and enforces business rules at the database level.

```python
# Inside upgrade() — adding check constraints to "products"

from alembic import op
import sqlalchemy as sa

def upgrade() -> None:
    # Price must be positive
    op.create_check_constraint(
        "ck_products_price_positive",   # => constraint name: "ck_{table}_{description}"
        "products",                      # => table name
        sa.text("price > 0"),            # => CHECK condition as a SQL expression
        # => emits: ALTER TABLE products ADD CONSTRAINT ck_products_price_positive
        # =>        CHECK (price > 0)
        # => rejects INSERT or UPDATE where price <= 0 with a constraint violation
    )

    # Status must be one of a fixed set of values (alternative to ENUM type)
    op.create_check_constraint(
        "ck_products_status_valid",
        "products",
        sa.text("status IN ('active', 'inactive', 'discontinued')"),
        # => emits: ALTER TABLE products ADD CONSTRAINT ck_products_status_valid
        # =>        CHECK (status IN ('active', 'inactive', 'discontinued'))
    )

    # Range constraint: quantity between 0 and 10000
    op.create_check_constraint(
        "ck_products_quantity_range",
        "products",
        sa.text("quantity >= 0 AND quantity <= 10000"),
        # => emits: CHECK (quantity >= 0 AND quantity <= 10000)
    )


def downgrade() -> None:
    op.drop_constraint("ck_products_quantity_range", "products", type_="check")
    op.drop_constraint("ck_products_status_valid", "products", type_="check")
    op.drop_constraint("ck_products_price_positive", "products", type_="check")
    # => reverse order: drop in reverse of creation
    # => emits: ALTER TABLE products DROP CONSTRAINT ck_products_price_positive
```

**Key Takeaway**: Use `sa.text()` to write the CHECK condition as a raw SQL string; check constraints enforce data validity at the database level, catching invalid values even from direct SQL inserts that bypass application validation.

**Why It Matters**: Application-level validation can be bypassed by direct database access, batch jobs, or admin scripts. Check constraints catch invalid values at the lowest level—the database engine—regardless of how the data arrives. However, adding a check constraint to a table with existing violating data fails immediately; always validate and clean data before adding constraints.

---

### Example 21: Adding NOT NULL with server_default

Adding a `NOT NULL` column to a populated table requires a two-step approach: first add the column with a `server_default` to provide values for existing rows, then optionally remove the default if the column should not have a permanent default.

```python
# Step 1: Add the column with a server_default (single migration, production-safe)

from alembic import op
import sqlalchemy as sa

def upgrade() -> None:
    # Add NOT NULL column with server_default in one operation
    op.add_column(
        "users",
        sa.Column(
            "account_type",
            sa.String(20),
            nullable=False,
            server_default="standard",
            # => server_default="standard": PostgreSQL sets this value for all existing rows
            # => "standard" is the value written to existing rows at migration time
            # => new rows will also get "standard" unless explicitly set
        ),
    )
    # => emits:
    # => ALTER TABLE users ADD COLUMN account_type VARCHAR(20) NOT NULL DEFAULT 'standard'
    # => all existing rows now have account_type = 'standard'
    # => the column is NOT NULL; future inserts without this column get "standard"


def downgrade() -> None:
    op.drop_column("users", "account_type")
    # => removes the column and its default
```

If you want the column to be NOT NULL without a permanent default after the migration:

```python
# Two-step approach: add with default, then remove the default in same migration

def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "account_type",
            sa.String(20),
            nullable=False,
            server_default="standard",
            # => add column with default so existing rows have a value
        ),
    )
    # => all existing rows now have account_type = 'standard'

    op.alter_column(
        "users",
        "account_type",
        server_default=None,
        # => remove the default; future inserts MUST provide a value
        # => emits: ALTER TABLE users ALTER COLUMN account_type DROP DEFAULT
    )
    # => result: column is NOT NULL with no default
    # => existing rows: account_type = 'standard'
    # => new rows: must provide account_type explicitly


def downgrade() -> None:
    op.drop_column("users", "account_type")
```

**Key Takeaway**: When adding a `NOT NULL` column to a populated table, always provide `server_default` to give existing rows a value; remove the default in the same migration if the column should not have a permanent default.

**Why It Matters**: The single most common Alembic migration failure in production is attempting to add a `NOT NULL` column without a `server_default` to a table that already has rows. PostgreSQL immediately raises `column cannot be null` because it cannot assign a value to the existing rows. The `server_default` pattern avoids this completely and makes the migration atomic.

---

### Example 22: UUID Columns with PostgreSQL

PostgreSQL's `UUID` type stores 128-bit universally unique identifiers. Using UUIDs as primary keys avoids sequential ID enumeration attacks and works naturally in distributed systems where multiple nodes create records independently.

```python
# Inside upgrade() — creating a table with UUID primary key (PostgreSQL)

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade() -> None:
    op.create_table(
        "sessions",

        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            # => postgresql.UUID: uses PostgreSQL's native UUID type (not VARCHAR(36))
            # => as_uuid=True: Python receives uuid.UUID objects, not raw strings
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
            # => gen_random_uuid(): PostgreSQL built-in function (available from PostgreSQL 13+)
            # => generates a random UUID v4 for each new row
            # => alternative for older PostgreSQL: uuid_generate_v4() (requires uuid-ossp extension)
            nullable=False,
        ),

        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        # => foreign key UUID column (no server_default; must be provided explicitly)

        sa.Column("token", sa.String(512), nullable=False),
        # => session token as a string (not UUID; could be JWT or other format)

        sa.Column(
            "expires_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        # => expiry timestamp; no default (caller must provide)
    )
    # => emits:
    # => CREATE TABLE sessions (
    # =>   id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    # =>   user_id UUID NOT NULL,
    # =>   token VARCHAR(512) NOT NULL,
    # =>   expires_at TIMESTAMPTZ NOT NULL
    # => )


def downgrade() -> None:
    op.drop_table("sessions")
    # => DROP TABLE sessions
```

**Key Takeaway**: Use `postgresql.UUID(as_uuid=True)` for UUID columns and `sa.text("gen_random_uuid()")` as the `server_default` for auto-generated primary keys; this produces native UUID storage that is more efficient than VARCHAR(36).

**Why It Matters**: Storing UUIDs as `VARCHAR(36)` wastes 20 bytes per row compared to native UUID storage (16 bytes) and disables UUID-specific indexing optimizations. Using `gen_random_uuid()` as `server_default` ensures every row gets a unique ID even in bulk inserts that bypass the ORM, which is essential for data pipelines and migration scripts.

---

### Example 23: Timestamp Columns with Defaults

Audit timestamp columns (`created_at`, `updated_at`) are standard in every production table for data lineage tracking. Using `server_default` and PostgreSQL triggers or application-level updates ensures these values are always populated correctly.

```python
# Inside upgrade() — adding standard audit timestamp columns

from alembic import op
import sqlalchemy as sa

def upgrade() -> None:
    op.create_table(
        "audit_log",

        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        # => id SERIAL PRIMARY KEY

        sa.Column("event_type", sa.String(100), nullable=False),
        # => event_type VARCHAR(100) NOT NULL

        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
            # => created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            # => set once at INSERT time; never changes
            # => NOW() returns the current transaction start time (not wall clock)
        ),

        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
            # => updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            # => set to NOW() at INSERT time; application must update on each UPDATE
            # => or use a PostgreSQL trigger to auto-update on each UPDATE
        ),
    )

    # Adding audit columns to an existing table (common pattern)
    op.add_column(
        "products",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
            # => existing rows get NOW() at migration time
            # => represents "created at migration time" for pre-existing rows
            # => acceptable trade-off; backfilling accurate timestamps requires data analysis
        ),
    )
    op.add_column(
        "products",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )


def downgrade() -> None:
    op.drop_column("products", "updated_at")
    op.drop_column("products", "created_at")
    # => reverse order: drop updated_at before created_at
    op.drop_table("audit_log")
```

**Key Takeaway**: Use `sa.text("NOW()")` as `server_default` for timestamp columns; PostgreSQL's `NOW()` returns transaction start time, ensuring all rows in a single transaction share the same timestamp.

**Why It Matters**: Using Python's `datetime.now()` as a `default` instead of `NOW()` as `server_default` means timestamps are assigned by the application server, not the database, leading to clock skew between servers and NULL timestamps for rows inserted via raw SQL. `server_default=sa.text("NOW()")` guarantees every row has a timestamp regardless of how it was inserted.

---

### Example 24: Enum Columns

PostgreSQL `ENUM` types create named type objects in the database schema that constrain a column to a fixed set of values. Alembic handles ENUM creation and deletion separately from the table because they are schema-level objects.

```python
# Inside upgrade() — creating a table with an ENUM column

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade() -> None:
    # Create the ENUM type as a schema object first
    order_status = postgresql.ENUM(
        "pending", "processing", "shipped", "delivered", "cancelled",
        # => the allowed values for this enum type
        name="order_status",
        # => name: the PostgreSQL type name; must be unique within the schema
    )
    order_status.create(op.get_bind())
    # => op.get_bind(): returns the current database connection
    # => emits: CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled')

    op.create_table(
        "orders",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column(
            "status",
            postgresql.ENUM(
                "pending", "processing", "shipped", "delivered", "cancelled",
                name="order_status",
                create_type=False,
                # => create_type=False: the type already exists; don't try to CREATE it again
            ),
            nullable=False,
            server_default="pending",
            # => status order_status NOT NULL DEFAULT 'pending'
        ),
        sa.Column("total", sa.Numeric(10, 2), nullable=False),
    )
    # => emits: CREATE TABLE orders (
    # =>   id SERIAL PRIMARY KEY,
    # =>   status order_status NOT NULL DEFAULT 'pending',
    # =>   total NUMERIC(10,2) NOT NULL
    # => )


def downgrade() -> None:
    op.drop_table("orders")
    # => DROP TABLE orders (removes column that uses the type first)

    order_status = postgresql.ENUM(name="order_status")
    order_status.drop(op.get_bind())
    # => emits: DROP TYPE order_status
    # => must drop table BEFORE dropping the type (dependency order)
```

**Key Takeaway**: Always create the PostgreSQL ENUM type before the table that uses it, and drop the table before dropping the type; use `create_type=False` when referencing an existing ENUM in a column definition.

**Why It Matters**: Forgetting `create_type=False` causes "type already exists" errors when the ENUM was already created by a previous migration or by the ORM model. The reverse is equally problematic: dropping the type before the table that uses it fails with "cannot drop type because other objects depend on it." The explicit create/drop order in `upgrade()` and `downgrade()` makes this dependency safe.

---

### Example 25: Composite Indexes

Composite (multi-column) indexes improve query performance for `WHERE` clauses that filter on multiple columns simultaneously. Column order in the index definition matters—the leftmost column should be the most selective filter.

```python
# Inside upgrade() — adding composite indexes for common query patterns

from alembic import op

def upgrade() -> None:
    # Composite index for queries filtering by user_id AND status
    op.create_index(
        "ix_orders_user_status",  # => index name: "ix_{table}_{col1}_{col2}"
        "orders",                  # => table name
        ["user_id", "status"],     # => column order matters: user_id first (higher cardinality)
        unique=False,
        # => emits: CREATE INDEX ix_orders_user_status ON orders (user_id, status)
        # => helps queries: WHERE user_id = $1 AND status = $2
        # => also helps: WHERE user_id = $1 (can use leftmost column alone)
        # => does NOT help: WHERE status = $2 (rightmost only; needs full scan)
    )

    # Composite index for queries filtering by tenant_id AND created_at range
    op.create_index(
        "ix_orders_tenant_created",
        "orders",
        ["tenant_id", "created_at"],
        # => helps: WHERE tenant_id = $1 AND created_at BETWEEN $2 AND $3
        # => also helps ORDER BY: WHERE tenant_id = $1 ORDER BY created_at DESC
    )

    # Partial index: index only active orders (PostgreSQL-specific)
    op.create_index(
        "ix_orders_active_user",
        "orders",
        ["user_id"],
        unique=False,
        postgresql_where="status != 'cancelled'",
        # => postgresql_where: partial index condition (PostgreSQL-specific)
        # => emits: CREATE INDEX ix_orders_active_user ON orders (user_id)
        # =>        WHERE status != 'cancelled'
        # => smaller index; only indexes rows where status != 'cancelled'
        # => query planner uses this index when query also has WHERE status != 'cancelled'
    )


def downgrade() -> None:
    op.drop_index("ix_orders_active_user", table_name="orders")
    op.drop_index("ix_orders_tenant_created", table_name="orders")
    op.drop_index("ix_orders_user_status", table_name="orders")
    # => reverse order: drop in reverse of creation
```

**Key Takeaway**: Put the most selective column first in a composite index; use `postgresql_where` for partial indexes that only index a subset of rows, reducing index size and improving write performance.

**Why It Matters**: Column order in composite indexes is the most misunderstood aspect of database indexing. A composite index on `(user_id, status)` accelerates `WHERE user_id = $1 AND status = $2` but is useless for `WHERE status = $2` alone. Partial indexes dramatically reduce index size for tables with heavily skewed data distributions (e.g., 99% of orders are "cancelled") and improve both query and write performance.

---

### Example 26: Junction Tables

Junction (association) tables implement many-to-many relationships between two entities. They have no surrogate primary key—instead, the combination of the two foreign key columns forms the primary key, ensuring no duplicate associations.

```python
# Inside upgrade() — creating a user_roles junction table

from alembic import op
import sqlalchemy as sa

def upgrade() -> None:
    # Create the junction table for users <-> roles (many-to-many)
    op.create_table(
        "user_roles",

        sa.Column("user_id", sa.Integer, nullable=False),
        # => user_id INTEGER NOT NULL (FK to users.id)

        sa.Column("role_id", sa.Integer, nullable=False),
        # => role_id INTEGER NOT NULL (FK to roles.id)

        sa.PrimaryKeyConstraint("user_id", "role_id"),
        # => composite primary key: (user_id, role_id) must be unique
        # => prevents a user from having the same role assigned twice
        # => no surrogate id column needed; the FK pair is the natural key

        sa.ForeignKeyConstraint(
            ["user_id"],          # => local columns
            ["users.id"],         # => referenced table.column
            name="fk_user_roles_user_id",
            ondelete="CASCADE",   # => delete user_roles rows when user is deleted
        ),
        # => emits: FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

        sa.ForeignKeyConstraint(
            ["role_id"],
            ["roles.id"],
            name="fk_user_roles_role_id",
            ondelete="CASCADE",   # => delete user_roles rows when role is deleted
        ),
        # => emits: FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
    )
    # => emits: CREATE TABLE user_roles (
    # =>   user_id INTEGER NOT NULL,
    # =>   role_id INTEGER NOT NULL,
    # =>   PRIMARY KEY (user_id, role_id),
    # =>   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    # =>   FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
    # => )

    # Index on role_id for reverse lookups: "which users have role X?"
    op.create_index("ix_user_roles_role_id", "user_roles", ["role_id"], unique=False)
    # => composite PK already creates an index on (user_id, role_id)
    # => separate index on role_id supports: SELECT user_id FROM user_roles WHERE role_id = $1


def downgrade() -> None:
    op.drop_index("ix_user_roles_role_id", table_name="user_roles")
    op.drop_table("user_roles")
    # => DROP TABLE also removes the FK constraints and composite PK
```

**Key Takeaway**: Use `sa.PrimaryKeyConstraint("col1", "col2")` for composite primary keys on junction tables and add a separate index on the second FK column to support reverse lookups without a full table scan.

**Why It Matters**: Junction tables without an index on the second foreign key column cause full table scans for reverse lookups. For example, "find all users with role X" requires scanning every row in `user_roles` if only `user_id` is indexed (via the composite PK). The separate `role_id` index makes both "which roles does user X have?" and "which users have role X?" equally fast.

---

### Example 27: Seed Data with op.bulk_insert

`op.bulk_insert` inserts multiple rows into a table within a migration, using SQLAlchemy's Table construct. It is the standard pattern for seeding reference data (lookup tables, initial roles, default categories) as part of the schema migration.

```python
# Inside upgrade() — seeding reference data after creating the roles table

from alembic import op
import sqlalchemy as sa

def upgrade() -> None:
    roles_table = op.create_table(
        "roles",
        # => op.create_table returns a Table object for immediate use
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(50), nullable=False, unique=True),
        sa.Column("description", sa.String(255), nullable=True),
    )
    # => roles_table is a SQLAlchemy Table object (not None)
    # => can be used directly with op.bulk_insert

    op.bulk_insert(
        roles_table,
        # => first argument: the Table object returned by create_table
        # => (or use sa.table("roles", ...) for tables created in previous revisions)
        [
            {"id": 1, "name": "admin", "description": "Full system access"},
            {"id": 2, "name": "manager", "description": "Department management access"},
            {"id": 3, "name": "user", "description": "Standard user access"},
            {"id": 4, "name": "readonly", "description": "Read-only access"},
        ],
        # => list of dicts; each dict is one row
        # => keys must match column names in the Table
        # => emits: INSERT INTO roles (id, name, description) VALUES (...), (...), ...
        # => all rows inserted in a single statement for efficiency
    )
    # => roles table now has 4 rows


def downgrade() -> None:
    op.drop_table("roles")
    # => DROP TABLE roles (also deletes the seed data)
```

For tables created in a previous revision (not in this migration):

```python
# Inserting into a table from a previous revision

def upgrade() -> None:
    roles_table = sa.table(
        "roles",
        # => sa.table(): lightweight Table reference for use in bulk_insert
        # => does not define full schema; only needs columns being inserted
        sa.column("name", sa.String),
        sa.column("description", sa.String),
    )
    op.bulk_insert(
        roles_table,
        [
            {"name": "superadmin", "description": "Super administrator"},
        ],
        # => id will be auto-generated by the database (autoincrement)
    )
```

**Key Takeaway**: Use `op.bulk_insert` with the Table object returned by `op.create_table` to seed data in the same migration as table creation; use `sa.table()` for lightweight references to tables from previous revisions.

**Why It Matters**: Seeding reference data in the same migration as table creation ensures the data and schema are deployed atomically. If seed data is inserted in a separate migration and that migration fails, the application is left with a reference table that has no rows, causing foreign key constraint failures or empty dropdown menus in production until the next deployment.

---

### Example 28: Multiple Operations in One Revision

A single revision can contain multiple `op.*` calls to group logically related schema changes into an atomic unit. All operations in a revision run inside a single transaction, so either all succeed or all roll back.

```python
# alembic/versions/abc999zz_add_audit_system.py

"""add audit system

Revision ID: abc999zz
Revises: xyz789ab
Create Date: 2026-03-27 15:00:00.000000

"""

from alembic import op
import sqlalchemy as sa

revision: str = "abc999zz"
down_revision: str | None = "xyz789ab"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Operation 1: Add created_by column to users
    op.add_column(
        "users",
        sa.Column("created_by", sa.String(255), nullable=False, server_default="system"),
        # => created_by VARCHAR(255) NOT NULL DEFAULT 'system'
    )
    # => alembic_version still at "xyz789ab" until entire upgrade() completes

    # Operation 2: Add updated_by column to users
    op.add_column(
        "users",
        sa.Column("updated_by", sa.String(255), nullable=False, server_default="system"),
        # => updated_by VARCHAR(255) NOT NULL DEFAULT 'system'
    )

    # Operation 3: Create audit_log table
    op.create_table(
        "audit_log",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("table_name", sa.String(100), nullable=False),
        sa.Column("operation", sa.String(10), nullable=False),
        # => operation VARCHAR(10): 'INSERT', 'UPDATE', 'DELETE'
        sa.Column("user_id", sa.Integer, nullable=True),
        sa.Column("changed_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    # Operation 4: Add index on audit_log for common queries
    op.create_index("ix_audit_log_table_name", "audit_log", ["table_name"])
    # => all four operations run in a single transaction
    # => if op.create_index fails, all three previous operations are rolled back
    # => alembic_version is updated to "abc999zz" only after ALL operations succeed


def downgrade() -> None:
    # Reverse operations in EXACT reverse order
    op.drop_index("ix_audit_log_table_name", table_name="audit_log")
    # => 4. drop index first (index depends on table)
    op.drop_table("audit_log")
    # => 3. drop table
    op.drop_column("users", "updated_by")
    # => 2. drop updated_by
    op.drop_column("users", "created_by")
    # => 1. drop created_by
    # => exact reverse of upgrade() order ensures no dependency errors
```

**Key Takeaway**: Group logically related DDL operations in a single revision for atomic deployment; always write `downgrade()` in exact reverse order of `upgrade()` to respect object dependency constraints.

**Why It Matters**: Splitting related changes into multiple revisions creates windows where the schema is in an inconsistent intermediate state, causing application errors during the deployment gap between migrations. A single revision ensures the audit system is fully set up or fully absent—never half-deployed. Reversing the order in `downgrade()` prevents "object depends on" errors when dropping tables that have indexes or when dropping columns before associated constraints.

---

### Example 29: alembic_version Table Structure

Alembic uses a single-row table called `alembic_version` to track which revision the database is currently at. Understanding this table helps diagnose migration state issues and supports manual recovery when needed.

```sql
-- The alembic_version table structure (auto-created by Alembic)
-- emitted SQL when Alembic first creates it:
-- CREATE TABLE alembic_version (
--     version_num VARCHAR(32) NOT NULL,   -- => stores the current revision ID
--     CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
-- )
-- => single-row table; only one version_num at a time (for linear history)
-- => multi-head setups can have multiple rows (one per head branch)
```

```python
# Understanding alembic_version state through Python

from sqlalchemy import create_engine, text

engine = create_engine("postgresql+psycopg2://user:pass@localhost/mydb")
# => create_engine: standard SQLAlchemy connection factory

with engine.connect() as conn:
    # Check current version
    result = conn.execute(text("SELECT version_num FROM alembic_version"))
    # => SELECT version_num FROM alembic_version
    row = result.fetchone()
    if row:
        print(f"Current version: {row[0]}")
        # => Output: Current version: abc999zz
        # => this is the revision ID of the most recently applied migration
    else:
        print("No migrations applied (base state)")
        # => alembic_version table exists but has no rows
        # => happens when alembic stamp base is run or table is empty

    # After alembic upgrade head, the table has exactly one row
    # => SELECT version_num FROM alembic_version => ('abc999zz',)

    # After alembic downgrade base, the row is deleted
    # => SELECT version_num FROM alembic_version => (empty result set)

# Manual version stamping (use when DB was migrated outside Alembic)
# alembic stamp abc999zz
# => does NOT run any migrations
# => just inserts/updates alembic_version to record "abc999zz" as current
# => use when: manually applying SQL, importing a dump that already has the schema

# alembic stamp head
# => marks the database as at the latest revision without running any migrations
# => useful for: new databases pre-populated with a schema dump
```

**Key Takeaway**: `alembic_version` contains exactly one row per revision head; use `alembic stamp <revision>` to manually set the version without running migrations, which is essential after restoring a database backup.

**Why It Matters**: Understanding `alembic_version` is essential for production incident recovery. When a DBA manually applies a hotfix SQL script to production, running `alembic upgrade head` afterward will try to apply the same changes again, causing duplicate object errors. Using `alembic stamp <revision>` after manual SQL application prevents this double-application problem and keeps Alembic's version tracking synchronized with the actual schema state.

---

### Example 30: Downgrade to Base

`alembic downgrade base` reverses all applied migrations by running `downgrade()` for every revision in reverse order, ending with no revisions applied. It is the nuclear rollback option that restores the database to its pre-Alembic state.

```bash
# Downgrade all migrations to base (empty state)
alembic downgrade base
# => "base" is a special alias meaning "before any revision"
# => calls downgrade() for EVERY applied revision in reverse order
# => example output for a database at revision "abc999zz" with chain abc123de -> abc999zz:
# => INFO  [alembic.runtime.migration] Running downgrade abc999zz -> xyz789ab, add audit system
# => INFO  [alembic.runtime.migration] Running downgrade xyz789ab -> def456gh, add products table
# => INFO  [alembic.runtime.migration] Running downgrade def456gh -> abc123de, add email index
# => INFO  [alembic.runtime.migration] Running downgrade abc123de -> , create users table
# => after completion: alembic_version row is deleted (or set to empty)

# Verify the database is at base
alembic current
# => (no output after INFO lines) — no current version
# => or: No current version.

# Downgrade to base then upgrade back to head (full reset workflow)
alembic downgrade base && alembic upgrade head
# => destroys and recreates all tables
# => useful in development for testing migration chain completeness
# => NEVER run in production unless intentionally wiping all data

# Preview the base downgrade SQL without executing
alembic downgrade base --sql
# => prints all DROP TABLE, DROP INDEX, DROP CONSTRAINT statements to stdout
# => safe to run; does not connect to the database in a destructive way
```

```python
# Programmatic downgrade to base (for test fixtures or CI teardown)

import subprocess

def reset_database() -> None:
    """Tear down all migrations and recreate from head (development/test use only)."""
    subprocess.run(
        ["alembic", "downgrade", "base"],
        # => runs: alembic downgrade base
        check=True,
        # => raises CalledProcessError if alembic exits with non-zero code
    )
    # => all tables dropped; alembic_version empty

    subprocess.run(
        ["alembic", "upgrade", "head"],
        # => runs: alembic upgrade head (re-applies all migrations)
        check=True,
    )
    # => all tables recreated; alembic_version at latest revision
    # => useful for: resetting test database between test suites
```

**Key Takeaway**: `alembic downgrade base` is the complete teardown command; use it in development and CI to test migration roundtrips, but never in production without a backup because it permanently destroys all data in all migrated tables.

**Why It Matters**: Testing the complete `upgrade -> downgrade base -> upgrade head` cycle in CI is the only reliable way to verify that all `downgrade()` functions are correct before a production incident requires rollback. Projects that skip this test discover broken `downgrade()` functions for the first time during production emergencies, when the database is in an intermediate state and every second of downtime costs money.
