-- liquibase formatted sql
-- => REQUIRED first line: marks this file as a Liquibase SQL changelog
-- => Release 2 creates the orders table with its customer foreign key.
-- changeset course:002-create-orders
-- => orders reference customers; the key migrates beside both tables
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  -- => SERIAL gives an auto-incrementing integer key, enough for this release
  customer_id INTEGER NOT NULL REFERENCES customers (id),
  -- => the foreign key keeps every order attached to a real customer
  total_cents INTEGER NOT NULL
  -- => the seeded totals below decide each order's backfilled priority
);
INSERT INTO orders (customer_id, total_cents) SELECT id, 15000 FROM customers WHERE name = 'budi';
-- => lookups by name never hardcode generated ids, on any environment
INSERT INTO orders (customer_id, total_cents) SELECT id, 5000 FROM customers WHERE name = 'sari';
-- => two seeded orders: one high value, one regular

-- rollback DROP TABLE orders;
-- => this reverse never runs here; the capstone ships forward only
