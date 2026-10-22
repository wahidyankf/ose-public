-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => The 002 prefix makes this file promote second on every stage.
-- changeset course:002-make-reefs
-- => the second promoted changeset creates the reefs table
CREATE TABLE reefs (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => reef names are required from the first migration
);

-- rollback DROP TABLE reefs;
-- => this reverse never runs here; stages promote forward only
