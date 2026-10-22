-- V4: index the new column before cutover.
CREATE INDEX idx_orders_code_new ON orders (code_new);
