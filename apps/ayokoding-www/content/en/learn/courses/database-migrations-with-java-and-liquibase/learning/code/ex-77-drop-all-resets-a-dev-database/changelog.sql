-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Without it Liquibase runs the SQL untracked, and nothing is recorded.
-- changeset course:001-make-psi
-- => the first experiment changeset creates the psi table
-- => the reset below removes it without reading any rollback block
CREATE TABLE psi (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this course
  name VARCHAR(60) NOT NULL
  -- => psi names are required from the first migration
);

-- rollback DROP TABLE psi;
-- => resets ignore rollback blocks: removal needs no declared reverse

-- changeset course:002-make-omega
-- => the second experiment changeset creates the omega table
-- => tracked or not, every object goes when the reset runs
CREATE TABLE omega (
  id SERIAL PRIMARY KEY,
  -- => omegas get their own independent sequence of ids
  name VARCHAR(60) NOT NULL
  -- => omega names are required from the first migration
);

-- rollback DROP TABLE omega;
-- => the reset removes this table exactly like every other object
