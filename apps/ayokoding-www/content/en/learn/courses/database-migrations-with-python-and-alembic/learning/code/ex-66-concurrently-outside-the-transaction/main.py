"""Example 66: CONCURRENTLY builds the index outside any transaction."""

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
    prefix="ex66-"
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
    context.configure(connection=connection, version_table="ex66_version")  # => per-example history table
    with context.begin_transaction():  # => DDL commits atomically where the database allows
        context.run_migrations()  # => execute every pending revision file in order
"""
with open(
    os.path.join(scratch, "env.py"), "w"
) as handle:  # => env.py sits beside versions/
    handle.write(env_py)  # => write the exact text shown above to disk

# => Two chained revisions: the table, then the concurrent index attempt.
rev1 = '''"""create ex66 widgets."""

revision = "ex66a1"  # => first revision, no parent yet
down_revision = None


def upgrade():  # => forward: build the base table
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => every op call below joins one transaction: all of it commits or none of it does
    op.create_table(  # => CREATE TABLE, recorded in history only on success
        "ex66_widgets",  # => per-example table, no cross-example collision
        sa.Column("id", sa.Integer(), primary_key=True),  # => surrogate key column
        sa.Column("name", sa.String(50), nullable=False),  # => the column the index will cover
    )


def downgrade():  # => reverse: remove the base table
    from alembic import op  # => same op object, opposite direction

    # => downgrade mirrors upgrade in reverse: last created is first dropped
    op.drop_table("ex66_widgets")  # => DROP TABLE undoes exactly the upgrade
'''
with open(
    os.path.join(versions, "ex66a1_create_widgets.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev1)  # => first chain link now exists on disk
rev2 = '''"""index ex66 names concurrently."""

revision = "ex66a2"  # => second revision: the concurrent index that needs no transaction
down_revision = "ex66a1"  # => the parent link that orders the chain


def upgrade():  # => forward: CONCURRENTLY cannot run inside a transaction
    from alembic import op  # => op emits DDL inside the migration transaction

    # => this statement refuses the transaction: PostgreSQL rejects it outright
    op.execute("CREATE INDEX CONCURRENTLY ex66_widgets_name_idx ON ex66_widgets (name)")


def downgrade():  # => reverse: CONCURRENTLY works for drops outside transactions too
    from alembic import op  # => same op object, opposite direction

    # => the matching drop: concurrent both ways, transactional neither
    op.execute("DROP INDEX CONCURRENTLY IF EXISTS ex66_widgets_name_idx")
'''
with open(
    os.path.join(versions, "ex66a2_index.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev2)  # => second chain link now exists on disk

# => Inside a transaction it is refused; in autocommit it succeeds lock-free.
config = Config()  # => bare Config: no alembic.ini needed for script runs
config.set_main_option("script_location", scratch)  # => env.py and versions/ live here
config.set_main_option("sqlalchemy.url", url)  # => the service database URL
engine = create_engine(url)  # => separate engine for setup and verification
with engine.begin() as connection:  # => setup runs in a single transaction
    connection.execute(
        text("DROP TABLE IF EXISTS ex66_widgets")
    )  # => leftovers of a killed run vanish
    connection.execute(
        text("DROP TABLE IF EXISTS ex66_version")
    )  # => stale history vanishes too
# => table first: CONCURRENTLY needs a live target to scan
command.upgrade(
    config, "ex66a1"
)  # => the table exists: the index has something to cover
# => the transactional attempt must refuse: CONCURRENTLY forbids transactions
try:  # => the transactional attempt must refuse: CONCURRENTLY forbids it
    command.upgrade(
        config, "head"
    )  # => env wraps everything in a transaction: rejected
    refused = False  # => reaching here means the guard never fired
except Exception:  # => PostgreSQL rejects concurrent DDL inside transaction blocks
    refused = (
        True  # => the refusal is the lesson: transactions and CONCURRENTLY mix never
    )
print(
    "in transaction:", "refused as designed" if refused else "RAN IN TXN"
)  # => Output: in transaction: refused as designed
# => autocommit runs each statement alone: no transaction block to refuse
free = create_engine(
    url, isolation_level="AUTOCOMMIT"
)  # => autocommit: every statement runs alone
with free.connect() as connection:  # => outside any transaction block now
    # => CONCURRENTLY scans without the exclusive lock: reads flow throughout
    connection.execute(
        text("CREATE INDEX CONCURRENTLY ex66_widgets_name_idx ON ex66_widgets (name)")
    )
with engine.connect() as connection:  # => fresh connection verifies the index
    count = connection.execute(  # => the catalog names the concurrent index or not
        # => a count query keeps the output to one stable number
        text(  # => pg_indexes is PostgreSQL-specific: fine inside a Postgres-only example
            "SELECT COUNT(*) FROM pg_indexes "
            "WHERE tablename = 'ex66_widgets' AND indexname = 'ex66_widgets_name_idx'"
        )
    ).scalar()  # => a single count is all this check needs
print("concurrently:", count == 1)  # => Output: concurrently: True
with engine.begin() as connection:  # => cleanup runs in a single transaction
    connection.execute(
        text("DROP TABLE ex66_widgets")
    )  # => the example leaves no tables behind
    connection.execute(
        text("DROP TABLE ex66_version")
    )  # => and no history table either
print("cleaned: yes")  # => Output: cleaned: yes
