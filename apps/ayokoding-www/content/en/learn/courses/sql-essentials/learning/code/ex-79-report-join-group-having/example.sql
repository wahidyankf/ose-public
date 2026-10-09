-- Example 79: Report -- Join + Group + Having.
CREATE TABLE author(id INTEGER PRIMARY KEY, name TEXT NOT NULL);
                                    -- => the GROUPing key for the report below
CREATE TABLE book(id INTEGER PRIMARY KEY, title TEXT NOT NULL, author_id INTEGER NOT NULL REFERENCES author(id), price REAL NOT NULL);
                                    -- => the joined-and-aggregated table
                                    -- => price is what sum(book.price) totals per author, below

INSERT INTO author(id, name) VALUES (1, 'Ada Lovelace'), (2, 'Grace Hopper');
                                    -- => 2 authors -- only Ada survives the HAVING filter below
INSERT INTO book(id, title, author_id, price) VALUES  -- a 3-row multi-VALUES insert
    (1, 'Notes on the Analytical Engine', 1, 12.5),  -- Ada's first book
    (2, 'Sketch of the Analytical Engine', 1, 9.0),   -- Ada's second book
    (3, 'The First Computer Bug', 2, 15.0);           -- Grace's only book
                                    -- => Ada has 2 books (21.5 total), Grace has 1 book (15.0)

-- .headers on and .mode column below are display preferences only -- unrelated to the report logic.
.headers on
.mode column
-- Three concepts in ONE query: JOIN recombines normalized rows (co-13), GROUP BY collapses
-- them per author (co-15), HAVING then filters the AGGREGATED groups, not the raw rows (co-16).
SELECT author.name, count(*) AS book_count, sum(book.price) AS total_value
                                    -- => count(*) and sum(book.price) are the AGGREGATES per group
FROM author
JOIN book ON book.author_id = author.id
                                    -- => the JOIN -- recombines the two normalized tables (co-13)
GROUP BY author.id, author.name
                                    -- => id keeps same-name authors in distinct groups (co-15)
HAVING count(*) > 1;               -- => only Ada survives -- Grace's single-book group is filtered out
