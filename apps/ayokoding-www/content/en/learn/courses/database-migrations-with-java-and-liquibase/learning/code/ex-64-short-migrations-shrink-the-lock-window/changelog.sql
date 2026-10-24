-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-kiosks
-- => one short changeset: a single quick table, the whole migration
-- => short holds serialize runners for heartbeats, not for coffee breaks
CREATE TABLE kiosks (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => kiosk names are required from the first migration
);

-- rollback DROP TABLE kiosks;
-- => this reverse never runs here; the example measures holds, not data
