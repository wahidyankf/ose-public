-- V002 creates temps: rolled back by U002 later in this example.
-- Up and down are written together, while intent is still fresh.
-- The down file drops exactly this table and nothing else.
CREATE TABLE ex18_temps (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for temps
  name VARCHAR(100) NOT NULL
  -- => the temp name shown until the rollback removes the table
);
