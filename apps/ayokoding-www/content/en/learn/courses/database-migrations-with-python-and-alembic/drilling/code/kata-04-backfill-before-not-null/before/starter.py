# => Kata 4 starter: strictness before data.
import os  # => WHY os: read the service vars
from sqlalchemy import create_engine, text  # => WHY both: connect plus run


def main():  # => the column the rows cannot satisfy
    host = os.environ.get("PGHOST", "localhost")  # => service host
    user = os.environ.get("PGUSER", "postgres")  # => trust user
    engine = create_engine(
        f"postgresql+psycopg://{user}@{host}:5432/postgres"
    )  # => live database
    with engine.begin() as conn:  # => WHY txn: setup commits together
        conn.execute(text("DROP TABLE IF EXISTS kata04_orders"))  # => start clean
        conn.execute(
            text(
                "CREATE TABLE kata04_orders (id SERIAL PRIMARY KEY, status TEXT NOT NULL)"
            )
        )  # => live table
        conn.execute(
            text("INSERT INTO kata04_orders (status) VALUES ('new'), ('paid')")
        )  # => rows predate the column
    print("rows: 2")  # => the table is already inhabited
    print(
        "next: ALTER TABLE kata04_orders ADD COLUMN priority TEXT NOT NULL"
    )  # => the strict step
    print(
        "result: FAILS  # existing rows have no value for it"
    )  # => Postgres refuses: no default


if __name__ == "__main__":  # => WHY guard: import-safe module
    main()  # => single entry point
