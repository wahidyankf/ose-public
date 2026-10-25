"""Example 23: preview the SQL offline before touching the database."""

import io  # => io captures the SQL Alembic prints instead of showing it
import os  # => os reads the harness database address, never hardcoded
import tempfile  # => tempfile gives each run a private script directory
from contextlib import (
    redirect_stdout,
)  # => redirect_stdout captures printed SQL for filtering

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
    prefix="ex23-"
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
    context.configure(connection=connection, version_table="ex23_version")  # => per-example history table
    with context.begin_transaction():  # => DDL commits atomically where the database allows
        context.run_migrations()  # => execute every pending revision file in order
"""
with open(
    os.path.join(scratch, "env.py"), "w"
) as handle:  # => env.py sits beside versions/
    handle.write(env_py)  # => write the exact text shown above to disk

# => One revision to preview: table plus one lookup index.
rev1 = '''"""create ex23 widgets and index names."""

revision = "ex23a1"  # => single revision, no parent needed
down_revision = None


def upgrade():  # => forward: table plus lookup index together
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => every op call below joins one transaction: all of it commits or none of it does
    op.create_table(  # => CREATE TABLE, recorded in history only on success
        "ex23_widgets",  # => per-example table, no cross-example collision
        sa.Column("id", sa.Integer(), primary_key=True),  # => surrogate key column
        sa.Column("name", sa.String(50), nullable=False),  # => the column lookups filter on
    )
    # => the index ships in the same revision: schema and access path stay in sync
    op.create_index("ex23_widgets_name_idx", "ex23_widgets", ["name"])  # => CREATE INDEX, same transaction


def downgrade():  # => reverse: index first, then the table
    from alembic import op  # => same op object, opposite direction

    # => downgrade reverses in the opposite order: index before table
    op.drop_index("ex23_widgets_name_idx", table_name="ex23_widgets")  # => DROP INDEX before the table goes
    op.drop_table("ex23_widgets")  # => DROP TABLE undoes the table creation
'''
with open(
    os.path.join(versions, "ex23a1_create_widgets.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev1)  # => the revision file now exists for Alembic to find

# => Render the SQL without a connection, keep the DDL lines, print those.
config = Config()  # => bare Config: no alembic.ini needed for script runs
config.set_main_option("script_location", scratch)  # => env.py and versions/ live here
config.set_main_option("sqlalchemy.url", url)  # => the dialect still comes from the URL
buffer = io.StringIO()  # => in-memory capture: nothing reaches the real stdout yet
with redirect_stdout(
    buffer
):  # => command output lands in the buffer, not the transcript
    command.upgrade(config, "head", sql=True)  # => --sql: render only, touch nothing
ddl = [  # => keep the statements a reviewer would read, drop the rest
    line.strip()  # => strip indentation: Alembic indents rendered statements
    for line in buffer.getvalue().splitlines()  # => one rendered line at a time
    if line.strip().startswith(
        ("CREATE TABLE", "CREATE INDEX")
    )  # => DDL only, no history inserts
]
print("preview lines:", len(ddl))  # => Output: preview lines: 3
for statement in ddl:  # => print each kept statement on its own line
    # => version table first, then widgets, then the index: deployment order
    print(
        "sql:", statement.split("(")[0].strip(), "..."
    )  # => Output: sql: CREATE TABLE ... (one line each)
engine = create_engine(url)  # => separate engine for the untouched-database check
with engine.connect() as connection:  # => fresh connection proves nothing ran
    count = connection.execute(  # => the preview must not create anything
        # => a count query keeps the output to one stable number
        text(  # => information_schema is portable: no PostgreSQL-only catalog tables here
            "SELECT COUNT(*) FROM information_schema.tables "
            "WHERE table_name IN ('ex23_widgets', 'ex23_version')"
        )
    ).scalar()  # => a single count is all this check needs
    print("tables after preview:", count)  # => Output: tables after preview: 0
