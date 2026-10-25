-- 0001: alpha ships in the first batch. -- => applies once, skips on re-runs
CREATE TABLE alpha ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    code TEXT NOT NULL -- => every alpha row carries a code
); -- => the definition closes here
