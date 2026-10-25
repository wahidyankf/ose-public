"""Example 33: default, then backfill, then NOT NULL, in three revisions."""

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
    prefix="ex33-"
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
    context.configure(connection=connection, version_table="ex33_version")  # => per-example history table
    with context.begin_transaction():  # => DDL commits atomically where the database allows
        context.run_migrations()  # => execute every pending revision file in order
"""
with open(
    os.path.join(scratch, "env.py"), "w"
) as handle:  # => env.py sits beside versions/
    handle.write(env_py)  # => write the exact text shown above to disk

# => Four chained revisions: table, nullable tier, per-row tiers, strict tier.
rev1 = '''"""create ex33 widgets."""

revision = "ex33a1"  # => first revision, no parent yet
down_revision = None


def upgrade():  # => forward: build the base table
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => every op call below joins one transaction: all of it commits or none of it does
    op.create_table(  # => CREATE TABLE, recorded in history only on success
        "ex33_widgets",  # => per-example table, no cross-example collision
        sa.Column("id", sa.Integer(), primary_key=True),  # => surrogate key column
        sa.Column("name", sa.String(50), nullable=False),  # => the source the backfill reads
    )


def downgrade():  # => reverse: remove the base table
    from alembic import op  # => same op object, opposite direction

    # => downgrade mirrors upgrade in reverse: last created is first dropped
    op.drop_table("ex33_widgets")  # => DROP TABLE undoes exactly the upgrade
'''
with open(
    os.path.join(versions, "ex33a1_create_widgets.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev1)  # => first chain link now exists on disk
rev2 = '''"""add ex33 widget tier column."""

revision = "ex33a2"  # => second revision: schema only, nullable start
down_revision = "ex33a1"  # => the parent link that orders the chain


def upgrade():  # => forward: the nullable column alone, nothing else
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => schema-only revisions stay tiny: one column, one statement, one review
    op.add_column("ex33_widgets", sa.Column("tier", sa.String(10)))  # => ALTER TABLE ADD COLUMN


def downgrade():  # => reverse: drop that same column
    from alembic import op  # => same op object, opposite direction

    # => dropping the column discards its data: downgrades are not free
    op.drop_column("ex33_widgets", "tier")  # => ALTER TABLE DROP COLUMN
'''
with open(
    os.path.join(versions, "ex33a2_add_column.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev2)  # => second chain link now exists on disk
rev3 = '''"""backfill ex33 widget tiers."""

revision = "ex33a3"  # => third revision: data only, no schema touched
down_revision = "ex33a2"  # => the parent link that orders the chain


def upgrade():  # => forward: per-row values no single default could express
    from alembic import op  # => op emits DDL inside the migration transaction

    # => data-only revisions hold UPDATEs, never DDL: one job per revision
    op.execute("UPDATE ex33_widgets SET tier = 'gold' WHERE id = 1")
    # => the second band gets its own statement: reviewable, rerunnable, clear
    op.execute("UPDATE ex33_widgets SET tier = 'silver' WHERE id = 2")


def downgrade():  # => reverse: deliberately nothing
    # => un-filling derived data would destroy information: one-way by design
    # => the history stamp still retreats: position moves, data stays filled
    pass
'''
with open(
    os.path.join(versions, "ex33a3_backfill.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev3)  # => third chain link now exists on disk
rev4 = '''"""require ex33 widget tier."""

revision = "ex33a4"  # => fourth revision: the strict finish
down_revision = "ex33a3"  # => the parent link that orders the chain


def upgrade():  # => forward: NOT NULL is safe only after every row complies
    from alembic import op  # => op emits DDL inside the migration transaction

    # => SET NOT NULL fails on the first NULL: the backfill above prevents that
    op.alter_column("ex33_widgets", "tier", nullable=False)  # => ALTER TABLE ALTER COLUMN SET NOT NULL


def downgrade():  # => reverse: relax the constraint again
    from alembic import op  # => same op object, opposite direction

    # => relaxing keeps every row: downgrades of constraints never lose data
    op.alter_column("ex33_widgets", "tier", nullable=True)  # => ALTER TABLE ALTER COLUMN DROP NOT NULL
'''
with open(
    os.path.join(versions, "ex33a4_require.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev4)  # => fourth chain link now exists on disk

# => Schema, rows, data, strictness: each revision does exactly one of them.
config = Config()  # => bare Config: no alembic.ini needed for script runs
config.set_main_option("script_location", scratch)  # => env.py and versions/ live here
config.set_main_option("sqlalchemy.url", url)  # => the service database URL
engine = create_engine(url)  # => separate engine for setup and verification
with engine.begin() as connection:  # => setup runs in a single transaction
    connection.execute(
        text("DROP TABLE IF EXISTS ex33_widgets")
    )  # => leftovers of a killed run vanish
    connection.execute(
        text("DROP TABLE IF EXISTS ex33_version")
    )  # => stale history vanishes too
command.upgrade(config, "ex33a2")  # => schema stops here: table plus empty tier
with engine.begin() as connection:  # => seeding runs in a single transaction
    # => rows arrive after the schema: production data always postdates some revision
    # => gold for id 1, silver for id 2: values no single default could express
    connection.execute(
        text("INSERT INTO ex33_widgets (name) VALUES ('sprocket'), ('gadget')")
    )
# => backfill first, strictness second: the order is the whole technique
command.upgrade(config, "head")  # => backfill, then the strict constraint lands
with engine.connect() as connection:  # => fresh connection sees the strict table
    rows = connection.execute(  # => read every tier in id order
        # => ORDER BY keeps reruns byte-identical even as rows accumulate
        text("SELECT tier FROM ex33_widgets ORDER BY id")
    ).fetchall()  # => materialize every row before printing
    print("tiers:", ", ".join(row[0] for row in rows))  # => Output: tiers: gold, silver
    nullable = connection.execute(  # => the catalog proves the constraint is real
        # => information_schema reports YES or NO per column
        text(  # => ordering by position keeps the printout stable across reruns
            "SELECT is_nullable FROM information_schema.columns "
            "WHERE table_name = 'ex33_widgets' AND column_name = 'tier'"
        )
    ).scalar()  # => exactly one column matches, so scalar is safe
print("nullable:", nullable)  # => Output: nullable: NO
with engine.begin() as connection:  # => cleanup runs in a single transaction
    connection.execute(
        text("DROP TABLE ex33_widgets")
    )  # => the example leaves no tables behind
    connection.execute(
        text("DROP TABLE ex33_version")
    )  # => and no history table either
print("cleaned: yes")  # => Output: cleaned: yes
