-- 0001: zones hold the seed. -- => reference data lives outside versions
CREATE TABLE zones ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    code TEXT NOT NULL UNIQUE -- => conflicts resolve on the code
); -- => the definition closes here
