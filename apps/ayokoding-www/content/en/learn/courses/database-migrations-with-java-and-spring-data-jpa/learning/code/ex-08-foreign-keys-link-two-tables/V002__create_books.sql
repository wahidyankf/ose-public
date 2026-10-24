-- V002 creates books linked to the authors V001 already made.
-- The REFERENCES clause fails loudly if V001 never ran: order is safety.
-- Seed one linked pair so the verification join has something to find.
CREATE TABLE ex08_books (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for books
  author_id INTEGER NOT NULL REFERENCES ex08_authors (id),
  -- => the foreign key writes the relationship into the schema itself
  title VARCHAR(200) NOT NULL
  -- => every book needs its title from the first row on
);

-- => one author plus one linked book prove the relationship end to end
INSERT INTO
  ex08_authors (pen_name)
VALUES
  ('novelist');

-- => the author row must exist before the book can reference it
INSERT INTO
  ex08_books (author_id, title)
VALUES
  (1, 'first novel');

-- => author_id 1 is the novelist row inserted just above
