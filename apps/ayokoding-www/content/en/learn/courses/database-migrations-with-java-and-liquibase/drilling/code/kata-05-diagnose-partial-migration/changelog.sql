-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset kata:001-make-barometers
-- => the good changeset commits first and anchors the failure boundary
CREATE TABLE barometers (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this kata
  name VARCHAR(60) NOT NULL
  -- => the committed table the forensics below start reading from
);

-- rollback DROP TABLE barometers;
-- => this reverse never runs here; forensics read, they do not roll back
-- changeset kata:002-bad-insert
-- => the failing changeset inserts into a table that does not exist
-- => its absence from the history is the boundary the kata reports
INSERT INTO
  missing_table (name)
VALUES
  ('ghost');

-- rollback DELETE FROM missing_table WHERE name = 'ghost';
-- => this reverse never runs: the failed changeset recorded nothing
