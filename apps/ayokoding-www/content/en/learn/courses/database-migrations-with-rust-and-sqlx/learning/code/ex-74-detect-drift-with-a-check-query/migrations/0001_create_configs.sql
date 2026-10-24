-- 0001: configs track two columns. -- => the expectation the check enforces
CREATE TABLE configs ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL -- => every config must be named
); -- => the definition closes here
