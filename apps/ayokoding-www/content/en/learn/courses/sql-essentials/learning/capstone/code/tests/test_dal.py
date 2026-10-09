"""Capstone: pytest coverage for dal.py, seeded from the SAME schema.sql + seed.sql the CLI uses.

Reading the real .sql files (rather than re-typing the schema in Python) keeps this fixture
byte-identical to what a reader actually applies with `sqlite3 app.db < schema.sql` -- the
tests exercise the exact same relations, constraints, and seed rows Step 1 verifies.
"""

import sqlite3
from collections.abc import Iterator
from pathlib import Path

import pytest

from dal import (
    bulk_update_prices,
    create_book,
    delete_book,
    get_book,
    list_books_by_author,
    report_by_author,
    update_book_price,
)

CODE_DIR: Path = Path(
    __file__
).parent.parent  # => this file lives in tests/, code/ is its parent


@pytest.fixture
def conn() -> Iterator[sqlite3.Connection]:
    # A FRESH in-memory DB per test, built from the real schema.sql + seed.sql on disk.
    connection: sqlite3.Connection = sqlite3.connect(":memory:")
    connection.execute(
        "PRAGMA foreign_keys = ON"
    )  # => matches schema.sql's own PRAGMA line
    connection.executescript((CODE_DIR / "schema.sql").read_text())
    connection.executescript((CODE_DIR / "seed.sql").read_text())
    yield connection
    connection.close()


def test_get_book_returns_seeded_row(conn: sqlite3.Connection) -> None:
    row: tuple[int, str, int, int | None, float] | None = get_book(conn, 1)
    assert row == (1, "Notes on the Analytical Engine", 1, 1, 12.5)


def test_get_book_missing_id_returns_none(conn: sqlite3.Connection) -> None:
    assert get_book(conn, 999) is None


def test_create_book_with_no_publisher(conn: sqlite3.Connection) -> None:
    # publisher_id=None exercises the OPTIONAL FK -- exactly like seed.sql's book 3.
    new_id: int = create_book(
        conn, "A New Draft", author_id=2, publisher_id=None, price=5.0
    )
    assert get_book(conn, new_id) == (new_id, "A New Draft", 2, None, 5.0)


def test_list_books_by_author(conn: sqlite3.Connection) -> None:
    # Author 1 (Ada Lovelace) has exactly 2 seeded books: ids 1 and 2.
    assert list_books_by_author(conn, 1) == [
        (1, "Notes on the Analytical Engine", 12.5),
        (2, "Sketch of the Analytical Engine", 9.0),
    ]


def test_update_book_price(conn: sqlite3.Connection) -> None:
    update_book_price(conn, 1, 20.0)
    row: tuple[int, str, int, int | None, float] | None = get_book(conn, 1)
    assert row is not None
    assert (
        row[4] == 20.0
    )  # => index 4 is price -- confirms the update actually persisted


def test_delete_book_removes_it(conn: sqlite3.Connection) -> None:
    delete_book(conn, 3)
    assert get_book(conn, 3) is None


def test_report_by_author_matches_hand_computed_values(
    conn: sqlite3.Connection,
) -> None:
    # Hand-computed from seed.sql: Ada has 2 books (12.5 + 9.0 = 21.5), Grace has 1 (15.0).
    expected: list[tuple[str, int, float]] = [
        ("Ada Lovelace", 2, 21.5),
        ("Grace Hopper", 1, 15.0),
    ]
    assert report_by_author(conn) == expected


def test_report_keeps_distinct_authors_with_the_same_name(
    conn: sqlite3.Connection,
) -> None:
    # Names are display values, not keys: author 3 has Ada's name but a separate book.
    conn.execute("INSERT INTO author(id, name) VALUES (?, ?)", (3, "Ada Lovelace"))
    conn.execute(
        "INSERT INTO book(id, title, author_id, publisher_id, price) VALUES (?, ?, ?, ?, ?)",
        (4, "A Different Ada's Book", 3, None, 7.0),
    )
    assert report_by_author(conn) == [
        ("Ada Lovelace", 2, 21.5),
        ("Ada Lovelace", 1, 7.0),
        ("Grace Hopper", 1, 15.0),
    ]


def test_bulk_update_prices_commits_when_all_succeed(conn: sqlite3.Connection) -> None:
    bulk_update_prices(conn, [(1, 13.0), (2, 10.0)])
    assert list_books_by_author(conn, 1) == [
        (1, "Notes on the Analytical Engine", 13.0),
        (2, "Sketch of the Analytical Engine", 10.0),
    ]


def test_bulk_update_prices_rolls_back_the_whole_batch_on_failure(
    conn: sqlite3.Connection,
) -> None:
    before: list[tuple[int, str, float]] = list_books_by_author(
        conn, 1
    )  # => baseline, both books

    # book 1's price update is VALID; book 2's -1.0 violates CHECK(price >= 0) -- the WHOLE
    # batch must roll back, including the (already-applied) valid update to book 1.
    with pytest.raises(sqlite3.IntegrityError):
        bulk_update_prices(conn, [(1, 99.0), (2, -1.0)])

    after: list[tuple[int, str, float]] = list_books_by_author(conn, 1)
    assert (
        before == after
    )  # => book 1's price is UNCHANGED too -- no partial write survived
