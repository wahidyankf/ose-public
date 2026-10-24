-- V001 creates shipments starting in pending status.
-- The up migration in V002 flips them all to shipped at once.
-- U002 flips them back: data rollbacks restore values, not structures.
CREATE TABLE ex22_shipments (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for shipments
  status VARCHAR(20) NOT NULL
  -- => pending first, shipped after V002, pending again after U002
);

-- => two pending rows give the flip and its reversal something to move
INSERT INTO
  ex22_shipments (status)
VALUES
  ('pending'),
  ('pending');

-- => both rows start pending in the same transaction as the create
