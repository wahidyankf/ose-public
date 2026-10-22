-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-plans
-- => the first changeset creates the plans table
-- => the status preview below names this id before anything runs
CREATE TABLE plans (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(80) NOT NULL
  -- => plan names are required from the first migration
);

-- rollback DROP TABLE plans;
-- => dropping the table reverses exactly what this changeset built

-- changeset course:002-make-plan-items
-- => the second changeset creates the plan_items table
-- => the preview counts this id alongside the first one
CREATE TABLE plan_items (
  id SERIAL PRIMARY KEY,
  -- => items get their own independent sequence of ids
  label VARCHAR(80) NOT NULL
  -- => item labels are required from the first migration
);

-- rollback DROP TABLE plan_items;
-- => each changeset carries its own reverse, independent of its neighbours
