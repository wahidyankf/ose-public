-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => The 001 prefix makes this file sort first under includeAll.
-- changeset course:001-make-regions
-- => the first file in prefix order creates the regions table
CREATE TABLE regions (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => region names are required from the first migration
);

-- rollback DROP TABLE regions;
-- => dropping the table reverses exactly what this changeset built
