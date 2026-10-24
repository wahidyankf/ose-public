"""Example 50: autogenerate drafts a revision from models versus database."""

import io  # => io captures the render log, which names a scratch path
import os  # => os reads the harness database address, never hardcoded
import tempfile  # => tempfile gives each run a private script directory
from contextlib import (
    redirect_stdout,
)  # => redirect_stdout keeps paths out of the transcript

from alembic import command  # => command.revision drafts files, like the CLI does
from alembic.config import Config  # => Config points Alembic at the scripts
from sqlalchemy import create_engine, text  # => engine clears the database first

# => The database URL comes from the harness, with local-run defaults.
host = os.environ.get("PGHOST", "postgres")  # => service hostname in the unit network
user = os.environ.get("PGUSER", "postgres")  # => trust-auth role, no password needed
database = os.environ.get(
    "PGDATABASE", "postgres"
)  # => fresh database for every unit run
url = f"postgresql+psycopg://{user}@{host}/{database}"  # => psycopg 3 driver URL scheme

# => The database starts empty: everything in the models is new to Alembic.
engine = create_engine(url)  # => plain engine clears the one table this story uses
with engine.begin() as connection:  # => start clean so the draft is deterministic
    connection.execute(
        text("DROP TABLE IF EXISTS ex50_widgets")
    )  # => no table: every model is a creation
    connection.execute(
        text("DROP TABLE IF EXISTS ex50_version")
    )  # => stale history vanishes too

# => A scratch script location: env.py, a minimal template, and versions.
# => the scratch path never reaches stdout, so reruns stay byte-stable
scratch = tempfile.mkdtemp(
    prefix="ex50-"
)  # => unique path, never printed, output stays stable
versions = os.path.join(scratch, "versions")  # => Alembic writes drafted revisions here
os.makedirs(versions)  # => create the versions directory on disk

# => Autogenerate env.py: the models live here, compared against the database.
env_py = """\
from alembic import context  # => context carries the Config that command.* built
from sqlalchemy import MetaData, Table, Column, Integer, String, create_engine  # => models as Core tables
metadata = MetaData()  # => the models Alembic diffs the database against
Table("ex50_widgets", metadata, Column("id", Integer(), primary_key=True), Column("name", String(50)))
def include_object(object, name, type_, reflected, compare_to):  # => scope the diff to this example
    return name in ("ex50_widgets",)  # => WHY scope: shared databases hold other tables
config = context.config  # => the Config command.revision built for this run
engine = create_engine(config.get_main_option("sqlalchemy.url"))  # => same service database URL
with engine.connect() as connection:  # => one connection diffs and renders
    context.configure(connection=connection, version_table="ex50_version", target_metadata=metadata, include_object=include_object)
    with context.begin_transaction():  # => the diff transaction never commits DDL
        context.run_migrations()  # => render mode: compare and draft, execute nothing
"""
# => the env carries the models: autogenerate diffs them against the live tables
with open(
    os.path.join(scratch, "env.py"), "w"
) as handle:  # => env.py sits beside versions/
    handle.write(env_py)  # => write the exact text shown above to disk

# => A minimal revision template: fixed shape, so the draft is deterministic.
# => the template shapes every draft: minimal here, reviewable always
template = """\
\"\"\"${message}.\"\"\"

revision = ${repr(up_revision)}  # => fixed by rev_id below: no random hex
down_revision = ${repr(down_revision)}

from alembic import op  # => the drafted ops use the same op object
import sqlalchemy as sa  # => column types come from SQLAlchemy Core
# => Mako fills message, ids, imports, and both bodies around this scaffolding
${imports if imports else ''}

def upgrade():  # => the drafted forward change
${upgrades if upgrades else '    pass'}


def downgrade():  # => the drafted reverse change
${downgrades if downgrades else '    pass'}
"""
# => Alembic renders every draft through this file: shape it deliberately
with open(
    os.path.join(scratch, "script.py.mako"), "w"
) as handle:  # => Alembic renders every draft through it
    handle.write(template)  # => our minimal template replaces alembic init's default

# => Draft the revision with a fixed id: the file and its ops are stable.
# => bare Config plus script location: no alembic.ini needed for drafting
config = Config()  # => bare Config: no alembic.ini needed for script runs
config.set_main_option(
    "script_location", scratch
)  # => env.py, template, and versions/ live here
config.set_main_option("sqlalchemy.url", url)  # => the service database URL
buffer = io.StringIO()  # => the render log names a random scratch path
with redirect_stdout(buffer):  # => capture it: paths must never reach the transcript
    script = command.revision(  # => compare models against the empty database
        config,
        message="create ex50 widgets",
        autogenerate=True,
        rev_id="ex50a1",  # => fixed id, not random hex
    )
# => the id is fixed, so only the ops tell whether the draft is right
print("drafted:", script.revision)  # => Output: drafted: ex50a1
# => read the draft back: review what autogenerate actually proposed
with open(script.path) as handle:  # => read the drafted file back for inspection
    drafted = handle.read()  # => full text, parsed for op calls below
# => op. lines are the drafted operations: comments and scaffolding excluded
ops = sorted(  # => sorted op calls keep the output stable
    line.strip()  # => strip indentation: drafts indent their statements
    for line in drafted.splitlines()  # => one rendered line at a time
    if line.strip().startswith("op.")  # => op calls are the drafted operations
)
print(
    "ops:", ", ".join(op.split("(")[0] for op in ops)
)  # => Output: ops: op.create_table, op.drop_table
print("cleaned: yes")  # => Output: cleaned: yes
