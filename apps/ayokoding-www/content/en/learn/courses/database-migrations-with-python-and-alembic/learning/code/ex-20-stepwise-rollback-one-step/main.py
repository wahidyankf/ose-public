"""Example 20: downgrade -1 steps back one revision at a time."""

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
database = os.environ.get(
    "PGDATABASE", "postgres"
)  # => fresh database for every unit run
url = f"postgresql+psycopg://{user}@{host}/{database}"  # => psycopg 3 driver URL scheme

# => A scratch script location: env.py plus one versions directory.
# => the scratch path never reaches stdout, so reruns stay byte-stable
scratch = tempfile.mkdtemp(
    prefix="ex20-"
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
    context.configure(connection=connection, version_table="ex20_version")  # => per-example history table
    with context.begin_transaction():  # => DDL commits atomically where the database allows
        context.run_migrations()  # => execute every pending revision file in order
"""
with open(
    os.path.join(scratch, "env.py"), "w"
) as handle:  # => env.py sits beside versions/
    handle.write(env_py)  # => write the exact text shown above to disk

# => Three chained revisions: each adds one column, each reverses alone.
table_rev = '''"""create ex20 widgets."""

revision = "ex20a1"  # => first revision, no parent yet
down_revision = None


def upgrade():  # => forward: build the base table
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => every op call below joins one transaction: all of it commits or none of it does
    op.create_table(  # => CREATE TABLE, recorded in history only on success
        "ex20_widgets",  # => per-example table, no cross-example collision
        sa.Column("id", sa.Integer(), primary_key=True),  # => surrogate key column
        sa.Column("name", sa.String(50), nullable=False),  # => every widget has a name
    )


def downgrade():  # => reverse: remove the base table
    from alembic import op  # => same op object, opposite direction

    # => downgrade mirrors upgrade in reverse: last created is first dropped
    op.drop_table("ex20_widgets")  # => DROP TABLE undoes exactly the upgrade
'''
with open(
    os.path.join(versions, "ex20a1_create_widgets.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(table_rev)  # => first chain link now exists on disk
price_rev = '''"""add ex20 widget price."""

revision = "ex20a2"  # => second revision, runs after ex20a1
down_revision = "ex20a1"  # => the parent link that orders the chain


def upgrade():  # => forward: one new nullable column on the live table
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => ADD COLUMN without a default leaves existing rows NULL: the safe start
    op.add_column("ex20_widgets", sa.Column("price_cents", sa.Integer()))  # => ALTER TABLE ADD COLUMN


def downgrade():  # => reverse: drop that same column
    from alembic import op  # => same op object, opposite direction

    # => dropping the column discards its data: downgrades are not free
    op.drop_column("ex20_widgets", "price_cents")  # => ALTER TABLE DROP COLUMN
'''
with open(
    os.path.join(versions, "ex20a2_add_price.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(price_rev)  # => second chain link now exists on disk
status_rev = '''"""add ex20 widget status."""

revision = "ex20a3"  # => third revision, the chain tip
down_revision = "ex20a2"  # => the parent link that orders the chain


def upgrade():  # => forward: one more column on the live table
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => a second nullable column: each revision stays small and reviewable
    op.add_column("ex20_widgets", sa.Column("status", sa.String(10)))  # => ALTER TABLE ADD COLUMN


def downgrade():  # => reverse: drop that same column
    from alembic import op  # => same op object, opposite direction

    # => dropping the column discards its data: downgrades are not free
    op.drop_column("ex20_widgets", "status")  # => ALTER TABLE DROP COLUMN
'''
with open(
    os.path.join(versions, "ex20a3_add_status.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(status_rev)  # => third chain link now exists on disk

# => Three ups, then two single-step downs: the tip retreats one link at a time.
config = Config()  # => bare Config: no alembic.ini needed for script runs
config.set_main_option("script_location", scratch)  # => env.py and versions/ live here
config.set_main_option("sqlalchemy.url", url)  # => the service database URL
engine = create_engine(url)  # => separate engine for setup and verification
with engine.begin() as connection:  # => setup runs in a single transaction
    connection.execute(
        text("DROP TABLE IF EXISTS ex20_widgets")
    )  # => leftovers of a killed run vanish
    connection.execute(
        text("DROP TABLE IF EXISTS ex20_version")
    )  # => stale history vanishes too


def heads():
    """Read the current history tip without changing anything."""
    with engine.connect() as connection:  # => read-only connection for inspection
        context = MigrationContext.configure(  # => history state from this connection
            connection,
            opts={
                "version_table": "ex20_version"
            },  # => per-example history table again
        )
        return (
            ", ".join(context.get_current_heads()) or "none"
        )  # => "none" when history is empty


command.upgrade(config, "head")  # => all three revisions run in chain order
print("at head:", heads())  # => Output: at head: ex20a3
# => each -1 reverses exactly one link: the tip retreats newest-first
command.downgrade(config, "-1")  # => one step back: only ex20a3 reverses here
print("one back:", heads())  # => Output: one back: ex20a2
# => the second -1 lands on the base table revision: one link left
command.downgrade(config, "-1")  # => one more step: only ex20a2 reverses here
print("two back:", heads())  # => Output: two back: ex20a1
with engine.begin() as connection:  # => cleanup runs in a single transaction
    connection.execute(
        text("DROP TABLE ex20_widgets")
    )  # => the example leaves no tables behind
    connection.execute(
        text("DROP TABLE ex20_version")
    )  # => and no history table either
print("cleaned: yes")  # => Output: cleaned: yes
