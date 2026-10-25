-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-wrapped-pair
-- => one changeset, two statements, one transaction around both
-- => the insert targets a table that does not exist, failing by design
CREATE TABLE zeta (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => the create succeeds, then the insert below fails beside it
);

INSERT INTO
  missing_table (name)
VALUES
  ('ghost');

-- => the insert cannot succeed: no such table exists anywhere here
-- => the transaction undoes the create above together with this failure
-- rollback DROP TABLE zeta;
-- => this reverse never runs: the failed changeset recorded nothing
