-- 0002: managed work above the floor. -- => ordinary migration on the adopted base
CREATE INDEX legacy_orders_total_idx -- => the first managed change
    ON legacy_orders (total); -- => totals gain a query path
