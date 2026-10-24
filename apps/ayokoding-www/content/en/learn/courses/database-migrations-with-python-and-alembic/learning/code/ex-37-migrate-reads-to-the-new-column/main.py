"""Example 37: migrate reads to the new column after backfilling it."""

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
    prefix="ex37-"
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
    context.configure(connection=connection, version_table="ex37_version")  # => per-example history table
    with context.begin_transaction():  # => DDL commits atomically where the database allows
        context.run_migrations()  # => execute every pending revision file in order
"""
with open(
    os.path.join(scratch, "env.py"), "w"
) as handle:  # => env.py sits beside versions/
    handle.write(env_py)  # => write the exact text shown above to disk

# => Three chained revisions: table, expand, then the migrate fill.
rev1 = '''"""create ex37 widgets."""

revision = "ex37a1"  # => first revision, no parent yet
down_revision = None


def upgrade():  # => forward: build the base table
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => every op call below joins one transaction: all of it commits or none of it does
    op.create_table(  # => CREATE TABLE, recorded in history only on success
        "ex37_widgets",  # => per-example table, no cross-example collision
        sa.Column("id", sa.Integer(), primary_key=True),  # => surrogate key column
        sa.Column("name", sa.String(50), nullable=False),  # => the old column old code reads
    )


def downgrade():  # => reverse: remove the base table
    from alembic import op  # => same op object, opposite direction

    # => downgrade mirrors upgrade in reverse: last created is first dropped
    op.drop_table("ex37_widgets")  # => DROP TABLE undoes exactly the upgrade
'''
with open(
    os.path.join(versions, "ex37a1_create_widgets.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev1)  # => first chain link now exists on disk
rev2 = '''"""expand ex37 with nickname."""

revision = "ex37a2"  # => second revision: the expand step of expand-migrate-contract
down_revision = "ex37a1"  # => the parent link that orders the chain


def upgrade():  # => forward: add the replacement column, nullable and unused
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => expand adds without breaking: nullable means old writes keep working
    op.add_column("ex37_widgets", sa.Column("nickname", sa.String(50)))  # => ALTER TABLE ADD COLUMN


def downgrade():  # => reverse: drop the replacement column
    from alembic import op  # => same op object, opposite direction

    # => dropping the column discards its data: downgrades are not free
    op.drop_column("ex37_widgets", "nickname")  # => ALTER TABLE DROP COLUMN
'''
with open(
    os.path.join(versions, "ex37a2_expand.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev2)  # => second chain link now exists on disk
rev3 = '''"""migrate ex37 reads to nickname."""

revision = "ex37a3"  # => third revision: the migrate step, data only
down_revision = "ex37a2"  # => the parent link that orders the chain


def upgrade():  # => forward: copy every old value into the new column
    from alembic import op  # => op emits DDL inside the migration transaction

    # => migrate copies old to new: after this, reads may switch columns safely
    op.execute("UPDATE ex37_widgets SET nickname = name WHERE nickname IS NULL")


def downgrade():  # => reverse: deliberately nothing
    # => un-copying would destroy information: one-way by design
    # => the history stamp still retreats: position moves, data stays copied
    pass
'''
with open(
    os.path.join(versions, "ex37a3_migrate.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev3)  # => third chain link now exists on disk

# => Backfill old rows, migrate them, then read only the new column.
config = Config()  # => bare Config: no alembic.ini needed for script runs
config.set_main_option("script_location", scratch)  # => env.py and versions/ live here
config.set_main_option("sqlalchemy.url", url)  # => the service database URL
engine = create_engine(url)  # => separate engine for setup and verification
with engine.begin() as connection:  # => setup runs in a single transaction
    connection.execute(
        text("DROP TABLE IF EXISTS ex37_widgets")
    )  # => leftovers of a killed run vanish
    connection.execute(
        text("DROP TABLE IF EXISTS ex37_version")
    )  # => stale history vanishes too
command.upgrade(config, "ex37a1")  # => the old schema: what the old code was built for
with engine.begin() as connection:  # => seeding runs in a single transaction
    # => rows written by the old code: only the old column carries values
    connection.execute(
        text("INSERT INTO ex37_widgets (name) VALUES ('sprocket'), ('gadget')")
    )
command.upgrade(config, "head")  # => expand, then the migrate fill copies values over
with engine.connect() as connection:  # => fresh connection plays the new code version
    rows = connection.execute(  # => the new query names only the new column
        # => old code is gone from this query: nickname is the only source read
        text("SELECT nickname FROM ex37_widgets ORDER BY id")
    ).fetchall()  # => materialize every row before printing
print("reads:", ", ".join(row[0] for row in rows))  # => Output: reads: sprocket, gadget
with engine.begin() as connection:  # => cleanup runs in a single transaction
    connection.execute(
        text("DROP TABLE ex37_widgets")
    )  # => the example leaves no tables behind
    connection.execute(
        text("DROP TABLE ex37_version")
    )  # => and no history table either
print("cleaned: yes")  # => Output: cleaned: yes
