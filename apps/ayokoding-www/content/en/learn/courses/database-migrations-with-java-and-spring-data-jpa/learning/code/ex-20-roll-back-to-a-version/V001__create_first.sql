-- V001 creates first: the known-good version this example rewinds to.
-- The target version stays applied with its ledger row intact.
CREATE TABLE ex20_first (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  name VARCHAR(100) NOT NULL
  -- => the first name the rewind preserves
);
