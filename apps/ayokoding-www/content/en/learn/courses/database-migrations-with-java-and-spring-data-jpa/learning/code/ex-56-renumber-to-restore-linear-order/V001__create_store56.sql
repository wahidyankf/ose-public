-- V001 creates the store both developers built upon.
CREATE TABLE ex56_store (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key
  name VARCHAR(100) NOT NULL
  -- => the store name both branches assumed present
);
