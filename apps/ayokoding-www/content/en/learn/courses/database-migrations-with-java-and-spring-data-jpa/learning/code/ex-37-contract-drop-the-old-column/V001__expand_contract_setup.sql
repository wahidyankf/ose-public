-- V001 sets up the contracted world: both shapes with agreeing values.
-- Setup mirrors a finished migrate phase: every row carries both readings.
CREATE TABLE ex37_orders (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for orders
  paid BOOLEAN NOT NULL,
  -- => the old flag this example finally drops
  status VARCHAR(20) NOT NULL
  -- => the new vocabulary every row already speaks
);

-- => one row with agreeing shapes stands in for a finished migration
INSERT INTO
  ex37_orders (paid, status)
VALUES
  (true, 'paid');

-- => seeds share the migration transaction with the create above
