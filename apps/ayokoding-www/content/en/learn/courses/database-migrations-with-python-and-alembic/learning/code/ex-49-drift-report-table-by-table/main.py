"""Example 49: report drift table by table across a small schema."""

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

# => Two hand-built tables: one matches its model, one drifted away.
engine = create_engine(url)  # => one engine for setup, reflection, and checks
with engine.begin() as connection:  # => setup runs in a single transaction
    connection.execute(
        text("DROP TABLE IF EXISTS ex49_clean")
    )  # => leftovers of a killed run vanish
    connection.execute(
        text("DROP TABLE IF EXISTS ex49_drifted")
    )  # => drifted leftovers vanish too
    # => the clean table matches its model column for column
    connection.execute(
        text(
            "CREATE TABLE ex49_clean (id INTEGER PRIMARY KEY, name VARCHAR(50) NOT NULL)"
        )
    )
    # => the drifted table grew a status column nobody modeled
    connection.execute(  # => raw DDL outside any revision, like drifted legacy
        text(
            "CREATE TABLE ex49_drifted (id INTEGER PRIMARY KEY, name VARCHAR(50) NOT NULL, status VARCHAR(10))"
        )
    )

# => One report line per table: clean tables pass, drifted ones name the gap.
models = {  # => what the code believes each table looks like
    "ex49_clean": ["id", "name"],  # => matches the live table exactly
    "ex49_drifted": ["id", "name"],  # => misses the status column the table grew
}
metadata = MetaData()  # => empty metadata: reflection fills it from the database
metadata.reflect(
    bind=engine, only=list(models)
)  # => only our tables: system catalogs stay out
for table_name in sorted(models):  # => sorted names keep reruns byte-identical
    table = metadata.tables[
        table_name
    ]  # => the reflected table, columns and types included
    reflected = sorted(
        column.name for column in table.columns
    )  # => sorted names keep output stable
    extra = sorted(
        set(reflected) - set(models[table_name])
    )  # => columns the database grew alone
    missing = sorted(
        set(models[table_name]) - set(reflected)
    )  # => columns the database lost alone
    if not extra and not missing:  # => agreement in both directions means no drift
        print(f"{table_name}: clean")  # => Output: ex49_clean: clean
    else:  # => any gap in either direction is drift worth reporting
        # => extras and missing print together: the full gap in one line
        print(
            f"{table_name}: drift: extra={','.join(extra) or 'none'} missing={','.join(missing) or 'none'}"
        )
with engine.begin() as connection:  # => cleanup runs in a single transaction
    connection.execute(text("DROP TABLE ex49_clean"))  # => the clean table goes first
    connection.execute(
        text("DROP TABLE ex49_drifted")
    )  # => the example leaves no tables behind
print("cleaned: yes")  # => Output: cleaned: yes
