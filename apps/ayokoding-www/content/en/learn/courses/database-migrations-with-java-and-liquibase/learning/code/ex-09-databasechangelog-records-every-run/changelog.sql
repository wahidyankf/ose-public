-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-teams
-- => the first changeset creates the teams table
-- => Liquibase stores (course, 001-make-teams, changelog.sql) on success
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(80) NOT NULL
  -- => team names are required from the first migration
);

-- rollback DROP TABLE teams;
-- => dropping the table reverses exactly what this changeset built
-- changeset course:002-make-projects
-- => the second changeset creates the projects table
-- => its history row carries orderexecuted 2, proving file order ran
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  -- => projects get their own independent sequence of ids
  title VARCHAR(120) NOT NULL
  -- => project titles are required from the first migration
);

-- rollback DROP TABLE projects;
-- => each changeset carries its own reverse, independent of its neighbours
