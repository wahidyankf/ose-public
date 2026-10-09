# pyright: strict
"""Example 69: Typed report() Function Running a GROUP BY."""
# Splitting fetch-and-shape logic into a typed function is what makes it independently testable.

import sqlite3  # => stdlib DB-API module (co-19) -- the only import this whole file needs


def setup(
    conn: sqlite3.Connection,
) -> None:  # => builds the fixture report() reads from
    conn.executescript(
        """
        -- a minimal author/book fixture -- just enough for one GROUP BY report
        CREATE TABLE author(id INTEGER PRIMARY KEY, name TEXT NOT NULL);  -- 1 parent table
        CREATE TABLE book(id INTEGER PRIMARY KEY, title TEXT NOT NULL, author_id INTEGER NOT NULL);
        -- author_id links each book to a stable author id, even when names coincide
        -- 2 authors -- Ada ends up with 2 books, Grace with 1
        INSERT INTO author(id, name) VALUES (1, 'Ada Lovelace'), (2, 'Grace Hopper');  -- 2 rows
        -- 3 books, split 2-and-1 -- the exact counts main()'s hand-computed assert checks
        INSERT INTO book(id, title, author_id) VALUES  -- a 3-row multi-VALUES insert
            (1, 'Notes on the Analytical Engine', 1),  -- Ada's first book
            (2, 'Sketch of the Analytical Engine', 1),  -- Ada's second book
            (3, 'The First Computer Bug', 2);  -- Grace's only book
        """
    )  # => 2 authors, 3 books -- Ada has 2, Grace has 1, the fixture report() summarizes
    conn.commit()  # => persists the fixture before report() ever runs against it


def report(
    conn: sqlite3.Connection,
) -> list[tuple[str, int]]:  # => the function under test
    # A fully typed function signature (co-21): the return shape is documented in the type,
    # not just in a comment -- any caller sees "name, count" pairs without reading the body.
    cur: sqlite3.Cursor = conn.execute(  # => a single multi-line SQL string, one call
        """
        -- one JOIN, one GROUP BY -- the report's ENTIRE logic lives in this one query
        SELECT author.name, count(*)
        FROM author
        JOIN book ON book.author_id = author.id
        GROUP BY author.id, author.name
        ORDER BY author.name, author.id
        """
    )  # => GROUP BY collapses per-book rows into per-author counts (co-15)
    rows: list[tuple[str, int]] = (
        cur.fetchall()
    )  # => drains the cursor into a typed list
    return rows  # => e.g. [('Ada Lovelace', 2), ('Grace Hopper', 1)]
    # Nothing about this function's SHAPE would change for a bigger fixture -- SQL scales, not Python


def main() -> (
    None
):  # => entry point -- builds the fixture, calls report(), checks the answer
    conn: sqlite3.Connection = sqlite3.connect(
        ":memory:"
    )  # => a throwaway, process-local DB
    setup(conn)  # => builds the 2-author, 3-book fixture report() reads from

    rows: list[tuple[str, int]] = report(conn)  # => calls the typed function under test
    # No caller here needs to know report()'s SQL -- the typed return value is the contract.
    for (
        name,
        count,
    ) in rows:  # => unpacks each (name, count) pair from the returned list
        print(name, count)  # => Output: one line per author, its book count

    # Hand-computed: Ada has 2 books (ids 1, 2), Grace has 1 book (id 3) -- matches the seed above.
    expected: list[tuple[str, int]] = [
        ("Ada Lovelace", 2),
        ("Grace Hopper", 1),
    ]  # => by hand
    assert (
        rows == expected
    )  # => proves report()'s SQL matches what a human counted by hand
    print(
        "matches hand-computed expectation"
    )  # => only reached if the assert above passed
    conn.close()  # => releases the in-memory connection -- nothing to clean up on disk


if __name__ == "__main__":  # => guards main() so importing this module never runs it
    main()  # => runs the whole demonstration end to end
