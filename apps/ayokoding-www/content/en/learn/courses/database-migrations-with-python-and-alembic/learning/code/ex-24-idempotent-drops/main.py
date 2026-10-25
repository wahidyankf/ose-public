"""Example 24: IF EXISTS makes repeated drops safe to rerun."""

import os  # => os reads the harness database address, never hardcoded

from alembic.migration import (
    MigrationContext,
)  # => MigrationContext opens the migration view
from alembic.operations import (
    Operations,
)  # => Operations emits DDL without revision files
from sqlalchemy import create_engine, text  # => engine connects and verifies

# => The database URL comes from the harness, with local-run defaults.
host = os.environ.get("PGHOST", "postgres")  # => service hostname in the unit network
user = os.environ.get("PGUSER", "postgres")  # => trust-auth role, no password needed
database = os.environ.get(
    "PGDATABASE", "postgres"
)  # => fresh database for every unit run
url = f"postgresql+psycopg://{user}@{host}/{database}"  # => psycopg 3 driver URL scheme

# => No revision files here: Operations runs DDL directly in a migration context.
engine = create_engine(url)  # => one engine for setup, migration, and checks
with engine.begin() as connection:  # => start clean so reruns match
    connection.execute(
        text("DROP TABLE IF EXISTS ex24_widgets")
    )  # => IF EXISTS: no error when absent


def reset_widgets():
    """Drop and recreate the widgets table: safe on first run and reruns."""
    with engine.begin() as connection:  # => one transaction per reset attempt
        context = MigrationContext.configure(
            connection
        )  # => migration view over this connection
        op = Operations(context)  # => op without revision files or history
        # => IF EXISTS turns "drop what may be missing" into a no-op, never an error
        op.execute(
            "DROP TABLE IF EXISTS ex24_widgets"
        )  # => first run: absent, no-op; rerun: present, drops
        # => CREATE TABLE after the guarded drop: the table always ends present
        op.execute(
            "CREATE TABLE ex24_widgets (id INTEGER PRIMARY KEY, name VARCHAR(50))"
        )


def widget_count():
    """Count the example's tables: zero means fully dropped, one means present."""
    with engine.connect() as connection:  # => fresh connection sees committed DDL
        # => a count query keeps the output to one stable number
        return connection.execute(  # => information_schema is portable across databases
            text(  # => exact-name match: no pattern surprises
                "SELECT COUNT(*) FROM information_schema.tables "
                "WHERE table_name = 'ex24_widgets'"
            )
        ).scalar()  # => a single count is all this check needs


# => the first call builds the table from nothing: drop-noop, then create
reset_widgets()  # => first run: drop-noop, then create
print("after first:", widget_count())  # => Output: after first: 1
# => the second call proves the drop-create cycle reruns cleanly
reset_widgets()  # => second run: drop-real, then create again
print("after second:", widget_count())  # => Output: after second: 1
with engine.begin() as connection:  # => cleanup runs in a single transaction
    # => cleanup uses IF EXISTS too: safe even when already dropped
    connection.execute(
        text("DROP TABLE IF EXISTS ex24_widgets")
    )  # => the example leaves no tables behind
print("final:", widget_count())  # => Output: final: 0
# => zero tables and matching counts close the idempotency proof
print("rerun safe: True")  # => Output: rerun safe: True
