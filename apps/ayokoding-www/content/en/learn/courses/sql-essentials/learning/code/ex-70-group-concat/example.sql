-- Example 70: group_concat.
CREATE TABLE author(id INTEGER PRIMARY KEY, name TEXT NOT NULL);
                                    -- => the GROUPing key this example concatenates around
CREATE TABLE book(id INTEGER PRIMARY KEY, title TEXT NOT NULL, author_id INTEGER NOT NULL);
                                    -- => the column whose VALUES get folded into one string

INSERT INTO author(id, name) VALUES (1, 'Ada Lovelace');
                                    -- => 1 author -- author_id = 1 groups both books below
INSERT INTO book(id, title, author_id) VALUES
    (1, 'Notes on the Analytical Engine', 1),
    (2, 'Sketch of the Analytical Engine', 1);
                                    -- => 2 books, SAME author -- one group_concat row results

-- .headers on shows the "author_id | titles" header row below. .mode list switches away
-- from .mode column -- a long concatenated string would WRAP mid-word there (see Example
-- 65's .mode column note); .separator " | " picks a readable delimiter for list mode.
.headers on
.mode list
.separator " | "
-- list mode (pipe-separated, no column wrapping) keeps the long concatenated string on one line.
-- group_concat(X, sep) folds every GROUPed row's X value into ONE string, sep-joined (co-15).
-- Without ORDER BY inside the aggregate, the title order is unspecified.
SELECT author_id, group_concat(title, '; ') AS titles
FROM book
GROUP BY author_id;                -- => one row per author_id -- titles collapsed into one string
                                    -- => the '; ' second argument is the JOINER between titles
