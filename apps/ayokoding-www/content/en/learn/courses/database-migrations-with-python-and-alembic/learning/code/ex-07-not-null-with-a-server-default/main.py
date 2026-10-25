"""Example 7: a NOT NULL column lands safely with a server default."""

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
scratch = tempfile.mkdtemp(
    prefix="ex07-"
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
    context.configure(connection=connection, version_table="ex07_version")  # => per-example history table
    with context.begin_transaction():  # => DDL commits atomically where the database allows
        context.run_migrations()  # => execute every pending revision file in order
"""
with open(
    os.path.join(scratch, "env.py"), "w"
) as handle:  # => env.py sits beside versions/
    handle.write(env_py)  # => write the exact text shown above to disk

# => Revision ex07a1: table with one row; ex07a2: strict column with a default.
rev1 = '''"""create ex07 widgets."""

revision = "ex07a1"  # => first revision, no parent yet
down_revision = None


def upgrade():  # => forward: build the base table
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => every op call below joins one transaction: all of it commits or none of it does
    op.create_table(  # => CREATE TABLE, recorded in history only on success
        "ex07_widgets",  # => per-example table, no cross-example collision
        sa.Column("id", sa.Integer(), primary_key=True),  # => surrogate key column
        sa.Column("name", sa.String(50), nullable=False),  # => every widget has a name
    )


def downgrade():  # => reverse: remove the base table
    from alembic import op  # => same op object, opposite direction

    # => downgrade mirrors upgrade in reverse: last created is first dropped
    op.drop_table("ex07_widgets")  # => DROP TABLE undoes exactly the upgrade
'''
with open(
    os.path.join(versions, "ex07a1_create_widgets.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev1)  # => first chain link now exists on disk
rev2 = '''"""require ex07 widget status with a default."""

revision = "ex07a2"  # => second revision, runs after ex07a1
down_revision = "ex07a1"  # => the parent link that orders the chain


def upgrade():  # => forward: NOT NULL column that fills existing rows itself
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => one statement adds, defaults, and constrains: no window where rows violate it
    op.add_column(  # => one statement: add, default, and constrain together
        "ex07_widgets",  # => the live table that already holds rows
        sa.Column("status", sa.String(10), nullable=False, server_default="new"),  # => default fills old rows
    )


def downgrade():  # => reverse: drop the strict column
    from alembic import op  # => same op object, opposite direction

    # => dropping the column discards its data: downgrades are not free
    op.drop_column("ex07_widgets", "status")  # => ALTER TABLE DROP COLUMN
'''
with open(
    os.path.join(versions, "ex07a2_add_status.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev2)  # => second chain link now exists on disk

# => Seed a row between revisions: the default must fill it, not fail it.
# => stopping at ex07a1 first is the point: the old row predates the new rule
config = Config()  # => bare Config: no alembic.ini needed for script runs
config.set_main_option("script_location", scratch)  # => env.py and versions/ live here
config.set_main_option("sqlalchemy.url", url)  # => the service database URL
engine = create_engine(url)  # => separate engine for setup and verification
with engine.begin() as connection:  # => setup runs in a single transaction
    connection.execute(
        text("DROP TABLE IF EXISTS ex07_widgets")
    )  # => leftovers of a killed run vanish
    connection.execute(
        text("DROP TABLE IF EXISTS ex07_version")
    )  # => stale history vanishes too
# => without server_default this second upgrade would fail on the seeded row
command.upgrade(config, "ex07a1")  # => create the table, stop before the strict column
with engine.begin() as connection:  # => seed runs in a single transaction
    # => the seeded row predates the strict column: the default must save it
    connection.execute(
        text("INSERT INTO ex07_widgets (name) VALUES ('sprocket')")
    )  # => old row, no status yet
# => this upgrade must backfill the old row or the NOT NULL fails
command.upgrade(config, "head")  # => add the NOT NULL column with its default
with engine.connect() as connection:  # => fresh connection sees the committed DDL
    status = connection.execute(  # => the old row must carry the default now
        text("SELECT status FROM ex07_widgets WHERE name = 'sprocket'")
    ).scalar()  # => exactly one row matches, so scalar is safe
    print("status:", status)  # => Output: status: new
    # => the catalog check proves the constraint, not just the values
    nullable = connection.execute(  # => the catalog proves the constraint is real
        text(  # => information_schema reports YES or NO per column
            "SELECT is_nullable FROM information_schema.columns "
            "WHERE table_name = 'ex07_widgets' AND column_name = 'status'"
        )
    ).scalar()  # => exactly one column matches, so scalar is safe
print("nullable:", nullable)  # => Output: nullable: NO
with engine.begin() as connection:  # => cleanup runs in a single transaction
    connection.execute(
        text("DROP TABLE ex07_widgets")
    )  # => the example leaves no tables behind
    connection.execute(
        text("DROP TABLE ex07_version")
    )  # => and no history table either
print("cleaned: yes")  # => Output: cleaned: yes
