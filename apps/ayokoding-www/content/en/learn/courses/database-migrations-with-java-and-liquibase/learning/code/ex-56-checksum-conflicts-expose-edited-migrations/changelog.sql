-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-buoys
-- => the first merged changeset creates the buoys table
-- => its checksum stays honest, proving validation names the edited one
CREATE TABLE buoys (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => buoy names are required from the first migration
);

-- rollback DROP TABLE buoys;
-- => dropping the table reverses exactly what this changeset built
-- changeset course:002-make-beacons
-- => the second merged changeset creates the beacons table
-- => the rival branch edits this changeset after merging: the tamper below
-- => stands in for that edit by rewriting its stored checksum directly
CREATE TABLE beacons (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => beacon names are required from the first migration
);

-- rollback DROP TABLE beacons;
-- => each changeset carries its own reverse, independent of its neighbours
