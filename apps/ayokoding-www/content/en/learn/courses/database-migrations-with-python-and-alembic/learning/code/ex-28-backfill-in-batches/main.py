"""Example 28: big backfills run in small batches, not one huge UPDATE."""

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
    prefix="ex28-"
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
    context.configure(connection=connection, version_table="ex28_version")  # => per-example history table
    with context.begin_transaction():  # => DDL commits atomically where the database allows
        context.run_migrations()  # => execute every pending revision file in order
"""
with open(
    os.path.join(scratch, "env.py"), "w"
) as handle:  # => env.py sits beside versions/
    handle.write(env_py)  # => write the exact text shown above to disk

# => Two chained revisions: create the table, then batch-fill the new column.
rev1 = '''"""create ex28 widgets."""

revision = "ex28a1"  # => first revision, no parent yet
down_revision = None


def upgrade():  # => forward: build the base table
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => every op call below joins one transaction: all of it commits or none of it does
    op.create_table(  # => CREATE TABLE, recorded in history only on success
        "ex28_widgets",  # => per-example table, no cross-example collision
        sa.Column("id", sa.Integer(), primary_key=True),  # => surrogate key column
        sa.Column("name", sa.String(50), nullable=False),  # => the source the backfill reads
    )


def downgrade():  # => reverse: remove the base table
    from alembic import op  # => same op object, opposite direction

    # => downgrade mirrors upgrade in reverse: last created is first dropped
    op.drop_table("ex28_widgets")  # => DROP TABLE undoes exactly the upgrade
'''
with open(
    os.path.join(versions, "ex28a1_create_widgets.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev1)  # => first chain link now exists on disk
rev2 = '''"""batch-backfill ex28 widget nicknames."""

revision = "ex28a2"  # => second revision, runs after ex28a1
down_revision = "ex28a1"  # => the parent link that orders the chain


def upgrade():  # => forward: column first, then the fill in small batches
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => the column lands nullable: existing rows get NULL, not a failure
    op.add_column("ex28_widgets", sa.Column("nickname", sa.String(50)))  # => ALTER TABLE ADD COLUMN
    # => one giant UPDATE locks every row at once: batches of two keep locks tiny
    for low in (1, 3, 5):  # => fixed id bands: deterministic, reviewable, restartable
        op.execute(  # => each UPDATE touches at most two rows, then releases
            f"UPDATE ex28_widgets SET nickname = UPPER(name) "  # => the same fill, band by band
            f"WHERE id >= {low} AND id < {low + 2} AND nickname IS NULL"  # => IS NULL skips already-filled rows
        )


def downgrade():  # => reverse: drop the column, data and all
    from alembic import op  # => same op object, opposite direction

    # => dropping the column discards its data: downgrades are not free
    op.drop_column("ex28_widgets", "nickname")  # => ALTER TABLE DROP COLUMN
'''
with open(
    os.path.join(versions, "ex28a2_backfill.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev2)  # => second chain link now exists on disk

# => Five rows, bands of two: three small UPDATEs instead of one big one.
config = Config()  # => bare Config: no alembic.ini needed for script runs
config.set_main_option("script_location", scratch)  # => env.py and versions/ live here
config.set_main_option("sqlalchemy.url", url)  # => the service database URL
engine = create_engine(url)  # => separate engine for setup and verification
with engine.begin() as connection:  # => setup runs in a single transaction
    connection.execute(
        text("DROP TABLE IF EXISTS ex28_widgets")
    )  # => leftovers of a killed run vanish
    connection.execute(
        text("DROP TABLE IF EXISTS ex28_version")
    )  # => stale history vanishes too
command.upgrade(config, "ex28a1")  # => create the table, stop before the backfill
with engine.begin() as connection:  # => seeding runs in a single transaction
    # => ids 1-5 land in three bands: [1,3), [3,5), [5,7)
    # => five rows: enough that one UPDATE would hold five row locks at once
    connection.execute(
        text(
            "INSERT INTO ex28_widgets (name) VALUES "
            + ", ".join(["('w%d')" % i for i in range(5)])
        )
    )
command.upgrade(config, "head")  # => add the column and fill it band by band
with engine.connect() as connection:  # => fresh connection sees the committed fill
    count = connection.execute(  # => every row must carry the derived nickname
        # => a count query keeps the output to one stable number
        text(  # => COUNT(*) FILTER counts only rows matching the condition
            "SELECT COUNT(*) FROM ex28_widgets WHERE nickname = UPPER(name)"
        )
    ).scalar()  # => a single count is all this check needs
    sample = connection.execute(  # => one concrete value proves the transform ran
        text("SELECT nickname FROM ex28_widgets WHERE name = 'w0'")
    ).scalar()  # => exactly one row matches, so scalar is safe
print("backfilled:", count)  # => Output: backfilled: 5
print("sample:", sample)  # => Output: sample: W0
with engine.begin() as connection:  # => cleanup runs in a single transaction
    connection.execute(
        text("DROP TABLE ex28_widgets")
    )  # => the example leaves no tables behind
    connection.execute(
        text("DROP TABLE ex28_version")
    )  # => and no history table either
print("cleaned: yes")  # => Output: cleaned: yes
