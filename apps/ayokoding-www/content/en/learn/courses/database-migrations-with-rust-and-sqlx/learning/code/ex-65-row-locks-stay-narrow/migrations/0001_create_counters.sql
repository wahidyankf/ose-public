-- 0001: counters start at zero. -- => the rows the narrow update selects among
CREATE TABLE counters ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    value INTEGER NOT NULL DEFAULT 0 -- => every counter starts at zero
); -- => the definition closes here
