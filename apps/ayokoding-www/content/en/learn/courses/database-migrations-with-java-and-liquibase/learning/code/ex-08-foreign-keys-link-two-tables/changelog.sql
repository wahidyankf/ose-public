-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- changeset course:001-create-authors
-- => the referenced table must exist before the foreign key points at it
CREATE TABLE authors (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  pen_name VARCHAR(100) NOT NULL
  -- => every author writes under exactly one pen name
);

-- rollback DROP TABLE authors;
-- => dropping the table reverses exactly what this changeset built

-- changeset course:002-create-books
-- => books carry the key; authors stay independent of their books
CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  -- => books get their own independent sequence of ids
  author_id INTEGER NOT NULL,
  -- => born as a plain integer so the constraint changeset has work to do
  title VARCHAR(255) NOT NULL
  -- => a book without a title is a cataloguing bug
);

-- rollback DROP TABLE books;
-- => books drop before authors on rollback, reversing creation order

-- changeset course:003-link-books-to-authors
-- => the foreign key turns a bare integer into a guaranteed relationship
ALTER TABLE books
  ADD CONSTRAINT fk_books_author FOREIGN KEY (author_id) REFERENCES authors (id);
-- => a named constraint produces error messages a human can act on

-- rollback ALTER TABLE books DROP CONSTRAINT fk_books_author;
-- => named constraints drop by name, so naming them is load-bearing
