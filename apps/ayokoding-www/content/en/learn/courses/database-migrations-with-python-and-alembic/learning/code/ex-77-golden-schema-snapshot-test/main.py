"""Example 77: snapshot the golden schema and compare on every run."""

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
    prefix="ex77-"
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
    context.configure(connection=connection, version_table="ex77_version")  # => per-example history table
    with context.begin_transaction():  # => DDL commits atomically where the database allows
        context.run_migrations()  # => execute every pending revision file in order
"""
with open(
    os.path.join(scratch, "env.py"), "w"
) as handle:  # => env.py sits beside versions/
    handle.write(env_py)  # => write the exact text shown above to disk

# => One revision to head: the snapshot below must match it exactly.
rev1 = '''"""create ex77 orders with price."""

revision = "ex77a1"  # => single revision: the whole schema under test
down_revision = None


def upgrade():  # => forward: build the base table
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => every op call below joins one transaction: all of it commits or none of it does
    op.create_table(  # => CREATE TABLE, recorded in history only on success
        "ex77_orders",  # => per-example table, no cross-example collision
        sa.Column("id", sa.Integer(), primary_key=True),  # => surrogate key column
        sa.Column("item", sa.String(50), nullable=False),  # => what was ordered
        sa.Column("price_cents", sa.Integer()),  # => optional price in cents
    )


def downgrade():  # => reverse: remove the base table
    from alembic import op  # => same op object, opposite direction

    # => downgrade mirrors upgrade in reverse: last created is first dropped
    op.drop_table("ex77_orders")  # => DROP TABLE undoes exactly the upgrade
'''
with open(
    os.path.join(versions, "ex77a1_create_orders.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev1)  # => the revision file now exists for Alembic to find

# => Migrate, snapshot every table.column pair, and diff against the golden.
config = Config()  # => bare Config: no alembic.ini needed for script runs
config.set_main_option("script_location", scratch)  # => env.py and versions/ live here
config.set_main_option("sqlalchemy.url", url)  # => the service database URL
engine = create_engine(url)  # => separate engine for setup and verification
with engine.begin() as connection:  # => setup runs in a single transaction
    connection.execute(
        text("DROP TABLE IF EXISTS ex77_orders")
    )  # => leftovers of a killed run vanish
    connection.execute(
        text("DROP TABLE IF EXISTS ex77_version")
    )  # => stale history vanishes too
command.upgrade(config, "head")  # => the schema under test lands in full
with engine.connect() as connection:  # => fresh connection snapshots the result
    rows = connection.execute(  # => every table.column pair this example owns
        # => LIKE patterns stay fixed: no timing or path leaks in
        text(  # => information_schema is portable: no PostgreSQL-only catalog tables here
            "SELECT table_name || '.' || column_name FROM information_schema.columns "
            "WHERE table_name LIKE 'ex77\\_%' AND table_name <> 'ex77_version' ORDER BY 1"
        )
    ).fetchall()  # => materialize every row before printing
snapshot = [row[0] for row in rows]  # => plain list of table.column pairs
print(
    "snapshot:", ", ".join(snapshot)
)  # => Output: snapshot: ex77_orders.id, ex77_orders.item, ex77_orders.price_cents
# => the golden list is the contract: any drift fails the comparison below
golden = [
    "ex77_orders.id",
    "ex77_orders.item",
    "ex77_orders.price_cents",
]  # => frozen at review time
# => equality means the migration reproduces the reviewed schema exactly
print("match:", snapshot == golden)  # => Output: match: True
with engine.begin() as connection:  # => cleanup runs in a single transaction
    connection.execute(
        text("DROP TABLE ex77_orders")
    )  # => the example leaves no tables behind
    connection.execute(
        text("DROP TABLE ex77_version")
    )  # => and no history table either
print("cleaned: yes")  # => Output: cleaned: yes
