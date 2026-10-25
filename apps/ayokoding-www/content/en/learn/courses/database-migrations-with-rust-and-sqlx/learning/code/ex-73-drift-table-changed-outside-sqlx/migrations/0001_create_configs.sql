-- 0001: configs start lean. -- => two columns under version control
CREATE TABLE configs ( -- => the migrator runs this file once, in version order
    id SERIAL PRIMARY KEY, -- => surrogate key: the row identity never changes
    name TEXT NOT NULL -- => every config must be named
); -- => the definition closes here
