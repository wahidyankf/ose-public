-- V001 creates the archive table beside live orders: release one.
-- New tables never disturb running code: they add storage, not obligations.
CREATE TABLE ex40_orders (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for orders
  placed_on DATE NOT NULL,
  -- => the date the archive cutoff compares against
  archived BOOLEAN NOT NULL DEFAULT false
  -- => false until the archive release moves old rows across
);

-- => one old and one fresh order bracket the archive cutoff below
INSERT INTO
  ex40_orders (placed_on)
VALUES
  (CURRENT_DATE - 400),
  (CURRENT_DATE);

-- => the old row archives in V002, the fresh row stays live
