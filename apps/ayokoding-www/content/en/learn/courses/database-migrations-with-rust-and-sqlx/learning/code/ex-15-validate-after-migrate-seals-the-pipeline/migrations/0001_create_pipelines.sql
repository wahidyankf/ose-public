-- 0001: pipelines track deploy work. -- => the first sealed file
CREATE TABLE pipelines ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL -- => every pipeline must be named
); -- => the definition closes here
