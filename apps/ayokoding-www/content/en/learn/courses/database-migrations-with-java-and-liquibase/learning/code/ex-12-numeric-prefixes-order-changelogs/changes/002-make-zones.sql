-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => The 002 prefix makes this file sort second under includeAll.
-- changeset course:002-make-zones
-- => the second file in prefix order creates the zones table
CREATE TABLE zones (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => zone names are required from the first migration
);

-- rollback DROP TABLE zones;
-- => dropping the table reverses exactly what this changeset built
