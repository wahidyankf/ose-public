-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-eta
-- => the good changeset commits first and survives whatever follows
CREATE TABLE eta (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => the committed table recovery resumes from, never rebuilds
);

-- rollback DROP TABLE eta;
-- => this reverse never runs here; the failure below stops first
-- changeset course:002-impossible-insert
-- => the failing changeset inserts into a table that does not exist
-- => its failure commits nothing, and uncommits nothing before it either
INSERT INTO
  missing_table (name)
VALUES
  ('ghost');

-- rollback DELETE FROM missing_table WHERE name = 'ghost';
-- => this reverse never runs: the failed changeset recorded nothing
