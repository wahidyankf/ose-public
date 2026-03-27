---
title: "Advanced"
date: 2026-03-27T00:00:00+07:00
draft: false
weight: 10000003
description: "Python Alembic advanced tutorial with 25 annotated examples covering custom operations, async engines, zero-downtime patterns, CI/CD integration, and production best practices (75-95% coverage)"
tags: ["python-alembic", "tutorial", "by-example", "advanced", "zero-downtime", "async", "ci-cd", "production"]
---

## Advanced Examples (61-85)

**Coverage**: 75-95% of Alembic functionality

**Focus**: Custom migration operations, async engine integration, zero-downtime schema patterns, large table strategies, CI/CD pipeline integration, multi-database setups, advanced autogenerate customization, and production best practices.

These examples assume you understand beginner and intermediate concepts (initialization, DDL operations, batch mode, branching, autogenerate, custom types). All examples are self-contained and production-ready.

---

### Example 61: Custom Migration Operations (MigrateOperation)

Alembic's operation system is extensible. You can define custom `MigrateOperation` subclasses that integrate with the `--sql` offline mode, autogenerate diff system, and the standard `upgrade`/`downgrade` lifecycle.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
%% Custom operation registration flow
graph TD
    A[Define MigrateOperation subclass] -->|@Operations.register| B[Registered op directive]
    B -->|invoke directive| C[invoke_for_target]
    C -->|calls| D[Custom SQL / DDL]
    D -->|--sql mode| E[Rendered SQL string]
    D -->|online mode| F[Executed against DB]

    style A fill:#0173B2,stroke:#000000,color:#ffffff,stroke-width:2px
    style B fill:#DE8F05,stroke:#000000,color:#ffffff,stroke-width:2px
    style C fill:#029E73,stroke:#000000,color:#ffffff,stroke-width:2px
    style D fill:#CC78BC,stroke:#000000,color:#ffffff,stroke-width:2px
    style E fill:#CA9161,stroke:#000000,color:#ffffff,stroke-width:2px
    style F fill:#CA9161,stroke:#000000,color:#ffffff,stroke-width:2px
```

**Define and register the custom operation**:

```python
# myapp/alembic_ops.py
# Custom operation: creates a PostgreSQL "updated_at" trigger on a table

from alembic.operations import MigrateOperation, Operations


@Operations.register_operation("create_updated_at_trigger")
# => registers "op.create_updated_at_trigger(...)" as a usable directive
# => the string must match the method name used in migration files
class CreateUpdatedAtTriggerOp(MigrateOperation):
    """Create an updated_at trigger on a table."""

    def __init__(self, table_name: str, schema: str | None = None) -> None:
        self.table_name = table_name
        # => stores target table; used in SQL template below
        self.schema = schema
        # => optional schema prefix (e.g. "public"); None omits prefix

    @classmethod
    def create_updated_at_trigger(
        cls, operations: "Operations", table_name: str, **kw: object
    ) -> None:
        # => classmethod is the implementation called when op.create_updated_at_trigger() runs
        op = cls(table_name, **kw)
        # => instantiates the operation object
        return operations.invoke(op)
        # => invokes the registered invoke_for_target below


@Operations.implementation_for(CreateUpdatedAtTriggerOp)
# => registers the actual execution logic for the operation class
def invoke_create_updated_at_trigger(
    operations: Operations, operation: CreateUpdatedAtTriggerOp
) -> None:
    qualified = (
        f"{operation.schema}.{operation.table_name}"
        if operation.schema
        else operation.table_name
    )
    # => "public.users" or just "users" depending on schema
    operations.execute(
        f"""
        CREATE OR REPLACE FUNCTION set_updated_at()
        RETURNS TRIGGER LANGUAGE plpgsql AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$;
        CREATE TRIGGER trg_{operation.table_name}_updated_at
        BEFORE UPDATE ON {qualified}
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
        """
    )
    # => creates the trigger function + attaches it to the table
    # => CREATE OR REPLACE makes the function idempotent
```

**Use the custom operation in a migration file**:

```python
# alembic/versions/<rev>_add_updated_at_trigger.py
# Import the module to trigger op registration before Alembic runs
import myapp.alembic_ops  # noqa: F401
# => side-effect import: registers CreateUpdatedAtTriggerOp on Operations
# => must appear before any op.create_updated_at_trigger() call

from alembic import op


def upgrade() -> None:
    op.create_updated_at_trigger("users")
    # => executes the trigger function + CREATE TRIGGER SQL
    # => works in both online mode and --sql offline mode


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_users_updated_at ON users")
    # => removes the trigger; function may be shared, so leave it in place
    op.execute("DROP FUNCTION IF EXISTS set_updated_at CASCADE")
    # => remove function only if no other trigger uses it; CASCADE drops dependents
```

**Key Takeaway**: Subclass `MigrateOperation` and register with `@Operations.register_operation` to create reusable, `--sql`-compatible custom directives that appear in migration files like built-in ops.

**Why It Matters**: Database-specific constructs — triggers, row-level security policies, custom aggregate functions — are not representable by standard Alembic ops. Without custom operations, teams copy-paste raw `op.execute()` SQL fragments across dozens of migration files, which is untestable and breaks `--sql` offline mode. Wrapping them in registered operations provides a clean API, enables autogenerate integration, and makes the migration audit trail self-documenting.

---

### Example 62: Alembic with Async Engines (asyncio)

SQLAlchemy 1.4+ and 2.0 support async engines via `asyncpg`. Alembic's `env.py` can be written to run migrations with an async engine while still using the synchronous Alembic runner.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
%% Async migration flow
graph TD
    A[alembic upgrade head] -->|loads| B[env.py run_async_migrations]
    B -->|creates| C[AsyncEngine via create_async_engine]
    C -->|begins| D[AsyncConnection]
    D -->|run_sync callback| E[Alembic MigrationContext sync API]
    E -->|executes DDL| F[Database]

    style A fill:#0173B2,stroke:#000000,color:#ffffff,stroke-width:2px
    style B fill:#DE8F05,stroke:#000000,color:#ffffff,stroke-width:2px
    style C fill:#029E73,stroke:#000000,color:#ffffff,stroke-width:2px
    style D fill:#CC78BC,stroke:#000000,color:#ffffff,stroke-width:2px
    style E fill:#CA9161,stroke:#000000,color:#ffffff,stroke-width:2px
    style F fill:#0173B2,stroke:#000000,color:#ffffff,stroke-width:2px
```

```python
# alembic/env.py — async-compatible version
import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy.ext.asyncio import async_engine_from_config
from myapp.models import Base

config = context.config
# => reads alembic.ini; provides sqlalchemy.url and other settings

if config.config_file_name is not None:
    fileConfig(config.config_file_name)
    # => configure Python logging from alembic.ini [loggers] section

target_metadata = Base.metadata
# => wire autogenerate; set to None to disable autogenerate detection


def do_run_migrations(connection: object) -> None:
    # => synchronous callback passed to run_sync below
    # => Alembic's migration API is synchronous; run_sync bridges the gap
    context.configure(connection=connection, target_metadata=target_metadata)
    # => configures migration context with connection and model metadata
    with context.begin_transaction():
        context.run_migrations()
        # => applies all pending migrations inside a transaction


async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        # => reads [alembic] section from alembic.ini
        prefix="sqlalchemy.",
        # => strips "sqlalchemy." prefix to get engine kwargs
        poolclass=None,
        # => NullPool recommended for migration scripts to avoid connection leaks
    )
    # => connectable is an AsyncEngine instance

    async with connectable.connect() as connection:
        # => AsyncConnection context manager; auto-closes on exit
        await connection.run_sync(do_run_migrations)
        # => run_sync executes the synchronous callback with the underlying sync connection
        # => bridges async context to Alembic's synchronous migration runner

    await connectable.dispose()
    # => releases all connections back to the pool; important for short-lived scripts


def run_migrations_online() -> None:
    # => called by Alembic when running in "online" mode (not --sql)
    asyncio.run(run_async_migrations())
    # => asyncio.run creates a new event loop, runs coroutine, closes loop


if context.is_offline_mode():
    # => --sql flag was passed; generate SQL without connecting
    with context.begin_transaction():
        context.run_migrations()
else:
    run_migrations_online()
```

**Key Takeaway**: Use `async_engine_from_config` and `connection.run_sync(callback)` in `env.py` to run Alembic migrations through an async engine while keeping all migration logic synchronous.

**Why It Matters**: FastAPI and modern async Python applications configure only an async SQLAlchemy engine. Attempting to use a sync engine in an async application creates event loop conflicts and connection pool exhaustion. The `run_sync` bridge is the official SQLAlchemy pattern — it avoids running a second sync engine alongside the async one, which doubles connection pool overhead and diverges database URL configuration.

---

### Example 63: Zero-Downtime Column Addition

Adding a column to a live table requires care. On PostgreSQL, adding a nullable column with no default is instantaneous (no table rewrite). Adding a NOT NULL column with a default causes a table rewrite on older PostgreSQL versions.

```python
# alembic/versions/<rev>_add_avatar_url_zero_downtime.py
# Zero-downtime column addition: add nullable first, backfill, then add NOT NULL constraint

from alembic import op
import sqlalchemy as sa


def upgrade() -> None:
    # PHASE 1: Add column as nullable — instant on PostgreSQL (no table rewrite)
    op.add_column(
        "users",
        sa.Column("avatar_url", sa.String(500), nullable=True),
        # => nullable=True: no NOT NULL constraint; no table scan required
        # => PostgreSQL adds the column to the catalog only (O(1) metadata operation)
        # => existing rows get NULL for avatar_url — no row rewrites
    )
    # => safe to run with live traffic; no table lock held beyond metadata update


def downgrade() -> None:
    op.drop_column("users", "avatar_url")
    # => DROP COLUMN on PostgreSQL marks the column deleted in the catalog
    # => space reclaimed only on next VACUUM FULL; no immediate table rewrite
```

**Why a separate migration for NOT NULL** (run after backfill):

```python
# alembic/versions/<rev2>_add_avatar_url_not_null.py
# PHASE 2 (separate migration, run after data backfill):

from alembic import op
import sqlalchemy as sa


def upgrade() -> None:
    # Backfill default value for rows that are still NULL
    op.execute(
        "UPDATE users SET avatar_url = 'https://cdn.example.com/default.png' "
        "WHERE avatar_url IS NULL"
    )
    # => batch update; on large tables use Example 66 batched approach instead
    # => after this, every row has a non-NULL avatar_url

    op.alter_column(
        "users",
        "avatar_url",
        existing_type=sa.String(500),
        # => existing_type required so Alembic emits correct DDL
        nullable=False,
        # => adds NOT NULL constraint; PostgreSQL scans table to verify
        # => on PostgreSQL 12+ NOT VALID constraint can skip the scan (see Example 64)
    )


def downgrade() -> None:
    op.alter_column(
        "users",
        "avatar_url",
        existing_type=sa.String(500),
        nullable=True,
        # => removes NOT NULL constraint; instant catalog operation
    )
```

**Key Takeaway**: Split column addition into two migrations — nullable first (instant), then backfill + NOT NULL constraint — to avoid table rewrites that lock the table under live traffic.

**Why It Matters**: Adding a `NOT NULL` column with a `server_default` in a single migration causes PostgreSQL to rewrite the entire table, acquiring an `ACCESS EXCLUSIVE` lock for the duration. On a 100M-row table this can take minutes and block all reads and writes. The two-phase approach keeps each operation instant or bounded by write throughput, allowing zero-downtime deployments even on tables with heavy concurrent access.

---

### Example 64: Zero-Downtime Column Removal (3-Phase)

Removing a column safely from a live system requires three coordinated deployment phases because application code may still reference the column during the migration window.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
%% Three-phase column removal
graph TD
    A["Phase 1: Deploy app code<br/>ignore column in ORM"] -->|confirm deployed| B["Phase 2: Alembic drop column<br/>in migration"]
    B -->|confirm applied| C["Phase 3: Remove ignore<br/>annotation from ORM"]

    style A fill:#0173B2,stroke:#000000,color:#ffffff,stroke-width:2px
    style B fill:#DE8F05,stroke:#000000,color:#ffffff,stroke-width:2px
    style C fill:#029E73,stroke:#000000,color:#ffffff,stroke-width:2px
```

**Phase 1 — Make ORM ignore the column (deploy app first)**:

```python
# myapp/models.py — remove mapped_column to stop ORM referencing the column
import sqlalchemy as sa
from sqlalchemy.orm import DeclarativeBase, mapped_column, MappedColumn


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: MappedColumn[int] = mapped_column(primary_key=True)
    username: MappedColumn[str] = mapped_column(sa.String(100))
    # => legacy_notes column still exists in DB but is no longer mapped
    # => removing the mapped_column stops SQLAlchemy from SELECT/INSERT it
    # => deploy this version first; verify no code references legacy_notes
    # => old app instances (rolling deploy) still see the column — that is safe
```

**Phase 2 — Drop the column in Alembic (run after all app instances are updated)**:

```python
# alembic/versions/<rev>_drop_legacy_notes.py

from alembic import op
import sqlalchemy as sa


def upgrade() -> None:
    op.drop_column("users", "legacy_notes")
    # => PostgreSQL DROP COLUMN: marks column deleted in pg_attribute catalog
    # => operation is fast (catalog update only); no table rewrite
    # => takes brief ACCESS EXCLUSIVE lock; safe for most production tables


def downgrade() -> None:
    op.add_column(
        "users",
        sa.Column("legacy_notes", sa.Text, nullable=True),
        # => restore as nullable; data is permanently lost from upgrade
    )
```

**Key Takeaway**: Remove columns in three phases — ignore in ORM, drop in migration, clean up code — so no running application instance references the column during the drop.

**Why It Matters**: Dropping a column while old application instances are still running causes `UndefinedColumn` errors when those instances execute SELECT queries that reference the dropped column. The three-phase approach ensures all application code stops using the column before the schema changes. Skipping Phase 1 is the most common cause of downtime during database migrations in blue-green and rolling deployments.

---

### Example 65: Zero-Downtime Table Rename

PostgreSQL's `ALTER TABLE ... RENAME TO` acquires an `ACCESS EXCLUSIVE` lock but completes instantly. The challenge is keeping application code working across the rename window in rolling deployments.

```python
# alembic/versions/<rev>_rename_orders_to_purchase_orders.py
# Strategy: create a view with the old name pointing at the new table
# This lets old code continue working while new code uses the new name

from alembic import op


def upgrade() -> None:
    # Step 1: rename the real table
    op.rename_table("orders", "purchase_orders")
    # => SQL: ALTER TABLE orders RENAME TO purchase_orders
    # => instant metadata operation; brief ACCESS EXCLUSIVE lock
    # => foreign keys referencing "orders" are automatically updated by PostgreSQL

    # Step 2: create a compatibility view under the old name
    op.execute(
        """
        CREATE VIEW orders AS
        SELECT * FROM purchase_orders
        """
    )
    # => old application code reading from "orders" now hits the view
    # => INSERT/UPDATE via the view also works (simple single-table view)
    # => deploy new application code that uses "purchase_orders" while view is live
    # => drop the view (see next step) after all instances are updated


def downgrade() -> None:
    op.execute("DROP VIEW IF EXISTS orders")
    # => drop the compatibility view before renaming back
    op.rename_table("purchase_orders", "orders")
    # => restores original name; downgrade is safe only if no data was written
    # => to "purchase_orders" directly after the view was dropped
```

**Key Takeaway**: Pair `op.rename_table` with a compatibility view on the old name so rolling deployments see consistent schema; drop the view in a follow-up migration after all app instances use the new name.

**Why It Matters**: Table renames in rolling deployments cause `UndefinedTable` errors on old application instances mid-deploy. The compatibility view is the PostgreSQL-idiomatic solution — it requires no code changes to old instances and incurs zero query planning overhead. After all instances are updated, the view is dropped in a follow-up migration that can be deployed with no coordination required.

---

### Example 66: Large Table Migration with Batched Updates

Updating millions of rows in a single `UPDATE` statement holds a lock for the duration and bloats the write-ahead log. Batched updates process rows in chunks, keeping transactions short and avoiding WAL overflow.

```python
# alembic/versions/<rev>_backfill_user_tier.py
# Backfill new "tier" column for 50M users without a full-table lock

from alembic import op
import sqlalchemy as sa


def upgrade() -> None:
    # Phase 1: add the column as nullable (instant)
    op.add_column("users", sa.Column("tier", sa.String(20), nullable=True))
    # => adds column; no row rewrites; all existing rows get tier = NULL

    # Phase 2: batch UPDATE in chunks of 10,000 rows to avoid lock contention
    connection = op.get_bind()
    # => get_bind() returns the active Connection for the current migration
    # => use this connection for all SQL to stay in the same transaction context

    batch_size = 10_000
    # => tune based on row size and acceptable replication lag
    # => smaller batches: less WAL; larger batches: fewer round trips

    last_id = 0
    # => keyset pagination: more efficient than OFFSET for large tables
    while True:
        result = connection.execute(
            sa.text(
                """
                UPDATE users
                SET tier = CASE
                    WHEN total_spend >= 10000 THEN 'gold'
                    WHEN total_spend >= 1000  THEN 'silver'
                    ELSE 'bronze'
                END
                WHERE id > :last_id
                  AND tier IS NULL
                ORDER BY id
                LIMIT :batch_size
                RETURNING id
                """
            ),
            {"last_id": last_id, "batch_size": batch_size},
        )
        # => RETURNING id: retrieve IDs without a separate SELECT
        rows = result.fetchall()
        # => rows is a list of Row objects; each has positional index [0] for id

        if not rows:
            break
            # => no more NULL rows to update; exit loop

        last_id = rows[-1][0]
        # => advance keyset cursor to last processed id
        # => next iteration starts from the row after last_id

    # Phase 3: add NOT NULL constraint after backfill is complete
    op.alter_column("users", "tier", existing_type=sa.String(20), nullable=False)
    # => PostgreSQL verifies no NULL rows exist; scan is fast (all rows already set)


def downgrade() -> None:
    op.drop_column("users", "tier")
    # => drops column and all data; no batching needed for downgrade
```

**Key Takeaway**: Use keyset pagination (`WHERE id > :last_id ORDER BY id LIMIT :n`) to batch large backfills; `OFFSET`-based pagination degrades to O(n²) on large tables.

**Why It Matters**: A single `UPDATE users SET tier = ...` on a 50M-row table holds a `ROW EXCLUSIVE` lock for minutes, triggers massive WAL writes, and can cause replication lag spikes that break read replicas. Keyset-paginated batches keep each transaction under 100ms, respect connection pool limits, and can be interrupted and resumed — critical when running migrations during business hours in systems with strict SLA requirements.

---

### Example 67: Online Index Creation (CONCURRENTLY)

PostgreSQL's `CREATE INDEX CONCURRENTLY` builds an index without holding a lock that blocks reads or writes. Alembic's standard `op.create_index` uses the blocking form; you must use `op.execute` to call the concurrent variant.

```python
# alembic/versions/<rev>_create_orders_user_id_idx_concurrently.py
# Creates index without locking the orders table

from alembic import op


def upgrade() -> None:
    # CRITICAL: CREATE INDEX CONCURRENTLY cannot run inside a transaction.
    # Alembic wraps each migration in a transaction by default.
    # We must disable the transaction wrapping for this migration.
    op.execute("COMMIT")
    # => manually commit the Alembic transaction before the CONCURRENT index build
    # => after COMMIT, DDL runs outside a transaction — this is required by PostgreSQL

    op.execute(
        "CREATE INDEX CONCURRENTLY IF NOT EXISTS "
        "ix_orders_user_id ON orders (user_id)"
    )
    # => CONCURRENTLY: builds index in background; no ACCESS EXCLUSIVE lock
    # => table remains fully readable and writable during the build
    # => takes 2-3x longer than standard CREATE INDEX
    # => IF NOT EXISTS: idempotent; safe to re-run if migration was interrupted

    # DO NOT put any more operations after a CONCURRENTLY statement in the same migration.
    # Alembic will try to COMMIT again on exit and may error; keep this migration isolated.


def downgrade() -> None:
    op.execute("COMMIT")
    # => same pattern: exit transaction before DROP INDEX CONCURRENTLY
    op.execute("DROP INDEX CONCURRENTLY IF EXISTS ix_orders_user_id")
    # => drops index without locking; table remains accessible during removal
```

**Preferred alternative — disable transaction wrapping in env.py**:

```python
# alembic/env.py (online section)
context.configure(
    connection=connection,
    target_metadata=target_metadata,
    transaction_per_migration=False,
    # => disables automatic BEGIN/COMMIT wrapping per migration
    # => you manage transactions manually via op.execute("BEGIN") / op.execute("COMMIT")
)
```

**Key Takeaway**: Use `CREATE INDEX CONCURRENTLY` via `op.execute` for zero-downtime index creation; the migration must not run inside a transaction, so either manually `COMMIT` first or set `transaction_per_migration=False`.

**Why It Matters**: Standard `CREATE INDEX` on a busy 100M-row table holds an `ACCESS EXCLUSIVE` lock for the entire build duration — potentially 10+ minutes — blocking all queries. `CONCURRENTLY` eliminates this at the cost of a longer build time and two full table scans. Every index creation in a production system should use `CONCURRENTLY` unless the table is empty or the system is in maintenance mode.

---

### Example 68: Data Backfill Pattern

Data backfills run SQL inside migrations to populate new columns or transform existing data. The pattern uses `op.get_bind()` to access the active connection and `sa.text()` to write safe parameterized queries.

```python
# alembic/versions/<rev>_backfill_email_domain.py
# Extract domain from email into a new indexed column for fast domain filtering

from alembic import op
import sqlalchemy as sa


def upgrade() -> None:
    # Step 1: Add the new column
    op.add_column(
        "users",
        sa.Column("email_domain", sa.String(253), nullable=True),
        # => 253 is the max DNS label length; ample for all email domains
    )

    # Step 2: Backfill using SQL string function
    connection = op.get_bind()
    # => returns the live SQLAlchemy Connection for this migration's transaction
    connection.execute(
        sa.text(
            """
            UPDATE users
            SET email_domain = LOWER(SPLIT_PART(email, '@', 2))
            WHERE email_domain IS NULL
              AND email LIKE '%@%'
            """
        )
    )
    # => SPLIT_PART(email, '@', 2): extracts everything after '@'
    # => LOWER: normalise to lowercase for consistent comparison
    # => WHERE email LIKE '%@%': guard against malformed emails without '@'
    # => sa.text() wraps raw SQL; use :param notation for parameterized values

    # Step 3: Add index now that all rows have a value
    op.create_index("ix_users_email_domain", "users", ["email_domain"])
    # => standard (blocking) index; acceptable here because column was just added
    # => no existing queries depend on this index; table may be under low read pressure
    # => if the table is large and live, use CONCURRENTLY (see Example 67)


def downgrade() -> None:
    op.drop_index("ix_users_email_domain", table_name="users")
    # => drop index before dropping column (column drop cascades, but explicit is cleaner)
    op.drop_column("users", "email_domain")
    # => removes column and all backfilled data permanently
```

**Key Takeaway**: Run backfill SQL inside the migration using `op.get_bind()` and `sa.text()`; keep the transformation idempotent with a `WHERE column IS NULL` guard so it is safe to re-run.

**Why It Matters**: Running backfills as ad-hoc scripts outside migrations creates a synchronization problem — schema and data changes must be coordinated manually, and re-running the script on a fresh database for testing requires separate documentation. Embedding backfills in migrations makes schema and data changes atomic, reproducible, and testable, which is essential for reliable CI/CD pipelines and disaster recovery procedures.

---

### Example 69: Alembic in CI/CD Pipeline

A CI/CD pipeline should lint the migration, verify `upgrade` is idempotent, and confirm `downgrade` restores the schema. This example shows a GitHub Actions workflow that runs these checks on every pull request.

```yaml
# .github/workflows/migration-checks.yml
# Validates Alembic migrations on every PR that touches alembic/ or models

name: Migration Checks

on:
  pull_request:
    paths:
      - "alembic/**"
      - "myapp/models/**"
      # => only run when migration-related files change; skips unrelated PRs

jobs:
  migration-lint:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: testdb
          POSTGRES_USER: testuser
          POSTGRES_PASSWORD: testpass
        # => ephemeral PostgreSQL container for the duration of the job
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    env:
      DATABASE_URL: postgresql+psycopg2://testuser:testpass@localhost:5432/testdb

    steps:
      - uses: actions/checkout@v4
        # => checks out the PR branch

      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
          cache: "pip"
          # => cache pip dependencies for faster subsequent runs

      - run: pip install -e ".[dev]"
        # => installs project + dev dependencies (alembic, pytest, etc.)

      - name: Verify upgrade applies cleanly
        run: alembic upgrade head
        # => runs all migrations on the empty test DB
        # => fails if any migration has a syntax error or DDL mismatch

      - name: Verify downgrade restores base
        run: alembic downgrade base
        # => runs all downgrade() functions in reverse order
        # => confirms every migration is reversible

      - name: Verify upgrade is idempotent
        run: alembic upgrade head
        # => re-apply after full downgrade; confirms head is always reachable
        # => catches migrations that break after a downgrade+upgrade cycle

      - name: Check for uncommitted schema drift
        run: |
          alembic revision --autogenerate -m "drift_check"
          python -c "
          import sys, glob, re
          files = glob.glob('alembic/versions/*_drift_check.py')
          content = open(files[0]).read()
          if re.search(r'def upgrade.*?pass', content, re.DOTALL) is None:
              print('Schema drift detected: models differ from migrations')
              sys.exit(1)
          print('No schema drift')
          "
        # => generates a drift-check revision; exits non-zero if models diverged
        # => catches developers who modified models without creating a migration
```

**Key Takeaway**: Run `upgrade head → downgrade base → upgrade head` in CI to verify every migration applies cleanly, is reversible, and is idempotent; add autogenerate drift detection to catch model changes without migrations.

**Why It Matters**: Merging a migration that fails on a fresh database blocks every other developer and breaks staging deployments. CI catches these failures before merge at zero human cost. The drift check prevents the silent desync where models are updated but no migration is created — a common source of production incidents when a new environment is provisioned and the schema is out of sync with the codebase.

---

### Example 70: Migration Testing with pytest

Testing migrations with pytest validates that `upgrade` and `downgrade` functions behave correctly against a real (or in-memory) database without running the full application.

```python
# tests/test_migrations.py
# Requires: pytest, SQLAlchemy, alembic; uses SQLite for isolation

import pytest
import sqlalchemy as sa
from alembic.config import Config
from alembic import command


@pytest.fixture(scope="session")
def alembic_config(tmp_path_factory: pytest.TempPathFactory) -> Config:
    # => session-scoped: one DB per test session, not per test
    db_path = tmp_path_factory.mktemp("db") / "test.db"
    # => SQLite file in a temporary directory; each session gets a fresh DB
    cfg = Config("alembic.ini")
    # => load alembic.ini; inherits script_location and file_template
    cfg.set_main_option("sqlalchemy.url", f"sqlite:///{db_path}")
    # => override DB URL to point at the temp SQLite file
    return cfg


def test_upgrade_head_applies_cleanly(alembic_config: Config) -> None:
    command.upgrade(alembic_config, "head")
    # => runs all upgrade() functions in version order
    # => assertion: no exception raised means all DDL succeeded


def test_downgrade_base_reverts_cleanly(alembic_config: Config) -> None:
    command.upgrade(alembic_config, "head")
    # => ensure we are at head before downgrading
    command.downgrade(alembic_config, "base")
    # => runs all downgrade() functions in reverse order
    # => assertion: no exception = all downgrades succeeded


def test_schema_matches_models(alembic_config: Config) -> None:
    from myapp.models import Base
    from sqlalchemy import inspect

    command.upgrade(alembic_config, "head")
    # => apply all migrations to reach current schema

    engine = sa.create_engine(alembic_config.get_main_option("sqlalchemy.url"))
    # => create engine pointing at the same temp DB
    inspector = inspect(engine)
    # => inspect() returns an Inspector that queries information_schema

    migrated_tables = set(inspector.get_table_names())
    # => tables actually created by migrations
    model_tables = set(Base.metadata.tables.keys())
    # => tables defined in SQLAlchemy models

    assert migrated_tables == model_tables
    # => asserts no table was added to models without a corresponding migration
    # => and no migration created a table not in the models
```

**Key Takeaway**: Use pytest fixtures with a temporary SQLite/PostgreSQL URL to run `command.upgrade` and `command.downgrade` in isolated test runs that validate both the DDL and schema-model consistency.

**Why It Matters**: Migration tests catch errors that neither type checkers nor linters can detect: invalid SQL dialects, wrong column types, missing index names, or downgrade functions that reference objects not yet dropped. Running these tests in CI on every PR prevents broken migrations from reaching production where data loss from a failed rollback is irreversible.

---

### Example 71: Migration Rollback Testing

Rollback testing verifies that every `downgrade()` function correctly reverses its `upgrade()`. This is separate from the full `downgrade base` test — it tests each migration in isolation to pinpoint failures.

```python
# tests/test_migration_rollback.py
# Tests each migration's downgrade individually to isolate rollback failures

import pytest
import sqlalchemy as sa
from alembic.config import Config
from alembic import command
from alembic.script import ScriptDirectory


@pytest.fixture(scope="function")
def fresh_db_config(tmp_path: "pathlib.Path") -> Config:
    # => function-scoped: fresh DB for EACH test function
    # => isolation ensures one migration's failure does not affect others
    db_path = tmp_path / "rollback_test.db"
    cfg = Config("alembic.ini")
    cfg.set_main_option("sqlalchemy.url", f"sqlite:///{db_path}")
    return cfg


def get_all_revisions(cfg: Config) -> list[str]:
    script = ScriptDirectory.from_config(cfg)
    # => ScriptDirectory reads all revision files from versions/
    revisions = list(script.walk_revisions())
    # => walk_revisions() yields revisions in reverse order (head first)
    return [rev.revision for rev in reversed(revisions)]
    # => reversed: oldest revision first; matches upgrade order


@pytest.mark.parametrize("revision", get_all_revisions(Config("alembic.ini")))
def test_single_migration_rollback(fresh_db_config: Config, revision: str) -> None:
    # => parametrize creates one test case per revision ID
    # => e.g. test_single_migration_rollback[abc123de]

    command.upgrade(fresh_db_config, revision)
    # => apply migrations up to (and including) this revision
    # => verifies upgrade() for this revision applies cleanly

    command.downgrade(fresh_db_config, "-1")
    # => "-1" means "go back exactly one step" from current head
    # => calls downgrade() for just this revision
    # => verifies the migration is individually reversible

    command.upgrade(fresh_db_config, revision)
    # => re-apply after rollback: confirms upgrade is idempotent after a downgrade
    # => catches migrations that fail the second time (e.g., re-creating existing objects)
```

**Key Takeaway**: Parametrize rollback tests over `ScriptDirectory.walk_revisions()` to test each migration's `downgrade` individually; use `"-1"` as the downgrade target to step back exactly one revision.

**Why It Matters**: Full `downgrade base` tests tell you that rollback eventually succeeds but not which migration broke. Per-migration rollback tests pinpoint the exact failing revision, which reduces debugging time from hours to minutes. In systems where production rollbacks must complete within a SLA window, knowing in advance that every migration is individually reversible is a hard requirement.

---

### Example 72: Multi-Database Migrations (multidb Template)

Alembic's `multidb` template generates `env.py` and migration stubs that run against multiple database connections simultaneously, useful for sharded architectures or applications that manage multiple tenant databases.

```bash
# Initialize with the multidb template
alembic init --template multidb alembic
# => creates env.py configured for multiple engine connections
# => creates script.py.mako template with engine1_upgrade/engine2_upgrade stubs
# => creates alembic.ini with [engine1] and [engine2] sections
```

**env.py with multiple engines**:

```python
# alembic/env.py — multidb pattern (excerpt)
from alembic import context
from sqlalchemy import engine_from_config, pool
import myapp.models as models

# Map engine names to their metadata objects
db_configs = {
    "users_db": {
        "url": "postgresql+psycopg2://user:pass@users-host/users",
        "metadata": models.UserBase.metadata,
        # => UserBase.metadata contains only User-domain tables
    },
    "orders_db": {
        "url": "postgresql+psycopg2://user:pass@orders-host/orders",
        "metadata": models.OrderBase.metadata,
        # => OrderBase.metadata contains only Order-domain tables
    },
}


def run_migrations_online() -> None:
    engines = {
        name: engine_from_config(
            {"sqlalchemy.url": cfg["url"]},
            prefix="sqlalchemy.",
            poolclass=pool.NullPool,
            # => NullPool: no connection reuse; appropriate for migration scripts
        )
        for name, cfg in db_configs.items()
    }
    # => engines is a dict of {name: Engine}

    for name, engine in engines.items():
        with engine.connect() as connection:
            context.configure(
                connection=connection,
                target_metadata=db_configs[name]["metadata"],
                # => each engine uses its own metadata for autogenerate
            )
            with context.begin_transaction():
                context.run_migrations(engine_name=name)
                # => engine_name selects which upgrade_<name> function runs
                # => from the migration file's multidb stub
```

**Migration file generated by multidb template**:

```python
# alembic/versions/<rev>_add_indexes.py

from alembic import op
import sqlalchemy as sa


def upgrade(engine_name: str) -> None:
    # => engine_name passed by env.py; route to per-engine function
    globals()[f"upgrade_{engine_name}"]()
    # => dynamically calls upgrade_users_db() or upgrade_orders_db()


def upgrade_users_db() -> None:
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    # => applies to users_db only


def upgrade_orders_db() -> None:
    op.create_index("ix_orders_created_at", "orders", ["created_at"])
    # => applies to orders_db only


def downgrade(engine_name: str) -> None:
    globals()[f"downgrade_{engine_name}"]()
    # => same routing pattern as upgrade


def downgrade_users_db() -> None:
    op.drop_index("ix_users_email", table_name="users")


def downgrade_orders_db() -> None:
    op.drop_index("ix_orders_created_at", table_name="orders")
```

**Key Takeaway**: Use `alembic init --template multidb` and route `upgrade(engine_name)` calls to per-engine functions to run coordinated migrations across multiple databases from a single `alembic upgrade head`.

**Why It Matters**: Managing schema migrations for sharded or multi-tenant databases through separate Alembic instances duplicates version history and makes coordinated schema changes (adding a column to all shards simultaneously) error-prone. The multidb template keeps revision history unified while allowing per-database DDL, ensuring schema versions are always consistent across all databases in a single deployment.

---

### Example 73: Schema-Level Migrations

PostgreSQL schemas (namespaces) allow separating tables by domain within a single database. Alembic supports schema-qualified operations through the `schema` parameter on most `op.*` functions.

```python
# alembic/versions/<rev>_create_analytics_schema.py
# Creates the "analytics" schema and tables within it

from alembic import op
import sqlalchemy as sa


def upgrade() -> None:
    # Step 1: Create the schema (namespace)
    op.execute("CREATE SCHEMA IF NOT EXISTS analytics")
    # => creates analytics namespace; IF NOT EXISTS makes it idempotent
    # => schema owner is the current database user

    # Step 2: Create a table in the analytics schema
    op.create_table(
        "page_views",
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("path", sa.String(2000), nullable=False),
        sa.Column("user_id", sa.Integer, nullable=True),
        sa.Column("viewed_at", sa.DateTime(timezone=True), nullable=False),
        schema="analytics",
        # => schema= places the table in analytics.page_views
        # => without schema=, table goes into the search_path's first schema (usually public)
    )

    # Step 3: Create an index on the schema-qualified table
    op.create_index(
        "ix_page_views_viewed_at",
        "page_views",
        ["viewed_at"],
        schema="analytics",
        # => schema= must match the table's schema
    )

    # Step 4: Grant access to the application role
    op.execute("GRANT USAGE ON SCHEMA analytics TO app_role")
    op.execute("GRANT SELECT, INSERT ON analytics.page_views TO app_role")
    # => explicit GRANT; PostgreSQL does not grant access to new schemas by default


def downgrade() -> None:
    op.drop_index("ix_page_views_viewed_at", table_name="page_views", schema="analytics")
    op.drop_table("page_views", schema="analytics")
    # => schema= must match in downgrade to avoid "table not found" errors
    op.execute("DROP SCHEMA IF EXISTS analytics CASCADE")
    # => CASCADE drops all tables and objects inside the schema
    # => safe only in downgrade where the schema is being removed entirely
```

**Key Takeaway**: Pass `schema="schema_name"` to all `op.create_table`, `op.drop_table`, `op.create_index`, and `op.drop_index` calls to target schema-qualified tables; create the schema with `op.execute` before creating tables.

**Why It Matters**: PostgreSQL schemas are the recommended approach for separating concerns within a single database — analytics, audit, and application tables can live in separate schemas with independent access controls and easier `pg_dump` scoping. Alembic's `schema=` parameter provides first-class support without raw SQL, keeping migrations readable and refactorable when schemas need to be renamed or reorganized.

---

### Example 74: Custom Comparators for Autogenerate

Alembic's autogenerate system is extensible through `@comparators.dispatch_for` hooks. Custom comparators allow autogenerate to detect custom database objects — such as triggers, policies, or check constraints with server-side expressions.

```python
# myapp/alembic_comparators.py
# Teaches autogenerate to detect missing trigger functions

from alembic.autogenerate import comparators, renderers
from alembic.autogenerate.api import AutogenContext
import sqlalchemy as sa

# Import custom op from Example 61 (must be registered before use)
from myapp.alembic_ops import CreateUpdatedAtTriggerOp


@comparators.dispatch_for("schema")
# => registers this function to run during schema-level comparison
# => "schema" target: called once per autogenerate run with full schema context
def compare_trigger_functions(
    autogen_context: AutogenContext,
    upgrade_ops: object,
    schemas: list,
) -> None:
    connection = autogen_context.connection
    # => live database connection; use it to query catalog tables

    # Query existing trigger functions from the database
    existing = set(
        row[0]
        for row in connection.execute(
            sa.text(
                "SELECT routine_name FROM information_schema.routines "
                "WHERE routine_type = 'FUNCTION' "
                "  AND routine_schema = 'public' "
                "  AND routine_name LIKE 'set_%_updated_at'"
            )
        )
    )
    # => existing is a set of function names already in the DB

    # Compare against the expected functions declared in metadata
    expected = {"set_users_updated_at", "set_orders_updated_at"}
    # => in production, derive this from a registry, not a hardcoded set

    for missing_fn in expected - existing:
        table_name = missing_fn.replace("set_", "").replace("_updated_at", "")
        upgrade_ops.ops.append(CreateUpdatedAtTriggerOp(table_name))
        # => adds a CreateUpdatedAtTriggerOp to the upgrade list
        # => autogenerate will render this as op.create_updated_at_trigger(...)


@renderers.dispatch_for(CreateUpdatedAtTriggerOp)
# => registers the text renderer for CreateUpdatedAtTriggerOp
# => called when autogenerate writes the migration file
def render_create_trigger(autogen_context: AutogenContext, op: "CreateUpdatedAtTriggerOp") -> str:
    return f"op.create_updated_at_trigger({op.table_name!r})"
    # => returns the string that appears in the generated migration file
    # => must be a valid Python expression that calls the registered op directive
```

**Key Takeaway**: Register `@comparators.dispatch_for("schema")` to teach autogenerate about custom database objects, and `@renderers.dispatch_for(OpClass)` to control how those operations appear in generated migration files.

**Why It Matters**: Without custom comparators, autogenerate is blind to triggers, views, row-level security policies, and custom functions — running it on a database with these objects produces incomplete migrations. Teams that rely on autogenerate without extending it for their custom objects accumulate schema drift silently. The comparator system integrates custom objects into the standard autogenerate workflow, making drift detection comprehensive.

---

### Example 75: Version Locations (Multiple Directories)

Alembic supports splitting revision files across multiple directories using `version_locations`. This is useful in monorepos where different modules own their own migrations.

```ini
# alembic.ini — multi-directory version locations

[alembic]
script_location = alembic
# => alembic/ is still the environment directory (env.py, script.py.mako)

version_locations = alembic/versions myapp/users/migrations myapp/orders/migrations
# => space-separated list of directories where revision files can live
# => Alembic searches all directories for revision files
# => revision IDs must be globally unique across all directories

version_path_separator = os
# => "os" uses : on Unix, ; on Windows; use "space" for cross-platform config
```

**Creating a revision in a specific directory**:

```bash
# Create a revision in the users module's migration directory
alembic revision -m "add_user_preferences" --version-path myapp/users/migrations
# => creates myapp/users/migrations/<rev>_add_user_preferences.py
# => revision file lives next to the models it migrates
# => alembic history and alembic upgrade head still work globally

# Create a revision with a dependency on another branch
alembic revision -m "add_order_fulfillment" \
    --version-path myapp/orders/migrations \
    --depends-on e5f6a7b8c9d0
# => --depends-on: ensures the specified migration runs before this one
# => creates an explicit dependency in the revision's down_revision tuple
```

**Revision file with cross-module dependency**:

```python
# myapp/orders/migrations/<rev>_add_order_fulfillment.py

revision = "ff4a1b2c3d4e"
down_revision = ("e5f6a7b8c9d0",)
# => tuple syntax: multiple down_revisions create a merge point
# => Alembic resolves the correct application order from the dependency graph
branch_labels = None
depends_on = "cc1122334455"
# => explicit depends_on: this revision cannot run before cc1122334455

from alembic import op
import sqlalchemy as sa


def upgrade() -> None:
    op.add_column(
        "orders",
        sa.Column("fulfillment_status", sa.String(50), nullable=True),
    )
    # => adds column to orders table; managed by orders module


def downgrade() -> None:
    op.drop_column("orders", "fulfillment_status")
```

**Key Takeaway**: Set `version_locations` to a space-separated list of directories in `alembic.ini` to distribute revision files across modules; use `--version-path` when creating revisions to place them in the correct directory.

**Why It Matters**: In monorepos where 10+ modules share one database, placing all migrations in a single `versions/` directory creates merge conflicts and obscures which module owns which migration. Per-module migration directories give clear ownership, enable module-level code reviews, and allow a module to be extracted into a separate service without migration archaeology.

---

### Example 76: Post-Migration Hooks

Post-migration hooks run custom code immediately after each migration completes. Common uses include cache invalidation, audit logging, and notification of external systems.

```python
# alembic/env.py — adding a post-migration hook

from alembic import context
from alembic.runtime.migration import MigrationContext
import logging

logger = logging.getLogger("alembic.hooks")


def on_version_apply(
    ctx: MigrationContext,
    step: object,
    heads: frozenset,
    run_args: dict,
) -> None:
    # => called by Alembic after each individual migration step is applied
    # => ctx: the MigrationContext (connection, dialect, etc.)
    # => step: the migration step that was just applied
    # => heads: the new set of head revisions after this step
    # => run_args: the kwargs passed to run_migrations()

    direction = "upgrade" if run_args.get("upgrade") else "downgrade"
    # => determine direction from run_args
    rev = step.up_revision if direction == "upgrade" else step.down_revision
    # => get the revision ID that was just applied

    logger.info("Migration applied: %s (%s)", rev, direction)
    # => structured log line for monitoring; include in alerting pipeline

    # Example: invalidate application cache after schema change
    try:
        import redis
        r = redis.Redis.from_url("redis://localhost:6379/0")
        r.delete("schema_version_cache")
        # => invalidate any cached schema metadata
        logger.info("Cache invalidated after migration %s", rev)
    except Exception as exc:
        logger.warning("Cache invalidation failed (non-fatal): %s", exc)
        # => non-fatal: migration succeeded; cache miss is acceptable


def run_migrations_online() -> None:
    from sqlalchemy import engine_from_config, pool

    config = context.config
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=None,
            on_version_apply=on_version_apply,
            # => register the hook; called after each migration step
        )
        with context.begin_transaction():
            context.run_migrations()
```

**Key Takeaway**: Pass `on_version_apply=callback` to `context.configure()` to register a function that fires after each migration step; use it for audit logging, cache invalidation, or metric emission.

**Why It Matters**: Production systems often need to record a migration audit trail in a separate system (Datadog, PagerDuty, an audit database), invalidate caches that hold stale schema metadata, or trigger post-migration verification jobs. Embedding this logic in `on_version_apply` keeps it decoupled from individual migration files and ensures every migration — past and future — triggers the hook without requiring changes to each revision.

---

### Example 77: Migration Squashing Pattern

When a migration chain grows to hundreds of revisions, applying all of them from scratch (e.g., provisioning a new environment) becomes slow. Squashing collapses many revisions into one while preserving history.

```python
# alembic/versions/0000_squashed_baseline.py
# Squash migration: represents the full schema as of 100 prior revisions
# New environments apply only this migration; existing environments skip it.

from alembic import op
import sqlalchemy as sa

revision = "0000_squashed_baseline"
# => convention: use a memorable identifier for squash revisions
down_revision = None
# => None: this becomes the new base; no prior history in this chain
branch_labels = ("squashed",)
# => label allows selective upgrade: alembic upgrade squashed@head

depends_on = None


def upgrade() -> None:
    # Recreate the full schema from scratch — equivalent to all prior migrations
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("username", sa.String(100), nullable=False, unique=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("email_domain", sa.String(253), nullable=True),
        sa.Column("tier", sa.String(20), nullable=False, server_default="bronze"),
        sa.Column("avatar_url", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    # => full schema definition; equivalent to applying all prior migrations

    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_email_domain", "users", ["email_domain"])
    op.create_index("ix_users_tier", "users", ["tier"])
    # => all indexes recreated in one migration for fast new-environment provisioning


def downgrade() -> None:
    op.drop_table("users")
    # => squash baseline downgrade drops the full schema
    # => only valid when reverting from a squashed install, not from a partial upgrade
```

**Connecting new migrations to the squashed baseline**:

```python
# alembic/versions/<new_rev>_add_user_settings.py
# New migration built on top of the squash

revision = "abc999newfeature"
down_revision = ("0000_squashed_baseline", "abc123_last_legacy_revision")
# => tuple down_revision: creates a merge point
# => existing envs: down_revision points to abc123 (already applied)
# => new envs: down_revision points to squashed baseline
# => alembic upgrade head works for both paths
```

**Key Takeaway**: Create a squash revision with `down_revision = None` that recreates the full schema from scratch, then use a merge revision with a tuple `down_revision` to connect it to the legacy chain so both new and existing environments reach `head`.

**Why It Matters**: A 500-revision migration chain takes minutes to apply on a fresh environment and is fragile — old migrations may reference dropped helpers or deleted models. Squashing reduces provisioning to a single migration while keeping the revision history intact in the git repository for compliance and debugging purposes.

---

### Example 78: Blue-Green Deployment Migrations

Blue-green deployments run two identical environments simultaneously during a switch. The schema must be forward-compatible (works with both old and new application code) throughout the deployment.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
%% Blue-green migration sequence
graph TD
    A["Blue env #40;v1 app#41;<br/>Schema v1"] -->|apply forward-compat migration| B["Schema v1+compat"]
    B -->|switch traffic to green| C["Green env #40;v2 app#41;<br/>Schema v1+compat"]
    C -->|cleanup migration after blue drains| D["Schema v2 #40;clean#41;"]

    style A fill:#0173B2,stroke:#000000,color:#ffffff,stroke-width:2px
    style B fill:#DE8F05,stroke:#000000,color:#ffffff,stroke-width:2px
    style C fill:#029E73,stroke:#000000,color:#ffffff,stroke-width:2px
    style D fill:#CC78BC,stroke:#000000,color:#ffffff,stroke-width:2px
```

**Migration 1 — forward-compatible change (apply before traffic switch)**:

```python
# alembic/versions/<rev1>_forward_compat_rename_status.py
# Rename users.status -> users.account_status (forward-compatible phase)

from alembic import op
import sqlalchemy as sa


def upgrade() -> None:
    # Add new column (keeps old column for v1 app compatibility)
    op.add_column(
        "users",
        sa.Column("account_status", sa.String(50), nullable=True),
        # => new name that v2 app will use
    )
    op.execute("UPDATE users SET account_status = status")
    # => backfill: copy all existing values to new column
    # => v1 app writes to "status"; v2 app writes to "account_status"
    # => a DB trigger keeps both columns in sync during the transition window
    op.execute(
        """
        CREATE OR REPLACE FUNCTION sync_status_columns()
        RETURNS TRIGGER LANGUAGE plpgsql AS $$
        BEGIN
            IF TG_OP = 'UPDATE' THEN
                IF NEW.status IS DISTINCT FROM OLD.status THEN
                    NEW.account_status := NEW.status;
                ELSIF NEW.account_status IS DISTINCT FROM OLD.account_status THEN
                    NEW.status := NEW.account_status;
                END IF;
            END IF;
            RETURN NEW;
        END;
        $$;
        CREATE TRIGGER trg_sync_status
        BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION sync_status_columns();
        """
    )
    # => trigger keeps both columns in sync during the transition window


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_sync_status ON users")
    op.execute("DROP FUNCTION IF EXISTS sync_status_columns CASCADE")
    op.drop_column("users", "account_status")
    # => removes forward-compat structures; reverts to schema v1
```

**Migration 2 — cleanup (apply after v1 is fully drained)**:

```python
# alembic/versions/<rev2>_cleanup_old_status.py
# Drop old column and sync trigger after all v1 instances are gone

from alembic import op
import sqlalchemy as sa


def upgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_sync_status ON users")
    op.execute("DROP FUNCTION IF EXISTS sync_status_columns CASCADE")
    # => trigger no longer needed; only v2 app is running
    op.alter_column("users", "account_status", nullable=False)
    # => enforce NOT NULL now that all rows have a value
    op.drop_column("users", "status")
    # => remove the old column; v1 app is gone, no code references it


def downgrade() -> None:
    op.add_column("users", sa.Column("status", sa.String(50), nullable=True))
    op.execute("UPDATE users SET status = account_status")
    op.alter_column("users", "account_status", nullable=True)
```

**Key Takeaway**: In blue-green deployments, split schema changes into two migrations — a forward-compatible expansion (add + sync) applied before the traffic switch, and a cleanup (drop old) applied after the old environment drains.

**Why It Matters**: Running a breaking schema change (rename column) during a blue-green switch causes the old environment to immediately throw `UndefinedColumn` errors. The expand-then-contract pattern with a sync trigger allows both environments to operate simultaneously using their preferred column name, with zero data loss and zero application errors during the switch window.

---

### Example 79: Feature Flag Migration Pattern

Feature flag migrations add new schema objects only when the corresponding feature flag is enabled. This decouples schema deployment from feature activation, allowing the schema to be pre-deployed to production before the feature is turned on.

```python
# alembic/versions/<rev>_add_recommendations_table.py
# Schema only deployed when ENABLE_RECOMMENDATIONS feature flag is set

from alembic import op
import sqlalchemy as sa
import os


def _feature_enabled() -> bool:
    return os.environ.get("ENABLE_RECOMMENDATIONS", "false").lower() == "true"
    # => reads environment variable; defaults to disabled
    # => CI/CD sets this to "true" only when deploying the feature branch


def upgrade() -> None:
    if not _feature_enabled():
        # => skip schema creation when feature is disabled
        # => migration is recorded in alembic_version but performs no DDL
        return

    op.create_table(
        "recommendations",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("product_id", sa.Integer, nullable=False),
        sa.Column("score", sa.Float, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    # => created only when ENABLE_RECOMMENDATIONS=true
    op.create_index("ix_recommendations_user_id", "recommendations", ["user_id"])


def downgrade() -> None:
    if not _feature_enabled():
        return
        # => no-op downgrade when flag is disabled (nothing was created)

    op.drop_index("ix_recommendations_user_id", table_name="recommendations")
    op.drop_table("recommendations")
    # => removes schema objects when reverting feature deployment
```

**Key Takeaway**: Guard schema creation with an environment variable check in `upgrade()` to allow pre-deploying migrations to production without activating the feature; the migration is recorded in `alembic_version` regardless.

**Why It Matters**: Pre-deploying schema changes ahead of feature activation reduces deployment risk — the most dangerous migration (creating a large table, adding a constraint) runs during a low-traffic maintenance window, and the feature activation is a configuration change with instant rollback. This decoupling is standard practice in high-availability systems where schema migrations and feature releases must be independently controlled.

---

### Example 80: Multi-Tenant Schema Migration

In schema-per-tenant multi-tenancy, each tenant has their own PostgreSQL schema. Alembic is run once per tenant schema to apply migrations across all tenants.

```python
# myapp/tenant_migrate.py
# Applies Alembic migrations to all tenant schemas

from alembic.config import Config
from alembic import command
import sqlalchemy as sa

DATABASE_URL = "postgresql+psycopg2://app:pass@db/tenants"


def get_tenant_schemas(engine: sa.Engine) -> list:
    with engine.connect() as conn:
        result = conn.execute(
            sa.text(
                "SELECT schema_name FROM information_schema.schemata "
                "WHERE schema_name LIKE 'tenant_%' "
                "ORDER BY schema_name"
            )
        )
        # => list all tenant schemas; naming convention: "tenant_<id>"
        return [row[0] for row in result]
        # => returns ["tenant_001", "tenant_002", ...]


def migrate_tenant(schema: str) -> None:
    cfg = Config("alembic.ini")
    # => load base Alembic config
    cfg.set_main_option("sqlalchemy.url", DATABASE_URL)
    # => use shared database URL; schema is set via search_path

    cfg.set_section_option(
        "alembic",
        "sqlalchemy.url",
        f"{DATABASE_URL}?options=-csearch_path%3D{schema}",
        # => set PostgreSQL search_path to this tenant's schema
        # => %3D is URL-encoded "="; required for the options= parameter
        # => all unqualified table names resolve to tenant_XXX.table_name
    )
    cfg.attributes["schema_name"] = schema
    # => pass schema name to env.py via attributes dict (accessible in env.py)

    command.upgrade(cfg, "head")
    # => runs all pending migrations against this tenant's schema
    # => alembic_version table is created per-schema (tenant_001.alembic_version)


def migrate_all_tenants() -> None:
    engine = sa.create_engine(DATABASE_URL)
    schemas = get_tenant_schemas(engine)
    # => discover all tenant schemas dynamically

    for schema in schemas:
        print(f"Migrating {schema}...")
        migrate_tenant(schema)
        # => sequential migration; use concurrent.futures.ThreadPoolExecutor for parallelism
        # => sequential is safer for large schema changes that hold locks

    print(f"Migrated {len(schemas)} tenant schemas")
    # => summary; add structured logging for production


if __name__ == "__main__":
    migrate_all_tenants()
    # => run as: python -m myapp.tenant_migrate
```

**Key Takeaway**: Run `command.upgrade(cfg, "head")` once per tenant schema by overriding `sqlalchemy.url` with `?options=-csearch_path%3D{schema}` to direct unqualified table operations to the correct schema.

**Why It Matters**: Schema-per-tenant provides the strongest tenant isolation — each tenant's data is in its own namespace with independent backup, restore, and access control. The per-tenant migration pattern ensures all tenants stay on the same schema version while allowing tenant-specific migration schedules (e.g., enterprise tenants get schema changes applied in a dedicated maintenance window).

---

### Example 81: Migration with pgcrypto Encryption

Adding encrypted columns requires enabling the `pgcrypto` PostgreSQL extension and writing migrations that use `pgp_sym_encrypt` for existing data. This pattern shows how to introduce column encryption safely.

```python
# alembic/versions/<rev>_encrypt_ssn_column.py
# Encrypts the existing plaintext ssn column using pgcrypto symmetric encryption

from alembic import op
import sqlalchemy as sa


def upgrade() -> None:
    # Step 1: ensure pgcrypto extension is available
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")
    # => pgcrypto provides pgp_sym_encrypt / pgp_sym_decrypt
    # => IF NOT EXISTS: idempotent; safe on databases where it is already installed
    # => requires PostgreSQL superuser or rds_superuser on AWS RDS

    # Step 2: add the encrypted column alongside the plaintext one
    op.add_column(
        "patients",
        sa.Column("ssn_encrypted", sa.LargeBinary, nullable=True),
        # => LargeBinary maps to BYTEA; pgcrypto output is binary
    )

    # Step 3: encrypt existing plaintext data
    connection = op.get_bind()
    connection.execute(
        sa.text(
            """
            UPDATE patients
            SET ssn_encrypted = pgp_sym_encrypt(
                ssn,
                current_setting('app.encryption_key')
            )
            WHERE ssn IS NOT NULL
            """
        )
    )
    # => current_setting('app.encryption_key'): reads encryption key from DB session setting
    # => set in app connection setup: SET app.encryption_key = 'secret'
    # => never hardcode keys in migration files — they are checked into git

    # Step 4: drop the plaintext column after encrypting all rows
    op.drop_column("patients", "ssn")
    # => removes plaintext column permanently
    # => verify encryption is correct before this step in a staging run

    # Step 5: rename encrypted column to canonical name
    op.alter_column("patients", "ssn_encrypted", new_column_name="ssn")
    # => restores the "ssn" name; application code needs no changes
    # => application must now use pgp_sym_decrypt(ssn, key) to read values


def downgrade() -> None:
    # Decrypting back to plaintext is a deliberate security downgrade
    # This migration intentionally has no downgrade to prevent accidental data exposure
    raise NotImplementedError(
        "Encryption migration cannot be reversed automatically. "
        "Manual data recovery required with access to the encryption key."
    )
    # => raising NotImplementedError in downgrade documents the intentional decision
    # => prevents accidental alembic downgrade from exposing sensitive data
```

**Key Takeaway**: Use `pgp_sym_encrypt` via `op.execute` to encrypt existing data during migration, store the encryption key via `current_setting` (never hardcoded), and raise `NotImplementedError` in `downgrade` to prevent accidental data exposure.

**Why It Matters**: Data encryption at the column level is a hard compliance requirement for PII (SSN, credit card numbers, medical records) in HIPAA, PCI-DSS, and GDPR-regulated systems. Performing the encryption inside a migration ensures it runs atomically — no row is left unencrypted after the migration completes. Using `current_setting` for the key keeps the key out of the git history while still being testable via session variables in CI.

---

### Example 82: Audit Trail Table Migration

Audit trail tables record every change to sensitive data — who changed it, when, and what the previous value was. This migration creates the audit infrastructure using a trigger-based approach.

```python
# alembic/versions/<rev>_add_audit_trail.py
# Creates audit_log table and trigger for the users table

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


def upgrade() -> None:
    # Step 1: create the audit log table
    op.create_table(
        "audit_log",
        sa.Column("id", sa.BigInteger, primary_key=True, autoincrement=True),
        sa.Column("table_name", sa.String(100), nullable=False),
        # => which table was changed
        sa.Column("record_id", sa.Integer, nullable=False),
        # => primary key of the changed row
        sa.Column("operation", sa.String(10), nullable=False),
        # => INSERT, UPDATE, or DELETE
        sa.Column("old_values", postgresql.JSONB, nullable=True),
        # => previous row values as JSONB; NULL for INSERT
        sa.Column("new_values", postgresql.JSONB, nullable=True),
        # => new row values as JSONB; NULL for DELETE
        sa.Column("changed_by", sa.String(255), nullable=True),
        # => application user identifier (set via SET app.current_user = '...')
        sa.Column(
            "changed_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    # => audit_log is append-only; never UPDATE or DELETE rows

    op.create_index("ix_audit_log_table_record", "audit_log", ["table_name", "record_id"])
    # => composite index for fast lookup by table + record ID

    # Step 2: create the audit trigger function (generic, reusable)
    op.execute(
        """
        CREATE OR REPLACE FUNCTION record_audit_log()
        RETURNS TRIGGER LANGUAGE plpgsql AS $$
        BEGIN
            INSERT INTO audit_log (table_name, record_id, operation, old_values, new_values, changed_by)
            VALUES (
                TG_TABLE_NAME,
                COALESCE(NEW.id, OLD.id),
                TG_OP,
                CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD)::jsonb ELSE NULL END,
                CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW)::jsonb ELSE NULL END,
                current_setting('app.current_user', true)
            );
            RETURN NEW;
        END;
        $$;
        """
    )
    # => TG_TABLE_NAME: name of the table that fired the trigger (dynamic)
    # => row_to_json: converts row to JSON; ::jsonb casts to JSONB for indexing
    # => current_setting('app.current_user', true): second arg "true" = no error if unset

    # Step 3: attach trigger to the users table
    op.execute(
        """
        CREATE TRIGGER trg_users_audit
        AFTER INSERT OR UPDATE OR DELETE ON users
        FOR EACH ROW EXECUTE FUNCTION record_audit_log()
        """
    )
    # => AFTER trigger: fires after the row change; OLD/NEW are available


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_users_audit ON users")
    op.execute("DROP FUNCTION IF EXISTS record_audit_log CASCADE")
    op.drop_index("ix_audit_log_table_record", table_name="audit_log")
    op.drop_table("audit_log")
    # => reverse order: triggers before functions before tables
```

**Key Takeaway**: Create a generic `record_audit_log` trigger function using `TG_TABLE_NAME` and `row_to_json` so a single function can be attached to multiple tables, with `current_setting('app.current_user', true)` for actor tracking.

**Why It Matters**: Regulatory requirements (SOX, HIPAA, GDPR) mandate an immutable audit trail for all changes to sensitive data. Trigger-based auditing captures changes at the database level regardless of which application component makes the change — bypassing an ORM, running a bulk update script, or a DBA making a direct change are all captured. JSONB storage of old/new values enables diff queries and point-in-time reconstruction without schema coupling.

---

### Example 83: Soft Delete Schema Pattern

Soft delete marks rows as deleted rather than physically removing them, enabling undo, audit trails, and referential integrity. This migration adds the infrastructure columns and a partial index for efficient active-record queries.

```python
# alembic/versions/<rev>_add_soft_delete_to_products.py
# Adds soft-delete columns and filtered index to the products table

from alembic import op
import sqlalchemy as sa


def upgrade() -> None:
    # Step 1: add the deleted_at timestamp column
    op.add_column(
        "products",
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        # => NULL means the row is active; non-NULL means soft-deleted
        # => timezone=True stores UTC timestamp of deletion
    )

    # Step 2: add deleted_by for audit accountability
    op.add_column(
        "products",
        sa.Column("deleted_by", sa.String(255), nullable=True),
        # => records which user/process performed the soft delete
        # => NULL for active rows; set by application layer on deletion
    )

    # Step 3: create a partial index covering only active rows
    op.execute(
        """
        CREATE INDEX ix_products_active
        ON products (name, price)
        WHERE deleted_at IS NULL
        """
    )
    # => partial index: only indexes rows where deleted_at IS NULL (active rows)
    # => dramatically smaller index than full-table; most queries filter on active rows
    # => standard op.create_index does not support WHERE clause; use op.execute

    # Step 4: create a separate index for querying deleted rows
    op.execute(
        """
        CREATE INDEX ix_products_deleted
        ON products (deleted_at)
        WHERE deleted_at IS NOT NULL
        """
    )
    # => covers admin queries like "show all products deleted in last 30 days"
    # => partial index includes only the relatively small set of deleted rows


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_products_deleted")
    op.execute("DROP INDEX IF EXISTS ix_products_active")
    # => drop partial indexes first (op.drop_index requires matching index name + table)
    op.drop_column("products", "deleted_by")
    op.drop_column("products", "deleted_at")
    # => dropping the columns physically restores hard-delete behavior
```

**Key Takeaway**: Use a nullable `deleted_at` timestamp column combined with a partial index `WHERE deleted_at IS NULL` for efficient soft-delete; use `op.execute` for `CREATE INDEX ... WHERE` since `op.create_index` does not expose the partial index predicate.

**Why It Matters**: Physical deletes are irreversible and break foreign key references from audit logs and related records. Soft delete preserves relational integrity and enables undo functionality, compliance archiving, and data recovery. Partial indexes ensure that the common case — querying only active records — remains as fast as a table with no deleted rows, avoiding the performance penalty that makes teams avoid soft delete in high-write systems.

---

### Example 84: Production Migration Checklist Pattern

A production migration checklist codifies the steps required to safely run a migration in production. This pattern embeds the checklist as Python comments in a migration template.

```mako
<%doc>
alembic/script.py.mako — customized template with production checklist
Replace the default script.py.mako with this to embed the checklist in every revision
</%doc>
<%!
import re
%>"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}

## Production Migration Checklist

### Pre-Migration (before running upgrade)
- [ ] Migration tested on staging with production data volume
- [ ] Estimated lock duration measured on staging (acceptable < 500ms for non-CONCURRENTLY)
- [ ] Rollback plan documented: alembic downgrade ${down_revision | comma,n}
- [ ] Autogenerate drift check run: no unexpected DROP operations
- [ ] No foreign key drops without verifying dependent tables are empty or handled
- [ ] If adding NOT NULL: all rows backfilled before applying constraint

### During Migration
- [ ] Monitor pg_stat_activity for long-running queries (cancel if blocking > 30s)
- [ ] Monitor replication lag: alert if > 60s during migration
- [ ] Confirm alembic_version row updated after upgrade

### Post-Migration
- [ ] Schema diff verified: alembic revision --autogenerate -m check shows no diff
- [ ] Application health checks green
- [ ] Rollback window open for 30 minutes post-deployment
- [ ] Alembic history recorded in deployment log
"""
# revision identifiers, used by Alembic.
revision = ${repr(up_revision)}
down_revision = ${repr(down_revision)}
branch_labels = ${repr(branch_labels)}
depends_on = ${repr(depends_on)}

from alembic import op
import sqlalchemy as sa
${imports if imports else ""}

def upgrade() -> None:
    ${upgrades if upgrades else "pass"}


def downgrade() -> None:
    ${downgrades if downgrades else "pass"}
```

**Verify the template is active**:

```bash
# After updating script.py.mako, generate a new revision to confirm the template renders
alembic revision -m "test_checklist_template"
# => opens the new file; it should contain the checklist in the docstring
# => delete this test revision file after confirming the template works

# Preview the first 40 lines of the generated file
head -40 alembic/versions/*_test_checklist_template.py
# => should display the checklist headers and bullet points
```

**Key Takeaway**: Customize `alembic/script.py.mako` to embed a production checklist in every new revision file's docstring, ensuring every migration goes through the same review steps before production deployment.

**Why It Matters**: Production migration failures follow predictable patterns — missing backfill before NOT NULL, failing to estimate lock duration, no rollback plan. Embedding the checklist in the migration file keeps it at the point of decision (the pull request), not in a separate runbook that developers skip under time pressure. The Mako template approach requires no external tooling and appears automatically in every new migration.

---

### Example 85: Migration Monitoring with FastAPI Integration

Exposing Alembic migration status through a FastAPI health endpoint enables infrastructure monitoring tools to detect schema drift and validate deployment completeness.

```python
# myapp/routers/health.py
# Health endpoint that exposes Alembic migration status for monitoring

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import sqlalchemy as sa
from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from myapp.database import engine

router = APIRouter(prefix="/health", tags=["health"])


class MigrationStatus(BaseModel):
    current_revision: str | None
    # => the revision ID currently applied to the database
    head_revision: str | None
    # => the latest revision ID in the codebase
    is_up_to_date: bool
    # => True when current == head; False means migrations are pending
    pending_count: int
    # => number of migrations between current and head


@router.get("/migrations", response_model=MigrationStatus)
def migration_health() -> MigrationStatus:
    cfg = Config("alembic.ini")
    # => load alembic config; script_location must be set correctly
    script = ScriptDirectory.from_config(cfg)
    # => ScriptDirectory reads all revision files; knows the full history

    with engine.connect() as connection:
        migration_ctx = MigrationContext.configure(connection)
        # => MigrationContext queries alembic_version to get current revision
        current_rev = migration_ctx.get_current_revision()
        # => returns the revision ID string or None if no migrations applied

    head_rev = script.get_current_head()
    # => returns the head revision ID from the script directory
    # => None if no revisions exist

    if current_rev is None and head_rev is not None:
        pending_count = sum(1 for _ in script.walk_revisions())
        # => count all revisions when database has none applied
    elif current_rev is not None and head_rev is not None:
        revisions = list(script.walk_revisions())
        # => walk_revisions() yields all revisions head-first
        pending = []
        for rev in revisions:
            if rev.revision == current_rev:
                break
                # => stop when we reach the current revision
            pending.append(rev.revision)
            # => accumulate revisions that are ahead of current
        pending_count = len(pending)
    else:
        pending_count = 0

    is_up_to_date = current_rev == head_rev
    # => True only when database is exactly at the latest revision

    if not is_up_to_date and pending_count > 0:
        raise HTTPException(
            status_code=503,
            detail=f"{pending_count} migration(s) pending; current={current_rev}, head={head_rev}",
        )
        # => Kubernetes readiness probe reads this; pod stays out of load balancer rotation
        # => until migrations complete; prevents UndefinedColumn errors during migration window

    return MigrationStatus(
        current_revision=current_rev,
        head_revision=head_rev,
        is_up_to_date=is_up_to_date,
        pending_count=pending_count,
    )
    # => {"current_revision": "abc123", "head_revision": "abc123", "is_up_to_date": true, "pending_count": 0}
```

**Key Takeaway**: Use `MigrationContext.get_current_revision()` and `ScriptDirectory.get_current_head()` in a FastAPI health endpoint to expose migration status as a machine-readable signal for Kubernetes readiness probes and deployment monitors.

**Why It Matters**: Infrastructure monitoring tools (Kubernetes, Datadog, PagerDuty) need a programmatic signal to know whether a deployment is complete — not just whether the application started, but whether the database schema matches the deployed code. Returning HTTP 503 from a readiness probe until migrations are applied keeps the pod out of the load balancer rotation, preventing clients from receiving `UndefinedColumn` errors during the migration window. This pattern is standard in zero-downtime Kubernetes deployments.
