-- Example 44: Aggregate Over Join
-- Run: sqlite3 app.db < example.sql

-- Dot-commands: print headers, align columns, spell out NULL instead of blank.
.headers on
.mode column
.nullvalue NULL

CREATE TABLE author (                          -- => parent table -- referenced by book below
  id INTEGER PRIMARY KEY,                     -- => aliases rowid, auto-assigned
  name TEXT NOT NULL                          -- => author's name, required
);

CREATE TABLE book (                            -- => child table -- author_id links back up
  id INTEGER PRIMARY KEY,                     -- => aliases rowid, auto-assigned
  title TEXT NOT NULL,                        -- => book title, required
  author_id INTEGER REFERENCES author(id),     -- => FK, joined against author.id below
  price REAL                                  -- => summed per author after the join
);

INSERT INTO author (id, name) VALUES           -- => 3 authors, all referenced below
  (1, 'Ada Lovelace'),                        -- => author 1 -- has 1 book below
  (2, 'Grace Hopper'),                        -- => author 2 -- has 2 books below
  (3, 'Alan Turing');                         -- => author 3 -- has 2 books below

-- Grace Hopper (id 2) and Alan Turing (id 3) each have TWO books -- their totals
-- sum across the join, unlike Ada Lovelace's single-book total.
INSERT INTO book (id, title, author_id, price) VALUES -- => 5 books across 3 authors
  (1, 'Notes on the Analytical Engine', 1, 25.00),  -- => author_id 1, price 25.00
  (2, 'Introduction to Computing',       2, 18.50), -- => author_id 2, price 18.50
  (3, 'Compilers and Common Sense',      2, 22.00), -- => author_id 2, price 22.00
  (4, 'On Computable Numbers',           3, 30.00), -- => author_id 3, price 30.00
  (5, 'The Enigma Papers',               3, 15.00); -- => author_id 3, price 15.00

-- JOIN recombines the normalized tables FIRST; GROUP BY/sum() aggregate the
-- JOINED result SECOND -- this is exactly how a per-author revenue report works.
SELECT a.name, sum(b.price) AS total_price     -- => sum(price) per author, after the join
FROM author a                                   -- => left side of the join -- one row per author
JOIN book b ON b.author_id = a.id              -- => recombine author with its books
GROUP BY a.id, a.name                           -- => id keeps same-name authors separate
ORDER BY a.id;                                  -- => deterministic group order using a grouping key
