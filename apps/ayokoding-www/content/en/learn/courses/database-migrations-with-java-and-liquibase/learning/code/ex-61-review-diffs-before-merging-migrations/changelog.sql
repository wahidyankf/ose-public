-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-deltas
-- => the first reviewed changeset creates the deltas table
-- => the preview below renders this CREATE without executing it
CREATE TABLE deltas (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => delta names are required from the first migration
);

-- rollback DROP TABLE deltas;
-- => this reverse never runs here; previews execute nothing at all
-- changeset course:002-make-epsilons
-- => the second reviewed changeset creates the epsilons table
-- => the preview counts this CREATE alongside the first one
CREATE TABLE epsilons (
  id SERIAL PRIMARY KEY,
  -- => epsilons get their own independent sequence of ids
  name VARCHAR(60) NOT NULL
  -- => epsilon names are required from the first migration
);

-- rollback DROP TABLE epsilons;
-- => this reverse never runs here either; nothing in this file ever runs
