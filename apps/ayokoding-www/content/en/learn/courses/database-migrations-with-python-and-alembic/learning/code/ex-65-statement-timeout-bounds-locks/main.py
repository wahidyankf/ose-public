"""Example 65: statement_timeout bounds every runaway statement."""

import os  # => os reads the harness database address, never hardcoded
import tempfile  # => tempfile gives each run a private script directory

from alembic import command  # => command runs revisions, like the CLI does
from alembic.config import Config  # => Config points Alembic at the scripts
from alembic.migration import (
    MigrationContext,
)  # => MigrationContext reads history state
from sqlalchemy import create_engine, text  # => engine sets up and verifies
from sqlalchemy.exc import DBAPIError  # => DBAPIError is the cancel signal to catch

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
    prefix="ex65-"
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
    context.configure(connection=connection, version_table="ex65_version")  # => per-example history table
    with context.begin_transaction():  # => DDL commits atomically where the database allows
        context.run_migrations()  # => execute every pending revision file in order
"""
with open(
    os.path.join(scratch, "env.py"), "w"
) as handle:  # => env.py sits beside versions/
    handle.write(env_py)  # => write the exact text shown above to disk

# => One revision with one fast statement: the timeout never fires on it.
rev1 = '''"""create ex65 widgets."""

revision = "ex65a1"  # => single revision: fast DDL, never near the timeout
down_revision = None


def upgrade():  # => forward: build the base table
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => every op call below joins one transaction: all of it commits or none of it does
    op.create_table(  # => CREATE TABLE, recorded in history only on success
        "ex65_widgets",  # => per-example table, no cross-example collision
        sa.Column("id", sa.Integer(), primary_key=True),  # => surrogate key column
        sa.Column("name", sa.String(50), nullable=False),  # => every widget has a name
    )


def downgrade():  # => reverse: remove the base table
    from alembic import op  # => same op object, opposite direction

    # => downgrade mirrors upgrade in reverse: last created is first dropped
    op.drop_table("ex65_widgets")  # => DROP TABLE undoes exactly the upgrade
'''
with open(
    os.path.join(versions, "ex65a1_create_widgets.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev1)  # => the revision file now exists for Alembic to find

# => Slow query cancelled, fast migration unaffected: the timeout guards both.
engine = create_engine(url)  # => separate engine for the timeout demo and the run
with engine.begin() as connection:  # => setup runs in a single transaction
    connection.execute(
        text("DROP TABLE IF EXISTS ex65_widgets")
    )  # => leftovers of a killed run vanish
    connection.execute(
        text("DROP TABLE IF EXISTS ex65_version")
    )  # => stale history vanishes too
guarded = create_engine(
    url
).connect()  # => plain connection: the timeout is set by hand
guarded.execute(
    text("SET statement_timeout = '500ms'")
)  # => half a second, then cancel anything running
guarded.commit()  # => SET needs a commit before the timed statements begin
try:  # => pg_sleep(2) must die at the timeout: the guard earns its keep here
    guarded.execute(text("SELECT pg_sleep(2)"))
    guarded.commit()  # => reaching here means the timeout never fired
    cancelled = False  # => no cancel: the demonstration failed
except DBAPIError:  # => statement timeout surfaces as a database API error
    guarded.rollback()  # => the cancelled statement rolls back cleanly
    cancelled = True  # => the two-second sleep died at half a second, as designed
# => the timeout is a guardrail, not a wall: fast statements pass under it
print("slow query cancelled:", cancelled)  # => Output: slow query cancelled: True
config = Config()  # => bare Config: no alembic.ini needed for script runs
config.set_main_option("script_location", scratch)  # => env.py and versions/ live here
config.set_main_option("sqlalchemy.url", url)  # => the service database URL
command.upgrade(config, "head")  # => the fast DDL runs far inside any sane timeout
with engine.connect() as connection:  # => fresh connection reads the recorded tip
    context = MigrationContext.configure(  # => history state from this connection
        connection,
        opts={"version_table": "ex65_version"},  # => per-example history table again
    )
    print(
        "migrated:", ", ".join(context.get_current_heads())
    )  # => Output: migrated: ex65a1
with engine.begin() as connection:  # => cleanup runs in a single transaction
    connection.execute(
        text("DROP TABLE ex65_widgets")
    )  # => the example leaves no tables behind
    connection.execute(
        text("DROP TABLE ex65_version")
    )  # => and no history table either
print("cleaned: yes")  # => Output: cleaned: yes
