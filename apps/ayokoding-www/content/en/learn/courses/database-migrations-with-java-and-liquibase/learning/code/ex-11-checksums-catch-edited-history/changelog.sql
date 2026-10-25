-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-widgets
-- => the first changeset creates the widgets table
-- => its stored checksum is the one the program tampers with below
CREATE TABLE widgets (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  sku VARCHAR(30) NOT NULL
  -- => widget skus are required from the first migration
);

-- rollback DROP TABLE widgets;
-- => dropping the table reverses exactly what this changeset built
-- changeset course:002-make-gadgets
-- => the second changeset creates the gadgets table
-- => its checksum stays honest, proving validation names the edited one
CREATE TABLE gadgets (
  id SERIAL PRIMARY KEY,
  -- => gadgets get their own independent sequence of ids
  sku VARCHAR(30) NOT NULL
  -- => gadget skus are required from the first migration
);

-- rollback DROP TABLE gadgets;
-- => each changeset carries its own reverse, independent of its neighbours
