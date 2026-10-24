-- V001 creates the repair table with the partial footprint already inside.
-- One row stands in for what the failed run managed before stopping.
CREATE TABLE kata05_repairs (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  name VARCHAR(100) NOT NULL UNIQUE
  -- => UNIQUE names the tripwire the original partial hit
);

-- => one row: the partial footprint the repair below completes
INSERT INTO
  kata05_repairs (name)
VALUES
  ('keeper');

-- => the kept row is what the diagnosis finds and the repair builds on
