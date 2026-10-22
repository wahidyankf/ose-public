-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => The 001 prefix makes this file sort first under includeAll.
-- changeset course:001-make-quays
-- => the oldest changeset creates the quays table
-- => the count of two stops before this row, so it survives
CREATE TABLE quays (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => quay names are required from the first migration
);

-- rollback DROP TABLE quays;
-- => this reverse never runs here; the count stops at the newer files
