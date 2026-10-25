"""Example 21: a failing statement rolls back the whole revision."""

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
    prefix="ex21-"
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
    context.configure(connection=connection, version_table="ex21_version")  # => per-example history table
    with context.begin_transaction():  # => DDL commits atomically where the database allows
        context.run_migrations()  # => execute every pending revision file in order
"""
with open(
    os.path.join(scratch, "env.py"), "w"
) as handle:  # => env.py sits beside versions/
    handle.write(env_py)  # => write the exact text shown above to disk

# => One broken revision: the table creation succeeds, then garbage SQL fails.
rev1 = '''"""create ex21 widgets, then fail."""

revision = "ex21a1"  # => single revision: its failure must leave nothing behind
down_revision = None


def upgrade():  # => forward: a good statement followed by a broken one
    from alembic import op  # => op emits DDL inside the migration transaction

    # => the first statement succeeds on its own: the transaction saves us, not it
    op.execute("CREATE TABLE ex21_widgets (id INTEGER PRIMARY KEY)")  # => valid DDL, runs fine alone
    # => the second statement is nonsense: PostgreSQL rejects it immediately
    op.execute("THIS IS NOT SQL AT ALL")  # => syntax error: the migration fails here


def downgrade():  # => reverse: never reached, but still required
    from alembic import op  # => same op object, opposite direction

    # => downgrade mirrors upgrade in reverse: last created is first dropped
    op.execute("DROP TABLE IF EXISTS ex21_widgets")  # => IF EXISTS: safe even after a failure
'''
with open(
    os.path.join(versions, "ex21a1_broken.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev1)  # => the broken revision file now exists for Alembic to run

# => Run the broken revision and prove the database kept nothing from it.
config = Config()  # => bare Config: no alembic.ini needed for script runs
config.set_main_option("script_location", scratch)  # => env.py and versions/ live here
config.set_main_option("sqlalchemy.url", url)  # => the service database URL
engine = create_engine(url)  # => separate engine for setup and verification
with engine.begin() as connection:  # => setup runs in a single transaction
    connection.execute(
        text("DROP TABLE IF EXISTS ex21_widgets")
    )  # => leftovers of a killed run vanish
    connection.execute(
        text("DROP TABLE IF EXISTS ex21_version")
    )  # => stale history vanishes too
try:  # => the upgrade must raise: the test is what survives the raise
    command.upgrade(config, "head")  # => runs the good statement, then the broken one
    raised = False  # => reaching here would mean the bad SQL somehow passed
except Exception:  # => any database error proves the failure path works
    raised = True  # => the broken statement raised, as designed
print("upgrade raised:", raised)  # => Output: upgrade raised: True
with engine.connect() as connection:  # => fresh connection sees only committed state
    exists = connection.execute(  # => the half-created table must be gone with the rollback
        # => a count query keeps the output to one stable number
        text(  # => information_schema is portable: no PostgreSQL-only catalog tables here
            "SELECT COUNT(*) FROM information_schema.tables "
            "WHERE table_name = 'ex21_widgets'"
        )
    ).scalar()  # => a single count is all this check needs
    print("widgets exist:", exists == 1)  # => Output: widgets exist: False
    context = MigrationContext.configure(  # => history state after the failed run
        connection,
        opts={"version_table": "ex21_version"},  # => per-example history table again
    )
    print(
        "heads:", ", ".join(context.get_current_heads()) or "none"
    )  # => Output: heads: none
with engine.begin() as connection:  # => cleanup runs in a single transaction
    connection.execute(
        text("DROP TABLE IF EXISTS ex21_version")
    )  # => the history table may exist but empty
print("cleaned: yes")  # => Output: cleaned: yes
