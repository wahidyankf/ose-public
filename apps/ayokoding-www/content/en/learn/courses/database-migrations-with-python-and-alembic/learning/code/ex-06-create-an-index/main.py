"""Example 6: an index revision speeds lookups without touching rows."""

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
    prefix="ex06-"
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
    context.configure(connection=connection, version_table="ex06_version")  # => per-example history table
    with context.begin_transaction():  # => DDL commits atomically where the database allows
        context.run_migrations()  # => execute every pending revision file in order
"""
with open(
    os.path.join(scratch, "env.py"), "w"
) as handle:  # => env.py sits beside versions/
    handle.write(env_py)  # => write the exact text shown above to disk

# => One revision: table first, then the index on its name column.
rev1 = '''"""create ex06 widgets and index names."""

revision = "ex06a1"  # => single revision, no parent needed
down_revision = None


def upgrade():  # => forward: table plus lookup index together
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => every op call below joins one transaction: all of it commits or none of it does
    op.create_table(  # => CREATE TABLE, recorded in history only on success
        "ex06_widgets",  # => per-example table, no cross-example collision
        sa.Column("id", sa.Integer(), primary_key=True),  # => surrogate key column
        sa.Column("name", sa.String(50), nullable=False),  # => the column lookups filter on
    )
    # => the index ships in the same revision: schema and access path stay in sync
    op.create_index("ex06_widgets_name_idx", "ex06_widgets", ["name"])  # => CREATE INDEX, same transaction


def downgrade():  # => reverse: index first, then the table
    from alembic import op  # => same op object, opposite direction

    # => downgrade reverses in the opposite order: index before table
    op.drop_index("ex06_widgets_name_idx", table_name="ex06_widgets")  # => DROP INDEX before the table goes
    op.drop_table("ex06_widgets")  # => DROP TABLE undoes the table creation
'''
with open(
    os.path.join(versions, "ex06a1_create_widgets.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev1)  # => the revision file now exists for Alembic to find

# => Upgrade, then prove the index exists and ordered reads work.
config = Config()  # => bare Config: no alembic.ini needed for script runs
config.set_main_option("script_location", scratch)  # => env.py and versions/ live here
config.set_main_option("sqlalchemy.url", url)  # => the service database URL
engine = create_engine(url)  # => separate engine for setup and verification
with engine.begin() as connection:  # => setup runs in a single transaction
    connection.execute(
        text("DROP TABLE IF EXISTS ex06_widgets")
    )  # => leftovers of a killed run vanish
    connection.execute(
        text("DROP TABLE IF EXISTS ex06_version")
    )  # => stale history vanishes too
# => one revision means one history row: table and index land together
command.upgrade(config, "head")  # => run the one pending revision
with engine.begin() as connection:  # => verification runs in a single transaction
    names = connection.execute(  # => the catalog names every index on the table
        # => pg_indexes is PostgreSQL-specific: fine inside a Postgres-only example
        text(
            "SELECT indexname FROM pg_indexes WHERE tablename = 'ex06_widgets' ORDER BY 1"
        )
    ).fetchall()  # => materialize every row before printing
    print(
        "indexes:", ", ".join(row[0] for row in names)
    )  # => Output: indexes: ex06_widgets_name_idx, ex06_widgets_pkey
    connection.execute(  # => two rows, inserted out of order on purpose
        text("INSERT INTO ex06_widgets (name) VALUES ('grace'), ('ada')")
    )
    rows = connection.execute(  # => ordered read uses the new index path
        text("SELECT name FROM ex06_widgets ORDER BY name")
    ).fetchall()  # => ORDER BY keeps reruns byte-identical
print("names:", ", ".join(row[0] for row in rows))  # => Output: names: ada, grace
with engine.begin() as connection:  # => cleanup runs in a single transaction
    connection.execute(
        text("DROP TABLE ex06_widgets")
    )  # => the example leaves no tables behind
    connection.execute(
        text("DROP TABLE ex06_version")
    )  # => and no history table either
print("cleaned: yes")  # => Output: cleaned: yes
