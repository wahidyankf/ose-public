-- V002 creates orders referencing the customers V001 already made.
CREATE TABLE cap_orders (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key for orders
  customer_id INTEGER NOT NULL REFERENCES cap_customers (id),
  -- => the foreign key assumes customers exists: V001 first, always
  amount_cents INTEGER NOT NULL,
  -- => the order amount the priority backfill reads below
  status VARCHAR(20) NOT NULL
  -- => the old name the zero-downtime rename below replaces
);
