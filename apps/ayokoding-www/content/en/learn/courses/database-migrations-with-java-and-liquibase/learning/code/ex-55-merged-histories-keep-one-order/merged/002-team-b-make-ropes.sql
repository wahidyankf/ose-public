-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => 002 interleaves the rival branch between team-a's two files.
-- changeset team-b:team-b-002-make-ropes
-- => the rival branch lands mid-sequence without breaking the line
CREATE TABLE ropes (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => rope names are required from the first migration
);

-- rollback DROP TABLE ropes;
-- => each branch file carries its own reverse, as before the merge
