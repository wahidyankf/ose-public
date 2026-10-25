-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-pi
-- => the first rewritten changeset creates the pi table
CREATE TABLE pi (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => pi names are required from the first migration
);

-- rollback DROP TABLE pi;
-- => dropping the table reverses exactly what this changeset built
-- changeset course:002-make-rho
-- => the second rewritten changeset creates the rho table
CREATE TABLE rho (
  id SERIAL PRIMARY KEY,
  -- => rhos get their own independent sequence of ids
  name VARCHAR(60) NOT NULL
  -- => rho names are required from the first migration
);

-- rollback DROP TABLE rho;
-- => each changeset carries its own reverse, independent of its neighbours
