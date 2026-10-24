-- V001 creates the strict table the failing migration below fills halfway.
CREATE TABLE ex71_strict (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  name VARCHAR(100) NOT NULL UNIQUE
  -- => UNIQUE is the tripwire the second insert below will hit
);
