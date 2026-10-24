-- 0001: idempotent so legacy bases adopt it. -- => the tolerant first version
CREATE TABLE IF NOT EXISTS legacy_stock ( -- => succeeds whether the table exists or not
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    sku TEXT NOT NULL -- => seeded skus stay exactly as seeded
); -- => the definition closes here
