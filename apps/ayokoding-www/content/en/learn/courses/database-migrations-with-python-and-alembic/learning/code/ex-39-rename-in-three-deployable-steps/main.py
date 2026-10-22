"""Example 39: a column rename ships as three deployable revisions."""

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
    prefix="ex39-"
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
    context.configure(connection=connection, version_table="ex39_version")  # => per-example history table
    with context.begin_transaction():  # => DDL commits atomically where the database allows
        context.run_migrations()  # => execute every pending revision file in order
"""
with open(
    os.path.join(scratch, "env.py"), "w"
) as handle:  # => env.py sits beside versions/
    handle.write(env_py)  # => write the exact text shown above to disk

# => The rename of name to full_name as expand, migrate, and contract steps.
rev1 = '''"""create ex39 widgets."""

revision = "ex39a1"  # => first revision, no parent yet
down_revision = None


def upgrade():  # => forward: build the base table
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => every op call below joins one transaction: all of it commits or none of it does
    op.create_table(  # => CREATE TABLE, recorded in history only on success
        "ex39_widgets",  # => per-example table, no cross-example collision
        sa.Column("id", sa.Integer(), primary_key=True),  # => surrogate key column
        sa.Column("name", sa.String(50), nullable=False),  # => the old name this story renames
    )


def downgrade():  # => reverse: remove the base table
    from alembic import op  # => same op object, opposite direction

    # => downgrade mirrors upgrade in reverse: last created is first dropped
    op.drop_table("ex39_widgets")  # => DROP TABLE undoes exactly the upgrade
'''
with open(
    os.path.join(versions, "ex39a1_create_widgets.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev1)  # => first chain link now exists on disk
rev2 = '''"""expand ex39 with full_name."""

revision = "ex39a2"  # => second revision: the expand step, new column beside old
down_revision = "ex39a1"  # => the parent link that orders the chain


def upgrade():  # => forward: add full_name, nullable and unused for now
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => expand adds without breaking: nullable means old writes keep working
    op.add_column("ex39_widgets", sa.Column("full_name", sa.String(50)))  # => ALTER TABLE ADD COLUMN


def downgrade():  # => reverse: drop the replacement column
    from alembic import op  # => same op object, opposite direction

    # => dropping the column discards its data: downgrades are not free
    op.drop_column("ex39_widgets", "full_name")  # => ALTER TABLE DROP COLUMN
'''
with open(
    os.path.join(versions, "ex39a2_expand.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev2)  # => second chain link now exists on disk
rev3 = '''"""migrate and contract ex39 to full_name."""

revision = "ex39a3"  # => third revision: migrate then contract in one deploy
down_revision = "ex39a2"  # => the parent link that orders the chain


def upgrade():  # => forward: copy values over, then drop the old column
    from alembic import op  # => op emits DDL inside the migration transaction

    # => migrate copies old to new: after this, reads may switch columns safely
    # => copy and drop share one transaction: no window with neither column
    op.execute("UPDATE ex39_widgets SET full_name = name WHERE full_name IS NULL")
    # => contract runs only after every reader moved: the point of no return
    op.drop_column("ex39_widgets", "name")  # => the rename completes: old name gone


def downgrade():  # => reverse: bring the old column back, empty
    from alembic import op  # => same op object, opposite direction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => the restored column comes back NULL: dropped data never returns
    op.add_column("ex39_widgets", sa.Column("name", sa.String(50)))  # => re-added, but empty
'''
with open(
    os.path.join(versions, "ex39a3_contract.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev3)  # => third chain link now exists on disk

# => Old row in, three steps run, new column out with the value intact.
config = Config()  # => bare Config: no alembic.ini needed for script runs
config.set_main_option("script_location", scratch)  # => env.py and versions/ live here
config.set_main_option("sqlalchemy.url", url)  # => the service database URL
engine = create_engine(url)  # => separate engine for setup and verification
with engine.begin() as connection:  # => setup runs in a single transaction
    connection.execute(
        text("DROP TABLE IF EXISTS ex39_widgets")
    )  # => leftovers of a killed run vanish
    connection.execute(
        text("DROP TABLE IF EXISTS ex39_version")
    )  # => stale history vanishes too
command.upgrade(config, "ex39a1")  # => the old schema: the rename starts here
with engine.begin() as connection:  # => seeding runs in a single transaction
    # => the row the rename must carry across all three steps
    connection.execute(text("INSERT INTO ex39_widgets (name) VALUES ('Ada Lovelace')"))
# => three deploys in one run: expand, migrate, contract in chain order
command.upgrade(config, "head")  # => expand, migrate, contract: the rename in full
with engine.connect() as connection:  # => fresh connection sees the renamed table
    context = MigrationContext.configure(  # => read history state from this connection
        connection,
        opts={"version_table": "ex39_version"},  # => per-example history table again
    )
    print("heads:", ", ".join(context.get_current_heads()))  # => Output: heads: ex39a3
    columns = connection.execute(  # => name is gone, full_name remains
        # => information_schema is portable: no PostgreSQL-only catalog tables here
        text(  # => ordering by position keeps the printout stable across reruns
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'ex39_widgets' ORDER BY ordinal_position"
        )
    ).fetchall()  # => materialize every row before printing
    print(
        "columns:", ", ".join(row[0] for row in columns)
    )  # => Output: columns: id, full_name
    value = connection.execute(  # => the value crossed the rename intact
        text("SELECT full_name FROM ex39_widgets")
    ).scalar()  # => exactly one row exists, so scalar is safe
print("renamed:", value)  # => Output: renamed: Ada Lovelace
with engine.begin() as connection:  # => cleanup runs in a single transaction
    # => the renamed table is the only trace: the old name is fully gone
    connection.execute(
        text("DROP TABLE ex39_widgets")
    )  # => the example leaves no tables behind
    connection.execute(
        text("DROP TABLE ex39_version")
    )  # => and no history table either
print("cleaned: yes")  # => Output: cleaned: yes
