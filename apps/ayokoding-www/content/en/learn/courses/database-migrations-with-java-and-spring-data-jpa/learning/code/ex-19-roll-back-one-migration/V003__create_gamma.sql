-- V003 creates gamma: the tip this example rolls back.
-- Only the tip unwinds, middle layers stay exactly where they are.
CREATE TABLE ex19_gamma (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  name VARCHAR(100) NOT NULL
  -- => the gamma name removed by U003 below
);
