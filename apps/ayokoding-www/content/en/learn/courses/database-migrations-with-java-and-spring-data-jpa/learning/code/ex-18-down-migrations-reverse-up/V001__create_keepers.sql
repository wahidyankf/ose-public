-- V001 creates keepers: the table that survives the rollback below.
-- Only V002 gets rolled back, so this table must still stand after.
-- Its ledger row stays while V002's row is deleted by the rollback.
CREATE TABLE ex18_keepers (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for keepers
  name VARCHAR(100) NOT NULL
  -- => the keeper name the roster shows
);
