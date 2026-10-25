"""Example 70: count statements per revision to see each lock window."""

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
    prefix="ex70-"
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
    context.configure(connection=connection, version_table="ex70_version")  # => per-example history table
    with context.begin_transaction():  # => DDL commits atomically where the database allows
        context.run_migrations()  # => execute every pending revision file in order
"""
with open(
    os.path.join(scratch, "env.py"), "w"
) as handle:  # => env.py sits beside versions/
    handle.write(env_py)  # => write the exact text shown above to disk

# => Two chained revisions: one statement, then two statements, each one window.
rev1 = '''"""create ex70 widgets."""

revision = "ex70a1"  # => first revision: one statement, one lock window
down_revision = None


def upgrade():  # => forward: the single statement of this revision
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => a lone statement needs no coordination: review it in one glance
    op.create_table(  # => CREATE TABLE, recorded in history only on success
        "ex70_widgets",  # => per-example table, no cross-example collision
        sa.Column("id", sa.Integer(), primary_key=True),  # => surrogate key column
        sa.Column("name", sa.String(50), nullable=False),  # => every widget has a name
    )


def downgrade():  # => reverse: the one undo of the one statement
    from alembic import op  # => same op object, opposite direction

    # => downgrade mirrors upgrade in reverse: last created is first dropped
    op.drop_table("ex70_widgets")  # => DROP TABLE undoes exactly the upgrade
'''
with open(
    os.path.join(versions, "ex70a1_create_widgets.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev1)  # => first chain link now exists on disk
rev2 = '''"""index ex70 names and add price."""

revision = "ex70a2"  # => second revision: two statements, still one lock window
down_revision = "ex70a1"  # => the parent link that orders the chain


def upgrade():  # => forward: two statements inside one migration transaction
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => both statements share one transaction: one window, two locks at most
    op.add_column("ex70_widgets", sa.Column("price_cents", sa.Integer()))  # => first statement of the window
    op.create_index("ex70_widgets_name_idx", "ex70_widgets", ["name"])  # => second statement of the window


def downgrade():  # => reverse: both statements unwind in opposite order
    from alembic import op  # => same op object, opposite direction

    # => unwinds newest-first: index before column, creation order reversed
    op.drop_index("ex70_widgets_name_idx", table_name="ex70_widgets")  # => DROP INDEX before the column goes
    op.drop_column("ex70_widgets", "price_cents")  # => drop the column the upgrade added
'''
with open(
    os.path.join(versions, "ex70a2_extend.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev2)  # => second chain link now exists on disk

# => Audit the windows, then run them: statement counts predict lock scope.
audits = []  # => one (revision, windows) pair per file, in chain order
for filename, revision_id in (
    ("ex70a1_create_widgets.py", "ex70a1"),
    ("ex70a2_extend.py", "ex70a2"),
):
    with open(
        os.path.join(versions, filename)
    ) as handle:  # => read each revision back for auditing
        upgrades = handle.read().split("def downgrade")[
            0
        ]  # => forward half only: downgrades are separate windows
        count = sum(
            1 for line in upgrades.splitlines() if line.strip().startswith("op.")
        )  # => upgrade statements
    # => one revision is one transaction: statements share one lock window here
    plural = "s" if count != 1 else ""  # => exact English: 1 statement, 2 statements
    audits.append(
        f"{revision_id}: {count} statement{plural}, 1 window"
    )  # => fixed words, stable across reruns
for audit in audits:  # => one printed line per audited revision
    print(audit)  # => Output: ex70a1: 1 statement, 1 window
# => windows total one per revision: the deploy holds at most one lock window at a time
print("windows total:", len(audits))  # => Output: windows total: 2
config = Config()  # => bare Config: no alembic.ini needed for script runs
config.set_main_option("script_location", scratch)  # => env.py and versions/ live here
config.set_main_option("sqlalchemy.url", url)  # => the service database URL
engine = create_engine(url)  # => separate engine for setup and verification
with engine.begin() as connection:  # => setup runs in a single transaction
    connection.execute(
        text("DROP TABLE IF EXISTS ex70_widgets")
    )  # => leftovers of a killed run vanish
    connection.execute(
        text("DROP TABLE IF EXISTS ex70_version")
    )  # => stale history vanishes too
command.upgrade(config, "head")  # => both windows run in chain order
with engine.begin() as connection:  # => cleanup runs in a single transaction
    connection.execute(
        text("DROP TABLE ex70_widgets")
    )  # => the example leaves no tables behind
    connection.execute(
        text("DROP TABLE ex70_version")
    )  # => and no history table either
print("cleaned: yes")  # => Output: cleaned: yes
