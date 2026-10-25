# => Kata 1 starter: ad-hoc DDL nobody can replay.
import os  # => WHY os: read the service vars
from sqlalchemy import create_engine, text  # => WHY both: connect plus run


def main():  # => creates the table with no record of the act
    host = os.environ.get("PGHOST", "localhost")  # => service host
    user = os.environ.get("PGUSER", "postgres")  # => trust user
    engine = create_engine(
        f"postgresql+psycopg://{user}@{host}:5432/postgres"
    )  # => live database
    with engine.begin() as conn:  # => WHY txn: DDL commits
        conn.execute(text("DROP TABLE IF EXISTS kata01_widgets"))  # => start clean
        conn.execute(
            text(
                "CREATE TABLE kata01_widgets (id SERIAL PRIMARY KEY, name TEXT NOT NULL)"
            )
        )  # => ad-hoc DDL
    print("created: True")  # => the table exists now
    print("recorded: False")  # => no revision, no receipt, no replay


if __name__ == "__main__":  # => WHY guard: import-safe module
    main()  # => single entry point
