"""Example 64: one statement per revision keeps every lock window tiny."""

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
    prefix="ex64-"
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
    context.configure(connection=connection, version_table="ex64_version")  # => per-example history table
    with context.begin_transaction():  # => DDL commits atomically where the database allows
        context.run_migrations()  # => execute every pending revision file in order
"""
with open(
    os.path.join(scratch, "env.py"), "w"
) as handle:  # => env.py sits beside versions/
    handle.write(env_py)  # => write the exact text shown above to disk

# => One revision with exactly one statement: the smallest lockable unit.
rev1 = '''"""add ex64 widget price."""

revision = "ex64a1"  # => single revision: one statement, one lock window
down_revision = None


def upgrade():  # => forward: the one and only statement of this revision
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => a lone statement needs no coordination: review it in one glance
    op.execute("ALTER TABLE ex64_widgets ADD COLUMN price_cents INTEGER")  # => the whole migration in one line


def downgrade():  # => reverse: the one undo of the one statement
    from alembic import op  # => same op object, opposite direction

    # => dropping the column discards its data: downgrades are not free
    op.execute("ALTER TABLE ex64_widgets DROP COLUMN price_cents")  # => the whole rollback in one line
'''
with open(
    os.path.join(versions, "ex64a1_add_price.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev1)  # => the single-statement revision file now exists on disk

# => Count the statements in the file, then run it against the table.
with open(
    os.path.join(versions, "ex64a1_add_price.py")
) as handle:  # => read the revision back for counting
    statements = [  # => op. lines are the statements this revision will run
        line.strip()  # => strip indentation: counting needs clean lines
        for line in handle.read().splitlines()  # => one file line at a time
        if line.strip().startswith("op.")  # => upgrade and downgrade both count here
    ]
# => two op. lines means one forward statement and one reverse statement
print("statements:", len(statements))  # => Output: statements: 2
config = Config()  # => bare Config: no alembic.ini needed for script runs
config.set_main_option("script_location", scratch)  # => env.py and versions/ live here
config.set_main_option("sqlalchemy.url", url)  # => the service database URL
engine = create_engine(url)  # => separate engine for the table and the run
with engine.begin() as connection:  # => setup runs in a single transaction
    connection.execute(
        text("DROP TABLE IF EXISTS ex64_widgets")
    )  # => leftovers of a killed run vanish
    connection.execute(
        text("DROP TABLE IF EXISTS ex64_version")
    )  # => stale history vanishes too
    # => the table predates the revision: one statement is all the lock window holds
    connection.execute(
        text(
            "CREATE TABLE ex64_widgets (id INTEGER PRIMARY KEY, name VARCHAR(50) NOT NULL)"
        )
    )
command.upgrade(
    config, "head"
)  # => the single statement runs inside one short transaction
with engine.connect() as connection:  # => fresh connection sees the committed column
    count = connection.execute(  # => the catalog names the new column or not
        # => a count query keeps the output to one stable number
        text(  # => information_schema is portable: no PostgreSQL-only catalog tables here
            "SELECT COUNT(*) FROM information_schema.columns "
            "WHERE table_name = 'ex64_widgets' AND column_name = 'price_cents'"
        )
    ).scalar()  # => a single count is all this check needs
print("column present:", count == 1)  # => Output: column present: True
with engine.begin() as connection:  # => cleanup runs in a single transaction
    connection.execute(
        text("DROP TABLE ex64_widgets")
    )  # => the example leaves no tables behind
    connection.execute(
        text("DROP TABLE ex64_version")
    )  # => and no history table either
print("cleaned: yes")  # => Output: cleaned: yes
