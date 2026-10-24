-- V001 creates line items with quantities and unit prices.
-- The totals column arrives in V002, computed from these two columns.
-- Schema first: the backfill needs this exact shape to exist.
CREATE TABLE ex28_line_items (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for line items
  quantity INTEGER NOT NULL,
  -- => the count the totals backfill multiplies
  unit_cents INTEGER NOT NULL
  -- => the price the totals backfill multiplies
);

-- => two line items give the backfill real arithmetic to perform
INSERT INTO
  ex28_line_items (quantity, unit_cents)
VALUES
  (2, 500),
  (3, 700);

-- => seeds share the migration transaction with the create above
