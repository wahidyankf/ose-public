-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => The 002 prefix makes this file sort second under includeAll.
-- changeset course:002-make-docks
-- => the middle changeset creates the docks table
-- => rolling back two reverses this changeset second
CREATE TABLE docks (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => dock names are required from the first migration
);

-- rollback DROP TABLE docks;
-- => the rollback runs this line after removing the 003 table
