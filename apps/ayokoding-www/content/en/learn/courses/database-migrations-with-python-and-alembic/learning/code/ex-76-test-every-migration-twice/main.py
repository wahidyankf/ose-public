"""Example 76: run every migration twice: migrate, tear down, migrate."""

import os  # => os reads the harness database address, never hardcoded
import tempfile  # => tempfile gives each run a private script directory

from alembic import command  # => command runs revisions, like the CLI does
from alembic.config import Config  # => Config points Alembic at the scripts
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
    prefix="ex76-"
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
    context.configure(connection=connection, version_table="ex76_version")  # => per-example history table
    with context.begin_transaction():  # => DDL commits atomically where the database allows
        context.run_migrations()  # => execute every pending revision file in order
"""
with open(
    os.path.join(scratch, "env.py"), "w"
) as handle:  # => env.py sits beside versions/
    handle.write(env_py)  # => write the exact text shown above to disk

# => One revision to run twice with a full teardown between the runs.
rev1 = '''"""create ex76 widgets."""

revision = "ex76a1"  # => single revision: the whole migration under test
down_revision = None


def upgrade():  # => forward: build the base table
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => every op call below joins one transaction: all of it commits or none of it does
    op.create_table(  # => CREATE TABLE, recorded in history only on success
        "ex76_widgets",  # => per-example table, no cross-example collision
        sa.Column("id", sa.Integer(), primary_key=True),  # => surrogate key column
        sa.Column("name", sa.String(50), nullable=False),  # => every widget has a name
    )


def downgrade():  # => reverse: remove the base table
    from alembic import op  # => same op object, opposite direction

    # => downgrade mirrors upgrade in reverse: last created is first dropped
    op.drop_table("ex76_widgets")  # => DROP TABLE undoes exactly the upgrade
'''
with open(
    os.path.join(versions, "ex76a1_create_widgets.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev1)  # => the revision file now exists for Alembic to find

# => Migrate, tear down to zero, migrate again: both runs must agree.
config = Config()  # => bare Config: no alembic.ini needed for script runs
config.set_main_option("script_location", scratch)  # => env.py and versions/ live here
config.set_main_option("sqlalchemy.url", url)  # => the service database URL
engine = create_engine(url)  # => separate engine for setup and verification
with engine.begin() as connection:  # => setup runs in a single transaction
    connection.execute(
        text("DROP TABLE IF EXISTS ex76_widgets")
    )  # => leftovers of a killed run vanish
    connection.execute(
        text("DROP TABLE IF EXISTS ex76_version")
    )  # => stale history vanishes too


def data_tables():
    """Count this example's data tables, ignoring its history table."""
    with engine.connect() as connection:  # => fresh connection sees committed DDL
        # => the version table is bookkeeping: only data tables count here
        return connection.execute(  # => COUNT keeps the output to one stable number
            text(  # => LIKE patterns stay fixed: no timing or path leaks in
                "SELECT COUNT(*) FROM information_schema.tables "
                "WHERE table_name LIKE 'ex76\\_%' AND table_name <> 'ex76_version'"
            )
        ).scalar()  # => a single count is all this check needs


# => first run proves the upgrade works from empty: one table stands
command.upgrade(config, "head")  # => first run: the table appears
print("first run tables:", data_tables())  # => Output: first run tables: 1
# => teardown proves the downgrade empties: zero tables remain
command.downgrade(config, "base")  # => teardown: every trace of the schema goes
print("after teardown:", data_tables())  # => Output: after teardown: 0
command.upgrade(config, "head")  # => second run: the table appears again
print("second run tables:", data_tables())  # => Output: second run tables: 1
# => identical runs prove the migration is a pure function of its files
print("stable:", data_tables() == 1)  # => Output: stable: True
with engine.begin() as connection:  # => cleanup runs in a single transaction
    connection.execute(
        text("DROP TABLE ex76_widgets")
    )  # => the example leaves no tables behind
    connection.execute(
        text("DROP TABLE ex76_version")
    )  # => and no history table either
print("cleaned: yes")  # => Output: cleaned: yes
