-- Capstone: schema.sql -- four entity tables plus one junction (five tables) with PK/FK
-- constraints throughout, following the exact shape Example 77 taught (co-01, co-05, co-07).
PRAGMA foreign_keys = ON;          -- => enforcement on -- CASCADE below actually fires (co-03)

CREATE TABLE author(
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE publisher(
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE book(
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    author_id INTEGER NOT NULL REFERENCES author(id),
                                    -- => every book MUST have an author -- NOT NULL, not optional
    publisher_id INTEGER REFERENCES publisher(id),
                                    -- => publisher is OPTIONAL -- self-published books have none
    price REAL NOT NULL CHECK (price >= 0)
                                    -- => co-04 -- the engine itself rejects a negative price
);

CREATE TABLE tag(
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE book_tag(
    book_id INTEGER NOT NULL REFERENCES book(id) ON DELETE CASCADE,
                                    -- => deleting a book cleans up its own tag links automatically
    tag_id INTEGER NOT NULL REFERENCES tag(id) ON DELETE CASCADE,
    PRIMARY KEY (book_id, tag_id)  -- => the composite PK from Example 65 -- no duplicate pairs
);
