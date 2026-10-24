"""Example 4: downgrade runs the reverse steps back to the start."""

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
    prefix="ex04-"
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
    context.configure(connection=connection, version_table="ex04_version")  # => per-example history table
    with context.begin_transaction():  # => DDL commits atomically where the database allows
        context.run_migrations()  # => execute every pending revision file in order
"""
with open(
    os.path.join(scratch, "env.py"), "w"
) as handle:  # => env.py sits beside versions/
    handle.write(env_py)  # => write the exact text shown above to disk

# => Revision ex04a1: create the table that downgrade will later remove.
rev1 = '''"""create ex04 widgets."""

revision = "ex04a1"  # => first revision, no parent yet
down_revision = None


def upgrade():  # => forward: build the base table
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => every op call below joins one transaction: all of it commits or none of it does
    op.create_table(  # => CREATE TABLE, recorded in history only on success
        "ex04_widgets",  # => per-example table, no cross-example collision
        sa.Column("id", sa.Integer(), primary_key=True),  # => surrogate key column
        sa.Column("name", sa.String(50), nullable=False),  # => every widget has a name
    )


def downgrade():  # => reverse: remove the base table
    from alembic import op  # => same op object, opposite direction

    # => downgrade mirrors upgrade in reverse: last created is first dropped
    op.drop_table("ex04_widgets")  # => DROP TABLE undoes exactly the upgrade
'''
with open(
    os.path.join(versions, "ex04a1_create_widgets.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev1)  # => first chain link now exists on disk

# => Full cycle: upgrade to head, then downgrade all the way to base.
config = Config()  # => bare Config: no alembic.ini needed for script runs
config.set_main_option("script_location", scratch)  # => env.py and versions/ live here
config.set_main_option("sqlalchemy.url", url)  # => the service database URL
engine = create_engine(url)  # => separate engine for setup and verification
with engine.begin() as connection:  # => setup runs in a single transaction
    connection.execute(
        text("DROP TABLE IF EXISTS ex04_widgets")
    )  # => leftovers of a killed run vanish
    connection.execute(
        text("DROP TABLE IF EXISTS ex04_version")
    )  # => stale history vanishes too
# => upgrade stamps ex04a1 into history only after its DDL commits
command.upgrade(config, "head")  # => run the one pending revision
with engine.connect() as connection:  # => fresh connection sees the committed DDL
    context = MigrationContext.configure(  # => read history state from this connection
        connection,
        opts={"version_table": "ex04_version"},  # => per-example history table again
    )
    print(
        "upgraded:", ", ".join(context.get_current_heads())
    )  # => Output: upgraded: ex04a1
# => downgrade to base runs every reverse step back to the empty state
command.downgrade(config, "base")  # => the widget table disappears here
with engine.connect() as connection:  # => fresh connection sees the committed drop
    tables = connection.execute(  # => ask the catalog whether the widget table remains
        # => information_schema is portable: no PostgreSQL-only catalog tables here
        text(  # => a count query keeps the output to one stable number
            "SELECT COUNT(*) FROM information_schema.tables "
            "WHERE table_name = 'ex04_widgets'"
        )
    ).scalar()  # => a single count is all this check needs
    context = MigrationContext.configure(  # => history state after the downgrade
        connection,
        opts={"version_table": "ex04_version"},  # => same per-example table
    )
    print(
        "heads:", ", ".join(context.get_current_heads()) or "none"
    )  # => Output: heads: none
print("widgets left:", tables)  # => Output: widgets left: 0
# => the version table survives downgrades: history outlives the schema it tracked
with engine.begin() as connection:  # => cleanup runs in a single transaction
    connection.execute(
        text("DROP TABLE ex04_version")
    )  # => the empty history table goes too
print("cleaned: yes")  # => Output: cleaned: yes
