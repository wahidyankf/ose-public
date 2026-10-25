-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-shelves
-- => the schema changeset creates the shelves table with no rows yet
-- => it must run first: the backfill below has nowhere to land otherwise
CREATE TABLE shelves (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  code VARCHAR(20) NOT NULL
  -- => shelf codes are required from the first migration
);

-- rollback DROP TABLE shelves;
-- => dropping the table reverses the schema and orphans the backfill
-- changeset course:002-stock-shelves
-- => the data changeset stocks exactly two rows into the prepared table
-- => running second is load-bearing: the table must exist by now
INSERT INTO
  shelves (code)
VALUES
  ('S-1'),
  ('S-2');

-- rollback DELETE FROM shelves;
-- => the declared delete un-stocks without dropping the prepared schema
