-- 0003: gamma ships early, leaving a gap. -- => applies once, skips on re-runs
CREATE TABLE gamma ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    code TEXT NOT NULL -- => every gamma row carries a code
); -- => the definition closes here
