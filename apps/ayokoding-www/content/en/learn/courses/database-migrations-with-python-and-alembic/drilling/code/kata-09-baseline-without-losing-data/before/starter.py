# => Kata 9 starter: a live database with no history at all.
import os  # => WHY os: read the service vars
from sqlalchemy import create_engine, text  # => WHY both: connect plus run


def main():  # => tables and rows exist; receipts do not
    host = os.environ.get("PGHOST", "localhost")  # => service host
    user = os.environ.get("PGUSER", "postgres")  # => trust user
    engine = create_engine(
        f"postgresql+psycopg://{user}@{host}:5432/postgres"
    )  # => live database
    with engine.begin() as conn:  # => WHY txn: legacy setup commits together
        conn.execute(text("DROP TABLE IF EXISTS kata09_legacy"))  # => start clean
        conn.execute(
            text("DROP TABLE IF EXISTS kata09_version")
        )  # => no receipts either
        conn.execute(
            text(
                "CREATE TABLE kata09_legacy (id SERIAL PRIMARY KEY, name TEXT NOT NULL)"
            )
        )  # => legacy handiwork
        conn.execute(
            text("INSERT INTO kata09_legacy (name) VALUES ('ada'), ('grace')")
        )  # => real data, no revision
    print("tables: True")  # => the schema exists
    print("version table: False")  # => SMELL: nothing records how it got here
    print("rows: 2  # stamp must keep both")  # => the baseline constraint


if __name__ == "__main__":  # => WHY guard: import-safe module
    main()  # => single entry point
