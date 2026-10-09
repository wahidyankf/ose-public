# pyright: strict
"""Capstone: dal.py -- typed, parameterized data-access layer over schema.sql's tables.

Every function here takes an ALREADY-OPEN sqlite3.Connection -- callers (the CLI, or the
pytest fixture below) own the connection's lifetime, this module never opens or closes one
itself. Every SQL string uses `?` placeholders (co-20) -- nothing here is ever string-built
from untrusted input, which is the whole point of a data-access layer existing at all.
"""

import sqlite3  # => stdlib DB-API module (co-19) -- no third-party driver anywhere in this file


def create_book(
    conn: sqlite3.Connection,
    title: str,
    author_id: int,
    publisher_id: int | None,
    price: float,
) -> int:
    # publisher_id: int | None mirrors schema.sql's OPTIONAL publisher_id FK exactly.
    cur: sqlite3.Cursor = conn.execute(
        "INSERT INTO book(title, author_id, publisher_id, price) VALUES (?, ?, ?, ?)",
        (
            title,
            author_id,
            publisher_id,
            price,
        ),  # => 4 bound parameters, positional order matters
    )
    conn.commit()
    new_id: int | None = cur.lastrowid  # => the rowid SQLite just assigned (co-02)
    assert (
        new_id is not None
    )  # => narrows int | None to int -- always set right after an INSERT
    return new_id


def get_book(
    conn: sqlite3.Connection, book_id: int
) -> tuple[int, str, int, int | None, float] | None:
    cur: sqlite3.Cursor = conn.execute(
        "SELECT id, title, author_id, publisher_id, price FROM book WHERE id = ?",
        (book_id,),
    )
    row: tuple[int, str, int, int | None, float] | None = cur.fetchone()
    return (
        row  # => None if book_id doesn't exist -- callers must handle the missing case
    )


def list_books_by_author(
    conn: sqlite3.Connection, author_id: int
) -> list[tuple[int, str, float]]:
    cur: sqlite3.Cursor = conn.execute(
        "SELECT id, title, price FROM book WHERE author_id = ? ORDER BY id",
        (author_id,),
    )
    return cur.fetchall()  # => every book by this ONE author, oldest id first


def update_book_price(conn: sqlite3.Connection, book_id: int, new_price: float) -> None:
    conn.execute("UPDATE book SET price = ? WHERE id = ?", (new_price, book_id))
    conn.commit()  # => a single-row update commits immediately -- see bulk_update_prices for a batch


def delete_book(conn: sqlite3.Connection, book_id: int) -> None:
    conn.execute("DELETE FROM book WHERE id = ?", (book_id,))
    conn.commit()  # => ON DELETE CASCADE (schema.sql) also removes this book's book_tag rows


def report_by_author(conn: sqlite3.Connection) -> list[tuple[str, int, float]]:
    # The capstone's reporting aggregation: JOIN + GROUP BY in ONE query (co-15, co-13),
    # exactly like Example 79's join-group-having report, minus the HAVING filter.
    cur: sqlite3.Cursor = conn.execute(
        """
        SELECT author.name, count(*), sum(book.price)
        FROM author
        JOIN book ON book.author_id = author.id
        GROUP BY author.id, author.name
        ORDER BY author.name, author.id
        """
    )
    rows: list[tuple[str, int, float]] = cur.fetchall()
    return rows  # => [(name, book_count, total_price), ...] -- one row per author ID WITH books


def bulk_update_prices(
    conn: sqlite3.Connection, updates: list[tuple[int, float]]
) -> None:
    # The capstone's rollback-on-failure transaction (co-18): `with conn:` opens an implicit
    # transaction on the FIRST write, commits if every update succeeds, and auto-ROLLBACKs
    # the WHOLE batch the instant any single update violates schema.sql's CHECK(price >= 0).
    with conn:
        for (
            book_id,
            new_price,
        ) in updates:  # => co-20 -- book_id/new_price stay bound, never spliced
            conn.execute("UPDATE book SET price = ? WHERE id = ?", (new_price, book_id))
