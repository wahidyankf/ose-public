-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-silos
-- => one changeset: the whole migration under a single lock hold
-- => the lock table serializes this run against every concurrent runner
CREATE TABLE silos (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => silo names are required from the first migration
);

-- rollback DROP TABLE silos;
-- => this reverse never runs here; the example inspects locks, not data
