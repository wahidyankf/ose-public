"""Example 27: schema first, data second, in two separate revisions."""

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
    prefix="ex27-"
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
    context.configure(connection=connection, version_table="ex27_version")  # => per-example history table
    with context.begin_transaction():  # => DDL commits atomically where the database allows
        context.run_migrations()  # => execute every pending revision file in order
"""
with open(
    os.path.join(scratch, "env.py"), "w"
) as handle:  # => env.py sits beside versions/
    handle.write(env_py)  # => write the exact text shown above to disk

# => Three chained revisions: table, nullable column, then the data-only fill.
rev1 = '''"""create ex27 widgets."""

revision = "ex27a1"  # => first revision, no parent yet
down_revision = None


def upgrade():  # => forward: build the base table
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => every op call below joins one transaction: all of it commits or none of it does
    op.create_table(  # => CREATE TABLE, recorded in history only on success
        "ex27_widgets",  # => per-example table, no cross-example collision
        sa.Column("id", sa.Integer(), primary_key=True),  # => surrogate key column
        sa.Column("name", sa.String(50), nullable=False),  # => the source the backfill reads
    )


def downgrade():  # => reverse: remove the base table
    from alembic import op  # => same op object, opposite direction

    # => downgrade mirrors upgrade in reverse: last created is first dropped
    op.drop_table("ex27_widgets")  # => DROP TABLE undoes exactly the upgrade
'''
with open(
    os.path.join(versions, "ex27a1_create_widgets.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev1)  # => first chain link now exists on disk
rev2 = '''"""add ex27 widget nickname column."""

revision = "ex27a2"  # => second revision: schema only, no data touched
down_revision = "ex27a1"  # => the parent link that orders the chain


def upgrade():  # => forward: the nullable column alone, nothing else
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => schema-only revisions stay tiny: one column, one statement, one review
    op.add_column("ex27_widgets", sa.Column("nickname", sa.String(50)))  # => ALTER TABLE ADD COLUMN


def downgrade():  # => reverse: drop that same column
    from alembic import op  # => same op object, opposite direction

    # => dropping the column discards its data: downgrades are not free
    op.drop_column("ex27_widgets", "nickname")  # => ALTER TABLE DROP COLUMN
'''
with open(
    os.path.join(versions, "ex27a2_add_column.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev2)  # => second chain link now exists on disk
rev3 = '''"""backfill ex27 widget nicknames."""

revision = "ex27a3"  # => third revision: data only, no schema touched
down_revision = "ex27a2"  # => the parent link that orders the chain


def upgrade():  # => forward: fill the column the previous revision added
    from alembic import op  # => op emits DDL inside the migration transaction

    # => data-only revisions hold UPDATEs, never DDL: one job per revision
    op.execute("UPDATE ex27_widgets SET nickname = UPPER(name) WHERE nickname IS NULL")


def downgrade():  # => reverse: data backfills are not reversed
    # => downgrading data would destroy information: this step is one-way by design
    pass
'''
with open(
    os.path.join(versions, "ex27a3_backfill.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev3)  # => third chain link now exists on disk

# => Schema, then rows, then data: each stop has exactly one job.
config = Config()  # => bare Config: no alembic.ini needed for script runs
config.set_main_option("script_location", scratch)  # => env.py and versions/ live here
config.set_main_option("sqlalchemy.url", url)  # => the service database URL
engine = create_engine(url)  # => separate engine for setup and verification
with engine.begin() as connection:  # => setup runs in a single transaction
    connection.execute(
        text("DROP TABLE IF EXISTS ex27_widgets")
    )  # => leftovers of a killed run vanish
    connection.execute(
        text("DROP TABLE IF EXISTS ex27_version")
    )  # => stale history vanishes too
command.upgrade(config, "ex27a2")  # => schema stops here: table plus empty column
with engine.begin() as connection:  # => seeding runs in a single transaction
    # => rows arrive after the schema: production data always postdates some revision
    connection.execute(
        text("INSERT INTO ex27_widgets (name) VALUES ('ada'), ('grace')")
    )
# => the data stop fills what the schema stop prepared: order is the technique
command.upgrade(config, "head")  # => data stop: the backfill fills both rows
with engine.connect() as connection:  # => fresh connection sees the committed fill
    rows = connection.execute(  # => read every backfilled nickname in id order
        # => ORDER BY keeps reruns byte-identical even as rows accumulate
        text("SELECT nickname FROM ex27_widgets ORDER BY id")
    ).fetchall()  # => materialize every row before printing
print(
    "nicknames:", ", ".join(row[0] for row in rows)
)  # => Output: nicknames: ADA, GRACE
with engine.begin() as connection:  # => cleanup runs in a single transaction
    connection.execute(
        text("DROP TABLE ex27_widgets")
    )  # => the example leaves no tables behind
    connection.execute(
        text("DROP TABLE ex27_version")
    )  # => and no history table either
print("cleaned: yes")  # => Output: cleaned: yes
