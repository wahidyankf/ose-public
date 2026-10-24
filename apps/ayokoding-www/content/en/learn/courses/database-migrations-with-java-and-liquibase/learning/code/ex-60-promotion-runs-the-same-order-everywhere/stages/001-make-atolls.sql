-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => The 001 prefix makes this file promote first on every stage.
-- changeset course:001-make-atolls
-- => the first promoted changeset creates the atolls table
CREATE TABLE atolls (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => atoll names are required from the first migration
);

-- rollback DROP TABLE atolls;
-- => this reverse never runs here; stages promote forward only
