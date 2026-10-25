-- V001 creates orders with a guarded quantity column.
-- The CHECK constraint turns a business rule into a schema fact.
-- Every environment from this version on enforces the same rule.
CREATE TABLE ex06_orders (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for orders
  quantity INTEGER NOT NULL CHECK (quantity >= 0)
  -- => quantities cannot go negative: the database refuses, not the app
);
