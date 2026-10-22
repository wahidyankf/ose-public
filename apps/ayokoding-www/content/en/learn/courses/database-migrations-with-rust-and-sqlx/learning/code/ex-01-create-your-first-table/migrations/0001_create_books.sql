-- 0001: the first schema change; one file, one table. -- => the header names the migration under test
CREATE TABLE books ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    title TEXT NOT NULL -- => every book must name itself
); -- => the definition closes here
