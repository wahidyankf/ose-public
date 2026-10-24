-- 0001: tickets anchor support work. -- => applies once, skips on re-runs
CREATE TABLE tickets ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    subject TEXT NOT NULL -- => every ticket must be titled
); -- => the definition closes here
