-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-seed-events
-- => the seed changeset creates events with one row worth indexing
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  code VARCHAR(20) NOT NULL
  -- => the code column the concurrent index below will serve
);

INSERT INTO
  events (code)
VALUES
  ('E-1');

-- => one seeded row the indexed lookup below must find
-- rollback DROP TABLE events;
-- => dropping the table reverses the seed and the index together
-- changeset course:002-index-concurrent runInTransaction:false
-- => CONCURRENTLY refuses transactions, so this changeset opts out of the
-- => wrapper: runInTransaction false lets the build commit in its own steps
CREATE INDEX CONCURRENTLY ix_events_code ON events (code);

-- => the concurrent build takes no write lock; writers proceed throughout
-- rollback DROP INDEX ix_events_code;
-- => plain DROP INDEX reverses the concurrent build symmetrically
