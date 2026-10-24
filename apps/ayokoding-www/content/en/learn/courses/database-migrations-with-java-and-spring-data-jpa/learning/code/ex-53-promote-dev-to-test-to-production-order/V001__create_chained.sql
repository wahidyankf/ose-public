-- V001 creates the chained table promoted through all three stages.
CREATE TABLE chained_things (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  name VARCHAR(100) NOT NULL
  -- => the chained name certified stage by stage
);
