-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-bins
-- => the table changeset creates the bins table with no rows yet
-- => the seed below is a separate changeset with its own reverse
CREATE TABLE bins (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  code VARCHAR(20) NOT NULL
  -- => bin codes are required from the first migration
);

-- rollback DROP TABLE bins;
-- => this reverse never runs here; only the seed is rolled back

-- changeset course:002-seed-bins
-- => the seed changeset inserts exactly two rows into the bins table
-- => data changes deserve reverses as much as schema changes do
INSERT INTO bins (code) VALUES ('A-1'), ('A-2');

-- rollback DELETE FROM bins;
-- => the declared delete removes exactly the rows this changeset added
-- => the table survives with zero rows, ready to seed again
