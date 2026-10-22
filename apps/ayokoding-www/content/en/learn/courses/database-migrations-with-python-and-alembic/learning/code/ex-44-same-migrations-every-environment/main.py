"""Example 44: the same migrations run identically in every environment."""

import os  # => os reads the harness database address, never hardcoded
import tempfile  # => tempfile gives each run a private script directory

from alembic import command  # => command runs revisions, like the CLI does
from alembic.config import Config  # => Config points Alembic at the scripts
from alembic.migration import (
    MigrationContext,
)  # => MigrationContext reads history state
from sqlalchemy import create_engine, text  # => engine sets up and verifies

# => The database URL comes from the harness, with local-run defaults.
host = os.environ.get("PGHOST", "postgres")  # => service hostname in the unit network
user = os.environ.get("PGUSER", "postgres")  # => trust-auth role, no password needed
admin_database = os.environ.get(
    "PGDATABASE", "postgres"
)  # => admin database for CREATE DATABASE
base = f"postgresql+psycopg://{user}@{host}"  # => per-database URLs append below


def admin(statement):
    """Run one server-level statement outside any transaction block."""
    admin_engine = create_engine(
        f"{base}/{admin_database}", isolation_level="AUTOCOMMIT"
    )  # => DDL like CREATE DATABASE cannot run in a block
    with (
        admin_engine.connect() as connection
    ):  # => autocommit applies each statement at once
        connection.execute(text(statement))  # => the single admin statement runs here
    admin_engine.dispose()  # => close before dropping: no open handles to the database


# => Two sibling databases stand in for two environments on one server.
for name in ("ex44_dev", "ex44_prod"):  # => dev first, then prod: same steps both times
    admin(f"DROP DATABASE IF EXISTS {name}")  # => leftovers of a killed run vanish
    admin(f"CREATE DATABASE {name}")  # => a fresh, empty environment appears

# => A scratch script location: env.py plus one versions directory.
# => the scratch path never reaches stdout, so reruns stay byte-stable
scratch = tempfile.mkdtemp(
    prefix="ex44-"
)  # => unique path, never printed, output stays stable
versions = os.path.join(
    scratch, "versions"
)  # => Alembic discovers revisions in this folder
os.makedirs(versions)  # => create the versions directory on disk

# => Minimal online-only env.py: connect and run whatever revisions exist.
env_py = """\
from alembic import context  # => context carries the Config that command.* built
from sqlalchemy import create_engine  # => plain engine is enough, no ORM needed
engine = create_engine(context.config.get_main_option("sqlalchemy.url"))  # => reuse the migration URL
with engine.connect() as connection:  # => one connection runs the whole migration
    context.configure(connection=connection, version_table="ex44_version")  # => per-example history table
    with context.begin_transaction():  # => DDL commits atomically where the database allows
        context.run_migrations()  # => execute every pending revision file in order
"""
with open(
    os.path.join(scratch, "env.py"), "w"
) as handle:  # => env.py sits beside versions/
    handle.write(env_py)  # => write the exact text shown above to disk

# => Two chained revisions: the chain under test in both environments.
rev1 = '''"""create ex44 widgets."""

revision = "ex44a1"  # => first revision, no parent yet
down_revision = None


def upgrade():  # => forward: build the base table
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => every op call below joins one transaction: all of it commits or none of it does
    op.create_table(  # => CREATE TABLE, recorded in history only on success
        "ex44_widgets",  # => per-example table, no cross-example collision
        sa.Column("id", sa.Integer(), primary_key=True),  # => surrogate key column
        sa.Column("name", sa.String(50), nullable=False),  # => every widget has a name
    )


def downgrade():  # => reverse: remove the base table
    from alembic import op  # => same op object, opposite direction

    # => downgrade mirrors upgrade in reverse: last created is first dropped
    op.drop_table("ex44_widgets")  # => DROP TABLE undoes exactly the upgrade
'''
with open(
    os.path.join(versions, "ex44a1_create_widgets.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev1)  # => first chain link now exists on disk
rev2 = '''"""add ex44 widget price."""

revision = "ex44a2"  # => second revision, runs after ex44a1
down_revision = "ex44a1"  # => the parent link that orders the chain


def upgrade():  # => forward: one new nullable column on the live table
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => ADD COLUMN without a default leaves existing rows NULL: the safe start
    op.add_column("ex44_widgets", sa.Column("price_cents", sa.Integer()))  # => ALTER TABLE ADD COLUMN


def downgrade():  # => reverse: drop that same column
    from alembic import op  # => same op object, opposite direction

    # => dropping the column discards its data: downgrades are not free
    op.drop_column("ex44_widgets", "price_cents")  # => ALTER TABLE DROP COLUMN
'''
with open(
    os.path.join(versions, "ex44a2_add_price.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev2)  # => second chain link now exists on disk


def migrate(environment):
    """Upgrade one environment to head and report its recorded tip."""
    config = Config()  # => bare Config: no alembic.ini needed for script runs
    config.set_main_option(
        "script_location", scratch
    )  # => env.py and versions/ live here
    config.set_main_option(
        "sqlalchemy.url", f"{base}/{environment}"
    )  # => this environment's own database
    command.upgrade(
        config, "head"
    )  # => the same head, the same files, another database
    engine = create_engine(
        f"{base}/{environment}"
    )  # => separate engine reads this environment back
    with (
        engine.connect() as connection
    ):  # => fresh connection sees the committed stamps
        context = MigrationContext.configure(  # => history state from this connection
            connection,
            opts={
                "version_table": "ex44_version"
            },  # => same history table, other database
        )
        tip = ", ".join(
            context.get_current_heads()
        )  # => the recorded tip of this environment
    engine.dispose()  # => close before any later DROP DATABASE
    return tip  # => caller compares tips across environments


# => One chain, two databases, zero drift between them.
# => one chain, two databases: the promotion rehearsal starts with dev
dev = migrate("ex44_dev")  # => the development environment migrates first
print("dev:", dev)  # => Output: dev: ex44a2
# => production runs the identical files next: same order, same stamps
prod = migrate("ex44_prod")  # => production runs the identical files next
print("prod:", prod)  # => Output: prod: ex44a2
# => matching tips mean matching schemas: promotion is a copy, not a rewrite
print("match:", dev == prod)  # => Output: match: True
for name in ("ex44_dev", "ex44_prod"):  # => teardown mirrors setup, same order
    admin(f"DROP DATABASE {name}")  # => both stand-in environments disappear
print("cleaned: yes")  # => Output: cleaned: yes
