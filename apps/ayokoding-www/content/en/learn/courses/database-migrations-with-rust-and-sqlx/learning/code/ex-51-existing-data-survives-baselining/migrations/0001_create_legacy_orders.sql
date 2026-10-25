-- 0001: structure only, values untouched. -- => adoption never rewrites content
CREATE TABLE IF NOT EXISTS legacy_orders ( -- => succeeds whether the table exists or not
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    total INTEGER NOT NULL -- => seeded totals stay exactly as seeded
); -- => the definition closes here
