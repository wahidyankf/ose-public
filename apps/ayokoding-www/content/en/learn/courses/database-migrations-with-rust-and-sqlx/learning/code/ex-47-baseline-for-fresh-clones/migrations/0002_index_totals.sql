-- 0002: managed work above the floor. -- => identical on fresh and legacy bases
CREATE INDEX legacy_orders_total_idx -- => the first managed change
    ON legacy_orders (total); -- => totals gain a query path
