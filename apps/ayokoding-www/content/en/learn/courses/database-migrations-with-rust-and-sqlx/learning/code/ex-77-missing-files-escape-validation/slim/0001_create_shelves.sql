-- 0001: shelves anchor the stock. -- => applies once, skips on re-runs
CREATE TABLE shelves ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    label TEXT NOT NULL -- => every shelf must be labeled
); -- => the definition closes here
