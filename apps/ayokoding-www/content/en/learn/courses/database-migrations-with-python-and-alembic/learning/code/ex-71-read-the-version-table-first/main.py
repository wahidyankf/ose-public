"""Example 71: a broken deploy starts with reading the version table."""

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
    prefix="ex71-"
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
    context.configure(connection=connection, version_table="ex71_version")  # => per-example history table
    with context.begin_transaction():  # => DDL commits atomically where the database allows
        context.run_migrations()  # => execute every pending revision file in order
"""
with open(
    os.path.join(scratch, "env.py"), "w"
) as handle:  # => env.py sits beside versions/
    handle.write(env_py)  # => write the exact text shown above to disk

# => Three chained revisions: stop mid-chain, like a deploy that paused.
rev1 = '''"""create ex71 orders."""

revision = "ex71a1"  # => first revision, no parent yet
down_revision = None


def upgrade():  # => forward: build the base table
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => every op call below joins one transaction: all of it commits or none of it does
    op.create_table(  # => CREATE TABLE, recorded in history only on success
        "ex71_orders",  # => per-example table, no cross-example collision
        sa.Column("id", sa.Integer(), primary_key=True),  # => surrogate key column
        sa.Column("item", sa.String(50), nullable=False),  # => what was ordered
    )


def downgrade():  # => reverse: remove the base table
    from alembic import op  # => same op object, opposite direction

    # => downgrade mirrors upgrade in reverse: last created is first dropped
    op.drop_table("ex71_orders")  # => DROP TABLE undoes exactly the upgrade
'''
with open(
    os.path.join(versions, "ex71a1_create_orders.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev1)  # => first chain link now exists on disk
rev2 = '''"""add ex71 order price."""

revision = "ex71a2"  # => second revision, the pause point of this story
down_revision = "ex71a1"  # => the parent link that orders the chain


def upgrade():  # => forward: one new nullable column on the live table
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => ADD COLUMN without a default leaves existing rows NULL: the safe start
    op.add_column("ex71_orders", sa.Column("price_cents", sa.Integer()))  # => ALTER TABLE ADD COLUMN


def downgrade():  # => reverse: drop that same column
    from alembic import op  # => same op object, opposite direction

    # => dropping the column discards its data: downgrades are not free
    op.drop_column("ex71_orders", "price_cents")  # => ALTER TABLE DROP COLUMN
'''
with open(
    os.path.join(versions, "ex71a2_add_price.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev2)  # => second chain link now exists on disk
rev3 = '''"""add ex71 order status."""

revision = "ex71a3"  # => third revision: pending while the deploy is paused
down_revision = "ex71a2"  # => the parent link that orders the chain


def upgrade():  # => forward: one more column on the live table
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => a second nullable column: each revision stays small and reviewable
    op.add_column("ex71_orders", sa.Column("status", sa.String(10)))  # => ALTER TABLE ADD COLUMN


def downgrade():  # => reverse: drop that same column
    from alembic import op  # => same op object, opposite direction

    # => dropping the column discards its data: downgrades are not free
    op.drop_column("ex71_orders", "status")  # => ALTER TABLE DROP COLUMN
'''
with open(
    os.path.join(versions, "ex71a3_add_status.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev3)  # => third chain link now exists on disk

# => The incident state: migrated halfway, then the deploy stopped.
config = Config()  # => bare Config: no alembic.ini needed for script runs
config.set_main_option("script_location", scratch)  # => env.py and versions/ live here
config.set_main_option("sqlalchemy.url", url)  # => the service database URL
engine = create_engine(url)  # => separate engine for setup and diagnosis
with engine.begin() as connection:  # => setup runs in a single transaction
    connection.execute(
        text("DROP TABLE IF EXISTS ex71_orders")
    )  # => leftovers of a killed run vanish
    connection.execute(
        text("DROP TABLE IF EXISTS ex71_version")
    )  # => stale history vanishes too
command.upgrade(config, "ex71a2")  # => the paused deploy: two links ran, one waits

# => Diagnosis starts here: version first, tables second, files third.
with engine.connect() as connection:  # => read-only connection for the diagnosis
    version = connection.execute(  # => the diary names the recorded position
        text(
            "SELECT version_num FROM ex71_version ORDER BY version_num"
        )  # => one row per applied head
    ).scalar()  # => exactly one head applied, so scalar is safe
    print("version:", version)  # => Output: version: ex71a2
    tables = connection.execute(  # => the catalog names every table the example owns
        # => LIKE patterns stay fixed: no timing or path leaks in
        text(  # => information_schema is portable: no PostgreSQL-only catalog tables here
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_name LIKE 'ex71\\_%' ORDER BY table_name"
        )
    ).fetchall()  # => materialize every row before printing
print(
    "tables:", ", ".join(row[0] for row in tables)
)  # => Output: tables: ex71_orders, ex71_version
with engine.begin() as connection:  # => cleanup runs in a single transaction
    connection.execute(
        text("DROP TABLE ex71_orders")
    )  # => the example leaves no tables behind
    connection.execute(
        text("DROP TABLE ex71_version")
    )  # => and no history table either
print("cleaned: yes")  # => Output: cleaned: yes
