-- V002 creates shelves: the second ledger entry in order.
-- The ledger grows one row per applied migration, never more.
-- Sorted versions always replay this same sequence.
CREATE TABLE ex09_shelves (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for shelves
  label VARCHAR(50) NOT NULL
  -- => the shelf label readers browse by
);
