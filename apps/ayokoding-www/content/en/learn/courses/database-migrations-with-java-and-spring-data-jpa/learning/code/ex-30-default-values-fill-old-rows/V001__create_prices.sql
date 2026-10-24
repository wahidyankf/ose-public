-- V001 creates prices without any currency: every row predates the concept.
-- Old rows stand in for years of history written before currencies existed.
CREATE TABLE ex30_prices (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for prices
  amount_cents INTEGER NOT NULL
  -- => the amount every old row already carries
);

-- => two old rows predate the currency column below
INSERT INTO
  ex30_prices (amount_cents)
VALUES
  (1000),
  (2500);

-- => seeds share the migration transaction with the create above
