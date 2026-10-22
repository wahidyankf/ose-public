"""Example 47: reflect the live schema to see what is really there."""

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

# => A hand-built table stands in for the legacy schema nobody modeled yet.
engine = create_engine(url)  # => one engine for setup, reflection, and checks
with engine.begin() as connection:  # => setup runs in a single transaction
    connection.execute(
        text("DROP TABLE IF EXISTS ex47_widgets")
    )  # => leftovers of a killed run vanish
    # => raw DDL outside any revision: the legacy schema reflection must read
    connection.execute(  # => two columns today: the model below must agree
        text(
            "CREATE TABLE ex47_widgets (id INTEGER PRIMARY KEY, name VARCHAR(50) NOT NULL)"
        )
    )

# => Reflect the live table, then compare against the expected model shape.
metadata = MetaData()  # => empty metadata: reflection fills it from the database
metadata.reflect(
    bind=engine, only=["ex47_widgets"]
)  # => only our table: system catalogs stay out
table = metadata.tables[
    "ex47_widgets"
]  # => the reflected table, columns and types included
reflected = sorted(
    column.name for column in table.columns
)  # => sorted names keep output stable
print("reflected:", ", ".join(reflected))  # => Output: reflected: id, name
# => the model below stands in for the ORM classes the team believes in
model = ["id", "name"]  # => what the code thinks the table looks like
# => reflection catching up with belief means no drift: adoption is safe
print("matches model:", reflected == model)  # => Output: matches model: True
with engine.begin() as connection:  # => cleanup runs in a single transaction
    connection.execute(
        text("DROP TABLE ex47_widgets")
    )  # => the example leaves no tables behind
print("cleaned: yes")  # => Output: cleaned: yes
