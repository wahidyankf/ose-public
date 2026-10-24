"""Example 51: autogenerate sees schema, never data."""

import io  # => io captures the render log, which names a scratch path
import os  # => os reads the harness database address, never hardcoded
import tempfile  # => tempfile gives each run a private script directory
from contextlib import (
    redirect_stdout,
)  # => redirect_stdout keeps paths out of the transcript

from alembic import command  # => command.revision drafts files, like the CLI does
from alembic.config import Config  # => Config points Alembic at the scripts
from sqlalchemy import create_engine, text  # => engine seeds and checks the database

# => The database URL comes from the harness, with local-run defaults.
host = os.environ.get("PGHOST", "postgres")  # => service hostname in the unit network
user = os.environ.get("PGUSER", "postgres")  # => trust-auth role, no password needed
database = os.environ.get(
    "PGDATABASE", "postgres"
)  # => fresh database for every unit run
url = f"postgresql+psycopg://{user}@{host}/{database}"  # => psycopg 3 driver URL scheme

# => A matching table plus one row: schema agrees, data exists, draft must be empty.
engine = create_engine(url)  # => plain engine builds the matching schema
with engine.begin() as connection:  # => setup runs in a single transaction
    connection.execute(
        text("DROP TABLE IF EXISTS ex51_widgets")
    )  # => leftovers of a killed run vanish
    connection.execute(
        text("DROP TABLE IF EXISTS ex51_version")
    )  # => stale history vanishes too
    # => the table matches the models below column for column
    connection.execute(
        text(
            "CREATE TABLE ex51_widgets (id INTEGER PRIMARY KEY, name VARCHAR(50) NOT NULL)"
        )
    )
    # => one real row lives here: the draft below must ignore it completely
    # => explicit id: hand-built tables have no autoincrement sequence
    connection.execute(
        text("INSERT INTO ex51_widgets (id, name) VALUES (1, 'sprocket')")
    )

# => A scratch script location: env.py, a minimal template, and versions.
# => the scratch path never reaches stdout, so reruns stay byte-stable
scratch = tempfile.mkdtemp(
    prefix="ex51-"
)  # => unique path, never printed, output stays stable
versions = os.path.join(scratch, "versions")  # => Alembic writes drafted revisions here
os.makedirs(versions)  # => create the versions directory on disk

# => Autogenerate env.py: the models live here, compared against the database.
env_py = """\
from alembic import context  # => context carries the Config that command.* built
from sqlalchemy import MetaData, Table, Column, Integer, String, create_engine  # => models as Core tables
metadata = MetaData()  # => the models Alembic diffs the database against
# => nullable=False matches the table: the draft below must find zero diffs
Table("ex51_widgets", metadata, Column("id", Integer(), primary_key=True), Column("name", String(50), nullable=False))
def include_object(object, name, type_, reflected, compare_to):  # => scope the diff to this example
    return name in ("ex51_widgets",)  # => WHY scope: shared databases hold other tables
config = context.config  # => the Config command.revision built for this run
engine = create_engine(config.get_main_option("sqlalchemy.url"))  # => same service database URL
with engine.connect() as connection:  # => one connection diffs and renders
    context.configure(connection=connection, version_table="ex51_version", target_metadata=metadata, include_object=include_object)
    with context.begin_transaction():  # => the diff transaction never commits DDL
        context.run_migrations()  # => render mode: compare and draft, execute nothing
"""
with open(
    os.path.join(scratch, "env.py"), "w"
) as handle:  # => env.py sits beside versions/
    handle.write(env_py)  # => write the exact text shown above to disk

# => A minimal revision template: fixed shape, so the draft is deterministic.
template = """\
\"\"\"${message}.\"\"\"

revision = ${repr(up_revision)}  # => fixed by rev_id below: no random hex
down_revision = ${repr(down_revision)}

from alembic import op  # => the drafted ops use the same op object
import sqlalchemy as sa  # => column types come from SQLAlchemy Core
${imports if imports else ''}

def upgrade():  # => the drafted forward change
${upgrades if upgrades else '    pass'}


def downgrade():  # => the drafted reverse change
${downgrades if downgrades else '    pass'}
"""
with open(
    os.path.join(scratch, "script.py.mako"), "w"
) as handle:  # => Alembic renders every draft through it
    handle.write(template)  # => our minimal template replaces alembic init's default

# => Draft against the matching schema: the row must not appear in the draft.
config = Config()  # => bare Config: no alembic.ini needed for script runs
config.set_main_option(
    "script_location", scratch
)  # => env.py, template, and versions/ live here
config.set_main_option("sqlalchemy.url", url)  # => the service database URL
buffer = io.StringIO()  # => the render log names a random scratch path
# => the draft writes files under a random path: none of it reaches stdout
with redirect_stdout(buffer):  # => capture it: paths must never reach the transcript
    script = command.revision(  # => compare models against the matching table
        config,
        message="review ex51",
        autogenerate=True,
        rev_id="ex51a1",  # => fixed id, not random hex
    )
# => matching schema means an empty diff: the draft should hold only pass
print("drafted:", script.revision)  # => Output: drafted: ex51a1
# => read the draft back: an empty body proves the differ saw no schema work
with open(script.path) as handle:  # => read the drafted file back for inspection
    drafted = handle.read()  # => full text, parsed for op calls below
ops = [  # => op calls are the drafted operations, if the diff found any
    line.strip()  # => strip indentation: drafts indent their statements
    for line in drafted.splitlines()  # => one rendered line at a time
    if line.strip().startswith("op.")  # => nothing starts with op. in an empty draft
]
# => the row is invisible to the differ: one data row, zero drafted operations
with engine.connect() as connection:  # => fresh connection counts the seeded row
    rows = connection.execute(
        text("SELECT COUNT(*) FROM ex51_widgets")
    ).scalar()  # => exactly one row lives here
print("data rows:", rows)  # => Output: data rows: 1
print(
    "rendered ops:", ", ".join(op.split("(")[0] for op in ops) or "none"
)  # => Output: rendered ops: none
with engine.begin() as connection:  # => cleanup runs in a single transaction
    # => the matching table goes: the invisible seed row goes with it
    connection.execute(
        text("DROP TABLE ex51_widgets")
    )  # => the example leaves no tables behind
print("cleaned: yes")  # => Output: cleaned: yes
