"""Example 68: advisory locks serialize runners without touching tables."""

import os  # => os reads the harness database address, never hardcoded

from sqlalchemy import create_engine, text  # => two engines play the two runners

# => The database URL comes from the harness, with local-run defaults.
host = os.environ.get("PGHOST", "postgres")  # => service hostname in the unit network
user = os.environ.get("PGUSER", "postgres")  # => trust-auth role, no password needed
database = os.environ.get(
    "PGDATABASE", "postgres"
)  # => fresh database for every unit run
url = f"postgresql+psycopg://{user}@{host}/{database}"  # => psycopg 3 driver URL scheme

# => Advisory locks live outside tables: a cooperative mutex for deploy runners.
key = 68001  # => fixed lock key: both runners name the same mutex
first = create_engine(url).connect()  # => runner one: holds the mutex for the demo
first.execute(
    text(f"SELECT pg_advisory_lock({key})")
)  # => blocking take: the mutex is free, so instant
second = create_engine(url).connect()  # => runner two: arrives while the mutex is held
# => try-lock never blocks: True means acquired, False means someone holds it
taken = second.execute(
    text(f"SELECT pg_try_advisory_lock({key})")
).scalar()  # => False: runner one holds it
# => False here is the serialization working: the second runner must wait
print(
    "second runner blocked:", taken is False
)  # => Output: second runner blocked: True
first.execute(
    text(f"SELECT pg_advisory_unlock({key})")
)  # => runner one finishes: the mutex releases
first.close()  # => closing returns the connection: hygiene for the demo
# => the mutex is free now: the waiting runner proceeds without contention
retried = second.execute(
    text(f"SELECT pg_try_advisory_lock({key})")
).scalar()  # => True: the mutex is free
print("after release:", retried is True)  # => Output: after release: True
second.execute(
    text(f"SELECT pg_advisory_unlock({key})")
)  # => runner two releases what it took
second.close()  # => closing returns the connection: hygiene for the demo
print("cleaned: yes")  # => Output: cleaned: yes
