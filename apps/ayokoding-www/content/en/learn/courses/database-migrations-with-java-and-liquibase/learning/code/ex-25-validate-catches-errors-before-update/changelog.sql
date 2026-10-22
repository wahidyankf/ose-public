-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-beacons
-- => the first changeset creates the beacons table
-- => the next block repeats this exact identity on purpose
CREATE TABLE beacons (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => beacon names are required from the first migration
);

-- rollback DROP TABLE beacons;
-- => this reverse never runs: validation refuses before any update

-- changeset course:001-make-beacons
-- => DELIBERATE BREAK: the same author and id as the changeset above
-- => two identities collide, so validation must refuse the whole changelog
CREATE TABLE beacon_dup (
  id SERIAL PRIMARY KEY
  -- => this table never exists: the refusal fires before anything runs
);

-- rollback DROP TABLE beacon_dup;
-- => this reverse never runs either; nothing in this file ever runs
