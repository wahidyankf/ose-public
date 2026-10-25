-- V001 creates authors with separate first and last names.
-- The display name arrives later, derived from these two columns.
-- Splitting schema from derivation keeps each step reviewable alone.
CREATE TABLE ex27_authors (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for authors
  first_name VARCHAR(100) NOT NULL,
  -- => the given name the backfill reads from
  last_name VARCHAR(100) NOT NULL
  -- => the family name the backfill reads from
);

-- => two authors give the backfill real rows to derive from
INSERT INTO
  ex27_authors (first_name, last_name)
VALUES
  ('ada', 'lovelace'),
  ('grace', 'hopper');

-- => seeds share the migration transaction with the create above
