-- V003 seeds two customers with three orders between them.
-- Seed data shares the migration transaction with nothing: it is the payload.
INSERT INTO
  cap_customers (name)
VALUES
  ('acme'),
  ('globex');

-- => two customers stand in for the shop both later phases serve
INSERT INTO
  cap_orders (customer_id, amount_cents, status)
VALUES
  (1, 9000, 'paid'),
  (1, 4000, 'open'),
  (2, 15000, 'paid');

-- => three orders bracket the priority threshold the backfill applies
