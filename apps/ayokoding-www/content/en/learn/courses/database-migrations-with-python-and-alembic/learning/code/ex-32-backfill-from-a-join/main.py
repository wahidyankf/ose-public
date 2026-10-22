"""Example 32: a backfill can join another table for its values."""

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
    prefix="ex32-"
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
    context.configure(connection=connection, version_table="ex32_version")  # => per-example history table
    with context.begin_transaction():  # => DDL commits atomically where the database allows
        context.run_migrations()  # => execute every pending revision file in order
"""
with open(
    os.path.join(scratch, "env.py"), "w"
) as handle:  # => env.py sits beside versions/
    handle.write(env_py)  # => write the exact text shown above to disk

# => Two chained revisions: two tables, then a join-filled display name.
rev1 = '''"""create ex32 users and profiles."""

revision = "ex32a1"  # => first revision, no parent yet
down_revision = None


def upgrade():  # => forward: build both tables this story joins
    from alembic import op  # => op emits DDL inside the migration transaction
    import sqlalchemy as sa  # => column types come from SQLAlchemy Core

    # => every op call below joins one transaction: all of it commits or none of it does
    op.create_table(  # => the source table: canonical user names live here
        "ex32_users",  # => per-example table, no cross-example collision
        sa.Column("id", sa.Integer(), primary_key=True),  # => the join key both tables share
        sa.Column("full_name", sa.String(100), nullable=False),  # => the value the backfill copies
    )
    # => one id space, two tables: user_id matching users.id is the join contract
    op.create_table(  # => the target table: display_name starts empty
        "ex32_profiles",  # => one profile row per user id
        sa.Column("user_id", sa.Integer(), primary_key=True),  # => matches ex32_users.id by convention
        sa.Column("display_name", sa.String(100)),  # => filled from users by the next revision
    )


def downgrade():  # => reverse: remove both tables this revision built
    from alembic import op  # => same op object, opposite direction

    # => downgrade mirrors upgrade in reverse: last created is first dropped
    op.drop_table("ex32_profiles")  # => target goes first, creation order reversed
    op.drop_table("ex32_users")  # => DROP TABLE undoes exactly the upgrade
'''
with open(
    os.path.join(versions, "ex32a1_create_tables.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev1)  # => first chain link now exists on disk
rev2 = '''"""backfill ex32 profile display names."""

revision = "ex32a2"  # => second revision, runs after ex32a1
down_revision = "ex32a1"  # => the parent link that orders the chain


def upgrade():  # => forward: fill display names from the users table
    from alembic import op  # => op emits DDL inside the migration transaction

    # => UPDATE...FROM joins inside one statement: no round trip to the client
    op.execute(  # => every profile inherits its user's canonical name
        "UPDATE ex32_profiles AS p SET display_name = u.full_name "
        "FROM ex32_users AS u WHERE p.user_id = u.id AND p.display_name IS NULL"
    )


def downgrade():  # => reverse: deliberately nothing
    # => un-filling joined data would destroy information: one-way by design
    # => the history stamp still retreats: position moves, data stays filled
    pass
'''
with open(
    os.path.join(versions, "ex32a2_backfill.py"), "w"
) as handle:  # => filename starts with the id
    handle.write(rev2)  # => second chain link now exists on disk

# => Seed both tables, backfill across the join, then read the copies.
config = Config()  # => bare Config: no alembic.ini needed for script runs
config.set_main_option("script_location", scratch)  # => env.py and versions/ live here
config.set_main_option("sqlalchemy.url", url)  # => the service database URL
engine = create_engine(url)  # => separate engine for setup and verification
with engine.begin() as connection:  # => setup runs in a single transaction
    connection.execute(
        text("DROP TABLE IF EXISTS ex32_profiles")
    )  # => target leftovers vanish first
    connection.execute(
        text("DROP TABLE IF EXISTS ex32_users")
    )  # => leftovers of a killed run vanish
    connection.execute(
        text("DROP TABLE IF EXISTS ex32_version")
    )  # => stale history vanishes too
# => tables first: the join backfill needs both sides present
command.upgrade(config, "ex32a1")  # => create both tables, stop before the backfill
with engine.begin() as connection:  # => seeding runs in a single transaction
    # => two users and two empty profiles: the join has real work to do
    connection.execute(
        text(
            "INSERT INTO ex32_users (id, full_name) VALUES (1, 'Ada Lovelace'), (2, 'Grace Hopper')"
        )
    )
    connection.execute(text("INSERT INTO ex32_profiles (user_id) VALUES (1), (2)"))
# => the join copies canonical names into both profiles in one statement
command.upgrade(config, "head")  # => the join fills both display names
with engine.connect() as connection:  # => fresh connection sees the committed fill
    rows = connection.execute(  # => read every copied name in user order
        # => ORDER BY keeps reruns byte-identical even as rows accumulate
        text("SELECT display_name FROM ex32_profiles ORDER BY user_id")
    ).fetchall()  # => materialize every row before printing
print(
    "names:", ", ".join(row[0] for row in rows)
)  # => Output: names: Ada Lovelace, Grace Hopper
with engine.begin() as connection:  # => cleanup runs in a single transaction
    # => drop in reverse creation order: profiles before users, history last
    connection.execute(
        text("DROP TABLE ex32_profiles")
    )  # => target goes first, creation order reversed
    connection.execute(
        text("DROP TABLE ex32_users")
    )  # => the example leaves no tables behind
    connection.execute(
        text("DROP TABLE ex32_version")
    )  # => and no history table either
print("cleaned: yes")  # => Output: cleaned: yes
