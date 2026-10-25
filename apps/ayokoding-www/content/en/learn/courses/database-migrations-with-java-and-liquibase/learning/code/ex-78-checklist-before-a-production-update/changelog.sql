-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-alpha
-- => the first release changeset creates the alpha table
-- => the checklist below verifies this table exists before production
CREATE TABLE alpha (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => alpha names are required from the first migration
);

-- rollback DROP TABLE alpha;
-- => this reverse never runs here; cleared releases ship, they do not roll back
-- changeset course:002-make-beta
-- => the second release changeset creates the beta table
-- => the checklist verifies this table alongside the first one
CREATE TABLE beta (
  id SERIAL PRIMARY KEY,
  -- => betas get their own independent sequence of ids
  name VARCHAR(60) NOT NULL
  -- => beta names are required from the first migration
);

-- rollback DROP TABLE beta;
-- => this reverse never runs here either; the release ships as reviewed
