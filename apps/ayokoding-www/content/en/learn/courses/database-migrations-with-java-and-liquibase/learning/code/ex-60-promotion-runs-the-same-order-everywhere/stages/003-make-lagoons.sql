-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => The 003 prefix makes this file promote third on every stage.
-- changeset course:003-make-lagoons
-- => the third promoted changeset creates the lagoons table
CREATE TABLE lagoons (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => lagoon names are required from the first migration
);

-- rollback DROP TABLE lagoons;
-- => this reverse never runs here; stages promote forward only
