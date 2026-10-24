-- V003 indexes the foreign key V002 introduced.
-- An index migration is still a migration: versioned, ordered, recorded.
-- It runs last because it assumes the orders table already exists.
CREATE INDEX ex02_orders_customer_idx ON ex02_orders (customer_id);

-- => the index speeds joins from orders back to their customer
