-- no-transaction
-- V008 builds the customer index concurrently: no write lock, traffic flows.
-- The final migration proves hot-table indexing belongs in the same workflow.
CREATE INDEX CONCURRENTLY cap_orders_customer_idx ON cap_orders (customer_id);

-- => the index serves per-customer order lookups from here on
