"""Example 61: two developers branch, collide, and merge on a live database."""

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
    prefix="ex61-"
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
    context.configure(connection=connection, version_table="ex61_version")  # => per-example history table
    with context.begin_transaction():  # => DDL commits atomically where the database allows
        context.run_migrations()  # => execute every pending revision file in order
"""
with open(
    os.path.join(scratch, "env.py"), "w"
) as handle:  # => env.py sits beside versions/
    handle.write(env_py)  # => write the exact text shown above to disk

# => Root table plus two same-parent branches: each dev adds their own column.
root_rev = '''"""create ex61 widgets."""

revision = "ex61a1"  # => root revision: the shared base both devs built on
down_revision = None


def upgrade():  # => forward: build the base table
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => every op call below joins one transaction: all of it commits or none of it does
    op.create_table(  # => CREATE TABLE, recorded in history only on success
        "ex61_widgets",  # => per-example table, no cross-example collision
        sa.Column("id", sa.Integer(), primary_key=True),  # => surrogate key column
        sa.Column("name", sa.String(50), nullable=False),  # => every widget has a name
    )


def downgrade():  # => reverse: remove the base table
    from alembic import op  # => same op object, opposite direction

    # => downgrade mirrors upgrade in reverse: last created is first dropped
    op.drop_table("ex61_widgets")  # => DROP TABLE undoes exactly the upgrade
'''
with open(
    os.path.join(versions, "ex61a1_create_widgets.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(root_rev)  # => the root revision file now exists on disk
price_rev = '''"""add ex61 widget price."""

revision = "ex61b1"  # => dev B's branch: same parent as dev C's
down_revision = "ex61a1"  # => both branches share the root as parent


def upgrade():  # => forward: one new nullable column on the live table
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => ADD COLUMN without a default leaves existing rows NULL: the safe start
    op.add_column("ex61_widgets", sa.Column("price_cents", sa.Integer()))  # => ALTER TABLE ADD COLUMN


def downgrade():  # => reverse: drop that same column
    from alembic import op  # => same op object, opposite direction

    # => dropping the column discards its data: downgrades are not free
    op.drop_column("ex61_widgets", "price_cents")  # => ALTER TABLE DROP COLUMN
'''
with open(
    os.path.join(versions, "ex61b1_add_price.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(price_rev)  # => dev B's branch file now exists on disk
status_rev = '''"""add ex61 widget status."""

revision = "ex61c1"  # => dev C's branch: same parent as dev B's
down_revision = "ex61a1"  # => both branches share the root as parent


def upgrade():  # => forward: one new nullable column on the live table
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => a second nullable column: each branch stays small and reviewable
    op.add_column("ex61_widgets", sa.Column("status", sa.String(10)))  # => ALTER TABLE ADD COLUMN


def downgrade():  # => reverse: drop that same column
    from alembic import op  # => same op object, opposite direction

    # => dropping the column discards its data: downgrades are not free
    op.drop_column("ex61_widgets", "status")  # => ALTER TABLE DROP COLUMN
'''
with open(
    os.path.join(versions, "ex61c1_add_status.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(status_rev)  # => dev C's branch file now exists on disk

# => Upgrade refuses two heads; the merge joins them; upgrade finishes both.
config = Config()  # => bare Config: no alembic.ini needed for script runs
config.set_main_option("script_location", scratch)  # => env.py and versions/ live here
config.set_main_option("sqlalchemy.url", url)  # => the service database URL
engine = create_engine(url)  # => separate engine for setup and verification
with engine.begin() as connection:  # => setup runs in a single transaction
    connection.execute(
        text("DROP TABLE IF EXISTS ex61_widgets")
    )  # => leftovers of a killed run vanish
    connection.execute(
        text("DROP TABLE IF EXISTS ex61_version")
    )  # => stale history vanishes too
# => the shared base lands first: both branches build on top of it
command.upgrade(config, "ex61a1")  # => the shared base both branches built on
script = ScriptDirectory.from_config(config)  # => parses every revision file found
print(
    "two heads:", ", ".join(sorted(script.get_heads()))
)  # => Output: two heads: ex61b1, ex61c1
try:  # => upgrading past two heads must refuse: no defined next step exists
    command.upgrade(
        config, "head"
    )  # => ambiguous target: Alembic raises instead of guessing
    refused = False  # => reaching here means the guard never fired
except Exception:  # => any refusal proves the guard works: deploys stop at branches
    refused = True  # => the operator must merge before the deploy can continue
print("upgrade refused:", refused)  # => Output: upgrade refused: True

# => The merge joins the branches with no DDL of its own: order restored.
merge_rev = '''"""merge ex61 branches."""

revision = "ex61m1"  # => the merge link: one child of two parents
down_revision = ("ex61b1", "ex61c1")  # => both branch tips, sorted for stability


def upgrade():  # => forward: merges carry no DDL of their own
    # => empty upgrade: the branches already hold every change
    pass


def downgrade():  # => reverse: split back into two heads
    # => empty downgrade: splitting restores the branch tips exactly
    pass
'''
with open(
    os.path.join(versions, "ex61m1_merge.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(merge_rev)  # => the merge file joins the two branches on disk
# => both branches plus the merge run: order restored by the merge link
command.upgrade(config, "head")  # => both branches plus the merge run in order
with engine.connect() as connection:  # => fresh connection sees the merged table
    context = MigrationContext.configure(  # => read history state from this connection
        connection,
        opts={"version_table": "ex61_version"},  # => per-example history table again
    )
    print(
        "after merge:", ", ".join(context.get_current_heads())
    )  # => Output: after merge: ex61m1
    columns = connection.execute(  # => both branch columns landed on the one table
        # => information_schema is portable: no PostgreSQL-only catalog tables here
        text(  # => alphabetical order: branch execution order never affects it
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'ex61_widgets' ORDER BY column_name"
        )
    ).fetchall()  # => materialize every row before printing
print(
    "columns:", ", ".join(row[0] for row in columns)
)  # => Output: columns: id, name, price_cents, status
with engine.begin() as connection:  # => cleanup runs in a single transaction
    # => the merged table goes: both branch columns disappear with it
    connection.execute(
        text("DROP TABLE ex61_widgets")
    )  # => the example leaves no tables behind
    connection.execute(
        text("DROP TABLE ex61_version")
    )  # => and no history table either
print("cleaned: yes")  # => Output: cleaned: yes
