"""Example 19: rollback removes its own change and keeps unrelated data."""

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
    prefix="ex19-"
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
    context.configure(connection=connection, version_table="ex19_version")  # => per-example history table
    with context.begin_transaction():  # => DDL commits atomically where the database allows
        context.run_migrations()  # => execute every pending revision file in order
"""
with open(
    os.path.join(scratch, "env.py"), "w"
) as handle:  # => env.py sits beside versions/
    handle.write(env_py)  # => write the exact text shown above to disk

# => Two chained revisions: the second touches widgets only, never the log.
rev1 = '''"""create ex19 widgets and audit log."""

revision = "ex19a1"  # => first revision, no parent yet
down_revision = None


def upgrade():  # => forward: build both tables the example owns
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => every op call below joins one transaction: all of it commits or none of it does
    op.create_table(  # => the migrated table: later revisions change this one
        "ex19_widgets",  # => per-example table, no cross-example collision
        sa.Column("id", sa.Integer(), primary_key=True),  # => surrogate key column
        sa.Column("name", sa.String(50), nullable=False),  # => every widget has a name
    )
    op.create_table(  # => the bystander table: no revision ever alters it
        "ex19_audit_log",  # => audit rows must survive every rollback below
        sa.Column("id", sa.Integer(), primary_key=True),  # => surrogate key column
        sa.Column("note", sa.String(100), nullable=False),  # => free-text audit note
    )


def downgrade():  # => reverse: remove both tables this revision built
    from alembic import op  # => same op object, opposite direction

    # => downgrade mirrors upgrade in reverse: last created is first dropped
    op.drop_table("ex19_audit_log")  # => bystander goes first, creation order reversed
    op.drop_table("ex19_widgets")  # => DROP TABLE undoes exactly the upgrade
'''
with open(
    os.path.join(versions, "ex19a1_create_tables.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev1)  # => first chain link now exists on disk
rev2 = '''"""add ex19 widget price."""

revision = "ex19a2"  # => second revision, runs after ex19a1
down_revision = "ex19a1"  # => the parent link that orders the chain


def upgrade():  # => forward: one new nullable column on the widgets table
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => ADD COLUMN targets widgets only: the audit log is never mentioned
    op.add_column("ex19_widgets", sa.Column("price_cents", sa.Integer()))  # => ALTER TABLE ADD COLUMN


def downgrade():  # => reverse: drop that same column
    from alembic import op  # => same op object, opposite direction

    # => dropping the column discards its data: downgrades are not free
    op.drop_column("ex19_widgets", "price_cents")  # => ALTER TABLE DROP COLUMN
'''
with open(
    os.path.join(versions, "ex19a2_add_price.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev2)  # => second chain link now exists on disk

# => Seed the bystander, migrate, roll back, then prove the bystander survived.
config = Config()  # => bare Config: no alembic.ini needed for script runs
config.set_main_option("script_location", scratch)  # => env.py and versions/ live here
config.set_main_option("sqlalchemy.url", url)  # => the service database URL
engine = create_engine(url)  # => separate engine for setup and verification
with engine.begin() as connection:  # => setup runs in a single transaction
    connection.execute(
        text("DROP TABLE IF EXISTS ex19_widgets")
    )  # => leftovers of a killed run vanish
    connection.execute(
        text("DROP TABLE IF EXISTS ex19_audit_log")
    )  # => bystander leftovers vanish too
    connection.execute(
        text("DROP TABLE IF EXISTS ex19_version")
    )  # => stale history vanishes too
# => head creates both tables and adds the column in chain order
command.upgrade(config, "head")  # => both revisions run: tables plus the price column
with engine.begin() as connection:  # => seeding runs in a single transaction
    # => the audit row is business data: migrations must never endanger it
    # => the audit row is the control group: no revision may touch it
    connection.execute(
        text("INSERT INTO ex19_audit_log (note) VALUES ('deploy approved')")
    )
    connection.execute(
        text("INSERT INTO ex19_widgets (name, price_cents) VALUES ('sprocket', 199)")
    )
# => rolling back the price column must not touch the audit log rows
command.downgrade(config, "-1")  # => one step back: only the price column reverses
with engine.connect() as connection:  # => fresh connection sees the committed drop
    notes = connection.execute(  # => the bystander table keeps every row it had
        # => ORDER BY keeps reruns byte-identical even as rows accumulate
        text("SELECT note FROM ex19_audit_log ORDER BY id")
    ).fetchall()  # => materialize every row before printing
    print(
        "audit:", ", ".join(row[0] for row in notes)
    )  # => Output: audit: deploy approved
    columns = (
        connection.execute(  # => ask the catalog what the widgets table looks like
            # => information_schema is portable: no PostgreSQL-only catalog tables here
            text(  # => ordering by position keeps the printout stable across reruns
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name = 'ex19_widgets' ORDER BY ordinal_position"
            )
        ).fetchall()
    )  # => materialize every row before printing
print("widgets:", ", ".join(row[0] for row in columns))  # => Output: widgets: id, name
with engine.begin() as connection:  # => cleanup runs in a single transaction
    connection.execute(
        text("DROP TABLE ex19_widgets")
    )  # => the example leaves no tables behind
    connection.execute(text("DROP TABLE ex19_audit_log"))  # => the bystander goes too
    connection.execute(
        text("DROP TABLE ex19_version")
    )  # => and no history table either
print("cleaned: yes")  # => Output: cleaned: yes
