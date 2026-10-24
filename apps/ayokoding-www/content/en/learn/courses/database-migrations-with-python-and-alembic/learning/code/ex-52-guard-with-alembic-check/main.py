"""Example 52: alembic check guards the model against silent drift."""

import os  # => os reads the harness database address, never hardcoded
import tempfile  # => tempfile gives each run a private script directory

from alembic import command  # => command.check compares models, like the CLI does
from alembic.config import Config  # => Config points Alembic at the scripts
from sqlalchemy import create_engine, text  # => engine builds and drifts the schema

# => The database URL comes from the harness, with local-run defaults.
host = os.environ.get("PGHOST", "postgres")  # => service hostname in the unit network
user = os.environ.get("PGUSER", "postgres")  # => trust-auth role, no password needed
database = os.environ.get(
    "PGDATABASE", "postgres"
)  # => fresh database for every unit run
url = f"postgresql+psycopg://{user}@{host}/{database}"  # => psycopg 3 driver URL scheme

# => A matching table stands in for the deployed schema the models describe.
engine = create_engine(url)  # => plain engine builds the matching schema
with engine.begin() as connection:  # => setup runs in a single transaction
    connection.execute(
        text("DROP TABLE IF EXISTS ex52_widgets")
    )  # => leftovers of a killed run vanish
    # => the table matches the models below column for column
    connection.execute(
        text(
            "CREATE TABLE ex52_widgets (id INTEGER PRIMARY KEY, name VARCHAR(50) NOT NULL)"
        )
    )

# => A scratch script location: env.py plus one versions directory.
# => the scratch path never reaches stdout, so reruns stay byte-stable
scratch = tempfile.mkdtemp(
    prefix="ex52-"
)  # => unique path, never printed, output stays stable
versions = os.path.join(
    scratch, "versions"
)  # => Alembic finds no revisions here, and needs none
os.makedirs(versions)  # => create the versions directory on disk

# => Check env.py: the models live here, compared against the database.
env_py = """\
from alembic import context  # => context carries the Config that command.* built
from sqlalchemy import MetaData, Table, Column, Integer, String, create_engine  # => models as Core tables
metadata = MetaData()  # => the models alembic check diffs the database against
# => nullable=False matches the table: the clean check must find zero diffs
Table("ex52_widgets", metadata, Column("id", Integer(), primary_key=True), Column("name", String(50), nullable=False))
config = context.config  # => the Config command.check built for this run
engine = create_engine(config.get_main_option("sqlalchemy.url"))  # => same service database URL
with engine.connect() as connection:  # => one connection diffs models against tables
    context.configure(connection=connection, target_metadata=metadata)  # => no version table: check needs none
    with context.begin_transaction():  # => the diff transaction never commits DDL
        context.run_migrations()  # => compare mode: diff and report, execute nothing
"""
with open(
    os.path.join(scratch, "env.py"), "w"
) as handle:  # => env.py sits beside versions/
    handle.write(env_py)  # => write the exact text shown above to disk

# => Check clean, drift by hand, check again: the guard must catch it.
config = Config()  # => bare Config: no alembic.ini needed for script runs
config.set_main_option("script_location", scratch)  # => env.py and versions/ live here
config.set_main_option("sqlalchemy.url", url)  # => the service database URL
try:  # => the clean check must pass silently: no diffs, no exception
    command.check(config)  # => compare models against the matching table
    clean = True  # => reaching here means models and schema agree
except Exception:  # => any failure here means the guard misfires on clean state
    clean = False  # => must never happen: the table matches the models
print("check clean:", clean)  # => Output: check clean: True
with engine.begin() as connection:  # => drift by hand: an unmodeled column appears
    # => raw DDL outside any revision or model: the classic silent drift
    connection.execute(text("ALTER TABLE ex52_widgets ADD COLUMN status VARCHAR(10)"))
try:  # => the drifted check must raise: the guard earns its keep here
    command.check(config)  # => compare models against the drifted table
    caught = False  # => reaching here means the guard missed real drift
except Exception:  # => the guard reports drift as an exception, by design
    caught = True  # => the unmodeled column tripped the comparison
# => catching the drift is the proof: silent schema changes become loud errors
print(
    "check after drift:", "failed as designed" if caught else "MISSED DRIFT"
)  # => Output: check after drift: failed as designed
with engine.begin() as connection:  # => cleanup runs in a single transaction
    connection.execute(
        text("DROP TABLE ex52_widgets")
    )  # => the example leaves no tables behind
print("cleaned: yes")  # => Output: cleaned: yes
