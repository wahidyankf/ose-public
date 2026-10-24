"""Example 17: current names its position and what is still pending."""

import os  # => os reads the harness database address, never hardcoded
import tempfile  # => tempfile gives each run a private script directory

from alembic import command  # => command runs revisions, like the CLI does
from alembic.config import Config  # => Config points Alembic at the scripts
from alembic.migration import (
    MigrationContext,
)  # => MigrationContext reads history state
from alembic.script import (
    ScriptDirectory,
)  # => ScriptDirectory lists every known revision
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
    prefix="ex17-"
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
    context.configure(connection=connection, version_table="ex17_version")  # => per-example history table
    with context.begin_transaction():  # => DDL commits atomically where the database allows
        context.run_migrations()  # => execute every pending revision file in order
"""
with open(
    os.path.join(scratch, "env.py"), "w"
) as handle:  # => env.py sits beside versions/
    handle.write(env_py)  # => write the exact text shown above to disk

# => Two chained revisions: stop after the first and inspect the gap.
rev1 = '''"""create ex17 widgets."""

revision = "ex17a1"  # => first revision, no parent yet
down_revision = None


def upgrade():  # => forward: build the base table
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => every op call below joins one transaction: all of it commits or none of it does
    op.create_table(  # => CREATE TABLE, recorded in history only on success
        "ex17_widgets",  # => per-example table, no cross-example collision
        sa.Column("id", sa.Integer(), primary_key=True),  # => surrogate key column
        sa.Column("name", sa.String(50), nullable=False),  # => every widget has a name
    )


def downgrade():  # => reverse: remove the base table
    from alembic import op  # => same op object, opposite direction

    # => downgrade mirrors upgrade in reverse: last created is first dropped
    op.drop_table("ex17_widgets")  # => DROP TABLE undoes exactly the upgrade
'''
with open(
    os.path.join(versions, "ex17a1_create_widgets.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev1)  # => first chain link now exists on disk
rev2 = '''"""add ex17 widget price."""

revision = "ex17a2"  # => second revision, the one left pending here
down_revision = "ex17a1"  # => the parent link that orders the chain


def upgrade():  # => forward: one new nullable column on the live table
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => ADD COLUMN without a default leaves existing rows NULL: the safe start
    op.add_column("ex17_widgets", sa.Column("price_cents", sa.Integer()))  # => ALTER TABLE ADD COLUMN


def downgrade():  # => reverse: drop that same column
    from alembic import op  # => same op object, opposite direction

    # => dropping the column discards its data: downgrades are not free
    op.drop_column("ex17_widgets", "price_cents")  # => ALTER TABLE DROP COLUMN
'''
with open(
    os.path.join(versions, "ex17a2_add_price.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev2)  # => second chain link now exists on disk

# => Upgrade halfway, then report position and the pending remainder.
config = Config()  # => bare Config: no alembic.ini needed for script runs
config.set_main_option("script_location", scratch)  # => env.py and versions/ live here
config.set_main_option("sqlalchemy.url", url)  # => the service database URL
engine = create_engine(url)  # => separate engine for setup and verification
with engine.begin() as connection:  # => setup runs in a single transaction
    connection.execute(
        text("DROP TABLE IF EXISTS ex17_widgets")
    )  # => leftovers of a killed run vanish
    connection.execute(
        text("DROP TABLE IF EXISTS ex17_version")
    )  # => stale history vanishes too
command.upgrade(config, "ex17a1")  # => partial: the database stops at the middle link
script = ScriptDirectory.from_config(config)  # => parses every revision file found
with engine.connect() as connection:  # => fresh connection sees the committed stamp
    context = MigrationContext.configure(  # => read history state from this connection
        connection,
        opts={"version_table": "ex17_version"},  # => per-example history table again
    )
    current = context.get_current_heads()  # => tuple of applied tip revisions
    print("current:", ", ".join(current))  # => Output: current: ex17a1
    known = sorted(
        found.revision for found in script.walk_revisions()
    )  # => every revision on disk
    # => pending means known but not applied: the gap the next deploy closes
    pending = [revision_id for revision_id in known if revision_id not in current]
    applied = set()  # => walk down from current to exclude real ancestors
    queue = list(current)  # => breadth-first walk starts at the applied tips
    while queue:  # => follow every down_revision link to the roots
        tip = queue.pop()  # => take the next unvisited revision id
        if (
            tip in applied or tip is None
        ):  # => visited roots and empty parents stop the walk
            continue  # => skip without re-queueing anything
        applied.add(tip)  # => this revision really ran on the database
        parent = script.get_revision(tip).down_revision  # => one step toward the root
        queue.append(parent)  # => None ends this branch on the next pass
    print(
        "pending:", ", ".join(sorted(set(pending) - applied))
    )  # => Output: pending: ex17a2
with engine.begin() as connection:  # => cleanup runs in a single transaction
    connection.execute(
        text("DROP TABLE ex17_widgets")
    )  # => the example leaves no tables behind
    connection.execute(
        text("DROP TABLE ex17_version")
    )  # => and no history table either
print("cleaned: yes")  # => Output: cleaned: yes
