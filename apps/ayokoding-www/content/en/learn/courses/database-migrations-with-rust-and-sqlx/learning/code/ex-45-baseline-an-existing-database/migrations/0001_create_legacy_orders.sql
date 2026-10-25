-- 0001: idempotent so legacy bases adopt it. -- => IF NOT EXISTS tolerates the legacy table
CREATE TABLE IF NOT EXISTS legacy_orders ( -- => succeeds whether the table exists or not
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    total INTEGER NOT NULL -- => totals store as integer minor units
); -- => the definition closes here
