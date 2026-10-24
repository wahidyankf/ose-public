-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => 003 closes the merged sequence back on team-a.
-- changeset team-a:team-a-003-make-sails
-- => the first branch resumes after the interleaved rival file
CREATE TABLE sails (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => sail names are required from the first migration
);

-- rollback DROP TABLE sails;
-- => each branch file carries its own reverse, as before the merge
