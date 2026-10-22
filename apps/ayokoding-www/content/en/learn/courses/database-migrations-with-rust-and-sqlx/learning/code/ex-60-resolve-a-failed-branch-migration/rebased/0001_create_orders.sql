-- 0001 main: orders start with amount. -- => applies once, skips on re-runs
CREATE TABLE orders ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    amount INTEGER NOT NULL -- => amounts store as integer minor units
); -- => the definition closes here
