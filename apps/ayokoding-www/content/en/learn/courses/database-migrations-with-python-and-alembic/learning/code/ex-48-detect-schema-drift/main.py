"""Example 48: compare reflection against the model to find drift."""

import os  # => os reads the harness database address, never hardcoded

from sqlalchemy import (
    MetaData,
    create_engine,
    text,
)  # => reflect needs MetaData and an engine

# => The database URL comes from the harness, with local-run defaults.
host = os.environ.get("PGHOST", "postgres")  # => service hostname in the unit network
user = os.environ.get("PGUSER", "postgres")  # => trust-auth role, no password needed
database = os.environ.get(
    "PGDATABASE", "postgres"
)  # => fresh database for every unit run
url = f"postgresql+psycopg://{user}@{host}/{database}"  # => psycopg 3 driver URL scheme

# => A hand-built table with a surprise column stands in for drifted legacy.
engine = create_engine(url)  # => one engine for setup, reflection, and checks
with engine.begin() as connection:  # => setup runs in a single transaction
    connection.execute(
        text("DROP TABLE IF EXISTS ex48_widgets")
    )  # => leftovers of a killed run vanish
    # => three columns live here: the model below only knows two of them
    connection.execute(  # => raw DDL outside any revision, like drifted legacy
        text(
            "CREATE TABLE ex48_widgets (id INTEGER PRIMARY KEY, name VARCHAR(50) NOT NULL, price_cents INTEGER)"
        )
    )

# => Reflect and diff: extras live in the database, missing ones in the model.
metadata = MetaData()  # => empty metadata: reflection fills it from the database
metadata.reflect(
    bind=engine, only=["ex48_widgets"]
)  # => only our table: system catalogs stay out
table = metadata.tables[
    "ex48_widgets"
]  # => the reflected table, columns and types included
reflected = sorted(
    column.name for column in table.columns
)  # => sorted names keep output stable
# => the model below stands in for the ORM classes the team believes in
model = ["id", "name"]  # => what the code thinks the table looks like
extra = sorted(
    set(reflected) - set(model)
)  # => columns the database has and the model lacks
missing = sorted(
    set(model) - set(reflected)
)  # => columns the model wants and the database lacks
print("extra:", ", ".join(extra) or "none")  # => Output: extra: price_cents
print("missing:", ", ".join(missing) or "none")  # => Output: missing: none
# => any difference in either direction means the schema drifted from the model
print("drift:", bool(extra or missing))  # => Output: drift: True
with engine.begin() as connection:  # => cleanup runs in a single transaction
    connection.execute(
        text("DROP TABLE ex48_widgets")
    )  # => the example leaves no tables behind
print("cleaned: yes")  # => Output: cleaned: yes
