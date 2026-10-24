"""Example 73: unmodeled columns mean history diverged from the database."""

import os  # => os reads the harness database address, never hardcoded
import tempfile  # => tempfile gives each run a private script directory

from alembic import command  # => command runs revisions, like the CLI does
from alembic.config import Config  # => Config points Alembic at the scripts
from sqlalchemy import (
    MetaData,
    create_engine,
    text,
)  # => reflect needs MetaData and an engine

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
    prefix="ex73-"
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
    context.configure(connection=connection, version_table="ex73_version")  # => per-example history table
    with context.begin_transaction():  # => DDL commits atomically where the database allows
        context.run_migrations()  # => execute every pending revision file in order
"""
with open(
    os.path.join(scratch, "env.py"), "w"
) as handle:  # => env.py sits beside versions/
    handle.write(env_py)  # => write the exact text shown above to disk

# => One revision to head: the history claims two columns, full stop.
rev1 = '''"""create ex73 widgets."""

revision = "ex73a1"  # => single revision: history ends at two columns
down_revision = None


def upgrade():  # => forward: build the base table
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => every op call below joins one transaction: all of it commits or none of it does
    op.create_table(  # => CREATE TABLE, recorded in history only on success
        "ex73_widgets",  # => per-example table, no cross-example collision
        sa.Column("id", sa.Integer(), primary_key=True),  # => surrogate key column
        sa.Column("name", sa.String(50), nullable=False),  # => the last column history knows
    )


def downgrade():  # => reverse: remove the base table
    from alembic import op  # => same op object, opposite direction

    # => downgrade mirrors upgrade in reverse: last created is first dropped
    op.drop_table("ex73_widgets")  # => DROP TABLE undoes exactly the upgrade
'''
with open(
    os.path.join(versions, "ex73a1_create_widgets.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev1)  # => the revision file now exists for Alembic to find

# => Migrate cleanly, drift by hand, then compare files against reality.
config = Config()  # => bare Config: no alembic.ini needed for script runs
config.set_main_option("script_location", scratch)  # => env.py and versions/ live here
config.set_main_option("sqlalchemy.url", url)  # => the service database URL
engine = create_engine(url)  # => separate engine for migration and diagnosis
with engine.begin() as connection:  # => setup runs in a single transaction
    connection.execute(
        text("DROP TABLE IF EXISTS ex73_widgets")
    )  # => leftovers of a killed run vanish
    connection.execute(
        text("DROP TABLE IF EXISTS ex73_version")
    )  # => stale history vanishes too
command.upgrade(config, "head")  # => history and database agree: two columns
with engine.begin() as connection:  # => drift by hand: an unmodeled column appears
    # => raw DDL outside any revision: the classic silent drift
    connection.execute(text("ALTER TABLE ex73_widgets ADD COLUMN status VARCHAR(10)"))

# => The divergence check: files claim two columns, the database has three.
metadata = MetaData()  # => empty metadata: reflection fills it from the database
metadata.reflect(
    bind=engine, only=["ex73_widgets"]
)  # => only our table: system catalogs stay out
table = metadata.tables["ex73_widgets"]  # => the drifted table, all three columns
found = sorted(
    column.name for column in table.columns
)  # => sorted names keep output stable
# => two columns is what the one revision created: the history-side truth
expected = ["id", "name"]  # => what the revision files claim the table holds
print("expected:", ", ".join(expected))  # => Output: expected: id, name
print("found:", ", ".join(found))  # => Output: found: id, name, status
# => any gap means the database moved without history: investigate before migrating
print("diverged:", found != expected)  # => Output: diverged: True
with engine.begin() as connection:  # => cleanup runs in a single transaction
    connection.execute(
        text("DROP TABLE ex73_widgets")
    )  # => the example leaves no tables behind
    connection.execute(
        text("DROP TABLE ex73_version")
    )  # => and no history table either
print("cleaned: yes")  # => Output: cleaned: yes
