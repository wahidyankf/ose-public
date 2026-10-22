-- no-transaction
-- 0002: concurrent builds skip the transaction. -- => CONCURRENTLY forbids the wrapping tx
CREATE INDEX CONCURRENTLY shipments_tracking_idx -- => builds without blocking writers
    ON shipments (tracking); -- => the new column readers will query
