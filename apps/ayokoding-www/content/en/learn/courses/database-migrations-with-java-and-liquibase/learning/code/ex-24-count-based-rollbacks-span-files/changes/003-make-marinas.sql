-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => The 003 prefix makes this file sort third under includeAll.
-- changeset course:003-make-marinas
-- => the newest changeset creates the marinas table
-- => rolling back two reverses this changeset first
CREATE TABLE marinas (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => marina names are required from the first migration
);

-- rollback DROP TABLE marinas;
-- => the rollback runs this line first, then the 002 reverse
