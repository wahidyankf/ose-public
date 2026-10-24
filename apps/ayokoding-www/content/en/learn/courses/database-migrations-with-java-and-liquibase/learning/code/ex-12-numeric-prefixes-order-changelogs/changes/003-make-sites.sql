-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => The 003 prefix makes this file sort third under includeAll.
-- changeset course:003-make-sites
-- => the third file in prefix order creates the sites table
CREATE TABLE sites (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => site names are required from the first migration
);

-- rollback DROP TABLE sites;
-- => dropping the table reverses exactly what this changeset built
