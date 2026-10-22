-- 0008: index before any traffic cutover. -- => the query path, ready
CREATE INDEX orders_customer_idx -- => plain build inside the transaction
    ON orders (customer_id); -- => customer order lookups stay fast
