-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-iota
-- => the first timed changeset creates the iota table
CREATE TABLE iota (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => iota names are required from the first migration
);

-- rollback DROP TABLE iota;
-- => dropping the table reverses exactly what this changeset built
-- changeset course:002-make-kappa
-- => the second timed changeset creates the kappa table
CREATE TABLE kappa (
  id SERIAL PRIMARY KEY,
  -- => kappas get their own independent sequence of ids
  name VARCHAR(60) NOT NULL
  -- => kappa names are required from the first migration
);

-- rollback DROP TABLE kappa;
-- => each changeset carries its own reverse, independent of its neighbours
-- changeset course:003-make-lambda
-- => the third timed changeset creates the lambda table
CREATE TABLE lambda (
  id SERIAL PRIMARY KEY,
  -- => lambdas get their own independent sequence of ids
  name VARCHAR(60) NOT NULL
  -- => lambda names are required from the first migration
);

-- rollback DROP TABLE lambda;
-- => the last timed step reverses first when the release rolls back
