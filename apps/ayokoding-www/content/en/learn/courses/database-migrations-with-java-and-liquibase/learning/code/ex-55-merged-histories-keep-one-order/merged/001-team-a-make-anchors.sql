-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => 001 makes this file sort first in the merged sequence.
-- changeset team-a:team-a-001-make-anchors
-- => prefixed ids name the branch inside the shared history itself
CREATE TABLE anchors (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => anchor names are required from the first migration
);

-- rollback DROP TABLE anchors;
-- => each branch file carries its own reverse, as before the merge
