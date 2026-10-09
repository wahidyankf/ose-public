# pyright: strict
"""Capstone: demo_bulk_update.py -- proves a partially-failing batch leaves every row
untouched (co-18), against a real on-disk database built from schema.sql + seed.sql.

This is a runnable demonstration for Step 3 of the capstone walkthrough -- the same
rollback behavior test_bulk_update_prices_rolls_back_the_whole_batch_on_failure asserts
in tests/test_dal.py, shown here end to end against a real file, not an in-memory fixture.
"""

import sqlite3
from pathlib import Path

from dal import bulk_update_prices, list_books_by_author

CODE_DIR: Path = Path(
    __file__
).parent  # => this script's own directory -- schema.sql/seed.sql live here
DB_PATH: Path = CODE_DIR / "demo.db"  # => a throwaway file, rebuilt fresh on every run


def main() -> None:
    DB_PATH.unlink(
        missing_ok=True
    )  # => deletes any leftover demo.db from a prior run first
    conn: sqlite3.Connection = sqlite3.connect(
        DB_PATH
    )  # => a real on-disk file, not :memory:
    conn.execute("PRAGMA foreign_keys = ON")  # => matches schema.sql's own PRAGMA line
    conn.executescript(
        (CODE_DIR / "schema.sql").read_text()
    )  # => applies the five-table 3NF design
    conn.executescript(
        (CODE_DIR / "seed.sql").read_text()
    )  # => applies the same seed rows as Step 1

    before: list[tuple[int, str, float]] = list_books_by_author(
        conn, 1
    )  # => Ada's 2 seeded books
    print("before:", before)  # => the baseline this script proves is preserved below

    try:
        # book 1's price update is VALID; book 2's -1.0 violates CHECK(price >= 0) in schema.sql.
        bulk_update_prices(
            conn, [(1, 99.0), (2, -1.0)]
        )  # => `with conn:` inside rolls back BOTH
    except (
        sqlite3.IntegrityError
    ) as err:  # => the CHECK violation surfaces as this exact error type
        print(
            "caught:", err
        )  # => confirms the failure was DETECTED, not silently swallowed

    after: list[tuple[int, str, float]] = list_books_by_author(
        conn, 1
    )  # => re-reads the SAME rows
    print("after:", after)  # => compared against `before` on the next line
    print(
        "unchanged:", before == after
    )  # => True proves book 1's VALID update never persisted either
    conn.close()  # => releases the connection -- demo.db itself is left on disk for inspection


if __name__ == "__main__":  # => guards main() so importing this module never runs it
    main()  # => runs the whole demonstration end to end
