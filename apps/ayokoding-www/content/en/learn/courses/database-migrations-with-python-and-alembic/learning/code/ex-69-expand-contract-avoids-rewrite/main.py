"""Example 69: replace a column instead of rewriting the whole table."""

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
    prefix="ex69-"
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
    context.configure(connection=connection, version_table="ex69_version")  # => per-example history table
    with context.begin_transaction():  # => DDL commits atomically where the database allows
        context.run_migrations()  # => execute every pending revision file in order
"""
with open(
    os.path.join(scratch, "env.py"), "w"
) as handle:  # => env.py sits beside versions/
    handle.write(env_py)  # => write the exact text shown above to disk

# => Two chained revisions: narrow code, then replace it with TEXT, same name.
rev1 = '''"""create ex69 widgets with narrow code."""

revision = "ex69a1"  # => first revision, no parent yet
down_revision = None


def upgrade():  # => forward: build the base table
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => every op call below joins one transaction: all of it commits or none of it does
    op.create_table(  # => CREATE TABLE, recorded in history only on success
        "ex69_widgets",  # => per-example table, no cross-example collision
        sa.Column("id", sa.Integer(), primary_key=True),  # => surrogate key column
        sa.Column("code", sa.String(10), nullable=False),  # => narrow on purpose: the replacement story
    )


def downgrade():  # => reverse: remove the base table
    from alembic import op  # => same op object, opposite direction

    # => downgrade mirrors upgrade in reverse: last created is first dropped
    op.drop_table("ex69_widgets")  # => DROP TABLE undoes exactly the upgrade
'''
with open(
    os.path.join(versions, "ex69a1_create_widgets.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev1)  # => first chain link now exists on disk
rev2 = '''"""replace ex69 code with TEXT, same name."""

revision = "ex69a2"  # => second revision, runs after ex69a1
down_revision = "ex69a1"  # => the parent link that orders the chain


def upgrade():  # => forward: add, copy, drop, rename: no table rewrite
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => ADD COLUMN is metadata-only: no existing row is rewritten for it
    op.add_column("ex69_widgets", sa.Column("code_new", sa.Text()))  # => the wider replacement beside the old
    # => copy values over: every old value fits the new type by construction
    op.execute("UPDATE ex69_widgets SET code_new = code")
    # => drop the narrow original: the replacement holds every value now
    op.drop_column("ex69_widgets", "code")  # => old name gone, values safe in code_new
    # => rename into place: readers keep the name they always used
    op.execute("ALTER TABLE ex69_widgets RENAME COLUMN code_new TO code")  # => same name, wider type


def downgrade():  # => reverse: rebuild narrow, truncating what no longer fits
    from alembic import op  # => same op object, opposite direction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => the reverse rewrites too: narrowing always risks truncation, both ways
    op.add_column("ex69_widgets", sa.Column("code_old", sa.String(10)))  # => the narrow shape returns
    op.execute("UPDATE ex69_widgets SET code_old = SUBSTRING(code FROM 1 FOR 10)")  # => truncate to fit
    op.drop_column("ex69_widgets", "code")  # => wide column goes
    op.execute("ALTER TABLE ex69_widgets RENAME COLUMN code_old TO code")  # => narrow name restored
'''
with open(
    os.path.join(versions, "ex69a2_replace.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev2)  # => second chain link now exists on disk

# => Values cross to the wider type with the column name unchanged.
config = Config()  # => bare Config: no alembic.ini needed for script runs
config.set_main_option("script_location", scratch)  # => env.py and versions/ live here
config.set_main_option("sqlalchemy.url", url)  # => the service database URL
engine = create_engine(url)  # => separate engine for setup and verification
with engine.begin() as connection:  # => setup runs in a single transaction
    connection.execute(
        text("DROP TABLE IF EXISTS ex69_widgets")
    )  # => leftovers of a killed run vanish
    connection.execute(
        text("DROP TABLE IF EXISTS ex69_version")
    )  # => stale history vanishes too
command.upgrade(
    config, "ex69a1"
)  # => the narrow schema: what the old code was built for
with engine.begin() as connection:  # => seeding runs in a single transaction
    # => a full-width seed: exactly 10 characters, the old maximum
    connection.execute(text("INSERT INTO ex69_widgets (code) VALUES ('0123456789')"))
# => add, copy, drop, rename: four steps, zero table rewrites
command.upgrade(config, "head")  # => replace, copy, drop, rename: no table rewrite
with engine.connect() as connection:  # => fresh connection sees the replaced column
    value = connection.execute(  # => the value must cross the replacement intact
        text("SELECT code FROM ex69_widgets")
    ).scalar()  # => exactly one row exists, so scalar is safe
    print("value:", value)  # => Output: value: 0123456789
    data_type = connection.execute(  # => the catalog proves the type really changed
        # => information_schema reports TEXT for the replaced column
        text(  # => data_type names the type family, not the spelling
            "SELECT data_type FROM information_schema.columns "
            "WHERE table_name = 'ex69_widgets' AND column_name = 'code'"
        )
    ).scalar()  # => exactly one column matches, so scalar is safe
    print("type:", data_type)  # => Output: type: text
    columns = connection.execute(  # => the name survived: readers see the same table
        # => information_schema is portable: no PostgreSQL-only catalog tables here
        text(  # => ordering by position keeps the printout stable across reruns
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'ex69_widgets' ORDER BY ordinal_position"
        )
    ).fetchall()  # => materialize every row before printing
print("columns:", ", ".join(row[0] for row in columns))  # => Output: columns: id, code
with engine.begin() as connection:  # => cleanup runs in a single transaction
    # => the replaced table goes: same name, wider type, no other trace
    connection.execute(
        text("DROP TABLE ex69_widgets")
    )  # => the example leaves no tables behind
    connection.execute(
        text("DROP TABLE ex69_version")
    )  # => and no history table either
print("cleaned: yes")  # => Output: cleaned: yes
