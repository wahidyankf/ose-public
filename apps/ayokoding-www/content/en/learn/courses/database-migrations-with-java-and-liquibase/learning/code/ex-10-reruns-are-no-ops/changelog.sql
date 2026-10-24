-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-lanes
-- => the first changeset creates the lanes table
-- => its history row makes the second update skip it entirely
CREATE TABLE lanes (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  code VARCHAR(20) NOT NULL
  -- => lane codes are required from the first migration
);

-- rollback DROP TABLE lanes;
-- => dropping the table reverses exactly what this changeset built

-- changeset course:002-make-shipments
-- => the second changeset creates the shipments table
-- => it is skipped on every later update for the same reason
CREATE TABLE shipments (
  id SERIAL PRIMARY KEY,
  -- => shipments get their own independent sequence of ids
  reference VARCHAR(40) NOT NULL
  -- => shipment references are required from the first migration
);

-- rollback DROP TABLE shipments;
-- => each changeset carries its own reverse, independent of its neighbours
