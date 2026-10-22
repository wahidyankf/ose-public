-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset kata:001-make-meters
-- => the first rewritten changeset creates the meters table
CREATE TABLE meters (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this kata
  name VARCHAR(60) NOT NULL
  -- => meter names are required from the first migration
);

-- rollback DROP TABLE meters;
-- => dropping the table reverses exactly what this changeset built

-- changeset kata:002-make-dials
-- => the second rewritten changeset creates the dials table
CREATE TABLE dials (
  id SERIAL PRIMARY KEY,
  -- => dials get their own independent sequence of ids
  name VARCHAR(60) NOT NULL
  -- => dial names are required from the first migration
);

-- rollback DROP TABLE dials;
-- => each changeset carries its own reverse, independent of its neighbours
