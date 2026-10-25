-- 0001: tickets start with numeric priority. -- => codes the backfill translates
CREATE TABLE tickets ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    priority INTEGER NOT NULL, -- => 1, 2, 3 mean low, medium, high
    label TEXT -- => NULL until the mapping fills it
); -- => the definition closes here
