-- 0003: the lookup table arrives empty. -- => derivation fills it next
CREATE TABLE kinds ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    kind TEXT NOT NULL UNIQUE -- => one row per distinct value
); -- => the definition closes here
