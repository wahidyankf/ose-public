-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-depots
-- => the older changeset creates the depots table
-- => the rollback below stops before this row, so it survives
CREATE TABLE depots (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => depot names are required from the first migration
);

-- rollback DROP TABLE depots;
-- => this reverse never runs here; the count stops at the newer changeset

-- changeset course:002-make-routes
-- => the newer changeset creates the routes table
-- => rolling back one reverses exactly this changeset and deletes its row
CREATE TABLE routes (
  id SERIAL PRIMARY KEY,
  -- => routes get their own independent sequence of ids
  name VARCHAR(60) NOT NULL
  -- => route names are required from the first migration
);

-- rollback DROP TABLE routes;
-- => the rollback runs this line, then removes the history row
