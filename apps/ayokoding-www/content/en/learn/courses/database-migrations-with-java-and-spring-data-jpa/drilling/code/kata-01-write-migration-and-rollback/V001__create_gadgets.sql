-- V001 creates gadgets: rolled back and recreated in one solution.
-- The ledger row goes with the table in both directions.
CREATE TABLE kata01_gadgets (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for gadgets
  name VARCHAR(100) NOT NULL
  -- => the gadget name recreated on the forward pass
);
