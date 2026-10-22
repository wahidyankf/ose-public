"""Example 62: DDL waits on locks, and lock_timeout bounds the wait."""

import os  # => os reads the harness database address, never hardcoded

from sqlalchemy import create_engine, text  # => two engines play the two sessions
from sqlalchemy.exc import DBAPIError  # => DBAPIError is the timeout signal to catch

# => The database URL comes from the harness, with local-run defaults.
host = os.environ.get("PGHOST", "postgres")  # => service hostname in the unit network
user = os.environ.get("PGUSER", "postgres")  # => trust-auth role, no password needed
database = os.environ.get(
    "PGDATABASE", "postgres"
)  # => fresh database for every unit run
url = f"postgresql+psycopg://{user}@{host}/{database}"  # => psycopg 3 driver URL scheme

# => One table, two sessions: the first holds the lock, the second wants DDL.
engine = create_engine(url)  # => administration engine: setup and final checks
with engine.begin() as connection:  # => setup runs in a single transaction
    connection.execute(
        text("DROP TABLE IF EXISTS ex62_widgets")
    )  # => leftovers of a killed run vanish
    connection.execute(
        text(
            "CREATE TABLE ex62_widgets (id INTEGER PRIMARY KEY, name VARCHAR(50) NOT NULL)"
        )
    )

# => Session A opens a transaction and holds an exclusive lock on the table.
holder = create_engine(url).connect()  # => held open: the lock lives until this closes
holder.execute(
    text("LOCK TABLE ex62_widgets IN ACCESS EXCLUSIVE MODE")
)  # => the strongest table lock, held
writer = create_engine(url).connect()  # => session B: the migration that wants to alter
writer.execute(
    text("SET lock_timeout = '1s'")
)  # => wait at most a second, then fail loud
try:  # => the ALTER must time out: session A is not letting go
    writer.execute(text("ALTER TABLE ex62_widgets ADD COLUMN nickname VARCHAR(50)"))
    writer.commit()  # => reaching here means the lock did not block,unexpectedly
    timed_out = False  # => no timeout: the demonstration failed
except DBAPIError:  # => lock timeout surfaces as a database API error
    writer.rollback()  # => the timed-out statement rolls back cleanly
    timed_out = True  # => the one-second bound held: loud failure, no hang
print("lock timeout hit:", timed_out)  # => Output: lock timeout hit: True
# => the lock releases on close: the retry below must succeed at once
holder.close()  # => session A ends: the exclusive lock releases here

# => With the lock gone, the same DDL runs at once and stays for good.
with engine.begin() as connection:  # => the retry runs in a single transaction
    connection.execute(
        text("ALTER TABLE ex62_widgets ADD COLUMN nickname VARCHAR(50)")
    )  # => no contention now
with engine.connect() as connection:  # => fresh connection verifies the column
    count = connection.execute(  # => the catalog names the new column or not
        # => a count query keeps the output to one stable number
        text(  # => information_schema is portable: no PostgreSQL-only catalog tables here
            "SELECT COUNT(*) FROM information_schema.columns "
            "WHERE table_name = 'ex62_widgets' AND column_name = 'nickname'"
        )
    ).scalar()  # => a single count is all this check needs
print(
    "column added after release:", count == 1
)  # => Output: column added after release: True
with engine.begin() as connection:  # => cleanup runs in a single transaction
    connection.execute(
        text("DROP TABLE ex62_widgets")
    )  # => the example leaves no tables behind
print("cleaned: yes")  # => Output: cleaned: yes
