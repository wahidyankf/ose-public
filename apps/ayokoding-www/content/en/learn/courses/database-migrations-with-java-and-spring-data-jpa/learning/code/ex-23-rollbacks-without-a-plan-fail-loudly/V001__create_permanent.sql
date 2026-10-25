-- V001 creates a table with deliberately no down file.
-- Some changes cannot be reversed safely, and the course says so here.
-- Attempting rollback must fail loudly instead of guessing a reversal.
CREATE TABLE ex23_permanent (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  name VARCHAR(100) NOT NULL
  -- => the name that stays because no safe reverse exists
);
