-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => The 002 prefix makes this file sort second under includeAll.
-- changeset course:002-make-piers
-- => the second old file creates the piers table
CREATE TABLE piers (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => pier names are required from the first migration
);

-- rollback DROP TABLE piers;
-- => this reverse never runs here; the squash retires these files instead
