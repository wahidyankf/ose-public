-- 0002: managed work above the floor. -- => the version validation checks
CREATE INDEX legacy_orders_total_idx -- => the first managed change
    ON legacy_orders (total); -- => totals gain a query path
