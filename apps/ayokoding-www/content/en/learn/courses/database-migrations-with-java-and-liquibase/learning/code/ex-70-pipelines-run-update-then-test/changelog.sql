-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-gauges
-- => the table changeset creates gauges with no rows yet
CREATE TABLE gauges (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  code VARCHAR(20) NOT NULL
  -- => gauge codes are required from the first migration
);

-- rollback DROP TABLE gauges;
-- => dropping the table reverses the seed the pipeline tests below
-- changeset course:002-seed-gauges
-- => the seed changeset inserts exactly the two rows the test demands
INSERT INTO
  gauges (code)
VALUES
  ('G-1'),
  ('G-2');

-- => two seeded rows: the pipeline test fails the build on any other count
-- rollback DELETE FROM gauges;
-- => the declared delete un-seeds without dropping the tested table
