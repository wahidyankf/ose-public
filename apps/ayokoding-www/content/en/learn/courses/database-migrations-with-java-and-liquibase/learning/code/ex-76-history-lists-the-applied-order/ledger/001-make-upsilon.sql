-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => The 001 prefix makes this file audit first under includeAll.
-- changeset course:001-make-upsilon
-- => the first audited changeset creates the upsilon table
CREATE TABLE upsilon (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => upsilon names are required from the first migration
);

-- rollback DROP TABLE upsilon;
-- => this reverse never runs here; audits list, they do not roll back
