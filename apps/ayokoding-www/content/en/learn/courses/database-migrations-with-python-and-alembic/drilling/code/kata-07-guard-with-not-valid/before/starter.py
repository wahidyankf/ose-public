# => Kata 7 starter: the guard that scans the world.
import os  # => WHY os: read the service vars
from sqlalchemy import create_engine, text  # => WHY both: connect plus run


def main():  # => a validated check on a live table
    host = os.environ.get("PGHOST", "localhost")  # => service host
    user = os.environ.get("PGUSER", "postgres")  # => trust user
    engine = create_engine(
        f"postgresql+psycopg://{user}@{host}:5432/postgres"
    )  # => live database
    with engine.begin() as conn:  # => WHY txn: setup commits together
        conn.execute(text("DROP TABLE IF EXISTS kata07_items"))  # => start clean
        conn.execute(
            text("CREATE TABLE kata07_items (id SERIAL PRIMARY KEY, qty INTEGER)")
        )  # => live table
        conn.execute(
            text("INSERT INTO kata07_items (qty) VALUES (1), (2), (3)")
        )  # => rows predate the guard
    print("rows: 3")  # => every row gets scanned
    print(
        "next: ALTER TABLE kata07_items ADD CONSTRAINT qty_nonneg CHECK (qty >= 0)"
    )  # => validated at once
    print(
        "lock: SHARE ROW EXCLUSIVE until the scan finishes"
    )  # => writes queue behind the guard


if __name__ == "__main__":  # => WHY guard: import-safe module
    main()  # => single entry point
