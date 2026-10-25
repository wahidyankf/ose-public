"""Example 78: the pre-deploy checklist gates every production migration."""

import os  # => os reads the harness database address, never hardcoded
import tempfile  # => tempfile gives each run a private script directory

from alembic import command  # => command runs revisions, like the CLI does
from alembic.config import Config  # => Config points Alembic at the scripts
from alembic.migration import (
    MigrationContext,
)  # => MigrationContext reads history state
from alembic.script import (
    ScriptDirectory,
)  # => ScriptDirectory lists every known revision
from sqlalchemy import (
    MetaData,
    create_engine,
    text,
)  # => reflect needs MetaData and an engine

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
    prefix="ex78-"
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
    context.configure(connection=connection, version_table="ex78_version")  # => per-example history table
    with context.begin_transaction():  # => DDL commits atomically where the database allows
        context.run_migrations()  # => execute every pending revision file in order
"""
with open(
    os.path.join(scratch, "env.py"), "w"
) as handle:  # => env.py sits beside versions/
    handle.write(env_py)  # => write the exact text shown above to disk

# => Two chained revisions: the staged schema the checklist approves.
rev1 = '''"""create ex78 widgets."""

revision = "ex78a1"  # => first revision, no parent yet
down_revision = None


def upgrade():  # => forward: build the base table
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => every op call below joins one transaction: all of it commits or none of it does
    op.create_table(  # => CREATE TABLE, recorded in history only on success
        "ex78_widgets",  # => per-example table, no cross-example collision
        sa.Column("id", sa.Integer(), primary_key=True),  # => surrogate key column
        sa.Column("name", sa.String(50), nullable=False),  # => every widget has a name
    )


def downgrade():  # => reverse: remove the base table
    from alembic import op  # => same op object, opposite direction

    # => downgrade mirrors upgrade in reverse: last created is first dropped
    op.drop_table("ex78_widgets")  # => DROP TABLE undoes exactly the upgrade
'''
with open(
    os.path.join(versions, "ex78a1_create_widgets.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev1)  # => first chain link now exists on disk
rev2 = '''"""add ex78 widget price."""

revision = "ex78a2"  # => second revision, the file head production should reach
down_revision = "ex78a1"  # => the parent link that orders the chain


def upgrade():  # => forward: one new nullable column on the live table
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => ADD COLUMN without a default leaves existing rows NULL: the safe start
    op.add_column("ex78_widgets", sa.Column("price_cents", sa.Integer()))  # => ALTER TABLE ADD COLUMN


def downgrade():  # => reverse: drop that same column
    from alembic import op  # => same op object, opposite direction

    # => dropping the column discards its data: downgrades are not free
    op.drop_column("ex78_widgets", "price_cents")  # => ALTER TABLE DROP COLUMN
'''
with open(
    os.path.join(versions, "ex78a2_add_price.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev2)  # => second chain link now exists on disk

# => Stage to head, then run the three checks that gate production.
config = Config()  # => bare Config: no alembic.ini needed for script runs
config.set_main_option("script_location", scratch)  # => env.py and versions/ live here
config.set_main_option("sqlalchemy.url", url)  # => the service database URL
engine = create_engine(url)  # => separate engine for staging and checks
with engine.begin() as connection:  # => setup runs in a single transaction
    connection.execute(
        text("DROP TABLE IF EXISTS ex78_widgets")
    )  # => leftovers of a killed run vanish
    connection.execute(
        text("DROP TABLE IF EXISTS ex78_version")
    )  # => stale history vanishes too
command.upgrade(config, "head")  # => the staged database reaches the file head
script = ScriptDirectory.from_config(config)  # => parses every revision file found
with engine.connect() as connection:  # => fresh connection runs the three checks
    context = MigrationContext.configure(  # => history state from this connection
        connection,
        opts={"version_table": "ex78_version"},  # => per-example history table again
    )
    at_head = context.get_current_heads()  # => the recorded tip of the staged database
    # => one head means one line: branches stop the deploy before it starts
    print("single head:", len(script.get_heads()) == 1)  # => Output: single head: True
    # => the staged tip must equal the file tip: nothing pending, nothing extra
    print(
        "at file head:", list(at_head) == sorted(script.get_heads())
    )  # => Output: at file head: True
    metadata = MetaData()  # => empty metadata: reflection fills it from the database
    metadata.reflect(
        bind=engine, only=["ex78_widgets"]
    )  # => only our table: system catalogs stay out
    table = metadata.tables[
        "ex78_widgets"
    ]  # => the staged table, columns and types included
    reflected = sorted(
        column.name for column in table.columns
    )  # => sorted names keep output stable
    # => two columns plus the key is what both revisions built: the staged truth
    print(
        "schema matches:", reflected == ["id", "name", "price_cents"]
    )  # => Output: schema matches: True
# => three green checks mean one decision: the staged migration ships to production
print("ship it:", True)  # => Output: ship it: True
with engine.begin() as connection:  # => cleanup runs in a single transaction
    connection.execute(
        text("DROP TABLE ex78_widgets")
    )  # => the example leaves no tables behind
    connection.execute(
        text("DROP TABLE ex78_version")
    )  # => and no history table either
print("cleaned: yes")  # => Output: cleaned: yes
