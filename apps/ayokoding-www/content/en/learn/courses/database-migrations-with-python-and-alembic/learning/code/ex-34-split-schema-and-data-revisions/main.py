"""Example 34: schema revisions and data revisions stay in separate files."""

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
    prefix="ex34-"
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
    context.configure(connection=connection, version_table="ex34_version")  # => per-example history table
    with context.begin_transaction():  # => DDL commits atomically where the database allows
        context.run_migrations()  # => execute every pending revision file in order
"""
with open(
    os.path.join(scratch, "env.py"), "w"
) as handle:  # => env.py sits beside versions/
    handle.write(env_py)  # => write the exact text shown above to disk

# => Root revision: the base table every later job builds on.
root_rev = '''"""create ex34 widgets."""

revision = "ex34a0"  # => root revision: the base table must exist first
down_revision = None  # => no parent: this is where this history starts


def upgrade():  # => forward: build the base table
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => every op call below joins one transaction: all of it commits or none of it does
    op.create_table(  # => CREATE TABLE, recorded in history only on success
        "ex34_widgets",  # => per-example table, no cross-example collision
        sa.Column("id", sa.Integer(), primary_key=True),  # => surrogate key column
        sa.Column("name", sa.String(50), nullable=False),  # => the source the backfill reads
    )


def downgrade():  # => reverse: remove the base table
    from alembic import op  # => same op object, opposite direction

    # => downgrade mirrors upgrade in reverse: last created is first dropped
    op.drop_table("ex34_widgets")  # => DROP TABLE undoes exactly the upgrade
'''
with open(
    os.path.join(versions, "ex34a0_table.py"), "w"
) as handle:  # => filename marks the table job
    handle.write(root_rev)  # => the root revision file now exists on disk
schema_rev = '''"""add ex34 widget nickname column."""

revision = "ex34a1"  # => schema revision: DDL only, never touches a row
down_revision = "ex34a0"  # => the table job runs first, the column job second


def upgrade():  # => forward: the nullable column alone, nothing else
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => schema-only revisions stay tiny: one column, one statement, one review
    op.add_column("ex34_widgets", sa.Column("nickname", sa.String(50)))  # => ALTER TABLE ADD COLUMN


def downgrade():  # => reverse: drop that same column
    from alembic import op  # => same op object, opposite direction

    # => dropping the column discards its data: downgrades are not free
    op.drop_column("ex34_widgets", "nickname")  # => ALTER TABLE DROP COLUMN
'''
with open(
    os.path.join(versions, "ex34a1_schema.py"), "w"
) as handle:  # => filename marks the schema job
    handle.write(schema_rev)  # => the schema job file now exists on disk
data_rev = '''"""backfill ex34 widget nicknames."""

revision = "ex34a2"  # => data revision: UPDATEs only, never touches the schema
down_revision = "ex34a1"  # => the parent link that orders the chain


def upgrade():  # => forward: fill the column the schema revision added
    from alembic import op  # => op emits DDL inside the migration transaction

    # => data-only revisions hold UPDATEs, never DDL: one job per revision
    op.execute("UPDATE ex34_widgets SET nickname = UPPER(name) WHERE nickname IS NULL")


def downgrade():  # => reverse: deliberately nothing
    # => un-filling derived data would destroy information: one-way by design
    # => the history stamp still retreats: position moves, data stays filled
    pass
'''
with open(
    os.path.join(versions, "ex34a2_data.py"), "w"
) as handle:  # => filename marks the data job
    handle.write(data_rev)  # => the data job file now exists on disk

# => Root, then schema, then data: each file does exactly one of the three.
config = Config()  # => bare Config: no alembic.ini needed for script runs
config.set_main_option("script_location", scratch)  # => env.py and versions/ live here
config.set_main_option("sqlalchemy.url", url)  # => the service database URL
engine = create_engine(url)  # => separate engine for setup and verification
with engine.begin() as connection:  # => setup runs in a single transaction
    connection.execute(
        text("DROP TABLE IF EXISTS ex34_widgets")
    )  # => leftovers of a killed run vanish
    connection.execute(
        text("DROP TABLE IF EXISTS ex34_version")
    )  # => stale history vanishes too
command.upgrade(config, "ex34a0")  # => root only: the bare table exists
with engine.begin() as connection:  # => seeding runs in a single transaction
    # => rows arrive after the table: production data always postdates some revision
    connection.execute(
        text("INSERT INTO ex34_widgets (name) VALUES ('ada'), ('grace')")
    )
command.upgrade(config, "head")  # => schema job, then data job, in chain order
with engine.connect() as connection:  # => fresh connection sees the finished chain
    context = MigrationContext.configure(  # => read history state from this connection
        connection,
        opts={"version_table": "ex34_version"},  # => per-example history table again
    )
    print("heads:", ", ".join(context.get_current_heads()))  # => Output: heads: ex34a2
    rows = connection.execute(  # => read every backfilled nickname in id order
        # => ORDER BY keeps reruns byte-identical even as rows accumulate
        text("SELECT nickname FROM ex34_widgets ORDER BY id")
    ).fetchall()  # => materialize every row before printing
print(
    "nicknames:", ", ".join(row[0] for row in rows)
)  # => Output: nicknames: ADA, GRACE
with engine.begin() as connection:  # => cleanup runs in a single transaction
    connection.execute(
        text("DROP TABLE ex34_widgets")
    )  # => the example leaves no tables behind
    connection.execute(
        text("DROP TABLE ex34_version")
    )  # => and no history table either
print("cleaned: yes")  # => Output: cleaned: yes
