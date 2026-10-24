-- V002 creates orders referencing the customers V001 already made.
-- Ordering matters: this file fails if it ever runs before V001.
-- The runner sorts file names, so dependency order holds on every run.
CREATE TABLE ex02_orders (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for orders
  customer_id INTEGER NOT NULL REFERENCES ex02_customers (id),
  -- => the foreign key assumes ex02_customers exists: V001 first, always
  total_cents INTEGER NOT NULL
  -- => money stays in integer cents, never floating point
);
