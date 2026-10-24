-- V001 creates authors: the referenced side of the relationship.
-- Referenced tables always migrate first, the database enforces it.
-- The foreign key in V002 names this table, so this file must run first.
CREATE TABLE ex08_authors (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for authors
  pen_name VARCHAR(100) NOT NULL
  -- => the display name readers see on the book page
);
