-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset kata:001-make-shelves
-- => the shelf changeset creates the shelves table the kata keeps
CREATE TABLE shelves (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this kata
  label VARCHAR(60) NOT NULL
  -- => shelf labels are required from the first migration
);

-- rollback DROP TABLE shelves;
-- => this reverse never runs here; only the column addition rolls back

-- changeset kata:002-add-stock
-- => the stock changeset adds the column the kata rolls back
ALTER TABLE shelves ADD COLUMN stock INTEGER;

-- rollback ALTER TABLE shelves DROP COLUMN stock;
-- => dropping the column reverses exactly what this changeset added
