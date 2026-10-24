-- V001 creates customers: every later file in this example builds on it.
-- Numeric prefixes make discovery order explicit: 001 always runs first.
-- The foreign key in V002 assumes this table already exists.
CREATE TABLE ex02_customers (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for customers
  name VARCHAR(100) NOT NULL
  -- => every customer needs a name from the first row on
);
