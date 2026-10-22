-- 0001: quotes open the sales schema. -- => applies once, skips on re-runs
CREATE TABLE quotes ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    total INTEGER NOT NULL -- => totals store as integer minor units
); -- => the definition closes here
