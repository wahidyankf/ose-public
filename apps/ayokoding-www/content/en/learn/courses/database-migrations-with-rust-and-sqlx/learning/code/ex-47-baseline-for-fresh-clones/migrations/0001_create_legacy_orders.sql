-- 0001: idempotent so fresh clones build it. -- => IF NOT EXISTS creates what is missing
CREATE TABLE IF NOT EXISTS legacy_orders ( -- => creates the table on empty bases
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    total INTEGER NOT NULL -- => totals store as integer minor units
); -- => the definition closes here
